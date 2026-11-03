// «Pídele cambios al cartel»: una frase («pon la fecha más grande y roja, quita el logo y el cielo más oscuro»)
// se reparte en dos mitades. Lo de ARTE (escena, luz, colores de la ilustración) va a la IA de imagen como un
// retoque; lo de las CAPAS de BandManager (texto, QR, logo, datos del bolo) son acciones de un catálogo CERRADO
// que se aplican como un cambio normal del editor (deshacer, autoguardado).
//
// Esto es la parte pura, compartida por el servidor (que sanea lo que propone la IA de texto) y el cliente (que lo
// aplica): una IA no puede hacer nada que no esté en este catálogo, y todo es un cambio de aspecto del propio cartel.

import type { AjustesBolo } from './config';
import { ACABADOS, DESTINOS_QR, MAX_EXTRA, MAX_TEXTO_EDITADO } from './config';
import { BLOQUES, conAjusteDeBloque, esIdentidad, conEstiloDeBloque, sanearAjustesFinos, type BloqueAjustable } from './ajustesFinos';
import type { FormatoCartel } from './formatos';
import { ELECCIONES_COMPOSICION, LETRAS_CARTEL, VOCES_CARTEL, type VozCartel } from './voces';
import { MAX_LIBRES, MAX_TEXTO_LIBRE } from './textosLibres';

export const MAX_ACCIONES = 8;
export const MAX_ARTE = 300;
export const MAX_RESUMEN = 200;
/** Lo máximo que una orden mueve un bloque de una vez (fracción del ancho) y lo que lo escala (factor). */
const MAX_MOVER = 0.6;
const ESCALA_ORDEN = { min: 0.4, max: 2.5 } as const;

export const INTERRUPTORES = ['qr', 'qrDigital', 'logo', 'horario', 'direccion', 'logosTinta'] as const;
export type Interruptor = (typeof INTERRUPTORES)[number];
export const ELEGIBLES = ['qrDestino', 'letra', 'composicion', 'acabado'] as const;
export type Elegible = (typeof ELEGIBLES)[number];
export const TEXTOS_ORDEN = ['nombre', 'lugar', 'extra'] as const;
export type CampoTexto = (typeof TEXTOS_ORDEN)[number];

export type AccionCapa =
  | { tipo: 'estilo'; bloque: BloqueAjustable; fuente?: VozCartel | null; color?: string | null; oculto?: boolean }
  | { tipo: 'mover'; bloque: BloqueAjustable; dx?: number; dy?: number; escala?: number }
  | { tipo: 'interruptor'; campo: Interruptor; valor: boolean }
  | { tipo: 'elegir'; campo: Elegible; valor: string }
  | { tipo: 'texto'; campo: CampoTexto; valor: string }
  | { tipo: 'libre'; indice: number; texto: string };

export interface PlanOrden {
  /** Una frase, para decirle a la persona qué se ha entendido. */
  resumen: string;
  acciones: AccionCapa[];
  /** Lo que hay que cambiar de la ILUSTRACIÓN (vacío = nada): va a la IA de imagen como un retoque. */
  arte: string;
}

const VALORES: Record<Elegible, readonly string[]> = {
  qrDestino: DESTINOS_QR,
  letra: LETRAS_CARTEL,
  composicion: ELECCIONES_COMPOSICION,
  acabado: ACABADOS,
};
const COLOR_HEX = /^#[0-9a-f]{6}$/i;

const sinControl = (s: string) => Array.from(s).filter((ch) => { const c = ch.charCodeAt(0); return c >= 32 && c !== 127; }).join('');
const texto = (v: unknown, max: number) => (typeof v === 'string' ? sinControl(v).replace(/[<>]/g, '').trim().slice(0, max) : '');
const numero = (v: unknown, min: number, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : undefined);
const esBloque = (v: unknown): v is BloqueAjustable => (BLOQUES as readonly string[]).includes(v as string);

