/**
 * Hace sonar un acorde del Atril tal y como lo dibuja el diagrama (misma inversión), con la canción atenuada un momento.
 * Tone.js se carga solo al primer toque: no pesa en el arranque de la app.
 */
import { bajarCancion } from './ducking';
import { vozTeclado } from './inversiones';
import { notasParaDibujar, type VistaAcorde } from './vistaAcordes';
import type { NivelAcorde } from './voicings';

const BASE_TECLADO = 48; // Do3
const BASE_BAJO = 36; // Do2
export const DURACION_ACORDE_S = 1.4;

/**
 * Alturas MIDI del acorde para esa vista. Piano y guitarra: la voz de la inversión (Básico: tríada, en guitarra solo
 * raíz y quinta como el power chord). Bajo: la nota grave de la inversión.
 */
export function midiDeAcorde(acorde: string, vista: VistaAcorde, nivel: NivelAcorde = 'normal', inversion = 0): number[] {
  const n = notasParaDibujar(acorde);
  if (!n) return [];
  const inv = Math.max(0, Math.min(inversion, n.notas.length - 1));
  if (vista === 'bajo') return [BASE_BAJO + n.notas[inv]];
  const notas = nivel !== 'basico' ? n.notas : n.notas.filter((pc) => pc === n.raiz || pc === n.quinta || (vista === 'teclado' && pc === n.tercera));
  return vozTeclado(notas, Math.min(inv, notas.length - 1)).map((t) => BASE_TECLADO + t);
}

type Sintetizador = { triggerAttackRelease: (notas: string[], dur: number) => unknown };
let sinte: Promise<Sintetizador> | null = null;

const crearSinte = async (): Promise<Sintetizador> => {
  const Tone = await import('tone');
  await Tone.start();
  return new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.35, release: 1 },
  }).toDestination();
};

/** Toca el acorde y baja la canción mientras suena. Sin Web Audio (tests, navegadores raros) no hace nada. */
export async function sonarAcorde(acorde: string, vista: VistaAcorde, nivel: NivelAcorde, inversion: number): Promise<void> {
  const midi = midiDeAcorde(acorde, vista, nivel, inversion);
  if (!midi.length) return;
  try {
    sinte ??= crearSinte();
    const s = await sinte;
    const Tone = await import('tone');
    bajarCancion(DURACION_ACORDE_S * 1000);
    s.triggerAttackRelease(midi.map((m) => Tone.Frequency(m, 'midi').toNote()), DURACION_ACORDE_S);
  } catch {
    sinte = null; // sin audio disponible: el diagrama sigue funcionando
  }
}
