import React, { useState, useEffect } from 'react';
import { AlertSettingsConfig, CustomAlertRule } from '../../types';
import { hasModuleAccess } from '../../utils/planPermissions';
import {
  X,
  Bell,
  Mail,
  ShieldCheck,
  Sliders,
  CheckCircle2,
  Lock,
  Sparkles,
  Calendar,
  Clock,
  AlertTriangle,
  Users,
  Save,
  Check,
} from 'lucide-react';

interface AlertSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPlan?: string;
  isLeaderOrManager?: boolean;
  userEmail?: string;
  bandId?: string;
  onSaveConfig?: (config: AlertSettingsConfig) => void;
}

export const DEFAULT_ALERT_RULES: CustomAlertRule[] = [
  {
    id: 'rule_festivals_window',
    name: '🎪 Ventana de Festivales de Verano (Oct-Feb)',
    description: 'Aviso urgente cuando la industria abre la contratación masiva de festivales.',
    category: 'booking',
    requiredModule: 'booking',
    enabled: true,
    notifyInApp: true,
    notifyEmail: true,
    targetRoleOnly: true,
  },
  {
    id: 'rule_stale_festival_lead',
    name: '📬 Lead de Festival sin Respuesta',
    description: 'Notificar si un festival no responde tras un número de días para enviar el follow-up de hito.',
    category: 'booking',
    requiredModule: 'booking',
    enabled: true,
    daysThreshold: 7,
    notifyInApp: true,
    notifyEmail: true,
    targetRoleOnly: true,
  },
  {
    id: 'rule_stale_venue_lead',
    name: '🏟️ Lead de Sala / Club sin Respuesta',
    description: 'Aviso cuando una sala lleva días congelada sin confirmación de agenda.',
    category: 'booking',
    requiredModule: 'booking',
    enabled: true,
    daysThreshold: 7,
    notifyInApp: true,
    notifyEmail: false,
    targetRoleOnly: true,
  },
  {
    id: 'rule_pending_drafts',
    name: '✍️ Borradores de IA Listos para Aprobación',
    description: 'Alertar cuando el Agente Redactor genera borradores de pitch esperando revisión humana.',
    category: 'booking',
    requiredModule: 'booking',
    enabled: true,
    notifyInApp: true,
    notifyEmail: true,
    targetRoleOnly: true,
  },
  {
    id: 'rule_unpaid_cache',
    name: '💰 Caché de Concierto Pasado sin Cobrar',
    description: 'Alerta cuando un bolo realizado supera el margen de cobro sin figurar como pagado.',
    category: 'finanzas',
    requiredModule: 'finanzas',
    enabled: true,
    daysThreshold: 5,
    notifyInApp: true,
    notifyEmail: true,
    targetRoleOnly: true,
  },
  {
    id: 'rule_rehearsal_warning',
    name: '🥁 Show Próximo sin Ensayos Agendados',
    description: 'Aviso si hay un concierto en menos de 14 días y no consta ensayo en la agenda.',
    category: 'ensayos',
    requiredModule: 'ensayos',
    enabled: true,
    daysThreshold: 14,
    notifyInApp: true,
    notifyEmail: false,
    targetRoleOnly: false,
  },
];

