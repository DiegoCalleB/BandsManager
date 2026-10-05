// SINTETIZADOR TONE.JS PARA IDEAS MELÓDICAS DE IA POR INSTRUMENTO (GUITARRA, VIOLÍN, HANDPAN,
// PERCUSIÓN). A diferencia de accompanimentSynth.ts (patrón rítmico fijo de batería/bajo), aquí
// se reproduce una secuencia de notas concreta generada por Gemini a partir del ADN musical y/o
// la canción del repertorio ('propose_melodic_idea' en el chatbot, ver server/routes/chat.ts).
//
// Se evitan deliberadamente los efectos de reverb de Tone.js (Freeverb/JCReverb usan
// AudioWorkletNode; Reverb genera su impulso con un Tone.Offline anidado): dentro de nuestro
// propio OfflineAudioContext ambos enfoques son frágiles. El espacio se consigue generando el
// impulso a mano (ruido con caída exponencial) y usando un ConvolverNode nativo — sin
// dependencias nuevas ni worklets.
//
// La lógica que no depende de Web Audio (humanización, clasificación de golpes de percusión,
// asignación de voces, normalización de pico) vive en funciones puras y exportadas, testeables
// sin un AudioContext real. La construcción del grafo de Tone.js en sí no tiene tests unitarios,
// igual que accompanimentSynth.ts: Node no tiene Web Audio, así que se valida escuchando y con
// herramientas externas (ver server/utils/__tests__ y el histórico de esta función para el
// criterio ya aplicado a accompanimentSynth.ts y midiExport.ts).

import * as Tone from 'tone';
import { MelodicInstrument, MelodicNoteEvent } from '../types';
import { bufferToWavBlob } from './audioBufferToWav';
import { notaAMidi } from './musicTheory';

