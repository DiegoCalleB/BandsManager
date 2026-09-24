import React, { useState, useEffect, useMemo } from 'react';
import { Lead, LeadStatus, LeadType, ThemeColors, EPKConfig, Concert, Tour } from '../types';
import DirectionsCard from './DirectionsCard';
import { apiFetch } from '../utils/api';
import { uploadFileToServer } from '../utils/audioStorage';
import { useSavedFilters } from '../hooks/useSavedFilters';
import { useCityChips } from '../hooks/useCityChips';
import { useInteractionLog } from '../hooks/useInteractionLog';
import { useEmailTemplates, TemplateCategory } from '../hooks/useEmailTemplates';
import { useGmailIntegration } from '../hooks/useGmailIntegration';
import { useNegotiationSimulation } from '../hooks/useNegotiationSimulation';
import {
 Target, Search, ShieldCheck, Mail, Clock, Check, X, RefreshCw, RotateCcw,
 MapPin, Users, Bot, MessageSquare, MessageSquareText, Edit3, Settings, Sparkles, Send, LogOut, Loader2, Building, Radio, Building2, Tent, Landmark, Disc3, Briefcase,
 PlusCircle, Newspaper, Tv, Headphones, Globe, FileText, Plus, SlidersHorizontal, Map as MapIcon, List, LayoutGrid,
 Share2, Repeat, Truck, Handshake, Music, Zap, Upload, Image as ImageIcon, Download, Phone, PhoneCall, MessageCircle, Bookmark, BookmarkCheck, Filter, Trash2, History, Calendar, ListFilter, CheckCircle2, Save, Star, ChevronDown, ChevronUp, Wrench, FileSpreadsheet, Copy, Wand2, Activity
} from 'lucide-react';
import { VenueMap } from './VenueMap';
import { AddLeadModal } from './booking/AddLeadModal';
import { GooglePlacesExplorerModal } from './booking/GooglePlacesExplorerModal';
import { CRMContactEnricherModal } from './booking/CRMContactEnricherModal';
import { ExcelImportModal } from './booking/ExcelImportModal';
import { ExportLeadsModal } from './booking/ExportLeadsModal';
import { LeadDuplicatesModal } from './booking/LeadDuplicatesModal';
import { findDuplicateLeads } from '../utils/duplicateLeads';
import { Compass } from 'lucide-react';
import { isLeadNeedsFollowup } from '../utils/bookingFollowup';
import { areCitiesLogisticallyCompatible } from '../utils/tourRouting';
import { TemplateConfigSection } from './booking/TemplateConfigSection';
import { TemplateRecommendationsCard } from './booking/TemplateRecommendationsCard';
import { ExampleThreadsSection } from './booking/ExampleThreadsSection';
import { NegotiationSimulationModal } from './booking/NegotiationSimulationModal';
import { GenerateAllTemplatesModal } from './booking/GenerateAllTemplatesModal';
import { LeadsTable } from './booking/LeadsTable';
import { VenueDetailPanel } from './booking/VenueDetailPanel';
import { MobileBottomSheet } from './booking/MobileBottomSheet';
import { MorningBriefingRadar } from './booking/MorningBriefingRadar';
import { RoadbookContractModal } from './booking/RoadbookContractModal';
import { isLeadVerificado } from '../utils/leadReliability';
import { leadMatchesCampaignCity, leadMatchesCampaignCapacity, leadMatchesCampaignDates } from '../utils/campaignMatch';
import { AgentAutonomySettingsModal } from './dashboard/AgentAutonomySettingsModal';
import { BookingCampaign } from '../types';
import { BulkLeadsActionBar } from './booking/BulkLeadsActionBar';
import { BulkProgressModal, BulkProgressItem } from './booking/BulkProgressModal';
import { AgentQueueMonitorModal } from './booking/AgentQueueMonitorModal';
import { useModuleTutorial } from '../hooks/useModuleTutorial';
import { ModuleTutorialTrigger } from './common/ModuleTutorialTrigger';
import { ModuleTutorialModal } from './common/ModuleTutorialModal';
const matchesMedioType = (l: Lead, filter: string): boolean => {
  if (!filter || filter === 'todos') return true;
  const txt = `${l.genero || ''} ${l.nombre_sala || ''} ${l.tipo || ''} ${l.icono || ''} ${l.notas || ''} ${l.contexto_extra || ''}`.toLowerCase();
  if (filter === 'radio') return txt.includes('radio') || txt.includes('emisora') || txt.includes('fm') || txt.includes('am') || txt.includes('ser') || txt.includes('cope') || txt.includes('ondacero') || txt.includes('📻');
  if (filter === 'tv' || filter === 'television') return txt.includes('tv') || txt.includes('televis') || txt.includes('rtv') || txt.includes('tele') || txt.includes('canal') || txt.includes('📺');
  if (filter === 'prensa') return txt.includes('prensa') || txt.includes('revista') || txt.includes('periódico') || txt.includes('periodico') || txt.includes('diario') || txt.includes('blog') || txt.includes('magazine') || txt.includes('fanzine') || txt.includes('web') || txt.includes('noticias') || txt.includes('redacción') || txt.includes('redaccion') || txt.includes('📰');
  if (filter === 'redes') return txt.includes('redes') || txt.includes('social') || txt.includes('instagram') || txt.includes('youtube') || txt.includes('tiktok') || txt.includes('twitter') || txt.includes('influencer') || txt.includes('creador') || txt.includes('📱');
  if (filter === 'podcast' || filter === 'podcasts') return txt.includes('podcast') || txt.includes('entrevista') || txt.includes('ivoox') || txt.includes('spotify') || txt.includes('audio') || txt.includes('🎙️');
  return true;
};

const matchesGruposType = (l: Lead, filter: string): boolean => {
  if (!filter || filter === 'todos') return true;
  const norm = normalizeType(l.tipo);
  if (norm === filter) return true;
  const txt = `${l.genero || ''} ${l.nombre_sala || ''} ${l.tipo || ''} ${l.icono || ''} ${l.notas || ''} ${l.contexto_extra || ''}`.toLowerCase();
  if (filter === 'grupo') return norm === 'grupo' || txt.includes('grupo') || txt.includes('banda') || txt.includes('artista') || txt.includes('co-booking') || txt.includes('músico') || txt.includes('musico') || txt.includes('🎸');
  if (filter === 'agencia') return norm === 'agencia' || txt.includes('agencia') || txt.includes('agency') || txt.includes('booking') || txt.includes('promotora') || txt.includes('💼');
  if (filter === 'manager') return norm === 'manager' || txt.includes('manager') || txt.includes('mánager') || txt.includes('management') || txt.includes('representante') || txt.includes('👔');
  if (filter === 'productora') return norm === 'productora' || txt.includes('productora') || txt.includes('producciones') || txt.includes('production') || txt.includes('eventos') || txt.includes('🎬');
  if (filter === 'sello') return norm === 'sello' || txt.includes('sello') || txt.includes('discográfica') || txt.includes('discografica') || txt.includes('record') || txt.includes('label') || txt.includes('💿');
  return true;
};

interface BookingCRMProps {
  leads: Lead[];
  colors: ThemeColors;
  onUpdateLead: (leadId: string, updatedFields: Partial<Lead>, expectedStatus?: string) => void;
  onAddLead?: (lead: Lead) => void;
  onDeleteLead?: (id: string) => void;
  onBulkDeleteLeads?: (ids: string[]) => void;
  initialSection?: 'salas' | 'medios' | 'grupos';
  onSectionChange?: (section: 'salas' | 'medios' | 'grupos' | 'bandas') => void;
  onNavigate?: (view: any, options?: any) => void;
  bandsCount?: number;
  initialStatusFilter?: LeadStatus | 'todos';
  initialSelectedLeadId?: string;
  epkConfig?: Partial<EPKConfig>;
  onUpdateEpkConfig?: (newConfig: Partial<EPKConfig>) => void;
  currentBandId?: string;
  currentUser?: any;
  bandName?: string;
  activeCampaign?: BookingCampaign | null;
  onCampaignChange?: (campaign: BookingCampaign | null) => void;
  concerts?: Concert[];
  tours?: Tour[];
}

