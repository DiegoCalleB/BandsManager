import React, { useState } from 'react';
import type { DiagramaEscalaDatos } from '../../utils/guiasArmonia';
import { midiDeEscala, prefiereBemoles } from '../../utils/pentagrama';
import { Pentagrama } from './Pentagrama';
import { usePentagramaSiempre } from './modoEnsayo';

interface Props extends DiagramaEscalaDatos {
  /** Nombre de una nota (pitch class absoluto) ya transpuesto y en la notación elegida. */
  nombre: (pc: number) => string;
}

/**
 * Las 12 notas en fila, empezando en la tónica: las de la escala llenas, la tónica con el color del
 * módulo y la nota que da carácter al modo en otro tono. Sirve igual para guitarra, bajo o teclado.
 */
export const DiagramaEscala: React.FC<Props> = ({ raiz, notas, distintiva, nombre }) => {
  const [siempre] = usePentagramaSiempre();
  const [manual, setManual] = useState<boolean | null>(null);
  const conNotas = manual ?? siempre;
  return (
  <>
  <div
    className="mt-2 grid grid-cols-12 gap-1"
    role="img"
    aria-label={`Escala: ${notas.map(nombre).join(', ')}`}
  >
    {Array.from({ length: 12 }, (_, i) => {
      const pc = (raiz + i) % 12;
      const dentro = notas.includes(pc);
      const clase = pc === raiz
        ? 'bg-[var(--acc)] text-[var(--bg)] font-bold'
        : pc === distintiva
          ? 'bg-[var(--ok)] text-[var(--bg)] font-bold'
          : dentro
            ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)] font-bold'
            : 'bg-[var(--surface)] text-[var(--ink-3)]';
      return (
        <span key={i} className={`flex items-center justify-center h-8 rounded-[var(--r-s)] text-[10px] leading-none ${clase}`}>
          {dentro ? nombre(pc) : ''}
        </span>
      );
    })}
  </div>
  <button type="button" aria-pressed={conNotas} onClick={() => setManual(!conNotas)} className={`mt-1 px-3 py-1 rounded-[var(--r-pill)] text-micro font-sans cursor-pointer bg-[var(--surface)] text-[var(--ink)] ${conNotas ? 'font-bold' : ''}`}>{conNotas ? 'Ocultar pentagrama' : 'Ver pentagrama'}</button>
  {conNotas && <Pentagrama midi={midiDeEscala(raiz, notas)} modo="escala" bemoles={prefiereBemoles(nombre(raiz))} etiqueta={`Pentagrama de la escala: ${notas.map(nombre).join(', ')}`} />}
  </>
  );
};
