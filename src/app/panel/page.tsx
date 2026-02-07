'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, Gem, Rocket, Shield } from 'lucide-react';
import type { UserProfile } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import EarnSection from '@/components/EarnSection';
import Pricing from '@/components/Pricing';
import AdminDashboard from '@/components/AdminDashboard';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const ADMIN_UID = 'cgjnVXgaoVWFJfSwu4r1UAbZHbf1';


export default function PanelPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    
    const userProfileRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    const updateCoinBalance = (newBalance: number) => {
        if (!userProfileRef) return;
        updateDocumentNonBlocking(userProfileRef, { coinBalance: newBalance });
    };

    if (isUserLoading || isProfileLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!user || !userProfile) {
        // This case should ideally be handled by the layout or a higher-order component
        // redirecting to login.
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Por favor, inicia sesión para acceder al panel.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-headline text-white mb-8">Panel de Control</h1>
            <Tabs defaultValue="earn" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 max-w-2xl">
                    <TabsTrigger value="earn"><Rocket className="mr-2 h-4 w-4"/>Ganar Monedas</TabsTrigger>
                    <TabsTrigger value="shop"><Gem className="mr-2 h-4 w-4"/>Comprar Monedas</TabsTrigger>
                    {user.uid === ADMIN_UID && (
                        <TabsTrigger value="admin"><Shield className="mr-2 h-4 w-4"/>Admin</TabsTrigger>
                    )}
                </TabsList>
                <TabsContent value="earn">
                    <EarnSection coinBalance={userProfile.coinBalance} updateCoinBalance={updateCoinBalance} />
                </TabsContent>
                <TabsContent value="shop">
                    <Pricing coinBalance={userProfile.coinBalance} updateCoinBalance={updateCoinBalance} />
                </TabsContent>
                {user.uid === ADMIN_UID && (
                    <TabsContent value="admin">
                        <AdminDashboard />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
