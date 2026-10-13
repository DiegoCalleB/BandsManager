import React from 'react';
import type { Alto, Ancho } from '../../utils/redimensionarWidget';

const ANCHOS_BOTON: Array<{ span: Ancho; w: number; label: string }> = [
  { span: 4, w: 6, label: 'Estrecho' },
  { span: 6, w: 10, label: 'Mitad' },
  { span: 12, w: 14, label: 'Completo' },
];
const ALTOS_BOTON: Array<{ val: Alto; h: number; label: string }> = [
  { val: 'compact', h: 6, label: 'Bajo' },
  { val: 'normal', h: 10, label: 'Medio' },
  { val: 'tall', h: 14, label: 'Alto' },
];

interface ControlesTamanoProps {
  wSpan: number;
  hSpan?: Alto;
  onAncho: (span: Ancho) => void;
  onAlto: (val: Alto) => void;
}

const claseBoton = (activo: boolean) =>
  `p-1.5 rounded transition-ui cursor-pointer flex items-center justify-center ${activo ? 'bg-[var(--acc)]' : 'hover:bg-[var(--sunken)]'}`;
const claseBarra = (activo: boolean) => (activo ? 'bg-[var(--on-acc)]' : 'bg-[var(--ink-2)]');

/**
 * Botones de ancho y alto de la barra de edición de un widget: atajos a los tamaños más usados.
 * Solo tres anchos: más botones parten la barra en varias filas en los widgets estrechos. Los
 * demás tamaños (un cuarto, dos tercios) se eligen con el tirador de la esquina o el teclado.
 */
export function ControlesTamano({ wSpan, hSpan = 'normal', onAncho, onAlto }: ControlesTamanoProps) {
  return (
    <>
      <div className="flex items-center gap-1 bg-[var(--surface)]/80 p-0.5 rounded-[var(--r-s)]">
        {ANCHOS_BOTON.map(({ span, w, label }) => (
          <button key={span} type="button" onClick={() => onAncho(span)} title={label} aria-label={`Ancho: ${label}`} aria-pressed={wSpan === span} className={claseBoton(wSpan === span)}>
            <span className={`block h-2.5 rounded-[2px] ${claseBarra(wSpan === span)}`} style={{ width: w }} />
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1 bg-[var(--surface)]/80 p-0.5 rounded-[var(--r-s)]">
        {ALTOS_BOTON.map(({ val, h, label }) => (
          <button key={val} type="button" onClick={() => onAlto(val)} title={label} aria-label={`Alto: ${label}`} aria-pressed={hSpan === val} className={claseBoton(hSpan === val)}>
            <span className={`block w-2.5 rounded-[2px] ${claseBarra(hSpan === val)}`} style={{ height: h }} />
          </button>
        ))}
      </div>
    </>
  );
}
