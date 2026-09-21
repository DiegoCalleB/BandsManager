import React, { useState, useEffect } from 'react';
import {
 Bot, ShieldCheck, Sliders, CheckCircle2, AlertTriangle, X, Sparkles,
 Send, FileEdit, Clock, Euro, Calendar, Lock, ShieldAlert, ArrowRight, Save, Loader2,
 Radio, Mail, FileText, Check, Globe, RefreshCw, Activity, Terminal, ExternalLink,
 ChevronRight, Volume2, Music, CheckSquare, Square, AtSign, UserCheck, Download,
 MessageSquare, ThumbsUp, ThumbsDown, HelpCircle, Brain
} from 'lucide-react';
import { api } from '../../services/api';
import { apiFetch } from '../../utils/api';
import { BandSchedule } from '../../types';
import { ModalPortal } from '../common/ModalPortal';
import { EmailAccountConfig } from '../EmailAccountConfig';

const RESPONSE_LEARNED_CATEGORY_LABELS: Record<string, string> = {
 salas:'🏛️ Salas',
 festivales:'🎪 Festivales',
 discotecas:'🪩 Discotecas',
 medios:'📻 Medios',
 grupos:'🎸 Grupos',
 managements:'💼 Managements',
 ayuntamientos:'🎉 Ayuntamientos'
};

interface LearnedRuleBucket {
 reglas_estilo_aprendidas?: string[];
 reglas_manuales?: string[];
 vocabulario_aprendido?: string[];
 terminos_a_evitar?: string[];
}

export type DispatchAutonomyLevel ='draft_only' |'scheduled_window' |'autonomous_first_contact';
export type NegotiationDepthLevel ='outreach_only' |'filter_conditions' |'advanced_negotiation';

export interface AgentAutonomyConfig {
 dispatchLevel: DispatchAutonomyLevel;
 negotiationDepth: NegotiationDepthLevel;
 minCacheByType?: {
 salas?: number;
 festivales?: number;
 discotecas?: number;
 ayuntamientos?: number;
 medios?: number;
 grupos?: number;
 };
 // Caché de inicio de negociación (opcional): si la sala pregunta directamente por el caché,
 // el agente responde con esta cifra en vez del mínimo real, dejando margen para negociar.
 negotiationStartCacheByType?: {
 salas?: number;
 festivales?: number;
 discotecas?: number;
 ayuntamientos?: number;
 medios?: number;
 grupos?: number;
 };
 autoDeclineUnderMinCache: boolean;
 notifyOnEveryProposal: boolean;
 requireHumanForFinalSignOff: boolean;
 agentSenderEmail?: string;
 agentSenderName?: string;
 agentReplyToEmail?: string;
 dispatchMode?:'draft_gmail' |'direct_send';
}

interface AgentAutonomySettingsModalProps {
 isOpen: boolean;
 onClose: () => void;
 bandName?: string;
 bandId?: string;
 currentUser?: any;
 initialConfig?: Partial<AgentAutonomyConfig>;
 onSaveConfig?: (config: AgentAutonomyConfig) => void;
 onOpenTemplatesSection?: () => void;
 // Navega a Gestión de Banda (BandCRM), donde vive de verdad el ADN de Tono (BandToneModal) y
 // el EPK - antes esta modal tenía sus propios campos"Tono"/"Biografía"/"EPK" en la pestaña
 // Tono & Identidad que parecían configurar el Redactor pero no llegaban a persistirse ni a
 // leerse en ningún sitio (dbUpsertAutonomyConfig los descartaba y bandDna.ts nunca los leía).
 // Opcional porque no todos los sitios desde los que se abre esta modal saben navegar fuera de
 // su propia pantalla (ver el mismo patrón ya existente en onOpenTemplatesSection).
 onOpenBandProfile?: () => void;
}

const TIMEZONES = [
 { value:'Europe/Madrid', label:'Europe/Madrid (Madrid, Barcelona, París) [UTC+1/UTC+2]' },
 { value:'America/Mexico_City', label:'America/Mexico_City (Ciudad de México) [UTC-6]' },
 { value:'America/Bogota', label:'America/Bogota (Bogotá, Lima, Quito) [UTC-5]' },
 { value:'America/Argentina/Buenos_Aires', label:'America/Argentina/Buenos_Aires (Buenos Aires) [UTC-3]' },
 { value:'America/Santiago', label:'America/Santiago (Santiago de Chile) [UTC-3/UTC-4]' },
 { value:'America/New_York', label:'America/New_York (Nueva York, Miami) [UTC-5/UTC-4]' },
 { value:'Europe/London', label:'Europe/London (Londres, Dublín, Lisboa) [UTC+0/UTC+1]' }
];

