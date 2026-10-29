// Lo que se guarda de un cartel en `concerts.cartel_config` (jsonb). Lo usan el cliente (al leer
// el bolo) y el servidor (al guardarlo): el mismo saneador en los dos lados, para que un JSON
// manipulado no pueda colar una URL ajena ni un tamaño absurdo.
//
// Las URLs se validan con una función que pone quien llama: el servidor exige que sean de SU
// almacenamiento y de la carpeta de ESA banda (`esUrlDeCartel` en server/utils/cartelUrl.ts).

import { esPlantilla, type PlantillaId } from './plantillas';
import { MAX_LIBRES, MAX_TEXTO_LIBRE } from './textosLibres';
import { sanearAjustesFinos, sanearEstilosBloques, type AjustesFinosPorFormato, type EstilosBloques } from './ajustesFinos';
import { ORDEN_FORMATOS, type FormatoCartel } from './formatos';
import { ELECCIONES_COMPOSICION, LETRAS_CARTEL, type ComposicionElegida, type LetraCartel } from './voces';

/** `banda` = «Tus colores», sacados del logo al abrir la vista (no se guardan: dependen del logo actual). */
export const PALETA_IDS = ['noche', 'amarillo', 'electrico', 'bosque', 'banda'] as const;
export type PaletaId = (typeof PALETA_IDS)[number];

export type FondoGuardado =
  | { tipo: 'paleta'; id: PaletaId }
  | { tipo: 'plantilla'; id: PlantillaId }
  | { tipo: 'imagen'; origen: 'foto' | 'ia'; url: string };

export interface CartelConfig {
  v: 1;
  formato: FormatoCartel;
  fondo: FondoGuardado;
  /** null = sin decidir; '@todas' o el nombre de una banda del bolo. */
  cabeza: string | null;
  extra: string;
  horario: boolean;
  /** La dirección de la sala (calle y número), del bolo. */
  direccion: boolean;
  qr: boolean;
  /** El QR también en Feed e Historia (encendido por defecto: quien ve el cartel en otra pantalla o impreso lo escanea). */
  qrDigital: boolean;
  /** A dónde lleva el QR (los escaneos se cuentan en la campaña del bolo). */
  qrDestino: DestinoQr;
  /** Textos que la persona escribe en el cartel SIN tocar los datos del bolo: el nombre y el lugar que se muestran. Vacío = el del bolo. */
  textos: TextosEditados;
  /** Lo que la persona movió o escaló a mano, por formato, sobre el reparto automático. */
  ajustesFinos: AjustesFinosPorFormato;
  /** Letra, color y ocultar de cada bloque del texto. */
  estilos: EstilosBloques;
  /** Textos sueltos (hasta 3): los huecos vacíos se guardan para que cada texto conserve su sitio. */
  libres: string[];
  marca: boolean;
  /** Logo de la banda en la fila de logos del cartel. */
  logo: boolean;
  /** La letra del nombre y del día: `auto` la saca del estilo de la banda. */
  letra: LetraCartel;
  /** Cómo se reparte el cartel: `auto` lo decide la letra. */
  composicion: ComposicionElegida;
  /** Logos en la tinta del cartel (como impresos) en vez de a color sobre una placa clara. */
  logosTinta: boolean;
  /** Logos de otras bandas del bolo (subidos para este cartel), en el orden en que salen. */
  logos: string[];
  /** Últimos fondos de IA de este bolo, el más nuevo primero. */
  fondosIa: string[];
  /** Foto propia subida para este bolo. */
  foto: string | null;
  /**
   * Cómo se hizo cada fondo retocado. Cada vuelta de la IA sobre una imagen ya retocada la vuelve a pintar entera y
   * pierde detalle; por eso un retoque nuevo parte del ORIGINAL con todas las instrucciones juntas. Lo escribe solo
   * el servidor (el cliente no lo manda: el guardado lo conserva).
   */
  retoques: Record<string, LinajeRetoque>;
}

/** Versiones de fondo de IA que se recuerdan por bolo (cada retoque es una más). */
/** Lo que la persona puede escribir a mano en el cartel; vacío = lo que dice el bolo. */
export interface TextosEditados {
  nombre: string;
  lugar: string;
}
export const MAX_TEXTO_EDITADO = 60;

/** A dónde lleva el QR del cartel: la página del bolo, su venta de entradas o la página de fans de la banda. */
export const DESTINOS_QR = ['concierto', 'entradas', 'fans'] as const;
export type DestinoQr = (typeof DESTINOS_QR)[number];

export const MAX_FONDOS_IA = 8;
/** Retoques que se encadenan sobre el MISMO original antes de partir de la imagen ya retocada. */
export const MAX_PASOS_RETOQUE = 5;

