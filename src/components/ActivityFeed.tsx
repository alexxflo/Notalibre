'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Rocket, Gem } from 'lucide-react';

const fakeUsernames = [
    "CyberNomad", "PixelJunkie", "DataWhisperer", "GlitchMaster", "SynthWaveRider",
    "QuantumLeaper", "EchoSphere", "NexusSeeker", "ChronoHacker", "VoidSurfer",
    "AstroPilot", "RogueAI", "CryptoKing", "Biohacker", "DreamWeaver", "StarSailor",
    "GlitchHunter", "CodeNinja", "DataWraith", "NetShepherd", "ByteBandit", "DigiWizard",
    "CircuitSorcerer", "LogicLord", "ScriptKiddie", "KernelPanic", "RootAdmin", "Firewall",
    "PacketSniffer", "HashCrack", "Phisherman", "MalwareMage", "SpyMaster", "BotHerder",
    "ZeroDay", "ExploitExecutor", "InfoStealer", "KeyLogger", "TrojanHorse", "AdwareAgent",
    "Backdoor", "ZombieNet", "DDoS_Demon", "Spamurai", "ClickJacker", "CookieMonster",
    "SessionHijacker", "SQL_Injector", "CrossSiteScripter"
];


const followerActions = ["acaba de conseguir", "ha ganado", "obtuvo", "logró"];
const coinActions = ["acaba de comprar", "recargó", "obtuvo", "adquirió"];
const coinPackages = [40, 80, 120, 300];

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomFollowers = () => Math.floor(Math.random() * 50) + 1;

export default function ActivityFeed() {
  const { toast } = useToast();

  useEffect(() => {
    // This check ensures we're on the client side.
    if (typeof window === 'undefined') return;

    const intervalId = setInterval(() => {
      const isFollowerToast = Math.random() > 0.5;
      const user = getRandomItem(fakeUsernames);

      if (isFollowerToast) {
        const action = getRandomItem(followerActions);
        const followers = getRandomFollowers();
        toast({
          description: (
            <div className="flex items-center gap-3">
              <Rocket className="h-5 w-5 text-magenta-400" />
              <p>
                <span className="font-bold text-white">{user}</span>
                <span className="text-slate-300"> {action} </span>
                <span className="font-bold text-white">{followers} seguidores!</span>
              </p>
            </div>
          ),
          duration: 4000,
          className: 'bg-slate-800/80 backdrop-blur-sm border-magenta-500/30 text-white',
        });
      } else {
        const action = getRandomItem(coinActions);
        const coins = getRandomItem(coinPackages);
        toast({
          description: (
            <div className="flex items-center gap-3">
              <Gem className="h-5 w-5 text-cyan-400" />
              <p>
                <span className="font-bold text-white">{user}</span>
                <span className="text-slate-300"> {action} </span>
                <span className="font-bold text-white">{coins} monedas!</span>
              </p>
            </div>
          ),
          duration: 4000,
          className: 'bg-slate-800/80 backdrop-blur-sm border-cyan-500/30 text-white',
        });
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [toast]);

  return null; // This component doesn't render anything itself.
}
