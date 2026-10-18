import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Choque, TipoEventoCalendario } from '../../utils/calendarConflicts';
import { ChoqueCard } from './ChoqueCard';

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
  if (choques.length === 0) return null;

  const duro = choques.some((c) => c.severidad === 'choque');
  return (
    <div
      role="alert"
      id="calendar-event-conflicts"
      className={`space-y-4 rounded-[var(--r-m)] p-4 ${duro ? 'bg-[var(--alert-soft)]' : 'bg-[var(--sunken)]'}`}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
        <AlertTriangle className={`size-4 shrink-0 ${duro ? 'text-[var(--alert)]' : 'text-[var(--ink-2)]'}`} aria-hidden="true" />
        {duro ? 'Este evento tiene un choque' : 'Ojo con este evento'}
      </div>
      {choques.map((c) => (
        <div key={c.huella} className="rounded-[var(--r-s)] bg-[var(--surface)] p-3">
          <ChoqueCard choque={c} yo={{ tipo, id: eventoId }} sinEtiqueta />
        </div>
      ))}
    </div>
  );
};
