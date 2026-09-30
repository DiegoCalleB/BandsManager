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
import { Button } from '../ui';

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
      className={`mb-4 rounded-[var(--r-l)] ${
        'bg-[var(--surface)] shadow-xs text-[var(--ink)]'
      } overflow-hidden transition-ui`}
    >
      {/* Panel Header */}
      <div
        className={`px-3.5 py-2.5 ${
          'bg-[var(--surface)]/80 border-b border-[var(--hair)]'
        } flex items-center justify-between gap-2`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`p-1.5 rounded-[var(--r-s)] ${
              'bg-[var(--acc-soft)] text-[var(--acc-ink)]'
            } relative shrink-0`}
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadAlerts.length > 0 && (
              <span
                className={`absolute -top-0.5 -right-0.5 w-2 h-2 ${'bg-[var(--acc)]'} rounded-[var(--r-pill)]`}
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            <h3 className={`text-xs font-bold ${'text-[var(--ink)]'} tracking-tight`}>Radar del mánager</h3>
            <span
              className={`px-1.5 py-0.2 rounded-[var(--r-pill)] text-micro font-mono font-bold ${
                'bg-[var(--acc-soft)] text-[var(--acc-ink)]'
              }`}
            >
              {activeAlerts.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {unreadAlerts.length > 0 && (
            <Button
              variant="neutral"
              size="xs"
              id="mark-all-read-alerts-btn"
              onClick={handleMarkAllRead}
              className="items-center gap-1"
              title="Marcar todas como leídas"
            >
              <Check className="w-3 h-3 text-[var(--ok)]" />
              <span className="hidden sm:inline">Leídas</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="xs"
            id="toggle-expand-alerts-panel-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Plegar panel' : 'Desplegar panel'}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Subheader Filter Bar */}
          <div
            className={`px-4 py-2.5 ${
              'bg-[var(--surface)]/40 border-b border-[var(--hair)]'
            } flex items-center justify-between gap-2 overflow-x-auto`}
          >
            <div className="flex items-center gap-1.5 text-xs [&>button]:shrink-0 [&>button]:whitespace-nowrap">
              <span className={`${'text-[var(--ink-2)]'} font-medium text-xs mr-1 hidden sm:inline`}>
                Filtrar:
              </span>

              <Button
                variant={filterMode === 'all' ? "neutral" : "ghost"}
                size="xs"
                id="filter-alerts-all"
                onClick={() => setFilterMode('all')}
              >
                Todas ({activeAlerts.length})
              </Button>

              <Button
                variant={filterMode === 'unread' ? "neutral" : "ghost"}
                size="xs"
                id="filter-alerts-unread"
                onClick={() => setFilterMode('unread')}
                className="items-center gap-1 shrink-0 whitespace-nowrap"
              >
                <span>Sin Leer</span>
                {unreadAlerts.length > 0 && <span className="w-2 h-2 rounded-[var(--r-pill)] bg-[var(--ok)]" />}
              </Button>

              <button
                id="filter-alerts-urgent"
                onClick={() => setFilterMode('urgent')}
                className={`px-2.5 py-1 rounded-[var(--r-pill)] font-medium transition-ui text-xs flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap ${
                  filterMode === 'urgent'
                    ? 'bg-[var(--alert)]/15 text-[var(--ink)] font-semibold'
                    : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--sunken)]'
                }`}
              >
                <span>Urgentes</span>
                {urgentAlerts.length > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-micro ${'bg-[var(--alert)]/15 text-[var(--ink)]'} font-mono`}
                  >
                    {urgentAlerts.length}
                  </span>
                )}
              </button>

              <Button
                variant={filterMode === 'booking' ? "soft" : "ghost"}
                size="xs"
                id="filter-alerts-booking"
                onClick={() => setFilterMode('booking')}
              >
                Booking y CRM
              </Button>

              <Button
                variant={filterMode === 'finanzas' ? "soft" : "ghost"}
                size="xs"
                id="filter-alerts-finanzas"
                onClick={() => setFilterMode('finanzas')}
              >
                Finanzas
              </Button>
            </div>

            {dismissedIds.length > 0 && (
              <button
                id="reset-dismissed-inline-btn"
                onClick={handleResetDismissed}
                className={`text-xs ${'text-[var(--ink-2)] hover:text-[var(--ink)]'} underline font-mono shrink-0 cursor-pointer`}
              >
                Restablecer {dismissedIds.length} descartadas
              </button>
            )}
          </div>

          {/* Alert Cards Grid */}
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredAlerts.length === 0 ? (
              <div
                className={`col-span-full py-8 text-center text-xs ${'text-[var(--ink-2)] bg-[var(--sunken)]/50 '} rounded-[var(--r-m)] `}
              >
                Nada que mirar con ese filtro.
              </div>
            ) : (
              (isCompactView ? filteredAlerts.slice(0, 2) : filteredAlerts).map((alert) => {
                const isUrgent = alert.severity === 'urgent';
                const isWarning = alert.severity === 'warning';
                const isRead = readIds.includes(alert.id);

                const cardBg = isRead
                  ? 'bg-[var(--sunken)] text-[var(--ink-2)] opacity-80'
                  : isUrgent
                    ? 'bg-[var(--alert)]/8 text-[var(--ink)]'
                    : isWarning
                      ? 'bg-[var(--acc-soft)] text-[var(--ink)]'
                      : 'bg-[var(--sunken)] text-[var(--ink)]';

                const badgeStyle = isUrgent
                  ? 'bg-[var(--alert)]/15 text-[var(--ink)] '
                  : isWarning
                    ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)] '
                    : 'bg-[var(--surface)] text-[var(--ok)] ';

                const actionBtnStyle = isUrgent
                  ? 'bg-[var(--alert)] hover:brightness-95 text-[var(--on-alert)]'
                  : 'bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)]';

                return (
                  <div
                    key={alert.id}
                    id={`alert-card-${alert.id}`}
                    className={`p-4 rounded-[var(--r-l)] transition-ui duration-200 relative group flex flex-col justify-between ${cardBg}`}
                  >
                    <div>
                      {/* Top status bar */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {!isRead && <span className="w-2 h-2 rounded-[var(--r-pill)] bg-[var(--ok)] shrink-0" title="Sin leer" />}

                          <span
                            className={`px-2 py-0.5 rounded-[var(--r-s)] text-micro font-mono font-bold ${badgeStyle}`}
                          >
                            {alert.category}
                          </span>

                          {alert.monthRange && (
                            <span
                              className={`text-xs font-medium ${'text-[var(--ink-2)]'} flex items-center gap-1`}
                            >
                              <Calendar className={`w-3 h-3 ${'text-[var(--ink-2)]'}`} />
                              {alert.monthRange}
                            </span>
                          )}
                        </div>

                        {/* Card controls (Mark read / Dismiss) */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="xs"
                            id={`toggle-read-alert-${alert.id}`}
                            onClick={(e) => handleToggleRead(alert.id, e)}
                            title={isRead ? 'Marcar como no leída' : 'Marcar como leída'}
                          >
                            {isRead ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className={`w-3.5 h-3.5 ${'text-[var(--acc)]'}`} />
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="xs"
                            id={`dismiss-alert-${alert.id}`}
                            onClick={(e) => handleDismiss(alert.id, e)}
                            title="Descartar alerta"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      <h4
                        className={`text-sm font-bold mb-1.5 leading-snug ${isRead ? 'text-[var(--ink-2)]' : 'text-[var(--ink)]'}`}
                      >
                        {alert.title}
                      </h4>

                      <p className={`text-xs ${'text-[var(--ink-2)]'} leading-relaxed mb-3`}>
                        {alert.description}
                      </p>
                    </div>

                    {/* Quick action button footer */}
                    <div
                      className={`pt-2.5 border-t ${'border-[var(--hair)]'} flex flex-col gap-2`}
                    >
                      <span
                        className={`text-micro font-mono ${'text-[var(--ink-2)]'} flex items-center gap-1`}
                      >
                        <Zap className={`w-3 h-3 ${'text-[var(--acc)]'} shrink-0`} />
                        Acciones disponibles
                      </span>

                      <div className="flex items-center gap-2 flex-wrap">
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
                              className={`px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-bold transition-ui flex items-center gap-1.5 active:scale-[0.97] shrink-0 cursor-pointer ${
                                act.variant === 'secondary'
                                  ? 'bg-[var(--sunken)] hover:brightness-95 text-[var(--ink)]'
                                  : actionBtnStyle
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
                            className={`px-3.5 py-1.5 rounded-[var(--r-m)] ${actionBtnStyle} text-xs font-bold transition-ui flex items-center gap-1.5 active:scale-[0.97] shrink-0 cursor-pointer`}
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
              className={`px-4 py-2.5 ${'bg-[var(--surface)]/60 border-t border-[var(--hair)]'} flex items-center justify-center`}
            >
              <button
                id="toggle-compact-alerts-mode-btn"
                onClick={() => setIsCompactView(!isCompactView)}
                className={`text-xs font-semibold ${'text-[var(--acc)] hover:text-[var(--acc)]'} transition-colors flex items-center gap-1.5 cursor-pointer`}
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
