import React from 'react';
import type { AudioTrack } from '../../types';
import type { ModoEscucha } from '../../utils/mezclaStems';

const OPCIONES: Array<{ modo: ModoEscucha; texto: string; ayuda: string }> = [
  { modo: 'todo', texto: 'Todo', ayuda: 'El tema completo' },
  { modo: 'solo', texto: 'Solo mi pista', ayuda: 'Escuchar únicamente tu instrumento' },
  { modo: 'sin', texto: 'Sin mi pista', ayuda: 'Todo el tema menos tu instrumento, para tocar encima' },
];

/** Interruptor de escucha con los stems de Iris: todo · solo mi pista · todo menos mi pista. */
export const SelectorEscucha: React.FC<{
  modo: ModoEscucha;
  onModo: (m: ModoEscucha) => void;
  pistas: AudioTrack[];
  miId: string | null;
  onMiPista: (id: string) => void;
}> = ({ modo, onModo, pistas, miId, onMiPista }) => (
  <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Qué escuchar del tema">
    <span className="flex items-center gap-1 bg-[var(--sunken)] rounded-[var(--r-pill)] p-0.5">
      {OPCIONES.map((o) => (
        <button
          key={o.modo}
          type="button"
          aria-pressed={o.modo === modo}
          title={o.ayuda}
          disabled={o.modo !== 'todo' && !miId}
          onClick={() => onModo(o.modo)}
          className={`px-2.5 py-0.5 rounded-[var(--r-pill)] text-micro font-sans cursor-pointer transition-ui disabled:opacity-40 disabled:cursor-not-allowed ${o.modo === modo ? 'bg-[var(--acc)] text-[var(--on-acc)] font-bold' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'}`}
        >
          {o.texto}
        </button>
      ))}
    </span>
    <label className="flex items-center gap-1.5 text-micro text-[var(--ink-2)] font-sans">
      Mi pista
      <select
        value={miId ?? ''}
        onChange={(e) => onMiPista(e.target.value)}
        className="bg-[var(--sunken)] text-[var(--ink)] rounded-[var(--r-s)] px-1.5 py-0.5 text-micro"
      >
        {!miId && <option value="">Elige…</option>}
        {pistas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
      </select>
    </label>
  </div>
);