// ---------------------------------------------------------------------------------------------
// PRNG determinista (mulberry32): misma semilla -> misma secuencia siempre. Necesario para que
// "generar otra variación" cambie el resultado de forma intencional (semilla distinta) sin dejar
// de ser reproducible para una semilla dada, y para poder testear la humanización sin azar real.
// ---------------------------------------------------------------------------------------------
export function crearGeneradorDeterminista(semilla: number): () => number {
  let estado = semilla >>> 0;
  return function siguiente(): number {
    estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ParametrosHumanizacion {
  /** Desplazamiento de tiempo máximo, en milisegundos, hacia adelante o atrás. */
  jitterMaxMs: number;
  /** Variación máxima de intensidad, en la misma escala 0-1 que'velocidad'. */
  variacionVelocidad: number;
}

/** Cuánto se humaniza cada instrumento: la percusión necesita más precisión rítmica que un solo de violín. */
const HUMANIZACION_POR_INSTRUMENTO: Record<MelodicInstrument, ParametrosHumanizacion> = {
  guitarra: { jitterMaxMs: 12, variacionVelocidad: 0.08 },
  violin: { jitterMaxMs: 18, variacionVelocidad: 0.06 },
  handpan: { jitterMaxMs: 10, variacionVelocidad: 0.07 },
  percusion: { jitterMaxMs: 6, variacionVelocidad: 0.1 },
};

export interface EventoPreparado {
  nota: string;
  /** Segundos absolutos desde el inicio del render, ya humanizado. */
  tiempo: number;
  /** Duración en segundos. */
  duracion: number;
  /** Intensidad 0-1, ya humanizada. */
  velocidad: number;
}

/**
 * Convierte los eventos en beats (los que compone la IA) a segundos absolutos, aplicando
 * humanización determinista. Función pura: sin esto, cada nota cae exactamente al milisegundo
 * matemático y a la intensidad declarada, que es precisamente lo que delata que no la ha tocado
 * una persona.
 */
export function prepararEventos(
  eventos: MelodicNoteEvent[],
  opts: { instrument: MelodicInstrument; bpm: number; totalLength: number; semilla?: number }
): EventoPreparado[] {
  const secondsPerBeat = 60 / opts.bpm;
  const { jitterMaxMs, variacionVelocidad } = HUMANIZACION_POR_INSTRUMENTO[opts.instrument];
  const rng = crearGeneradorDeterminista(opts.semilla ?? 20260829);

  const ordenados = [...(eventos || [])].sort((a, b) => a.tiempo - b.tiempo);
  const preparados: EventoPreparado[] = [];

  for (const evento of ordenados) {
    const tiempoBase = evento.tiempo * secondsPerBeat;
    const jitterSegundos = ((rng() - 0.5) * 2 * jitterMaxMs) / 1000;
    const tiempo = Math.max(0, tiempoBase + jitterSegundos);
    if (!Number.isFinite(tiempo) || tiempo >= opts.totalLength) continue;

    const duracion = Math.max(0.08, (evento.duracionBeats || 1) * secondsPerBeat);

    const velocidadBase = evento.velocidad ?? 0.85;
    const variacion = (rng() - 0.5) * 2 * variacionVelocidad;
    const velocidad = Math.max(0.15, Math.min(1, velocidadBase + variacion));

    preparados.push({ nota: evento.nota, tiempo, duracion, velocidad });
  }

  return preparados;
}

// ---------------------------------------------------------------------------------------------
// Asignación de voces para instrumentos que Tone.js no puede hacer polifónicos por su cuenta.
// PluckSynth (Karplus-Strong) extiende Instrument, no Monophonic, así que Tone.PolySynth lo
// rechaza por tipo: sin este pool manual, cada nota nueva cortaría en seco a la anterior y una
// guitarra jamás podría sostener un acorde.
// ---------------------------------------------------------------------------------------------

/**
 * Para cada evento (ya ordenado por tiempo), decide qué voz del pool le toca: la primera que
 * esté libre en ese instante: si ninguna lo está, la que quede libre antes (voice stealing).
 * Función pura: solo necesita saber cuándo empieza y cuánto dura cada nota.
 */
export function asignarVoces(eventos: { tiempo: number; duracion: number }[], numVoces: number): number[] {
  const libreEn = new Array(numVoces).fill(0);
  const asignacion: number[] = [];

  for (const evento of eventos) {
    let elegida = 0;
    let masCercanaALiberarse = Infinity;
    for (let v = 0; v < numVoces; v++) {
      if (libreEn[v] <= evento.tiempo) {
        elegida = v;
        masCercanaALiberarse = -Infinity;
        break;
      }
      if (libreEn[v] < masCercanaALiberarse) {
        masCercanaALiberarse = libreEn[v];
        elegida = v;
      }
    }
    asignacion.push(elegida);
    libreEn[elegida] = evento.tiempo + evento.duracion;
  }

  return asignacion;
}

// ---------------------------------------------------------------------------------------------
// Percusión: tres golpes con timbre propio (grave/medio/agudo), no una melodía cromática. El
// validador del servidor (server/utils/melodicIdeaValidator.ts) ya reduce cualquier nota de
// percusión a C2/G2/C3; esto clasifica por proximidad para no depender de que llegue exacto.
// ---------------------------------------------------------------------------------------------
export type GolpePercusion = 'grave' | 'medio' | 'agudo';

const GOLPES_MIDI: { golpe: GolpePercusion; midi: number }[] = [
  { golpe: 'grave', midi: 36 }, // C2
  { golpe: 'medio', midi: 43 }, // G2
  { golpe: 'agudo', midi: 48 }, // C3
];

export function clasificarGolpePercusion(midi: number): GolpePercusion {
  let mejor: GolpePercusion = 'medio';
  let mejorDistancia = Infinity;
  for (const { golpe, midi: golpeMidi } of GOLPES_MIDI) {
    const distancia = Math.abs(midi - golpeMidi);
    if (distancia < mejorDistancia) {
      mejorDistancia = distancia;
      mejor = golpe;
    }
  }
  return mejor;
}

// ---------------------------------------------------------------------------------------------
// Normalización de pico: sin esto, una idea de violín (dinámica suave) y una de percusión
// (transitorios fuertes) salen a volúmenes muy distintos y hay que subir/bajar a mano cada vez.
// ---------------------------------------------------------------------------------------------

/** Interfaz mínima para no exigir un AudioBuffer real en los tests: cualquier objeto con canales. */
export interface BufferDeAudio {
  numberOfChannels: number;
  getChannelData(canal: number): Float32Array;
}

/** Muta los canales in-place para que el pico absoluto quede en'picoObjetivo' (por defecto -1 dBFS). */
export function normalizarPico(buffer: BufferDeAudio, picoObjetivo = 0.891): void {
  let pico = 0;
  for (let canal = 0; canal < buffer.numberOfChannels; canal++) {
    const datos = buffer.getChannelData(canal);
    for (let i = 0; i < datos.length; i++) {
      const abs = Math.abs(datos[i]);
      if (abs > pico) pico = abs;
    }
  }
  // Silencio total (ninguna nota válida llegó a sonar): no hay nada que escalar.
  if (pico <= 0) return;

  const factor = picoObjetivo / pico;
  for (let canal = 0; canal < buffer.numberOfChannels; canal++) {
    const datos = buffer.getChannelData(canal);
    for (let i = 0; i < datos.length; i++) datos[i] *= factor;
  }
}

// ---------------------------------------------------------------------------------------------
// Reverb manual: impulso de ruido con caída exponencial + ConvolverNode nativo. Ni Freeverb/
// JCReverb (AudioWorkletNode) ni Tone.Reverb (genera su impulso con un Tone.Offline anidado) son
// fiables dentro de nuestro propio render offline.
// ---------------------------------------------------------------------------------------------
function crearImpulsoReverb(ctx: BaseAudioContext, duracionSegundos: number, caida: number, rng: () => number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const longitud = Math.max(1, Math.floor(sampleRate * duracionSegundos));
  const impulso = ctx.createBuffer(2, longitud, sampleRate);
  for (let canal = 0; canal < impulso.numberOfChannels; canal++) {
    const datos = impulso.getChannelData(canal);
    for (let i = 0; i < longitud; i++) {
      datos[i] = (rng() * 2 - 1) * Math.pow(1 - i / longitud, caida);
    }
  }
  return impulso;
}

interface EspacioAcustico {
  wet: number;
  duracionSegundos: number;
  caida: number;
}

/** Cuánta cola de reverb lleva cada instrumento: el handpan pide una sala amplia; la guitarra, casi seca. */
const ESPACIO_POR_INSTRUMENTO: Record<MelodicInstrument, EspacioAcustico> = {
  guitarra: { wet: 0.14, duracionSegundos: 1.1, caida: 3.5 },
  violin: { wet: 0.24, duracionSegundos: 1.8, caida: 3 },
  handpan: { wet: 0.3, duracionSegundos: 2.2, caida: 2.6 },
  percusion: { wet: 0.12, duracionSegundos: 0.8, caida: 4 },
};

/**
 * Envía'bus' (donde ya han sumado todas las voces del instrumento) al destino real, seco y con
 * un envío a reverb. El camino seco se queda a su nivel; el húmedo se SUMA encima, no se resta
 * del seco (mezcla aditiva, más simple que un crossfade equal-power y de sobra para esta cola).
 */
function conectarConEspacio(bus: GainNode, ctxNativo: BaseAudioContext, espacio: EspacioAcustico, rng: () => number): void {
  bus.connect(ctxNativo.destination);

  const envio = ctxNativo.createGain();
  envio.gain.value = espacio.wet;
  const convolver = ctxNativo.createConvolver();
  convolver.buffer = crearImpulsoReverb(ctxNativo, espacio.duracionSegundos, espacio.caida, rng);
  convolver.normalize = true;

  bus.connect(envio);
  envio.connect(convolver);
  convolver.connect(ctxNativo.destination);
}

// ---------------------------------------------------------------------------------------------
// Construcción de cada instrumento: guitarra necesita el pool manual; violín/handpan sí admiten
// Tone.PolySynth (su voz interna extiende Monophonic); percusión no usa clases de instrumento de
// Tone en absoluto — nodos nativos de un solo uso por golpe, igual que accompanimentSynth.ts, que
// dan polifonía real sin ningún límite de voces.
// ---------------------------------------------------------------------------------------------
interface VozInstrumento {
  disparar(evento: EventoPreparado): void;
}

const NUM_VOCES_GUITARRA = 6;

/**
 * A diferencia de VozInstrumento (que dispara evento a evento), la guitarra necesita conocer
 * TODOS sus eventos a la vez: asignarVoces reparte el pool de 6 voces de una sola pasada, así
 * que no encaja en la interfaz "disparar uno y ya" del resto de instrumentos.
 */
function dispararEventosGuitarra(bus: GainNode, eventos: EventoPreparado[]): void {
  const voces: Tone.PluckSynth[] = [];
  for (let i = 0; i < NUM_VOCES_GUITARRA; i++) {
    const voz = new Tone.PluckSynth({ attackNoise: 1, dampening: 3200, resonance: 0.9 });
    voz.connect(bus);
    voces.push(voz);
  }

  const asignacion = asignarVoces(eventos, NUM_VOCES_GUITARRA);
  eventos.forEach((evento, i) => {
    voces[asignacion[i]].triggerAttackRelease(evento.nota, evento.duracion, evento.tiempo, evento.velocidad);
  });
}

function crearVozViolin(bus: GainNode): VozInstrumento {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.18, decay: 0.12, sustain: 0.75, release: 0.35 },
  });
  const vibrato = new Tone.Vibrato({ frequency: 5.5, depth: 0.15 });
  const filtro = new Tone.Filter({ frequency: 3200, type: 'lowpass', rolloff: -12 });
  synth.chain(vibrato, filtro, bus);

  return {
    disparar(evento) {
      synth.triggerAttackRelease(evento.nota, evento.duracion, evento.tiempo, evento.velocidad);
    },
  };
}

