import React, { useState, useEffect } from 'react';
import { 
  Bot, ShieldCheck, Sliders, CheckCircle2, AlertTriangle, X, Sparkles, 
  Send, FileEdit, Clock, Euro, Calendar, Lock, ShieldAlert, ArrowRight, Save, Loader2,
  Radio, Mail, FileText, Check, Globe, RefreshCw, Activity, Terminal, ExternalLink,
  ChevronRight, Volume2, Music, CheckSquare, Square, Unlink, HardDrive, AtSign, UserCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { BandSchedule } from '../../types';
import { initAuth, googleSignIn, logout } from '../../utils/gmail';
import { ModalPortal } from '../common/ModalPortal';

export type DispatchAutonomyLevel = 'draft_only' | 'scheduled_window' | 'autonomous_first_contact';
export type NegotiationDepthLevel = 'outreach_only' | 'filter_conditions' | 'advanced_negotiation';

export interface AgentAutonomyConfig {
  dispatchLevel: DispatchAutonomyLevel;
  negotiationDepth: NegotiationDepthLevel;
  minCacheThreshold: number;
  maxCacheThreshold: number;
  autoDeclineUnderMinCache: boolean;
  notifyOnEveryProposal: boolean;
  requireHumanForFinalSignOff: boolean;
  pitchTone?: string;
  bioSummary?: string;
  epkUrl?: string;
  agentSenderEmail?: string;
  agentSenderName?: string;
  agentReplyToEmail?: string;
  dispatchMode?: 'draft_gmail' | 'direct_send';
}

interface AgentAutonomySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bandName?: string;
  bandId?: string;
  currentUser?: any;
  isStitchLight?: boolean;
  initialConfig?: Partial<AgentAutonomyConfig>;
  onSaveConfig?: (config: AgentAutonomyConfig) => void;
  onOpenTemplatesSection?: () => void;
}

const TIMEZONES = [
  { value: 'Europe/Madrid', label: 'Europe/Madrid (Madrid, Barcelona, París) [UTC+1/UTC+2]' },
  { value: 'America/Mexico_City', label: 'America/Mexico_City (Ciudad de México) [UTC-6]' },
  { value: 'America/Bogota', label: 'America/Bogota (Bogotá, Lima, Quito) [UTC-5]' },
  { value: 'America/Argentina/Buenos_Aires', label: 'America/Argentina/Buenos_Aires (Buenos Aires) [UTC-3]' },
  { value: 'America/Santiago', label: 'America/Santiago (Santiago de Chile) [UTC-3/UTC-4]' },
  { value: 'America/New_York', label: 'America/New_York (Nueva York, Miami) [UTC-5/UTC-4]' },
  { value: 'Europe/London', label: 'Europe/London (Londres, Dublín, Lisboa) [UTC+0/UTC+1]' }
];

