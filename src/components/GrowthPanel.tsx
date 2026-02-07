'use client';

import { useState } from 'react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { Gem, Rocket, Shield, Megaphone } from 'lucide-react';
import type { UserProfile } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EarnSection from '@/components/EarnSection';
import Pricing from '@/components/Pricing';
import AdminDashboard from '@/components/AdminDashboard';
import CampaignForm from '@/components/CampaignForm';
import CampaignGateModal from '@/components/CampaignGateModal';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { cn } from '@/lib/utils';

type GrowthPanelProps = {
    userProfile: UserProfile;
    isAdmin: boolean;
}

export default function GrowthPanel({ userProfile, isAdmin }: GrowthPanelProps) {
    const firestore = useFirestore();
    
    const userProfileRef = useMemoFirebase(() => doc(firestore, 'users', userProfile.id), [firestore, userProfile.id]);

    const [activeTab, setActiveTab] = useState("earn");
    const [showCampaignGate, setShowCampaignGate] = useState(false);
    
    const [gateVerified, setGateVerified] = useState(() => {
        if (!userProfile.lastCampaignGateCheck) return false;
        const lastCheck = userProfile.lastCampaignGateCheck.toDate();
        const oneMonthAgo = new Date(new Date().setMonth(new Date().getMonth() - 1));
        return lastCheck > oneMonthAgo;
    });

    const handleTabChange = (value: string) => {
        if (value === 'campaign' && !gateVerified) {
            setShowCampaignGate(true);
        } else {
            setActiveTab(value);
        }
    };

    const handleGateConfirm = () => {
        if (!userProfileRef) return;
        updateDocumentNonBlocking(userProfileRef, { lastCampaignGateCheck: serverTimestamp() });
        setShowCampaignGate(false);
        setGateVerified(true);
        setActiveTab('campaign');
    };

    const handleGateCancel = () => {
        setShowCampaignGate(false);
        setActiveTab('earn');
    };

    const updateCoinBalance = (newBalance: number) => {
        if (!userProfileRef) return;
        updateDocumentNonBlocking(userProfileRef, { coinBalance: newBalance });
    };

    return (
        <>
            {showCampaignGate && (
                <CampaignGateModal onConfirm={handleGateConfirm} onCancel={handleGateCancel} />
            )}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className={cn("grid w-full max-w-4xl", isAdmin ? "grid-cols-4" : "grid-cols-3")}>
                    <TabsTrigger value="earn"><Rocket className="mr-2 h-4 w-4"/>Ganar Monedas</TabsTrigger>
                    <TabsTrigger value="shop"><Gem className="mr-2 h-4 w-4"/>Comprar Monedas</TabsTrigger>
                    <TabsTrigger value="campaign"><Megaphone className="mr-2 h-4 w-4"/>Crear Campaña</TabsTrigger>
                    {isAdmin && (
                        <TabsTrigger value="admin"><Shield className="mr-2 h-4 w-4"/>Admin</TabsTrigger>
                    )}
                </TabsList>
                <TabsContent value="earn">
                    <EarnSection coinBalance={userProfile.coinBalance} updateCoinBalance={updateCoinBalance} />
                </TabsContent>
                <TabsContent value="shop">
                    <Pricing coinBalance={userProfile.coinBalance} updateCoinBalance={updateCoinBalance} />
                </TabsContent>
                <TabsContent value="campaign">
                    {gateVerified ? (
                        <CampaignForm coinBalance={userProfile.coinBalance} updateCoinBalance={updateCoinBalance} setView={() => setActiveTab('earn')} />
                    ) : (
                         <div className="text-center p-8 bg-card rounded-lg mt-6">
                           <p className="text-muted-foreground">Debes pasar la verificación para crear una campaña.</p>
                           <p className="text-sm text-muted-foreground/70">Selecciona la pestaña de nuevo para empezar.</p>
                        </div>
                    )}
                </TabsContent>
                {isAdmin && (
                    <TabsContent value="admin">
                        <AdminDashboard />
                    </TabsContent>
                )}
            </Tabs>
        </>
    );
}
