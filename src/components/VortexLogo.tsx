import Image from 'next/image';
import React from 'react';

const VortexLogo = ({ className }: { className?: string }) => {
  return (
    <div className={className}>
      <Image
        src="https://i.imgur.com/H48tNcf.png"
        alt="VORTEX Logo"
        fill
        style={{ objectFit: 'contain' }}
        priority
      />
    </div>
  );
};

export default VortexLogo;