function crearVozHandpan(bus: GainNode): VozInstrumento {
  const synth = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 3.05,
    modulationIndex: 12,
    envelope: { attack: 0.004, decay: 1.1, sustain: 0.08, release: 1.6 },
    modulationEnvelope: { attack: 0.002, decay: 0.25, sustain: 0, release: 0.3 },
  });
  synth.connect(bus);

  return {
    disparar(evento) {
      synth.triggerAttackRelease(evento.nota, evento.duracion, evento.tiempo, evento.velocidad);
    },
  };
}

function crearVozPercusion(ctxNativo: BaseAudioContext, bus: GainNode, rng: () => number): VozInstrumento {
  // Cada golpe crea sus propios nodos y los desecha: no hay pool ni límite de voces, igual que
  // los golpes de accompanimentSynth.ts. Tres timbres (cuerpo grave a agudo) en vez de una
  // melodía cromática, porque una conga no toca notas: da golpes de distinta altura tonal.
  const TIMBRE: Record<GolpePercusion, { frecuenciaCuerpo: number; frecuenciaRuido: number }> = {
    grave: { frecuenciaCuerpo: 90, frecuenciaRuido: 900 },
    medio: { frecuenciaCuerpo: 160, frecuenciaRuido: 1800 },
    agudo: { frecuenciaCuerpo: 260, frecuenciaRuido: 3200 },
  };

  return {
    disparar(evento) {
      const midi = notaAMidi(evento.nota);
      const golpe = clasificarGolpePercusion(midi ?? 43);
      const { frecuenciaCuerpo, frecuenciaRuido } = TIMBRE[golpe];
      const duracionCuerpo = Math.min(evento.duracion, 0.35);

      const osc = ctxNativo.createOscillator();
      const gananciaOsc = ctxNativo.createGain();
      osc.frequency.setValueAtTime(frecuenciaCuerpo, evento.tiempo);
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, frecuenciaCuerpo * 0.6), evento.tiempo + 0.08);
      gananciaOsc.gain.setValueAtTime(0.55 * evento.velocidad, evento.tiempo);
      gananciaOsc.gain.exponentialRampToValueAtTime(0.001, evento.tiempo + duracionCuerpo);
      osc.connect(gananciaOsc);
      gananciaOsc.connect(bus);
      osc.start(evento.tiempo);
      osc.stop(evento.tiempo + duracionCuerpo + 0.02);

      const duracionRuido = 0.05;
      const tamanoBuffer = Math.max(1, Math.floor(ctxNativo.sampleRate * duracionRuido));
      const bufferRuido = ctxNativo.createBuffer(1, tamanoBuffer, ctxNativo.sampleRate);
      const datos = bufferRuido.getChannelData(0);
      for (let i = 0; i < tamanoBuffer; i++) datos[i] = rng() * 2 - 1;

      const ruido = ctxNativo.createBufferSource();
      ruido.buffer = bufferRuido;
      const filtroRuido = ctxNativo.createBiquadFilter();
      filtroRuido.type = 'bandpass';
      filtroRuido.frequency.value = frecuenciaRuido;
      filtroRuido.Q.value = 1.1;
      const gananciaRuido = ctxNativo.createGain();
      gananciaRuido.gain.setValueAtTime(0.4 * evento.velocidad, evento.tiempo);
      gananciaRuido.gain.exponentialRampToValueAtTime(0.001, evento.tiempo + duracionRuido);

      ruido.connect(filtroRuido);
      filtroRuido.connect(gananciaRuido);
      gananciaRuido.connect(bus);
      ruido.start(evento.tiempo);
      ruido.stop(evento.tiempo + duracionRuido);
    },
  };
}

