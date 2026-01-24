import { Gem } from 'lucide-react';

type CoinBalanceProps = {
  balance: number;
};

export default function CoinBalance({ balance }: CoinBalanceProps) {
  return (
    <div className="flex items-center gap-2 bg-white/80 dark:bg-card/80 px-4 py-2 rounded-full border border-primary/50 shadow-sm">
      <Gem className="text-primary h-5 w-5" />
      <span className="font-bold text-lg text-primary font-mono">{balance}</span>
    </div>
  );
}
