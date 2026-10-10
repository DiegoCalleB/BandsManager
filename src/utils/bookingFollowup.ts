import { Lead } from '../types';

/**
 * Determina si un lead requiere un recordatorio de seguimiento ("The Gentle Nudge").
 * Se activa para leads en estado 'esperando_respuesta', 'contactado' o 'enviado'
 * que lleven 7 o más días sin recibir respuesta de la sala.
 */
export function isLeadNeedsFollowup(lead: Lead): boolean {
  const norm = (lead.estado || '').toLowerCase();
  const isWaiting = norm === 'esperando_respuesta' || norm === 'contactado' || norm === 'enviado';
  if (!isWaiting) return false;

  // Si la sala ya ha respondido, no es un seguimiento frío
  if (lead.ultimo_mensaje_recibido && lead.ultimo_mensaje_recibido.trim().length > 0) {
    return false;
  }

  // Días transcurridos desde el envío o último contacto
  const days = getDaysSinceContact(lead);
  return days >= 7;
}

/**
 * Devuelve el número de días transcurridos desde el último contacto con el lead.
 */
export function getDaysSinceContact(lead: Lead): number {
  const dateStr = lead.fecha_envio || (lead as any).updated_at || (lead as any).created_at;
  if (!dateStr) return 8; // Si está en espera pero sin fecha explícita, se asume pendiente
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 8;
  const diffMs = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Genera una plantilla de seguimiento ultra-concisa (<50 palabras),
 * educada, cercana y profesional (The Gentle Nudge).
 */
export function generateFollowupTemplate(lead: Lead, bandName: string = 'la banda'): string {
  const contactName = lead.contacto_nombre ? ` ${lead.contacto_nombre.trim()}` : '';
  const venue = lead.nombre_sala;
  return `Hola${contactName},\n\nTe escribí la semana pasada para consultar vuestra disponibilidad para la gira de ${bandName} en ${venue}.\n\nSeguimos cerrando fechas de la ruta por la zona y nos encantaría saber si tenéis algún hueco para incluir vuestra sala en la gira.\n\n¿Te viene bien que lo revisemos?\n\n¡Un abrazo!\nEquipo ${bandName}`;
}
