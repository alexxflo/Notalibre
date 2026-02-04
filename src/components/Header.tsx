import { Button } from './ui/button';
import CoinBalance from './CoinBalance';
import { Gem, Users, Shield, LayoutDashboard } from 'lucide-react';
import { View } from '@/app/page';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import UserMenu from './auth/UserMenu';
import { Skeleton } from './ui/skeleton';
import VortexLogo from './VortexLogo';
import { doc } from 'firebase/firestore';

type HeaderProps = {
  coinBalance: number;
  setView: (view: View) => void;
};

const ADMIN_UID = 'cgjnVXgaoVWFJfSwu4r1UAbZHbf1';

export default function Header({ coinBalance, setView }: HeaderProps) {
  const { user, isUserLoading } = useUser();

  return (
    <header className="bg-slate-900/50 backdrop-blur-lg sticky top-0 z-40 border-b border-slate-700/50">
      <div className="container mx-auto flex justify-between items-center p-4 gap-2">
        <div className="flex-none">
            <div onClick={() => setView('dashboard')} className="cursor-pointer">
                <VortexLogo className="relative w-36 md:w-48 h-auto" />
            </div>
        </div>

        <div className="flex-1 flex justify-center">
            {/* Can add elements here later */}
        </div>

        <div className="flex-none">
            <div className="flex items-center gap-2 md:gap-4">
            {isUserLoading ? (
                <Skeleton className="h-10 w-24 rounded-full bg-slate-700" />
            ) : (
                <>
                <Button variant="ghost" size="sm" onClick={() => setView('dashboard')} className="text-slate-300 hover:bg-slate-800/50 hover:text-white uppercase shrink-0 p-2 md:px-3">
                    <LayoutDashboard className="h-4 w-4 md:mr-2"/>
                    <span className="hidden md:inline">Panel</span>
                </Button>
                {user?.uid === ADMIN_UID && (
                  <Button variant="outline" size="sm" onClick={() => setView('admin')} className="border-red-500 text-red-400 hover:bg-red-900/50 hover:text-red-300 uppercase shrink-0 p-2 md:px-3">
                    <Shield className="h-4 w-4 md:mr-2"/>
                    <span className="hidden md:inline">Admin</span>
                  </Button>
                )}
                <CoinBalance balance={coinBalance} />
                <UserMenu />
                </>
            )}
            </div>
        </div>
      </div>
    </header>
  );
}
