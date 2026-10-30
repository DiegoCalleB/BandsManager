// Acabado de serigrafía: lo que separa un cartel «bonito de IA» de un cartel de gira impreso de verdad. Una
// ilustración continua (degradados suaves, mil matices) se reduce a unas pocas TINTAS PLANAS —como los fotolitos de
// una serigrafía—, las medias tintas pasan a trama de puntos y la placa cálida queda un pelo desregistrada sobre el
// papel. El resultado es nítido a cualquier tamaño y deja de parecer una imagen generada.
//
// La parte de píxeles es pura (`serigrafiar`, determinista por semilla) y se prueba sin DOM; `conSerigrafia` es la
// capa de canvas, con caché (el A4 de imprenta son 8 millones de píxeles: no se repite a cada retoque de texto).

export interface OpcionesSerigrafia {
  /** Misma semilla → mismas tintas y mismo desregistro. */
  semilla: number;
  /** Ancho del lienzo / 1080: la trama y el desregistro escalan para verse igual en la vista previa y en el A4. */
  escala: number;
}

/** Tintas planas del cartel (sin contar el papel). */
export const TINTAS_SERIGRAFIA = 6;
const PAPEL: [number, number, number] = [240, 232, 214];
const MUESTRAS = 40000;
const ITERACIONES = 20;
const SATURACION = 1.35;
/** Cuánto empuja la trama de puntos a elegir la tinta vecina: a más empuje, más punto visible en las medias tintas. */
const FUERZA_TRAMA = 38;

function mulberry32(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const luz = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

/** Estira cada canal (descartando el 1 % de los extremos) y sube un poco la saturación: las tintas salen vivas. */
function prepararColor(d: Uint8ClampedArray, n: number): Float32Array {
  const lo = [0, 0, 0];
  const hi = [255, 255, 255];
  for (let c = 0; c < 3; c++) {
    const h = new Uint32Array(256);
    for (let i = 0; i < n; i++) h[d[i * 4 + c]]++;
    const corte = n * 0.01;
    let acc = 0;
    for (let v = 0; v < 256; v++) {
      acc += h[v];
      if (acc > corte) {
        lo[c] = v;
        break;
      }
    }
    acc = 0;
    for (let v = 255; v >= 0; v--) {
      acc += h[v];
      if (acc > corte) {
        hi[c] = v;
        break;
      }
    }
    if (hi[c] - lo[c] < 16) {
      lo[c] = 0;
      hi[c] = 255;
    }
  }
  const salida = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const rgb = [0, 1, 2].map((c) => ((d[i * 4 + c] - lo[c]) / (hi[c] - lo[c])) * 255);
    const g = luz(rgb[0], rgb[1], rgb[2]);
    for (let c = 0; c < 3; c++) salida[i * 3 + c] = Math.min(255, Math.max(0, g + (rgb[c] - g) * SATURACION));
  }
  return salida;
}

/** Las tintas: k-means sobre una muestra que prefiere los colores saturados (los acentos no se pierden entre los oscuros). */
function elegirTintas(color: Float32Array, n: number, azar: () => number): number[][] {
  const muestra: number[][] = [];
  let intentos = 0;
  while (muestra.length < MUESTRAS && intentos < MUESTRAS * 6) {
    intentos++;
    const i = Math.floor(azar() * n);
    const r = color[i * 3];
    const g = color[i * 3 + 1];
    const b = color[i * 3 + 2];
    const mx = Math.max(r, g, b);
    const sat = (mx - Math.min(r, g, b)) / (mx + 1);
    if (azar() < 0.35 + sat) muestra.push([r, g, b]);
  }
  if (muestra.length === 0) return [[0, 0, 0]];
  // Inicio «k-means++»: cada tinta nueva, lejos de las ya elegidas.
  const c: number[][] = [muestra[Math.floor(azar() * muestra.length)].slice()];
  while (c.length < Math.min(TINTAS_SERIGRAFIA, muestra.length)) {
    let mejor = muestra[0];
    let mejorD = -1;
    for (let t = 0; t < 400; t++) {
      const p = muestra[Math.floor(azar() * muestra.length)];
      const d = Math.min(...c.map((q) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2));
      if (d > mejorD) {
        mejorD = d;
        mejor = p;
      }
    }
    c.push(mejor.slice());
  }
  for (let it = 0; it < ITERACIONES; it++) {
    const suma = c.map(() => [0, 0, 0, 0]);
    for (const p of muestra) {
      let k = 0;
      let kd = Infinity;
      for (let j = 0; j < c.length; j++) {
        const d = (p[0] - c[j][0]) ** 2 + (p[1] - c[j][1]) ** 2 + (p[2] - c[j][2]) ** 2;
        if (d < kd) {
          kd = d;
          k = j;
        }
      }
      suma[k][0] += p[0];
      suma[k][1] += p[1];
      suma[k][2] += p[2];
      suma[k][3]++;
    }
    suma.forEach((s, j) => s[3] > 0 && (c[j] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]]));
  }
  return c.sort((a, b) => luz(a[0], a[1], a[2]) - luz(b[0], b[1], b[2]));
}

