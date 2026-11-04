/**
 * Vínculos usuario↔banda de la tabla `user_bands` de Supabase, traídos al estado en memoria.
 *
 * El selector de bandas y la comprobación de acceso al cambiar de banda solo miraban
 * `state.userBands`, que se rehace en memoria a partir de `users.band_id` y de las bandas registradas
 * con el email del usuario. Una banda vinculada solo en la tabla desaparecía en cuanto la banda activa
 * era otra, y cambiarse a ella daba «No tienes acceso». La tabla es la fuente de verdad.
 */
import type { AppState } from '../../stateTypes.js';
import { dbGetUserBands } from '../../db.js';
import { cleanBandId } from './bandasDisponibles.js';

/** Añade a `state.userBands` los vínculos de `userId` que estén en Supabase y falten en memoria. Nunca lanza. */
export async function hidratarVinculosDeBd(state: AppState, userId: string): Promise<void> {
  if (!userId) return;
  try {
    const filas = await dbGetUserBands(userId);
    if (!Array.isArray(filas)) return;
    if (!state.userBands) state.userBands = [];
    for (const fila of filas) {
      // Solo las filas de este usuario: ninguna banda ajena entra en su lista.
      if (!fila?.band_id || fila.user_id !== userId) continue;
      const bandaLimpia = cleanBandId(fila.band_id);
      const yaEsta = state.userBands.some((ub) => ub.user_id === userId && cleanBandId(ub.band_id) === bandaLimpia);
      if (yaEsta) continue;
      state.userBands.push({
        id: fila.id || `ub-${userId}-${fila.band_id}`,
        user_id: userId,
        band_id: fila.band_id,
        role: fila.role || 'member',
        createdAt: fila.created_at || new Date().toISOString(),
      });
    }
  } catch (err) {
    // Sin Supabase se sigue con los vínculos en memoria: es lo que había antes de esta lectura.
    console.warn('[Sesión] No se pudieron leer los vínculos de user_bands; se usan los de memoria:', err);
  }
}
