import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Settings,
  CheckCheck,
  Trash2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  PartyPopper,
  Radio,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { NotificationHistoryItem, NotificationPermissionStatus, BrowserNotificationConfig } from '../../types/browserNotifications';
import { ShowIcon } from '../ui/ShowIcon';
import { IconButton, LinkButton } from '../ui';

interface NotificationCenterBellProps {
  permission: NotificationPermissionStatus;
  config: BrowserNotificationConfig;
  history: NotificationHistoryItem[];
  unreadCount: number;
  onOpenSettings: () => void;
  onRequestPermission: () => Promise<NotificationPermissionStatus>;
  onMarkAllAsRead: () => void;
  onMarkAsRead: (id: string) => void;
  onClearHistory: () => void;
  onSelectLead?: (leadId: string) => void;
  variant?: 'desktop' | 'mobile';
}

export const NotificationCenterBell: React.FC<NotificationCenterBellProps> = ({
  permission,
  config,
  history,
  unreadCount,
  onOpenSettings,
  onRequestPermission,
  onMarkAllAsRead,
  onMarkAsRead,
  onClearHistory,
  onSelectLead,
  variant = 'desktop',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatRelativeTime = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Ahora mismo';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return `Hace ${Math.floor(diff / 86400)} d`;
  };

  const renderCategoryIcon = (category: string) => {
    switch (category) {
      case 'new_message':
        return <MessageSquare className="w-3.5 h-3.5 text-[var(--acc)]" />;
      case 'agent_approval':
        return <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]" />;
      case 'concert_confirmed':
        return <PartyPopper className="w-3.5 h-3.5 text-[var(--acc)]" />;
      case 'lead_discovered':
        return <Radio className="w-3.5 h-3.5 text-[var(--acc)]" />;
      case 'lead_status':
        return <RefreshCw className="w-3.5 h-3.5 text-[var(--ok)]" />;
      default:
        return <Info className="w-3.5 h-3.5 text-[var(--ink-2)]" />;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen && unreadCount > 0) {
            // keep unread until user chooses or marks read
          }
        }}
        className={`relative p-2 rounded-[var(--r-pill)] transition-ui cursor-pointer flex items-center justify-center ${
          isOpen
            ? 'bg-[var(--acc)]/20 text-[var(--acc-ink)] shadow-xs'
            : 'text-[var(--ink-2)] hover:text-[var(--ink-2)] hover:bg-[var(--surface)]/80'
        }`}
        title="Centro de notificaciones push"
        aria-label="Notificaciones"
      >
        <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />

        {/* Unread badge count */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-[var(--r-pill)] bg-[var(--acc)] text-micro font-bold font-mono text-[var(--on-acc)]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}

        {/* Small dot indicating status if no unread messages */}
        {unreadCount === 0 && permission === 'granted' && config.enabled && (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-[var(--r-pill)] bg-[var(--ok)] shadow-xs" />
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className={`absolute ${
            variant === 'mobile' ? 'right-0 top-12 w-[300px] sm:w-[360px]' : 'right-0 md:left-0 top-12 w-[320px] sm:w-[380px]'
          } z-50 bg-[var(--surface)] rounded-[var(--r-l)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 bg-[var(--acc)]/10`}
        >
          {/* Header */}
          <div className="p-3.5 border-b border-[var(--hair)] bg-[var(--acc)]/30  flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-[var(--acc)]" />
              <span className="font-bold text-xs text-[var(--ink-2)] font-display">Notificaciones</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-[var(--r-pill)] bg-[var(--acc)]/20 text-micro font-mono text-[var(--acc-ink)] font-bold">
                  {unreadCount} nuevas
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllAsRead}
                  className="text-micro font-mono text-[var(--acc)] hover:text-[var(--acc)] flex items-center gap-1 px-2 py-1 rounded-[var(--r-pill)] hover:bg-[var(--acc)]/10 transition-colors cursor-pointer"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>Leídas</span>
                </button>
              )}
              <IconButton
                label="Configuración de notificaciones"
                size="icon-xs"
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings();
                }}
              >
                <Settings className="w-3.5 h-3.5" />
              </IconButton>
            </div>
          </div>

          {/* Permission Prompt Banner if needed */}
          {permission !== 'granted' && (
            <div className="p-2.5 bg-[var(--acc)]/40 border-b border-[var(--hair)] flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-[var(--acc)] min-w-0">
                <AlertTriangle className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
                <span className="text-xs truncate">
                  {permission === 'denied' ? 'Avisos bloqueados en el navegador' : 'Activa avisos en escritorio'}
                </span>
              </div>
              {permission !== 'denied' ? (
                <button
                  type="button"
                  onClick={onRequestPermission}
                  className="px-2 py-0.5 rounded bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] font-bold text-micro shrink-0 cursor-pointer shadow-xs"
                >
                  Activar
                </button>
              ) : (
                <LinkButton
                  size="xs"
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenSettings();
                  }}
                  className="shrink-0"
                >
                  Ver ayuda
                </LinkButton>
              )}
            </div>
          )}

          {/* List of Notifications */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[var(--hair)]/60">
            {history.length > 0 ? (
              history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (!item.read) onMarkAsRead(item.id);
                    if (item.leadId && onSelectLead) {
                      onSelectLead(item.leadId);
                      setIsOpen(false);
                    }
                  }}
                  className={`p-3 transition-colors cursor-pointer flex items-start gap-2.5 ${
                    item.read ? 'bg-transparent hover:bg-[var(--surface)]/60 opacity-80' : 'bg-[var(--acc)]/5 hover:bg-[var(--acc)]/10'
                  }`}
                >
                  <div className="w-7 h-7 rounded-[var(--r-m)] bg-[var(--sunken)] flex items-center justify-center shrink-0 mt-0.5">
                    {renderCategoryIcon(item.category)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className={`text-xs truncate ${item.read ? 'text-[var(--ink-2)] font-medium' : 'text-[var(--ink-2)] font-bold'}`}>
                        {item.title}
                      </h4>
                      <span className="text-micro font-mono text-[var(--ink-2)] shrink-0">{formatRelativeTime(item.timestamp)}</span>
                    </div>
                    <p className="text-xs text-[var(--ink-2)] line-clamp-2 leading-tight">{item.body}</p>
                    {item.leadName && (
                      <span className="inline-block text-micro font-mono text-[var(--acc-ink)] font-bold bg-[var(--acc)]/10 px-1.5 py-0.5 rounded mt-1">
                        <ShowIcon inline emoji="📍" />{item.leadName}
                      </span>
                    )}
                  </div>
                  {!item.read && <span className="w-1.5 h-1.5 rounded-[var(--r-pill)] bg-[var(--acc)] shrink-0 mt-2" />}
                </div>
              ))
            ) : (
              <div className="py-8 px-4 text-center space-y-2">
                <Bell className="w-8 h-8 text-[var(--ink-2)] mx-auto stroke-1" />
                <p className="text-xs text-[var(--ink-2)] font-medium">Sin notificaciones recientes</p>
                <p className="text-xs text-[var(--ink-2)] max-w-xs mx-auto">
                  Aquí aparecerán los avisos cuando tus salas cambien de estado o te envíen un mensaje.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-[var(--hair)] bg-[var(--sunken)] flex items-center justify-between text-xs">
            {history.length > 0 ? (
              <button
                type="button"
                onClick={onClearHistory}
                className="text-micro text-[var(--ink-2)] hover:text-[var(--alert)] flex items-center gap-1 transition-colors cursor-pointer px-1.5 py-0.5 rounded hover:bg-[var(--surface)]"
              >
                <Trash2 className="w-3 h-3" />
                <span>Borrar historial</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenSettings();
              }}
              className="text-micro font-bold text-[var(--acc-ink)] hover:text-[var(--acc)] flex items-center gap-1 transition-colors cursor-pointer px-2 py-1 rounded bg-[var(--acc)]/10 hover:bg-[var(--acc)]/20 "
            >
              <Settings className="w-3 h-3" />
              <span>Configurar avisos</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
