"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useUser, useFirestore } from '@/firebase';
import { doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Heart, MessageSquare } from 'lucide-react';
import { Post, UserProfile } from '@/types';
import CommentSection from './CommentSection';

type PostCardProps = {
    post: Post;
    currentUserProfile: UserProfile;
};

export default function PostCard({ post, currentUserProfile }: PostCardProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const [showComments, setShowComments] = useState(false);
    
    if (!user) return null;

    const isLiked = post.likes.includes(user.uid);
    const postRef = doc(firestore, 'posts', post.id);

    const handleLikeToggle = () => {
        if (isLiked) {
            updateDocumentNonBlocking(postRef, {
                likes: arrayRemove(user.uid)
            });
        } else {
            updateDocumentNonBlocking(postRef, {
                likes: arrayUnion(user.uid)
            });
        }
    };
    
    return (
        <Card className="bg-card border-border text-foreground">
            <CardHeader>
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
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="whitespace-pre-wrap">{post.text}</p>
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
            <CardFooter className="flex justify-between items-center border-t border-border pt-2">
                <Button variant="ghost" onClick={handleLikeToggle} className={`hover:text-red-500 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}>
                    <Heart className="mr-2" /> 
                    {post.likes.length}
                </Button>
                <Button variant="ghost" onClick={() => setShowComments(!showComments)} className="text-muted-foreground hover:text-primary">
                    <MessageSquare className="mr-2" />
                    {post.commentCount}
                </Button>
            </CardFooter>
            {showComments && <CommentSection postId={post.id} currentUserProfile={currentUserProfile} />}
        </Card>
    );
}
