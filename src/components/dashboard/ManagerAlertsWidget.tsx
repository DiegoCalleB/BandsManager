import React, { useState, useEffect } from 'react';
import { ManagerAlert, AlertAction } from '../../utils/managerAlerts';
import { 
  Sparkles, Calendar, ArrowRight, X, AlertCircle, CheckCircle2, Megaphone, 
  Bell, ShieldAlert, Sliders, Check, Eye, EyeOff, Trash2, Filter, RefreshCw, 
  Mail, ChevronDown, ChevronUp, Zap, Clock, Plus, Search
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
  isStitchLight = false
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

  const activeAlerts = alerts.filter(a => !dismissedIds.includes(a.id));
  const unreadAlerts = activeAlerts.filter(a => !readIds.includes(a.id));
  const urgentAlerts = activeAlerts.filter(a => a.severity === 'urgent');

  const filteredAlerts = activeAlerts.filter(a => {
    if (filterMode === 'unread') return !readIds.includes(a.id);
    if (filterMode === 'urgent') return a.severity === 'urgent';
    if (filterMode === 'booking') return a.category === 'Calendario Industria' || a.category === 'Seguimiento CRM';
    if (filterMode === 'finanzas') return a.category === 'Finanzas & Cobros';
    return true;
  });

  const handleToggleRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setReadIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds(prev => [...prev, id]);
  };

  const handleMarkAllRead = () => {
    const allIds = activeAlerts.map(a => a.id);
    setReadIds(prev => Array.from(new Set([...prev, ...allIds])));
  };

  const handleResetDismissed = () => {
    setDismissedIds([]);
  };

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <div id="manager-alerts-container" className="mb-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl overflow-hidden transition-all">
      {/* Panel Header */}
      <div className="px-3.5 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 relative shrink-0">
            <Bell className="w-3.5 h-3.5" />
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            )}
          </div>

          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-100 tracking-tight">
              Radar del Mánager
            </h3>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {activeAlerts.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {unreadAlerts.length > 0 && (
            <button
              id="mark-all-read-alerts-btn"
              onClick={handleMarkAllRead}
              className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-[11px] font-medium transition-all flex items-center gap-1"
              title="Marcar todas como leídas"
            >
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">Leídas</span>
            </button>
          )}

          <button
            id="toggle-expand-alerts-panel-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title={isExpanded ? "Plegar panel" : "Desplegar panel"}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Subheader Filter Bar */}
          <div className="px-4 py-2.5 bg-slate-950/30 border-b border-slate-800/60 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium text-[11px] mr-1 hidden sm:inline">Filtrar:</span>

              <button
                id="filter-alerts-all"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all text-xs ${
                  filterMode === 'all'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Todas ({activeAlerts.length})
              </button>

              <button
                id="filter-alerts-unread"
                onClick={() => setFilterMode('unread')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all text-xs flex items-center gap-1 ${
                  filterMode === 'unread'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>Sin Leer</span>
                {unreadAlerts.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </button>

              <button
                id="filter-alerts-urgent"
                onClick={() => setFilterMode('urgent')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all text-xs flex items-center gap-1 ${
                  filterMode === 'urgent'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>Urgentes</span>
                {urgentAlerts.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-red-500/30 text-red-300 font-mono">
                    {urgentAlerts.length}
                  </span>
                )}
              </button>

              <button
                id="filter-alerts-booking"
                onClick={() => setFilterMode('booking')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all text-xs ${
                  filterMode === 'booking'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Booking & CRM
              </button>

              <button
                id="filter-alerts-finanzas"
                onClick={() => setFilterMode('finanzas')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all text-xs ${
                  filterMode === 'finanzas'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
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
                className="text-[11px] text-slate-500 hover:text-slate-300 underline font-mono shrink-0"
              >
                Restablecer {dismissedIds.length} descartadas
              </button>
            )}
          </div>

          {/* Alert Cards Grid */}
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredAlerts.length === 0 ? (
              <div className="col-span-full py-8 text-center text-xs text-slate-500 bg-slate-950/20 rounded-xl border border-slate-800/40">
                No hay alertas que coincidan con el filtro seleccionado.
              </div>
            ) : (
              (isCompactView ? filteredAlerts.slice(0, 2) : filteredAlerts).map(alert => {
                const isUrgent = alert.severity === 'urgent';
                const isWarning = alert.severity === 'warning';
                const isRead = readIds.includes(alert.id);

                const cardBg = isRead
                  ? 'bg-slate-950/40 border-slate-800/60 opacity-80'
                  : isUrgent
                  ? 'bg-gradient-to-r from-red-950/30 via-slate-900/90 to-slate-900/90 border-red-500/30'
                  : isWarning
                  ? 'bg-gradient-to-r from-amber-950/25 via-slate-900/90 to-slate-900/90 border-amber-500/30'
                  : 'bg-slate-900/90 border-slate-800';

                const badgeStyle = isUrgent
                  ? 'bg-red-500/20 text-red-300 border-red-500/30'
                  : isWarning
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';

                return (
                  <div 
                    key={alert.id}
                    id={`alert-card-${alert.id}`}
                    className={`p-4 rounded-xl border transition-all duration-200 relative group flex flex-col justify-between ${cardBg} ${
                      !isRead ? 'shadow-md hover:border-slate-700' : ''
                    }`}
                  >
                    <div>
                      {/* Top status bar */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {!isRead && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Sin leer" />
                          )}

                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border ${badgeStyle}`}>
                            {alert.category}
                          </span>

                          {alert.monthRange && (
                            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              {alert.monthRange}
                            </span>
                          )}
                        </div>

                        {/* Card controls (Mark read / Dismiss) */}
                        <div className="flex items-center gap-1">
                          <button
                            id={`toggle-read-alert-${alert.id}`}
                            onClick={(e) => handleToggleRead(alert.id, e)}
                            className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/80 transition-colors"
                            title={isRead ? "Marcar como no leída" : "Marcar como leída"}
                          >
                            {isRead ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-amber-400" />}
                          </button>

                          <button
                            id={`dismiss-alert-${alert.id}`}
                            onClick={(e) => handleDismiss(alert.id, e)}
                            className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800/80 transition-colors"
                            title="Descartar alerta"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className={`text-sm font-bold mb-1.5 leading-snug ${isRead ? 'text-slate-300' : 'text-slate-100'}`}>
                        {alert.title}
                      </h4>

                      <p className="text-xs text-slate-400 leading-relaxed mb-3">
                        {alert.description}
                      </p>
                    </div>

                    {/* Quick action button footer */}
                    <div className="pt-2.5 border-t border-slate-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400/80 shrink-0" />
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
                                  setReadIds(prev => [...prev, alert.id]);
                                }
                                onExecuteAction(alert, act);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95 shrink-0 ${
                                act.variant === 'secondary'
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80'
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
                                setReadIds(prev => [...prev, alert.id]);
                              }
                              onExecuteAction(alert);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95 shrink-0"
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
            <div className="px-4 py-2.5 bg-slate-950/50 border-t border-slate-800/60 flex items-center justify-center">
              <button
                id="toggle-compact-alerts-mode-btn"
                onClick={() => setIsCompactView(!isCompactView)}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1.5"
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
