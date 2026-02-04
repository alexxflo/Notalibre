'use client';

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface InfoTileProps {
  title: string;
  value: string;
  icon: LucideIcon;
  className?: string;
}

export default function InfoTile({ title, value, icon: Icon, className }: InfoTileProps) {
  return (
    <div
      className={cn(
        'group relative rounded-lg p-4 flex flex-col justify-between cursor-default transition-all duration-300 overflow-hidden aspect-square',
        className
      )}
    >
        <div className="flex justify-between items-start">
            <h3 className="font-headline text-sm font-bold uppercase text-white/70">{title}</h3>
            <Icon className="w-5 h-5 text-white/50 group-hover:text-white/80 transition-colors" />
        </div>

        <div className="text-right">
            <p className="text-4xl font-bold font-mono">{value}</p>
        </div>
    </div>
  );
}