/**
 * Pasa una imagen RGBA (in situ) a serigrafía de `TINTAS_SERIGRAFIA` tintas con trama de puntos y la placa cálida
 * desregistrada. Devuelve las tintas usadas (RGB), de la más oscura a la más clara.
 */
export function serigrafiar(datos: Uint8ClampedArray, ancho: number, alto: number, { semilla, escala }: OpcionesSerigrafia): number[][] {
  const n = ancho * alto;
  if (n === 0 || datos.length < n * 4) return [];
  const azar = mulberry32(semilla);
  const color = prepararColor(datos, n);
  const tintas = elegirTintas(color, n, azar);

  // Trama de puntos a 32°: el periodo escala con el lienzo para que se vea igual en pantalla y en el A4.
  const periodo = Math.max(2.5, 4 * escala);
  const ang = (32 * Math.PI) / 180;
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  const indice = new Uint8Array(n);
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const i = y * ancho + x;
      const u = (x * ca + y * sa) / periodo;
      const v = (-x * sa + y * ca) / periodo;
      const trama = ((Math.cos(2 * Math.PI * u) + Math.cos(2 * Math.PI * v)) / 4) * FUERZA_TRAMA;
      const r = color[i * 3] + trama;
      const g = color[i * 3 + 1] + trama;
      const b = color[i * 3 + 2] + trama;
      let k = 0;
      let kd = Infinity;
      for (let j = 0; j < tintas.length; j++) {
        const d = (r - tintas[j][0]) ** 2 + (g - tintas[j][1]) ** 2 + (b - tintas[j][2]) ** 2;
        if (d < kd) {
          kd = d;
          k = j;
        }
      }
      indice[i] = k;
    }
  }

  // Desregistro: la placa cálida (la que más se separa del azul) sale un pelo corrida, y donde no solapa con su
  // propio sitio queda el papel a la vista, como un fotolito mal puesto.
  const calida = tintas.map((t) => t[0] - t[2] > 45);
  const corrimiento = Math.max(1, Math.round(2 * escala));
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const i = y * ancho + x;
      const k = indice[i];
      let rgb = tintas[k].map((v, c) => (v / 255) * PAPEL[c]);
      if (calida[k]) {
        const xo = x - corrimiento;
        const yo = y - corrimiento;
        const enCalida = xo >= 0 && yo >= 0 && calida[indice[yo * ancho + xo]];
        if (!enCalida) rgb = rgb.map((v, c) => PAPEL[c] * 0.8 + v * 0.2);
      }
      datos[i * 4] = rgb[0];
      datos[i * 4 + 1] = rgb[1];
      datos[i * 4 + 2] = rgb[2];
      datos[i * 4 + 3] = 255;
    }
  }
  return tintas;
}

const cache = new Map<string, HTMLCanvasElement>();
const MAX_CACHE = 4;

/**
 * Un lienzo `ancho`×`alto` con el arte que pinta `pintar` pasado a serigrafía. Se cachea por `clave` y tamaño: la vista
 * previa se repinta con cada cambio de texto y el proceso no tiene que repetirse.
 */
export function conSerigrafia(clave: string, ancho: number, alto: number, semilla: number, pintar: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement | null {
  const k = `${clave}|${ancho}x${alto}|${semilla}`;
  const hecho = cache.get(k);
  if (hecho) return hecho;
  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  const c = lienzo.getContext('2d', { willReadFrequently: true });
  if (!c) return null;
  pintar(c);
  try {
    const d = c.getImageData(0, 0, ancho, alto);
    serigrafiar(d.data, ancho, alto, { semilla, escala: ancho / 1080 });
    c.putImageData(d, 0, 0);
  } catch (e) {
    console.warn('[Cartel] No se pudo aplicar la serigrafía; se deja el arte tal cual:', e);
    return null;
  }
  if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value as string);
  cache.set(k, lienzo);
  return lienzo;
}
