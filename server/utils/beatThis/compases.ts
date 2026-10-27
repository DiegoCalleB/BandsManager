/**
 * De la salida de Beat This! a un pulso listo para dibujar compases. La red marca bien los tiempos,
 * pero sus inicios de compás «parpadean» (compases de 1 o 2 tiempos sueltos), deja huecos en las
 * partes sin ritmo claro y a veces cuenta al doble del tempo que contaría la banda. Aquí se arregla:
 *
 * 1. Nivel métrico: si la ficha dice 84 y la red cuenta 168, se cuenta como la banda (un pulso de cada dos).
 * 2. Huecos: se rellenan con pulsos al tempo local, para que la rejilla no se corte en una intro o un break.
 * 3. Compases coherentes (Viterbi): la posición dentro del compás avanza de uno en uno; un compás
 *    solo se acorta si las pruebas lo piden de verdad. Las pruebas son la probabilidad de «1» de la
 *    red y los cambios de acorde ya detectados, que en una banda caen casi siempre en el 1.
 *    El mismo decodificador elige entre 3/4 y 4/4.
 */
import type { Pulso } from "../pulso.js";
import { TRAMAS_POR_SEGUNDO, type PulsoNeuronal } from "./beatThis.js";

const PESO_ACORDE = 0.4; // cuánto empuja un cambio de acorde a que ese pulso sea un 1
const PROB_COMPAS_CORTO = 0.02; // probabilidad de que un compás se corte antes de tiempo
const PRIOR_TIEMPOS = { 3: Math.log(0.4), 4: Math.log(0.6) } as const;

const mediana = (v: number[]) => {
  const o = [...v].sort((a, b) => a - b);
  return o.length ? o[o.length >> 1] : 0;
};

/** Máximo de una curva de probabilidad en ±2 tramas alrededor de t. */
function probEn(curva: Float32Array, t: number): number {
  const c = Math.round(t * TRAMAS_POR_SEGUNDO);
  let m = 0;
  for (let i = Math.max(0, c - 2); i <= Math.min(curva.length - 1, c + 2); i++) m = Math.max(m, curva[i]);
  return m;
}

const intervalos = (p: number[]) => p.slice(1).map((t, i) => t - p[i]);

/** Distancia (0-0,5) de x al múltiplo entero más cercano de L, en pulsos: 0 = encaja en la rejilla. */
const desajuste = (x: number, L: number) => Math.abs(x / L - Math.round(x / L));

/**
 * Periodo del pulso al que se cuenta la canción. La red a veces cuenta un tramo a corcheas y otro a
 * negras: manda el nivel que más tiempo de canción cubre, y la ficha solo decide si está claramente
 * a la mitad o al doble (la banda cuenta como cuenta).
 */
export function elegirNivel(pulsos: number[], bpmFicha?: number): number {
  const d = intervalos(pulsos);
  const m = mediana(d);
  const apoyo = (L: number) => d.reduce((a, x) => a + (Math.abs(x / L - 1) < 0.15 ? x : 0), 0);
  let nivel = [m, 2 * m, m / 2].filter((L) => L >= 0.25 && L <= 1.5).reduce((a, b) => (apoyo(b) > apoyo(a) ? b : a));
  if (bpmFicha) {
    const ratio = 60 / nivel / bpmFicha;
    if (ratio >= 1.75 && ratio <= 2.3) nivel *= 2;
    else if (ratio >= 0.43 && ratio <= 0.57) nivel /= 2;
  }
  return nivel;
}

/**
 * Lleva los pulsos al periodo L: los tramos contados al doble se quedan con uno de cada dos (la
 * paridad que empalma con los pulsos de alrededor; si no hay, la que más «1» lleva), los pulsos
 * sueltos de más se quitan, y si L es la mitad de lo contado se intercalan los que faltan.
 */
export function normalizarNivel(pulsos: number[], L: number, probCompas: Float32Array): number[] {
  // 1) Tramos a doble velocidad.
  const corto = (x: number) => Math.abs(x / (L / 2) - 1) < 0.25;
  const d = intervalos(pulsos);
  let salida: number[] = [];
  for (let i = 0; i < pulsos.length; ) {
    let j = i;
    while (j < d.length && corto(d[j])) j++;
    if (j === i) { salida.push(pulsos[i++]); continue; }
    // Tramo de pulsos[i..j] con j - i intervalos cortos.
    const tramo = pulsos.slice(i, j + 1);
    const antes = salida[salida.length - 1];
    const despues = pulsos[j + 1];
    const puntuar = (par: number) => {
      const guardados = tramo.filter((_, k) => k % 2 === par);
      let p = 0;
      if (antes !== undefined) p += 1 - 2 * desajuste(guardados[0] - antes, L);
      if (despues !== undefined) p += 1 - 2 * desajuste(despues - guardados[guardados.length - 1], L);
      return p + 0.01 * guardados.reduce((a, t) => a + probEn(probCompas, t), 0);
    };
    const par = puntuar(0) >= puntuar(1) ? 0 : 1;
    salida.push(...tramo.filter((_, k) => k % 2 === par));
    i = j + 1;
  }
  // 2) Pulsos sueltos de más (dos intervalos cortos que suman uno normal).
  salida = salida.filter((t, i, v) => {
    if (i === 0 || i === v.length - 1) return true;
    const a = t - v[i - 1], b = v[i + 1] - t;
    return !(a < 0.75 * L && b < 0.75 * L && Math.abs(a + b - L) < 0.25 * L);
  });
  // 3) Contado a la mitad del nivel pedido: se intercalan pulsos.
  return salida.flatMap((t, i) => (i + 1 < salida.length && Math.abs((salida[i + 1] - t) / (2 * L) - 1) < 0.2 ? [t, (t + salida[i + 1]) / 2] : [t]));
}

