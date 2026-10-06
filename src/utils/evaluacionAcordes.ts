/**
 * Evaluación de acordes contra una referencia (las correcciones manuales de la banda, o un fichero
 * de verdad). Es lo que permite decidir con NÚMEROS si un detector o un modelo nuevo es mejor:
 * sin esto, cada «mejora» es una opinión.
 *
 * Métricas (las de MIREX, simplificadas):
 *  - raiz: % del tiempo en que coincide la nota fundamental.
 *  - mayorMenor: % del tiempo en que coinciden fundamental y modo (mayor/menor). Es la métrica
 *    habitual para comparar detectores; un «G7» cuenta como «G» y un «Am7» como «Am».
 *  - exacto: % del tiempo con el mismo nombre de acorde.
 *  - cambios: de los cambios de acorde de la referencia, cuántos tienen un cambio detectado
 *    cerca (≤0,3 s y ≤1 s), el error medio de los encontrados y cuántos cambios sobran.
 */

export interface TramoEval {
  t0: number;
  t1: number;
  acorde: string;
}

const NOTAS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const ES: Record<string, string> = { do: 'C', re: 'D', mi: 'E', fa: 'F', sol: 'G', la: 'A', si: 'B' };

export interface AcordeReducido {
  raiz: number;
  modo: 'maj' | 'min';
}

/**
 * Reduce un acorde a fundamental + mayor/menor. Acepta notación internacional («F#m7», «Bb»),
 * española («Sim», «Fa#m») y la de los ficheros .lab de MIREX («A:min», «C:maj7»). «N» o algo
 * irreconocible → null (sin acorde).
 */
export function reducirAcorde(acorde: string | null | undefined): AcordeReducido | null {
  const t = (acorde ?? '').trim();
  if (!t || /^(n|x|nc|n\.c\.)$/i.test(t)) return null;
  let raizTxt: string;
  let resto: string;
  const es = /^(do|re|mi|fa|sol|la|si)([#b♯♭]?)(.*)$/i.exec(t);
  const en = /^([A-G])([#b♯♭]?)(.*)$/.exec(t);
  // Primero la española: «Fa#m» empieza por «F» y se leería como Fa + «a#m».
  if (es) {
    raizTxt = ES[es[1].toLowerCase()] + es[2];
    resto = es[3];
  } else if (en) {
    raizTxt = en[1] + en[2];
    resto = en[3];
  } else return null;
  let raiz = NOTAS[raizTxt[0]];
  if (/[#♯]/.test(raizTxt)) raiz += 1;
  if (/[b♭]/.test(raizTxt.slice(1))) raiz -= 1;
  raiz = (raiz + 12) % 12;
  const calidad = resto.replace(/^:/, '').replace(/\/.*$/, '');
  const menor = /^(m(?!aj)|min|-)/.test(calidad) || /^(dim|°|hdim)/.test(calidad);
  return { raiz, modo: menor ? 'min' : 'maj' };
}

function acordeEn(tramos: TramoEval[], t: number): string | null {
  let lo = 0, hi = tramos.length - 1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (t < tramos[m].t0) hi = m - 1;
    else if (t >= tramos[m].t1) lo = m + 1;
    else return tramos[m].acorde;
  }
  return null;
}

/** Instantes de cambio real de acorde (ignorando «N» y repeticiones del mismo acorde reducido). */
export function instantesDeCambio(tramos: TramoEval[]): number[] {
  const t: number[] = [];
  let previo: string | null = null;
  for (const s of tramos) {
    const r = reducirAcorde(s.acorde);
    if (!r) continue;
    const clave = `${r.raiz}${r.modo}`;
    if (previo !== null && clave !== previo) t.push(s.t0);
    previo = clave;
  }
  return t;
}

export interface ResultadoEvaluacion {
  segundosEvaluados: number;
  raiz: number;
  mayorMenor: number;
  exacto: number;
  cambios: {
    referencia: number;
    detectados: number;
    encontrados03: number; // fracción con un cambio detectado a ≤0,3 s
    encontrados1: number; // fracción a ≤1 s
    errorMedio: number; // s, de los encontrados a ≤1 s
    sobrantes: number; // cambios detectados sin ninguno de referencia a ≤1 s
  };
}

export function evaluarAcordes(
  referencia: TramoEval[],
  prediccion: TramoEval[],
  opciones: { desde?: number; hasta?: number; paso?: number } = {},
): ResultadoEvaluacion | null {
  const ref = [...referencia].sort((a, b) => a.t0 - b.t0);
  const pred = [...prediccion].sort((a, b) => a.t0 - b.t0);
  if (ref.length === 0) return null;
  const desde = opciones.desde ?? ref[0].t0;
  const hasta = opciones.hasta ?? ref[ref.length - 1].t1;
  const paso = opciones.paso ?? 0.05;
  let total = 0, raiz = 0, mm = 0, exacto = 0;
  for (let t = desde; t < hasta; t += paso) {
    const a = acordeEn(ref, t);
    const ra = reducirAcorde(a);
    if (!ra) continue; // los tramos sin acorde en la referencia no cuentan (como en MIREX)
    total++;
    const b = acordeEn(pred, t);
    const rb = reducirAcorde(b);
    if (rb && rb.raiz === ra.raiz) {
      raiz++;
      if (rb.modo === ra.modo) mm++;
    }
    if (b && a && b.replace(/^:/, '') === a) exacto++;
  }
  if (total === 0) return null;

  const enRango = (t: number) => t >= desde && t < hasta;
  const cRef = instantesDeCambio(ref).filter(enRango);
  const cPred = instantesDeCambio(pred).filter(enRango);
  const masCercano = (t: number, lista: number[]) => lista.reduce((m, x) => Math.min(m, Math.abs(x - t)), Infinity);
  const distancias = cRef.map((t) => masCercano(t, cPred));
  const cerca1 = distancias.filter((d) => d <= 1);
  const r = (x: number) => Math.round(x * 1000) / 1000;
  return {
    segundosEvaluados: r(total * paso),
    raiz: r(raiz / total),
    mayorMenor: r(mm / total),
    exacto: r(exacto / total),
    cambios: {
      referencia: cRef.length,
      detectados: cPred.length,
      encontrados03: r(cRef.length ? distancias.filter((d) => d <= 0.3).length / cRef.length : 1),
      encontrados1: r(cRef.length ? cerca1.length / cRef.length : 1),
      errorMedio: r(cerca1.length ? cerca1.reduce((a, d) => a + d, 0) / cerca1.length : 0),
      sobrantes: cPred.filter((t) => masCercano(t, cRef) > 1).length,
    },
  };
}

/** Lee un fichero .lab (MIREX: «inicio fin acorde» por línea) o JSON de tramos. */
export function leerTramos(texto: string): TramoEval[] {
  const limpio = texto.trim();
  if (limpio.startsWith('[') || limpio.startsWith('{')) {
    const datos = JSON.parse(limpio);
    const lista = Array.isArray(datos) ? datos : datos.segmentos ?? datos.acordes ?? [];
    return lista.map((s: any) => ({ t0: Number(s.t0 ?? s.inicio ?? s.start), t1: Number(s.t1 ?? s.fin ?? s.end), acorde: String(s.acorde ?? s.chord ?? s.label) }));
  }
  return limpio
    .split('\n')
    .map((l) => l.trim().split(/\s+/))
    .filter((p) => p.length >= 3 && Number.isFinite(+p[0]) && Number.isFinite(+p[1]))
    .map(([a, b, ...c]) => ({ t0: +a, t1: +b, acorde: c.join(' ') }));
}
