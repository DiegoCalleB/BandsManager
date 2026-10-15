import React from 'react';
import type { AudioTrack } from '../../types';
import { alternarSilencio, alternarSolo, pistaConAjuste, type AjustesPistas } from '../../utils/mezclaStems';

const BOTON = 'w-6 h-6 rounded-[var(--r-s)] text-micro font-bold font-sans cursor-pointer transition-ui';
const ACTIVO = 'bg-[var(--acc)] text-[var(--on-acc)]';
const INACTIVO = 'bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]';

/** Mezclador por pista del Atril: silenciar, solo y volumen de cada stem que está sonando. */
export const MezclaPistas: React.FC<{
  pistas: AudioTrack[];
  ajustes: AjustesPistas;
  onAjustes: (a: AjustesPistas) => void;
}> = ({ pistas, ajustes, onAjustes }) => {
  if (pistas.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1.5" aria-label="Mezcla de pistas">
      {pistas.map((p) => {
        const e = pistaConAjuste(p, ajustes);
        return (
          <li key={p.id} className="flex items-center gap-2">
            <span className="w-24 truncate text-micro text-[var(--ink)] font-sans" title={p.nombre}>{p.nombre}</span>
            <button
              type="button"
              aria-pressed={!!e.muted}
              aria-label={`Silenciar ${p.nombre}`}
              title="Silenciar"
              onClick={() => onAjustes(alternarSilencio(ajustes, p.id))}
              className={`${BOTON} ${e.muted ? ACTIVO : INACTIVO}`}
            >
              M
            </button>
            <button
              type="button"
              aria-pressed={!!e.solo}
              aria-label={`Solo ${p.nombre}`}
              title="Solo"
              onClick={() => onAjustes(alternarSolo(ajustes, pistas, p.id))}
              className={`${BOTON} ${e.solo ? ACTIVO : INACTIVO}`}
            >
              S
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={e.volumen ?? 1}
              aria-label={`Volumen de ${p.nombre}`}
              onChange={(ev) => onAjustes({ ...ajustes, [p.id]: { ...ajustes[p.id], volumen: Number(ev.target.value) } })}
              className="flex-1 min-w-[80px] accent-[var(--acc)] cursor-pointer"
            />
          </li>
        );
      })}
    </ul>
  );
};