/** Una acción válida del catálogo, o null. Todo lo que no cuadra se descarta, no se corrige. */
function sanearAccion(raw: unknown): AccionCapa | null {
  if (!raw || typeof raw !== 'object') return null;
  const a = raw as Record<string, unknown>;
  switch (a.tipo) {
    case 'estilo': {
      if (!esBloque(a.bloque)) return null;
      const salida: Extract<AccionCapa, { tipo: 'estilo' }> = { tipo: 'estilo', bloque: a.bloque };
      if (a.fuente === null) salida.fuente = null;
      else if ((VOCES_CARTEL as readonly string[]).includes(a.fuente as string)) salida.fuente = a.fuente as VozCartel;
      if (a.color === null) salida.color = null;
      else if (typeof a.color === 'string' && COLOR_HEX.test(a.color)) salida.color = a.color.toLowerCase();
      if (typeof a.oculto === 'boolean') salida.oculto = a.oculto;
      return 'fuente' in salida || 'color' in salida || 'oculto' in salida ? salida : null;
    }
    case 'mover': {
      if (!esBloque(a.bloque)) return null;
      const dx = numero(a.dx, -MAX_MOVER, MAX_MOVER);
      const dy = numero(a.dy, -MAX_MOVER, MAX_MOVER);
      const escala = numero(a.escala, ESCALA_ORDEN.min, ESCALA_ORDEN.max);
      return dx === undefined && dy === undefined && escala === undefined ? null : { tipo: 'mover', bloque: a.bloque, ...(dx !== undefined && { dx }), ...(dy !== undefined && { dy }), ...(escala !== undefined && { escala }) };
    }
    case 'interruptor':
      return (INTERRUPTORES as readonly string[]).includes(a.campo as string) && typeof a.valor === 'boolean' ? { tipo: 'interruptor', campo: a.campo as Interruptor, valor: a.valor } : null;
    case 'elegir':
      return (ELEGIBLES as readonly string[]).includes(a.campo as string) && VALORES[a.campo as Elegible].includes(a.valor as string) ? { tipo: 'elegir', campo: a.campo as Elegible, valor: a.valor as string } : null;
    case 'texto': {
      if (!(TEXTOS_ORDEN as readonly string[]).includes(a.campo as string)) return null;
      const max = a.campo === 'extra' ? MAX_EXTRA : MAX_TEXTO_EDITADO;
      return typeof a.valor === 'string' ? { tipo: 'texto', campo: a.campo as CampoTexto, valor: texto(a.valor, max) } : null;
    }
    case 'libre':
      return Number.isInteger(a.indice) && (a.indice as number) >= 0 && (a.indice as number) < MAX_LIBRES && typeof a.texto === 'string'
        ? { tipo: 'libre', indice: a.indice as number, texto: texto(a.texto, MAX_TEXTO_LIBRE) }
        : null;
    default:
      return null;
  }
}

/** Cualquier cosa → un plan válido (puede salir vacío). */
export function sanearPlan(raw: unknown): PlanOrden {
  const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const acciones = (Array.isArray(r.acciones) ? r.acciones : []).map(sanearAccion).filter((a): a is AccionCapa => !!a).slice(0, MAX_ACCIONES);
  return { resumen: texto(r.resumen, MAX_RESUMEN), acciones, arte: texto(r.arte, MAX_ARTE) };
}

export const planVacio = (p: PlanOrden) => p.acciones.length === 0 && !p.arte;

/**
 * Los ajustes del bolo tras aplicar las acciones, sobre los de ahora. Una sola función pura: el editor la aplica con
 * un único `cambiarAjustes`, así que toda la orden es UN paso para deshacer. Los movimientos son relativos (parten
 * de donde está el bloque ahora) y valen para el formato que se está viendo.
 */
export function aplicarAcciones(ajustes: AjustesBolo, formato: FormatoCartel, acciones: AccionCapa[]): AjustesBolo {
  let sig: AjustesBolo = { ...ajustes, textos: { ...ajustes.textos }, libres: [...ajustes.libres] };
  for (const a of acciones) {
    switch (a.tipo) {
      case 'estilo':
        sig = { ...sig, estilos: conEstiloDeBloque(sig.estilos, a.bloque, { ...('fuente' in a && { fuente: a.fuente ?? undefined }), ...('color' in a && { color: a.color ?? undefined }), ...('oculto' in a && { oculto: a.oculto || undefined }) }) };
        break;
      case 'mover': {
        const ahora = sig.ajustesFinos[formato]?.[a.bloque] ?? { dx: 0, dy: 0, escala: 1 };
        const siguiente = sanearAjustesFinos({ [formato]: { [a.bloque]: { dx: ahora.dx + (a.dx ?? 0), dy: ahora.dy + (a.dy ?? 0), escala: ahora.escala * (a.escala ?? 1) } } })[formato]?.[a.bloque] ?? { dx: 0, dy: 0, escala: 1 };
        sig = { ...sig, ajustesFinos: conAjusteDeBloque(sig.ajustesFinos, formato, a.bloque, esIdentidad(siguiente) ? { dx: 0, dy: 0, escala: 1 } : siguiente) };
        break;
      }
      case 'interruptor':
        sig = { ...sig, [a.campo]: a.valor };
        break;
      case 'elegir':
        sig = { ...sig, [a.campo]: a.valor } as AjustesBolo;
        break;
      case 'texto':
        sig = a.campo === 'extra' ? { ...sig, extra: a.valor } : { ...sig, textos: { ...sig.textos, [a.campo]: a.valor } };
        break;
      case 'libre': {
        const libres = Array.from({ length: MAX_LIBRES }, (_, k) => sig.libres[k] ?? '');
        libres[a.indice] = a.texto;
        sig = { ...sig, libres };
        break;
      }
    }
  }
  return sig;
}
