import { notasParaDibujar } from './vistaAcordes';

export const ETIQUETA_INVERSION = ['Fund.', '1.ª', '2.ª', '3.ª'];
const NOMBRE_INVERSION = ['fundamental', 'primera inversión', 'segunda inversión', 'tercera inversión'];
export const nombreInversion = (i: number): string => NOMBRE_INVERSION[i] ?? `${i}.ª inversión`;

const modulo = (n: number): number => ((n % 12) + 12) % 12;

/**
 * Teclas (0 = primer Do del teclado de 2 octavas) de un acorde en la inversión `inversion`: la nota que va al bajo
 * es la primera y el resto se apila hacia arriba, siempre en posición cerrada.
 */
export function vozTeclado(notas: number[], inversion: number): number[] {
  const orden = [...notas.slice(inversion), ...notas.slice(0, inversion)];
  const voz: number[] = [];
  for (const pc of orden) {
    let tecla = modulo(pc);
    while (voz.length && tecla <= voz[voz.length - 1]) tecla += 12;
    voz.push(tecla);
  }
  return voz;
}

/** Cuántas inversiones tiene el acorde (3 si es tríada, 4 con 7.ª) y cuál fija su bajo si es un «C/E». */
export function inversionesDe(acorde: string): { total: number; fija: number | null } {
  const n = notasParaDibujar(acorde);
  if (!n) return { total: 0, fija: null };
  const fija = n.bajo === null ? null : n.notas.indexOf(n.bajo);
  return { total: n.notas.length, fija: fija === -1 ? null : fija };
}

/** Lo que se mueve la mano entre dos voces: pasos mínimos de cada nota a la más cercana del otro acorde (en ambos sentidos). */
const movimiento = (a: number[], b: number[]): number => {
  const cerca = (x: number, lista: number[]) => Math.min(...lista.map((y) => Math.abs(x - y)));
  return a.reduce((s, x) => s + cerca(x, b), 0) + b.reduce((s, y) => s + cerca(y, a), 0);
};

/**
 * La inversión más útil de `acorde` viniendo de `previo` (tocado en fundamental): la que menos mueve la mano, probando
 * también una octava arriba o abajo. Sin acorde anterior, o en empate, manda la fundamental. Un «C/E» ya trae la suya.
 */
export function inversionRecomendada(acorde: string, previo?: string | null): number {
  const n = notasParaDibujar(acorde);
  if (!n) return 0;
  const { fija } = inversionesDe(acorde);
  if (fija !== null) return fija;
  const p = previo ? notasParaDibujar(previo) : null;
  if (!p) return 0;
  const antes = vozTeclado(p.notas, p.bajo === null ? 0 : Math.max(0, p.notas.indexOf(p.bajo)));
  let mejor = 0;
  let mejorCoste = Infinity;
  for (let i = 0; i < n.notas.length; i++) {
    const voz = vozTeclado(n.notas, i);
    const coste = Math.min(...[-12, 0, 12].map((o) => movimiento(antes, voz.map((t) => t + o))));
    if (coste < mejorCoste) { mejorCoste = coste; mejor = i; }
  }
  return mejor;
}