/** Rellena huecos de más de 1,5 pulsos y prolonga la rejilla hasta el principio y el final del audio. */
export function rellenarHuecos(pulsos: number[], duracion: number, L: number): { pulsos: number[]; relleno: boolean[] } {
  const salida: number[] = [];
  const relleno: boolean[] = [];
  const d = intervalos(pulsos);
  // Tempo local: mediana de los intervalos normales cercanos (los huecos no cuentan).
  const local = (k: number) => mediana(d.slice(Math.max(0, k - 4), k + 5).filter((x) => x > 0.7 * L && x < 1.4 * L)) || L;
  const ibiInicio = local(0);
  for (let t = pulsos[0] - ibiInicio; t > 0.05; t -= ibiInicio) {
    salida.unshift(t);
    relleno.unshift(true);
  }
  for (let i = 0; i < pulsos.length; i++) {
    if (i > 0) {
      const hueco = pulsos[i] - pulsos[i - 1];
      const n = Math.round(hueco / local(i - 1));
      if (n > 1 && hueco > 1.5 * local(i - 1)) {
        for (let k = 1; k < n; k++) {
          salida.push(pulsos[i - 1] + (k * hueco) / n);
          relleno.push(true);
        }
      }
    }
    salida.push(pulsos[i]);
    relleno.push(false);
  }
  const ibiFin = local(d.length - 1);
  for (let t = pulsos[pulsos.length - 1] + ibiFin; t < duracion - 0.05; t += ibiFin) {
    salida.push(t);
    relleno.push(true);
  }
  return { pulsos: salida, relleno };
}

/**
 * Viterbi sobre los pulsos: estado = posición en el compás (0 = el 1). Devuelve la posición de
 * cada pulso y la log-verosimilitud, para comparar 3/4 con 4/4.
 */
export function decodificarCompases(evidencia: number[], tiempos: 3 | 4): { posiciones: number[]; puntuacion: number } {
  const n = evidencia.length;
  const logAvance = Math.log(1 - PROB_COMPAS_CORTO);
  const logCorte = Math.log(PROB_COMPAS_CORTO);
  const emision = (e: number, s: number) => Math.log(s === 0 ? e : 1 - e);
  let previo = Array.from({ length: tiempos }, (_, s) => Math.log(1 / tiempos) + emision(evidencia[0], s));
  const desde: Int8Array[] = [];
  for (let b = 1; b < n; b++) {
    const actual = new Array<number>(tiempos).fill(-Infinity);
    const origen = new Int8Array(tiempos);
    for (let s = 0; s < tiempos; s++) {
      // Avance normal: s → s+1 (y el último tiempo vuelve al 1 con certeza).
      const siguiente = (s + 1) % tiempos;
      const avance = previo[s] + (siguiente === 0 ? 0 : logAvance);
      if (avance > actual[siguiente]) { actual[siguiente] = avance; origen[siguiente] = s; }
      // Compás corto: se vuelve al 1 antes de completar el compás.
      if (s > 0 && s < tiempos - 1) {
        const corte = previo[s] + logCorte;
        if (corte > actual[0]) { actual[0] = corte; origen[0] = s; }
      }
    }
    for (let s = 0; s < tiempos; s++) actual[s] += emision(evidencia[b], s);
    desde.push(origen);
    previo = actual;
  }
  let estado = previo.indexOf(Math.max(...previo));
  const posiciones = new Array<number>(n);
  for (let b = n - 1; b >= 0; b--) {
    posiciones[b] = estado;
    if (b > 0) estado = desde[b - 1][estado];
  }
  return { posiciones, puntuacion: Math.max(...previo) };
}

/**
 * Pulso con compases a partir de la red. `cambios` son los instantes de cambio de acorde ya
 * detectados; `bpmFicha`, el BPM que el músico puso en la canción (solo decide mitad o doble).
 */
