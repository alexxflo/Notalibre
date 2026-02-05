'use client';
import { useState } from 'react';
import type { UserProfile } from '@/types';
import { Gem, Rocket, Users, Shield, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

import MetroClock from './MetroClock';
import MainFeed from './MainFeed';
import EarnSection from './EarnSection';
import CampaignForm from './CampaignForm';
import Pricing from './Pricing';
import AdminDashboard from './AdminDashboard';

type View = 'feed' | 'earn' | 'publish' | 'shop' | 'admin';

const ADMIN_UID = 'cgjnVXgaoVWFJfSwu4r1UAbZHbf1';

export default function Dashboard({ userProfile, updateUserProfile }: { userProfile: UserProfile, updateUserProfile: (updates: Partial<UserProfile>) => void }) {
    const [view, setView] = useState<View>('feed');
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const updateCoinBalance = (newBalance: number) => {
        updateUserProfile({ coinBalance: newBalance });
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

    return (
        <main className="container mx-auto p-4 md:p-8 flex flex-col items-center gap-8">
            <MetroClock username={userProfile.username} />
            <div className="w-full max-w-6xl flex gap-8">
                {/* Desktop Sidebar */}
                <div className="hidden md:flex flex-col w-64 gap-2">
                    <NavButton activeView={view} targetView="feed" onClick={() => setView('feed')} icon={Home}>Feed</NavButton>
                    <NavButton activeView={view} targetView="earn" onClick={() => setView('earn')} icon={Users}>Ganar Monedas</NavButton>
                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetTrigger asChild>
                            <Button variant={'ghost'} className="justify-start w-full text-lg py-6">
                                <Rocket className="mr-4 h-6 w-6" /> Publicar Campaña
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="bg-slate-900/95 backdrop-blur-lg border-t border-slate-700 h-auto">
                            <SheetHeader>
                                <SheetTitle className="text-cyan-400 font-headline text-2xl">Lanzar una nueva campaña</SheetTitle>
                            </SheetHeader>
                            <div className="py-4">
                                 <CampaignForm coinBalance={userProfile.coinBalance} updateCoinBalance={updateCoinBalance} setView={setIsSheetOpen} />
                            </div>
                        </SheetContent>
                    </Sheet>
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
        </main>
    );
}