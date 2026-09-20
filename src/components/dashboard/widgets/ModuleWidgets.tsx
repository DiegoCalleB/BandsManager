import React from 'react';
import { 
 Building2, Music, DollarSign, Users, BookOpen, Bot, Truck, ArrowRight, 
 CheckCircle2, Clock, AlertCircle, Sparkles, QrCode, Disc3, ShieldCheck
} from 'lucide-react';
import { Lead, Concert, Rehearsal, Tour, Fan, SocialPost, EPKConfig, ThemeColors } from '../../../types';

export interface ModuleWidgetProps {
 leads?: Lead[];
 concerts?: Concert[];
 rehearsals?: Rehearsal[];
 tours?: Tour[];
 fans?: Fan[];
 posts?: SocialPost[];
 epkConfig?: Partial<EPKConfig>;
 currentUser?: any;
 activeBandName?: string;
 colors?: ThemeColors;
 isStitchLight?: boolean;
 onNavigate?: (view: string, options?: any) => void;
}

/* 1. CRM PIPELINE WIDGET */
export function CrmPipelineWidget({ leads = [], onNavigate, isStitchLight }: ModuleWidgetProps) {
 const urgentRepliesNeeded = leads.filter(l => l.estado === 'interesado' || l.estado === 'negociando');
 const urgentApprovalsNeeded = leads.filter(l => l.estado === 'pendiente_aprobacion' || (l.pitch_generado && l.estado === 'nuevo'));
 const confirmedShows = leads.filter(l => l.estado === 'confirmado');

 return (
 <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)] space-y-4">
 <div className="flex items-center justify-between pb-3">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc-soft)] text-[var(--acc-ink)]">
 <Building2 className="w-5 h-5" />
 </div>
 <div>
 <h3 className="text-base font-semibold text-[var(--ink)]">
 Booking
 </h3>
 <p className="text-xs text-[var(--ink-3)]">Resumen de contrataciones</p>
 </div>
 </div>
 {onNavigate && (
 <button
 type="button"
 onClick={() => onNavigate('booking')}
 className="text-xs text-[var(--acc-ink)] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
 >
 <span>Ver CRM</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 <div className="grid grid-cols-3 gap-3 text-center">
 <div className="p-3 rounded-[var(--r-m)] bg-[var(--sunken)]">
 <span className="text-xl font-bold text-[var(--ink)] tabular-nums">{urgentRepliesNeeded.length}</span>
 <p className="text-[10px] text-[var(--ink-3)] mt-1">Negociando</p>
 </div>
 <div className="p-3 rounded-[var(--r-m)] bg-[var(--acc-soft)]">
 <span className="text-xl font-bold text-[var(--acc-ink)] tabular-nums">{urgentApprovalsNeeded.length}</span>
 <p className="text-[10px] text-[var(--acc-ink)]/75 mt-1">Por aprobar</p>
 </div>
 <div className="p-3 rounded-[var(--r-m)] bg-[var(--ok-soft)]">
 <span className="text-xl font-bold text-[var(--ok)] tabular-nums">{confirmedShows.length}</span>
 <p className="text-[10px] text-[var(--ok)]/75 mt-1">Confirmados</p>
 </div>
 </div>

 <div className="text-xs text-[var(--ink-3)] flex items-center justify-between pt-1">
 <span>Total de salas y eventos en el embudo</span>
 <span className="font-semibold text-[var(--ink-2)] tabular-nums">{leads.length}</span>
 </div>
 </div>
 );
}

