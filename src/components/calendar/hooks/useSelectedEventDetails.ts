/**
 * Evento(s) del día seleccionado y datos derivados para la ficha.
 * Extraído de CalendarView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import type { Setlist } from "../../../types";
import { Concert, Rehearsal } from "../../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface SelectedEventDetailsParams {
  filteredConcerts: Concert[];
  filteredRehearsals: Rehearsal[];
  selectedDateKey: string;
  selectedEventId: string;
  availableSetlists: Setlist[];
}

/**
 * Evento(s) del día seleccionado y datos derivados para la ficha.
 * @param params Estado y callbacks del contenedor ({@link SelectedEventDetailsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useSelectedEventDetails({ filteredConcerts, filteredRehearsals, selectedDateKey, selectedEventId, availableSetlists }: SelectedEventDetailsParams) {
  // Month generator with navigation
  const weekdays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  // Helper function to get events for any date string"YYYY-MM-DD"
  const getEventsForDateStr = (formattedDate: string) => {
    const dayConcerts = filteredConcerts.filter((c) => c.fecha === formattedDate);
    const dayRehearsals = filteredRehearsals.filter((r) => r.fecha === formattedDate);
    return { concerts: dayConcerts, rehearsals: dayRehearsals };
  };

  // Get current event for the selected day
  const selectedEvents = getEventsForDateStr(selectedDateKey);

  // Lista combinada del día, para el selector de eventos cuando hay más de uno (2 conciertos, o
  // concierto + ensayo). El orden importa poco aquí: solo hace falta encontrar cuál es"el activo".
  const dayEventsList: Array<{
    kind: 'concert' | 'rehearsal' | 'reunion';
    id: string;
    label: string;
  }> = [
    ...selectedEvents.concerts.map((c) => ({
      kind: 'concert' as const,
      id: c.id,
      label: `Concierto: ${c.sala}`,
    })),
    ...selectedEvents.rehearsals.map((r) => ({
      kind: (r.tipo_evento === 'reunion' ? 'reunion' : 'rehearsal') as 'reunion' | 'rehearsal',
      id: r.id,
      label: r.tipo_evento === 'reunion' ? `Reunión: ${r.asunto || r.lugar}` : `Ensayo: ${r.lugar.split(',')[0]}`,
    })),
  ];

  const hasMultipleDayEvents = dayEventsList.length > 1;

  // El evento activo es el que se eligió explícitamente (chip del selector, o deep-link por
  // initialSelectedEventId) si sigue existiendo hoy; si no hay elección o no encaja, el primero
  // del día, igual que el comportamiento de siempre cuando solo hay un evento.
  const activeDayEventId = selectedEventId && dayEventsList.some((e) => e.id === selectedEventId) ? selectedEventId : dayEventsList[0]?.id;

  const selectedConcert = selectedEvents.concerts.find((c) => c.id === activeDayEventId);

  const selectedRehearsal = selectedEvents.rehearsals.find((r) => r.id === activeDayEventId);

  const currentRehearsal = selectedRehearsal;

  const isGeneralRehearsal =
    currentRehearsal &&
    (currentRehearsal.notas.toLowerCase().includes('general') || currentRehearsal.lugar.toLowerCase().includes('general'));

  const rehearsalTypeLabel = isGeneralRehearsal ? 'Ensayo General' : 'Ensayo';

  const isReunion = selectedRehearsal?.tipo_evento === 'reunion';

  const selectedEventTitle = selectedConcert
    ? `Concierto: ${selectedConcert.sala}`
    : selectedRehearsal
      ? isReunion
        ? `Reunión: ${selectedRehearsal.asunto || 'Reunión de Banda'}`
        : `${rehearsalTypeLabel}: ${selectedRehearsal.lugar.split(',')[0]}`
      : `Día Libre`;

  const currentSetlistId = selectedConcert?.setlistId || selectedRehearsal?.setlistId;

  const assignedSetlist = availableSetlists.find((s) => s.id === currentSetlistId);

  const selectedEventDetails = selectedConcert
    ? {
        type: 'concert',
        time: '21:30',
        lugar: `${selectedConcert.sala}, ${selectedConcert.ciudad}`,
        direccion: selectedConcert.direccion,
        fee: `${selectedConcert.cache} € (Caché Pactado)`,
        notes: selectedConcert.notas,
        locationQuery: selectedConcert.direccion || `${selectedConcert.sala}, ${selectedConcert.ciudad}`,
        entradasUrl: selectedConcert.entradasUrl,
        entradasLugarFisico: selectedConcert.entradasLugarFisico,
      }
    : selectedRehearsal
      ? {
          type: isReunion ? 'reunion' : isGeneralRehearsal ? 'rehearsal_general' : 'rehearsal',
          time: selectedRehearsal.hora,
          lugar: selectedRehearsal.lugar,
          asunto: selectedRehearsal.asunto,
          enlace_reunion: selectedRehearsal.enlace_reunion,
          direccion: undefined,
          fee: isReunion ? 'Reunión Interna' : 'Gratuito',
          notes: selectedRehearsal.notas,
          locationQuery:
            isReunion &&
            (selectedRehearsal.lugar.toLowerCase().includes('online') || selectedRehearsal.lugar.toLowerCase().includes('http'))
              ? undefined
              : selectedRehearsal.lugar,
        }
      : {
          type: 'free',
          time: '--:--',
          lugar: 'Sin evento agendado',
          direccion: undefined,
          fee: '--',
          notes: 'Día de descanso de la banda para composing o ensayos individuales.',
          locationQuery: undefined,
        };

  const textTitle = 'text-[var(--ink)]';

  const textSub = 'text-[var(--ink-2)]';

  const textMuted = 'text-[var(--ink-2)]';

  return { selectedConcert, selectedRehearsal, textTitle, textSub, textMuted, weekdays, getEventsForDateStr, dayEventsList, hasMultipleDayEvents, activeDayEventId, selectedEventDetails, selectedEventTitle, assignedSetlist, currentSetlistId };
}
