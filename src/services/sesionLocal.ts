/**
 * Lectura de la sesión guardada en el navegador: token, usuario y banda activa.
 *
 * Único punto de lectura (antes había ~47 lecturas sueltas de `localStorage` repartidas en 25
 * ficheros, cada una con su variante de clave y de manejo de errores). La escritura sigue en
 * `useAuth`, que es quien abre y cierra la sesión. Todas las funciones toleran un almacenamiento
 * no disponible (modo privado, iframe con sandbox) o un JSON corrupto: devuelven vacío.
 */
import type { User } from '../types';

const CLAVE_TOKEN = 'bandmanager_token';
/** Clave antigua del token, aún presente en navegadores que no han vuelto a iniciar sesión. */
const CLAVE_TOKEN_LEGADO = 'token';
const CLAVE_USUARIO = 'bandmanager_user';

function leer(clave: string): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(clave) : null;
  } catch {
    return null; // almacenamiento no disponible: como si no hubiera sesión
  }
}

/** Token de sesión, o cadena vacía si no hay sesión. */
export function leerTokenDeSesion(): string {
  return leer(CLAVE_TOKEN) || leer(CLAVE_TOKEN_LEGADO) || '';
}

/** Usuario de la sesión guardado al iniciarla, o `null` si no hay (o está corrupto). */
export function leerUsuarioDeSesion(): User | null {
  const crudo = leer(CLAVE_USUARIO);
  if (!crudo) return null;
  try {
    const u = JSON.parse(crudo) as User | null;
    return u && typeof u === 'object' ? u : null;
  } catch {
    return null; // JSON corrupto: se trata como sesión sin usuario
  }
}

/** Hay un usuario guardado (aunque el token haya caducado). */
export function hayUsuarioGuardado(): boolean {
  return Boolean(leer(CLAVE_USUARIO));
}

/** Banda activa del usuario de la sesión, o cadena vacía. */
export function leerBandaActiva(): string {
  const id = leerUsuarioDeSesion()?.band_id;
  return id ? String(id) : '';
}

/** Cabecera `Authorization` de la sesión, vacía si no hay token. */
export function cabeceraDeAutorizacion(): Record<string, string> {
  const token = leerTokenDeSesion();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
