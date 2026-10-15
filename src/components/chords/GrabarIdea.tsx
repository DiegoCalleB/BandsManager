import React, { useState } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';
import type { FaseGrabacion, TomaGrabada } from '../../hooks/useGrabarIdea';
import { PASO_OFFSET_SEGUNDOS } from '../../utils/grabarIdea';

interface GrabarIdeaProps {
  fase: FaseGrabacion;
  segundos: number;
  toma: TomaGrabada | null;
  offset: number;
  error: string | null;
  guardando: boolean;
  /** Hay audio que grabar encima (si no, no tiene sentido ofrecerlo). */
  disponible: boolean;
  onEmpezar: () => void;
  onParar: () => void;
  onOffset: (segundos: number) => void;
  onGuardar: () => void;
  onDescartar: () => void;
}

const boton = 'flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--r-pill)] text-micro font-sans cursor-pointer transition-ui disabled:opacity-40 disabled:cursor-not-allowed';

/** «Grabar idea» del modo Ensayar: toca encima de las pistas y guarda la toma como idea de la canción. */
export const GrabarIdea: React.FC<GrabarIdeaProps> = ({
  fase, segundos, toma, offset, error, guardando, disponible, onEmpezar, onParar, onOffset, onGuardar, onDescartar,
}) => {
  const [conAuriculares, setConAuriculares] = useState(false);
  const ms = Math.round(offset * 1000);

  return (
    <div className="flex flex-wrap items-center gap-2 bg-[var(--sunken)] rounded-[var(--r-m)] px-3 py-1.5" role="group" aria-label="Grabar idea">
      {fase === 'reposo' && (
        <>
          <label className="flex items-center gap-1.5 text-micro text-[var(--ink-2)] font-sans cursor-pointer">
            <input type="checkbox" checked={conAuriculares} onChange={(e) => setConAuriculares(e.target.checked)} className="accent-[var(--acc)]" />
            Llevo auriculares
          </label>
          <button
            type="button"
            disabled={!disponible || !conAuriculares}
            onClick={onEmpezar}
            title={disponible ? 'Graba tu toma mientras suena el tema' : 'Este tema no tiene audio para tocar encima'}
            className={`${boton} bg-[var(--acc)] text-[var(--on-acc)] font-bold`}
          >
            <Mic size={14} aria-hidden="true" /> Grabar idea
          </button>
          {!conAuriculares && <span className="text-micro text-[var(--ink-3)] font-sans">Sin auriculares el micro recoge la música y la toma queda sucia.</span>}
        </>
      )}

      {fase === 'grabando' && (
        <>
          <button type="button" onClick={onParar} className={`${boton} bg-[var(--alert)] text-[var(--on-acc)] font-bold`}>
            <Square size={14} aria-hidden="true" /> Parar
          </button>
          <span className="text-micro text-[var(--ink)] font-mono" aria-live="polite">Grabando {segundos}s</span>
        </>
      )}

      {fase === 'revisando' && toma && (
        <>
          <audio src={toma.url} controls className="h-8" aria-label="Escuchar la toma" />
          <span className="flex items-center gap-1 text-micro text-[var(--ink-2)] font-sans">
            Ajuste
            <button type="button" onClick={() => onOffset(offset - PASO_OFFSET_SEGUNDOS * 5)} className={`${boton} bg-[var(--surface)] text-[var(--ink)]`} aria-label="Retrasar la toma 50 milisegundos">-50</button>
            <span className="font-mono min-w-[56px] text-center text-[var(--ink)]">{ms} ms</span>
            <button type="button" onClick={() => onOffset(offset + PASO_OFFSET_SEGUNDOS * 5)} className={`${boton} bg-[var(--surface)] text-[var(--ink)]`} aria-label="Adelantar la toma 50 milisegundos">+50</button>
          </span>
          <button type="button" disabled={guardando} onClick={onGuardar} className={`${boton} bg-[var(--acc)] text-[var(--on-acc)] font-bold`}>
            {guardando ? 'Guardando…' : 'Guardar idea'}
          </button>
          <button type="button" disabled={guardando} onClick={onDescartar} className={`${boton} text-[var(--ink-2)] hover:text-[var(--ink)]`} aria-label="Descartar la toma">
            <Trash2 size={14} aria-hidden="true" /> Descartar
          </button>
        </>
      )}

      {error && <span role="alert" className="text-micro text-[var(--alert)] font-sans">{error}</span>}
    </div>
  );
};
