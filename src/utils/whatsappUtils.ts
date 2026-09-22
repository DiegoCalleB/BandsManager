/**
 * Utilidades para integración de WhatsApp (wa.me)
 * Permite abrir chats directamente desde WhatsApp Web o la App Móvil
 * con el mensaje pre-redactado por los agentes de IA de BandManager.io.
 */

import { Lead } from '../types';

/**
 * Limpia y normaliza un número telefónico para la API wa.me
 * Si es un número español (9 dígitos empezando por 6, 7, 8 o 9), añade el prefijo 34.
 */
export function cleanPhoneForWhatsApp(phone?: string | null): string {
  if (!phone) return '';
  
  // Eliminar espacios, guiones, puntos, paréntesis y otros caracteres
  let cleaned = phone.replace(/[^\d+]/g, '').trim();

  // Si empieza por 00, reemplazar por nada o +
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Si es un número español estándar de 9 dígitos
  if (/^[6789]\d{8}$/.test(cleaned)) {
    return `34${cleaned}`;
  }

  // Si ya tiene el prefijo 34 español
  if (/^34[6789]\d{8}$/.test(cleaned)) {
    return cleaned;
  }

  // Devolver el número limpio con al menos 7 dígitos internacionales
  return cleaned.length >= 7 ? cleaned : '';
}

/**
 * Comprueba si el teléfono es presumiblemente un móvil (WhatsApp disponible)
 * En España: 6XX o 7XX (o con prefijo 34 6XX / 34 7XX)
 */
export function isLikelyMobile(phone?: string | null): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  
  if (/^[67]\d{8}$/.test(digits)) return true;
  if (/^34[67]\d{8}$/.test(digits)) return true;
  
  // Para números internacionales desconocidos, asumimos posible móvil si tiene longitud válida
  return digits.length >= 9;
}

/**
 * Comprueba si el teléfono es un fijo (generalmente sin WhatsApp salvo WhatsApp Business fijo)
 * En España: 9XX o 8XX (o con prefijo 34 9XX / 34 8XX)
 */
export function isLikelyLandline(phone?: string | null): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  
  if (/^[89]\d{8}$/.test(digits)) return true;
  if (/^34[89]\d{8}$/.test(digits)) return true;
  
  return false;
}

/**
 * Genera el enlace oficial de wa.me con el texto URL encoded
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = cleanPhoneForWhatsApp(phone);
  if (!cleanPhone) return '';
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message.trim())}`;
}

/**
 * Adapta el pitch de email o redacta un mensaje ágil y directo optimizado para WhatsApp
 * (Reglas anti-fluff, sin parrafadas corporativas, con salto de línea limpio y llamada a la acción)
 */
export function formatLeadPitchForWhatsApp(
  lead: Partial<Lead>,
  bandName = 'la banda',
  detectedDates?: string[],
  epkUrl?: string
): string {
  const contactName = lead.contacto_nombre?.trim();
  const venueName = lead.nombre_sala?.trim() || 'la sala';
  
  // Saludo cercano y directo (en minúsculas o informal como manda el protocolo B2B de booking en salas)
  let greeting = `¡Hola${contactName ? ` ${contactName}` : ''}! 👋`;

  let datesFragment = '';
  if (detectedDates && detectedDates.length > 0) {
    const formattedDates = detectedDates.slice(0, 2).join(' o ');
    datesFragment = ` Estudiando vuestra programación, nos encajaría especialmente tantear fechas libres como ${formattedDates}.`;
  }

  // Si ya hay un pitch generado por el Redactor IA, sintetizamos sus párrafos clave
  if (lead.pitch_generado && lead.pitch_generado.trim().length > 20) {
    // Si el pitch generado ya viene sin asunto, limpiamos "Asunto: ..." o encabezados formales
    let cleanPitch = lead.pitch_generado
      .replace(/^asunto:[^\n]+\n+/i, '')
      .replace(/^(estimad[oa]s?|hola|muy buenas)[^\n]*\n+/i, '')
      .replace(/un cordial saludo[\s\S]*$/i, '')
      .replace(/atentamente[\s\S]*$/i, '')
      .trim();

    // Si tiene más de 350 caracteres, recortamos a los 2 primeros párrafos para no saturar WhatsApp
    const paragraphs = cleanPitch.split(/\n\s*\n/).filter(Boolean);
    if (paragraphs.length > 2) {
      cleanPitch = paragraphs.slice(0, 2).join('\n\n');
    }

    const dossierLink = epkUrl ? `\n\nAquí puedes escuchar el directo y dossier en 1 minuto:\n${epkUrl}` : '';

    return `${greeting}

${cleanPitch}${datesFragment}${dossierLink}

¿Con quién podríamos coordinar para revisar hueco de programación esta temporada? ¡Muchas gracias!`;
  }

  // Mensaje base predeterminado de alta conversión para WhatsApp
  const linkText = epkUrl ? `\n\nOs dejo enlace al dossier y vídeos en directo:\n${epkUrl}` : '';
  
  return `${greeting}

Os escribo de parte de ${bandName}. Seguimos muy de cerca la cartelera y el directo que cuidáis en ${venueName}.${datesFragment}${linkText}

¿Tendríais un momento para ver disponibilidad de fechas para los próximos meses? ¡Un abrazo grande!`;
}

/**
 * Copia texto al portapapeles de forma segura
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (err) {
    console.error('Error al copiar al portapapeles:', err);
    return false;
  }
}
