import React from 'react';

interface IrisPrismProps {
  className?: string;
}

export const IrisPrism: React.FC<IrisPrismProps> = ({ className = '' }) => {
  const still = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return (
    <video
      aria-hidden="true"
      className={`block w-full object-cover bg-black ${className}`}
      src="/video/iris-spectrum.mp4"
      poster="/video/iris-spectrum.jpg"
      autoPlay={!still}
      muted
      loop
      playsInline
      preload="metadata"
    />
  );
};
