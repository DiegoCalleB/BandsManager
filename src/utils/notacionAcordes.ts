/**
 * Notación de acordes y tonalidades: UNA sola, nunca mezclada.
 *
 *  - ALMACENAMIENTO canónico: americana ("E", "Em", "F#m", "Bb"). Todo lo que entra (formulario, IA,
 *    Spotify, importaciones) se normaliza con `normalizarTonalidad` / `normalizarTextoAcordes`.
 *  - VISUALIZACIÓN: la que elige cada persona (`ES` = Do Re Mi / Mim, `EN` = C D E / Em), con
 *    `formatearTonalidad` / `formatearAcorde` / `convertirTextoAcordes`.
 * Módulo puro (sin React ni DOM): lo usan el servidor y el cliente.
 */
import { processChordText, transposeChordToken } from './chordUtils';

export type Notacion = 'ES' | 'EN';

/** Tonalidad con la que se rellena una canción sin tonalidad (antes «Mim»). */
export const TONALIDAD_POR_DEFECTO = 'Em';
export const NOTACION_POR_DEFECTO: Notacion = 'EN';

/** Las doce notas (con sostenidos) para ofrecer un selector de tono en la notación elegida. */
export const NOTAS_BASE: Record<Notacion, string[]> = {
  EN: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
  ES: ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'],
};

const ES_A_EN: Record<string, string> = { do: 'C', re: 'D', mi: 'E', fa: 'F', sol: 'G', la: 'A', si: 'B' };
const EN_A_ES: Record<string, string> = { C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' };

// Tonalidad completa y nada más: «Mim», «F#m», «Sol Mayor», «La menor», «C Major», «Bb», «Do M».
// El anclaje ^…$ evita tocar texto libre («Atonal», «N/A», «Varias»).
const TONALIDAD = /^(do|re|mi|fa|sol|la|si|[a-g])\s*(#|b|♯|♭)?\s*(m|min|minor|menor|mayor|major|maj)?$/i;

/** Lleva cualquier tonalidad a la notación pedida; lo que no reconoce como tonalidad lo devuelve tal cual. */
function convertirTonalidad(texto: string, destino: Notacion): string {
  const limpio = texto.trim();
  const m = limpio.match(TONALIDAD);
  if (!m) {
    // «Mim / Em»: una IA que da las dos notaciones a la vez. Se queda con la primera.
    const partes = limpio.split('/').map((p) => p.trim());
    // Solo si TODOS los trozos son tonalidades: «N/A» no es «N» y «A», y no debe acabar como «A».
    const todasValidas = partes.length > 1 && partes.every((p) => TONALIDAD.test(p));
    return todasValidas ? convertirTonalidad(partes[0], destino) : limpio;
  }
  const [, notaBruta, alteracionBruta = '', modoBruto = ''] = m;
  const nota = notaBruta.toLowerCase();
  // «Mim» (Mi menor) se lee como nota «Mi» + modo «m»; «M» sola es mayor.
  const raizEn = ES_A_EN[nota] ?? nota.toUpperCase();
  const alteracion = alteracionBruta === '♯' ? '#' : alteracionBruta === '♭' ? 'b' : alteracionBruta;
  const menor = modoBruto === 'm' || /^(min|minor|menor)$/i.test(modoBruto);
  const raiz = destino === 'ES' ? EN_A_ES[raizEn] : raizEn;
  return `${raiz}${alteracion}${menor ? 'm' : ''}`;
}

/** Tonalidad en formato canónico (americano). «Mim» → «Em», «La Mayor» → «A», «N/A» → «N/A». */
export function normalizarTonalidad(tonalidad?: string | null): string {
  return convertirTonalidad(tonalidad ?? '', 'EN');
}

/** Tonalidad canónica → la notación que ve la persona. */
export function formatearTonalidad(tonalidad: string | null | undefined, notacion: Notacion): string {
  return convertirTonalidad(tonalidad ?? '', notacion);
}

/** Un acorde (con extensiones y bajo: «Am7», «C/G», «Sol/Si») en la notación pedida. */
export function formatearAcorde(acorde: string, notacion: Notacion): string {
  return transposeChordToken(acorde, 0, notacion);
}

/** Cifrado completo (líneas de acordes y `[acordes]` en línea) en la notación pedida. */
export function convertirTextoAcordes(texto: string, notacion: Notacion): string {
  return processChordText(texto, 0, notacion);
}

/** Cifrado en formato canónico (americano), para guardar. */
export const normalizarTextoAcordes = (texto: string): string => convertirTextoAcordes(texto, 'EN');
