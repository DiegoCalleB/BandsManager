import {
  BrowserNotificationConfig,
  DEFAULT_NOTIFICATION_CONFIG,
  NotificationCategory,
  NotificationHistoryItem,
  NotificationPermissionStatus,
} from '../types/browserNotifications';

const CONFIG_STORAGE_KEY = 'bandmanager_notification_config_v1';
const HISTORY_STORAGE_KEY = 'bandmanager_notification_history_v1';
const MAX_HISTORY_ITEMS = 40;

/**
 * Check if the current browser environment supports the Web Notification API
 */
export function isBrowserNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get the current permission status for browser notifications
 */
export function getBrowserNotificationPermission(): NotificationPermissionStatus {
  if (!isBrowserNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionStatus;
}

/**
 * Request notification permission from the user
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!isBrowserNotificationSupported()) {
    return 'unsupported';
  }
  try {
    const result = await Notification.requestPermission();
    return result as NotificationPermissionStatus;
  } catch (err) {
    console.warn('[BrowserNotifications] Error solicitando permiso de notificación:', err);
    return Notification.permission as NotificationPermissionStatus;
  }
}

/**
 * Load user notification preferences from localStorage
 */
export function loadNotificationConfig(): BrowserNotificationConfig {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_CONFIG;
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      enabled: parsed.enabled ?? true,
      soundEnabled: parsed.soundEnabled ?? true,
      events: {
        leadStatusChanged: parsed.events?.leadStatusChanged ?? true,
        leadNewMessage: parsed.events?.leadNewMessage ?? true,
        agentPendingApproval: parsed.events?.agentPendingApproval ?? true,
        concertConfirmed: parsed.events?.concertConfirmed ?? true,
        leadDiscovered: parsed.events?.leadDiscovered ?? true,
      },
    };
  } catch (e) {
    return DEFAULT_NOTIFICATION_CONFIG;
  }
}

/**
 * Save user notification preferences to localStorage
 */
export function saveNotificationConfig(config: BrowserNotificationConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('notification-config-updated', { detail: config }));
  } catch (e) {
    console.warn('[BrowserNotifications] Error guardando config:', e);
  }
}

/**
 * Load notification history from localStorage
 */
export function loadNotificationHistory(): NotificationHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

/**
 * Save notification history to localStorage
 */
export function saveNotificationHistory(history: NotificationHistoryItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = history.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new CustomEvent('notification-history-updated', { detail: trimmed }));
  } catch (e) {
    console.warn('[BrowserNotifications] Error guardando historial:', e);
  }
}

/**
 * Add an entry to the local notification history
 */
export function addNotificationToHistory(item: Omit<NotificationHistoryItem, 'id' | 'timestamp' | 'read'>): NotificationHistoryItem {
  const fullItem: NotificationHistoryItem = {
    ...item,
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    read: false,
  };
  const history = loadNotificationHistory();
  const updated = [fullItem, ...history.filter((h) => h.id !== fullItem.id)].slice(0, MAX_HISTORY_ITEMS);
  saveNotificationHistory(updated);
  return fullItem;
}

/**
 * Synthesize a clean, subtle audio chime using Web Audio API
 */
export function playNotificationChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Smooth dual tone (chime)
    const now = ctx.currentTime;

    // Note 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // Slide to A5

    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.exponentialRampToValueAtTime(0.12, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // Note 2: harmonic subtle overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1174.66, now + 0.05); // D6

    gain2.gain.setValueAtTime(0.0001, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.06, now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.36);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.41);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 500);
  } catch (err) {
    // Audio context may be restricted by autoplay policy until user gesture
  }
}

export interface SendPushNotificationOptions {
  category: NotificationCategory;
  body: string;
  leadId?: string;
  leadName?: string;
  tag?: string;
  onClick?: () => void;
  skipSound?: boolean;
}

/**
 * Core function to send a browser push notification respecting user permissions and event preferences
 */
