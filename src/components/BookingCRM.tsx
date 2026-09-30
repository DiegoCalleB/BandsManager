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
  Target,
  Search,
  ShieldCheck,
  Mail,
  Clock,
  Check,
  X,
  RefreshCw,
  RotateCcw,
  MapPin,
  Users,
  Bot,
  MessageSquare,
  MessageSquareText,
  Edit3,
  Settings,
  Sparkles,
  Send,
  LogOut,
  Loader2,
  Building,
  Radio,
  Building2,
  Tent,
  Landmark,
  Disc3,
  Briefcase,
  PlusCircle,
  Newspaper,
  Tv,
  Headphones,
  Globe,
  FileText,
  Plus,
  SlidersHorizontal,
  Map as MapIcon,
  List,
  LayoutGrid,
  Share2,
  Repeat,
  Truck,
  Handshake,
  Music,
  Zap,
  Upload,
  Image as ImageIcon,
  Download,
  Phone,
  PhoneCall,
  MessageCircle,
  Bookmark,
  BookmarkCheck,
  Filter,
  Trash2,
  History,
  Calendar,
  ListFilter,
  CheckCircle2,
  Save,
  Star,
  ChevronDown,
  ChevronUp,
  Wrench,
  FileSpreadsheet,
  Copy,
  Wand2,
  Activity,
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
import { BookingFiltersPanel } from './booking/BookingFiltersPanel';
import { useModuleTutorial } from '../hooks/useModuleTutorial';
import { ModuleTutorialTrigger } from './common/ModuleTutorialTrigger';
import { ModuleTutorialModal } from './common/ModuleTutorialModal';
import { ShowIcon } from './ui/ShowIcon';
const matchesMedioType = (l: Lead, filter: string): boolean => {
  if (!filter || filter === 'todos') return true;
  const txt =
    `${l.genero || ''} ${l.nombre_sala || ''} ${l.tipo || ''} ${l.icono || ''} ${l.notas || ''} ${l.contexto_extra || ''}`.toLowerCase();
  if (filter === 'radio')
    return (
      txt.includes('radio') ||
      txt.includes('emisora') ||
      txt.includes('fm') ||
      txt.includes('am') ||
      txt.includes('ser') ||
      txt.includes('cope') ||
      txt.includes('ondacero') ||
      txt.includes('📻')
    );
  if (filter === 'tv' || filter === 'television')
    return (
      txt.includes('tv') ||
      txt.includes('televis') ||
      txt.includes('rtv') ||
      txt.includes('tele') ||
      txt.includes('canal') ||
      txt.includes('📺')
    );
  if (filter === 'prensa')
    return (
      txt.includes('prensa') ||
      txt.includes('revista') ||
      txt.includes('periódico') ||
      txt.includes('periodico') ||
      txt.includes('diario') ||
      txt.includes('blog') ||
      txt.includes('magazine') ||
      txt.includes('fanzine') ||
      txt.includes('web') ||
      txt.includes('noticias') ||
      txt.includes('redacción') ||
      txt.includes('redaccion') ||
      txt.includes('📰')
    );
  if (filter === 'redes')
    return (
      txt.includes('redes') ||
      txt.includes('social') ||
      txt.includes('instagram') ||
      txt.includes('youtube') ||
      txt.includes('tiktok') ||
      txt.includes('twitter') ||
      txt.includes('influencer') ||
      txt.includes('creador') ||
      txt.includes('📱')
    );
  if (filter === 'podcast' || filter === 'podcasts')
    return (
      txt.includes('podcast') ||
      txt.includes('entrevista') ||
      txt.includes('ivoox') ||
      txt.includes('spotify') ||
      txt.includes('audio') ||
      txt.includes('🎙️')
    );
  return true;
};

