/**
 * Validación de direcciones de correo, en un solo sitio.
 *
 * Nace de una regla del proyecto que no estaba implementada en código: "ningún lead pasa a
 * 'aprobado' sin que el email de contacto esté verificado". Antes el hueco se tapaba solo,
 * porque el Scout rellenaba los emails que no conocía con valores inventados. Al quitar esos
 * inventos, los leads sin email son visibles y legítimos — así que hace falta la guarda de
 * verdad, y hace falta que salte al APROBAR, no en silencio al intentar enviar.
 */

/** Estados en los que un lead está en cola para que el Enviador le mande un correo. */
export const ESTADOS_DE_ENVIO = ['aprobado', 'aprobado_propuesta', 'aprobado_respuesta'] as const;

export function esEstadoDeEnvio(estado: unknown): boolean {
  return typeof estado === 'string' && (ESTADOS_DE_ENVIO as readonly string[]).includes(estado.trim());
}

export function esEmailValido(email?: unknown): boolean {
  if (!email || typeof email !== 'string') return false;
  // Sin excluir la coma y los paréntesis, un valor como "a,role.eq.admin@evil.com" pasaba como
  // "email válido" y luego se usaba tal cual en consultas .or() de Supabase/PostgREST en
  // server/db/users.ts, permitiendo inyectar condiciones OR adicionales al filtro.
  return /^[^\s@,()]+@[^\s@,()]+\.[^\s@,()]+$/.test(email.trim());
}

/** Alias en inglés para el código que ya lo llamaba así (server/routes/billing.ts). */
export const isValidEmail = esEmailValido;

export interface ResultadoGuardaEnvio {
  ok: boolean;
  /** Mensaje listo para devolver al usuario cuando ok === false. */
  motivo?: string;
}

/**
 * ¿Puede esta actualización meter el lead en la cola de envío?
 *
 * Solo bloquea la TRANSICIÓN hacia un estado de envío: cambiar otros campos de un lead que ya
 * estaba aprobado, o moverlo a 'descartado' sin email, no tiene por qué fallar.
 */
export function puedeEntrarEnColaDeEnvio(
  leadExistente: any,
  camposActualizados: any
): ResultadoGuardaEnvio {
  const entraAhora =
    esEstadoDeEnvio(camposActualizados?.estado) && !esEstadoDeEnvio(leadExistente?.estado);
  if (!entraAhora) return { ok: true };

  const fusionado = { ...(leadExistente || {}), ...(camposActualizados || {}) };
  const email = fusionado.email_contacto || fusionado.email_secundario || fusionado.email;
  if (esEmailValido(email) || esEmailValido(fusionado.email_contacto) || esEmailValido(fusionado.email_secundario)) return { ok: true };

  const nombre = fusionado.nombre_sala || fusionado.nombre_medio || 'esta sala';
  return {
    ok: false,
    motivo: email
      ? `No se puede aprobar "${nombre}": el email de contacto ("${email}") no es válido. Verifícalo antes de aprobar.`
      : `No se puede aprobar "${nombre}" sin email de contacto. Búscalo y verifícalo antes de aprobar: aprobar sin email deja el envío en un fallo silencioso.`,
  };
}
