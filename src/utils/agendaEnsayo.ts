import type { RehearsalAgendaItem } from '../types';

/** Devuelve una agenda nueva con `cambios` aplicados al ítem `id` (el resto, intacto). */
export function actualizarItemAgenda(
  agenda: RehearsalAgendaItem[],
  id: string,
  cambios: Partial<RehearsalAgendaItem>,
): RehearsalAgendaItem[] {
  return agenda.map((a) => (a.id === id ? { ...a, ...cambios } : a));
}
