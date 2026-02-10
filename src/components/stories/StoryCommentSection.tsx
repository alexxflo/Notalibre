'use client';

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
import { StoryComment, UserProfile } from '@/types';
import Link from 'next/link';

type StoryCommentSectionProps = {
    storyId: string;
    currentUserProfile: UserProfile | null;
    storyOwnerId: string;
};

function SingleComment({ comment }: { comment: StoryComment }) {
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
                        {comment.createdAt?.toDate
                            ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true, locale: es })
                            : 'enviando...'}
                    </p>
                </div>
                <p className="text-sm mt-1">{comment.text}</p>
            </div>
        </div>
    );
}

export default function StoryCommentSection({ storyId, currentUserProfile, storyOwnerId }: StoryCommentSectionProps) {
    const firestore = useFirestore();
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const commentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'stories', storyId, 'comments'), orderBy('createdAt', 'asc'));
    }, [firestore, storyId]);

    const { data: comments, isLoading } = useCollection<StoryComment>(commentsQuery);

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUserProfile) return;

        setIsSubmitting(true);
        const commentsCollection = collection(firestore, 'stories', storyId, 'comments');
        const storyDocRef = doc(firestore, 'stories', storyId);

        try {
            await addDocumentNonBlocking(commentsCollection, {
                storyId: storyId,
                userId: currentUserProfile.id,
                username: currentUserProfile.username,
                avatarUrl: currentUserProfile.avatarUrl,
                text: newComment,
                createdAt: serverTimestamp(),
            });

            // Increment comment count on the story
            updateDocumentNonBlocking(storyDocRef, {
                commentCount: increment(1)
            });

            // Add notification logic, but don't notify for own story
            if (storyOwnerId !== currentUserProfile.id) {
                const notificationCollection = collection(firestore, 'users', storyOwnerId, 'notifications');
                addDocumentNonBlocking(notificationCollection, {
                    userId: storyOwnerId,
                    actorId: currentUserProfile.id,
                    actorUsername: currentUserProfile.username,
                    actorAvatarUrl: currentUserProfile.avatarUrl,
                    type: 'new_story_comment',
                    postId: storyId, // Re-using postId for storyId
                    read: false,
                    createdAt: serverTimestamp()
                });
            }

            setNewComment('');
        } catch (error) {
            console.error("Error posting story comment: ", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full">
            {isLoading && <Loader2 className="mx-auto my-4 animate-spin" />}
            
            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                {comments?.map(comment => <SingleComment key={comment.id} comment={comment} />)}
                {!isLoading && comments?.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">No hay comentarios aún.</p>
                )}
            </div>

            {currentUserProfile && (
                <form onSubmit={handleSubmitComment} className="flex items-center gap-2 py-4 border-t border-border">
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
            )}
        </div>
    );
}
