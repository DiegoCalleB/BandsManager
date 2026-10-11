/**
 * Quién puede restablecer la contraseña de quién: solo un líder sobre miembros exclusivos de su banda.
 */
import express from 'express';
import { puedeEscribirEnBanda } from '../../utils/bandAccess.js';
import { cleanBandId } from './bandasDisponibles.js';

/**
 * ¿Comparte este usuario alguna banda con quien hace la petición?
 *
 * Las rutas que buscan al usuario por id lo hacen sobre state.users entero, que es la lista de
 * TODA la plataforma. Sin esta comprobación, el id de alguien de otra banda bastaba para
 * editarlo (y en /users/:id, para ponerle una contraseña nueva).
 */
export function compartenBanda(
  state: any,
  usuarioObjetivo: any,
  req: express.Request
): boolean {
  if (!usuarioObjetivo) return false;
  const bandas = new Set<string>();
  if (usuarioObjetivo.band_id) bandas.add(usuarioObjetivo.band_id);
  (state.userBands || []).forEach((ub: any) => {
    if (ub.user_id === usuarioObjetivo.id && ub.band_id) bandas.add(ub.band_id);
  });
  return Array.from(bandas).some((b) => puedeEscribirEnBanda(req, b));
}
/**
 * ¿Puede quien hace la petición fijar la contraseña de OTRO usuario?
 *
 * Antes bastaba compartir banda con él, y compartir banda se conseguía a voluntad: un líder
 * (todo el mundo lo es en su banda) añadía a la víctima a la suya con POST /users y le cambiaba
 * la contraseña. Ahora solo se puede si la cuenta es de la banda y de nadie más: una invitación
 * aún sin activar, o un miembro cuya ÚNICA banda es esta. Una cuenta con banda propia (o admin)
 * nunca se resetea desde fuera.
 */
export function puedeRestablecerContrasenaDe(state: any, usuarioObjetivo: any, req: express.Request): boolean {
  if (!usuarioObjetivo || usuarioObjetivo.role === 'admin') return false;
  const bandas = new Set<string>();
  const anotar = (id?: string) => {
    if (id) bandas.add(cleanBandId(id));
  };
  anotar(usuarioObjetivo.band_id);
  anotar(usuarioObjetivo.main_band_id);
  (Array.isArray(usuarioObjetivo.band_order) ? usuarioObjetivo.band_order : []).forEach(anotar);
  (state.userBands || []).forEach((ub: any) => {
    if (ub.user_id === usuarioObjetivo.id) anotar(ub.band_id);
  });
  if (bandas.size === 0) return false;
  // Todas sus bandas tienen que ser bandas donde quien pide puede escribir.
  return Array.from(bandas).every((b) => puedeEscribirEnBanda(req, b)) &&
    // ...y no puede ser dueño de una banda registrada aparte.
    !(state.registeredBands || []).some(
      (rb: any) => rb.user_id === usuarioObjetivo.id && !puedeEscribirEnBanda(req, rb.band_id || rb.id)
    );
}
