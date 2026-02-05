'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, arrayUnion, arrayRemove } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { UserProfile, Post } from '@/types';
import { Loader2, Users, UserCheck, MessageSquare } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PostCard from '@/components/posts/PostCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

function ProfileHeader({ profile, currentUserProfile }: { profile: UserProfile, currentUserProfile: UserProfile | null }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const isFollowing = currentUserProfile?.following?.includes(profile.id) ?? false;
    const isOwnProfile = currentUserProfile?.id === profile.id;

    const handleFollowToggle = () => {
        if (isOwnProfile || !currentUserProfile) return;

        const currentUserDocRef = doc(firestore, 'users', currentUserProfile.id);
        const targetUserDocRef = doc(firestore, 'users', profile.id);

        if (isFollowing) {
            // Unfollow
            updateDocumentNonBlocking(currentUserDocRef, { following: arrayRemove(profile.id) });
            updateDocumentNonBlocking(targetUserDocRef, { followers: arrayRemove(currentUserProfile.id) });
            toast({ description: `Dejaste de seguir a ${profile.username}.`});
        } else {
            // Follow
            updateDocumentNonBlocking(currentUserDocRef, { following: arrayUnion(profile.id) });
            updateDocumentNonBlocking(targetUserDocRef, { followers: arrayUnion(currentUserProfile.id) });
            toast({ description: `Ahora sigues a ${profile.username}.`});
        }
    };

    return (
        <div className="w-full max-w-4xl bg-card border border-border rounded-lg p-6 flex flex-col md:flex-row items-center gap-6">
            <Image
                src={profile.avatarUrl}
                alt={profile.username}
                width={128}
                height={128}
                className="rounded-full border-4 border-primary"
            />
            <div className="flex-grow text-center md:text-left">
                <h1 className="text-3xl font-bold text-white font-headline">{profile.username}</h1>
                <p className="text-slate-400">{profile.email}</p>
                <div className="flex gap-6 justify-center md:justify-start mt-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-white">{profile.followers?.length ?? 0}</p>
                        <p className="text-sm text-slate-500">Seguidores</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-white">{profile.following?.length ?? 0}</p>
                        <p className="text-sm text-slate-500">Siguiendo</p>
                    </div>
                </div>
            </div>
            {!isOwnProfile && currentUserProfile && (
                 <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={handleFollowToggle} variant={isFollowing ? 'secondary' : 'default'}>
                        {isFollowing ? <UserCheck className="mr-2"/> : <Users className="mr-2"/>}
                        {isFollowing ? 'Siguiendo' : 'Seguir'}
                    </Button>
                    <Button variant="outline" asChild>
                        <a href={`mailto:${profile.email}`}>
                            <MessageSquare className="mr-2" />
                            Enviar Mensaje
                        </a>
                    </Button>
                </div>
            )}
        </div>
    );
}

export default function ProfilePage() {
    const params = useParams();
    const userId = params.userId as string;
    const firestore = useFirestore();
    const { user: currentUser, isUserLoading: isAuthLoading } = useUser();

    const profileRef = useMemoFirebase(() => userId ? doc(firestore, 'users', userId) : null, [firestore, userId]);
    const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(profileRef);

    const currentUserProfileRef = useMemoFirebase(() => currentUser ? doc(firestore, 'users', currentUser.uid) : null, [firestore, currentUser]);
    const { data: currentUserProfile, isLoading: isCurrentUserProfileLoading } = useDoc<UserProfile>(currentUserProfileRef);

    const postsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // Fetch ALL posts to avoid a filter-based query that causes a misleading permission error
        // when the required composite index is missing. We will filter on the client.
        return query(collection(firestore, 'posts'));
    }, [firestore]);

    const { data: allPosts, isLoading: arePostsLoading } = useCollection<Post>(postsQuery);

    const isOwnProfile = currentUser?.uid === userId;

    const posts = useMemo(() => {
        if (!allPosts || !userId) return [];
        
        const profilePosts = allPosts.filter(post => post.userId === userId && post.imageUrl);

        const visiblePosts = isOwnProfile 
            ? profilePosts // Show all posts on own profile
            : profilePosts.filter(post => post.visibility === 'public'); // Show only public posts on others' profiles

        // Sort posts by creation date, newest first.
        return visiblePosts.sort((a, b) => {
                if (a.createdAt?.toMillis && b.createdAt?.toMillis) {
                    return b.createdAt.toMillis() - a.createdAt.toMillis();
                }
                return 0;
            });
    }, [allPosts, userId, isOwnProfile]);

    const isLoading = isAuthLoading || isProfileLoading || (currentUser != null && isCurrentUserProfileLoading);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    // After loading, if the viewed profile doesn't exist, show error.
    if (!profile) {
        return (
           <div className="flex items-center justify-center min-h-screen">
                <p className="text-xl text-slate-400">Este perfil no existe.</p>
           </div>
       );
   }

   // Edge case: User is logged in, loading is done, but their profile doc hasn't been created yet.
   if (currentUser && !currentUserProfile) {
       return (
           <div className="flex items-center justify-center min-h-screen">
               <Loader2 className="h-16 w-16 animate-spin text-primary" />
               <p className="ml-4 text-slate-300">Finalizando inicio de sesión...</p>
           </div>
       );
   }

    return (
        <div className="min-h-screen flex flex-col">
            <Header coinBalance={currentUserProfile?.coinBalance ?? 0}/>
            <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center gap-8">
                <ProfileHeader profile={profile} currentUserProfile={currentUserProfile} />
                <h2 className="text-2xl font-headline text-white self-start max-w-4xl w-full">Publicaciones con Imagen</h2>
                <div className="w-full max-w-2xl space-y-6">
                    {arePostsLoading ? (
                        <div className="flex justify-center items-center py-16">
                            <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
                            <p className="ml-4">Cargando publicaciones...</p>
                        </div>
                    ) : posts && posts.length > 0 ? (
                         posts.map(post => <PostCard key={post.id} post={post} currentUserProfile={currentUserProfile}/>)
                    ) : (
                        <div className="text-center py-16 bg-card border border-border rounded-lg">
                            <p className="text-slate-400">Este usuario aún no ha publicado nada con imágenes.</p>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
