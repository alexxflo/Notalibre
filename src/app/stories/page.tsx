'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, Timestamp } from 'firebase/firestore';
import type { UserProfile, Story } from '@/types';
import { Loader2, PlusCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import StoriesView from '@/components/stories/StoriesView';

export default function StoriesPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const currentUserProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: currentUserProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(currentUserProfileRef);

    const storiesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // Query for stories that have not expired yet.
        return query(collection(firestore, 'stories'), where('expiresAt', '>', Timestamp.now()));
    }, [firestore]);

    const { data: stories, isLoading: areStoriesLoading } = useCollection<Story>(storiesQuery);

    // Group stories by user
    const storiesByUser = useMemo(() => {
        if (!stories) return [];
        const grouped: { [userId: string]: Story[] } = {};
        stories.forEach(story => {
            if (!grouped[story.userId]) {
                grouped[story.userId] = [];
            }
            grouped[story.userId].push(story);
            // Sort stories within each user group by creation date
            grouped[story.userId].sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
        });
        return Object.values(grouped);
    }, [stories]);

    const isLoading = isUserLoading || isProfileLoading || areStoriesLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!currentUserProfile) {
         return (
           <div className="flex items-center justify-center min-h-screen">
                <p className="text-xl text-slate-400">Necesitas iniciar sesión para ver las historias.</p>
           </div>
       );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header coinBalance={currentUserProfile?.coinBalance ?? 0}/>
            <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center gap-8">
                <div className="w-full flex justify-between items-center">
                    <h1 className="text-3xl font-headline text-white">Historias</h1>
                     <Link href="/stories/upload" passHref>
                        <Button>
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Subir Historia
                        </Button>
                    </Link>
                </div>

                {storiesByUser && storiesByUser.length > 0 ? (
                    <StoriesView groupedStories={storiesByUser} currentUserProfile={currentUserProfile} />
                ) : (
                    <div className="text-center py-16 bg-card border border-border rounded-lg w-full max-w-4xl">
                        <p className="text-slate-400 font-bold text-lg">No hay historias activas.</p>
                        <p className="text-slate-500 mt-2">¡Sé el primero en subir una!</p>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
