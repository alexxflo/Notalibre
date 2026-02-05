'use client';

import { useState, useEffect } from 'react';

const TimePart = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="flip-card">
      <div className="flip-card-inner">
        <div className="flip-card-front">
          <span>{value}</span>
        </div>
        <div className="flip-card-back">
          <span>{value}</span>
        </div>
      </div>
    </div>
    <span className="text-xs text-slate-400 mt-2 font-mono uppercase tracking-widest">{label}</span>
  </div>
);

export default function MetroClock({ username }: { username: string }) {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const formatTime = (num: number) => num.toString().padStart(2, '0');

  const hours = time ? formatTime(time.getHours()) : '--';
  const minutes = time ? formatTime(time.getMinutes()) : '--';
  const seconds = time ? formatTime(time.getSeconds()) : '--';

  return (
    <div className="bg-slate-900/50 border border-slate-700/50 backdrop-blur-sm rounded-lg p-6 flex justify-between items-center w-full">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold font-headline text-white">
          Bienvenido, <span className="text-cyan-400">{username}</span>
        </h2>
        <p className="text-slate-400">¿Listo para dominar el algoritmo?</p>
      </div>
      <div className="flex items-center gap-3 md:gap-4">
        <TimePart value={hours} label="HRS" />
        <span className="text-4xl font-thin text-slate-600 -translate-y-2">:</span>
        <TimePart value={minutes} label="MIN" />
        <span className="text-4xl font-thin text-slate-600 -translate-y-2">:</span>
        <TimePart value={seconds} label="SEC" />
      </div>
    </div>
  );
}
