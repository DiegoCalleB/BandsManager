import type { RehearsalAgendaItem, Setlist, SetlistItem } from '../types';

type Subtipo = NonNullable<SetlistItem['bloqueSubtipo']>;

// Qué bloque del visor de concierto representa cada tipo de agenda que no es una canción.
const SUBTIPO_POR_TIPO: Record<Exclude<RehearsalAgendaItem['tipo'], 'cancion'>, Subtipo> = {
  calentamiento: 'otro',
  pausa: 'descanso',
  intro: 'intro_tema',
  outro: 'bis',
  seccion_especifica: 'header',
  improvisacion: 'solo_performance',
};

/**
 * Agenda de ensayo → ítem de setlist. Conserva el `id` (para volver a la agenda al evaluar)
 * y el orden. Una "canción" sin `songId` (borrada del repertorio) pasa a bloque para que el
 * visor la muestre como guion en vez de romper.
 */
export function agendaItemASetlistItem(item: RehearsalAgendaItem): SetlistItem {
  if (item.tipo === 'cancion' && item.songId) {
    return {
      id: item.id,
      songId: item.songId,
      tipoItem: 'cancion',
      duracionEstimadaMinutos: item.duracionEstimadaMin,
      notas: item.enfoque,
    };
  }
  return {
    id: item.id,
    tipoItem: 'bloque',
    bloqueSubtipo: item.tipo === 'cancion' ? 'otro' : SUBTIPO_POR_TIPO[item.tipo],
    tituloCustom: item.titulo,
    duracionEstimadaMinutos: item.duracionEstimadaMin,
    notas: item.enfoque,
  };
}

/** Setlist "virtual" para abrir el visor de concierto con la agenda de un ensayo. */
export function agendaASetlist(
  rehearsal: { id: string; band_id?: string; fecha: string },
  agenda: RehearsalAgendaItem[],
): Setlist {
  return {
    id: `ensayo-${rehearsal.id}`,
    band_id: rehearsal.band_id,
    nombre: 'Ensayo',
    tipoFormato: 'ensayo',
    items: agenda.map(agendaItemASetlistItem),
    fechaCreacion: rehearsal.fecha,
    fechaUltimaEdicion: rehearsal.fecha,
  };
}
