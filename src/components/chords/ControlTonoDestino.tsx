import React from 'react';
import { nombreDeNota } from '../../utils/teoriaArmonica';
import { semitonosHasta } from '../../utils/tonoDestino';

interface Props {
  /** Tónica original de la canción (0–11) y si se escribe con bemoles. */
  tonica: number;
  menor: boolean;
  bemoles: boolean;
  notation: 'ES' | 'EN';
  transpose: number;
  onTranspose: (st: number) => void;
}

/** «Esta canción está en Mi, hay que tocarla en Sol»: elige el tono destino y calcula los semitonos. */
export const ControlTonoDestino: React.FC<Props> = ({ tonica, menor, bemoles, notation, transpose, onTranspose }) => {
  const sufijo = menor ? 'm' : '';
  const destino = (((tonica + transpose) % 12) + 12) % 12;
  return (
    <label className="flex items-center gap-1 text-xs text-[var(--ink-2)]">
      <span>{nombreDeNota(tonica, bemoles, notation)}{sufijo} →</span>
      <select
        aria-label="Tono destino"
        value={destino}
        onChange={(e) => onTranspose(semitonosHasta(tonica, Number(e.target.value)))}
        className="bg-[var(--surface)] text-[var(--ink)] font-bold rounded-[var(--r-s)] px-1.5 py-0.5 cursor-pointer"
      >
        {Array.from({ length: 12 }, (_, pc) => (
          <option key={pc} value={pc}>{nombreDeNota(pc, bemoles, notation)}{sufijo}</option>
        ))}
      </select>
    </label>
  );
};
