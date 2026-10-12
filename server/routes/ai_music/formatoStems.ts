/**
 * Formato de los stems para el cliente (orden canónico y metadatos), hosts de almacenamiento de confianza y marcado de trabajos fallidos.
 */
import { markStemsSeparationFailed } from '../../db/stemsCache.js';

const STEM_METADATA: Record<
  string,
  { trackName: string; description: string; recommendedVolume: number }
> = {
  Voz: {
    trackName: '🎤 Pista IA: Voz Principal (Aislada)',
    description:
      'Voz principal aislada en alta calidad mediante aprendizaje profundo. Permite silenciar la voz para ensayar cantando en directo.',
    recommendedVolume: 1.0,
  },
  Instrumental: {
    trackName: '🎵 Pista IA: Base Instrumental (Playback)',
    description:
      'Mezcla completa sin voz principal. Ideal para practicar canto, directos con playback y karaoke.',
    recommendedVolume: 0.95,
  },
  Batería: {
    trackName: '🥁 Pista IA: Batería & Percusión',
    description:
      'Pista aislada de batería, caja, bombo y platillos en alta fidelidad.',
    recommendedVolume: 0.9,
  },
  Bajo: {
    trackName: '🎸 Pista IA: Bajo (Sub-Bass)',
    description: 'Línea de bajo aislada y frecuencias fundamentales de grave.',
    recommendedVolume: 0.95,
  },
  Guitarras: {
    trackName: '🎸 Pista IA: Guitarras (Rítmicas & Solos)',
    description:
      'Guitarras eléctricas y acústicas aisladas sin acople de voz ni batería.',
    recommendedVolume: 0.85,
  },
  Teclados: {
    trackName: '🎹 Pista IA: Teclados & Piano',
    description: 'Pianos, sintetizadores y órganos aislados.',
    recommendedVolume: 0.85,
  },
  Arreglos: {
    trackName: '🎺 Pista IA: Arreglos, Sintes & Cuerdas',
    description:
      'Sección de vientos, cuerdas, sintetizadores y efectos secundarios.',
    recommendedVolume: 0.85,
  },
};

// Orden canónico de instrumentos (el mismo que declara STEM_METADATA arriba). Los stems se
// persisten de forma concurrente (Promise.all en persistRawStemsMap), así que el orden de llegada
// al objeto stemsMap no es determinista entre ejecuciones ni entre motores (MDX23/Demucs/DSP) —
// reordenamos aquí, en el único punto por el que pasan todas las respuestas al cliente, para que
// la lista de pistas sea siempre Voz/Instrumental/Batería/Bajo/Guitarras/Teclados/Arreglos sin importar qué
// motor las generó ni en qué orden terminaron sus subidas a Supabase.
const CANONICAL_STEM_ORDER = Object.keys(STEM_METADATA);

function sortStemsMapCanonically<T>(
  stemsMap: Record<string, T>
): Record<string, T> {
  const sorted: Record<string, T> = {};
  for (const key of CANONICAL_STEM_ORDER) {
    if (stemsMap[key] !== undefined) sorted[key] = stemsMap[key];
  }
  for (const key of Object.keys(stemsMap)) {
    if (!(key in sorted)) sorted[key] = stemsMap[key];
  }
  return sorted;
}

/** Stem tal como llega del motor o de la caché: solo la URL (los antiguos) o con su formato y tamaño. */
export type StemEnMapa = string | { url: string; formato?: string; tamano?: string };

export function buildFormattedStems(stemsMap: Record<string, StemEnMapa>) {
  return Object.entries(sortStemsMapCanonically(stemsMap || {})).map(
    ([instrument, rawValue]) => {
      const meta = STEM_METADATA[instrument] || {
        trackName: `Pista IA: ${instrument}`,
        description: `Pista aislada de ${instrument}.`,
        recommendedVolume: 0.85,
      };
      const url = typeof rawValue === 'object' ? rawValue.url : rawValue;
      const formato = typeof rawValue === 'object' ? rawValue.formato : 'MP3';
      const tamano = typeof rawValue === 'object' ? rawValue.tamano : '2.5 MB';

      return {
        instrument,
        trackName: meta.trackName,
        audioUrl: url,
        formato,
        tamano,
        description: meta.description,
        recommendedVolume: meta.recommendedVolume,
      };
    }
  );
}

// Hosts de almacenamiento/CDN de confianza. Se compara el HOSTNAME real (sufijo de dominio):
// con `includes()` bastaba poner «supabase.co» en la query de cualquier URL para saltarse el filtro.
const DOMINIOS_ALMACENAMIENTO_CONFIABLES = [
  'supabase.co',
  'storage.googleapis.com',
  'cloudinary.com',
  'replicate.delivery',
  'amazonaws.com',
  'blob.core.windows.net',
];
export function esHostDeAlmacenamientoConfiable(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    return DOMINIOS_ALMACENAMIENTO_CONFIABLES.some(
      (d) => host === d || host.endsWith('.' + d)
    );
  } catch {
    return false;
  }
}

/** Registra el fallo de un job de separación en la caché persistente con el mismo formato de
 *  diagnóstico que antes viajaba en la respuesta HTTP directa, para que el polling de estado
 *  pueda reconstruir la misma tarjeta de error enriquecida en el cliente. */
export async function failStemsJob(
  bandId: string,
  songHash: string,
  engine: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    await markStemsSeparationFailed(
      bandId,
      songHash,
      engine,
      JSON.stringify(payload)
    );
  } catch (e) {
    console.warn(
      '[Stem Separator] No se pudo registrar el fallo del job en caché:',
      e
    );
  }
}
