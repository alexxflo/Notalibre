"use client";

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import MainFeed from '@/components/MainFeed';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile } from '@/types';
import SignIn from '@/components/auth/SignIn';
import StoriesCarousel from '@/components/stories/StoriesCarousel';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  if (isUserLoading || (user && isProfileLoading)) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 md:p-8">
        <div className="space-y-8">
          <div className="flex items-center gap-4">
             <Skeleton className="h-16 w-16 rounded-full" />
             <Skeleton className="h-16 w-16 rounded-full" />
             <Skeleton className="h-16 w-16 rounded-full" />
             <Skeleton className="h-16 w-16 rounded-full" />
          </div>
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return <SignIn />;
  }

  return (
      <div className="w-full max-w-2xl mx-auto p-4 md:p-8">
          <StoriesCarousel currentUserProfile={userProfile} />
          <MainFeed userProfile={userProfile} />
      </div>
  );
}