/** De dónde sale un fondo retocado: el original y todo lo que se le ha pedido, en orden. */
export interface LinajeRetoque {
  origen: string;
  instrucciones: string[];
}
export const MAX_LOGOS = 4;
export const MAX_EXTRA = 60;
const MAX_CABEZA = 120;

export const CONFIG_INICIAL: CartelConfig = {
  v: 1,
  formato: 'feed',
  fondo: { tipo: 'paleta', id: 'noche' },
  cabeza: null,
  extra: '',
  horario: true,
  direccion: false,
  qr: true,
  qrDigital: true,
  qrDestino: 'concierto',
  textos: { nombre: '', lugar: '' },
  ajustesFinos: {},
  estilos: {},
  libres: [],
  marca: true,
  logo: true,
  letra: 'auto',
  composicion: 'auto',
  logosTinta: true,
  logos: [],
  fondosIa: [],
  foto: null,
  retoques: {},
};

/** Sin caracteres de control (saltos de línea, nulos…): en un cartel solo hay texto de una línea. */
const sinControl = (s: string) => Array.from(s).filter((ch) => { const c = ch.charCodeAt(0); return c >= 32 && c !== 127; }).join('');
const texto = (v: unknown, max: number) => (typeof v === 'string' ? sinControl(v).trim().slice(0, max) : '');
const booleano = (v: unknown, defecto: boolean) => (typeof v === 'boolean' ? v : defecto);

function textosEditados(raw: unknown): TextosEditados {
  const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return { nombre: texto(r.nombre, MAX_TEXTO_EDITADO), lugar: texto(r.lugar, MAX_TEXTO_EDITADO) };
}

/** Hasta tres textos sueltos de una línea; un hueco vacío se queda vacío (así cada texto conserva su bloque). */
function textosLibres(raw: unknown): string[] {
  const lista = (Array.isArray(raw) ? raw : []).slice(0, MAX_LIBRES).map((t) => texto(t, MAX_TEXTO_LIBRE));
  while (lista.length && !lista[lista.length - 1]) lista.pop();
  return lista;
}

/** Devuelve una configuración válida a partir de cualquier cosa (o null si no es un objeto). */
export function sanearConfigCartel(raw: unknown, esUrlPermitida: (url: string) => boolean): CartelConfig | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const url = (v: unknown) => (typeof v === 'string' && v.length <= 2048 && esUrlPermitida(v) ? v : null);

  const fondosIa = (Array.isArray(r.fondosIa) ? r.fondosIa : [])
    .map(url)
    .filter((u): u is string => !!u)
    .filter((u, i, a) => a.indexOf(u) === i)
    .slice(0, MAX_FONDOS_IA);
  const foto = url(r.foto);
  const logos = (Array.isArray(r.logos) ? r.logos : [])
    .map(url)
    .filter((u): u is string => !!u)
    .filter((u, i, a) => a.indexOf(u) === i)
    .slice(0, MAX_LOGOS);

  let fondo: FondoGuardado = CONFIG_INICIAL.fondo;
  const f = r.fondo as Record<string, unknown> | undefined;
  if (f?.tipo === 'paleta' && (PALETA_IDS as readonly string[]).includes(f.id as string)) {
    fondo = { tipo: 'paleta', id: f.id as PaletaId };
  } else if (f?.tipo === 'plantilla' && esPlantilla(f.id)) {
    fondo = { tipo: 'plantilla', id: f.id };
  } else if (f?.tipo === 'imagen' && (f.origen === 'ia' || f.origen === 'foto')) {
    const u = url(f.url);
    // Una imagen que no está en el historial (o en la foto) del bolo no se acepta como fondo.
    if (u && (f.origen === 'ia' ? fondosIa.includes(u) : u === foto)) fondo = { tipo: 'imagen', origen: f.origen, url: u };
  }

  const cabeza = r.cabeza === null || r.cabeza === undefined ? null : texto(r.cabeza, MAX_CABEZA) || null;

  return {
    v: 1,
    formato: (ORDEN_FORMATOS as readonly string[]).includes(r.formato as string) ? (r.formato as FormatoCartel) : 'feed',
    fondo,
    cabeza,
    extra: texto(r.extra, MAX_EXTRA),
    horario: booleano(r.horario, true),
    direccion: booleano(r.direccion, false),
    qr: booleano(r.qr, true),
    qrDigital: booleano(r.qrDigital, true),
    qrDestino: (DESTINOS_QR as readonly string[]).includes(r.qrDestino as string) ? (r.qrDestino as DestinoQr) : 'concierto',
    textos: textosEditados(r.textos),
    ajustesFinos: sanearAjustesFinos(r.ajustesFinos),
    estilos: sanearEstilosBloques(r.estilos),
    libres: textosLibres(r.libres),
    marca: booleano(r.marca, true),
    logo: booleano(r.logo, true),
    letra: (LETRAS_CARTEL as readonly string[]).includes(r.letra as string) ? (r.letra as LetraCartel) : 'auto',
    composicion: (ELECCIONES_COMPOSICION as readonly string[]).includes(r.composicion as string) ? (r.composicion as ComposicionElegida) : 'auto',
    logosTinta: booleano(r.logosTinta, true),
    logos,
    fondosIa,
    foto,
    retoques: linajes(r.retoques, fondosIa, url),
  };
}