/* 2. REPERTORIO WIDGET */
export function RepertorioWidget({ onNavigate }: ModuleWidgetProps) {
 let songCount = 0;
 try {
 const raw = localStorage.getItem('bakandeya_songs_catalog') || localStorage.getItem('bakandeya_songs');
 if (raw) {
 const parsed = JSON.parse(raw);
 if (Array.isArray(parsed)) songCount = parsed.length;
 }
 } catch {}

 return (
 <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)] space-y-4">
 <div className="flex items-center justify-between pb-3 border-b ">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-[var(--r-m)] bg-purple-500/15 text-purple-400">
 <Music className="w-5 h-5" />
 </div>
 <div>
 <h3 className="text-base font-bold font-display uppercase tracking-wider text-[var(--sunken)]">
 Repertorio & Setlists
 </h3>
 <p className="text-xs font-mono text-[var(--ink-2)]">Canciones e Iris Stems</p>
 </div>
 </div>
 {onNavigate && (
 <button
 type="button"
 onClick={() => onNavigate('repertorio')}
 className="text-xs font-mono text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
 >
 <span>Ver Temas</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 <div className="flex items-center justify-between p-3 rounded-[var(--r-m)] bg-[#121214] ">
 <div className="flex items-center gap-3">
 <Disc3 className="w-8 h-8 text-purple-400 animate-spin-slow shrink-0" />
 <div>
 <span className="text-xl font-mono font-bold text-[var(--sunken)]">{songCount}</span>
 <p className="text-xs font-mono text-[var(--ink-2)]">Temas guardados en catálogo</p>
 </div>
 </div>
 <span className="text-[10px] font-mono px-2 py-1 rounded bg-amber-500/20 text-amber-300 font-bold">
 Iris IA Activo
 </span>
 </div>
 </div>
 );
}

/* 3. FINANCES WIDGET */
export function FinancesWidget({ concerts = [], onNavigate }: ModuleWidgetProps) {
 const totalCache = concerts.reduce((acc, c) => acc + (Number(c.cache) || 0), 0);

 return (
 <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)] space-y-4">
 <div className="flex items-center justify-between pb-3 border-b ">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-[var(--r-m)] bg-emerald-500/15 text-emerald-400">
 <DollarSign className="w-5 h-5" />
 </div>
 <div>
 <h3 className="text-base font-bold font-display uppercase tracking-wider text-[var(--sunken)]">
 Balance & Cachés
 </h3>
 <p className="text-xs font-mono text-[var(--ink-2)]">Recaudación bruta proyectada</p>
 </div>
 </div>
 {onNavigate && (
 <button
 type="button"
 onClick={() => onNavigate('finanzas')}
 className="text-xs font-mono text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
 >
 <span>Finanzas</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 <div className="p-3.5 rounded-[var(--r-m)] bg-[#121214] flex items-center justify-between">
 <div>
 <span className="text-2xl font-mono font-black text-emerald-400">{totalCache.toLocaleString('es-ES')} €</span>
 <p className="text-[10px] font-mono text-[var(--ink-2)] uppercase tracking-wider mt-0.5">Suma de cachés de bolos</p>
 </div>
 <div className="text-right">
 <span className="text-xs font-mono text-[var(--ink-3)] font-bold">{concerts.length} conciertos</span>
 <p className="text-[10px] font-mono text-emerald-300">Caché medio: {concerts.length > 0 ? Math.round(totalCache / concerts.length) : 0} €</p>
 </div>
 </div>
 </div>
 );
}

/* 4. SOCIAL & FANS WIDGET */
export function SocialFansWidget({ fans = [], onNavigate }: ModuleWidgetProps) {
 return (
 <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)] space-y-4">
 <div className="flex items-center justify-between pb-3 border-b ">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-[var(--r-m)] bg-amber-500/15 text-amber-400">
 <Users className="w-5 h-5" />
 </div>
 <div>
 <h3 className="text-base font-bold font-display uppercase tracking-wider text-[var(--sunken)]">
 Fans & Captación
 </h3>
 <p className="text-xs font-mono text-[var(--ink-2)]">Comunidad y códigos QR</p>
 </div>
 </div>
 {onNavigate && (
 <button
 type="button"
 onClick={() => onNavigate('fans')}
 className="text-xs font-mono text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
 >
 <span>Ver Fans</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div className="p-3 rounded-[var(--r-m)] bg-[#121214]">
 <span className="text-2xl font-mono font-bold text-amber-400">{fans.length}</span>
 <p className="text-[10px] font-mono text-[var(--ink-2)] uppercase tracking-wider mt-1">Fans Registrados</p>
 </div>
 <button
 type="button"
 onClick={() => onNavigate && onNavigate('fans')}
 className="p-3 rounded-[var(--r-m)] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-all flex flex-col items-center justify-center cursor-pointer"
 >
 <QrCode className="w-5 h-5 text-amber-400 mb-1" />
 <span className="text-[11px] font-mono font-bold">Generar QR de Concierto</span>
 </button>
 </div>
 </div>
 );
}

