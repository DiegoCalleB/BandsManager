/**
 * Código de invitación de otra banda: se captura del `?ref=` de la URL al llegar, se guarda 30 días
 * y, cuando la persona ya tiene cuenta, se le pide al servidor que lo atribuya (el servidor decide:
 * solo altas recientes, la primera atribución manda y nunca la propia banda).
 *
 * Es dato de adquisición, no de una banda: no entra en la regla de localStorage del AGENTS.md §2.5.
 * Todo va en try/catch: sin almacenamiento (modo privado, bloqueado) simplemente no se atribuye.
 */

const CLAVE = 'bm_ref';
export const CADUCIDAD_REFERIDO_MS = 30 * 24 * 60 * 60 * 1000;
const PATRON = /^[A-Z0-9]{8}$/;

/** Parte de `Storage` que usamos (permite probarlo sin navegador). */
export interface AlmacenReferido {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

export function leerCodigoDeUrl(search: string): string | null {
  try {
    const crudo = new URLSearchParams(search).get('ref');
    const c = crudo?.trim().toUpperCase() ?? '';
    return PATRON.test(c) ? c : null;
  } catch {
    return null;
  }
}

/** Guarda el código; si ya había uno vigente, manda el PRIMERO (quien te enseñó la herramienta primero). */
export function guardarReferido(almacen: AlmacenReferido, codigo: string, ahora = Date.now()): void {
  try {
    if (referidoPendiente(almacen, ahora)) return;
    almacen.setItem(CLAVE, JSON.stringify({ codigo, ts: ahora }));
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

export function referidoPendiente(almacen: AlmacenReferido, ahora = Date.now()): string | null {
  try {
    const crudo = almacen.getItem(CLAVE);
    if (!crudo) return null;
    const { codigo, ts } = JSON.parse(crudo);
    if (typeof codigo !== 'string' || !PATRON.test(codigo) || typeof ts !== 'number') return null;
    if (ahora - ts > CADUCIDAD_REFERIDO_MS || ts > ahora + 60_000) return null;
    return codigo;
  } catch {
    return null;
  }
}

export function limpiarReferido(almacen: AlmacenReferido): void {
  try {
    almacen.removeItem(CLAVE);
  } catch {
    /* nada */
  }
}

/** Arranque de la app: si la URL trae `?ref=`, lo guarda. */
export function capturarReferidoDeLaUrl(): void {
  if (typeof window === 'undefined') return;
  const codigo = leerCodigoDeUrl(window.location.search);
  if (codigo) guardarReferido(window.localStorage, codigo);
}

/**
 * Tras iniciar sesión: manda el código pendiente al servidor UNA vez y lo borra pase lo que pase
 * (aceptado, rechazado o error): reintentarlo en cada carga no cambiaría la respuesta.
 */
export async function atribuirReferidoPendiente(
  enviar: (codigo: string) => Promise<unknown>,
  almacen: AlmacenReferido = window.localStorage
): Promise<void> {
  const codigo = referidoPendiente(almacen);
  if (!codigo) return;
  try {
    await enviar(codigo);
  } catch {
    /* sin red o sesión caducada: se borra igualmente, no es un dato que merezca reintentos */
  } finally {
    limpiarReferido(almacen);
  }
}
