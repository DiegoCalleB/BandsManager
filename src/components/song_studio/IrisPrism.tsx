import React from 'react';

const SRC = '/video/iris-spectrum-loop.mp4';
const POSTER = '/video/iris-spectrum-loop.jpg';

// Calienta la caché del navegador para que el vídeo arranque al instante cuando empieza la separación.
if (typeof window !== 'undefined') {
  const warm = () => void fetch(SRC).catch(() => {});
  if ('requestIdleCallback' in window) window.requestIdleCallback(warm);
  else setTimeout(warm, 2000);
}

interface IrisPrismProps {
  className?: string;
}

export const IrisPrism: React.FC<IrisPrismProps> = ({ className = '' }) => {
  const still = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return (
    <video
      aria-hidden="true"
      className={`block w-full object-cover bg-black ${className}`}
      src={SRC}
      poster={POSTER}
      autoPlay={!still}
      muted
      loop
      playsInline
      preload="auto"
    />
  );
};