/** Linajes de retoque válidos: del historial del bolo, con su original también en el historial. */
function linajes(raw: unknown, fondosIa: string[], url: (v: unknown) => string | null): Record<string, LinajeRetoque> {
  const salida: Record<string, LinajeRetoque> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return salida;
  for (const [clave, v] of Object.entries(raw as Record<string, unknown>).slice(0, MAX_FONDOS_IA)) {
    const u = url(clave);
    const l = v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
    const origen = url(l?.origen);
    if (!u || !origen || !fondosIa.includes(u) || !fondosIa.includes(origen)) continue;
    const instrucciones = (Array.isArray(l?.instrucciones) ? (l!.instrucciones as unknown[]) : []).map((t) => texto(t, 300)).filter(Boolean).slice(0, MAX_PASOS_RETOQUE);
    if (instrucciones.length) salida[u] = { origen, instrucciones };
  }
  return salida;
}

/** Con estos linajes de retoque, quitando los de fondos (o con original) que ya no están en el historial. */
export function conRetoques(config: CartelConfig, retoques: Record<string, LinajeRetoque>): CartelConfig {
  const vivos = Object.entries(retoques).filter(([u, l]) => config.fondosIa.includes(u) && config.fondosIa.includes(l.origen));
  return { ...config, retoques: Object.fromEntries(vivos) };
}

/** Añade un fondo de IA al historial (el más nuevo primero, sin repetidos, como mucho `MAX_FONDOS_IA`). */
export function conFondoIa(config: CartelConfig, url: string): CartelConfig {
  const fondosIa = [url, ...config.fondosIa.filter((u) => u !== url)].slice(0, MAX_FONDOS_IA);
  return conRetoques({ ...config, fondosIa }, config.retoques ?? {});
}

/** Anota de dónde sale un fondo retocado (para que el siguiente retoque parta del original). */
export function conLinaje(config: CartelConfig, url: string, linaje: LinajeRetoque): CartelConfig {
  return conFondoIa({ ...config, retoques: { ...config.retoques, [url]: linaje } }, url);
}

/** Lo que se decide por bolo y no es el fondo. */
export type AjustesBolo = Pick<CartelConfig, 'cabeza' | 'extra' | 'horario' | 'direccion' | 'qr' | 'qrDigital' | 'qrDestino' | 'ajustesFinos' | 'estilos' | 'libres' | 'textos' | 'marca' | 'logo' | 'logosTinta' | 'letra' | 'composicion'>;

export function ajustesDe(c: CartelConfig): AjustesBolo {
  return { cabeza: c.cabeza, extra: c.extra, horario: c.horario, direccion: c.direccion, qr: c.qr, qrDigital: c.qrDigital, qrDestino: c.qrDestino, ajustesFinos: c.ajustesFinos, estilos: c.estilos, libres: c.libres, textos: c.textos, marca: c.marca, logo: c.logo, logosTinta: c.logosTinta, letra: c.letra, composicion: c.composicion };
}

/**
 * Configuración a guardar a partir de lo que hay en pantalla. Una foto recién elegida vive como
 * `blob:` en el navegador hasta que termina de subirse: mientras tanto se guarda el fondo anterior
 * (el servidor ya pone la foto como fondo al recibirla) y nunca una URL local.
 */
export function configDesdeEstado(e: {
  formato: FormatoCartel;
  fondo: FondoGuardado;
  ajustes: AjustesBolo;
  fondosIa: string[];
  fotoRemota: string | null;
  logos: string[];
  anterior: CartelConfig;
}): CartelConfig {
  let fondo = e.fondo;
  if (fondo.tipo === 'imagen' && fondo.origen === 'foto' && fondo.url !== e.fotoRemota) {
    fondo = e.fotoRemota && fondo.url.startsWith('blob:') ? { tipo: 'imagen', origen: 'foto', url: e.fotoRemota } : e.anterior.fondo;
  }
  return { v: 1, formato: e.formato, fondo, ...e.ajustes, logos: e.logos.slice(0, MAX_LOGOS), fondosIa: e.fondosIa.slice(0, MAX_FONDOS_IA), foto: e.fotoRemota, retoques: e.anterior.retoques };
}
