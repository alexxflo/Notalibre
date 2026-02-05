"use client";

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import PostForm from '@/components/posts/PostForm';
import PostCard from '@/components/posts/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { Post, UserProfile } from '@/types';

export default function MainFeed({ userProfile }: { userProfile: UserProfile }) {
  const firestore = useFirestore();

  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: posts, isLoading: arePostsLoading } = useCollection<Post>(postsQuery);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-8">
        <PostForm userProfile={userProfile} />
        
        <div className="w-full space-y-6">
          {arePostsLoading && Array.from({ length: 3 }).map((_, i) => (
             <div key={i} className="bg-card p-4 rounded-lg border border-border space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="aspect-video w-full rounded-md" />
             </div>
          ))}

          {posts?.map(post => (
            <PostCard key={post.id} post={post} currentUserProfile={userProfile} />
          ))}
          {!arePostsLoading && posts?.length === 0 && (
            <div className="text-center py-16 bg-card border border-border rounded-lg">
                <p className="text-slate-400">No hay publicaciones todavía.</p>
                <p className="text-slate-500">¡Sé el primero en compartir algo!</p>
            </div>
          )}
        </div>
    </div>
  );
}
