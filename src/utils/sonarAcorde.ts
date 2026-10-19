/**
 * Hace sonar un acorde del Atril tal y como lo dibuja el diagrama (misma inversión), con la canción atenuada un momento.
 * Tone.js se carga solo al primer toque: no pesa en el arranque de la app.
 */
import { bajarCancion } from './ducking';
import { vozTeclado } from './inversiones';
import { notasParaDibujar, type VistaAcorde } from './vistaAcordes';
import type { NivelAcorde } from './voicings';

const BASE_TECLADO = 48; // Do3
const BASE_BAJO = 28; // Mi1: la cuerda al aire del bajo; la nota grave de cada acorde cae entre Mi1 y Re#2
export const DURACION_ACORDE_S = 1.4;

/**
 * Alturas MIDI del acorde para esa vista. Piano y guitarra: la voz de la inversión (Básico: tríada, en guitarra solo
 * raíz y quinta como el power chord). Bajo: la nota grave de la inversión.
 */
export function midiDeAcorde(acorde: string, vista: VistaAcorde, nivel: NivelAcorde = 'normal', inversion = 0): number[] {
  const n = notasParaDibujar(acorde);
  if (!n) return [];
  const inv = Math.max(0, Math.min(inversion, n.notas.length - 1));
  if (vista === 'bajo') {
    // Arpegio de grave a agudo: arranca en la nota de la inversión y sube por las demás del acorde (Básico: raíz y quinta).
    const pcs = nivel === 'basico' ? n.notas.filter((pc) => pc === n.raiz || pc === n.quinta) : n.notas;
    const ini = Math.min(inv, pcs.length - 1);
    const sube: number[] = [];
    pcs.map((_, i) => pcs[(ini + i) % pcs.length]).forEach((pc) => {
      const prev = sube[sube.length - 1];
      const m = prev === undefined ? BASE_BAJO + ((pc - (BASE_BAJO % 12) + 12) % 12) : prev + (((pc - prev) % 12 + 12) % 12 || 12);
      sube.push(m);
    });
    return sube;
  }
  const notas = nivel !== 'basico' ? n.notas : n.notas.filter((pc) => pc === n.raiz || pc === n.quinta || (vista === 'teclado' && pc === n.tercera));
  return vozTeclado(notas, Math.min(inv, notas.length - 1)).map((t) => BASE_TECLADO + t);
}

const PASO_BAJO_S = 0.3;

type Sintetizador = { triggerAttackRelease: (notas: string[], dur: number, cuando?: number) => unknown };
let sinte: Promise<Sintetizador> | null = null;

/** Baja Tone.js en cuanto aparece una ficha, para que el toque no espere a la red y siga dentro del gesto del usuario. */
export const precargarSonido = (): void => { void import('tone').catch(() => undefined); };

const crearSinte = async (): Promise<Sintetizador> => {
  const Tone = await import('tone');
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
    const Tone = await import('tone');
    await Tone.start(); // cada toque: el navegador (iOS sobre todo) vuelve a suspender el audio
    sinte ??= crearSinte();
    const s = await sinte;
    bajarCancion(DURACION_ACORDE_S * 1000);
    const notas = midi.map((m) => Tone.Frequency(m, 'midi').toNote());
    if (vista === 'bajo') {
      // El bajo toca una nota cada vez, de grave a agudo.
      const t0 = Tone.now();
      notas.forEach((nota, i) => s.triggerAttackRelease([nota], PASO_BAJO_S * 1.5, t0 + i * PASO_BAJO_S));
    } else s.triggerAttackRelease(notas, DURACION_ACORDE_S);
  } catch (e) {
    console.warn('[sonarAcorde] sin audio:', e);
    sinte = null; // sin audio disponible: el diagrama sigue funcionando
  }
}
