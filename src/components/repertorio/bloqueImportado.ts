import type { SetlistItem } from '../../types';

/**
 * Ítem de setlist para un bloque (chapa, descanso…) detectado al importar un repertorio impreso.
 *
 * Antes se guardaba el subtipo en `tipoItem` (`tipoItem: 'chapa'`), pero `tipoItem` solo admite
 * «cancion» o «bloque»: el subtipo vive en `bloqueSubtipo`, así que el bloque importado perdía su
 * icono y su etiqueta.
 * @param id Id del ítem.
 * @param titulo Título detectado.
 * @param subtipo Subtipo devuelto por el backend (`otro` si no vino).
 */
export function itemDeBloqueImportado(id: string, titulo: string, subtipo: SetlistItem['bloqueSubtipo']): SetlistItem {
  return { id, tipoItem: 'bloque', bloqueSubtipo: subtipo ?? 'otro', tituloCustom: titulo };
}
