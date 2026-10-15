// Pinta el cartel en un canvas a partir del layout puro. Es la única pieza con DOM del motor.
//
// Los colores de aquí son de la obra (el cartel que se imprime o se sube a Instagram), no de la
// interfaz: por eso viven en este fichero y no salen de tokens.css.

import QRCode from 'qrcode';
import { calcularLayout, type DatosCartel, type LayoutCartel, type OpcionesLayout, type Rect } from './layout';
import { decidirTinta, medirLuz, type Tinta } from './contraste';
import type { DefFormato } from './formatos';
import type { FondoGuardado, PaletaId } from './config';

export const TINTAS = { clara: '#F4F1EA', oscura: '#17181C' } as const;

export type { PaletaId };
export interface Paleta {
  id: PaletaId;
  nombre: string;
  fondo: string;
  acento: string;
}

/** Fondos instantáneos y gratis: color plano + la Onda de la banda. */
export const PALETAS: Paleta[] = [
  { id: 'noche', nombre: 'Noche', fondo: '#15171D', acento: '#E2543A' },
  { id: 'amarillo', nombre: 'Amarillo', fondo: '#F2C230', acento: '#1B1B1F' },
  { id: 'electrico', nombre: 'Eléctrico', fondo: '#2B2BD9', acento: '#FF7AB6' },
  { id: 'bosque', nombre: 'Bosque', fondo: '#0F5C4A', acento: '#F4D35E' },
];

/** El mismo tipo que se guarda en `cartel_config` (una foto puede ser además un `blob:` local). */
export type FondoCartel = FondoGuardado;

export interface PiezasCartel {
  datos: DatosCartel;
  opciones: OpcionesLayout;
  /** URL completa que codifica el QR (solo si `opciones.qr`). */
  qrUrl: string | null;
  /** Hace que la Onda de cada bolo sea siempre la misma. */
  semilla: string;
}

const FAMILIA = '"Onest Variable", Onest, system-ui, sans-serif';
const fuente = (peso: number, px: number) => `${peso} ${Math.round(px)}px ${FAMILIA}`;

/** Espera a que la fuente esté lista: sin esto el primer cartel salía con la del sistema. */
export async function prepararFuentes(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  try {
    await Promise.all([600, 700, 800].map((p) => document.fonts.load(fuente(p, 100))));
  } catch (e) {
    console.warn('[Cartel] No se pudo cargar la fuente; se usa la del sistema:', e);
  }
}

const cacheImagenes = new Map<string, Promise<HTMLImageElement>>();

export function cargarImagen(url: string): Promise<HTMLImageElement> {
  const enCache = cacheImagenes.get(url);
  if (enCache) return enCache;
  const p = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    // Sin esto el canvas queda «contaminado» y no se puede exportar una imagen de Supabase.
    if (!url.startsWith('blob:') && !url.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      cacheImagenes.delete(url);
      reject(new Error('No se pudo cargar el fondo del cartel.'));
    };
    img.src = url;
  });
  cacheImagenes.set(url, p);
  return p;
}

function hash(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** La Onda: barras verticales de puntas redondeadas, iguales para el mismo bolo. */
function dibujarOnda(ctx: CanvasRenderingContext2D, zona: Rect, color: string, semilla: string, u: number) {
  if (zona.h < 120 * u) return;
  const n = 21;
  const paso = zona.w / n;
  const grosor = paso * 0.5;
  let h = hash(semilla);
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    // Envolvente: más alto en el centro, como un espectro.
    const envolvente = 0.35 + 0.65 * Math.sin((Math.PI * (i + 0.5)) / n);
    const alto = Math.max(grosor, zona.h * envolvente * (0.35 + 0.65 * ((h % 1000) / 1000)));
    const x = zona.x + i * paso + (paso - grosor) / 2;
    const y = zona.y + (zona.h - alto) / 2;
    ctx.beginPath();
    ctx.roundRect(x, y, grosor, alto, grosor / 2);
    ctx.fill();
  }
}

