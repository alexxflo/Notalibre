'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/types';
import { Loader2 } from 'lucide-react';
import StoryUploader from '@/components/stories/StoryUploader';

export default function UploadStoryPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const currentUserProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: currentUserProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(currentUserProfileRef);
    
    const isLoading = isUserLoading || isProfileLoading;

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
                <p className="text-xl text-slate-400">Necesitas iniciar sesión para subir una historia.</p>
           </div>
       );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center gap-8">
                <div className="w-full max-w-2xl">
                    <h1 className="text-3xl font-headline text-white mb-8 text-center">Subir una Nueva Historia</h1>
                    <StoryUploader userProfile={currentUserProfile} />
                </div>
            </main>
        </div>
    );
}
