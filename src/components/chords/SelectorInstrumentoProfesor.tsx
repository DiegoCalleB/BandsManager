import React from 'react';
import type { InstrumentoProfesor } from '../../utils/instrumentoProfesor';

const INSTRUMENTOS_PROFESOR: Array<[InstrumentoProfesor, string]> = [['guitarra', 'Guitarra'], ['bajo', 'Bajo'], ['teclado', 'Teclado'], ['voz', 'Voz'], ['bateria', 'Batería']];

interface Props {
  valor: InstrumentoProfesor;
  onCambio: (i: InstrumentoProfesor) => void;
}

/** Instrumento al que explica el profesor: con «Batería» la pestaña deja la armonía y habla de golpes y fills. */
export const SelectorInstrumentoProfesor: React.FC<Props> = ({ valor, onCambio }) => (
  <div className="flex flex-wrap gap-1.5" role="group" aria-label="Instrumento del profesor">
    {INSTRUMENTOS_PROFESOR.map(([v, n]) => (
      <button
        key={v}
        type="button"
        aria-pressed={valor === v}
        onClick={() => onCambio(v)}
        className={`px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-bold cursor-pointer transition-ui ${valor === v ? 'bg-[var(--acc)] text-[var(--on-acc)]' : 'bg-[var(--sunken)] text-[var(--ink)] hover:bg-[var(--surface)]'}`}
      >
        {n}
      </button>
    ))}
  </div>
);