const matchesGruposType = (l: Lead, filter: string): boolean => {
  if (!filter || filter === 'todos') return true;
  const norm = normalizeType(l.tipo);
  if (norm === filter) return true;
  const txt =
    `${l.genero || ''} ${l.nombre_sala || ''} ${l.tipo || ''} ${l.icono || ''} ${l.notas || ''} ${l.contexto_extra || ''}`.toLowerCase();
  if (filter === 'grupo')
    return (
      norm === 'grupo' ||
      txt.includes('grupo') ||
      txt.includes('banda') ||
      txt.includes('artista') ||
      txt.includes('co-booking') ||
      txt.includes('músico') ||
      txt.includes('musico') ||
      txt.includes('🎸')
    );
  if (filter === 'agencia')
    return (
      norm === 'agencia' ||
      txt.includes('agencia') ||
      txt.includes('agency') ||
      txt.includes('booking') ||
      txt.includes('promotora') ||
      txt.includes('💼')
    );
  if (filter === 'manager')
    return (
      norm === 'manager' ||
      txt.includes('manager') ||
      txt.includes('mánager') ||
      txt.includes('management') ||
      txt.includes('representante') ||
      txt.includes('👔')
    );
  if (filter === 'productora')
    return (
      norm === 'productora' ||
      txt.includes('productora') ||
      txt.includes('producciones') ||
      txt.includes('production') ||
      txt.includes('eventos') ||
      txt.includes('🎬')
    );
  if (filter === 'sello')
    return (
      norm === 'sello' ||
      txt.includes('sello') ||
      txt.includes('discográfica') ||
      txt.includes('discografica') ||
      txt.includes('record') ||
      txt.includes('label') ||
      txt.includes('💿')
    );
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

import { normalizeStatus, normalizeType, autoDetectVenueAddress, VENUE_ADDRESS_DATABASE } from '../utils/bookingUtils';
import { leadStatusDotColor, leadStatusBadgeClass, leadStatusLabel } from '../utils/leadStatusPresentation';

// Espectro resuelve claro/oscuro en tokens: las ramas `isStitchLight` que llegan de main no deben
// activarse nunca (traerían de vuelta slate/indigo). Se eliminan en el restyle de este fichero.
const isStitchLight = false;

export { normalizeStatus, normalizeType, autoDetectVenueAddress, VENUE_ADDRESS_DATABASE };

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
  tours = [],
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
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    selectedCityFilter,
    setSelectedCityFilter,
    minCapacityFilter,
    setMinCapacityFilter,
    onlyFavoritesFilter,
    setOnlyFavoritesFilter,
    onlyVerifiedFilter,
    setOnlyVerifiedFilter,
    savedFilters,
    isSavingFilterOpen,
    setIsSavingFilterOpen,
    newFilterName,
    setNewFilterName,
    activeSavedFilterId,
    setActiveSavedFilterId,
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
      const found = leads.find((l) => l.id === initialSelectedLeadId);
      if (found) {
        setSelectedLead(found);
        setTimeout(() => {
          if (interventionPanelRef.current) {
            interventionPanelRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
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
    isCompleted: false,
  });

  const interventionPanelRef = React.useRef<HTMLDivElement>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const {
    customCityChips,
    isAddingCityChip,
    setIsAddingCityChip,
    newCityInput,
    setNewCityInput,
    activeLeadsForSection,
    cityCounts,
    displayCityChips,
    handleAddCustomCity,
    handleRemoveCustomCity,
  } = useCityChips(leads, sectionTab, epkConfig, onUpdateEpkConfig, selectedCityFilter, setSelectedCityFilter);

  const {
    interactionType,
    setInteractionType,
    interactionNotes,
    setInteractionNotes,
    interactionResultado,
    setInteractionResultado,
    interactionAutor,
    setInteractionAutor,
    handleAddInteractionLog,
    handleDeleteInteractionLog,
  } = useInteractionLog(selectedLead, setSelectedLead, onUpdateLead);

  const {
    templateTab,
    setTemplateTab,
    testPromptResult,
    isTestingPrompt,
    isOptimizingTemplate,
    optimizationFeedbackMsg,
    setOptimizationFeedbackMsg,
    isGeneratingAllTemplates,
    handleGenerateAllFromBase,
    templateCustomInstruction,
    setTemplateCustomInstruction,
    templateToneRating,
    setTemplateToneRating,
    templateContentRating,
    setTemplateContentRating,
    templateStats,
    getActiveTemplateData,
    handleOptimizeTemplate,
    handleTestPrompt,
    handleSaveTemplates,
    handleResetTemplate,
  } = useEmailTemplates();

  const [crmTemplateSubTab, setCrmTemplateSubTab] = useState<'plantilla' | 'hilos'>('plantilla');
  const [isMultiTemplatesModalOpen, setIsMultiTemplatesModalOpen] = useState(false);

  const { gmailUser, gmailToken, isSyncingGmail, gmailStatusMsg, handleGmailLogin, handleGmailLogout, handleSyncGmailForLead } =
    useGmailIntegration(selectedLead, setSelectedLead, onUpdateLead);

  const [filterByCampaign, setFilterByCampaign] = useState(
    Boolean(activeCampaign && (activeCampaign.isActive ?? (activeCampaign as any).is_active ?? true))
  );

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
      const updated = leads.find((l) => l.id === selectedLead.id);
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
        setSelectedLead((prev) => (prev ? { ...prev, direccion: detected } : null));
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
          params: { id: leadId, trigger_type: 'usuario_manual' },
        }),
      });

      try {
        window.dispatchEvent(new CustomEvent('app-data-updated'));
      } catch (_) {}

      if (data.dispatchedCount > 0) {
        alert(`¡Agente Enviador ejecutado con éxito! ${data.message || ''}`);
      } else if (data.results && data.results.some((r: any) => r.status === 'error')) {
        const errMsgs = data.results
          .filter((r: any) => r.status === 'error')
          .map((r: any) => `${r.nombre_sala}: ${r.error}`)
          .join('\n');
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
    imagen_url: '',
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
      const url = await uploadFileToServer(file, {
        bandId: targetBandId,
        category: 'leads',
      });
      if (url) {
        if (isEdit) {
          setEditedLeadInfo((prev) => ({ ...prev, imagen_url: url }));
          if (selectedLead?.id) {
            setSelectedLead((prev) => (prev ? { ...prev, imagen_url: url } : null));
            onUpdateLead(selectedLead.id, { imagen_url: url });
          }
        } else {
          setNewLeadData((prev) => ({ ...prev, imagen_url: url }));
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
    isSimulatingAvanzado,
    setIsSimulatingAvanzado,
    simulationRole,
    simulationScenario,
    simulationCustomInstruction,
    setSimulationCustomInstruction,
    simulationSenderName,
    setSimulationSenderName,
    simulationSubject,
    setSimulationSubject,
    simulationMessage,
    setSimulationMessage,
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
        headers: { 'Content-Type': 'application/json' },
      });
      // apiFetch devuelve el JSON ya parseado (y lanza si la respuesta no fue 2xx).
      const data = res as any;
      if (data) {
        if (data.enrichedCount > 0) {
          setEnrichStatusMsg(`¡Éxito! Se han completado y guardado en Supabase ${data.enrichedCount} direcciones de salas/festivales.`);
          if (Array.isArray(data.leads)) {
            data.leads.forEach((updatedLead: Lead) => {
              if (updatedLead.direccion) {
                onUpdateLead(updatedLead.id, {
                  direccion: updatedLead.direccion,
                });
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

  // Filter leads by active section tab
  const sectionLeads = useMemo(() => {
    const seen = new Set<string>();
    const isGruposType = (norm: string) => ['grupo', 'agencia', 'manager', 'productora', 'sello'].includes(norm);
    return (leads || []).filter((lead) => {
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

      if (
        sectionTab === 'salas' &&
        filterByCampaign &&
        activeCampaign &&
        (activeCampaign.isActive ?? (activeCampaign as any).is_active ?? true)
      ) {
        // El filtrado por aforo, fechas y ciudad de campaña solo aplica a recintos y festivales (salas),
        // ya que los medios de comunicación y bandas no tienen aforo ni fechas de evento en campaña.
        if (
          !leadMatchesCampaignCity(lead, activeCampaign) ||
          !leadMatchesCampaignCapacity(lead, activeCampaign) ||
          !leadMatchesCampaignDates(lead, activeCampaign)
        )
          return false;
      }

      const matchesSearch =
        (lead.nombre_sala || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.ciudad || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.region || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.email_contacto && lead.email_contacto.toLowerCase().includes(searchTerm.toLowerCase()));
      const normSt = normalizeStatus(lead.estado);
      const matchesStatus =
        statusFilter === 'todos' ||
        (statusFilter === 'seguimientos'
          ? isLeadNeedsFollowup(lead)
          : normSt === statusFilter || (statusFilter === 'pendiente_aprobacion' && normSt === 'nuevo' && !!lead.pitch_generado));

      const matchesType =
        typeFilter === 'todos'
          ? true
          : sectionTab === 'medios'
            ? matchesMedioType(lead, typeFilter)
            : sectionTab === 'grupos'
              ? matchesGruposType(lead, typeFilter)
              : normalizeType(lead.tipo) === typeFilter;
      const matchesCity =
        !selectedCityFilter ||
        (lead.ciudad || '').toLowerCase().includes(selectedCityFilter.toLowerCase()) ||
        (lead.region || '').toLowerCase().includes(selectedCityFilter.toLowerCase());
      const matchesCapacity = !minCapacityFilter || (lead.aforo || 0) >= minCapacityFilter;
      const matchesRoute = !routeAnchorCity || areCitiesLogisticallyCompatible(routeAnchorCity, lead.ciudad || lead.region || '');
      return matchesSearch && matchesStatus && matchesType && matchesCity && matchesCapacity && matchesRoute;
    });
  }, [
    sectionLeads,
    searchTerm,
    statusFilter,
    typeFilter,
    selectedCityFilter,
    minCapacityFilter,
    sectionTab,
    filterByCampaign,
    activeCampaign,
    routeAnchorCity,
  ]);

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
      'Buscando sitio oficial y directorio de salas...',
      'Extrayendo emails de programación y prensa...',
      'Obteniendo teléfono y datos de ubicación...',
      'Consolidando ficha encontrada...',
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
          region: newLeadData.region,
        }),
      });

      clearInterval(interval);

      if (res.ok) {
        const resData = await res.json();
        if (resData.success && resData.data) {
          const getVal = (f: any) => (typeof f === 'object' && f !== null ? f.valor : f || '');
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

          setNewLeadData((prev) => ({
            ...prev,
            email_contacto: emailVal || prev.email_contacto,
            telefono: telVal || prev.telefono,
            telefono_movil: isMobile ? telVal : prev.telefono_movil,
            telefono_fijo: isLandline ? telVal : prev.telefono_fijo,
            website: webVal || prev.website,
            region: regionVal || prev.region,
            aforo: aforoVal && !isNaN(Number(aforoVal)) ? Number(aforoVal) : prev.aforo,
            genero: generoVal || prev.genero,
            imagen_url: imgVal || prev.imagen_url,
            icono: iconVal || prev.icono,
            notas: prev.notas
              ? `${prev.notas} | Scout: ${resData.data.source_info || 'IA Grounding'}`
              : `Scout IA: ${resData.data.source_info || 'IA Grounding'}`,
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
      'Buscando sitio oficial de la sala / medio...',
      'Rastreando contactos de programación y teléfono...',
      'Consolidando nivel de confianza de datos...',
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
          region: selectedLead.region,
        }),
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
    const getVal = (f: any) => (typeof f === 'object' && f !== null ? f.valor : f || '');

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
      aforo: aforoVal && !isNaN(Number(aforoVal)) ? Number(aforoVal) : selectedLead.aforo,
      region: regionVal || selectedLead.region,
      genero: generoVal || selectedLead.genero,
      imagen_url: imgVal || selectedLead.imagen_url,
      icono: iconVal || selectedLead.icono,
      notas: updatedNotes,
    };

    onUpdateLead(selectedLead.id, updatedFields);
    setSelectedLead((prev) => (prev ? { ...prev, ...updatedFields } : null));
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
      pitch_generado:
        newLeadData.pitch_generado ||
        (sectionTab === 'medios'
          ? `Asunto: Nota de Prensa: ${effectiveBandName} presenta su directo\n\nEstimada redacción / equipo de ${newLeadData.nombre_sala},\n\nOs remitimos la información de la propuesta musical de ${effectiveBandName}...`
          : `Asunto: Propuesta de concierto: ${effectiveBandName} en ${newLeadData.nombre_sala}\n\nHola equipo de booking,\n\nSomos la banda ${effectiveBandName}...`),
      notas:
        newLeadData.notas ||
        `Añadido desde la sección ${sectionTab === 'medios' ? 'Medios' : 'Salas'} el ${new Date().toISOString().split('T')[0]}`,
    };

    if (onAddLead) {
      onAddLead(createdLead);
    } else {
      onUpdateLead(createdLead.id, createdLead);
    }

    setIsAddingLeadModalOpen(false);
    setSelectedLead(createdLead);
  };

  const getStatusDotColor = (status: LeadStatus | string) => leadStatusDotColor(normalizeStatus(status));

  const getStatusBadgeClass = (status: LeadStatus | string) => leadStatusBadgeClass(normalizeStatus(status));

  const getStatusLabel = (status: LeadStatus | string) => leadStatusLabel(normalizeStatus(status), String(status));

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
    setManualEmailSubject(
      lead.hilo_emails && lead.hilo_emails.length > 0
        ? `RE: ${lead.hilo_emails[lead.hilo_emails.length - 1].asunto}`
        : `Propuesta de concierto: ${effectiveBandName}`
    );
    setManualEmailStatus('');

    setTimeout(() => {
      interventionPanelRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  };

  const handleDeleteSingleLead = (id: string, name?: string) => {
    const leadToDelete = leads.find((l) => l.id === id);
    const targetName = name || leadToDelete?.nombre_sala || 'esta sala';
    if (
      window.confirm(
        `¿Estás seguro de que deseas eliminar "${targetName}" de tu CRM?\nSe eliminará de tu agenda y se guardará en la lista negra para no volver a sugerirla.`
      )
    ) {
      if (selectedLead?.id === id) {
        setSelectedLead(null);
      }
      setSelectedLeadIds((prev) => prev.filter((item) => item !== id));
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
      contexto_extra: selectedLead.contexto_extra || '',
    });
    setIsEditingLeadInfo(true);
  };

  const handleSaveLeadInfo = () => {
    if (!selectedLead) return;
    onUpdateLead(selectedLead.id, editedLeadInfo);
    setSelectedLead((prev) => (prev ? { ...prev, ...editedLeadInfo } : null));
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
      mensaje: manualEmailBody,
    };

    const currentHilo = selectedLead.hilo_emails || [];
    const nuevoHilo = [...currentHilo, newMsg];

    // Move status to negotiating if it was new/pending/approved/sent
    let nuevoEstado = selectedLead.estado;
    if (
      selectedLead.estado === 'nuevo' ||
      selectedLead.estado === 'pendiente_aprobacion' ||
      selectedLead.estado === 'aprobado' ||
      selectedLead.estado === 'esperando_respuesta'
    ) {
      nuevoEstado = 'negociando';
    }

    const today = new Date().toISOString().split('T')[0];
    const nuevaNota =
      `*** [${today}] Correo personal manual enviado por ${manualEmailSender}: "${manualEmailSubject}" ***\n` + (selectedLead.notas || '');

    onUpdateLead(selectedLead.id, {
      hilo_emails: nuevoHilo,
      estado: nuevoEstado,
      notas: nuevaNota,
    });

    setSelectedLead((prev) =>
      prev
        ? {
            ...prev,
            hilo_emails: nuevoHilo,
            estado: nuevoEstado,
            notas: nuevaNota,
          }
        : null
    );

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
      simBody =
        '¡Buenas! He estado pensando lo de la fecha doble con la banda local que propusisteis. Me parece de lujo, los chavales de "Vallekas Ska" están buscando bolo para noviembre y seguro que entre los dos llenamos el Hebe. El viernes 13 de Noviembre sigue libre. ¿Cerramos ese día con un 75% de taquilla para vosotros si llegamos a las 100 entradas? Ya me decís y os paso el contrato.';
      simFechas = ['Viernes 13 de Noviembre'];
      simEcon = { tipo: 'taquilla_porcentaje', cifra: '75%', detalles: 'Mínimo 100 entradas con Vallekas Ska' };
      simIntencion = 'proponer_fechas';
      simScore = 0.9;
      simResumen = 'Kike propone fecha doble con Vallekas Ska el 13 de Noviembre con 75% de taquilla para la banda.';
      simPlaybook = {
        titulo: 'Aceptar fecha doble y cerrar contrato',
        estrategia: 'La oferta es altamente favorable y asegura convocatoria local con Vallekas Ska.',
        sugerencia_accion: 'responder_inmediato',
        propuesta_rapida:
          '¡Aceptamos el viernes 13 de Noviembre con Vallekas Ska y el 75% de taquilla! Pásanos el contrato y el contacto de la banda local para coordinar la cartelería.',
      };
    } else if (selectedLead.id === 'lead-4' || lowercaseName.includes('viña')) {
      simSender = 'Producción Artística (Viña Rock)';
      simBody =
        'Hola, gracias por pasarnos los detalles. El caché de 4.500€ entra en vuestros rangos para el escenario de Mestizaje. El slot de las 18:30 del viernes está libre. Confirmadnos si vuestro rider técnico incluye los sintetizadores listos para línea balanceada o si necesitáis cajas DI adicionales del festival. ¡Cerremos trato!';
      simFechas = ['Viernes 18:30 (Escenario Mestizaje)'];
      simEcon = { tipo: 'cache_fijo', cifra: '4.500€', detalles: 'Caché fijo garantizado por festival' };
      simIntencion = 'confirmar_fecha';
      simScore = 0.95;
      simResumen = 'Viña Rock confirma slot a las 18:30 con caché de 4.500€ y consulta rider para cajas DI.';
      simPlaybook = {
        titulo: 'Confirmar slot y enviar rider técnico',
        estrategia: 'Oferta cerrada al caché solicitado. Responder adjuntando detalles técnicos para no perder el slot.',
        sugerencia_accion: 'confirmar_directo',
        propuesta_rapida:
          '¡Confirmamos el slot del viernes a las 18:30 por 4.500€! Llevamos sintetizadores con salidas balanceadas en jack TRS, pero agradeceríamos 2 cajas DI pasivas de cortesía.',
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
        propuesta_rapida:
          '¡Perfecto Xavi! Enviad el contrato a booking@labanda.com con atención a Administración. Nos ponemos ya con la promoción.',
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
        propuesta_rapida:
          '¡Nos encaja perfectamente el sábado 28 de Noviembre con taquilla al 70/30 a 10€! Reservamos esa fecha en nuestro calendario de gira.',
      };
    }

    const now = new Date();
    const fechaStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const subject =
      selectedLead.hilo_emails && selectedLead.hilo_emails.length > 0
        ? `RE: ${selectedLead.hilo_emails[selectedLead.hilo_emails.length - 1].asunto}`
        : `Re: Propuesta de concierto - ${effectiveBandName}`;

    const newMsg = {
      id: `em-sim-${Date.now()}`,
      fecha: fechaStr,
      remitente: 'sala' as const,
      remitente_nombre: simSender,
      asunto: subject,
      mensaje: simBody,
    };

    const currentHilo = selectedLead.hilo_emails || [];
    const nuevoHilo = [...currentHilo, newMsg];

    let nuevoEstado = selectedLead.estado;
    if (
      selectedLead.estado === 'nuevo' ||
      selectedLead.estado === 'pendiente_aprobacion' ||
      selectedLead.estado === 'aprobado' ||
      selectedLead.estado === 'esperando_respuesta'
    ) {
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
      estrategia_playbook: simPlaybook,
    };

    onUpdateLead(selectedLead.id, updatedLeadFields);

    setSelectedLead((prev) =>
      prev
        ? {
            ...prev,
            ...updatedLeadFields,
          }
        : null
    );

    setManualEmailStatus(`¡Simulación completada! Se recibió un correo entrante de ${simSender} y se sincronizó en Excel.`);
    setTimeout(() => {
      setManualEmailStatus('');
    }, 5000);
  };

  const handleSavePitchEdit = () => {
    if (!selectedLead) return;
    onUpdateLead(selectedLead.id, { pitch_generado: editedPitch });
    setSelectedLead((prev) => (prev ? { ...prev, pitch_generado: editedPitch } : null));
    setIsEditingPitch(false);
  };

  const handleApproveLead = () => {
    if (!selectedLead) return;
    const today = new Date().toISOString().split('T')[0];
    const updatedNotes = `*** [${today}] Correo de presentación APROBADO manualmente para envío automático ***\n${selectedLead.notas || ''}`;

    onUpdateLead(
      selectedLead.id,
      {
        estado: 'aprobado',
        pitch_generado: editedPitch,
        notas: updatedNotes,
      },
      'pendiente_aprobacion'
    );

    setSelectedLead(null);
  };

  const handleRejectLead = () => {
    if (!selectedLead || !rejectionNotes) return;
    const today = new Date().toISOString().split('T')[0];
    const updatedNotes = `*** [${today}] RECHAZADO EN PANEL DE REVISIÓN: "${rejectionNotes}" ***\n${selectedLead.notas || ''}`;

    onUpdateLead(
      selectedLead.id,
      {
        estado: 'nuevo',
        notas: updatedNotes,
      },
      'pendiente_aprobacion'
    );

    setSelectedLead(null);
  };

  const handleCorrectStatus = (newStatus: LeadStatus) => {
    if (!selectedLead) return;
    const today = new Date().toISOString().split('T')[0];
    const correctionMsg = `*** [${today}] Clasificación corregida a '${newStatus}' manualmente ***\n`;

    onUpdateLead(
      selectedLead.id,
      {
        estado: newStatus,
        notas: correctionMsg + (selectedLead.notas || ''),
      },
      selectedLead.estado
    );

    setSelectedLead((prev) =>
      prev
        ? {
            ...prev,
            estado: newStatus,
            notas: correctionMsg + (prev.notas || ''),
          }
        : null
    );
  };

  const subCardBg = 'bg-[var(--bg)]/60';
  const textTitle = 'text-[var(--ink)]';
  const textSub = 'text-[var(--ink-2)]';
  const textMuted = 'text-[var(--ink-2)]';
  const activeFiltersCount =
    (searchTerm ? 1 : 0) +
    (selectedCityFilter ? 1 : 0) +
    (statusFilter !== 'todos' ? 1 : 0) +
    (typeFilter !== 'todos' ? 1 : 0) +
    (minCapacityFilter > 0 ? 1 : 0) +
    (onlyFavoritesFilter ? 1 : 0) +
    (onlyVerifiedFilter ? 1 : 0) +
    (activeSavedFilterId ? 1 : 0);

  return (
    <div
      data-modulo="booking"
      className="space-y-4 text-[var(--ink)] bg-[var(--bg)] -m-3 p-3 sm:-m-5 sm:p-5 md:-m-8 md:p-8 min-h-screen font-sans overflow-x-hidden"
    >
      {/* 2. LEADS CRM WORKSPACE */}
      <div className={`grid grid-cols-1 ${selectedLead ? 'lg:grid-cols-3 gap-8' : 'w-full'} items-start transition-ui duration-300`}>
        {/* LEADS LIST AREA (Takes 100% width when no lead is selected, or 2/3 when detail panel is open) */}
        <div className={`${selectedLead ? 'lg:col-span-2' : 'w-full lg:col-span-3'} space-y-4 transition-ui duration-300`}>
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
                        imagen_url: '',
                      });
                      setIsAddingLeadModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-bold bg-[var(--acc)] hover:brightness-105 text-[var(--on-acc)] active:scale-[0.97] cursor-pointer"
                    title="Añadir contacto"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ {sectionTab === 'medios' ? 'Medio' : sectionTab === 'grupos' ? 'Contacto' : 'Escenario'}</span>
                  </button>

                  <div className="hidden sm:inline-flex">
                    <ModuleTutorialTrigger moduleId="booking" onClick={bookingTutorial.openTutorial} />
                  </div>

                  {/* Botón Exportar — Solo en PC */}
                  <button
                    id="export-leads-btn"
                    type="button"
                    onClick={() => setIsExportLeadsOpen(true)}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-bold bg-[var(--sunken)] hover:brightness-95 text-[var(--ink-2)] active:scale-[0.97] cursor-pointer"
                    title="Exportar base de datos a Excel / CSV o JSON"
                  >
                    <Download className="w-3.5 h-3.5 text-[var(--ink-2)]" />
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
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-semibold bg-[var(--acc-soft)] hover:brightness-95 text-[var(--acc-ink)] transition-[filter] cursor-pointer"
                    title="Configurar plantillas de correo y entrenar el Redactor con hilos reales de conversación"
                  >
                    <MessageSquareText className="w-3.5 h-3.5" />
                    <span>Plantillas & Hilos IA</span>
                  </button>

                  {/* Botón Herramientas & IA */}
                  <button
                    id="open-tools-btn"
                    type="button"
                    onClick={() => setIsMobileToolsOpen(!isMobileToolsOpen)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-bold transition-colors cursor-pointer ${
                      isMobileToolsOpen
                        ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)]'
                        : 'bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]'
                    }`}
                    title="Herramientas, Scout, Excel y Agentes IA"
                  >
                    <Bot className="w-3.5 h-3.5 text-[var(--acc-ink)]" />
                    <span>IA & Herramientas</span>
                    {leads.filter((l) => !l.email_contacto || l.email_contacto.trim() === '').length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-[var(--r-pill)] bg-[var(--alert-soft)] text-[var(--alert)] text-micro font-semibold tabular-nums">
                        {leads.filter((l) => !l.email_contacto || l.email_contacto.trim() === '').length}
                      </span>
                    )}
                    {duplicateGroupsCount > 0 && (
                      <span
                        className="px-1.5 py-0.2 rounded-[var(--r-pill)] bg-[var(--alert-soft)] text-[var(--alert)] text-micro font-bold"
                        title={`${duplicateGroupsCount} grupos de duplicados detectados`}
                      >
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
                  <div className="flex items-center justify-between text-xs font-bold text-[var(--acc)]/70 pb-1.5">
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
                      className="flex items-center justify-between p-2.5 rounded-[var(--r-m)] text-xs font-bold bg-[var(--ok)]  hover:bg-[var(--ok)] text-[var(--on-ok)] transition-ui cursor-pointer active:scale-[0.97] disabled:opacity-50"
                    >
                      <span className="flex items-center gap-2">
                        {isDispatchingEmails ? (
                          <Loader2 className="w-4 h-4 text-[var(--ok)] animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 text-[var(--ok)]" />
                        )}
                        <span>
                          {isDispatchingEmails
                            ? 'Despachando correos...'
                            : `Agente Enviador (${leads.filter((l) => ['aprobado', 'aprobado_propuesta', 'aprobado_respuesta'].includes(l.estado)).length} en cola de envío)`}
                        </span>
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-60 -rotate-90" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPlacesExplorerOpen(true);
                        setIsMobileToolsOpen(false);
                      }}
                      className="flex items-center justify-between p-2.5 rounded-[var(--r-m)] text-xs font-bold bg-[var(--acc)] text-[var(--on-acc)] hover:bg-[var(--acc)] transition-ui cursor-pointer active:scale-[0.97]"
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
                      className="flex items-center justify-between p-2.5 rounded-[var(--r-m)] text-xs font-bold bg-[var(--ok)]/15 hover:bg-[var(--ok)]/25 text-[var(--ink)] transition-ui cursor-pointer active:scale-[0.97]"
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
                      className="flex items-center justify-between p-2.5 rounded-[var(--r-m)] text-xs font-bold bg-[var(--acc)]/15 hover:bg-[var(--acc)]/25 text-[var(--acc)]/40 transition-ui cursor-pointer active:scale-[0.97]"
                    >
                      <span className="flex items-center gap-2">
                        <Copy className="w-4 h-4 text-[var(--acc)]" />
                        Detector y Limpiador de Duplicados
                      </span>
                      {duplicateGroupsCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-bold bg-[var(--acc)] text-[var(--on-acc)]">
                          {duplicateGroupsCount} {duplicateGroupsCount === 1 ? 'grupo' : 'grupos'}
                        </span>
                      ) : (
                        <span className="text-micro text-[var(--ink-2)] font-normal">0 duplicados</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsContactEnricherOpen(true);
                        setIsMobileToolsOpen(false);
                      }}
                      className="flex items-center justify-between p-2.5 rounded-[var(--r-m)] text-xs font-bold bg-[var(--tentative)]/60  hover:bg-[var(--tentative)]/80 text-[var(--tentative)]/40 transition-ui cursor-pointer active:scale-[0.97]"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[var(--tentative)]" />
                        Agente Enriquecedor de Contactos ({
                          leads.filter((l) => !l.email_contacto || l.email_contacto.trim() === '').length
                        }{' '}
                        sin email)
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-60 -rotate-90" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAgentConfigOpen(true);
                        setIsMobileToolsOpen(false);
                      }}
                      className="flex items-center justify-between p-2.5 rounded-[var(--r-m)] text-xs font-bold bg-[var(--acc)]/15 hover:bg-[var(--acc)]/25 text-[var(--ink)] transition-ui cursor-pointer active:scale-[0.97]"
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
                        setIsQueueMonitorOpen(true);
                        setIsMobileToolsOpen(false);
                      }}
                      className="flex items-center justify-between p-2.5 rounded-[var(--r-m)] text-xs font-bold bg-[var(--ok)]/80 hover:bg-[var(--ok)]/90 text-[var(--ok)] transition-ui cursor-pointer active:scale-[0.97]"
                    >
                      <span className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-[var(--r-pill)] bg-[var(--ok)] opacity-75"></span>
                          <span className="relative inline-flex rounded-[var(--r-pill)] h-2 w-2 bg-[var(--ok)]"></span>
                        </span>
                        <Activity className="w-4 h-4 text-[var(--ok)]" />
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
                      className="flex items-center justify-between p-2.5 rounded-[var(--r-m)] text-xs font-bold bg-[var(--acc)]/15 hover:bg-[var(--acc)]/25 text-[var(--acc)] transition-ui cursor-pointer active:scale-[0.97]"
                    >
                      <span className="flex items-center gap-2">
                        <MessageSquareText className="w-4 h-4 text-[var(--acc)]" />
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
                      className="flex items-center justify-between p-2.5 rounded-[var(--r-m)] text-xs font-bold bg-[var(--acc)]/15 hover:bg-[var(--acc)]/25 text-[var(--acc)] transition-ui cursor-pointer active:scale-[0.97]"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[var(--acc)]" />
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
                      className="flex items-center justify-center gap-1.5 p-2.5 rounded-[var(--r-pill)] text-xs font-bold bg-[var(--ok-soft)] hover:bg-[var(--ok-soft)] text-[var(--ink)] transition-ui cursor-pointer active:scale-[0.97]"
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
                      className="flex items-center justify-center gap-1.5 p-2.5 rounded-[var(--r-pill)] text-xs font-medium bg-[var(--sunken)] hover:bg-[var(--surface)] text-[var(--ink)] transition-ui cursor-pointer active:scale-[0.97] disabled:opacity-50"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[var(--ink-2)]" />
                      <span>{isEnrichingAddresses ? 'Rellenando direcciones...' : 'Autocompletar Direcciones'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Search & View Mode Switcher Row — Responsive (Mobile simple, PC full) */}
              <div className="flex flex-col gap-2.5">
                {/* BÚSQUEDA — Siempre visible */}
                <div className="flex-1 flex gap-2 items-center">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 pointer-events-none transition-colors text-[var(--acc-ink)]" />
                    <input
                      id="crm-search"
                      type="text"
                      placeholder={
                        sectionTab === 'medios'
                          ? 'Buscar medio...'
                          : sectionTab === 'grupos'
                            ? 'Buscar management...'
                            : 'Buscar escenario...'
                      }
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full rounded-[var(--r-m)] pl-9 ${searchTerm ? 'pr-8' : 'pr-3'} py-2 text-xs font-semibold font-sans transition-colors bg-[var(--sunken)] text-[var(--ink)] focus:ring-2 focus:ring-[var(--acc)]/40 placeholder:text-[var(--ink-2)]`}
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

                  {/* Tipo Dropdown Selector — Solo en PC */}
                  <div className="hidden sm:block relative shrink-0">
                    <select
                      id="crm-type-filter-select"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as any)}
                      aria-label="Filtrar por tipo"
                      className={`px-3 py-2 pr-7 rounded-[var(--r-m)] text-xs font-semibold font-sans transition-colors cursor-pointer appearance-none ${
                        typeFilter !== 'todos'
                          ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)] font-bold'
                          : 'bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {sectionTab === 'medios' ? (
                        <>
                          <option value="todos">Todos los medios ({sectionLeads.length})</option>
                          <option value="radio">Radios</option>
                          <option value="tv">TV</option>
                          <option value="prensa">Prensa</option>
                          <option value="redes">Redes</option>
                          <option value="podcast">Podcasts</option>
                        </>
                      ) : sectionTab === 'grupos' ? (
                        <>
                          <option value="todos">Todas las entidades ({sectionLeads.length})</option>
                          <option value="grupo">Grupos</option>
                          <option value="agencia">Agencias</option>
                          <option value="manager">Mánagers</option>
                          <option value="productora">Productoras</option>
                          <option value="sello">Sellos</option>
                        </>
                      ) : (
                        <>
                          <option value="todos">Tipo: Todos ({sectionLeads.length})</option>
                          <option value="sala">Salas ({sectionLeads.filter((l) => normalizeType(l.tipo) === 'sala').length})</option>
                          <option value="festival">
                            Festivales ({sectionLeads.filter((l) => normalizeType(l.tipo) === 'festival').length})
                          </option>
                          <option value="discoteca">
                            Discotecas ({sectionLeads.filter((l) => normalizeType(l.tipo) === 'discoteca').length})
                          </option>
                          <option value="ayuntamiento">
                            Ayuntamientos ({sectionLeads.filter((l) => normalizeType(l.tipo) === 'ayuntamiento').length})
                          </option>
                          <option value="agencia">
                            Agencias (
                            {sectionLeads.filter((l) => normalizeType(l.tipo) === 'agencia' || normalizeType(l.tipo) === 'manager').length})
                          </option>
                          <option value="sello">Sellos ({sectionLeads.filter((l) => normalizeType(l.tipo) === 'sello').length})</option>
                          <option value="productora">
                            Productores (
                            {
                              sectionLeads.filter((l) => normalizeType(l.tipo) === 'productora' || normalizeType(l.tipo) === 'productor')
                                .length
                            }
                            )
                          </option>
                          <option value="grupo">
                            Bandas Amigas ({sectionLeads.filter((l) => normalizeType(l.tipo) === 'grupo').length})
                          </option>
                        </>
                      )}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-2.5 pointer-events-none opacity-60" />
                  </div>

                  {/* Filters & Campaign — PC only, Mobile in Herramientas */}
                  <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                    <button
                      id="toggle-filters-btn"
                      type="button"
                      onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-[var(--r-pill)] text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                        activeFiltersCount > 0 || isMobileFiltersOpen
                          ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)]'
                          : 'bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]'
                      }`}
                      title="Filtros avanzados y búsquedas guardadas"
                    >
                      <Filter className="w-3.5 h-3.5" />
                      <span>Filtros</span>
                      {activeFiltersCount > 0 && (
                        <span className="w-4 h-4 rounded-[var(--r-pill)] bg-[var(--acc)] text-[var(--on-acc)] text-micro font-bold flex items-center justify-center">
                          {activeFiltersCount}
                        </span>
                      )}
                    </button>

                    {activeCampaign && (
                      <button
                        id="crm-campaign-filter-btn"
                        type="button"
                        onClick={() => setFilterByCampaign(!filterByCampaign)}
                        className={`px-3 py-2 rounded-[var(--r-pill)] text-xs font-semibold font-sans transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
                          filterByCampaign
                            ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)] font-bold'
                            : 'bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]'
                        }`}
                        title={filterByCampaign ? 'Quitar filtro de campaña' : 'Filtrar por campaña'}
                      >
                        <Target className="w-3.5 h-3.5 text-[var(--acc-ink)] shrink-0" />
                        <span>{filterByCampaign ? 'Campaña' : 'Campaña'}</span>
                        {filterByCampaign && (
                          <span className="px-1.5 py-0.2 rounded-[var(--r-pill)] bg-[var(--acc)]/20 text-[var(--on-acc)] text-micro font-semibold tabular-nums">
                            {filteredLeads.length}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* View Mode Toggle Switcher — PC: Completo, Móvil: Compacto */}
                <div className="flex items-center justify-between sm:justify-start gap-1 shrink-0">
                  <div className="p-1 rounded-[var(--r-m)] flex items-center gap-1 bg-[var(--sunken)]">
                    <button
                      id="crm-view-grid"
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-sans font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        viewMode === 'grid' ? 'bg-[var(--acc)] text-[var(--on-acc)]' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                      }`}
                      title="Vista en Tarjetas"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Tarjetas</span>
                    </button>
                    <button
                      id="crm-view-table"
                      type="button"
                      onClick={() => setViewMode('table')}
                      className={`px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-sans font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        viewMode === 'table' ? 'bg-[var(--acc)] text-[var(--on-acc)]' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                      }`}
                      title="Vista en Detalles / Tabla"
                    >
                      <List className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Detalles</span>
                    </button>
                    <button
                      id="crm-view-map"
                      type="button"
                      onClick={() => setViewMode('map')}
                      className={`px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-sans font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        viewMode === 'map' ? 'bg-[var(--acc)] text-[var(--on-acc)]' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                      }`}
                      title="Vista en Mapa GPS Interactivo"
                    >
                      <MapIcon className={`w-3.5 h-3.5 ${viewMode === 'map' ? 'text-[var(--on-acc)]' : 'text-[var(--ink-2)]'}`} />
                      <span className="hidden sm:inline">Mapa</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Enrich Status Banner */}
            {enrichStatusMsg && (
              <div
                className={`p-2.5 rounded-[var(--r-m)] text-micro font-sans flex items-center justify-between gap-2 animate-fadeIn ${
                  enrichStatusMsg.includes('¡Éxito!') ? 'bg-[var(--ok-soft)] text-[var(--ok)]' : 'bg-[var(--sunken)] text-[var(--ink-2)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin
                    className={`w-4 h-4 shrink-0 animate-bounce ${enrichStatusMsg.includes('¡Éxito!') ? 'text-[var(--ok)]' : 'text-[var(--ink-2)]'}`}
                  />
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
            <BookingFiltersPanel
              isOpen={isMobileFiltersOpen}
              onClose={() => setIsMobileFiltersOpen(false)}
              sectionTab={sectionTab}
              handleSelectSectionTab={handleSelectSectionTab}
              viewMode={viewMode}
              setViewMode={setViewMode}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              onlyFavoritesFilter={onlyFavoritesFilter}
              setOnlyFavoritesFilter={setOnlyFavoritesFilter}
              onlyVerifiedFilter={onlyVerifiedFilter}
              setOnlyVerifiedFilter={setOnlyVerifiedFilter}
              minCapacityFilter={minCapacityFilter}
              setMinCapacityFilter={setMinCapacityFilter}
              isSavingFilterOpen={isSavingFilterOpen}
              setIsSavingFilterOpen={setIsSavingFilterOpen}
              newFilterName={newFilterName}
              setNewFilterName={setNewFilterName}
              handleSaveCurrentFilter={handleSaveCurrentFilter}
              savedFilters={savedFilters}
              activeSavedFilterId={activeSavedFilterId}
              handleApplySavedFilter={handleApplySavedFilter}
              handleDeleteSavedFilter={handleDeleteSavedFilter}
              selectedCityFilter={selectedCityFilter}
              setSelectedCityFilter={setSelectedCityFilter}
              handleClearAllFilters={handleClearAllFilters}
              filteredCount={filteredLeads.length}
              sectionLeads={sectionLeads}
              normalizeType={normalizeType}
              activeLeadsForSection={activeLeadsForSection}
              displayCityChips={displayCityChips}
              cityCounts={cityCounts}
            />

            {/* Active Filters Pill Bar (Responsive on all screen sizes) */}
            {activeFiltersCount > 0 && !isMobileFiltersOpen && (
              <div className="flex items-center gap-1.5 overflow-x-auto shrink-0 pb-1 no-scrollbar text-xs animate-in fade-in duration-100">
                <span className="text-micro font-bold text-[var(--acc)] shrink-0">Filtros:</span>
                {selectedCityFilter && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--r-pill)] text-xs font-bold bg-[var(--acc)]/20 text-[var(--acc)]/70 shrink-0">
                    <ShowIcon inline emoji="📍" />{selectedCityFilter}
                    <button type="button" onClick={() => setSelectedCityFilter('')} className="hover:text-[var(--ink)] cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {typeFilter !== 'todos' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--r-pill)] text-xs font-bold bg-[var(--acc)]/20 text-[var(--acc)]/70 shrink-0">
                    <ShowIcon inline emoji="🏛️" />{typeFilter}
                    <button type="button" onClick={() => setTypeFilter('todos')} className="hover:text-[var(--ink)] cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {onlyFavoritesFilter && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--r-pill)] text-xs font-bold bg-[var(--acc)]/20 text-[var(--acc)]/70 shrink-0">
                    <ShowIcon inline emoji="⭐" />Favoritos
                    <button type="button" onClick={() => setOnlyFavoritesFilter(false)} className="hover:text-[var(--ink)] cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {onlyVerifiedFilter && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--r-pill)] text-xs font-bold bg-[var(--acc)]/20 text-[var(--ink-2)] shrink-0">
                    <ShowIcon inline emoji="✔" />Verificados
                    <button type="button" onClick={() => setOnlyVerifiedFilter(false)} className="hover:text-[var(--ink)] cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {minCapacityFilter > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--r-pill)] text-xs font-bold bg-[var(--acc)]/20 text-[var(--acc)]/70 shrink-0">
                    &gt;{minCapacityFilter} pax
                    <button type="button" onClick={() => setMinCapacityFilter(0)} className="hover:text-[var(--ink)] cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {activeSavedFilterId && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--r-pill)] text-xs font-bold bg-[var(--acc)]/20 text-[var(--acc)]/50 shrink-0">
                    <ShowIcon inline emoji="📌" />{savedFilters.find((f) => f.id === activeSavedFilterId)?.nombre || 'Búsqueda guardada'}
                    <button type="button" onClick={() => setActiveSavedFilterId(null)} className="hover:text-[var(--ink)] cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
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
            <div className="flex items-center gap-1.5 overflow-x-auto shrink-0 pb-1 no-scrollbar">
              {(
                [
                  { key: 'todos', label: 'Todos' },
                  { key: 'nuevo', label: 'Por contactar' },
                  { key: 'esperando_respuesta', label: 'Contactados' },
                  { key: 'seguimientos', label: 'Seguimientos' },
                  { key: 'respondido', label: 'En conversación' },
                  { key: 'negociando', label: 'Negociando' },
                  { key: 'confirmado', label: 'Confirmados' },
                  { key: 'aplazado', label: 'Aplazados' },
                  { key: 'no_interesado', label: 'Descartados' },
                ] as const
              ).map((tab) => {
                const count =
                  tab.key === 'todos'
                    ? sectionLeads.length
                    : tab.key === 'seguimientos'
                      ? sectionLeads.filter((l) => isLeadNeedsFollowup(l)).length
                      : sectionLeads.filter((l) => {
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
                    className={`px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-semibold transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)] font-bold'
                        : 'text-[var(--ink-2)] hover:text-[var(--ink)] bg-[var(--sunken)]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-micro px-1.5 py-0.2 rounded-[var(--r-pill)] tabular-nums ${
                        isSelected ? 'bg-[var(--acc)]/25 text-[var(--on-acc)]' : 'bg-[var(--surface)] text-[var(--ink-2)]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Route Anchor Active Filter Banner */}
            {routeAnchorCity && (
              <div className="flex items-center justify-between p-2.5 px-3.5 rounded-[var(--r-m)] bg-[var(--acc)]/50 text-[var(--acc)] text-xs">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[var(--acc)] shrink-0" />
                  <span>
                    <ShowIcon inline emoji="🚗" /><strong>Enlace de Fin de Semana desde {routeAnchorCity}:</strong> Mostrando {filteredLeads.length} salas compatibles
                    en ruta (&lt; 2.5h)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setRouteAnchorCity(null)}
                  className="text-[var(--acc)] hover:text-[var(--ink)] text-xs font-bold px-2 py-0.5 rounded bg-[var(--acc)]/60 cursor-pointer transition-colors"
                >
                  ✕ Quitar filtro de ruta
                </button>
              </div>
            )}

            {/* 🎯 GMAIL-STYLE BULK ACTIONS BAR (STICKY AT TOP OF LIST) */}
            <BulkLeadsActionBar
              selectedCount={selectedLeadIds.length}
              totalFilteredCount={filteredLeads.length}
              isAllSelected={filteredLeads.length > 0 && filteredLeads.every((l) => selectedLeadIds.includes(l.id))}
              onSelectAll={() => setSelectedLeadIds(filteredLeads.map((l) => l.id))}
              onDeselectAll={() => setSelectedLeadIds([])}
              onBulkStatusChange={(newStatus) => {
                if (selectedLeadIds.length === 0) return;
                selectedLeadIds.forEach((id) => {
                  onUpdateLead(id, { estado: newStatus });
                });
              }}
              onBulkToggleFavorite={(isFav) => {
                if (selectedLeadIds.length === 0) return;
                selectedLeadIds.forEach((id) => {
                  onUpdateLead(id, { es_favorito: isFav });
                });
              }}
              onBulkGeneratePitches={async () => {
                const selectedList = leads.filter((l) => selectedLeadIds.includes(l.id));
                if (selectedList.length === 0) return;

                const initialItems: BulkProgressItem[] = selectedList.map((l) => ({
                  id: l.id,
                  name: l.nombre_sala,
                  status: 'pending',
                }));

                setBulkProgressState({
                  isOpen: true,
                  title: 'Generando Pitches con IA Agéntica',
                  subtitle: 'Redactando propuestas personalizadas basadas en el ADN de la banda',
                  items: initialItems,
                  currentIndex: 0,
                  totalCount: initialItems.length,
                  isCompleted: false,
                });

                const updatedItems = [...initialItems];

                for (let i = 0; i < selectedList.length; i++) {
                  const targetLead = selectedList[i];
                  updatedItems[i] = {
                    ...updatedItems[i],
                    status: 'in_progress',
                    detail: 'Contactando Agente Redactor...',
                  };
                  setBulkProgressState((prev) => ({
                    ...prev,
                    items: [...updatedItems],
                    currentIndex: i,
                  }));

                  try {
                    const campaignIsActive = Boolean(
                      activeCampaign && (activeCampaign.isActive ?? (activeCampaign as any).is_active ?? true)
                    );
                    const res = await apiFetch(`/api/leads/${targetLead.id}/regenerate-pitch`, {
                      method: 'POST',
                      body: JSON.stringify({
                        activeCampaign: campaignIsActive ? activeCampaign : undefined,
                      }),
                    });

                    if (res.success && res.newPitchText) {
                      onUpdateLead(targetLead.id, {
                        pitch_generado: res.newPitchText,
                        estado: 'pendiente_aprobacion',
                      });
                      updatedItems[i] = {
                        ...updatedItems[i],
                        status: 'success',
                        detail: res.simulated ? 'Propuesta lista (motor local ADN)' : 'Propuesta redactada',
                      };
                    } else {
                      updatedItems[i] = {
                        ...updatedItems[i],
                        status: 'error',
                        detail: res.error || 'No se pudo generar la propuesta',
                      };
                    }
                  } catch (err: any) {
                    updatedItems[i] = {
                      ...updatedItems[i],
                      status: 'error',
                      detail: err.message || 'Error al generar',
                    };
                  }

                  setBulkProgressState((prev) => ({
                    ...prev,
                    items: [...updatedItems],
                    currentIndex: i + 1,
                  }));
                }

                setBulkProgressState((prev) => ({
                  ...prev,
                  isCompleted: true,
                }));
              }}
              onBulkEnrich={async () => {
                const selectedList = leads.filter((l) => selectedLeadIds.includes(l.id));
                if (selectedList.length === 0) return;

                const initialItems: BulkProgressItem[] = selectedList.map((l) => ({
                  id: l.id,
                  name: l.nombre_sala,
                  status: 'pending',
                }));

                setBulkProgressState({
                  isOpen: true,
                  title: 'Enriquecimiento Masivo con Agente Scout',
                  subtitle: 'Buscando datos de contacto, aforo, dirección y redes',
                  items: initialItems,
                  currentIndex: 0,
                  totalCount: initialItems.length,
                  isCompleted: false,
                });

                const updatedItems = [...initialItems];

                for (let i = 0; i < selectedList.length; i++) {
                  const targetLead = selectedList[i];
                  updatedItems[i] = {
                    ...updatedItems[i],
                    status: 'in_progress',
                    detail: 'Buscando datos...',
                  };
                  setBulkProgressState((prev) => ({
                    ...prev,
                    items: [...updatedItems],
                    currentIndex: i,
                  }));

                  try {
                    const res = await apiFetch(`/api/leads/enrich-lead`, {
                      method: 'POST',
                      body: JSON.stringify({
                        leadId: targetLead.id,
                        name: targetLead.nombre_sala,
                        city: targetLead.ciudad || 'España',
                      }),
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
                        updatedItems[i] = {
                          ...updatedItems[i],
                          status: 'success',
                          detail: `Actualizado: ${Object.keys(updates).join(', ')}`,
                        };
                      } else {
                        updatedItems[i] = {
                          ...updatedItems[i],
                          status: 'success',
                          detail: 'Ficha al día',
                        };
                      }
                    } else {
                      updatedItems[i] = {
                        ...updatedItems[i],
                        status: 'success',
                        detail: 'Sin datos nuevos',
                      };
                    }
                  } catch (err: any) {
                    updatedItems[i] = {
                      ...updatedItems[i],
                      status: 'error',
                      detail: err.message || 'Error en búsqueda',
                    };
                  }

                  setBulkProgressState((prev) => ({
                    ...prev,
                    items: [...updatedItems],
                    currentIndex: i + 1,
                  }));
                }

                setBulkProgressState((prev) => ({
                  ...prev,
                  isCompleted: true,
                }));
              }}
              onBulkExportCsv={() => setIsExportLeadsOpen(true)}
              onBulkDelete={() => {
                if (selectedLeadIds.length === 0) return;
                const idsToDelete = [...selectedLeadIds];
                setSelectedLeadIds([]);
                if (onBulkDeleteLeads) {
                  onBulkDeleteLeads(idsToDelete);
                } else if (onDeleteLead) {
                  idsToDelete.forEach((id) => onDeleteLead(id));
                }
              }}
              sectionTab={sectionTab}
            />

            {/* Main Display Area: Map vs List */}
            {viewMode === 'map' ? (
              <VenueMap
                leads={filteredLeads}
                selectedLead={selectedLead}
                onSelectLead={handleOpenLead}
                onUpdateLead={onUpdateLead}
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
                  setSelectedLeadIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
                }}
                onSelectAllFiltered={() => {
                  setSelectedLeadIds(filteredLeads.map((l) => l.id));
                }}
                onDeselectAll={() => setSelectedLeadIds([])}
                isAllSelected={filteredLeads.length > 0 && filteredLeads.every((l) => selectedLeadIds.includes(l.id))}
                isSomeSelected={filteredLeads.length > 0 && filteredLeads.some((l) => selectedLeadIds.includes(l.id))}
                onFilterByRouteCity={setRouteAnchorCity}
                effectiveBandName={effectiveBandName}
                concerts={concerts}
              />
            )}
          </div>
        </div>

        {/* DETAILED WORKSPACE PANEL (Desktop view - rendered when a lead is selected) */}
        {selectedLead && (
          <div ref={interventionPanelRef} className="hidden lg:block space-y-6 lg:col-span-1 transition-ui duration-300">
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
          activeCampaign={activeCampaign}
          onLeadLogoUpload={(file) => handleLeadLogoUpload(file, true)}
          isUploadingLeadLogo={isUploadingLeadLogo}
          onFilterByRouteCity={setRouteAnchorCity}
          bandName={effectiveBandName}
          concerts={concerts}
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
              <p className="text-xs font-sans mt-0.5 text-[var(--ink-2)]">
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
                  ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)]'
                  : 'bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              <span>{isTemplatesSectionOpen ? 'Plegar' : 'Configurar'}</span>
              {isTemplatesSectionOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {isTemplatesSectionOpen && (
          <div className="mt-5 pt-4">
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
        existingLeads={leads}
        onClose={() => setIsExcelImportOpen(false)}
        onSuccess={(importedLeads, updatedCount) => {
          window.dispatchEvent(new CustomEvent('app-data-updated'));
          if (importedLeads.length > 0 && onAddLead) {
            importedLeads.forEach((l) => onAddLead(l));
          }
        }}
      />

      <CRMContactEnricherModal
        isOpen={isContactEnricherOpen}
        onClose={() => setIsContactEnricherOpen(false)}
        leads={leads}
        onUpdateLead={onUpdateLead}
      />

      <AgentAutonomySettingsModal
        isOpen={isAgentConfigOpen}
        onClose={() => setIsAgentConfigOpen(false)}
        bandName={effectiveBandName}
        bandId={currentBandId || currentUser?.band_id || ''}
        currentUser={currentUser}
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

      <AgentQueueMonitorModal isOpen={isQueueMonitorOpen} onClose={() => setIsQueueMonitorOpen(false)} bandName={effectiveBandName} />

      {/* BULK PROGRESS MODAL */}
      <BulkProgressModal
        isOpen={bulkProgressState.isOpen}
        onClose={() => setBulkProgressState((prev) => ({ ...prev, isOpen: false }))}
        title={bulkProgressState.title}
        subtitle={bulkProgressState.subtitle}
        items={bulkProgressState.items}
        currentIndex={bulkProgressState.currentIndex}
        totalCount={bulkProgressState.totalCount}
        isCompleted={bulkProgressState.isCompleted}
      />

      {/* MODULE TUTORIAL MODAL */}
      <ModuleTutorialModal isOpen={bookingTutorial.isOpen} onClose={bookingTutorial.closeTutorial} moduleId="booking" />

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
            imagen_url: '',
          });
          setIsAddingLeadModalOpen(true);
        }}
        className="sm:hidden fixed bottom-24 right-5 z-40 flex items-center justify-center w-14 h-14 rounded-[var(--r-pill)] bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] active:scale-[0.97] transition-ui cursor-pointer animate-bounce"
        style={{ animationDuration: '3s' }}
        title="Añadir contacto"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>
    </div>
  );
}
