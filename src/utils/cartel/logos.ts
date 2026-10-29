// Logos de las bandas «impresos» en el cartel: en vez de pegar un logo con su fondo y sus colores
// (lo que delata una composición hecha a prisa), se convierten en una silueta de UNA tinta, la misma del
// texto, con un desgaste leve de tinta determinista. Es lo que hace un cartel de festival: la fila de
// logos de las bandas, todos en la misma tinta.
//
// La parte de píxeles es pura (`mascaraDeLogo`, `conDesgasteDeTinta`) y se prueba sin DOM. `tintarLogo`
// y `prepararLogo` son la capa de canvas.

/** Luminosidad 0-1 de un píxel RGB. */
const luz = (r: number, g: number, b: number) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

const MAX_LADO_LOGO = 512;
/** Por debajo de esta fracción de píxeles transparentes, el logo se trata como opaco (un JPEG, un PNG con fondo). */
const MIN_TRANSPARENTE = 0.02;

/**
 * Máscara de «cuánta tinta» lleva cada píxel (0-255):
 *  · un logo con transparencia usa su canal alfa tal cual;
 *  · un logo con fondo (JPEG, PNG opaco) saca la forma del contraste con su propio fondo, que se estima
 *    en el borde: oscuro sobre claro y claro sobre oscuro valen los dos.
 */
export function mascaraDeLogo(rgba: Uint8ClampedArray, ancho: number, alto: number): Uint8ClampedArray {
  const n = ancho * alto;
  const mascara = new Uint8ClampedArray(n);
  if (n === 0) return mascara;

  let transparentes = 0;
  for (let i = 0; i < n; i++) if (rgba[i * 4 + 3] < 250) transparentes++;

  if (transparentes / n >= MIN_TRANSPARENTE) {
    for (let i = 0; i < n; i++) mascara[i] = rgba[i * 4 + 3];
    return mascara;
  }

  // Fondo = luminosidad media del anillo exterior (el logo casi nunca llega al borde).
  let suma = 0;
  let cuenta = 0;
  const anillo = Math.max(1, Math.round(Math.min(ancho, alto) * 0.03));
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      if (x >= anillo && x < ancho - anillo && y >= anillo && y < alto - anillo) continue;
      const i = (y * ancho + x) * 4;
      suma += luz(rgba[i], rgba[i + 1], rgba[i + 2]);
      cuenta++;
    }
  }
  const fondo = cuenta ? suma / cuenta : 1;
  const fondoClaro = fondo >= 0.5;
  // Distancia de cada píxel al fondo. La más alta del logo (su tinta más cargada) pasa a ser tinta llena:
  // así un logo gris sobre blanco no sale pálido, y una imagen lisa (sin logo) no deja nada.
  const distancia = new Float32Array(n);
  let maxima = 0;
  for (let i = 0; i < n; i++) {
    const l = luz(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]);
    const d = Math.max(0, fondoClaro ? fondo - l : l - fondo);
    distancia[i] = d;
    if (d > maxima) maxima = d;
  }
  if (maxima < 0.12) return mascara;
  for (let i = 0; i < n; i++) mascara[i] = Math.min(255, Math.round((distancia[i] / maxima) * 255));
  return mascara;
}

/**
 * Que la silueta sea TINTA y no un velo: un logo con semitransparencia, o con degradados y grises que el contraste
 * deja a medias, salía como un fantasma. Se normaliza a su valor más alto y una curva empuja lo bastante cargado
 * (≥ 55 %) a tinta llena y lo casi vacío (≤ 10 %) a nada, dejando suave solo el borde.
 */
export function solidificarMascara(mascara: Uint8ClampedArray): Uint8ClampedArray {
  let maximo = 0;
  for (let i = 0; i < mascara.length; i++) if (mascara[i] > maximo) maximo = mascara[i];
  const fuera = new Uint8ClampedArray(mascara.length);
  if (maximo === 0) return fuera;
  const [desde, hasta] = [0.1, 0.55];
  for (let i = 0; i < mascara.length; i++) {
    const t = Math.min(1, Math.max(0, (mascara[i] / maximo - desde) / (hasta - desde)));
    fuera[i] = Math.round(t * t * (3 - 2 * t) * 255);
  }
  return fuera;
}

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