export const DAYS_OF_WEEK = [
 { id: 1, name:'Lunes', short:'Lun', initial:'L', description:'Planificación semanal de salas', recommended: false },
 { id: 2, name:'Martes', short:'Mar', initial:'M', description:'⭐ Día Top (+45% respuestas)', recommended: true, badge:'🔥 Top Booking' },
 { id: 3, name:'Miércoles', short:'Mié', initial:'X', description:'⭐ Día Top (Máxima atención de programadores)', recommended: true, badge:'🔥 Top Booking' },
 { id: 4, name:'Jueves', short:'Jue', initial:'J', description:'⭐ Día Top (Cierre de fechas y agenda)', recommended: true, badge:'🔥 Top Booking' },
 { id: 5, name:'Viernes', short:'Vie', initial:'V', description:'Moderado (Salas en producción de directos)', recommended: false },
 { id: 6, name:'Sábado', short:'Sáb', initial:'S', description:'Bajo (Conciertos en vivo)', recommended: false },
 { id: 7, name:'Domingo', short:'Dom', initial:'D', description:'Bajo (Descanso y cierre)', recommended: false }
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const AgentAutonomySettingsModal: React.FC<AgentAutonomySettingsModalProps> = ({
 isOpen,
 onClose,
 bandName ='Tu Banda',
 bandId ='band-bakandeya',
 currentUser,
 initialConfig,
 onSaveConfig,
 onOpenTemplatesSection,
 onOpenBandProfile
}) => {
 // Navigation Tabs
 const [activeTab, setActiveTab] = useState<'autonomy' |'email_dispatch' |'schedules' |'tone' |'response_strategies' |'audit_logs'>('autonomy');
 const [auditLogs, setAuditLogs] = useState<any[]>([]);
 const [loadingAuditLogs, setLoadingAuditLogs] = useState<boolean>(false);
 const [auditAgentFilter, setAuditAgentFilter] = useState<string>('all');

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

 const handleExportAuditLogsCSV = () => {
 if (!auditLogs || auditLogs.length === 0) return;
 const headers = ['Fecha','Agente','Motor','Disparado Por','Email Usuario','Estado','Mensaje','Conteo Afectados','Duración (ms)'];
 const rows = auditLogs.map(l => [
 `"${new Date(l.created_at).toLocaleString('es-ES')}"`,
 `"${l.agente ||''}"`,
 `"${l.motor ||''}"`,
 `"${l.disparado_por_tipo ||''}"`,
 `"${l.usuario_email || l.usuario_id ||''}"`,
 `"${l.estado ||''}"`,
 `"${(l.mensaje ||'').replace(/"/g,'""')}"`,
 l.conteo_afectados || 0,
 l.duracion_ms || 0
 ]);
 const csvContent ='data:text/csv;charset=utf-8, '+ [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
 const encodedUri = encodeURI(csvContent);
 const link = document.createElement('a');
 link.setAttribute('href', encodedUri);
 link.setAttribute('download', `auditoria_agentes_${bandId}_${new Date().toISOString().split('T')[0]}.csv`);
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 };

 useEffect(() => {
 if (activeTab ==='audit_logs') {
 loadAuditLogs();
 }
 }, [activeTab, bandId]);

 // RBAC Permission Check
 const isAdmin = !currentUser || currentUser?.role ==='admin' || currentUser?.role ==='manager' || currentUser?.role ==='leader' || currentUser?.role ==='director';

 // State: Autonomy Settings
 const [config, setConfig] = useState<AgentAutonomyConfig>({
 dispatchLevel: initialConfig?.dispatchLevel ||'draft_only',
 negotiationDepth: initialConfig?.negotiationDepth ||'filter_conditions',
 minCacheByType: initialConfig?.minCacheByType || {},
 negotiationStartCacheByType: initialConfig?.negotiationStartCacheByType || {},
 autoDeclineUnderMinCache: initialConfig?.autoDeclineUnderMinCache ?? false,
 notifyOnEveryProposal: initialConfig?.notifyOnEveryProposal ?? true,
 requireHumanForFinalSignOff: true,
 agentSenderEmail: initialConfig?.agentSenderEmail ||'',
 agentSenderName: initialConfig?.agentSenderName || `${bandName} Management`,
 agentReplyToEmail: initialConfig?.agentReplyToEmail ||'',
 dispatchMode: initialConfig?.dispatchMode ||'draft_gmail'
 });

 // Indicador (punto verde en la pestaña) de si la banda tiene YA una bandeja conectada -
 // Gmail OAuth o SMTP/IMAP, lo que sea que EmailAccountConfig gestione. Estado propio y
 // desacoplado de EmailAccountConfig a propósito: solo se usa para el badge de la pestaña,
 // no duplica su lógica de conexión.
 const [emailAccountConnected, setEmailAccountConnected] = useState(false);

 useEffect(() => {
 const targetBand = bandId || currentUser?.band_id;
 if (!isOpen || !targetBand) return;
 let isMounted = true;
 const checkEmailAccountConnected = async () => {
 const [gmailOAuth, imapAccount] = await Promise.all([
 api.getGmailOAuthStatus().catch(() => null),
 api.getBandEmailAccount(targetBand).catch(() => null)
 ]);
 if (isMounted) {
 setEmailAccountConnected(Boolean(gmailOAuth?.connected) || Boolean(imapAccount?.connected));
 }
 };
 checkEmailAccountConnected();
 return () => { isMounted = false; };
 }, [isOpen, bandId, currentUser]);

 // State: Response Strategies (guía condicional del Contestador por tipo de respuesta
 // detectada en el mensaje entrante de la sala - ver server/services/replyDrafting.ts)
 type ResponseTone ='neutral' |'enthusiastic' |'cautious';
 interface ResponseStrategyForm {
 guidancePrompt: string;
 tone: ResponseTone;
 mentionLinks: boolean;
 }
 const RESPONSE_TYPES: Array<{ key: string; label: string; description: string; icon: React.ReactNode; defaultTone: ResponseTone }> = [
 {
 key:'price_negotiation',
 label:'Negociación de Precio',
 description:'La sala pregunta por caché, presupuesto, tarifa o condiciones económicas.',
 icon: <Euro className="w-4 h-4" />,
 defaultTone:'neutral'
 },
 {
 key:'confirmation',
 label:'Confirmación',
 description:'La sala confirma, aprueba o expresa interés claro en seguir adelante.',
 icon: <ThumbsUp className="w-4 h-4" />,
 defaultTone:'enthusiastic'
 },
 {
 key:'rejection',
 label:'Rechazo',
 description:'La sala declina la propuesta o indica que no tiene disponibilidad.',
 icon: <ThumbsDown className="w-4 h-4" />,
 defaultTone:'cautious'
 },
 {
 key:'follow_up',
 label:'Pregunta de Seguimiento',
 description:'La sala pide más información, fechas o detalles concretos.',
 icon: <HelpCircle className="w-4 h-4" />,
 defaultTone:'neutral'
 }
 ];
 const [responseStrategies, setResponseStrategies] = useState<Record<string, ResponseStrategyForm>>({});
 // Reglas de estilo que el sistema ha aprendido SOLO de tus correcciones reales a respuestas
 // (Self-Refining Tone DNA, dna_expresion.reglas_por_categoria_respuesta - ver
 // server/db/pitchLearning.ts). Se muestran junto a la configuración manual de arriba para que
 // el mánager pueda detectar a simple vista si se contradicen entre sí: la manual está
 // organizada por TIPO de respuesta, esta por TIPO de sala, así que no hay un cruce automático,
 // pero verlas juntas es lo que permite pillar el choque.
 const [learnedResponseRules, setLearnedResponseRules] = useState<Record<string, LearnedRuleBucket>>({});
 const [isSavingStrategies, setIsSavingStrategies] = useState(false);
 const [strategiesFeedback, setStrategiesFeedback] = useState<string | null>(null);

 // Checklist de arranque ("¿está esto listo para que el Redactor escriba bien?"): tres señales
 // que se pueden comprobar de verdad sin inventar datos ni añadir endpoints nuevos.
 // - toneTrained: dna_expresion.tono_comunicacion o vocabulario_clave rellenados en ADN de Tono
 // (mismo endpoint que ya se consulta para learnedResponseRules, un campo más).
 // - templateCustomized: category_pitch_templates tiene customInstruction no vacío en alguna
 // categoría - a diferencia de"guidelines" (que SIEMPRE viene pre-rellenado de fábrica en
 // DEFAULT_CATEGORY_TEMPLATES), customInstruction empieza vacío en las 7 categorías y solo se
 // rellena si el mánager escribe algo, así que es una señal fiable de personalización real.
 // No incluye"hilos de ejemplo": comprobarlo de verdad requeriría una llamada por categoría (7
 // peticiones) solo para un checkbox - mejor un aviso (ya añadido arriba) que un dato a medias.
 const [startupChecklist, setStartupChecklist] = useState({ toneTrained: false, templateCustomized: false });

 const getStrategyOrDefault = (typeKey: string): ResponseStrategyForm => {
 const found = responseStrategies[typeKey];
 const defaultTone = RESPONSE_TYPES.find(t => t.key === typeKey)?.defaultTone ||'neutral';
 return found || { guidancePrompt:'', tone: defaultTone, mentionLinks: true };
 };

 const updateStrategyField = <K extends keyof ResponseStrategyForm>(typeKey: string, field: K, value: ResponseStrategyForm[K]) => {
 setResponseStrategies(prev => ({
 ...prev,
 [typeKey]: { ...getStrategyOrDefault(typeKey), [field]: value }
 }));
 };

 const handleSaveResponseStrategies = async () => {
 if (!isAdmin) return;
 setIsSavingStrategies(true);
 setStrategiesFeedback(null);
 try {
 // Solo persiste estrategias con guía real escrita por el mánager - una entrada vacía
 // no aporta nada al prompt condicional y solo ensuciaría el JSON guardado.
 const toSave: Record<string, ResponseStrategyForm> = {};
 const toDelete: string[] = [];
 for (const [key, strategy] of Object.entries(responseStrategies)) {
 if (strategy.guidancePrompt && strategy.guidancePrompt.trim()) {
 toSave[key] = strategy;
 } else {
 // El backend guarda por FUSIÓN (POST hace {...actual, ...nuevo}), así que enviar solo
 // las que tienen contenido nunca borra las vacías: si antes había una guía guardada y
 // ahora se ha limpiado el campo, había que borrarla explícitamente o se queda huérfana
 // en Supabase - el mánager ve el campo vacío en pantalla pero el Contestador sigue
 // usando la guía antigua para ese tipo de respuesta hasta que se borre de verdad.
 toDelete.push(key);
 }
 }
 if (Object.keys(toSave).length > 0) {
 await api.updateResponseStrategies(toSave);
 }
 // Un 404 aquí solo significa"todavía no había nada guardado para esta banda" (primera
 // vez que se abre esta pestaña) - no es un fallo real, así que no debe tumbar el guardado
 // de arriba ni mostrarse como error al mánager.
 await Promise.all(toDelete.map((key) => api.deleteResponseStrategy(key).catch((err: any) => {
 if (err?.status !== 404) throw err;
 })));
 setStrategiesFeedback('✅ Estrategias de respuesta guardadas correctamente.');
 setTimeout(() => setStrategiesFeedback(null), 3000);
 } catch (e) {
 console.error('Error guardando estrategias de respuesta:', e);
 setStrategiesFeedback('⚠️ Error al guardar las estrategias de respuesta.');
 } finally {
 setIsSavingStrategies(false);
 }
 };

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

 // Load existing configuration from server
 useEffect(() => {
 if (!isOpen) return;
 let isMounted = true;
 setIsLoading(true);
 setStatusFeedback(null);

 const loadAllConfigs = async () => {
 try {
 const targetBand = bandId || currentUser?.band_id;
 if (!targetBand) return;

 // 1. Fetch Autonomy Config
 const serverAutonomy = await api.getAutonomyConfig().catch(() => null);
 if (isMounted && serverAutonomy) {
 setConfig(prev => ({
 ...prev,
 dispatchLevel: serverAutonomy.dispatchLevel || prev.dispatchLevel,
 negotiationDepth: serverAutonomy.negotiationDepth || prev.negotiationDepth,
 minCacheByType: serverAutonomy.minCacheByType ?? prev.minCacheByType,
 negotiationStartCacheByType: serverAutonomy.negotiationStartCacheByType ?? prev.negotiationStartCacheByType,
 autoDeclineUnderMinCache: !!serverAutonomy.autoDeclineUnderMinCache,
 notifyOnEveryProposal: serverAutonomy.notifyOnEveryProposal !== false,
 agentSenderEmail: serverAutonomy.agentSenderEmail || prev.agentSenderEmail,
 agentSenderName: serverAutonomy.agentSenderName || prev.agentSenderName,
 agentReplyToEmail: serverAutonomy.agentReplyToEmail || prev.agentReplyToEmail,
 dispatchMode: serverAutonomy.dispatchMode || prev.dispatchMode,
 requireHumanForFinalSignOff: true
 }));
 }

 // 2. Fetch Band Data to prefill email if missing
 try {
 const appState = await api.getState().catch(() => null);
 if (isMounted && appState?.bands) {
 const cleanTarget = (targetBand ||'').replace(/^(band|reg)-/,'').toLowerCase();
 const currentBandObj = appState.bands.find(b => (b.id ||'').replace(/^(band|reg)-/,'').toLowerCase() === cleanTarget);
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

 // 3. Fetch Response Strategies (guía condicional del Contestador)
 const serverStrategies = await api.getResponseStrategies().catch(() => null);
 if (isMounted && serverStrategies?.responseStrategies) {
 setResponseStrategies(serverStrategies.responseStrategies as Record<string, ResponseStrategyForm>);
 }

 // 3b. Fetch reglas aprendidas de respuestas (Self-Refining Tone DNA) - mismo endpoint
 // que ya usa BandToneModal.tsx, solo nos quedamos con la parte de respuestas. De paso,
 // reutilizamos la misma llamada para la señal"ADN de voz entrenado" de la checklist.
 const toneDnaRes = await apiFetch('/api/bands/tone-dna').catch(() => null);
 if (isMounted && toneDnaRes?.data?.reglas_por_categoria_respuesta) {
 setLearnedResponseRules(toneDnaRes.data.reglas_por_categoria_respuesta);
 }
 const toneDnaData = toneDnaRes?.data;
 const toneTrained = Boolean(
 (toneDnaData?.tono_comunicacion && String(toneDnaData.tono_comunicacion).trim()) ||
 (Array.isArray(toneDnaData?.vocabulario_clave) && toneDnaData.vocabulario_clave.length > 0)
 );

 // 3c. Fetch plantillas de categoría, solo para la señal"plantilla personalizada" de la
 // checklist: customInstruction empieza vacío en las 7 categorías por defecto (a
 // diferencia de guidelines, que ya viene pre-rellenado de fábrica), así que si alguna
 // tiene contenido es que el mánager escribió una instrucción propia de verdad.
 const templatesRes = await apiFetch('/api/templates').catch(() => null);
 const templateCustomized = Boolean(
 templatesRes?.templates &&
 Object.values(templatesRes.templates as Record<string, { customInstruction?: string }>)
 .some((t) => t.customInstruction && t.customInstruction.trim())
 );

 if (isMounted) {
 setStartupChecklist({ toneTrained, templateCustomized });
 }

 // 4. Fetch Band Schedule (Lector & Enviador crons)
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
 const targetBand = bandId || currentUser?.band_id;
 if (!targetBand) {
 setStatusFeedback('⚠️ No hay ninguna banda activa para guardar la configuración.');
 setIsSaving(false);
 return;
 }

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
 <div className="fixed inset-0 bg-[var(--scrim)]/80 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto overscroll-contain">
 <div className={`border rounded-[var(--r-l)] w-full max-w-4xl max-h-[88vh] md:max-h-[85vh] overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200 ${
 'bg-[var(--surface)] text-[var(--ink)]'
 }`}>
 
 {/* Modal Header */}
 <div className={`p-4 sm:p-5 flex items-center justify-between shrink-0 ${
 'bg-[var(--surface)]'
 }`}>
 <div className="flex items-center gap-3">
 <div className="p-2.5 rounded-[var(--r-m)] bg-gradient-to-br from-amber-0/20 to-orange-500/20 text-[var(--acc)]">
 <Bot className="w-5 h-5" />
 </div>
 <div>
 <div className="flex flex-wrap items-center gap-2">
 <h3 className="text-base font-bold font-display tracking-wider text-[var(--ink)]">
 Panel de Control de Agentes IA
 </h3>
 <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-[var(--acc)]/10 text-[var(--acc)]/70 font-bold">
 {bandName}
 </span>
 {isAdmin ? (
 <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-[var(--ok)]/10 text-[var(--ink-2)] flex items-center gap-1 font-bold">
 <ShieldCheck className="w-3 h-3" /> Mánager / Admin
 </span>
 ) : (
 <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-[var(--ink-3)]/60/50 text-[var(--ink-2)]600 flex items-center gap-1 font-bold">
 <Lock className="w-3 h-3" /> Modo Lectura (Músico)
 </span>
 )}
 </div>
 <p className="text-xs text-[var(--ink-2)] font-sans mt-0.5">
 Centraliza la autonomía de envío, horarios comerciales y pautas de redacción para los agentes de Supabase.
 </p>
 </div>
 </div>

 <button
 onClick={onClose}
 className="p-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] rounded-[var(--r-s)] hover:bg-[var(--surface)]/80 transition-colors cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Tab Navigation */}
 <div className={`flex px-4 sm:px-5 gap-2 shrink-0 overflow-x-auto ${
 'bg-[var(--sunken)]/60'
 }`}>
 <button
 type="button"
 onClick={() => setActiveTab('autonomy')}
 className={`py-3 px-3.5 text-xs font-sans font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
 activeTab ==='autonomy'
 ? 'text-[var(--acc)]'
 :'border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 <Sliders className="w-4 h-4" />
 <span>1. Autonomía</span>
 </button>

 <button
 type="button"
 onClick={() => setActiveTab('response_strategies')}
 className={`py-3 px-3.5 text-xs font-sans font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
 activeTab ==='response_strategies'
 ? 'text-[var(--acc)]'
 :'border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 <MessageSquare className="w-4 h-4 text-[var(--tentative)]" />
 <span>2. Estrategias de Respuesta</span>
 </button>

 <button
 type="button"
 onClick={() => setActiveTab('email_dispatch')}
 className={`py-3 px-3.5 text-xs font-sans font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
 activeTab ==='email_dispatch'
 ? 'text-[var(--acc)]'
 :'border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 <Mail className="w-4 h-4 text-[var(--ink-2)]" />
 <span>3. Email & Buzón</span>
 {emailAccountConnected && (
 <span className="w-2 h-2 rounded-full bg-[var(--ok)]/80 inline-block"></span>
 )}
 </button>

 <button
 type="button"
 onClick={() => setActiveTab('schedules')}
 className={`py-3 px-3.5 text-xs font-sans font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
 activeTab ==='schedules'
 ? 'text-[var(--acc)]'
 :'border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 <Clock className="w-4 h-4" />
 <span>4. Horarios</span>
 </button>

 <button
 type="button"
 onClick={() => setActiveTab('tone')}
 className={`py-3 px-3.5 text-xs font-sans font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
 activeTab ==='tone'
 ? 'text-[var(--acc)]'
 :'border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 <Sparkles className="w-4 h-4" />
 <span>5. Tono & Identidad</span>
 </button>

 <button
 type="button"
 onClick={() => setActiveTab('audit_logs')}
 className={`py-3 px-3.5 text-xs font-sans font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
 activeTab ==='audit_logs'
 ?'border-[var(--ok)] text-[var(--ok)]'
 :'border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 <Activity className="w-4 h-4 text-[var(--ok)]" />
 <span>6. Auditoría</span>
 {auditLogs.length > 0 && (
 <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-[var(--ok)]/20 text-[var(--ink-2)] font-sans">
 {auditLogs.length}
 </span>
 )}
 </button>
 </div>

 {/* Read-Only Banner for Non-Admins */}
 {!isAdmin && (
 <div className="p-3 bg-[var(--surface)] text-[var(--acc)]/70 text-xs flex items-center gap-2 px-5">
 <Lock className="w-4 h-4 text-[var(--acc)] shrink-0" />
 <span>
 Estás en modo <strong>Solo Lectura</strong>. Solo los miembros con rol de Administrador o Mánager pueden modificar los parámetros de los agentes.
 </span>
 </div>
 )}

 {/* Modal Body */}
 <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

 {/* TAB 1: AUTONOMÍA & LÍNEAS ROJAS */}
 {activeTab ==='autonomy' && (
 <div className="space-y-6">
 {/* Checklist de arranque: solo se muestra mientras falte algo por hacer - una vez
 todo listo desaparece sola, para no molestar a un mánager que ya lo configuró
 todo. Las tres señales se comprueban de verdad (ver startupChecklist arriba),
 no son un adorno - por eso solo hay tres y no más: cualquier señal que no se
 pudiera verificar con fiabilidad (como los Hilos de Ejemplo) se dejó fuera en
 vez de fingir que se comprueba. */}
 {!emailAccountConnected || !startupChecklist.toneTrained || !startupChecklist.templateCustomized ? (
 <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--ok)]/10 space-y-2.5">
 <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
 <CheckCircle2 className="w-4 h-4 text-[var(--ok)]" /> Lo mínimo para que el Redactor escriba bien
 </span>
 <div className="space-y-1.5">
 <button
 type="button"
 onClick={() => setActiveTab('email_dispatch')}
 className="w-full flex items-center justify-between gap-2 text-left cursor-pointer group"
 >
 <span className={`text-[11px] font-sans flex items-center gap-1.5 ${emailAccountConnected ?'text-[var(--ink-2)] line-through' :'text-[var(--ink-2)]'}`}>
 {emailAccountConnected ? <Check className="w-3.5 h-3.5 text-[var(--ok)] shrink-0" /> : <span className="w-3.5 h-3.5 rounded-full shrink-0" />}
 Conectar el buzón de la banda
 </span>
 {!emailAccountConnected && <span className="text-[10px] text-[var(--ok)] group-hover:underline shrink-0">Ir ➔</span>}
 </button>
 <button
 type="button"
 onClick={() => setActiveTab('tone')}
 className="w-full flex items-center justify-between gap-2 text-left cursor-pointer group"
 >
 <span className={`text-[11px] font-sans flex items-center gap-1.5 ${startupChecklist.toneTrained ?'text-[var(--ink-2)] line-through' :'text-[var(--ink-2)]'}`}>
 {startupChecklist.toneTrained ? <Check className="w-3.5 h-3.5 text-[var(--ok)] shrink-0" /> : <span className="w-3.5 h-3.5 rounded-full shrink-0" />}
 Entrenar el ADN de voz de la banda
 </span>
 {!startupChecklist.toneTrained && <span className="text-[10px] text-[var(--ok)] group-hover:underline shrink-0">Ir ➔</span>}
 </button>
 <button
 type="button"
 onClick={() => setActiveTab('tone')}
 className="w-full flex items-center justify-between gap-2 text-left cursor-pointer group"
 >
 <span className={`text-[11px] font-sans flex items-center gap-1.5 ${startupChecklist.templateCustomized ?'text-[var(--ink-2)] line-through' :'text-[var(--ink-2)]'}`}>
 {startupChecklist.templateCustomized ? <Check className="w-3.5 h-3.5 text-[var(--ok)] shrink-0" /> : <span className="w-3.5 h-3.5 rounded-full shrink-0" />}
 Personalizar al menos una plantilla de categoría
 </span>
 {!startupChecklist.templateCustomized && <span className="text-[10px] text-[var(--ok)] group-hover:underline shrink-0">Ir ➔</span>}
 </button>
 </div>
 </div>
 ) : null}

 {/* REGLA NO NEGOCIABLE NOTICE */}
 <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--acc)]/10 text-[var(--acc)]/70 text-xs flex items-start gap-3">
 <ShieldCheck className="w-5 h-5 text-[var(--acc)] shrink-0 mt-0.5" />
 <div className="space-y-1 leading-relaxed">
 <strong className="font-bold text-[var(--acc)]/70">Garantía de Control Humano (Cierre Inviolable):</strong>
 <p className="text-[var(--ink-2)] text-[11px]">
 Incluso con la máxima autonomía, <strong className="text-[var(--ink)]">ningún trato o contrato se da por cerrado ni ningún email final de confirmación se envía sin la validación previa del mánager</strong> o un miembro de {bandName}.
 </p>
 </div>
 </div>

 {/* 1. MODO DE ENVÍO */}
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <h4 className="text-xs font-sans font-bold tracking-wider text-[var(--acc)] flex items-center gap-1.5">
 <Send className="w-4 h-4" /> 1. Autonomía de Envío (Modo de Despacho)
 </h4>
 <span className="text-[10px] text-[var(--ink-2)] font-sans">¿Cuándo se envían los correos?</span>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
 {/* Draft Only */}
 <button
 type="button"
 disabled={!isAdmin}
 onClick={() => setConfig({ ...config, dispatchLevel:'draft_only' })}
 className={`p-4 rounded-[var(--r-m)] text-left transition-all flex flex-col justify-between gap-3 ${
 !isAdmin ?'opacity-80 cursor-default' :'cursor-pointer'
 } ${
 config.dispatchLevel ==='draft_only'
 ?'bg-[var(--acc)]/20 text-[var(--ink)] ring-1 ring-amber-0/50'
 :'bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]'
 }`}
 >
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <FileEdit className="w-5 h-5 text-[var(--acc)]" />
 <span className="text-[9px] font-sans px-2 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--acc)]/70 font-bold">
 100% Manual
 </span>
 </div>
 <div>
 <h5 className="text-sm font-bold font-display text-[var(--ink)]">Borrador & Aprobación</h5>
 <p className="text-[11px] text-[var(--ink-2)] font-sans mt-1 leading-snug">
 Todos los correos generados se guardan como borrador en la pestaña <strong className="text-[var(--ink)]">Pendiente de Aprobación</strong>. Requiere clic directo.
 </p>
 </div>
 </div>
 <div className="text-[10px] font-sans font-semibold text-[var(--acc)]/90 pt-2 /80">
 Ideal para empezar con la app.
 </div>
 </button>

 {/* Scheduled Window */}
 <button
 type="button"
 disabled={!isAdmin}
 onClick={() => setConfig({ ...config, dispatchLevel:'scheduled_window' })}
 className={`p-4 rounded-[var(--r-m)] text-left transition-all flex flex-col justify-between gap-3 ${
 !isAdmin ?'opacity-80 cursor-default' :'cursor-pointer'
 } ${
 config.dispatchLevel ==='scheduled_window'
 ?'bg-[var(--acc)]/20 text-[var(--ink)] ring-1 ring-amber-0/50'
 :'bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]'
 }`}
 >
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <Clock className="w-5 h-5 text-[var(--acc)]" />
 <span className="text-[9px] font-sans px-2 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--ink-3)] font-bold">
 Ventana Horaria
 </span>
 </div>
 <div>
 <h5 className="text-sm font-bold font-display text-[var(--ink)]">Envío en Horario Comercial</h5>
 <p className="text-[11px] text-[var(--ink-2)] font-sans mt-1 leading-snug">
 El agente prepara la respuesta y avisa. Si en 3 horas no la cancelas, el sistema la envía automáticamente dentro de las horas configuradas.
 </p>
 </div>
 </div>
 <div className="text-[10px] font-sans font-semibold text-[var(--ink-2)]/90 pt-2 /80">
 Agiliza respuestas sin bloquear.
 </div>
 </button>

 {/* Autonomous First Contact */}
 <button
 type="button"
 disabled={!isAdmin}
 onClick={() => setConfig({ ...config, dispatchLevel:'autonomous_first_contact' })}
 className={`p-4 rounded-[var(--r-m)] text-left transition-all flex flex-col justify-between gap-3 ${
 !isAdmin ?'opacity-80 cursor-default' :'cursor-pointer'
 } ${
 config.dispatchLevel ==='autonomous_first_contact'
 ?'bg-[var(--acc)]/20 text-[var(--ink)] ring-1 ring-amber-0/50'
 :'bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]'
 }`}
 >
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <Bot className="w-5 h-5 text-[var(--acc)]" />
 <span className="text-[9px] font-sans px-2 py-0.5 rounded bg-[var(--ok)]/20 text-[var(--ink-2)] font-bold">
 Autónomo Inicial
 </span>
 </div>
 <div>
 <h5 className="text-sm font-bold font-display text-[var(--ink)]">Pitch Inicial Automático</h5>
 <p className="text-[11px] text-[var(--ink-2)] font-sans mt-1 leading-snug">
 El primer contacto de presentación (Scout) se envía directamente a salas compatibles. Las respuestas posteriores pasan a borrador.
 </p>
 </div>
 </div>
 <div className="text-[10px] font-sans font-semibold text-[var(--ok)]/90 pt-2 /80">
 Máxima velocidad de prospección.
 </div>
 </button>
 </div>
 </div>

 {/* 2. ALCANCE DE NEGOCIACIÓN */}
 <div className="space-y-3 pt-2">
 <div className="flex items-center justify-between">
 <h4 className="text-xs font-sans font-bold tracking-wider text-[var(--acc)] flex items-center gap-1.5">
 <Bot className="w-4 h-4" /> 2. Alcance de Negociación del Mánager AI
 </h4>
 <span className="text-[10px] text-[var(--ink-2)] font-sans">¿Qué temas puede tratar el agente?</span>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
 <button
 type="button"
 disabled={!isAdmin}
 onClick={() => setConfig({ ...config, negotiationDepth:'outreach_only' })}
 className={`p-4 rounded-[var(--r-m)] text-left transition-all flex flex-col justify-between gap-3 ${
 !isAdmin ?'opacity-80 cursor-default' :'cursor-pointer'
 } ${
 config.negotiationDepth ==='outreach_only'
 ?'bg-[var(--acc)]/20 text-[var(--ink)] ring-1 ring-amber-0/50'
 :'bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]'
 }`}
 >
 <div className="space-y-2">
 <span className="text-[9px] font-sans tracking-widest font-bold text-[var(--acc)]">Nivel A</span>
 <h5 className="text-sm font-bold font-display text-[var(--ink)]">Solo"Llamada a la puerta"</h5>
 <p className="text-[11px] text-[var(--ink-2)] font-sans leading-snug">
 El agente solo saluda y envía el Dossier EPK. En cuanto la sala responde con dudas de precio o fecha, el bot se detiene.
 </p>
 </div>
 </button>

 <button
 type="button"
 disabled={!isAdmin}
 onClick={() => setConfig({ ...config, negotiationDepth:'filter_conditions' })}
 className={`p-4 rounded-[var(--r-m)] text-left transition-all flex flex-col justify-between gap-3 ${
 !isAdmin ?'opacity-80 cursor-default' :'cursor-pointer'
 } ${
 config.negotiationDepth ==='filter_conditions'
 ?'bg-[var(--acc)]/20 text-[var(--ink)] ring-1 ring-amber-0/50'
 :'bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]'
 }`}
 >
 <div className="space-y-2">
 <span className="text-[9px] font-sans tracking-widest font-bold text-[var(--ink-2)]">Nivel B</span>
 <h5 className="text-sm font-bold font-display text-[var(--ink)]">Filtro de Requisitos & Fechas</h5>
 <p className="text-[11px] text-[var(--ink-2)] font-sans leading-snug">
 Responde sobre disponibilidad de calendario y rider técnico. Confirma si la sala ofrece taquilla/caché dentro de tus límites.
 </p>
 </div>
 </button>

 <button
 type="button"
 disabled={!isAdmin}
 onClick={() => setConfig({ ...config, negotiationDepth:'advanced_negotiation' })}
 className={`p-4 rounded-[var(--r-m)] text-left transition-all flex flex-col justify-between gap-3 ${
 !isAdmin ?'opacity-80 cursor-default' :'cursor-pointer'
 } ${
 config.negotiationDepth ==='advanced_negotiation'
 ?'bg-[var(--acc)]/20 text-[var(--ink)] ring-1 ring-amber-0/50'
 :'bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]'
 }`}
 >
 <div className="space-y-2">
 <span className="text-[9px] font-sans tracking-widest font-bold text-[var(--tentative)]">Nivel C</span>
 <h5 className="text-sm font-bold font-display text-[var(--ink)]">Negociador hasta Pre-Cierre</h5>
 <p className="text-[11px] text-[var(--ink-2)] font-sans leading-snug">
 Propone fechas alternativas ante solapamientos y formula contraofertas en tu rango de caché. Deja el trato listo para tu firma.
 </p>
 </div>
 </button>
 </div>
 </div>

 {/* 3. PARÁMETROS ECONÓMICOS */}
 <div className="p-4 rounded-[var(--r-m)] bg-[var(--surface)] space-y-4">
 <h4 className="text-xs font-sans font-bold tracking-wider text-[var(--acc)] flex items-center gap-1.5">
 <Euro className="w-4 h-4" /> 3. Caché Mínimo por Tipo de Recinto para {bandName}
 </h4>

 <p className="text-xs text-[var(--ink-2)]">
 Define el caché mínimo aceptable para cada tipo de recinto. Dejar un campo vacío significa que ese tipo no aplica a tus negociaciones.
 </p>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
 {(['salas','festivales','discotecas','ayuntamientos','medios','grupos'] as const).map((type) => (
 <div key={type} className="space-y-1.5">
 <label className="text-xs font-sans text-[var(--ink-2)] font-semibold block">
 {RESPONSE_LEARNED_CATEGORY_LABELS[type]}
 </label>
 <div className="relative">
 <input
 type="number"
 disabled={!isAdmin}
 value={config.minCacheByType?.[type] ||''}
 onChange={(e) => {
 const val = e.target.value ? Number(e.target.value) : undefined;
 setConfig({
 ...config,
 minCacheByType: {
 ...config.minCacheByType,
 [type]: val
 }
 });
 }}
 className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--surface)] text-[var(--ink)] text-xs font-sans focus: focus:outline-none disabled:opacity-60"
 placeholder="—"
 />
 <span className="absolute right-3 top-2.5 text-xs text-[var(--ink-2)] font-sans">€</span>
 </div>
 </div>
 ))}
 </div>

 <div className="pt-3 space-y-2">
 <h5 className="text-xs font-sans font-bold tracking-wider text-[var(--ink-2)] flex items-center gap-1.5">
 <Euro className="w-3.5 h-3.5" /> Caché de Inicio de Negociación (opcional)
 </h5>
 <p className="text-xs text-[var(--ink-2)]">
 Si la sala pregunta directamente por el caché, el agente responderá con esta cifra en vez del mínimo real, dejando margen para negociar a la baja sin bajar nunca del mínimo. Déjalo vacío para que el agente no mencione cifras salvo que le pregunten.
 </p>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
 {(['salas','festivales','discotecas','ayuntamientos','medios','grupos'] as const).map((type) => {
 const minVal = config.minCacheByType?.[type];
 const negStartVal = config.negotiationStartCacheByType?.[type];
 const isBelowMin = typeof minVal ==='number' && typeof negStartVal ==='number' && negStartVal < minVal;
 return (
 <div key={type} className="space-y-1.5">
 <label className="text-xs font-sans text-[var(--ink-2)] font-semibold block">
 {RESPONSE_LEARNED_CATEGORY_LABELS[type]}
 </label>
 <div className="relative">
 <input
 type="number"
 disabled={!isAdmin}
 value={negStartVal ||''}
 onChange={(e) => {
 const val = e.target.value ? Number(e.target.value) : undefined;
 setConfig({
 ...config,
 negotiationStartCacheByType: {
 ...config.negotiationStartCacheByType,
 [type]: val
 }
 });
 }}
 className={`w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--surface)] text-[var(--ink)] text-xs font-sans focus:outline-none disabled:opacity-60 ${isBelowMin ?'border-[var(--alert)]' :''}`}
 placeholder="—"
 />
 <span className="absolute right-3 top-2.5 text-xs text-[var(--ink-2)] font-sans">€</span>
 </div>
 {isBelowMin && <p className="text-[10px] text-[var(--alert)] font-sans">Por debajo del mínimo real (€{minVal})</p>}
 </div>
 );
 })}
 </div>
 </div>

 <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
 <label className="flex items-center gap-2 cursor-pointer text-[var(--ink-2)] font-sans">
 <input
 type="checkbox"
 disabled={!isAdmin}
 checked={config.autoDeclineUnderMinCache}
 onChange={(e) => setConfig({ ...config, autoDeclineUnderMinCache: e.target.checked })}
 className="rounded bg-[var(--surface)] text-[var(--acc)] focus:ring-amber-500 disabled:opacity-60"
 />
 <span>Rechazar amablemente si no se alcanza el caché mínimo</span>
 </label>

 <label className="flex items-center gap-2 cursor-pointer text-[var(--ink-2)] font-sans">
 <input
 type="checkbox"
 disabled={!isAdmin}
 checked={config.notifyOnEveryProposal}
 onChange={(e) => setConfig({ ...config, notifyOnEveryProposal: e.target.checked })}
 className="rounded bg-[var(--surface)] text-[var(--acc)] focus:ring-amber-500 disabled:opacity-60"
 />
 <span>Notificar en el panel cada vez que se prepare un nuevo correo</span>
 </label>
 </div>
 </div>
 </div>
 )}

 {/* TAB 3: EMAIL & BUZÓN DE DESPACHO */}
 {activeTab ==='email_dispatch' && (
 <div className="space-y-6">
 {/* Header Info */}
 <div className="p-3.5 rounded-[var(--r-m)] bg-gradient-to-r from-sky-500/10 to-indigo-500/10 text-[var(--ink-3)] text-xs flex items-start gap-3">
 <Mail className="w-5 h-5 text-[var(--ink-2)] shrink-0 mt-0.5" />
 <div className="space-y-1 leading-relaxed">
 <strong className="font-bold text-[var(--tentative)]/40">Configuración Central de Email para Agentes IA:</strong>
 <p className="text-[var(--ink-2)] text-[11px]">
 Aquí defines el buzón oficial y la identidad con la que los agentes redactarán propuestas, crearán borradores en Gmail y gestionarán las respuestas con las salas y promotores.
 </p>
 </div>
 </div>

 {/* 1. Remitente e Identidad del Agente */}
 <div className="p-4 rounded-[var(--r-m)] bg-[var(--surface)] space-y-4">
 <h4 className="text-xs font-sans font-bold tracking-wider text-[var(--acc)] flex items-center gap-1.5">
 <AtSign className="w-4 h-4" /> 1. Remitente Oficial de la Banda para los Agentes
 </h4>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs font-sans text-[var(--ink-2)] font-semibold flex items-center justify-between">
 <span>Email del Agente / Remitente</span>
 <span className="text-[10px] text-[var(--acc)]/80 font-sans">Obligatorio</span>
 </label>
 <input
 type="email"
 disabled={!isAdmin}
 value={config.agentSenderEmail ||''}
 onChange={(e) => setConfig({ ...config, agentSenderEmail: e.target.value })}
 className="w-full px-3 py-2.5 rounded-[var(--r-m)] bg-[var(--surface)] text-[var(--ink)] text-xs font-sans focus: focus:outline-none disabled:opacity-60"
 placeholder="ej: booking@tubanda.com o mibanda@gmail.com"
 />
 <p className="text-[10px] text-[var(--ink-2)]">
 Dirección de correo remitente que aparecerá en los encabezados y firma generada por la IA.
 </p>
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-sans text-[var(--ink-2)] font-semibold block">
 Nombre / Cargo del Remitente
 </label>
 <input
 type="text"
 disabled={!isAdmin}
 value={config.agentSenderName ||''}
 onChange={(e) => setConfig({ ...config, agentSenderName: e.target.value })}
 className="w-full px-3 py-2.5 rounded-[var(--r-m)] bg-[var(--surface)] text-[var(--ink)] text-xs font-sans focus: focus:outline-none disabled:opacity-60"
 placeholder={`ej: ${bandName} Booking & Management`}
 />
 <p className="text-[10px] text-[var(--ink-2)]">
 Nombre de la persona o departamento que firma las propuestas (ej: Booking & Management - {bandName}).
 </p>
 </div>

 <div className="space-y-1.5 sm:col-span-2">
 <label className="text-xs font-sans text-[var(--ink-2)] font-semibold block">
 Email de Respuesta (Reply-To) (Opcional)
 </label>
 <input
 type="email"
 disabled={!isAdmin}
 value={config.agentReplyToEmail ||''}
 onChange={(e) => setConfig({ ...config, agentReplyToEmail: e.target.value })}
 className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--surface)] text-[var(--ink)] text-xs font-sans focus: focus:outline-none disabled:opacity-60"
 placeholder="ej: contacto@tubanda.com (si es diferente al remitente)"
 />
 </div>
 </div>
 </div>

 {/* 2. Conexión de la bandeja de correo (Gmail sin contraseña vía OAuth, o
 SMTP/IMAP con contraseña de aplicación para Outlook/otros) - misma
 configuración que usa el Agente Enviador programado, sin duplicar aquí
 un mecanismo de conexión distinto al de EmailAccountConfig. */}
 <EmailAccountConfig bandId={bandId || currentUser?.band_id} />

 {/* 3. Modo de Despacho de Correo */}
 <div className="p-4 rounded-[var(--r-m)] bg-[var(--surface)] space-y-4">
 <h4 className="text-xs font-sans font-bold tracking-wider text-[var(--acc)] flex items-center gap-1.5">
 <Send className="w-4 h-4" /> 3. Modo de Despacho del Agente Enviador
 </h4>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 <button
 type="button"
 disabled={!isAdmin}
 onClick={() => setConfig({ ...config, dispatchMode:'draft_gmail' })}
 className={`p-4 rounded-[var(--r-m)] text-left transition-all flex flex-col justify-between gap-3 ${
 !isAdmin ?'opacity-80 cursor-default' :'cursor-pointer'
 } ${
 config.dispatchMode !=='direct_send'
 ?'bg-[var(--acc)]/20 text-[var(--ink)] ring-1 ring-amber-0/50'
 :'bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]'
 }`}
 >
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-[9px] font-sans tracking-widest font-bold text-[var(--ok)] bg-[var(--ok)]/10 px-2 py-0.5 rounded">
 Recomendado
 </span>
 <FileEdit className="w-4 h-4 text-[var(--acc)]" />
 </div>
 <h5 className="text-sm font-bold font-display text-[var(--ink)]">Crear Borrador en Gmail</h5>
 <p className="text-[11px] text-[var(--ink-2)] font-sans leading-snug">
 El agente prepara el correo en la carpeta"Borradores" de tu Gmail con sala, asunto, pitch y dossier adjunto. Puedes abrirlo, darle tu toque y pulsar Enviar desde Gmail o desde el CRM.
 </p>
 </div>
 </button>

 <button
 type="button"
 disabled={!isAdmin}
 onClick={() => setConfig({ ...config, dispatchMode:'direct_send' })}
 className={`p-4 rounded-[var(--r-m)] text-left transition-all flex flex-col justify-between gap-3 ${
 !isAdmin ?'opacity-80 cursor-default' :'cursor-pointer'
 } ${
 config.dispatchMode ==='direct_send'
 ?'bg-[var(--acc)]/20 text-[var(--ink)] ring-1 ring-amber-0/50'
 :'bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]'
 }`}
 >
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-[9px] font-sans tracking-widest font-bold text-[var(--ink-2)] bg-[var(--acc)]/10 px-2 py-0.5 rounded">
 Directo
 </span>
 <Send className="w-4 h-4 text-[var(--ink-2)]" />
 </div>
 <h5 className="text-sm font-bold font-display text-[var(--ink)]">Envío Directo tras Aprobación</h5>
 <p className="text-[11px] text-[var(--ink-2)] font-sans leading-snug">
 Tras pulsar"Aprobar Propuesta" o"Aprobar Respuesta" en el CRM, el agente despacha el correo directamente al email de la sala respetando las ventanas horarias comerciales.
 </p>
 </div>
 </button>
 </div>
 </div>

 </div>
 )}

 {/* TAB 4: HORARIOS & WORKFLOWS */}
 {activeTab ==='schedules' && (
 <div className="space-y-6">
 
 {/* Presets & Actions */}
 <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-[var(--r-m)] bg-[var(--surface)]">
 <div className="flex items-center gap-2">
 <Clock className="w-4 h-4 text-[var(--acc)]" />
 <span className="text-xs font-sans font-bold text-[var(--ink)]">Ventanas de Ejecución Comercial:</span>
 </div>
 {isAdmin && (
 <div className="flex flex-wrap items-center gap-2">
 <button
 type="button"
 onClick={applyPresetRecommendedBooking}
 className="px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--on-acc)] text-[11px] font-sans font-black transition-all cursor-pointer active:scale-95 flex items-center gap-1.5/10/20"
 >
 <Sparkles className="w-3.5 h-3.5" />
 <span>🌟 Sugerir Mejores Días (M-X-J)</span>
 </button>
 <button
 type="button"
 onClick={applyPresetCommercial}
 className="px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] text-[11px] font-sans font-bold transition-all cursor-pointer active:scale-95"
 >
 🏢 Laborables L-V
 </button>
 <button
 type="button"
 onClick={applyPresetAllDay}
 className="px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] text-[11px] font-sans transition-all cursor-pointer active:scale-95"
 >
 ⚡ Toda la Semana (7d)
 </button>
 </div>
 )}
 </div>

 {/* AI Best Days Intelligence Card */}
 <div className="p-4 rounded-[var(--r-m)] bg-[var(--acc)]/5 text-xs space-y-2.5">
 <div className="flex items-center justify-between gap-2">
 <div className="flex items-center gap-2 font-bold text-[var(--acc)]">
 <Sparkles className="w-4 h-4" />
 <span>Inteligencia de Booking: ¿Por qué Martes, Miércoles y Jueves?</span>
 </div>
 <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-[var(--acc)]/10 text-[var(--acc)]/70 font-bold">
 +45% Tasa de Respuesta
 </span>
 </div>
 <p className="leading-relaxed text-[var(--ink-2)] text-[11px]">
 En la industria del directo, los programadores de salas y festivales dedican el <strong>martes a jueves (10:00 - 14:00)</strong> a cerrar contrataciones. Los lunes gestionan incidencias del fin de semana y los viernes/sábados están en montaje de conciertos en vivo.
 </p>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-sans text-[10px]">
 <div className="p-2 rounded-[var(--r-s)] bg-[var(--surface)]/80 text-[var(--ink-2)] flex flex-col gap-0.5">
 <span className="text-[var(--acc)] font-bold">🔥 Martes a Jueves</span>
 <span className="text-[var(--ink-2)] font-sans text-[10px]">Ventana dorada de contratación y respuesta.</span>
 </div>
 <div className="p-2 rounded-[var(--r-s)] bg-[var(--surface)]/80 text-[var(--ink-2)] flex flex-col gap-0.5">
 <span className="text-[var(--ink-2)] font-bold">⏰ 10:00 a 14:00</span>
 <span className="text-[var(--ink-2)] font-sans text-[10px]">Franja de máxima apertura y lectura de email.</span>
 </div>
 <div className="p-2 rounded-[var(--r-s)] bg-[var(--surface)]/80 text-[var(--ink-2)] flex flex-col gap-0.5">
 <span className="text-[var(--ok)] font-bold">🛡️ Smart Gate Supabase</span>
 <span className="text-[var(--ink-2)] font-sans text-[10px]">Los agentes solo envían en los días/horas elegidos.</span>
 </div>
 </div>
 </div>

 {/* Timezone Selector */}
 <div className="space-y-1.5">
 <label className="text-xs font-sans text-[var(--ink-2)] font-semibold flex items-center gap-1.5">
 <Globe className="w-4 h-4 text-[var(--acc)]" /> Zona Horaria de la Banda
 </label>
 <select
 disabled={!isAdmin}
 value={timezone}
 onChange={(e) => setTimezone(e.target.value)}
 className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--surface)] text-[var(--ink)] text-xs font-sans focus: focus:outline-none disabled:opacity-60 cursor-pointer"
 >
 {TIMEZONES.map(tz => (
 <option key={tz.value} value={tz.value}>{tz.label}</option>
 ))}
 </select>
 </div>

 {/* DÍAS Y HORAS ENVIADOR */}
 <div className="p-4 rounded-[var(--r-m)] bg-[var(--surface)] space-y-4">
 {/* Header Enviador */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Send className="w-4 h-4 text-[var(--acc)]" />
 <div>
 <h4 className="text-xs font-sans font-bold tracking-wider text-[var(--ink)]">
 Agente Enviador (Días y Horas de Envío de Pitches)
 </h4>
 <p className="text-[10px] text-[var(--ink-2)]">
 Días y horas permitidas para despachar correos aprobados a salas de conciertos.
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-[var(--acc)]/10 text-[var(--acc)]/70 font-bold">
 {diasEnviador.length} días · {horasEnviador.length} horas
 </span>
 </div>
 </div>

 {/* Días de la semana Selector (Enviador) */}
 <div className="space-y-2 pt-1">
 <div className="flex items-center justify-between text-[11px] font-sans text-[var(--ink-2)]">
 <span className="font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
 <Calendar className="w-3.5 h-3.5 text-[var(--acc)]" /> Días de la Semana Habilitados:
 </span>
 {isAdmin && (
 <div className="flex items-center gap-1.5 text-[10px]">
 <button
 type="button"
 onClick={() => setDiasEnviador([2, 3, 4])}
 className="px-2 py-0.5 rounded bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--acc)]/70 transition-all cursor-pointer font-bold"
 >
 🔥 Solo Top (M, X, J)
 </button>
 <button
 type="button"
 onClick={() => setDiasEnviador([1, 2, 3, 4, 5])}
 className="px-2 py-0.5 rounded bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] transition-all cursor-pointer"
 >
 L-V
 </button>
 <button
 type="button"
 onClick={() => setDiasEnviador([1, 2, 3, 4, 5, 6, 7])}
 className="px-2 py-0.5 rounded bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] transition-all cursor-pointer"
 >
 Todos
 </button>
 <button
 type="button"
 onClick={() => setDiasEnviador([])}
 className="px-2 py-0.5 rounded bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] transition-all cursor-pointer"
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
 className={`p-2.5 rounded-[var(--r-m)] text-left flex flex-col justify-between gap-1 transition-all ${
 !isAdmin ?'cursor-default' :'cursor-pointer active:scale-95'
 } ${
 isSelected
 ?'bg-[var(--acc)]/15 text-[var(--ink)]/10/10 ring-1 ring-amber-0/30'
 :'bg-[var(--surface)]/90 text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]'
 }`}
 >
 <div className="flex items-center justify-between w-full">
 <span className={`text-xs font-sans font-bold ${isSelected ?'text-[var(--acc)]/70' :'text-[var(--ink-2)]'}`}>
 {day.short}
 </span>
 <span className={`w-2 h-2 rounded-full ${isSelected ?'bg-[var(--acc)]/60' :'bg-[var(--surface)]/70'}`} />
 </div>
 <span className="text-[11px] font-sans font-medium leading-tight truncate">
 {day.name}
 </span>
 {day.recommended && (
 <span className="text-[9px] font-sans px-1 py-0.2 rounded bg-[var(--acc)]/20 text-[var(--acc)]/70 font-bold self-start mt-0.5">
 {day.badge}
 </span>
 )}
 </button>
 );
 })}
 </div>
 </div>

 {/* Horas Enviador Grid */}
 <div className="space-y-2 pt-2">
 <div className="flex items-center justify-between text-[11px] font-sans text-[var(--ink-2)]">
 <span className="font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
 <Clock className="w-3.5 h-3.5 text-[var(--acc)]" /> Horas del Día Habilitadas:
 </span>
 {isAdmin && (
 <div className="flex items-center gap-1.5 text-[10px]">
 <button
 type="button"
 onClick={() => setHorasEnviador([10, 11, 12, 13])}
 className="px-2 py-0.5 rounded bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--acc)]/70 transition-all cursor-pointer font-bold"
 >
 🔥 Mañana (10-14h)
 </button>
 <button
 type="button"
 onClick={() => setHorasEnviador([9, 10, 11, 12, 13, 14, 15, 16, 17, 18])}
 className="px-2 py-0.5 rounded bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] transition-all cursor-pointer"
 >
 Jornada Completa
 </button>
 <button
 type="button"
 onClick={() => setHorasEnviador([])}
 className="px-2 py-0.5 rounded bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] transition-all cursor-pointer"
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
 const formatted = `${String(hour).padStart(2,'0')}:00`;
 return (
 <button
 key={`enviador-${hour}`}
 type="button"
 disabled={!isAdmin}
 onClick={() => toggleHoraEnviador(hour)}
 className={`p-2 rounded-[var(--r-s)] text-center font-sans text-[11px] font-bold transition-all ${
 !isAdmin ?'cursor-default' :'cursor-pointer active:scale-95'
 } ${
 isSelected
 ?'bg-[var(--acc)] text-[var(--on-acc)] font-black'
 : isPrimeTime
 ?'bg-[var(--surface)] text-[var(--acc)]/70/90 hover:text-[var(--ink)] hover:bg-[var(--surface)]/80'
 :'bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]/80'
 }`}
 >
 {formatted}
 </button>
 );
 })}
 </div>
 </div>
 </div>

 {/* Agente Lector: ya no tiene horario configurable - corre en TODOS los ticks del
 scheduler (cada ~60s), porque a diferencia del Enviador (que sí debe respetar
 una ventana comercial para no escribir de madrugada) leer la bandeja y detectar
 respuestas/borradores enviados no tiene ninguna razón para esperar. */}
 <div className="p-4 rounded-[var(--r-m)] bg-[var(--surface)] space-y-2">
 <div className="flex items-center gap-2">
 <Mail className="w-4 h-4 text-[var(--ink-2)]" />
 <h4 className="text-xs font-sans font-bold tracking-wider text-[var(--ink)]">
 Agente Lector (Bandeja de Entrada)
 </h4>
 <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-[var(--ok)]/10 text-[var(--ink-2)] font-bold">
 Siempre activo
 </span>
 </div>
 <p className="text-[11px] text-[var(--ink-2)] font-sans leading-relaxed">
 Revisa tu bandeja constantemente (cada minuto), sin horario configurable: detecta respuestas de las salas y actualiza el hilo del lead, y comprueba si algún borrador de Gmail se ha enviado a mano para marcar el lead como contactado. Las horas y días de abajo son solo para el Agente Enviador (el despacho de propuestas).
 </p>
 </div>

 {/* Monitor de Estado de Agentes de Supabase (GitHub Actions) */}
 <div className="p-4 rounded-[var(--r-m)] bg-[var(--surface)] space-y-3">
 <div className="flex items-center justify-between">
 <h4 className="text-xs font-sans font-bold tracking-wider text-[var(--ok)] flex items-center gap-1.5">
 <Activity className="w-4 h-4" /> Estado en Tiempo Real de Agentes (Supabase Engine)
 </h4>
 <span className="text-[10px] font-sans text-[var(--ok)]/80 bg-[var(--ok)]/10 px-2 py-0.5 rounded font-bold">
 Sistemas Operativos
 </span>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
 <div className="p-3 rounded-[var(--r-s)] bg-[var(--surface)]/90 flex items-center justify-between">
 <div className="flex items-center gap-2.5">
 <span className="w-2.5 h-2.5 rounded-full bg-[var(--ok)]/80" />
 <div>
 <div className="text-xs font-sans font-bold text-[var(--ink)]">Agente Scout (Búsqueda)</div>
 <div className="text-[10px] text-[var(--ink-2)] font-sans">Rastreo de salas y contactos</div>
 </div>
 </div>
 <span className="text-[10px] font-sans text-[var(--ink-2)] bg-[var(--ok-soft)] px-2 py-0.5 rounded font-bold">
 Listo
 </span>
 </div>

 <div className="p-3 rounded-[var(--r-s)] bg-[var(--surface)]/90 flex items-center justify-between">
 <div className="flex items-center gap-2.5">
 <span className="w-2.5 h-2.5 rounded-full bg-[var(--ok)]/80" />
 <div>
 <div className="text-xs font-sans font-bold text-[var(--ink)]">Agente Redactor (Gemini)</div>
 <div className="text-[10px] text-[var(--ink-2)] font-sans">Generador de propuestas y pitches</div>
 </div>
 </div>
 <span className="text-[10px] font-sans text-[var(--ink-2)] bg-[var(--ok-soft)] px-2 py-0.5 rounded font-bold">
 Activo
 </span>
 </div>

 <div className="p-3 rounded-[var(--r-s)] bg-[var(--surface)]/90 flex items-center justify-between">
 <div className="flex items-center gap-2.5">
 <span className={`w-2.5 h-2.5 rounded-full ${horasEnviador.length > 0 && diasEnviador.length > 0 ?'bg-[var(--ok)]/80' :'bg-[var(--acc)]/60'}`} />
 <div>
 <div className="text-xs font-sans font-bold text-[var(--ink)]">Agente Enviador (Gmail API)</div>
 <div className="text-[10px] text-[var(--ink-2)] font-sans">
 {diasEnviador.length}d/sem · {horasEnviador.length}h/día
 </div>
 </div>
 </div>
 <span className="text-[10px] font-sans text-[var(--ink-2)] bg-[var(--sunken)] px-2 py-0.5 rounded font-bold">
 {horasEnviador.length > 0 && diasEnviador.length > 0 ?'Programado' :'Pausado'}
 </span>
 </div>

 <div className="p-3 rounded-[var(--r-s)] bg-[var(--surface)]/90 flex items-center justify-between">
 <div className="flex items-center gap-2.5">
 <span className="w-2.5 h-2.5 rounded-full bg-[var(--tentative)]" />
 <div>
 <div className="text-xs font-sans font-bold text-[var(--ink)]">Agente Lector (Clasificador)</div>
 <div className="text-[10px] text-[var(--ink-2)] font-sans">
 Revisa la bandeja cada minuto, sin horario
 </div>
 </div>
 </div>
 <span className="text-[10px] font-sans text-[var(--ink-3)] bg-[var(--bg)]/60 px-2 py-0.5 rounded font-bold">
 En Escucha
 </span>
 </div>
 </div>
 </div>

 </div>
 )}

 {/* TAB 5: TONO & IDENTIDAD
 Antes esta pestaña tenía sus propios campos"Tono","Biografía" y"URL del EPK"
 que parecían configurar al Redactor pero no hacían nada real: dbUpsertAutonomyConfig
 los descartaba al guardar (ni siquiera llegaban a Supabase) y bandDna.ts - el código
 que de verdad construye los prompts de pitch/respuesta - nunca los leía. Un mánager
 podía rellenarlos de buena fe pensando que así entrenaba el tono de sus emails, sin
 ningún efecto. El tono real se entrena en ADN de Tono (BandToneModal, dentro de
 Gestión de Banda) y la biografía/EPK en la configuración del propio EPK - esta
 pestaña ahora solo señala hacia ahí en vez de duplicar una configuración fantasma. */}
 {activeTab ==='tone' && (
 <div className="space-y-6">
 <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--acc)]/10 text-[var(--acc)]/70 text-xs flex items-start gap-3">
 <Sparkles className="w-5 h-5 text-[var(--acc)] shrink-0 mt-0.5" />
 <div className="space-y-1 leading-relaxed">
 <strong className="font-bold text-[var(--ink)]">El tono y la biografía se entrenan en Gestión de Banda</strong>
 <p className="text-[var(--ink-2)] text-[11px]">
 Para que el Agente Redactor escriba con la voz real de {bandName}, el tono de comunicación, vocabulario propio y biografía se configuran en <strong className="text-[var(--ink)]">ADN de Tono</strong>, dentro de la ficha de la banda - no aquí. Ese es el único sitio donde esos datos llegan de verdad a los pitches y respuestas generados.
 </p>
 </div>
 </div>

 {/* Enlace a ADN de Tono */}
 <div className="p-4 rounded-[var(--r-m)] bg-gradient-to-r from-amber-0/10 to-orange-500/10 flex items-center justify-between gap-3">
 <div>
 <h4 className="text-xs font-sans font-bold text-[var(--acc)]/70 tracking-wider">
 ¿Quieres entrenar el tono de voz de la banda?
 </h4>
 <p className="text-[11px] text-[var(--ink-2)] font-sans mt-0.5">
 Analiza automáticamente vuestras redes sociales, o edita a mano el tono, tratamiento y vocabulario propio en ADN de Tono, dentro de Gestión de Banda.
 </p>
 </div>
 {onOpenBandProfile ? (
 <button
 type="button"
 onClick={() => {
 onClose();
 onOpenBandProfile();
 }}
 className="px-3 py-1.5 rounded-[var(--r-s)] bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--on-acc)] text-xs font-sans font-bold transition-all cursor-pointer shrink-0"
 >
 Ir a Gestión de Banda ➔
 </button>
 ) : (
 <span className="text-[10px] text-[var(--ink-2)] font-sans shrink-0 max-w-[160px] text-right">
 Búscalo en Gestión de Banda ➔ ADN de Tono
 </span>
 )}
 </div>

 {/* Enlace rápido a plantillas en Booking */}
 <div className="p-4 rounded-[var(--r-m)] bg-gradient-to-r from-amber-0/10 to-orange-500/10 flex items-center justify-between">
 <div>
 <h4 className="text-xs font-sans font-bold text-[var(--acc)]/70 tracking-wider">
 ¿Quieres afinar las plantillas de correo?
 </h4>
 <p className="text-[11px] text-[var(--ink-2)] font-sans mt-0.5">
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
 className="px-3 py-1.5 rounded-[var(--r-s)] bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--on-acc)] text-xs font-sans font-bold transition-all cursor-pointer shrink-0"
 >
 Ver Plantillas ➔
 </button>
 )}
 </div>

 </div>
 )}

 {/* TAB 2: ESTRATEGIAS DE RESPUESTA (guía condicional del Contestador según el tipo
 de mensaje que la sala responda - ver server/services/replyDrafting.ts) */}
 {activeTab ==='response_strategies' && (
 <div className="space-y-6">
 <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--tentative)]/10 text-[var(--tentative)]/80 text-xs flex items-start gap-3">
 <MessageSquare className="w-5 h-5 text-[var(--tentative)] shrink-0 mt-0.5" />
 <div className="space-y-1 leading-relaxed">
 <strong className="font-bold text-[var(--tentative)]/60">¿Cómo debe responder el agente cuando una sala contesta?</strong>
 <p className="text-[var(--ink-2)] text-[11px]">
 Cuando una sala responde a un correo, el Agente Lector detecta automáticamente de qué tipo de mensaje se trata y redacta un borrador. Aquí puedes darle instrucciones concretas para cada tipo de situación, además del tono a aplicar. El borrador siempre queda pendiente de tu aprobación antes de enviarse.
 </p>
 </div>
 </div>

 {/* Reglas aprendidas automáticamente de tus correcciones reales (Self-Refining
 Tone DNA), mostradas AQUÍ MISMO junto a la configuración manual de abajo para
 que sea fácil pillar si se contradicen: la config manual está organizada por
 TIPO de respuesta (negociación, confirmación...), esto por TIPO de sala (salas,
 festivales...) - no hay un cruce automático entre ambas, así que la detección
 de conflicto depende de que lo veas tú al leerlas juntas. */}
 {Object.keys(learnedResponseRules).length > 0 && (
 <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--acc)]/10 space-y-2.5">
 <div className="flex items-start gap-2">
 <Brain className="w-4 h-4 text-[var(--ink-2)] shrink-0 mt-0.5" />
 <div className="space-y-1">
 <span className="text-xs font-bold text-[var(--tentative)]/40 block">
 Lo que el sistema ya ha aprendido solo de tus respuestas reales
 </span>
 <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">
 Compara esto con lo que configures abajo: si se contradicen (p. ej. aquí dice"sé breve" pero abajo pides explicar mucho), la guía manual de abajo tiene prioridad, pero mejor evitar la contradicción desde el principio. Si una regla concreta no encaja, puedes quitarla desde <strong className="text-[var(--tentative)]/40">ADN de Tono → Reglas Aprendidas de tus Respuestas</strong> (ahí también se pueden borrar o añadir a mano).
 </p>
 </div>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
 {Object.entries(learnedResponseRules).map(([cat, reglas]) => (
 <div key={cat} className="p-2.5 rounded-[var(--r-s)] bg-[var(--sunken)] space-y-1">
 <span className="text-[10px] font-sans font-bold tracking-wider text-[var(--ink-3)]">
 {RESPONSE_LEARNED_CATEGORY_LABELS[cat] || cat}
 </span>
 {reglas.reglas_manuales && reglas.reglas_manuales.length > 0 && (
 <ul className="space-y-0.5">
 {reglas.reglas_manuales.map((r, idx) => (
 <li key={idx} className="text-[10px] font-sans text-[var(--ink)]">🔒 {r}</li>
 ))}
 </ul>
 )}
 {reglas.reglas_estilo_aprendidas && reglas.reglas_estilo_aprendidas.length > 0 ? (
 <ul className="space-y-0.5">
 {reglas.reglas_estilo_aprendidas.map((r, idx) => (
 <li key={idx} className="text-[10px] font-sans text-[var(--ink-2)]">⭐ {r}</li>
 ))}
 </ul>
 ) : (!reglas.reglas_manuales || reglas.reglas_manuales.length === 0) && (
 <p className="text-[10px] font-sans text-[var(--ink-2)]">Sin reglas todavía.</p>
 )}
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Atajo hacia Hilos de Email de Ejemplo (ExampleThreadsSection, dentro de Booking
 CRM > Plantillas de Email > por categoría): es la forma más rápida de arrancar
 con calidad desde el día 1 - a diferencia de las reglas de arriba (que necesitan
 2+ correcciones reales acumuladas para generarse solas), pegar 2-3 conversaciones
 reales ya buenas alimenta el few-shot de pitches Y respuestas al instante. Sin
 este aviso, esta herramienta es fácil de no descubrir nunca (vive dentro de una
 sub-pestaña de una sub-pestaña de otra pantalla). Reutiliza el mismo callback
 onOpenTemplatesSection que ya usan la pestaña Autonomía y Tono para lo mismo. */}
 <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--acc)]/10 flex items-center justify-between gap-3">
 <div>
 <h4 className="text-xs font-sans font-bold text-[var(--ink-3)] tracking-wider">
 ¿Quieres que aprenda rápido, sin esperar a corregir borradores?
 </h4>
 <p className="text-[11px] text-[var(--ink-2)] font-sans mt-0.5">
 Pega 2-3 conversaciones reales (vuestro mensaje + la respuesta de la sala) en Hilos de Email de Ejemplo. Alimentan al instante tanto el pitch inicial como las respuestas, sin esperar a acumular correcciones.
 </p>
 </div>
 {onOpenTemplatesSection ? (
 <button
 type="button"
 onClick={() => {
 onClose();
 onOpenTemplatesSection();
 }}
 className="px-3 py-1.5 rounded-[var(--r-s)] bg-[var(--acc)] hover:bg-[var(--tentative)] text-[var(--ink)] text-xs font-sans font-bold transition-all cursor-pointer shrink-0"
 >
 Ver Hilos de Ejemplo ➔
 </button>
 ) : (
 <span className="text-[10px] text-[var(--ink-2)] font-sans shrink-0 max-w-[160px] text-right">
 Búscalo en Plantillas de Email
 </span>
 )}
 </div>

 {RESPONSE_TYPES.map((type) => {
 const strategy = getStrategyOrDefault(type.key);
 return (
 <div key={type.key} className="p-4 rounded-[var(--r-m)] bg-[var(--surface)] space-y-3">
 <div className="flex items-center gap-2">
 <span className="p-1.5 rounded-[var(--r-s)] bg-[var(--tentative)]/10 text-[var(--tentative)]/80">
 {type.icon}
 </span>
 <div>
 <h4 className="text-xs font-sans font-bold tracking-wider text-[var(--ink)]">
 {type.label}
 </h4>
 <p className="text-[10px] text-[var(--ink-2)] font-sans">{type.description}</p>
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-sans text-[var(--ink-2)] font-semibold block">
 Instrucción para la IA (opcional)
 </label>
 <textarea
 disabled={!isAdmin}
 rows={2}
 value={strategy.guidancePrompt}
 onChange={(e) => updateStrategyField(type.key,'guidancePrompt', e.target.value)}
 placeholder={`Ej: ${
 type.key ==='price_negotiation'
 ?'Menciona que somos flexibles con taquilla compartida, pero no des cifras concretas por email.'
 : type.key ==='confirmation'
 ?'Pide directamente los datos técnicos del rider y el horario de la prueba de sonido.'
 : type.key ==='rejection'
 ?'Pregunta si hay otras fechas disponibles más adelante en la temporada.'
 :'Responde de forma breve y concreta a lo que pregunten, sin extenderte.'
 }`}
 className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--surface)] text-[var(--ink)] text-xs font-sans focus:outline-none disabled:opacity-60 resize-none"
 />
 <p className="text-[10px] text-[var(--ink-2)]">
 Si lo dejas vacío, el agente usa una guía automática genérica para este tipo de respuesta.
 </p>
 </div>

 <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
 <div className="space-y-1 flex-1">
 <label className="text-[10px] font-sans text-[var(--ink-2)] font-semibold block">Tono</label>
 <div className="flex gap-1.5">
 {(['neutral','enthusiastic','cautious'] as ResponseTone[]).map((toneOption) => (
 <button
 key={toneOption}
 type="button"
 disabled={!isAdmin}
 onClick={() => updateStrategyField(type.key,'tone', toneOption)}
 className={`px-2.5 py-1 rounded-[var(--r-s)] text-[10px] font-sans font-bold transition-all ${
 !isAdmin ?'cursor-default' :'cursor-pointer'
 } ${
 strategy.tone === toneOption
 ?'bg-[var(--tentative)]/20 text-[var(--tentative)]/60'
 :'bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 {toneOption ==='neutral' ?'Neutral' : toneOption ==='enthusiastic' ?'Entusiasta' :'Prudente'}
 </button>
 ))}
 </div>
 </div>

 <label className="flex items-center gap-2 cursor-pointer text-[var(--ink-2)] font-sans text-[11px]">
 <input
 type="checkbox"
 disabled={!isAdmin}
 checked={strategy.mentionLinks}
 onChange={(e) => updateStrategyField(type.key,'mentionLinks', e.target.checked)}
 className="rounded bg-[var(--surface)] text-[var(--acc)] focus:ring-purple-500 disabled:opacity-60"
 />
 <span>Mencionar enlace al Dossier/EPK si procede</span>
 </label>
 </div>
 </div>
 );
 })}

 {isAdmin && (
 <div className="flex items-center justify-between gap-3 pt-1">
 {strategiesFeedback && (
 <span className="text-[11px] font-sans text-[var(--ink-2)]">{strategiesFeedback}</span>
 )}
 <button
 type="button"
 onClick={handleSaveResponseStrategies}
 disabled={isSavingStrategies}
 className="ml-auto px-4 py-2 rounded-[var(--r-m)] bg-[var(--tentative)] hover:bg-[var(--acc)] text-[var(--ink)] font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
 >
 {isSavingStrategies ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
 <span>{isSavingStrategies ?'Guardando...' :'Guardar Estrategias de Respuesta'}</span>
 </button>
 </div>
 )}
 </div>
 )}

 {/* TAB 6: AUDITORÍA & TRAZABILIDAD */}
 {activeTab ==='audit_logs' && (
 <div className="space-y-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
 <div>
 <h4 className="text-xs font-sans font-bold tracking-wider text-[var(--ok)] flex items-center gap-2">
 <ShieldCheck className="w-4 h-4" /> Registro de Auditoría de Ejecución de Agentes
 </h4>
 <p className="text-[11px] text-[var(--ink-2)] mt-0.5">
 Trazabilidad de qué usuario o proceso disparó cada agente, duración y salas impactadas en Supabase.
 </p>
 </div>
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={handleExportAuditLogsCSV}
 disabled={auditLogs.length === 0}
 className="px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--ok-soft)] hover:bg-[var(--ok-soft)] text-[var(--ink-2)] text-xs font-sans flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
 title="Descargar historial de auditoría en formato CSV"
 >
 <Download className="w-3.5 h-3.5" />
 <span>Exportar CSV</span>
 </button>
 <button
 type="button"
 onClick={loadAuditLogs}
 disabled={loadingAuditLogs}
 className="px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] text-xs font-sans flex items-center gap-1.5 cursor-pointer"
 >
 <RefreshCw className={`w-3.5 h-3.5 ${loadingAuditLogs ?'animate-spin' :''}`} />
 <span>Refrescar</span>
 </button>
 </div>
 </div>

 {/* Filtros por Agente */}
 <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-sans">
 <span className="text-[var(--ink-2)] text-[10px] font-bold mr-1">Filtrar:</span>
 {[
 { id:'all', label:'Todos' },
 { id:'scout', label:'Scout' },
 { id:'redactor', label:'Redactor' },
 { id:'enviador', label:'Enviador' },
 { id:'lector', label:'Lector' }
 ].map(f => (
 <button
 key={f.id}
 type="button"
 onClick={() => setAuditAgentFilter(f.id)}
 className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer font-bold ${
 auditAgentFilter === f.id
 ?'bg-[var(--ok)]/20 text-[var(--ink-2)]/50'
 :'bg-[var(--surface)]/60 text-[var(--ink-2)] hover:text-[var(--ink-2)]'
 }`}
 >
 {f.label}
 </button>
 ))}
 </div>

 {loadingAuditLogs ? (
 <div className="flex flex-col items-center justify-center py-12 gap-2 text-[var(--ink-2)] font-sans text-xs">
 <Loader2 className="w-6 h-6 animate-spin text-[var(--ok)]" />
 <span>Cargando registros de auditoría desde Supabase...</span>
 </div>
 ) : auditLogs.length === 0 ? (
 <div className="p-8 text-center rounded-[var(--r-m)] bg-[var(--surface)]/60 text-[var(--ink-2)] font-sans text-xs space-y-2">
 <Activity className="w-6 h-6 mx-auto text-[var(--ink-2)]" />
 <p>Aún no hay registros de auditoría guardados en Supabase.</p>
 </div>
 ) : (
 <div className="space-y-2.5 max-h-[48vh] overflow-y-auto pr-1">
 {auditLogs
 .filter(l => auditAgentFilter ==='all' || (l.agente ||'').toLowerCase().includes(auditAgentFilter))
 .map((log) => {
 const isSuccess = log.estado ==='success';
 const isError = log.estado ==='error';
 const affectedCount = log.conteo_afectados || (log.leads_afectados ? log.leads_afectados.length : 0);
 const formattedDate = new Date(log.created_at).toLocaleString('es-ES', {
 day:'2-digit', month:'2-digit', year:'numeric',
 hour:'2-digit', minute:'2-digit', second:'2-digit'
 });

 return (
 <div
 key={log.id}
 className="p-3.5 rounded-[var(--r-m)] bg-[var(--surface)]/80 hover: transition-colors space-y-2"
 >
 <div className="flex flex-wrap items-center justify-between gap-2">
 <div className="flex items-center gap-2">
 <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold tracking-wider ${
 log.agente ==='enviador' ?'bg-[var(--acc)]/10 text-[var(--acc)]/70' :
 log.agente ==='scout' ?'bg-[var(--acc)]/10 text-[var(--ink-3)]' :
 log.agente ==='redactor' ?'bg-[var(--tentative)]/10 text-[var(--tentative)]/80' :'bg-[var(--ok)]/10 text-[var(--ink-2)]'
 }`}>
 Agente {log.agente}
 </span>
 <span className="px-2 py-0.5 rounded text-[10px] font-sans bg-[var(--surface)]/80 text-[var(--ink-2)]">
 {log.motor ||'supabase_edge'}
 </span>
 <span className={`text-[10px] font-sans font-bold ${isSuccess ?'text-[var(--ok)]' : isError ?'text-[var(--alert)]' :'text-[var(--acc)]'}`}>
 {isSuccess ?'✓ Éxito' : isError ?'✕ Fallo' :'⚠ Aviso'}
 </span>
 </div>

 <div className="flex items-center gap-2 text-[10px] font-sans text-[var(--ink-2)]">
 <Clock className="w-3 h-3 text-[var(--ink-2)]" />
 <span>{formattedDate}</span>
 {log.duracion_ms > 0 && (
 <span className="text-[var(--ink-2)]">({log.duracion_ms}ms)</span>
 )}
 </div>
 </div>

 <p className="text-xs text-[var(--ink)] font-sans leading-relaxed">
 {log.mensaje}
 </p>

 <div className="flex flex-wrap items-center justify-between gap-2 pt-1 /60 text-[10px] font-sans text-[var(--ink-2)]">
 <div className="flex items-center gap-1.5">
 <UserCheck className="w-3 h-3 text-[var(--ink-2)]" />
 <span>Disparado por: <strong className="text-[var(--ink-2)]">{log.usuario_email || log.usuario_id ||'Sistema'}</strong> ({log.disparado_por_tipo})</span>
 </div>
 {affectedCount > 0 && (
 <span className="text-[var(--acc)]/70/90 font-bold">
 {affectedCount} sala(s) impactada(s)
 </span>
 )}
 </div>

 {/* Detalle de leads afectados si existen */}
 {Array.isArray(log.leads_afectados) && log.leads_afectados.length > 0 && (
 <div className="mt-2 pt-2 /40 space-y-1.5">
 <span className="text-[10px] font-sans font-bold text-[var(--ink-2)] tracking-wider flex items-center justify-between">
 <span>Salas / Leads Procesados ({log.leads_afectados.length}):</span>
 </span>
 <div className="grid grid-cols-1 gap-1.5">
 {log.leads_afectados.map((item: any, idx: number) => (
 <div key={idx} className="p-2 rounded-[var(--r-s)] bg-[var(--surface)]/70 text-[11px] font-sans flex flex-wrap items-center justify-between gap-2">
 <div className="flex items-center gap-2 min-w-0">
 <span className="text-[var(--acc)] font-bold">🏛️ {item.nombre_sala ||'Sala sin nombre'}</span>
 {item.email_contacto && (
 <span className="text-[var(--ink-2)] text-[10px] truncate max-w-[200px]">&lt;{item.email_contacto}&gt;</span>
 )}
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <span className="px-1.5 py-0.5 rounded text-[9px] bg-[var(--surface)]/80 text-[var(--ink-2)]">
 ID: {item.id}
 </span>
 <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--ok)]/10 text-[var(--ink-2)]">
 {item.estado_anterior ||'aprobado'} ➔ {item.estado_nuevo ||'contactado'}
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
 <div className={`p-4 flex flex-wrap items-center justify-between gap-3 shrink-0 ${
 'bg-[var(--surface)]'
 }`}>
 <div className="flex items-center gap-2 text-xs font-sans text-[var(--ink-2)]">
 <ShieldCheck className="w-4 h-4 text-[var(--ok)]" />
 <span>Aislamiento Multi-Tenant: <strong className="text-[var(--ink)]">{bandId}</strong></span>
 </div>

 <div className="flex items-center gap-2">
 <button
 onClick={onClose}
 className="px-4 py-2 rounded-[var(--r-m)] bg-[var(--surface)]/80 text-[var(--ink-2)] text-xs font-sans font-bold hover:bg-[var(--surface)]/70 transition-colors cursor-pointer"
 >
 Cerrar
 </button>

 {isAdmin && (
 <button
 onClick={handleSave}
 disabled={isSaving || isLoading}
 className="px-5 py-2 rounded-[var(--r-m)] bg-[var(--acc)] text-[var(--on-acc)] text-xs font-sans font-bold hover:bg-[var(--acc)]/60 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
 >
 {isSaving ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin text-[var(--acc-ink)]" />
 <span>Guardando Ajustes...</span>
 </>
 ) : savedSuccess ? (
 <>
 <CheckCircle2 className="w-4 h-4 text-[var(--acc-ink)]" />
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
