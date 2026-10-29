// A veces la IA no dibuja la ilustración sino «el cartel como objeto»: un papel crema con borde (y sombra suave)
// alrededor del arte. Dentro del cartel de BandManager eso es un marco dentro de otro marco: el cartel TIENE que ser
// el arte, hasta el borde. Aquí se detecta ese marco claro y se recorta; en cualquier duda, no se toca nada.

export interface Recorte {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Lado máximo al que se mira la imagen para buscar el marco (basta y es instantáneo). */
export const LADO_ANALISIS = 200;
const LUZ_MIN_MARCO = 150;
const SALTO_DE_LUZ = 60;
/** Parte de una fila (o columna) que tiene que ser arte para contar como borde de la ilustración. */
const FRACCION_ARTE = 0.6;
/** El marco ocupa entre esto y esto de cada lado; fuera de ese rango no es un marco de papel. */
const MARCO_MIN = 0.02;
const MARCO_MAX = 0.22;
const AREA_MIN = 0.55;

const luz = (d: Uint8ClampedArray, i: number) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];

/**
 * Busca un marco claro y uniforme alrededor de la ilustración. Devuelve el rectángulo del arte en fracciones (0-1)
 * o null si no hay marco: las cuatro esquinas del marco tienen que ser papel claro, y los cuatro bordes del arte
 * tienen que ser un salto neto a oscuro a lo largo de casi toda la línea (un título sobre crema no cuenta).
 */
export function detectarMarco(datos: Uint8ClampedArray, ancho: number, alto: number): Recorte | null {
  if (ancho < 20 || alto < 20 || datos.length < ancho * alto * 4) return null;
  const L = (x: number, y: number) => luz(datos, (y * ancho + x) * 4);

  // Luz del marco: la mediana de un anillo fino por fuera (el papel).
  const anillo: number[] = [];
  const g = Math.max(1, Math.round(Math.min(ancho, alto) * 0.015));
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      if (x < g || y < g || x >= ancho - g || y >= alto - g) anillo.push(L(x, y));
    }
  }
  anillo.sort((a, b) => a - b);
  const papel = anillo[Math.floor(anillo.length / 2)];
  if (papel < LUZ_MIN_MARCO) return null;
  const esArte = (v: number) => v < papel - SALTO_DE_LUZ;

  const x0 = Math.round(ancho * 0.1);
  const x1 = Math.round(ancho * 0.9);
  const y0 = Math.round(alto * 0.1);
  const y1 = Math.round(alto * 0.9);
  const fila = (y: number) => {
    let n = 0;
    for (let x = x0; x < x1; x++) if (esArte(L(x, y))) n++;
    return n / (x1 - x0);
  };
  const columna = (x: number) => {
    let n = 0;
    for (let y = y0; y < y1; y++) if (esArte(L(x, y))) n++;
    return n / (y1 - y0);
  };
  const primero = (desde: number, hasta: number, paso: number, medida: (i: number) => number) => {
    for (let i = desde; i !== hasta; i += paso) if (medida(i) >= FRACCION_ARTE) return i;
    return -1;
  };

  const arriba = primero(0, Math.round(alto * MARCO_MAX) + 1, 1, fila);
  const abajo = primero(alto - 1, alto - Math.round(alto * MARCO_MAX) - 2, -1, fila);
  const izq = primero(0, Math.round(ancho * MARCO_MAX) + 1, 1, columna);
  const der = primero(ancho - 1, ancho - Math.round(ancho * MARCO_MAX) - 2, -1, columna);
  if ([arriba, abajo, izq, der].some((v) => v < 0)) return null;

  const m = { arriba: arriba / alto, abajo: (alto - 1 - abajo) / alto, izq: izq / ancho, der: (ancho - 1 - der) / ancho };
  if (Object.values(m).some((v) => v < MARCO_MIN || v > MARCO_MAX)) return null;
  const r: Recorte = { x: izq / ancho, y: arriba / alto, w: (der - izq + 1) / ancho, h: (abajo - arriba + 1) / alto };
  return r.w * r.h >= AREA_MIN ? r : null;
}

const cache = new WeakMap<object, HTMLImageElement | HTMLCanvasElement>();

/** La misma imagen sin su marco de papel (un lienzo recortado), o la propia imagen si no tiene o no se puede mirar. */
export function sinMarco(img: HTMLImageElement | HTMLCanvasElement): HTMLImageElement | HTMLCanvasElement {
  const guardada = cache.get(img);
  if (guardada) return guardada;
  let salida: HTMLImageElement | HTMLCanvasElement = img;
  try {
    const escala = Math.min(1, LADO_ANALISIS / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * escala));
    const h = Math.max(1, Math.round(img.height * escala));
    const mini = document.createElement('canvas');
    mini.width = w;
    mini.height = h;
    const c = mini.getContext('2d', { willReadFrequently: true });
    if (c) {
      c.drawImage(img, 0, 0, w, h);
      const r = detectarMarco(c.getImageData(0, 0, w, h).data, w, h);
      if (r) {
        // Un pelo hacia dentro: el borde del arte suele traer un reborde suave de la sombra del papel.
        const dentro = 0.004;
        const sx = Math.round((r.x + dentro) * img.width);
        const sy = Math.round((r.y + dentro) * img.height);
        const sw = Math.round((r.w - 2 * dentro) * img.width);
        const sh = Math.round((r.h - 2 * dentro) * img.height);
        const recorte = document.createElement('canvas');
        recorte.width = sw;
        recorte.height = sh;
        recorte.getContext('2d')?.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        salida = recorte;
      }
    }
  } catch (e) {
    console.warn('[Cartel] No se pudo buscar el marco de papel de la ilustración; se usa tal cual:', e);
  }
  cache.set(img, salida);
  return salida;
}
