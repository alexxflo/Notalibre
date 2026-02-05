import Link from 'next/link';
import { Button } from './ui/button';
import CoinBalance from './CoinBalance';
import { User, LayoutDashboard } from 'lucide-react';
import { useUser } from '@/firebase';
import UserMenu from './auth/UserMenu';
import { Skeleton } from './ui/skeleton';
import VortexLogo from './VortexLogo';

type HeaderProps = {
  coinBalance: number;
};

export default function Header({ coinBalance }: HeaderProps) {
  const { user, isUserLoading } = useUser();

  return (
    <header className="bg-slate-900/50 backdrop-blur-lg sticky top-0 z-40 border-b border-slate-700/50">
      <div className="container mx-auto flex justify-between items-center p-4 gap-2">
        <div className="flex-none">
          <Link href="/">
            <VortexLogo className="relative w-36 md:w-48 h-auto" />
          </Link>
        </div>

        <div className="flex-1 flex justify-center">
          {/* Can add elements here later */}
        </div>

        <div className="flex-none">
          <div className="flex items-center gap-2 md:gap-4">
            {isUserLoading ? (
              <Skeleton className="h-10 w-24 rounded-full bg-slate-700" />
            ) : user ? (
              <>
                {/* This button can open a sheet with other options like in previous versions if needed */}
                {/* <Button variant="ghost" size="sm" onClick={() => {}} className="text-slate-300 hover:bg-slate-800/50 hover:text-white uppercase shrink-0 p-2 md:px-3">
                    <LayoutDashboard className="h-4 w-4 md:mr-2"/>
                    <span className="hidden md:inline">Panel</span>
                </Button> */}
                <Link href={`/profile/${user.uid}`} passHref>
                  <Button variant="ghost" size="sm" className="text-yellow-400 hover:bg-yellow-900/50 hover:text-yellow-300 uppercase shrink-0 p-2 md:px-3">
                    <User className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Mi Perfil</span>
                  </Button>
                </Link>
                <CoinBalance balance={coinBalance} />
                <UserMenu />
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
