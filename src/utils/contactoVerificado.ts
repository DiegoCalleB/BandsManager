import { avisoDeEmail } from './avisoDeEmail';

interface LeadConEmail {
  email_contacto?: string;
  datos_fuentes?: unknown;
}

/**
 * El email de contacto se puede usar en una campaña: lo escribió una persona o salió de la web, Places o el
 * catálogo, y no tiene aviso de dominio dudoso. Los de IA o buscador nunca cuentan (AGENTS.md §3, «sin evidencia no entran»).
 */
export function tieneEmailVerificado(lead: LeadConEmail): boolean {
  if (!lead.email_contacto?.trim()) return false;
  const fuente = (lead.datos_fuentes as Record<string, { fuente?: string } | undefined> | undefined)?.email_contacto?.fuente;
  if (fuente === 'ia' || fuente === 'buscador') return false;
  return avisoDeEmail(lead) === null;
}
