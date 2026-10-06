/**
 * Helper para notificaciones push nativas del navegador y dispositivos móviles (PWA)
 */

export async function triggerNativeMobileNotification(
  title: string,
  options?: { body?: string; icon?: string; tag?: string }
): Promise<{ success: boolean; status: string }> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { success: false, status: 'Notificaciones nativas no soportadas en este navegador' };
  }

  try {
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      return { success: false, status: 'Permiso de notificaciones denegado en el dispositivo' };
    }

    const icon = options?.icon || '/icon-192.png';
    const body = options?.body || 'Notificación de BandManager.io';
    const tag = options?.tag || `notification-${Date.now()}`;

    // Intentar vía Service Worker primero (ideal para PWA en móviles)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, {
            body,
            icon,
            badge: '/icon-192.png',
            tag,
            vibrate: [200, 100, 200]
          } as any);
          return { success: true, status: 'Notificación enviada al móvil / PWA' };
        }
      } catch (swErr) {
        console.warn('Fallback a Notification nativa sin Service Worker:', swErr);
      }
    }

    // Fallback con la API de Notification directa
    new Notification(title, {
      body,
      icon,
      tag
    });

    return { success: true, status: 'Notificación de sistema mostrada' };
  } catch (err: any) {
    console.error('Error al lanzar notificación nativa:', err);
    return { success: false, status: err?.message || 'Error al lanzar notificación' };
  }
}
