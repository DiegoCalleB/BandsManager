import React, { useState, useEffect, useMemo } from'react';
import { Lead, LeadStatus, LeadType, ThemeColors, EPKConfig } from'../types';
import DirectionsCard from'./DirectionsCard';
import { apiFetch } from'../utils/api';
import { uploadFileToServer } from'../utils/audioStorage';
import { useSavedFilters } from'../hooks/useSavedFilters';
import { useCityChips } from'../hooks/useCityChips';
import { useInteractionLog } from'../hooks/useInteractionLog';
import { useEmailTemplates, TemplateCategory } from'../hooks/useEmailTemplates';
import { useGmailIntegration } from'../hooks/useGmailIntegration';
import { useNegotiationSimulation } from'../hooks/useNegotiationSimulation';
import {
 Target, Search, ShieldCheck, Mail, Clock, Check, X, RefreshCw, RotateCcw,
 MapPin, Users, Bot, MessageSquare, Edit3, Settings, Sparkles, Send, LogOut, Loader2, Building, Radio, Building2, Tent, Landmark, Disc3, Briefcase,
 PlusCircle, Newspaper, Tv, Headphones, Globe, FileText, Plus, SlidersHorizontal, Map as MapIcon, List, LayoutGrid,
 Share2, Repeat, Truck, Handshake, Music, Zap, Upload, Image as ImageIcon, Download, Phone, PhoneCall, MessageCircle, Bookmark, BookmarkCheck, Filter, Trash2, History, Calendar, ListFilter, CheckCircle2, Save, Star, ChevronDown, ChevronUp, Wrench, FileSpreadsheet, Copy
} from'lucide-react';
import { VenueMap } from'./VenueMap';
import { AddLeadModal } from'./booking/AddLeadModal';
import { GooglePlacesExplorerModal } from'./booking/GooglePlacesExplorerModal';
import { CRMContactEnricherModal } from'./booking/CRMContactEnricherModal';
import { ExcelImportModal } from'./booking/ExcelImportModal';
import { ExportLeadsModal } from'./booking/ExportLeadsModal';
import { LeadDuplicatesModal } from'./booking/LeadDuplicatesModal';
import { findDuplicateLeads } from'../utils/duplicateLeads';
import { TemplateConfigSection } from'./booking/TemplateConfigSection';
import { ExampleThreadsSection } from'./booking/ExampleThreadsSection';
import { NegotiationSimulationModal } from'./booking/NegotiationSimulationModal';
import { LeadsTable } from'./booking/LeadsTable';
import { VenueDetailPanel } from'./booking/VenueDetailPanel';
import { MobileBottomSheet } from'./booking/MobileBottomSheet';
import { isLeadVerificado } from'../utils/leadReliability';
import { leadMatchesCampaignCity, leadMatchesCampaignCapacity, leadMatchesCampaignDates } from'../utils/campaignMatch';
import { AgentAutonomySettingsModal } from'./dashboard/AgentAutonomySettingsModal';
import { BookingCampaign } from'../types';
import { BulkLeadsActionBar } from'./booking/BulkLeadsActionBar';
import { BulkProgressModal, BulkProgressItem } from'./booking/BulkProgressModal';
import { useModuleTutorial } from'../hooks/useModuleTutorial';
import { ModuleTutorialTrigger } from'./common/ModuleTutorialTrigger';
import { ModuleTutorialModal } from'./common/ModuleTutorialModal';
const matchesMedioType = (l: Lead, filter: string): boolean => {
 if (!filter || filter ==='todos') return true;
 const txt = `${l.genero ||''} ${l.nombre_sala ||''} ${l.tipo ||''} ${l.icono ||''} ${l.notas ||''} ${l.contexto_extra ||''}`.toLowerCase();
 if (filter ==='radio') return txt.includes('radio') || txt.includes('emisora') || txt.includes('fm') || txt.includes('am') || txt.includes('ser') || txt.includes('cope') || txt.includes('ondacero') || txt.includes('📻');
 if (filter ==='tv' || filter ==='television') return txt.includes('tv') || txt.includes('televis') || txt.includes('rtv') || txt.includes('tele') || txt.includes('canal') || txt.includes('📺');
 if (filter ==='prensa') return txt.includes('prensa') || txt.includes('revista') || txt.includes('periódico') || txt.includes('periodico') || txt.includes('diario') || txt.includes('blog') || txt.includes('magazine') || txt.includes('fanzine') || txt.includes('web') || txt.includes('noticias') || txt.includes('redacción') || txt.includes('redaccion') || txt.includes('📰');
 if (filter ==='redes') return txt.includes('redes') || txt.includes('social') || txt.includes('instagram') || txt.includes('youtube') || txt.includes('tiktok') || txt.includes('twitter') || txt.includes('influencer') || txt.includes('creador') || txt.includes('📱');
 if (filter ==='podcast' || filter ==='podcasts') return txt.includes('podcast') || txt.includes('entrevista') || txt.includes('ivoox') || txt.includes('spotify') || txt.includes('audio') || txt.includes('🎙️');
 return true;
};

const matchesGruposType = (l: Lead, filter: string): boolean => {
 if (!filter || filter ==='todos') return true;
 const norm = normalizeType(l.tipo);
 if (norm === filter) return true;
 const txt = `${l.genero ||''} ${l.nombre_sala ||''} ${l.tipo ||''} ${l.icono ||''} ${l.notas ||''} ${l.contexto_extra ||''}`.toLowerCase();
 if (filter ==='grupo') return norm ==='grupo' || txt.includes('grupo') || txt.includes('banda') || txt.includes('artista') || txt.includes('co-booking') || txt.includes('músico') || txt.includes('musico') || txt.includes('🎸');
 if (filter ==='agencia') return norm ==='agencia' || txt.includes('agencia') || txt.includes('agency') || txt.includes('booking') || txt.includes('promotora') || txt.includes('💼');
 if (filter ==='manager') return norm ==='manager' || txt.includes('manager') || txt.includes('mánager') || txt.includes('management') || txt.includes('representante') || txt.includes('👔');
 if (filter ==='productora') return norm ==='productora' || txt.includes('productora') || txt.includes('producciones') || txt.includes('production') || txt.includes('eventos') || txt.includes('🎬');
 if (filter ==='sello') return norm ==='sello' || txt.includes('sello') || txt.includes('discográfica') || txt.includes('discografica') || txt.includes('record') || txt.includes('label') || txt.includes('💿');
 return true;
};

interface BookingCRMProps {
 leads: Lead[];
 colors: ThemeColors;
 onUpdateLead: (leadId: string, updatedFields: Partial<Lead>, expectedStatus?: string) => void;
 onAddLead?: (lead: Lead) => void;
 onDeleteLead?: (id: string) => void;
 onBulkDeleteLeads?: (ids: string[]) => void;
 initialSection?:'salas' |'medios' |'grupos';
 onSectionChange?: (section:'salas' |'medios' |'grupos' |'bandas') => void;
 onNavigate?: (view: any, options?: any) => void;
 bandsCount?: number;
 initialStatusFilter?: LeadStatus |'todos';
 initialSelectedLeadId?: string;
 epkConfig?: Partial<EPKConfig>;
 onUpdateEpkConfig?: (newConfig: Partial<EPKConfig>) => void;
 currentBandId?: string;
 currentUser?: any;
 bandName?: string;
 activeCampaign?: BookingCampaign | null;
 onCampaignChange?: (campaign: BookingCampaign | null) => void;
}

import {
 normalizeStatus,
 normalizeType,
 autoDetectVenueAddress,
 VENUE_ADDRESS_DATABASE
} from'../utils/bookingUtils';
import { leadStatusDotColor, leadStatusBadgeClass, leadStatusLabel } from'../utils/leadStatusPresentation';

export { 
 normalizeStatus, 
 normalizeType, 
 autoDetectVenueAddress, 
 VENUE_ADDRESS_DATABASE 
};

