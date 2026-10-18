/**
 * De alturas MIDI a las claves que entiende VexFlow («c#/4»). Lógica pura: el dibujo vive en Pentagrama.tsx.
 */
const SOSTENIDOS = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
const BEMOLES = ['c', 'db', 'd', 'eb', 'e', 'f', 'gb', 'g', 'ab', 'a', 'bb', 'b'];

export type Clave = 'treble' | 'bass';

/** Tonalidades que se escriben con bemoles: la raíz lleva «b» (Bb, Eb…) o es Fa. */
export const prefiereBemoles = (raiz: string): boolean => /^[A-G]b/.test(raiz) || raiz === 'F' || raiz.startsWith('F ');

export interface NotaPentagrama { clave: string; alteracion: '#' | 'b' | null }

/** Una altura MIDI como clave de VexFlow y su alteración (la nota 60 es do central: «c/4»). */
export function notaDeMidi(midi: number, bemoles = false): NotaPentagrama {
  const pc = ((midi % 12) + 12) % 12;
  const nombre = (bemoles ? BEMOLES : SOSTENIDOS)[pc];
  const octava = Math.floor(midi / 12) - 1;
  const alteracion = nombre.length > 1 ? (bemoles ? 'b' : '#') : null;
  return { clave: `${nombre}/${octava}`, alteracion };
}

/** Clave de sol salvo que casi todo caiga por debajo del do central (el bajo). */
export function claveParaMidi(midi: number[]): Clave {
  return midi.length && Math.max(...midi) < 60 ? 'bass' : 'treble';
}

/** Clave por instrumento: el bajo lee en Fa; piano y guitarra, en Sol. */
export const claveDeVista = (vista: string): Clave => (vista === 'bajo' ? 'bass' : 'treble');

/** Altura escrita: bajo y guitarra suenan una octava por debajo de lo que se escribe. */
export const midiEscrito = (midi: number[], vista: string): number[] =>
  vista === 'bajo' || vista === 'guitarra' ? midi.map((m) => m + 12) : midi;

/** La escala ascendente desde la tónica (octava `base`) hasta la octava siguiente, con las notas dadas por clase. */
export function midiDeEscala(raiz: number, notas: number[], base = 60): number[] {
  const r = ((raiz % 12) + 12) % 12;
  const tonica = base + ((r - (base % 12) + 12) % 12);
  const grados = [...new Set(notas.map((pc) => ((pc - r) % 12 + 12) % 12))].sort((a, b) => a - b);
  return [...grados.map((d) => tonica + d), tonica + 12];
}
