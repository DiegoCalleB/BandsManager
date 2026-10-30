/**
 * Benchmark de acordes contra referencias escritas a mano: junta la evaluación por canción en un
 * resumen ponderado por segundos y lo compara con una línea base para detectar regresiones.
 */
import { evaluarAcordes, type ResultadoEvaluacion, type TramoEval } from './evaluacionAcordes';

export interface ResumenCancion {
  cancion: string;
  resultado: ResultadoEvaluacion | null;
}

export interface ResumenBenchmark {
  canciones: ResumenCancion[];
  total: { segundos: number; mayorMenor: number; raiz: number; encontrados03: number; errorMedio: number; sesgo: number };
}

/** Métricas que se congelan en la línea base. */
export type MetricasBase = ResumenBenchmark['total'];

export function ejecutarBenchmark(referencias: Map<string, TramoEval[]>, predicciones: Map<string, TramoEval[]>): ResumenBenchmark {
  const canciones: ResumenCancion[] = [];
  for (const [cancion, ref] of [...referencias].sort(([a], [b]) => a.localeCompare(b))) {
    const pred = predicciones.get(cancion);
    canciones.push({ cancion, resultado: pred?.length ? evaluarAcordes(ref, pred) : null });
  }
  const ok = canciones.flatMap((c) => (c.resultado ? [c.resultado] : []));
  const seg = ok.reduce((a, r) => a + r.segundosEvaluados, 0);
  const pond = (f: (r: ResultadoEvaluacion) => number) => (seg ? ok.reduce((a, r) => a + f(r) * r.segundosEvaluados, 0) / seg : 0);
  const media = (f: (r: ResultadoEvaluacion) => number) => (ok.length ? ok.reduce((a, r) => a + f(r), 0) / ok.length : 0);
  const r3 = (x: number) => Math.round(x * 1000) / 1000;
  return {
    canciones,
    total: {
      segundos: Math.round(seg),
      mayorMenor: r3(pond((r) => r.mayorMenor)),
      raiz: r3(pond((r) => r.raiz)),
      encontrados03: r3(media((r) => r.cambios.encontrados03)),
      errorMedio: r3(media((r) => r.cambios.errorMedio)),
      sesgo: r3(media((r) => r.cambios.sesgo)),
    },
  };
}

/** Devuelve los textos de las métricas que empeoran más que `tolerancia` (puntos de 0–1 o segundos). */
export function regresiones(actual: MetricasBase, base: MetricasBase, tolerancia = 0.02): string[] {
  const fallos: string[] = [];
  for (const k of ['mayorMenor', 'raiz', 'encontrados03'] as const) {
    if (actual[k] < base[k] - tolerancia) fallos.push(`${k}: ${base[k]} → ${actual[k]}`);
  }
  if (actual.errorMedio > base.errorMedio + 0.05) fallos.push(`errorMedio: ${base.errorMedio}s → ${actual.errorMedio}s`);
  return fallos;
}