import {
  normalizeStatus,
  normalizeType,
  autoDetectVenueAddress,
  VENUE_ADDRESS_DATABASE
} from '../utils/bookingUtils';
import { leadStatusDotColor, leadStatusBadgeClass, leadStatusLabel } from '../utils/leadStatusPresentation';

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
  initialSection = 'salas',
  onSectionChange,
  onNavigate,
  bandsCount,
  initialStatusFilter = 'todos',
  initialSelectedLeadId,
  epkConfig,
  onUpdateEpkConfig,
  currentBandId,
  currentUser,
  bandName,
  activeCampaign,
  onCampaignChange,
  concerts = [],
  tours = []
}: BookingCRMProps) {
  const bookingTutorial = useModuleTutorial('booking');
  const effectiveBandName = bandName || 'Tu Banda';
  const [sectionTab, setSectionTab] = useState<'salas' | 'medios' | 'grupos'>(initialSection || 'salas');

  const handleSelectSectionTab = (tab: 'salas' | 'medios' | 'grupos') => {
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
 const [routeAnchorCity, setRouteAnchorCity] = useState<string | null>(null);

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
 interventionPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
 }
 }, 150);
 }
 }
 }, [initialSelectedLeadId, leads]);

 const [viewMode, setViewMode] = useState<'grid' | 'table' | 'map'>('table');

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
   title: '',
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
    isGeneratingAllTemplates, handleGenerateAllFromBase,
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

  const [crmTemplateSubTab, setCrmTemplateSubTab] = useState<'plantilla' | 'hilos'>('plantilla');
  const [isMultiTemplatesModalOpen, setIsMultiTemplatesModalOpen] = useState(false);

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
      if (sectionTab === 'salas') {
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
 const detected = autoDetectVenueAddress(selectedLead.nombre_sala, selectedLead.ciudad || '');
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
 const [isQueueMonitorOpen, setIsQueueMonitorOpen] = useState(false);
 const duplicateGroups = useMemo(() => findDuplicateLeads(leads), [leads]);
 const duplicateGroupsCount = duplicateGroups.length;
 const [isDispatchingEmails, setIsDispatchingEmails] = useState(false);

 // Roadbook & Contract Modal State
 const [isRoadbookModalOpen, setIsRoadbookModalOpen] = useState(false);
 const [roadbookModalLead, setRoadbookModalLead] = useState<Lead | null>(null);
 const [venueDetailInitialTab, setVenueDetailInitialTab] = useState<'info' | 'emails' | 'copilot' | 'bitacora'>('info');

 const handleTriggerEnviadorAgent = async (leadId?: string) => {
   setIsDispatchingEmails(true);
   try {
     const data = await apiFetch('/api/trigger-agent', {
       method: 'POST',
       body: JSON.stringify({
         agentName: 'enviador',
         params: { id: leadId, trigger_type: 'usuario_manual' }
       })
     });

     try {
       window.dispatchEvent(new CustomEvent('app-data-updated'));
     } catch (_) {}

     if (data.dispatchedCount > 0) {
       alert(`¡Agente Enviador ejecutado con éxito! ${data.message || ''}`);
     } else if (data.results && data.results.some((r: any) => r.status === 'error')) {
       const errMsgs = data.results.filter((r: any) => r.status === 'error').map((r: any) => `${r.nombre_sala}: ${r.error}`).join('\n');
       alert(`Aviso del Agente Enviador:\n${data.message || ''}\n\nDetalles:\n${errMsgs}`);
     } else {
       alert(data.message || 'No se encontraron correos aprobados pendientes de despacho.');
     }
   } catch (err: any) {
     console.error('Error al ejecutar Agente Enviador:', err);
     alert(`Error al ejecutar el Agente Enviador: ${err.message || 'Error de conexión'}`);
   } finally {
     setIsDispatchingEmails(false);
   }
 };
 const [isAddingLeadModalOpen, setIsAddingLeadModalOpen] = useState(false);
 const [newLeadData, setNewLeadData] = useState({
 nombre_sala: '',
 ciudad: '',
 region: 'Nacional',
 direccion: '',
 aforo: 0,
 tipo: 'medio' as LeadType,
 email_contacto: '',
 email_secundario: '',
 telefono: '',
 telefono_movil: '',
 telefono_fijo: '',
 website: '',
 instagram: '',
 fuente: '',
 genero: 'Radio',
 notas: '',
 pitch_generado: '',
 icono: '📻',
 imagen_url: ''
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
    const url = await uploadFileToServer(file, { bandId: targetBandId, category: 'leads' });
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
 const [activeTab, setActiveTab] = useState<'info' | 'emails' | 'copilot' | 'bitacora'>('info');
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
 method: 'POST',
 headers: { 'Content-Type': 'application/json' }
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
 return norm === 'medio' || norm === 'productora';
 };

 const isStitchLight = colors.name?.toLowerCase().includes('light') || colors.bg.includes('f8fafc') || colors.bg.includes('white') || colors.bg.includes('slate-50') || false;

 // Filter leads by active section tab
 const sectionLeads = useMemo(() => {
    const seen = new Set<string>();
    const isGruposType = (norm: string) => ['grupo', 'agencia', 'manager', 'productora', 'sello'].includes(norm);
    return (leads || []).filter(lead => {
      if (!lead) return false;
      const leadKey = lead.id ? String(lead.id).trim() : null;
      if (leadKey && seen.has(leadKey)) return false;
      if (leadKey) seen.add(leadKey);

      const norm = normalizeType(lead.tipo);
      if (sectionTab === 'medios') return norm === 'medio';
      if (sectionTab === 'grupos') return isGruposType(norm);
      return norm !== 'medio' && !isGruposType(norm);
    });
  }, [leads, sectionTab]);

 const filteredLeads = useMemo(() => {
   const seen = new Set<string>();
   return sectionLeads.filter((lead, idx) => {
     const leadKey = lead.id ? String(lead.id).trim() : `lead-${idx}`;
     if (seen.has(leadKey)) return false;
     seen.add(leadKey);

     if (sectionTab === 'salas' && filterByCampaign && activeCampaign && (activeCampaign.isActive ?? (activeCampaign as any).is_active ?? true)) {
        // El filtrado por aforo, fechas y ciudad de campaña solo aplica a recintos y festivales (salas),
        // ya que los medios de comunicación y bandas no tienen aforo ni fechas de evento en campaña.
        if (!leadMatchesCampaignCity(lead, activeCampaign) || !leadMatchesCampaignCapacity(lead, activeCampaign) || !leadMatchesCampaignDates(lead, activeCampaign)) return false;
     }

     const matchesSearch = (lead.nombre_sala || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
       (lead.ciudad || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
       (lead.region || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
       (lead.email_contacto && lead.email_contacto.toLowerCase().includes(searchTerm.toLowerCase()));
     const normSt = normalizeStatus(lead.estado);
     const matchesStatus = statusFilter === 'todos' || 
       (statusFilter === 'seguimientos' ? isLeadNeedsFollowup(lead) : (
         normSt === statusFilter || 
         (statusFilter === 'pendiente_aprobacion' && normSt === 'nuevo' && !!lead.pitch_generado)
       ));

     const matchesType = typeFilter === 'todos'
       ? true
       : sectionTab === 'medios'
       ? matchesMedioType(lead, typeFilter)
       : sectionTab === 'grupos'
       ? matchesGruposType(lead, typeFilter)
       : normalizeType(lead.tipo) === typeFilter;
     const matchesCity = !selectedCityFilter || 
       (lead.ciudad || '').toLowerCase().includes(selectedCityFilter.toLowerCase()) || 
       (lead.region || '').toLowerCase().includes(selectedCityFilter.toLowerCase());
     const matchesCapacity = !minCapacityFilter || ((lead.aforo || 0) >= minCapacityFilter);
     const matchesRoute = !routeAnchorCity || areCitiesLogisticallyCompatible(routeAnchorCity, lead.ciudad || lead.region || '');
     return matchesSearch && matchesStatus && matchesType && matchesCity && matchesCapacity && matchesRoute;
   });
 }, [sectionLeads, searchTerm, statusFilter, typeFilter, selectedCityFilter, minCapacityFilter, sectionTab, filterByCampaign, activeCampaign, routeAnchorCity]);

 const handleModalScrape = async () => {
 if (!newLeadData.nombre_sala.trim()) {
 alert('Por favor, escribe al menos el nombre de la sala o medio para que el Agente Scout pueda buscar en Google.');
 return;
 }

 setIsModalScraping(true);
 setModalScrapeStatus('Consultando Google Places API & Extraedor de Emails IA...');
 setModalScrapeError('');
 setModalScrapeSuccessMsg('');

 const steps = [
"Buscando sitio oficial y directorio de salas...",
"Extrayendo emails de programación y prensa...",
"Obteniendo teléfono y datos de ubicación...",
"Consolidando ficha encontrada..."
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
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
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
 const getVal = (f: any) => typeof f === 'object' && f !== null ? f.valor : (f || '');
 const emailVal = getVal(resData.data.email_contacto);
 const telVal = getVal(resData.data.telefono);
 const isMobile = telVal && /^(?:\+?34\s*)?[67]/.test(telVal.trim());
 const isLandline = telVal && /^(?:\+?34\s*)?[89]/.test(telVal.trim());
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
 telefono_movil: isMobile ? telVal : prev.telefono_movil,
 telefono_fijo: isLandline ? telVal : prev.telefono_fijo,
 website: webVal || prev.website,
 region: regionVal || prev.region,
 aforo: (aforoVal && !isNaN(Number(aforoVal))) ? Number(aforoVal) : prev.aforo,
 genero: generoVal || prev.genero,
 imagen_url: imgVal || prev.imagen_url,
 icono: iconVal || prev.icono,
 notas: prev.notas ? `${prev.notas} | Scout: ${resData.data.source_info || 'IA Grounding'}` : `Scout IA: ${resData.data.source_info || 'IA Grounding'}`
 }));

 setModalScrapeSuccessMsg(
 `¡Éxito! Email: ${emailVal || 'No hallado'} | Tel: ${telVal || 'No hallado'} | Web: ${webVal || 'No hallado'}`
 );
 } else {
 setModalScrapeError(resData.error || 'No se pudieron recuperar datos con la IA Scout.');
 }
 } else {
 const errJson = await res.json().catch(() => null);
 setModalScrapeError(errJson?.error || `Error ${res.status}: Fallo de respuesta del servidor.`);
 }
 } catch (err: any) {
 clearInterval(interval);
 setModalScrapeError(err.message || 'Error de conexión con el Agente Scout.');
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

 const steps = [
"Buscando sitio oficial de la sala / medio...",
"Rastreando contactos de programación y teléfono...",
"Consolidando nivel de confianza de datos..."
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
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
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
 setScrapingLeadError(resData.error || 'No se lograron extraer datos de contacto.');
 }
 } else {
 const errJson = await res.json().catch(() => null);
 setScrapingLeadError(errJson?.error || `Error ${res.status}: Fallo de respuesta del servidor.`);
 }
 } catch (err: any) {
 clearInterval(interval);
 setScrapingLeadError(err.message || 'Fallo de conexión con Agente Scout.');
 } finally {
 setIsScrapingLead(false);
 }
 };

 const handleApplyScrapedToSelectedLead = () => {
 if (!selectedLead || !scrapedDataForLead) return;
 const getVal = (f: any) => typeof f === 'object' && f !== null ? f.valor : (f || '');

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
 const sourceSummary = typeof scrapedDataForLead.source_info === 'string' ? scrapedDataForLead.source_info : 'Rastreo web Agente Scout';
 const updatedNotes = `*** [${today}] Ficha enriquecida vía Agente Scout. ${sourceSummary} ***\n${selectedLead.notas || ''}`;

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
 ciudad: newLeadData.ciudad || 'Nacional',
 region: newLeadData.region || 'Nacional',
 aforo: newLeadData.aforo || 0,
 genero: newLeadData.genero || (sectionTab === 'medios' ? 'Radio' : 'Música en directo'),
 tipo: sectionTab === 'medios' ? 'medio' : newLeadData.tipo,
 email_contacto: newLeadData.email_contacto || '',
 email_secundario: newLeadData.email_secundario || '',
 telefono: newLeadData.telefono || newLeadData.telefono_movil || newLeadData.telefono_fijo || '',
 telefono_movil: newLeadData.telefono_movil || '',
 telefono_fijo: newLeadData.telefono_fijo || '',
 instagram: newLeadData.instagram || '',
 website: newLeadData.website || '',
 icono: newLeadData.icono || (sectionTab === 'medios' ? '📻' : '🏛️'),
 imagen_url: newLeadData.imagen_url || '',
 fuente: 'Alta Manual CRM',
 estado: 'nuevo',
 pitch_generado: newLeadData.pitch_generado || (sectionTab === 'medios' 
 ? `Asunto: Nota de Prensa: ${effectiveBandName} presenta su directo\n\nEstimada redacción / equipo de ${newLeadData.nombre_sala},\n\nOs remitimos la información de la propuesta musical de ${effectiveBandName}...`
 : `Asunto: Propuesta de concierto: ${effectiveBandName} en ${newLeadData.nombre_sala}\n\nHola equipo de booking,\n\nSomos la banda ${effectiveBandName}...`),
 notas: newLeadData.notas || `Añadido desde la sección ${sectionTab === 'medios' ? 'Medios' : 'Salas'} el ${new Date().toISOString().split('T')[0]}`
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

 const handleOpenLead = (lead: Lead, options?: { tab?: 'info' | 'emails' | 'copilot' | 'bitacora'; pitchDraft?: string }) => {
  setSelectedLead(lead);
  if (options?.pitchDraft) {
    setEditedPitch(options.pitchDraft);
  } else {
    setEditedPitch(lead.pitch_generado || '');
  }
  setIsEditingPitch(false);
  setIsEditingLeadInfo(false);
  setIsRejecting(false);
  setRejectionNotes('');
  
  const targetTab = options?.tab || (lead.estado === 'negociando' || lead.estado === 'interesado' ? 'emails' : 'info');
  setActiveTab(targetTab);
  setVenueDetailInitialTab(targetTab);
  setManualEmailBody('');
  setManualEmailSubject(lead.hilo_emails && lead.hilo_emails.length > 0 ? `RE: ${lead.hilo_emails[lead.hilo_emails.length - 1].asunto}` : `Propuesta de concierto: ${effectiveBandName}`);
  setManualEmailStatus('');

  setTimeout(() => {
  interventionPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
 };

  const handleDeleteSingleLead = (id: string, name?: string) => {
    const leadToDelete = leads.find(l => l.id === id);
    const targetName = name || leadToDelete?.nombre_sala || "esta sala";
    if (window.confirm(`¿Estás seguro de que deseas eliminar "${targetName}" de tu CRM?\nSe eliminará de tu agenda y se guardará en la lista negra para no volver a sugerirla.`)) {
      if (selectedLead?.id === id) {
        setSelectedLead(null);
      }
      setSelectedLeadIds(prev => prev.filter(item => item !== id));
      if (onDeleteLead) {
        onDeleteLead(id);
      }
    }
  };

 const handleStartEditLeadInfo = () => {
 if (!selectedLead) return;
 setEditedLeadInfo({
 nombre_sala: selectedLead.nombre_sala || '',
 contacto_nombre: selectedLead.contacto_nombre || '',
 email_contacto: selectedLead.email_contacto || '',
 telefono: selectedLead.telefono || '',
 website: selectedLead.website || '',
 instagram: selectedLead.instagram || '',
 ciudad: selectedLead.ciudad || '',
 region: selectedLead.region || '',
 aforo: selectedLead.aforo || 0,
 genero: selectedLead.genero || '',
 notas: selectedLead.notas || '',
 contexto_extra: selectedLead.contexto_extra || ''
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
 const fechaStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
 
 const newMsg = {
 id: `em-manual-${Date.now()}`,
 fecha: fechaStr,
 remitente: 'banda' as const,
 remitente_nombre: manualEmailSender,
 asunto: manualEmailSubject || `Contacto directo de ${effectiveBandName}`,
 mensaje: manualEmailBody
 };

 const currentHilo = selectedLead.hilo_emails || [];
 const nuevoHilo = [...currentHilo, newMsg];
 
 // Move status to negotiating if it was new/pending/approved/sent
 let nuevoEstado = selectedLead.estado;
 if (selectedLead.estado === 'nuevo' || selectedLead.estado === 'pendiente_aprobacion' || selectedLead.estado === 'aprobado' || selectedLead.estado === 'esperando_respuesta') {
 nuevoEstado = 'negociando';
 }

 const today = new Date().toISOString().split('T')[0];
 const nuevaNota = `*** [${today}] Correo personal manual enviado por ${manualEmailSender}: "${manualEmailSubject}" ***\n` + (selectedLead.notas || '');

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
 
 let simSender = 'Programación';
 let simBody = '';
 let simFechas: string[] = [];
 let simEcon: any = null;
 let simIntencion = 'proponer_fechas';
 let simScore = 0.8;
 let simResumen = '';
 let simPlaybook: any = null;
 
 const lowercaseName = selectedLead.nombre_sala.toLowerCase();
 if (selectedLead.id === 'lead-14' || lowercaseName.includes('hebe')) {
 simSender = 'Kike (Programación Sala Hebe)';
 simBody = '¡Buenas! He estado pensando lo de la fecha doble con la banda local que propusisteis. Me parece de lujo, los chavales de "Vallekas Ska" están buscando bolo para noviembre y seguro que entre los dos llenamos el Hebe. El viernes 13 de Noviembre sigue libre. ¿Cerramos ese día con un 75% de taquilla para vosotros si llegamos a las 100 entradas? Ya me decís y os paso el contrato.';
 simFechas = ['Viernes 13 de Noviembre'];
 simEcon = { tipo: 'taquilla_porcentaje', cifra: '75%', detalles: 'Mínimo 100 entradas con Vallekas Ska' };
 simIntencion = 'proponer_fechas';
 simScore = 0.9;
 simResumen = 'Kike propone fecha doble con Vallekas Ska el 13 de Noviembre con 75% de taquilla para la banda.';
 simPlaybook = {
   titulo: 'Aceptar fecha doble y cerrar contrato',
   estrategia: 'La oferta es altamente favorable y asegura convocatoria local con Vallekas Ska.',
   sugerencia_accion: 'responder_inmediato',
   propuesta_rapida: '¡Aceptamos el viernes 13 de Noviembre con Vallekas Ska y el 75% de taquilla! Pásanos el contrato y el contacto de la banda local para coordinar la cartelería.'
 };
 } else if (selectedLead.id === 'lead-4' || lowercaseName.includes('viña')) {
 simSender = 'Producción Artística (Viña Rock)';
 simBody = 'Hola, gracias por pasarnos los detalles. El caché de 4.500€ entra en vuestros rangos para el escenario de Mestizaje. El slot de las 18:30 del viernes está libre. Confirmadnos si vuestro rider técnico incluye los sintetizadores listos para línea balanceada o si necesitáis cajas DI adicionales del festival. ¡Cerremos trato!';
 simFechas = ['Viernes 18:30 (Escenario Mestizaje)'];
 simEcon = { tipo: 'cache_fijo', cifra: '4.500€', detalles: 'Caché fijo garantizado por festival' };
 simIntencion = 'confirmar_fecha';
 simScore = 0.95;
 simResumen = 'Viña Rock confirma slot a las 18:30 con caché de 4.500€ y consulta rider para cajas DI.';
 simPlaybook = {
   titulo: 'Confirmar slot y enviar rider técnico',
   estrategia: 'Oferta cerrada al caché solicitado. Responder adjuntando detalles técnicos para no perder el slot.',
   sugerencia_accion: 'confirmar_directo',
   propuesta_rapida: '¡Confirmamos el slot del viernes a las 18:30 por 4.500€! Llevamos sintetizadores con salidas balanceadas en jack TRS, pero agradeceríamos 2 cajas DI pasivas de cortesía.'
 };
 } else if (selectedLead.id === 'lead-6' || lowercaseName.includes('razzmatazz')) {
 simSender = 'Xavi (Booking Razzmatazz)';
 simBody = `Buenas, nos parece perfecto el acuerdo de taquilla al 80/20 con un mínimo de 150 entradas garantizadas. La fecha del sábado 5 de Diciembre queda reservada para ${effectiveBandName}. Decidme a qué email enviamos el borrador del contrato de sala. ¡Un saludo!`;
 simFechas = ['Sábado 5 de Diciembre'];
 simEcon = { tipo: 'taquilla_porcentaje', cifra: '80/20', detalles: '80% para la banda (mín. 150 entradas)' };
 simIntencion = 'confirmar_fecha';
 simScore = 0.95;
 simResumen = 'Razzmatazz reserva el 5 de Diciembre con 80% taquilla y solicita email para enviar contrato.';
 simPlaybook = {
   titulo: 'Enviar datos fiscales y solicitar contrato',
   estrategia: 'La sala ha aceptado la fecha clave de sábado. Formalizar el acuerdo administrativo inmediatamente.',
   sugerencia_accion: 'enviar_contrato',
   propuesta_rapida: '¡Perfecto Xavi! Enviad el contrato a booking@labanda.com con atención a Administración. Nos ponemos ya con la promoción.'
 };
 } else {
 simSender = `Programador (${selectedLead.nombre_sala})`;
 simBody = `Hola equipo de ${effectiveBandName}, gracias por la propuesta. Nos gusta mucho vuestra propuesta en directo. Para otoño tenemos el calendario casi cerrado, pero nos queda un hueco el sábado 28 de Noviembre. Iríamos a taquilla 70/30 a vuestro favor con entradas a 10€. ¿Os cuadra la fecha?`;
 simFechas = ['Sábado 28 de Noviembre'];
 simEcon = { tipo: 'taquilla_porcentaje', cifra: '70/30 (10€)', detalles: '70% a favor de la banda' };
 simIntencion = 'proponer_fechas';
 simScore = 0.75;
 simResumen = 'El programador ofrece hueco el sábado 28 de Noviembre con 70% de taquilla a 10€ entrada.';
 simPlaybook = {
   titulo: 'Aceptar fecha de sábado 28 de Noviembre',
   estrategia: 'Es sábado y el porcentaje es competitivo. Gran oportunidad de fecha de fin de semana.',
   sugerencia_accion: 'responder_inmediato',
   propuesta_rapida: '¡Nos encaja perfectamente el sábado 28 de Noviembre con taquilla al 70/30 a 10€! Reservamos esa fecha en nuestro calendario de gira.'
 };
 }

 const now = new Date();
 const fechaStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
 const subject = selectedLead.hilo_emails && selectedLead.hilo_emails.length > 0 
 ? `RE: ${selectedLead.hilo_emails[selectedLead.hilo_emails.length - 1].asunto}` 
 : `Re: Propuesta de concierto - ${effectiveBandName}`;

 const newMsg = {
 id: `em-sim-${Date.now()}`,
 fecha: fechaStr,
 remitente: 'sala' as const,
 remitente_nombre: simSender,
 asunto: subject,
 mensaje: simBody
 };

 const currentHilo = selectedLead.hilo_emails || [];
 const nuevoHilo = [...currentHilo, newMsg];
 
 let nuevoEstado = selectedLead.estado;
 if (selectedLead.estado === 'nuevo' || selectedLead.estado === 'pendiente_aprobacion' || selectedLead.estado === 'aprobado' || selectedLead.estado === 'esperando_respuesta') {
 nuevoEstado = 'negociando';
 }

 const today = new Date().toISOString().split('T')[0];
 const nuevaNota = `*** [${today}] Correo de simulación entrante recibido de ${simSender} ***\n` + (selectedLead.notas || '');

 const updatedLeadFields: Partial<Lead> = {
 hilo_emails: nuevoHilo,
 estado: nuevoEstado,
 notas: nuevaNota,
 fecha_ultima_respuesta: today,
 ultimo_mensaje_recibido: simBody,
 fechas_propuestas_sala: simFechas,
 condiciones_economicas_detectadas: simEcon,
 temperatura_lead: 'muy_caliente',
 ultima_intencion: simIntencion as any,
 ultimo_sentimiento: 'muy_positivo',
 ultimo_sentimiento_score: simScore,
 ultimo_analisis_resumen: simResumen,
 estrategia_playbook: simPlaybook
 };

 onUpdateLead(selectedLead.id, updatedLeadFields);

 setSelectedLead(prev => prev ? {
 ...prev,
 ...updatedLeadFields
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
 const updatedNotes = `*** [${today}] Correo de presentación APROBADO manualmente para envío automático ***\n${selectedLead.notas || ''}`;

 onUpdateLead(selectedLead.id, {
 estado: 'aprobado',
 pitch_generado: editedPitch,
 notas: updatedNotes
 }, 'pendiente_aprobacion');

 setSelectedLead(null);
 };

 const handleRejectLead = () => {
 if (!selectedLead || !rejectionNotes) return;
 const today = new Date().toISOString().split('T')[0];
 const updatedNotes = `*** [${today}] RECHAZADO EN PANEL DE REVISIÓN: "${rejectionNotes}" ***\n${selectedLead.notas || ''}`;
 
 onUpdateLead(selectedLead.id, {
 estado: 'nuevo',
 notas: updatedNotes
 }, 'pendiente_aprobacion');

 setSelectedLead(null);
 };

 const handleCorrectStatus = (newStatus: LeadStatus) => {
 if (!selectedLead) return;
 const today = new Date().toISOString().split('T')[0];
 const correctionMsg = `*** [${today}] Clasificación corregida a '${newStatus}' manualmente ***\n`;
 
 onUpdateLead(selectedLead.id, {
 estado: newStatus,
 notas: correctionMsg + (selectedLead.notas || '')
 }, selectedLead.estado);

 setSelectedLead(prev => prev ? { ...prev, estado: newStatus, notas: correctionMsg + (prev.notas || '') } : null);
 };


 const subCardBg = isStitchLight ? 'bg-slate-50/60' : 'bg-[#131313]';
 const textTitle = isStitchLight ? 'text-slate-900' : 'text-neutral-100';
 const textSub = isStitchLight ? 'text-slate-500' : 'text-neutral-400';
 const textMuted = isStitchLight ? 'text-slate-400' : 'text-[#9a9591]';
 const activeFiltersCount = (searchTerm ? 1 : 0) + (selectedCityFilter ? 1 : 0) + (statusFilter !== 'todos' ? 1 : 0) + (typeFilter !== 'todos' ? 1 : 0) + (minCapacityFilter > 0 ? 1 : 0) + (onlyFavoritesFilter ? 1 : 0) + (onlyVerifiedFilter ? 1 : 0) + (activeSavedFilterId ? 1 : 0);

 return (
 <div className={`space-y-4 ${isStitchLight ? 'text-slate-800' : 'text-[#e5e2e1]'} font-sans w-full max-w-full overflow-x-hidden`}>
 
 {/* 2. LEADS CRM WORKSPACE */}
 <div className={`grid grid-cols-1 ${selectedLead ? 'lg:grid-cols-3 gap-8' : 'w-full'} items-start transition-all duration-300`}>
 
 {/* LEADS LIST AREA (Takes 100% width when no lead is selected, or 2/3 when detail panel is open) */}
 <div className={`${selectedLead ? 'lg:col-span-2' : 'w-full lg:col-span-3'} space-y-4 transition-all duration-300`}>
 <div className="space-y-3 sm:space-y-4">
 
   {/* Header: Tabs + Unified Action Buttons */}
  <div className="flex flex-col gap-3">
    <div className="flex items-center justify-end gap-2">
      {/* UNIFIED ACTION BUTTONS */}
      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-stretch sm:justify-end">
        <button
          id="add-new-lead-btn"
          type="button"
          onClick={() => {
            setNewLeadData({
              nombre_sala: '',
              ciudad: '',
              region: 'Nacional',
              direccion: '',
              aforo: 0,
              tipo: sectionTab === 'medios' ? 'medio' : sectionTab === 'grupos' ? 'productora' : 'sala',
              email_contacto: '',
              email_secundario: '',
              telefono: '',
              telefono_movil: '',
              telefono_fijo: '',
              website: '',
              instagram: '',
              fuente: '',
              genero: sectionTab === 'medios' ? 'Radio' : sectionTab === 'grupos' ? 'Management / Booking' : 'Balkan / Ska',
              notas: '',
              pitch_generado: '',
              icono: sectionTab === 'medios' ? '📻' : sectionTab === 'grupos' ? '💼' : '🏛️',
              imagen_url: ''
            });
            setIsAddingLeadModalOpen(true);
          }}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-[#f2ca50] hover:bg-[#e5bc40] text-[#2c2200] shadow-sm active:scale-95 cursor-pointer"
          title="Añadir contacto"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>+ {sectionTab === 'medios' ? 'Medio' : sectionTab === 'grupos' ? 'Contacto' : 'Escenario'}</span>
        </button>

        <div className="hidden sm:inline-flex">
          <ModuleTutorialTrigger
            moduleId="booking"
            onClick={bookingTutorial.openTutorial}
          />
        </div>

        <button
          id="export-leads-btn"
          type="button"
          onClick={() => setIsExportLeadsOpen(true)}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-600/50 shadow-sm active:scale-95 cursor-pointer"
          title="Exportar base de datos a Excel / CSV o JSON"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Exportar Leads</span>
        </button>

        <button
          id="open-templates-direct-btn"
          type="button"
          onClick={() => {
            setIsTemplatesSectionOpen(true);
            setTimeout(() => {
              document.getElementById('ai-template-config-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 60);
          }}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border border-amber-500/40 shadow-sm active:scale-95 cursor-pointer"
          title="Configurar plantillas de correo y entrenar el Redactor con hilos reales de conversación"
        >
          <MessageSquareText className="w-3.5 h-3.5 text-amber-400" />
          <span>Plantillas & Hilos IA</span>
        </button>

        <button
          id="open-tools-btn"
          type="button"
          onClick={() => setIsMobileToolsOpen(!isMobileToolsOpen)}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
            isMobileToolsOpen
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
              : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:text-white hover:bg-zinc-800'
          }`}
          title="Herramientas, Scout, Excel y Agentes IA"
        >
          <Bot className="w-3.5 h-3.5 text-amber-400" />
          <span>IA & Herramientas</span>
          {leads.filter(l => !l.email_contacto || l.email_contacto.trim() === '').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-indigo-200 text-[10px] font-mono font-bold">
              {leads.filter(l => !l.email_contacto || l.email_contacto.trim() === '').length}
            </span>
          )}
          {duplicateGroupsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#f2ca50] text-[#2c2200] text-[10px] font-black" title={`${duplicateGroupsCount} grupos de duplicados detectados`}>
              {duplicateGroupsCount} dup
            </span>
          )}
          {isMobileToolsOpen ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
        </button>
      </div>
    </div>

    {/* EXPANDED IA TOOLS PANEL (Responsive on all screen sizes) */}
    {isMobileToolsOpen && (
      <div className="p-3.5 rounded-2xl border bg-[#1c1b18] border-amber-500/40 space-y-2.5 animate-in slide-in-from-top-2 duration-150 shadow-2xl">
        <div className="flex items-center justify-between text-xs font-bold text-amber-300 pb-1.5 border-b border-white/10">
          <span className="flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5" />
            Herramientas e Inteligencia Artificial
          </span>
          <button
            type="button"
            onClick={() => setIsMobileToolsOpen(false)}
            className="text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer"
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
            className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-950 to-teal-950 hover:from-emerald-900 hover:to-teal-900 text-emerald-200 border border-emerald-500/40 transition-all cursor-pointer shadow-sm active:scale-98 disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              {isDispatchingEmails ? <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" /> : <Send className="w-4 h-4 text-emerald-400" />}
              <span>{isDispatchingEmails ? 'Despachando correos...' : `Agente Enviador (${leads.filter(l => ['aprobado', 'aprobado_propuesta', 'aprobado_respuesta'].includes(l.estado)).length} en cola de envío)`}</span>
            </span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60 -rotate-90" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPlacesExplorerOpen(true);
              setIsMobileToolsOpen(false);
            }}
            className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold bg-[#f2ca50] text-[#2c2200] hover:bg-[#e5bc40] transition-all cursor-pointer shadow-sm active:scale-98"
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
            className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 border border-emerald-500/40 transition-all cursor-pointer shadow-sm active:scale-98"
          >
            <span className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
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
            className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold bg-[#f2ca50]/15 hover:bg-[#f2ca50]/25 text-[#f2ca50] border border-[#f2ca50]/40 transition-all cursor-pointer shadow-sm active:scale-98"
          >
            <span className="flex items-center gap-2">
              <Copy className="w-4 h-4 text-[#f2ca50]" />
              Detector y Limpiador de Duplicados
            </span>
            {duplicateGroupsCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#f2ca50] text-[#2c2200]">
                {duplicateGroupsCount} {duplicateGroupsCount === 1 ? 'grupo' : 'grupos'}
              </span>
            ) : (
              <span className="text-[10px] text-zinc-400 font-normal">0 duplicados</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsContactEnricherOpen(true);
              setIsMobileToolsOpen(false);
            }}
            className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-900/60 to-purple-900/60 hover:from-indigo-900/80 hover:to-purple-900/80 text-indigo-200 border border-indigo-500/40 transition-all cursor-pointer shadow-sm active:scale-98"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Agente Enriquecedor de Contactos ({leads.filter(l => !l.email_contacto || l.email_contacto.trim() === '').length} sin email)
            </span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60 -rotate-90" />
          </button>

          <button
            type="button"
            onClick={() => {
              setIsAgentConfigOpen(true);
              setIsMobileToolsOpen(false);
            }}
            className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border border-amber-500/40 transition-all cursor-pointer active:scale-98"
          >
            <span className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-amber-400" />
              Configurar Agentes IA (Autonomía & Tono)
            </span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60 -rotate-90" />
          </button>

          <button
            type="button"
            onClick={() => {
              setIsQueueMonitorOpen(true);
              setIsMobileToolsOpen(false);
            }}
            className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-950/80 to-zinc-900 hover:from-emerald-900/90 hover:to-zinc-800 text-emerald-300 border border-emerald-500/40 transition-all cursor-pointer active:scale-98 shadow-sm"
          >
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Monitor de Cola & Workers en Vivo</span>
            </span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60 -rotate-90" />
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMobileToolsOpen(false);
              setIsTemplatesSectionOpen(true);
              setTimeout(() => {
                document.getElementById('ai-template-config-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 60);
            }}
            className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border border-amber-500/40 transition-all cursor-pointer shadow-sm active:scale-98"
          >
            <span className="flex items-center gap-2">
              <MessageSquareText className="w-4 h-4 text-amber-400" />
              <span>Plantillas & Hilos de Ejemplo (Redactor AI)</span>
            </span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60 -rotate-90" />
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMobileToolsOpen(false);
              setRoadbookModalLead(selectedLead || leads[0] || null);
              setIsRoadbookModalOpen(true);
            }}
            className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border border-amber-500/40 transition-all cursor-pointer shadow-sm active:scale-98"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Hoja de Ruta (Roadbook) & Contratos</span>
            </span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60 -rotate-90" />
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMobileToolsOpen(false);
              setIsExportLeadsOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-bold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-600/50 transition-all cursor-pointer active:scale-98"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exportar Leads (A la vista / Todos / Excel)</span>
          </button>

          <button
            type="button"
            disabled={isEnrichingAddresses}
            onClick={() => {
              setIsMobileToolsOpen(false);
              handleEnrichAddresses();
            }}
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <MapPin className="w-3.5 h-3.5 text-zinc-400" />
            <span>{isEnrichingAddresses ? 'Rellenando direcciones...' : 'Autocompletar Direcciones'}</span>
          </button>
        </div>
      </div>
    )}

  {/* Search & View Mode Switcher Row */}
 <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
   <div className="flex-1 flex gap-2">
     {/* Search Input */}
     <div className="relative flex-1">
       <Search className={`absolute left-3 top-2.5 h-4 w-4 pointer-events-none transition-colors ${
         isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'
       }`} />
       <input
         id="crm-search"
         type="text"
         placeholder={sectionTab === 'medios' ? "🔍 Buscar medio..." : sectionTab === 'grupos' ? "🔍 Buscar management..." : "🔍 Buscar escenario..."}
         value={searchTerm}
         onChange={(e) => setSearchTerm(e.target.value)}
         className={`w-full rounded-xl pl-9 ${searchTerm ? 'pr-8' : 'pr-3'} py-2 text-xs font-semibold font-sans transition-all border shadow-sm ${
           isStitchLight 
             ? 'bg-white text-slate-900 border-indigo-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-400' 
             : 'bg-[#141414] text-white border-white/10 focus:border-[#f2ca50] focus:ring-2 focus:ring-[#f2ca50]/30 placeholder:text-neutral-500'
         }`}
       />
       {searchTerm && (
         <button
           id="crm-search-clear"
           type="button"
           onClick={() => setSearchTerm('')}
           className={`absolute right-2.5 top-2.5 p-0.5 rounded-full transition-colors cursor-pointer ${
             isStitchLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
           }`}
           title="Borrar búsqueda"
         >
           <X className="w-3.5 h-3.5" />
         </button>
       )}
     </div>

     {/* Tipo Dropdown Selector */}
     <div className="relative shrink-0 hidden sm:block">
       <select
         id="crm-type-filter-select"
         value={typeFilter}
         onChange={(e) => setTypeFilter(e.target.value as any)}
         aria-label="Filtrar por tipo"
         className={`px-3 py-2 pr-7 rounded-xl text-xs font-semibold font-sans transition-all border shadow-sm cursor-pointer appearance-none ${
           typeFilter !== 'todos'
             ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
             : isStitchLight
             ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
             : 'bg-[#181716] text-zinc-300 border-white/10 hover:bg-zinc-800'
         }`}
       >
         {sectionTab === 'medios' ? (
           <>
             <option value="todos">🌟 Todos los medios ({sectionLeads.length})</option>
             <option value="radio">📻 Radios</option>
             <option value="tv">📺 TV</option>
             <option value="prensa">📰 Prensa</option>
             <option value="redes">📱 Redes</option>
             <option value="podcast">🎙️ Podcasts</option>
           </>
         ) : sectionTab === 'grupos' ? (
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
             <option value="sala">🏛️ Salas ({sectionLeads.filter(l => normalizeType(l.tipo) === 'sala').length})</option>
             <option value="festival">🎪 Festivales ({sectionLeads.filter(l => normalizeType(l.tipo) === 'festival').length})</option>
             <option value="discoteca">🪩 Discotecas ({sectionLeads.filter(l => normalizeType(l.tipo) === 'discoteca').length})</option>
             <option value="ayuntamiento">🎆 Ayuntamientos ({sectionLeads.filter(l => normalizeType(l.tipo) === 'ayuntamiento').length})</option>
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
       className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all shrink-0 cursor-pointer ${
         activeFiltersCount > 0 || isMobileFiltersOpen
           ? 'bg-[#eab308]/20 text-[#eab308] border-[#eab308]/60 shadow-xs'
           : isStitchLight
           ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
           : 'bg-[#181716] text-zinc-300 border-white/10 hover:text-white hover:bg-zinc-800'
       }`}
       title="Filtros avanzados y búsquedas guardadas"
     >
       <Filter className="w-3.5 h-3.5" />
       <span className="hidden sm:inline">Filtros</span>
       {activeFiltersCount > 0 && (
         <span className="w-4 h-4 rounded-full bg-[#eab308] text-black text-[10px] font-black flex items-center justify-center">
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
         className={`px-3 py-2 rounded-xl text-xs font-semibold font-sans transition-all flex items-center gap-1.5 border shadow-xs shrink-0 cursor-pointer ${
           filterByCampaign
             ? (isStitchLight ? 'bg-purple-600 text-white border-purple-700 font-bold' : 'bg-purple-600/90 hover:bg-purple-600 text-white border-purple-500/80 font-bold shadow-purple-950/40')
             : (isStitchLight ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50' : 'bg-[#181716] text-zinc-300 border-white/10 hover:text-white hover:bg-zinc-800')
         }`}
         title={filterByCampaign ? "Quitar filtro de campaña (ver todas las salas)" : "Filtrar únicamente salas objetivo de la campaña"}
       >
         <Target className="w-3.5 h-3.5 text-purple-300 shrink-0" />
         <span className="hidden sm:inline">{filterByCampaign ? 'Filtro Campaña' : 'Filtrar Campaña'}</span>
         {filterByCampaign && (
           <span className="px-1.5 py-0.2 rounded-full bg-purple-950/70 text-purple-200 text-[10px] font-mono font-bold">
             {filteredLeads.length}
           </span>
         )}
       </button>
     )}
   </div>

   {/* View Mode Toggle Switcher */}
   <div className={`p-1 rounded-xl items-center justify-between sm:justify-start gap-1 shrink-0 hidden sm:flex ${
     isStitchLight ? 'bg-slate-100 border border-slate-200' : 'bg-[#131313] border border-white/5'
   }`}>
     <button
       id="crm-view-grid"
       type="button"
       onClick={() => setViewMode('grid')}
       className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-sans font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
         viewMode === 'grid'
           ? isStitchLight ? 'bg-slate-900 text-white shadow-sm' : 'bg-[#f2ca50] text-[#3c2f00] font-bold shadow-sm'
           : isStitchLight ? 'text-slate-600 hover:text-slate-900' : 'text-neutral-400 hover:text-white'
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
       className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-sans font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
         viewMode === 'table'
           ? isStitchLight ? 'bg-slate-900 text-white shadow-sm' : 'bg-[#f2ca50] text-[#3c2f00] font-bold shadow-sm'
           : isStitchLight ? 'text-slate-600 hover:text-slate-900' : 'text-neutral-400 hover:text-white'
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
        className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-sans font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
          viewMode === 'map'
            ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
            : isStitchLight
            ? 'bg-sky-50 text-sky-700 border border-sky-300 hover:bg-sky-100 shadow-sm'
            : 'bg-sky-500/15 text-sky-300 border border-sky-500/40 hover:bg-sky-500/25'
        }`}
        title="Vista en Mapa GPS Interactivo"
      >
        <MapIcon className={`w-3.5 h-3.5 ${viewMode === 'map' ? 'text-slate-950' : 'text-sky-400'}`} />
        <span>Mapa</span>
      </button>
    </div>
  </div>


    </div>

  {/* Enrich Status Banner */}
  {enrichStatusMsg && (
    <div className={`p-2.5 rounded-lg text-[10px] font-sans flex items-center justify-between gap-2 animate-fadeIn ${
      enrichStatusMsg.includes('¡Éxito!')
        ? isStitchLight ? 'bg-emerald-100 text-emerald-700' : 'bg-[#10b981]/15 text-[#10b981]'
        : isStitchLight ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-500/15 text-sky-400'
    }`}>
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-sky-400 shrink-0 animate-bounce" />
        <span>{enrichStatusMsg}</span>
      </div>
      <button 
        type="button" 
        onClick={() => setEnrichStatusMsg('')}
        className="p-0.5 rounded hover:opacity-75 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )}

  {/* ⚡ UNIFIED COMPACT FILTERS PANEL (Desktop, Tablet & Mobile) */}
  {isMobileFiltersOpen && (
    <div className="p-3.5 rounded-2xl border bg-[#181716] border-amber-500/40 space-y-3.5 shadow-2xl animate-in slide-in-from-top-2 duration-150">
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5" />
          Filtros y Búsquedas Avanzadas
        </span>
        <button
          type="button"
          onClick={() => setIsMobileFiltersOpen(false)}
          className="text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 0. Filter drawer Category and View Mode Selectors */}
      <div className="space-y-3 pb-3 border-b border-white/10">
        <div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Categoría de Contactos</p>
          <div className="grid grid-cols-3 gap-1 p-1 bg-black/40 rounded-xl border border-neutral-800">
            <button
              type="button"
              onClick={() => handleSelectSectionTab('salas')}
              className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                sectionTab === 'salas'
                  ? 'bg-[#f2ca50] text-[#3c2f00] font-bold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Escenarios</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectSectionTab('medios')}
              className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                sectionTab === 'medios'
                  ? 'bg-[#f2ca50] text-[#3c2f00] font-bold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Medios</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectSectionTab('grupos')}
              className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                sectionTab === 'grupos'
                  ? 'bg-[#f2ca50] text-[#3c2f00] font-bold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Management</span>
            </button>
          </div>
        </div>

        <div className="sm:hidden">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Modo de Vista</p>
          <div className="grid grid-cols-3 gap-1 p-1 bg-black/40 rounded-xl border border-neutral-800">
            <button
              type="button"
              onClick={() => {
                setViewMode('grid');
                setIsMobileFiltersOpen(false);
              }}
              className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#f2ca50] text-[#3c2f00] font-bold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Tarjetas</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('table');
                setIsMobileFiltersOpen(false);
              }}
              className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#f2ca50] text-[#3c2f00] font-bold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Detalles</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('map');
                setIsMobileFiltersOpen(false);
              }}
              className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-sky-500/15 text-sky-300 border border-sky-500/20'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 shrink-0 text-sky-400" />
              <span>Mapa</span>
            </button>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Tipo de Espacio</p>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-black/60 text-white rounded-xl text-xs font-semibold font-sans border border-neutral-800 focus:border-[#f2ca50] focus:ring-1 focus:ring-[#f2ca50]/30 cursor-pointer"
          >
            {sectionTab === 'medios' ? (
              <>
                <option value="todos">🌟 Todos los medios ({sectionLeads.length})</option>
                <option value="radio">📻 Radios</option>
                <option value="tv">📺 TV</option>
                <option value="prensa">📰 Prensa</option>
                <option value="redes">📱 Redes</option>
                <option value="podcast">🎙️ Podcasts</option>
              </>
            ) : sectionTab === 'grupos' ? (
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
                <option value="sala">🏛️ Salas ({sectionLeads.filter(l => normalizeType(l.tipo) === 'sala').length})</option>
                <option value="festival">🎪 Festivales ({sectionLeads.filter(l => normalizeType(l.tipo) === 'festival').length})</option>
                <option value="discoteca">🪩 Discotecas ({sectionLeads.filter(l => normalizeType(l.tipo) === 'discoteca').length})</option>
                <option value="ayuntamiento">🎆 Ayuntamientos ({sectionLeads.filter(l => normalizeType(l.tipo) === 'ayuntamiento').length})</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* 1. Quick Toggles (Favoritos, Verificados, Aforo) */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Opciones rápidas</p>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setOnlyFavoritesFilter(!onlyFavoritesFilter)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              onlyFavoritesFilter
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-black/40 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            <span>⭐ Favoritos</span>
            {onlyFavoritesFilter && <X className="w-3 h-3 ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => setOnlyVerifiedFilter(!onlyVerifiedFilter)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              onlyVerifiedFilter
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                : 'bg-black/40 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            <span>✔ Verificados</span>
            {onlyVerifiedFilter && <X className="w-3 h-3 ml-0.5" />}
          </button>

          <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-lg border border-neutral-800 text-xs">
            <span className="text-neutral-400">Aforo mín:</span>
            <input
              type="number"
              placeholder="Ej: 300"
              value={minCapacityFilter || ''}
              onChange={(e) => setMinCapacityFilter(Number(e.target.value) || 0)}
              className="w-16 bg-transparent text-[#eab308] font-bold focus:outline-none"
            />
            {minCapacityFilter > 0 && (
              <button
                type="button"
                onClick={() => setMinCapacityFilter(0)}
                className="text-neutral-500 hover:text-white cursor-pointer"
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
              className="px-2.5 py-1.5 bg-[#eab308]/15 hover:bg-[#eab308]/25 text-[#eab308] rounded-lg font-bold text-xs flex items-center gap-1 transition-all border border-[#eab308]/30 cursor-pointer"
              title="Guardar la combinación de filtros actual en 1 clic"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-[#eab308]" />
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
                className="px-2.5 py-1.5 text-xs rounded-lg bg-zinc-900 border border-[#eab308]/50 text-white focus:outline-none w-48 sm:w-56"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setIsSavingFilterOpen(false)}
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg cursor-pointer"
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
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Búsquedas guardadas</p>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {savedFilters.map((sf) => {
              const isActive = activeSavedFilterId === sf.id;
              return (
                <div
                  key={sf.id}
                  className={`group relative shrink-0 flex items-center rounded-full border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#eab308]/20 border-[#eab308] text-[#eab308] font-bold shadow-xs'
                      : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 text-neutral-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleApplySavedFilter(sf)}
                    className="px-3 py-1 text-xs font-sans flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>📌 {sf.nombre}</span>
                    {sf.minCapacityFilter ? (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#eab308]/30 text-amber-200">
                        &gt;{sf.minCapacityFilter}
                      </span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSavedFilter(sf.id, e)}
                    className="pr-2 text-neutral-500 hover:text-rose-400 transition-colors p-0.5 rounded-full cursor-pointer"
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
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Tipo de espacio / contacto</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(sectionTab === 'medios'
            ? [
                { key: 'todos', label: '🌟 Todos' },
                { key: 'radio', label: '📻 Radio' },
                { key: 'tv', label: '📺 TV' },
                { key: 'prensa', label: '📰 Prensa' },
                { key: 'redes', label: '📱 Redes' },
                { key: 'podcast', label: '🎙️ Podcasts' }
              ] as const
            : sectionTab === 'grupos'
            ? [
                { key: 'todos', label: '🌟 Todos' },
                { key: 'productora', label: '🎬 Productoras' },
                { key: 'manager', label: '👔 Mánagers' },
                { key: 'agencia', label: '💼 Agencias' },
                { key: 'sello', label: '💿 Sellos' },
                { key: 'grupo', label: '🎸 Grupos' }
              ] as const
            : [
                { key: 'todos', label: '🌟 Todos' },
                { key: 'sala', label: '🏛️ Salas' },
                { key: 'festival', label: '🎪 Festivales' },
                { key: 'discoteca', label: '🪩 Discotecas' },
                { key: 'ayuntamiento', label: '🎆 Ayuntamientos' }
              ] as const
          ).map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTypeFilter(t.key)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                typeFilter === t.key
                  ? 'bg-[#f2ca50] text-[#3c2f00] font-bold shadow-sm'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
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
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Ciudad / Localidad</p>
          {selectedCityFilter && (
            <button
              type="button"
              onClick={() => setSelectedCityFilter('')}
              className="text-[10px] text-amber-400 hover:underline cursor-pointer"
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
              selectedCityFilter === ''
                ? 'bg-[#22211F] text-[#eab308] font-bold border border-amber-500/40'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
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
                onClick={() => setSelectedCityFilter(isSelected ? '' : cityName)}
                className={`px-2.5 py-1 rounded-full text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-[#eab308]/20 text-[#eab308] font-bold border border-[#eab308]/50'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
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
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
        <button
          type="button"
          onClick={handleClearAllFilters}
          className="text-xs text-zinc-400 hover:text-rose-400 flex items-center gap-1 px-2 py-1 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Limpiar filtros</span>
        </button>

        <button
          type="button"
          onClick={() => setIsMobileFiltersOpen(false)}
          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#f2ca50] text-[#2c2200] cursor-pointer shadow-sm"
        >
          Ver {filteredLeads.length} resultados
        </button>
      </div>
    </div>
  )}

  {/* Active Filters Pill Bar (Responsive on all screen sizes) */}
  {activeFiltersCount > 0 && !isMobileFiltersOpen && (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs animate-in fade-in duration-100">
      <span className="text-[10px] uppercase font-bold text-amber-400 shrink-0">Filtros:</span>
      {selectedCityFilter && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
          📍 {selectedCityFilter}
          <button type="button" onClick={() => setSelectedCityFilter('')} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
        </span>
      )}
      {typeFilter !== 'todos' && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
          🏛️ {typeFilter}
          <button type="button" onClick={() => setTypeFilter('todos')} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
        </span>
      )}
      {onlyFavoritesFilter && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
          ⭐ Favoritos
          <button type="button" onClick={() => setOnlyFavoritesFilter(false)} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
        </span>
      )}
      {onlyVerifiedFilter && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 shrink-0">
          ✔ Verificados
          <button type="button" onClick={() => setOnlyVerifiedFilter(false)} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
        </span>
      )}
      {minCapacityFilter > 0 && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
          &gt;{minCapacityFilter} pax
          <button type="button" onClick={() => setMinCapacityFilter(0)} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
        </span>
      )}
      {activeSavedFilterId && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#eab308]/20 text-[#eab308] border border-[#eab308]/50 shrink-0">
          📌 {savedFilters.find(f => f.id === activeSavedFilterId)?.nombre || 'Búsqueda guardada'}
          <button type="button" onClick={() => setActiveSavedFilterId(null)} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
        </span>
      )}
      <button
        type="button"
        onClick={handleClearAllFilters}
        className="text-xs text-zinc-400 hover:text-rose-400 shrink-0 underline ml-1 cursor-pointer"
      >
        Limpiar todo
      </button>
    </div>
  )}

  {/* 🌟 MORNING BRIEFING & RADAR DEL MÁNAGER (5-MINUTE DAILY ACTION RADAR) */}
  <div className="mb-2">
    <MorningBriefingRadar
      leads={leads}
      concerts={concerts}
      tours={tours}
      onSelectLead={(lead, options) => {
        handleOpenLead(lead, options);
      }}
      onApproveLead={(lead) => {
        onUpdateLead(lead.id, { estado: 'aprobado_propuesta' });
      }}
      onOpenRoadbookModal={(lead) => {
        setRoadbookModalLead(lead || selectedLead || leads[0] || null);
        setIsRoadbookModalOpen(true);
      }}
      isStitchLight={isStitchLight}
      bandName={effectiveBandName}
    />
  </div>

  {/* Main Status Tabs Bar (Clean, no-scrollbar, single row) */}
  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
    {([
      { key: 'todos', label: 'Todos' },
      { key: 'nuevo', label: 'Por contactar' },
      { key: 'esperando_respuesta', label: 'Contactados' },
      { key: 'seguimientos', label: '⏰ Seguimientos' },
      { key: 'respondido', label: 'En conversación' },
      { key: 'negociando', label: 'Negociando' },
      { key: 'confirmado', label: 'Confirmados 🎉' },
      { key: 'aplazado', label: 'Aplazados ⏳' },
      { key: 'no_interesado', label: 'Descartados' }
    ] as const).map(tab => {
      const count = tab.key === 'todos' 
        ? sectionLeads.length 
        : tab.key === 'seguimientos'
        ? sectionLeads.filter(l => isLeadNeedsFollowup(l)).length
        : sectionLeads.filter(l => {
            const norm = normalizeStatus(l.estado);
            if (tab.key === 'esperando_respuesta') return norm === 'esperando_respuesta' || norm === 'enviado';
            return norm === tab.key;
          }).length;
      const isSelected = statusFilter === tab.key;

      return (
        <button
          id={`crm-filter-${tab.key}`}
          key={tab.key}
          onClick={() => setStatusFilter(tab.key)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            isSelected
              ? isStitchLight
                ? 'bg-slate-900 text-white shadow-xs font-bold'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-xs'
              : isStitchLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                : 'text-neutral-400 hover:text-white bg-zinc-900/40 hover:bg-zinc-800 border border-white/5'
          }`}
        >
          <span>{tab.label}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            isSelected 
              ? isStitchLight ? 'bg-white/20 text-white' : 'bg-amber-500/30 text-amber-200' 
              : 'bg-black/30 text-neutral-400'
          }`}>
            {count}
          </span>
        </button>
      );
    })}
  </div>

  {/* Route Anchor Active Filter Banner */}
  {routeAnchorCity && (
    <div className="flex items-center justify-between p-2.5 px-3.5 rounded-xl bg-sky-950/50 border border-sky-500/40 text-sky-200 text-xs">
      <div className="flex items-center gap-2">
        <Compass className="w-4 h-4 text-sky-400 shrink-0" />
        <span>🚗 <strong>Enlace de Fin de Semana desde {routeAnchorCity}:</strong> Mostrando {filteredLeads.length} salas compatibles en ruta (&lt; 2.5h)</span>
      </div>
      <button
        type="button"
        onClick={() => setRouteAnchorCity(null)}
        className="text-sky-300 hover:text-white text-xs font-bold px-2 py-0.5 rounded bg-sky-900/60 border border-sky-500/30 cursor-pointer transition-colors"
      >
        ✕ Quitar filtro de ruta
      </button>
    </div>
  )}

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
        status: 'pending'
      }));

      setBulkProgressState({
        isOpen: true,
        title: 'Generando Pitches con IA Agéntica',
        subtitle: 'Redactando propuestas personalizadas basadas en el ADN de la banda',
        items: initialItems,
        currentIndex: 0,
        totalCount: initialItems.length,
        isCompleted: false
      });

      const updatedItems = [...initialItems];

      for (let i = 0; i < selectedList.length; i++) {
        const targetLead = selectedList[i];
        updatedItems[i] = { ...updatedItems[i], status: 'in_progress', detail: 'Contactando Agente Redactor...' };
        setBulkProgressState(prev => ({ ...prev, items: [...updatedItems], currentIndex: i }));

        try {
          const campaignIsActive = Boolean(activeCampaign && (activeCampaign.isActive ?? (activeCampaign as any).is_active ?? true));
          const res = await apiFetch(`/api/leads/${targetLead.id}/regenerate-pitch`, {
            method: 'POST',
            body: JSON.stringify({
              activeCampaign: campaignIsActive ? activeCampaign : undefined
            })
          });

          if (res.success && res.newPitchText) {
            onUpdateLead(targetLead.id, {
              pitch_generado: res.newPitchText,
              estado: 'pendiente_aprobacion'
            });
            updatedItems[i] = {
              ...updatedItems[i],
              status: 'success',
              detail: res.simulated ? 'Propuesta lista (motor local ADN)' : 'Propuesta redactada'
            };

          } else {
            updatedItems[i] = { ...updatedItems[i], status: 'error', detail: res.error || 'No se pudo generar la propuesta' };
          }
        } catch (err: any) {
          updatedItems[i] = { ...updatedItems[i], status: 'error', detail: err.message || 'Error al generar' };
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
        status: 'pending'
      }));

      setBulkProgressState({
        isOpen: true,
        title: 'Enriquecimiento Masivo con Agente Scout',
        subtitle: 'Buscando datos de contacto, aforo, dirección y redes',
        items: initialItems,
        currentIndex: 0,
        totalCount: initialItems.length,
        isCompleted: false
      });

      const updatedItems = [...initialItems];

      for (let i = 0; i < selectedList.length; i++) {
        const targetLead = selectedList[i];
        updatedItems[i] = { ...updatedItems[i], status: 'in_progress', detail: 'Buscando datos...' };
        setBulkProgressState(prev => ({ ...prev, items: [...updatedItems], currentIndex: i }));

        try {
          const res = await apiFetch(`/api/leads/enrich-lead`, {
            method: 'POST',
            body: JSON.stringify({
              leadId: targetLead.id,
              name: targetLead.nombre_sala,
              city: targetLead.ciudad || 'España'
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
              updatedItems[i] = { ...updatedItems[i], status: 'success', detail: `Actualizado: ${Object.keys(updates).join(', ')}` };
            } else {
              updatedItems[i] = { ...updatedItems[i], status: 'success', detail: 'Ficha al día' };
            }
          } else {
            updatedItems[i] = { ...updatedItems[i], status: 'success', detail: 'Sin datos nuevos' };
          }
        } catch (err: any) {
          updatedItems[i] = { ...updatedItems[i], status: 'error', detail: err.message || 'Error en búsqueda' };
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
 {viewMode === 'map' ? (
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
     onDeleteLead={handleDeleteSingleLead}
    leads={filteredLeads}
    selectedLead={selectedLead}
    onSelectLead={handleOpenLead}
    onUpdateLead={onUpdateLead}
    activeCampaign={activeCampaign}
    onLeadLogoUpload={(file) => handleLeadLogoUpload(file, false)}
    viewMode={viewMode === 'grid' ? 'grid' : 'table'}
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
    onFilterByRouteCity={setRouteAnchorCity}
    effectiveBandName={effectiveBandName}
    concerts={concerts}
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
        onDeleteLead={handleDeleteSingleLead}
        sectionTab={sectionTab}
        isStitchLight={isStitchLight}
        activeCampaign={activeCampaign}
        onLeadLogoUpload={(file) => handleLeadLogoUpload(file, true)}
        isUploadingLeadLogo={isUploadingLeadLogo}
        initialTab={venueDetailInitialTab}
        onOpenRoadbookModal={(lead) => {
          setRoadbookModalLead(lead);
          setIsRoadbookModalOpen(true);
        }}
        onFilterByRouteCity={setRouteAnchorCity}
        bandName={effectiveBandName}
        concerts={concerts}
      />
    </div>
  )}

  {/* MOBILE BOTTOM SHEET FOR TOUCH / SMARTPHONES */}
  <MobileBottomSheet
    selectedLead={selectedLead}
    onClose={() => setSelectedLead(null)}
    onUpdateLead={onUpdateLead}
    onDeleteLead={handleDeleteSingleLead}
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
    onFilterByRouteCity={setRouteAnchorCity}
    bandName={effectiveBandName}
    concerts={concerts}
  />
</div>

  {/* 3. EMAIL TEMPLATES & AI SETTINGS EDITOR CARD */}
  <div id="ai-template-config-section" className={`${colors.card} p-4 sm:p-5 rounded-2xl border ${isStitchLight ? 'border-slate-200' : 'border-white/5'} transition-all`}>
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
      onClick={() => setIsTemplatesSectionOpen(!isTemplatesSectionOpen)}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
          <Settings className="w-4 h-4" />
        </div>
        <div>
          <h3 className={`text-sm font-bold font-display uppercase tracking-wider flex items-center gap-2 ${isStitchLight ? 'text-sky-400' : 'text-[#f2ca50]'}`}>
            Configuración de Plantillas y Pautas AI (Redactor)
          </h3>
          <p className={`text-[11px] font-sans mt-0.5 ${textSub}`}>
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
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
            isTemplatesSectionOpen
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
              : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <span>{isTemplatesSectionOpen ? 'Plegar' : 'Configurar'}</span>
          {isTemplatesSectionOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>

    {isTemplatesSectionOpen && (
      <div className="mt-5 pt-4 border-t border-zinc-800/80">
        <TemplateConfigSection
          colors={colors}
          isStitchLight={isStitchLight}
          textSub={textSub}
          textMuted={textMuted}
          templateTab={templateTab}
          onSelectTemplateTab={setTemplateTab}
          activeTemplate={getActiveTemplateData()}
          isTestingPrompt={isTestingPrompt}
          testPromptResult={testPromptResult}
          onTestPrompt={handleTestPrompt}
          onSaveTemplates={handleSaveTemplates}
          onOptimizeTemplate={handleOptimizeTemplate}
          isOptimizingTemplate={isOptimizingTemplate}
          onGenerateAllTemplates={handleGenerateAllFromBase}
          isGeneratingAllTemplates={isGeneratingAllTemplates}
          optimizationFeedbackMsg={optimizationFeedbackMsg}
          onClearFeedbackMsg={() => setOptimizationFeedbackMsg(null)}
        />
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
    bandGenre={epkConfig?.genero || (currentUser as any)?.genero || ''}
    bandName={effectiveBandName}
    similarBands={epkConfig?.bandasSimilares || []}
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
    bandId={currentBandId || currentUser?.band_id || ''}
    currentUser={currentUser}
    isStitchLight={isStitchLight}
    onOpenTemplatesSection={() => {
      setIsTemplatesSectionOpen(true);
      setTimeout(() => {
        const el = document.getElementById('ai-template-config-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
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
    onDeleteLead={handleDeleteSingleLead}
    isStitchLight={isStitchLight}
  />

  <RoadbookContractModal
    isOpen={isRoadbookModalOpen}
    onClose={() => {
      setIsRoadbookModalOpen(false);
      setRoadbookModalLead(null);
    }}
    lead={roadbookModalLead}
    leads={leads}
    concerts={concerts}
    bandName={effectiveBandName}
    isStitchLight={isStitchLight}
  />

  <AgentQueueMonitorModal
    isOpen={isQueueMonitorOpen}
    onClose={() => setIsQueueMonitorOpen(false)}
    bandName={effectiveBandName}
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

  {/* MOBILE FLOATING ACTION BUTTON (FAB) FOR ZERO-FRICTION CREATION */}
  <button
    id="mobile-fab-add-lead"
    type="button"
    onClick={() => {
      setNewLeadData({
        nombre_sala: '',
        ciudad: '',
        region: 'Nacional',
        direccion: '',
        aforo: 0,
        tipo: sectionTab === 'medios' ? 'medio' : sectionTab === 'grupos' ? 'productora' : 'sala',
        email_contacto: '',
        email_secundario: '',
        telefono: '',
        telefono_movil: '',
        telefono_fijo: '',
        website: '',
        instagram: '',
        fuente: '',
        genero: sectionTab === 'medios' ? 'Radio' : sectionTab === 'grupos' ? 'Management / Booking' : 'Balkan / Ska',
        notas: '',
        pitch_generado: '',
        icono: sectionTab === 'medios' ? '📻' : sectionTab === 'grupos' ? '💼' : '🏛️',
        imagen_url: ''
      });
      setIsAddingLeadModalOpen(true);
    }}
    className="sm:hidden fixed bottom-24 right-5 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-[#f2ca50] hover:bg-[#e5bc40] text-[#2c2200] shadow-2xl active:scale-95 transition-all cursor-pointer animate-bounce"
    style={{ animationDuration: '3s' }}
    title="Añadir contacto"
  >
    <Plus className="w-6 h-6 stroke-[3]" />
  </button>

 </div>
 );
}
