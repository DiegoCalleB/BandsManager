import React, { useState, useRef } from 'react';
import { Lead, LeadType, ThemeColors, SocialMetric, Concert, Rehearsal, EPKConfig, Tour, Fan, SocialPost } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { isSameBandId } from '../utils/bandUtils';
import DirectionsCard from './DirectionsCard';
import { AddLeadModal } from './dashboard/AddLeadModal';
import { ProfileCompletenessCard } from './dashboard/ProfileCompletenessCard';
import { EmailTemplatesModal } from './dashboard/EmailTemplatesModal';
import { AgentAutonomySettingsModal } from './dashboard/AgentAutonomySettingsModal';
import { SocialAndFansGrowthChart } from './dashboard/SocialAndFansGrowthChart';
import { MobileBottomSheet } from './booking/MobileBottomSheet';
import { autoDetectVenueAddress, normalizeStatus, normalizeType } from '../utils/bookingUtils';
import { 
 Search, MapPin, Music, Mic, DoorClosed, Globe, Phone, Instagram, 
 Plus, X, Calendar, AlertCircle, Sparkles, Loader2, Check, RefreshCw, 
 Database, Bot, Activity, ArrowRight, CheckCircle2, Radio, Building2,
 Clock, CheckCircle, Hourglass, Send, Users, ShieldCheck, Play, Navigation,
 FileText, BookOpen, Disc3, Truck, Heart, Info, Copy, Sliders, Gift, Crown
} from 'lucide-react';

export type NavigationOptions = {
 sectionTab?: 'salas' | 'medios';
 statusFilter?: string;
 selectedLeadId?: string;
 selectedEventId?: string;
 selectedDate?: string;
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
}

const isMedio = (l?: Lead | null) => {
 if (!l || !l.tipo) return false;
 const s = String(l.tipo).trim().toLowerCase();
 return s.includes('medio') || s.includes('radio') || s.includes('prensa') || s.includes('tv') || s.includes('podc');
};