export const DAYS_OF_WEEK = [
  { id: 1, name: 'Lunes', short: 'Lun', initial: 'L', description: 'Planificación semanal de salas', recommended: false },
  { id: 2, name: 'Martes', short: 'Mar', initial: 'M', description: '⭐ Día Top (+45% respuestas)', recommended: true, badge: '🔥 Top Booking' },
  { id: 3, name: 'Miércoles', short: 'Mié', initial: 'X', description: '⭐ Día Top (Máxima atención de programadores)', recommended: true, badge: '🔥 Top Booking' },
  { id: 4, name: 'Jueves', short: 'Jue', initial: 'J', description: '⭐ Día Top (Cierre de fechas y agenda)', recommended: true, badge: '🔥 Top Booking' },
  { id: 5, name: 'Viernes', short: 'Vie', initial: 'V', description: 'Moderado (Salas en producción de directos)', recommended: false },
  { id: 6, name: 'Sábado', short: 'Sáb', initial: 'S', description: 'Bajo (Conciertos en vivo)', recommended: false },
  { id: 7, name: 'Domingo', short: 'Dom', initial: 'D', description: 'Bajo (Descanso y cierre)', recommended: false }
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const AgentAutonomySettingsModal: React.FC<AgentAutonomySettingsModalProps> = ({
  isOpen,
  onClose,
  bandName = 'Tu Banda',
  bandId = 'band-bakandeya',
  currentUser,
  isStitchLight = false,
  initialConfig,
  onSaveConfig,
  onOpenTemplatesSection
}) => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'autonomy' | 'email_dispatch' | 'schedules' | 'tone' | 'audit_logs'>('autonomy');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState<boolean>(false);

  // Cargar logs de auditoría
  const loadAuditLogs = async () => {
    setLoadingAuditLogs(true);
    try {
      const res = await fetch(`/api/agent-logs?band_id=${encodeURIComponent(bandId)}`);
      if (res.ok) {
        const json = await res.json();
        setAuditLogs(json.logs || []);
      }
    } catch (e) {
      console.warn("Error cargando logs de auditoría:", e);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit_logs') {
      loadAuditLogs();
    }
  }, [activeTab, bandId]);

  // RBAC Permission Check
  const isAdmin = !currentUser || currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.role === 'leader' || currentUser?.role === 'director';

  // State: Autonomy Settings
  const [config, setConfig] = useState<AgentAutonomyConfig>({
    dispatchLevel: initialConfig?.dispatchLevel || 'draft_only',
    negotiationDepth: initialConfig?.negotiationDepth || 'filter_conditions',
    minCacheThreshold: initialConfig?.minCacheThreshold || 300,
    maxCacheThreshold: initialConfig?.maxCacheThreshold || 800,
    autoDeclineUnderMinCache: initialConfig?.autoDeclineUnderMinCache ?? false,
    notifyOnEveryProposal: initialConfig?.notifyOnEveryProposal ?? true,
    requireHumanForFinalSignOff: true,
    pitchTone: initialConfig?.pitchTone || 'Cercano y Profesional (Indie/Rock)',
    bioSummary: initialConfig?.bioSummary || 'Proyecto de directo potente con fusión electrónica y ska/balkan.',
    epkUrl: initialConfig?.epkUrl || 'https://bandmanager.ai/epk/bakandeya',
    agentSenderEmail: initialConfig?.agentSenderEmail || '',
    agentSenderName: initialConfig?.agentSenderName || `${bandName} Management`,
    agentReplyToEmail: initialConfig?.agentReplyToEmail || '',
    dispatchMode: initialConfig?.dispatchMode || 'draft_gmail'
  });

  // State: Google OAuth connection
  const [googleOAuthState, setGoogleOAuthState] = useState<{
    connected: boolean;
    email?: string;
    displayName?: string;
    photoURL?: string;
  } | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);

  // State: Band Schedules (Lector & Enviador)
  const [timezone, setTimezone] = useState<string>('Europe/Madrid');
  const [horasLector, setHorasLector] = useState<number[]>([8, 12, 16, 20]);
  const [horasEnviador, setHorasEnviador] = useState<number[]>([9, 10, 11, 12, 13]);
  const [diasEnviador, setDiasEnviador] = useState<number[]>([2, 3, 4]); // Default: Martes, Miércoles, Jueves (Top Booking)
  const [diasLector, setDiasLector] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]); // Default: Toda la semana

  // Loading & Feedback
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Google OAuth Auth State Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setGoogleOAuthState({
          connected: true,
          email: user.email || undefined,
          displayName: user.displayName || undefined,
          photoURL: user.photoURL || undefined
        });
      },
      () => {
        setGoogleOAuthState({ connected: false });
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleConnectGoogleOAuth = async () => {
    setOauthLoading(true);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setGoogleOAuthState({
          connected: true,
          email: res.user.email || undefined,
          displayName: res.user.displayName || undefined,
          photoURL: res.user.photoURL || undefined
        });
        // Prefill sender email if empty
        if (!config.agentSenderEmail && res.user.email) {
          setConfig(prev => ({ ...prev, agentSenderEmail: res.user.email || '' }));
        }
        setStatusFeedback('Cuenta Google conectada para el Agente Enviador.');
        setTimeout(() => setStatusFeedback(null), 3500);
      }
    } catch (err: any) {
      console.error('Error al conectar Google OAuth:', err);
      alert('No se pudo conectar con Google: ' + (err.message || 'Error desconocido'));
    } finally {
      setOauthLoading(false);
    }
  };

  const handleDisconnectGoogleOAuth = async () => {
    setOauthLoading(true);
    try {
      await logout();
      setGoogleOAuthState({ connected: false });
      setStatusFeedback('Cuenta Google desconectada.');
      setTimeout(() => setStatusFeedback(null), 3000);
    } catch (err: any) {
      console.error('Error al desconectar Google:', err);
    } finally {
      setOauthLoading(false);
    }
  };

  // Load existing configuration from server
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setIsLoading(true);
    setStatusFeedback(null);

    const loadAllConfigs = async () => {
      try {
        const targetBand = bandId || currentUser?.band_id || 'band-bakandeya';

        // 1. Fetch Autonomy Config
        const serverAutonomy = await api.getAutonomyConfig().catch(() => null);
        if (isMounted && serverAutonomy) {
          setConfig(prev => ({
            ...prev,
            dispatchLevel: serverAutonomy.dispatchLevel || prev.dispatchLevel,
            negotiationDepth: serverAutonomy.negotiationDepth || prev.negotiationDepth,
            minCacheThreshold: serverAutonomy.minCacheThreshold ?? prev.minCacheThreshold,
            maxCacheThreshold: serverAutonomy.maxCacheThreshold ?? prev.maxCacheThreshold,
            autoDeclineUnderMinCache: !!serverAutonomy.autoDeclineUnderMinCache,
            notifyOnEveryProposal: serverAutonomy.notifyOnEveryProposal !== false,
            pitchTone: serverAutonomy.pitchTone || prev.pitchTone,
            bioSummary: serverAutonomy.bioSummary || prev.bioSummary,
            epkUrl: serverAutonomy.epkUrl || prev.epkUrl,
            agentSenderEmail: serverAutonomy.agentSenderEmail || prev.agentSenderEmail,
            agentSenderName: serverAutonomy.agentSenderName || prev.agentSenderName,
            agentReplyToEmail: serverAutonomy.agentReplyToEmail || prev.agentReplyToEmail,
            dispatchMode: serverAutonomy.dispatchMode || prev.dispatchMode,
            requireHumanForFinalSignOff: true
          }));
        }

        // 2. Fetch Band Data to prefill email if missing
        try {
          const appState = await api.getAppData().catch(() => null);
          if (isMounted && appState?.bands) {
            const currentBandObj = appState.bands.find(b => b.id === targetBand) || appState.bands[0];
            if (currentBandObj) {
              const defaultEmail = currentBandObj.email || currentBandObj.contacto_booking?.email;
              if (defaultEmail) {
                setConfig(prev => ({
                  ...prev,
                  agentSenderEmail: prev.agentSenderEmail || defaultEmail,
                  agentReplyToEmail: prev.agentReplyToEmail || defaultEmail
                }));
              }
            }
          }
        } catch (e) {
          // ignore
        }

        // 3. Fetch Band Schedule (Lector & Enviador crons)
        const serverSchedule: BandSchedule = await api.getBandSchedule(targetBand).catch(() => null);
        if (isMounted && serverSchedule) {
          if (serverSchedule.timezone) setTimezone(serverSchedule.timezone);
          if (Array.isArray(serverSchedule.horas_lector)) {
            setHorasLector(serverSchedule.horas_lector.map(Number));
          }
          if (Array.isArray(serverSchedule.horas_enviador)) {
            setHorasEnviador(serverSchedule.horas_enviador.map(Number));
          }
          if (Array.isArray(serverSchedule.dias_enviador) && serverSchedule.dias_enviador.length > 0) {
            setDiasEnviador(serverSchedule.dias_enviador.map(Number));
          }
          if (Array.isArray(serverSchedule.dias_lector) && serverSchedule.dias_lector.length > 0) {
            setDiasLector(serverSchedule.dias_lector.map(Number));
          }
        }
      } catch (err) {
        console.warn('Advertencia cargando configuraciones de agentes:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadAllConfigs();
    return () => { isMounted = false; };
  }, [isOpen, bandId, currentUser?.band_id]);

  if (!isOpen) return null;

  // Toggle Hour & Day Handlers
  const toggleHoraLector = (hour: number) => {
    if (!isAdmin) return;
    setHorasLector(prev => 
      prev.includes(hour) ? prev.filter(h => h !== hour) : [...prev, hour].sort((a, b) => a - b)
    );
  };

  const toggleHoraEnviador = (hour: number) => {
    if (!isAdmin) return;
    setHorasEnviador(prev => 
      prev.includes(hour) ? prev.filter(h => h !== hour) : [...prev, hour].sort((a, b) => a - b)
    );
  };

  const toggleDiaEnviador = (dayId: number) => {
    if (!isAdmin) return;
    setDiasEnviador(prev =>
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId].sort((a, b) => a - b)
    );
  };

  const toggleDiaLector = (dayId: number) => {
    if (!isAdmin) return;
    setDiasLector(prev =>
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId].sort((a, b) => a - b)
    );
  };

  // Schedule Presets & AI Day Suggestions
  const applyPresetRecommendedBooking = () => {
    if (!isAdmin) return;
    setDiasEnviador([2, 3, 4]); // Martes, Miércoles, Jueves
    setHorasEnviador([10, 11, 12, 13]); // Horario dorado matutino
    setDiasLector([1, 2, 3, 4, 5, 6, 7]);
    setHorasLector([9, 13, 17, 21]);
    setStatusFeedback('🎯 Sugerencia IA Aplicada: Martes, Miércoles y Jueves (10:00 a 14:00). Máxima tasa de respuesta.');
    setTimeout(() => setStatusFeedback(null), 3500);
  };

  const applyPresetCommercial = () => {
    if (!isAdmin) return;
    setDiasEnviador([1, 2, 3, 4, 5]);
    setHorasEnviador([9, 10, 11, 12, 13, 14]);
    setDiasLector([1, 2, 3, 4, 5, 6, 7]);
    setHorasLector([8, 12, 16, 20]);
    setStatusFeedback('🏢 Preset Comercial Aplicado: Lunes a Viernes de 09:00 a 14:00.');
    setTimeout(() => setStatusFeedback(null), 3000);
  };

  const applyPresetAllDay = () => {
    if (!isAdmin) return;
    setDiasEnviador([1, 2, 3, 4, 5, 6, 7]);
    setHorasEnviador([9, 11, 13, 16, 18, 20]);
    setDiasLector([1, 2, 3, 4, 5, 6, 7]);
    setHorasLector([8, 10, 12, 14, 16, 18, 20, 22]);
    setStatusFeedback('⚡ Preset Intensivo Aplicado: Todos los días con múltiples ventanas.');
    setTimeout(() => setStatusFeedback(null), 3000);
  };

  // Save All Settings
  const handleSave = async () => {
    if (!isAdmin) return;
    setIsSaving(true);
    setStatusFeedback(null);
    try {
      const targetBand = bandId || currentUser?.band_id || 'band-bakandeya';

      // 1. Persist Autonomy
      localStorage.setItem('bakandeya_agent_autonomy', JSON.stringify(config));
      window.dispatchEvent(new Event('autonomy-settings-changed'));
      await api.updateAutonomyConfig({
        ...config,
        band_id: targetBand
      });

      // 2. Persist Schedule
      await api.saveBandSchedule({
        band_id: targetBand,
        timezone,
        horas_lector: horasLector,
        horas_enviador: horasEnviador,
        dias_enviador: diasEnviador,
        dias_lector: diasLector
      });

      if (onSaveConfig) onSaveConfig(config);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (e) {
      console.error('Error guardando configuración unificada de agentes:', e);
      alert('Error guardando los ajustes en el servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto overscroll-contain">
        <div className={`border rounded-2xl w-full max-w-4xl max-h-[88vh] md:max-h-[85vh] overflow-hidden shadow-2xl flex flex-col my-auto animate-in zoom-in-95 duration-200 ${
          isStitchLight 
            ? 'bg-white border-slate-200 text-slate-900' 
            : 'bg-[#181716] border-amber-500/30 text-zinc-100'
        }`}>
        
        {/* Modal Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
          isStitchLight ? 'bg-slate-50 border-slate-200' : 'bg-[#141312] border-neutral-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold font-display uppercase tracking-wider text-zinc-100">
                  Panel de Control de Agentes IA
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
                  {bandName}
                </span>
                {isAdmin ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-bold">
                    <ShieldCheck className="w-3 h-3" /> Mánager / Admin
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-700/50 text-zinc-400 border border-zinc-600 flex items-center gap-1 font-bold">
                    <Lock className="w-3 h-3" /> Modo Lectura (Músico)
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 font-sans mt-0.5">
                Centraliza la autonomía de envío, horarios comerciales y pautas de redacción para los agentes de Supabase.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`flex border-b px-4 sm:px-5 gap-2 shrink-0 overflow-x-auto ${
          isStitchLight ? 'bg-slate-100/60 border-slate-200' : 'bg-neutral-900/60 border-neutral-800'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('autonomy')}
            className={`py-3 px-3.5 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'autonomy'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>1. Autonomía & Líneas Rojas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('email_dispatch')}
            className={`py-3 px-3.5 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'email_dispatch'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-zinc-200'
            }`}
          >
            <Mail className="w-4 h-4 text-sky-400" />
            <span>2. Email & Buzón de Agentes</span>
            {googleOAuthState?.connected && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-sm"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schedules')}
            className={`py-3 px-3.5 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'schedules'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>3. Horarios & Workflows</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tone')}
            className={`py-3 px-3.5 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'tone'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>4. Tono & Identidad</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit_logs')}
            className={`py-3 px-3.5 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'audit_logs'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>5. Auditoría & Trazabilidad</span>
            {auditLogs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 font-mono">
                {auditLogs.length}
              </span>
            )}
          </button>
        </div>

        {/* Read-Only Banner for Non-Admins */}
        {!isAdmin && (
          <div className="p-3 bg-neutral-900 border-b border-neutral-800 text-amber-300 text-xs flex items-center gap-2 px-5">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Estás en modo <strong>Solo Lectura</strong>. Solo los miembros con rol de Administrador o Mánager pueden modificar los parámetros de los agentes.
            </span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* TAB 1: AUTONOMÍA & LÍNEAS ROJAS */}
          {activeTab === 'autonomy' && (
            <div className="space-y-6">
              {/* REGLA NO NEGOCIABLE NOTICE */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 leading-relaxed">
                  <strong className="font-bold text-amber-300">Garantía de Control Humano (Cierre Inviolable):</strong>
                  <p className="text-neutral-300 text-[11px]">
                    Incluso con la máxima autonomía, <strong className="text-white">ningún trato o contrato se da por cerrado ni ningún email final de confirmación se envía sin la validación previa del mánager</strong> o un miembro de {bandName}.
                  </p>
                </div>
              </div>

              {/* 1. MODO DE ENVÍO */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Send className="w-4 h-4" /> 1. Autonomía de Envío (Modo de Despacho)
                  </h4>
                  <span className="text-[10px] text-neutral-500 font-mono">¿Cuándo se envían los correos?</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Draft Only */}
                  <button
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => setConfig({ ...config, dispatchLevel: 'draft_only' })}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
                      !isAdmin ? 'opacity-80 cursor-default' : 'cursor-pointer'
                    } ${
                      config.dispatchLevel === 'draft_only'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                        : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-zinc-200 hover:bg-neutral-900'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <FileEdit className="w-5 h-5 text-amber-400" />
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                          100% Manual
                        </span>
                      </div>
                      <div>
                        <h5 className="text-sm font-bold font-display text-zinc-100">Borrador & Aprobación</h5>
                        <p className="text-[11px] text-neutral-400 font-sans mt-1 leading-snug">
                          Todos los correos generados se guardan como borrador en la pestaña <strong className="text-zinc-200">Pendiente de Aprobación</strong>. Requiere clic directo.
                        </p>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono font-semibold text-amber-400/90 pt-2 border-t border-neutral-800/80">
                      Ideal para empezar con la app.
                    </div>
                  </button>

                  {/* Scheduled Window */}
                  <button
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => setConfig({ ...config, dispatchLevel: 'scheduled_window' })}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
                      !isAdmin ? 'opacity-80 cursor-default' : 'cursor-pointer'
                    } ${
                      config.dispatchLevel === 'scheduled_window'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                        : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-zinc-200 hover:bg-neutral-900'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Clock className="w-5 h-5 text-amber-400" />
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold">
                          Ventana Horaria
                        </span>
                      </div>
                      <div>
                        <h5 className="text-sm font-bold font-display text-zinc-100">Envío en Horario Comercial</h5>
                        <p className="text-[11px] text-neutral-400 font-sans mt-1 leading-snug">
                          El agente prepara la respuesta y avisa. Si en 3 horas no la cancelas, el sistema la envía automáticamente dentro de las horas configuradas.
                        </p>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono font-semibold text-sky-400/90 pt-2 border-t border-neutral-800/80">
                      Agiliza respuestas sin bloquear.
                    </div>
                  </button>

                  {/* Autonomous First Contact */}
                  <button
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => setConfig({ ...config, dispatchLevel: 'autonomous_first_contact' })}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
                      !isAdmin ? 'opacity-80 cursor-default' : 'cursor-pointer'
                    } ${
                      config.dispatchLevel === 'autonomous_first_contact'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                        : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-zinc-200 hover:bg-neutral-900'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Bot className="w-5 h-5 text-amber-400" />
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                          Autónomo Inicial
                        </span>
                      </div>
                      <div>
                        <h5 className="text-sm font-bold font-display text-zinc-100">Pitch Inicial Automático</h5>
                        <p className="text-[11px] text-neutral-400 font-sans mt-1 leading-snug">
                          El primer contacto de presentación (Scout) se envía directamente a salas compatibles. Las respuestas posteriores pasan a borrador.
                        </p>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono font-semibold text-emerald-400/90 pt-2 border-t border-neutral-800/80">
                      Máxima velocidad de prospección.
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. ALCANCE DE NEGOCIACIÓN */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Bot className="w-4 h-4" /> 2. Alcance de Negociación del Mánager AI
                  </h4>
                  <span className="text-[10px] text-neutral-500 font-mono">¿Qué temas puede tratar el agente?</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => setConfig({ ...config, negotiationDepth: 'outreach_only' })}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
                      !isAdmin ? 'opacity-80 cursor-default' : 'cursor-pointer'
                    } ${
                      config.negotiationDepth === 'outreach_only'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                        : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-zinc-200 hover:bg-neutral-900'
                    }`}
                  >
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono uppercase tracking-widest font-bold text-amber-400">Nivel A</span>
                      <h5 className="text-sm font-bold font-display text-zinc-100">Solo "Llamada a la puerta"</h5>
                      <p className="text-[11px] text-neutral-400 font-sans leading-snug">
                        El agente solo saluda y envía el Dossier EPK. En cuanto la sala responde con dudas de precio o fecha, el bot se detiene.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => setConfig({ ...config, negotiationDepth: 'filter_conditions' })}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
                      !isAdmin ? 'opacity-80 cursor-default' : 'cursor-pointer'
                    } ${
                      config.negotiationDepth === 'filter_conditions'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                        : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-zinc-200 hover:bg-neutral-900'
                    }`}
                  >
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono uppercase tracking-widest font-bold text-sky-400">Nivel B</span>
                      <h5 className="text-sm font-bold font-display text-zinc-100">Filtro de Requisitos & Fechas</h5>
                      <p className="text-[11px] text-neutral-400 font-sans leading-snug">
                        Responde sobre disponibilidad de calendario y rider técnico. Confirma si la sala ofrece taquilla/caché dentro de tus límites.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => setConfig({ ...config, negotiationDepth: 'advanced_negotiation' })}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
                      !isAdmin ? 'opacity-80 cursor-default' : 'cursor-pointer'
                    } ${
                      config.negotiationDepth === 'advanced_negotiation'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                        : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-zinc-200 hover:bg-neutral-900'
                    }`}
                  >
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono uppercase tracking-widest font-bold text-purple-400">Nivel C</span>
                      <h5 className="text-sm font-bold font-display text-zinc-100">Negociador hasta Pre-Cierre</h5>
                      <p className="text-[11px] text-neutral-400 font-sans leading-snug">
                        Propone fechas alternativas ante solapamientos y formula contraofertas en tu rango de caché. Deja el trato listo para tu firma.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* 3. PARÁMETROS ECONÓMICOS */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-4">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Euro className="w-4 h-4" /> 3. Umbrales Económicos de Negociación para {bandName}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-neutral-400 font-semibold block">
                      Caché Mínimo Aceptable (€)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        disabled={!isAdmin}
                        value={config.minCacheThreshold}
                        onChange={(e) => setConfig({ ...config, minCacheThreshold: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-zinc-100 text-xs font-mono focus:border-amber-500 focus:outline-none disabled:opacity-60"
                        placeholder="300"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-neutral-500 font-mono">EUR</span>
                    </div>
                    <p className="text-[10px] text-neutral-500">
                      Si una sala ofrece menos de este importe, el agente no aceptará sin tu validación.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-neutral-400 font-semibold block">
                      Caché Objetivo / Ideal (€)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        disabled={!isAdmin}
                        value={config.maxCacheThreshold}
                        onChange={(e) => setConfig({ ...config, maxCacheThreshold: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-zinc-100 text-xs font-mono focus:border-amber-500 focus:outline-none disabled:opacity-60"
                        placeholder="800"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-neutral-500 font-mono">EUR</span>
                    </div>
                    <p className="text-[10px] text-neutral-500">
                      Cifra inicial que el agente utilizará en la primera propuesta de contratación.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-neutral-300 font-sans">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={config.autoDeclineUnderMinCache}
                      onChange={(e) => setConfig({ ...config, autoDeclineUnderMinCache: e.target.checked })}
                      className="rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500 disabled:opacity-60"
                    />
                    <span>Rechazar amablemente si la sala no llega al caché mínimo</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-neutral-300 font-sans">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={config.notifyOnEveryProposal}
                      onChange={(e) => setConfig({ ...config, notifyOnEveryProposal: e.target.checked })}
                      className="rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500 disabled:opacity-60"
                    />
                    <span>Notificar en el panel cada vez que se prepare un nuevo correo</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EMAIL & BUZÓN DE DESPACHO */}
          {activeTab === 'email_dispatch' && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border border-sky-500/30 text-sky-300 text-xs flex items-start gap-3">
                <Mail className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div className="space-y-1 leading-relaxed">
                  <strong className="font-bold text-sky-200">Configuración Central de Email para Agentes IA:</strong>
                  <p className="text-neutral-300 text-[11px]">
                    Aquí defines el buzón oficial y la identidad con la que los agentes redactarán propuestas, crearán borradores en Gmail y gestionarán las respuestas con las salas y promotores.
                  </p>
                </div>
              </div>

              {/* 1. Remitente e Identidad del Agente */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-4">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <AtSign className="w-4 h-4" /> 1. Remitente Oficial de la Banda para los Agentes
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-neutral-400 font-semibold flex items-center justify-between">
                      <span>Email del Agente / Remitente</span>
                      <span className="text-[10px] text-amber-400/80 font-mono">Obligatorio</span>
                    </label>
                    <input
                      type="email"
                      disabled={!isAdmin}
                      value={config.agentSenderEmail || ''}
                      onChange={(e) => setConfig({ ...config, agentSenderEmail: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-zinc-100 text-xs font-mono focus:border-amber-500 focus:outline-none disabled:opacity-60"
                      placeholder="ej: booking@tubanda.com o mibanda@gmail.com"
                    />
                    <p className="text-[10px] text-neutral-500">
                      Dirección de correo remitente que aparecerá en los encabezados y firma generada por la IA.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-neutral-400 font-semibold block">
                      Nombre / Cargo del Remitente
                    </label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={config.agentSenderName || ''}
                      onChange={(e) => setConfig({ ...config, agentSenderName: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-zinc-100 text-xs font-sans focus:border-amber-500 focus:outline-none disabled:opacity-60"
                      placeholder={`ej: ${bandName} Booking & Management`}
                    />
                    <p className="text-[10px] text-neutral-500">
                      Nombre de la persona o departamento que firma las propuestas (ej: Diego - Booking {bandName}).
                    </p>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-mono text-neutral-400 font-semibold block">
                      Email de Respuesta (Reply-To) (Opcional)
                    </label>
                    <input
                      type="email"
                      disabled={!isAdmin}
                      value={config.agentReplyToEmail || ''}
                      onChange={(e) => setConfig({ ...config, agentReplyToEmail: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-zinc-100 text-xs font-mono focus:border-amber-500 focus:outline-none disabled:opacity-60"
                      placeholder="ej: contacto@tubanda.com (si es diferente al remitente)"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Conexión Google OAuth 2.0 (Gmail / Borradores) */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <Mail className="w-4 h-4" /> 2. Conexión Google OAuth 2.0 (Gmail & Drive)
                  </h4>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    googleOAuthState?.connected
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                  }`}>
                    {googleOAuthState?.connected ? '✓ Google OAuth Activo' : 'No Conectado'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-3">
                  {googleOAuthState?.connected ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {googleOAuthState.photoURL ? (
                            <img src={googleOAuthState.photoURL} alt="Google Avatar" className="w-9 h-9 rounded-full ring-2 ring-emerald-500/40" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs border border-sky-500/30">
                              G
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-xs text-zinc-100">{googleOAuthState.displayName || googleOAuthState.email}</p>
                            <p className="text-[11px] font-mono text-neutral-400 truncate max-w-[240px]">{googleOAuthState.email}</p>
                          </div>
                        </div>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={handleDisconnectGoogleOAuth}
                            disabled={oauthLoading}
                            className="px-2.5 py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono border border-rose-500/20"
                            title="Desconectar cuenta Google de los agentes"
                          >
                            <Unlink className="w-3.5 h-3.5" />
                            <span>Desconectar</span>
                          </button>
                        )}
                      </div>

                      <div className="pt-2 border-t border-neutral-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px] font-mono text-neutral-400">
                        <div className="flex items-center gap-1 text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                          <span>Gmail Borradores</span>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                          <span>Envíos Aprobados</span>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                          <span>Lector Bandeja</span>
                        </div>
                        <div className="flex items-center gap-1 text-sky-400">
                          <HardDrive className="w-3.5 h-3.5" />
                          <span>Tokens Seguros</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                        Conecta la cuenta de Gmail de la banda para que los agentes puedan preparar borradores listos para enviar en tu carpeta de Gmail, sincronizar hilos de conversación y despachar correos autorizados.
                      </p>
                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={handleConnectGoogleOAuth}
                          disabled={oauthLoading}
                          className="w-full py-2.5 px-4 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                        >
                          {oauthLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-sky-300" />
                              <span>Conectando con Google...</span>
                            </>
                          ) : (
                            <>
                              <Mail className="w-4 h-4 text-sky-400" />
                              <span>Conectar Cuenta de Google (Gmail & Drive)</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <p className="text-[11px] text-amber-400/80 font-mono">Solo administradores pueden vincular la cuenta de Google.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Modo de Despacho de Correo */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-4">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Send className="w-4 h-4" /> 3. Modo de Despacho del Agente Enviador
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => setConfig({ ...config, dispatchMode: 'draft_gmail' })}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
                      !isAdmin ? 'opacity-80 cursor-default' : 'cursor-pointer'
                    } ${
                      config.dispatchMode !== 'direct_send'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                        : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-zinc-200 hover:bg-neutral-900'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono uppercase tracking-widest font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          Recomendado
                        </span>
                        <FileEdit className="w-4 h-4 text-amber-400" />
                      </div>
                      <h5 className="text-sm font-bold font-display text-zinc-100">Crear Borrador en Gmail</h5>
                      <p className="text-[11px] text-neutral-400 font-sans leading-snug">
                        El agente prepara el correo en la carpeta "Borradores" de tu Gmail con sala, asunto, pitch y dossier adjunto. Puedes abrirlo, darle tu toque y pulsar Enviar desde Gmail o desde el CRM.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => setConfig({ ...config, dispatchMode: 'direct_send' })}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
                      !isAdmin ? 'opacity-80 cursor-default' : 'cursor-pointer'
                    } ${
                      config.dispatchMode === 'direct_send'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                        : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-zinc-200 hover:bg-neutral-900'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono uppercase tracking-widest font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                          Directo
                        </span>
                        <Send className="w-4 h-4 text-sky-400" />
                      </div>
                      <h5 className="text-sm font-bold font-display text-zinc-100">Envío Directo tras Aprobación</h5>
                      <p className="text-[11px] text-neutral-400 font-sans leading-snug">
                        Tras pulsar "Aprobar Propuesta" o "Aprobar Respuesta" en el CRM, el agente despacha el correo directamente al email de la sala respetando las ventanas horarias comerciales.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: HORARIOS & WORKFLOWS */}
          {activeTab === 'schedules' && (
            <div className="space-y-6">
              
              {/* Presets & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono font-bold text-zinc-200">Ventanas de Ejecución Comercial:</span>
                </div>
                {isAdmin && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={applyPresetRecommendedBooking}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-[11px] font-mono font-black border border-amber-400 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-sm shadow-amber-500/20"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>🌟 Sugerir Mejores Días (M-X-J)</span>
                    </button>
                    <button
                      type="button"
                      onClick={applyPresetCommercial}
                      className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-[11px] font-mono font-bold border border-neutral-700 transition-all cursor-pointer active:scale-95"
                    >
                      🏢 Laborables L-V
                    </button>
                    <button
                      type="button"
                      onClick={applyPresetAllDay}
                      className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 text-[11px] font-mono transition-all cursor-pointer active:scale-95"
                    >
                      ⚡ Toda la Semana (7d)
                    </button>
                  </div>
                )}
              </div>

              {/* AI Best Days Intelligence Card */}
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-amber-400">
                    <Sparkles className="w-4 h-4" />
                    <span>Inteligencia de Booking: ¿Por qué Martes, Miércoles y Jueves?</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
                    +45% Tasa de Respuesta
                  </span>
                </div>
                <p className="leading-relaxed text-neutral-300 text-[11px]">
                  En la industria del directo, los programadores de salas y festivales dedican el <strong>martes a jueves (10:00 - 14:00)</strong> a cerrar contrataciones. Los lunes gestionan incidencias del fin de semana y los viernes/sábados están en montaje de conciertos en vivo.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[10px]">
                  <div className="p-2 rounded-lg bg-neutral-900/80 border border-neutral-800 text-neutral-300 flex flex-col gap-0.5">
                    <span className="text-amber-400 font-bold">🔥 Martes a Jueves</span>
                    <span className="text-neutral-400 font-sans text-[10px]">Ventana dorada de contratación y respuesta.</span>
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-900/80 border border-neutral-800 text-neutral-300 flex flex-col gap-0.5">
                    <span className="text-sky-400 font-bold">⏰ 10:00 a 14:00</span>
                    <span className="text-neutral-400 font-sans text-[10px]">Franja de máxima apertura y lectura de email.</span>
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-900/80 border border-neutral-800 text-neutral-300 flex flex-col gap-0.5">
                    <span className="text-emerald-400 font-bold">🛡️ Smart Gate Supabase</span>
                    <span className="text-neutral-400 font-sans text-[10px]">Los agentes solo envían en los días/horas elegidos.</span>
                  </div>
                </div>
              </div>

              {/* Timezone Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-400 font-semibold flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-amber-400" /> Zona Horaria de la Banda
                </label>
                <select
                  disabled={!isAdmin}
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-zinc-100 text-xs font-mono focus:border-amber-500 focus:outline-none disabled:opacity-60 cursor-pointer"
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>

              {/* DÍAS Y HORAS ENVIADOR */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-4">
                {/* Header Enviador */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-amber-400" />
                    <div>
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-100">
                        Agente Enviador (Días y Horas de Envío de Pitches)
                      </h4>
                      <p className="text-[10px] text-neutral-400">
                        Días y horas permitidas para despachar correos aprobados a salas de conciertos.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
                      {diasEnviador.length} días · {horasEnviador.length} horas
                    </span>
                  </div>
                </div>

                {/* Días de la semana Selector (Enviador) */}
                <div className="space-y-2 pt-1 border-t border-neutral-900">
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" /> Días de la Semana Habilitados:
                    </span>
                    {isAdmin && (
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setDiasEnviador([2, 3, 4])}
                          className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-all cursor-pointer font-bold"
                        >
                          🔥 Solo Top (M, X, J)
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiasEnviador([1, 2, 3, 4, 5])}
                          className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 transition-all cursor-pointer"
                        >
                          L-V
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiasEnviador([1, 2, 3, 4, 5, 6, 7])}
                          className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 transition-all cursor-pointer"
                        >
                          Todos
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiasEnviador([])}
                          className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 transition-all cursor-pointer"
                        >
                          Limpiar
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {DAYS_OF_WEEK.map((day) => {
                      const isSelected = diasEnviador.includes(day.id);
                      return (
                        <button
                          key={`dia-enviador-${day.id}`}
                          type="button"
                          disabled={!isAdmin}
                          onClick={() => toggleDiaEnviador(day.id)}
                          className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all ${
                            !isAdmin ? 'cursor-default' : 'cursor-pointer active:scale-95'
                          } ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-sm shadow-amber-500/10 ring-1 ring-amber-500/30'
                              : 'bg-neutral-900/90 border-neutral-800 text-neutral-400 hover:text-zinc-200 hover:bg-neutral-900'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className={`text-xs font-mono font-bold ${isSelected ? 'text-amber-300' : 'text-zinc-300'}`}>
                              {day.short}
                            </span>
                            <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-400' : 'bg-neutral-700'}`} />
                          </div>
                          <span className="text-[11px] font-sans font-medium leading-tight truncate">
                            {day.name}
                          </span>
                          {day.recommended && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold self-start mt-0.5">
                              {day.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Horas Enviador Grid */}
                <div className="space-y-2 pt-2 border-t border-neutral-900">
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> Horas del Día Habilitadas:
                    </span>
                    {isAdmin && (
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setHorasEnviador([10, 11, 12, 13])}
                          className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-all cursor-pointer font-bold"
                        >
                          🔥 Mañana (10-14h)
                        </button>
                        <button
                          type="button"
                          onClick={() => setHorasEnviador([9, 10, 11, 12, 13, 14, 15, 16, 17, 18])}
                          className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 transition-all cursor-pointer"
                        >
                          Jornada Completa
                        </button>
                        <button
                          type="button"
                          onClick={() => setHorasEnviador([])}
                          className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 transition-all cursor-pointer"
                        >
                          Limpiar
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 pt-1">
                    {HOURS.map((hour) => {
                      const isSelected = horasEnviador.includes(hour);
                      const isPrimeTime = hour >= 10 && hour <= 13;
                      const formatted = `${String(hour).padStart(2, '0')}:00`;
                      return (
                        <button
                          key={`enviador-${hour}`}
                          type="button"
                          disabled={!isAdmin}
                          onClick={() => toggleHoraEnviador(hour)}
                          className={`p-2 rounded-lg text-center font-mono text-[11px] font-bold transition-all ${
                            !isAdmin ? 'cursor-default' : 'cursor-pointer active:scale-95'
                          } ${
                            isSelected
                              ? 'bg-amber-500 text-stone-950 shadow-sm font-black'
                              : isPrimeTime
                              ? 'bg-neutral-900 border border-amber-500/30 text-amber-300/90 hover:text-white hover:bg-neutral-800'
                              : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                          }`}
                        >
                          {formatted}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* DÍAS Y HORAS LECTOR */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-4">
                {/* Header Lector */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-sky-400" />
                    <div>
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-100">
                        Agente Lector (Días y Frecuencia de Lectura de Bandeja)
                      </h4>
                      <p className="text-[10px] text-neutral-400">
                        Frecuencia en la que el bot sincroniza respuestas y actualiza el hilo en Supabase.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30 font-bold">
                    {diasLector.length} días · {horasLector.length} chequeos / día
                  </span>
                </div>

                {/* Días Lector Selector */}
                <div className="space-y-2 pt-1 border-t border-neutral-900">
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-sky-400" /> Días de Revisión de Correos:
                    </span>
                    {isAdmin && (
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setDiasLector([1, 2, 3, 4, 5, 6, 7])}
                          className="px-2 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 transition-all cursor-pointer font-bold"
                        >
                          Toda la Semana (7 días)
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiasLector([1, 2, 3, 4, 5])}
                          className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 transition-all cursor-pointer"
                        >
                          Solo L-V
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {DAYS_OF_WEEK.map((day) => {
                      const isSelected = diasLector.includes(day.id);
                      return (
                        <button
                          key={`dia-lector-${day.id}`}
                          type="button"
                          disabled={!isAdmin}
                          onClick={() => toggleDiaLector(day.id)}
                          className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all ${
                            !isAdmin ? 'cursor-default' : 'cursor-pointer active:scale-95'
                          } ${
                            isSelected
                              ? 'bg-sky-500/15 border-sky-500 text-sky-200 shadow-sm shadow-sky-500/10 ring-1 ring-sky-500/30'
                              : 'bg-neutral-900/90 border-neutral-800 text-neutral-400 hover:text-zinc-200 hover:bg-neutral-900'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className={`text-xs font-mono font-bold ${isSelected ? 'text-sky-300' : 'text-zinc-300'}`}>
                              {day.short}
                            </span>
                            <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-sky-400' : 'bg-neutral-700'}`} />
                          </div>
                          <span className="text-[11px] font-sans font-medium leading-tight truncate">
                            {day.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Horas Lector Grid */}
                <div className="space-y-2 pt-2 border-t border-neutral-900">
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-sky-400" /> Horas de Revisión:
                    </span>
                    {isAdmin && (
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setHorasLector([9, 13, 17, 21])}
                          className="px-2 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 transition-all cursor-pointer font-bold"
                        >
                          Cada 4h (9, 13, 17, 21h)
                        </button>
                        <button
                          type="button"
                          onClick={() => setHorasLector([8, 10, 12, 14, 16, 18, 20, 22])}
                          className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 transition-all cursor-pointer"
                        >
                          Cada 2h
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 pt-1">
                    {HOURS.map((hour) => {
                      const isSelected = horasLector.includes(hour);
                      const formatted = `${String(hour).padStart(2, '0')}:00`;
                      return (
                        <button
                          key={`lector-${hour}`}
                          type="button"
                          disabled={!isAdmin}
                          onClick={() => toggleHoraLector(hour)}
                          className={`p-2 rounded-lg text-center font-mono text-[11px] font-bold transition-all ${
                            !isAdmin ? 'cursor-default' : 'cursor-pointer active:scale-95'
                          } ${
                            isSelected
                              ? 'bg-sky-500 text-stone-950 shadow-sm font-black'
                              : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                          }`}
                        >
                          {formatted}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Monitor de Estado de Agentes de Supabase (GitHub Actions) */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Activity className="w-4 h-4" /> Estado en Tiempo Real de Agentes (Supabase Engine)
                  </h4>
                  <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                    Sistemas Operativos
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-neutral-900/90 border border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <div>
                        <div className="text-xs font-mono font-bold text-zinc-100">Agente Scout (Búsqueda)</div>
                        <div className="text-[10px] text-neutral-400 font-sans">Rastreo de salas y contactos</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 font-bold">
                      Listo
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-neutral-900/90 border border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <div>
                        <div className="text-xs font-mono font-bold text-zinc-100">Agente Redactor (Gemini)</div>
                        <div className="text-[10px] text-neutral-400 font-sans">Generador de propuestas y pitches</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 font-bold">
                      Activo
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-neutral-900/90 border border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${horasEnviador.length > 0 && diasEnviador.length > 0 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      <div>
                        <div className="text-xs font-mono font-bold text-zinc-100">Agente Enviador (Gmail API)</div>
                        <div className="text-[10px] text-neutral-400 font-sans">
                          {diasEnviador.length}d/sem · {horasEnviador.length}h/día
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded font-bold">
                      {horasEnviador.length > 0 && diasEnviador.length > 0 ? 'Programado' : 'Pausado'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-neutral-900/90 border border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
                      <div>
                        <div className="text-xs font-mono font-bold text-zinc-100">Agente Lector (Clasificador)</div>
                        <div className="text-[10px] text-neutral-400 font-sans">
                          {diasLector.length}d/sem · {horasLector.length} revisiones/día
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-sky-300 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/60 font-bold">
                      En Escucha
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: TONO & IDENTIDAD */}
          {activeTab === 'tone' && (
            <div className="space-y-6">
              
              {/* Estilo y Tono */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-neutral-400 font-semibold block">
                  Tono de Comunicación de la Banda
                </label>
                <select
                  disabled={!isAdmin}
                  value={config.pitchTone}
                  onChange={(e) => setConfig({ ...config, pitchTone: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-zinc-100 text-xs font-mono focus:border-amber-500 focus:outline-none disabled:opacity-60"
                >
                  <option value="Cercano y Profesional (Indie/Rock)">🎸 Cercano y Profesional (Indie / Rock / Alternativo)</option>
                  <option value="Festivo y Enérgico (Ska / Balkan / Mestizaje)">🎺 Festivo, Alegre y Enérgico (Ska / Balkan / Mestizaje)</option>
                  <option value="Directo y Rebelde (Punk / Hardcore / Metal)">⚡ Directo, Contundente y Sin Filtros (Punk / Rock / Metal)</option>
                  <option value="Elegante y Corporativo (Jazz / Acústico / Fusión)">🎻 Elegante, Exquisito y Formal (Jazz / Fusión / Clásica)</option>
                  <option value="Urbano y Moderno (Trap / Hip-Hop / Electrónica)">🎧 Urbano, Fresco y Contemporáneo (Electrónica / Urbano)</option>
                </select>
                <p className="text-[10px] text-neutral-500">
                  Define la personalidad y el vocabulario que el Agente Redactor aplicará al redactar para las salas.
                </p>
              </div>

              {/* Bio Resumen */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-neutral-400 font-semibold block">
                  Biografía Resumen para Pitches (Elevator Pitch)
                </label>
                <textarea
                  disabled={!isAdmin}
                  value={config.bioSummary}
                  onChange={(e) => setConfig({ ...config, bioSummary: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-zinc-100 text-xs font-sans focus:border-amber-500 focus:outline-none disabled:opacity-60 leading-relaxed"
                  placeholder="Ej: Banda de 6 músicos con potente directo que fusiona sección de vientos con bases electrónicas..."
                />
              </div>

              {/* URL del EPK */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-neutral-400 font-semibold block">
                  Enlace Oficial al Dossier EPK / Prensa
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={config.epkUrl}
                    onChange={(e) => setConfig({ ...config, epkUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-zinc-100 text-xs font-mono focus:border-amber-500 focus:outline-none disabled:opacity-60"
                    placeholder="https://bandmanager.ai/epk/bakandeya"
                  />
                </div>
                <p className="text-[10px] text-neutral-500">
                  Este enlace se insertará automáticamente en los correos salientes hacia promotores y medios.
                </p>
              </div>

              {/* Enlace rápido a plantillas en Booking */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
                    ¿Quieres afinar las plantillas de correo?
                  </h4>
                  <p className="text-[11px] text-neutral-300 font-sans mt-0.5">
                    Puedes personalizar las plantillas específicas para Salas, Festivales, Discotecas y Medios desde Booking CRM.
                  </p>
                </div>
                {onOpenTemplatesSection && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenTemplatesSection();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-mono font-bold transition-all cursor-pointer shrink-0"
                  >
                    Ver Plantillas ➔
                  </button>
                )}
              </div>

            </div>
          )}

          {/* TAB 5: AUDITORÍA & TRAZABILIDAD */}
          {activeTab === 'audit_logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Registro de Auditoría de Ejecución de Agentes
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Trazabilidad de qué usuario o proceso disparó cada agente, duración y salas impactadas en Supabase.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadAuditLogs}
                  disabled={loadingAuditLogs}
                  className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAuditLogs ? 'animate-spin' : ''}`} />
                  <span>Refrescar</span>
                </button>
              </div>

              {loadingAuditLogs ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-neutral-400 font-mono text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                  <span>Cargando registros de auditoría desde Supabase...</span>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-neutral-950/60 border border-neutral-800 text-neutral-400 font-mono text-xs space-y-2">
                  <Activity className="w-6 h-6 mx-auto text-neutral-600" />
                  <p>Aún no hay registros de auditoría guardados en Supabase.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[48vh] overflow-y-auto pr-1">
                  {auditLogs.map((log) => {
                    const isSuccess = log.estado === 'success';
                    const isError = log.estado === 'error';
                    const affectedCount = log.conteo_afectados || (log.leads_afectados ? log.leads_afectados.length : 0);
                    const formattedDate = new Date(log.created_at).toLocaleString('es-ES', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit', second: '2-digit'
                    });

                    return (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800/80 hover:border-neutral-700 transition-colors space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                              log.agente === 'enviador' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                              log.agente === 'scout' ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20' :
                              log.agente === 'redactor' ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' :
                              'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            }`}>
                              Agente {log.agente}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-300 border border-neutral-700">
                              {log.motor || 'supabase_edge'}
                            </span>
                            <span className={`text-[10px] font-mono font-bold ${isSuccess ? 'text-emerald-400' : isError ? 'text-rose-400' : 'text-amber-400'}`}>
                              {isSuccess ? '✓ Éxito' : isError ? '✕ Fallo' : '⚠ Aviso'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
                            <Clock className="w-3 h-3 text-neutral-500" />
                            <span>{formattedDate}</span>
                            {log.duracion_ms > 0 && (
                              <span className="text-neutral-500">({log.duracion_ms}ms)</span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-zinc-200 font-sans leading-relaxed">
                          {log.mensaje}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-800/60 text-[10px] font-mono text-neutral-400">
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="w-3 h-3 text-neutral-500" />
                            <span>Disparado por: <strong className="text-neutral-200">{log.usuario_email || log.usuario_id || 'Sistema'}</strong> ({log.disparado_por_tipo})</span>
                          </div>
                          {affectedCount > 0 && (
                            <span className="text-amber-300/90 font-bold">
                              {affectedCount} sala(s) impactada(s)
                            </span>
                          )}
                        </div>

                        {/* Detalle de leads afectados si existen */}
                        {Array.isArray(log.leads_afectados) && log.leads_afectados.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-neutral-800/40 space-y-1.5">
                            <span className="text-[10px] font-mono uppercase font-bold text-neutral-400 tracking-wider flex items-center justify-between">
                              <span>Salas / Leads Procesados ({log.leads_afectados.length}):</span>
                            </span>
                            <div className="grid grid-cols-1 gap-1.5">
                              {log.leads_afectados.map((item: any, idx: number) => (
                                <div key={idx} className="p-2 rounded-lg bg-neutral-950/70 border border-neutral-800/80 text-[11px] font-mono flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-amber-400 font-bold">🏛️ {item.nombre_sala || 'Sala sin nombre'}</span>
                                    {item.email_contacto && (
                                      <span className="text-neutral-400 text-[10px] truncate max-w-[200px]">&lt;{item.email_contacto}&gt;</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-neutral-800 text-neutral-300 border border-neutral-700">
                                      ID: {item.id}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                      {item.estado_anterior || 'aprobado'} ➔ {item.estado_nuevo || 'contactado'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isStitchLight ? 'bg-slate-50 border-slate-200' : 'bg-[#141312] border-neutral-800'
        }`}>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Aislamiento Multi-Tenant: <strong className="text-zinc-200">{bandId}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-800 text-zinc-300 text-xs font-mono font-bold hover:bg-neutral-700 transition-colors cursor-pointer"
            >
              Cerrar
            </button>

            {isAdmin && (
              <button
                onClick={handleSave}
                disabled={isSaving || isLoading}
                className="px-5 py-2 rounded-xl bg-amber-500 text-stone-950 text-xs font-mono font-bold hover:bg-amber-400 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                    <span>Guardando Ajustes...</span>
                  </>
                ) : savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-stone-950" />
                    <span>¡Configuración Guardada!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
    </ModalPortal>
  );
};
