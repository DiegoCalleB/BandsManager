// Lo que se guarda de un cartel en `concerts.cartel_config` (jsonb). Lo usan el cliente (al leer
// el bolo) y el servidor (al guardarlo): el mismo saneador en los dos lados, para que un JSON
// manipulado no pueda colar una URL ajena ni un tamaño absurdo.
//
// Las URLs se validan con una función que pone quien llama: el servidor exige que sean de SU
// almacenamiento y de la carpeta de ESA banda (`esUrlDeCartel` en server/utils/cartelUrl.ts).

import { esPlantilla, type PlantillaId } from './plantillas';
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
  /** El QR también en Feed e Historia (por defecto solo en el impreso, donde no hay un enlace que tocar). */
  qrDigital: boolean;
  /** Textos que la persona escribe en el cartel SIN tocar los datos del bolo: el nombre y el lugar que se muestran. Vacío = el del bolo. */
  textos: TextosEditados;
  /** Lo que la persona movió o escaló a mano, por formato, sobre el reparto automático. */
  ajustesFinos: AjustesFinosPorFormato;
  /** Letra, color y ocultar de cada bloque del texto. */
  estilos: EstilosBloques;
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
}

/** Versiones de fondo de IA que se recuerdan por bolo (cada retoque es una más). */
/** Lo que la persona puede escribir a mano en el cartel; vacío = lo que dice el bolo. */
export interface TextosEditados {
  nombre: string;
  lugar: string;
}
export const MAX_TEXTO_EDITADO = 60;

export const MAX_FONDOS_IA = 8;
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
  qrDigital: false,
  textos: { nombre: '', lugar: '' },
  ajustesFinos: {},
  estilos: {},
  marca: true,
  logo: true,
  letra: 'auto',
  composicion: 'auto',
  logosTinta: true,
  logos: [],
  fondosIa: [],
  foto: null,
};

/** Sin caracteres de control (saltos de línea, nulos…): en un cartel solo hay texto de una línea. */
const sinControl = (s: string) => Array.from(s).filter((ch) => { const c = ch.charCodeAt(0); return c >= 32 && c !== 127; }).join('');
const texto = (v: unknown, max: number) => (typeof v === 'string' ? sinControl(v).trim().slice(0, max) : '');
const booleano = (v: unknown, defecto: boolean) => (typeof v === 'boolean' ? v : defecto);

function textosEditados(raw: unknown): TextosEditados {
  const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return { nombre: texto(r.nombre, MAX_TEXTO_EDITADO), lugar: texto(r.lugar, MAX_TEXTO_EDITADO) };
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
    qrDigital: booleano(r.qrDigital, false),
    textos: textosEditados(r.textos),
    ajustesFinos: sanearAjustesFinos(r.ajustesFinos),
    estilos: sanearEstilosBloques(r.estilos),
    marca: booleano(r.marca, true),
    logo: booleano(r.logo, true),
    letra: (LETRAS_CARTEL as readonly string[]).includes(r.letra as string) ? (r.letra as LetraCartel) : 'auto',
    composicion: (ELECCIONES_COMPOSICION as readonly string[]).includes(r.composicion as string) ? (r.composicion as ComposicionElegida) : 'auto',
    logosTinta: booleano(r.logosTinta, true),
    logos,
    fondosIa,
    foto,
  };
}

/** Añade un fondo de IA al historial (el más nuevo primero, sin repetidos, como mucho `MAX_FONDOS_IA`). */
export function conFondoIa(config: CartelConfig, url: string): CartelConfig {
  return { ...config, fondosIa: [url, ...config.fondosIa.filter((u) => u !== url)].slice(0, MAX_FONDOS_IA) };
}

/** Lo que se decide por bolo y no es el fondo. */
export type AjustesBolo = Pick<CartelConfig, 'cabeza' | 'extra' | 'horario' | 'direccion' | 'qr' | 'qrDigital' | 'ajustesFinos' | 'estilos' | 'textos' | 'marca' | 'logo' | 'logosTinta' | 'letra' | 'composicion'>;

export function ajustesDe(c: CartelConfig): AjustesBolo {
  return { cabeza: c.cabeza, extra: c.extra, horario: c.horario, direccion: c.direccion, qr: c.qr, qrDigital: c.qrDigital, ajustesFinos: c.ajustesFinos, estilos: c.estilos, textos: c.textos, marca: c.marca, logo: c.logo, logosTinta: c.logosTinta, letra: c.letra, composicion: c.composicion };
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
  return { v: 1, formato: e.formato, fondo, ...e.ajustes, logos: e.logos.slice(0, MAX_LOGOS), fondosIa: e.fondosIa.slice(0, MAX_FONDOS_IA), foto: e.fotoRemota };
}
