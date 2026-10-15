import React, { useState } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';
import { Chip } from '../ui';
import { describirChoque, type Choque } from '../../utils/calendarConflicts';

interface CalendarConflictsBannerProps {
  choques: Choque[];
  /** Lleva el calendario al día del choque (YYYY-MM-DD). */
  onSelectDate: (fecha: string) => void;
}

const MAX_VISIBLES = 8;

function fechaCorta(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}

/**
 * Aviso de choques sobre el calendario. No dibuja nada si el calendario está limpio: un banner
 * vacío que diga "todo bien" es ruido. Cerrado ocupa una línea; la lista vive detrás de un clic.
 */
export const CalendarConflictsBanner: React.FC<CalendarConflictsBannerProps> = ({ choques, onSelectDate }) => {
  const [abierto, setAbierto] = useState(false);
  if (choques.length === 0) return null;

  const duros = choques.filter((c) => c.severidad === 'choque').length;
  const titulo =
    duros > 0
      ? duros === 1
        ? 'Hay un choque en tu calendario'
        : `Hay ${duros} choques en tu calendario`
      : choques.length === 1
        ? 'Un aviso en tu calendario'
        : `${choques.length} avisos en tu calendario`;

  return (
    <div
      id="calendar-conflicts-banner"
      className={`mb-4 rounded-[var(--r-m)] ${duros > 0 ? 'bg-[var(--alert-soft)]' : 'bg-[var(--sunken)]'} text-[var(--ink)]`}
    >
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-controls="calendar-conflicts-list"
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium"
      >
        <AlertCircle className={`h-4 w-4 shrink-0 ${duros > 0 ? 'text-[var(--alert)]' : 'text-[var(--ink-2)]'}`} />
        <span className="flex-1 min-w-0 truncate">{titulo}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--ink-2)] transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>

      {abierto && (
        <ul id="calendar-conflicts-list" className="flex max-h-72 flex-col gap-1 overflow-y-auto px-2 pb-2">
          {choques.slice(0, MAX_VISIBLES).map((c) => (
            <li key={c.huella}>
              <button
                type="button"
                onClick={() => onSelectDate(c.fecha)}
                className="flex w-full flex-col gap-1 rounded-[var(--r-s)] bg-[var(--surface)] px-3 py-2 text-left text-sm hover:bg-[var(--sunken)]"
              >
                <span className="flex items-center gap-2">
                  <Chip tone={c.severidad === 'choque' ? 'alert' : 'neutral'}>
                    {c.severidad === 'choque' ? 'Choque' : 'Aviso'}
                  </Chip>
                  <span className="text-xs font-medium text-[var(--ink-2)]">{fechaCorta(c.fecha)}</span>
                </span>
                <span className="text-[var(--ink)]">{describirChoque(c)}</span>
              </button>
            </li>
          ))}
          {choques.length > MAX_VISIBLES && (
            <li className="px-3 py-1 text-xs text-[var(--ink-2)]">
              y {choques.length - MAX_VISIBLES} más, por orden de fecha
            </li>
          )}
        </ul>
      )}
    </div>
  );
};