export const AlertSettingsModal: React.FC<AlertSettingsModalProps> = ({
  isOpen,
  onClose,
  userPlan = 'de_gira',
  isLeaderOrManager = true,
  userEmail = '',
  bandId = 'band-active',
  onSaveConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'channels' | 'plan'>('rules');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const storageKey = `bandmanager_alert_settings_${bandId}`;

  const [config, setConfig] = useState<AlertSettingsConfig>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback to default
    }
    return {
      emailNotificationsEnabled: true,
      inAppNotificationsEnabled: true,
      digestFrequency: 'weekly_digest',
      recipientEmail: userEmail || 'manager@banda.com',
      recipientRole: 'leader_only',
      rules: DEFAULT_ALERT_RULES,
    };
  });

  useEffect(() => {
    // Attempt to load remote alert settings from Supabase backend API
    const loadRemoteSettings = async () => {
      try {
        const res = await fetch('/api/bands/alert-settings', {
          headers: {
            'x-band-id': bandId,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.settings) {
            const s = data.settings;
            setConfig((prev) => ({
              ...prev,
              emailNotificationsEnabled: s.email_notifications_enabled ?? prev.emailNotificationsEnabled,
              inAppNotificationsEnabled: s.in_app_notifications_enabled ?? prev.inAppNotificationsEnabled,
              digestFrequency: s.digest_frequency || prev.digestFrequency,
              recipientEmail: s.recipient_email || prev.recipientEmail,
              recipientRole: s.recipient_role || prev.recipientRole,
              rules: s.rules && s.rules.length > 0 ? s.rules : prev.rules,
            }));
          }
        }
      } catch (e) {
        // Fallback silently to localStorage
      }
    };
    if (isOpen) {
      loadRemoteSettings();
    }
  }, [isOpen, bandId]);

  useEffect(() => {
    if (userEmail && (!config.recipientEmail || config.recipientEmail === 'manager@banda.com')) {
      setConfig((prev) => ({ ...prev, recipientEmail: userEmail }));
    }
  }, [userEmail]);

  if (!isOpen) return null;

  const handleToggleRule = (ruleId: string) => {
    setConfig((prev) => ({
      ...prev,
      rules: prev.rules.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r)),
    }));
  };

  const handleToggleRuleChannel = (ruleId: string, channel: 'notifyInApp' | 'notifyEmail') => {
    setConfig((prev) => ({
      ...prev,
      rules: prev.rules.map((r) => (r.id === ruleId ? { ...r, [channel]: !r[channel] } : r)),
    }));
  };

  const handleUpdateThreshold = (ruleId: string, val: number) => {
    setConfig((prev) => ({
      ...prev,
      rules: prev.rules.map((r) => (r.id === ruleId ? { ...r, daysThreshold: val } : r)),
    }));
  };

  const [sendingTestDigest, setSendingTestDigest] = useState(false);
  const [testDigestResult, setTestDigestResult] = useState<string | null>(null);

  const handleSendTestDigest = async () => {
    setSendingTestDigest(true);
    setTestDigestResult(null);
    try {
      const res = await fetch('/api/bands/trigger-alert-digest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-band-id': bandId,
        },
      });
      const data = await res.json();
      if (data.success) {
        setTestDigestResult(`¡Resumen enviado a ${data.recipient}!`);
      } else {
        setTestDigestResult(`Error: ${data.error || 'No se pudo enviar'}`);
      }
    } catch (err) {
      setTestDigestResult('Error de conexión.');
    } finally {
      setSendingTestDigest(false);
      setTimeout(() => setTestDigestResult(null), 4000);
    }
  };

  const handleSave = async () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(config));
    } catch (e) {
      console.error('Error saving alert settings to localStorage:', e);
    }

    // Save to Supabase DB via backend API
    try {
      await fetch('/api/bands/alert-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-band-id': bandId,
        },
        body: JSON.stringify({
          email_notifications_enabled: config.emailNotificationsEnabled,
          in_app_notifications_enabled: config.inAppNotificationsEnabled,
          digest_frequency: config.digestFrequency,
          recipient_email: config.recipientEmail,
          recipient_role: config.recipientRole,
          rules: config.rules,
        }),
      });
    } catch (e) {
      console.error('Error saving alert settings to backend:', e);
    }

    if (onSaveConfig) {
      onSaveConfig(config);
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div
      id="alert-settings-modal-backdrop"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--scrim)]/80 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div
        id="alert-settings-modal-card"
        className="bg-[var(--surface)] border border-[var(--hair)] text-[var(--ink-2)] rounded-[var(--r-l)] w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-[var(--hair)] flex items-center justify-between bg-[var(--surface)]/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/15 text-[var(--acc)] border border-[var(--acc)]/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--ink-2)] tracking-tight flex items-center gap-2">
                Configuración del Radar de Alertas
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--acc)]/20 text-[var(--acc)] border border-[var(--acc)]/30">
                  Mánager Pro
                </span>
              </h2>
              <p className="text-xs text-[var(--ink-2)]">
                Personaliza reglas, umbrales de días y canales de notificación vinculados a tu plan y rol.
              </p>
            </div>
          </div>

          <button
            id="close-alert-settings-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-[var(--r-m)] text-[var(--ink-2)] hover:text-[var(--ink-2)] hover:bg-[var(--surface)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-[var(--hair)] bg-[var(--surface)]/30">
          <button
            id="tab-alert-rules"
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-[var(--r-m)] transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'rules'
                ? 'border-[var(--acc)] text-[var(--acc)] bg-[var(--surface)]/90'
                : 'border-transparent text-[var(--ink-2)] hover:text-[var(--ink-2)]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Reglas Personalizadas ({config.rules.filter((r) => r.enabled).length})</span>
          </button>

          <button
            id="tab-alert-channels"
            onClick={() => setActiveTab('channels')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-[var(--r-m)] transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'channels'
                ? 'border-[var(--acc)] text-[var(--acc)] bg-[var(--surface)]/90'
                : 'border-transparent text-[var(--ink-2)] hover:text-[var(--ink-2)]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Canales y Roles</span>
          </button>

          <button
            id="tab-alert-plan"
            onClick={() => setActiveTab('plan')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-[var(--r-m)] transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'plan'
                ? 'border-[var(--acc)] text-[var(--acc)] bg-[var(--surface)]/90'
                : 'border-transparent text-[var(--ink-2)] hover:text-[var(--ink-2)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Plan de Notificaciones Útiles</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'rules' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[var(--ink-2)] pb-1">
                <span>Define qué acontecimientos deben activar alertas para tu banda:</span>
                <span className="font-mono text-[11px] text-[var(--acc)] font-semibold">Plan Activo: {userPlan.toUpperCase()}</span>
              </div>

              {config.rules.map((rule) => {
                const isModuleAllowed = hasModuleAccess(userPlan, rule.requiredModule);

                return (
                  <div
                    key={rule.id}
                    id={`alert-rule-card-${rule.id}`}
                    className={`p-4 rounded-[var(--r-m)] border transition-all ${
                      !isModuleAllowed
                        ? 'bg-[var(--surface)]/40 border-[var(--hair)]/60 opacity-65'
                        : rule.enabled
                          ? 'bg-[var(--surface)]/90 border-[var(--hair)]/80'
                          : 'bg-[var(--surface)]/60 border-[var(--hair)]/80 text-[var(--ink-2)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="text-sm font-bold text-[var(--ink-2)] flex items-center gap-2">{rule.name}</h4>

                          {!isModuleAllowed ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[var(--alert)]/10 text-[var(--alert)] border border-[var(--alert)]/20 flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              Módulo {rule.requiredModule.toUpperCase()} Bloqueado en Plan
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[var(--surface)] text-[var(--ink-2)] border border-[var(--hair)]">
                              {rule.category.toUpperCase()}
                            </span>
                          )}

                          {rule.targetRoleOnly && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[var(--acc)]/15 text-[var(--acc)] border border-[var(--acc)]/20 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              Solo Mánager
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[var(--ink-2)] leading-relaxed">{rule.description}</p>

                        {/* Days Threshold Slider if applicable */}
                        {rule.daysThreshold !== undefined && isModuleAllowed && rule.enabled && (
                          <div className="mt-3 pt-2 border-t border-[var(--hair)]/60 flex items-center gap-3">
                            <Clock className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
                            <span className="text-xs text-[var(--ink-2)] font-medium">Umbral de inactividad:</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min="3"
                                max="30"
                                value={rule.daysThreshold}
                                onChange={(e) => handleUpdateThreshold(rule.id, parseInt(e.target.value, 10))}
                                className="w-28 accent-amber-500 cursor-pointer"
                              />
                              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[var(--acc)]/20 text-[var(--acc)] border border-[var(--acc)]/30">
                                {rule.daysThreshold} días
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Enable Switch */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rule.enabled && isModuleAllowed}
                            disabled={!isModuleAllowed}
                            onChange={() => handleToggleRule(rule.id)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-[var(--surface)] peer-focus:outline-none rounded-[var(--r-pill)] peer peer-checked:after:translate-x-full peer-checked:after:border-[var(--hair)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--surface)] after:border-[var(--hair)] after:border after:rounded-[var(--r-pill)] after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--acc)] peer-disabled:opacity-40"></div>
                        </label>

                        {/* Channels selection */}
                        {isModuleAllowed && rule.enabled && (
                          <div className="flex items-center gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => handleToggleRuleChannel(rule.id, 'notifyInApp')}
                              className={`px-2 py-1 rounded text-[10px] font-mono font-semibold transition-all flex items-center gap-1 ${
                                rule.notifyInApp
                                  ? 'bg-[var(--acc)]/20 text-[var(--acc)] border border-[var(--acc)]/40'
                                  : 'bg-[var(--surface)] text-[var(--ink-2)] border border-[var(--hair)]'
                              }`}
                              title="Notificar dentro de la app (In-App)"
                            >
                              <Bell className="w-2.5 h-2.5" />
                              <span>App</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleRuleChannel(rule.id, 'notifyEmail')}
                              className={`px-2 py-1 rounded text-[10px] font-mono font-semibold transition-all flex items-center gap-1 ${
                                rule.notifyEmail
                                  ? 'bg-[var(--acc)]/20 text-[var(--acc)] border border-[var(--acc)]/40'
                                  : 'bg-[var(--surface)] text-[var(--ink-2)] border border-[var(--hair)]'
                              }`}
                              title="Notificar por correo electrónico (Email)"
                            >
                              <Mail className="w-2.5 h-2.5" />
                              <span>Email</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'channels' && (
            <div className="space-y-4">
              <div className="p-4 rounded-[var(--r-m)] bg-[var(--surface)]/80 border border-[var(--hair)] space-y-4">
                <h3 className="text-sm font-bold text-[var(--ink-2)] flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[var(--acc)]" />
                  Configuración de Despacho por Correo (Email Digest)
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1">Correo Electrónico Destinatario de Alertas:</label>
                    <input
                      type="email"
                      value={config.recipientEmail || ''}
                      onChange={(e) => setConfig((prev) => ({ ...prev, recipientEmail: e.target.value }))}
                      placeholder="manager@labanda.com"
                      className="w-full px-3.5 py-2 rounded-[var(--r-m)] bg-[var(--surface)] border border-[var(--hair)] text-[var(--ink-2)] text-xs focus:outline-none focus:border-[var(--acc)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1">Frecuencia del Resumen del Mánager (Digest):</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'weekly_digest', label: 'Resumen Semanal', desc: 'Sugerido: Todos los lunes a primera hora.' },
                        { id: 'daily_digest', label: 'Resumen Diario', desc: 'Ideal durante época de gira activa.' },
                        { id: 'realtime', label: 'Tiempo Real', desc: 'Aviso inmediato en cada hito crítico.' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, digestFrequency: f.id as any }))}
                          className={`p-3 rounded-[var(--r-m)] border text-left transition-all ${
                            config.digestFrequency === f.id
                              ? 'bg-[var(--acc)]/15 border-[var(--acc)]/50 text-[var(--ink-2)]'
                              : 'bg-[var(--surface)] border-[var(--hair)] text-[var(--ink-2)] hover:text-[var(--ink-2)]'
                          }`}
                        >
                          <div className="text-xs font-bold mb-0.5">{f.label}</div>
                          <div className="text-[10px] text-[var(--ink-2)] leading-tight">{f.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Roles & Permissions section */}
              <div className="p-4 rounded-[var(--r-m)] bg-[var(--surface)]/80 border border-[var(--hair)] space-y-3">
                <h3 className="text-sm font-bold text-[var(--ink-2)] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[var(--acc)]" />
                  Control de Accesos y Destinatarios por Rol
                </h3>

                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  Asegura que los datos confidenciales (cachés, facturas, acuerdos de booking) solo lleguen a los perfiles autorizados de la
                  banda.
                </p>

                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-3 p-3 rounded-[var(--r-m)] bg-[var(--surface)] border border-[var(--hair)] cursor-pointer hover:border-[var(--hair)]">
                    <input
                      type="radio"
                      name="recipientRole"
                      checked={config.recipientRole === 'leader_only'}
                      onChange={() => setConfig((prev) => ({ ...prev, recipientRole: 'leader_only' }))}
                      className="accent-amber-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-[var(--ink-2)]">Solo Mánager / Líder de la Banda (Recomendado)</div>
                      <div className="text-[11px] text-[var(--ink-2)]">Las alertas de booking, cobros y borradores solo llegan a ti.</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-[var(--r-m)] bg-[var(--surface)] border border-[var(--hair)] cursor-pointer hover:border-[var(--hair)]">
                    <input
                      type="radio"
                      name="recipientRole"
                      checked={config.recipientRole === 'all_members'}
                      onChange={() => setConfig((prev) => ({ ...prev, recipientRole: 'all_members' }))}
                      className="accent-amber-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-[var(--ink-2)]">Todos los Músicos e Integrantes</div>
                      <div className="text-[11px] text-[var(--ink-2)]">Notifica a todo el grupo cuando surja un hito o aviso de ensayo.</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'plan' && (
            <div className="space-y-4 p-4 rounded-[var(--r-m)] bg-[var(--surface)]/90 border border-[var(--hair)] text-[var(--ink-2)] text-xs leading-relaxed">
              <div className="flex items-center gap-2 text-[var(--acc)] font-bold text-sm mb-2">
                <Sparkles className="w-4 h-4" />
                El Plan Perfecto: Notificaciones Útiles sin Spam
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-[var(--r-m)] bg-[var(--surface)] border border-[var(--hair)]">
                  <span className="font-bold text-[var(--ink-2)] block mb-1">1. Regla del Hito Relevante (Zero Ruido)</span>
                  Las alertas no notifican cambios insignificantes. Solo saltan cuando hay una ventana estacional de festivales abierta, un
                  lead congelado que requiere re-contacto o un cobro pendiente.
                </div>

                <div className="p-3 rounded-[var(--r-m)] bg-[var(--surface)] border border-[var(--hair)]">
                  <span className="font-bold text-[var(--ink-2)] block mb-1">2. Acción a 1 Clic Directa</span>
                  Cada alerta incluye su botón ejecutor (*"Lanzar Campaña"*, *"Revisar Borradores"*, *"Ver Contactos Stale"*).
                </div>

                <div className="p-3 rounded-[var(--r-m)] bg-[var(--surface)] border border-[var(--hair)]">
                  <span className="font-bold text-[var(--ink-2)] block mb-1">3. Protección por Roles de Seguridad</span>
                  Las cifras de caché, negociaciones de salas y borradores financieros quedan aislados para que solo el Mánager/Líder los
                  configure y reciba.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[var(--hair)] bg-[var(--surface)]/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendTestDigest}
              disabled={sendingTestDigest}
              className="px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--surface)] hover:bg-[var(--surface)] border border-[var(--hair)]/80 text-[var(--acc)] hover:text-[var(--acc)] text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{sendingTestDigest ? 'Enviando...' : 'Probar Email de Resumen'}</span>
            </button>
            {testDigestResult && <span className="text-xs font-mono text-[var(--ok)] animate-fade-in">{testDigestResult}</span>}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="cancel-alert-settings-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[var(--r-m)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>

            <button
              id="save-alert-settings-btn"
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-[var(--r-m)] bg-[var(--acc)] hover:bg-[var(--acc)] text-[var(--ink)] text-xs font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-95"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-[var(--ok)]" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Reglas</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
