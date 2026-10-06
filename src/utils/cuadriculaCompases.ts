import type { SegmentoAcordeAnalizado } from '../types';

/**
 * Cuadrícula de pulso, compases y bloques deducida de los acordes detectados y del BPM de la
 * canción. No detecta el pulso del audio: busca el desfase y el compás (3 o 4 tiempos) con los que
 * MÁS cambios de acorde caen sobre un pulso, y devuelve cuánto encaja (`calidad`). Los acordes de
 * una banda cambian casi siempre al inicio de compás, así que es una pista fuerte; si no encaja,
 * devuelve null en vez de dibujar compases falsos.
 */

export interface Compas {
  /** Número de compás empezando en 1. */
  n: number;
  t0: number;
  t1: number;
  /** Índice del bloque al que pertenece. */
  bloque: number;
  /** Acorde que suena en cada tiempo del compás (para mostrar cambios dentro del compás). */
  acordes: string[];
}

export interface Bloque {
  indice: number;
  /** A, B, C… Los bloques con la misma progresión comparten letra (verso A, estribillo B…). */
  letra: string;
  /** Compases que abarca [primero, último] (números de compás). */
  desde: number;
  hasta: number;
  t0: number;
  t1: number;
}

export interface Cuadricula {
  bpm: number;
  tiemposPorCompas: 3 | 4;
  duracionPulso: number;
  /** Tiempo (s) del primer pulso de compás en la rejilla (puede ser < 0 si el tema empieza antes). */
  inicioRejilla: number;
  compases: Compas[];
  bloques: Bloque[];
  /** 0-1: fracción media de los cambios de acorde que caen sobre un pulso. */
  calidad: number;
}

export interface PosicionEnCuadricula {
  compas: number;
  /** Tiempo dentro del compás, empezando en 1. */
  tiempo: number;
  /** 0-1 dentro del pulso actual. */
  fraccionPulso: number;
  bloque: number;
}

const CALIDAD_MINIMA = 0.55;

/** Cambios de acorde (instante de cada acorde distinto del anterior), sin «N». */
function cambiosDeAcorde(segmentos: SegmentoAcordeAnalizado[]): number[] {
  const t: number[] = [];
  let previo: string | null = null;
  for (const s of segmentos) {
    if (s.acorde === 'N') continue;
    if (previo !== null && s.acorde !== previo) t.push(s.t0);
    previo = s.acorde;
  }
  return t;
}

/** 1 si el instante cae justo en un pulso de la rejilla, bajando linealmente hasta 0 a ±15 % del pulso. */
const cercania = (t: number, inicio: number, T: number): number => {
  const d = Math.abs(((((t - inicio) % T) + T) % T) - 0);
  const dist = Math.min(d, T - d);
  return Math.max(0, 1 - dist / (0.15 * T));
};

function mejorFase(cambios: number[], T: number): { fase: number; calidad: number } {
  let mejor = { fase: 0, calidad: -1 };
  const pasos = 48;
  for (let i = 0; i < pasos; i++) {
    const fase = (i / pasos) * T;
    const calidad = cambios.reduce((a, t) => a + cercania(t, fase, T), 0) / Math.max(cambios.length, 1);
    if (calidad > mejor.calidad) mejor = { fase, calidad };
  }
  return mejor;
}

function acordeEn(segmentos: SegmentoAcordeAnalizado[], t: number): string {
  for (const s of segmentos) if (t >= s.t0 && t < s.t1) return s.acorde;
  return 'N';
}

/** Similitud 0-1 entre dos secuencias de claves de compás. */
const similitud = (a: string[], b: string[]): number => {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let iguales = 0;
  for (let i = 0; i < n; i++) if (a[i] === b[i]) iguales++;
  return iguales / Math.max(a.length, b.length);
};

