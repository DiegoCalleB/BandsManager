/**
 * Traducción entre el formulario de «momento del show» (ShowItemModal) y el {@link SetlistItem}
 * que de verdad se guarda en el setlist.
 *
 * Antes el modal leía y escribía campos que SetlistItem no tiene (`title`, `durationMin`, `notes`…):
 * al crear, `handleSaveShowItem` los ignoraba y el bloque salía como «Evento del Show» de 2 min;
 * al editar, el título y las notas aparecían vacíos y lo escrito no cambiaba lo que se ve en la lista.
 */
import type { SetlistItem } from '../../types';

/** Tipos que ofrece el selector del formulario. */
export type TipoMomentoShow = 'interlude' | 'speech' | 'solo' | 'pause' | 'encore';

/** Estado editable del formulario. */
export interface ShowItemForm {
  title: string;
  type: TipoMomentoShow;
  durationMin: number | '';
  notes: string;
  key: string;
}

type SubtipoBloque = NonNullable<SetlistItem['bloqueSubtipo']>;

const SUBTIPO_POR_TIPO: Record<TipoMomentoShow, SubtipoBloque> = {
  interlude: 'otro',
  speech: 'presentacion',
  solo: 'solo_performance',
  pause: 'descanso',
  encore: 'bis',
};

/** Formulario vacío para un momento nuevo. */
export const SHOW_ITEM_FORM_VACIO: ShowItemForm = { title: '', type: 'interlude', durationMin: 2, notes: '', key: '' };

/** Tipo del selector que corresponde a un subtipo guardado; los que no tienen opción propia caen en «interludio». */
export function tipoDesdeSubtipo(subtipo: SetlistItem['bloqueSubtipo']): TipoMomentoShow {
  const encontrado = (Object.keys(SUBTIPO_POR_TIPO) as TipoMomentoShow[]).find((t) => SUBTIPO_POR_TIPO[t] === subtipo);
  return encontrado ?? 'interlude';
}

/** Rellena el formulario con un ítem existente (o lo deja vacío si no hay ninguno). */
export function formDesdeSetlistItem(item: SetlistItem | null): ShowItemForm {
  if (!item) return SHOW_ITEM_FORM_VACIO;
  const minutos = item.duracionEstimadaMinutos ?? (item.duracionEstimadaSegundos ? item.duracionEstimadaSegundos / 60 : 2);
  return {
    title: item.tituloCustom || '',
    type: tipoDesdeSubtipo(item.bloqueSubtipo),
    durationMin: minutos,
    notes: item.notaTema || item.notas || '',
    key: item.tonalidadDeseada || '',
  };
}

/**
 * Campos de SetlistItem que produce el formulario. No incluye `tipoItem`: `handleSaveShowItem`
 * lo fija a «bloque» y un valor distinto de «cancion» lo reinterpretaría como subtipo.
 * @param original Ítem que se edita: si el tipo no cambió, se respeta su subtipo exacto (p. ej. «chapa»).
 */
export function setlistItemDesdeForm(form: ShowItemForm, original: SetlistItem | null = null): Partial<SetlistItem> {
  const minutos = Number(form.durationMin) || 0;
  const subtipoOriginal = original?.bloqueSubtipo;
  const bloqueSubtipo =
    subtipoOriginal && tipoDesdeSubtipo(subtipoOriginal) === form.type ? subtipoOriginal : SUBTIPO_POR_TIPO[form.type];
  return {
    bloqueSubtipo,
    tituloCustom: form.title.trim(),
    duracionEstimadaMinutos: minutos,
    duracionEstimadaSegundos: Math.round(minutos * 60),
    notaTema: form.notes,
    tonalidadDeseada: form.key.trim() || undefined,
  };
}
