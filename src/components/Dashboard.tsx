import React, { useState, useRef } from'react';
import { Lead, LeadType, LeadStatus, ThemeColors, SocialMetric, Concert, Rehearsal, EPKConfig, Tour, Fan, SocialPost } from'../types';
import { useLanguage } from'../context/LanguageContext';
import { isSameBandId } from'../utils/bandUtils';
import DirectionsCard from'./DirectionsCard';
import { ThemeToggle } from'./common/ThemeToggle';
import { PublicoSilhouette } from'./ui/PublicoSilhouette';
import { AddLeadModal } from'./dashboard/AddLeadModal';
import { ProfileCompletenessCard } from'./dashboard/ProfileCompletenessCard';
import { AiSupportWidget, AiUsageCard } from'./dashboard/AiUsageSupportWidget';
import { EmailTemplatesModal } from'./dashboard/EmailTemplatesModal';
import { AgentAutonomySettingsModal } from'./dashboard/AgentAutonomySettingsModal';
import { SocialAndFansGrowthChart } from'./dashboard/SocialAndFansGrowthChart';
import { DashboardWidgetGrid } from'./dashboard/DashboardWidgetGrid';
import { MobileBottomSheet } from'./booking/MobileBottomSheet';
import { autoDetectVenueAddress, normalizeStatus, normalizeType } from'../utils/bookingUtils';
import { leadStatusDotColor, leadStatusBadgeClass, leadStatusLabel } from'../utils/leadStatusPresentation';
import { normalizePlan, hasModuleAccess } from'../utils/planPermissions';
import { 
 Search, MapPin, Music, Mic, DoorClosed, Globe, Phone, Instagram, 
 Plus, X, Calendar, AlertCircle, Sparkles, Loader2, Check, RefreshCw, 
 Database, Bot, Activity, ArrowRight, CheckCircle2, Radio, Building2,
 Clock, CheckCircle, Hourglass, Send, Users, ShieldCheck, Play, Navigation,
 FileText, BookOpen, Disc3, Truck, Heart, Info, Copy, Sliders, Gift, Crown, QrCode
} from'lucide-react';

export type NavigationOptions = {
 sectionTab?:'salas' |'medios' |'grupos';
 statusFilter?: LeadStatus |'todos' | string;
 selectedLeadId?: string;
 selectedEventId?: string;
 selectedDate?: string;
 concertId?: string;
};

interface DashboardProps {
 leads: Lead[];
 colors: ThemeColors;
 onUpdateLead: (leadId: string, updatedFields: Partial<Lead>) => void;
 onAddLead: (lead: Lead) => void;
 metrics?: SocialMetric[];
 concerts?: Concert[];
 currentUser?: any;
 bandName?: string;
 currentBandId?: string;
 availableBands?: Array<{ band_id: string; bandName: string; name?: string }>;
 rehearsals?: Rehearsal[];
 epkConfig?: Partial<EPKConfig>;
 tours?: Tour[];
 fans?: Fan[];
 posts?: SocialPost[];
 onNavigate?: (view: any, options?: NavigationOptions) => void;
 onOpenProfileModal?: () => void;
 isPromoPlan?: boolean;
}

const isMedio = (l?: Lead | null) => {
 if (!l || !l.tipo) return false;
 const s = String(l.tipo).trim().toLowerCase();
 return s.includes('medio') || s.includes('radio') || s.includes('prensa') || s.includes('tv') || s.includes('podc');
};

const isManagement = (l?: Lead | null) => {
 if (!l || !l.tipo) return false;
 const s = String(l.tipo).trim().toLowerCase();
 return ['agencia','manager','productora','sello','promotora','management'].some(t => s.includes(t));
};

