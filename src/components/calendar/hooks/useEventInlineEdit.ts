/**
 * Conciertos y ensayos abiertos en la ficha con su borrador editable (se reinicia al cambiar de evento).
 * Extraído de CalendarView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useEffect, useState } from "react";
import { Concert, Rehearsal } from "../../../types";

/**
 * Conciertos y ensayos abiertos en la ficha con su borrador editable (se reinicia al cambiar de evento).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useEventInlineEdit() {
  // Ficha del concierto: ver / editar un concierto ya creado
  const [viewingConcert, setViewingConcert] = useState<Concert | null>(null);

  const [editDraft, setEditDraft] = useState<Concert | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- el borrador se reinicia al abrir otro concierto
    setEditDraft(viewingConcert ? { ...viewingConcert } : null);
  }, [viewingConcert]);

  // Ficha del ensayo: ver / editar un ensayo ya creado
  const [viewingRehearsal, setViewingRehearsal] = useState<Rehearsal | null>(null);

  const [editRehearsalDraft, setEditRehearsalDraft] = useState<Rehearsal | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- el borrador se reinicia al abrir otro ensayo
    setEditRehearsalDraft(viewingRehearsal ? { ...viewingRehearsal } : null);
  }, [viewingRehearsal]);

  return { setViewingConcert, setViewingRehearsal, viewingConcert, editDraft, setEditDraft, viewingRehearsal, editRehearsalDraft, setEditRehearsalDraft };
}
