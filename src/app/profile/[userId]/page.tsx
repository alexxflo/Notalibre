'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, useAuth } from '@/firebase';
import { doc, collection, query, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { signOut, Auth } from 'firebase/auth';
import { updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { UserProfile, Post } from '@/types';
import { Loader2, Users, UserCheck, MessageSquare, Camera, Pencil, Check, X, Gem, Grid, Video, Tag, Heart, MoreHorizontal, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InstagramIcon, TikTokIcon, FacebookIcon } from '@/components/icons';
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


function ProfileHeader({ profile, currentUserProfile, postCount, onEditClick, auth }: { profile: UserProfile, currentUserProfile: UserProfile | null, postCount: number, onEditClick: () => void, auth: Auth }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const isOwnProfile = currentUserProfile?.id === profile.id;
    const isFollowing = currentUserProfile?.following?.includes(profile.id) ?? false;

    const handleSignOut = async () => {
        try {
          await signOut(auth);
        } catch (error) {
          console.error('Error signing out:', error);
          toast({ variant: 'destructive', description: 'Error al cerrar sesión.' });
        }
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
            {/* Main container for header content */}
            <div className="flex flex-col gap-4">
                
                {/* TOP ROW: Avatar on left, stats on right */}
                <div className="flex items-center gap-4 md:gap-8">
                    <div className="flex-shrink-0 w-24 h-24 md:w-40 md:h-40">
                        <div className="relative w-full h-full">
                            <Image
                                src={profile.avatarUrl}
                                alt={profile.username}
                                fill
                                className="rounded-full border-4 border-card object-cover"
                            />
                        </div>
                    </div>
                    
                    <div className="flex flex-1 items-center justify-around text-center">
                        <div className="flex flex-col items-center">
                            <span className="font-bold text-lg md:text-xl">{postCount}</span>
                            <span className="text-sm text-slate-400">publicaciones</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="font-bold text-lg md:text-xl">{profile.followers?.length ?? 0}</span>
                            <span className="text-sm text-slate-400">seguidores</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="font-bold text-lg md:text-xl">{profile.following?.length ?? 0}</span>
                            <span className="text-sm text-slate-400">seguidos</span>
                        </div>
                    </div>
                </div>

                {/* BIO SECTION: Username, bio, coin balance, links */}
                <div className="space-y-2 text-left">
                    <div className="flex items-center gap-2">
                         <h1 className="text-lg font-semibold text-white">{profile.username}</h1>
                         <div className="flex items-center gap-2 bg-card px-2 py-0.5 rounded-full border border-primary/50">
                            <Gem className="text-primary h-3 w-3" />
                            <span className="font-bold text-sm text-primary font-mono">{profile.coinBalance}</span>
                        </div>
                    </div>
                    <p className="text-sm text-slate-400 whitespace-pre-line">{profile.email}</p>
                    <div className="flex items-center gap-4 pt-1">
                        {profile.instagramUrl && <a href={profile.instagramUrl} target="_blank" rel="noopener noreferrer" title="Instagram"><InstagramIcon className="h-5 w-5 text-slate-400 hover:text-white transition-colors" /></a>}
                        {profile.tiktokUrl && <a href={profile.tiktokUrl} target="_blank" rel="noopener noreferrer" title="TikTok"><TikTokIcon className="h-5 w-5 text-slate-400 hover:text-white transition-colors" /></a>}
                        {profile.facebookUrl && <a href={profile.facebookUrl} target="_blank" rel="noopener noreferrer" title="Facebook"><FacebookIcon className="h-5 w-5 text-slate-400 hover:text-white transition-colors" /></a>}
                    </div>
                </div>

                {/* BUTTONS SECTION */}
                <div className="flex items-center gap-2 w-full">
                    {isOwnProfile ? (
                        <>
                            <Button variant="outline" onClick={onEditClick} className="flex-1">Editar Perfil</Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700 text-white">
                                    <DropdownMenuItem onClick={handleSignOut} className="text-red-400 focus:bg-red-900/50 focus:text-red-300 cursor-pointer">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Cerrar Sesión</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : currentUserProfile && (
                        <>
                            <Button onClick={handleFollowToggle} variant={isFollowing ? 'secondary' : 'default'} className="flex-1">
                                {isFollowing ? <UserCheck className="mr-2"/> : <Users className="mr-2"/>}
                                {isFollowing ? 'Siguiendo' : 'Seguir'}
                            </Button>
                            <Link href={`/messages?chatWith=${profile.id}`} className="flex-1">
                                <Button variant="outline" className="w-full">
                                    <MessageSquare className="mr-2" />
                                    Mensaje
                                </Button>
                            </Link>
                        </>
                    )}
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
    const auth = useAuth();
    
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
                <ProfileHeader profile={profile} currentUserProfile={currentUserProfile} postCount={posts.length} onEditClick={() => setIsEditDialogOpen(true)} auth={auth} />
                {isOwnProfile && <EditProfileDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} userProfile={profile} />}
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
