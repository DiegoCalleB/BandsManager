/**
 * Escapado de HTML para texto que escribe un usuario y se pinta dentro de un correo.
 *
 * Los nombres de banda, de firmante o de miembro llegaban tal cual a las plantillas HTML de los
 * correos (con la marca de la plataforma): quien se registraba con un nombre como
 * `<a href="https://phishing">Pulsa aquí</a>` conseguía que un correo legítimo de BandManager
 * llevara su enlace. `sanitizeExternalText` solo protege los prompts de IA, no el HTML.
 */
export function escapeHtml(valor: unknown): string {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Devuelve una copia del objeto con todos sus campos de texto escapados (el resto, intacto). */
export function escaparTextos<T extends Record<string, any>>(obj: T): T {
  const copia: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) copia[k] = typeof v === 'string' ? escapeHtml(v) : v;
  return copia as T;
}
