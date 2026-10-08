import React from 'react';
import { bucleActivo, type BucleAB } from '../../utils/bucleAB';

const BOTON = 'px-2.5 py-0.5 rounded-[var(--r-pill)] text-micro font-sans cursor-pointer transition-ui';
const ACTIVO = 'bg-[var(--acc)] text-[var(--on-acc)] font-bold';
const INACTIVO = 'text-[var(--ink-2)] hover:text-[var(--ink)]';

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Bucle A/B del Atril: marca inicio y fin en la posición actual y repite ese tramo. */
export const ControlBucle: React.FC<{
  bucle: BucleAB;
  onMarcar: (extremo: 'a' | 'b') => void;
  onLimpiar: () => void;
}> = ({ bucle, onMarcar, onLimpiar }) => (
  <div className="flex items-center gap-2" role="group" aria-label="Bucle A/B">
    <span className="flex items-center gap-1 bg-[var(--sunken)] rounded-[var(--r-pill)] p-0.5">
      <button type="button" aria-pressed={bucle.a != null} title="Marcar inicio del bucle aquí" onClick={() => onMarcar('a')} className={`${BOTON} ${bucle.a != null ? ACTIVO : INACTIVO}`}>
        A{bucle.a != null ? ` ${mmss(bucle.a)}` : ''}
      </button>
      <button type="button" aria-pressed={bucle.b != null} title="Marcar fin del bucle aquí" onClick={() => onMarcar('b')} className={`${BOTON} ${bucle.b != null ? ACTIVO : INACTIVO}`}>
        B{bucle.b != null ? ` ${mmss(bucle.b)}` : ''}
      </button>
    </span>
    {(bucle.a != null || bucle.b != null) && (
      <button type="button" onClick={onLimpiar} className="text-micro text-[var(--ink-2)] hover:text-[var(--ink)] font-sans cursor-pointer transition-ui">
        {bucleActivo(bucle) ? 'Quitar bucle' : 'Limpiar'}
      </button>
    )}
  </div>
);
