'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, increment } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import type { UserProfile } from '@/types';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import GrowthPanelGate from '@/components/GrowthPanelGate';
import GrowthPanel from '@/components/GrowthPanel';

const ADMIN_UID = 'cgjnVXgaoVWFJfSwu4r1UAbZHbf1';
const CREATOR_ID = 'cgjnVXgaoVWFJfSwu4r1UAbZHbf1';

export default function PanelPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
    
    const creatorProfileRef = useMemoFirebase(() => doc(firestore, 'users', CREATOR_ID), [firestore]);
    const { data: creatorProfile, isLoading: isCreatorProfileLoading } = useDoc<UserProfile>(creatorProfileRef);

    const handleUnlock = () => {
        if (!userProfileRef || !userProfile || userProfile.growthPanelUnlocked) return;

        updateDocumentNonBlocking(userProfileRef, { 
            growthPanelUnlocked: true,
            coinBalance: increment(200)
        });
    };

    const isLoading = isUserLoading || isProfileLoading || isCreatorProfileLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!user || !userProfile || !creatorProfile) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Por favor, inicia sesión para acceder al panel.</p>
            </div>
        );
    }
    
    const isUnlocked = userProfile.growthPanelUnlocked || user.uid === ADMIN_UID;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-headline text-white mb-8">Crecimiento de Cuentas</h1>
            {isUnlocked ? (
                 <GrowthPanel userProfile={userProfile} isAdmin={user.uid === ADMIN_UID} />
            ) : (
                <GrowthPanelGate 
                    currentUserProfile={userProfile} 
                    creatorProfile={creatorProfile} 
                    onUnlock={handleUnlock} 
                />
            )}
        </div>
    );
}
