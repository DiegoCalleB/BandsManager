/**
 * Estado del negocio de una sala según Google Maps: reglas puras.
 *
 * Marcar una sala como cerrada la saca de las consultas del catálogo, así que solo se hace cuando el resultado de Maps
 * es, con seguridad, la misma sala: por `place_id` o, si no lo hay, porque los nombres coinciden.
 */
import { normalizarTexto } from './salaCatalogo.js';

export type EstadoNegocio = 'sin_verificar' | 'operativo' | 'cerrado_temporal' | 'cerrado_permanente';

export interface LugarDeMaps {
  id: string;
  nombre: string;
  businessStatus?: string;
}

/** Estado que corresponde al `businessStatus` de Google, o null si no es uno de los que conocemos. */
export function estadoDeGoogle(businessStatus: unknown): Exclude<EstadoNegocio, 'sin_verificar'> | null {
  if (businessStatus === 'OPERATIONAL') return 'operativo';
  if (businessStatus === 'CLOSED_TEMPORARILY') return 'cerrado_temporal';
  if (businessStatus === 'CLOSED_PERMANENTLY') return 'cerrado_permanente';
  return null;
}

const palabras = (texto: string): string[] => normalizarTexto(texto).split(' ').filter((p) => p.length >= 3);

/** ¿El lugar de Maps es esta sala? Con `place_id` manda el id; sin él, el nombre de una debe estar contenido en el de la otra. */
export function esLaMismaSala(sala: { place_id: string | null; nombre: string }, lugar: LugarDeMaps): boolean {
  if (sala.place_id) return sala.place_id === lugar.id;
  const a = palabras(sala.nombre);
  const b = palabras(lugar.nombre);
  if (a.length === 0 || b.length === 0) return false;
  const [corto, largo] = a.length <= b.length ? [a, b] : [b, a];
  return corto.every((p) => largo.includes(p));
}
