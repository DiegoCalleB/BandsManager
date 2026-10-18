// Aviso «comprueba este email» de un lead: lo deja el enriquecimiento cuando un email aportado por una IA o un buscador
// no se ha podido confirmar (server/services/avisarEmailsDudosos.ts). Va ligado al valor exacto: si se edita el email,
// el aviso deja de aplicarse solo.

export type CampoEmail = 'email_contacto' | 'email_secundario';

interface LeadConAvisos {
  email_contacto?: string;
  email_secundario?: string;
  /** Procedencia por campo que añade el servidor. El tipo `Lead` compartido aún no la declara. */
  datos_fuentes?: unknown;
}

export const TEXTO_AVISO_EMAIL = 'Compruébalo antes de escribir: no hemos podido confirmar que el dominio de este email exista.';

/** El texto del aviso si el email actual es justo el que quedó en duda; si no, null. */
export function avisoDeEmail(lead: LeadConAvisos | null | undefined, campo: CampoEmail = 'email_contacto'): string | null {
  const email = lead?.[campo]?.trim().toLowerCase();
  if (!email) return null;
  const fuentes = lead?.datos_fuentes;
  if (!fuentes || typeof fuentes !== 'object') return null;
  const aviso = (fuentes as Record<string, { aviso?: { tipo?: unknown; para?: unknown } } | undefined>)[campo]?.aviso;
  if (aviso?.tipo !== 'dominio_inexistente' || typeof aviso.para !== 'string') return null;
  return aviso.para.trim().toLowerCase() === email ? TEXTO_AVISO_EMAIL : null;
}
