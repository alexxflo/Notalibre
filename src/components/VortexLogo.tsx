import React from 'react';

const VortexLogo = ({ className = "w-48" }: { className?: string }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 400 130" 
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="VORTEX Logo"
    >
      <defs>
        <linearGradient id="cyber-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22d3ee" /> {/* Cyan Brillante */}
          <stop offset="50%" stopColor="#8b5cf6" /> {/* Violeta */}
          <stop offset="100%" stopColor="#f472b6" /> {/* Magenta */}
        </linearGradient>

        <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@900&display=swap');
          .logo-font { font-family: 'Orbitron', sans-serif; font-style: italic; }
        `}</style>
      </defs>

      <g filter="url(#neon-glow)">
        {/* Letra V Grande */}
        <text x="20" y="90" fontSize="85" className="logo-font" fill="url(#cyber-gradient)" fontWeight="900">V</text>
        
        {/* Letras OR medianas */}
        <text x="95" y="80" fontSize="55" className="logo-font" fill="white" fontWeight="900">OR</text>
        
        {/* Letra T Gigante (Central) */}
        <text x="195" y="95" fontSize="90" className="logo-font" fill="url(#cyber-gradient)" fontWeight="900" transform="rotate(-5 220 80)">T</text>
        
        {/* Letra E mediana */}
        <text x="265" y="80" fontSize="55" className="logo-font" fill="white" fontWeight="900">E</text>
        
        {/* Letra X Grande con corte */}
        <text x="315" y="90" fontSize="85" className="logo-font" fill="url(#cyber-gradient)" fontWeight="900">X</text>
      </g>
      
      {/* Subtítulo Tecnológico */}
      <text x="200" y="120" textAnchor="middle" fontSize="12" fill="#94a3b8" letterSpacing="0.4em" className="logo-font" opacity="0.8">
        SOCIAL ENGINE
      </text>
    </svg>
  );
};

export default VortexLogo;
