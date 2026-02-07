"use client";
import { useState } from 'react';
import type { UserProfile } from '@/types';
import { Gem, Rocket, Users, Shield, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

import MetroClock from './MetroClock';
import MainFeed from './MainFeed';
import EarnSection from './EarnSection';
import CampaignForm from './CampaignForm';
import Pricing from './Pricing';
import AdminDashboard from './AdminDashboard';
import CampaignGateModal from './CampaignGateModal';

type View = 'feed' | 'earn' | 'shop' | 'admin';

const ADMIN_UID = 'cgjnVXgaoVWFJfSwu4r1UAbZHbf1';
const CREATOR_ID = 'cgjnVXgaoVWFJfSwu4r1UAbZHbf1';

export default function Dashboard({ userProfile, updateUserProfile }: { userProfile: UserProfile, updateUserProfile: (updates: { [key: string]: any }) => void }) {
    const [view, setView] = useState<View>('feed');
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [showCampaignGate, setShowCampaignGate] = useState(false);
    const { toast } = useToast();

    const updateCoinBalance = (newBalance: number) => {
        updateUserProfile({ coinBalance: newBalance });
    };

    const handlePublishClick = () => {
        const now = new Date();
        const lastCheck = userProfile.lastCampaignGateCheck?.toDate();

        if (lastCheck) {
            const thirtyDays = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
            if (now.getTime() - lastCheck.getTime() < thirtyDays) {
                setIsSheetOpen(true); // Gate passed within the last month, open sheet
                return;
            }
        }
        
        const isFollowingCreator = userProfile.following?.includes(CREATOR_ID);
        if (isFollowingCreator) {
            // Is following, but gate is expired. Update timestamp and open sheet.
            updateUserProfile({ lastCampaignGateCheck: serverTimestamp() });
            setIsSheetOpen(true);
            return;
        }

        // Is not following, and gate is not passed/expired. Show modal.
        setShowCampaignGate(true); 
    };

    const handleCampaignGateConfirm = () => {
        const isFollowingCreator = userProfile.following?.includes(CREATOR_ID);
        if (isFollowingCreator) {
            updateUserProfile({ lastCampaignGateCheck: serverTimestamp() });
            setShowCampaignGate(false);
            setIsSheetOpen(true);
            toast({
                title: "¡Gracias por tu apoyo!",
                description: "Ahora puedes crear tu campaña.",
            });
        } else {
            toast({
                variant: "destructive",
                title: 'Verificación fallida',
                description: 'Parece que aún no sigues al creador. Por favor, síguelo e inténtalo de nuevo.',
            });
        }
    };
    
    const renderView = () => {
        switch(view) {
            case 'feed':
                return <MainFeed userProfile={userProfile} />;
            case 'earn':
                return <EarnSection coinBalance={userProfile.coinBalance} updateCoinBalance={updateCoinBalance} />;
            case 'shop':
                return <Pricing coinBalance={userProfile.coinBalance} updateCoinBalance={updateCoinBalance} />;
            case 'admin':
                return <AdminDashboard />;
            default:
                return <MainFeed userProfile={userProfile} />;
        }
    };

    const NavButton = ({ activeView, targetView, onClick, children, icon: Icon }: { activeView: View, targetView: View, onClick: () => void, children: React.ReactNode, icon: React.ElementType }) => (
        <Button
            variant={activeView === targetView ? 'secondary' : 'ghost'}
            onClick={onClick}
            className="justify-start w-full text-lg py-6"
        >
            <Icon className="mr-4 h-6 w-6" />
            {children}
        </Button>
    );

    const MobileNavButton = ({ activeView, targetView, onClick, children, icon: Icon }: { activeView: View, targetView: View, onClick: () => void, children: React.ReactNode, icon: React.ElementType }) => (
        <Button
            variant="ghost"
            onClick={onClick}
            className={`flex flex-col basis-0 flex-grow h-full p-1 items-center justify-center rounded-none text-xs gap-1 ${activeView === targetView ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
        >
            <Icon className="h-5 w-5" />
            {children}
        </Button>
    );

    return (
        <main className="container mx-auto p-4 md:p-8 flex flex-col items-center gap-8 pb-24 md:pb-8">
            <MetroClock username={userProfile.username} />
            <div className="w-full max-w-6xl flex gap-8">
                {/* Desktop Sidebar */}
                <div className="hidden md:flex flex-col w-64 gap-2">
                    <NavButton activeView={view} targetView="feed" onClick={() => setView('feed')} icon={Home}>Feed</NavButton>
                    <NavButton activeView={view} targetView="earn" onClick={() => setView('earn')} icon={Users}>Ganar Monedas</NavButton>
                    <Button variant={'ghost'} onClick={handlePublishClick} className="justify-start w-full text-lg py-6">
                        <Rocket className="mr-4 h-6 w-6" /> Publicar Campaña
                    </Button>
                    <NavButton activeView={view} targetView="shop" onClick={() => setView('shop')} icon={Gem}>Comprar Monedas</NavButton>
                    {userProfile.id === ADMIN_UID && (
                       <NavButton activeView={view} targetView="admin" onClick={() => setView('admin')} icon={Shield}>Admin</NavButton>
                    )}
                </div>
                {/* Main Content */}
                <div className="flex-1 min-w-0">
                     {renderView()}
                </div>
            </div>

             {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border h-16 flex justify-around items-stretch z-30">
                 <MobileNavButton activeView={view} targetView="feed" onClick={() => setView('feed')} icon={Home}>Feed</MobileNavButton>
                 <MobileNavButton activeView={view} targetView="earn" onClick={() => setView('earn')} icon={Users}>Ganar</MobileNavButton>
                 <Button
                    variant="ghost"
                    onClick={handlePublishClick}
                    className="flex flex-col basis-0 flex-grow h-full p-1 items-center justify-center rounded-none text-xs gap-1 text-muted-foreground"
                 >
                    <Rocket className="h-5 w-5" /> Publicar
                 </Button>
                 <MobileNavButton activeView={view} targetView="shop" onClick={() => setView('shop')} icon={Gem}>Comprar</MobileNavButton>
                 {userProfile.id === ADMIN_UID && (
                    <MobileNavButton activeView={view} targetView="admin" onClick={() => setView('admin')} icon={Shield}>Admin</MobileNavButton>
                 )}
            </div>

            {/* Campaign Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="bottom" className="bg-slate-900/95 backdrop-blur-lg border-t border-slate-700 h-auto">
                    <SheetHeader>
                        <SheetTitle className="text-cyan-400 font-headline text-2xl">Lanzar una nueva campaña</SheetTitle>
                    </SheetHeader>
                    <div className="py-4">
                            <CampaignForm coinBalance={userProfile.coinBalance} updateCoinBalance={updateCoinBalance} setView={setIsSheetOpen} />
                    </div>
                </SheetContent>
            </Sheet>

            {/* Campaign Gate Modal */}
            {showCampaignGate && <CampaignGateModal onConfirm={handleCampaignGateConfirm} onCancel={() => setShowCampaignGate(false)} creatorId={CREATOR_ID} />}

        </main>
    );
}
