"use client";

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SignIn from '@/components/auth/SignIn';
import ChatRoom from '@/components/ChatRoom';
import PostForm from '@/components/posts/PostForm';
import PostCard from '@/components/posts/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { Post, UserProfile } from '@/types';

function MainApp() {
  const { user } = useUser();
  const firestore = useFirestore();

  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: posts, isLoading: arePostsLoading } = useCollection<Post>(postsQuery);

  // This is a bit inefficient, but for now we fetch all users to get profile info.
  // A better approach would be to fetch profiles on demand.
  const usersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users, isLoading: areUsersLoading } = useCollection<UserProfile>(usersQuery);
  
  const userProfile = users?.find(u => u.id === user?.uid);

  if (areUsersLoading || !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-16 w-16 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header coinBalance={userProfile.coinBalance} />
      <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center gap-8">
        <div className="w-full max-w-2xl">
          <PostForm userProfile={userProfile} />
        </div>
        
        <div className="w-full max-w-2xl space-y-6">
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
        </div>
      </main>
      <ChatRoom userProfile={userProfile} />
      <Footer />
    </div>
  );
}

export default function Home() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
       <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-900">
        <div className="w-full max-w-4xl space-y-8">
          <div className="flex justify-between items-center p-4">
            <Skeleton className="h-12 w-48 bg-slate-700" />
            <Skeleton className="h-10 w-48 rounded-full bg-slate-700" />
          </div>
        </div>
         <Skeleton className="h-96 w-full max-w-2xl mt-8 rounded-xl bg-slate-700" />
      </div>
    )
  }

  if (!user) {
    return <SignIn />;
  }

  return <MainApp />;
}
