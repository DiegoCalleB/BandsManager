// Cola mínima de reintento para ediciones de setlist hechas sin conexión (típico: cambiar el
// tono de un tema en Modo Concierto durante un bolo sin wifi). syncSetlistToBackend ya
// actualiza el estado local al instante (optimista), pero si el PUT al servidor falla y luego
// la app vuelve a montarse con conexión, un fetch normal traería la versión VIEJA del servidor
// y pisaría el cambio que solo vivía en local. Esta cola se vacía antes de confiar en ese fetch.

import type { Setlist } from '../types';

const PENDING_KEY_PREFIX = 'pending_setlist_sync_';

function keyFor(bandId?: string): string {
  return PENDING_KEY_PREFIX + (bandId || 'default');
}

export function queuePendingSetlistSync(bandId: string | undefined, setlist: Setlist): void {
  try {
    const key = keyFor(bandId);
    const raw = localStorage.getItem(key);
    const pending = raw ? JSON.parse(raw) : {};
    pending[setlist.id] = setlist;
    localStorage.setItem(key, JSON.stringify(pending));
  } catch {
    // localStorage no disponible (modo privado estricto, cuota llena...) — sin red de
    // seguridad adicional posible aquí, el cambio sigue viviendo en el estado en memoria.
  }
}

export function clearPendingSetlistSync(bandId: string | undefined, setlistId: string): void {
  try {
    const key = keyFor(bandId);
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const pending = JSON.parse(raw);
    delete pending[setlistId];
    localStorage.setItem(key, JSON.stringify(pending));
  } catch {
    // no-op
  }
}

/** Los setlists encolados por {@link queuePendingSetlistSync}, uno por id. */
export function getPendingSetlistSyncs(bandId: string | undefined): Setlist[] {
  try {
    const raw = localStorage.getItem(keyFor(bandId));
    if (!raw) return [];
    const pendientes: Record<string, Setlist> = JSON.parse(raw);
    return Object.values(pendientes);
  } catch {
    return [];
  }
}