export function pulsoDesdeRed(red: PulsoNeuronal, opciones: { duracion: number; cambios?: number[]; bpmFicha?: number }): Pulso | null {
  if (red.pulsos.length < 8) return null;

  // 1) Nivel métrico y 2) huecos.
  const L = elegirNivel(red.pulsos, opciones.bpmFicha);
  const { pulsos, relleno } = rellenarHuecos(normalizarNivel(red.pulsos, L, red.probabilidadCompas), opciones.duracion, L);
  const ibi = L;

  // 3) Evidencia de «1» por pulso y Viterbi para 3 y 4 tiempos.
  const cambios = [...(opciones.cambios ?? [])].sort((a, b) => a - b);
  const radio = Math.min(0.15, 0.3 * ibi);
  const hayCambio = (t: number) => {
    let lo = 0, hi = cambios.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (cambios[m] < t - radio) lo = m + 1; else hi = m; }
    return lo < cambios.length && cambios[lo] <= t + radio;
  };
  const evidencia = pulsos.map((p, i) => {
    const red_ = relleno[i] ? 0.5 : probEn(red.probabilidadCompas, p);
    const e = 1 - (1 - red_) * (1 - (hayCambio(p) ? PESO_ACORDE : 0));
    return Math.min(0.98, Math.max(0.02, e));
  });
  const opcionesTiempos = ([3, 4] as const).map((m) => ({ m, ...decodificarCompases(evidencia, m) }));
  const elegido = opcionesTiempos.reduce((a, b) => (b.puntuacion + PRIOR_TIEMPOS[b.m] > a.puntuacion + PRIOR_TIEMPOS[a.m] ? b : a));
  const compases = pulsos.filter((_, i) => elegido.posiciones[i] === 0);

  // Tempo: media de los intervalos normales (la mediana sola queda cuantizada a las tramas de 20 ms).
  const normales = pulsos.slice(1).map((p, i) => p - pulsos[i]).filter((d) => d > 0.8 * ibi && d < 1.25 * ibi);
  const periodo = normales.reduce((a, b) => a + b, 0) / Math.max(1, normales.length);
  const bpm = Math.round((60 / periodo) * 10) / 10;

  // Confianza: seguridad media de la red en sus pulsos, rebajada por lo que ha habido que rellenar.
  const propios = pulsos.filter((_, i) => !relleno[i]);
  const seguridad = propios.reduce((a, p) => a + probEn(red.probabilidad, p), 0) / Math.max(1, propios.length);
  const cobertura = propios.length / pulsos.length;
  const confianza = Math.round(seguridad * Math.min(1, cobertura / 0.8) * 100) / 100;

  const redondear = (t: number) => Math.round(t * 1000) / 1000;
  return {
    bpm,
    pulsos: pulsos.map(redondear),
    fase: redondear(((pulsos[0] % periodo) + periodo) % periodo),
    confianza,
    compases: compases.map(redondear),
    tiempos: elegido.m,
    fuente: "red",
  };
}

/** Distancia máxima (en fracción de pulso) a la que la rejilla mueve un cambio confirmado por la armonía. */
const ANCLADO_MAX = 0.15;

/**
 * Cuadra los cambios de acorde con la rejilla de la red: un cambio a menos de 0,6 pulsos de un «1»
 * se lleva al 1 (las bandas cambian ahí, y una anticipación de corchea se escribe en el 1), y
 * cualquier otro, a su pulso más cercano. Los cambios en el 3 o en el 4 se respetan.
 */
export function ajustarACompases<T extends { t0: number; t1: number; anclado?: boolean }>(segmentos: T[], pulso: Pick<Pulso, "pulsos" | "compases">): T[] {
  const { pulsos } = pulso;
  const unos = pulso.compases ?? [];
  if (segmentos.length < 2 || pulsos.length < 2) return segmentos;
  const cercano = (v: number[], t: number) => {
    let lo = 0, hi = v.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (v[m] <= t) lo = m; else hi = m; }
    return Math.abs(v[lo] - t) <= Math.abs(v[hi] - t) ? lo : hi;
  };
  const salida = segmentos.map((s) => ({ ...s }));
  for (let i = 1; i < salida.length; i++) {
    const t = salida[i].t0;
    const p = cercano(pulsos, t);
    const periodo = pulsos[Math.min(p + 1, pulsos.length - 1)] - pulsos[Math.max(p - 1, 0)];
    const uno = unos.length ? unos[cercano(unos, t)] : NaN;
    const destino = Math.abs(uno - t) <= 0.6 * (periodo / 2) ? uno : pulsos[p];
    // En directo la rejilla se desliza: un cambio que la armonía ya confirmó solo se mueve si está casi encima.
    if (salida[i].anclado && Math.abs(destino - t) > ANCLADO_MAX * periodo) continue;
    // No se come un acorde entero: cada tramo conserva al menos 0,2 s.
    if (destino <= salida[i - 1].t0 + 0.2 || destino >= salida[i].t1 - 0.2) continue;
    salida[i - 1].t1 = destino;
    salida[i].t0 = destino;
  }
  return salida;
}
