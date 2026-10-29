// Pinta el cartel en un canvas a partir del layout puro. Es la única pieza con DOM del motor.
//
// Los colores de aquí son de la obra (el cartel que se imprime o se sube a Instagram), no de la
// interfaz: por eso viven en este fichero y no salen de tokens.css.

import QRCode from 'qrcode';
import { calcularLayout, type Adorno, type DatosCartel, type LayoutCartel, type Linea, type OpcionesLayout, type Rect } from './layout';
import { decidirTinta, medirLuz, tintaSinVelo, unirPixeles, type Tinta } from './contraste';
import { dimensiones, type DefFormato } from './formatos';
import type { FondoGuardado, PaletaId } from './config';
import { aplicarGrano, semillaDeTexto } from './grano';
import { dibujarPlacas, luzDeImagen, planPlacas } from './placas';
import { leerArte, type ArtePapel } from './papel';
import { encajarImagen, type Encaje } from './ventana';
import { VOCES, type Composicion, type VozCartel } from './voces';
import { tintarLogo } from './logos';
import { fondoConTexto } from './fondoIa';
import { TINTA_PLANTILLA, dibujarPlantilla, type PlantillaId } from './plantillas';
import { dibujarArteEntero, dibujarFondoImagen } from './arteCanvas';
import { sombraDe, velar } from './velo';

export const TINTAS = { clara: '#F4F1EA', oscura: '#17181C' } as const;

export type { PaletaId };
export interface Paleta {
  id: Exclude<PaletaId, 'banda'>;
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
  /** «Tus colores» (del logo), para el fondo `banda`. Sin ellos ese fondo cae a la primera paleta. */
  paletaBanda?: { fondo: string; acento: string } | null;
  /** Logos de la fila (el de la banda primero, luego los subidos para el bolo). Los que no cargan se saltan. */
  logos?: string[];
  /** La letra de exhibición del nombre y el día de la fecha. */
  voz?: VozCartel;
  /** Cómo se reparte el cartel. */
  composicion?: Composicion;
  /** La letra / el reparto se dejaron en «automático»: sobre una ilustración a sangre el render elige los suyos. */
  vozAuto?: boolean;
  composicionAuto?: boolean;
  /** Una sola tinta para todos los logos (como impresos). Si no, a color sobre una placa clara. */
  logosTinta?: boolean;
  opciones: OpcionesLayout;
  /** URL completa que codifica el QR (solo si `opciones.qr`). */
  qrUrl: string | null;
  /** Hace que la Onda de cada bolo sea siempre la misma. */
  semilla: string;
}

function resolverPaleta(id: PaletaId, banda?: PiezasCartel['paletaBanda']): Paleta {
  if (id === 'banda' && banda) return { id: 'noche', nombre: 'Tus colores', fondo: banda.fondo, acento: banda.acento };
  return PALETAS.find((p) => p.id === id) ?? PALETAS[0];
}

const FAMILIA = '"Onest Variable", Onest, system-ui, sans-serif';
/** Espaciado entre letras (en em). Si el navegador no lo soporta se ignora, y la medida y el pintado coinciden igual. */
function conTracking(ctx: CanvasRenderingContext2D, px: number, tracking = 0) {
  const c = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  if ('letterSpacing' in c) c.letterSpacing = tracking ? `${(tracking * px).toFixed(2)}px` : '0px';
}

/** `voz` = la letra de exhibición (nombre y día); sin ella, Onest. Onest va siempre de reserva. */
const fuente = (peso: number, px: number, voz?: VozCartel | null) =>
  voz ? `${VOCES[voz].peso} ${Math.round(px)}px ${VOCES[voz].familia}, ${FAMILIA}` : `${peso} ${Math.round(px)}px ${FAMILIA}`;