function dibujarFondoImagen(ctx: CanvasRenderingContext2D, img: HTMLImageElement, ancho: number, alto: number) {
  const escala = Math.max(ancho / img.width, alto / img.height);
  const w = img.width * escala;
  const h = img.height * escala;
  ctx.drawImage(img, (ancho - w) / 2, (alto - h) / 2, w, h);
}

function tintaDeZona(ctx: CanvasRenderingContext2D, r: Rect): Tinta {
  const w = Math.max(1, Math.round(r.w));
  const h = Math.max(1, Math.round(r.h));
  try {
    return decidirTinta(medirLuz(ctx.getImageData(Math.round(r.x), Math.round(r.y), w, h).data));
  } catch (e) {
    // Canvas contaminado (fondo sin CORS): no se puede medir, se vela por si acaso.
    console.warn('[Cartel] No se pudo medir el fondo:', e);
    return { tinta: 'clara', velo: 0.45 };
  }
}

/** Velo plano sobre la zona del texto que se desvanece hacia el centro del cartel. */
function velar(ctx: CanvasRenderingContext2D, r: Rect, t: Tinta, haciaAbajo: boolean, fundido: number) {
  if (!t.velo) return;
  const rgb = t.tinta === 'clara' ? '15,16,20' : '244,241,234';
  const y0 = haciaAbajo ? r.y : r.y - fundido;
  const y1 = haciaAbajo ? r.y + r.h + fundido : r.y + r.h;
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  const lleno = `rgba(${rgb},${t.velo})`;
  const vacio = `rgba(${rgb},0)`;
  const corte = fundido / (y1 - y0);
  if (haciaAbajo) {
    g.addColorStop(0, lleno);
    g.addColorStop(1 - corte, lleno);
    g.addColorStop(1, vacio);
  } else {
    g.addColorStop(0, vacio);
    g.addColorStop(corte, lleno);
    g.addColorStop(1, lleno);
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, r.w, y1 - y0);
}

/**
 * Un enlace corto en MAYÚSCULAS entra en el modo alfanumérico del QR: 25 módulos en vez de 29, cada
 * uno más grande en el mismo papel, y se lee desde más lejos. Funciona porque el host no distingue
 * mayúsculas, Express tampoco en `/r/:code` y el servidor normaliza el código a minúsculas.
 * Cualquier otra URL (con query, UTM…) se deja tal cual.
 */
export function urlParaQr(url: string): string {
  return /^https?:\/\/[a-z0-9.-]+(:\d+)?\/r\/[a-z0-9]+$/i.test(url) ? url.toUpperCase() : url;
}

function dibujarQr(ctx: CanvasRenderingContext2D, r: Rect, url: string) {
  const qr = QRCode.create(urlParaQr(url), { errorCorrectionLevel: 'M' });
  const n = qr.modules.size;
  const margen = r.w * 0.07;
  const modulo = (r.w - margen * 2) / n;
  // Fondo claro siempre: un QR invertido o sobre foto lo leen mal muchos móviles.
  ctx.fillStyle = TINTAS.clara;
  ctx.beginPath();
  ctx.roundRect(r.x, r.y, r.w, r.h, r.w * 0.06);
  ctx.fill();
  ctx.fillStyle = TINTAS.oscura;
  for (let fila = 0; fila < n; fila++) {
    for (let col = 0; col < n; col++) {
      if (qr.modules.get(fila, col)) {
        // +0.5 evita las rayas finas entre módulos al escalar.
        ctx.fillRect(r.x + margen + col * modulo, r.y + margen + fila * modulo, modulo + 0.5, modulo + 0.5);
      }
    }
  }
}

/**
 * Pinta el cartel completo en `canvas` a `ancho` píxeles (el alto sale del formato).
 * Devuelve el layout usado, por si quien llama quiere saber dónde quedó cada cosa.
 */
