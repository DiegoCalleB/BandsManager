import { useState } from 'react';
import { logoDeSala } from '../../../utils/logoDeSala';

interface LogoSalaProps {
  nombre: string;
  website: string | null;
  className?: string;
}

/** Logo de la sala (el icono de su web) o, si no hay o no carga, un círculo con su inicial. */
export function LogoSala({ nombre, website, className = 'h-10 w-10' }: LogoSalaProps) {
  const url = logoDeSala(website);
  // El icono que falló se recuerda por url: al cambiar la sala vuelve a intentarse.
  const [fallida, setFallida] = useState<string | null>(null);
  const inicial = (nombre.trim().match(/\p{L}|\p{N}/u)?.[0] ?? '·').toUpperCase();

  return (
    <span aria-hidden className={`flex shrink-0 items-center justify-center overflow-hidden rounded-[var(--r-pill)] bg-[var(--sunken)] ${className}`}>
      {url && fallida !== url ? (
        <img src={url} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" onError={() => setFallida(url)} />
      ) : (
        <span className="text-sm font-semibold text-[var(--ink-2)]">{inicial}</span>
      )}
    </span>
  );
}
