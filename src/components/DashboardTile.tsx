'use client';

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface DashboardTileProps {
  title: string;
  icon: LucideIcon;
  onClick: () => void;
  className?: string;
  size?: 'normal' | 'large';
}

export default function DashboardTile({ title, icon: Icon, onClick, className, size = 'normal' }: DashboardTileProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative rounded-lg p-4 flex flex-col justify-end items-start cursor-pointer transition-all duration-300 overflow-hidden aspect-square',
        'hover:shadow-xl hover:-translate-y-1',
        size === 'large' ? 'aspect-[2/1]' : 'aspect-square',
        className
      )}
    >
      <Icon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 text-white/5 opacity-50 transition-all duration-500 group-hover:scale-150 group-hover:rotate-12" />
      <div className="relative z-10">
        <h3 className="font-headline text-lg md:text-xl font-bold uppercase">{title}</h3>
      </div>
       <div className="absolute bottom-2 right-2 z-10 p-2 bg-black/20 rounded-full">
         <Icon className="w-5 h-5"/>
       </div>
    </div>
  );
}
