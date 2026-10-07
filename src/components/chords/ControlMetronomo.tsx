import React from 'react';
import { Minus, Plus } from 'lucide-react';
import type { Metronomo } from '../../hooks/useMetronomo';

/** Clic de metrónomo con el tempo de la canción y ajuste fino de BPM, en el mismo estilo que el autoscroll. */
export const ControlMetronomo: React.FC<{ metronomo: Metronomo }> = ({ metronomo: m }) => (
  <div className="flex items-center gap-1.5 bg-[var(--sunken)] px-2 py-1 rounded-[var(--r-m)]">
    <button
      type="button"
      onClick={m.alternar}
      aria-pressed={m.activo}
      title="Activar o parar el clic del metrónomo"
      className={`px-2.5 py-0.5 rounded-[var(--r-pill)] text-xs font-sans font-bold flex items-center gap-1 transition-ui cursor-pointer ${m.activo ? 'bg-[var(--ok)] text-[var(--on-ok)]' : 'bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)]'}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${m.activo && m.pulso === 0 ? 'bg-[var(--on-ok)]' : 'bg-current opacity-50'}`} />
      <span>{m.activo ? 'Parar clic' : 'Clic'}</span>
    </button>
    <span className="flex items-center gap-0.5" role="group" aria-label="Tempo del clic">
      <button type="button" aria-label="Bajar un BPM" onClick={() => m.setBpm(m.bpm - 1)} className="w-5 h-5 grid place-items-center rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer transition-ui"><Minus className="w-3 h-3" /></button>
      <span className="text-micro font-sans font-bold text-[var(--ink)] tabular-nums min-w-[3.2rem] text-center">{m.bpm} BPM</span>
      <button type="button" aria-label="Subir un BPM" onClick={() => m.setBpm(m.bpm + 1)} className="w-5 h-5 grid place-items-center rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer transition-ui"><Plus className="w-3 h-3" /></button>
    </span>
  </div>
);
