import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Chip } from '../ui';
import { describirDesdeEvento, type Choque, type TipoEventoCalendario } from '../../utils/calendarConflicts';

interface CalendarEventConflictsProps {
  choques: Choque[];
  tipo: TipoEventoCalendario;
  eventoId: string;
}

/**
 * Qué le pasa a ESTE evento: con quién se pisa o a qué no llega. Si no le pasa nada no dibuja
 * nada (un "sin conflictos" en cada ficha sería ruido).
 */
export const CalendarEventConflicts: React.FC<CalendarEventConflictsProps> = ({ choques, tipo, eventoId }) => {
  const filas = choques
    .map((c) => ({ c, texto: describirDesdeEvento(c, tipo, eventoId) }))
    .filter((f): f is { c: Choque; texto: string } => f.texto !== null);
  if (filas.length === 0) return null;

  const duro = filas.some((f) => f.c.severidad === 'choque');
  return (
    <div
      role="alert"
      id="calendar-event-conflicts"
      className={`space-y-2 rounded-[var(--r-m)] p-4 ${duro ? 'bg-[var(--alert-soft)]' : 'bg-[var(--sunken)]'}`}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
        <AlertTriangle className={`size-4 shrink-0 ${duro ? 'text-[var(--alert)]' : 'text-[var(--ink-2)]'}`} aria-hidden="true" />
        {duro ? 'Este evento tiene un choque' : 'Ojo con este evento'}
      </div>
      <ul className="space-y-1.5">
        {filas.map(({ c, texto }) => (
          <li key={c.huella} className="flex items-start gap-2 text-sm text-[var(--ink)]">
            <Chip tone={c.severidad === 'choque' ? 'alert' : 'neutral'} className="mt-0.5">
              {c.severidad === 'choque' ? 'Choque' : 'Aviso'}
            </Chip>
            <span className="min-w-0">{texto}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
