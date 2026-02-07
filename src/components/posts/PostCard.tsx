"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useUser, useFirestore } from '@/firebase';
import { doc, arrayUnion, arrayRemove, collection, serverTimestamp } from 'firebase/firestore';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Heart, MessageSquare, MoreHorizontal, Trash2, Eye, EyeOff } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Post, UserProfile } from '@/types';
import CommentSection from './CommentSection';
import { useToast } from '@/hooks/use-toast';

type PostCardProps = {
    post: Post;
    currentUserProfile: UserProfile | null;
    commentsVisibleByDefault?: boolean;
};

export default function PostCard({ post, currentUserProfile, commentsVisibleByDefault = false }: PostCardProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [showComments, setShowComments] = useState(commentsVisibleByDefault);
    
    const isLiked = user ? post.likes.includes(user.uid) : false;
    const postRef = doc(firestore, 'posts', post.id);
    const isOwner = currentUserProfile?.id === post.userId;

    const handleLikeToggle = () => {
        if (!user || !currentUserProfile) {
            toast({ variant: 'destructive', description: 'Necesitas iniciar sesión para dar me gusta.' });
            return;
        }

        if (isLiked) {
            updateDocumentNonBlocking(postRef, {
                likes: arrayRemove(user.uid)
            });
        } else {
            updateDocumentNonBlocking(postRef, {
                likes: arrayUnion(user.uid)
            });

            // Add notification logic, but don't notify for own post
            if (post.userId !== user.uid) {
                const notificationCollection = collection(firestore, 'users', post.userId, 'notifications');
                addDocumentNonBlocking(notificationCollection, {
                    userId: post.userId,
                    actorId: user.uid,
                    actorUsername: currentUserProfile.username,
                    actorAvatarUrl: currentUserProfile.avatarUrl,
                    type: 'new_like',
                    postId: post.id,
                    postTextSnippet: post.text?.substring(0, 50) || '',
                    read: false,
                    createdAt: serverTimestamp()
                });
            }
        }
    };
    
    const handleDeletePost = () => {
        // TODO: Add confirmation dialog
        deleteDocumentNonBlocking(postRef);
        toast({ description: "Publicación eliminada." });
    };

    const handleToggleVisibility = () => {
        const newVisibility = post.visibility === 'public' ? 'private' : 'public';
        updateDocumentNonBlocking(postRef, { visibility: newVisibility });
        toast({ description: `La publicación ahora es ${newVisibility === 'public' ? 'pública' : 'privada'}.` });
    };

    return (
        <Card className="bg-card border-border text-foreground">
            <CardHeader className="flex flex-row items-start justify-between p-4">
                <div className="flex items-center gap-3">
                    <Link href={`/profile/${post.userId}`}>
                        <Avatar>
                            <AvatarImage src={post.avatarUrl} alt={post.username} />
                            <AvatarFallback>{post.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <div>
                        <Link href={`/profile/${post.userId}`} className="font-bold hover:underline">{post.username}</Link>
                        <p className="text-xs text-muted-foreground">
                            {post.createdAt?.toDate
                                ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true, locale: es })
                                : 'hace un momento'}
                        </p>
                    </div>
                </div>
                 {isOwner && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="-mr-2 -mt-2 h-8 w-8">
                                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                            <DropdownMenuItem onClick={handleToggleVisibility} className="focus:bg-slate-800 cursor-pointer">
                                {post.visibility === 'public' ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                                <span>{post.visibility === 'public' ? 'Hacer Privada' : 'Hacer Pública'}</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-700"/>
                            <DropdownMenuItem onClick={handleDeletePost} className="text-red-400 focus:bg-red-900/50 focus:text-red-300 cursor-pointer">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Eliminar</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </CardHeader>
            <CardContent className="space-y-4 pt-0 px-4">
                {post.text && <p className="whitespace-pre-wrap">{post.text}</p>}
                {post.imageUrl && (
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-border">
                        <Image
                            src={post.imageUrl}
                            alt="Post image"
                            fill
                            className="object-cover"
                            unoptimized
                        />
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between items-center border-t border-border pt-2 p-2">
                <Button variant="ghost" onClick={handleLikeToggle} className={`hover:text-red-500 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}>
                    <Heart className="mr-2" /> 
                    {post.likes.length}
                </Button>
                <Button variant="ghost" onClick={() => setShowComments(!showComments)} className="text-muted-foreground hover:text-primary">
                    <MessageSquare className="mr-2" />
                    {post.commentCount}
                </Button>
            </CardFooter>
            {showComments && <CommentSection postId={post.id} currentUserProfile={currentUserProfile} postOwnerId={post.userId} postText={post.text}/>}
        </Card>
    );
}

    
