// Perfil público de una banda para las superficies sin sesión (página de concierto, insignia del
// dossier y de la landing de fans). Solo devuelve lo que ya es público: nombre, logo y, para la
// insignia, un booleano (el plan NO sale de aquí).

import { dbGetBandaRegistrada, type FilaBanda } from '../db/referidos.js';
import { dbGetEpkConfig } from '../db/epk.js';
import { normalizePlan } from '../db/core.js';
import { elegirNombreBanda } from '../utils/perfilBanda.js';
import { debeMostrarInsignia } from '../utils/referidos.js';
import { urlHttpSegura } from '../utils/enlacesCortos.js';
import { normalizarCodigoReferido } from '../utils/referidos.js';

export interface PerfilPublicoBanda {
  bandId: string;
  nombre: string;
  logoUrl: string | null;
  mostrarInsignia: boolean;
  refCode: string | null;
}

export async function obtenerPerfilPublicoBanda(bandId: string): Promise<PerfilPublicoBanda> {
  let fila: FilaBanda | null = null;
  let epk: Awaited<ReturnType<typeof dbGetEpkConfig>> | null = null;
  try {
    fila = await dbGetBandaRegistrada(bandId);
  } catch (e) {
    console.warn('[perfil público] No se pudo leer registered_bands:', (e as Error)?.message || e);
  }
  try {
    epk = await dbGetEpkConfig(bandId);
  } catch (e) {
    console.warn('[perfil público] No se pudo leer el EPK:', (e as Error)?.message || e);
  }

  const plan = normalizePlan(fila?.plan);
  return {
    bandId,
    nombre: elegirNombreBanda(fila, epk, bandId),
    logoUrl: urlHttpSegura(epk?.logoUrl || fila?.logo_url || fila?.imagen_url),
    // Una banda que no encontramos se trata como gratuita: la insignia es la opción por defecto.
    mostrarInsignia: debeMostrarInsignia(plan),
    refCode: normalizarCodigoReferido(fila?.ref_code),
  };
}

/* ------------------------------------------------------------------ caché corta */

// Cada clic en un enlace corto y cada visita a una página de concierto necesitan el nombre de la
// banda: sin caché serían dos consultas más por petición pública. 5 minutos de retraso al cambiar
// el nombre o el plan son aceptables aquí (no es dato de seguridad).
const TTL_MS = 5 * 60 * 1000;
const MAX_ENTRADAS = 500;
const cache = new Map<string, { hasta: number; perfil: PerfilPublicoBanda }>();

export async function obtenerPerfilPublicoBandaCacheado(bandId: string, ahora = Date.now()): Promise<PerfilPublicoBanda> {
  const hit = cache.get(bandId);
  if (hit && hit.hasta > ahora) return hit.perfil;
  const perfil = await obtenerPerfilPublicoBanda(bandId);
  if (cache.size >= MAX_ENTRADAS) cache.delete(cache.keys().next().value as string);
  cache.set(bandId, { hasta: ahora + TTL_MS, perfil });
  return perfil;
}

/** Solo para los tests. */
export function _vaciarCachePerfiles() {
  cache.clear();
}
