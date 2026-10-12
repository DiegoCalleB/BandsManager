import { useEffect, useState } from 'react';
import type { Rehearsal, RehearsalAgendaItem } from '../types';
import { actualizarItemAgenda } from '../utils/agendaEnsayo';

export type EvaluacionPista = 'bordada' | 'regular' | 'repetir';

/**
 * Seguimiento del ensayo sobre la pista actual: cronómetro (se reinicia y arranca al cambiar de
 * pista o de BPM), evaluación de 1 toque y nota de enfoque. Escribe en `rehearsal.agenda`.
 */
export function useSeguimientoEnsayo(opts: {
  agenda: RehearsalAgendaItem[];
  currentItem: RehearsalAgendaItem | null;
  /** Cambia → el cronómetro vuelve a 0 y arranca. */
  claveDePista: unknown;
  onUpdateRehearsal: (cambios: Partial<Rehearsal>) => void;
}) {
  const { agenda, currentItem, claveDePista, onUpdateRehearsal } = opts;
  const [trackSeconds, setTrackSeconds] = useState(0);
  // El cronómetro de pista arranca solo y vuelve a cero al cambiar de pista (ajuste en render).
  const [isTrackTimerActive, setIsTrackTimerActive] = useState(true);
  const [clavePrevia, setClavePrevia] = useState(claveDePista);
  if (claveDePista !== clavePrevia) {
    setClavePrevia(claveDePista);
    setTrackSeconds(0);
    setIsTrackTimerActive(true);
  }

  useEffect(() => {
    if (!isTrackTimerActive) return;
    const id = window.setInterval(() => setTrackSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isTrackTimerActive]);

  const cambiarItemActual = (cambios: Partial<RehearsalAgendaItem>) => {
    if (!currentItem) return;
    onUpdateRehearsal({ agenda: actualizarItemAgenda(agenda, currentItem.id, cambios) });
  };

  return {
    trackSeconds,
    isTrackTimerActive,
    handleSetEvaluation: (evaluacion: EvaluacionPista) => cambiarItemActual({ evaluacion }),
    handleUpdateCurrentNote: (nota: string) => cambiarItemActual({ enfoque: nota }),
  };
}
