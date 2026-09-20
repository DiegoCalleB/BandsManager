import React, { useState, useEffect } from'react';
import { 
 Search, MapPin, Phone, Globe, Star, Sparkles, Check, Loader2, X, 
 PlusCircle, Building2, CheckCircle2, AlertCircle, Sliders, Users, Music2, Radio, Briefcase, Disc3, ShieldCheck,
 Ban, Trash2, RotateCcw, Target
} from'lucide-react';
import { Lead, LeadType, BookingCampaign } from'../../types';
import { apiFetch } from'../../utils/api';
import { api } from'../../services/api';
import { ModalPortal } from'../common/ModalPortal';

export interface PlaceResult {
 place_id: string;
 nombre_sala: string;
 ciudad: string;
 region: string;
 direccion: string;
 telefono: string;
 website: string;
 rating?: number | null;
 user_ratings_total?: number | null;
 tipo: LeadType | string;
 aforo?: number;
 genero?: string;
 descripcion?: string;
 imagen_url?: string;
 icono?: string;
 email_contacto?: string;
 instagram?: string;
 contacto_nombre?: string;
 fuente?: string;
 selected?: boolean;
 extractingEmail?: boolean;
 alreadyInCrm?: boolean;
 crmStatus?: string | null;
 crmId?: string | null;
 crmNombre?: string | null;
 capacityMatch?: boolean;
}

export interface DiscardedPlace {
 place_id?: string;
 nombre_sala: string;
 ciudad?: string;
 tipo?: string;
 discarded_at: string;
}

const DISCARDED_STORAGE_KEY ='bandmanager_scout_discarded_places';

function getStoredDiscarded(): DiscardedPlace[] {
 try {
 const raw = localStorage.getItem(DISCARDED_STORAGE_KEY);
 return raw ? JSON.parse(raw) : [];
 } catch {
 return [];
 }
}

function saveStoredDiscarded(list: DiscardedPlace[]) {
 try {
 localStorage.setItem(DISCARDED_STORAGE_KEY, JSON.stringify(list));
 } catch {}
}

interface GooglePlacesExplorerModalProps {
 isOpen: boolean;
 isStitchLight: boolean;
 onClose: () => void;
 onImportLeads: (leads: Lead[]) => void;
 activeCampaign?: BookingCampaign | null;
 existingLeads?: Lead[];
 bandGenre?: string;
 bandName?: string;
}

const QUICK_CITIES = ['Madrid','Barcelona','Sevilla','Valencia','Málaga','Bilbao','Granada','Zaragoza','Huelva','Alicante','Santiago','Vigo','Salamanca','Murcia'
];

const CATEGORIES: { id: LeadType; label: string; icon: string; desc: string; placeholder: string; searchPrefix: string }[] = [
 { 
 id:'sala', 
 label:'Sala / Teatro', 
 icon:'🏛️', 
 desc:'Salas de conciertos, directos y teatros con programación regular',
 placeholder:'Ej. salas rock, cafés concierto, teatros...',
 searchPrefix:'Salas de conciertos y recintos con música en directo'
 },
 { 
 id:'ayuntamiento', 
 label:'Ayuntamiento / Fiestas', 
 icon:'🏛️', 
 desc:'Concejalías de festejos, fiestas patronales y cultura municipal',
 placeholder:'Ej. festejos, fiestas patronales, concejalía de cultura...',
 searchPrefix:'Ayuntamientos, concejalías de festejos y fiestas patronales'
 },
 { 
 id:'festival', 
 label:'Festival / Feria', 
 icon:'🎪', 
 desc:'Festivales de música, ferias de cerveza o eventos con conciertos en vivo',
 placeholder:'Ej. festivales indie, ferias de cerveza, fiestas gastronómicas...',
 searchPrefix:'Festivales de música y ferias con conciertos en directo'
 },
 { 
 id:'discoteca', 
 label:'Discoteca / Club', 
 icon:'🪩', 
 desc:'Clubs nocturnos y salas de baile con sesiones o directo',
 placeholder:'Ej. clubs música electrónica, salas de baile, DJs...',
 searchPrefix:'Clubs nocturnos y discotecas con música en directo o DJs'
 },
 { 
 id:'grupo', 
 label:'Grupo / Banda', 
 icon:'🎸', 
 desc:'Bandas y grupos de música afines para bolos conjuntos, giras o intercambio',
 placeholder:'Ej. bandas de rock, grupos indie, bandas locales en activo...',
 searchPrefix:'Grupos y bandas de música en activo'
 },
 { 
 id:'agencia', 
 label:'Agencia / Booking', 
 icon:'💼', 
 desc:'Agencias de contratación, managers y promotores musicales',
 placeholder:'Ej. agencias de contratación artística, management...',
 searchPrefix:'Agencias de booking musical y management de bandas'
 },
 { 
 id:'sello', 
 label:'Sello Discográfico', 
 icon:'💿', 
 desc:'Discográficas y distribuidoras independientes',
 placeholder:'Ej. sellos independientes, discográficas rock/pop/urban...',
 searchPrefix:'Sellos discográficos y editoriales de música independiente'
 },
 { 
 id:'medio', 
 label:'Medio / Radio', 
 icon:'📻', 
 desc:'Radios, podcasts, fanzines y prensa especializada',
 placeholder:'Ej. emisoras de radio, programas musicales, fanzines...',
 searchPrefix:'Medios de comunicación musical, programas de radio y prensa'
 }
];

