import { avisoDeEmail } from './avisoDeEmail';

interface LeadConEmail {
  email_contacto?: string;
  datos_fuentes?: unknown;
}

export type EstadoDelEmail = 'verificado' | 'sin_procedencia' | 'sin_comprobar' | 'sin_email';

/**
 * `verificado`: salió de la web de la sala, de Google Places o del catálogo y no tiene aviso de dominio dudoso.
 * `sin_procedencia`: lo escribió una persona o es anterior al registro de procedencia; el Enviador lo trata como de la banda.
 * `sin_comprobar`: lo puso una IA o un buscador, o tiene aviso de dominio dudoso; el Enviador no lo usa.
 * Regla de AGENTS.md §3: sin evidencia no entran.
 */
export function estadoDelEmail(lead: LeadConEmail): EstadoDelEmail {
  if (!lead.email_contacto?.trim()) return 'sin_email';
  const fuente = (lead.datos_fuentes as Record<string, { fuente?: string } | undefined> | undefined)?.email_contacto?.fuente;
  if (avisoDeEmail(lead) !== null || fuente === 'ia' || fuente === 'buscador') return 'sin_comprobar';
  return fuente === 'web' || fuente === 'places' || fuente === 'catalogo' || fuente === 'persona' ? 'verificado' : 'sin_procedencia';
}

export const tieneEmailVerificado = (lead: LeadConEmail): boolean => estadoDelEmail(lead) === 'verificado';
