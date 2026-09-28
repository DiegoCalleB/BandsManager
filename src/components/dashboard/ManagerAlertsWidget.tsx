import React, { useState, useEffect } from 'react';
import { ManagerAlert, AlertAction } from '../../utils/managerAlerts';
import {
  Sparkles,
  Calendar,
  ArrowRight,
  X,
  AlertCircle,
  CheckCircle2,
  Megaphone,
  Bell,
  ShieldAlert,
  Sliders,
  Check,
  Eye,
  EyeOff,
  Trash2,
  Filter,
  RefreshCw,
  Mail,
  ChevronDown,
  ChevronUp,
  Zap,
  Clock,
  Plus,
  Search,
} from 'lucide-react';

interface ManagerAlertsWidgetProps {
  alerts: ManagerAlert[];
  onExecuteAction: (alert: ManagerAlert, actionOverride?: AlertAction) => void;
  onOpenSettings?: () => void;
  bandId?: string;
  isStitchLight?: boolean;
}

export const ManagerAlertsWidget: React.FC<ManagerAlertsWidgetProps> = ({
  alerts,
  onExecuteAction,
  onOpenSettings,
  bandId = 'band-active',
  isStitchLight = false,
}) => {
  const readStorageKey = `manager_alerts_read_${bandId}`;
  const dismissedStorageKey = `manager_alerts_dismissed_${bandId}`;

  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(readStorageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(dismissedStorageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'urgent' | 'booking' | 'finanzas'>('all');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isCompactView, setIsCompactView] = useState(true); // Default to clean compact view to prevent visual overload

  useEffect(() => {
    try {
      localStorage.setItem(readStorageKey, JSON.stringify(readIds));
    } catch (e) {
      // ignore
    }
  }, [readIds, readStorageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(dismissedStorageKey, JSON.stringify(dismissedIds));
    } catch (e) {
      // ignore
    }
  }, [dismissedIds, dismissedStorageKey]);

  const activeAlerts = alerts.filter((a) => !dismissedIds.includes(a.id));
  const unreadAlerts = activeAlerts.filter((a) => !readIds.includes(a.id));
  const urgentAlerts = activeAlerts.filter((a) => a.severity === 'urgent');

  const filteredAlerts = activeAlerts.filter((a) => {
    if (filterMode === 'unread') return !readIds.includes(a.id);
    if (filterMode === 'urgent') return a.severity === 'urgent';
    if (filterMode === 'booking') return a.category === 'Calendario Industria' || a.category === 'Seguimiento CRM';
    if (filterMode === 'finanzas') return a.category === 'Finanzas & Cobros';
    return true;
  });

  const handleToggleRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setReadIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds((prev) => [...prev, id]);
  };

  const handleMarkAllRead = () => {
    const allIds = activeAlerts.map((a) => a.id);
    setReadIds((prev) => Array.from(new Set([...prev, ...allIds])));
  };

  const handleResetDismissed = () => {
    setDismissedIds([]);
  };

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <div
      id="manager-alerts-container"
      className={`mb-4 rounded-2xl ${
        isStitchLight
          ? 'bg-[var(--surface)] border border-[var(--hair)] shadow-xs text-zinc-900'
          : 'bg-slate-900/80 border border-[var(--hair)]/90 shadow-xl text-slate-100'
      } overflow-hidden transition-all`}
    >
      {/* Panel Header */}
      <div
        className={`px-3.5 py-2.5 ${
          isStitchLight ? 'bg-zinc-50/80 border-b border-[var(--hair)]' : 'bg-slate-950/60 border-b border-[var(--hair)]/80'
        } flex items-center justify-between gap-2`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`p-1.5 rounded-lg ${
              isStitchLight
                ? 'bg-indigo-50 text-indigo-600 border border-[var(--acc)]'
                : 'bg-amber-500/15 text-amber-400 border border-[var(--acc)]/30'
            } relative shrink-0`}
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadAlerts.length > 0 && (
              <span
                className={`absolute -top-0.5 -right-0.5 w-2 h-2 ${isStitchLight ? 'bg-indigo-500' : 'bg-amber-400'} rounded-full animate-pulse`}
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            <h3 className={`text-xs font-bold ${isStitchLight ? 'text-zinc-900' : 'text-slate-100'} tracking-tight`}>Radar del Mánager</h3>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                isStitchLight
                  ? 'bg-indigo-50 text-indigo-700 border border-[var(--acc)]'
                  : 'bg-amber-500/20 text-amber-300 border border-[var(--acc)]/30'
              }`}
            >
              {activeAlerts.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {unreadAlerts.length > 0 && (
            <button
              id="mark-all-read-alerts-btn"
              onClick={handleMarkAllRead}
              className={`px-2 py-1 rounded-lg ${
                isStitchLight ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700' : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
              } text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer`}
              title="Marcar todas como leídas"
            >
              <Check className="w-3 h-3 text-emerald-500" />
              <span className="hidden sm:inline">Leídas</span>
            </button>
          )}

          <button
            id="toggle-expand-alerts-panel-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1 rounded-lg ${
              isStitchLight
                ? 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            } transition-colors cursor-pointer`}
            title={isExpanded ? 'Plegar panel' : 'Desplegar panel'}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Subheader Filter Bar */}
          <div
            className={`px-4 py-2.5 ${
              isStitchLight ? 'bg-zinc-50/40 border-b border-[var(--hair)]' : 'bg-slate-950/30 border-b border-[var(--hair)]/60'
            } flex items-center justify-between gap-2 overflow-x-auto`}
          >
            <div className="flex items-center gap-1.5 text-xs">
              <span className={`${isStitchLight ? 'text-zinc-400' : 'text-slate-500'} font-medium text-[11px] mr-1 hidden sm:inline`}>
                Filtrar:
              </span>

              <button
                id="filter-alerts-all"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all text-xs cursor-pointer ${
                  filterMode === 'all'
                    ? isStitchLight
                      ? 'bg-zinc-200 text-zinc-900 font-semibold'
                      : 'bg-amber-500/20 text-amber-300 border border-[var(--acc)]/30 font-semibold'
                    : isStitchLight
                      ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Todas ({activeAlerts.length})
              </button>

              <button
                id="filter-alerts-unread"
                onClick={() => setFilterMode('unread')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all text-xs flex items-center gap-1 cursor-pointer ${
                  filterMode === 'unread'
                    ? isStitchLight
                      ? 'bg-zinc-200 text-zinc-900 font-semibold'
                      : 'bg-amber-500/20 text-amber-300 border border-[var(--acc)]/30 font-semibold'
                    : isStitchLight
                      ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>Sin Leer</span>
                {unreadAlerts.length > 0 && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
              </button>

              <button
                id="filter-alerts-urgent"
                onClick={() => setFilterMode('urgent')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all text-xs flex items-center gap-1 cursor-pointer ${
                  filterMode === 'urgent'
                    ? isStitchLight
                      ? 'bg-rose-50 text-rose-700 border border-[var(--alert)] font-semibold'
                      : 'bg-red-500/20 text-red-300 border border-[var(--alert)]/30 font-semibold'
                    : isStitchLight
                      ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>Urgentes</span>
                {urgentAlerts.length > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] ${isStitchLight ? 'bg-rose-100 text-rose-800' : 'bg-red-500/30 text-red-300'} font-mono`}
                  >
                    {urgentAlerts.length}
                  </span>
                )}
              </button>

              <button
                id="filter-alerts-booking"
                onClick={() => setFilterMode('booking')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all text-xs cursor-pointer ${
                  filterMode === 'booking'
                    ? isStitchLight
                      ? 'bg-indigo-50 text-indigo-700 border border-[var(--acc)] font-semibold'
                      : 'bg-indigo-500/20 text-indigo-300 border border-[var(--acc)]/30 font-semibold'
                    : isStitchLight
                      ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Booking & CRM
              </button>

              <button
                id="filter-alerts-finanzas"
                onClick={() => setFilterMode('finanzas')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all text-xs cursor-pointer ${
                  filterMode === 'finanzas'
                    ? isStitchLight
                      ? 'bg-emerald-50 text-emerald-700 border border-[var(--ok)] font-semibold'
                      : 'bg-emerald-500/20 text-emerald-300 border border-[var(--ok)]/30 font-semibold'
                    : isStitchLight
                      ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Finanzas
              </button>
            </div>

            {dismissedIds.length > 0 && (
              <button
                id="reset-dismissed-inline-btn"
                onClick={handleResetDismissed}
                className={`text-[11px] ${isStitchLight ? 'text-zinc-500 hover:text-zinc-800' : 'text-slate-500 hover:text-slate-300'} underline font-mono shrink-0 cursor-pointer`}
              >
                Restablecer {dismissedIds.length} descartadas
              </button>
            )}
          </div>

          {/* Alert Cards Grid */}
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredAlerts.length === 0 ? (
              <div
                className={`col-span-full py-8 text-center text-xs ${isStitchLight ? 'text-zinc-400 bg-zinc-50/50 border-[var(--hair)]' : 'text-slate-500 bg-slate-950/20 border-[var(--hair)]/40'} rounded-xl border`}
              >
                No hay alertas que coincidan con el filtro seleccionado.
              </div>
            ) : (
              (isCompactView ? filteredAlerts.slice(0, 2) : filteredAlerts).map((alert) => {
                const isUrgent = alert.severity === 'urgent';
                const isWarning = alert.severity === 'warning';
                const isRead = readIds.includes(alert.id);

                const cardBg = isStitchLight
                  ? isRead
                    ? 'bg-zinc-50/70 border-[var(--hair)] text-zinc-500'
                    : isUrgent
                      ? 'bg-rose-50/60 border-[var(--alert)] text-zinc-900'
                      : isWarning
                        ? 'bg-amber-50/60 border-[var(--acc)] text-zinc-900'
                        : 'bg-[var(--surface)] border-[var(--hair)] text-zinc-900'
                  : isRead
                    ? 'bg-slate-950/40 border-[var(--hair)]/60 opacity-80 text-slate-300'
                    : isUrgent
                      ? 'bg-gradient-to-r from-red-950/30 via-slate-900/90 to-slate-900/90 border-[var(--alert)]/30 text-slate-100'
                      : isWarning
                        ? 'bg-gradient-to-r from-amber-950/25 via-slate-900/90 to-slate-900/90 border-[var(--acc)]/30 text-slate-100'
                        : 'bg-slate-900/90 border-[var(--hair)] text-slate-100';

                const badgeStyle = isStitchLight
                  ? isUrgent
                    ? 'bg-rose-100 text-rose-700 border-[var(--alert)]'
                    : isWarning
                      ? 'bg-amber-100 text-amber-800 border-[var(--acc)]'
                      : 'bg-indigo-100 text-indigo-700 border-[var(--acc)]'
                  : isUrgent
                    ? 'bg-red-500/20 text-red-300 border-[var(--alert)]/30'
                    : isWarning
                      ? 'bg-amber-500/20 text-amber-300 border-[var(--acc)]/30'
                      : 'bg-indigo-500/20 text-indigo-300 border-[var(--acc)]/30';

                return (
                  <div
                    key={alert.id}
                    id={`alert-card-${alert.id}`}
                    className={`p-4 rounded-xl border transition-all duration-200 relative group flex flex-col justify-between ${cardBg} ${
                      !isRead ? 'shadow-xs hover:border-[var(--acc)]' : ''
                    }`}
                  >
                    <div>
                      {/* Top status bar */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {!isRead && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Sin leer" />}

                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border ${badgeStyle}`}
                          >
                            {alert.category}
                          </span>

                          {alert.monthRange && (
                            <span
                              className={`text-[11px] font-medium ${isStitchLight ? 'text-zinc-500' : 'text-slate-400'} flex items-center gap-1`}
                            >
                              <Calendar className={`w-3 h-3 ${isStitchLight ? 'text-zinc-400' : 'text-slate-500'}`} />
                              {alert.monthRange}
                            </span>
                          )}
                        </div>

                        {/* Card controls (Mark read / Dismiss) */}
                        <div className="flex items-center gap-1">
                          <button
                            id={`toggle-read-alert-${alert.id}`}
                            onClick={(e) => handleToggleRead(alert.id, e)}
                            className={`p-1 rounded-lg ${isStitchLight ? 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/80'} transition-colors cursor-pointer`}
                            title={isRead ? 'Marcar como no leída' : 'Marcar como leída'}
                          >
                            {isRead ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className={`w-3.5 h-3.5 ${isStitchLight ? 'text-indigo-600' : 'text-amber-400'}`} />
                            )}
                          </button>

                          <button
                            id={`dismiss-alert-${alert.id}`}
                            onClick={(e) => handleDismiss(alert.id, e)}
                            className={`p-1 rounded-lg ${isStitchLight ? 'text-zinc-400 hover:text-rose-600 hover:bg-zinc-100' : 'text-slate-500 hover:text-red-400 hover:bg-slate-800/80'} transition-colors cursor-pointer`}
                            title="Descartar alerta"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4
                        className={`text-sm font-bold mb-1.5 leading-snug ${isStitchLight ? (isRead ? 'text-zinc-500' : 'text-zinc-900') : isRead ? 'text-slate-300' : 'text-slate-100'}`}
                      >
                        {alert.title}
                      </h4>

                      <p className={`text-xs ${isStitchLight ? 'text-zinc-600' : 'text-slate-400'} leading-relaxed mb-3`}>
                        {alert.description}
                      </p>
                    </div>

                    {/* Quick action button footer */}
                    <div
                      className={`pt-2.5 border-t ${isStitchLight ? 'border-[var(--hair)]' : 'border-[var(--hair)]/70'} flex flex-col sm:flex-row sm:items-center justify-between gap-2`}
                    >
                      <span
                        className={`text-[10px] font-mono ${isStitchLight ? 'text-zinc-400' : 'text-slate-500'} flex items-center gap-1`}
                      >
                        <Zap className={`w-3 h-3 ${isStitchLight ? 'text-indigo-500' : 'text-amber-400/80'} shrink-0`} />
                        Acciones disponibles
                      </span>

                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
                        {alert.actions && alert.actions.length > 0 ? (
                          alert.actions.map((act, actIdx) => (
                            <button
                              key={actIdx}
                              id={`action-alert-${alert.id}-${actIdx}`}
                              onClick={() => {
                                if (!isRead) {
                                  setReadIds((prev) => [...prev, alert.id]);
                                }
                                onExecuteAction(alert, act);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 shrink-0 cursor-pointer ${
                                act.variant === 'secondary'
                                  ? isStitchLight
                                    ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-[var(--hair)]'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-[var(--hair)]/80'
                                  : isStitchLight
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                    : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                              }`}
                            >
                              <span>{act.label}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          ))
                        ) : (
                          <button
                            id={`action-alert-${alert.id}`}
                            onClick={() => {
                              if (!isRead) {
                                setReadIds((prev) => [...prev, alert.id]);
                              }
                              onExecuteAction(alert);
                            }}
                            className={`px-3.5 py-1.5 rounded-xl ${
                              isStitchLight
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                            } text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 shrink-0 cursor-pointer`}
                          >
                            <span>{alert.actionLabel}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer toggle for compact vs expanded list */}
          {filteredAlerts.length > 2 && (
            <div
              className={`px-4 py-2.5 ${isStitchLight ? 'bg-zinc-50/60 border-t border-[var(--hair)]' : 'bg-slate-950/50 border-t border-[var(--hair)]/60'} flex items-center justify-center`}
            >
              <button
                id="toggle-compact-alerts-mode-btn"
                onClick={() => setIsCompactView(!isCompactView)}
                className={`text-xs font-semibold ${isStitchLight ? 'text-indigo-600 hover:text-indigo-700' : 'text-amber-400 hover:text-amber-300'} transition-colors flex items-center gap-1.5 cursor-pointer`}
              >
                {isCompactView ? (
                  <>
                    <span>Ver {filteredAlerts.length - 2} alertas más</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>Mostrar solo las 2 más importantes</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
