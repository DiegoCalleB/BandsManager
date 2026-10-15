import React from 'react';
import { VELOCIDADES_ATRIL } from '../../utils/mezclaGuardada';

/** Velocidad de práctica del Atril (el tono se mantiene): 50% · 75% · 100%. */
export const ControlVelocidad: React.FC<{ velocidad: number; onVelocidad: (v: number) => void }> = ({ velocidad, onVelocidad }) => (
  <span className="flex items-center gap-1 bg-[var(--sunken)] rounded-[var(--r-pill)] p-0.5" role="group" aria-label="Velocidad">
    {VELOCIDADES_ATRIL.map((v) => (
      <button
        key={v}
        type="button"
        aria-pressed={v === velocidad}
        onClick={() => onVelocidad(v)}
        className={`px-2.5 py-0.5 rounded-[var(--r-pill)] text-micro font-sans cursor-pointer transition-ui ${v === velocidad ? 'bg-[var(--acc)] text-[var(--on-acc)] font-bold' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'}`}
      >
        {Math.round(v * 100)}%
      </button>
    ))}
  </span>
);
