// Tinta y velo para que el texto se lea sobre cualquier fondo. Puro.
//
// Se decide con el PEOR caso de la zona, no con la media: sobre una foto, la media puede ser
// buena y aun así haber manchas claras justo detrás de una letra blanca. Para tinta clara el
// peor caso son los píxeles más claros (p90); para tinta oscura, los más oscuros (p10). Con
// eso se calcula la opacidad exacta del velo que garantiza 4,5:1 (WCAG AA) en ese peor caso.

export interface LuzZona {
  /** Luminancia relativa WCAG (0..1) por debajo de la que queda el 10 % más oscuro. */
  p10: number;
  /** Ídem para el 10 % más claro. */
  p90: number;
}

export interface Tinta {
  tinta: 'clara' | 'oscura';
  /** Opacidad del velo (0 = sin velo), en el color contrario a la tinta. */
  velo: number;
}

/** Luminancias de las tintas y los velos (ver `TINTAS` en render.ts). */
const L_CLARA = 0.89;
const L_OSCURA = 0.011;
const L_VELO_OSCURO = 0.005;
const L_VELO_CLARO = 0.88;
const OBJETIVO = 4.5;
const VELO_MAX = 0.78;
const PREFERENCIA_CLARA = 0.3;

export function luminancia(r: number, g: number, b: number): number {
  const c = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function contraste(l1: number, l2: number): number {
  const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (a + 0.05) / (b + 0.05);
}

// Luminancia máxima de fondo con la que la tinta clara llega al objetivo, y mínima para la oscura.
const TECHO_CLARA = (L_CLARA + 0.05) / OBJETIVO - 0.05;
const SUELO_OSCURA = OBJETIVO * (L_OSCURA + 0.05) - 0.05;

/** Velo necesario para llevar `l` hasta `meta` mezclando con `lVelo` (0 si ya está). */
function veloPara(l: number, meta: number, lVelo: number): number {
  if ((lVelo < meta && l <= meta) || (lVelo > meta && l >= meta)) return 0;
  return (l - meta) / (l - lVelo);
}

export function decidirTinta({ p10, p90 }: LuzZona): Tinta {
  const vClara = veloPara(p90, TECHO_CLARA, L_VELO_OSCURO);
  const vOscura = veloPara(p10, SUELO_OSCURA, L_VELO_CLARO);
  // Gana la que necesita menos velo (tapa menos la foto o el color). Con poca diferencia se
  // prefiere la clara: oscurecer una foto queda natural; lecharla, no.
  const tinta = vClara === 0 && vOscura === 0
    ? (contraste(L_CLARA, p90) >= contraste(L_OSCURA, p10) ? 'clara' : 'oscura')
    : vClara <= vOscura + PREFERENCIA_CLARA ? 'clara' : 'oscura';
  const v = tinta === 'clara' ? vClara : vOscura;
  // Un pelo de margen por el suavizado de las letras. Nunca se redondea a 0: rompería la garantía.
  const velo = v === 0 ? 0 : Math.min(VELO_MAX, Math.ceil((v + 0.03) * 100) / 100);
  return { tinta, velo };
}

/** Percentiles de luminancia de un trozo de `ImageData` (muestreando 1 de cada `paso` píxeles). */
export function medirLuz(datos: Uint8ClampedArray, paso = 5): LuzZona {
  const BINS = 128;
  const hist = new Uint32Array(BINS);
  let n = 0;
  for (let i = 0; i < datos.length; i += 4 * paso) {
    const l = luminancia(datos[i], datos[i + 1], datos[i + 2]);
    hist[Math.min(BINS - 1, Math.floor(l * BINS))]++;
    n++;
  }
  if (!n) return { p10: 0, p90: 0 };
  const percentil = (p: number) => {
    const objetivo = p * n;
    let acc = 0;
    for (let b = 0; b < BINS; b++) {
      acc += hist[b];
      if (acc >= objetivo) return (b + 0.5) / BINS;
    }
    return 1;
  };
  return { p10: percentil(0.1), p90: percentil(0.9) };
}
