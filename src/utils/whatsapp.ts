/**
 * WhatsApp integration utilities for BandManager.io
 * 
 * Reutiliza una única sesión y pestaña de WhatsApp Web ('whatsapp_web')
 * para evitar colisiones ("WhatsApp Web está abierto en otra ventana")
 * y prevenir la apertura descontrolada de pestañas duplicadas.
 */

export const WHATSAPP_WINDOW_NAME = 'whatsapp_web';

/**
 * Detecta si el usuario está navegando desde un dispositivo móvil o tablet.
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Normaliza un número telefónico para WhatsApp.
 * Si es un número español (9 dígitos empezando por 6 o 7), añade el prefijo internacional 34.
 * Elimina caracteres no numéricos y maneja prefijos '00' o '+'.
 */
export function normalizeWhatsAppPhone(phone?: string | null): string {
  if (!phone) return '';
  let clean = phone.replace(/[^0-9]/g, '');
  if (!clean) return '';

  // Si tiene prefijo 00 (ej: 0034...), lo removemos
  if (clean.startsWith('00')) {
    clean = clean.substring(2);
  }

  // Si es un número móvil español de 9 dígitos (empieza por 6 o 7), añadir prefijo 34
  if (clean.length === 9 && (clean.startsWith('6') || clean.startsWith('7'))) {
    clean = `34${clean}`;
  }

  return clean;
}

/**
 * Genera la URL óptima para WhatsApp:
 * - En Desktop: https://web.whatsapp.com/send?phone=... para reutilizar la sesión activa directamente
 * - En Mobile: https://api.whatsapp.com/send?phone=... para invocar la app nativa de WhatsApp
 */
export function getWhatsAppUrl(phone?: string | null, text?: string): string {
  const normalized = normalizeWhatsAppPhone(phone);
  const textQuery = text ? `&text=${encodeURIComponent(text)}` : '';
  const textOnlyQuery = text ? `?text=${encodeURIComponent(text)}` : '';

  if (isMobileDevice()) {
    return normalized
      ? `https://api.whatsapp.com/send?phone=${normalized}${textQuery}`
      : `https://api.whatsapp.com/send${textOnlyQuery}`;
  }

  // En entorno Desktop apuntamos a WhatsApp Web directamente
  return normalized
    ? `https://web.whatsapp.com/send?phone=${normalized}${textQuery}`
    : `https://web.whatsapp.com/send${textOnlyQuery}`;
}

/**
 * Abre la conversación de WhatsApp reutilizando la misma ventana/pestaña ('whatsapp_web').
 * Evita abrir una nueva pestaña cada vez y previene que WhatsApp Web solicite "Usar aquí".
 */
export function openWhatsAppChat(phone?: string | null, text?: string): void {
  if (typeof window === 'undefined') return;
  const url = getWhatsAppUrl(phone, text);

  // En móvil abrimos en ventana nueva o app; en desktop reutilizamos la ventana con nombre
  const target = isMobileDevice() ? '_blank' : WHATSAPP_WINDOW_NAME;

  try {
    const win = window.open(url, target);
    if (win && !win.closed) {
      win.focus();
    }
  } catch (err) {
    console.warn('[WhatsApp] No se pudo enfocar la pestaña existente de WhatsApp:', err);
    // Fallback estándar
    window.location.href = url;
  }
}
