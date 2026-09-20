import React, { useState, useEffect } from'react';
import { EPKConfig, Lead, Concert, Rehearsal, SocialMetric, Fan, Tour, User } from'../../types';
import { 
 Sparkles, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, 
 HelpCircle, ChevronDown, ChevronUp, Bot, FileText, Disc3, Calendar,
 Activity, Heart, Truck, X, BookOpen, Layers, Sliders, Clock, Mail, Key
} from'lucide-react';
import { api } from'../../services/api';

interface ProfileCompletenessCardProps {
 epkConfig?: Partial<EPKConfig>;
 leads: Lead[];
 concerts: Concert[];
 rehearsals: Rehearsal[];
 metrics: SocialMetric[];
 fans?: Fan[];
 tours?: Tour[];
 isStitchLight?: boolean;
 bandName?: string;
 currentUser?: User | null;
 onNavigate?: (view: any, options?: any) => void;
 onOpenAutonomyModal?: () => void;
 onOpenProfileModal?: () => void;
}

export const ProfileCompletenessCard: React.FC<ProfileCompletenessCardProps> = ({
 epkConfig,
 leads = [],
 concerts = [],
 rehearsals = [],
 metrics = [],
 fans = [],
 tours = [],
 isStitchLight = false,
 bandName ='Tu Banda',
 currentUser,
 onNavigate,
 onOpenAutonomyModal,
 onOpenProfileModal
}) => {
 const [showAuditModal, setShowAuditModal] = useState(false);
 const [isExpanded, setIsExpanded] = useState(false);
 const [hasScheduleConfigured, setHasScheduleConfigured] = useState(false);
 const [hasEmailAccountConnected, setHasEmailAccountConnected] = useState(false);
 const [hasMinCacheConfigured, setHasMinCacheConfigured] = useState(false);

 useEffect(() => {
 let isMounted = true;
 const checkSchedule = async () => {
 try {
 const bandId = currentUser?.band_id;
 if (!bandId) { setHasScheduleConfigured(false); return; }
 const schedule = await api.getBandSchedule(bandId);
 if (isMounted && schedule) {
 const hasHours = (Array.isArray(schedule.horas_lector) && schedule.horas_lector.length > 0) ||
 (Array.isArray(schedule.horas_enviador) && schedule.horas_enviador.length > 0);
 setHasScheduleConfigured(hasHours);
 }
 } catch {
 if (isMounted) setHasScheduleConfigured(false);
 }
 };
 checkSchedule();
 return () => { isMounted = false; };
 }, [currentUser]);

 useEffect(() => {
 let isMounted = true;
 const checkEmailAccount = async () => {
 try {
 const bandId = currentUser?.band_id;
 if (!bandId) { setHasEmailAccountConnected(false); return; }
 const [gmailOAuth, imapAccount] = await Promise.all([
 api.getGmailOAuthStatus().catch(() => null),
 api.getBandEmailAccount(bandId).catch(() => null)
 ]);
 if (isMounted) setHasEmailAccountConnected(Boolean(gmailOAuth?.connected) || Boolean(imapAccount?.connected));
 } catch {
 if (isMounted) setHasEmailAccountConnected(false);
 }
 };
 checkEmailAccount();
 return () => { isMounted = false; };
 }, [currentUser]);

 useEffect(() => {
 // Check if autonomy config / min cache is configured
 const autonomy = (currentUser as any)?.autonomy_config;
 if (autonomy?.minCacheByType && Object.values(autonomy.minCacheByType).some((v: any) => Number(v) > 0)) {
 setHasMinCacheConfigured(true);
 } else if (autonomy?.min_cache && Number(autonomy.min_cache) > 0) {
 setHasMinCacheConfigured(true);
 } else {
 setHasMinCacheConfigured(false);
 }
 }, [currentUser]);

 // Read stored songs from localStorage safely
 const storedSongsCount = React.useMemo(() => {
 try {
 const raw = localStorage.getItem('bakandeya_songs_catalog') || localStorage.getItem('bakandeya_songs');
 if (raw) {
 const parsed = JSON.parse(raw);
 if (Array.isArray(parsed)) return parsed.length;
 }
 return 0;
 } catch {
 return 0;
 }
 }, []);

 // Compute profile completeness pillars
 const pillars = React.useMemo(() => {
 const hasBio = Boolean(
 epkConfig?.biografia && 
 epkConfig.biografia.trim().length >= 80 && 
 !epkConfig.biografia.toLowerCase().includes('por definir') &&
 !epkConfig.biografia.includes('Propuesta musical en directo')
 );
 const hasPhotoLogo = Boolean(epkConfig?.logoUrl || (epkConfig?.bandPhotos && epkConfig.bandPhotos.length > 0));
 const hasDossierPdf = Boolean(
 (epkConfig?.dossierPdfUrl && epkConfig.dossierPdfUrl.trim().length > 5) || 
 (epkConfig?.dossierDocumentUrl && epkConfig.dossierDocumentUrl.trim().length > 5) || 
 (epkConfig?.dossierTextoExtra && epkConfig.dossierTextoExtra.trim().length >= 80 && !epkConfig.dossierTextoExtra.toLowerCase().includes('por definir'))
 );
 const hasRiderPdf = Boolean(
 (epkConfig?.riderPdfUrl && epkConfig.riderPdfUrl.trim().length > 5) || 
 (epkConfig?.riderTecnico && epkConfig.riderTecnico.trim().length >= 80 && !epkConfig.riderTecnico.toLowerCase().includes('por definir'))
 );
 const hasLeads = leads.length > 0;
 const hasVerifiedEmails = leads.some(l => l.email_contacto && l.email_contacto.includes('@'));
 const hasSongs = storedSongsCount > 0;
 const hasAgenda = concerts.length > 0 || rehearsals.length > 0;
 const hasMetrics = metrics.length > 0;
 const hasFans = fans.length > 0 || Boolean(epkConfig?.incentivoFans?.enlaceDescarga || epkConfig?.incentivoFans?.codigoDescuento);
 const hasToneDna = Boolean(
 (epkConfig as any)?.toneDna || 
 (currentUser as any)?.bandToneDna || 
 (epkConfig?.biografia && epkConfig.biografia.length > 120)
 );

 return [
 {
 id:'epk_bio',
 title:'Biografía & Logo (EPK)',
 completed: hasBio && hasPhotoLogo,
 weight: 10,
 view:'epk',
 missingLabel:'Rellenar Bio & Logo',
 agentImpact:'El Agente Redactor usa la Bio e identidad de la banda para los emails de presentación.'
 },
 {
 id:'dossier_pdf',
 title:'Dossier Promocional PDF',
 completed: hasDossierPdf,
 weight: 10,
 view:'epk',
 missingLabel:'Subir Dossier PDF',
 agentImpact:'Los programadores de salas solicitan el Dossier PDF adjunto para valorar el proyecto de un vistazo.'
 },
 {
 id:'rider_pdf',
 title:'Rider Técnico / Input List',
 completed: hasRiderPdf,
 weight: 10,
 view:'epk',
 missingLabel:'Subir Rider Técnico',
 agentImpact:'Las salas necesitan confirmar qué microfonía y líneas requiere la banda antes de reservar fecha.'
 },
 {
 id:'email_account',
 title:'Buzón Conectado (Gmail/SMTP)',
 completed: hasEmailAccountConnected,
 weight: 12,
 view:'profile',
 missingLabel:'Conectar Email',
 agentImpact:'Permite al Agente Enviador mandar propuestas y al Lector clasificar respuestas desde tu bandeja real.'
 },
 {
 id:'smart_gate',
 title:'Horarios de Envío (Smart Gate)',
 completed: hasScheduleConfigured,
 weight: 10,
 view:'profile',
 missingLabel:'Configurar Horarios',
 agentImpact:'Despacha correos únicamente en días y horas de máxima apertura comercial de programadores.'
 },
 {
 id:'negotiation_cache',
 title:'Caché & Reglas de Negociación',
 completed: hasMinCacheConfigured,
 weight: 10,
 view:'autonomy_modal',
 missingLabel:'Fijar Caché Mínimo',
 agentImpact:'El Agente Mánager negocia fechas y presupuestos respetando el caché mínimo fijado por la banda.'
 },
 {
 id:'tone_dna',
 title:'Tone DNA & Identidad Vocal',
 completed: hasToneDna,
 weight: 10,
 view:'bandas',
 missingLabel:'Configurar Tone DNA',
 agentImpact:'Define la voz, vocabulario y personalidad con la que los agentes redactan pitches y copys.'
 },
 {
 id:'leads',
 title:'Directorio Booking & Salas',
 completed: hasLeads && hasVerifiedEmails,
 weight: 10,
 view:'booking',
 missingLabel:'Buscar Salas con Scout',
 agentImpact:'Scout y Redactor extraen contactos y correos de programación para las campañas.'
 },
 {
 id:'repertorio',
 title:'Repertorios & Discografía',
 completed: hasSongs,
 weight: 10,
 view:'repertorio',
 missingLabel:'Cargar Canciones',
 agentImpact:'Permite al Mánager AI armar setlists exactos ajustados al minutaje del show (45m, 60m, 90m).'
 },
 {
 id:'metrics_fans',
 title:'Métricas de Escuchas & Fans',
 completed: hasMetrics || hasFans,
 weight: 8,
 view:'reels',
 missingLabel:'Métricas / Fans',
 agentImpact:'El agente utiliza tus seguidores y oyentes en Spotify como argumento de venta y taquilla.'
 }
 ];
 }, [epkConfig, leads, storedSongsCount, concerts, rehearsals, metrics, fans, hasScheduleConfigured, hasEmailAccountConnected, hasMinCacheConfigured, currentUser]);

 const totalCompletedWeight = pillars.reduce((acc, p) => p.completed ? acc + p.weight : acc, 0);
 const totalPossibleWeight = pillars.reduce((acc, p) => acc + p.weight, 0);
 const percentage = Math.min(100, Math.round((totalCompletedWeight / totalPossibleWeight) * 100));
 const completedPillarsCount = pillars.filter(p => p.completed).length;

 const getStatusBadge = () => {
 if (percentage >= 85) return { label:'Entrenamiento Completo (100% Agéntico)', color:'bg-emerald-500/15 text-emerald-400 border-[var(--ok)]/30' };
 if (percentage >= 50) return { label:'Entrenamiento Intermedio', color:'bg-[var(--acc)]/15 text-[var(--acc)]/70 /30' };
 return { label:'Entrenamiento Inicial', color:'bg-rose-500/15 text-[var(--ink-2)] border-[var(--alert)]/30' };
 };

 const handlePillarClick = (view: string) => {
 if (view ==='autonomy_modal') {
 if (onOpenAutonomyModal) {
 onOpenAutonomyModal();
 } else if (onNavigate) {
 onNavigate('profile');
 }
 } else if (view ==='profile') {
 if (onOpenProfileModal) {
 onOpenProfileModal();
 } else if (onNavigate) {
 onNavigate('profile');
 }
 } else if (onNavigate) {
 onNavigate(view);
 }
 };

 const badgeInfo = getStatusBadge();

 return (
 <div className={`p-4 sm:p-5 rounded-[var(--r-l)] transition-all shadow-sm bg-[var(--surface)] border-[var(--hair)] text-[var(--ink)]`}>
 {/* Header Row */}
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[var(--hair)]/60">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-[var(--r-m)] bg-[var(--acc)]/10 text-[var(--acc)] flex items-center justify-center shrink-0 font-mono font-bold text-sm">
 {percentage}%
 </div>
 <div>
 <div className="flex items-center gap-2 flex-wrap">
 <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--ink)] flex items-center gap-1.5">
 <Bot className="w-3.5 h-3.5 text-[var(--acc)]" />
 Entrenamiento & Preparación de Agentes IA
 </h3>
 <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${badgeInfo.color}`}>
 {badgeInfo.label}
 </span>
 </div>
 <p className="text-[11px] text-[var(--ink-2)] mt-0.5">
 {completedPillarsCount} de {pillars.length} factores configurados para {bandName}.
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
 {onOpenAutonomyModal && (
 <button
 onClick={() => onOpenAutonomyModal()}
 className="px-2.5 py-1.5 rounded-[var(--r-s)] bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
 >
 <Sliders className="w-3.5 h-3.5 text-purple-400" />
 <span className="hidden xs:inline">Autonomía & Caché</span>
 </button>
 )}

 <button
 onClick={() => setShowAuditModal(true)}
 className="px-2.5 py-1.5 rounded-[var(--r-s)] bg-[var(--surface)]/60 hover:bg-stone-700 text-[var(--ink-2)] text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
 >
 <HelpCircle className="w-3.5 h-3.5 text-[var(--ink-2)]" />
 <span>Info</span>
 </button>
 
 <button
 onClick={() => setIsExpanded(!isExpanded)}
 className="px-2.5 py-1.5 rounded-[var(--r-s)] bg-[var(--surface)]/60 hover:bg-stone-700 text-[var(--acc)] text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
 title="Expandir/colapsar checklist"
 >
 <span>{isExpanded ?'Ocultar' :'Ver checklist'}</span>
 {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
 </button>
 </div>
 </div>

 {/* Progress Bar */}
 <div className="pt-3 space-y-1.5">
 <div className="w-full h-2 rounded-full bg-[var(--surface)]/80 overflow-hidden relative">
 <div
 className="h-full rounded-full bg-gradient-to-r from-[var(--ok)] to-[var(--acc)] transition-all duration-500"
 style={{ width: `${percentage}%` }}
 />
 </div>
 </div>

 {/* Compact Trigger Button when Collapsed */}
 {!isExpanded && (
 <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-1">
 <div className="flex items-center gap-1.5 flex-wrap">
 {pillars.map(p => (
 <span
 key={`badge-${p.id}`}
 className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md ${
 p.completed
 ?'bg-[var(--ok-soft)] border-[var(--ok)]/20 text-[var(--ok)]'
 :'bg-[var(--surface)]/80 border-[var(--hair)] text-[var(--ink-2)]'
 }`}
 >
 {p.completed ? <CheckCircle2 className="w-2.5 h-2.5 text-[var(--ok)] shrink-0" /> : <AlertCircle className="w-2.5 h-2.5 text-[var(--acc)]/80 shrink-0" />}
 <span>{p.title.split('')[0]}</span>
 </span>
 ))}
 </div>
 <button
 onClick={() => setIsExpanded(true)}
 className="text-[var(--acc)] hover:text-[var(--acc)]/70 font-mono text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
 >
 <span>Ver detalles y configurar</span>
 <ChevronDown className="w-3 h-3" />
 </button>
 </div>
 )}

 {/* Full Grid and Detailed Accordion when Expanded */}
 {isExpanded && (
 <div className="mt-4 space-y-4 animate-in fade-in duration-200">
 {/* Pill Grid */}
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2">
 {pillars.map(pillar => (
 <button
 key={pillar.id}
 onClick={() => handlePillarClick(pillar.view)}
 className={`p-2.5 rounded-[var(--r-m)] text-left transition-all flex flex-col justify-between gap-1 cursor-pointer group active:scale-95 ${
 pillar.completed
 ?'bg-[var(--ok-soft)] border-[var(--ok)]/20 text-[var(--ink-2)] hover:bg-[var(--ok-soft)]'
 :'bg-[var(--acc-soft)] text-[var(--ink)] hover:bg-[var(--acc-soft)]'
 }`}
 >
 <div className="flex items-center justify-between gap-1">
 <span className="text-[11px] font-mono font-bold truncate">{pillar.title}</span>
 {pillar.completed ? (
 <CheckCircle2 className="w-3.5 h-3.5 text-[var(--ok)] shrink-0" />
 ) : (
 <AlertCircle className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
 )}
 </div>

 <span className={`text-[9px] font-mono font-medium truncate ${
 pillar.completed ?'text-[var(--ok)]/80' :'text-[var(--acc)] group-hover:underline'
 }`}>
 {pillar.completed ?'Completado' : pillar.missingLabel}
 </span>
 </button>
 ))}
 </div>

 {/* Detailed Breakdown List */}
 <div className="pt-2 border-t border-[var(--hair)]/80 space-y-2.5">
 <div className="flex items-center justify-between">
 <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--acc)]">
 Checklist de Configuración Agéntica ({completedPillarsCount}/{pillars.length})
 </h4>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-sans">
 {pillars.map(pillar => (
 <div
 key={`exp-${pillar.id}`}
 className={`p-2.5 rounded-[var(--r-m)] flex items-start justify-between gap-3 ${
 pillar.completed ?'bg-[var(--surface)]/40' :'bg-[var(--acc)]/5'
 }`}
 >
 <div className="space-y-0.5">
 <div className="flex items-center gap-1.5">
 {pillar.completed ? (
 <CheckCircle2 className="w-3.5 h-3.5 text-[var(--ok)] shrink-0" />
 ) : (
 <AlertCircle className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
 )}
 <span className="font-bold text-[var(--ink)] text-xs">{pillar.title}</span>
 </div>
 <p className="text-[10px] text-[var(--ink-2)] leading-snug">
 {pillar.agentImpact}
 </p>
 </div>

 {!pillar.completed && (
 <button
 onClick={() => handlePillarClick(pillar.view)}
 className="px-2 py-1 rounded-[var(--r-s)] bg-[var(--acc)] text-[var(--acc-ink)] font-mono font-bold text-[10px] shrink-0 hover:bg-[var(--acc)]/60 transition-colors cursor-pointer"
 >
 Configurar
 </button>
 )}
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 {/* AUDIT MODAL */}
 {showAuditModal && (
 <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
 <div className="bg-[var(--surface)] rounded-[var(--r-l)] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
 <div className="flex justify-between items-start">
 <div className="flex items-center gap-3">
 <div className="p-2.5 bg-[var(--acc)]/20 rounded-[var(--r-m)] text-[var(--acc)]">
 <Bot className="w-6 h-6" />
 </div>
 <div>
 <h3 className="text-lg font-bold font-display uppercase tracking-wider text-[var(--ink)]">
 Entrenamiento de Agentes IA para {bandName}
 </h3>
 <p className="text-xs text-[var(--ink-2)] font-mono">
 Cómo utiliza cada agente tu información para conseguir más y mejores conciertos
 </p>
 </div>
 </div>

 <button
 onClick={() => setShowAuditModal(false)}
 className="p-1 text-[var(--ink-2)] hover:text-[var(--ink)] rounded-[var(--r-s)] hover:bg-[var(--surface)]/80 cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="space-y-3 text-xs text-[var(--ink-2)] font-sans leading-relaxed">
 <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1.5">
 <h4 className="font-bold text-[var(--acc)] flex items-center gap-2 text-sm font-display">
 <Bot className="w-4 h-4" /> 1. Agente Scout (Prospección de Salas & Recintos)
 </h4>
 <p className="text-[var(--ink-2)] text-xs">
 Busca automáticamente salas, festivales y fiestas patronales en las regiones seleccionadas. Filtra por aforo y género para encontrar sólo recintos compatibles.
 </p>
 </div>

 <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1.5">
 <h4 className="font-bold text-[var(--acc)] flex items-center gap-2 text-sm font-display">
 <FileText className="w-4 h-4" /> 2. Agente Redactor (Pitches Personalizados & ADN de Tono)
 </h4>
 <p className="text-[var(--ink-2)] text-xs">
 Redacta las propuestas de correo para las salas extrayendo hitos de tu <strong className="text-[var(--ink)]">Biografía</strong>, adjuntando tu <strong className="text-[var(--ink)]">Dossier PDF</strong> y adaptando el vocabulario a la voz de la banda.
 </p>
 </div>

 <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1.5">
 <h4 className="font-bold text-[var(--acc)] flex items-center gap-2 text-sm font-display">
 <Disc3 className="w-4 h-4" /> 3. Agente Mánager AI (Negociación de Fechas & Caché)
 </h4>
 <p className="text-[var(--ink-2)] text-xs">
 Responde a las salas sobre disponibilidad consultando tu <strong className="text-[var(--ink)]">Calendario</strong>, comprueba el <strong className="text-[var(--ink)]">Rider Técnico</strong> y defiende el presupuesto según tus reglas de <strong className="text-[var(--ink)]">Caché Mínimo</strong>.
 </p>
 </div>

 <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1.5">
 <h4 className="font-bold text-[var(--acc)] flex items-center gap-2 text-sm font-display">
 <Mail className="w-4 h-4" /> 4. Agente Lector & Enviador (Smart Gate)
 </h4>
 <p className="text-[var(--ink-2)] text-xs">
 Despacha los correos aprobados en los horarios de máxima apertura comercial y monitoriza la bandeja de entrada para detectar respuestas de programadores al instante.
 </p>
 </div>
 </div>

 <div className="flex justify-end pt-2">
 <button
 onClick={() => setShowAuditModal(false)}
 className="px-4 py-2 rounded-[var(--r-m)] bg-[var(--acc)] text-[var(--acc-ink)] font-bold font-mono text-xs hover:bg-[var(--acc)]/60 transition-colors cursor-pointer"
 >
 Entendido
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
};