export async function renderMelodicIdeaAudioBlob(opts: {
  instrument: MelodicInstrument;
  bpm: number;
  durationSecs: number;
  eventos: MelodicNoteEvent[];
  /**
   * Semilla de humanización; cambia entre llamadas para ofrecer "generar otra variación".
   * Misma semilla == mismo tiempo/intensidad exactos de cada nota y mismo timbre del espacio
   * (comprobado en el navegador, no solo en tests: dos renders con la misma semilla dan un WAV
   * idéntico en violín, handpan y percusión, con como mucho 1 unidad de diferencia en 32768 por
   * redondeo de coma flotante del propio motor de audio, inaudible). La guitarra es la excepción:
   * Tone.PluckSynth excita su modelo físico (Karplus-Strong) con ruido interno de Tone.Noise que
   * la API pública no permite sembrar, así que dos renders de una misma idea de guitarra suenan
   * casi igual pero no son bit a bit idénticos. No es un fallo de esta función.
   */
  semilla?: number;
}): Promise<Blob> {
  const bpm = Math.max(40, Math.min(220, opts.bpm || 100));
  const totalLength = Math.max(4, Math.min(120, opts.durationSecs || 20));

  const semilla = opts.semilla ?? 20260829;
  const eventosPreparados = prepararEventos(opts.eventos, {
    instrument: opts.instrument,
    bpm,
    totalLength,
    semilla,
  });
  // Semilla derivada (no la misma instancia que la de prepararEventos, que ya se ha consumido
  // por completo antes de llegar aquí) para que el timbre del espacio y de la percusión también
  // sean reproducibles: misma'semilla' de entrada -> WAV bit a bit idéntico, no solo "las mismas
  // notas en los mismos instantes". Antes usaban Math.random() sin más.
  const rngSonido = crearGeneradorDeterminista(semilla + 1);

  const rendered = await Tone.Offline(
    (contexto) => {
      const ctxNativo = contexto.rawContext as BaseAudioContext;
      const bus = ctxNativo.createGain();
      conectarConEspacio(bus, ctxNativo, ESPACIO_POR_INSTRUMENTO[opts.instrument], rngSonido);

      if (opts.instrument === 'guitarra') {
        dispararEventosGuitarra(bus, eventosPreparados);
        return;
      }

      const voz =
        opts.instrument === 'violin'
          ? crearVozViolin(bus)
          : opts.instrument === 'handpan'
            ? crearVozHandpan(bus)
            : crearVozPercusion(ctxNativo, bus, rngSonido);

      for (const evento of eventosPreparados) voz.disparar(evento);
    },
    totalLength,
    2,
    44100
  );

  const audioBuffer = rendered.get();
  if (!audioBuffer) throw new Error('No se pudo renderizar el audio del instrumento.');
  normalizarPico(audioBuffer);
  return bufferToWavBlob(audioBuffer);
}
