// Columnas del lead que escribe el enriquecimiento: el id de Google Maps y la procedencia de cada dato.
// Aparte de leads.ts (monolito congelado): dbUpsertLead solo añade `...columnasDeEnriquecimiento(...)`.
import { procedenciaValida, type MapaProcedencia } from '../utils/procedenciaDatos.js';

const texto = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/**
 * `place_id` y `datos_fuentes` a guardar. Lo recibido manda; si no llega nada se conserva lo que ya había, para que
 * guardar una ficha editada por un cliente que no conoce estos campos no los borre. La procedencia se sanea siempre.
 */
export function columnasDeEnriquecimiento(lead: object, existente?: object | null): { place_id: string | null; datos_fuentes: MapaProcedencia } {
  const nuevo = lead as Record<string, unknown>;
  const previo = (existente ?? {}) as Record<string, unknown>;
  return {
    place_id: texto(nuevo.place_id) || texto(previo.place_id) || null,
    datos_fuentes: procedenciaValida(nuevo.datos_fuentes ?? previo.datos_fuentes),
  };
}
