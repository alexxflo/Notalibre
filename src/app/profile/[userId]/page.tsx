'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, arrayUnion, arrayRemove } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { UserProfile, Post } from '@/types';
import { Loader2, Users, UserCheck } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PostCard from '@/components/posts/PostCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

function ProfileHeader({ profile, currentUserProfile }: { profile: UserProfile, currentUserProfile: UserProfile }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const isFollowing = currentUserProfile.following?.includes(profile.id) ?? false;
    const isOwnProfile = currentUserProfile.id === profile.id;

    const handleFollowToggle = () => {
        if (isOwnProfile) return;

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
            {!isOwnProfile && (
                <Button onClick={handleFollowToggle} variant={isFollowing ? 'secondary' : 'default'}>
                    {isFollowing ? <UserCheck className="mr-2"/> : <Users className="mr-2"/>}
                    {isFollowing ? 'Siguiendo' : 'Seguir'}
                </Button>
            )}
        </div>
    );
}

export default function ProfilePage() {
    const params = useParams();
    const userId = params.userId as string;
    const firestore = useFirestore();
    const { user: currentUser } = useUser();

    const profileRef = useMemoFirebase(() => userId ? doc(firestore, 'users', userId) : null, [firestore, userId]);
    const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(profileRef);

    const currentUserProfileRef = useMemoFirebase(() => currentUser ? doc(firestore, 'users', currentUser.uid) : null, [firestore, currentUser]);
    const { data: currentUserProfile } = useDoc<UserProfile>(currentUserProfileRef);

    const postsQuery = useMemoFirebase(() => {
        if (!firestore || !userId) return null;
        return query(collection(firestore, 'posts'), where('userId', '==', userId), where('imageUrl', '!=', null));
    }, [firestore, userId]);

    const { data: posts, isLoading: arePostsLoading } = useCollection<Post>(postsQuery);

    if (isProfileLoading || !profile || !currentUserProfile) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="min-h-screen flex flex-col">
            <Header coinBalance={currentUserProfile?.coinBalance ?? 0}/>
            <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center gap-8">
                <ProfileHeader profile={profile} currentUserProfile={currentUserProfile} />
                <h2 className="text-2xl font-headline text-white self-start max-w-4xl w-full">Publicaciones</h2>
                <div className="w-full max-w-2xl space-y-6">
                    {arePostsLoading ? (
                        <p>Cargando publicaciones...</p>
                    ) : posts && posts.length > 0 ? (
                         posts.map(post => <PostCard key={post.id} post={post} currentUserProfile={currentUserProfile}/>)
                    ) : (
                        <div className="text-center py-16 bg-card border border-border rounded-lg">
                            <p className="text-slate-400">Este usuario aún no ha publicado nada.</p>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
