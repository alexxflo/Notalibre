"use client";

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy, serverTimestamp, increment } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Comment, UserProfile } from '@/types';
import Link from 'next/link';

type CommentSectionProps = {
    postId: string;
    currentUserProfile: UserProfile;
};

function SingleComment({ comment }: { comment: Comment }) {
    return (
        <div className="flex items-start gap-3">
             <Link href={`/profile/${comment.userId}`}>
                <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.avatarUrl} alt={comment.username} />
                    <AvatarFallback>{comment.username.charAt(0)}</AvatarFallback>
                </Avatar>
            </Link>
            <div className="bg-muted p-3 rounded-lg flex-1">
                <div className="flex items-baseline gap-2">
                    <Link href={`/profile/${comment.userId}`} className="font-bold text-sm hover:underline">{comment.username}</Link>
                    <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true, locale: es })}
                    </p>
                </div>
                <p className="text-sm mt-1">{comment.text}</p>
            </div>
        </div>
    );
}

export default function CommentSection({ postId, currentUserProfile }: CommentSectionProps) {
    const firestore = useFirestore();
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const commentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
    }, [firestore, postId]);

    const { data: comments, isLoading } = useCollection<Comment>(commentsQuery);

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        const commentsCollection = collection(firestore, 'posts', postId, 'comments');
        const postDocRef = doc(firestore, 'posts', postId);

        try {
            await addDocumentNonBlocking(commentsCollection, {
                postId: postId,
                userId: currentUserProfile.id,
                username: currentUserProfile.username,
                avatarUrl: currentUserProfile.avatarUrl,
                text: newComment,
                createdAt: serverTimestamp(),
            });

            // Increment comment count on the post
            updateDocumentNonBlocking(postDocRef, {
                commentCount: increment(1)
            });

            setNewComment('');
        } catch (error) {
            console.error("Error posting comment: ", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 border-t border-border space-y-4">
            {isLoading && <Loader2 className="mx-auto animate-spin" />}
            
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {comments?.map(comment => <SingleComment key={comment.id} comment={comment} />)}
            </div>

            <form onSubmit={handleSubmitComment} className="flex items-center gap-2">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={currentUserProfile.avatarUrl} />
                    <AvatarFallback>{currentUserProfile.username.charAt(0)}</AvatarFallback>
                </Avatar>
                <Input
                    placeholder="Escribe un comentario..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="bg-muted border-border"
                    disabled={isSubmitting}
                />
                <Button type="submit" size="icon" disabled={isSubmitting || !newComment.trim()}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
                </Button>
            </form>
        </div>
    );
}
