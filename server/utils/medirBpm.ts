/**
 * Medición del BPM de una canción a partir de los pulsos que ya sabemos sacar del audio.
 *
 * Por qué no «la moda de los intervalos entre ataques» (el detector anterior): con ataques de corcheas,
 * bombo y caja, la moda de los intervalos es la subdivisión, no el pulso, y el parche de «llévalo al rango
 * 70-180» doblaba todo lo lento (68 → 138, 80 → 160) y partía lo rápido (190 → 91). Medido en un banco
 * con tempo conocido: 11/20 aciertos. Con los pulsos de Beat This! y el ajuste de aquí: ver
 * `server/utils/__tests__/medirBpm.test.ts`.
 */

/** Mediana de una lista (no vacía). */
const mediana = (v: number[]): number => {
  const s = [...v].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

/**
 * BPM medio a partir de los instantes de los pulsos. La red da los pulsos en tramas de 20 ms, así que la
 * mediana de los intervalos sale cuantizada (130,4 por 128; 176,5 por 172): aquí se ajusta una recta
 * «instante del pulso frente a número de pulso», que promedia ese error sobre toda la canción y, con tempo
 * que cambia, da el tempo medio. Los huecos (un pulso que la red no marcó) cuentan como varios pulsos.
 */
export function bpmDesdePulsos(pulsos: number[]): number | null {
  if (!pulsos || pulsos.length < 8) return null;
  const intervalos = pulsos.slice(1).map((t, i) => t - pulsos[i]).filter((d) => d > 0);
  const base = mediana(intervalos);
  if (!(base > 0.2 && base < 2)) return null; // fuera de 30-300 BPM no es un pulso
  // Número de pulso de cada marca: se acumula lo que dura cada intervalo medido en periodos (1 normal, 2 si falta uno…).
  const puntos: Array<[number, number]> = [[0, pulsos[0]]];
  let n = 0;
  for (let i = 1; i < pulsos.length; i++) {
    const periodos = Math.round((pulsos[i] - pulsos[i - 1]) / base);
    if (periodos < 1 || periodos > 3) continue; // marca espuria o hueco largo: se salta
    n += periodos;
    puntos.push([n, pulsos[i]]);
  }
  if (puntos.length < 8) return null;
  // Pendiente (periodo) de una recta por mínimos cuadrados sobre un tramo de puntos.
  const periodoDe = (tramo: Array<[number, number]>): number => {
    const mx = tramo.reduce((a, p) => a + p[0], 0) / tramo.length;
    const my = tramo.reduce((a, p) => a + p[1], 0) / tramo.length;
    let num = 0, den = 0;
    for (const [x, y] of tramo) { num += (x - mx) * (y - my); den += (x - mx) ** 2; }
    return num / den;
  };
  // Con tramos largos basta la mediana de los tempos de cada tramo de ~16 pulsos: un final con aplausos, un
  // parón o un cambio de tempo (marcas espurias que arrastran una única recta global: 92,5 en vez de 93 en un
  // directo real) no mueven la mediana. Con pocos pulsos, una sola recta.
  const VENTANA = 16;
  let periodo: number;
  if (puntos.length >= VENTANA * 2) {
    const locales: number[] = [];
    for (let i = 0; i + VENTANA <= puntos.length; i += VENTANA / 2) {
      const p = periodoDe(puntos.slice(i, i + VENTANA));
      if (p > 0) locales.push(p);
    }
    periodo = locales.length ? mediana(locales) : periodoDe(puntos);
  } else {
    periodo = periodoDe(puntos);
  }
  return periodo > 0 ? Math.round((60 / periodo) * 10) / 10 : null;
}
