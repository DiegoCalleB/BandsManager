/**
 * `enlacesRedes` del EPK mezcla dos cosas: enlaces públicos (instagram, spotify, web…) y la
 * conexión privada con Meta (token de acceso, id de cuenta). `GET /public/epk` es anónimo, así
 * que antes de servirlo se quedan fuera todas las claves de credenciales: con el token de
 * Instagram cualquiera podría leer los insights de la banda o publicar en su nombre.
 */
const CLAVES_PRIVADAS = /token|secret|password|_account_id$|_verified_at$/i;

export function enlacesRedesPublicos(enlaces: Record<string, unknown> | null | undefined): Record<string, unknown> {
  return Object.fromEntries(Object.entries(enlaces || {}).filter(([clave]) => !CLAVES_PRIVADAS.test(clave)));
}