export async function renderCartel(
  canvas: HTMLCanvasElement,
  def: DefFormato,
  ancho: number,
  fondo: FondoCartel,
  piezas: PiezasCartel
): Promise<LayoutCartel> {
  await prepararFuentes();
  const imagen = fondo.tipo === 'imagen' ? await cargarImagen(fondo.url) : null;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Tu navegador no puede dibujar el cartel.');

  const medir = (t: string, px: number, peso: number) => {
    ctx.font = fuente(peso, px);
    return ctx.measureText(t).width;
  };
  const L = calcularLayout(def, ancho, piezas.datos, piezas.opciones, medir);
  canvas.width = L.ancho;
  canvas.height = L.alto;
  const u = L.ancho / 1080;

  // 1. Fondo.
  const paleta = fondo.tipo === 'paleta' ? PALETAS.find((p) => p.id === fondo.id) ?? PALETAS[0] : null;
  if (paleta) {
    ctx.fillStyle = paleta.fondo;
    ctx.fillRect(0, 0, L.ancho, L.alto);
    const hueco: Rect = {
      x: 72 * u,
      y: L.zonas.arriba.y + L.zonas.arriba.h,
      w: L.ancho - 144 * u,
      h: L.zonas.abajo.y - (L.zonas.arriba.y + L.zonas.arriba.h),
    };
    dibujarOnda(ctx, hueco, paleta.acento, piezas.semilla, u);
  } else if (imagen) {
    dibujarFondoImagen(ctx, imagen, L.ancho, L.alto);
  }

  // 2. Tinta y velo, medidos sobre el fondo real de cada zona.
  const fundido = 120 * u;
  const tArriba = tintaDeZona(ctx, L.zonas.arriba);
  const tAbajo = tintaDeZona(ctx, L.zonas.abajo);
  velar(ctx, L.zonas.arriba, tArriba, true, fundido);
  velar(ctx, L.zonas.abajo, tAbajo, false, fundido);

  // 3. Texto.
  ctx.textBaseline = 'top';
  for (const l of L.lineas) {
    const t = l.y >= L.zonas.abajo.y ? tAbajo : tArriba;
    ctx.fillStyle = TINTAS[t.tinta];
    ctx.font = fuente(l.peso, l.px);
    ctx.textAlign = l.alinear;
    ctx.fillText(l.texto, l.x, l.y);
  }

  // 4. QR.
  if (L.qr && piezas.qrUrl) dibujarQr(ctx, L.qr, piezas.qrUrl);

  return L;
}

export function canvasABlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo exportar el cartel.'))), 'image/png');
  });
}

export function nombreArchivo(banda: string, fecha: string, formato: string, ext = 'png'): string {
  const limpio = `cartel-${banda}-${fecha}-${formato}`
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${limpio}.${ext}`;
}

export function descargarBlob(blob: Blob, nombre: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  a.click();
  // En Safari revocar en el mismo tick cancela la descarga.
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** En el móvil abre la hoja de compartir con la imagen (directo a Instagram/WhatsApp); si no se puede, descarga. */
export async function compartirODescargar(blob: Blob, nombre: string, titulo: string): Promise<'compartido' | 'descargado' | 'cancelado'> {
  const archivo = new File([blob], nombre, { type: blob.type });
  if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], title: titulo });
      return 'compartido';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelado';
      console.warn('[Cartel] Falló compartir; se descarga:', e);
    }
  }
  descargarBlob(blob, nombre);
  return 'descargado';
}

/**
 * Foto de la banda lista para fondo: como mucho 1600 px de lado y en JPEG. Pesa poco al subirla,
 * pinta rápido y el servidor solo tiene que aceptar un formato.
 */
export async function prepararFoto(archivo: File, maxLado = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo).catch(() => {
    throw new Error('No podemos leer esa foto. Prueba con un JPG o PNG.');
  });
  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(bitmap.width * escala);
  lienzo.height = Math.round(bitmap.height * escala);
  lienzo.getContext('2d')?.drawImage(bitmap, 0, 0, lienzo.width, lienzo.height);
  bitmap.close();
  return new Promise((resolve, reject) => {
    lienzo.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo preparar la foto.'))), 'image/jpeg', 0.86);
  });
}
