import type { Rehearsal, RehearsalAgendaItem } from '../../types';
import { useSeguimientoEnsayo } from '../../hooks/useSeguimientoEnsayo';
import { ShowIcon } from '../ui/ShowIcon';
import { BotonesEvaluacion } from './BotonesEvaluacion';
import { formatTime } from './EnsayoCronometro';

/**
 * Barra de ensayo del visor en vivo: cronómetro de la pista, evaluación de 1 toque y nota de
 * enfoque. Se monta solo cuando el visor se abre desde un ensayo, así que el cronómetro no
 * corre en un concierto.
 */
export function BarraSeguimientoEnsayo({
  agenda,
  itemId,
  onUpdateRehearsal,
}: {
  agenda: RehearsalAgendaItem[];
  itemId: string | undefined;
  onUpdateRehearsal: (cambios: Partial<Rehearsal>) => void;
}) {
  const currentItem = agenda.find((i) => i.id === itemId) ?? null;
  const { trackSeconds, handleSetEvaluation, handleUpdateCurrentNote } = useSeguimientoEnsayo({
    agenda,
    currentItem,
    claveDePista: itemId,
    onUpdateRehearsal,
  });

  if (!currentItem) return null;
  return (
    <div className="flex items-center gap-2" data-testid="barra-seguimiento-ensayo">
      <span className="shrink-0 text-xs font-sans font-bold text-[var(--ink)] tabular-nums">
        <ShowIcon inline emoji="⏱" />
        {formatTime(trackSeconds)}
      </span>
      <BotonesEvaluacion compacto actual={currentItem.evaluacion} onElegir={handleSetEvaluation} />
      <input
        value={currentItem.enfoque ?? ''}
        onChange={(e) => handleUpdateCurrentNote(e.target.value)}
        placeholder="Nota de enfoque"
        aria-label="Nota de enfoque"
        className="min-w-0 flex-1 px-3 py-1.5 rounded-[var(--r-pill)] bg-[var(--sunken)] text-[var(--ink)] text-xs font-sans"
      />
    </div>
  );
}