export function sendBrowserPushNotification(title: string, options: SendPushNotificationOptions): boolean {
  const config = loadNotificationConfig();

  // 1. Check if master toggle is enabled
  if (!config.enabled) {
    return false;
  }

  // 2. Check if this specific event category is enabled in config
  if (options.category === 'lead_status' && !config.events.leadStatusChanged) return false;
  if (options.category === 'new_message' && !config.events.leadNewMessage) return false;
  if (options.category === 'agent_approval' && !config.events.agentPendingApproval) return false;
  if (options.category === 'concert_confirmed' && !config.events.concertConfirmed) return false;
  if (options.category === 'lead_discovered' && !config.events.leadDiscovered) return false;

  // 3. Record in local notification history
  addNotificationToHistory({
    category: options.category,
    title,
    body: options.body,
    leadId: options.leadId,
    leadName: options.leadName,
  });

  // 4. Play audio chime if sound is enabled
  if (config.soundEnabled && !options.skipSound) {
    playNotificationChime();
  }

  // 5. If browser notification is not supported or permission is not granted, skip native popup
  if (!isBrowserNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notification = new Notification(title, {
      body: options.body,
      icon: '/logo_bandmanager_symbol.png',
      badge: '/logo_bandmanager_symbol.png',
      tag: options.tag || `bandmanager-${options.category}-${Date.now()}`,
      data: {
        leadId: options.leadId,
        category: options.category,
        url: window.location.href,
      },
    });

    notification.onclick = () => {
      try {
        window.focus();
      } catch (_) {}
      if (options.onClick) {
        options.onClick();
      }
      notification.close();
    };

    return true;
  } catch (err) {
    console.warn('[BrowserNotifications] Fallo al crear la notificación nativa:', err);
    return false;
  }
}

/**
 * Dispatch helper when a lead changes status
 */
export function notifyLeadStatusChange(
  leadName: string,
  newStatus: string,
  oldStatus?: string,
  leadId?: string,
  onClick?: () => void
): void {
  const statusLabels: Record<string, string> = {
    nuevo: 'Nuevo lead registrado',
    contactado: 'Email inicial enviado',
    esperando_respuesta: 'Esperando respuesta',
    respondido: '¡La sala ha respondido!',
    negociando: 'Negociación abierta',
    confirmado: '🎉 ¡Concierto Confirmado!',
    aplazado: 'Aplazado',
    no_interesado: 'Descartado por la sala',
    pendiente_aprobacion: '🤖 Propuesta lista para revisar',
    aprobado_propuesta: 'Propuesta aprobada para envío',
    aprobado_respuesta: 'Respuesta aprobada para envío',
  };

  const label = statusLabels[newStatus] || newStatus;

  if (newStatus === 'confirmado') {
    sendBrowserPushNotification(`🎉 ¡Bolo Confirmado en ${leadName}!`, {
      category: 'concert_confirmed',
      body: `El concierto en ${leadName} ha pasado a estado Confirmado. ¡Añádelo a la logística de gira!`,
      leadId,
      leadName,
      onClick,
    });
  } else if (newStatus === 'respondido') {
    sendBrowserPushNotification(`📩 ¡Respuesta recibida de ${leadName}!`, {
      category: 'lead_status',
      body: `La sala ha respondido a tu propuesta. Revisa la conversación en el CRM.`,
      leadId,
      leadName,
      onClick,
    });
  } else if (newStatus === 'pendiente_aprobacion') {
    sendBrowserPushNotification(`🤖 Propuesta lista para revisión: ${leadName}`, {
      category: 'agent_approval',
      body: `El agente Redactor ha preparado un borrador para ${leadName}. Requiere tu aprobación para el envío.`,
      leadId,
      leadName,
      onClick,
    });
  } else {
    sendBrowserPushNotification(`🔄 Estado de ${leadName}: ${label}`, {
      category: 'lead_status',
      body: `El estado del lead ${leadName} ha cambiado a "${label}".`,
      leadId,
      leadName,
      onClick,
    });
  }
}

/**
 * Dispatch helper when a new message is received from a lead
 */
export function notifyNewLeadMessage(leadName: string, messagePreview: string, leadId?: string, onClick?: () => void): void {
  const cleanSnippet = messagePreview.length > 120 ? `${messagePreview.substring(0, 117)}...` : messagePreview;
  sendBrowserPushNotification(`💬 Nuevo mensaje de ${leadName}`, {
    category: 'new_message',
    body: cleanSnippet || 'Has recibido un nuevo mensaje o respuesta en la plataforma.',
    leadId,
    leadName,
    onClick,
  });
}

/**
 * Send a quick test notification to verify setup
 */
export function sendTestBrowserNotification(): boolean {
  return sendBrowserPushNotification('🔔 Notificaciones de BandManager.io activadas', {
    category: 'system',
    body: '¡Todo listo! Recibirás avisos en tiempo real cuando tus salas respondan o cambien de estado.',
  });
}
