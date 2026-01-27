'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Rocket } from 'lucide-react';

const fakeUsernames = [
  "CyberNomad", "PixelJunkie", "DataWhisperer", "GlitchMaster",
  "SynthWaveRider", "QuantumLeaper", "EchoSphere", "NexusSeeker",
  "ChronoHacker", "VoidSurfer", "AstroPilot", "RogueAI", "CryptoKing",
  "Biohacker", "DreamWeaver", "StarSailor"
];

const actions = [
  "acaba de conseguir", "ha ganado", "obtuvo", "logró"
];

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomFollowers = () => Math.floor(Math.random() * 50) + 1;

export default function ActivityFeed() {
  const { toast } = useToast();

  useEffect(() => {
    // This check ensures we're on the client side.
    if (typeof window === 'undefined') return;

    const intervalId = setInterval(() => {
      const user = getRandomItem(fakeUsernames);
      const action = getRandomItem(actions);
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
        // Use a duration to auto-close, and custom class for styling the toast itself
        duration: 3000,
        className: 'bg-slate-800/80 backdrop-blur-sm border-magenta-500/30 text-white',
      });
    }, 3500);

    return () => clearInterval(intervalId);
  }, [toast]);

  return null; // This component doesn't render anything itself.
}
