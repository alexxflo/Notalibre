import { Button } from './ui/button';
import CoinBalance from './CoinBalance';
import { Gem } from 'lucide-react';
import { View } from '@/app/page';

type HeaderProps = {
  coinBalance: number;
  setView: (view: View) => void;
};

export default function Header({ coinBalance, setView }: HeaderProps) {
  return (
    <header className="bg-card/80 backdrop-blur-lg sticky top-0 z-40 border-b">
      <div className="container mx-auto flex justify-between items-center p-4">
        <h1 
          className="text-3xl font-bold font-headline text-primary cursor-pointer"
          onClick={() => setView('home')}
        >
          SalvaFans
        </h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setView('store')}>
            <Gem className="mr-2 h-4 w-4"/>
            Comprar Monedas
          </Button>
          <CoinBalance balance={coinBalance} />
        </div>
      </div>
    </header>
  );
}
