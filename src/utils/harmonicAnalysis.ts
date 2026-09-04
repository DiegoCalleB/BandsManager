import { Song } from '../types';

/** Valor con el que la app rellena `tonalidad` cuando nadie la ha tocado nunca (ver
 * server/db/repertoire.ts, dbUpsertSong/mapSongRecord). Si la mayoría del repertorio sigue en
 * este valor, no es un dato real — es que nadie ha rellenado la tonalidad todavía. */
export const TONALIDAD_FALLBACK = 'mim';

export interface ParsedKey {
  /** Clase de altura de la tónica, 0 (Do/C) a 11 (Si/B). */
  pitchClass: number;
  isMinor: boolean;
}

// Notas españolas primero (más largas) para que "do"/"re"/"mi"/"sol"/"la"/"si" no colisionen con
// las notas inglesas de una letra (d, e, a) al hacer match por prefijo.
const NOTE_PREFIXES: Array<{ re: RegExp; pc: number }> = [
  { re: /^sol/, pc: 7 },
  { re: /^fa/, pc: 5 },
  { re: /^re/, pc: 2 },
  { re: /^do/, pc: 0 },
  { re: /^mi/, pc: 4 },
  { re: /^la/, pc: 9 },
  { re: /^si/, pc: 11 },
  { re: /^c/, pc: 0 },
  { re: /^d/, pc: 2 },
  { re: /^e/, pc: 4 },
  { re: /^f/, pc: 5 },
  { re: /^g/, pc: 7 },
  { re: /^a/, pc: 9 },
  { re: /^b/, pc: 11 }
];

/**
 * Parsea una tonalidad en texto libre (español o inglés, con o sin alteración/modo) a su clase
 * de altura + modo. `tonalidad` es un <input type="text"> libre en SongModal, así que aparecen
 * formatos como "Mim", "Am", "E", "Sol", "Re menor", "F#m", "Do M" — no un enum cerrado.
 * Devuelve null si el texto no empieza por ninguna nota reconocible.
 */
export function parseTonalidad(tonalidad?: string | null): ParsedKey | null {
  if (!tonalidad) return null;
  const norm = tonalidad.trim().toLowerCase();
  if (!norm) return null;

  const noteMatch = NOTE_PREFIXES.find(n => n.re.test(norm));
  if (!noteMatch) return null;

  let pc = noteMatch.pc;
  const rest = norm.slice(norm.match(noteMatch.re)![0].length).trim();

  // Alteración: sostenido (+1) o bemol (-1). Se comprueba antes que el modo porque "b" de bemol
  // podría confundirse con el inicio de "bemol" mismo, y "#" nunca forma parte de una palabra de modo.
  let afterAccidental = rest;
  if (rest.startsWith('#') || rest.startsWith('sostenido')) {
    pc = (pc + 1) % 12;
    afterAccidental = rest.replace(/^(#|sostenido)/, '').trim();
  } else if (rest.startsWith('b') && !/^(mayor|major)/.test(rest)) {
    // "b" sola o "bemol" — pero no dejar que "b" de "Sib" ya consumida como nota se coma un modo
    // que empezara por b (no existe ninguno en español/inglés, así que esto es seguro).
    pc = (pc + 11) % 12;
    afterAccidental = rest.replace(/^(b|bemol)/, '').trim();
  }

  const isMinor = /^(m|min|menor|minor)(?!ayor|ajor)/.test(afterAccidental);

  return { pitchClass: pc, isMinor };
}

/** Normaliza a una clave comparable (para detectar el fallback exacto, no para armonía). */
function normalizarParaComparar(tonalidad?: string | null): string {
  return (tonalidad || '').trim().toLowerCase().replace(/\s+/g, '');
}

/**
 * true si hay suficientes tonalidades reales (no todas/la mayoría en el valor por defecto "Mim")
 * como para que un análisis armónico diga algo útil. Con datos sin rellenar, cualquier "choque
 * armónico" detectado sería ruido — parecería que todo el repertorio está en la misma tonalidad
 * porque nadie ha tenido la ocasión de corregirla, no porque lo esté de verdad.
 */
export function tonalidadesSonFiables(songs: Array<Song | undefined>): boolean {
  const relevantes = songs.filter((s): s is Song => !!s && !!s.tonalidad && s.tonalidad.trim().length > 0);
  if (relevantes.length < 3) return false;

  const enFallback = relevantes.filter(s => normalizarParaComparar(s.tonalidad) === TONALIDAD_FALLBACK).length;
  // Menos de la mitad en el valor por defecto: hay variedad real detrás.
  return enFallback / relevantes.length < 0.5;
}

/** Posición en el círculo de quintas (0-11) de la tonalidad, usando su relativa MAYOR como
 * referencia — así una tonalidad menor y su relativa mayor caen en la misma posición, que es
 * justo el criterio real de "compatibilidad armónica" (ninguna nota nueva entre ambas). */
function posicionCirculoQuintas(key: ParsedKey): number {
  const pcMayor = key.isMinor ? (key.pitchClass + 3) % 12 : key.pitchClass;
  return (pcMayor * 7) % 12;
}

function distanciaCircular(a: number, b: number): number {
  const diff = Math.abs(a - b) % 12;
  return Math.min(diff, 12 - diff);
}

export type CompatibilidadArmonica = 'identica' | 'compatible' | 'neutra' | 'choque';

/**
 * Evalúa la transición armónica entre dos tonalidades consecutivas del setlist.
 * - identica/compatible: misma tonalidad, relativa mayor/menor, quinta adyacente, o "subida de
 *   tono" (mismo modo, +1/+2 semitonos — un recurso compositivo real, no un choque)
 * - neutra: relación intermedia, ni un enlace clásico ni claramente disonante — no se avisa
 * - choque: las tónicas están lejos en el círculo de quintas (nada en común), probable salto brusco
 */
export function evaluarTransicionArmonica(a: ParsedKey, b: ParsedKey): CompatibilidadArmonica {
  if (a.pitchClass === b.pitchClass && a.isMinor === b.isMinor) return 'identica';

  // Subida (o bajada) de tono: mismo modo, un salto cromático corto — técnica habitual para dar
  // empuje a un tema, no una transición armónica "por casualidad".
  const semitonos = Math.abs(a.pitchClass - b.pitchClass);
  const semitonosCirculares = Math.min(semitonos, 12 - semitonos);
  if (a.isMinor === b.isMinor && semitonosCirculares > 0 && semitonosCirculares <= 2) return 'compatible';

  const distancia = distanciaCircular(posicionCirculoQuintas(a), posicionCirculoQuintas(b));
  if (distancia <= 1) return 'compatible';
  if (distancia >= 4) return 'choque';
  return 'neutra';
}

/** Nombre corto para mostrar en un mensaje, a partir de la tonalidad tal como la escribió el usuario. */
export function formatTonalidad(tonalidad: string): string {
  return tonalidad.trim();
}
