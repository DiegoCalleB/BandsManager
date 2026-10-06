import { useState, useEffect, useRef, useCallback } from 'react';
import { Lead, Message } from '../types';
import {
  BrowserNotificationConfig,
  NotificationHistoryItem,
  NotificationPermissionStatus,
  DEFAULT_NOTIFICATION_CONFIG,
} from '../types/browserNotifications';
import {
  getBrowserNotificationPermission,
  isBrowserNotificationSupported,
  loadNotificationConfig,
  loadNotificationHistory,
  notifyLeadStatusChange,
  notifyNewLeadMessage,
  playNotificationChime,
  requestBrowserNotificationPermission,
  saveNotificationConfig,
  saveNotificationHistory,
  sendBrowserPushNotification,
  sendTestBrowserNotification,
} from '../services/browserNotificationService';

interface UseBrowserPushNotificationsProps {
  leads?: Lead[];
  messages?: Message[];
  onSelectLead?: (leadId: string) => void;
  isLoggedIn?: boolean;
}

/** Permiso, configuración e historial de las notificaciones push del navegador. */
export function useBrowserPushNotifications({
  leads = [],
  messages = [],
  onSelectLead,
  isLoggedIn = true,
}: UseBrowserPushNotificationsProps = {}) {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [permission, setPermission] = useState<NotificationPermissionStatus>('default');
  const [config, setConfig] = useState<BrowserNotificationConfig>(DEFAULT_NOTIFICATION_CONFIG);
  const [history, setHistory] = useState<NotificationHistoryItem[]>([]);

  // Previous snapshots to detect delta changes
  const prevLeadsMapRef = useRef<Map<string, { estado: string; ultimo_mensaje?: string; fecha_actualizacion?: string }>>(new Map());
  const prevMessagesCountRef = useRef<number>(0);
  const isInitialLeadsLoadRef = useRef<boolean>(true);
  const isInitialMessagesLoadRef = useRef<boolean>(true);

  // Initialize state on mount
  useEffect(() => {
    setIsSupported(isBrowserNotificationSupported());
    setPermission(getBrowserNotificationPermission());
    setConfig(loadNotificationConfig());
    setHistory(loadNotificationHistory());

    const handleConfigUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<BrowserNotificationConfig>;
      if (customEvent.detail) {
        setConfig(customEvent.detail);
      }
    };

    const handleHistoryUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<NotificationHistoryItem[]>;
      if (customEvent.detail) {
        setHistory(customEvent.detail);
      }
    };

    window.addEventListener('notification-config-updated', handleConfigUpdate);
    window.addEventListener('notification-history-updated', handleHistoryUpdate);

    return () => {
      window.removeEventListener('notification-config-updated', handleConfigUpdate);
      window.removeEventListener('notification-history-updated', handleHistoryUpdate);
    };
  }, []);

  // Request browser permission
  const requestPermission = useCallback(async (): Promise<NotificationPermissionStatus> => {
    const newPermission = await requestBrowserNotificationPermission();
    setPermission(newPermission);
    if (newPermission === 'granted') {
      sendTestBrowserNotification();
    }
    return newPermission;
  }, []);

  // Update notification settings
  const updateConfig = useCallback((newConfig: Partial<BrowserNotificationConfig>) => {
    setConfig((prev) => {
      const merged: BrowserNotificationConfig = {
        ...prev,
        ...newConfig,
        events: {
          ...prev.events,
          ...(newConfig.events || {}),
        },
      };
      saveNotificationConfig(merged);
      return merged;
    });
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setHistory((prev) => {
      const updated = prev.map((item) => ({ ...item, read: true }));
      saveNotificationHistory(updated);
      return updated;
    });
  }, []);

  // Mark single notification as read
  const markAsRead = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, read: true } : item));
      saveNotificationHistory(updated);
      return updated;
    });
  }, []);

  // Clear all history
  const clearHistory = useCallback(() => {
    setHistory([]);
    saveNotificationHistory([]);
  }, []);

  // Trigger test notification
  const triggerTest = useCallback(() => {
    sendTestBrowserNotification();
  }, []);

  // Test sound only
  const triggerTestSound = useCallback(() => {
    playNotificationChime();
  }, []);

  // Watch for lead status transitions & new incoming messages on leads
  useEffect(() => {
    if (!isLoggedIn || leads.length === 0) {
      if (leads.length === 0) {
        prevLeadsMapRef.current.clear();
        isInitialLeadsLoadRef.current = true;
      }
      return;
    }

    // On initial load, just populate the reference map without firing notifications
    if (isInitialLeadsLoadRef.current) {
      const initialMap = new Map<string, { estado: string; ultimo_mensaje?: string; fecha_actualizacion?: string }>();
      leads.forEach((lead) => {
        if (lead && lead.id) {
          initialMap.set(lead.id, {
            estado: lead.estado || 'nuevo',
            ultimo_mensaje: (lead as any).ultimo_mensaje_recibido || (lead as any).ultimo_contacto,
            fecha_actualizacion: (lead as any).fecha_actualizacion,
          });
        }
      });
      prevLeadsMapRef.current = initialMap;
      isInitialLeadsLoadRef.current = false;
      return;
    }

    const currentMap = new Map<string, { estado: string; ultimo_mensaje?: string; fecha_actualizacion?: string }>();
    const prevMap = prevLeadsMapRef.current;

    leads.forEach((lead) => {
      if (!lead || !lead.id) return;
      const leadId = lead.id;
      const currentStatus = lead.estado || 'nuevo';
      const currentMsg = (lead as any).ultimo_mensaje_recibido || (lead as any).ultimo_contacto;
      const leadName = lead.nombre_sala || 'Sala sin nombre';

      currentMap.set(leadId, {
        estado: currentStatus,
        ultimo_mensaje: currentMsg,
        fecha_actualizacion: (lead as any).fecha_actualizacion,
      });

      const prevData = prevMap.get(leadId);

      if (!prevData) {
        // New lead discovered / added
        if (config.enabled && config.events.leadDiscovered) {
          sendBrowserPushNotification(`📍 Nueva sala añadida: ${leadName}`, {
            category: 'lead_discovered',
            body: `${leadName} en ${lead.ciudad || 'la zona'} se ha incorporado al radar de booking.`,
            leadId,
            leadName,
            onClick: () => onSelectLead?.(leadId),
          });
        }
      } else {
        // Check if lead status has changed
        if (prevData.estado !== currentStatus) {
          notifyLeadStatusChange(leadName, currentStatus, prevData.estado, leadId, () => onSelectLead?.(leadId));
        }

        // Check if a new message was received on this lead
        if (currentMsg && currentMsg !== prevData.ultimo_mensaje && currentStatus === 'respondido') {
          notifyNewLeadMessage(leadName, String(currentMsg), leadId, () => onSelectLead?.(leadId));
        }
      }
    });

    prevLeadsMapRef.current = currentMap;
  }, [leads, isLoggedIn, config, onSelectLead]);

  // Watch for new general messages in platform
  useEffect(() => {
    if (!isLoggedIn || messages.length === 0) {
      if (messages.length === 0) {
        prevMessagesCountRef.current = 0;
        isInitialMessagesLoadRef.current = true;
      }
      return;
    }

    if (isInitialMessagesLoadRef.current) {
      prevMessagesCountRef.current = messages.length;
      isInitialMessagesLoadRef.current = false;
      return;
    }

    if (messages.length > prevMessagesCountRef.current) {
      const newMessages = messages.slice(prevMessagesCountRef.current);
      newMessages.forEach((msg) => {
        if (msg && !msg.leido) {
          sendBrowserPushNotification(`💬 Mensaje de ${msg.remitente || 'Contacto'}`, {
            category: 'new_message',
            body: msg.mensaje || 'Has recibido un nuevo mensaje en la plataforma.',
          });
        }
      });
    }

    prevMessagesCountRef.current = messages.length;
  }, [messages, isLoggedIn, config]);

  const unreadCount = history.filter((h) => !h.read).length;

  return {
    isSupported,
    permission,
    config,
    history,
    unreadCount,
    requestPermission,
    updateConfig,
    markAllAsRead,
    markAsRead,
    clearHistory,
    triggerTest,
    triggerTestSound,
  };
}
