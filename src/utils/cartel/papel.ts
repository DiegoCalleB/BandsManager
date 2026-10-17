// El «papel» de una ilustración de IA y su tinta. Puro (se prueba sin DOM); `leerArte` lo alimenta desde un canvas.
//
// Una ilustración de serigrafía suele estar dibujada sobre su propio papel: un fondo liso del borde a
// borde. Si ese papel es limpio, el cartel puede ser del MISMO papel y la ilustración fundirse con él, sin
// caja ni filetes: lo que hace un diseñador. Si el borde está lleno de dibujo, no se puede fundir y se
// enmarca (placas con filete).
//
// La tinta del texto también sale del arte: un cartel impreso a tres tintas escribe en una de ellas, no
// en un negro de ordenador. Se coge el color oscuro y saturado dominante y se oscurece lo justo para que
// se lea (≥ 7:1 sobre el papel).

import { contraste, luminancia } from './contraste';
import { aHex } from './paleta';

type RGB = [number, number, number];

export interface ArtePapel {
  /** Color del papel (mediana del borde). */
  papel: string;
  /** El borde es liso: la ilustración se puede fundir con el papel. */
  limpio: boolean;
  /** Tinta del texto sacada del arte, o null si no hay una buena (se usa la tinta de siempre). */
  tinta: string | null;
}

/** Fracción del lado que se mira como «borde». */
const BORDE = 0.035;
/** Un píxel del borde cuenta como papel si está a menos de esta distancia (RGB) de la mediana. */
const DISTANCIA_PAPEL = 46;
/** Qué fracción del borde tiene que ser papel para fundir. */
const MIN_LIMPIO = 0.9;
const CONTRASTE_TINTA = 7;

const mediana = (v: number[]) => [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)] ?? 0;

function aHsv([r, g, b]: RGB): [number, number, number] {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const d = max - min;
  const R = r / 255;
  const G = g / 255;
  let h = 0;
  if (d > 0) h = max === R ? ((G - b / 255) / d + 6) % 6 : max === G ? (b / 255 - R) / d + 2 : (R - G) / d + 4;
  return [h * 60, max === 0 ? 0 : d / max, max];
}

const lum = ([r, g, b]: RGB) => luminancia(r, g, b);

/** Oscurece (o aclara, en papel oscuro) hasta que el color llegue al contraste pedido; null si no hay forma. */
function ajustarContraste(c: RGB, papel: RGB, objetivo: number): RGB | null {
  const aclarar = lum(papel) < 0.3;
  let actual = c;
  for (let i = 0; i < 24; i++) {
    if (contraste(lum(actual), lum(papel)) >= objetivo) return actual;
    actual = actual.map((v) => (aclarar ? v + (255 - v) * 0.12 : v * 0.9)) as RGB;
  }
  return null;
}

export function analizarArte(rgba: Uint8ClampedArray, ancho: number, alto: number): ArtePapel {
  const n = ancho * alto;
  const sinPapel: ArtePapel = { papel: '#EFE8D8', limpio: false, tinta: null };
  if (n === 0 || ancho < 8 || alto < 8) return sinPapel;

  const grosor = Math.max(1, Math.round(Math.min(ancho, alto) * BORDE));
  const borde: RGB[] = [];
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      if (x >= grosor && x < ancho - grosor && y >= grosor && y < alto - grosor) continue;
      const i = (y * ancho + x) * 4;
      borde.push([rgba[i], rgba[i + 1], rgba[i + 2]]);
    }
  }
  const papelRgb: RGB = [mediana(borde.map((p) => p[0])), mediana(borde.map((p) => p[1])), mediana(borde.map((p) => p[2]))];
  const cerca = borde.filter((p) => Math.hypot(p[0] - papelRgb[0], p[1] - papelRgb[1], p[2] - papelRgb[2]) <= DISTANCIA_PAPEL).length;
  const limpio = cerca / borde.length >= MIN_LIMPIO;

  // Tinta: entre los píxeles que se leen bien sobre el papel y tienen color, el tono más frecuente.
  const cubos = new Map<number, { n: number; suma: RGB }>();
  const paso = Math.max(1, Math.floor(Math.sqrt(n / 40000)));
  for (let y = grosor; y < alto - grosor; y += paso) {
    for (let x = grosor; x < ancho - grosor; x += paso) {
      const i = (y * ancho + x) * 4;
      const c: RGB = [rgba[i], rgba[i + 1], rgba[i + 2]];
      const [h, s, v] = aHsv(c);
      if (s < 0.28 || v < 0.12 || contraste(lum(c), lum(papelRgb)) < 3) continue;
      const k = Math.floor(h / 30) % 12;
      const cubo = cubos.get(k) ?? { n: 0, suma: [0, 0, 0] as RGB };
      cubo.n++;
      cubo.suma = [cubo.suma[0] + c[0], cubo.suma[1] + c[1], cubo.suma[2] + c[2]];
      cubos.set(k, cubo);
    }
  }
  let mejor: { n: number; suma: RGB } | null = null;
  for (const c of cubos.values()) if (!mejor || c.n > mejor.n) mejor = c;
  let tinta: string | null = null;
  if (mejor && mejor.n >= 40) {
    const media = mejor.suma.map((v) => v / mejor!.n) as RGB;
    const ajustada = ajustarContraste(media, papelRgb, CONTRASTE_TINTA);
    if (ajustada) tinta = aHex(ajustada);
  }
  return { papel: aHex(papelRgb), limpio, tinta };
}

/** Lee el papel y la tinta de una imagen, muestreada a un tamaño pequeño. */
export function leerArte(img: CanvasImageSource & { width: number; height: number }): ArtePapel {
  const sinPapel: ArtePapel = { papel: '#EFE8D8', limpio: false, tinta: null };
  try {
    const k = Math.min(1, 256 / Math.max(img.width, img.height));
    const w = Math.max(8, Math.round(img.width * k));
    const h = Math.max(8, Math.round(img.height * k));
    const lienzo = document.createElement('canvas');
    lienzo.width = w;
    lienzo.height = h;
    const c = lienzo.getContext('2d', { willReadFrequently: true });
    if (!c) return sinPapel;
    c.drawImage(img, 0, 0, w, h);
    return analizarArte(c.getImageData(0, 0, w, h).data, w, h);
  } catch (e) {
    console.warn('[Cartel] No se pudo leer el papel de la ilustración; se enmarca:', e);
    return sinPapel;
  }
}
