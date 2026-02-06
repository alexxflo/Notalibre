'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { UserProfile, Post } from '@/types';
import { Loader2, Users, UserCheck, MessageSquare, Camera } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PostCard from '@/components/posts/PostCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function ProfileHeader({ profile, currentUserProfile }: { profile: UserProfile, currentUserProfile: UserProfile | null }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    const isOwnProfile = currentUserProfile?.id === profile.id;
    const isFollowing = currentUserProfile?.following?.includes(profile.id) ?? false;
    
    const MAX_DATA_URL_BYTES = 1024 * 1024; // 1 MiB (Firestore limit)

    const handleAvatarClick = () => {
        if (isOwnProfile && !isUploading) {
            fileInputRef.current?.click();
        }
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast({ variant: 'destructive', title: 'Archivo no válido', description: 'Por favor, selecciona una imagen.' });
            return;
        }
        
        setIsUploading(true);

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 512; // Resize to a reasonable width for avatars
                const scaleSize = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
                canvas.width = img.width * scaleSize;
                canvas.height = img.height * scaleSize;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                     setIsUploading(false);
                     return;
                }
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.9); // Compress as JPEG

                if (compressedDataUrl.length > MAX_DATA_URL_BYTES) {
                    toast({ variant: 'destructive', title: 'Imagen demasiado grande', description: 'Incluso comprimida, la imagen es demasiado grande. Por favor, elige una con menor resolución.' });
                    setIsUploading(false);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                    return;
                }
                
                const userDocRef = doc(firestore, 'users', profile.id);
                updateDocumentNonBlocking(userDocRef, { avatarUrl: compressedDataUrl });

                if (profile.followers && profile.followers.length > 0) {
                    for (const followerId of profile.followers) {
                        const notificationCollection = collection(firestore, 'users', followerId, 'notifications');
                        addDocumentNonBlocking(notificationCollection, {
                            userId: followerId,
                            actorId: profile.id,
                            actorUsername: profile.username,
                            actorAvatarUrl: compressedDataUrl,
                            type: 'avatar_change',
                            read: false,
                            createdAt: serverTimestamp(),
                        });
                    }
                }

                toast({ description: "Foto de perfil actualizada." });
                setIsUploading(false);
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleFollowToggle = () => {
        if (!currentUserProfile) {
            toast({ variant: 'destructive', description: 'Necesitas iniciar sesión para seguir a alguien.' });
            return;
        }

        if (isOwnProfile) {
            toast({ variant: 'destructive', description: 'No puedes seguirte a ti mismo.'});
            return;
        };

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

            // Send notification
            const notificationCollection = collection(firestore, 'users', profile.id, 'notifications');
            addDocumentNonBlocking(notificationCollection, {
                userId: profile.id,
                actorId: currentUserProfile.id,
                actorUsername: currentUserProfile.username,
                actorAvatarUrl: currentUserProfile.avatarUrl,
                type: 'new_follower',
                read: false,
                createdAt: serverTimestamp()
            });
        }
    };

    return (
        <div className="w-full max-w-4xl bg-card border border-border rounded-lg p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="relative group">
                <Image
                    src={profile.avatarUrl}
                    alt={profile.username}
                    width={128}
                    height={128}
                    className={cn(
                        "rounded-full border-4 border-primary object-cover w-32 h-32",
                        isOwnProfile && "cursor-pointer group-hover:opacity-70 transition-opacity"
                    )}
                    onClick={handleAvatarClick}
                />
                 {isOwnProfile && (
                     <div 
                        onClick={handleAvatarClick} 
                        className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                        {isUploading ? <Loader2 className="animate-spin text-white h-8 w-8" /> : <Camera className="text-white h-8 w-8" />}
                    </div>
                )}
            </div>
             <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg, image/gif, image/webp"
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
    const router = useRouter();
    const userId = params.userId as string;
    const firestore = useFirestore();
    const { user: currentUser, isUserLoading: isAuthLoading } = useUser();

    // --- Start of Logout Handling Logic ---
    const previousUserRef = useRef(currentUser);

    useEffect(() => {
        // If we had a user before, but not anymore (and auth is done loading), it's a sign-out event.
        if (previousUserRef.current && !currentUser && !isAuthLoading) {
            // Redirect to the home page, which will then correctly show the sign-in page.
            router.push('/');
        }
        // Update the ref for the next render cycle.
        previousUserRef.current = currentUser;
    }, [currentUser, isAuthLoading, router]);
    // --- End of Logout Handling Logic ---


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

    // This is the "in-between" state when a user signs out.
    // We show a loader while the redirect to the home page is happening.
    if (!isAuthLoading && !currentUser && previousUserRef.current) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <p className="ml-4 text-slate-300">Cerrando sesión...</p>
            </div>
        );
    }
    
    // Consolidated loading state. Show loader if...
    // 1. Authentication state is loading.
    // 2. The profile for the page is loading.
    // 3. A user is logged in, but their own profile data is still loading.
    const isLoading = isAuthLoading || isProfileLoading || (!!currentUser && isCurrentUserProfileLoading);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!profile) {
        return (
           <div className="flex items-center justify-center min-h-screen">
                <p className="text-xl text-slate-400">Este perfil no existe.</p>
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

    