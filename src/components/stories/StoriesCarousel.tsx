'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import type { UserProfile, Story } from '@/types';
import { Loader2, Plus } from 'lucide-react';
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

    // Group stories by user and sort them to show the current user's stories first
    const sortedStoriesByUser = useMemo(() => {
        if (!stories) return [];
        
        const grouped: { [userId: string]: Story[] } = {};
        stories.forEach(story => {
            if (!grouped[story.userId]) {
                grouped[story.userId] = [];
            }
            grouped[story.userId].push(story);
        });

        const allUserStories = Object.values(grouped);
        
        let myStories: Story[][] = [];
        let otherStories: Story[][] = [];

        allUserStories.forEach(userStoryGroup => {
            if (userStoryGroup[0]?.userId === currentUserProfile.id) {
                myStories.push(userStoryGroup);
            } else {
                otherStories.push(userStoryGroup);
            }
        });

        // The user's story should be first.
        return [...myStories, ...otherStories];
    }, [stories, currentUserProfile.id]);

    if (areStoriesLoading) {
        return (
             <div className="flex space-x-4 pb-4 mb-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
        );
    }

    return (
        <div className="relative w-full mb-8">
            <ScrollArea>
                <div className="flex space-x-4 pb-4">
                    {/* Add Story Button */}
                    <Link href="/stories/upload" className="flex-shrink-0">
                        <div className="flex flex-col items-center gap-2 w-20">
                            <div className="relative rounded-full p-1 bg-transparent">
                                <Avatar className="h-16 w-16 border-2 border-dashed border-muted-foreground">
                                    <AvatarImage src={currentUserProfile.avatarUrl} className="opacity-40" />
                                    <AvatarFallback>{currentUserProfile.username.charAt(0)}</AvatarFallback>
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                                        <Plus className="h-8 w-8 text-white" />
                                    </div>
                                </Avatar>
                            </div>
                            <p className="text-xs text-center text-muted-foreground truncate w-full">Crear historia</p>
                        </div>
                    </Link>

                    {sortedStoriesByUser.map((userStories) => {
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
