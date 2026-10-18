// De las notas del ensayo general sale cuándo hay movimiento rápido (para el desenfoque de cámara)
// y cuándo cae cada salto a negro (para el destello de luz).
export type Notas = {
  t0: number; fin: number; reloj: number;
  anims: { id: string; n: string; s: number }[];
  ops: { t: number; k: string; n?: string; v?: string | null }[];
};

// duración (s) de cada animación rápida del deck (styles.css): rampa de velocidad, golpe de cámara y golpe de voz
const RAPIDAS: Record<string, number> = { acelera: 0.56, frena: 0.82, golpe: 0.38, golpevoz: 0.62 };

// movimientos de cámara de cada escena dirigida (public/direccion.json, lo escribe tools/guion/generar.py)
export type Direccion = Record<string, [number, number, boolean][]>;

export const calcular = (n: Notas, dir: Direccion = {}) => {
  const aSeg = (ms: number) => (ms - n.t0) / 1000;
  const v: [number, number][] = [];
  for (const a of n.anims) {
    const d = RAPIDAS[a.n];
    if (d) v.push([aSeg(a.s + n.reloj) - 0.08, aSeg(a.s + n.reloj) + d + 0.08]);
  }
  // golpes de cámara y derivas de las pantallas dirigidas: desenfoque durante cada movimiento
  for (const a of n.anims) {
    const mov = dir[a.n];
    if (mov) for (const [ini, fin] of mov) v.push([aSeg(a.s + n.reloj) + ini - 0.06, aSeg(a.s + n.reloj) + fin + 0.06]);
  }
  v.sort((x, y) => x[0] - y[0]);
  const ventanas: [number, number][] = [];
  for (const w of v) {
    const u = ventanas[ventanas.length - 1];
    if (u && w[0] <= u[1] + 0.05) u[1] = Math.max(u[1], w[1]); else ventanas.push([...w]);
  }
  // saltos a negro (capítulos, saltos de tiempo): el destello va con la imagen que emerge
  const destellos: number[] = [];
  for (const o of n.ops) {
    if (o.k === 'a' && o.n === 'data-corte-ahora' && o.v === 'negro') destellos.push(aSeg(o.t));
  }
  return { ventanas, destellos };
};
