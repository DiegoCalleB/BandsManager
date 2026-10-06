import type { SegmentoAcordeAnalizado } from '../types';

/** Índice del segmento que contiene el instante `t` (s), o -1 si no hay ninguno. Búsqueda binaria. */
export function indiceSegmentoEn<T extends { t0: number; t1: number }>(segmentos: T[], t: number): number {
  let lo = 0;
  let hi = segmentos.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const s = segmentos[mid];
    if (t < s.t0) hi = mid - 1;
    else if (t >= s.t1) lo = mid + 1;
    else return mid;
  }
  return -1;
}

/** Siguiente segmento con acorde real (salta los «N» sin acorde claro), o -1. */
export function siguienteAcordeReal(segmentos: SegmentoAcordeAnalizado[], desde: number): number {
  for (let i = Math.max(0, desde + 1); i < segmentos.length; i++) {
    if (segmentos[i].acorde !== 'N') return i;
  }
  return -1;
}

export interface RangoBucle {
  desde: number; // s
  hasta: number; // s
}

/** Bucle que cubre desde el segmento `a` hasta el `b` (en cualquier orden), ambos incluidos. */
export function rangoBucle(segmentos: SegmentoAcordeAnalizado[], a: number, b: number): RangoBucle | null {
  if (!segmentos[a] || !segmentos[b]) return null;
  const i = Math.min(a, b);
  const j = Math.max(a, b);
  return { desde: segmentos[i].t0, hasta: segmentos[j].t1 };
}

/**
 * Si el cursor ha pasado el final del bucle devuelve el instante al que hay que volver; si no, null.
 * Margen de 20 ms para no quedarse corto por el redondeo del reloj del audio.
 */
export function saltoDeBucle(bucle: RangoBucle | null, t: number): number | null {
  if (!bucle) return null;
  return t >= bucle.hasta - 0.02 ? bucle.desde : null;
}

/** Cambia un acorde a mano y marca el segmento como editado (la edición manda sobre el análisis). */
export function corregirAcorde(
  segmentos: SegmentoAcordeAnalizado[],
  indice: number,
  acorde: string
): SegmentoAcordeAnalizado[] {
  return segmentos.map((s, i) => {
    if (i !== indice) return s;
    // Se recuerda lo que detectó el algoritmo: las correcciones son la única verdad medida de la que disponemos.
    const detectado = s.editado ? s.detectado : s.acorde;
    return { ...s, acorde, confianza: 1, editado: true, ...(detectado ? { detectado } : {}) };
  });
}

/** Separación mínima entre dos fronteras al editar a mano (s). */
export const TRAMO_MINIMO = 0.2;

const redondear = (t: number) => Math.round(t * 100) / 100;

/** Parte el tramo que contiene `t` en dos (mismo acorde): es el primer paso para meter un cambio que el detector no vio. */
export function partirTramo(segmentos: SegmentoAcordeAnalizado[], t: number): SegmentoAcordeAnalizado[] {
  const i = indiceSegmentoEn(segmentos, t);
  if (i < 0) return segmentos;
  const s = segmentos[i];
  const corte = redondear(t);
  if (corte - s.t0 < TRAMO_MINIMO || s.t1 - corte < TRAMO_MINIMO) return segmentos;
  const detectado = s.detectado ?? (s.editado ? undefined : s.acorde);
  const marcado = { editado: true as const, ...(detectado ? { detectado } : {}) };
  return [...segmentos.slice(0, i), { ...s, t1: corte, ...marcado }, { ...s, t0: corte, ...marcado }, ...segmentos.slice(i + 1)];
}

/** Mueve la frontera entre el tramo `i-1` y el `i` a `t`, sin dejar ninguno por debajo de TRAMO_MINIMO. */
export function moverFrontera(segmentos: SegmentoAcordeAnalizado[], i: number, t: number): SegmentoAcordeAnalizado[] {
  if (i <= 0 || i >= segmentos.length) return segmentos;
  const previo = segmentos[i - 1];
  const actual = segmentos[i];
  const nuevo = redondear(Math.min(actual.t1 - TRAMO_MINIMO, Math.max(previo.t0 + TRAMO_MINIMO, t)));
  if (nuevo === actual.t0) return segmentos;
  return segmentos.map((s, k) => (k === i - 1 ? { ...s, t1: nuevo, editado: true } : k === i ? { ...s, t0: nuevo, editado: true } : s));
}

/** Elimina un cambio inventado: el tramo `i` se funde con el anterior. */
export function unirConAnterior(segmentos: SegmentoAcordeAnalizado[], i: number): SegmentoAcordeAnalizado[] {
  if (i <= 0 || i >= segmentos.length) return segmentos;
  const previo = segmentos[i - 1];
  const fundido: SegmentoAcordeAnalizado = { ...previo, t1: segmentos[i].t1, editado: true };
  if (!fundido.detectado && !previo.editado) fundido.detectado = previo.acorde;
  return [...segmentos.slice(0, i - 1), fundido, ...segmentos.slice(i + 1)];
}

/**
 * Desplaza todo el análisis `delta` segundos (positivo = los acordes llegan más tarde). Corrige un
 * desfase constante entre el audio analizado y el que suena. Los tramos que se salen por la izquierda
 * se recortan o se descartan.
 */
