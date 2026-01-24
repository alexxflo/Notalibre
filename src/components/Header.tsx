import { Button } from './ui/button';
import CoinBalance from './CoinBalance';
import { Gem } from 'lucide-react';
import { View } from '@/app/page';
import { useUser } from '@/firebase';
import UserMenu from './auth/UserMenu';
import { Skeleton } from './ui/skeleton';
import VortexLogo from './VortexLogo';

type HeaderProps = {
  coinBalance: number;
  setView: (view: View) => void;
};

export default function Header({ coinBalance, setView }: HeaderProps) {
  const { isUserLoading } = useUser();

  return (
    <header className="bg-slate-900/50 backdrop-blur-lg sticky top-0 z-40 border-b border-slate-700/50">
      <div className="container mx-auto flex justify-between items-center p-4">
        <div onClick={() => setView('home')} className="cursor-pointer">
            <VortexLogo className="w-36 md:w-40 h-auto" />
        </div>
        <div className="flex items-center gap-4">
          {isUserLoading ? (
            <Skeleton className="h-10 w-24 rounded-full bg-slate-700" />
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setView('store')} className="border-cyan-400 text-cyan-400 hover:bg-cyan-900/50 hover:text-cyan-300 uppercase">
                <Gem className="mr-2 h-4 w-4"/>
                Comprar Monedas
              </Button>
              <CoinBalance balance={coinBalance} />
              <UserMenu />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
