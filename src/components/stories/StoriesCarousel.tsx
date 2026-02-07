'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import type { UserProfile, Story } from '@/types';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';


export default function StoriesCarousel({ currentUserProfile }: { currentUserProfile: UserProfile }) {
    const firestore = useFirestore();

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
        });
        return Object.values(grouped);
    }, [stories]);

    if (areStoriesLoading) {
        return (
             <div className="flex space-x-4 pb-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
        );
    }

    if (storiesByUser.length === 0) {
        return null; // Don't render anything if there are no stories
    }

    return (
        <div className="relative w-full mb-8">
            <ScrollArea>
                <div className="flex space-x-4 pb-4">
                    {storiesByUser.map((userStories, index) => {
                        const firstStory = userStories[0];
                        if (!firstStory) return null;
                        
                        return (
                            <Link key={firstStory.userId} href={`/stories?user=${firstStory.userId}`} className="flex-shrink-0">
                                <div className="flex flex-col items-center gap-2 w-20">
                                    <div className="relative rounded-full p-1 bg-gradient-to-tr from-secondary to-primary">
                                        <Avatar className="h-16 w-16 border-4 border-card">
                                            <AvatarImage src={firstStory.avatarUrl} />
                                            <AvatarFallback>{firstStory.username.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <p className="text-xs text-center text-muted-foreground truncate w-full">{firstStory.username}</p>
                                </div>
                            </Link>
                        )
                    })}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}