export default function BookingCRM({ 
 leads, 
 colors, 
 onUpdateLead, 
 onAddLead, 
 onDeleteLead,
 onBulkDeleteLeads,
 initialSection ='salas',
 onSectionChange,
 onNavigate,
 bandsCount,
 initialStatusFilter ='todos',
 initialSelectedLeadId,
 epkConfig,
 onUpdateEpkConfig,
 currentBandId,
 currentUser,
 bandName,
 activeCampaign,
 onCampaignChange
}: BookingCRMProps) {
 const bookingTutorial = useModuleTutorial('booking');
 const effectiveBandName = bandName ||'Tu Banda';
 const [sectionTab, setSectionTab] = useState<'salas' |'medios' |'grupos'>(initialSection ||'salas');

 const handleSelectSectionTab = (tab:'salas' |'medios' |'grupos') => {
 setSectionTab(tab);
 setTypeFilter('todos');
 onSectionChange?.(tab);
 };
 const {
 searchTerm, setSearchTerm,
 statusFilter, setStatusFilter,
 typeFilter, setTypeFilter,
 selectedCityFilter, setSelectedCityFilter,
 minCapacityFilter, setMinCapacityFilter,
 onlyFavoritesFilter, setOnlyFavoritesFilter,
 onlyVerifiedFilter, setOnlyVerifiedFilter,
 savedFilters,
 isSavingFilterOpen, setIsSavingFilterOpen,
 newFilterName, setNewFilterName,
 activeSavedFilterId, setActiveSavedFilterId,
 handleApplySavedFilter,
 handleSaveCurrentFilter,
 handleDeleteSavedFilter,
 handleClearAllFilters,
 } = useSavedFilters(sectionTab, setSectionTab, initialStatusFilter);
 const [isAgentConfigOpen, setIsAgentConfigOpen] = useState(false);
 const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
 const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
 const [isTemplatesSectionOpen, setIsTemplatesSectionOpen] = useState(false);

 useEffect(() => {
 if (initialSection) {
 setSectionTab(initialSection);
 }
 }, [initialSection]);

 useEffect(() => {
 if (initialSelectedLeadId) {
 const found = leads.find(l => l.id === initialSelectedLeadId);
 if (found) {
 setSelectedLead(found);
 setTimeout(() => {
 if (interventionPanelRef.current) {
 interventionPanelRef.current.scrollIntoView({ behavior:'smooth', block:'start' });
 }
 }, 150);
 }
 }
 }, [initialSelectedLeadId, leads]);

 const [viewMode, setViewMode] = useState<'grid' |'table' |'map'>('table');

 const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
 const [bulkProgressState, setBulkProgressState] = useState<{
 isOpen: boolean;
 title: string;
 subtitle?: string;
 items: BulkProgressItem[];
 currentIndex: number;
 totalCount: number;
 isCompleted: boolean;
 }>({
 isOpen: false,
 title:'',
 items: [],
 currentIndex: 0,
 totalCount: 0,
 isCompleted: false
 });

 const interventionPanelRef = React.useRef<HTMLDivElement>(null);
 const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

 const {
 customCityChips,
 isAddingCityChip, setIsAddingCityChip,
 newCityInput, setNewCityInput,
 activeLeadsForSection,
 cityCounts,
 displayCityChips,
 handleAddCustomCity,
 handleRemoveCustomCity,
 } = useCityChips(leads, sectionTab, epkConfig, onUpdateEpkConfig, selectedCityFilter, setSelectedCityFilter);

 const {
 interactionType, setInteractionType,
 interactionNotes, setInteractionNotes,
 interactionResultado, setInteractionResultado,
 interactionAutor, setInteractionAutor,
 handleAddInteractionLog,
 handleDeleteInteractionLog,
 } = useInteractionLog(selectedLead, setSelectedLead, onUpdateLead);

 const {
 templateTab, setTemplateTab,
 testPromptResult, isTestingPrompt,
 isOptimizingTemplate, optimizationFeedbackMsg, setOptimizationFeedbackMsg,
 templateCustomInstruction, setTemplateCustomInstruction,
 templateToneRating, setTemplateToneRating,
 templateContentRating, setTemplateContentRating,
 templateStats,
 getActiveTemplateData,
 handleOptimizeTemplate,
 handleTestPrompt,
 handleSaveTemplates,
 handleResetTemplate,
 } = useEmailTemplates();

 const {
 gmailUser, gmailToken,
 isSyncingGmail, gmailStatusMsg,
 handleGmailLogin,
 handleGmailLogout,
 handleSyncGmailForLead,
 } = useGmailIntegration(selectedLead, setSelectedLead, onUpdateLead);

 const [filterByCampaign, setFilterByCampaign] = useState(Boolean(activeCampaign && (activeCampaign.isActive ?? (activeCampaign as any).is_active ?? true)));

 // Automatically activate campaign filter & reset conflicting manual search filters whenever a campaign is active
 useEffect(() => {
 if (activeCampaign && (activeCampaign.isActive ?? (activeCampaign as any).is_active ?? true)) {
 setFilterByCampaign(true);
 if (sectionTab ==='salas') {
 setSelectedCityFilter('');
 setMinCapacityFilter(0);
 setTypeFilter('todos');
 setStatusFilter('todos');
 setSearchTerm('');
 }
 }
 }, [activeCampaign?.id, activeCampaign?.isActive, (activeCampaign as any)?.is_active]);

 // Keep selectedLead synchronized with the latest leads prop data
 useEffect(() => {
 if (selectedLead) {
 const updated = leads.find(l => l.id === selectedLead.id);
 if (updated && updated !== selectedLead) {
 setSelectedLead(updated);
 }
 }
 }, [leads]);

 // Automatically detect & save address when a lead is selected
 useEffect(() => {
 if (selectedLead && !selectedLead.direccion && selectedLead.nombre_sala) {
 const detected = autoDetectVenueAddress(selectedLead.nombre_sala, selectedLead.ciudad ||'');
 if (detected) {
 onUpdateLead(selectedLead.id, { direccion: detected });
 setSelectedLead(prev => prev ? { ...prev, direccion: detected } : null);
 }
 }
 }, [selectedLead?.id, selectedLead?.nombre_sala, selectedLead?.direccion]);
 const [isEditingPitch, setIsEditingPitch] = useState(false);
 const [editedPitch, setEditedPitch] = useState('');
 const [rejectionNotes, setRejectionNotes] = useState('');
 const [isRejecting, setIsRejecting] = useState(false);

 // Editable Lead Info state
 const [isEditingLeadInfo, setIsEditingLeadInfo] = useState(false);
 const [editedLeadInfo, setEditedLeadInfo] = useState<Partial<Lead>>({});

 // New Lead / Medio Modal
 const [isPlacesExplorerOpen, setIsPlacesExplorerOpen] = useState(false);
 const [isContactEnricherOpen, setIsContactEnricherOpen] = useState(false);
 const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
 const [isExportLeadsOpen, setIsExportLeadsOpen] = useState(false);
 const [isDuplicatesModalOpen, setIsDuplicatesModalOpen] = useState(false);
 const duplicateGroups = useMemo(() => findDuplicateLeads(leads), [leads]);
 const duplicateGroupsCount = duplicateGroups.length;
 const [isDispatchingEmails, setIsDispatchingEmails] = useState(false);

 const handleTriggerEnviadorAgent = async (leadId?: string) => {
 setIsDispatchingEmails(true);
 try {
 const data = await apiFetch('/api/trigger-agent', {
 method:'POST',
 body: JSON.stringify({
 agentName:'enviador',
 params: { id: leadId, trigger_type:'usuario_manual' }
 })
 });

 try {
 window.dispatchEvent(new CustomEvent('app-data-updated'));
 } catch (_) {}

 if (data.dispatchedCount > 0) {
 alert(`¡Agente Enviador ejecutado con éxito! ${data.message ||''}`);
 } else if (data.results && data.results.some((r: any) => r.status ==='error')) {
 const errMsgs = data.results.filter((r: any) => r.status ==='error').map((r: any) => `${r.nombre_sala}: ${r.error}`).join('\n');
 alert(`Aviso del Agente Enviador:\n${data.message ||''}\n\nDetalles:\n${errMsgs}`);
 } else {
 alert(data.message ||'No se encontraron correos aprobados pendientes de despacho.');
 }
 } catch (err: any) {
 console.error('Error al ejecutar Agente Enviador:', err);
 alert(`Error al ejecutar el Agente Enviador: ${err.message ||'Error de conexión'}`);
 } finally {
 setIsDispatchingEmails(false);
 }
 };
 const [isAddingLeadModalOpen, setIsAddingLeadModalOpen] = useState(false);
 const [newLeadData, setNewLeadData] = useState({
 nombre_sala:'',
 ciudad:'',
 region:'Nacional',
 direccion:'',
 aforo: 0,
 tipo:'medio' as LeadType,
 email_contacto:'',
 telefono:'',
 website:'',
 instagram:'',
 fuente:'',
 genero:'Radio',
 notas:'',
 pitch_generado:'',
 icono:'📻',
 imagen_url:''
 });

 const [isUploadingLeadLogo, setIsUploadingLeadLogo] = useState(false);

 const handleLeadLogoUpload = async (file: File, isEdit: boolean): Promise<string | null> => {
 if (!currentBandId) {
 alert('No hay ninguna banda activa para subir la imagen.');
 return null;
 }
 try {
 setIsUploadingLeadLogo(true);
 const targetBandId = currentBandId;
 const url = await uploadFileToServer(file, { bandId: targetBandId, category:'leads' });
 if (url) {
 if (isEdit) {
 setEditedLeadInfo(prev => ({ ...prev, imagen_url: url }));
 if (selectedLead?.id) {
 setSelectedLead(prev => prev ? { ...prev, imagen_url: url } : null);
 onUpdateLead(selectedLead.id, { imagen_url: url });
 }
 } else {
 setNewLeadData(prev => ({ ...prev, imagen_url: url }));
 }
 return url;
 }
 } catch (err) {
 console.error('Error uploading lead logo:', err);
 alert('Error al subir la imagen del logo a Supabase');
 } finally {
 setIsUploadingLeadLogo(false);
 }
 };

 // Modal AI Scout Scraping state
 const [isModalScraping, setIsModalScraping] = useState(false);
 const [modalScrapeStatus, setModalScrapeStatus] = useState('');
 const [modalScrapeError, setModalScrapeError] = useState('');
 const [modalScrapeSuccessMsg, setModalScrapeSuccessMsg] = useState('');

 // Selected Lead AI Scout Scraping state
 const [isScrapingLead, setIsScrapingLead] = useState(false);
 const [scrapingLeadStatus, setScrapingLeadStatus] = useState('');
 const [scrapedDataForLead, setScrapedDataForLead] = useState<any | null>(null);
 const [scrapingLeadError, setScrapingLeadError] = useState<string | null>(null);


 // Email thread and manual dispatch states
 const [activeTab, setActiveTab] = useState<'info' |'emails'>('info');
 const [manualEmailBody, setManualEmailBody] = useState('');
 const [manualEmailSubject, setManualEmailSubject] = useState('');
 const [manualEmailSender, setManualEmailSender] = useState('Bakandeya Agent Manager IA');
 const [manualEmailStatus, setManualEmailStatus] = useState('');


 const {
 isSimulatingAvanzado, setIsSimulatingAvanzado,
 simulationRole,
 simulationScenario,
 simulationCustomInstruction, setSimulationCustomInstruction,
 simulationSenderName, setSimulationSenderName,
 simulationSubject, setSimulationSubject,
 simulationMessage, setSimulationMessage,
 isGeneratingSimulation,
 simulationGenerated,
 PREDEFINED_SCENARIOS,
 handleRoleChange,
 handleScenarioChange,
 handleOpenAdvancedSimulation,
 handleGenerateSimulationEmail,
 handleCommitSimulation,
 } = useNegotiationSimulation(selectedLead, setSelectedLead, onUpdateLead, setManualEmailStatus);


 // Bulk enrich addresses for all venues & festivals
 const [isEnrichingAddresses, setIsEnrichingAddresses] = useState(false);
 const [enrichStatusMsg, setEnrichStatusMsg] = useState('');

 const handleEnrichAddresses = async () => {
 setIsEnrichingAddresses(true);
 setEnrichStatusMsg('Buscando y autocompletando direcciones exactas para salas y festivales...');
 try {
 const res = await apiFetch('/api/leads/enrich-addresses', {
 method:'POST',
 headers: {'Content-Type':'application/json' }
 });
 // apiFetch devuelve el JSON ya parseado (y lanza si la respuesta no fue 2xx).
 const data = res as any;
 if (data) {
 if (data.enrichedCount > 0) {
 setEnrichStatusMsg(`¡Éxito! Se han completado y guardado en Supabase ${data.enrichedCount} direcciones de salas/festivales.`);
 if (Array.isArray(data.leads)) {
 data.leads.forEach((updatedLead: Lead) => {
 if (updatedLead.direccion) {
 onUpdateLead(updatedLead.id, { direccion: updatedLead.direccion });
 }
 });
 }
 } else {
 setEnrichStatusMsg(`Todas las salas y festivales ya tienen su dirección informada (${data.totalLeads} total).`);
 }
 } else {
 setEnrichStatusMsg('Fallo al autocompletar las direcciones en el servidor.');
 }
 } catch (err) {
 console.error(err);
 setEnrichStatusMsg('Error de conexión al autocompletar direcciones.');
 } finally {
 setIsEnrichingAddresses(false);
 setTimeout(() => {
 setEnrichStatusMsg('');
 }, 7000);
 }
 };


 const isMedioOIndustria = (t: any) => {
 const norm = normalizeType(t);
 return norm ==='medio' || norm ==='productora';
 };

 const isStitchLight = (typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light') || colors.name?.toLowerCase().includes('light') || colors.bg.includes('f8fafc') || colors.bg.includes('white') || colors.bg.includes('slate-50') || false;

 // Filter leads by active section tab
 const sectionLeads = useMemo(() => {
 const seen = new Set<string>();
 const isGruposType = (norm: string) => ['grupo','agencia','manager','productora','sello'].includes(norm);
 return (leads || []).filter(lead => {
 if (!lead) return false;
 const leadKey = lead.id ? String(lead.id).trim() : null;
 if (leadKey && seen.has(leadKey)) return false;
 if (leadKey) seen.add(leadKey);

 const norm = normalizeType(lead.tipo);
 if (sectionTab ==='medios') return norm ==='medio';
 if (sectionTab ==='grupos') return isGruposType(norm);
 return norm !=='medio' && !isGruposType(norm);
 });
 }, [leads, sectionTab]);

 const filteredLeads = useMemo(() => {
 const seen = new Set<string>();
 return sectionLeads.filter((lead, idx) => {
 const leadKey = lead.id ? String(lead.id).trim() : `lead-${idx}`;
 if (seen.has(leadKey)) return false;
 seen.add(leadKey);

 if (sectionTab ==='salas' && filterByCampaign && activeCampaign && (activeCampaign.isActive ?? (activeCampaign as any).is_active ?? true)) {
 // El filtrado por aforo, fechas y ciudad de campaña solo aplica a recintos y festivales (salas),
 // ya que los medios de comunicación y bandas no tienen aforo ni fechas de evento en campaña.
 if (!leadMatchesCampaignCity(lead, activeCampaign) || !leadMatchesCampaignCapacity(lead, activeCampaign) || !leadMatchesCampaignDates(lead, activeCampaign)) return false;
 }

 const matchesSearch = (lead.nombre_sala ||'').toLowerCase().includes(searchTerm.toLowerCase()) || 
 (lead.ciudad ||'').toLowerCase().includes(searchTerm.toLowerCase()) ||
 (lead.region ||'').toLowerCase().includes(searchTerm.toLowerCase()) ||
 (lead.email_contacto && lead.email_contacto.toLowerCase().includes(searchTerm.toLowerCase()));
 const normSt = normalizeStatus(lead.estado);
 const matchesStatus = statusFilter ==='todos' || 
 normSt === statusFilter || 
 (statusFilter ==='pendiente_aprobacion' && normSt ==='nuevo' && !!lead.pitch_generado);

 const matchesType = typeFilter ==='todos'
 ? true
 : sectionTab ==='medios'
 ? matchesMedioType(lead, typeFilter)
 : sectionTab ==='grupos'
 ? matchesGruposType(lead, typeFilter)
 : normalizeType(lead.tipo) === typeFilter;
 const matchesCity = !selectedCityFilter || 
 (lead.ciudad ||'').toLowerCase().includes(selectedCityFilter.toLowerCase()) || 
 (lead.region ||'').toLowerCase().includes(selectedCityFilter.toLowerCase());
 const matchesCapacity = !minCapacityFilter || ((lead.aforo || 0) >= minCapacityFilter);
 return matchesSearch && matchesStatus && matchesType && matchesCity && matchesCapacity;
 });
 }, [sectionLeads, searchTerm, statusFilter, typeFilter, selectedCityFilter, minCapacityFilter, sectionTab, filterByCampaign, activeCampaign]);

 const handleModalScrape = async () => {
 if (!newLeadData.nombre_sala.trim()) {
 alert('Por favor, escribe al menos el nombre de la sala o medio para que el Agente Scout pueda buscar en Google.');
 return;
 }

 setIsModalScraping(true);
 setModalScrapeStatus('Consultando Google Places API & Extraedor de Emails IA...');
 setModalScrapeError('');
 setModalScrapeSuccessMsg('');

 const steps = ["Buscando sitio oficial y directorio de salas...","Extrayendo emails de programación y prensa...","Obteniendo teléfono y datos de ubicación...","Consolidando ficha encontrada..."
 ];

 let stepIdx = 0;
 const interval = setInterval(() => {
 stepIdx++;
 if (stepIdx < steps.length) {
 setModalScrapeStatus(steps[stepIdx]);
 }
 }, 1200);

 try {
 const res = await apiFetch('/api/scrape-contact', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 nombre_sala: newLeadData.nombre_sala,
 ciudad: newLeadData.ciudad,
 region: newLeadData.region
 })
 });

 clearInterval(interval);

 if (res.ok) {
 const resData = await res.json();
 if (resData.success && resData.data) {
 const getVal = (f: any) => typeof f ==='object' && f !== null ? f.valor : (f ||'');
 const emailVal = getVal(resData.data.email_contacto);
 const telVal = getVal(resData.data.telefono);
 const webVal = getVal(resData.data.website);
 const instaVal = getVal(resData.data.instagram);
 const contactoVal = getVal(resData.data.contacto_nombre);
 const aforoVal = getVal(resData.data.aforo);
 const regionVal = getVal(resData.data.region);
 const generoVal = getVal(resData.data.genero);
 const imgVal = getVal(resData.data.imagen_url);
 const iconVal = getVal(resData.data.icono);

 setNewLeadData(prev => ({
 ...prev,
 email_contacto: emailVal || prev.email_contacto,
 telefono: telVal || prev.telefono,
 website: webVal || prev.website,
 region: regionVal || prev.region,
 aforo: (aforoVal && !isNaN(Number(aforoVal))) ? Number(aforoVal) : prev.aforo,
 genero: generoVal || prev.genero,
 imagen_url: imgVal || prev.imagen_url,
 icono: iconVal || prev.icono,
 notas: prev.notas ? `${prev.notas} | Scout: ${resData.data.source_info ||'IA Grounding'}` : `Scout IA: ${resData.data.source_info ||'IA Grounding'}`
 }));

 setModalScrapeSuccessMsg(
 `¡Éxito! Email: ${emailVal ||'No hallado'} | Tel: ${telVal ||'No hallado'} | Web: ${webVal ||'No hallado'}`
 );
 } else {
 setModalScrapeError(resData.error ||'No se pudieron recuperar datos con la IA Scout.');
 }
 } else {
 const errJson = await res.json().catch(() => null);
 setModalScrapeError(errJson?.error || `Error ${res.status}: Fallo de respuesta del servidor.`);
 }
 } catch (err: any) {
 clearInterval(interval);
 setModalScrapeError(err.message ||'Error de conexión con el Agente Scout.');
 } finally {
 setIsModalScraping(false);
 }
 };

 const handleScrapeSelectedLead = async () => {
 if (!selectedLead) return;
 setIsScrapingLead(true);
 setScrapingLeadStatus('Iniciando rastreo web con Agente Scout IA...');
 setScrapingLeadError(null);
 setScrapedDataForLead(null);

 const steps = ["Buscando sitio oficial de la sala / medio...","Rastreando contactos de programación y teléfono...","Consolidando nivel de confianza de datos..."
 ];

 let stepIdx = 0;
 const interval = setInterval(() => {
 stepIdx++;
 if (stepIdx < steps.length) {
 setScrapingLeadStatus(steps[stepIdx]);
 }
 }, 1200);

 try {
 const res = await apiFetch('/api/scrape-contact', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 leadId: selectedLead.id,
 nombre_sala: selectedLead.nombre_sala,
 ciudad: selectedLead.ciudad,
 region: selectedLead.region
 })
 });

 clearInterval(interval);

 if (res.ok) {
 const resData = await res.json();
 if (resData.success && resData.data) {
 setScrapedDataForLead(resData.data);
 } else {
 setScrapingLeadError(resData.error ||'No se lograron extraer datos de contacto.');
 }
 } else {
 const errJson = await res.json().catch(() => null);
 setScrapingLeadError(errJson?.error || `Error ${res.status}: Fallo de respuesta del servidor.`);
 }
 } catch (err: any) {
 clearInterval(interval);
 setScrapingLeadError(err.message ||'Fallo de conexión con Agente Scout.');
 } finally {
 setIsScrapingLead(false);
 }
 };

 const handleApplyScrapedToSelectedLead = () => {
 if (!selectedLead || !scrapedDataForLead) return;
 const getVal = (f: any) => typeof f ==='object' && f !== null ? f.valor : (f ||'');

 const emailVal = getVal(scrapedDataForLead.email_contacto);
 const telVal = getVal(scrapedDataForLead.telefono);
 const webVal = getVal(scrapedDataForLead.website);
 const instaVal = getVal(scrapedDataForLead.instagram);
 const contactoVal = getVal(scrapedDataForLead.contacto_nombre);
 const aforoVal = getVal(scrapedDataForLead.aforo);
 const regionVal = getVal(scrapedDataForLead.region);
 const generoVal = getVal(scrapedDataForLead.genero);
 const imgVal = getVal(scrapedDataForLead.imagen_url);
 const iconVal = getVal(scrapedDataForLead.icono);

 const today = new Date().toISOString().split('T')[0];
 const sourceSummary = typeof scrapedDataForLead.source_info ==='string' ? scrapedDataForLead.source_info :'Rastreo web Agente Scout';
 const updatedNotes = `*** [${today}] Ficha enriquecida vía Agente Scout. ${sourceSummary} ***\n${selectedLead.notas ||''}`;

 const updatedFields: Partial<Lead> = {
 email_contacto: emailVal || selectedLead.email_contacto,
 telefono: telVal || selectedLead.telefono,
 website: webVal || selectedLead.website,
 instagram: instaVal || selectedLead.instagram,
 contacto_nombre: contactoVal || selectedLead.contacto_nombre,
 aforo: (aforoVal && !isNaN(Number(aforoVal))) ? Number(aforoVal) : selectedLead.aforo,
 region: regionVal || selectedLead.region,
 genero: generoVal || selectedLead.genero,
 imagen_url: imgVal || selectedLead.imagen_url,
 icono: iconVal || selectedLead.icono,
 notas: updatedNotes
 };

 onUpdateLead(selectedLead.id, updatedFields);
 setSelectedLead(prev => prev ? { ...prev, ...updatedFields } : null);
 setScrapedDataForLead(null);
 };

 const handleAddNewLeadSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!newLeadData.nombre_sala) {
 alert('Por favor, indica al menos el nombre de la sala o medio.');
 return;
 }

 const createdLead: Lead = {
 id: `lead-${Date.now()}`,
 nombre_sala: newLeadData.nombre_sala,
 ciudad: newLeadData.ciudad ||'Nacional',
 region: newLeadData.region ||'Nacional',
 aforo: newLeadData.aforo || 0,
 genero: newLeadData.genero || (sectionTab ==='medios' ?'Radio' :'Música en directo'),
 tipo: sectionTab ==='medios' ?'medio' : newLeadData.tipo,
 email_contacto: newLeadData.email_contacto ||'',
 telefono: newLeadData.telefono ||'',
 instagram: newLeadData.instagram ||'',
 website: newLeadData.website ||'',
 icono: newLeadData.icono || (sectionTab ==='medios' ?'📻' :'🏛️'),
 imagen_url: newLeadData.imagen_url ||'',
 fuente:'Alta Manual CRM',
 estado:'nuevo',
 pitch_generado: newLeadData.pitch_generado || (sectionTab ==='medios' 
 ? `Asunto: Nota de Prensa: ${effectiveBandName} presenta su directo\n\nEstimada redacción / equipo de ${newLeadData.nombre_sala},\n\nOs remitimos la información de la propuesta musical de ${effectiveBandName}...`
 : `Asunto: Propuesta de concierto: ${effectiveBandName} en ${newLeadData.nombre_sala}\n\nHola equipo de booking,\n\nSomos la banda ${effectiveBandName}...`),
 notas: newLeadData.notas || `Añadido desde la sección ${sectionTab ==='medios' ?'Medios' :'Salas'} el ${new Date().toISOString().split('T')[0]}`
 };

 if (onAddLead) {
 onAddLead(createdLead);
 } else {
 onUpdateLead(createdLead.id, createdLead);
 }

 setIsAddingLeadModalOpen(false);
 setSelectedLead(createdLead);
 };

 const getStatusDotColor = (status: LeadStatus | string) =>
 leadStatusDotColor(normalizeStatus(status));

 const getStatusBadgeClass = (status: LeadStatus | string) =>
 leadStatusBadgeClass(normalizeStatus(status), isStitchLight);

 const getStatusLabel = (status: LeadStatus | string) =>
 leadStatusLabel(normalizeStatus(status), String(status));

 const handleOpenLead = (lead: Lead) => {
 setSelectedLead(lead);
 setEditedPitch(lead.pitch_generado ||'');
 setIsEditingPitch(false);
 setIsEditingLeadInfo(false);
 setIsRejecting(false);
 setRejectionNotes('');
 
 // Automatically switch to emails tab for negotiating or interested leads, else info
 setActiveTab(lead.estado ==='negociando' || lead.estado ==='interesado' ?'emails' :'info');
 setManualEmailBody('');
 setManualEmailSubject(lead.hilo_emails && lead.hilo_emails.length > 0 ? `RE: ${lead.hilo_emails[lead.hilo_emails.length - 1].asunto}` : `Propuesta de concierto: ${effectiveBandName}`);
 setManualEmailStatus('');

 setTimeout(() => {
 interventionPanelRef.current?.scrollIntoView({ behavior:'smooth', block:'start' });
 }, 100);
 };

 const handleStartEditLeadInfo = () => {
 if (!selectedLead) return;
 setEditedLeadInfo({
 nombre_sala: selectedLead.nombre_sala ||'',
 contacto_nombre: selectedLead.contacto_nombre ||'',
 email_contacto: selectedLead.email_contacto ||'',
 telefono: selectedLead.telefono ||'',
 website: selectedLead.website ||'',
 instagram: selectedLead.instagram ||'',
 ciudad: selectedLead.ciudad ||'',
 region: selectedLead.region ||'',
 aforo: selectedLead.aforo || 0,
 genero: selectedLead.genero ||'',
 notas: selectedLead.notas ||'',
 contexto_extra: selectedLead.contexto_extra ||''
 });
 setIsEditingLeadInfo(true);
 };

 const handleSaveLeadInfo = () => {
 if (!selectedLead) return;
 onUpdateLead(selectedLead.id, editedLeadInfo);
 setSelectedLead(prev => prev ? { ...prev, ...editedLeadInfo } : null);
 setIsEditingLeadInfo(false);
 };

 const handleSendManualEmail = () => {
 if (!selectedLead || !manualEmailBody) return;

 const now = new Date();
 const fechaStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
 
 const newMsg = {
 id: `em-manual-${Date.now()}`,
 fecha: fechaStr,
 remitente:'banda' as const,
 remitente_nombre: manualEmailSender,
 asunto: manualEmailSubject || `Contacto directo de ${effectiveBandName}`,
 mensaje: manualEmailBody
 };

 const currentHilo = selectedLead.hilo_emails || [];
 const nuevoHilo = [...currentHilo, newMsg];
 
 // Move status to negotiating if it was new/pending/approved/sent
 let nuevoEstado = selectedLead.estado;
 if (selectedLead.estado ==='nuevo' || selectedLead.estado ==='pendiente_aprobacion' || selectedLead.estado ==='aprobado' || selectedLead.estado ==='esperando_respuesta') {
 nuevoEstado ='negociando';
 }

 const today = new Date().toISOString().split('T')[0];
 const nuevaNota = `*** [${today}] Correo personal manual enviado por ${manualEmailSender}:"${manualEmailSubject}" ***\n` + (selectedLead.notas ||'');

 onUpdateLead(selectedLead.id, {
 hilo_emails: nuevoHilo,
 estado: nuevoEstado,
 notas: nuevaNota
 });

 setSelectedLead(prev => prev ? {
 ...prev,
 hilo_emails: nuevoHilo,
 estado: nuevoEstado,
 notas: nuevaNota
 } : null);

 setManualEmailBody('');
 setManualEmailStatus('¡Email enviado con éxito! Se ha registrado en el hilo de negociación.');
 setTimeout(() => {
 setManualEmailStatus('');
 }, 4000);
 };

 const handleSimulateIncomingEmail = () => {
 if (!selectedLead) return;
 
 let simSender ='Programación';
 let simBody ='';
 
 const lowercaseName = selectedLead.nombre_sala.toLowerCase();
 if (selectedLead.id ==='lead-14' || lowercaseName.includes('hebe')) {
 simSender ='Kike (Programación Sala Hebe)';
 simBody ='¡Buenas! He estado pensando lo de la fecha doble con la banda local que propusisteis. Me parece de lujo, los chavales de"Vallekas Ska" están buscando bolo para noviembre y seguro que entre los dos llenamos el Hebe. El viernes 13 de Noviembre sigue libre. ¿Cerramos ese día con un 75% de taquilla para vosotros si llegamos a las 100 entradas? Ya me decís y os paso el contrato.';
 } else if (selectedLead.id ==='lead-4' || lowercaseName.includes('viña')) {
 simSender ='Producción Artística (Viña Rock)';
 simBody ='Hola, gracias por pasarnos los detalles. El caché de 4.500€ entra en vuestros rangos para el escenario de Mestizaje. El slot de las 18:30 del viernes está libre. Confirmadnos si vuestro rider técnico incluye los sintetizadores listos para línea balanceada o si necesitáis cajas DI adicionales del festival. ¡Cerremos trato!';
 } else if (selectedLead.id ==='lead-6' || lowercaseName.includes('razzmatazz')) {
 simSender ='Xavi (Booking Razzmatazz)';
 simBody = `Buenas, nos parece perfecto el acuerdo de taquilla al 80/20 con un mínimo de 150 entradas garantizadas. La fecha del sábado 5 de Diciembre queda reservada para ${effectiveBandName}. Decidme a qué email enviamos el borrador del contrato de sala. ¡Un saludo!`;
 } else {
 simSender = `Programador (${selectedLead.nombre_sala})`;
 simBody = `Hola equipo de ${effectiveBandName}, gracias por la propuesta. Nos gusta mucho vuestra propuesta en directo. Para otoño tenemos el calendario casi cerrado, pero nos queda un hueco el sábado 28 de Noviembre. Iríamos a taquilla 70/30 a vuestro favor con entradas a 10€. ¿Os cuadra la fecha?`;
 }

 const now = new Date();
 const fechaStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
 const subject = selectedLead.hilo_emails && selectedLead.hilo_emails.length > 0 
 ? `RE: ${selectedLead.hilo_emails[selectedLead.hilo_emails.length - 1].asunto}` 
 : `Re: Propuesta de concierto - ${effectiveBandName}`;

 const newMsg = {
 id: `em-sim-${Date.now()}`,
 fecha: fechaStr,
 remitente:'sala' as const,
 remitente_nombre: simSender,
 asunto: subject,
 mensaje: simBody
 };

 const currentHilo = selectedLead.hilo_emails || [];
 const nuevoHilo = [...currentHilo, newMsg];
 
 let nuevoEstado = selectedLead.estado;
 if (selectedLead.estado ==='nuevo' || selectedLead.estado ==='pendiente_aprobacion' || selectedLead.estado ==='aprobado' || selectedLead.estado ==='esperando_respuesta') {
 nuevoEstado ='negociando';
 }

 const today = new Date().toISOString().split('T')[0];
 const nuevaNota = `*** [${today}] Correo de simulación entrante recibido de ${simSender} ***\n` + (selectedLead.notas ||'');

 onUpdateLead(selectedLead.id, {
 hilo_emails: nuevoHilo,
 estado: nuevoEstado,
 notas: nuevaNota,
 fecha_ultima_respuesta: today
 });

 setSelectedLead(prev => prev ? {
 ...prev,
 hilo_emails: nuevoHilo,
 estado: nuevoEstado,
 notas: nuevaNota,
 fecha_ultima_respuesta: today
 } : null);

 setManualEmailStatus(`¡Simulación completada! Se recibió un correo entrante de ${simSender} y se sincronizó en Excel.`);
 setTimeout(() => {
 setManualEmailStatus('');
 }, 5000);
 };

 const handleSavePitchEdit = () => {
 if (!selectedLead) return;
 onUpdateLead(selectedLead.id, { pitch_generado: editedPitch });
 setSelectedLead(prev => prev ? { ...prev, pitch_generado: editedPitch } : null);
 setIsEditingPitch(false);
 };

 const handleApproveLead = () => {
 if (!selectedLead) return;
 const today = new Date().toISOString().split('T')[0];
 const updatedNotes = `*** [${today}] Correo de presentación APROBADO manualmente para envío automático ***\n${selectedLead.notas ||''}`;

 onUpdateLead(selectedLead.id, {
 estado:'aprobado',
 pitch_generado: editedPitch,
 notas: updatedNotes
 },'pendiente_aprobacion');

 setSelectedLead(null);
 };

 const handleRejectLead = () => {
 if (!selectedLead || !rejectionNotes) return;
 const today = new Date().toISOString().split('T')[0];
 const updatedNotes = `*** [${today}] RECHAZADO EN PANEL DE REVISIÓN:"${rejectionNotes}" ***\n${selectedLead.notas ||''}`;
 
 onUpdateLead(selectedLead.id, {
 estado:'nuevo',
 notas: updatedNotes
 },'pendiente_aprobacion');

 setSelectedLead(null);
 };

 const handleCorrectStatus = (newStatus: LeadStatus) => {
 if (!selectedLead) return;
 const today = new Date().toISOString().split('T')[0];
 const correctionMsg = `*** [${today}] Clasificación corregida a'${newStatus}' manualmente ***\n`;
 
 onUpdateLead(selectedLead.id, {
 estado: newStatus,
 notas: correctionMsg + (selectedLead.notas ||'')
 }, selectedLead.estado);

 setSelectedLead(prev => prev ? { ...prev, estado: newStatus, notas: correctionMsg + (prev.notas ||'') } : null);
 };


 const subCardBg = isStitchLight ?'bg-[var(--bg)]/60' :'bg-[var(--surface)]';
 const textTitle = isStitchLight ?'text-[var(--ink)]' :'text-[var(--ink-2)]';
 const textSub = isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--ink-2)]';
 const textMuted = isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--ink-2)]';
 const activeFiltersCount = (searchTerm ? 1 : 0) + (selectedCityFilter ? 1 : 0) + (statusFilter !=='todos' ? 1 : 0) + (typeFilter !=='todos' ? 1 : 0) + (minCapacityFilter > 0 ? 1 : 0) + (onlyFavoritesFilter ? 1 : 0) + (onlyVerifiedFilter ? 1 : 0) + (activeSavedFilterId ? 1 : 0);

 return (
 <div data-modulo="booking" className="space-y-4 text-[var(--ink)] bg-[var(--bg)] -m-3 p-3 sm:-m-5 sm:p-5 md:-m-8 md:p-8 min-h-screen font-sans overflow-x-hidden">
 
 {/* 2. LEADS CRM WORKSPACE */}
 <div className={`grid grid-cols-1 ${selectedLead ?'lg:grid-cols-3 gap-8' :'w-full'} items-start transition-all duration-300`}>
 
 {/* LEADS LIST AREA (Takes 100% width when no lead is selected, or 2/3 when detail panel is open) */}
 <div className={`${selectedLead ?'lg:col-span-2' :'w-full lg:col-span-3'} space-y-4 transition-all duration-300`}>
 <div className="space-y-3 sm:space-y-4">
 
 {/* Header: Tabs + Unified Action Buttons */}
 <div className="flex flex-col gap-3">
 <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
 {/* SECCIONES PRINCIPALES DE CONTACTOS: ESCENARIOS, MEDIOS Y MANAGEMENT/PRODUCTORAS */}
 <div className="flex items-center gap-1.5 p-1 rounded-[var(--r-pill)] bg-[var(--sunken)] overflow-x-auto w-full sm:w-auto scrollbar-none">
 <button
 id="section-tab-salas"
 type="button"
 onClick={() => handleSelectSectionTab('salas')}
 className={`flex items-center gap-2 px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
 sectionTab ==='salas'
 ?'bg-[var(--acc)] text-[var(--on-acc)] font-bold'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 <Building2 className="w-3.5 h-3.5 shrink-0" />
 <span>Escenarios</span>
 <span className={`text-[10px] px-1.5 py-0.5 rounded-[var(--r-pill)] font-semibold tabular-nums ${
 sectionTab ==='salas' ?'bg-[var(--sunken)] text-[var(--on-acc)]' :'bg-[var(--sunken)] text-[var(--ink-2)]'
 }`}>
 {leads.filter(l => !normalizeType(l.tipo).includes('medio') && !['grupo','agencia','manager','productora','sello'].includes(normalizeType(l.tipo))).length}
 </span>
 </button>

 <button
 id="section-tab-medios"
 type="button"
 onClick={() => handleSelectSectionTab('medios')}
 className={`flex items-center gap-2 px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
 sectionTab ==='medios'
 ?'bg-[var(--acc)] text-[var(--on-acc)] font-bold'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 <Radio className="w-3.5 h-3.5 shrink-0" />
 <span>Medios y Prensa</span>
 <span className={`text-[10px] px-1.5 py-0.5 rounded-[var(--r-pill)] font-semibold tabular-nums ${
 sectionTab ==='medios' ?'bg-[var(--sunken)] text-[var(--on-acc)]' :'bg-[var(--sunken)] text-[var(--ink-2)]'
 }`}>
 {leads.filter(l => normalizeType(l.tipo) ==='medio').length}
 </span>
 </button>

 <button
 id="section-tab-grupos"
 type="button"
 onClick={() => handleSelectSectionTab('grupos')}
 className={`flex items-center gap-2 px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
 sectionTab ==='grupos'
 ?'bg-[var(--acc)] text-[var(--on-acc)] font-bold'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 <Briefcase className="w-3.5 h-3.5 shrink-0" />
 <span>Management & Productoras</span>
 <span className={`text-[10px] px-1.5 py-0.5 rounded-[var(--r-pill)] font-semibold tabular-nums ${
 sectionTab ==='grupos' ?'bg-[var(--sunken)] text-[var(--on-acc)]' :'bg-[var(--sunken)] text-[var(--ink-2)]'
 }`}>
 {leads.filter(l => ['agencia','manager','productora','sello','promotora','management'].some(t => normalizeType(l.tipo).includes(t))).length}
 </span>
 </button>

 <button
 id="section-tab-bandas"
 type="button"
 onClick={() => {
 if (onNavigate) {
 onNavigate('bandas');
 } else if (onSectionChange) {
 onSectionChange('bandas');
 }
 }}
 className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer text-[var(--ink-2)] hover:text-[var(--ink)]"
 title="Ver Red de Co-Booking y Grupos Amigos"
 >
 <Users className="w-3.5 h-3.5 shrink-0 text-[var(--acc-ink)]" />
 <span>Grupos</span>
 {typeof bandsCount ==='number' && bandsCount > 0 && (
 <span className="text-[10px] px-1.5 py-0.5 rounded-[var(--r-pill)] font-semibold tabular-nums bg-[var(--sunken)] text-[var(--ink-2)]">
 {bandsCount}
 </span>
 )}
 </button>
 </div>

 {/* UNIFIED ACTION BUTTONS */}
 <div className="flex items-center gap-1.5 shrink-0 ml-auto">
 <button
 id="add-new-lead-btn"
 type="button"
 onClick={() => {
 setNewLeadData({
 nombre_sala:'',
 ciudad:'',
 region:'Nacional',
 direccion:'',
 aforo: 0,
 tipo: sectionTab ==='medios' ?'medio' : sectionTab ==='grupos' ?'productora' :'sala',
 email_contacto:'',
 telefono:'',
 website:'',
 instagram:'',
 fuente:'',
 genero: sectionTab ==='medios' ?'Radio' : sectionTab ==='grupos' ?'Management / Booking' :'Balkan / Ska',
 notas:'',
 pitch_generado:'',
 icono: sectionTab ==='medios' ?'📻' : sectionTab ==='grupos' ?'💼' :'🏛️',
 imagen_url:''
 });
 setIsAddingLeadModalOpen(true);
 }}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-bold bg-[var(--acc)] hover:brightness-105 text-[var(--on-acc)] active:scale-95 cursor-pointer"
 title="Añadir contacto"
 >
 <PlusCircle className="w-3.5 h-3.5" />
 <span>Añadir {sectionTab ==='medios' ?'medio' : sectionTab ==='grupos' ?'contacto' :'escenario'}</span>
 </button>

 <ModuleTutorialTrigger
 moduleId="booking"
 onClick={bookingTutorial.openTutorial}
 />

 <button
 id="export-leads-btn"
 type="button"
 onClick={() => setIsExportLeadsOpen(true)}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-bold bg-[var(--sunken)] hover:brightness-95 text-[var(--ink-2)] active:scale-95 cursor-pointer"
 title="Exportar base de datos a Excel / CSV o JSON"
 >
 <Download className="w-3.5 h-3.5 text-[var(--ink-2)]" />
 <span className="hidden sm:inline">Exportar Leads</span>
 <span className="sm:hidden">Exportar</span>
 </button>

 <button
 id="open-tools-btn"
 type="button"
 onClick={() => setIsMobileToolsOpen(!isMobileToolsOpen)}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-bold transition-colors cursor-pointer ${
 isMobileToolsOpen
 ?'bg-[var(--acc-soft)] text-[var(--acc-ink)]'
 :'bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 title="Herramientas, Scout, Excel y Agentes IA"
 >
 <Bot className="w-3.5 h-3.5 text-[var(--acc-ink)]" />
 <span className="hidden sm:inline">Herramientas e IA</span>
 <span className="sm:hidden">Herramientas</span>
 {leads.filter(l => !l.email_contacto || l.email_contacto.trim() ==='').length > 0 && (
 <span className="px-1.5 py-0.2 rounded-[var(--r-pill)] bg-[var(--alert-soft)] text-[var(--alert)] text-[10px] font-semibold tabular-nums">
 {leads.filter(l => !l.email_contacto || l.email_contacto.trim() ==='').length}
 </span>
 )}
 {duplicateGroupsCount > 0 && (
 <span className="px-1.5 py-0.2 rounded-[var(--r-pill)] bg-[var(--alert-soft)] text-[var(--alert)] text-[10px] font-bold" title={`${duplicateGroupsCount} grupos de duplicados detectados`}>
 {duplicateGroupsCount} dup
 </span>
 )}
 {isMobileToolsOpen ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
 </button>
 </div>
 </div>

 {/* EXPANDED IA TOOLS PANEL (Responsive on all screen sizes) */}
 {isMobileToolsOpen && (
 <div className="p-3.5 rounded-[var(--r-l)] bg-[var(--surface)] /40 space-y-2.5 animate-in slide-in-from-top-2 duration-150">
 <div className="flex items-center justify-between text-xs font-bold text-[var(--acc)]/70 pb-1.5 border-b border-[var(--hair)]">
 <span className="flex items-center gap-1.5">
 <Wrench className="w-3.5 h-3.5" />
 Herramientas e Inteligencia Artificial
 </span>
 <button
 type="button"
 onClick={() => setIsMobileToolsOpen(false)}
 className="text-[var(--ink-2)] hover:text-[var(--ink)] p-1 rounded-[var(--r-s)] cursor-pointer"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
 <button
 type="button"
 disabled={isDispatchingEmails}
 onClick={() => {
 setIsMobileToolsOpen(false);
 handleTriggerEnviadorAgent();
 }}
 className="flex items-center justify-between p-2.5 rounded-[var(--r-m)] text-xs font-bold bg-gradient-to-r from-emerald-950 to-teal-950 hover:from-emerald-900 hover:to-teal-900 text-[var(--ink)] transition-all cursor-pointer active:scale-98 disabled:opacity-50"
 >
 <span className="flex items-center gap-2">
 {isDispatchingEmails ? <Loader2 className="w-4 h-4 text-[var(--ok)] animate-spin" /> : <Send className="w-4 h-4 text-[var(--ok)]" />}
 <span>{isDispatchingEmails ?'Despachando correos...' : `Agente Enviador (${leads.filter(l => ['aprobado','aprobado_propuesta','aprobado_respuesta'].includes(l.estado)).length} en cola de envío)`}</span>
 </span>
 <ChevronDown className="w-3.5 h-3.5 opacity-60 -rotate-90" />
 </button>
 <button
 type="button"
 onClick={() => {
 setIsPlacesExplorerOpen(true);
 setIsMobileToolsOpen(false);
 }}
 className="flex items-center justify-between p-2.5 rounded-[var(--r-m)] text-xs font-bold bg-[var(--acc)] text-[var(--on-acc)] hover:bg-[var(--acc)] transition-all cursor-pointer active:scale-98"
 >
 <span className="flex items-center gap-2">
 <Search className="w-4 h-4" />
 Scout Descubridor (Buscar Nuevos Leads)
 </span>
 <ChevronDown className="w-3.5 h-3.5 opacity-60 -rotate-90" />
 </button>

 <button
 type="button"
 onClick={() => {
 setIsExcelImportOpen(true);
 setIsMobileToolsOpen(false);
 }}
 className="flex items-center justify-between p-2.5 rounded-[var(--r-m)] text-xs font-bold bg-[var(--ok)]/15 hover:bg-[var(--ok)]/25 text-[var(--ink)] transition-all cursor-pointer active:scale-98"
 >
 <span className="flex items-center gap-2">
 <FileSpreadsheet className="w-4 h-4 text-[var(--ok)]" />
 Importar Excel / CSV (Bandas y Salas)
 </span>
 <ChevronDown className="w-3.5 h-3.5 opacity-60 -rotate-90" />
 </button>

 <button
 type="button"
 onClick={() => {
 setIsDuplicatesModalOpen(true);
 setIsMobileToolsOpen(false);
 }}
 className="flex items-center justify-between p-2.5 rounded-[var(--r-m)] text-xs font-bold bg-[var(--acc)]/15 hover:bg-[var(--acc)]/25 text-[var(--acc)] border-[var(--acc)]/40 transition-all cursor-pointer active:scale-98"
 >
 <span className="flex items-center gap-2">
 <Copy className="w-4 h-4 text-[var(--acc)]" />
 Detector y Limpiador de Duplicados
 </span>
 {duplicateGroupsCount > 0 ? (
 <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[var(--acc)] text-[var(--on-acc)]">
 {duplicateGroupsCount} {duplicateGroupsCount === 1 ?'grupo' :'grupos'}
 </span>
 ) : (
 <span className="text-[10px] text-[var(--ink-2)] font-normal">0 duplicados</span>
 )}
 </button>

 <button
 type="button"
 onClick={() => {
 setIsContactEnricherOpen(true);
 setIsMobileToolsOpen(false);
 }}
 className="flex items-center justify-between p-2.5 rounded-[var(--r-m)] text-xs font-bold bg-gradient-to-r from-[var(--tentative)]/60 to-[var(--acc)]/60 hover:from-[var(--tentative)]/80 hover:to-[var(--acc)]/80 text-[var(--tentative)]/40 transition-all cursor-pointer active:scale-98"
 >
 <span className="flex items-center gap-2">
 <Sparkles className="w-4 h-4 text-[var(--tentative)]" />
 Agente Enriquecedor de Contactos ({leads.filter(l => !l.email_contacto || l.email_contacto.trim() ==='').length} sin email)
 </span>
 <ChevronDown className="w-3.5 h-3.5 opacity-60 -rotate-90" />
 </button>

 <button
 type="button"
 onClick={() => {
 setIsAgentConfigOpen(true);
 setIsMobileToolsOpen(false);
 }}
 className="flex items-center justify-between p-2.5 rounded-[var(--r-m)] text-xs font-bold bg-[var(--acc)]/15 hover:bg-[var(--acc)]/25 text-[var(--ink)] transition-all cursor-pointer active:scale-98"
 >
 <span className="flex items-center gap-2">
 <Bot className="w-4 h-4 text-[var(--acc)]" />
 Configurar Agentes IA (Autonomía & Tono)
 </span>
 <ChevronDown className="w-3.5 h-3.5 opacity-60 -rotate-90" />
 </button>

 <button
 type="button"
 onClick={() => {
 setIsMobileToolsOpen(false);
 setIsExportLeadsOpen(true);
 }}
 className="flex items-center justify-center gap-1.5 p-2.5 rounded-[var(--r-m)] text-xs font-bold bg-[var(--ok-soft)] hover:bg-[var(--ok-soft)] text-[var(--ink)] transition-all cursor-pointer active:scale-98"
 >
 <Download className="w-3.5 h-3.5 text-[var(--ok)]" />
 <span>Exportar Leads (A la vista / Todos / Excel)</span>
 </button>

 <button
 type="button"
 disabled={isEnrichingAddresses}
 onClick={() => {
 setIsMobileToolsOpen(false);
 handleEnrichAddresses();
 }}
 className="flex items-center justify-center gap-1.5 p-2.5 rounded-[var(--r-m)] text-xs font-medium bg-[var(--bg)] hover:bg-[var(--surface)] text-[var(--ink)] border-[var(--hair)]700 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
 >
 <MapPin className="w-3.5 h-3.5 text-[var(--ink-2)]" />
 <span>{isEnrichingAddresses ?'Rellenando direcciones...' :'Autocompletar Direcciones'}</span>
 </button>
 </div>
 </div>
 )}

 {/* Search & View Mode Switcher Row */}
 <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
 <div className="flex-1 flex gap-2">
 {/* Search Input */}
 <div className="relative flex-1">
 <Search className="absolute left-3 top-2.5 h-4 w-4 pointer-events-none transition-colors text-[var(--acc-ink)]" />
 <input
 id="crm-search"
 type="text"
 placeholder={sectionTab ==='medios' ?"🔍 Buscar medio..." : sectionTab ==='grupos' ?"🔍 Buscar management..." :"🔍 Buscar escenario..."}
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className={`w-full rounded-[var(--r-m)] pl-9 ${searchTerm ?'pr-8' :'pr-3'} py-2 text-xs font-semibold font-sans transition-colors bg-[var(--sunken)] text-[var(--ink)] focus:ring-2 focus:ring-[var(--acc)]/40 placeholder:text-[var(--ink-2)]`}
 />
 {searchTerm && (
 <button
 id="crm-search-clear"
 type="button"
 onClick={() => setSearchTerm('')}
 className="absolute right-2.5 top-2.5 p-0.5 rounded-[var(--r-pill)] transition-colors cursor-pointer text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--sunken)]"
 title="Borrar búsqueda"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 {/* Tipo Dropdown Selector */}
 <div className="relative shrink-0">
 <select
 id="crm-type-filter-select"
 value={typeFilter}
 onChange={(e) => setTypeFilter(e.target.value as any)}
 aria-label="Filtrar por tipo"
 className={`px-3 py-2 pr-7 rounded-[var(--r-m)] text-xs font-semibold font-sans transition-colors cursor-pointer appearance-none ${
 typeFilter !=='todos'
 ?'bg-[var(--acc-soft)] text-[var(--acc-ink)] font-bold'
 :'bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 {sectionTab ==='medios' ? (
 <>
 <option value="todos">🌟 Todos los medios ({sectionLeads.length})</option>
 <option value="radio">📻 Radios</option>
 <option value="tv">📺 TV</option>
 <option value="prensa">📰 Prensa</option>
 <option value="redes">📱 Redes</option>
 <option value="podcast">🎙️ Podcasts</option>
 </>
 ) : sectionTab ==='grupos' ? (
 <>
 <option value="todos">🌟 Todas las entidades ({sectionLeads.length})</option>
 <option value="grupo">🎸 Grupos</option>
 <option value="agencia">💼 Agencias</option>
 <option value="manager">👔 Mánagers</option>
 <option value="productora">🎬 Productoras</option>
 <option value="sello">💿 Sellos</option>
 </>
 ) : (
 <>
 <option value="todos">🌟 Tipo: Todos ({sectionLeads.length})</option>
 <option value="sala">🏛️ Salas ({sectionLeads.filter(l => normalizeType(l.tipo) ==='sala').length})</option>
 <option value="festival">🎪 Festivales ({sectionLeads.filter(l => normalizeType(l.tipo) ==='festival').length})</option>
 <option value="discoteca">🪩 Discotecas ({sectionLeads.filter(l => normalizeType(l.tipo) ==='discoteca').length})</option>
 <option value="ayuntamiento">🎆 Ayuntamientos ({sectionLeads.filter(l => normalizeType(l.tipo) ==='ayuntamiento').length})</option>
 </>
 )}
 </select>
 <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-2.5 pointer-events-none opacity-60" />
 </div>

 {/* Advanced Filters Button */}
 <button
 id="toggle-filters-btn"
 type="button"
 onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
 className={`flex items-center gap-1.5 px-3 py-2 rounded-[var(--r-m)] text-xs font-bold transition-colors shrink-0 cursor-pointer ${
 activeFiltersCount > 0 || isMobileFiltersOpen
 ?'bg-[var(--acc-soft)] text-[var(--acc-ink)]'
 :'bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 title="Filtros avanzados y búsquedas guardadas"
 >
 <Filter className="w-3.5 h-3.5" />
 <span className="hidden sm:inline">Filtros</span>
 {activeFiltersCount > 0 && (
 <span className="w-4 h-4 rounded-[var(--r-pill)] bg-[var(--acc)] text-[var(--on-acc)] text-[10px] font-bold flex items-center justify-center">
 {activeFiltersCount}
 </span>
 )}
 </button>

 {/* Filter by Campaign Toggle */}
 {activeCampaign && (
 <button
 id="crm-campaign-filter-btn"
 type="button"
 onClick={() => setFilterByCampaign(!filterByCampaign)}
 className={`px-3 py-2 rounded-[var(--r-m)] text-xs font-semibold font-sans transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
 filterByCampaign
 ?'bg-[var(--acc-soft)] text-[var(--acc-ink)] font-bold'
 :'bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 title={filterByCampaign ?"Quitar filtro de campaña (ver todas las salas)" :"Filtrar únicamente salas objetivo de la campaña"}
 >
 <Target className="w-3.5 h-3.5 text-[var(--acc-ink)] shrink-0" />
 <span className="hidden sm:inline">{filterByCampaign ?'Filtro Campaña' :'Filtrar Campaña'}</span>
 {filterByCampaign && (
 <span className="px-1.5 py-0.2 rounded-[var(--r-pill)] bg-[var(--acc)]/20 text-[var(--on-acc)] text-[10px] font-semibold tabular-nums">
 {filteredLeads.length}
 </span>
 )}
 </button>
 )}
 </div>

 {/* View Mode Toggle Switcher */}
 <div className="p-1 rounded-[var(--r-m)] flex items-center justify-between sm:justify-start gap-1 shrink-0 bg-[var(--sunken)]">
 <button
 id="crm-view-grid"
 type="button"
 onClick={() => setViewMode('grid')}
 className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-sans font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
 viewMode ==='grid'
 ?'bg-[var(--acc)] text-[var(--on-acc)]'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 title="Vista en Tarjetas"
 >
 <LayoutGrid className="w-3.5 h-3.5" />
 <span>Tarjetas</span>
 </button>
 <button
 id="crm-view-table"
 type="button"
 onClick={() => setViewMode('table')}
 className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-sans font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
 viewMode ==='table'
 ?'bg-[var(--acc)] text-[var(--on-acc)]'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 title="Vista en Detalles / Tabla"
 >
 <List className="w-3.5 h-3.5" />
 <span>Detalles</span>
 </button>
 <button
 id="crm-view-map"
 type="button"
 onClick={() => setViewMode('map')}
 className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-sans font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
 viewMode ==='map'
 ?'bg-[var(--acc)] text-[var(--on-acc)]'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 title="Vista en Mapa GPS Interactivo"
 >
 <MapIcon className={`w-3.5 h-3.5 ${viewMode ==='map' ?'text-[var(--on-acc)]' :'text-[var(--ink-2)]'}`} />
 <span>Mapa</span>
 </button>
 </div>
 </div>


 </div>

 {/* Enrich Status Banner */}
 {enrichStatusMsg && (
 <div className={`p-2.5 rounded-[var(--r-m)] text-[10px] font-sans flex items-center justify-between gap-2 animate-fadeIn ${
 enrichStatusMsg.includes('¡Éxito!')
 ?'bg-[var(--ok-soft)] text-[var(--ok)]'
 :'bg-[var(--sunken)] text-[var(--ink-2)]'
 }`}>
 <div className="flex items-center gap-2">
 <MapPin className={`w-4 h-4 shrink-0 animate-bounce ${enrichStatusMsg.includes('¡Éxito!') ?'text-[var(--ok)]' :'text-[var(--ink-2)]'}`} />
 <span>{enrichStatusMsg}</span>
 </div>
 <button 
 type="button" 
 onClick={() => setEnrichStatusMsg('')}
 className="p-0.5 rounded-[var(--r-s)] hover:opacity-75 cursor-pointer"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 )}

 {/* ⚡ UNIFIED COMPACT FILTERS PANEL (Desktop, Tablet & Mobile) */}
 {isMobileFiltersOpen && (
 <div className="p-3.5 rounded-[var(--r-l)] bg-[var(--surface)] /40 space-y-3.5 animate-in slide-in-from-top-2 duration-150">
 <div className="flex items-center justify-between pb-2 border-b border-[var(--hair)]">
 <span className="text-xs font-bold text-[var(--acc)]/70 flex items-center gap-1.5">
 <Filter className="w-3.5 h-3.5" />
 Filtros y Búsquedas Avanzadas
 </span>
 <button
 type="button"
 onClick={() => setIsMobileFiltersOpen(false)}
 className="text-[var(--ink-2)] hover:text-[var(--ink)] p-1 rounded-[var(--r-s)] cursor-pointer"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 {/* 1. Quick Toggles (Favoritos, Verificados, Aforo) */}
 <div className="space-y-1.5">
 <p className="text-[10px] font-bold text-[var(--ink-2)] tracking-wider">Opciones rápidas</p>
 <div className="flex items-center gap-2 flex-wrap">
 <button
 type="button"
 onClick={() => setOnlyFavoritesFilter(!onlyFavoritesFilter)}
 className={`px-2.5 py-1.5 rounded-[var(--r-s)] text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
 onlyFavoritesFilter
 ?'bg-[var(--acc)]/20 text-[var(--acc)]/70 /50'
 :'bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 <span>⭐ Favoritos</span>
 {onlyFavoritesFilter && <X className="w-3 h-3 ml-0.5" />}
 </button>

 <button
 type="button"
 onClick={() => setOnlyVerifiedFilter(!onlyVerifiedFilter)}
 className={`px-2.5 py-1.5 rounded-[var(--r-s)] text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
 onlyVerifiedFilter
 ?'bg-[var(--acc)]/20 text-[var(--ink-3)] border-[var(--acc)]/50'
 :'bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 <span>✔ Verificados</span>
 {onlyVerifiedFilter && <X className="w-3 h-3 ml-0.5" />}
 </button>

 <div className="flex items-center gap-1.5 bg-[var(--sunken)] px-2.5 py-1.5 rounded-[var(--r-s)] text-xs">
 <span className="text-[var(--ink-2)]">Aforo mín:</span>
 <input
 type="number"
 placeholder="Ej: 300"
 value={minCapacityFilter ||''}
 onChange={(e) => setMinCapacityFilter(Number(e.target.value) || 0)}
 className="w-16 bg-transparent text-[var(--acc)] font-bold focus:outline-none"
 />
 {minCapacityFilter > 0 && (
 <button
 type="button"
 onClick={() => setMinCapacityFilter(0)}
 className="text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
 >
 <X className="w-3 h-3" />
 </button>
 )}
 </div>

 {/* Button to save current filter */}
 {!isSavingFilterOpen ? (
 <button
 type="button"
 onClick={() => setIsSavingFilterOpen(true)}
 className="px-2.5 py-1.5 bg-[var(--acc)]/15 hover:bg-[var(--acc)]/25 text-[var(--acc)] rounded-[var(--r-s)] font-bold text-xs flex items-center gap-1 transition-all border-[var(--acc)]/30 cursor-pointer"
 title="Guardar la combinación de filtros actual en 1 clic"
 >
 <BookmarkCheck className="w-3.5 h-3.5 text-[var(--acc)]" />
 <span>💾 Guardar búsqueda</span>
 </button>
 ) : (
 <form onSubmit={handleSaveCurrentFilter} className="flex items-center gap-1.5 animate-fadeIn">
 <input
 type="text"
 autoFocus
 placeholder="Nombre del filtro (ej: Salas BCN > 300)..."
 value={newFilterName}
 onChange={(e) => setNewFilterName(e.target.value)}
 className="px-2.5 py-1.5 text-xs rounded-[var(--r-s)] bg-[var(--bg)] border-[var(--acc)]/50 text-[var(--ink)] focus:outline-none w-48 sm:w-56"
 />
 <button
 type="submit"
 className="px-2.5 py-1.5 bg-[var(--ok)] hover:bg-[var(--ok)] text-[var(--ink)] rounded-[var(--r-s)] text-xs font-bold cursor-pointer"
 >
 Guardar
 </button>
 <button
 type="button"
 onClick={() => setIsSavingFilterOpen(false)}
 className="p-1.5 bg-[var(--sunken)] hover:bg-[var(--ink-3)]/60 text-[var(--ink-2)] rounded-[var(--r-s)] cursor-pointer"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </form>
 )}
 </div>
 </div>

 {/* Saved Filters List */}
 {savedFilters.length > 0 && (
 <div className="space-y-1.5">
 <p className="text-[10px] font-bold text-[var(--ink-2)] tracking-wider">Búsquedas guardadas</p>
 <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
 {savedFilters.map((sf) => {
 const isActive = activeSavedFilterId === sf.id;
 return (
 <div
 key={sf.id}
 className={`group relative shrink-0 flex items-center rounded-full transition-all cursor-pointer ${
 isActive
 ?'bg-[var(--acc)]/20 border-[var(--acc)] text-[var(--acc)] font-bold'
 :'bg-[var(--bg)]/80 hover:bg-[var(--surface)] border-[var(--hair)]800 text-[var(--ink)]'
 }`}
 >
 <button
 type="button"
 onClick={() => handleApplySavedFilter(sf)}
 className="px-3 py-1 text-xs font-sans flex items-center gap-1.5 cursor-pointer"
 >
 <span>📌 {sf.nombre}</span>
 {sf.minCapacityFilter ? (
 <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--acc)]/30 text-[var(--ink)]">
 &gt;{sf.minCapacityFilter}
 </span>
 ) : null}
 </button>
 <button
 type="button"
 onClick={(e) => handleDeleteSavedFilter(sf.id, e)}
 className="pr-2 text-[var(--ink-2)] hover:text-[var(--alert)] transition-colors p-0.5 rounded-full cursor-pointer"
 title="Eliminar filtro guardado"
 >
 <X className="w-3 h-3" />
 </button>
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* 2. Tipo Filter */}
 <div className="space-y-1.5">
 <p className="text-[10px] font-bold text-[var(--ink-2)] tracking-wider">Tipo de espacio / contacto</p>
 <div className="flex items-center gap-1.5 flex-wrap">
 {(sectionTab ==='medios'
 ? [
 { key:'todos', label:'🌟 Todos' },
 { key:'radio', label:'📻 Radio' },
 { key:'tv', label:'📺 TV' },
 { key:'prensa', label:'📰 Prensa' },
 { key:'redes', label:'📱 Redes' },
 { key:'podcast', label:'🎙️ Podcasts' }
 ] as const
 : sectionTab ==='grupos'
 ? [
 { key:'todos', label:'🌟 Todos' },
 { key:'productora', label:'🎬 Productoras' },
 { key:'manager', label:'👔 Mánagers' },
 { key:'agencia', label:'💼 Agencias' },
 { key:'sello', label:'💿 Sellos' },
 { key:'grupo', label:'🎸 Grupos' }
 ] as const
 : [
 { key:'todos', label:'🌟 Todos' },
 { key:'sala', label:'🏛️ Salas' },
 { key:'festival', label:'🎪 Festivales' },
 { key:'discoteca', label:'🪩 Discotecas' },
 { key:'ayuntamiento', label:'🎆 Ayuntamientos' }
 ] as const
 ).map(t => (
 <button
 key={t.key}
 type="button"
 onClick={() => setTypeFilter(t.key)}
 className={`px-3 py-1 rounded-[var(--r-s)] text-xs font-semibold transition-all cursor-pointer ${
 typeFilter === t.key
 ?'bg-[var(--acc)] text-[var(--on-acc)] font-bold'
 :'bg-[var(--sunken)] text-[var(--ink-2)] hover:bg-[var(--ink-3)]/60'
 }`}
 >
 {t.label}
 </button>
 ))}
 </div>
 </div>

 {/* 3. Ciudad Filter */}
 <div className="space-y-1.5">
 <div className="flex items-center justify-between">
 <p className="text-[10px] font-bold text-[var(--ink-2)] tracking-wider">Ciudad / Localidad</p>
 {selectedCityFilter && (
 <button
 type="button"
 onClick={() => setSelectedCityFilter('')}
 className="text-[10px] text-[var(--acc)] hover:underline cursor-pointer"
 >
 Ver todas
 </button>
 )}
 </div>
 <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
 <button
 type="button"
 onClick={() => setSelectedCityFilter('')}
 className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer ${
 selectedCityFilter ===''
 ?'bg-[var(--surface)] text-[var(--acc)] font-bold'
 :'bg-[var(--bg)] text-[var(--ink-2)] hover:text-[var(--ink)] border-[var(--hair)]800'
 }`}
 >
 Todas ({activeLeadsForSection.length})
 </button>
 {displayCityChips.map(cityName => {
 const isSelected = selectedCityFilter.toLowerCase() === cityName.toLowerCase();
 const count = cityCounts[cityName] || 0;
 return (
 <button
 key={cityName}
 type="button"
 onClick={() => setSelectedCityFilter(isSelected ?'' : cityName)}
 className={`px-2.5 py-1 rounded-full text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
 isSelected
 ?'bg-[var(--acc)]/20 text-[var(--acc)] font-bold border-[var(--acc)]/50'
 :'bg-[var(--bg)] text-[var(--ink-2)] hover:text-[var(--ink)] border-[var(--hair)]800'
 }`}
 >
 <span>{cityName}</span>
 {count > 0 && <span className="opacity-70 text-[10px]">({count})</span>}
 </button>
 );
 })}
 </div>
 </div>

 {/* 4. Action Buttons Footer */}
 <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--hair)]">
 <button
 type="button"
 onClick={handleClearAllFilters}
 className="text-xs text-[var(--ink-2)] hover:text-[var(--alert)] flex items-center gap-1 px-2 py-1 cursor-pointer"
 >
 <RefreshCw className="w-3 h-3" />
 <span>Limpiar filtros</span>
 </button>

 <button
 type="button"
 onClick={() => setIsMobileFiltersOpen(false)}
 className="px-4 py-1.5 rounded-[var(--r-s)] text-xs font-bold bg-[var(--acc)] text-[var(--on-acc)] cursor-pointer"
 >
 Ver {filteredLeads.length} resultados
 </button>
 </div>
 </div>
 )}

 {/* Active Filters Pill Bar (Responsive on all screen sizes) */}
 {activeFiltersCount > 0 && !isMobileFiltersOpen && (
 <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs animate-in fade-in duration-100">
 <span className="text-[10px] font-bold text-[var(--acc)] shrink-0">Filtros:</span>
 {selectedCityFilter && (
 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--acc)]/20 text-[var(--acc)]/70 shrink-0">
 📍 {selectedCityFilter}
 <button type="button" onClick={() => setSelectedCityFilter('')} className="hover:text-[var(--ink)] cursor-pointer"><X className="w-3 h-3" /></button>
 </span>
 )}
 {typeFilter !=='todos' && (
 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--acc)]/20 text-[var(--acc)]/70 shrink-0">
 🏛️ {typeFilter}
 <button type="button" onClick={() => setTypeFilter('todos')} className="hover:text-[var(--ink)] cursor-pointer"><X className="w-3 h-3" /></button>
 </span>
 )}
 {onlyFavoritesFilter && (
 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--acc)]/20 text-[var(--acc)]/70 shrink-0">
 ⭐ Favoritos
 <button type="button" onClick={() => setOnlyFavoritesFilter(false)} className="hover:text-[var(--ink)] cursor-pointer"><X className="w-3 h-3" /></button>
 </span>
 )}
 {onlyVerifiedFilter && (
 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--acc)]/20 text-[var(--ink-3)] shrink-0">
 ✔ Verificados
 <button type="button" onClick={() => setOnlyVerifiedFilter(false)} className="hover:text-[var(--ink)] cursor-pointer"><X className="w-3 h-3" /></button>
 </span>
 )}
 {minCapacityFilter > 0 && (
 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--acc)]/20 text-[var(--acc)]/70 shrink-0">
 &gt;{minCapacityFilter} pax
 <button type="button" onClick={() => setMinCapacityFilter(0)} className="hover:text-[var(--ink)] cursor-pointer"><X className="w-3 h-3" /></button>
 </span>
 )}
 {activeSavedFilterId && (
 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--acc)]/20 text-[var(--acc)] border-[var(--acc)]/50 shrink-0">
 📌 {savedFilters.find(f => f.id === activeSavedFilterId)?.nombre ||'Búsqueda guardada'}
 <button type="button" onClick={() => setActiveSavedFilterId(null)} className="hover:text-[var(--ink)] cursor-pointer"><X className="w-3 h-3" /></button>
 </span>
 )}
 <button
 type="button"
 onClick={handleClearAllFilters}
 className="text-xs text-[var(--ink-2)] hover:text-[var(--alert)] shrink-0 underline ml-1 cursor-pointer"
 >
 Limpiar todo
 </button>
 </div>
 )}

 {/* Main Status Tabs Bar (Clean, no-scrollbar, single row) */}
 <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
 {([
 { key:'todos', label:'Todos' },
 { key:'nuevo', label:'Por contactar' },
 { key:'esperando_respuesta', label:'Contactados' },
 { key:'respondido', label:'En conversación' },
 { key:'negociando', label:'Negociando' },
 { key:'confirmado', label:'Confirmados 🎉' },
 { key:'aplazado', label:'Aplazados ⏳' },
 { key:'no_interesado', label:'Descartados' }
 ] as const).map(tab => {
 const count = tab.key ==='todos' 
 ? sectionLeads.length 
 : sectionLeads.filter(l => {
 const norm = normalizeStatus(l.estado);
 if (tab.key ==='esperando_respuesta') return norm ==='esperando_respuesta' || norm ==='enviado';
 return norm === tab.key;
 }).length;
 const isSelected = statusFilter === tab.key;

 return (
 <button
 id={`crm-filter-${tab.key}`}
 key={tab.key}
 onClick={() => setStatusFilter(tab.key)}
 className={`px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-semibold transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 ${
 isSelected
 ?'bg-[var(--acc-soft)] text-[var(--acc-ink)] font-bold'
 :'text-[var(--ink-2)] hover:text-[var(--ink)] bg-[var(--sunken)]'
 }`}
 >
 <span>{tab.label}</span>
 <span className={`text-[10px] px-1.5 py-0.2 rounded-[var(--r-pill)] tabular-nums ${
 isSelected 
 ?'bg-[var(--acc)]/25 text-[var(--on-acc)]' 
 :'bg-[var(--sunken)] text-[var(--ink-2)]'
 }`}>
 {count}
 </span>
 </button>
 );
 })}
 </div>

 {/* 🎯 GMAIL-STYLE BULK ACTIONS BAR (STICKY AT TOP OF LIST) */}
 <BulkLeadsActionBar
 selectedCount={selectedLeadIds.length}
 totalFilteredCount={filteredLeads.length}
 isAllSelected={filteredLeads.length > 0 && filteredLeads.every(l => selectedLeadIds.includes(l.id))}
 onSelectAll={() => setSelectedLeadIds(filteredLeads.map(l => l.id))}
 onDeselectAll={() => setSelectedLeadIds([])}
 onBulkStatusChange={(newStatus) => {
 if (selectedLeadIds.length === 0) return;
 selectedLeadIds.forEach(id => {
 onUpdateLead(id, { estado: newStatus });
 });
 }}
 onBulkToggleFavorite={(isFav) => {
 if (selectedLeadIds.length === 0) return;
 selectedLeadIds.forEach(id => {
 onUpdateLead(id, { es_favorito: isFav });
 });
 }}
 onBulkGeneratePitches={async () => {
 const selectedList = leads.filter(l => selectedLeadIds.includes(l.id));
 if (selectedList.length === 0) return;

 const initialItems: BulkProgressItem[] = selectedList.map(l => ({
 id: l.id,
 name: l.nombre_sala,
 status:'pending'
 }));

 setBulkProgressState({
 isOpen: true,
 title:'Generando Pitches con IA Agéntica',
 subtitle:'Redactando propuestas personalizadas basadas en el ADN de la banda',
 items: initialItems,
 currentIndex: 0,
 totalCount: initialItems.length,
 isCompleted: false
 });

 const updatedItems = [...initialItems];

 for (let i = 0; i < selectedList.length; i++) {
 const targetLead = selectedList[i];
 updatedItems[i] = { ...updatedItems[i], status:'in_progress', detail:'Contactando Agente Redactor...' };
 setBulkProgressState(prev => ({ ...prev, items: [...updatedItems], currentIndex: i }));

 try {
 const campaignIsActive = Boolean(activeCampaign && (activeCampaign.isActive ?? (activeCampaign as any).is_active ?? true));
 const res = await apiFetch(`/api/leads/${targetLead.id}/regenerate-pitch`, {
 method:'POST',
 body: JSON.stringify({
 activeCampaign: campaignIsActive ? activeCampaign : undefined
 })
 });

 if (res.success && res.newPitchText) {
 onUpdateLead(targetLead.id, {
 pitch_generado: res.newPitchText,
 estado:'pendiente_aprobacion'
 });
 updatedItems[i] = {
 ...updatedItems[i],
 status:'success',
 detail: res.simulated ?'Propuesta lista (motor local ADN)' :'Propuesta redactada'
 };

 } else {
 updatedItems[i] = { ...updatedItems[i], status:'error', detail: res.error ||'No se pudo generar la propuesta' };
 }
 } catch (err: any) {
 updatedItems[i] = { ...updatedItems[i], status:'error', detail: err.message ||'Error al generar' };
 }

 setBulkProgressState(prev => ({ ...prev, items: [...updatedItems], currentIndex: i + 1 }));
 }

 setBulkProgressState(prev => ({ ...prev, isCompleted: true }));
 }}
 onBulkEnrich={async () => {
 const selectedList = leads.filter(l => selectedLeadIds.includes(l.id));
 if (selectedList.length === 0) return;

 const initialItems: BulkProgressItem[] = selectedList.map(l => ({
 id: l.id,
 name: l.nombre_sala,
 status:'pending'
 }));

 setBulkProgressState({
 isOpen: true,
 title:'Enriquecimiento Masivo con Agente Scout',
 subtitle:'Buscando datos de contacto, aforo, dirección y redes',
 items: initialItems,
 currentIndex: 0,
 totalCount: initialItems.length,
 isCompleted: false
 });

 const updatedItems = [...initialItems];

 for (let i = 0; i < selectedList.length; i++) {
 const targetLead = selectedList[i];
 updatedItems[i] = { ...updatedItems[i], status:'in_progress', detail:'Buscando datos...' };
 setBulkProgressState(prev => ({ ...prev, items: [...updatedItems], currentIndex: i }));

 try {
 const res = await apiFetch(`/api/leads/enrich-lead`, {
 method:'POST',
 body: JSON.stringify({
 name: targetLead.nombre_sala,
 city: targetLead.ciudad ||'España'
 })
 });

 if (res.success && res.data) {
 const d = res.data;
 const updates: Partial<Lead> = {};
 if (d.email && !targetLead.email_contacto) updates.email_contacto = d.email;
 if (d.phone && !targetLead.telefono) updates.telefono = d.phone;
 if (d.website && !targetLead.website) updates.website = d.website;
 if (d.capacity && !targetLead.aforo) updates.aforo = d.capacity;
 if (d.address && !targetLead.direccion) updates.direccion = d.address;
 if (d.instagram && !targetLead.instagram) updates.instagram = d.instagram;

 if (Object.keys(updates).length > 0) {
 onUpdateLead(targetLead.id, updates);
 updatedItems[i] = { ...updatedItems[i], status:'success', detail: `Actualizado: ${Object.keys(updates).join(',')}` };
 } else {
 updatedItems[i] = { ...updatedItems[i], status:'success', detail:'Ficha al día' };
 }
 } else {
 updatedItems[i] = { ...updatedItems[i], status:'success', detail:'Sin datos nuevos' };
 }
 } catch (err: any) {
 updatedItems[i] = { ...updatedItems[i], status:'error', detail: err.message ||'Error en búsqueda' };
 }

 setBulkProgressState(prev => ({ ...prev, items: [...updatedItems], currentIndex: i + 1 }));
 }

 setBulkProgressState(prev => ({ ...prev, isCompleted: true }));
 }}
 onBulkExportCsv={() => setIsExportLeadsOpen(true)}
 onBulkDelete={() => {
 if (selectedLeadIds.length === 0) return;
 const idsToDelete = [...selectedLeadIds];
 setSelectedLeadIds([]);
 if (onBulkDeleteLeads) {
 onBulkDeleteLeads(idsToDelete);
 } else if (onDeleteLead) {
 idsToDelete.forEach(id => onDeleteLead(id));
 }
 }}
 sectionTab={sectionTab}
 isStitchLight={isStitchLight}
 />

 {/* Main Display Area: Map vs List */}
 {viewMode ==='map' ? (
 <VenueMap
 leads={filteredLeads}
 selectedLead={selectedLead}
 onSelectLead={handleOpenLead}
 onUpdateLead={onUpdateLead}
 isStitchLight={isStitchLight}
 activeCityFilter={selectedCityFilter}
 activeRegionFilter=""
 />
 ) : (
 <LeadsTable
 onDeleteLead={onDeleteLead}
 leads={filteredLeads}
 selectedLead={selectedLead}
 onSelectLead={handleOpenLead}
 onUpdateLead={onUpdateLead}
 onLeadLogoUpload={(file) => handleLeadLogoUpload(file, false)}
 viewMode={viewMode ==='grid' ?'grid' :'table'}
 getStatusBadgeClass={getStatusBadgeClass}
 getStatusLabel={getStatusLabel}
 normalizeType={normalizeType}
 sectionTab={sectionTab}
 selectedLeadIds={selectedLeadIds}
 onToggleSelectLead={(id, e) => {
 if (e) e.stopPropagation();
 setSelectedLeadIds(prev =>
 prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
 );
 }}
 onSelectAllFiltered={() => {
 setSelectedLeadIds(filteredLeads.map(l => l.id));
 }}
 onDeselectAll={() => setSelectedLeadIds([])}
 isAllSelected={filteredLeads.length > 0 && filteredLeads.every(l => selectedLeadIds.includes(l.id))}
 isSomeSelected={filteredLeads.length > 0 && filteredLeads.some(l => selectedLeadIds.includes(l.id))}
 />
 )}
 </div>
 </div>

 {/* DETAILED WORKSPACE PANEL (Desktop view - rendered when a lead is selected) */}
 {selectedLead && (
 <div ref={interventionPanelRef} className="hidden lg:block space-y-6 lg:col-span-1 transition-all duration-300">
 <VenueDetailPanel
 selectedLead={selectedLead}
 onClose={() => setSelectedLead(null)}
 onUpdateLead={onUpdateLead}
 getStatusBadgeClass={getStatusBadgeClass}
 getStatusLabel={getStatusLabel}
 getStatusDotColor={getStatusDotColor}
 normalizeStatus={normalizeStatus}
 normalizeType={normalizeType}
 autoDetectVenueAddress={autoDetectVenueAddress}
 onDeleteLead={onDeleteLead}
 sectionTab={sectionTab}
 isStitchLight={isStitchLight}
 activeCampaign={activeCampaign}
 onLeadLogoUpload={(file) => handleLeadLogoUpload(file, true)}
 isUploadingLeadLogo={isUploadingLeadLogo}
 />
 </div>
 )}

 {/* MOBILE BOTTOM SHEET FOR TOUCH / SMARTPHONES */}
 <MobileBottomSheet
 selectedLead={selectedLead}
 onClose={() => setSelectedLead(null)}
 onUpdateLead={onUpdateLead}
 onDeleteLead={onDeleteLead}
 getStatusBadgeClass={getStatusBadgeClass}
 getStatusLabel={getStatusLabel}
 getStatusDotColor={getStatusDotColor}
 normalizeStatus={normalizeStatus}
 normalizeType={normalizeType}
 autoDetectVenueAddress={autoDetectVenueAddress}
 sectionTab={sectionTab}
 isStitchLight={isStitchLight}
 activeCampaign={activeCampaign}
 onLeadLogoUpload={(file) => handleLeadLogoUpload(file, true)}
 isUploadingLeadLogo={isUploadingLeadLogo}
 />
</div>

 {/* 3. EMAIL TEMPLATES & AI SETTINGS EDITOR CARD */}
 <div id="ai-template-config-section" className="bg-[var(--surface)] p-4 sm:p-5 rounded-[var(--r-l)] transition-colors">
 <div
 className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
 onClick={() => setIsTemplatesSectionOpen(!isTemplatesSectionOpen)}
 >
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-[var(--r-m)] bg-[var(--acc-soft)] flex items-center justify-center text-[var(--acc-ink)] shrink-0">
 <Settings className="w-4 h-4" />
 </div>
 <div>
 <h3 className="text-sm font-bold font-display flex items-center gap-2 text-[var(--ink)]">
 Configuración de plantillas y pautas AI (Redactor)
 </h3>
 <p className="text-[11px] font-sans mt-0.5 text-[var(--ink-2)]">
 Personaliza el correo por defecto y las directrices del Redactor AI para Salas, Festivales, Medios y Grupos.
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 setIsTemplatesSectionOpen(!isTemplatesSectionOpen);
 }}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-bold transition-colors cursor-pointer ${
 isTemplatesSectionOpen
 ?'bg-[var(--acc-soft)] text-[var(--acc-ink)]'
 :'bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 <span>{isTemplatesSectionOpen ?'Plegar' :'Configurar'}</span>
 {isTemplatesSectionOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
 </button>
 </div>
 </div>

 {isTemplatesSectionOpen && (
 <div className="mt-5 pt-4 border-t border-[var(--hair)]800/80 space-y-6">
 <div className={` pb-3 flex flex-col xl:flex-row xl:items-center justify-between gap-3 ${isStitchLight ?'-slate-100' :'-[#99907c]/15'}`}>
 <div>
 <h4 className={`text-xs font-bold font-display tracking-widest flex items-center gap-2 ${'text-[var(--acc)]'}`}>
 Pautas diferenciadas por categoría
 </h4>
 </div>

 {/* Template Tab Selector (7 Categories) */}
 <div className={`flex flex-wrap items-center gap-1 p-1 rounded-[var(--r-m)] shrink-0 ${
 isStitchLight ?'bg-[var(--sunken)]' :'bg-[var(--surface)]'
 }`}>
 {[
 { id:'salas', label:'🏛️ Salas', icon: Building2 },
 { id:'festivales', label:'🎪 Festivales', icon: Tent },
 { id:'discotecas', label:'🪩 Discotecas', icon: Disc3 },
 { id:'medios', label:'📻 Medios', icon: Radio },
 { id:'grupos', label:'🎸 Grupos', icon: Users },
 { id:'managements', label:'💼 Managements', icon: Briefcase },
 { id:'ayuntamientos', label:'🎉 Ayuntamientos', icon: Landmark }
 ].map((tab) => {
 const isActive = templateTab === tab.id;
 const IconComp = tab.icon;
 return (
 <button
 key={tab.id}
 type="button"
 id={`template-tab-${tab.id}`}
 onClick={() => setTemplateTab(tab.id as TemplateCategory)}
 className={`py-1.5 px-2.5 rounded-[var(--r-s)] text-[10px] font-sans font-bold tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
 isActive
 ? 'bg-[var(--acc)] text-[var(--on-acc)] font-extrabold'
 : isStitchLight
 ?'text-[var(--ink-2)] hover:text-[var(--ink)]'
 :'text-[var(--ink-2)] hover:text-[var(--ink-2)]'
 }`}
 >
 <IconComp className="w-3.5 h-3.5" />
 <span>{tab.label}</span>
 </button>
 );
 })}
 </div>
 </div>

 {/* Category Notice Banner */}
 {(() => {
 const activeTemplate = getActiveTemplateData();
 return (
 <>
 <div className={`p-3 rounded-[var(--r-m)] text-[10px] font-sans flex items-center justify-between ${
 templateTab ==='medios'
 ? isStitchLight ?'bg-[var(--alert)]/15 text-[var(--alert)]' :'bg-[var(--alert)]/15 text-[var(--alert)]'
 : templateTab ==='grupos'
 ? isStitchLight ? ('bg-[var(--surface)]/15 text-[var(--ok)]') :'bg-[var(--surface)]/15/30 text-[var(--ok)]'
 : templateTab ==='discotecas'
 ? isStitchLight ?'bg-[var(--acc)]/10 text-[var(--acc)]' :'bg-[var(--tentative)]/10 text-[var(--tentative)]/80'
 : templateTab ==='ayuntamientos'
 ? 'bg-[var(--acc)]/10 text-[var(--acc)]/70'
 : isStitchLight ?'bg-[var(--acc)]/15 text-[var(--ink-2)]' :'bg-[var(--acc)]/15 text-[var(--ink-2)]'
 }`}>
 <div>
 <strong>{activeTemplate.title}</strong>
 <p className="text-[10px] opacity-80 mt-0.5">
 {activeTemplate.desc}
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Form Side */}
 <div className="space-y-4">
 {optimizationFeedbackMsg && (
 <div className="p-3 bg-[var(--acc)]/15 text-[var(--ink)] text-[11px] rounded-[var(--r-m)] flex items-center justify-between font-sans animate-in fade-in">
 <span>{optimizationFeedbackMsg}</span>
 <button onClick={() => setOptimizationFeedbackMsg(null)} className="text-[var(--acc)] font-bold ml-2 hover:text-[var(--ink)] cursor-pointer">✕</button>
 </div>
 )}

 <div className="space-y-1.5">
 <label className={`block text-[10px] font-sans tracking-wider ${isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--ink)]'}`}>Asunto del Email por Defecto</label>
 <input
 id="template-subject"
 type="text"
 value={activeTemplate.subject}
 onChange={(e) => activeTemplate.setSubject(e.target.value)}
 className={`w-full rounded-[var(--r-s)] px-2 py-1 text-[10px] focus:outline-none transition-all font-sans ${
 'bg-[var(--surface)] text-[var(--ink)] focus:-[var(--acc)]/50'
 }`}
 />
 </div>

 <div className="space-y-1.5">
 <label className={`block text-[10px] font-sans tracking-wider ${isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--ink)]'}`}>Cuerpo de la Plantilla de Correo de Presentación</label>
 <textarea
 id="template-body"
 rows={8}
 value={activeTemplate.body}
 onChange={(e) => activeTemplate.setBody(e.target.value)}
 className={`w-full rounded-[var(--r-s)] p-3 text-[10px] focus:outline-none transition-all font-sans leading-relaxed ${
 'bg-[var(--surface)] text-[var(--ink)] focus:-[var(--acc)]/50'
 }`}
 placeholder="Escribe el cuerpo de la plantilla usando {{nombre_sala}}, {{ciudad}} etc..."
 />
 </div>

 <div className="space-y-1.5">
 <label className={`block text-[10px] font-sans tracking-wider flex items-center gap-1.5 ${'text-[var(--acc)]'}`}>
 <Sparkles className="w-3.5 h-3.5" /> Pautas AI (Directrices de Redacción Subjetiva)
 </label>
 <textarea
 id="template-guidelines"
 rows={3}
 value={activeTemplate.guidelines}
 onChange={(e) => activeTemplate.setGuidelines(e.target.value)}
 className={`w-full rounded-[var(--r-s)] p-3 text-[10px] focus:outline-none transition-all font-sans leading-relaxed ${
 'bg-[var(--surface)] text-[var(--ink)] focus:-[var(--accent)]/50'
 }`}
 placeholder="Ej: Mantén un tono periodístico, enfatiza el lanzamiento del single..."
 />
 </div>

 <div className="space-y-3 p-3.5 rounded-[var(--r-m)] bg-[var(--acc)]/10">
 <div className="flex items-center justify-between">
 <label className="block text-[10px] font-sans font-bold tracking-wider text-[var(--acc)]/70 flex items-center gap-1.5">
 <Star className="w-3.5 h-3.5 text-[var(--acc)] fill-amber-400/30" /> Evaluación y Entrenamiento de la Plantilla
 </label>
 {(templateToneRating > 0 || templateContentRating > 0 || templateCustomInstruction) && (
 <button 
 type="button" 
 onClick={() => {
 setTemplateToneRating(0);
 setTemplateContentRating(0);
 setTemplateCustomInstruction('');
 }}
 className="text-[9px] text-[var(--acc)] font-bold hover:underline cursor-pointer"
 >
 Limpiar todo
 </button>
 )}
 </div>

 {/* Estrellitas de Tono y Contenido */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
 {/* Tono y Estilo */}
 <div className="p-2 bg-[var(--surface)] rounded-[var(--r-s)] space-y-1">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-bold text-[var(--ink)]">Tono y Estilo</span>
 <span className="text-[10px] font-sans text-[var(--acc)] font-bold">
 {templateToneRating > 0 ? `${templateToneRating}/5` :'Sin calificar'}
 </span>
 </div>
 <div className="flex items-center gap-1">
 {[1, 2, 3, 4, 5].map((star) => (
 <button
 key={`crm-template-tone-${star}`}
 type="button"
 onClick={() => setTemplateToneRating(templateToneRating === star ? 0 : star)}
 className={`p-0.5 rounded hover:bg-[var(--acc)]/20 transition-colors cursor-pointer ${
 templateToneRating >= star ?'text-[var(--acc)]' :'text-[var(--ink-2)]'
 }`}
 title={`Calificar tono y estilo: ${star}/5`}
 >
 <Star className="w-4 h-4 fill-current" />
 </button>
 ))}
 </div>
 </div>

 {/* Contenido y Estructura */}
 <div className="p-2 bg-[var(--surface)] rounded-[var(--r-s)] space-y-1">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-bold text-[var(--ink)]">Contenido y Estructura</span>
 <span className="text-[10px] font-sans text-[var(--acc)] font-bold">
 {templateContentRating > 0 ? `${templateContentRating}/5` :'Sin calificar'}
 </span>
 </div>
 <div className="flex items-center gap-1">
 {[1, 2, 3, 4, 5].map((star) => (
 <button
 key={`crm-template-content-${star}`}
 type="button"
 onClick={() => setTemplateContentRating(templateContentRating === star ? 0 : star)}
 className={`p-0.5 rounded hover:bg-[var(--acc)]/20 transition-colors cursor-pointer ${
 templateContentRating >= star ?'text-[var(--acc)]' :'text-[var(--ink-2)]'
 }`}
 title={`Calificar contenido y estructura: ${star}/5`}
 >
 <Star className="w-4 h-4 fill-current" />
 </button>
 ))}
 </div>
 </div>
 </div>

 <div className="space-y-1 pt-1">
 <label className="block text-[10px] font-sans font-bold tracking-wider text-[var(--acc)]/70 flex items-center gap-1.5">
 <MessageSquare className="w-3.5 h-3.5 text-[var(--acc)]" /> Comentario o Corrección Directa
 </label>
 <textarea
 id="template-custom-instruction"
 rows={2}
 value={templateCustomInstruction}
 onChange={(e) => setTemplateCustomInstruction(e.target.value)}
 className="w-full rounded-[var(--r-s)] p-2.5 text-[10px] bg-[var(--surface)] text-[var(--ink)] focus: focus:outline-none font-sans leading-relaxed"
 placeholder="Ej:'Haz la plantilla de salas un 20% más corta, resalta nuestro directo enérgico sin instrumentos de viento y pide propuesta de fecha para el próximo trimestre...'"
 />
 </div>
 <div className="text-[9px] text-[var(--acc)]/70/80 font-sans leading-tight">
 💡 Califica con estrellas el tono y el contenido e introduce comentarios. Al hacer clic abajo en <strong>Regenerar</strong>, la IA usará tus valoraciones para optimizar la plantilla.
 </div>
 </div>

 <ExampleThreadsSection category={templateTab} isStitchLight={isStitchLight} textSub={textSub} />

 {/* Success Stats Badge + Reset Button */}
 {templateStats && templateStats[templateTab] && (
 <div className="space-y-2 pt-3 pb-2">
 <div className="flex flex-wrap gap-2 items-center">
 <span className="text-[9px] font-sans text-[var(--ink-2)]">📊 Resultados:</span>
 <span className={`text-[9px] font-sans px-2 py-1 rounded ${isStitchLight ?'bg-[var(--tentative)]/10 text-[var(--tentative)]' :'bg-[var(--tentative)]/10 text-[var(--acc)]/80'}`}>
 {templateStats[templateTab].totalUses} usos
 </span>
 <span className={`text-[9px] font-sans px-2 py-1 rounded ${templateStats[templateTab].responseRate >= 40 ? (isStitchLight ?'bg-[var(--ok)]/10 text-[var(--ok)]' :'bg-[var(--ok)]/10 text-[var(--ok)]') : (isStitchLight ?'bg-[var(--accent-alt)]/10 text-[var(--accent-alt)]' :'bg-[var(--accent-alt)]/10 text-[var(--acc)]/80')}`}>
 {templateStats[templateTab].positiveResponses}/{templateStats[templateTab].totalUses} respuestas ({templateStats[templateTab].responseRate}%)
 </span>
 </div>
 {(templateStats[templateTab].invalidEmails > 0 || templateStats[templateTab].bouncedEmails > 0) && (
 <div className="space-y-1">
 {templateStats[templateTab].invalidEmails > 0 && (
 <div className={`text-[9px] px-2 py-1 rounded flex items-center gap-1 ${isStitchLight ?'bg-[var(--alert)]/10 text-[var(--alert)]' :'bg-[var(--alert)]/90 text-[var(--alert)]/60'}`}>
 <span>⚠️</span>
 <span>{templateStats[templateTab].invalidEmails} emails inválidos (excluidos del cálculo)</span>
 </div>
 )}
 {templateStats[templateTab].bouncedEmails > 0 && (
 <div className={`text-[9px] px-2 py-1 rounded flex items-center gap-1 ${isStitchLight ?'bg-[var(--acc)]/10 text-[var(--accent-alt)]' :'bg-[var(--accent-alt)]/10 text-[var(--acc)]/80'}`}>
 <span>📬</span>
 <span>{templateStats[templateTab].bouncedEmails} emails rebotados (usuario no existe)</span>
 </div>
 )}
 </div>
 )}
 </div>
 )}

 <div className="flex flex-wrap gap-2 pt-2">
 <button
 id="template-btn-optimize"
 type="button"
 onClick={handleOptimizeTemplate}
 disabled={isOptimizingTemplate}
 className="py-2 px-3 bg-[var(--acc)]/10 hover:bg-[var(--acc)]/20 text-[var(--acc)]/70 rounded-[var(--r-s)] text-[10px] font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
 title="Re-redacta la plantilla y sus pautas integrando todo el feedback histórico de valoraciones del mánager"
 >
 <Sparkles className={`w-3.5 h-3.5 text-[var(--acc)] ${isOptimizingTemplate ?'animate-spin' :''}`} />
 <span>{isOptimizingTemplate ?'Regenerando con IA...' :'✨ Regenerar Plantilla con IA y Aprendizaje'}</span>
 </button>
 <button
 id="template-btn-test"
 onClick={handleTestPrompt}
 disabled={isTestingPrompt}
 className={`px-2 py-1 font-sans text-[10px] rounded-[var(--r-s)] transition-all cursor-pointer flex items-center gap-1.5 ${
 isStitchLight
 ?'bg-[var(--surface)] hover:bg-[var(--bg)] text-[var(--ink-2)]'
 :'bg-[var(--surface)] hover:-neutral-700 text-[var(--ink)]'
 }`}
 >
 {isTestingPrompt ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
 <span>Probar Prompt</span>
 </button>
 <button
 id="template-btn-reset"
 onClick={handleResetTemplate}
 className={`px-2 py-1 font-sans text-[10px] rounded-[var(--r-s)] transition-all cursor-pointer flex items-center gap-1.5 ${
 isStitchLight
 ?'bg-[var(--sunken)] hover:bg-[var(--surface)] text-[var(--ink-2)]'
 :'bg-[var(--surface)]/70 hover:bg-[var(--sunken)] text-[var(--ink)]'
 }`}
 title="Restaurar valores por defecto de esta plantilla"
 >
 <RotateCcw className="w-3 h-3" />
 <span>Restaurar</span>
 </button>
 <button
 id="template-btn-save"
 onClick={handleSaveTemplates}
 className={`flex-1 py-2 font-sans font-bold text-[10px] tracking-wider rounded-[var(--r-s)] transition-all cursor-pointer text-center active:scale-95 ${
 'bg-[var(--sunken)] hover:bg-[var(--ink-3)]/60 text-[var(--ink)]/10'
 }`}
 >
 Guardar Plantillas y Directrices
 </button>
 </div>
 </div>

 {/* Test / Prompt Output side */}
 <div className={` rounded-[var(--r-m)] p-4 flex flex-col justify-between ${
 isStitchLight
 ?'bg-[var(--bg)]'
 :'bg-[var(--surface)]'
 }`}>
 <div className="space-y-3">
 <div className={`flex items-center gap-2 pb-2 ${isStitchLight ?'-slate-200' :'-bg-[var(--surface)]'}`}>
 <span className={`w-1.5 h-1.5 rounded-full ${'bg-[var(--acc)]'}`} />
 <h4 className={`text-[10px] font-sans tracking-widest ${textSub}`}>Sandbox de Simulación de Redacción AI</h4>
 </div>
 
 <div className={`text-[10px] leading-relaxed font-sans ${textSub}`}>
 Cuando el agente de Supabase <strong>"Redactor"</strong> corre, lee estas plantillas y pautas, las mezcla con los detalles del contacto capturado por el <strong>"Scout"</strong> (aforo, ubicación, género, redes) y genera un borrador adaptado para que lo revises en esta misma pantalla.
 </div>

 {testPromptResult ? (
 <div className="space-y-3">
 <div className={`rounded-[var(--r-s)] p-3.5 text-[10px] font-sans whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto animate-in fade-in duration-300 select-text ${
 isStitchLight
 ?'bg-[var(--surface)] text-[var(--ink-2)]'
 :'bg-[var(--surface)] text-[var(--ink)]'
 }`}>
 {testPromptResult}
 </div>

 {/* Valoración directa del resultado generado en la simulación */}
 <div className="p-3 bg-[var(--acc)]/10 rounded-[var(--r-m)] space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-bold text-[var(--acc)]/70 tracking-wider flex items-center gap-1.5 font-sans">
 <Star className="w-3.5 h-3.5 text-[var(--acc)] fill-amber-400/30" /> Valorar esta plantilla / resultado
 </span>
 {(templateToneRating > 0 || templateContentRating > 0) && (
 <span className="text-[9px] text-[var(--acc)] font-sans">
 Tono: {templateToneRating ||'-'}/5 | Contenido: {templateContentRating ||'-'}/5
 </span>
 )}
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 {/* Tono */}
 <div className="p-2 bg-[var(--surface)] rounded-[var(--r-s)] space-y-1">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-bold text-[var(--ink)]">Tono y Estilo</span>
 <span className="text-[10px] font-sans text-[var(--acc)] font-bold">
 {templateToneRating > 0 ? `${templateToneRating}/5` :'⭐'}
 </span>
 </div>
 <div className="flex items-center gap-1">
 {[1, 2, 3, 4, 5].map((star) => (
 <button
 key={`sandbox-tone-${star}`}
 type="button"
 onClick={() => setTemplateToneRating(templateToneRating === star ? 0 : star)}
 className={`p-0.5 rounded hover:bg-[var(--acc)]/20 transition-colors cursor-pointer ${
 templateToneRating >= star ?'text-[var(--acc)]' :'text-[var(--ink-2)]'
 }`}
 title={`Calificar tono: ${star}/5`}
 >
 <Star className="w-4 h-4 fill-current" />
 </button>
 ))}
 </div>
 </div>

 {/* Contenido */}
 <div className="p-2 bg-[var(--surface)] rounded-[var(--r-s)] space-y-1">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-bold text-[var(--ink)]">Contenido y Estructura</span>
 <span className="text-[10px] font-sans text-[var(--acc)] font-bold">
 {templateContentRating > 0 ? `${templateContentRating}/5` :'⭐'}
 </span>
 </div>
 <div className="flex items-center gap-1">
 {[1, 2, 3, 4, 5].map((star) => (
 <button
 key={`sandbox-content-${star}`}
 type="button"
 onClick={() => setTemplateContentRating(templateContentRating === star ? 0 : star)}
 className={`p-0.5 rounded hover:bg-[var(--acc)]/20 transition-colors cursor-pointer ${
 templateContentRating >= star ?'text-[var(--acc)]' :'text-[var(--ink-2)]'
 }`}
 title={`Calificar contenido: ${star}/5`}
 >
 <Star className="w-4 h-4 fill-current" />
 </button>
 ))}
 </div>
 </div>
 </div>

 <button
 type="button"
 onClick={handleOptimizeTemplate}
 disabled={isOptimizingTemplate}
 className="w-full py-1.5 px-3 bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--on-acc)] font-bold text-[10px] rounded-[var(--r-s)] flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
 >
 <Sparkles className={`w-3.5 h-3.5 ${isOptimizingTemplate ?'animate-spin' :''}`} />
 <span>Re-generar plantilla usando estas valoraciones ✨</span>
 </button>
 </div>
 </div>
 ) : (
 <div className={`border-2 border-dashed rounded-[var(--r-s)] p-12 text-center text-[10px] font-sans ${
 isStitchLight
 ?' text-[var(--ink-2)]'
 :' text-[var(--ink-2)]'
 }`}>
 Haz clic en"Probar Prompt" a la izquierda para simular el resultado de generación del Redactor AI basado en tus directrices actuales.
 </div>
 )}
 </div>

 <div className={`text-[10px] font-sans mt-4 leading-normal text-right ${textMuted}`}>
 Módulo de Modelado AI de BandManager. Powered by Gemini.
 </div>
 </div>
 </div>
 </>
 );
 })()}
 </div>
 )}

 </div>

 {/* ADD NEW LEAD / MEDIO MODAL */}
 <NegotiationSimulationModal
 isOpen={isSimulatingAvanzado}
 selectedLead={selectedLead}
 isStitchLight={isStitchLight}
 textSub={textSub}
 textMuted={textMuted}
 simulationRole={simulationRole}
 simulationScenario={simulationScenario}
 simulationSenderName={simulationSenderName}
 simulationSubject={simulationSubject}
 simulationCustomInstruction={simulationCustomInstruction}
 simulationMessage={simulationMessage}
 simulationGenerated={simulationGenerated}
 isGeneratingSimulation={isGeneratingSimulation}
 predefinedScenarios={PREDEFINED_SCENARIOS}
 onClose={() => setIsSimulatingAvanzado(false)}
 onRoleChange={handleRoleChange}
 onScenarioChange={handleScenarioChange}
 onSenderNameChange={setSimulationSenderName}
 onSubjectChange={setSimulationSubject}
 onCustomInstructionChange={setSimulationCustomInstruction}
 onMessageChange={setSimulationMessage}
 onGenerate={handleGenerateSimulationEmail}
 onCommit={handleCommitSimulation}
 />

 <AddLeadModal
 isOpen={isAddingLeadModalOpen}
 sectionTab={sectionTab}
 isStitchLight={isStitchLight}
 textSub={textSub}
 newLeadData={newLeadData}
 setNewLeadData={setNewLeadData}
 isModalScraping={isModalScraping}
 modalScrapeStatus={modalScrapeStatus}
 modalScrapeError={modalScrapeError}
 modalScrapeSuccessMsg={modalScrapeSuccessMsg}
 isUploadingLeadLogo={isUploadingLeadLogo}
 onClose={() => setIsAddingLeadModalOpen(false)}
 onSubmit={handleAddNewLeadSubmit}
 onModalScrape={handleModalScrape}
 onLeadLogoUpload={(file) => handleLeadLogoUpload(file, false)}
 />

 <GooglePlacesExplorerModal
 isOpen={isPlacesExplorerOpen}
 isStitchLight={isStitchLight}
 existingLeads={leads}
 activeCampaign={activeCampaign}
 bandGenre={epkConfig?.genero || (currentUser as any)?.genero ||''}
 bandName={effectiveBandName}
 onClose={() => setIsPlacesExplorerOpen(false)}
 onImportLeads={() => {
 window.dispatchEvent(new CustomEvent('app-data-updated'));
 }}
 />

 <ExcelImportModal
 isOpen={isExcelImportOpen}
 isStitchLight={isStitchLight}
 existingLeads={leads}
 onClose={() => setIsExcelImportOpen(false)}
 onSuccess={(importedLeads, updatedCount) => {
 window.dispatchEvent(new CustomEvent('app-data-updated'));
 if (importedLeads.length > 0 && onAddLead) {
 importedLeads.forEach(l => onAddLead(l));
 }
 }}
 />

 <CRMContactEnricherModal
 isOpen={isContactEnricherOpen}
 onClose={() => setIsContactEnricherOpen(false)}
 leads={leads}
 onUpdateLead={onUpdateLead}
 isStitchLight={isStitchLight}
 />

 <AgentAutonomySettingsModal
 isOpen={isAgentConfigOpen}
 onClose={() => setIsAgentConfigOpen(false)}
 bandName={effectiveBandName}
 bandId={currentBandId || currentUser?.band_id ||''}
 currentUser={currentUser}
 isStitchLight={isStitchLight}
 onOpenTemplatesSection={() => {
 setIsTemplatesSectionOpen(true);
 setTimeout(() => {
 const el = document.getElementById('ai-template-config-section');
 if (el) el.scrollIntoView({ behavior:'smooth' });
 }, 50);
 }}
 />

 <ExportLeadsModal
 isOpen={isExportLeadsOpen}
 onClose={() => setIsExportLeadsOpen(false)}
 allLeads={leads}
 filteredLeads={filteredLeads}
 selectedLeadIds={selectedLeadIds}
 bandName={effectiveBandName}
 />

 <LeadDuplicatesModal
 isOpen={isDuplicatesModalOpen}
 onClose={() => setIsDuplicatesModalOpen(false)}
 leads={leads}
 onUpdateLead={(lead) => onUpdateLead(lead.id, lead)}
 onDeleteLead={onDeleteLead}
 isStitchLight={isStitchLight}
 />



 {/* BULK PROGRESS MODAL */}
 <BulkProgressModal
 isOpen={bulkProgressState.isOpen}
 onClose={() => setBulkProgressState(prev => ({ ...prev, isOpen: false }))}
 title={bulkProgressState.title}
 subtitle={bulkProgressState.subtitle}
 items={bulkProgressState.items}
 currentIndex={bulkProgressState.currentIndex}
 totalCount={bulkProgressState.totalCount}
 isCompleted={bulkProgressState.isCompleted}
 />

 {/* MODULE TUTORIAL MODAL */}
 <ModuleTutorialModal
 isOpen={bookingTutorial.isOpen}
 onClose={bookingTutorial.closeTutorial}
 moduleId="booking"
 />

 </div>
 );
}
