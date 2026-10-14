/**
 * Aprendizaje por banda a partir de las métricas reales de sus Reels (Fase 5 del plan).
 *
 * KPI estrella: rewatch = tiempo medio visto / duración del clip. 1 = de media se ve entero;
 * 3 = "lo ven tres veces". Es la métrica que premian los algoritmos y la que persigue el loop.
 *
 * La recomendación usa Thompson sampling (Beta-Bernoulli) sobre unos pocos formatos: con pocos
 * datos explora, con muchos aprovecha lo que de verdad funciona en ESA banda. Éxito = rewatch ≥ 1.
 * Todo es puro: el azar entra por parámetro para poder reproducirlo en tests.
 */

/** Horas tras publicar en las que se mide cada Reel. */
export const MEDICIONES_H = [1, 24, 72, 168] as const;
export type HorasMedicion = (typeof MEDICIONES_H)[number];

export const FORMATOS = ["loop_corto", "corto", "medio", "largo"] as const;
export type Formato = (typeof FORMATOS)[number];

export const NOMBRE_FORMATO: Record<Formato, string> = {
  loop_corto: "loop corto (≤15 s)",
  corto: "corto sin loop (≤15 s)",
  medio: "medio (16-30 s)",
  largo: "largo (más de 30 s)"
};

/** Con menos reels medidos que esto no se presume de saber nada. */
export const MIN_MUESTRAS = 3;

export function medicionesPendientes(publicadoEn: string, tomadas: number[], ahora: Date): HorasMedicion[] {
  const inicio = Date.parse(publicadoEn);
  if (Number.isNaN(inicio)) return [];
  const horas = (ahora.getTime() - inicio) / 3_600_000;
  return MEDICIONES_H.filter((h) => horas >= h && !tomadas.includes(h));
}

export interface MetricasCrudas {
  duracionSeg: number;
  avgWatchMs: number | null;
  reach: number | null;
  shares: number | null;
  saves: number | null;
  views: number | null;
}

export interface Kpis {
  rewatch: number | null;
  tasaCompartir: number | null;
  tasaGuardar: number | null;
}

const ratio = (a: number | null, b: number | null) => (a !== null && b !== null && b > 0 ? a / b : null);

export function kpisDeReel(m: MetricasCrudas): Kpis {
  return {
    rewatch: ratio(m.avgWatchMs === null ? null : m.avgWatchMs / 1000, m.duracionSeg),
    tasaCompartir: ratio(m.shares, m.reach),
    tasaGuardar: ratio(m.saves, m.reach)
  };
}

export function formatoDeClip(duracionSeg: number, loop: boolean): Formato {
  if (duracionSeg <= 15) return loop ? "loop_corto" : "corto";
  return duracionSeg <= 30 ? "medio" : "largo";
}

export interface ReelMedido extends Kpis {
  formato: Formato;
}

/* ---------------------------------------------------------- Thompson sampling */

/** I_x(a, b) para enteros: P(Binomial(a+b-1, x) ≥ a). */
function betaCdf(x: number, a: number, b: number): number {
  const n = a + b - 1;
  let suma = 0;
  let coef = 1; // C(n, k), se actualiza incrementalmente
  for (let k = 0; k <= n; k++) {
    if (k > 0) coef = (coef * (n - k + 1)) / k;
    if (k >= a) suma += coef * x ** k * (1 - x) ** (n - k);
  }
  return suma;
}

/** Cuantil u de Beta(a, b) por bisección (inversa de la CDF). */
export function cuantilBeta(u: number, a: number, b: number): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (betaCdf(mid, a, b) < u) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export interface Recomendacion {
  formato: Formato;
  modo: "explorando" | "aprovechando";
  muestras: number;
  explicacion: string;
}

export function recomendarFormato(historial: ReelMedido[], rng: () => number = Math.random): Recomendacion {
  const conDato = historial.filter((r) => r.rewatch !== null);
  const brazos = FORMATOS.map((formato) => {
    const del = conDato.filter((r) => r.formato === formato);
    const exitos = del.filter((r) => (r.rewatch as number) >= 1).length;
    return { formato, exitos, total: del.length, muestra: cuantilBeta(rng(), 1 + exitos, 1 + del.length - exitos) };
  });
  const elegido = brazos.reduce((mejor, b) => (b.muestra > mejor.muestra ? b : mejor));
  const modo = conDato.length >= MIN_MUESTRAS ? "aprovechando" : "explorando";
  const explicacion =
    modo === "explorando"
      ? `Aún hay ${conDato.length} reel(s) medido(s): se prueba ${NOMBRE_FORMATO[elegido.formato]} para aprender qué funciona.`
      : elegido.total > 0
        ? `En formato ${NOMBRE_FORMATO[elegido.formato]}, ${elegido.exitos} de ${elegido.total} reels se vieron enteros de media o más.`
        : `Nunca se ha probado ${NOMBRE_FORMATO[elegido.formato]}: toca medirlo.`;
  return { formato: elegido.formato, modo, muestras: conDato.length, explicacion };
}

/* ------------------------------------------------------------------- resumen */

const mediana = (v: number[]): number | null => {
  if (!v.length) return null;
  const s = [...v].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export interface ResumenAprendizaje {
  reelsMedidos: number;
  rewatchMediano: number | null;
  tasaCompartirMediana: number | null;
  tasaGuardarMediana: number | null;
}

export function resumirAprendizaje(historial: ReelMedido[]): ResumenAprendizaje {
  const valores = (k: keyof Kpis) => historial.map((r) => r[k]).filter((v): v is number => v !== null);
  return {
    reelsMedidos: historial.filter((r) => r.rewatch !== null).length,
    rewatchMediano: mediana(valores("rewatch")),
    tasaCompartirMediana: mediana(valores("tasaCompartir")),
    tasaGuardarMediana: mediana(valores("tasaGuardar"))
  };
}

/** Bloque para el prompt del análisis: qué duración y formato priorizar para esta banda. */
export function bloqueAprendizajeParaPrompt(resumen: ResumenAprendizaje, rec: Recomendacion): string {
  if (rec.modo === "explorando") return "";
  return [
    "LO QUE HAN MEDIDO LOS REELS YA PUBLICADOS DE ESTA BANDA (datos reales, no suposiciones):",
    `- ${resumen.reelsMedidos} reels medidos; rewatch mediano ${resumen.rewatchMediano?.toFixed(2) ?? "?"} (1 = se ve entero de media).`,
    `- ${rec.explicacion}`,
    `- Prioriza cortes de formato ${NOMBRE_FORMATO[rec.formato]} cuando el material lo permita.`
  ].join("\n");
}
