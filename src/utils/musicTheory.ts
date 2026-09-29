/**
 * Conversión entre nombres de nota y números MIDI, en la convención de Tone.js: Do central =
 * C4 = MIDI 60.
 *
 * Vive en src/ y no en server/ porque lo necesitan los dos lados: el validador del servidor
 * (server/utils/melodicIdeaValidator.ts) para reparar lo que compone la IA, y el exportador
 * MIDI del navegador (src/utils/midiExport.ts) para escribir el fichero. Duplicar un parser de
 * notas en ambos sitios es justo el tipo de cosa que acaba divergiendo.
 */

/** Nota científica: letra, alteración opcional y octava de -1 a 8. */
const RE_NOTA = /^([A-Ga-g])([#b]?)(-1|[0-8])$/;

export const CLASE_POR_LETRA: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

const NOMBRES_MIDI = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Devuelve null (no NaN) para lo que no es una nota. Esa distinción es el motivo de que exista
 * el validador: Tone.js convierte'H4' en NaN sin lanzar, y una nota NaN se sintetiza como un
 * hueco mudo que parece un fallo de la app.
 */
export function notaAMidi(nota: string): number | null {
  const match = RE_NOTA.exec((nota || '').trim());
  if (!match) return null;
  const [, letra, alteracion, octavaStr] = match;
  const clase = CLASE_POR_LETRA[letra.toUpperCase()];
  if (clase === undefined) return null;
  const ajuste = alteracion === '#' ? 1 : alteracion === 'b' ? -1 : 0;
  const octava = parseInt(octavaStr, 10);
  const midi = (octava + 1) * 12 + clase + ajuste;
  return midi >= 0 && midi <= 127 ? midi : null;
}

export function midiANota(midi: number): string {
  const redondeado = Math.round(midi);
  const octava = Math.floor(redondeado / 12) - 1;
  return `${NOMBRES_MIDI[((redondeado % 12) + 12) % 12]}${octava}`;
}
