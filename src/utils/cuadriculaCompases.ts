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
  /** Instante (s) de cada tiempo, cuando la rejilla sale de los pulsos reales del audio (tempo variable). */
  pulsos?: number[];
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
  /** La rejilla no se apoya en nada firme (acordes escasos o irregulares): se dibuja, pero avisando. */
  aproximada: boolean;
  /** Por qué es aproximada. */
  causa?: 'pocos-acordes' | 'no-encaja';
  /** Los compases salen de los pulsos y los «1» que la red marcó en el audio: siguen al tempo real. */
  delAudio?: boolean;
}

/** Pulso medido en el audio (lo que guarda el análisis de acordes). */
export interface PulsoMedido {
  bpm: number;
  fase: number;
  confianza: number;
  pulsos?: number[];
  /** Inicios de compás marcados por la red (subconjunto de `pulsos`). */
  compases?: number[];
  tiempos?: 3 | 4;
}

/** Por qué no hay rejilla ni siquiera aproximada. */
export type MotivoSinCuadricula = 'sin-bpm' | 'pista-corta' | 'pocos-compases';

/** Correcciones del músico: mandan sobre lo deducido. `inicio` es el instante (s) de un inicio de compás. */
export interface AjusteCompases {
  bpm?: number;
  inicio?: number;
  tiempos?: 3 | 4;
}

export interface ResultadoCuadricula {
  cuadricula: Cuadricula | null;
  motivo?: MotivoSinCuadricula;
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

/** Solo rejillas firmes (las que se apoyan en los acordes o en el pulso medido); las aproximadas dan null. */
export function construirCuadricula(
  segmentos: SegmentoAcordeAnalizado[],
  bpm: number | undefined,
  duracion: number,
  pulso?: PulsoMedido | null
): Cuadricula | null {
  const { cuadricula } = analizarCuadricula(segmentos, bpm, duracion, pulso);
  return cuadricula && !cuadricula.aproximada ? cuadricula : null;
}

const bpmValido = (b: number | undefined): b is number => !!b && Number.isFinite(b) && b >= 40 && b <= 240;

/**
 * Como `construirCuadricula`, pero en vez de rendirse dibuja una rejilla aproximada cuando hay BPM
 * pero los acordes no la confirman, admite las correcciones del músico y, si no hay rejilla, dice por qué.
 */
export function analizarCuadricula(
  segmentos: SegmentoAcordeAnalizado[],
  bpm: number | undefined,
  duracion: number,
  pulso?: PulsoMedido | null,
  ajuste?: AjusteCompases
): ResultadoCuadricula {
  // Con pulsos y compases reales del audio (Beat This!) la rejilla sigue al tempo de verdad.
  if (pulso?.compases && pulso.compases.length >= 4 && pulso.pulsos && pulso.confianza >= 0.35 && duracion >= 8) {
    const real = cuadriculaDesdePulsos(segmentos, pulso as Required<PulsoMedido>, duracion, ajuste);
    if (real) return { cuadricula: real };
  }

  // Con el pulso medido en el audio se usa su tempo y su fase tal cual; el BPM de la ficha solo es el plan B.
  // Si el músico fija el BPM a mano, manda su BPM y la fase se busca de nuevo.
  const manual = bpmValido(ajuste?.bpm);
  const medido = !manual && pulso && pulso.confianza >= 0.35 && pulso.bpm >= 40 && pulso.bpm <= 240 ? pulso : null;
  if (manual) bpm = ajuste!.bpm;
  else if (medido) bpm = medido.bpm;
  if (!bpmValido(bpm)) return { cuadricula: null, motivo: 'sin-bpm' };
  if (duracion < 8) return { cuadricula: null, motivo: 'pista-corta' };
  const cambios = cambiosDeAcorde(segmentos);

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
  let causa: Cuadricula['causa'];
  if (cambios.length < 4) {
    // Con pocos cambios no hay de dónde deducir fase ni compás: 4/4 desde el pulso medido (o desde 0).
    causa = 'pocos-acordes';
    mejor = { bpm, T: 60 / bpm, fase: medido?.fase ?? 0, calidadPulso: 0, tiempos: 4, pulsoInicial: 0, calidadCompas: 0, total: 0 };
  } else {
    for (const factor of medido || manual ? [1] : [1, 0.5, 2]) {
      const candidato = bpm * factor;
      if (candidato < 40 || candidato > 240) continue;
      const e = evaluar(candidato);
      // El BPM de la ficha manda salvo que otro tempo encaje claramente mejor: con acordes que cambian
      // cada 2 compases, el doble de tempo también encaja y no hay forma de distinguirlos.
      if (!mejor || e.total > mejor.total + 0.15) mejor = e;
    }
  }
  if (!mejor) return { cuadricula: null, motivo: 'sin-bpm' };
  if (!causa && !manual && mejor.calidadPulso < (medido ? 0.35 : CALIDAD_MINIMA)) causa = 'no-encaja';

  const T = mejor.T;
  let tiempos = mejor.tiempos;
  let pulsoInicial = mejor.pulsoInicial;
  let fase = mejor.fase;
  // El músico marca un inicio de compás y/o el compás: lo suyo manda y la rejilla deja de ser aproximada.
  if (ajuste?.tiempos) tiempos = ajuste.tiempos;
  if (ajuste?.inicio !== undefined && Number.isFinite(ajuste.inicio)) {
    const barra = tiempos * T;
    fase = ((ajuste.inicio % barra) + barra) % barra;
    pulsoInicial = 0;
  }
  pulsoInicial = Math.min(pulsoInicial, tiempos - 1);
  if (manual || ajuste?.inicio !== undefined) causa = undefined;

  const duracionCompas = tiempos * T;
  let inicio = fase + pulsoInicial * T;
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
  if (compases.length < 4) return { cuadricula: null, motivo: 'pocos-compases' };

  const bloques = agruparEnBloques(compases);

  return {
    cuadricula: { bpm: mejor.bpm, tiemposPorCompas: tiempos, duracionPulso: T, inicioRejilla: inicio, compases, bloques, calidad: mejor.calidadPulso, aproximada: !!causa, ...(causa ? { causa } : {}) },
  };
}

/** Índice del pulso más cercano a t (búsqueda binaria; `pulsos` va en orden). */
function pulsoMasCercano(pulsos: number[], t: number): number {
  let lo = 0, hi = pulsos.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (pulsos[m] <= t) lo = m; else hi = m;
  }
  return Math.abs(pulsos[lo] - t) <= Math.abs(pulsos[hi] - t) ? lo : hi;
}

