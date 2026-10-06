import type { SegmentoAcordeAnalizado } from '../types';

/** Índice del segmento que contiene el instante `t` (s), o -1 si no hay ninguno. Búsqueda binaria. */
export function indiceSegmentoEn(segmentos: SegmentoAcordeAnalizado[], t: number): number {
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
  return segmentos.map((s, i) => (i === indice ? { ...s, acorde, confianza: 1, editado: true } : s));
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
    limpios.push(seg);
  }
  return { ok: true, segmentos: limpios };
}
