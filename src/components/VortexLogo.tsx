import React from 'react';

const VortexLogo = ({ className }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 400 100"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="VORTEX Logo"
    >
      <defs>
        <linearGradient id="vortex-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--secondary))" />
        </linearGradient>
         <filter id="vortex-glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        </filter>
      </defs>

      {/* The glow layer */}
      <text 
        x="50%" 
        y="65" 
        textAnchor="middle" 
        fontSize="80" 
        className="font-logo"
        fontWeight="900"
        fill="url(#vortex-gradient)" 
        letterSpacing="-0.02em"
        style={{ fontStyle: 'italic' }}
        filter="url(#vortex-glow)"
        opacity="0.7"
      >
        VORTEX
      </text>

      {/* The main text layer */}
      <text 
        x="50%" 
        y="65" 
        textAnchor="middle" 
        fontSize="80" 
        className="font-logo"
        fontWeight="900"
        fill="url(#vortex-gradient)"
        letterSpacing="-0.02em"
        style={{ fontStyle: 'italic' }}
      >
        VORTEX
      </text>
      
      {/* Subtitle */}
      <text 
        x="50%" 
        y="90" 
        textAnchor="middle" 
        fontSize="12" 
        fill="hsl(var(--muted-foreground))"
        letterSpacing="0.2em" 
        className="font-logo"
        style={{ fontWeight: 400, fontStyle: 'normal' }}
      >
        SOCIAL ENGINE PROTOCOL
      </text>
    </svg>
  );
};

export default VortexLogo;
