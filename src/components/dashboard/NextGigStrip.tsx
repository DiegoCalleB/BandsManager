import React from 'react';
import { ChevronRight, Mic } from 'lucide-react';
import type { Concert } from '../../types';
import { diasHasta, formatearCuentaAtras } from './ExecutiveSummaryHero';

interface NextGigStripProps {
  concerts: Concert[];
  onNavigate?: (view: string) => void;
}

/**
 * Lo primero que mira un músico al abrir la app en el móvil: cuándo y dónde es el próximo bolo, y si
 * le deben dinero. Una línea, fija arriba mientras se hace scroll. En escritorio ya lo cubre el
 * Resumen Ejecutivo, por eso solo aparece en pantallas estrechas. Si no hay bolo, no ocupa sitio.
 */
export const NextGigStrip: React.FC<NextGigStripProps> = ({ concerts, onNavigate }) => {
  const hoy = new Date().toISOString().slice(0, 10);
  const proximo = concerts
    .filter((c) => c.fecha >= hoy && !c.is_posible)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
  if (!proximo) return null;

  const porCobrar = concerts
    .filter((c) => c.fecha < hoy && c.estado_pago !== 'pagado')
    .reduce((suma, c) => suma + (c.cache || 0), 0);

  return (
    <div className="pin-top lg:hidden">
      <button
        type="button"
        onClick={() => onNavigate?.('calendario')}
        className="flex w-full min-h-12 cursor-pointer items-center gap-3 rounded-[var(--r-m)] bg-[var(--surface)] px-3.5 py-2 text-left transition-ui active:scale-[0.99]"
        aria-label={`Próximo bolo: ${formatearCuentaAtras(diasHasta(proximo.fecha))}, ${proximo.sala}, ${proximo.ciudad}. Abrir calendario`}
      >
        <Mic aria-hidden className="size-4 shrink-0 text-[var(--acc)]" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-[var(--ink)]">
            Próximo bolo · {formatearCuentaAtras(diasHasta(proximo.fecha))}
          </span>
          <span className="block truncate text-xs text-[var(--ink-2)]">
            {proximo.sala}
            {proximo.ciudad ? ` · ${proximo.ciudad}` : ''}
            {porCobrar > 0 ? ` · Por cobrar ${porCobrar.toLocaleString('es-ES')} €` : ''}
          </span>
        </span>
        <ChevronRight aria-hidden className="size-4 shrink-0 text-[var(--ink-3)]" />
      </button>
    </div>
  );
};
