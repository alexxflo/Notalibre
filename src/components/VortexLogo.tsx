import React from 'react';

const VortexLogo = ({ className = "w-48" }: { className?: string }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 450 140"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="VORTEX Logo"
    >
      <defs>
        <linearGradient id="vortex-main-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#c026d3" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>

        <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@900&display=swap');
          .logo-font { font-family: 'Orbitron', sans-serif; font-weight: 900; letter-spacing: 2px; }
          .subtitle-font { font-family: 'Poppins', sans-serif; font-weight: 400; letter-spacing: 1px; fill: #94a3b8; }
        `}</style>
      </defs>

      {/* Main logo text with glow */}
      <g filter="url(#neon-glow)">
        <text 
          x="50%" 
          y="85" 
          textAnchor="middle" 
          fontSize="95" 
          className="logo-font" 
          fill="url(#vortex-main-gradient)"
        >
          VORTEX
        </text>
      </g>
      
      {/* Subtitle */}
      <text 
        x="50%" 
        y="120" 
        textAnchor="middle" 
        fontSize="14" 
        className="subtitle-font"
      >
        Social Engine Protocol
      </text>
    </svg>
  );
};

export default VortexLogo;
