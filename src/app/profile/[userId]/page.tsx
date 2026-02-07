'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { UserProfile, Post } from '@/types';
import { Loader2, Users, UserCheck, MessageSquare, Camera, Pencil, Check, X, Gem, Grid, Video, Tag, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


function ProfileHeader({ profile, currentUserProfile, postCount }: { profile: UserProfile, currentUserProfile: UserProfile | null, postCount: number }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [newUsername, setNewUsername] = useState(profile.username);
    
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

    const handleUsernameSave = () => {
        const trimmedUsername = newUsername.trim();
        if (!trimmedUsername) {
            toast({ variant: 'destructive', description: "El nombre de usuario no puede estar vacío." });
            return;
        }
        if (trimmedUsername !== profile.username) {
            const userDocRef = doc(firestore, 'users', profile.id);
            updateDocumentNonBlocking(userDocRef, { username: trimmedUsername });
            toast({ description: "Nombre de usuario actualizado." });
        }
        setIsEditingUsername(false);
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
       <div className="w-full max-w-4xl p-4 md:p-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 items-start">
                <div className="md:col-span-1 flex justify-center md:justify-start">
                     <div className="relative group w-32 h-32 md:w-40 md:h-40">
                        <Image
                            src={profile.avatarUrl}
                            alt={profile.username}
                            width={160}
                            height={160}
                            className={cn(
                                "rounded-full border-4 border-card object-cover w-32 h-32 md:w-40 md:h-40",
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
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/png, image/jpeg, image/gif, image/webp"
                        />
                    </div>
                </div>

                <div className="md:col-span-2 space-y-5 text-center md:text-left">
                    <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
                         {isOwnProfile ? (
                            <div className="flex items-center gap-2">
                                {isEditingUsername ? (
                                <>
                                    <Input 
                                        value={newUsername} 
                                        onChange={(e) => setNewUsername(e.target.value)} 
                                        className="text-2xl font-bold text-white font-headline bg-slate-800 border-slate-600 h-11"
                                        onKeyDown={(e) => e.key === 'Enter' && handleUsernameSave()}
                                    />
                                    <Button onClick={handleUsernameSave} size="icon"><Check className="h-5 w-5" /></Button>
                                    <Button onClick={() => { setIsEditingUsername(false); setNewUsername(profile.username); }} variant="ghost" size="icon"><X className="h-5 w-5" /></Button>
                                </>
                                ) : (
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-light text-white">{profile.username}</h1>
                                    <Button onClick={() => setIsEditingUsername(true)} variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4 text-slate-400 hover:text-white" /></Button>
                                </div>
                                )}
                            </div>
                        ) : (
                             <h1 className="text-2xl font-light text-white">{profile.username}</h1>
                        )}
                        
                        <div className="flex items-center gap-2">
                             {isOwnProfile ? (
                                <>
                                    <Button variant="outline">Editar Perfil</Button>
                                </>
                            ) : currentUserProfile && (
                                <>
                                    <Button onClick={handleFollowToggle} variant={isFollowing ? 'secondary' : 'default'}>
                                        {isFollowing ? <UserCheck className="mr-2"/> : <Users className="mr-2"/>}
                                        {isFollowing ? 'Siguiendo' : 'Seguir'}
                                    </Button>
                                    <Link href={`/messages?chatWith=${profile.id}`}>
                                        <Button variant="outline" className="w-full">
                                            <MessageSquare className="mr-2" />
                                            Mensaje
                                        </Button>
                                    </Link>
                                </>
                            )}
                             <div className="flex items-center gap-2 bg-card px-3 py-1 rounded-full border border-primary/50">
                                <Gem className="text-primary h-4 w-4" />
                                <span className="font-bold text-md text-primary font-mono">{profile.coinBalance}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-8 justify-center md:justify-start">
                        <div><span className="font-bold">{postCount}</span> publicaciones</div>
                        <div><span className="font-bold">{profile.followers?.length ?? 0}</span> seguidores</div>
                        <div><span className="font-bold">{profile.following?.length ?? 0}</span> seguidos</div>
                    </div>
                    
                     <div className="space-y-1">
                        <p className="font-semibold text-white">{profile.username}</p>
                         <p className="text-sm text-slate-400 whitespace-pre-line">{profile.email}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId as string;
    const firestore = useFirestore();
    const { user: currentUser, isUserLoading: isAuthLoading } = useUser();

    const previousUserRef = useRef(currentUser);

    useEffect(() => {
        if (previousUserRef.current && !currentUser && !isAuthLoading) {
            router.push('/');
        }
        previousUserRef.current = currentUser;
    }, [currentUser, isAuthLoading, router]);

    const profileRef = useMemoFirebase(() => (currentUser && userId) ? doc(firestore, 'users', userId) : null, [firestore, currentUser, userId]);
    const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(profileRef);

    const currentUserProfileRef = useMemoFirebase(() => currentUser ? doc(firestore, 'users', currentUser.uid) : null, [firestore, currentUser]);
    const { data: currentUserProfile, isLoading: isCurrentUserProfileLoading } = useDoc<UserProfile>(currentUserProfileRef);

    const postsQuery = useMemoFirebase(() => {
        if (!firestore || !currentUser) return null;
        return query(collection(firestore, 'posts'));
    }, [firestore, currentUser]);

    const { data: allPosts, isLoading: arePostsLoading } = useCollection<Post>(postsQuery);

    const isOwnProfile = currentUser?.uid === userId;

    const posts = useMemo(() => {
        if (!allPosts || !userId) return [];
        
        const profilePosts = allPosts.filter(post => post.userId === userId && post.imageUrl);

        const visiblePosts = isOwnProfile 
            ? profilePosts
            : profilePosts.filter(post => post.visibility === 'public');

        return visiblePosts.sort((a, b) => {
                if (a.createdAt?.toMillis && b.createdAt?.toMillis) {
                    return b.createdAt.toMillis() - a.createdAt.toMillis();
                }
                return 0;
            });
    }, [allPosts, userId, isOwnProfile]);

    if (!isAuthLoading && !currentUser && previousUserRef.current) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <p className="ml-4 text-slate-300">Cerrando sesión...</p>
            </div>
        );
    }
    
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
            <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center gap-8">
                <ProfileHeader profile={profile} currentUserProfile={currentUserProfile} postCount={posts.length} />
                <Separator className="w-full max-w-4xl bg-border" />

                <Tabs defaultValue="grid" className="w-full max-w-4xl">
                    <TabsList className="grid w-full grid-cols-3 bg-transparent border-b-0 justify-center">
                        <TabsTrigger value="grid" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                            <Grid className="h-5 w-5" />
                            <span className="hidden sm:inline ml-2 uppercase">Publicaciones</span>
                        </TabsTrigger>
                        <TabsTrigger value="reels" disabled className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                            <Video className="h-5 w-5" />
                            <span className="hidden sm:inline ml-2 uppercase">Reels</span>
                        </TabsTrigger>
                        <TabsTrigger value="tagged" disabled className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                            <Tag className="h-5 w-5" />
                             <span className="hidden sm:inline ml-2 uppercase">Etiquetado</span>
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="grid" className="mt-4">
                        {arePostsLoading ? (
                            <div className="flex justify-center items-center py-16">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            </div>
                        ) : posts && posts.length > 0 ? (
                            <div className="grid grid-cols-3 gap-1">
                                {posts.map(post => (
                                    <div key={post.id} className="aspect-square relative group bg-muted overflow-hidden">
                                        <Image src={post.imageUrl!} alt={"Post de " + post.username} fill className="object-cover group-hover:opacity-75 transition-opacity" />
                                         <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                                            <div className="flex items-center gap-1">
                                                <Heart className="h-5 w-5" />
                                                <span className="font-bold">{post.likes.length}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <MessageSquare className="h-5 w-5" />
                                                <span className="font-bold">{post.commentCount}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-card border border-border rounded-lg">
                                <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="font-bold text-xl">Comparte Fotos</h3>
                                <p className="text-muted-foreground mt-2">Cuando compartas fotos, aparecerán en tu perfil.</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
