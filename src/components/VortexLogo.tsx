import Image from 'next/image';
import React from 'react';

const VortexLogo = ({ className }: { className?: string }) => {
  return (
    <div className={className}>
      <div className="relative w-full h-full">
        <Image
          src="https://i.imgur.com/rY6YdRq.png"
          alt="VORTEX Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
};

export default VortexLogo;
