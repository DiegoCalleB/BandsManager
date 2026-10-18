import type { SongAudioIdea } from '../../types';

type SeccionIdea = SongAudioIdea['seccion'];

const SECCIONES: readonly SeccionIdea[] = ['general', 'intro', 'verso', 'estribillo', 'puente', 'solo', 'outro'];

/**
 * Sección de idea que corresponde a la etiqueta elegida en el compositor IA («Estribillo»,
 * «Solo / Instrumental»…).
 *
 * Antes se guardaba la etiqueta en minúsculas con guiones: «Pre-estribillo» y «Solo / Instrumental»
 * daban `pre-estribillo` y `solo-/-instrumental`, que no son secciones válidas, así que esas ideas
 * no aparecían al filtrar por sección y la tarjeta las pintaba como «General».
 * @param etiqueta Texto de la opción seleccionada.
 * @returns Una sección válida; `general` si no se reconoce.
 */
export function seccionDesdeEtiqueta(etiqueta: string): SeccionIdea {
  const normalizada = etiqueta.trim().toLowerCase();
  if (normalizada.startsWith('solo')) return 'solo';
  // El pre-estribillo no tiene sección propia: se agrupa con el estribillo al que lleva.
  if (normalizada.startsWith('pre-estribillo') || normalizada.startsWith('preestribillo')) return 'estribillo';
  return SECCIONES.find((s) => s === normalizada) ?? 'general';
}