/**
 * Rejilla sobre los pulsos y los «1» reales del audio: cada compás dura lo que dura de verdad, así
 * que la rejilla no se desfasa aunque la banda acelere o frene. Las correcciones del músico se
 * aplican sobre esos mismos pulsos: «compás 1 aquí» y ◀ ▶ recolocan el 1 en el pulso más cercano,
 * 3/4 ↔ 4/4 reagrupa, y ½× / 2× se queda con uno de cada dos pulsos o intercala los que faltan.
 * Un BPM manual que no sea mitad ni doble del medido devuelve null: entonces manda el del músico.
 */
export function cuadriculaDesdePulsos(
  segmentos: SegmentoAcordeAnalizado[],
  pulso: Required<Pick<PulsoMedido, 'bpm' | 'pulsos' | 'compases'>> & PulsoMedido,
  duracion: number,
  ajuste?: AjusteCompases
): Cuadricula | null {
  let pulsos = pulso.pulsos.filter((t) => t >= 0 && t < duracion);
  if (pulsos.length < 8) return null;
  let bpm = pulso.bpm;
  let reagrupar = ajuste?.inicio !== undefined || (!!ajuste?.tiempos && ajuste.tiempos !== pulso.tiempos);
  if (bpmValido(ajuste?.bpm) && Math.abs(ajuste.bpm / bpm - 1) > 0.08) {
    const r = ajuste.bpm / bpm;
    if (Math.abs(r - 0.5) < 0.06) {
      // Mitad: la paridad que lleva más «1» de la red.
      const unos = pulso.compases.map((t) => pulsoMasCercano(pulsos, t));
      const par = unos.filter((i) => i % 2 === 0).length >= unos.length / 2 ? 0 : 1;
      pulsos = pulsos.filter((_, i) => i % 2 === par);
    } else if (Math.abs(r - 2) < 0.16) {
      pulsos = pulsos.flatMap((t, i) => (i + 1 < pulsos.length ? [t, (t + pulsos[i + 1]) / 2] : [t]));
    } else return null;
    bpm = Math.round(bpm * r * 10) / 10;
    reagrupar = true;
  }
  const tiempos: 3 | 4 = ajuste?.tiempos ?? pulso.tiempos ?? 4;

  // Índices de los pulsos que son «1».
  let unos: number[];
  if (reagrupar) {
    const ancla = pulsoMasCercano(pulsos, ajuste?.inicio ?? pulso.compases[0]);
    unos = pulsos.map((_, i) => i).filter((i) => (((i - ancla) % tiempos) + tiempos) % tiempos === 0);
  } else {
    unos = [...new Set(pulso.compases.map((t) => pulsoMasCercano(pulsos, t)))].sort((a, b) => a - b);
  }
  if (unos.length < 2) return null;
  // Donde la red no marcó «1» (principio, final o un tramo largo) se sigue contando de `tiempos` en `tiempos`.
  const completos: number[] = [];
  unos.forEach((u, k) => {
    completos.push(u);
    for (let i = u + tiempos; k + 1 < unos.length && unos[k + 1] - i >= tiempos; i += tiempos) completos.push(i);
  });
  while (completos[0] >= tiempos) completos.unshift(completos[0] - tiempos);
  while (completos[completos.length - 1] + tiempos < pulsos.length) completos.push(completos[completos.length - 1] + tiempos);
  unos = completos;

  // Periodo local para completar el primer y el último compás con pulsos fuera del audio.
  const periodo = (i: number) => {
    const a = Math.min(Math.max(i, 1), pulsos.length - 1);
    return pulsos[a] - pulsos[a - 1];
  };
  const tramos: number[][] = [];
  if (unos[0] > 0) {
    // Anacrusa: el compás se completa hacia atrás para que el 1 caiga donde toca.
    const antes = pulsos.slice(0, unos[0]);
    while (antes.length < tiempos) antes.unshift(antes[0] - periodo(1));
    tramos.push(antes.slice(-tiempos));
  }
  for (let k = 0; k < unos.length; k++) {
    const tramo = pulsos.slice(unos[k], k + 1 < unos.length ? unos[k + 1] : unos[k] + tiempos);
    if (k === unos.length - 1) {
      while (tramo.length < tiempos) tramo.push(tramo[tramo.length - 1] + periodo(pulsos.length - 1));
    }
    tramos.push(tramo);
  }

  const compases: Compas[] = [];
  for (const [k, tramo] of tramos.entries()) {
    const t0 = tramo[0];
    const t1 = k + 1 < tramos.length ? tramos[k + 1][0] : tramo[tramo.length - 1] + periodo(pulsos.length - 1);
    // El último compás solo cuenta si queda al menos el 40 % de él dentro de la canción.
    if (k === tramos.length - 1 && duracion - t0 < 0.4 * (t1 - t0)) break;
    const fines = [...tramo.slice(1), t1];
    compases.push({
      n: compases.length + 1,
      t0: Math.max(0, t0),
      t1: Math.min(duracion, t1),
      bloque: 0,
      // Los pulsos reconstruidos antes de que empiece el audio no suenan.
      acordes: tramo.map((t, i) => (t < 0 ? 'N' : acordeEn(segmentos, (t + fines[i]) / 2))),
      pulsos: tramo.map((t) => Math.max(0, t)),
    });
  }
  if (compases.length < 4) return null;

  // Calidad: cuántos cambios de acorde caen en un pulso (con la red suele ser casi 1).
  const cambios = cambiosDeAcorde(segmentos);
  const T = 60 / bpm;
  const calidad = cambios.length
    ? cambios.reduce((a, t) => a + Math.max(0, 1 - Math.abs(pulsos[pulsoMasCercano(pulsos, t)] - t) / (0.15 * T)), 0) / cambios.length
    : 1;
  return {
    bpm,
    tiemposPorCompas: tiempos,
    duracionPulso: T,
    inicioRejilla: tramos[0][0],
    compases,
    bloques: agruparEnBloques(compases),
    calidad,
    aproximada: false,
    delAudio: true,
  };
}

