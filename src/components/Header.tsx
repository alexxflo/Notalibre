import CoinBalance from './CoinBalance';

type HeaderProps = {
  coinBalance: number;
};

export default function Header({ coinBalance }: HeaderProps) {
  return (
    <header className="bg-card/80 backdrop-blur-lg sticky top-0 z-40 border-b">
      <div className="container mx-auto flex justify-between items-center p-4">
        <h1 className="text-3xl font-bold font-headline text-primary">
          SalvaFans
        </h1>
        <CoinBalance balance={coinBalance} />
      </div>
    </header>
  );
}
