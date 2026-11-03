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
  const mx = puntos.reduce((a, p) => a + p[0], 0) / puntos.length;
  const my = puntos.reduce((a, p) => a + p[1], 0) / puntos.length;
  let num = 0, den = 0;
  for (const [x, y] of puntos) { num += (x - mx) * (y - my); den += (x - mx) ** 2; }
  const periodo = num / den;
  return periodo > 0 ? Math.round((60 / periodo) * 10) / 10 : null;
}