const normalizeStatus = (s: any): string => {
 if (!s) return 'nuevo';
 const str = String(s).trim().toLowerCase();
 if (str.includes('aprobado') || str === 'approved') return 'aprobado';
 if (str.includes('pendiente') || str.includes('por_aprobar') || str === 'pending') return 'pendiente_aprobacion';
 if (str.includes('enviado') || str.includes('esperando') || str === 'sent') return 'esperando_respuesta';
 if (str.includes('interesado') || str === 'interested') return 'interesado';
 if (str.includes('negociando') || str === 'negotiating') return 'negociando';
 if (str.includes('no_interesado') || str.includes('rechazado')) return 'no_interesado';
 return 'nuevo';
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
  onOpenProfileModal
}: DashboardProps) {
 const [searchTerm, setSearchTerm] = useState('');
 const [cityFilter, setCityFilter] = useState('todos');
 const [genreFilter, setGenreFilter] = useState('todos');
 const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
 const [isAddModalOpen, setIsAddModalOpen] = useState(false);
 const [isEmailTemplatesOpen, setIsEmailTemplatesOpen] = useState(false);
 const [isAutonomyModalOpen, setIsAutonomyModalOpen] = useState(false);
 const [syncLoading, setSyncLoading] = useState(false);

 // Band view filter state: 'active' (Solo la banda activa) vs 'all' (Todas las bandas asignadas)
 const [agendaFilterMode, setAgendaFilterMode] = useState<'active' | 'all'>('active');

 // Scraper states
 const [isScraping, setIsScraping] = useState(false);
 const [scrapingStatus, setScrapingStatus] = useState('');
 const [scrapedData, setScrapedData] = useState<{
 email_contacto: string;
 telefono: string;
 website?: string;
 instagram: string;
 aforo?: number | null;
 region?: string;
 genero?: string;
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
 
 const steps = [
"Conectando con el Agente Scout...",
"Buscando perfiles oficiales en la web...",
"Extrayendo datos de Instagram y directorios...",
"Buscando datos de aforo y estilo musical...",
"Filtrando y validando emails de booking...",
"Consolidando resultados..."
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
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
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
 throw new Error(resData.error || 'No se pudieron extraer datos de contacto.');
 }
 } catch (err: any) {
 clearInterval(interval);
 setScrapingError(err.message || 'Error en el proceso de raspado.');
 } finally {
 setIsScraping(false);
 }
 };

 const getScrapedVal = (field: any) => typeof field === 'object' && field !== null ? field.valor : field;
 const getScrapedConf = (field: any) => typeof field === 'object' && field !== null ? (field.confianza || 'baja') : 'alta';

 const handleApplyScrapedData = (lead: Lead) => {
 if (!scrapedData) return;
 const today = new Date().toISOString().split('T')[0];
 const sourceSummary = typeof scrapedData.source_info === 'string' ? scrapedData.source_info : 'Scout Scraper Grounding';
 const updatedNotes = `*** [${today}] Datos enriquecidos vía Scout Scraper. ${sourceSummary} ***\n${lead.notas || ''}`;
 
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
 contexto_extra: (contextoVal && typeof contextoVal === 'string' && contextoVal.trim()) ? contextoVal.trim() : lead.contexto_extra,
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
 telefono: '',
 instagram: newInstagram,
 fuente: 'Ingreso Manual (Jon)',
 estado: 'nuevo',
 pitch_generado: '',
 notas: newNotas || 'Añadido manualmente desde el dashboard.'
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
 const matchesCity = cityFilter === 'todos' || lead.ciudad === cityFilter;
 const matchesGenre = genreFilter === 'todos' || lead.genero === genreFilter;
 return matchesSearch && matchesCity && matchesGenre;
 });

 const isStitchLight = colors.name?.toLowerCase().includes('light') || colors.bg.includes('f8fafc') || colors.bg.includes('white') || colors.bg.includes('slate-50') || false;
 const subCardBg = isStitchLight ? 'bg-slate-50/80 text-slate-800' : 'bg-[#1A1918] text-zinc-100';
 const textTitle = isStitchLight ? 'text-slate-900' : 'text-neutral-100';
 const textSub = isStitchLight ? 'text-slate-500' : 'text-neutral-400';
 const textMuted = isStitchLight ? 'text-slate-400' : 'text-neutral-500';

 // Calculate real metrics from leads
 const isMedio = (l: Lead) => {
 if (!l.tipo) return false;
 const s = String(l.tipo).trim().toLowerCase();
 return s.includes('medio') || s.includes('radio') || s.includes('prensa') || s.includes('tv') || s.includes('podc');
 };

 const pendingApprovalCount = leads.filter(l => l.estado === 'pendiente_aprobacion' || (l.pitch_generado && l.estado === 'nuevo')).length;
 const sentCount = leads.filter(l => l.estado === 'esperando_respuesta').length;
 const interestedCount = leads.filter(l => l.estado === 'interesado' || l.estado === 'negociando').length;
 const approvedCount = leads.filter(l => l.estado === 'aprobado').length;
 const mediosCount = leads.filter(l => isMedio(l)).length;

 const now = new Date();
 const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

 const activeBandId = currentBandId || currentUser?.band_id || 'band-bakandeya';
 const activeBandName = bandName || currentUser?.bandName || 'Bakandeya';

  const activeBandConcerts = React.useMemo(() => {
    return concerts.filter(c => {
      if (!c.band_id) return isSameBandId(activeBandId, "band-bakandeya");
      return isSameBandId(c.band_id, activeBandId);
    });
  }, [concerts, activeBandId]);

  const activeBandRehearsals = React.useMemo(() => {
    return rehearsals.filter(r => {
      if (!r.band_id) return isSameBandId(activeBandId, "band-bakandeya");
      return isSameBandId(r.band_id, activeBandId);
    });
  }, [rehearsals, activeBandId]);


 // Filter concerts & rehearsals based on agendaFilterMode
 const filteredConcerts = concerts.filter(c => {
 if (agendaFilterMode === 'all') return true;
 if (!c.band_id) return isSameBandId(activeBandId, 'band-bakandeya');
 return isSameBandId(c.band_id, activeBandId);
 });

 const filteredRehearsals = rehearsals.filter(r => {
 if (agendaFilterMode === 'all') return true;
 if (!r.band_id) return isSameBandId(activeBandId, 'band-bakandeya');
 return isSameBandId(r.band_id, activeBandId);
 });

 // Build upcoming agenda dates
 const upcomingEvents: Array<{
 id: string;
 type: 'concierto' | 'ensayo';
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
 const day = parts[2] || '15';
 const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
 const month = parts[1] ? monthNames[parseInt(parts[1], 10) - 1] || 'AGO' : 'AGO';

 upcomingEvents.push({
 id: c.id,
 type: 'concierto',
 title: `Concierto: ${c.sala}`,
 dateStr: c.fecha,
 day,
 month,
 location: c.sala ? `${c.sala} (${c.ciudad})` : c.ciudad,
 locationQuery: c.direccion || `${c.sala}, ${c.ciudad}`,
 address: c.direccion,
 badge: c.contrato_firmado ? 'Contrato Firmado' : 'Confirmado',
 bandName: c.bandName || activeBandName,
 details: `Caché: ${c.cache ? `${c.cache}€` : 'A convenir'} • Aforo: ${c.aforo_total || 500} pax`
 });
 });

 // Add rehearsals (ignoring past ones)
 filteredRehearsals.forEach(r => {
 if (r.fecha && r.fecha < todayStr) return;
 const parts = r.fecha ? r.fecha.split('-') : [];
 const day = parts[2] || '10';
 const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
 const month = parts[1] ? monthNames[parseInt(parts[1], 10) - 1] || 'AGO' : 'AGO';

 upcomingEvents.push({
 id: r.id,
 type: 'ensayo',
 title: r.lugar ? `Ensayo en ${r.lugar}` : `Ensayo General`,
 dateStr: r.fecha,
 day,
 month,
 location: r.lugar || 'Local de Ensayo',
 locationQuery: `${r.lugar || 'Local de Ensayo'}, Madrid`,
 address: undefined,
 badge: r.estado === 'completado' ? 'Completado' : 'Programado',
 bandName: r.bandName || activeBandName,
 details: `Horario: ${r.hora || '18:00'} • Asistentes: ${r.asistentes ? (Array.isArray(r.asistentes) ? r.asistentes.join(', ') : r.asistentes) : 'Todos'}`
 });
 });

 upcomingEvents.sort((a, b) => a.dateStr.localeCompare(b.dateStr));

 // Fallback defaults if no rehearsals/concerts created yet
 if (upcomingEvents.length === 0 && (!currentUser || currentUser.band_id === 'band-bakandeya')) {
 upcomingEvents.push(
 {
 id: 'def-1',
 type: 'concierto',
 title: 'Concierto: Gira Bakandeya 2026',
 dateStr: '2026-08-15',
 day: '15',
 month: 'AGO',
 location: 'Sala Apolo (Barcelona)',
 locationQuery: 'Sala Apolo, Carrer Nou de la Rambla 113, Barcelona',
 address: 'Carrer Nou de la Rambla 113, Barcelona',
 badge: 'Confirmado',
 bandName: activeBandName,
 details: 'Caché: 1.800€ • Aforo: 900 pax • Prueba de sonido: 18:00h'
 },
 {
 id: 'def-2',
 type: 'ensayo',
 title: 'Ensayo General con Loops y Violín',
 dateStr: '2026-08-20',
 day: '20',
 month: 'AGO',
 location: 'Rock Palace (Madrid)',
 locationQuery: 'Rock Palace, Calle Vara de Rey 6, Madrid',
 address: 'Calle Vara de Rey 6, Madrid',
 badge: 'Programado',
 bandName: activeBandName,
 details: 'Horario: 17:00 a 21:00 • Preparación de repertorio y beatbox'
 },
 {
 id: 'def-3',
 type: 'concierto',
 title: 'Concierto: Festival Mestizaje del Sur',
 dateStr: '2026-09-05',
 day: '05',
 month: 'SEP',
 location: 'Anfiteatro de Granada',
 locationQuery: 'Anfiteatro de Granada, Paseo del Salón',
 address: 'Paseo del Salón, Granada',
 badge: 'En Negociación',
 bandName: activeBandName,
 details: 'Caché: 3.500€ • Aforo: 1.200 pax • Escenario Principal'
 }
 );
 }

 // Sort upcoming events by date
 upcomingEvents.sort((a, b) => a.dateStr.localeCompare(b.dateStr));

 // Calculate urgent leads that need response or approval
 const urgentRepliesNeeded = leads.filter(l => l.estado === 'interesado' || l.estado === 'negociando');
 const urgentApprovalsNeeded = leads.filter(l => l.estado === 'pendiente_aprobacion' || (l.pitch_generado && l.estado === 'nuevo'));

 return (
 <div className={`space-y-6 ${isStitchLight ? 'text-slate-800' : 'text-zinc-100'} font-sans w-full max-w-full overflow-x-hidden`}>
 
 
      {/* HEADER / TITULO PRINCIPAL */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-zinc-100">Resumen</h1>
          <p className="text-sm font-mono text-zinc-400 uppercase tracking-widest">Panel de Control General de {activeBandName}</p>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('planes')}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-400/20 to-amber-500/10 hover:from-amber-500/30 hover:to-amber-400/30 border border-amber-400/50 text-amber-300 text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-md shadow-amber-500/10 cursor-pointer active:scale-95 group"
          >
            <Crown className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Ver Planes & Precios</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-400 text-black text-[9px] font-black uppercase">
              🎁 Regalo
            </span>
          </button>
        )}
      </div>

      {/* BARRA DE SALUD Y COMPLETITUD DEL PERFIL */}
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

      {/* 0. SECCIÓN PRIORITARIA: CORREOS POR CONTESTAR Y ACCIONES URGENTES */}
 <div className={`p-5 rounded-2xl transition-all ${
 isStitchLight 
 ? 'bg-slate-50/90 shadow-sm' 
 : 'bg-[#18181b]/90 shadow-sm'
 }`}>
 <div className={`flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 mb-4 ${
 isStitchLight ? '-slate-200' : '-neutral-800'
 }`}>
 <div className="flex items-center gap-2.5">
 <div className={`p-2 rounded-xl shrink-0 ${isStitchLight ? 'bg-[#d1b375]/15 text-[#d1b375]' : 'bg-[#d1b375]/15 text-[#d1b375]'}`}>
 <AlertCircle className="w-4 h-4" />
 </div>
 <div>
 <h3 className={`text-sm font-bold font-display uppercase tracking-wider flex items-center gap-2 ${isStitchLight ? 'text-slate-900' : 'text-neutral-100'}`}>
 Acciones Prioritarias y Correos por Responder
 </h3>
 <p className={`text-[10px] font-mono mt-0.5 ${textSub}`}>
 Respuestas de salas recibidas, ofertas en diálogo y correos de presentación redactados esperando tu visto bueno.
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2 shrink-0">
 <button
 id="dashboard-btn-urgent-approval"
 onClick={() => onNavigate && onNavigate('booking')}
 className={`px-2 py-1 font-mono text-[10px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 ${
 isStitchLight
 ? 'bg-sky-500/15 hover:bg-sky-500/15 text-white'
 : 'bg-[#d1b375]/15/90 hover:bg-[#d1b375]/15 text-stone-950'
 }`}
 >
 <CheckCircle2 className="w-4 h-4" />
 <span>Aprobar y Responder ({urgentRepliesNeeded.length + urgentApprovalsNeeded.length})</span>
 </button>
 </div>
 </div>

 {/* Dynamic Urgent Actions Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
 
 {/* Card 1: Salas que han respondido e Interesadas */}
 <div className={`p-3.5 rounded-xl flex flex-col justify-between transition-all ${
 isStitchLight 
 ? 'bg-white shadow-sm' 
 : 'bg-[#121214] text-neutral-200'
 }`}>
 <div>
 <div className="flex items-center justify-between gap-2 mb-2.5">
 <span className={`text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
 urgentRepliesNeeded.length > 0 ? (isStitchLight ? 'text-[#10b981]' : 'text-[#10b981]') : textMuted
 }`}>
 <Send className="w-3.5 h-3.5" /> Correos Recibidos / Interesados
 </span>
 <span className={`text-[10px] font-mono font-medium px-2 py-1 rounded-full ${
 urgentRepliesNeeded.length > 0 ? (isStitchLight ? 'bg-emerald-100 text-emerald-700' : 'bg-[#10b981]/15 text-[#10b981]') : 'bg-neutral-800 text-neutral-500'
 }`}>
 {urgentRepliesNeeded.length} pendientes
 </span>
 </div>

 {urgentRepliesNeeded.length > 0 ? (
 <div className="space-y-2 my-1">
 {urgentRepliesNeeded.slice(0, 2).map(lead => (
 <div 
 key={lead.id} 
 onClick={() => onNavigate && onNavigate(isMedio(lead) ? 'medios' : 'booking', { statusFilter: normalizeStatus(lead.estado), selectedLeadId: lead.id })}
 className={`p-3 rounded-xl text-xs font-sans cursor-pointer hover:-[#10b981]/40 transition-all ${
 isStitchLight ? 'bg-[#10b981]/15' : 'bg-neutral-900'
 }`}
 >
 <div className="flex items-center justify-between gap-2 font-medium">
 <span className={isStitchLight ? 'text-slate-900 font-bold' : 'text-neutral-100 font-bold'}>
 {lead.nombre_sala} ({lead.ciudad})
 </span>
 <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] uppercase tracking-wider bg-[#10b981]/15 text-[#10b981] font-mono shrink-0">
 <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]/15 shrink-0"></span>
 {lead.estado}
 </span>
 </div>
 <p className="text-xs text-zinc-300 font-sans mt-1.5 leading-snug truncate">
 {lead.notas || 'Respuesta recibida interesándose en fecha. Requiere propuesta formal.'}
 </p>
 </div>
 ))}
 </div>
 ) : (
 <p className={`text-[10px] font-mono my-2 ${textMuted}`}>
 No hay respuestas pendientes de contestación en este momento.
 </p>
 )}
 </div>

 <button
 onClick={() => onNavigate && onNavigate('booking', { statusFilter: 'interesado' })}
 className={`mt-3 pt-2 -dashed flex items-center justify-between text-[10px] font-mono font-bold cursor-pointer ${
 urgentRepliesNeeded.length > 0 
 ? isStitchLight ? 'text-[#10b981]' : 'text-[#10b981]'
 : 'text-neutral-500'
 }`}
 >
 <span>{urgentRepliesNeeded.length > 0 ? 'Contestar Correos Ahora' : 'Ir al panel de Booking'}</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </button>
 </div>

 {/* Card 2: Pitches redactados pendientes de aprobación */}
 <div className={`p-3.5 rounded-xl flex flex-col justify-between transition-all ${
 isStitchLight 
 ? 'bg-white shadow-sm' 
 : 'bg-[#121214] text-neutral-200'
 }`}>
 <div>
 <div className="flex items-center justify-between gap-2 mb-2.5">
 <span className={`text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
 urgentApprovalsNeeded.length > 0 ? (isStitchLight ? 'text-[#d1b375]' : 'text-[#d1b375]') : textMuted
 }`}>
 <ShieldCheck className="w-3.5 h-3.5" /> Correos Listos para Aprobar
 </span>
 <span className={`text-[10px] font-mono font-medium px-2 py-1 rounded-full ${
 urgentApprovalsNeeded.length > 0 ? 'bg-[#d1b375]/15 text-[#d1b375]' : 'bg-neutral-800 text-neutral-500'
 }`}>
 {urgentApprovalsNeeded.length} por revisar
 </span>
 </div>

 {urgentApprovalsNeeded.length > 0 ? (
 <div className="space-y-2 my-1">
 {urgentApprovalsNeeded.slice(0, 2).map(lead => (
 <div 
 key={lead.id} 
 onClick={() => onNavigate && onNavigate(isMedio(lead) ? 'medios' : 'booking', { statusFilter: 'pendiente_aprobacion', selectedLeadId: lead.id })}
 className={`p-3 rounded-xl text-xs font-sans cursor-pointer hover:-[#d1b375]/40 transition-all ${
 isStitchLight ? 'bg-[#d1b375]/15' : 'bg-neutral-900'
 }`}
 >
 <div className="flex items-center justify-between gap-2 font-medium">
 <span className={isStitchLight ? 'text-slate-900 font-bold' : 'text-neutral-100 font-bold'}>
 {lead.nombre_sala} ({lead.ciudad})
 </span>
 <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] uppercase tracking-wider bg-[#d1b375]/15 text-[#d1b375] font-mono shrink-0">
 <span className="w-1.5 h-1.5 rounded-full bg-[#d1b375]/15 shrink-0"></span>
 Redactado
 </span>
 </div>
 <p className="text-xs text-zinc-300 font-sans mt-1.5 leading-snug truncate">
 {lead.pitch_generado || 'Correo generado por el Agente Redactor listo para validación.'}
 </p>
 </div>
 ))}
 </div>
 ) : (
 <p className={`text-[10px] font-mono my-2 ${textMuted}`}>
 No hay borradores de presentación esperando aprobación.
 </p>
 )}
 </div>

 <button
 onClick={() => onNavigate && onNavigate('booking', { statusFilter: 'pendiente_aprobacion' })}
 className={`mt-3 pt-2 -dashed flex items-center justify-between text-[10px] font-mono font-bold cursor-pointer ${
 urgentApprovalsNeeded.length > 0 
 ? isStitchLight ? 'text-[#d1b375]' : 'text-[#d1b375]'
 : 'text-neutral-500'
 }`}
 >
 <span>{urgentApprovalsNeeded.length > 0 ? 'Revisar y Aprobar Correos' : 'Ver Contactos'}</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </button>
 </div>

 {/* Card 3: Datos Faltantes / Rastreo Scout */}
 <div className={`p-3.5 rounded-xl flex flex-col justify-between transition-all ${
 isStitchLight ? 'bg-white' : 'bg-[#121214] text-neutral-300'
 }`}>
 <div>
 <div className="flex items-center justify-between gap-2 mb-2">
 <span className={`text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${isStitchLight ? 'text-sky-400' : 'text-sky-400'}`}>
 <Bot className="w-3.5 h-3.5" /> Búsqueda y Rastreo Scout
 </span>
 <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-full bg-sky-500/15 text-sky-400">
 Agente Activo
 </span>
 </div>

 <div className="space-y-1.5 my-1 text-[10px] font-mono">
 <div className={`flex justify-between pb-1 ${isStitchLight ? '-slate-100' : '-neutral-800'}`}>
 <span className={textMuted}>Búsqueda de Salas:</span>
 <span className={`${textTitle} font-bold`}>3 provincias objetivo</span>
 </div>
 <div className={`flex justify-between pb-1 ${isStitchLight ? '-slate-100' : '-neutral-800'}`}>
 <span className={textMuted}>Enriquecimiento Web:</span>
 <span className="text-[#10b981] font-bold">Automatic Scraper Ready</span>
 </div>
 </div>
 </div>

 <button
 onClick={() => onNavigate && onNavigate('chat')}
 className={`mt-3 pt-2 -dashed flex items-center justify-between text-[10px] font-mono font-bold cursor-pointer ${
 isStitchLight ? 'text-sky-400' : 'text-sky-400'
 }`}
 >
 <span>Abrir Asistente Scout</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </button>
 </div>

 </div>
 </div>

 {/* 1. SECCIÓN PRINCIPAL: PRÓXIMAS FECHAS (AGENDA INMEDIATA DE LA BANDA) */}
 <div className={`${colors.card} p-5 shadow-sm`}>
 <div className={`flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 mb-4 `}>
 <div>
 <div className="flex items-center gap-2">
 <Calendar className={`w-4 h-4 ${isStitchLight ? 'text-sky-400' : 'text-zinc-100'}`} />
 <h3 className={`text-base font-bold font-display uppercase tracking-wider ${isStitchLight ? 'text-sky-400' : 'text-zinc-100'}`}>
 Próximas Fechas y Agenda
 </h3>
 </div>
 <p className={`text-[10px] font-mono mt-0.5 ${textSub}`}>
 Próximos conciertos confirmados, fechas en negociación y ensayos de la banda.
 </p>
 </div>

 <div className="flex items-center gap-3 flex-wrap">
 {/* Band Filter Mode Toggle */}
  <div className={`w-full sm:w-auto flex items-center rounded-xl p-1 gap-1 border ${
  isStitchLight ? 'bg-slate-100 border-slate-200' : 'bg-zinc-900/90 border-zinc-800'
  }`}>
  <button
  id="dashboard-agenda-active-band-btn"
  onClick={() => setAgendaFilterMode('active')}
  className={`flex-1 sm:flex-initial px-2.5 py-1.5 text-[10px] font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap min-w-0 ${
  agendaFilterMode === 'active'
  ? isStitchLight ? 'bg-sky-500 text-white shadow-xs' : 'bg-[#d1b375] text-stone-950 font-black shadow-xs'
  : 'text-neutral-400 hover:text-neutral-200'
  }`}
  title={`Ver solo eventos de ${activeBandName}`}
  >
  <Music className="w-3 h-3 shrink-0" />
  <span className="truncate max-w-[90px] sm:max-w-none">{activeBandName}</span>
   <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
     agendaFilterMode === 'active' ? 'bg-black/20 text-stone-950' : 'bg-black/30 dark:bg-white/10 text-neutral-300'
   }`}>
     <span className="inline-flex items-center gap-0.5 text-emerald-400 font-extrabold" title={`${activeBandConcerts.length} directos públicos`}>
       <Mic className="w-2.5 h-2.5" />
       {activeBandConcerts.length}
     </span>
     <span className="opacity-30">•</span>
     <span className="inline-flex items-center gap-0.5 text-purple-400 font-extrabold" title={`${activeBandRehearsals.length} ensayos`}>
       <DoorClosed className="w-2.5 h-2.5" />
       {activeBandRehearsals.length}
     </span>
   </span>
  </button>

  <button
  id="dashboard-agenda-all-bands-btn"
  onClick={() => setAgendaFilterMode('all')}
  className={`flex-1 sm:flex-initial px-2.5 py-1.5 text-[10px] font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap min-w-0 ${
  agendaFilterMode === 'all'
  ? isStitchLight ? 'bg-sky-500 text-white shadow-xs' : 'bg-[#d1b375] text-stone-950 font-black shadow-xs'
  : 'text-neutral-400 hover:text-neutral-200'
  }`}
  title="Ver eventos de todos los grupos asignados"
  >
  <Users className="w-3 h-3 shrink-0" />
  <span className="truncate">Todas</span>
   <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
     agendaFilterMode === 'all' ? 'bg-black/20 text-stone-950' : 'bg-black/30 dark:bg-white/10 text-neutral-300'
   }`}>
     <span className="inline-flex items-center gap-0.5 text-emerald-400 font-extrabold" title={`${concerts.length} directos totales`}>
       <Mic className="w-2.5 h-2.5" />
       {concerts.length}
     </span>
     <span className="opacity-30">•</span>
     <span className="inline-flex items-center gap-0.5 text-purple-400 font-extrabold" title={`${rehearsals.length} ensayos totales`}>
       <DoorClosed className="w-2.5 h-2.5" />
       {rehearsals.length}
     </span>
   </span>
  </button>
  </div>

  

 <button
 id="dashboard-btn-full-agenda"
 onClick={() => onNavigate && onNavigate('calendario')}
 className={`px-2.5 py-1.5 font-mono text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
 isStitchLight 
 ? 'bg-sky-500/15 hover:bg-sky-500/15 text-sky-400' 
 : 'bg-zinc-800/50 hover:bg-zinc-800 text-zinc-100'
 }`}
 >
 <span>Ver Agenda Completa</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>

 {/* List of upcoming events */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {upcomingEvents.slice(0, 3).map((item) => (
 <div 
 key={item.id}
 onClick={() => onNavigate && onNavigate('calendario', { selectedEventId: item.id, selectedDate: item.dateStr })}
 className={`p-4 rounded-xl transition-all flex flex-col justify-between cursor-pointer ${subCardBg} hover:scale-[1.01] hover:-indigo-500/40`}
 >
 <div className="flex items-start gap-3.5">
 {/* Custom calendar badge */}
 <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 shadow-sm ${
 isStitchLight ? 'bg-white text-slate-800' : 'bg-[#1c1b1b] text-neutral-100'
 }`}>
 <span className={`text-lg font-mono font-black leading-none ${isStitchLight ? 'text-sky-500' : 'text-amber-400'}`}>
 {item.day}
 </span>
 <span className={`text-xs font-mono font-extrabold uppercase tracking-widest mt-0.5 ${isStitchLight ? 'text-slate-600' : 'text-amber-300'}`}>
 {item.month}
 </span>
 </div>

 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
 item.type === 'concierto'
 ? isStitchLight ? 'bg-sky-500/15 text-sky-400' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
 : isStitchLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
 }`}>
 {item.type}
 </span>
 <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-zinc-800/80 text-amber-200 border border-amber-500/30 truncate max-w-[120px]" title={item.bandName}>
 {item.bandName}
 </span>
 <span className={`text-[10px] font-mono ${textMuted}`}>
 • {item.badge}
 </span>
 </div>

 <h4 className={`text-base sm:text-lg font-bold font-display tracking-wide mt-1.5 truncate ${textTitle}`}>
 {item.title}
 </h4>

 <p className="text-xs sm:text-sm font-semibold mt-1 flex items-center gap-1 text-zinc-200">
 <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
 <span className="truncate">{item.location}</span>
 </p>
 </div>
 </div>

 {item.location && (
 <div className="mt-3 flex justify-center">
 <DirectionsCard 
 query={item.locationQuery || item.location} 
 locationName={item.location} 
 address={item.address}
 isStitchLight={isStitchLight} 
 />
 </div>
 )}

 <div className={`mt-2 pt-2 text-xs font-mono font-medium flex items-center justify-between text-zinc-300 ${
 isStitchLight ? '-slate-200 text-slate-500' : '-neutral-800 text-neutral-400'
 }`}>
 <span className="truncate">{item.details}</span>
 <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* 1.5 SECCIÓN: ESTADO DE MÓDULOS CLAVE DE LA BANDA */}
 <div className="space-y-3">
   <div className="flex items-center justify-between">
     <h3 className={`text-sm font-bold font-display uppercase tracking-wider ${isStitchLight ? 'text-slate-900' : 'text-neutral-100'}`}>
       Módulos & Herramientas de la Banda
     </h3>
     <span className="text-[10px] font-mono text-neutral-400">Estado dinámico según tus datos</span>
   </div>

   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
     {/* Dossier & EPK Card */}
     {(() => {
       const hasBioLogo = Boolean(
         epkConfig?.biografia && 
         epkConfig.biografia.trim().length >= 80 && 
         !epkConfig.biografia.toLowerCase().includes('por definir') &&
         !epkConfig.biografia.includes('Propuesta musical en directo') &&
         (epkConfig?.logoUrl || (epkConfig?.bandPhotos && epkConfig.bandPhotos.length > 0))
       );
       const hasDossierPdf = Boolean(
         (epkConfig?.dossierPdfUrl && epkConfig.dossierPdfUrl.trim().length > 5) || 
         (epkConfig?.dossierDocumentUrl && epkConfig.dossierDocumentUrl.trim().length > 5) || 
         (epkConfig?.dossierTextoExtra && epkConfig.dossierTextoExtra.trim().length >= 80 && !epkConfig.dossierTextoExtra.toLowerCase().includes('por definir'))
       );
       const hasRiderPdf = Boolean(
         (epkConfig?.riderPdfUrl && epkConfig.riderPdfUrl.trim().length > 5) || 
         (epkConfig?.riderTecnico && epkConfig.riderTecnico.trim().length >= 80 && !epkConfig.riderTecnico.toLowerCase().includes('por definir'))
       );
       const itemsReadyCount = [hasBioLogo, hasDossierPdf, hasRiderPdf].filter(Boolean).length;

       return (
         <div 
           onClick={() => onNavigate && onNavigate('epk')}
           className={`${colors.card} p-4 rounded-xl flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer group`}
         >
           <div className="space-y-2">
             <div className="flex items-center justify-between">
               <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-amber-400 flex items-center gap-1">
                 <FileText className="w-3.5 h-3.5" /> EPK & Dossier
               </span>
               <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold ${
                 itemsReadyCount === 3 
                   ? 'bg-emerald-500/15 text-emerald-300' 
                   : itemsReadyCount > 0 
                     ? 'bg-amber-500/15 text-amber-300' 
                     : 'bg-rose-500/15 text-rose-300'
               }`}>
                 {itemsReadyCount === 3 ? '100% Completo' : `${itemsReadyCount}/3 Listo`}
               </span>
             </div>

             <div>
               <h4 className="text-sm font-bold text-zinc-100 font-display">Dossier & Rider Técnico</h4>
               <div className="text-[10px] font-sans mt-1.5 space-y-1">
                 <div className="flex items-center justify-between">
                   <span className="text-neutral-400">Bio y Logo:</span>
                   <span className={`font-mono font-bold ${hasBioLogo ? 'text-emerald-400' : 'text-amber-400'}`}>
                     {hasBioLogo ? '✓ Listo' : 'Pendiente'}
                   </span>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-neutral-400">Dossier PDF:</span>
                   <span className={`font-mono font-bold ${hasDossierPdf ? 'text-emerald-400' : 'text-rose-400'}`}>
                     {hasDossierPdf ? '✓ Subido' : 'No subido'}
                   </span>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-neutral-400">Rider Técnico:</span>
                   <span className={`font-mono font-bold ${hasRiderPdf ? 'text-emerald-400' : 'text-rose-400'}`}>
                     {hasRiderPdf ? '✓ Subido' : 'No subido'}
                   </span>
                 </div>
               </div>
             </div>
           </div>

           <div className="mt-3 pt-2 border-t border-neutral-800 flex items-center justify-between text-[10px] font-mono font-bold text-amber-400 group-hover:translate-x-0.5 transition-transform">
             <span>{itemsReadyCount === 3 ? 'Gestionar EPK' : 'Adjuntar Archivos'}</span>
             <ArrowRight className="w-3.5 h-3.5" />
           </div>
         </div>
       );
     })()}

     {/* Discografía & Repertorio Card */}
     <div 
       onClick={() => onNavigate && onNavigate('repertorio')}
       className={`${colors.card} p-4 rounded-xl flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer group`}
     >
       <div className="space-y-2">
         <div className="flex items-center justify-between">
           <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-purple-400 flex items-center gap-1">
             <Disc3 className="w-3.5 h-3.5" /> Repertorio
           </span>
           <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold ${
             storedSongsCount > 0 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'
           }`}>
             {storedSongsCount > 0 ? `${storedSongsCount} Temas` : 'Sin canciones'}
           </span>
         </div>

         <div>
           <h4 className="text-sm font-bold text-zinc-100 font-display">Catálogo & Setlists</h4>
           <p className="text-[10px] text-neutral-400 font-sans mt-0.5">
             {storedSongsCount > 0 ? `${storedSongsCount} canciones registradas para auto-generar setlists.` : 'Carga tu lista de temas para armar setlists automáticos.'}
           </p>
         </div>
       </div>

       <div className="mt-3 pt-2 border-t border-neutral-800 flex items-center justify-between text-[10px] font-mono font-bold text-purple-400 group-hover:translate-x-0.5 transition-transform">
         <span>{storedSongsCount > 0 ? 'Ver Repertorio' : 'Añadir Canciones'}</span>
         <ArrowRight className="w-3.5 h-3.5" />
       </div>
     </div>

     {/* Fans & Captura Card */}
     <div 
       onClick={() => onNavigate && onNavigate('fans')}
       className={`${colors.card} p-4 rounded-xl flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer group`}
     >
       <div className="space-y-2">
         <div className="flex items-center justify-between">
           <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-rose-400 flex items-center gap-1">
             <Heart className="w-3.5 h-3.5" /> Comunidad Fans
           </span>
           <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold ${
             fans.length > 0 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
           }`}>
             {fans.length} Fans
           </span>
         </div>

         <div>
           <h4 className="text-sm font-bold text-zinc-100 font-display">Captura & Fidelización</h4>
           <p className="text-[10px] text-neutral-400 font-sans mt-0.5">
             {fans.length > 0 ? 'Base de datos propia para promocionar tus conciertos.' : 'Configura una descarga gratuita para captar emails en directo.'}
           </p>
         </div>
       </div>

       <div className="mt-3 pt-2 border-t border-neutral-800 flex items-center justify-between text-[10px] font-mono font-bold text-rose-400 group-hover:translate-x-0.5 transition-transform">
         <span>{fans.length > 0 ? 'Ver Audiencia' : 'Configurar Captura'}</span>
         <ArrowRight className="w-3.5 h-3.5" />
       </div>
     </div>

     {/* Métricas Social & Audiencia Card */}
     <div 
       onClick={() => onNavigate && onNavigate('reels')}
       className={`${colors.card} p-4 rounded-xl flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer group`}
     >
       <div className="space-y-2">
         <div className="flex items-center justify-between">
           <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-sky-400 flex items-center gap-1">
             <Activity className="w-3.5 h-3.5" /> Métricas
           </span>
           <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold ${
             metrics.length > 0 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-sky-500/15 text-sky-300'
           }`}>
             {metrics.length > 0 ? 'Registradas' : 'Pendiente'}
           </span>
         </div>

         <div>
           <h4 className="text-sm font-bold text-zinc-100 font-display">Audiencia & Caché</h4>
           <p className="text-[10px] text-neutral-400 font-sans mt-0.5">
             {metrics.length > 0 ? 'Datos sociales activos para negociar caché con salas.' : 'Registra tus escuchas y seguidores para respaldar caché.'}
           </p>
         </div>
       </div>

       <div className="mt-3 pt-2 border-t border-neutral-800 flex items-center justify-between text-[10px] font-mono font-bold text-sky-400 group-hover:translate-x-0.5 transition-transform">
         <span>{metrics.length > 0 ? 'Ver Métricas' : 'Registrar Audiencia'}</span>
         <ArrowRight className="w-3.5 h-3.5" />
       </div>
     </div>
   </div>
 </div>

 {/* 2. SECCIÓN: EMBUDO OPERATIVO DE BOOKING (MÉTRICAS CLAVE REALES) */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 
 {/* Metric 1: Pitches pendientes de aprobar */}
 <div 
 onClick={() => onNavigate && onNavigate('booking', { statusFilter: 'pendiente_aprobacion' })}
 className={`${colors.card} p-4 rounded-xl flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer group`}
 >
 <div className="space-y-1.5">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#d1b375] flex items-center gap-1">
 <Hourglass className="w-3.5 h-3.5" /> Pendientes
 </span>
 <span className="text-[10px] px-2 py-1 rounded font-mono bg-[#d1b375]/15 text-[#d1b375]">
 Agente Redactor
 </span>
 </div>
 <div className="flex items-baseline gap-2">
 <h3 className={`text-5xl font-display font-black tracking-tighter ${textTitle}`}>{pendingApprovalCount}</h3>
 <span className={`text-[10px] font-mono ${textSub}`}>correos redactados</span>
 </div>
 <p className={`text-[10px] font-sans ${textMuted}`}>
 Propuestas de correo listas para revisar y aprobar antes de enviar a las salas.
 </p>
 </div>
 <div className="mt-3 pt-2 -dashed flex items-center justify-between text-[10px] font-mono font-bold text-[#d1b375] group-hover:translate-x-0.5 transition-transform">
 <span>Aprobar Correos</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </div>
 </div>

 {/* Metric 2: Enviados y en espera */}
 <div 
 onClick={() => onNavigate && onNavigate('booking', { statusFilter: 'esperando_respuesta' })}
 className={`${colors.card} p-4 rounded-xl flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer group`}
 >
 <div className="space-y-1.5">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-sky-400 flex items-center gap-1">
 <Send className="w-3.5 h-3.5" /> Enviados
 </span>
 <span className="text-[10px] px-2 py-1 rounded font-mono bg-sky-500/15 text-sky-400">
 En Espera
 </span>
 </div>
 <div className="flex items-baseline gap-2">
 <h3 className={`text-2xl font-mono font-black ${textTitle}`}>{sentCount}</h3>
 <span className={`text-[10px] font-mono ${textSub}`}>salas contactadas</span>
 </div>
 <p className={`text-[10px] font-sans ${textMuted}`}>
 Emails de presentación enviados a programadores aguardando respuesta o seguimiento.
 </p>
 </div>
 <div className="mt-3 pt-2 -dashed flex items-center justify-between text-[10px] font-mono font-bold text-sky-400 group-hover:translate-x-0.5 transition-transform">
 <span>Ver Seguimiento</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </div>
 </div>

 {/* Metric 3: Interesados y Negociando */}
 <div 
 onClick={() => onNavigate && onNavigate('booking', { statusFilter: 'interesado' })}
 className={`${colors.card} p-4 rounded-xl flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer group`}
 >
 <div className="space-y-1.5">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#10b981] flex items-center gap-1">
 <Sparkles className="w-3.5 h-3.5" /> Interesados
 </span>
 <span className="text-[10px] px-2 py-1 rounded font-mono bg-[#10b981]/15 text-[#10b981]">
 Oportunidades
 </span>
 </div>
 <div className="flex items-baseline gap-2">
 <h3 className={`text-2xl font-mono font-black ${textTitle}`}>{interestedCount}</h3>
 <span className={`text-[10px] font-mono ${textSub}`}>salas en diálogo</span>
 </div>
 <p className={`text-[10px] font-sans ${textMuted}`}>
 Salas que han respondido positivamente solicitando fechas, caché o rider técnico.
 </p>
 </div>
 <div className="mt-3 pt-2 -dashed flex items-center justify-between text-[10px] font-mono font-bold text-[#10b981] group-hover:translate-x-0.5 transition-transform">
 <span>Gestionar Tratos</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </div>
 </div>

 {/* Metric 4: Contactos de Medios y Prensa */}
 <div 
 onClick={() => onNavigate && onNavigate('medios', { sectionTab: 'medios', statusFilter: 'todos' })}
 className={`${colors.card} p-4 rounded-xl flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer group`}
 >
 <div className="space-y-1.5">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-rose-400 flex items-center gap-1">
 <Radio className="w-3.5 h-3.5" /> Medios & Prensa
 </span>
 <span className="text-[10px] px-2 py-1 rounded font-mono bg-rose-500/15 text-rose-400">
 Radio / Podcast
 </span>
 </div>
 <div className="flex items-baseline gap-2">
 <h3 className={`text-2xl font-mono font-black ${textTitle}`}>{mediosCount}</h3>
 <span className={`text-[10px] font-mono ${textSub}`}>contactos clave</span>
 </div>
 <p className={`text-[10px] font-sans ${textMuted}`}>
 Radio 3, blogs independientes y periodistas musicales para difusión del dossier.
 </p>
 </div>
 <div className="mt-3 pt-2 -dashed flex items-center justify-between text-[10px] font-mono font-bold text-rose-400 group-hover:translate-x-0.5 transition-transform">
 <span>Ir a Medios</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </div>
 </div>

 </div>

 {/* 3. SECCIÓN: ACCIONES RÁPIDAS OPERATIVAS */}
 <div className={`${colors.card} p-4 `}>
 <div className="flex items-center justify-between pb-2.5 mb-3">
 <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${isStitchLight ? 'text-sky-400' : 'text-zinc-100'}`}>
 Acciones Rápidas del Día
 </span>
 <span className={`text-[10px] font-mono ${textMuted}`}>{currentUser?.bandName || 'Bakandeya'} Virtual Manager</span>
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-[10px] font-mono">
 <button
 id="quick-act-scout"
 onClick={() => onNavigate && onNavigate('chat')}
 className={`p-3 rounded-xl text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
 isStitchLight 
 ? 'bg-sky-500/15 hover:bg-sky-500/15 text-sky-400' 
 : 'bg-[#1A1918] hover:bg-neutral-800/80 text-neutral-200'
 }`}
 >
 <div className="flex items-center gap-1.5 text-[#d1b375] font-bold">
 <Bot className="w-4 h-4" />
 <span>Lanzar Scout AI</span>
 </div>
 <span className={`text-[10px] ${textSub}`}>Buscar salas en nueva ciudad o provincia</span>
 </button>

 <button
 id="quick-act-autonomy"
 onClick={() => onNavigate && onNavigate('chat')}
 className={`p-3 rounded-xl text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
 isStitchLight 
 ? 'bg-purple-500/15 text-purple-600' 
 : 'bg-[#1A1918] hover:bg-neutral-800/80 text-neutral-200'
 }`}
 >
 <div className="flex items-center gap-1.5 text-purple-400 font-bold">
 <Sliders className="w-4 h-4" />
 <span>Autonomía AI</span>
 </div>
 <span className={`text-[10px] ${textSub}`}>Gestionar límites en Agent Manager</span>
 </button>

 <button
 id="quick-act-templates"
 onClick={() => setIsEmailTemplatesOpen(true)}
 className={`p-3 rounded-xl text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
 isStitchLight 
 ? 'bg-amber-500/15 text-amber-600' 
 : 'bg-[#1A1918] hover:bg-neutral-800/80 text-neutral-200'
 }`}
 >
 <div className="flex items-center gap-1.5 text-amber-400 font-bold">
 <FileText className="w-4 h-4" />
 <span>Plantillas Email</span>
 </div>
 <span className={`text-[10px] ${textSub}`}>Ver ejemplos reales de pitch y respuestas</span>
 </button>

 <button
 id="quick-act-approve"
 onClick={() => onNavigate && onNavigate('booking', { statusFilter: 'pendiente_aprobacion' })}
 className={`p-3 rounded-xl text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
 isStitchLight 
 ? 'bg-[#d1b375]/15 hover:bg-[#d1b375]/15 text-[#d1b375]' 
 : 'bg-[#1A1918] hover:bg-neutral-800/80 text-neutral-200'
 }`}
 >
 <div className="flex items-center gap-1.5 text-[#d1b375] font-bold">
 <ShieldCheck className="w-4 h-4" />
 <span>Aprobar Correos ({pendingApprovalCount})</span>
 </div>
 <span className={`text-[10px] ${textSub}`}>Validar los correos redactados antes del envío</span>
 </button>

 <button
 id="quick-act-medios"
 onClick={() => onNavigate && onNavigate('medios', { sectionTab: 'medios', statusFilter: 'todos' })}
 className={`p-3 rounded-xl text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
 isStitchLight 
 ? 'bg-rose-500/15 hover:bg-rose-500/15 text-rose-400' 
 : 'bg-[#1A1918] hover:bg-neutral-800/80 text-neutral-200'
 }`}
 >
 <div className="flex items-center gap-1.5 text-rose-400 font-bold">
 <Radio className="w-4 h-4" />
 <span>Prensa y Radios</span>
 </div>
 <span className={`text-[10px] ${textSub}`}>Enviar notas de prensa y comunicados</span>
 </button>

 <button
 id="quick-act-add-sala"
 onClick={() => setIsAddModalOpen(true)}
 className={`p-3 rounded-xl text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
 isStitchLight 
 ? 'bg-emerald-100 text-emerald-700' 
 : 'bg-[#1A1918] hover:bg-neutral-800/80 text-neutral-200'
 }`}
 >
 <div className="flex items-center gap-1.5 text-[#10b981] font-bold">
 <Plus className="w-4 h-4" />
 <span>Nueva Sala</span>
 </div>
 <span className={`text-[10px] ${textSub}`}>Añadir un contacto manualmente a la hoja</span>
 </button>
 </div>
 </div>

 {/* 5. SECCIÓN PRINCIPAL: EVOLUCIÓN DE REDES SOCIALES & BASE DE FANS EN BBDD */}
 <div className="w-full">
   <SocialAndFansGrowthChart 
      metrics={metrics}
      fans={fans}
      epkConfig={epkConfig}
      colors={colors}
      isStitchLight={isStitchLight}
      bandName={activeBandName}
      bandId={currentBandId}
      onNavigate={onNavigate}
    />
 </div>

 {/* 6. SECCIÓN COMPACTA: ESTADO DE SINCRONIZACIÓN Y CANALES DEDICADOS */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 
 {/* Supabase Database Persistence Status */}
 <div className={`${colors.card} p-5 flex flex-col justify-between `}>
 <div className="space-y-2">
 <div className={`flex items-center gap-1.5 ${colors.accent}`}>
 <Database className="w-4 h-4" />
 <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Supabase PostgreSQL Data Sync</span>
 </div>
 <h3 className={`text-lg font-display font-black uppercase tracking-wide ${textTitle}`}>BBDD LIVE SYNCED</h3>
 
 <div className={`text-[10px] font-mono space-y-2 ${textSub}`}>
 <div>Total Contactos en BBDD: <span className={`${textTitle} font-bold`}>{leads.length}</span></div>
 
 <div className="flex flex-wrap gap-2 pt-1">
 <button
 onClick={() => onNavigate && onNavigate('booking')}
 className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#d1b375]/15 hover:bg-[#d1b375]/25 text-[#d1b375] text-[10px] font-bold transition-all cursor-pointer"
 >
 <Building2 className="w-3 h-3 text-[#d1b375] shrink-0" />
 <span>{leads.length - mediosCount} Salas & Festivales</span>
 </button>

 <button
 onClick={() => onNavigate && onNavigate('medios')}
 className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-[10px] font-bold transition-all cursor-pointer"
 >
 <Radio className="w-3 h-3 text-rose-400 shrink-0" />
 <span>{mediosCount} Medios & Prensa</span>
 </button>
 </div>
 </div>
 </div>

 <button 
 id="dashboard-btn-sync"
 onClick={handleForceSync}
 disabled={syncLoading}
 className={`w-full mt-4 py-2 text-[10px] font-mono rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 ${
 isStitchLight 
 ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
 : 'bg-[#1A1918] hover:bg-neutral-800 hover:text-white text-neutral-200'
 }`}
 >
 <RefreshCw className={`w-3.5 h-3.5 ${syncLoading ? 'animate-spin' : ''}`} />
 <span>{syncLoading ? 'Sincronizando con Supabase...' : 'Forzar Sincronización BBDD'}</span>
 </button>
 </div>

 {/* Audience & Fanbase Direct Access Card */}
 <div className={`${colors.card} p-5 flex flex-col justify-between `}>
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-1.5 text-neutral-400">
 <Heart className="w-4 h-4 text-amber-400 fill-amber-400/20" />
 <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${textSub}`}>Comunidad de Fans & Redes</span>
 </div>
 <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
 <ShieldCheck className="w-3 h-3" /> 100% RGPD
 </span>
 </div>

 <div className="grid grid-cols-2 gap-2 pt-1">
 <div className={`p-2.5 rounded-xl border ${isStitchLight ? 'bg-slate-100/70 border-slate-200' : 'bg-neutral-900/60 border-neutral-800'}`}>
 <span className={`text-[9px] font-mono block ${textMuted}`}>Total Fans Registrados</span>
 <span className="text-xl font-display font-black text-amber-400">{fans.length}</span>
 </div>
 <div className={`p-2.5 rounded-xl border ${isStitchLight ? 'bg-slate-100/70 border-slate-200' : 'bg-neutral-900/60 border-neutral-800'}`}>
 <span className={`text-[9px] font-mono block ${textMuted}`}>Vía Formulario Únete</span>
 <span className="text-xl font-display font-black text-amber-300">
 {fans.filter(f => {
   const src = (f.comoConocio || '').toLowerCase();
   return src.includes('unete') || src.includes('únete') || src.includes('web') || src.includes('formulario') || src.includes('landing') || !src;
 }).length}
 </span>
 </div>
 </div>

 <div className={`text-[10px] font-mono ${textSub}`}>
 <span>Localidades con presencia: </span>
 <span className="text-amber-400 font-bold">{new Set(fans.map(f => f.ciudad).filter(Boolean)).size} ciudades</span>
 </div>
 </div>

 <button
 type="button"
 onClick={() => onNavigate && onNavigate('fans')}
 className="w-full mt-4 py-2 text-[10px] font-mono rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 font-bold"
 >
 <Users className="w-3.5 h-3.5" />
 <span>Abrir Panel Completo de Seguidores y Redes</span>
 </button>
 </div>

 </div>

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
     getStatusBadgeClass={(status) => {
       const norm = normalizeStatus(status);
       switch (norm) {
         case 'nuevo': return 'bg-stone-500/20 text-stone-300';
         case 'pendiente_aprobacion': return 'bg-amber-500/20 text-amber-300';
         case 'aprobado': return 'bg-emerald-500/20 text-emerald-300';
         case 'esperando_respuesta': return 'bg-sky-500/20 text-sky-300';
         case 'interesado': return 'bg-emerald-500/20 text-emerald-300';
         case 'negociando': return 'bg-purple-500/20 text-purple-300';
         case 'no_interesado': return 'bg-zinc-800 text-zinc-400';
         default: return 'bg-zinc-800 text-zinc-300';
       }
     }}
     getStatusLabel={(status) => {
       const norm = normalizeStatus(status);
       switch (norm) {
         case 'nuevo': return 'Por Contactar';
         case 'pendiente_aprobacion': return 'Por Aprobar';
         case 'aprobado': return 'Aprobado';
         case 'esperando_respuesta': return 'Email Enviado';
         case 'interesado': return 'Interesado';
         case 'negociando': return 'Negociando';
         case 'no_interesado': return 'No Interesado';
         default: return String(status).toUpperCase();
       }
     }}
     getStatusDotColor={(status) => {
       const norm = normalizeStatus(status);
       switch (norm) {
         case 'nuevo': return 'bg-[#a39e9b]';
         case 'pendiente_aprobacion': return 'bg-[#f2ca50] animate-pulse';
         case 'aprobado': return 'bg-[#10b981]';
         case 'esperando_respuesta': return 'bg-[#38bdf8]';
         case 'interesado': return 'bg-[#10b981]';
         case 'negociando': return 'bg-[#38bdf8]';
         case 'no_interesado': return 'bg-[#85736b]';
         default: return 'bg-[#85736b]';
       }
     }}
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
   bandId={currentBandId || currentUser?.band_id || 'band-bakandeya'}
   currentUser={currentUser}
   isStitchLight={isStitchLight}
   onOpenTemplatesSection={() => {
     if (onNavigate) onNavigate('booking');
   }}
 />

 </div>
 );
}
