// Lo que se guarda de un cartel en `concerts.cartel_config` (jsonb). Lo usan el cliente (al leer
// el bolo) y el servidor (al guardarlo): el mismo saneador en los dos lados, para que un JSON
// manipulado no pueda colar una URL ajena ni un tamaño absurdo.
//
// Las URLs se validan con una función que pone quien llama: el servidor exige que sean de SU
// almacenamiento y de la carpeta de ESA banda (`esUrlDeCartel` en server/utils/cartelUrl.ts).

import { ORDEN_FORMATOS, type FormatoCartel } from './formatos';

export const PALETA_IDS = ['noche', 'amarillo', 'electrico', 'bosque'] as const;
export type PaletaId = (typeof PALETA_IDS)[number];

export type FondoGuardado =
  | { tipo: 'paleta'; id: PaletaId }
  | { tipo: 'imagen'; origen: 'foto' | 'ia'; url: string };

export interface CartelConfig {
  v: 1;
  formato: FormatoCartel;
  fondo: FondoGuardado;
  /** null = sin decidir; '@todas' o el nombre de una banda del bolo. */
  cabeza: string | null;
  extra: string;
  horario: boolean;
  qr: boolean;
  marca: boolean;
  /** Últimos fondos de IA de este bolo, el más nuevo primero. */
  fondosIa: string[];
  /** Foto propia subida para este bolo. */
  foto: string | null;
}

export const MAX_FONDOS_IA = 3;
const MAX_EXTRA = 40;
const MAX_CABEZA = 120;

export const CONFIG_INICIAL: CartelConfig = {
  v: 1,
  formato: 'feed',
  fondo: { tipo: 'paleta', id: 'noche' },
  cabeza: null,
  extra: '',
  horario: true,
  qr: true,
  marca: true,
  fondosIa: [],
  foto: null,
};

/** Sin caracteres de control (saltos de línea, nulos…): en un cartel solo hay texto de una línea. */
const sinControl = (s: string) => Array.from(s).filter((ch) => { const c = ch.charCodeAt(0); return c >= 32 && c !== 127; }).join('');
const texto = (v: unknown, max: number) => (typeof v === 'string' ? sinControl(v).trim().slice(0, max) : '');
const booleano = (v: unknown, defecto: boolean) => (typeof v === 'boolean' ? v : defecto);

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

  let fondo: FondoGuardado = CONFIG_INICIAL.fondo;
  const f = r.fondo as Record<string, unknown> | undefined;
  if (f?.tipo === 'paleta' && (PALETA_IDS as readonly string[]).includes(f.id as string)) {
    fondo = { tipo: 'paleta', id: f.id as PaletaId };
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
    qr: booleano(r.qr, true),
    marca: booleano(r.marca, true),
    fondosIa,
    foto,
  };
}

/** Añade un fondo de IA al historial (el más nuevo primero, sin repetidos, como mucho 3). */
export function conFondoIa(config: CartelConfig, url: string): CartelConfig {
  return { ...config, fondosIa: [url, ...config.fondosIa.filter((u) => u !== url)].slice(0, MAX_FONDOS_IA) };
}

/** Lo que se decide por bolo y no es el fondo. */
export type AjustesBolo = Pick<CartelConfig, 'cabeza' | 'extra' | 'horario' | 'qr' | 'marca'>;

export function ajustesDe(c: CartelConfig): AjustesBolo {
  return { cabeza: c.cabeza, extra: c.extra, horario: c.horario, qr: c.qr, marca: c.marca };
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
  anterior: CartelConfig;
}): CartelConfig {
  let fondo = e.fondo;
  if (fondo.tipo === 'imagen' && fondo.origen === 'foto' && fondo.url !== e.fotoRemota) {
    fondo = e.fotoRemota && fondo.url.startsWith('blob:') ? { tipo: 'imagen', origen: 'foto', url: e.fotoRemota } : e.anterior.fondo;
  }
  return { v: 1, formato: e.formato, fondo, ...e.ajustes, fondosIa: e.fondosIa.slice(0, MAX_FONDOS_IA), foto: e.fotoRemota };
}
