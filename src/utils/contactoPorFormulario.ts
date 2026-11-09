/**
 * Muchos festivales y ayuntamientos no publican ningún email y solo se les puede escribir por un formulario de su web
 * (Pirata, Sónar, Rototom…). Ese formulario se guarda en las notas del lead como «Formulario de contacto: <url>»
 * (lo escribe el enriquecimiento con la página donde lo leyó); aquí se reconoce para poder enseñarlo como botón.
 */
export const MARCA_FORMULARIO = 'Formulario de contacto:';

interface LeadConNotas {
  notas?: string | null;
}

/** La url del formulario de contacto guardada en las notas del lead, o null. Solo http(s). */
export function formularioDeContacto(lead: LeadConNotas): string | null {
  const notas = lead.notas ?? '';
  const i = notas.indexOf(MARCA_FORMULARIO);
  if (i < 0) return null;
  const resto = notas.slice(i + MARCA_FORMULARIO.length).trim();
  const url = resto.match(/^https?:\/\/\S+/i)?.[0]?.replace(/[.,;)|]+$/, '');
  return url ?? null;
}

export type ViaDeContacto = 'email' | 'formulario' | 'instagram' | 'telefono' | 'ninguna';

/** Por dónde se puede contactar hoy con el lead, en orden de preferencia. */
export function viaDeContacto(lead: LeadConNotas & { email_contacto?: string | null; instagram?: string | null; telefono?: string | null }): ViaDeContacto {
  if (lead.email_contacto?.trim()) return 'email';
  if (formularioDeContacto(lead)) return 'formulario';
  if (lead.instagram?.trim()) return 'instagram';
  if (lead.telefono?.trim()) return 'telefono';
  return 'ninguna';
}
