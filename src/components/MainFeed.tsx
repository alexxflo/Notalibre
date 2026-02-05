"use client";

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import PostForm from '@/components/posts/PostForm';
import PostCard from '@/components/posts/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { Post, UserProfile } from '@/types';

export default function MainFeed({ userProfile }: { userProfile: UserProfile }) {
  const firestore = useFirestore();

  // Remove orderBy from the query to prevent a potential index-related permission error.
  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'posts'));
  }, [firestore]);

  const { data: posts, isLoading: arePostsLoading } = useCollection<Post>(postsQuery);

  // Sort posts on the client-side as a workaround.
  const sortedPosts = useMemo(() => {
    if (!posts) return [];
    return [...posts].sort((a, b) => {
      // Ensure createdAt exists and is a Timestamp before comparing
      if (a.createdAt?.toMillis && b.createdAt?.toMillis) {
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      }
      return 0; // Keep original order if timestamps are not available
    });
  }, [posts]);

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

          {sortedPosts.map(post => (
            <PostCard key={post.id} post={post} currentUserProfile={userProfile} />
          ))}
          {!arePostsLoading && sortedPosts.length === 0 && (
            <div className="text-center py-16 bg-card border border-border rounded-lg">
                <p className="text-slate-400">No hay publicaciones todavía.</p>
                <p className="text-slate-500">¡Sé el primero en compartir algo!</p>
            </div>
          )}
        </div>
    </div>
  );
}
