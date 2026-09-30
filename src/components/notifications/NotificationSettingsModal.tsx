import React from 'react';
import {
  Bell,
  BellOff,
  BellRing,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  MessageSquare,
  RefreshCw,
  PartyPopper,
  Radio,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';
import { BrowserNotificationConfig, NotificationPermissionStatus } from '../../types/browserNotifications';
import { ShowIcon } from '../ui/ShowIcon';
import { Button } from '../ui';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  permission: NotificationPermissionStatus;
  config: BrowserNotificationConfig;
  onUpdateConfig: (newConfig: Partial<BrowserNotificationConfig>) => void;
  onRequestPermission: () => Promise<NotificationPermissionStatus>;
  onTriggerTest: () => void;
  onTriggerTestSound: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  permission,
  config,
  onUpdateConfig,
  onRequestPermission,
  onTriggerTest,
  onTriggerTestSound,
}) => {
  if (!isOpen) return null;

  const handleToggleMaster = () => {
    onUpdateConfig({ enabled: !config.enabled });
  };

  const handleToggleSound = () => {
    onUpdateConfig({ soundEnabled: !config.soundEnabled });
  };

  const handleToggleEvent = (key: keyof BrowserNotificationConfig['events']) => {
    onUpdateConfig({
      events: {
        ...config.events,
        [key]: !config.events[key],
      },
    });
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-[var(--scrim)]/80">
        <div className="relative w-full max-w-lg bg-[var(--surface)] rounded-[var(--r-l)] overflow-hidden flex flex-col max-h-[90vh] bg-[var(--acc)]/10">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[var(--hair)] flex items-center justify-between bg-[var(--acc)]/30 ">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--acc)]/20 text-[var(--acc-ink)] flex items-center justify-center">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--ink-2)] font-display">Notificaciones push en el navegador</h2>
                <p className="text-xs text-[var(--ink-2)]">Configura los avisos en tiempo real para leads, respuestas y agentes</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-[var(--r-pill)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-[var(--ink-2)]">
            {/* Permission Banner */}
            {permission === 'granted' ? (
              <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--ok)]/40 flex items-start gap-3 text-[var(--ink)]">
                <CheckCircle2 className="w-5 h-5 text-[var(--ok)] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block text-sm">Permiso concedido en este navegador</span>
                  <p className="text-xs text-[var(--ok)]/80 mt-0.5">
                    Recibirás alertas nativas en tu escritorio o móvil incluso si estás en otra pestaña.
                  </p>
                </div>
              </div>
            ) : permission === 'denied' ? (
              <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--alert)]/40 flex items-start gap-3 text-[var(--ink)]">
                <AlertTriangle className="w-5 h-5 text-[var(--alert)] shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <span className="font-bold block text-sm">Permiso bloqueado en el navegador</span>
                  <p className="text-xs text-[var(--alert)]/80">
                    Las notificaciones están bloqueadas en los ajustes de tu navegador. Para recibirlas, haz clic en el icono del candado <ShowIcon inline emoji="🔒" />
                    junto a la URL y permite las “Notificaciones”.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--acc)]/40 flex items-start justify-between gap-3 text-[var(--ink)]">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-[var(--acc)] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-sm">Activar permiso del navegador</span>
                    <p className="text-xs text-[var(--acc)]/80 mt-0.5">
                      Haz clic para permitir que BandManager.io te avise cuando una sala responda.
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="xs"
                  type="button"
                  onClick={onRequestPermission}
                  className="shrink-0"
                >
                  Solicitar permiso
                </Button>
              </div>
            )}

            {/* Master Switches */}
            <div className="space-y-3 bg-[var(--sunken)] p-4 rounded-[var(--r-m)] ">
              {/* Master toggle */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--hair)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[var(--r-m)] bg-[var(--acc)]/10 text-[var(--acc-ink)] flex items-center justify-center">
                    {config.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4 text-[var(--ink-2)]" />}
                  </div>
                  <div>
                    <span className="font-bold text-[var(--ink-2)] block text-xs">Notificaciones push activas</span>
                    <span className="text-xs text-[var(--ink-2)]">Interruptor general de avisos en este dispositivo</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={config.enabled} onChange={handleToggleMaster} className="sr-only peer" />
                  <div className="w-11 h-6 bg-[var(--surface)] peer-focus:outline-hidden rounded-[var(--r-pill)] peer peer-checked:after:translate-x-full peer-checked:after:border-[var(--hair)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--surface)] after:border-[var(--hair)] after:border after:rounded-[var(--r-pill)] after:h-5 after:w-5 after:transition-ui peer-checked:bg-[var(--acc)]"></div>
                </label>
              </div>

              {/* Sound toggle */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[var(--r-m)] bg-[var(--surface)] text-[var(--ink-2)] flex items-center justify-center">
                    {config.soundEnabled ? <Volume2 className="w-4 h-4 text-[var(--acc)]" /> : <VolumeX className="w-4 h-4 text-[var(--ink-2)]" />}
                  </div>
                  <div>
                    <span className="font-bold text-[var(--ink-2)] block text-xs">Sonido de alerta</span>
                    <span className="text-xs text-[var(--ink-2)]">Chime suave con cada notificación</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onTriggerTestSound}
                    className="text-micro text-[var(--ink-2)] hover:text-[var(--acc)] px-2 py-1 bg-[var(--surface)] hover:bg-[var(--surface)] rounded-[var(--r-pill)] transition-colors cursor-pointer"
                    title="Reproducir sonido de prueba"
                  >
                    <ShowIcon inline emoji="🔊" />Probar
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.soundEnabled}
                      onChange={handleToggleSound}
                      disabled={!config.enabled}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[var(--surface)] peer-focus:outline-hidden rounded-[var(--r-pill)] peer peer-checked:after:translate-x-full peer-checked:after:border-[var(--hair)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--surface)] after:border-[var(--hair)] after:border after:rounded-[var(--r-pill)] after:h-5 after:w-5 after:transition-ui peer-checked:bg-[var(--acc)] peer-disabled:opacity-40"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Event Specific Config */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[var(--ink-2)] block px-1">
                Eventos a Notificar
              </span>

              <div className="space-y-2 bg-[var(--sunken)] p-3 rounded-[var(--r-m)] ">
                {/* 1. Lead Status Changed */}
                <div className="flex items-start justify-between p-2 rounded-[var(--r-m)] hover:bg-[var(--surface)]/40 transition-colors">
                  <div className="flex items-start gap-2.5">
                    <RefreshCw className="w-4 h-4 text-[var(--ok)] mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-[var(--ink-2)] block text-xs">Cambios de estado en leads CRM</span>
                      <p className="text-xs text-[var(--ink-2)]">Avisar cuando una sala cambie de estado (ej: negociando, aplazado, etc.).</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.events.leadStatusChanged}
                    onChange={() => handleToggleEvent('leadStatusChanged')}
                    disabled={!config.enabled}
                    className="w-4 h-4 rounded text-[var(--acc)] bg-[var(--surface)] focus:ring-[var(--acc)] cursor-pointer disabled:opacity-40 mt-1"
                  />
                </div>

                {/* 2. New Message */}
                <div className="flex items-start justify-between p-2 rounded-[var(--r-m)] hover:bg-[var(--surface)]/40 transition-colors border-t border-[var(--hair)]/60">
                  <div className="flex items-start gap-2.5">
                    <MessageSquare className="w-4 h-4 text-[var(--acc)] mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-[var(--ink-2)] block text-xs">Nuevas respuestas y mensajes recibidos</span>
                      <p className="text-xs text-[var(--ink-2)]">
                        Avisar cuando una sala o festival conteste a tus pitches o envíe un nuevo mensaje.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.events.leadNewMessage}
                    onChange={() => handleToggleEvent('leadNewMessage')}
                    disabled={!config.enabled}
                    className="w-4 h-4 rounded text-[var(--acc)] bg-[var(--surface)] focus:ring-[var(--acc)] cursor-pointer disabled:opacity-40 mt-1"
                  />
                </div>

                {/* 3. Agent Pending Approval */}
                <div className="flex items-start justify-between p-2 rounded-[var(--r-m)] hover:bg-[var(--surface)]/40 transition-colors border-t border-[var(--hair)]/60">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-[var(--acc)] mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-[var(--ink-2)] block text-xs">Agentes IA: Propuestas listas para aprobación</span>
                      <p className="text-xs text-[var(--ink-2)]">
                        Avisar cuando el Redactor o Lector prepare un pitch pendiente de tu revisión.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.events.agentPendingApproval}
                    onChange={() => handleToggleEvent('agentPendingApproval')}
                    disabled={!config.enabled}
                    className="w-4 h-4 rounded text-[var(--acc)] bg-[var(--surface)] focus:ring-[var(--acc)] cursor-pointer disabled:opacity-40 mt-1"
                  />
                </div>

                {/* 4. Concert Confirmed */}
                <div className="flex items-start justify-between p-2 rounded-[var(--r-m)] hover:bg-[var(--surface)]/40 transition-colors border-t border-[var(--hair)]/60">
                  <div className="flex items-start gap-2.5">
                    <PartyPopper className="w-4 h-4 text-[var(--acc)] mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-[var(--ink-2)] block text-xs">Conciertos confirmados y fechas cerradas</span>
                      <p className="text-xs text-[var(--ink-2)]">Avisar cuando un lead pase formalmente a bolo cerrado en la gira.</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.events.concertConfirmed}
                    onChange={() => handleToggleEvent('concertConfirmed')}
                    disabled={!config.enabled}
                    className="w-4 h-4 rounded text-[var(--acc)] bg-[var(--surface)] focus:ring-[var(--acc)] cursor-pointer disabled:opacity-40 mt-1"
                  />
                </div>

                {/* 5. Lead Discovered */}
                <div className="flex items-start justify-between p-2 rounded-[var(--r-m)] hover:bg-[var(--surface)]/40 transition-colors border-t border-[var(--hair)]/60">
                  <div className="flex items-start gap-2.5">
                    <Radio className="w-4 h-4 text-[var(--acc)] mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-[var(--ink-2)] block text-xs">Nuevas salas detectadas por el scout</span>
                      <p className="text-xs text-[var(--ink-2)]">
                        Avisar cuando el agente Scout incorpore nuevos espacios a la base de datos.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.events.leadDiscovered}
                    onChange={() => handleToggleEvent('leadDiscovered')}
                    disabled={!config.enabled}
                    className="w-4 h-4 rounded text-[var(--acc)] bg-[var(--surface)] focus:ring-[var(--acc)] cursor-pointer disabled:opacity-40 mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[var(--hair)] bg-[var(--sunken)] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onTriggerTest}
              className="px-3.5 py-2 rounded-[var(--r-pill)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer "
            >
              <Bell className="w-3.5 h-3.5 text-[var(--acc)]" />
              <span>Probar notificación push</span>
            </button>

            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={onClose}
              
            >
              Guardar y cerrar
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