export default function Dashboard({ 
 leads, 
 colors, 
 onUpdateLead, 
 onAddLead, 
 metrics = [], 
 concerts = [], 
 rehearsals = [], 
 currentUser,
 bandName,
 currentBandId,
 availableBands = [],
 epkConfig,
 tours = [],
 fans = [],
 posts = [],
 onNavigate,
 onOpenProfileModal,
 isPromoPlan: isPromoPlanProp
}: DashboardProps) {
 const [searchTerm, setSearchTerm] = useState('');
 const [cityFilter, setCityFilter] = useState('todos');
 const [genreFilter, setGenreFilter] = useState('todos');
 const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
 const [isAddModalOpen, setIsAddModalOpen] = useState(false);
 const [isEmailTemplatesOpen, setIsEmailTemplatesOpen] = useState(false);
 const [isAutonomyModalOpen, setIsAutonomyModalOpen] = useState(false);
 const [syncLoading, setSyncLoading] = useState(false);

 // Band view filter state:'all' (Todas las bandas asignadas por defecto) vs'active' (Solo la banda activa)
 const [agendaFilterMode, setAgendaFilterMode] = useState<'active' |'all'>('all');

 const isPromo = isPromoPlanProp ?? (
 normalizePlan(currentUser?.plan) ==='promo' ||
 normalizePlan(currentUser?.plan) ==='promo_plus' ||
 Boolean(availableBands && availableBands.find(b => (b.band_id === currentBandId || (b as any).id === currentBandId) && (normalizePlan((b as any).plan) ==='promo' || normalizePlan((b as any).plan) ==='promo_plus')))
 );

 // Scraper states
 const [isScraping, setIsScraping] = useState(false);
 const [scrapingStatus, setScrapingStatus] = useState('');
 const [scrapedData, setScrapedData] = useState<{
 email_contacto: string;
 telefono: string;
 website?: string;
 instagram: string;
 contacto_nombre?: string;
 aforo?: number | null;
 region?: string;
 genero?: string;
 contexto_extra?: string;
 source_info: string;
 } | null>(null);
 const [scrapingError, setScrapingError] = useState<string | null>(null);

 // Add new lead form states
 const [newSala, setNewSala] = useState('');
 const [newCiudad, setNewCiudad] = useState('');
 const [newRegion, setNewRegion] = useState('');
 const [newAforo, setNewAforo] = useState(300);
 const [newGenero, setNewGenero] = useState('Ska / Reggae / Mestizaje');
 const [newTipo, setNewTipo] = useState<LeadType>('sala');
 const [newEmail, setNewEmail] = useState('');
 const [newInstagram, setNewInstagram] = useState('');
 const [newNotas, setNewNotas] = useState('');

 const storedSongsCount = React.useMemo(() => {
 try {
 const raw = localStorage.getItem('bakandeya_songs_catalog') || localStorage.getItem('bakandeya_songs');
 if (raw) {
 const parsed = JSON.parse(raw);
 if (Array.isArray(parsed) && parsed.length > 0) return parsed.length;
 }
 return 0;
 } catch {
 return 0;
 }
 }, []);

 // Handle Sync simulation
 const handleForceSync = () => {
 setSyncLoading(true);
 setTimeout(() => {
 setSyncLoading(false);
 }, 1200);
 };

 const handleScrapeContact = async (lead: Lead) => {
 setIsScraping(true);
 setScrapingError(null);
 setScrapedData(null);
 
 const steps = ["Conectando con el Agente Scout...","Buscando perfiles oficiales en la web...","Extrayendo datos de Instagram y directorios...","Buscando datos de aforo y estilo musical...","Filtrando y validando emails de booking...","Consolidando resultados..."
 ];
 
 let currentStep = 0;
 setScrapingStatus(steps[0]);
 
 const interval = setInterval(() => {
 currentStep++;
 if (currentStep < steps.length) {
 setScrapingStatus(steps[currentStep]);
 }
 }, 1000);

 try {
 const response = await fetch('/api/scrape-contact', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 leadId: lead.id,
 nombre_sala: lead.nombre_sala,
 ciudad: lead.ciudad,
 region: lead.region
 })
 });

 clearInterval(interval);

 if (!response.ok) {
 throw new Error('Error al conectar con el servidor.');
 }

 const resData = await response.json();
 if (resData.success && resData.data) {
 setScrapedData(resData.data);
 } else {
 throw new Error(resData.error ||'No se pudieron extraer datos de contacto.');
 }
 } catch (err: any) {
 clearInterval(interval);
 setScrapingError(err.message ||'Error en el proceso de raspado.');
 } finally {
 setIsScraping(false);
 }
 };

 const getScrapedVal = (field: any) => typeof field ==='object' && field !== null ? field.valor : field;
 const getScrapedConf = (field: any) => typeof field ==='object' && field !== null ? (field.confianza ||'baja') :'alta';

 const handleApplyScrapedData = (lead: Lead) => {
 if (!scrapedData) return;
 const today = new Date().toISOString().split('T')[0];
 const sourceSummary = typeof scrapedData.source_info ==='string' ? scrapedData.source_info :'Scout Scraper Grounding';
 const updatedNotes = `*** [${today}] Datos enriquecidos vía Scout Scraper. ${sourceSummary} ***\n${lead.notas ||''}`;
 
 const emailVal = getScrapedVal(scrapedData.email_contacto);
 const telVal = getScrapedVal(scrapedData.telefono);
 const webVal = getScrapedVal(scrapedData.website);
 const instaVal = getScrapedVal(scrapedData.instagram);
 const contactoVal = getScrapedVal(scrapedData.contacto_nombre);
 const aforoVal = getScrapedVal(scrapedData.aforo);
 const regionVal = getScrapedVal(scrapedData.region);
 const generoVal = getScrapedVal(scrapedData.genero);
 const contextoVal = getScrapedVal(scrapedData.contexto_extra);

 const updatedFields: Partial<Lead> = {
 email_contacto: emailVal || lead.email_contacto,
 telefono: telVal || lead.telefono,
 website: webVal || lead.website,
 instagram: instaVal || lead.instagram,
 contacto_nombre: contactoVal || lead.contacto_nombre,
 aforo: (aforoVal && !isNaN(Number(aforoVal))) ? Number(aforoVal) : lead.aforo,
 region: regionVal || lead.region,
 genero: generoVal || lead.genero,
 contexto_extra: (contextoVal && typeof contextoVal ==='string' && contextoVal.trim()) ? contextoVal.trim() : lead.contexto_extra,
 notas: updatedNotes
 };

 onUpdateLead(lead.id, updatedFields);
 setSelectedLead(prev => prev ? { ...prev, ...updatedFields } : null);
 setScrapedData(null);
 };

 const handleAddSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!newSala || !newCiudad) return;

 const newLeadItem: Lead = {
 id: `lead-${Date.now()}`,
 nombre_sala: newSala,
 ciudad: newCiudad,
 region: newRegion,
 aforo: Number(newAforo),
 genero: newGenero,
 tipo: newTipo,
 email_contacto: newEmail,
 telefono:'',
 instagram: newInstagram,
 fuente:'Ingreso Manual (Jon)',
 estado:'nuevo',
 pitch_generado:'',
 notas: newNotas ||'Añadido manualmente desde el dashboard.'
 };

 onAddLead(newLeadItem);
 setIsAddModalOpen(false);

 // Reset Form
 setNewSala('');
 setNewCiudad('');
 setNewRegion('');
 setNewAforo(300);
 setNewGenero('Ska / Reggae / Mestizaje');
 setNewEmail('');
 setNewInstagram('');
 setNewNotas('');
 };

 // Unique cities and genres for filters
 const cities = Array.from(new Set(leads.map(l => l.ciudad))).filter(Boolean);
 const genres = Array.from(new Set(leads.map(l => l.genero))).filter(Boolean);

 // Filter leads for search/scraper table
 const filteredLeads = leads.filter(lead => {
 const matchesSearch = lead.nombre_sala.toLowerCase().includes(searchTerm.toLowerCase()) || 
 lead.ciudad.toLowerCase().includes(searchTerm.toLowerCase());
 const matchesCity = cityFilter ==='todos' || lead.ciudad === cityFilter;
 const matchesGenre = genreFilter ==='todos' || lead.genero === genreFilter;
 return matchesSearch && matchesCity && matchesGenre;
 });

 const isStitchLight = colors.name?.toLowerCase().includes('light') || colors.bg.includes('f8fafc') || colors.bg.includes('white') || colors.bg.includes('slate-50') || false;
 const subCardBg = isStitchLight ?'bg-[var(--bg)]/80 text-[var(--ink)]' :'bg-[var(--sunken)] text-[var(--ink)]';
 const textTitle = isStitchLight ?'text-[var(--ink)]' :'text-[var(--sunken)]';
 const textSub = isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--ink-2)]';
 const textMuted = isStitchLight ?'text-[var(--ink-3)]' :'text-[var(--ink-2)]';

 // Calculate real metrics from leads
 const isMedio = (l: Lead) => {
 if (!l.tipo) return false;
 const s = String(l.tipo).trim().toLowerCase();
 return s.includes('medio') || s.includes('radio') || s.includes('prensa') || s.includes('tv') || s.includes('podc');
 };

 const pendingApprovalCount = leads.filter(l => l.estado ==='pendiente_aprobacion' || (l.pitch_generado && l.estado ==='nuevo')).length;
 const sentCount = leads.filter(l => l.estado ==='esperando_respuesta').length;
 const interestedCount = leads.filter(l => l.estado ==='interesado' || l.estado ==='negociando').length;
 const approvedCount = leads.filter(l => l.estado ==='aprobado').length;
 const mediosCount = leads.filter(l => isMedio(l)).length;

 const now = new Date();
 const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

 const activeBandId = currentBandId || currentUser?.band_id ||'';
 const activeBandName = bandName || currentUser?.bandName ||'Tu Banda';

 const activeBandConcerts = React.useMemo(() => {
 return concerts.filter(c => {
 if (!c.band_id) return isSameBandId(activeBandId,"band-bakandeya");
 return isSameBandId(c.band_id, activeBandId);
 });
 }, [concerts, activeBandId]);

 const activeBandRehearsals = React.useMemo(() => {
 return rehearsals.filter(r => {
 if (!r.band_id) return isSameBandId(activeBandId,"band-bakandeya");
 return isSameBandId(r.band_id, activeBandId);
 });
 }, [rehearsals, activeBandId]);


 // Filter concerts & rehearsals based on agendaFilterMode
 const filteredConcerts = concerts.filter(c => {
 if (agendaFilterMode ==='all') return true;
 if (!c.band_id) return isSameBandId(activeBandId,'band-bakandeya');
 return isSameBandId(c.band_id, activeBandId);
 });

 const filteredRehearsals = rehearsals.filter(r => {
 if (agendaFilterMode ==='all') return true;
 if (!r.band_id) return isSameBandId(activeBandId,'band-bakandeya');
 return isSameBandId(r.band_id, activeBandId);
 });

 // Helper to resolve the correct band name for each event
 const getEventBandName = (bandId?: string, explicitBandName?: string) => {
 if (explicitBandName) return explicitBandName;
 if (!bandId || isSameBandId(bandId, activeBandId)) return activeBandName;
 const match = (availableBands || []).find(b => isSameBandId(b.band_id, bandId) || isSameBandId((b as any).id, bandId));
 return match?.bandName || match?.name || (isSameBandId(bandId,'band-bakandeya') ?'Bakandeya' :'Banda');
 };

 const hasMultipleBands = (availableBands && availableBands.length > 1) || 
 concerts.some(c => c.band_id && !isSameBandId(c.band_id, activeBandId)) || 
 rehearsals.some(r => r.band_id && !isSameBandId(r.band_id, activeBandId));

 // Build upcoming agenda dates
 const upcomingEvents: Array<{
 id: string;
 type:'concierto' |'ensayo';
 title: string;
 dateStr: string;
 day: string;
 month: string;
 location: string;
 locationQuery?: string;
 address?: string;
 badge: string;
 bandName: string;
 details: string;
 }> = [];

 // Add concerts (ignoring past ones)
 filteredConcerts.forEach(c => {
 if (c.fecha && c.fecha < todayStr) return;
 const parts = c.fecha ? c.fecha.split('-') : [];
 const day = parts[2] ||'15';
 const monthNames = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
 const month = parts[1] ? monthNames[parseInt(parts[1], 10) - 1] ||'AGO' :'AGO';

 upcomingEvents.push({
 id: c.id,
 type:'concierto',
 title: `Concierto: ${c.sala}`,
 dateStr: c.fecha,
 day,
 month,
 location: c.sala ? `${c.sala} (${c.ciudad})` : c.ciudad,
 locationQuery: c.direccion || `${c.sala}, ${c.ciudad}`,
 address: c.direccion,
 badge: c.contrato_firmado ?'Contrato Firmado' :'Confirmado',
 bandName: getEventBandName(c.band_id, c.bandName),
 details: isPromo
 ? (c.aforo_total ? `Aforo: ${c.aforo_total} pax` :'Concierto confirmado')
 : `Caché: ${c.cache ? `${c.cache}€` :'A convenir'} • Aforo: ${c.aforo_total || 500} pax`
 });
 });

 // Add rehearsals (ignoring past ones)
 filteredRehearsals.forEach(r => {
 if (r.fecha && r.fecha < todayStr) return;
 const parts = r.fecha ? r.fecha.split('-') : [];
 const day = parts[2] ||'10';
 const monthNames = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
 const month = parts[1] ? monthNames[parseInt(parts[1], 10) - 1] ||'AGO' :'AGO';

 upcomingEvents.push({
 id: r.id,
 type:'ensayo',
 title: r.lugar ? `Ensayo en ${r.lugar}` : `Ensayo General`,
 dateStr: r.fecha,
 day,
 month,
 location: r.lugar ||'Local de Ensayo',
 locationQuery: `${r.lugar ||'Local de Ensayo'}, Madrid`,
 address: undefined,
 badge: r.estado ==='completado' ?'Completado' :'Programado',
 bandName: getEventBandName(r.band_id, r.bandName),
 details: `Horario: ${r.hora ||'18:00'} • Asistentes: ${r.asistentes ? (Array.isArray(r.asistentes) ? r.asistentes.join(',') : r.asistentes) :'Todos'}`
 });
 });

 // Antes, sin conciertos/ensayos reales todavía, se rellenaba la agenda con tres eventos
 // inventados (un concierto en Sala Apolo con caché de 1.800€, un ensayo y un festival con
 // caché de 3.500€) copiados de la banda insignia. Una agenda vacía es simplemente una agenda
 // vacía: no se inventan conciertos que no existen.
 upcomingEvents.sort((a, b) => a.dateStr.localeCompare(b.dateStr));

 // Calculate urgent leads that need response or approval
 const urgentRepliesNeeded = leads.filter(l => l.estado ==='interesado' || l.estado ==='negociando');
 const urgentApprovalsNeeded = leads.filter(l => l.estado ==='pendiente_aprobacion' || (l.pitch_generado && l.estado ==='nuevo'));

 // Plan Promo (fase beta, festivales): el dashboard completo enseña CRM, caché, agentes IA,
 // reels y upsells de plan por todas partes — demasiadas cosas para intentar taparlas una a
 // una sin dejarse alguna (ya pasó: la sección de"Acciones Rápidas" y el botón flotante de
 // Agente IA se colaban). Así que en vez de parchear el dashboard grande, Promo tiene su
 // propio resumen reducido, aparte, que solo usa lo que ese plan permite: EPK, calendario y fans.
 if (false && isPromo) {
 const totalFansCount = (fans || []).length;
 const maxPromoFans = 250;

 return (
 <div className={`space-y-6 ${isStitchLight ?"text-[var(--ink)]" :"text-[var(--ink)]"} font-sans w-full max-w-full overflow-x-hidden`}>
 <div className="mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div>
 <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-[var(--ink)]">Dashboard</h1>
 <p className="text-sm font-mono text-[var(--ink-2)] uppercase tracking-widest">
 Panel de {activeBandName}
 {agendaFilterMode ==='all' && hasMultipleBands && (
 <span className="ml-2 text-[var(--acc)] lowercase font-normal">(vista global de todas tus bandas)</span>
 )}
 </p>
 </div>
 <div className="flex items-center gap-2 flex-wrap">
 <button
 type="button"
 onClick={() => onNavigate && onNavigate("fans")}
 className="px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--acc)]/15 hover:bg-[var(--acc)]/25 text-[var(--acc)]/70 font-mono text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5 active:scale-95"
 >
 <QrCode className="w-4 h-4 text-[var(--acc)]" />
 <span>Códigos QR & Fans</span>
 </button>
 <button
 type="button"
 onClick={() => onNavigate && onNavigate("epk")}
 className="px-3 py-1.5 rounded-[var(--r-m)] bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 font-mono text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5 active:scale-95"
 >
 <BookOpen className="w-4 h-4 text-purple-400" />
 <span>Dossier EPK</span>
 </button>
 {hasModuleAccess(currentUser?.plan,"repertorio") && (
 <button
 type="button"
 onClick={() => onNavigate && onNavigate("repertorio")}
 className="px-3 py-1.5 rounded-[var(--r-m)] bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 font-mono text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5 active:scale-95"
 >
 <Disc3 className="w-4 h-4 text-sky-400" />
 <span>Repertorio</span>
 </button>
 )}
 <button
 type="button"
 onClick={() => onNavigate && onNavigate("calendario")}
 className="px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--acc-ink)] font-mono text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5 active:scale-95"
 >
 <Calendar className="w-4 h-4" />
 <span>Calendario</span>
 </button>
 </div>
 </div>

 {/* 1. SECCIÓN PRINCIPAL AL INICIO: PRÓXIMAS FECHAS Y AGENDA */}
 <div className="p-6 rounded-[var(--r-l)] bg-[var(--surface)]/90 shadow-sm space-y-4">
 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-[var(--hair)]">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc)]/15 text-[var(--acc)]">
 <Calendar className="w-5 h-5" />
 </div>
 <div>
 <h3 className="text-base font-bold font-display uppercase tracking-wider text-[var(--sunken)] flex items-center gap-2">
 Próximas Fechas y Agenda
 </h3>
 <p className="text-xs font-mono text-[var(--ink-2)]">
 {agendaFilterMode ==='all' 
 ?'Conciertos y ensayos de todas tus bandas asignadas.' 
 : `Conciertos y ensayos programados para ${activeBandName}.`}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2.5 flex-wrap">
 {/* Band Filter Mode Toggle */}
 <div className={`flex items-center rounded-[var(--r-m)] p-1 gap-1 ${
 isStitchLight ?'bg-[var(--sunken)]' :'bg-[var(--surface)]/80 border-[var(--hair)]'
 }`}>
 <button
 id="dashboard-promo-agenda-all-bands-btn"
 onClick={() => setAgendaFilterMode('all')}
 className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-[var(--r-s)] transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
 agendaFilterMode ==='all'
 ?'bg-[var(--acc)] text-[var(--acc-ink)] font-black shadow-xs'
 :'text-[var(--ink-2)] hover:text-[var(--sunken)]'
 }`}
 title="Ver eventos de todas las bandas"
 >
 <Users className="w-3 h-3 shrink-0" />
 <span>Todas</span>
 <span className="ml-1 text-[9px] font-mono opacity-80">({concerts.length + rehearsals.length})</span>
 </button>

 <button
 id="dashboard-promo-agenda-active-band-btn"
 onClick={() => setAgendaFilterMode('active')}
 className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-[var(--r-s)] transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
 agendaFilterMode ==='active'
 ?'bg-[var(--acc)] text-[var(--acc-ink)] font-black shadow-xs'
 :'text-[var(--ink-2)] hover:text-[var(--sunken)]'
 }`}
 title={`Ver solo eventos de ${activeBandName}`}
 >
 <Music className="w-3 h-3 shrink-0" />
 <span className="truncate max-w-[90px] sm:max-w-none">{activeBandName}</span>
 <span className="ml-1 text-[9px] font-mono opacity-80">({activeBandConcerts.length + activeBandRehearsals.length})</span>
 </button>
 </div>

 <button
 type="button"
 onClick={() => onNavigate && onNavigate('calendario')}
 className="text-xs font-mono text-[var(--acc)] hover:underline font-bold flex items-center gap-1 cursor-pointer"
 >
 <span>Ver agenda completa</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>

 {upcomingEvents.length > 0 ? (
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
 {upcomingEvents.slice(0, 6).map((item) => (
 <div
 key={item.id}
 onClick={() => onNavigate && onNavigate('calendario', { selectedEventId: item.id, selectedDate: item.dateStr })}
 className="p-4 rounded-[var(--r-m)] bg-[var(--surface)] hover:/40 transition-all flex flex-col justify-between cursor-pointer hover:scale-[1.01]"
 >
 <div className="flex items-start gap-3.5">
 <div className="w-12 h-12 rounded-[var(--r-m)] bg-[var(--surface)] text-[var(--sunken)] flex flex-col items-center justify-center shrink-0 shadow-sm">
 <span className="text-lg font-mono font-black leading-none text-[var(--acc)]">
 {item.day}
 </span>
 <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[var(--acc)]/70 mt-0.5">
 {item.month}
 </span>
 </div>

 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
 item.type ==='concierto'
 ?'bg-[var(--acc)]/20 text-[var(--acc)]/70'
 :'bg-emerald-500/20 text-[var(--ink-2)]'
 }`}>
 {item.type}
 </span>
 {(agendaFilterMode ==='all' || hasMultipleBands) && item.bandName && (
 <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-[var(--surface)]/60 text-[var(--acc)]/70/90 truncate max-w-[120px] flex items-center gap-1">
 <Music className="w-2.5 h-2.5 text-[var(--acc)] shrink-0" />
 <span className="truncate">{item.bandName}</span>
 </span>
 )}
 <span className="text-[10px] font-mono text-[var(--ink-2)]">
 • {item.badge}
 </span>
 </div>

 <h4 className="text-base font-bold font-display tracking-wide mt-1.5 text-[var(--sunken)] truncate">
 {item.title}
 </h4>

 <p className="text-xs font-semibold mt-1 flex items-center gap-1 text-[var(--ink-2)] truncate">
 <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
 <span>{item.location}</span>
 </p>
 </div>
 </div>

 <div className="mt-3 pt-2.5 border-t text-xs font-mono text-[var(--ink-2)] flex items-center justify-between">
 <span className="truncate">{item.details}</span>
 <ArrowRight className="w-3.5 h-3.5 shrink-0 text-[var(--acc)]" />
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="p-8 rounded-[var(--r-m)] bg-[var(--surface)] text-center space-y-4">
 <PublicoSilhouette opacity={0.12} size="large" className="mx-auto" />
 <div>
 <p className="text-sm font-bold text-[var(--ink)] font-display">La sala está vacía</p>
 <p className="text-xs font-mono text-[var(--ink-2)] mt-0.5">Vamos a llenarla. Programa tu primer bolo o ensayo desde el calendario.</p>
 </div>
 <button
 type="button"
 onClick={() => onNavigate && onNavigate('calendario')}
 className="px-4 py-2 rounded-[var(--r-m)] bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--acc)]/70 text-xs font-mono font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 mx-auto"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>Ir al Calendario</span>
 </button>
 </div>
 )}
 </div>

 {/* 2. TARJETAS RÁPIDAS DE CAPTURA QR, FANS Y DOSSIER */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {/* Card 1: Códigos QR & Captura de Fans */}
 <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)]/90 shadow-sm flex flex-col justify-between space-y-4 hover:/40 transition-all">
 <div>
 <div className="flex items-center justify-between pb-3 border-b border-[var(--hair)]">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc)]/15 text-[var(--acc)]">
 <QrCode className="w-5 h-5" />
 </div>
 <div>
 <h3 className="text-sm font-bold font-display uppercase tracking-wider text-[var(--sunken)]">
 Captura QR & Fans
 </h3>
 <p className="text-[11px] font-mono text-[var(--ink-2)]">
 QRs para directos, flyers y captación de audiencia
 </p>
 </div>
 </div>
 <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--acc)]/10 text-[var(--acc)]/70">
 {totalFansCount} / {maxPromoFans} Fans
 </span>
 </div>
 <p className="text-xs text-[var(--ink-3)] mt-3 leading-relaxed">
 Genera códigos QR de alta resolución (SVG y PNG 4K) y flyers imprimibles listos para proyectar o colocar en salas y festivales.
 </p>
 </div>

 <div className="pt-2 flex items-center gap-2">
 <button
 type="button"
 onClick={() => onNavigate && onNavigate("fans")}
 className="flex-1 px-3.5 py-2 rounded-[var(--r-m)] bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--acc-ink)] text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
 >
 <QrCode className="w-4 h-4" />
 <span>Gestionar QRs y Fans</span>
 </button>
 </div>
 </div>

 {/* Card 2: Dossier EPK Digital */}
 <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)]/90 shadow-sm flex flex-col justify-between space-y-4 hover:border-purple-500/40 transition-all">
 <div>
 <div className="flex items-center justify-between pb-3 border-b border-[var(--hair)]">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-[var(--r-m)] bg-purple-500/15 text-purple-400">
 <BookOpen className="w-5 h-5" />
 </div>
 <div>
 <h3 className="text-sm font-bold font-display uppercase tracking-wider text-[var(--sunken)]">
 Dossier (EPK) Digital
 </h3>
 <p className="text-[11px] font-mono text-[var(--ink-2)]">
 Prensa, rider técnico, vídeos y bio online
 </p>
 </div>
 </div>
 <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-300">
 Público
 </span>
 </div>
 <p className="text-xs text-[var(--ink-3)] mt-3 leading-relaxed">
 Tu carta de presentación oficial para festivales, promotores y medios. Personalizable y accesible desde cualquier dispositivo.
 </p>
 </div>

 <div className="pt-2 flex items-center gap-2">
 <button
 type="button"
 onClick={() => onNavigate && onNavigate("epk")}
 className="flex-1 px-3.5 py-2 rounded-[var(--r-m)] bg-purple-500 hover:bg-purple-400 text-[var(--ink)] text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
 >
 <BookOpen className="w-4 h-4" />
 <span>Editar Dossier EPK</span>
 </button>
 </div>
 </div>
 </div>

 {/* APOYO AL PROYECTO Y CONSUMO DE IA: el resumen reducido de Promo se salta el dashboard
 grande de más abajo por completo, así que sin esto las bandas en Promo nunca veían
 ni el CTA de Ko-fi ni cuánta IA llevan gastada este mes. */}
 <div className="space-y-3">
 <AiSupportWidget variant="card" />
 <AiUsageCard isStitchLight={isStitchLight} />
 </div>
 </div>
 );
 }

 return (
 <div className="space-y-6 text-[var(--ink)] bg-[var(--bg)] -m-3 p-3 sm:-m-5 sm:p-5 md:-m-8 md:p-8 min-h-screen font-sans overflow-x-hidden">
 {/* HEADER / TITULO PRINCIPAL */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
 <div>
 <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-[var(--ink)]">Panel</h1>
 <div className="flex items-center gap-2 mt-1 flex-wrap">
 <p className="text-xs text-[var(--ink-3)] font-medium">
 {activeBandName}
 </p>
 <span className="text-[var(--ink-3)] hidden sm:inline">•</span>
 <span className="text-xs text-[var(--ink-3)] tabular-nums">
 {leads.length} contactos en CRM · {upcomingEvents.length} fechas agendadas
 </span>
 </div>
 </div>

 <div className="flex items-center gap-2">
 <ThemeToggle />
 <button
 type="button"
 onClick={() => onNavigate && onNavigate('calendario')}
 className="px-4 py-2 rounded-[var(--r-pill)] bg-[var(--acc)] hover:brightness-105 text-[var(--on-acc)] text-xs font-semibold transition-[filter,transform] cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
 >
 <Calendar className="w-3.5 h-3.5" />
 <span>Ver Calendario</span>
 </button>
 </div>
 </div>

 {/* WIDGET GRID PERSONALIZABLE Y PERSISTENTE EN BBDD */}
 <DashboardWidgetGrid
 currentUser={currentUser}
 concerts={concerts}
 rehearsals={rehearsals}
 leads={leads}
 tours={tours}
 fans={fans}
 posts={posts}
 epkConfig={epkConfig}
 activeBandName={activeBandName}
 colors={colors}
 isStitchLight={isStitchLight}
 agendaFilterMode={agendaFilterMode}
 onSetAgendaFilterMode={setAgendaFilterMode}
 onNavigate={onNavigate}
 />

 {/* 3. SECCIÓN: ESTADO DE ENTRENAMIENTO & PREPARACIÓN DE AGENTES IA */}
 <ProfileCompletenessCard
 epkConfig={epkConfig}
 leads={leads}
 concerts={concerts}
 rehearsals={rehearsals}
 metrics={metrics}
 fans={fans}
 tours={tours}
 isStitchLight={isStitchLight}
 bandName={activeBandName}
 currentUser={currentUser}
 onNavigate={onNavigate}
 onOpenAutonomyModal={() => setIsAutonomyModalOpen(true)}
 onOpenProfileModal={onOpenProfileModal}
 />

 {/* MODAL: PLANTILLAS Y EJEMPLOS REALES DE EMAIL */}
 <EmailTemplatesModal
 isOpen={isEmailTemplatesOpen}
 onClose={() => setIsEmailTemplatesOpen(false)}
 bandName={activeBandName}
 />

 {/* MODAL: AGREGAR NUEVA SALA */}
 <AddLeadModal
 isOpen={isAddModalOpen}
 onClose={() => setIsAddModalOpen(false)}
 onAddSubmit={handleAddSubmit}
 newSala={newSala}
 setNewSala={setNewSala}
 newCiudad={newCiudad}
 setNewCiudad={setNewCiudad}
 newRegion={newRegion}
 setNewRegion={setNewRegion}
 newAforo={newAforo}
 setNewAforo={setNewAforo}
 newGenero={newGenero}
 setNewGenero={setNewGenero}
 newTipo={newTipo}
 setNewTipo={setNewTipo}
 newEmail={newEmail}
 setNewEmail={setNewEmail}
 newInstagram={newInstagram}
 setNewInstagram={setNewInstagram}
 newNotas={newNotas}
 setNewNotas={setNewNotas}
 />

 {/* MODAL / BOTTOM SHEET MOBILE FOR SELECTED LEAD IN DASHBOARD */}
 {selectedLead && (
 <MobileBottomSheet
 selectedLead={selectedLead}
 onClose={() => setSelectedLead(null)}
 onUpdateLead={onUpdateLead}
 getStatusBadgeClass={(status) => leadStatusBadgeClass(normalizeStatus(status), isStitchLight)}
 getStatusLabel={(status) => leadStatusLabel(normalizeStatus(status), String(status).toUpperCase())}
 getStatusDotColor={(status) => leadStatusDotColor(normalizeStatus(status))}
 normalizeStatus={normalizeStatus}
 normalizeType={normalizeType}
 autoDetectVenueAddress={autoDetectVenueAddress}
 sectionTab="salas"
 isStitchLight={isStitchLight}
 />
 )}

 <AgentAutonomySettingsModal
 isOpen={isAutonomyModalOpen}
 onClose={() => setIsAutonomyModalOpen(false)}
 bandName={activeBandName}
 bandId={currentBandId || currentUser?.band_id ||''}
 currentUser={currentUser}
 isStitchLight={isStitchLight}
 onOpenTemplatesSection={() => {
 if (onNavigate) onNavigate('booking');
 }}
 onOpenBandProfile={() => {
 if (onNavigate) onNavigate('bandas');
 }}
 />
 </div>
 );
}
