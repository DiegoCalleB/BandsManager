import React from 'react';
import { Chip } from '../ui';
import { hhmm, type Choque } from '../../utils/calendarConflicts';
import { resumenChoque, type FilaChoque, type TramoChoque } from '../../utils/calendarConflictsResumen';

interface ChoqueCardProps {
  choque: Choque;
  /** Si se da, esa fila se marca como «Este evento» (ficha del evento). */
  yo?: { tipo: 'concierto' | 'ensayo' | 'reunion' | 'otro'; id: string };
  bandasVisibles?: Set<string>;
  /** Texto a la derecha de la cabecera, p. ej. la fecha en el banner. */
  derecha?: string;
  /** Oculta la etiqueta Choque/Aviso cuando el contenedor ya lo dice (ficha del evento). */
  sinEtiqueta?: boolean;
}

const pct = (v: number, desde: number, span: number) => `${(((v - desde) / span) * 100).toFixed(2)}%`;

/**
 * Los dos eventos como dos barras de punta redondeada sobre un mismo eje (la Onda de
 * visual-identity §2): se ve de un vistazo cuánto se pisan, o cuánto aire hay entre ellos.
 */
function Tramo({ tramo }: { tramo: TramoChoque }) {
  // Eje de hora en hora, con media hora de aire; al menos 3 h para que no salgan barras gigantes
  const desde = Math.floor((tramo.desde - 30) / 60) * 60;
  const hasta = Math.max(Math.ceil((tramo.hasta + 30) / 60) * 60, desde + 180);
  const span = hasta - desde;
  const barra = (rango: [number, number], color: string) => (
    <div className="relative h-2 rounded-full bg-[var(--sunken)]">
      <div
        className="absolute inset-y-0 rounded-full"
        style={{ left: pct(rango[0], desde, span), width: `${(((rango[1] - rango[0]) / span) * 100).toFixed(2)}%`, background: color }}
      />
      {tramo.solape && (
        <div
          className="absolute inset-y-0 rounded-full bg-[var(--alert)]"
          style={{
            left: pct(Math.max(tramo.solape[0], rango[0]), desde, span),
            width: `${(((Math.min(tramo.solape[1], rango[1]) - Math.max(tramo.solape[0], rango[0])) / span) * 100).toFixed(2)}%`,
          }}
        />
      )}
    </div>
  );
  return (
    <div className="space-y-1" aria-hidden="true">
      {barra(tramo.a, 'var(--ink-3)')}
      {barra(tramo.b, 'var(--ink-3)')}
      <div className="flex justify-between text-micro tabular-nums text-[var(--ink-3)]">
        <span>{hhmm(desde)}</span>
        <span>{hhmm(hasta)}</span>
      </div>
    </div>
  );
}

function Fila({ f }: { f: FilaChoque }) {
  return (
    <li className="flex items-baseline gap-2 text-sm">
      <span className="w-16 shrink-0 text-xs text-[var(--ink-2)]">{f.esteEvento ? 'Este' : f.tipo}</span>
      <span className="min-w-0 flex-1">
        <span className={`font-semibold text-[var(--ink)] ${f.oculto ? 'font-normal italic text-[var(--ink-2)]' : ''}`}>{f.titulo}</span>
        {f.lugar && <span className="text-[var(--ink-2)]"> · {f.lugar}</span>}
      </span>
      {f.horas && <span className="shrink-0 tabular-nums text-[var(--ink-2)]">{f.horas}</span>}
    </li>
  );
}

/** Un choque o aviso del calendario: titular, los dos eventos y, si hay horas, cómo se colocan. */
export const ChoqueCard: React.FC<ChoqueCardProps> = ({ choque, yo, bandasVisibles, derecha, sinEtiqueta }) => {
  const r = resumenChoque(choque, { bandasVisibles, yo });
  const duro = choque.severidad === 'choque';
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        {!sinEtiqueta && <Chip tone={duro ? 'alert' : 'neutral'}>{duro ? 'Choque' : 'Aviso'}</Chip>}
        <span className="min-w-0 flex-1 text-sm font-semibold text-[var(--ink)]">{r.titular}</span>
        {derecha && <span className="shrink-0 text-xs text-[var(--ink-2)]">{derecha}</span>}
      </div>
      <ul className="space-y-1">
        <Fila f={r.filas[0]} />
        <Fila f={r.filas[1]} />
      </ul>
      {r.tramo && <Tramo tramo={r.tramo} />}
    </div>
  );
};