export function GooglePlacesExplorerModal({
 isOpen,
 isStitchLight,
 onClose,
 onImportLeads,
 activeCampaign,
 existingLeads = [],
 bandGenre ='',
 bandName =''
}: GooglePlacesExplorerModalProps) {
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedCity, setSelectedCity] = useState(activeCampaign?.targetCities[0] ||'');
 const [selectedType, setSelectedType] = useState<LeadType>('sala');
 const [searchLimit, setSearchLimit] = useState<number>(6); // Between 1 and 10
 const [aforoMin, setAforoMin] = useState<string>(activeCampaign?.minCapacity?.toString() ||'');
 const [aforoMax, setAforoMax] = useState<string>(activeCampaign?.maxCapacity?.toString() ||'');

 // Keep state synced if campaign changes while modal is open
 useEffect(() => {
 if (activeCampaign && isOpen) {
 setSelectedCity(activeCampaign.targetCities[0] ||'');
 setAforoMin(activeCampaign.minCapacity?.toString() ||'');
 setAforoMax(activeCampaign.maxCapacity?.toString() ||'');
 }
 }, [activeCampaign, isOpen]);

 const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

 const [isSearching, setIsSearching] = useState(false);
 const [isMassCampaignSearching, setIsMassCampaignSearching] = useState(false);
 const [massFilterTipos, setMassFilterTipos] = useState<string[]>(['sala','local','discoteca','teatro']);
 const [places, setPlaces] = useState<PlaceResult[]>([]);
 const [searchSource, setSearchSource] = useState('');
 const [searchError, setSearchError] = useState('');

 const [isExtractingBatch, setIsExtractingBatch] = useState(false);
 const [extractStatus, setExtractStatus] = useState('');
 const [isImporting, setIsImporting] = useState(false);
 const [importSuccessMsg, setImportSuccessMsg] = useState('');

 // Discarded places state
 const [discardedList, setDiscardedList] = useState<DiscardedPlace[]>(() => getStoredDiscarded());
 const [showDiscardedModal, setShowDiscardedModal] = useState(false);
 const [discardToast, setDiscardToast] = useState('');

 if (!isOpen) return null;

 const handleSearch = async (overrideQuery?: string, overrideCity?: string) => {
 const cityToUse = overrideCity !== undefined ? overrideCity : selectedCity;
 const catObj = CATEGORIES.find(c => c.id === selectedType);
 let q = overrideQuery || searchQuery;
 
 if (!q.trim() && cityToUse.trim()) {
 q = `${catObj?.searchPrefix || catObj?.label || selectedType} en ${cityToUse.trim()}, España`;
 } else if (cityToUse.trim() && !q.toLowerCase().includes(cityToUse.toLowerCase().trim())) {
 q = `${q.trim()} en ${cityToUse.trim()}, España`;
 }
 
 if (!q.trim() && !cityToUse.trim()) {
 setSearchError('Por favor introduce una ciudad o término de búsqueda.');
 return;
 }

 setIsSearching(true);
 setSearchError('');
 setImportSuccessMsg('');
 setExtractStatus('');
 setDiscardToast('');

 try {
 const res = await apiFetch('/api/leads/places-search', {
 method:'POST',
 body: JSON.stringify({
 query: q,
 ciudad: cityToUse,
 tipo: selectedType,
 limit: searchLimit,
 aforoMin: aforoMin ? Number(aforoMin) : undefined,
 aforoMax: aforoMax ? Number(aforoMax) : undefined
 })
 });

 if (res.success && Array.isArray(res.results)) {
 const currentDiscarded = getStoredDiscarded();
 const isDiscarded = (p: any) => {
 const normName = (p.nombre_sala ||'').toLowerCase().trim();
 return currentDiscarded.some(d =>
 (p.place_id && d.place_id && d.place_id === p.place_id) ||
 (normName && d.nombre_sala.toLowerCase().trim() === normName)
 );
 };

 const mapped: PlaceResult[] = res.results
 .filter((p: any) => !isDiscarded(p))
 .map((p: any) => {
 const normName = (p.nombre_sala ||'').toLowerCase().trim();
 const existingMatch = existingLeads.find(l => {
 if (!l.nombre_sala) return false;
 const lNorm = l.nombre_sala.toLowerCase().trim();
 const sameName = lNorm === normName;
 const sameEmail = p.email_contacto && l.email_contacto && l.email_contacto.toLowerCase().trim() === p.email_contacto.toLowerCase().trim();
 return sameName || sameEmail;
 });
 const cap = p.aforo ? Number(p.aforo) : null;
 const minCap = aforoMin ? Number(aforoMin) : (activeCampaign?.minCapacity || null);
 const maxCap = aforoMax ? Number(aforoMax) : (activeCampaign?.maxCapacity || null);
 let capacityMatch = true;
 if (cap) {
 if (minCap && cap < minCap) capacityMatch = false;
 if (maxCap && cap > maxCap) capacityMatch = false;
 }
 return {
 ...p,
 tipo: p.tipo || selectedType,
 selected: !existingMatch,
 alreadyInCrm: !!existingMatch,
 crmStatus: existingMatch ? existingMatch.estado : null,
 crmId: existingMatch ? existingMatch.id : null,
 crmNombre: existingMatch ? existingMatch.nombre_sala : null,
 capacityMatch
 };
 });
 setPlaces(mapped);
 setSearchSource(res.source || (res.isPlacesApi ?'Google Places API Direct' :'Buscador Agéntico Gemini con Grounding'));
 } else {
 setSearchError(res.error ||'No se encontraron resultados verificados para la búsqueda.');
 }
 } catch (err: any) {
 console.error('Error en Buscador de Salas:', err);
 setSearchError(err.message ||'Error de conexión al buscar nuevos contactos.');
 } finally {
 setIsSearching(false);
 }
 };

 // Búsqueda Masiva de Recintos, Locales y Discotecas según Campaña, Aforo, Localización y Estilo
 const handleMassCampaignSearch = async () => {
 setIsMassCampaignSearching(true);
 setSearchError('');
 setImportSuccessMsg('');
 setExtractStatus('');
 setDiscardToast('');

 try {
 const citiesToSearch = activeCampaign?.targetCities && activeCampaign.targetCities.length > 0
 ? activeCampaign.targetCities
 : (selectedCity.trim() ? [selectedCity.trim()] : ['Madrid','Barcelona','Valencia','Granada','Sevilla','Bilbao']);

 const res = await apiFetch('/api/leads/campaign-mass-search', {
 method:'POST',
 body: JSON.stringify({
 targetCities: citiesToSearch,
 minCapacity: aforoMin ? Number(aforoMin) : (activeCampaign?.minCapacity || undefined),
 maxCapacity: aforoMax ? Number(aforoMax) : (activeCampaign?.maxCapacity || undefined),
 targetDates: activeCampaign?.targetDates,
 targetDatesText: activeCampaign?.targetDatesText,
 tipos: massFilterTipos,
 campaignName: activeCampaign?.name ||'Campaña Activa',
 campaignId: activeCampaign?.id,
 limitPerCity: 12,
 bandGenre: bandGenre || undefined,
 bandName: bandName || undefined
 })
 });

 if (res.success && Array.isArray(res.results)) {
 const currentDiscarded = getStoredDiscarded();
 const isDiscarded = (p: any) => {
 const normName = (p.nombre_sala ||'').toLowerCase().trim();
 return currentDiscarded.some(d =>
 (p.place_id && d.place_id && d.place_id === p.place_id) ||
 (normName && d.nombre_sala.toLowerCase().trim() === normName)
 );
 };

 const mapped: PlaceResult[] = res.results
 .filter((p: any) => !isDiscarded(p))
 .map((p: any) => {
 const normName = (p.nombre_sala ||'').toLowerCase().trim();
 const existingMatch = existingLeads.find(l => {
 if (!l.nombre_sala) return false;
 const lNorm = l.nombre_sala.toLowerCase().trim();
 const sameName = lNorm === normName;
 const sameEmail = p.email_contacto && l.email_contacto && l.email_contacto.toLowerCase().trim() === p.email_contacto.toLowerCase().trim();
 return sameName || sameEmail;
 });
 const cap = p.aforo ? Number(p.aforo) : null;
 const minCap = aforoMin ? Number(aforoMin) : (activeCampaign?.minCapacity || null);
 const maxCap = aforoMax ? Number(aforoMax) : (activeCampaign?.maxCapacity || null);
 let capacityMatch = true;
 if (cap) {
 if (minCap && cap < minCap) capacityMatch = false;
 if (maxCap && cap > maxCap) capacityMatch = false;
 }
 return {
 ...p,
 selected: !existingMatch,
 alreadyInCrm: !!existingMatch,
 crmStatus: existingMatch ? existingMatch.estado : null,
 crmId: existingMatch ? existingMatch.id : null,
 crmNombre: existingMatch ? existingMatch.nombre_sala : null,
 capacityMatch
 };
 });

 setPlaces(mapped);
 setSearchSource(`Scout Masivo de Campaña (${citiesToSearch.length} ciudades · Género: ${res.bandGenre ||'Banda'} · Tipos: ${massFilterTipos.join(',')})`);
 } else {
 setSearchError(res.error ||'No se obtuvieron resultados para la prospección masiva.');
 }
 } catch (err: any) {
 console.error('Error en prospección masiva de campaña:', err);
 setSearchError(err.message ||'Error al ejecutar la búsqueda masiva de recintos de campaña.');
 } finally {
 setIsMassCampaignSearching(false);
 }
 };

 const handleDiscardPlace = (place: PlaceResult) => {
 const current = getStoredDiscarded();
 const newItem: DiscardedPlace = {
 place_id: place.place_id,
 nombre_sala: place.nombre_sala,
 ciudad: place.ciudad,
 tipo: String(place.tipo ||''),
 discarded_at: new Date().toISOString()
 };
 const updated = [
 newItem,
 ...current.filter(d => 
 (d.place_id && place.place_id ? d.place_id !== place.place_id : true) &&
 d.nombre_sala.toLowerCase().trim() !== place.nombre_sala.toLowerCase().trim()
 )
 ];
 saveStoredDiscarded(updated);
 setDiscardedList(updated);
 setPlaces(prev => prev.filter(p => p.place_id !== place.place_id));
 setDiscardToast(`"${place.nombre_sala}" descartada. No volverá a aparecer en las sugerencias.`);
 setTimeout(() => setDiscardToast(''), 4000);
 };

 const handleRestorePlace = (placeName: string) => {
 const current = getStoredDiscarded();
 const updated = current.filter(d => d.nombre_sala.toLowerCase().trim() !== placeName.toLowerCase().trim());
 saveStoredDiscarded(updated);
 setDiscardedList(updated);
 };

 const handleClearAllDiscarded = () => {
 if (window.confirm('¿Deseas restablecer todas las sugerencias no deseadas? Volverán a aparecer en futuras búsquedas.')) {
 saveStoredDiscarded([]);
 setDiscardedList([]);
 setShowDiscardedModal(false);
 }
 };

 const handleQuickCityClick = (city: string) => {
 setSelectedCity(city);
 const catObj = CATEGORIES.find(c => c.id === selectedType);
 const q = `${catObj?.searchPrefix || catObj?.label || selectedType} en ${city}, España`;
 setSearchQuery(q);
 handleSearch(q, city);
 };

 const handleCategoryChange = (newCat: LeadType) => {
 setSelectedType(newCat);
 if (selectedCity.trim()) {
 const catObj = CATEGORIES.find(c => c.id === newCat);
 const q = `${catObj?.searchPrefix || catObj?.label || newCat} en ${selectedCity.trim()}, España`;
 setSearchQuery(q);
 }
 };

 const toggleSelectPlace = (placeId: string) => {
 setPlaces(prev =>
 prev.map(p => (p.place_id === placeId ? { ...p, selected: !p.selected } : p))
 );
 };

 const toggleSelectAll = () => {
 const allSelected = places.every(p => p.selected);
 setPlaces(prev => prev.map(p => ({ ...p, selected: !allSelected })));
 };

 const handlePlaceCategoryChange = (placeId: string, newType: LeadType) => {
 const catObj = CATEGORIES.find(c => c.id === newType);
 setPlaces(prev =>
 prev.map(p =>
 p.place_id === placeId
 ? { ...p, tipo: newType, icono: catObj?.icon || p.icono }
 : p
 )
 );
 };

 // Single venue email extraction (Completador / Enriquecedor de Contactos)
 const handleExtractSingleEmail = async (placeId: string) => {
 const target = places.find(p => p.place_id === placeId);
 if (!target) return;

 setPlaces(prev =>
 prev.map(p => (p.place_id === placeId ? { ...p, extractingEmail: true } : p))
 );

 try {
 const res = await apiFetch('/api/leads/extract-emails', {
 method:'POST',
 body: JSON.stringify({
 places: [
 {
 place_id: target.place_id,
 nombre_sala: target.nombre_sala,
 ciudad: target.ciudad,
 website: target.website
 }
 ]
 })
 });

 if (res.success && Array.isArray(res.extracted) && res.extracted.length > 0) {
 const item = res.extracted[0];
 setPlaces(prev =>
 prev.map(p =>
 p.place_id === placeId
 ? {
 ...p,
 email_contacto: item.email_contacto || p.email_contacto ||'',
 instagram: item.instagram || p.instagram ||'',
 contacto_nombre: item.contacto_nombre || p.contacto_nombre ||'',
 extractingEmail: false
 }
 : p
 )
 );
 }
 } catch (err) {
 console.error('Error completando datos de contacto:', err);
 setPlaces(prev =>
 prev.map(p => (p.place_id === placeId ? { ...p, extractingEmail: false } : p))
 );
 }
 };

 // Batch email extraction for selected places lacking email (Agente Enriquecedor de Contactos)
 const handleExtractBatchEmails = async () => {
 const selectedPlaces = places.filter(p => p.selected);
 if (selectedPlaces.length === 0) return;

 setIsExtractingBatch(true);
 setExtractStatus(`Iniciando Agente Enriquecedor para ${selectedPlaces.length} contactos...`);

 const CHUNK_SIZE = 3;
 let totalExtractedCount = 0;

 try {
 for (let i = 0; i < selectedPlaces.length; i += CHUNK_SIZE) {
 const chunk = selectedPlaces.slice(i, i + CHUNK_SIZE);
 const currentProgress = Math.min(i + CHUNK_SIZE, selectedPlaces.length);
 setExtractStatus(`⚡ Investigando webs oficiales (${currentProgress}/${selectedPlaces.length}): ${chunk.map(c => c.nombre_sala).join(',')}...`);

 try {
 const res = await apiFetch('/api/leads/extract-emails', {
 method:'POST',
 body: JSON.stringify({
 places: chunk.map(p => ({
 place_id: p.place_id,
 nombre_sala: p.nombre_sala,
 ciudad: p.ciudad,
 website: p.website
 }))
 })
 });

 if (res.success && Array.isArray(res.extracted)) {
 const emailMap = new Map<string, any>();
 res.extracted.forEach((item: any) => {
 if (item.id) emailMap.set(item.id, item);
 if (item.nombre_sala) emailMap.set(item.nombre_sala.toLowerCase().trim(), item);
 });

 let newFoundInChunk = 0;
 setPlaces(prev =>
 prev.map(p => {
 const match = emailMap.get(p.place_id) || emailMap.get(p.nombre_sala.toLowerCase().trim());
 if (match && match.email_contacto && match.email_contacto.trim() !=='') {
 newFoundInChunk++;
 return {
 ...p,
 email_contacto: match.email_contacto,
 instagram: match.instagram || p.instagram,
 contacto_nombre: match.contacto_nombre || p.contacto_nombre
 };
 }
 return p;
 })
 );
 totalExtractedCount += (res.extractedCount || newFoundInChunk);
 }
 } catch (chunkErr: any) {
 console.warn(`[Batch Enriquecedor] Advertencia en sub-lote ${i / CHUNK_SIZE + 1}:`, chunkErr);
 }
 }

 setExtractStatus(`✨ Proceso completado: Extraídos ${totalExtractedCount} correos oficiales verificados.`);
 setTimeout(() => {
 setExtractStatus('');
 }, 7000);
 } catch (err: any) {
 console.error('Error completando lote de contactos:', err);
 setExtractStatus(`⚠️ Enriquecimiento completado parcialmente: ${err.message ||'Verifica la conexión'}`);
 } finally {
 setIsExtractingBatch(false);
 }
 };

 // Import selected places directly to CRM & Supabase Leads table
 const handleImportToCRM = async () => {
 const selectedPlaces = places.filter(p => p.selected);
 if (selectedPlaces.length === 0) return;

 setIsImporting(true);
 setImportSuccessMsg('');

 try {
 const res = await apiFetch('/api/leads/import-places', {
 method:'POST',
 body: JSON.stringify({
 leads: selectedPlaces
 })
 });

 if (res.success) {
 setImportSuccessMsg(`🎉 ¡${res.importedCount} contactos clasificados e importados con éxito a tu CRM!`);
 if (Array.isArray(res.leads)) {
 onImportLeads(res.leads);
 }
 setTimeout(() => {
 onClose();
 }, 1600);
 }
 } catch (err: any) {
 console.error('Error al importar recintos:', err);
 setSearchError(`Error al guardar en el CRM: ${err.message ||'Fallo del servidor'}`);
 } finally {
 setIsImporting(false);
 }
 };

 const selectedCount = places.filter(p => p.selected).length;
 const emailsFoundCount = places.filter(p => p.email_contacto && p.email_contacto.trim() !=='').length;

 return (
 <ModalPortal isOpen={isOpen} onClose={onClose}>
 <div className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md overflow-y-auto overscroll-contain pt-2 pb-24 sm:py-6 animate-fadeIn">
 <div
 className={`w-full max-w-4xl max-h-[92dvh] sm:max-h-[90vh] my-auto flex flex-col rounded-[var(--r-l)] shadow-2xl overflow-hidden ${
 isStitchLight
 ?'bg-white text-[var(--ink)]'
 :'bg-[var(--surface)] text-[var(--ink)] border-zinc-800'
 }`}
 >
 {/* Header */}
 <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-900/60">
 <div className="flex items-center gap-3">
 <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/15 border-[var(--acc)]/40 text-[var(--acc)]">
 <Search className="w-5 h-5" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h2 className="text-base font-bold font-display uppercase tracking-wider text-[var(--acc)]">
 Buscador de Salas & Nuevos Leads (Scout Descubridor)
 </h2>
 <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--acc)]/10 text-[var(--acc)]/70 font-mono font-bold">
 IA + Google Places
 </span>
 </div>
 <p className="text-[11px] text-zinc-400 font-sans">
 Busca y categoriza nuevas salas, ayuntamientos, festivales, grupos y agencias en cualquier ciudad y enriquece sus correos sin alucinar.
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2">
 {discardedList.length > 0 && (
 <button
 type="button"
 onClick={() => setShowDiscardedModal(true)}
 className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--r-s)] text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-all cursor-pointer"
 title="Ver y gestionar sugerencias marcadas como no deseadas"
 >
 <Ban className="w-3.5 h-3.5 text-rose-400" />
 <span>{discardedList.length} no deseadas</span>
 </button>
 )}

 <button
 onClick={onClose}
 className="p-1.5 rounded-[var(--r-s)] text-zinc-400 hover:text-[var(--ink)] hover:bg-zinc-800 transition-colors cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>
 </div>

 {/* Content Container */}
 <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
 
 {/* Búsqueda Masiva de Campaña Activa: Recintos, Locales y Discotecas con Aforo y Estilo */}
 <div className="p-4 rounded-[var(--r-m)] bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 space-y-3 shadow-md">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
 <div className="flex items-start sm:items-center gap-2.5">
 <div className="p-2 rounded-[var(--r-s)] bg-[var(--acc)]/20 text-[var(--acc)]/70 shrink-0">
 <Target className="w-5 h-5" />
 </div>
 <div>
 <div className="flex items-center gap-2 flex-wrap">
 <span className="text-xs font-bold font-display uppercase tracking-wider text-[var(--acc)]/70">
 Prospección Masiva de Campaña
 </span>
 {activeCampaign && (
 <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--acc)]/60/20 text-amber-200 font-mono">
 {activeCampaign.name}
 </span>
 )}
 </div>
 <p className="text-[11px] text-zinc-300 mt-0.5">
 Descubre simultáneamente todos los recintos, salas, locales y discotecas del aforo ({aforoMin || (activeCampaign?.minCapacity ||'0')} - {aforoMax || (activeCampaign?.maxCapacity ||'∞')} pax), adaptados a las ciudades objetivo y estilo de la banda.
 </p>
 </div>
 </div>

 <button
 type="button"
 onClick={handleMassCampaignSearch}
 disabled={isMassCampaignSearching || isSearching}
 className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-black text-xs rounded-[var(--r-m)] flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-amber-500/20 cursor-pointer disabled:opacity-50 shrink-0"
 >
 {isMassCampaignSearching ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
 <span>Rastreando Ciudades...</span>
 </>
 ) : (
 <>
 <Sparkles className="w-4 h-4 text-zinc-950" />
 <span>Lanzar Búsqueda Masiva</span>
 </>
 )}
 </button>
 </div>

 {/* Selector de Tipos de Espacio para la prospección masiva */}
 <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className="text-[10px] uppercase font-mono text-zinc-400 font-bold mr-1">Espacios a rastrear:</span>
 {[
 { id:'sala', label:'Salas & Recintos', icon:'🏛️' },
 { id:'local', label:'Locales & Bares', icon:'☕' },
 { id:'discoteca', label:'Discotecas & Clubs', icon:'🪩' },
 { id:'teatro', label:'Teatros & Auditorios', icon:'🎭' },
 { id:'grupo', label:'Bandas & Co-booking', icon:'🎸' }
 ].map(item => {
 const isChecked = massFilterTipos.includes(item.id);
 return (
 <button
 key={item.id}
 type="button"
 onClick={() => {
 if (isChecked) {
 if (massFilterTipos.length > 1) {
 setMassFilterTipos(massFilterTipos.filter(t => t !== item.id));
 }
 } else {
 setMassFilterTipos([...massFilterTipos, item.id]);
 }
 }}
 className={`px-2.5 py-1 rounded-[var(--r-s)] text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
 isChecked
 ?'bg-[var(--acc)]/60/20 text-[var(--acc)]/70 /50 shadow-sm'
 :'bg-zinc-900/80 text-zinc-500 border-zinc-800 hover:text-zinc-300'
 }`}
 >
 <span>{item.icon}</span>
 <span>{item.label}</span>
 </button>
 );
 })}
 </div>

 {activeCampaign?.targetCities && activeCampaign.targetCities.length > 0 && (
 <span className="text-[10px] text-zinc-400 font-mono">
 Ciudades ({activeCampaign.targetCities.length}): <strong className="text-zinc-200">{activeCampaign.targetCities.join(',')}</strong>
 </span>
 )}
 </div>
 </div>

 {/* Discard Toast */}
 {discardToast && (
 <div className="p-2.5 rounded-[var(--r-m)] bg-rose-500/15 text-rose-300 text-xs flex items-center justify-between animate-in fade-in duration-200">
 <div className="flex items-center gap-2">
 <Ban className="w-4 h-4 text-rose-400 shrink-0" />
 <span>{discardToast}</span>
 </div>
 <button
 onClick={() => setDiscardToast('')}
 className="text-rose-400 hover:text-[var(--ink)] p-1 cursor-pointer"
 >
 <X className="w-3 h-3" />
 </button>
 </div>
 )}

 {/* Main Filter and Search Bar */}
 <div className="bg-zinc-900/80 p-4 rounded-[var(--r-m)] space-y-3.5 shadow-sm">
 
 {/* Category Selector Pills (8 Categorías) */}
 <div className="space-y-1.5">
 <div className="flex items-center justify-between">
 <label className="block text-[10px] uppercase font-mono text-zinc-400 font-bold">
 Categoría a Descubrir:
 </label>
 {discardedList.length > 0 && (
 <button
 type="button"
 onClick={() => setShowDiscardedModal(true)}
 className="sm:hidden text-[10px] text-rose-400 underline font-mono flex items-center gap-1 cursor-pointer"
 >
 <Ban className="w-3 h-3" />
 {discardedList.length} no deseadas
 </button>
 )}
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-1.5">
 {CATEGORIES.map(cat => {
 const isSelected = selectedType === cat.id;
 return (
 <button
 key={cat.id}
 type="button"
 onClick={() => handleCategoryChange(cat.id)}
 className={`px-2 py-1.5 rounded-[var(--r-s)] text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
 isSelected
 ?'bg-[var(--acc)] text-[var(--acc-ink)] border-[var(--acc)] shadow-sm'
 :'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
 }`}
 title={cat.desc}
 >
 <span>{cat.icon}</span>
 <span className="truncate">{cat.label.split('')[0]}</span>
 </button>
 );
 })}
 </div>
 </div>

 {/* Inputs Row */}
 <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 pt-1">
 
 {/* City Input */}
 <div className="relative md:col-span-4">
 <MapPin className="w-4 h-4 absolute left-3 top-3 text-[var(--acc)]" />
 <input
 type="text"
 value={selectedCity}
 onChange={e => setSelectedCity(e.target.value)}
 onKeyDown={e => e.key ==='Enter' && handleSearch()}
 placeholder="Ciudad (ej. Granada, Madrid...)"
 className="w-full pl-9 pr-7 py-2 text-xs rounded-[var(--r-m)] bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[var(--acc)]"
 />
 {selectedCity && (
 <button
 onClick={() => setSelectedCity('')}
 className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-300"
 title="Limpiar ciudad"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 {/* Free Text / Venue Query */}
 <div className="relative md:col-span-5">
 <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
 <input
 type="text"
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 onKeyDown={e => e.key ==='Enter' && handleSearch()}
 placeholder={CATEGORIES.find(c => c.id === selectedType)?.placeholder ||"Búsqueda opcional..."}
 className="w-full pl-9 pr-3 py-2 text-xs rounded-[var(--r-m)] bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[var(--acc)]"
 />
 </div>

 {/* Number of Venues limit (1 a 10) */}
 <div className="md:col-span-3 flex items-center gap-1.5 bg-zinc-950 px-3 py-1 rounded-[var(--r-m)] border-zinc-800">
 <span className="text-[10px] font-mono text-zinc-400 whitespace-nowrap">Cantidad:</span>
 <input
 type="range"
 min="1"
 max="10"
 value={searchLimit}
 onChange={e => setSearchLimit(Number(e.target.value))}
 className="w-full accent-[var(--acc)] cursor-pointer"
 />
 <span className="text-xs font-bold font-mono text-[var(--acc)] w-4 text-center">
 {searchLimit}
 </span>
 </div>
 </div>

 {/* Advanced Filters Toggle & Drawer (Aforo, etc) */}
 <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/60">
 <button
 type="button"
 onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
 className="text-[11px] text-zinc-400 hover:text-[var(--acc)]/70 flex items-center gap-1 cursor-pointer font-mono"
 >
 <Sliders className="w-3.5 h-3.5 text-[var(--acc)]" />
 <span>{showAdvancedFilters ?'Ocultar Filtros de Aforo' :'Filtros Avanzados de Aforo'}</span>
 </button>

 <button
 type="button"
 onClick={() => handleSearch()}
 disabled={isSearching}
 className="px-5 py-2 bg-[var(--acc)] hover:bg-[#d8b03e] text-[var(--acc-ink)] font-bold text-xs rounded-[var(--r-m)] flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50 ml-auto"
 >
 {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
 <span>{isSearching ?'Buscando...' : `Buscar ${searchLimit} Resultados`}</span>
 </button>
 </div>

 {showAdvancedFilters && (
 <div className="p-3 bg-zinc-950 rounded-[var(--r-m)] grid grid-cols-2 sm:grid-cols-2 gap-3 animate-fadeIn text-xs">
 <div>
 <label className="block text-[10px] font-mono text-zinc-400 mb-1">
 Aforo Mínimo (personas)
 </label>
 <input
 type="number"
 placeholder="Ej. 150"
 value={aforoMin}
 onChange={e => setAforoMin(e.target.value)}
 className="w-full p-2 bg-zinc-900 border-zinc-700 rounded-[var(--r-s)] text-zinc-200 text-xs focus:outline-none focus:"
 />
 </div>
 <div>
 <label className="block text-[10px] font-mono text-zinc-400 mb-1">
 Aforo Máximo (personas)
 </label>
 <input
 type="number"
 placeholder="Ej. 800"
 value={aforoMax}
 onChange={e => setAforoMax(e.target.value)}
 className="w-full p-2 bg-zinc-900 border-zinc-700 rounded-[var(--r-s)] text-zinc-200 text-xs focus:outline-none focus:"
 />
 </div>
 </div>
 )}

 {/* Quick City Chips */}
 <div className="flex flex-wrap items-center gap-1.5 pt-1">
 <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mr-1">Ciudades rápidas:</span>
 {QUICK_CITIES.map(city => (
 <button
 key={city}
 onClick={() => handleQuickCityClick(city)}
 className={`px-2.5 py-0.5 text-[10px] rounded-[var(--r-s)] transition-all cursor-pointer font-medium ${
 selectedCity === city
 ?'bg-[var(--acc)] text-[var(--acc-ink)] font-bold'
 :'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
 }`}
 >
 {city}
 </button>
 ))}
 </div>
 </div>

 {/* Status / Errors / Search Source */}
 {searchSource && (
 <div className="flex items-center justify-between text-[11px] px-2 text-zinc-400">
 <span>
 Fuente: <strong className="text-[var(--acc)]">{searchSource}</strong>
 </span>
 <span>
 Encontrados: <strong className="text-[var(--ink)]">{places.length}</strong> | Con email: <strong className="text-emerald-400">{emailsFoundCount}</strong>
 </span>
 </div>
 )}

 {searchError && (
 <div className="p-3 bg-rose-500/10 text-rose-300 text-xs rounded-[var(--r-m)] flex items-center gap-2">
 <AlertCircle className="w-4 h-4 shrink-0" />
 <span>{searchError}</span>
 </div>
 )}

 {extractStatus && (
 <div className="p-3 bg-indigo-500/10 text-indigo-300 text-xs rounded-[var(--r-m)] flex items-center gap-2 animate-fadeIn">
 <Sparkles className="w-4 h-4 shrink-0 text-indigo-400 animate-pulse" />
 <span>{extractStatus}</span>
 </div>
 )}

 {importSuccessMsg && (
 <div className="p-3 bg-emerald-500/10 text-emerald-300 text-xs rounded-[var(--r-m)] flex items-center gap-2 animate-fadeIn">
 <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
 <span>{importSuccessMsg}</span>
 </div>
 )}

 {/* Places Results List */}
 {places.length > 0 ? (
 <div className="space-y-3">
 {/* Batch Actions Bar */}
 <div className="p-3 bg-zinc-900/90 rounded-[var(--r-m)] border-zinc-800 flex flex-wrap items-center justify-between gap-3">
 <div className="flex items-center gap-3">
 <button
 onClick={toggleSelectAll}
 className="text-xs text-zinc-300 hover:text-[var(--ink)] flex items-center gap-1.5 cursor-pointer font-medium"
 >
 <input
 type="checkbox"
 checked={places.length > 0 && places.every(p => p.selected)}
 onChange={toggleSelectAll}
 className="rounded accent-[var(--acc)] cursor-pointer"
 />
 <span>Seleccionar todos ({selectedCount}/{places.length})</span>
 </button>
 </div>

 <div className="flex items-center gap-2">
 <button
 onClick={handleExtractBatchEmails}
 disabled={isExtractingBatch || selectedCount === 0}
 className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-[var(--ink)] font-bold text-xs rounded-[var(--r-s)] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-md"
 title="Agente Enriquecedor: Investiga las páginas oficiales y fuentes públicas sin inventar emails"
 >
 {isExtractingBatch ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]/70" />}
 <span>⚡ Agente Enriquecedor ({selectedCount})</span>
 </button>

 <button
 onClick={handleImportToCRM}
 disabled={isImporting || selectedCount === 0}
 className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-[var(--ink)] font-bold text-xs rounded-[var(--r-s)] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-md"
 >
 {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
 <span>📥 Incluir en mis Leads ({selectedCount})</span>
 </button>
 </div>
 </div>

 {/* Cards Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 {places.map(place => (
 <div
 key={place.place_id}
 className={`p-3.5 rounded-[var(--r-m)] transition-all flex flex-col justify-between space-y-2.5 ${
 place.selected
 ?'bg-zinc-900 border-[var(--acc)]/50 shadow-lg'
 :'bg-zinc-950/60 border-zinc-800/80 opacity-70'
 }`}
 >
 <div className="space-y-2">
 <div className="flex items-start justify-between gap-2">
 <div className="flex items-start gap-2.5 min-w-0">
 <input
 type="checkbox"
 checked={place.selected || false}
 onChange={() => toggleSelectPlace(place.place_id)}
 className="mt-1 rounded accent-[var(--acc)] cursor-pointer"
 />
 {place.imagen_url ? (
 <img
 src={place.imagen_url}
 alt={place.nombre_sala}
 className="w-10 h-10 rounded-[var(--r-s)] object-cover border-zinc-700 shrink-0"
 />
 ) : (
 <div className="w-10 h-10 rounded-[var(--r-s)] bg-zinc-800 border-zinc-700 flex items-center justify-center text-lg shrink-0">
 {place.icono ||'🏛️'}
 </div>
 )}
 <div className="min-w-0">
 <div className="flex items-center gap-1.5 flex-wrap">
 <h4 className="text-xs font-bold text-zinc-100 truncate">
 {place.nombre_sala}
 </h4>
 {place.alreadyInCrm && (
 <span className="text-[9px] px-1.5 py-0.2 bg-[var(--acc)]/20 text-[var(--acc)]/70 rounded font-bold uppercase tracking-wider shrink-0" title="Este contacto ya existe en tu CRM de Leads">
 En CRM ({place.crmStatus ||'Registrado'})
 </span>
 )}
 {place.capacityMatch === false && (
 <span className="text-[9px] px-1.5 py-0.2 bg-rose-500/20 text-rose-300 rounded font-medium shrink-0" title="El aforo estimado difiere de los filtros de la campaña">
 ⚠️ Aforo fuera de rango
 </span>
 )}
 </div>
 <p className="text-[10px] text-zinc-400 flex items-center gap-1">
 <MapPin className="w-3 h-3 text-[var(--acc)] shrink-0" />
 <span className="truncate">{place.ciudad} ({place.region})</span>
 </p>
 </div>
 </div>

 <div className="flex items-center gap-1.5 shrink-0">
 {place.rating && (
 <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[var(--acc)]/10 text-[var(--acc)] rounded-md text-[10px] font-bold">
 <Star className="w-3 h-3 fill-amber-400" />
 <span>{place.rating}</span>
 {place.user_ratings_total && (
 <span className="text-[8px] text-zinc-400">({place.user_ratings_total})</span>
 )}
 </div>
 )}

 <button
 type="button"
 onClick={() => handleDiscardPlace(place)}
 className="p-1 rounded-[var(--r-s)] text-zinc-500 hover:text-rose-400 hover:bg-rose-500/15 transition-all cursor-pointer"
 title="Marcar como no deseada (descartar para futuras búsquedas)"
 >
 <Ban className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>

 {/* Category & Tags Row */}
 <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5 text-[10px]">
 <div className="flex items-center gap-1.5">
 <span className="text-zinc-400 font-mono">Categoría:</span>
 <select
 value={String(place.tipo ||'sala').toLowerCase()}
 onChange={(e) => handlePlaceCategoryChange(place.place_id, e.target.value as LeadType)}
 className="bg-zinc-950 border-zinc-700 text-[var(--acc)]/70 font-bold rounded px-2 py-0.5 text-[10px] focus:outline-none focus: cursor-pointer"
 >
 {CATEGORIES.map(c => (
 <option key={c.id} value={c.id}>
 {c.icon} {c.label}
 </option>
 ))}
 </select>
 </div>

 <div className="flex items-center gap-1.5">
 {place.genero && (
 <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-[var(--acc)]/10 text-[var(--acc)]/70 font-medium">
 <Music2 className="w-2.5 h-2.5 shrink-0" />
 <span className="truncate max-w-[130px]">{place.genero}</span>
 </span>
 )}
 {place.aforo ? (
 <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono shrink-0">
 <Users className="w-2.5 h-2.5 text-zinc-400" />
 <span>~{place.aforo}</span>
 </span>
 ) : null}
 </div>
 </div>

 {/* Informative Description of the Proposal */}
 {place.descripcion && (
 <div className="p-2 rounded-[var(--r-s)] bg-zinc-950/80 text-[11px] text-zinc-300 leading-relaxed font-sans">
 <div className="flex items-start gap-1.5">
 <Sparkles className="w-3.5 h-3.5 text-[var(--acc)] shrink-0 mt-0.5" />
 <p className="line-clamp-2">{place.descripcion}</p>
 </div>
 </div>
 )}

 {/* Address & Phone */}
 <div className="text-[10px] text-zinc-400 space-y-1 bg-zinc-950 p-2 rounded-[var(--r-s)] font-mono">
 {place.direccion && (
 <p className="truncate text-zinc-300">{place.direccion}</p>
 )}
 <div className="flex flex-wrap items-center gap-3 text-zinc-400">
 {place.telefono && (
 <a href={`tel:${place.telefono}`} className="flex items-center gap-1 hover:text-[var(--ink)]">
 <Phone className="w-3 h-3 text-emerald-400" />
 <span>{place.telefono}</span>
 </a>
 )}
 {place.website && (
 <a
 href={place.website}
 target="_blank"
 rel="noreferrer"
 className="flex items-center gap-1 text-sky-400 hover:underline truncate max-w-[200px]"
 >
 <Globe className="w-3 h-3" />
 <span className="truncate">{place.website.replace(/^https?:\/\//,'')}</span>
 </a>
 )}
 </div>
 </div>

 {/* Email Status & Extractor */}
 <div className="pt-1">
 {place.email_contacto ? (
 <div className="p-2 rounded-[var(--r-s)] bg-emerald-500/10 text-emerald-300 text-[11px] flex items-center justify-between font-mono">
 <div className="flex items-center gap-1.5 truncate">
 <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
 <span className="font-bold truncate">{place.email_contacto}</span>
 </div>
 <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded uppercase font-bold shrink-0">
 Verificado
 </span>
 </div>
 ) : (
 <div className="p-2 rounded-[var(--r-s)] bg-zinc-950 border-zinc-800 text-[10px] flex items-center justify-between gap-2">
 <span className="text-zinc-500 italic">Sin correo extraído aún</span>
 <button
 onClick={() => handleExtractSingleEmail(place.place_id)}
 disabled={place.extractingEmail}
 className="px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-md font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 shrink-0"
 title="Agente Enriquecedor: Buscar email oficial verificado en la web de esta propuesta"
 >
 {place.extractingEmail ? (
 <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
 ) : (
 <Sparkles className="w-3 h-3 text-[var(--acc)]" />
 )}
 <span>{place.extractingEmail ?'Buscando...' :'⚡ Enriquecer'}</span>
 </button>
 </div>
 )}
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 ) : !isSearching ? (
 <div className="p-10 text-center space-y-3 bg-zinc-900/40 rounded-[var(--r-l)]">
 <Building2 className="w-12 h-12 text-zinc-600 mx-auto" />
 <h3 className="text-sm font-bold text-zinc-300">Descubre nuevas oportunidades de booking</h3>
 <p className="text-xs text-zinc-500 max-w-md mx-auto">
 Selecciona la categoría deseada (Salas, Ayuntamientos, Festivales, Grupos, Agencias, Sellos o Medios), la ciudad y la cantidad a buscar (1 a 10). Revisa los resultados y añádelos a tu base de datos de leads con un solo clic.
 </p>
 </div>
 ) : null}
 </div>

 {/* Discarded Suggestions Sub-Modal */}
 {showDiscardedModal && (
 <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
 <div className="w-full max-w-lg bg-zinc-900 border-zinc-800 rounded-[var(--r-l)] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
 <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
 <div className="flex items-center gap-2">
 <Ban className="w-4 h-4 text-rose-400" />
 <h3 className="text-sm font-bold text-zinc-100">Sugerencias No Deseadas ({discardedList.length})</h3>
 </div>
 <button
 onClick={() => setShowDiscardedModal(false)}
 className="text-zinc-400 hover:text-[var(--ink)] p-1 rounded-[var(--r-s)] cursor-pointer"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto p-4 space-y-2">
 {discardedList.length === 0 ? (
 <p className="text-xs text-zinc-500 text-center py-6">No hay sugerencias marcadas como no deseadas.</p>
 ) : (
 discardedList.map(item => (
 <div
 key={item.nombre_sala}
 className="p-2.5 rounded-[var(--r-m)] bg-zinc-950 flex items-center justify-between gap-3 text-xs"
 >
 <div className="min-w-0">
 <p className="font-bold text-zinc-200 truncate">{item.nombre_sala}</p>
 <p className="text-[10px] text-zinc-500 font-mono">
 {item.ciudad ? `${item.ciudad} • ` :''}Descartada el {new Date(item.discarded_at).toLocaleDateString()}
 </p>
 </div>
 <button
 type="button"
 onClick={() => handleRestorePlace(item.nombre_sala)}
 className="px-2.5 py-1 bg-[var(--acc)]/15 hover:bg-[var(--acc)]/25 text-[var(--acc)]/70 rounded-[var(--r-s)] text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-all"
 title="Volver a permitir en sugerencias futuras"
 >
 <RotateCcw className="w-3 h-3" />
 <span>Restaurar</span>
 </button>
 </div>
 ))
 )}
 </div>

 {discardedList.length > 0 && (
 <div className="p-3 border-t border-zinc-800 bg-zinc-950/60 flex justify-between items-center">
 <button
 type="button"
 onClick={handleClearAllDiscarded}
 className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
 >
 <Trash2 className="w-3.5 h-3.5" />
 <span>Restablecer todas</span>
 </button>

 <button
 type="button"
 onClick={() => setShowDiscardedModal(false)}
 className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-[var(--r-s)] text-xs font-bold cursor-pointer"
 >
 Cerrar
 </button>
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 </div>
 </ModalPortal>
 );
}
