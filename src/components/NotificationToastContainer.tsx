import React from 'react';
import { ToastNotification } from '../hooks/useNotificationSystem';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

interface NotificationToastContainerProps {
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const NotificationToastContainer: React.FC<NotificationToastContainerProps> = ({ notifications, onDismiss }) => {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map((toast) => {
        let bg = 'bg-[var(--surface)] text-[var(--ink)]';
        let icon = <Info className="w-5 h-5 text-[var(--acc)] shrink-0" />;

        if (toast.type === 'success') {
          bg = 'bg-[var(--ok-soft)]/40 text-[var(--ink)]';
          icon = <CheckCircle2 className="w-5 h-5 text-[var(--ok)] shrink-0" />;
        } else if (toast.type === 'error') {
          bg = 'bg-[var(--alert-soft)]/40 text-[var(--ink)]';
          icon = <AlertCircle className="w-5 h-5 text-[var(--alert)] shrink-0" />;
        } else if (toast.type === 'warning') {
          bg = 'bg-[var(--acc-soft)]/40 text-[var(--ink)]';
          icon = <AlertTriangle className="w-5 h-5 text-[var(--acc)] shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-[var(--r-l)] transition-all duration-300 transform translate-y-0 animate-in fade-in slide-in-from-bottom-2 ${bg}`}
          >
            {icon}
            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-xs font-semibold leading-tight">{toast.title}</h4>
              {toast.message && <p className="text-[11px] opacity-80 mt-0.5 line-clamp-2">{toast.message}</p>}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 hover:bg-[var(--ink)]/10 rounded-[var(--r-s)] transition-colors text-[var(--ink)]/60 hover:text-[var(--ink)] shrink-0"
              aria-label="Cerrar notificación"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
