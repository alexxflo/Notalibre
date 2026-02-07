'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import PostCard from '@/components/posts/PostCard';
import { Post, UserProfile } from '@/types';

interface PostDetailDialogProps {
  post: Post | null;
  currentUserProfile: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PostDetailDialog({ post, currentUserProfile, open, onOpenChange }: PostDetailDialogProps) {
  if (!post) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 bg-transparent border-0 w-auto max-w-4xl shadow-none">
          {/* commentsVisibleByDefault makes the comment section open by default in this view */}
          <PostCard post={post} currentUserProfile={currentUserProfile} commentsVisibleByDefault={true} />
      </DialogContent>
    </Dialog>
  );
}
