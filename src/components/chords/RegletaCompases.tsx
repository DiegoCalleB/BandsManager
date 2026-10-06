import React, { useEffect, useRef } from 'react';
import type { Cuadricula, PosicionEnCuadricula } from '../../utils/cuadriculaCompases';

interface Props {
  cuadricula: Cuadricula;
  posicion: PosicionEnCuadricula | null;
  /** Nombre ya formateado (transposición y notación) de un acorde. */
  nombre: (acorde: string) => string;
  seguir: boolean;
  onIr: (segundos: number) => void;
}

/**
 * Regleta de compases agrupados en bloques (A, B…): cada celda es un compás con su número y sus
 * acordes, el compás actual se va llenando y los bloques con la misma progresión comparten letra
 * (verso A, estribillo B…). Tocar un compás salta a él.
 */
export const RegletaCompases: React.FC<Props> = ({ cuadricula, posicion, nombre, seguir, onIr }) => {
  const carril = useRef<HTMLDivElement>(null);
  const celdas = useRef<(HTMLButtonElement | null)[]>([]);
  const compasActual = posicion?.compas ?? -1;

  useEffect(() => {
    const c = carril.current;
    const celda = celdas.current[compasActual - 1];
    if (!seguir || !c || !celda) return;
    c.scrollTo({ left: celda.offsetLeft - c.clientWidth / 2 + celda.clientWidth / 2, behavior: 'smooth' });
  }, [compasActual, seguir]);

  return (
    <div ref={carril} translate="no" className="notranslate flex gap-3 overflow-x-auto pb-1 shrink-0" aria-label="Compases y bloques">
      {cuadricula.bloques.map((b) => (
        <div key={b.indice} className="shrink-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="px-1.5 rounded bg-[var(--acc-soft)] text-[var(--acc-ink)] text-micro font-bold leading-4">{b.letra}</span>
            <span className="text-micro text-[var(--ink-2)]">compases {b.desde}–{b.hasta}</span>
          </div>
          <div className="flex gap-0.5">
            {cuadricula.compases.slice(b.desde - 1, b.hasta).map((c) => {
              const activo = c.n === compasActual;
              const acordes = c.acordes.filter((a, i, v) => i === 0 || a !== v[i - 1]);
              return (
                <button
                  key={c.n}
                  ref={(el) => { celdas.current[c.n - 1] = el; }}
                  type="button"
                  onClick={() => onIr(c.t0)}
                  title={`Compás ${c.n} · bloque ${b.letra}`}
                  className={`relative overflow-hidden min-w-[46px] px-1.5 py-1 rounded-[var(--r-s)] text-left cursor-pointer transition-ui ${activo ? 'bg-[var(--acc-soft)] ring-2 ring-[var(--acc)]' : 'bg-[var(--surface)] hover:bg-[var(--acc-soft)]/60'}`}
                >
                  {activo && posicion && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 bg-[var(--acc)]/25"
                      style={{ width: `${(((posicion.tiempo - 1) + posicion.fraccionPulso) / cuadricula.tiemposPorCompas) * 100}%` }}
                    />
                  )}
                  <span className="relative block text-micro text-[var(--ink-2)] leading-none">{c.n}</span>
                  <span className="relative block text-xs font-bold font-mono text-[var(--ink)] leading-tight whitespace-nowrap">
                    {acordes.map((a) => (a === 'N' ? '—' : nombre(a))).join('·')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
