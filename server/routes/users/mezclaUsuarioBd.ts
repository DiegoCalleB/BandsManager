/**
 * Mezcla de la fila real de Supabase sobre el usuario que el servidor tiene en memoria.
 *
 * Una instancia nueva arranca con los usuarios semilla (src/db_seed.ts). El login y /auth/me los
 * refrescan desde Supabase, que es la fuente de verdad. Antes solo se copiaban plan, rol y bandas:
 * el email, el nombre y el orden de bandas semilla sobrevivían y el cambio de banda
 * (`dbUpsertUser`, que reescribe la fila entera con lo que hay en memoria) los guardaba en la BD.
 */
import type { AppState, UsuarioGuardado } from '../../stateTypes.js';
import { normalizePlan } from '../../db.js';

type UsuarioEnMemoria = AppState['users'][number];

/** Copia a `destino` lo que la BD tenga informado; un campo vacío en la BD nunca borra el de memoria. */
export function copiarCamposDeBd(destino: UsuarioEnMemoria, bd: UsuarioGuardado): void {
  if (bd.plan) destino.plan = normalizePlan(bd.plan);
  if (bd.role) destino.role = bd.role;
  if (bd.band_id) destino.band_id = bd.band_id;
  if (bd.bandName) destino.bandName = bd.bandName;
  if (bd.main_band_id) destino.main_band_id = bd.main_band_id;
  if (Array.isArray(bd.band_order) && bd.band_order.length > 0) destino.band_order = bd.band_order;
  if (bd.name) destino.name = bd.name;
  if (bd.instrument) destino.instrument = bd.instrument;
  if (bd.avatarColor) destino.avatarColor = bd.avatarColor;
  // Un email sin @ no es un email: no pisa el que ya hay.
  if (typeof bd.email === 'string' && bd.email.includes('@')) destino.email = bd.email;
}
