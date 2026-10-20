import React from 'react';

const Par: React.FC<{
  src: string;
  alt: string;
  ancho: number;
  alto: number;
  eager?: boolean;
  className?: string;
}> = ({ src, alt, ancho, alto, eager, className = '' }) => (
  <>
    {(['light', 'dark'] as const).map((t) => (
      <img
        key={t}
        src={`/landing/${src}-${t}.jpg`}
        alt={t === 'light' ? alt : ''}
        aria-hidden={t === 'dark' ? true : undefined}
        width={ancho}
        height={alto}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className={`shot-${t} h-auto w-full ${className}`}
      />
    ))}
  </>
);

export const Captura: React.FC<{
  nombre: string;
  movil: string;
  alt: string;
  eager?: boolean;
}> = ({ nombre, movil, alt, eager }) => (
  <>
    <span className="hidden overflow-hidden rounded-[var(--r-l)] bg-[var(--surface)] sm:block">
      <Par src={nombre} alt={alt} ancho={1040} alto={800} eager={eager} />
    </span>
    <span className="mx-auto block w-64 overflow-hidden rounded-[var(--r-l)] bg-[var(--surface)] sm:hidden">
      <Par src={movil} alt={alt} ancho={390} alto={844} eager={eager} />
    </span>
  </>
);
