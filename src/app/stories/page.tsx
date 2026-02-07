'use client';

import { useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, Timestamp } from 'firebase/firestore';
import type { UserProfile, Story } from '@/types';
import { Loader2, PlusCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StoriesView from '@/components/stories/StoriesView';
import { useSearchParams } from 'next/navigation';

function StoriesPageContent() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const searchParams = useSearchParams();
    const initialUser = searchParams.get('user');

    const currentUserProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: currentUserProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(currentUserProfileRef);

    // The query is now stable and won't cause re-renders. Filtering happens on the client.
    const storiesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'stories'));
    }, [firestore]);

    const { data: allStories, isLoading: areStoriesLoading } = useCollection<Story>(storiesQuery);

    // Filter out expired stories on the client-side
    const stories = useMemo(() => {
        if (!allStories) return [];
        const now = Timestamp.now();
        // Ensure expiresAt exists before comparing, then sort
        return allStories
            .filter(story => story.expiresAt && story.expiresAt.toMillis() > now.toMillis())
            .sort((a, b) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0));
    }, [allStories]);

    // Group stories by user
    const storiesByUser = useMemo(() => {
        if (!stories) return [];
        const grouped: { [userId: string]: Story[] } = {};
        stories.forEach(story => {
            if (!grouped[story.userId]) {
                grouped[story.userId] = [];
            }
            grouped[story.userId].push(story);
        });

        // The inner stories are already sorted by date from the previous step
        return Object.values(grouped);
    }, [stories]);

    const initialUserIndex = useMemo(() => {
      if (!initialUser || storiesByUser.length === 0) return 0;
      const index = storiesByUser.findIndex(userStories => userStories[0]?.userId === initialUser);
      return index > -1 ? index : 0;
    }, [initialUser, storiesByUser]);


    const isLoading = isUserLoading || isProfileLoading || areStoriesLoading;

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!currentUserProfile) {
         return (
           <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
                <p className="text-xl text-slate-400">Necesitas iniciar sesión para ver las historias.</p>
           </div>
       );
    }

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center">
            <Link href="/" passHref className="absolute top-4 right-4 z-50">
                <Button variant="ghost" size="icon" className="text-white h-12 w-12 rounded-full bg-white/10 hover:bg-white/20">
                    <X className="h-8 w-8" />
                </Button>
            </Link>
            <div className="w-full h-full flex items-center justify-center">
                {storiesByUser && storiesByUser.length > 0 ? (
                    <StoriesView groupedStories={storiesByUser} currentUserProfile={currentUserProfile} initialUserIndex={initialUserIndex} />
                ) : (
                    <div className="text-center py-16 w-full max-w-4xl">
                        <p className="text-slate-400 font-bold text-lg">No hay historias activas.</p>
                        <p className="text-slate-500 mt-2">¡Sé el primero en subir una!</p>
                         <Link href="/stories/upload" passHref className="mt-4 inline-block">
                            <Button>
                                <PlusCircle className="mr-2 h-5 w-5" />
                                Subir Historia
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}


export default function StoriesPage() {
    return (
        <Suspense fallback={<div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <StoriesPageContent />
        </Suspense>
    )
}
