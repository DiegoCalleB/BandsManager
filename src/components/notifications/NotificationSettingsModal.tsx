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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
        <div className="relative w-full max-w-lg bg-[#141312] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-gradient-to-r from-amber-950/30 via-zinc-900 to-[#141312]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-display">Notificaciones Push en el Navegador</h2>
                <p className="text-xs text-zinc-400">Configura los avisos en tiempo real para leads, respuestas y agentes</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-zinc-300">
            {/* Permission Banner */}
            {permission === 'granted' ? (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-start gap-3 text-emerald-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block text-sm">Permiso concedido en este navegador</span>
                  <p className="text-[11px] text-emerald-400/80 mt-0.5">
                    Recibirás alertas nativas en tu escritorio o móvil incluso si estás en otra pestaña.
                  </p>
                </div>
              </div>
            ) : permission === 'denied' ? (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-3 text-rose-300">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <span className="font-bold block text-sm">Permiso bloqueado en el navegador</span>
                  <p className="text-[11px] text-rose-300/80">
                    Las notificaciones están bloqueadas en los ajustes de tu navegador. Para recibirlas, haz clic en el icono del candado 🔒
                    junto a la URL y permite las "Notificaciones".
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-start justify-between gap-3 text-amber-300">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-sm">Activar permiso del navegador</span>
                    <p className="text-[11px] text-amber-300/80 mt-0.5">
                      Haz clic para permitir que BandManager.io te avise cuando una sala responda.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onRequestPermission}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shrink-0 transition-colors cursor-pointer shadow-md"
                >
                  Solicitar Permiso
                </button>
              </div>
            )}

            {/* Master Switches */}
            <div className="space-y-3 bg-[#1A1918] p-4 rounded-xl border border-zinc-800">
              {/* Master toggle */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    {config.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4 text-zinc-500" />}
                  </div>
                  <div>
                    <span className="font-bold text-zinc-200 block text-xs">Notificaciones Push Activas</span>
                    <span className="text-[11px] text-zinc-400">Interruptor general de avisos en este dispositivo</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={config.enabled} onChange={handleToggleMaster} className="sr-only peer" />
                  <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Sound toggle */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center">
                    {config.soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
                  </div>
                  <div>
                    <span className="font-bold text-zinc-200 block text-xs">Sonido de Alerta</span>
                    <span className="text-[11px] text-zinc-400">Chime suave con cada notificación</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onTriggerTestSound}
                    className="text-[10px] text-zinc-400 hover:text-amber-300 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-md border border-zinc-700 transition-colors cursor-pointer"
                    title="Reproducir sonido de prueba"
                  >
                    🔊 Probar
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.soundEnabled}
                      onChange={handleToggleSound}
                      disabled={!config.enabled}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 peer-disabled:opacity-40"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Event Specific Config */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400 block px-1">
                Eventos a Notificar
              </span>

              <div className="space-y-2 bg-[#1A1918] p-3 rounded-xl border border-zinc-800">
                {/* 1. Lead Status Changed */}
                <div className="flex items-start justify-between p-2 rounded-lg hover:bg-zinc-800/40 transition-colors">
                  <div className="flex items-start gap-2.5">
                    <RefreshCw className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-zinc-200 block text-xs">Cambios de Estado en Leads CRM</span>
                      <p className="text-[11px] text-zinc-400">Avisar cuando una sala cambie de estado (ej: negociando, aplazado, etc.).</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.events.leadStatusChanged}
                    onChange={() => handleToggleEvent('leadStatusChanged')}
                    disabled={!config.enabled}
                    className="w-4 h-4 rounded text-amber-500 bg-zinc-900 border-zinc-700 focus:ring-amber-400 cursor-pointer disabled:opacity-40 mt-1"
                  />
                </div>

                {/* 2. New Message */}
                <div className="flex items-start justify-between p-2 rounded-lg hover:bg-zinc-800/40 transition-colors border-t border-zinc-800/60">
                  <div className="flex items-start gap-2.5">
                    <MessageSquare className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-zinc-200 block text-xs">Nuevas Respuestas y Mensajes Recibidos</span>
                      <p className="text-[11px] text-zinc-400">
                        Avisar cuando una sala o festival conteste a tus pitches o envíe un nuevo mensaje.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.events.leadNewMessage}
                    onChange={() => handleToggleEvent('leadNewMessage')}
                    disabled={!config.enabled}
                    className="w-4 h-4 rounded text-amber-500 bg-zinc-900 border-zinc-700 focus:ring-amber-400 cursor-pointer disabled:opacity-40 mt-1"
                  />
                </div>

                {/* 3. Agent Pending Approval */}
                <div className="flex items-start justify-between p-2 rounded-lg hover:bg-zinc-800/40 transition-colors border-t border-zinc-800/60">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-zinc-200 block text-xs">Agentes IA: Propuestas Listas para Aprobación</span>
                      <p className="text-[11px] text-zinc-400">
                        Avisar cuando el Redactor o Lector prepare un pitch pendiente de tu revisión.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.events.agentPendingApproval}
                    onChange={() => handleToggleEvent('agentPendingApproval')}
                    disabled={!config.enabled}
                    className="w-4 h-4 rounded text-amber-500 bg-zinc-900 border-zinc-700 focus:ring-amber-400 cursor-pointer disabled:opacity-40 mt-1"
                  />
                </div>

                {/* 4. Concert Confirmed */}
                <div className="flex items-start justify-between p-2 rounded-lg hover:bg-zinc-800/40 transition-colors border-t border-zinc-800/60">
                  <div className="flex items-start gap-2.5">
                    <PartyPopper className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-zinc-200 block text-xs">Conciertos Confirmados y Fechas Cerradas</span>
                      <p className="text-[11px] text-zinc-400">Avisar cuando un lead pase formalmente a bolo cerrado en la gira.</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.events.concertConfirmed}
                    onChange={() => handleToggleEvent('concertConfirmed')}
                    disabled={!config.enabled}
                    className="w-4 h-4 rounded text-amber-500 bg-zinc-900 border-zinc-700 focus:ring-amber-400 cursor-pointer disabled:opacity-40 mt-1"
                  />
                </div>

                {/* 5. Lead Discovered */}
                <div className="flex items-start justify-between p-2 rounded-lg hover:bg-zinc-800/40 transition-colors border-t border-zinc-800/60">
                  <div className="flex items-start gap-2.5">
                    <Radio className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-zinc-200 block text-xs">Nuevas Salas Detectadas por el Scout</span>
                      <p className="text-[11px] text-zinc-400">
                        Avisar cuando el agente Scout incorpore nuevos espacios a la base de datos.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.events.leadDiscovered}
                    onChange={() => handleToggleEvent('leadDiscovered')}
                    disabled={!config.enabled}
                    className="w-4 h-4 rounded text-amber-500 bg-zinc-900 border-zinc-700 focus:ring-amber-400 cursor-pointer disabled:opacity-40 mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-800 bg-[#121110] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onTriggerTest}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Probar Notificación Push</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors cursor-pointer shadow-md"
            >
              Guardar y Cerrar
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
