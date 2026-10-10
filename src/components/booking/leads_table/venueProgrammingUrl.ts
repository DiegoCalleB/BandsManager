import type { Lead } from "../../../types";

/**
 * URL de la programación de la sala: su web o, si no tiene, una búsqueda de su cartelera.
 * @param lead Lead de la sala.
 * @returns URL absoluta.
 */
export function venueProgrammingUrl(lead: Lead): string {
  if (lead.website && lead.website.trim().length > 0) {
    let url = lead.website.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) url = "https://" + url;
    return url;
  }
  const query = `${lead.nombre_sala} ${lead.ciudad || ""} programacion cartelera conciertos`.trim();
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}