/**
 * Desgaste leve de tinta: unos píxeles con algo menos de tinta, como en una serigrafía. Determinista (misma
 * semilla → mismo logo), nunca borra la forma: el mínimo que deja es el 92 % de la tinta (más desgaste hacía el logo translúcido).
 */
export function conDesgasteDeTinta(mascara: Uint8ClampedArray, semilla: number): Uint8ClampedArray {
  const azar = mulberry32(semilla);
  const fuera = new Uint8ClampedArray(mascara.length);
  for (let i = 0; i < mascara.length; i++) fuera[i] = Math.round(mascara[i] * (0.92 + 0.08 * azar()));
  return fuera;
}

/** `#RRGGBB` → [r, g, b]. */
export function rgbDeHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16) || 0, parseInt(h.slice(2, 4), 16) || 0, parseInt(h.slice(4, 6), 16) || 0];
}

/** Semilla estable de una URL (sin su `?v=`): el mismo logo se desgasta igual en la vista previa y en el A4. */
export function semillaDeLogo(url: string): number {
  let h = 2166136261;
  const limpia = url.split('?')[0];
  for (let i = 0; i < limpia.length; i++) h = Math.imul(h ^ limpia.charCodeAt(i), 16777619);
  return h >>> 0;
}

const cacheTintados = new Map<string, HTMLCanvasElement>();

/**
 * El logo como silueta de una tinta, en un canvas del tamaño original (≤ 512 px). Se cachea por logo y
 * tinta: repintar la vista previa a cada cambio no vuelve a leer píxeles.
 */
export function tintarLogo(img: HTMLImageElement, url: string, tintaHex: string): HTMLCanvasElement {
  const clave = `${url.split('?')[0]}|${tintaHex}`;
  const hecho = cacheTintados.get(clave);
  if (hecho) return hecho;

  const k = Math.min(1, MAX_LADO_LOGO / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * k));
  const h = Math.max(1, Math.round(img.height * k));
  const origen = document.createElement('canvas');
  origen.width = w;
  origen.height = h;
  const c = origen.getContext('2d', { willReadFrequently: true });
  if (!c) return origen;
  c.drawImage(img, 0, 0, w, h);
  const mascara = conDesgasteDeTinta(solidificarMascara(mascaraDeLogo(c.getImageData(0, 0, w, h).data, w, h)), semillaDeLogo(url));

  const [r, g, b] = rgbDeHex(tintaHex);
  const salida = c.createImageData(w, h);
  for (let i = 0; i < mascara.length; i++) {
    salida.data[i * 4] = r;
    salida.data[i * 4 + 1] = g;
    salida.data[i * 4 + 2] = b;
    salida.data[i * 4 + 3] = mascara[i];
  }
  c.putImageData(salida, 0, 0);
  cacheTintados.set(clave, origen);
  return origen;
}

/**
 * Logo subido listo para guardar: como mucho 512 px de lado y en PNG (conserva la transparencia). Pesa
 * poco y el servidor solo tiene que aceptar un formato.
 */
export async function prepararLogo(archivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo).catch(() => {
    throw new Error('No podemos leer ese logo. Prueba con un PNG o JPG.');
  });
  const escala = Math.min(1, MAX_LADO_LOGO / Math.max(bitmap.width, bitmap.height));
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.max(1, Math.round(bitmap.width * escala));
  lienzo.height = Math.max(1, Math.round(bitmap.height * escala));
  lienzo.getContext('2d')?.drawImage(bitmap, 0, 0, lienzo.width, lienzo.height);
  bitmap.close();
  return new Promise((resolve, reject) => {
    lienzo.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo preparar el logo.'))), 'image/png');
  });
}