/** Espera a que la fuente esté lista: sin esto el primer cartel salía con la del sistema. */
export async function prepararFuentes(voz: VozCartel = 'moderna'): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  try {
    await Promise.all([...[600, 700, 800].map((p) => document.fonts.load(fuente(p, 100))), document.fonts.load(fuente(VOCES[voz].peso, 100, voz))]);
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


/**
 * Tinta y velo de una zona, medidos DONDE ESTÁ EL TEXTO (línea a línea) y no en toda la zona: un
 * círculo oscuro detrás de una sola palabra es invisible para la media de la zona y deja esa
 * palabra ilegible. Se tolera solo un 3 % de píxeles peor que lo medido.
 */
function tintaDeLineas(ctx: CanvasRenderingContext2D, lineas: Linea[], zona: Rect, u: number, voz: VozCartel, rects: Rect[] = [], sinVelo = false): Tinta {
  try {
    const deRects = rects.map((r) => {
      const x = Math.max(0, Math.round(r.x));
      const y = Math.max(0, Math.round(r.y));
      return ctx.getImageData(x, y, Math.max(1, Math.min(Math.round(r.w), ctx.canvas.width - x)), Math.max(1, Math.min(Math.round(r.h), ctx.canvas.height - y))).data;
    });
    const trozos = lineas.map((l) => {
      ctx.font = fuente(l.peso, l.px, l.voz ?? (l.titulo ? voz : null));
      conTracking(ctx, l.px, l.tracking);
      const ancho = ctx.measureText(l.texto).width;
      const pad = 6 * u;
      const izq = l.alinear === 'left' ? l.x : l.alinear === 'right' ? l.x - ancho : l.x - ancho / 2;
      const x = Math.max(0, Math.round(izq - pad));
      const y = Math.max(0, Math.round(l.y - pad));
      const w = Math.max(1, Math.min(Math.round(ancho + pad * 2), ctx.canvas.width - x));
      const h = Math.max(1, Math.min(Math.round(l.px * 1.15 + pad * 2), ctx.canvas.height - y));
      return ctx.getImageData(x, y, w, h).data;
    });
    const todos = [...trozos, ...deRects];
    const decidir = sinVelo ? tintaSinVelo : decidirTinta;
    // Sin velo se decide por la MEDIANA del fondo (cola 0,5): las letras claras que dibuja la IA cerca del texto no deben engañar.
    return todos.length ? decidir(medirLuz(unirPixeles(todos), 2, sinVelo ? 0.5 : 0.03)) : tintaDeZona(ctx, zona);
  } catch (e) {
    console.warn('[Cartel] No se pudo medir el fondo bajo el texto:', e);
    return { tinta: 'clara', velo: 0.45 };
  }
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
 * Pinta la ilustración. Con `difuminar` > 0 sus bordes se desvanecen contra el papel: así una ilustración
 * dibujada sobre su propio papel no se ve como un rectángulo pegado.
 */
function dibujarIlustracion(ctx: CanvasRenderingContext2D, img: HTMLImageElement, e: Encaje, difuminar: number, mezcla: GlobalCompositeOperation = 'source-over') {
  ctx.save();
  ctx.globalCompositeOperation = mezcla;
  try {
    dibujarIlustracionSimple(ctx, img, e, difuminar);
  } finally {
    ctx.restore();
  }
}

function dibujarIlustracionSimple(ctx: CanvasRenderingContext2D, img: HTMLImageElement, e: Encaje, difuminar: number) {
  if (difuminar <= 0) {
    ctx.drawImage(img, e.sx, e.sy, e.sw, e.sh, e.dx, e.dy, e.dw, e.dh);
    return;
  }
  const w = Math.max(1, Math.ceil(e.dw));
  const h = Math.max(1, Math.ceil(e.dh));
  const aparte = document.createElement('canvas');
  aparte.width = w;
  aparte.height = h;
  const c = aparte.getContext('2d');
  if (!c) return ctx.drawImage(img, e.sx, e.sy, e.sw, e.sh, e.dx, e.dy, e.dw, e.dh);
  c.drawImage(img, e.sx, e.sy, e.sw, e.sh, 0, 0, w, h);
  c.globalCompositeOperation = 'destination-in';
  for (const [x1, y1] of [[w, 0], [0, h]] as const) {
    const largo = x1 || y1;
    const f = Math.min(0.5, difuminar / largo);
    const g = c.createLinearGradient(0, 0, x1, y1);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(f, 'rgba(0,0,0,1)');
    g.addColorStop(1 - f, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  }
  ctx.drawImage(aparte, e.dx, e.dy, e.dw, e.dh);
}

/** Filetes (y el rombo del centro) en la tinta del texto. */
function dibujarAdornos(ctx: CanvasRenderingContext2D, adornos: Adorno[], color: (a: Adorno) => string) {
  for (const a of adornos) {
    ctx.fillStyle = color(a);
    const g = a.grosor;
    if (!a.rombo) {
      ctx.fillRect(a.x, a.y, a.w, g);
      continue;
    }
    const cx = a.x + a.w / 2;
    const r = g * 3.2;
    const hueco = r + g * 4;
    ctx.fillRect(a.x, a.y, a.w / 2 - hueco, g);
    ctx.fillRect(cx + hueco, a.y, a.w / 2 - hueco, g);
    ctx.beginPath();
    ctx.moveTo(cx, a.y + g / 2 - r);
    ctx.lineTo(cx + r, a.y + g / 2);
    ctx.lineTo(cx, a.y + g / 2 + r);
    ctx.lineTo(cx - r, a.y + g / 2);
    ctx.closePath();
    ctx.fill();
  }
}

interface LogoCargado {
  url: string;
  img: HTMLImageElement;
}

/** Los logos que cargan, en orden. Uno que no carga (borrado, sin CORS) se salta: el cartel sale igual. */
async function cargarLogos(urls: string[]): Promise<LogoCargado[]> {
  const hechos = await Promise.all(
    urls.map((url) =>
      cargarImagen(url).then(
        (img) => ({ url, img }),
        (e) => {
          console.warn('[Cartel] No se pudo cargar un logo; el cartel sale sin él:', e);
          return null;
        }
      )
    )
  );
  return hechos.filter((l): l is LogoCargado => !!l && l.img.width > 0 && l.img.height > 0);
}

/**
 * La fila de logos. En tinta (lo normal) cada logo es una silueta de la misma tinta que el texto, con
 * desgaste leve: como impreso junto al resto. A color, cada uno va sobre su placa clara redondeada.
 */
function dibujarLogos(ctx: CanvasRenderingContext2D, rects: Rect[], logos: LogoCargado[], color: string, tintaEnTinta: boolean, u: number) {
  ctx.imageSmoothingQuality = 'high';
  rects.forEach((r, i) => {
    const logo = logos[i];
    if (!logo) return;
    if (tintaEnTinta) {
      ctx.drawImage(tintarLogo(logo.img, logo.url, color), r.x, r.y, r.w, r.h);
      return;
    }
    const pad = 14 * u;
    ctx.fillStyle = TINTAS.clara;
    ctx.beginPath();
    ctx.roundRect(r.x - pad, r.y - pad, r.w + pad * 2, r.h + pad * 2, 18 * u);
    ctx.fill();
    ctx.drawImage(logo.img, r.x, r.y, r.w, r.h);
  });
}

/**
 * Pinta el cartel completo en `canvas` a `ancho` píxeles (el alto sale del formato).
 * Devuelve el layout usado, por si quien llama quiere saber dónde quedó cada cosa.
 */
/** La plantilla dibujada a las medidas de este formato (mismo dibujo en vista previa y exportación, por la semilla). */
function lienzoDePlantilla(id: PlantillaId, def: DefFormato, ancho: number, semilla: string): HTMLCanvasElement {
  const { alto } = dimensiones(def, ancho);
  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  const c = lienzo.getContext('2d');
  if (c) dibujarPlantilla(id, c, ancho, alto, semillaDeTexto(semilla));
  return lienzo;
}

export async function renderCartel(
  canvas: HTMLCanvasElement,
  def: DefFormato,
  ancho: number,
  fondo: FondoCartel,
  piezas: PiezasCartel
): Promise<LayoutCartel> {
  const imagen: HTMLImageElement | HTMLCanvasElement | null =
    fondo.tipo === 'imagen' ? await cargarImagen(fondo.url) : fondo.tipo === 'plantilla' ? lienzoDePlantilla(fondo.id, def, ancho, piezas.semilla) : null;
  // Una plantilla de autor se trata como una ilustración vertical a sangre: mismo texto encima, misma fibra de papel.
  const esIa = (fondo.tipo === 'imagen' && fondo.origen === 'ia') || fondo.tipo === 'plantilla';
  // Una ilustración de IA vertical (3:4) es el cartel entero: el texto va encima, en sus zonas calmadas.
  // Una apaisada es una ventana dentro de un papel: el layout se compacta para dejarle sitio.
  const aSangre = esIa && !!imagen && imagen.height / imagen.width >= 1.1;
  // Letra y reparto en «automático»: sobre una ilustración a sangre, el nombre grande de cartel abajo y
  // los datos pequeños arriba; sin filetes ni adornos que le quiten fuerza al motivo.
  const voz = aSangre && piezas.vozAuto ? 'cartel' : (piezas.voz ?? 'moderna');
  const composicion = aSangre && piezas.composicionAuto ? 'base' : piezas.composicion;
  await prepararFuentes(voz);
  // Las letras elegidas a mano para algún bloque también tienen que estar cargadas.
  for (const e of Object.values(piezas.opciones.estilos ?? {})) if (e?.fuente && e.fuente !== voz) await prepararFuentes(e.fuente);

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Tu navegador no puede dibujar el cartel.');

  const medir = (t: string, px: number, peso: number, titulo?: boolean | VozCartel, tracking?: number) => {
    ctx.font = fuente(peso, px, titulo === true ? voz : titulo || null);
    conTracking(ctx, px, tracking);
    return ctx.measureText(t).width;
  };
  const logos = await cargarLogos(piezas.logos ?? []);
  // La ilustración ya trae el título y la fecha dibujados: el layout solo coloca lo que la IA no dibuja (QR, pie, logos).
  const textoIa = aSangre && fondo.tipo === 'imagen' && fondoConTexto(fondo.url);
  // Lo que la IA no dibuja (hora y dirección) va en la franja inferior libre, sobre el pie, como líneas extra.
  const datosLayout: DatosCartel = textoIa
    ? { lineup: [], fecha: '', horario: '', sala: '', ciudad: '', direccion: '', extra: [piezas.datos.horario, piezas.datos.direccion ?? ''].filter(Boolean).join('\n') }
    : piezas.datos;
  const conIlustracion = esIa && !aSangre;
  const L = calcularLayout(def, ancho, datosLayout, { ...piezas.opciones, compacto: conIlustracion, voz, composicion, logos: logos.map((l) => l.img.width / l.img.height) }, medir);
  canvas.width = L.ancho;
  canvas.height = L.alto;
  const u = L.ancho / 1080;

  // 1. Fondo.
  let arte: ArtePapel | null = null;
  // Una ilustración fundida con el papel se pinta DESPUÉS del nombre (lo solapa «oscureciendo»): se pospone.
  let pintarArte: (() => void) | null = null;
  const paleta = fondo.tipo === 'paleta' ? resolverPaleta(fondo.id, piezas.paletaBanda) : null;
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
    if (conIlustracion) {
      // Un fondo de IA es una ilustración ENTERA dentro de un cartel de papel: va en la ventana que dejan
      // las placas del texto y nada la corta. Si está dibujada sobre un papel liso, el cartel es de ESE papel
      // y la ilustración se funde con él (sin caja ni filetes); si no, se enmarca. La fibra se pone al final,
      // por encima del texto: así las letras también parecen impresas.
      // Aquí siempre es una imagen cargada: una plantilla nunca es una ventana (`conIlustracion` es falso).
      const img = imagen as HTMLImageElement;
      arte = leerArte(img);
      const plan = planPlacas(L, luzDeImagen(img), arte);
      ctx.fillStyle = plan.color;
      ctx.fillRect(0, 0, L.ancho, L.alto);
      const e = encajarImagen(img.width, img.height, plan.ventana);
      if (plan.modo === 'fundido') {
        pintarArte = () => dibujarIlustracion(ctx, img, e, Math.round(Math.min(e.dw, e.dh) * 0.07), 'darken');
      } else {
        dibujarIlustracion(ctx, img, e, 0);
        dibujarPlacas(ctx, plan);
      }
    } else {
      // La foto propia de la banda se deja como es, a sangre; un arte con letras dentro se pinta entero.
      if (textoIa) dibujarArteEntero(ctx, imagen, L.ancho, L.alto);
      else dibujarFondoImagen(ctx, imagen, L.ancho, L.alto);
    }
  }

  // 2. Tinta y velo, medidos sobre el fondo real de cada zona.
  const fundido = 120 * u;
  const enAbajo = (l: Linea) => l.y >= L.zonas.abajo.y;
  const lineasArriba = L.lineas.filter((l) => !enAbajo(l));
  const lineasAbajo = L.lineas.filter(enAbajo);
  // Con una ilustración de IA la tinta es una de las suyas (la oscura y saturada dominante), no un negro de
  // ordenador; solo si no hace falta velo: con velo se mantiene la tinta que garantiza el contraste.
  const tintaOscura = fondo.tipo === 'plantilla' ? TINTA_PLANTILLA[fondo.id] : arte?.tinta;
  const tintaDe = (t: Tinta) => (t.tinta === 'oscura' && t.velo === 0 && tintaOscura ? tintaOscura : TINTAS[t.tinta]);
  ctx.textBaseline = 'top';
  const pintar = (lineas: Linea[], t: Tinta) => {
    for (const l of lineas) {
      ctx.font = fuente(l.peso, l.px, l.voz ?? (l.titulo ? voz : null));
      conTracking(ctx, l.px, l.tracking);
      ctx.textAlign = l.alinear;
      // Desregistro de serigrafía: el nombre y el día se imprimen antes con la segunda tinta, apenas desplazada.
      if (l.titulo && t.tinta === 'oscura' && t.velo === 0 && arte?.tinta2) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = arte.tinta2;
        ctx.fillText(l.texto, l.x + l.px * 0.035, l.y + l.px * 0.03);
        ctx.restore();
      }
      ctx.fillStyle = l.color ?? tintaDe(t);
      ctx.fillText(l.texto, l.x, l.y);
    }
    conTracking(ctx, 1, 0);
  };

  let tArriba: Tinta;
  let tAbajo: Tinta;
  if (pintarArte) {
    // Fundido: el nombre se mide y se pinta sobre papel liso; luego entra la ilustración y se mide lo de abajo.
    tArriba = tintaDeLineas(ctx, lineasArriba, L.zonas.arriba, u, voz);
    pintar(lineasArriba, tArriba);
    pintarArte();
    tAbajo = tintaDeLineas(ctx, lineasAbajo, L.zonas.abajo, u, voz, L.logos);
    velar(ctx, L.zonas.abajo, tAbajo, false, fundido);
    pintar(lineasAbajo, tAbajo);
  } else {
    // Con las letras ya dibujadas en el arte no hay velo (apagaría el texto de la IA): solo se elige tinta clara u oscura.
    tArriba = tintaDeLineas(ctx, lineasArriba, L.zonas.arriba, u, voz, [], textoIa);
    tAbajo = tintaDeLineas(ctx, lineasAbajo, L.zonas.abajo, u, voz, L.logos, textoIa);
    // Una plantilla tiene su papel y sus tintas: el texto se elige por contraste y no se oscurece con velo.
    if (aSangre && !textoIa && fondo.tipo === 'imagen') {
      // Sobre una ilustración que ocupa todo el cartel, el texto es siempre claro sobre una sombra de la propia
      // imagen: un velo claro de papel con letra oscura se lee como una mancha gris pegada encima del arte.
      const sobreArte = (t: Tinta): Tinta => (t.tinta === 'oscura' ? { tinta: 'clara', velo: 0.6 } : t);
      tArriba = sobreArte(tArriba);
      tAbajo = sobreArte(tAbajo);
    }
    // A sangre el velo es largo y del color de la propia imagen; con foto o paleta, el de siempre.
    const caida = aSangre ? 260 * u : fundido;
    // La sombra del color de la imagen solo para texto CLARO: con letra oscura el velo es de papel, nunca una losa gris.
    const sombra = (t: Tinta, zona: Rect) => (aSangre && t.tinta === 'clara' ? sombraDe(ctx, zona) : null);
    velar(ctx, L.zonas.arriba, tArriba, true, caida, sombra(tArriba, L.zonas.arriba));
    velar(ctx, L.zonas.abajo, tAbajo, false, caida, sombra(tAbajo, { ...L.zonas.abajo, y: L.zonas.abajo.y - caida, h: L.zonas.abajo.h + caida }));
    pintar(lineasArriba, tArriba);
    pintar(lineasAbajo, tAbajo);
  }
  dibujarAdornos(ctx, L.adornos, (a) => tintaDe(a.y >= L.zonas.abajo.y ? tAbajo : tArriba));
  // 3. La fibra de papel, por encima de todo menos el QR (que tiene que escanear): fondo y letras impresos juntos.
  if (esIa) aplicarGrano(ctx, L.ancho, L.alto, semillaDeTexto(piezas.semilla));

  // 4. QR.
  if (L.qr && piezas.qrUrl) dibujarQr(ctx, L.qr, piezas.qrUrl);

  // 5. Logos de las bandas, en la tinta de abajo (donde están). Son opcionales.
  dibujarLogos(ctx, L.logos, logos, piezas.opciones.estilos?.logos?.color ?? tintaDe(tAbajo), piezas.logosTinta !== false, u);

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