export function construirCuadricula(
  segmentos: SegmentoAcordeAnalizado[],
  bpm: number | undefined,
  duracion: number,
  pulso?: { bpm: number; fase: number; confianza: number } | null
): Cuadricula | null {
  // Con el pulso medido en el audio se usa su tempo y su fase tal cual; el BPM de la ficha solo es el plan B.
  const medido = pulso && pulso.confianza >= 0.35 && pulso.bpm >= 40 && pulso.bpm <= 240 ? pulso : null;
  if (medido) bpm = medido.bpm;
  if (!bpm || !Number.isFinite(bpm) || bpm < 40 || bpm > 240 || duracion < 8) return null;
  const cambios = cambiosDeAcorde(segmentos);
  if (cambios.length < 4) return null;

  // 1) Para cada BPM candidato (el de la ficha, su mitad y su doble) se busca el desfase de pulso
  //    y el compás (4 o 3 tiempos, y en qué pulso empieza) que mejor reúnen los cambios de acorde.
  //    Solo con el pulso, 60 y 120 BPM encajarían igual de bien; el inicio de compás desempata,
  //    porque a la mitad del tempo real solo la mitad de los cambios cae en un inicio de compás.
  const evaluar = (candidato: number) => {
    const T = 60 / candidato;
    const { fase, calidad: calidadPulso } = medido
      ? { fase: medido.fase, calidad: cambios.reduce((a, t) => a + cercania(t, medido.fase, T), 0) / cambios.length }
      : mejorFase(cambios, T);
    let tiempos: 3 | 4 = 4;
    let pulsoInicial = 0;
    let calidadCompas = -1;
    let puntuacion = -1;
    for (const m of [4, 3] as const) {
      for (let j = 0; j < m; j++) {
        const inicioBarra = fase + j * T;
        const calidad = cambios.reduce((a, t) => a + cercania(t, inicioBarra, m * T), 0) / cambios.length;
        const ajustada = calidad + (m === 4 ? 0.1 : 0); // 4/4 es lo común: el 3/4 gana solo con claridad
        if (ajustada > puntuacion) {
          puntuacion = ajustada;
          calidadCompas = calidad;
          tiempos = m;
          pulsoInicial = j;
        }
      }
    }
    return { bpm: candidato, T, fase, calidadPulso, tiempos, pulsoInicial, calidadCompas, total: 0.4 * calidadPulso + 0.6 * calidadCompas };
  };

  let mejor: ReturnType<typeof evaluar> | null = null;
  for (const factor of medido ? [1] : [1, 0.5, 2]) {
    const candidato = bpm * factor;
    if (candidato < 40 || candidato > 240) continue;
    const e = evaluar(candidato);
    // El BPM de la ficha manda salvo que otro tempo encaje claramente mejor: con acordes que cambian
    // cada 2 compases, el doble de tempo también encaja y no hay forma de distinguirlos.
    if (!mejor || e.total > mejor.total + 0.15) mejor = e;
  }
  if (!mejor || mejor.calidadPulso < (medido ? 0.35 : CALIDAD_MINIMA)) return null;

  const T = mejor.T;
  const tiempos = mejor.tiempos;
  const pulsoInicial = mejor.pulsoInicial;

  const duracionCompas = tiempos * T;
  let inicio = mejor.fase + pulsoInicial * T;
  inicio -= Math.ceil(inicio / duracionCompas) * duracionCompas; // primer inicio de compás ≤ 0
  if (inicio > 1e-6) inicio -= duracionCompas;

  // 3) Compases.
  const compases: Compas[] = [];
  // El último compás solo cuenta si queda al menos el 40 % de él dentro de la canción.
  for (let n = 1, t = inicio; duracion - t >= 0.4 * duracionCompas; n++, t += duracionCompas) {
    const acordes: string[] = [];
    for (let i = 0; i < tiempos; i++) acordes.push(acordeEn(segmentos, Math.max(0, t + (i + 0.5) * T)));
    compases.push({ n, t0: Math.max(0, t), t1: Math.min(duracion, t + duracionCompas), bloque: 0, acordes });
  }
  if (compases.length < 4) return null;

  // 4) Bloques: longitud (4 u 8 compases) con la que los bloques consecutivos más se repiten.
  const claves = compases.map((c) => c.acordes.filter((a, i, v) => i === 0 || a !== v[i - 1]).join('·'));
  const trocear = (largo: number) => {
    const trozos: string[][] = [];
    for (let i = 0; i < claves.length; i += largo) trozos.push(claves.slice(i, i + largo));
    return trozos;
  };
  let largo = 4;
  let mejorRepeticion = -1;
  for (const candidato of [4, 8]) {
    const trozos = trocear(candidato);
    if (trozos.length < 2) continue;
    let suma = 0;
    for (let i = 1; i < trozos.length; i++) suma += similitud(trozos[i - 1], trozos[i]);
    const media = suma / (trozos.length - 1);
    // Lo normal es un bucle de 4 compases: el de 8 solo gana si repite MUCHO mejor (p. ej. una
    // progresión de 8 compases que se repite entera mientras sus mitades difieren entre sí).
    if (media > mejorRepeticion + 0.2) {
      mejorRepeticion = media;
      largo = candidato;
    }
  }

  const trozos = trocear(largo);
  const letras: string[][] = []; // representantes por letra
  const bloques: Bloque[] = trozos.map((trozo, i) => {
    let idx = letras.findIndex((rep) => similitud(rep, trozo) >= 0.75);
    if (idx < 0) {
      letras.push(trozo);
      idx = letras.length - 1;
    }
    const desde = i * largo + 1;
    const hasta = Math.min(compases.length, (i + 1) * largo);
    compases.slice(desde - 1, hasta).forEach((c) => (c.bloque = i));
    return {
      indice: i,
      letra: String.fromCharCode(65 + (idx % 26)),
      desde,
      hasta,
      t0: compases[desde - 1].t0,
      t1: compases[hasta - 1].t1,
    };
  });

  return { bpm: mejor.bpm, tiemposPorCompas: tiempos, duracionPulso: T, inicioRejilla: inicio, compases, bloques, calidad: mejor.calidadPulso };
}

/** Dónde cae el instante t: compás, tiempo dentro del compás, fracción del pulso y bloque. */
export function posicionEnCuadricula(c: Cuadricula, t: number): PosicionEnCuadricula | null {
  if (t < 0) return null;
  const T = c.duracionPulso;
  const barra = c.tiemposPorCompas * T;
  const relativo = t - c.inicioRejilla;
  if (relativo < 0) return null;
  const indice = Math.min(c.compases.length - 1, Math.floor(relativo / barra));
  const dentro = relativo - Math.floor(relativo / barra) * barra;
  const pulso = Math.min(c.tiemposPorCompas - 1, Math.floor(dentro / T));
  return {
    compas: c.compases[indice].n,
    tiempo: pulso + 1,
    fraccionPulso: Math.min(1, (dentro - pulso * T) / T),
    bloque: c.compases[indice].bloque,
  };
}

/** Progreso (0-1) y segundos restantes de un tramo en el instante t. */
export function progresoDeTramo(t0: number, t1: number, t: number): { progreso: number; restante: number } {
  const dur = Math.max(t1 - t0, 0.001);
  return { progreso: Math.min(1, Math.max(0, (t - t0) / dur)), restante: Math.max(0, t1 - t) };
}