/* 5. EPK DOSSIER WIDGET */
export function EpkStatusWidget({ epkConfig, onNavigate }: ModuleWidgetProps) {
 return (
 <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)] space-y-4">
 <div className="flex items-center justify-between pb-3 border-b ">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-[var(--r-m)] bg-purple-500/15 text-purple-400">
 <BookOpen className="w-5 h-5" />
 </div>
 <div>
 <h3 className="text-base font-bold font-display uppercase tracking-wider text-[var(--sunken)]">
 Dossier EPK Público
 </h3>
 <p className="text-xs font-mono text-[var(--ink-2)]">Presencia y prensa para salas</p>
 </div>
 </div>
 {onNavigate && (
 <button
 type="button"
 onClick={() => onNavigate('epk')}
 className="text-xs font-mono text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
 >
 <span>Editar EPK</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 <div className="p-3.5 rounded-[var(--r-m)] bg-[#121214] flex items-center justify-between">
 <div>
 <span className="text-xs font-mono font-bold text-purple-300">EPK Activo & Listo</span>
 <p className="text-[10px] font-mono text-[var(--ink-2)]">Optimizado para agentes y programadores</p>
 </div>
 <a
 href="/epk"
 target="_blank"
 rel="noopener noreferrer"
 className="px-3 py-1.5 rounded-[var(--r-s)] bg-purple-500/20 text-purple-300 font-mono text-xs font-bold hover:bg-purple-500/30 transition-all"
 >
 Ver EPK Vivo ↗
 </a>
 </div>
 </div>
 );
}

/* 6. AI AGENT WIDGET */
export function AiAgentWidget({ leads = [], currentUser, onNavigate }: ModuleWidgetProps) {
 const pendingApprovals = leads.filter(l => l.estado === 'pendiente_aprobacion').length;

 return (
 <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)] space-y-4">
 <div className="flex items-center justify-between pb-3 border-b ">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-[var(--r-m)] bg-amber-500/15 text-amber-400">
 <Bot className="w-5 h-5" />
 </div>
 <div>
 <h3 className="text-base font-bold font-display uppercase tracking-wider text-[var(--sunken)]">
 Agente IA de Booking
 </h3>
 <p className="text-xs font-mono text-[var(--ink-2)]">Redactor & Lector Autónomo</p>
 </div>
 </div>
 {onNavigate && (
 <button
 type="button"
 onClick={() => onNavigate('booking')}
 className="text-xs font-mono text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
 >
 <span>Agentes</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 <div className="p-3.5 rounded-[var(--r-m)] bg-[#121214] flex items-center justify-between">
 <div>
 <span className="text-lg font-mono font-bold text-amber-400">{pendingApprovals} Borradores</span>
 <p className="text-[10px] font-mono text-[var(--ink-2)] uppercase tracking-wider mt-0.5">Pendientes de Aprobación Humana</p>
 </div>
 <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
 ● Activo
 </span>
 </div>
 </div>
 );
}

/* 7. TOUR LOGISTICS WIDGET */
export function TourStatusWidget({ tours = [], onNavigate }: ModuleWidgetProps) {
 return (
 <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)] space-y-4">
 <div className="flex items-center justify-between pb-3 border-b ">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-[var(--r-m)] bg-sky-500/15 text-sky-400">
 <Truck className="w-5 h-5" />
 </div>
 <div>
 <h3 className="text-base font-bold font-display uppercase tracking-wider text-[var(--sunken)]">
 Giras & Logística
 </h3>
 <p className="text-xs font-mono text-[var(--ink-2)]">Rutas de conciertos y producción</p>
 </div>
 </div>
 {onNavigate && (
 <button
 type="button"
 onClick={() => onNavigate('tour')}
 className="text-xs font-mono text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
 >
 <span>Ver Giras</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 <div className="p-3.5 rounded-[var(--r-m)] bg-[#121214] flex items-center justify-between">
 <div>
 <span className="text-sm font-mono font-bold text-[var(--sunken)]">{tours.length} Giras Programadas</span>
 <p className="text-[10px] font-mono text-[var(--ink-2)] mt-0.5">Rutas y hoteles unificados</p>
 </div>
 </div>
 </div>
 );
}
