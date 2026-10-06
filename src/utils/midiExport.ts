// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

/**
 * Exportador a MIDI (Standard MIDI File tipo 0) de las ideas que compone la IA.
 *
 * Por qué: un WAV es una referencia que se escucha y poco más. Un .mid se abre en cualquier DAW
 * o editor de partituras, se edita nota a nota, se le cambia el instrumento y se convierte en
 * cifrado. Es la diferencia entre enseñarle una idea al músico y entregársela.
 *
 * Escrito a mano y sin dependencias: el formato son unas pocas decenas de bytes de cabecera más
 * una lista de eventos, y añadir una librería entera para esto no compensa.
 */
import { MelodicInstrument, MelodicNoteEvent } from '../types';
import { notaAMidi } from './musicTheory';

/** Pulsos por negra. 480 es el estándar de facto en los DAW y da resolución de sobra. */
const PPQ = 480;

/**
 * Programa de General MIDI por instrumento, para que al abrir el fichero suene ya parecido a lo
 * que se escuchó en la app en vez de a un piano por defecto.
 */
const PROGRAMA_GM: Record<MelodicInstrument, number> = {
  guitarra: 25,   // Acoustic Guitar (steel)
  violin: 40,     // Violin
  handpan: 114,   // Steel Drums: lo más cercano en GM a un handpan, por construcción y timbre
  percusion: 0    // Ignorado: la percusión va por el canal 10 de batería
};

/**
 * El canal 10 (índice 9) es el canal de percusión de General MIDI: ahí las alturas son sonidos
 * de batería, no notas. Las tres que produce el validador (C2/G2/C3) caen justo en bombo, tom
 * de suelo y tom medio, así que el mapeo sale bien sin tocar nada.
 */
const CANAL_PERCUSION = 9;
const CANAL_MELODICO = 0;

/** Cantidad de longitud variable: 7 bits por byte, con el bit alto marcando "sigue". */
function varLen(valor: number): number[] {
  let v = Math.max(0, Math.round(valor));
  const salida = [v & 0x7f];
  v >>= 7;
  while (v > 0) {
    salida.unshift((v & 0x7f) | 0x80);
    v >>= 7;
  }
  return salida;
}

function texto(str: string): number[] {
  // Se limita a ASCII imprimible: los metadatos de nombre de pista los pintan los DAW con
  // codificaciones muy dispares y un acento puede salir como basura.
  return Array.from(str).map((c) => c.charCodeAt(0)).filter((c) => c >= 32 && c < 127);
}

function chunk(tipo: string, datos: number[]): number[] {
  const len = datos.length;
  return [
    ...texto(tipo),
    (len >> 24) & 0xff, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff,
    ...datos
  ];
}

interface EventoMidi {
  tick: number;
  /** Los note-off van antes que los note-on en el mismo tick: si no, al repicar la misma nota el
   *  off de la anterior mataría a la que acaba de empezar. */
  orden: 0 | 1;
  bytes: number[];
}

export function eventosAMidiBlob(opts: {
  eventos: MelodicNoteEvent[];
  bpm: number;
  instrument: MelodicInstrument;
  nombrePista?: string;
}): Blob {
  const bpm = Math.max(20, Math.min(300, Number(opts.bpm) || 120));
  const esPercusion = opts.instrument === 'percusion';
  const canal = esPercusion ? CANAL_PERCUSION : CANAL_MELODICO;

  const eventos: EventoMidi[] = [];

  for (const ev of opts.eventos || []) {
    const midi = notaAMidi(ev.nota);
    if (midi === null) continue; // Ya no debería pasar tras el validador, pero no se asume.

    const inicio = Math.round((Number(ev.tiempo) || 0) * PPQ);
    const duracion = Math.max(1, Math.round((Number(ev.duracionBeats) || 1) * PPQ));
    const velocidad = Math.max(1, Math.min(127, Math.round((ev.velocidad ?? 0.85) * 127)));

    eventos.push({ tick: inicio, orden: 1, bytes: [0x90 | canal, midi, velocidad] });
    eventos.push({ tick: inicio + duracion, orden: 0, bytes: [0x80 | canal, midi, 0x40] });
  }

  eventos.sort((a, b) => a.tick - b.tick || a.orden - b.orden);

  const microsegundosPorNegra = Math.round(60_000_000 / bpm);
  const pista: number[] = [
    // Tempo, para que el DAW abra el fichero a la velocidad correcta y la rejilla cuadre.
    ...varLen(0), 0xff, 0x51, 0x03,
    (microsegundosPorNegra >> 16) & 0xff, (microsegundosPorNegra >> 8) & 0xff, microsegundosPorNegra & 0xff
  ];

  const nombre = texto(opts.nombrePista || `Idea IA ${opts.instrument}`);
  pista.push(...varLen(0), 0xff, 0x03, ...varLen(nombre.length), ...nombre);

  if (!esPercusion) {
    pista.push(...varLen(0), 0xc0 | canal, PROGRAMA_GM[opts.instrument] ?? 0);
  }

  let ultimoTick = 0;
  for (const ev of eventos) {
    pista.push(...varLen(ev.tick - ultimoTick), ...ev.bytes);
    ultimoTick = ev.tick;
  }

  pista.push(...varLen(0), 0xff, 0x2f, 0x00); // Fin de pista

  const cabecera = chunk('MThd', [
    0x00, 0x00, // formato 0: una sola pista
    0x00, 0x01, // número de pistas
    (PPQ >> 8) & 0xff, PPQ & 0xff
  ]);

  const bytes = new Uint8Array([...cabecera, ...chunk('MTrk', pista)]);
  return new Blob([bytes], { type: 'audio/midi' });
}