/**
 * Bloques: longitud (4 u 8 compases) con la que los bloques consecutivos más se repiten; los que
 * repiten progresión comparten letra. Asigna `bloque` a cada compás.
 */
function agruparEnBloques(compases: Compas[]): Bloque[] {
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

  return bloques;
}

/** Dónde cae el instante t: compás, tiempo dentro del compás, fracción del pulso y bloque. */
export function posicionEnCuadricula(c: Cuadricula, t: number): PosicionEnCuadricula | null {
  if (t < 0) return null;
  if (c.delAudio) return posicionEnCompasesReales(c, t);
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

/** Posición con compases de duración real: búsqueda binaria del compás y del pulso dentro de él. */
function posicionEnCompasesReales(c: Cuadricula, t: number): PosicionEnCuadricula | null {
  const { compases } = c;
  if (!compases.length || t < compases[0].t0) return null;
  let lo = 0, hi = compases.length - 1;
  while (lo < hi) {
    const m = (lo + hi + 1) >> 1;
    if (compases[m].t0 <= t) lo = m; else hi = m - 1;
  }
  const k = compases[lo];
  const pulsos = k.pulsos ?? [k.t0];
  let p = 0;
  while (p + 1 < pulsos.length && pulsos[p + 1] <= t) p++;
  const fin = p + 1 < pulsos.length ? pulsos[p + 1] : k.t1;
  return { compas: k.n, tiempo: p + 1, fraccionPulso: Math.min(1, Math.max(0, (t - pulsos[p]) / Math.max(fin - pulsos[p], 0.001))), bloque: k.bloque };
}