export function desplazarSegmentos(segmentos: SegmentoAcordeAnalizado[], delta: number): SegmentoAcordeAnalizado[] {
  const fuera: SegmentoAcordeAnalizado[] = [];
  for (const s of segmentos) {
    const t1 = redondear(s.t1 + delta);
    if (t1 <= TRAMO_MINIMO / 2) continue;
    fuera.push({ ...s, t0: Math.max(0, redondear(s.t0 + delta)), t1 });
  }
  if (fuera.length > 0 && delta > 0 && fuera[0].t0 > 0) {
    // Hueco al principio: el primer acorde se estira hasta el inicio para no dejar un tramo sin cubrir.
    fuera[0] = { ...fuera[0], t0: 0 };
  }
  return fuera;
}

// ── Normalización y validación de acordes escritos a mano ──────────────────────────────────────

const ESPANOL: Record<string, string> = { do: 'C', re: 'D', mi: 'E', fa: 'F', sol: 'G', la: 'A', si: 'B' };
const SOSTENIDO: Record<string, string> = { Cb: 'B', Db: 'C#', Eb: 'D#', Fb: 'E', Gb: 'F#', Ab: 'G#', Bb: 'A#' };
// Sufijos admitidos: calidad, extensión, alteraciones y bajo (inversión). No pretende cubrir todo
// el jazz, sí lo que un músico de banda escribe de verdad.
const SUFIJO = /^(m|min|maj|M|dim|aug|\+|°)?(\d{1,2})?(sus[24]?|add\d{1,2}|b5|#5|b9|#9|b13)?(\/[A-G][#b]?)?$/;

function raizASostenido(raiz: string): string {
  return SOSTENIDO[raiz] ?? raiz;
}

/**
 * Convierte lo que escribe el usuario («Lam», «Do#m7», «Bb», «F/A», «sin acorde») a notación
 * internacional con sostenidos («Am», «C#m7», «A#», «F/A», «N»). Devuelve null si no es un acorde
 * reconocible: mejor rechazarlo que guardar basura que el visor intentaría transponer.
 */
export function normalizarAcorde(entrada: string | null | undefined): string | null {
  const t = (entrada ?? '').trim();
  if (!t) return null;
  if (/^(n|—|-|sin acorde|ninguno)$/i.test(t)) return 'N';

  const aSufijo = (resto: string): string | null => {
    const r = resto.replace(/^min(?!\d)/i, 'm');
    return SUFIJO.test(r) ? r : null;
  };
  const bajo = (r: string) => r.replace(/\/([A-G][#b]?)$/, (_m, n) => `/${raizASostenido(n)}`);

  // 1) Notación internacional («Am», «Bb», «Fadd9»)
  const ingles = /^([A-G])([#b]?)(.*)$/.exec(t);
  if (ingles) {
    const suf = aSufijo(ingles[3]);
    if (suf !== null) return `${raizASostenido(ingles[1] + ingles[2])}${bajo(suf)}`;
  }
  // 2) Notación española («Lam», «Sib», «Do#m7»)
  const es = /^(do|re|mi|fa|sol|la|si)([#b♯♭]?)(.*)$/i.exec(t);
  if (es) {
    const alt = es[2] === '♯' ? '#' : es[2] === '♭' ? 'b' : es[2];
    const suf = aSufijo(es[3]);
    if (suf !== null) return `${raizASostenido(ESPANOL[es[1].toLowerCase()] + alt)}${bajo(suf)}`;
  }
  return null;
}

export type ResultadoValidacion =
  | { ok: true; segmentos: SegmentoAcordeAnalizado[] }
  | { ok: false; error: string };

const MAX_SEGMENTOS = 2000;

/** Valida y limpia los segmentos que llegan del cliente: nunca se guarda lo que no se ha comprobado. */
export function validarSegmentos(entrada: unknown): ResultadoValidacion {
  if (!Array.isArray(entrada) || entrada.length === 0) return { ok: false, error: 'Faltan los acordes.' };
  if (entrada.length > MAX_SEGMENTOS) return { ok: false, error: `Demasiados tramos (máximo ${MAX_SEGMENTOS}).` };
  const limpios: SegmentoAcordeAnalizado[] = [];
  for (let i = 0; i < entrada.length; i++) {
    const s = entrada[i] as Record<string, unknown> | null;
    const t0 = Number(s?.t0);
    const t1 = Number(s?.t1);
    if (!Number.isFinite(t0) || !Number.isFinite(t1) || t0 < 0 || t1 <= t0 || t1 > 86_400) {
      return { ok: false, error: `Tiempos inválidos en el tramo ${i + 1}.` };
    }
    if (i > 0 && t0 < limpios[i - 1].t1 - 0.05) return { ok: false, error: `El tramo ${i + 1} se solapa con el anterior.` };
    const acorde = normalizarAcorde(typeof s?.acorde === 'string' ? s.acorde : '');
    if (!acorde) return { ok: false, error: `Acorde no reconocido en el tramo ${i + 1}.` };
    const conf = Number(s?.confianza);
    const seg: SegmentoAcordeAnalizado = {
      t0, t1, acorde, confianza: Number.isFinite(conf) ? Math.min(1, Math.max(0, conf)) : 0,
    };
    if (s?.editado === true) seg.editado = true;
    const det = typeof s?.detectado === 'string' ? normalizarAcorde(s.detectado) : null;
    if (det) seg.detectado = det;
    limpios.push(seg);
  }
  return { ok: true, segmentos: limpios };
}
