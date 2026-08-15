import React, { useState, useEffect, useMemo } from 'react';
import { Lead, LeadStatus, LeadType, ThemeColors, EPKConfig, InteractionLog, SavedFilter } from '../types';
import DirectionsCard from './DirectionsCard';
import { apiFetch } from '../utils/api';
import { uploadFileToServer } from '../utils/audioStorage';
import { 
 Search, ShieldCheck, Mail, Clock, Check, X, RefreshCw, 
 MapPin, Users, Bot, MessageSquare, Edit3, Settings, Sparkles, Send, LogOut, Loader2, Building, Radio, Building2, Tent, Landmark, Disc3, Briefcase,
 PlusCircle, Newspaper, Tv, Headphones, Globe, FileText, Plus, SlidersHorizontal, Map as MapIcon, List, LayoutGrid,
 Share2, Repeat, Truck, Handshake, Music, Zap, Upload, Image as ImageIcon, Download, Phone, PhoneCall, MessageCircle, Bookmark, BookmarkCheck, Filter, Trash2, History, Calendar, ListFilter, CheckCircle2, Save, Star, ChevronDown, ChevronUp, Wrench, FileSpreadsheet
} from 'lucide-react';
import { initAuth, googleSignIn, logout, fetchGmailThreadsForEmail } from '../utils/gmail';
import { VenueMap } from './VenueMap';
import { AddLeadModal } from './booking/AddLeadModal';
import { GooglePlacesExplorerModal } from './booking/GooglePlacesExplorerModal';
import { CRMContactEnricherModal } from './booking/CRMContactEnricherModal';
import { ExcelImportModal } from './booking/ExcelImportModal';
import { TemplateConfigSection } from './booking/TemplateConfigSection';
import { NegotiationSimulationModal } from './booking/NegotiationSimulationModal';
import { LeadsTable } from './booking/LeadsTable';
import { VenueDetailPanel } from './booking/VenueDetailPanel';
import { MobileBottomSheet } from './booking/MobileBottomSheet';
import { isLeadVerificado } from '../utils/leadReliability';
import { AgentAutonomySettingsModal } from './dashboard/AgentAutonomySettingsModal';

export type TemplateCategory = 'salas' | 'festivales' | 'discotecas' | 'medios' | 'grupos' | 'managements';

interface BookingCRMProps {
 leads: Lead[];
 colors: ThemeColors;
 onUpdateLead: (leadId: string, updatedFields: Partial<Lead>, expectedStatus?: string) => void;
 onAddLead?: (lead: Lead) => void;
 onDeleteLead?: (id: string) => void;
 initialSection?: 'salas' | 'medios' | 'grupos';
 initialStatusFilter?: LeadStatus | 'todos';
 initialSelectedLeadId?: string;
 epkConfig?: Partial<EPKConfig>;
 onUpdateEpkConfig?: (newConfig: Partial<EPKConfig>) => void;
 currentBandId?: string;
 currentUser?: any;
 bandName?: string;
}

import { 
  normalizeStatus, 
  normalizeType, 
  autoDetectVenueAddress, 
  VENUE_ADDRESS_DATABASE 
} from '../utils/bookingUtils';

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
 initialSection = 'salas',
 initialStatusFilter = 'todos',
 initialSelectedLeadId,
 epkConfig,
 onUpdateEpkConfig,
 currentBandId,
 currentUser,
 bandName
}: BookingCRMProps) {
 const effectiveBandName = bandName || 'Tu Banda';
 const [sectionTab, setSectionTab] = useState<'salas' | 'medios' | 'grupos'>(initialSection || 'salas');
 const [searchTerm, setSearchTerm] = useState('');
 const [statusFilter, setStatusFilter] = useState<LeadStatus | 'todos'>(initialStatusFilter);
 const [mediaTypeFilter, setMediaTypeFilter] = useState<'televisión' | 'radio' | 'redes' | 'managements' | 'todos'>('todos');
 const [isAgentConfigOpen, setIsAgentConfigOpen] = useState(false);
 const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
 const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

 useEffect(() => {
 if (initialSection) {
 setSectionTab(initialSection);
 }
 }, [initialSection]);

 useEffect(() => {
 if (initialStatusFilter !== undefined) {
 setStatusFilter(initialStatusFilter);
 }
 }, [initialStatusFilter]);

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

 const [typeFilter, setTypeFilter] = useState<LeadType | 'todos'>('todos');
 const [viewMode, setViewMode] = useState<'grid' | 'table' | 'map'>('table');
 const [selectedCityFilter, setSelectedCityFilter] = useState<string>('');
 
 // Custom City Chips state (persisted per band/user session)
 const [customCityChips, setCustomCityChips] = useState<string[]>(() => {
   if (epkConfig?.ciudadesConfig && Array.isArray(epkConfig.ciudadesConfig) && epkConfig.ciudadesConfig.length > 0) {
     return epkConfig.ciudadesConfig;
   }
   try {
     const saved = localStorage.getItem('bakandeya_custom_cities');
     return saved ? JSON.parse(saved) : ['Madrid', 'Sevilla', 'Barcelona', 'Málaga', 'Valencia', 'Granada', 'Cádiz'];
   } catch {
     return ['Madrid', 'Sevilla', 'Barcelona', 'Málaga', 'Valencia', 'Granada', 'Cádiz'];
   }
 });

 useEffect(() => {
   if (epkConfig?.ciudadesConfig && Array.isArray(epkConfig.ciudadesConfig) && epkConfig.ciudadesConfig.length > 0) {
     setCustomCityChips(epkConfig.ciudadesConfig);
   }
 }, [epkConfig?.ciudadesConfig]);
 const [isAddingCityChip, setIsAddingCityChip] = useState(false);
 const [newCityInput, setNewCityInput] = useState('');

  // --- SAVED FILTERS & QUICK SEARCH PRESETS STATE ---
  const DEFAULT_PRESET_FILTERS: SavedFilter[] = [
    {
      id: 'preset-bcn-300',
      nombre: 'Salas Cataluña / BCN (Aforo > 300) pendientes',
      sectionTab: 'salas',
      selectedCityFilter: 'Barcelona',
      statusFilter: 'nuevo',
      minCapacityFilter: 300
    },
    {
      id: 'preset-festivales-pendientes',
      nombre: 'Festivales pendientes de respuesta',
      sectionTab: 'salas',
      typeFilter: 'festival',
      statusFilter: 'esperando_respuesta'
    },
    {
      id: 'preset-prensa-madrid',
      nombre: 'Medios y prensa en Madrid',
      sectionTab: 'medios',
      selectedCityFilter: 'Madrid',
      typeFilter: 'medio'
    },
    {
      id: 'preset-interesados-negociando',
      nombre: 'Salas interesadas / Negociando',
      sectionTab: 'salas',
      statusFilter: 'interesado'
    }
  ];

  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    try {
      const saved = localStorage.getItem('bakandeya_saved_crm_filters');
      return saved ? JSON.parse(saved) : DEFAULT_PRESET_FILTERS;
    } catch {
      return DEFAULT_PRESET_FILTERS;
    }
  });

  const [minCapacityFilter, setMinCapacityFilter] = useState<number>(0);
  const [onlyFavoritesFilter, setOnlyFavoritesFilter] = useState<boolean>(false);
  const [onlyVerifiedFilter, setOnlyVerifiedFilter] = useState<boolean>(false);
  const [isSavingFilterOpen, setIsSavingFilterOpen] = useState<boolean>(false);
  const [newFilterName, setNewFilterName] = useState<string>('');
  const [activeSavedFilterId, setActiveSavedFilterId] = useState<string | null>(null);

  // --- BITÁCORA DE CONTACTO (LLAMADAS & WHATSAPP) STATE ---
  const [interactionType, setInteractionType] = useState<'Llamada' | 'WhatsApp' | 'Email' | 'Reunión' | 'Otro'>('Llamada');
  const [interactionNotes, setInteractionNotes] = useState<string>('');
  const [interactionResultado, setInteractionResultado] = useState<'Interesado' | 'Enviar propuesta' | 'Seguimiento pendiente' | 'Rechazado' | 'Info recibida' | 'Acuerdo cerrado'>('Seguimiento pendiente');
  const [interactionAutor, setInteractionAutor] = useState<string>('Diego / Filgue');

  const handleApplySavedFilter = (sf: SavedFilter) => {
    setActiveSavedFilterId(sf.id);
    if (sf.sectionTab) setSectionTab(sf.sectionTab);
    setSearchTerm(sf.searchTerm || '');
    setSelectedCityFilter(sf.selectedCityFilter || '');
    setStatusFilter(sf.statusFilter || 'todos');
    setTypeFilter(sf.typeFilter || 'todos');
    setMinCapacityFilter(sf.minCapacityFilter || 0);
  };

  const handleSaveCurrentFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilterName.trim()) return;

    const newSf: SavedFilter = {
      id: `filter-${Date.now()}`,
      nombre: newFilterName.trim(),
      sectionTab,
      searchTerm,
      selectedCityFilter,
      statusFilter,
      typeFilter,
      minCapacityFilter
    };

    const updated = [newSf, ...savedFilters];
    setSavedFilters(updated);
    try {
      localStorage.setItem('bakandeya_saved_crm_filters', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    setActiveSavedFilterId(newSf.id);
    setNewFilterName('');
    setIsSavingFilterOpen(false);
  };

  const handleDeleteSavedFilter = (filterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedFilters.filter(f => f.id !== filterId);
    setSavedFilters(updated);
    try {
      localStorage.setItem('bakandeya_saved_crm_filters', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    if (activeSavedFilterId === filterId) {
      setActiveSavedFilterId(null);
    }
  };

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setSelectedCityFilter('');
    setStatusFilter('todos');
    setTypeFilter('todos');
    setMinCapacityFilter(0);
    setOnlyFavoritesFilter(false);
    setOnlyVerifiedFilter(false);
    setActiveSavedFilterId(null);
  };

  const handleAddInteractionLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !interactionNotes.trim()) return;

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newLog: InteractionLog = {
      id: `log-${Date.now()}`,
      fecha: nowStr,
      tipo: interactionType,
      autor: interactionAutor,
      notas: interactionNotes.trim(),
      resultado: interactionResultado
    };

    const existingLogs = selectedLead.historial_contacto || [];
    const updatedLogs = [newLog, ...existingLogs];

    let newStatus = selectedLead.estado;
    if (interactionResultado === 'Interesado' && selectedLead.estado !== 'interesado') {
      newStatus = 'interesado';
    } else if (interactionResultado === 'Acuerdo cerrado' && selectedLead.estado !== 'negociando') {
      newStatus = 'negociando';
    } else if (interactionResultado === 'Rechazado' && selectedLead.estado !== 'no_interesado') {
      newStatus = 'no_interesado';
    }

    onUpdateLead(selectedLead.id, {
      historial_contacto: updatedLogs,
      estado: newStatus,
      fecha_ultima_respuesta: new Date().toISOString().slice(0, 10)
    });

    setSelectedLead(prev => prev ? {
      ...prev,
      historial_contacto: updatedLogs,
      estado: newStatus,
      fecha_ultima_respuesta: new Date().toISOString().slice(0, 10)
    } : null);

    setInteractionNotes('');
  };

  const handleDeleteInteractionLog = (logId: string) => {
    if (!selectedLead || !selectedLead.historial_contacto) return;
    const updated = selectedLead.historial_contacto.filter(l => l.id !== logId);
    onUpdateLead(selectedLead.id, { historial_contacto: updated });
    setSelectedLead(prev => prev ? { ...prev, historial_contacto: updated } : null);
  };

 // Dynamically extract top cities present in active leads
 const activeLeadsForSection = useMemo(() => {
 return leads.filter(l => sectionTab === 'medios' ? normalizeType(l.tipo) === 'medio' : normalizeType(l.tipo) !== 'medio');
 }, [leads, sectionTab]);

 const cityCounts = useMemo(() => {
 const counts: Record<string, number> = {};
 activeLeadsForSection.forEach(l => {
 const cityRaw = (l.ciudad || '').trim();
 if (cityRaw) {
 const mainCity = cityRaw.split(/[\(\-\/]/)[0].trim();
 if (mainCity) {
 counts[mainCity] = (counts[mainCity] || 0) + 1;
 }
 }
 });
 return counts;
 }, [activeLeadsForSection]);

 const topDynamicCities = useMemo(() => {
 return Object.entries(cityCounts)
 .sort((a, b) => Number(b[1]) - Number(a[1]))
 .slice(0, 7)
 .map(([cityName]) => cityName);
 }, [cityCounts]);

 const displayCityChips = useMemo(() => {
 const list = [...new Set([...customCityChips, ...topDynamicCities])];
 return list;
 }, [topDynamicCities, customCityChips]);

 const handleAddCustomCity = (e?: React.FormEvent) => {
 if (e) e.preventDefault();
 if (!newCityInput.trim()) return;
 const formatted = newCityInput.trim();
 if (!customCityChips.includes(formatted)) {
 const updated = [...customCityChips, formatted];
 setCustomCityChips(updated);
 try { localStorage.setItem('bakandeya_custom_cities', JSON.stringify(updated)); } catch {}
 if (onUpdateEpkConfig) {
 onUpdateEpkConfig({ ciudadesConfig: updated });
 }
 }
 setSelectedCityFilter(formatted);
 setNewCityInput('');
 setIsAddingCityChip(false);
 };

 const handleRemoveCustomCity = (cityToRemove: string, e: React.MouseEvent) => {
 e.stopPropagation();
 const updated = customCityChips.filter(c => c !== cityToRemove);
 setCustomCityChips(updated);
 try { localStorage.setItem('bakandeya_custom_cities', JSON.stringify(updated)); } catch {}
 if (selectedCityFilter === cityToRemove) {
 setSelectedCityFilter('');
 }
 if (onUpdateEpkConfig) {
 onUpdateEpkConfig({ ciudadesConfig: updated });
 }
 };

 const interventionPanelRef = React.useRef<HTMLDivElement>(null);
 const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

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
 const [isAddingLeadModalOpen, setIsAddingLeadModalOpen] = useState(false);
 const [newLeadData, setNewLeadData] = useState({
 nombre_sala: '',
 ciudad: '',
 region: 'Nacional',
 direccion: '',
 aforo: 0,
 tipo: 'medio' as LeadType,
 email_contacto: '',
 telefono: '',
 website: '',
 genero: 'Radio',
 notas: '',
 pitch_generado: '',
 icono: '📻',
 imagen_url: ''
 });

 const [isUploadingLeadLogo, setIsUploadingLeadLogo] = useState(false);

 const handleLeadLogoUpload = async (file: File, isEdit: boolean): Promise<string | null> => {
  try {
    setIsUploadingLeadLogo(true);
    const targetBandId = currentBandId || 'band-bakandeya';
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

 // Gmail integration states
 const [gmailUser, setGmailUser] = useState<any>(null);
 const [gmailToken, setGmailToken] = useState<string | null>(null);
 const [isSyncingGmail, setIsSyncingGmail] = useState(false);
 const [gmailStatusMsg, setGmailStatusMsg] = useState('');

 // Email thread and manual dispatch states
 const [activeTab, setActiveTab] = useState<'info' | 'emails'>('info');
 const [manualEmailBody, setManualEmailBody] = useState('');
 const [manualEmailSubject, setManualEmailSubject] = useState('');
 const [manualEmailSender, setManualEmailSender] = useState('Bakandeya Agent Manager IA');
 const [manualEmailStatus, setManualEmailStatus] = useState('');

 // Advanced Simulation States
 const [isSimulatingAvanzado, setIsSimulatingAvanzado] = useState(false);
 const [simulationRole, setSimulationRole] = useState<'sala' | 'banda'>('sala');
 const [simulationScenario, setSimulationScenario] = useState('taquilla');
 const [simulationCustomInstruction, setSimulationCustomInstruction] = useState('');
 const [simulationSenderName, setSimulationSenderName] = useState('Programación');
 const [simulationSubject, setSimulationSubject] = useState('');
 const [simulationMessage, setSimulationMessage] = useState('');
 const [isGeneratingSimulation, setIsGeneratingSimulation] = useState(false);
 const [simulationGenerated, setSimulationGenerated] = useState(false);

 const PREDEFINED_SCENARIOS = {
 sala: [
 { key: 'taquilla', label: 'Interés y reparto de taquilla (70/30 o similar)', defaultInstruction: 'La sala muestra gran interés por el directo. Propone una fecha de viernes o sábado de noviembre, un reparto de taquilla del 70/30 a favor de la banda, y entradas a 12€.' },
 { key: 'rider', label: 'Exigencias de Rider Técnico y horarios', defaultInstruction: 'La sala está interesada pero exige revisar detalladamente el rider de violín, percusión y sintetizadores analógicos, y pregunta por la hora de montaje de Bakandeya.' },
 { key: 'lleno', label: 'Rechazo amable por calendario lleno', defaultInstruction: 'La sala felicita a la banda por su dossier pero explica que tiene el calendario de otoño cerrado. Ofrece dejar el contacto para la gira de primavera.' },
 { key: 'contrato', label: 'Aceptación final y petición de datos fiscales', defaultInstruction: 'La sala confirma la fecha sugerida en el pitch, acepta las condiciones de la banda y solicita los datos fiscales (CIF, dirección, representante) para redactar el contrato oficial.' },
 { key: 'custom', label: 'Instrucción libre personalizada...', defaultInstruction: '' }
 ],
 banda: [
 { key: 'contrapropuesta', label: 'Contrapropuesta de fecha (Fin de semana) y co-organización', defaultInstruction: 'Bakandeya Agent Manager IA responde sugiriendo cambiar un concierto propuesto en miércoles a un viernes o sábado de noviembre, y sugiere compartir cartel con una banda local para asegurar aforo.' },
 { key: 'aceptacion_rider', label: 'Aceptación de condiciones y especificación de sintetizadores', defaultInstruction: 'Diego (guitarra) responde aceptando el reparto de taquilla propuesto y especifica que los sintetizadores analógicos van listos en dos líneas estéreo balanceadas.' },
 { key: 'cache_minimo', label: 'Solicitud de caché o mínimo garantizado para cubrir furgoneta', defaultInstruction: 'Filgue (bajo) responde explicando de forma amigable que al viajar desde Madrid/Sevilla necesitan un mínimo garantizado de 300€ para cubrir gastos de gasolina y viaje.' },
 { key: 'custom', label: 'Instrucción libre personalizada...', defaultInstruction: '' }
 ]
 };

 const handleRoleChange = (role: 'sala' | 'banda') => {
 setSimulationRole(role);
 setSimulationGenerated(false);
 setSimulationMessage('');
 
 if (role === 'sala') {
 setSimulationSenderName(selectedLead ? `Programador de ${selectedLead.nombre_sala}` : 'Programación');
 setSimulationScenario('taquilla');
 setSimulationSubject(selectedLead?.hilo_emails && selectedLead.hilo_emails.length > 0
 ? `RE: ${selectedLead.hilo_emails[selectedLead.hilo_emails.length - 1].asunto}`
 : 'Re: Propuesta de concierto - Bakandeya');
 setSimulationCustomInstruction('La sala muestra gran interés por el directo. Propone una fecha de viernes o sábado de noviembre, un reparto de taquilla del 70/30 a favor de la banda, y entradas a 12€.');
 } else {
 setSimulationSenderName('Bakandeya Agent Manager IA');
 setSimulationScenario('contrapropuesta');
 setSimulationSubject(selectedLead?.hilo_emails && selectedLead.hilo_emails.length > 0
 ? `RE: ${selectedLead.hilo_emails[selectedLead.hilo_emails.length - 1].asunto}`
 : 'Re: Propuesta de concierto - Bakandeya');
 setSimulationCustomInstruction('Bakandeya Agent Manager IA responde sugiriendo cambiar un concierto propuesto en miércoles a un viernes o sábado de noviembre, y sugiere compartir cartel con una banda local para asegurar aforo.');
 }
 };

 const handleScenarioChange = (scenarioKey: string) => {
 setSimulationScenario(scenarioKey);
 setSimulationGenerated(false);
 setSimulationMessage('');
 
 const scenarios = simulationRole === 'sala' ? PREDEFINED_SCENARIOS.sala : PREDEFINED_SCENARIOS.banda;
 const found = scenarios.find(s => s.key === scenarioKey);
 if (found) {
 setSimulationCustomInstruction(found.defaultInstruction);
 }
 };

 const handleOpenAdvancedSimulation = () => {
 if (!selectedLead) return;
 setIsSimulatingAvanzado(true);
 setSimulationGenerated(false);
 setSimulationMessage('');
 
 setSimulationRole('sala');
 setSimulationScenario('taquilla');
 setSimulationSenderName(`Programador de ${selectedLead.nombre_sala}`);
 setSimulationSubject(selectedLead.hilo_emails && selectedLead.hilo_emails.length > 0
 ? `RE: ${selectedLead.hilo_emails[selectedLead.hilo_emails.length - 1].asunto}`
 : 'Re: Propuesta de concierto - Bakandeya');
 setSimulationCustomInstruction('La sala muestra gran interés por el directo. Propone una fecha de viernes o sábado de noviembre, un reparto de taquilla del 70/30 a favor de la banda, y entradas a 12€.');
 };

 const handleGenerateSimulationEmail = async () => {
 if (!selectedLead) return;
 setIsGeneratingSimulation(true);
 try {
 const res = await apiFetch('/api/generate-simulated-email', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 leadId: selectedLead.id,
 role: simulationRole,
 scenario: simulationScenario,
 customInstruction: simulationCustomInstruction,
 senderName: simulationSenderName
 })
 });
 if (res.ok) {
 const data = await res.json();
 setSimulationMessage(data.message);
 setSimulationGenerated(true);
 } else {
 alert('Error al generar la simulación.');
 }
 } catch (err) {
 console.error(err);
 alert('Error de conexión al generar la simulación.');
 } finally {
 setIsGeneratingSimulation(false);
 }
 };

 const handleCommitSimulation = () => {
 if (!selectedLead || !simulationMessage) return;

 const now = new Date();
 const fechaStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

 const newMsg = {
 id: `em-sim-${Date.now()}`,
 fecha: fechaStr,
 remitente: simulationRole,
 remitente_nombre: simulationSenderName,
 asunto: simulationSubject || 'Re: Propuesta de concierto - Bakandeya',
 mensaje: simulationMessage
 };

 const currentHilo = selectedLead.hilo_emails || [];
 const nuevoHilo = [...currentHilo, newMsg];
 
 let nuevoEstado = selectedLead.estado;
 if (simulationRole === 'sala') {
 const lowerMsg = simulationMessage.toLowerCase();
 if (lowerMsg.includes('cerrado') || lowerMsg.includes('lo siento') || lowerMsg.includes('lleno')) {
 // No cambia de estado a negociando si es un rechazo claro
 } else {
 nuevoEstado = 'negociando';
 }
 } else {
 if (selectedLead.estado === 'nuevo' || selectedLead.estado === 'pendiente_aprobacion' || selectedLead.estado === 'aprobado') {
 nuevoEstado = 'esperando_respuesta';
 }
 }

 const today = new Date().toISOString().split('T')[0];
 const roleLabel = simulationRole === 'sala' ? 'sala' : 'banda';
 const nuevaNota = `*** [${today}] Correo de simulación de ${roleLabel} (${simulationSenderName}) ***\n` + (selectedLead.notas || '');

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

 setIsSimulatingAvanzado(false);
 setManualEmailStatus(`¡Simulación completada! Correo de ${simulationRole === 'sala' ? 'sala' : 'banda'} registrado y sincronizado.`);
 setTimeout(() => {
 setManualEmailStatus('');
 }, 5000);
 };

 // Initialize Auth listeners
 React.useEffect(() => {
 const unsubscribe = initAuth(
 (user, token) => {
 setGmailUser(user);
 setGmailToken(token);
 },
 () => {
 setGmailUser(null);
 setGmailToken(null);
 }
 );
 return () => unsubscribe();
 }, []);

 const handleGmailLogin = async () => {
 try {
 setGmailStatusMsg('Conectando con Google...');
 const result = await googleSignIn();
 if (result) {
 setGmailUser(result.user);
 setGmailToken(result.accessToken);
 setGmailStatusMsg('Google conectado correctamente.');
 setTimeout(() => setGmailStatusMsg(''), 3000);
 }
 } catch (err: any) {
 console.error('Error logging in with Google:', err);
 const isIframeEnv = window.self !== window.top;
 if (
 err?.code === 'auth/popup-closed-by-user' || 
 err?.message?.includes('popup-closed-by-user') || 
 err?.message?.includes('closed-by-user') ||
 isIframeEnv
 ) {
 setGmailStatusMsg(
 '⚠️ Restricción de Iframe: El navegador bloqueó o cerró el popup de Google. ' +
 'Para poder conectar tu cuenta, haz clic en el botón"Abrir en pestaña nueva" ' +
 'que ves abajo o en la barra de AI Studio.'
 );
 } else {
 setGmailStatusMsg('No se pudo conectar: ' + (err.message || String(err)));
 }
 }
 };

 const handleGmailLogout = async () => {
 await logout();
 setGmailUser(null);
 setGmailToken(null);
 setGmailStatusMsg('Conexión de Google cerrada.');
 setTimeout(() => setGmailStatusMsg(''), 3000);
 };

 const handleSyncGmailForLead = async () => {
 if (!selectedLead || !gmailToken) return;
 setIsSyncingGmail(true);
 setGmailStatusMsg('Buscando correos de este contacto en tu Gmail...');
 try {
 const email = selectedLead.email_contacto;
 if (!email) {
 throw new Error('Este contacto no tiene dirección de email registrada.');
 }
 
 const fetchedMsgs = await fetchGmailThreadsForEmail(email, gmailToken);
 
 if (fetchedMsgs.length === 0) {
 setGmailStatusMsg('No se encontraron correos de este contacto en Gmail.');
 setIsSyncingGmail(false);
 setTimeout(() => setGmailStatusMsg(''), 4000);
 return;
 }

 // Merge fetched messages with existing ones
 const currentHilo = selectedLead.hilo_emails || [];
 const mergedHilo = [...currentHilo];
 
 let addedCount = 0;
 for (const newMsg of fetchedMsgs) {
 if (!mergedHilo.some(m => m.id === newMsg.id || (m.fecha === newMsg.fecha && m.mensaje === newMsg.mensaje))) {
 mergedHilo.push(newMsg);
 addedCount++;
 }
 }

 // Sort by date ascending
 mergedHilo.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

 // Update lead
 onUpdateLead(selectedLead.id, {
 hilo_emails: mergedHilo
 });

 setSelectedLead(prev => prev ? {
 ...prev,
 hilo_emails: mergedHilo
 } : null);

 setGmailStatusMsg(`¡Sincronización completada! Se añadieron ${addedCount} correos nuevos de Gmail.`);
 setTimeout(() => setGmailStatusMsg(''), 5000);
 } catch (err: any) {
 console.error('Error during Gmail sync:', err);
 setGmailStatusMsg('Error al sincronizar con Gmail: ' + (err.message || String(err)));
 } finally {
 setIsSyncingGmail(false);
 }
 };

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
 if (res.ok) {
 const data = await res.json();
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

 // Template states for Salas
 const [subjectTemplateSala, setSubjectTemplateSala] = useState('Propuesta de concierto: {bandName} (Fusión)');
 const [bodyTemplateSala, setBodyTemplateSala] = useState(`Hola equipo de booking de {{nombre_sala}},

Somos {bandName}, banda que fusiona {estilo}. Hemos visto su programación en {{ciudad}} y creemos que nuestra propuesta encaja perfecto para su público.

Disponemos de fechas abiertas para nuestra gira 2026. Les invitamos a ver nuestros directos de alta energía: {enlace_videos}

Un saludo,
{bandName} Agent Manager IA`);
 const [aiGuidelinesSala, setAiGuidelinesSala] = useState('Escribe siempre en un tono enérgico, cercano pero muy respetuoso con los programadores de salas. Enfatiza que disponemos de un potente show con violín enérgico, loops en directo y percusión reciclada, y que aseguramos llenar el aforo gracias a nuestra campaña de promo local.');

 // Template states for Festivales
 const [subjectTemplateFestival, setSubjectTemplateFestival] = useState('Propuesta de Cartel / Booking Festival: {bandName} (Live Show)');
 const [bodyTemplateFestival, setBodyTemplateFestival] = useState(`Hola equipo de producción y booking de {{nombre_sala}},

Escribimos de parte de {bandName} para presentar la propuesta de nuestro show directo para la próxima edición de {{nombre_sala}} en {{ciudad}}.

Nuestra propuesta combina una fiesta explosiva con un directo de alta energía en tiempo real, ideal para escenarios principales de tarde/noche. Hemos formado parte de eventos de gran formato destacando por la conexión total con el público.

Podéis ver nuestro dossier y directo aquí: {enlace_videos}

Quedamos a vuestra disposición para enviar rider técnico y caché de contratación.

Un saludo atento,
{bandName} Agent Manager IA`);
 const [aiGuidelinesFestival, setAiGuidelinesFestival] = useState('Tono muy profesional, conciso y enfocado a directores artísticos y jefes de producción de festivales. Destaca la capacidad de mantener el ritmo alto en un escenario de festival, la brevedad del cambio de línea técnico y el valor diferencial del show directo.');

 // Template states for Discotecas / Clubs
 const [subjectTemplateDiscoteca, setSubjectTemplateDiscoteca] = useState('Propuesta Live Show / Session Nocturna: {bandName} (Live Set)');
 const [bodyTemplateDiscoteca, setBodyTemplateDiscoteca] = useState(`Hola equipo de programación de {{nombre_sala}},

Os contactamos desde {bandName} para proponer una noche diferente en {{ciudad}}: un Live Performance & Clubbing Set de alta intensidad que fusiona ritmos bailables, instrumentos en directo y bases de potencia.

Nuestro formato está diseñado para horarios nocturnos en club/discoteca, manteniendo la pista encendida con bpm progresivos sin perder la energía orgánica de la música en vivo.

Vídeo promocional y sesión en directo: {enlace_videos}

¿Tenéis fechas libres para incorporar un set en vivo en vuestra programación nocturna?

Saludos cordiales,
{bandName} Agent Manager IA`);
 const [aiGuidelinesDiscoteca, setAiGuidelinesDiscoteca] = useState('Tono moderno, enfocado a clubes y discotecas de noche. Resalta que no somos un grupo acústico tradicional, sino un Live Set electrónico con impulsos bailables ideales para horario de clubbing o sesiones de madrugada.');

 // Template states for Medios de Comunicación & Prensa
 const [subjectTemplateMedio, setSubjectTemplateMedio] = useState('[Nota de Prensa / Dossier] {bandName} presenta su nuevo videoclip y gira');
 const [bodyTemplateMedio, setBodyTemplateMedio] = useState(`Hola equipo de redacción de {{nombre_sala}},

Nos ponemos en contacto desde {bandName}, proyecto independiente con propuesta enérgica y sonido propio.

Les remitimos nuestro último comunicado de prensa y dossier promocional con motivo del lanzamiento de nuestro nuevo videoclip y la gira de conciertos. Nos encantaría enviarles el tema en calidad broadcast para sonar en su programa/radio, o ponernos a su disposición para entrevistas, acústicos en directo o reseñas.

Dossier y videoclip oficial: {enlace_videos}
Material en alta resolución (fotos, bio y audio): {{website}}

Muchas gracias por su apoyo a la difusión de la música independiente,
{bandName} Agent Manager IA`);
 const [aiGuidelinesMedio, setAiGuidelinesMedio] = useState('Tono periodístico, profesional y directo para medios de comunicación (radio, podcasts, prensa escrita, blogs). Dirígete al redactor, locutor o equipo de redacción de prensa. Destaca la nota de prensa, la propuesta sonora y la disponibilidad para entrevistas, acústicos en estudio o reseñas.');

 // Template states for Grupos & Bandas (Co-Booking)
 const [subjectTemplateGrupo, setSubjectTemplateGrupo] = useState('Propuesta de concierto compartido e intercambio de fechas: {bandName} x {{nombre_sala}}');
 const [bodyTemplateGrupo, setBodyTemplateGrupo] = useState(`¡Buenas chavales de {{nombre_sala}}!

Os escribimos desde {bandName}. Nos mola mucho vuestro proyecto y creemos que nuestros estilos conectan genial en directo.

Queremos proponer un INTERCAMBIO DE FECHAS / CO-BOOKING para esta temporada:
1. Os invitamos a tocar con nosotros en nuestra ciudad compartiendo escenario y taquilla.
2. Vosotros nos invitáis a tocar en {{ciudad}} en vuestro espacio habitual.

Así aseguramos llenar las dos salas sumando ambos públicos y compartimos gastos de viaje y backline.

Podéis escuchar lo que hacemos aquí: {enlace_videos}

¿Cómo lo veis? ¿Hablamos por WhatsApp o hacemos llamada esta semana?

¡Un abrazo!
{bandName} Agent Manager IA`);
 const [aiGuidelinesGrupo, setAiGuidelinesGrupo] = useState('Tono de músico a músico: cercano, colega, directo y colaborativo. Propón claramente la estrategia de ganar-ganar (date swap), compartir público local, compartir backline y abaratar gastos de furgoneta.');

 // Template states for Managements & Agencias
 const [subjectTemplateManagement, setSubjectTemplateManagement] = useState('Propuesta de colaboración / Roster: {bandName} (Live Show)');
 const [bodyTemplateManagement, setBodyTemplateManagement] = useState(`Estimado equipo de {{nombre_sala}},

Nos dirigimos a vuestra agencia para presentar la propuesta artística de {bandName} con vista a posibles colaboraciones, coproducciones o inclusión en vuestro catálogo de booking para giras y festivales.

{bandName} es un proyecto consolidado de alta energía. Destacamos por una logística ágil, alta rentabilidad en venta de entradas y un directo arrollador probado en salas y festivales.

Dossier corporativo y resumen en vídeo: {enlace_videos}

Estaríamos encantados de agendar una breve reunión telefónica para valorar posibles sinergias.

Atentamente,
{bandName} Agent Manager IA`);
 const [aiGuidelinesManagement, setAiGuidelinesManagement] = useState('Tono ejecutivo-musical profesional para mánagers, agencias y agentes de booking. Destaca la profesionalidad técnica, el atractivo comercial, la sencillez logística del cuarteto y los datos positivos de aforo.');

 // Selected template category in Editor
 const [templateTab, setTemplateTab] = useState<TemplateCategory>('salas');
 const [testPromptResult, setTestPromptResult] = useState('');
 const [isTestingPrompt, setIsTestingPrompt] = useState(false);
 const [isOptimizingTemplate, setIsOptimizingTemplate] = useState(false);
 const [optimizationFeedbackMsg, setOptimizationFeedbackMsg] = useState<string | null>(null);
 const [templateCustomInstruction, setTemplateCustomInstruction] = useState('');
  const [templateToneRating, setTemplateToneRating] = useState<number>(0);
  const [templateContentRating, setTemplateContentRating] = useState<number>(0);

 const handleOptimizeTemplate = async () => {
   setIsOptimizingTemplate(true);
   setOptimizationFeedbackMsg(null);
   try {
     const activeData = getActiveTemplateData();
     const res = await fetch('/api/templates/optimize', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         category: templateTab,
         currentSubject: activeData.subject,
         currentBody: activeData.body,
         currentGuidelines: activeData.guidelines,
         customInstruction: templateCustomInstruction,
         toneRating: templateToneRating,
         contentRating: templateContentRating
       })
     });
     const data = await res.json();
     if (res.ok && data.success && data.optimized) {
       activeData.setSubject(data.optimized.subject);
       activeData.setBody(data.optimized.body);
       activeData.setGuidelines(data.optimized.guidelines);
       
       setTestPromptResult(`Asunto: ${data.optimized.subject}\n\n${data.optimized.body}`);
       
       const countNote = data.feedbackCountUsed > 0 
         ? `Aplicado aprendizaje de ${data.feedbackCountUsed} valoraciones previas del mánager.`
         : 'Refrescada con pautas de estilo de Bakandeya.';
       const ratingsAppliedNote = (templateToneRating > 0 || templateContentRating > 0)
         ? ` (Estrellitas aplicadas: Tono ${templateToneRating || '-'}/5, Contenido ${templateContentRating || '-'}/5)`
         : '';

       setOptimizationFeedbackMsg(`✨ Plantilla re-generada con IA: ${data.optimized.explanation || countNote}${ratingsAppliedNote}`);
       setTemplateCustomInstruction('');
       setTemplateToneRating(0);
       setTemplateContentRating(0);
     } else {
       setOptimizationFeedbackMsg('⚠️ No se pudo re-generar la plantilla. Inténtalo de nuevo.');
     }
   } catch (err) {
     console.error('Error optimizing template:', err);
     setOptimizationFeedbackMsg('⚠️ Error de conexión al re-generar la plantilla.');
   } finally {
     setIsOptimizingTemplate(false);
   }
 };

 // Helper to retrieve current active template fields by category
 const getActiveTemplateData = () => {
 switch (templateTab) {
 case 'salas':
 return {
 subject: subjectTemplateSala,
 body: bodyTemplateSala,
 guidelines: aiGuidelinesSala,
 setSubject: setSubjectTemplateSala,
 setBody: setBodyTemplateSala,
 setGuidelines: setAiGuidelinesSala,
 title: '🏛️ Editando Plantilla para Salas y Teatros',
 desc: 'Propuestas directas de fechas, aforo, taquilla/caché e invitaciones a programadores de salas.'
 };
 case 'festivales':
 return {
 subject: subjectTemplateFestival,
 body: bodyTemplateFestival,
 guidelines: aiGuidelinesFestival,
 setSubject: setSubjectTemplateFestival,
 setBody: setBodyTemplateFestival,
 setGuidelines: setAiGuidelinesFestival,
 title: '🎪 Editando Plantilla para Festivales de Música',
 desc: 'Presentación de dossier, rider técnico compacto y propuesta para escenarios principales de festival.'
 };
 case 'discotecas':
 return {
 subject: subjectTemplateDiscoteca,
 body: bodyTemplateDiscoteca,
 guidelines: aiGuidelinesDiscoteca,
 setSubject: setSubjectTemplateDiscoteca,
 setBody: setBodyTemplateDiscoteca,
 setGuidelines: setAiGuidelinesDiscoteca,
 title: '🪩 Editando Plantilla para Discotecas y Clubbing',
 desc: 'Live Performance & Clubbing set para horarios nocturnos y sesiones de madrugada.'
 };
 case 'medios':
 return {
 subject: subjectTemplateMedio,
 body: bodyTemplateMedio,
 guidelines: aiGuidelinesMedio,
 setSubject: setSubjectTemplateMedio,
 setBody: setBodyTemplateMedio,
 setGuidelines: setAiGuidelinesMedio,
 title: '📻 Editando Plantilla para Medios de Comunicación, Radio y Prensa',
 desc: 'Nota de prensa, material de difusión, bio/fotos y propuesta para sonar en antena o entrevistas.'
 };
 case 'grupos':
 return {
 subject: subjectTemplateGrupo,
 body: bodyTemplateGrupo,
 guidelines: aiGuidelinesGrupo,
 setSubject: setSubjectTemplateGrupo,
 setBody: setBodyTemplateGrupo,
 setGuidelines: setAiGuidelinesGrupo,
 title: '🎸 Editando Plantilla para Grupos y Bandas (Co-Booking)',
 desc: 'Intercambio de fechas (Date Swap), doble cartel en sala grande y compartir furgoneta/backline.'
 };
 case 'managements':
 return {
 subject: subjectTemplateManagement,
 body: bodyTemplateManagement,
 guidelines: aiGuidelinesManagement,
 setSubject: setSubjectTemplateManagement,
 setBody: setBodyTemplateManagement,
 setGuidelines: setAiGuidelinesManagement,
 title: '💼 Editando Plantilla para Agencias de Booking y Management',
 desc: 'Propuestas corporativas para coproducción, representación de gira e inclusión en catálogo.'
 };
 }
 };

 const isMedioOIndustria = (t: any) => {
 const norm = normalizeType(t);
 return norm === 'medio' || norm === 'productora';
 };

 const isStitchLight = colors.name?.toLowerCase().includes('light') || colors.bg.includes('f8fafc') || colors.bg.includes('white') || colors.bg.includes('slate-50') || false;

 const getTypeBadgeClass = (typeVal: any) => {
 const norm = normalizeType(typeVal);
 switch (norm) {
 case 'sala': return isStitchLight ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-500/15 text-sky-400';
 case 'festival': return isStitchLight ? 'bg-fuchsia-50 text-fuchsia-700' : 'bg-fuchsia-500/10 text-fuchsia-400';
 case 'discoteca': return isStitchLight ? 'bg-purple-50 text-purple-700' : 'bg-purple-500/10 text-purple-400';
 case 'ayuntamiento': return isStitchLight ? 'bg-[#d1b375]/15 text-[#d1b375]' : 'bg-[#d1b375]/15/30 text-[#d1b375]/80';
 case 'grupo': return isStitchLight ? (isStitchLight ? 'bg-emerald-100 text-emerald-700' : 'bg-[#10b981]/15 text-[#10b981]') : 'bg-[#10b981]/15/30 text-[#10b981]/80';
 case 'productora': return isStitchLight ? 'bg-cyan-50 text-cyan-700' : 'bg-cyan-500/10 text-cyan-400';
 case 'medio': return isStitchLight ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-500/15 text-rose-400';
 default: return isStitchLight ? 'bg-slate-50 text-slate-700' : 'bg-neutral-800 text-neutral-300';
 }
 };

 const getTypeLabel = (typeVal: any) => {
 const norm = normalizeType(typeVal);
 switch (norm) {
 case 'sala': return '🏛️ Sala / Teatro';
 case 'festival': return '🎪 Festival';
 case 'discoteca': return '🪩 Discoteca / Clubbing';
 case 'ayuntamiento': return '🎆 Ayuntamiento / Fiestas';
 case 'grupo': return '🎸 Grupo / Banda Co-Booking';
 case 'productora': return '💼 Management / Agencia';
 case 'medio': return '📻 Medio (Radio / Prensa)';
 default: return '🏛️ Sala / Teatro';
 }
 };

 // Filter leads by active section tab ('salas' vs 'medios' vs 'grupos')
 const sectionLeads = useMemo(() => {
   const seen = new Set<string>();
   return (leads || []).filter(lead => {
     if (!lead) return false;
     const leadKey = lead.id ? String(lead.id).trim() : null;
     if (leadKey && seen.has(leadKey)) return false;
     if (leadKey) seen.add(leadKey);

     const norm = normalizeType(lead.tipo);
     if (sectionTab === 'medios') return norm === 'medio';
     if (sectionTab === 'grupos') return norm === 'grupo';
     return norm !== 'medio' && norm !== 'grupo';
   });
 }, [leads, sectionTab]);

 const filteredLeads = useMemo(() => {
   const seen = new Set<string>();
   return sectionLeads.filter((lead, idx) => {
     const leadKey = lead.id ? String(lead.id).trim() : `lead-${idx}`;
     if (seen.has(leadKey)) return false;
     seen.add(leadKey);

     const matchesSearch = (lead.nombre_sala || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
       (lead.ciudad || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
       (lead.region || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
       (lead.email_contacto && lead.email_contacto.toLowerCase().includes(searchTerm.toLowerCase()));
     const normSt = normalizeStatus(lead.estado);
     const matchesStatus = statusFilter === 'todos' || 
       normSt === statusFilter || 
       (statusFilter === 'pendiente_aprobacion' && normSt === 'nuevo' && !!lead.pitch_generado);
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

     const matchesType = typeFilter === 'todos'
       ? true
       : sectionTab === 'medios'
       ? matchesMedioType(lead, typeFilter)
       : normalizeType(lead.tipo) === typeFilter;
     const matchesCity = !selectedCityFilter || 
       (lead.ciudad || '').toLowerCase().includes(selectedCityFilter.toLowerCase()) || 
       (lead.region || '').toLowerCase().includes(selectedCityFilter.toLowerCase());
     const matchesCapacity = !minCapacityFilter || ((lead.aforo || 0) >= minCapacityFilter);
     return matchesSearch && matchesStatus && matchesType && matchesCity && matchesCapacity;
   });
 }, [sectionLeads, searchTerm, statusFilter, typeFilter, selectedCityFilter, minCapacityFilter, sectionTab]);

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
 telefono: newLeadData.telefono || '',
 instagram: newLeadData.website || '',
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

 const getStatusDotColor = (status: LeadStatus | string) => {
 const norm = normalizeStatus(status);
 switch (norm) {
 case 'nuevo': return 'bg-amber-400';
 case 'esperando_respuesta':
 case 'enviado': return 'bg-sky-400';
 case 'respondido': return 'bg-indigo-400';
 case 'negociando': return 'bg-purple-400';
 case 'confirmado': return 'bg-emerald-400';
 case 'aplazado': return 'bg-yellow-500';
 case 'no_interesado': return 'bg-neutral-500';
 case 'pendiente_aprobacion': return 'bg-amber-400';
 case 'aprobado':
 case 'aprobado_propuesta':
 case 'aprobado_respuesta': return 'bg-emerald-400';
 default: return 'bg-stone-400';
 }
 };

 const getStatusBadgeClass = (status: LeadStatus | string) => {
 const norm = normalizeStatus(status);
 switch (norm) {
 case 'nuevo': return isStitchLight ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
 case 'esperando_respuesta':
 case 'enviado': return isStitchLight ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-sky-500/15 text-sky-300 border border-sky-500/30';
 case 'respondido': return isStitchLight ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30';
 case 'negociando': return isStitchLight ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-purple-500/15 text-purple-300 border border-purple-500/30';
 case 'confirmado': return isStitchLight ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40';
 case 'aplazado': return isStitchLight ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' : 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30';
 case 'no_interesado': return isStitchLight ? 'bg-slate-100 text-slate-500 border border-slate-200' : 'bg-neutral-800/80 text-neutral-400 border border-neutral-700/50';
 case 'pendiente_aprobacion': return isStitchLight ? 'bg-amber-50 text-amber-700 border border-amber-300' : 'bg-amber-500/15 text-amber-400 border border-amber-500/40';
 case 'aprobado':
 case 'aprobado_propuesta':
 case 'aprobado_respuesta': return isStitchLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40';
 default: return isStitchLight ? 'bg-slate-50 text-slate-500' : 'bg-neutral-800/60 text-neutral-400';
 }
 };

 const getStatusLabel = (status: LeadStatus | string) => {
 const norm = normalizeStatus(status);
 switch (norm) {
 case 'nuevo': return 'Por contactar';
 case 'esperando_respuesta':
 case 'enviado': return 'Contactado';
 case 'respondido': return 'En conversación';
 case 'negociando': return 'Negociando';
 case 'confirmado': return 'Confirmado 🎉';
 case 'aplazado': return 'Aplazado ⏳';
 case 'no_interesado': return 'Descartado';
 case 'pendiente_aprobacion': return 'Borrador por aprobar';
 case 'aprobado':
 case 'aprobado_propuesta':
 case 'aprobado_respuesta': return 'En cola de envío';
 default: return String(status);
 }
 };

 const handleOpenLead = (lead: Lead) => {
 setSelectedLead(lead);
 setEditedPitch(lead.pitch_generado || '');
 setIsEditingPitch(false);
 setIsEditingLeadInfo(false);
 setIsRejecting(false);
 setRejectionNotes('');
 
 // Automatically switch to emails tab for negotiating or interested leads, else info
 setActiveTab(lead.estado === 'negociando' || lead.estado === 'interesado' ? 'emails' : 'info');
 setManualEmailBody('');
 setManualEmailSubject(lead.hilo_emails && lead.hilo_emails.length > 0 ? `RE: ${lead.hilo_emails[lead.hilo_emails.length - 1].asunto}` : `Propuesta de concierto: ${effectiveBandName}`);
 setManualEmailStatus('');

 setTimeout(() => {
 interventionPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
 }, 100);
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
 
 const lowercaseName = selectedLead.nombre_sala.toLowerCase();
 if (selectedLead.id === 'lead-14' || lowercaseName.includes('hebe')) {
 simSender = 'Kike (Programación Sala Hebe)';
 simBody = '¡Buenas! He estado pensando lo de la fecha doble con la banda local que propusisteis. Me parece de lujo, los chavales de"Vallekas Ska" están buscando bolo para noviembre y seguro que entre los dos llenamos el Hebe. El viernes 13 de Noviembre sigue libre. ¿Cerramos ese día con un 75% de taquilla para vosotros si llegamos a las 100 entradas? Ya me decís y os paso el contrato.';
 } else if (selectedLead.id === 'lead-4' || lowercaseName.includes('viña')) {
 simSender = 'Producción Artística (Viña Rock)';
 simBody = 'Hola, gracias por pasarnos los detalles. El caché de 4.500€ entra en vuestros rangos para el escenario de Mestizaje. El slot de las 18:30 del viernes está libre. Confirmadnos si vuestro rider técnico incluye los sintetizadores listos para línea balanceada o si necesitáis cajas DI adicionales del festival. ¡Cerremos trato!';
 } else if (selectedLead.id === 'lead-6' || lowercaseName.includes('razzmatazz')) {
 simSender = 'Xavi (Booking Razzmatazz)';
 simBody = `Buenas, nos parece perfecto el acuerdo de taquilla al 80/20 con un mínimo de 150 entradas garantizadas. La fecha del sábado 5 de Diciembre queda reservada para ${effectiveBandName}. Decidme a qué email enviamos el borrador del contrato de sala. ¡Un saludo!`;
 } else {
 simSender = `Programador (${selectedLead.nombre_sala})`;
 simBody = `Hola equipo de ${effectiveBandName}, gracias por la propuesta. Nos gusta mucho vuestra propuesta en directo. Para otoño tenemos el calendario casi cerrado, pero nos queda un hueco el sábado 28 de Noviembre. Iríamos a taquilla 70/30 a vuestro favor con entradas a 10€. ¿Os cuadra la fecha?`;
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

 const handleTestPrompt = () => {
 setIsTestingPrompt(true);
 setTestPromptResult('');
 
 const activeData = getActiveTemplateData();
 
 setTimeout(() => {
 if (templateTab === 'medios') {
 setTestPromptResult(`Asunto: [Nota de Prensa / Radio 3] Bakandeya presenta su gira y single 2026

Hola equipo de redacción de Radio 3 / Revista Musical,

Os enviamos la nota de prensa de Bakandeya para su difusión en medios. Siguiendo las directrices de prensa ("${activeData.guidelines.substring(0, 55)}..."), destacamos nuestro concepto sonoro que fusiona balkan-ska, violín enérgico, loops y percusión reciclada con electrónica.

Nos encantaría ponernos a vuestra disposición para una entrevista en estudio, un acústico en directo o la presentación del nuevo videoclip.

Adjuntamos fotos en alta resolución, bio y enlace al videoclip: https://youtube.com/bakandeya_live

Un saludo muy atento,
Bakandeya Agent Manager IA`);
 } else if (templateTab === 'festivales') {
 setTestPromptResult(`Asunto: Propuesta de Cartel / Booking Festival: Bakandeya (Balkan Ska & Electronic Live)

Hola equipo de producción y booking del Festival Ejemplo,

Escribimos de parte de Bakandeya para presentar la propuesta de nuestro show directo de alta energía. Siguiendo las directrices de festival ("${activeData.guidelines.substring(0, 50)}..."), hemos optimizado la logística del escenario.

Disponemos de un cuarteto con violín virtuosístico, loops y sintetizadores en tiempo real ideal para escenarios principales de tarde/noche.

Dossier y vídeo promocional: https://youtube.com/bakandeya_live

Quedamos a su disposición.

Atentamente,
Bakandeya Agent Manager IA`);
 } else if (templateTab === 'discotecas') {
 setTestPromptResult(`Asunto: Propuesta Live Performance & Clubbing: Bakandeya

Hola equipo de programación de Discoteca Ejemplo,

Os contactamos desde Bakandeya para proponer una sesión en vivo de electro-balkan & ska instrumental en horario nocturno. Siguiendo las pautas de clubbing ("${activeData.guidelines.substring(0, 50)}..."), nuestro set mantiene la pista en tensión constante.

Vídeo promocional: https://youtube.com/bakandeya_live

¿Tenéis fechas libres para un live set nocturno?

Un saludo,
Bakandeya Agent Manager IA`);
 } else if (templateTab === 'grupos') {
 setTestPromptResult(`Asunto: Propuesta de concierto compartido e intercambio de fechas: Bakandeya x Banda Ejemplo

¡Buenas chavales de Banda Ejemplo!

Os escribimos desde Bakandeya. Siguiendo las pautas de co-booking entre bandas ("${activeData.guidelines.substring(0, 50)}..."), nos mola mucho vuestro proyecto y queremos proponer un INTERCAMBIO DE FECHAS (Date Swap):

1. Os invitamos a tocar con nosotros en Madrid/Sevilla compartiendo taquilla al 50%.
2. Montamos fecha conjunta en vuestra ciudad natal para llenar el local sumando ambas aficiones y compartir furgoneta.

¿Cómo lo veis? ¿Hablamos esta semana?

¡Un abrazo!
Bakandeya Agent Manager IA`);
 } else if (templateTab === 'managements') {
 setTestPromptResult(`Asunto: Propuesta de colaboración / Roster 2026: Bakandeya

Estimado equipo de Agencia Ejemplo,

Nos dirigimos a vuestra oficina para presentar la propuesta de Bakandeya con vista a posibles coproducciones o inclusión en catálogo. Siguiendo las pautas de agencias ("${activeData.guidelines.substring(0, 50)}..."), destacamos la solidez de nuestro cuarteto con violín solista.

Dossier corporativo: https://youtube.com/bakandeya_live

Atentamente,
Bakandeya Agent Manager IA`);
 } else {
 setTestPromptResult(`Asunto: Propuesta de concierto: Bakandeya en Sala Ejemplo

Hola equipo de booking de Sala Ejemplo,

Le escribimos de parte de Bakandeya. Siguiendo sus pautas de directo ("${activeData.guidelines.substring(0, 50)}..."), hemos adaptado nuestro show para vuestro aforo. Disponemos de un cuarteto con violín enérgico, loops, percusión reciclada y una electrónica demoledora en directo.

¿Qué os parece el viernes 23 de Octubre de 2026?

Atentamente,
Bakandeya Agent Manager IA`);
 }
 setIsTestingPrompt(false);
 }, 1200);
 };

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const token = localStorage.getItem('bakandeya_token') || localStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          headers['x-auth-token'] = token;
        }
        const res = await fetch('/api/templates', { headers });
        const data = await res.json();
        if (res.ok && data.success && data.templates) {
          const t = data.templates;
          if (t.salas) {
            setSubjectTemplateSala(t.salas.subject);
            setBodyTemplateSala(t.salas.body);
            setAiGuidelinesSala(t.salas.guidelines);
          }
          if (t.festivales) {
            setSubjectTemplateFestival(t.festivales.subject);
            setBodyTemplateFestival(t.festivales.body);
            setAiGuidelinesFestival(t.festivales.guidelines);
          }
          if (t.discotecas) {
            setSubjectTemplateDiscoteca(t.discotecas.subject);
            setBodyTemplateDiscoteca(t.discotecas.body);
            setAiGuidelinesDiscoteca(t.discotecas.guidelines);
          }
          if (t.medios) {
            setSubjectTemplateMedio(t.medios.subject);
            setBodyTemplateMedio(t.medios.body);
            setAiGuidelinesMedio(t.medios.guidelines);
          }
          if (t.grupos) {
            setSubjectTemplateGrupo(t.grupos.subject);
            setBodyTemplateGrupo(t.grupos.body);
            setAiGuidelinesGrupo(t.grupos.guidelines);
          }
          if (t.managements) {
            setSubjectTemplateManagement(t.managements.subject);
            setBodyTemplateManagement(t.managements.body);
            setAiGuidelinesManagement(t.managements.guidelines);
          }
        }
      } catch (err) {
        console.warn('Could not load saved templates from API:', err);
      }
    };
    fetchTemplates();
  }, []);

 const handleSaveTemplates = async () => {
   const activeData = getActiveTemplateData();
   try {
     const token = localStorage.getItem('bakandeya_token') || localStorage.getItem('token');
     const headers: Record<string, string> = {
       'Content-Type': 'application/json'
     };
     if (token) {
       headers['Authorization'] = `Bearer ${token}`;
       headers['x-auth-token'] = token;
     }
     const res = await fetch('/api/templates/save', {
       method: 'POST',
       headers,
       body: JSON.stringify({
         category: templateTab,
         subject: activeData.subject,
         body: activeData.body,
         guidelines: activeData.guidelines,
         customInstruction: templateCustomInstruction,
         toneRating: templateToneRating,
         contentRating: templateContentRating
       })
     });
     const data = await res.json();
     if (res.ok && data.success) {
       setOptimizationFeedbackMsg(`✅ Plantilla y Pautas para [${activeData.title}] guardadas en Memoria IA, Supabase (tab plantillas_pautas_ia) y PROMPTS_AGENTES_IA.md.`);
       setTemplateCustomInstruction('');
       setTemplateToneRating(0);
       setTemplateContentRating(0);
     } else {
       alert('⚠️ Error al guardar en el servidor.');
     }
   } catch (err) {
     console.error('Error saving template:', err);
     alert('⚠️ Error de conexión al guardar la plantilla.');
   }
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
 
 {/* Header, View Switcher & Search */}
 <div className="flex flex-col gap-3">
   <div className="flex items-start sm:items-end justify-between gap-2 flex-wrap sm:flex-nowrap">
     <div>
       <p className="text-[#eab308] text-[11px] sm:text-[13px] font-bold font-sans tracking-wider uppercase mb-0.5">
         BOOKING
       </p>
       <h3 className={`text-2xl sm:text-3xl font-bold font-display tracking-tight ${isStitchLight ? 'text-slate-900' : 'text-zinc-100'}`}>
         {sectionTab === 'medios' ? 'Medios y prensa' : 'Salas y festivales'}
       </h3>
       <p className={`text-[12px] sm:text-[13px] mt-0.5 ${textMuted}`}>
         {sectionTab === 'medios' 
           ? `${leads.filter(l => isMedioOIndustria(l.tipo)).length} contactos registrados`
           : `${leads.filter(l => !isMedioOIndustria(l.tipo)).length} registradas • ${leads.filter(l => !isMedioOIndustria(l.tipo) && l.estado === 'pendiente_aprobacion').length} pendientes de aprobar`
         }
       </p>
     </div>

     {/* UNIFIED ACTION BUTTONS (Mobile, Tablet, Desktop) */}
      <div className="flex items-center gap-1.5 shrink-0 self-end">
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
              tipo: sectionTab === 'medios' ? 'medio' : 'sala',
              email_contacto: '',
              telefono: '',
              website: '',
              genero: sectionTab === 'medios' ? 'Radio' : 'Balkan / Ska',
              notas: '',
              pitch_generado: ''
            });
            setIsAddingLeadModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#f2ca50] hover:bg-[#e5bc40] text-[#2c2200] shadow-sm active:scale-95 cursor-pointer"
          title="Añadir sala o medio"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Añadir {sectionTab === 'medios' ? 'medio' : 'sala'}</span>
        </button>

        <button
          id="open-places-explorer-btn"
          type="button"
          onClick={() => setIsPlacesExplorerOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-xs active:scale-95 cursor-pointer transition-all"
          title="Buscar nuevas salas en cualquier ciudad con IA y Google Places"
        >
          <Search className="w-3.5 h-3.5 text-[#f2ca50]" />
          <span className="hidden sm:inline">Buscar Nuevas Salas</span>
          <span className="sm:hidden">Buscar</span>
        </button>

        <button
          id="open-excel-import-btn"
          type="button"
          onClick={() => setIsExcelImportOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-xs active:scale-95 cursor-pointer transition-all"
          title="Subir archivo Excel o CSV con tus salas, bandas y contactos"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Importar Excel / CSV</span>
          <span className="sm:hidden">Excel</span>
        </button>

        <button
          id="open-contact-enricher-btn"
          type="button"
          onClick={() => setIsContactEnricherOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 shadow-xs active:scale-95 cursor-pointer transition-all"
          title="Ejecutar el Agente Enriquecedor de Contactos para extraer y verificar emails en la web"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Agente Enriquecedor</span>
          <span className="sm:hidden">Enriquecer</span>
          {leads.filter(l => !l.email_contacto || l.email_contacto.trim() === '').length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-[10px] font-mono font-bold">
              {leads.filter(l => !l.email_contacto || l.email_contacto.trim() === '').length}
            </span>
          )}
        </button>

        <button
          id="open-tools-btn"
          type="button"
          onClick={() => setIsMobileToolsOpen(!isMobileToolsOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
            isMobileToolsOpen
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
              : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:text-white hover:bg-zinc-800'
          }`}
          title="Herramientas IA y exportación"
        >
          <Bot className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">IA & Tools</span>
          <span className="sm:hidden">IA</span>
          {isMobileToolsOpen ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
        </button>

        <button
          id="toggle-filters-btn"
          type="button"
          onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
            activeFiltersCount > 0 || isMobileFiltersOpen
              ? 'bg-[#eab308]/20 text-[#eab308] border-[#eab308]/60'
              : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:text-white hover:bg-zinc-800'
          }`}
          title="Filtros avanzados y búsquedas guardadas"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filtros</span>
          {activeFiltersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#eab308] text-black text-[10px] font-black flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
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
            onClick={async () => {
              setIsMobileToolsOpen(false);
              const approvedLeads = leads.filter(l => l.estado === 'aprobado');
              if (approvedLeads.length === 0) {
                alert("No hay ninguna sala o contacto en estado 'aprobado'.");
                return;
              }
              const headers = ["ID", "Nombre Sala / Contacto", "Ciudad", "Región", "Aforo", "Tipo", "Email Contacto", "Fuente", "Estado", "Pitch Generado", "Notas"];
              const rows = approvedLeads.map(l => [
                `"${(l.id || '').replace(/"/g, '""')}"`,
                `"${(l.nombre_sala || '').replace(/"/g, '""')}"`,
                `"${(l.ciudad || '').replace(/"/g, '""')}"`,
                `"${(l.region || '').replace(/"/g, '""')}"`,
                l.aforo || 0,
                `"${(l.tipo || '').replace(/"/g, '""')}"`,
                `"${(l.email_contacto || '').replace(/"/g, '""')}"`,
                `"${(l.fuente || '').replace(/"/g, '""')}"`,
                `"${(l.estado || '').replace(/"/g, '""')}"`,
                `"${(l.pitch_generado || '').replace(/"/g, '""')}"`,
                `"${(l.notas || '').replace(/"/g, '""')}"`
              ]);
              const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.setAttribute("href", url);
              link.setAttribute("download", `${(effectiveBandName || 'Banda').replace(/\s+/g, '_')}_Aprobados_${new Date().toISOString().slice(0, 10)}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-bold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-600/50 transition-all cursor-pointer active:scale-98"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exportar CSV de Aprobados</span>
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
   {/* Search Input */}
   <div className="relative flex-1">
     <Search className={`absolute left-3 top-2.5 h-4 w-4 pointer-events-none transition-colors ${
       isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'
     }`} />
     <input
       id="crm-search"
       type="text"
       placeholder={sectionTab === 'medios' ? "🔍 Buscar medio..." : "🔍 Buscar sala o festival..."}
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
         <X className="w-4 h-4" />
       </button>
     )}
   </div>

   {/* View Mode Toggle Switcher */}
   <div className={`p-1 rounded-xl flex items-center justify-between sm:justify-start gap-1 shrink-0 ${
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
              ]
            : sectionTab === 'grupos'
            ? [
                { key: 'todos', label: '🌟 Todos' },
                { key: 'grupo', label: '🎸 Grupos' },
                { key: 'agencia', label: '💼 Agencias' },
                { key: 'manager', label: '👔 Mánagers' }
              ]
            : [
                { key: 'todos', label: '🌟 Todos' },
                { key: 'sala', label: '🏛️ Salas' },
                { key: 'festival', label: '🎪 Festivales' },
                { key: 'discoteca', label: '🪩 Discotecas' },
                { key: 'ayuntamiento', label: '🎆 Ayuntamientos' }
              ]
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

  {/* Main Status Tabs Bar (Clean, no-scrollbar, single row) */}
  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
    {([
      { key: 'todos', label: 'Todos' },
      { key: 'nuevo', label: 'Por contactar' },
      { key: 'esperando_respuesta', label: 'Contactados' },
      { key: 'respondido', label: 'En conversación' },
      { key: 'negociando', label: 'Negociando' },
      { key: 'confirmado', label: 'Confirmados 🎉' },
      { key: 'aplazado', label: 'Aplazados ⏳' },
      { key: 'no_interesado', label: 'Descartados' }
    ] as const).map(tab => {
      const count = tab.key === 'todos' 
        ? sectionLeads.length 
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
     onDeleteLead={onDeleteLead}
    leads={filteredLeads}
    selectedLead={selectedLead}
    onSelectLead={handleOpenLead}
    onUpdateLead={onUpdateLead}
    onLeadLogoUpload={(file) => handleLeadLogoUpload(file, false)}
    viewMode={viewMode === 'grid' ? 'grid' : 'table'}
    getStatusBadgeClass={getStatusBadgeClass}
    getStatusLabel={getStatusLabel}
    normalizeType={normalizeType}
    sectionTab={sectionTab}
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
     mediaTypeFilter={mediaTypeFilter}
     setMediaTypeFilter={setMediaTypeFilter}
        isStitchLight={isStitchLight}
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
    onLeadLogoUpload={(file) => handleLeadLogoUpload(file, true)}
    isUploadingLeadLogo={isUploadingLeadLogo}
  />
</div>

  {/* 3. EMAIL TEMPLATES & AI SETTINGS EDITOR CARD */}
 <div className={`${colors.card} p-5 space-y-6`}>
 <div className={` pb-3 flex flex-col xl:flex-row xl:items-center justify-between gap-3 ${isStitchLight ? '-slate-100' : '-[#99907c]/15'}`}>
 <div>
 <h3 className={`text-sm font-bold font-display uppercase tracking-widest flex items-center gap-2 ${isStitchLight ? 'text-sky-400' : 'text-[#f2ca50]'}`}>
 <Settings className={`w-4 h-4 ${isStitchLight ? 'text-sky-400' : 'text-[#f2ca50]'}`} /> Configuración de Plantillas y Pautas AI por Categoría (Redactor)
 </h3>
 <p className={`text-[10px] font-sans mt-1 ${textSub}`}>
 Personaliza el correo por defecto y las pautas de IA diferenciadas para Salas, Festivales, Discotecas, Medios, Grupos y Managements.
 </p>
 </div>

 {/* Template Tab Selector (6 Categories) */}
 <div className={`flex flex-wrap items-center gap-1 p-1 rounded-xl shrink-0 ${
 isStitchLight ? 'bg-slate-100' : 'bg-[#121215]'
 }`}>
 {[
 { id: 'salas', label: '🏛️ Salas', icon: Building2 },
 { id: 'festivales', label: '🎪 Festivales', icon: Tent },
 { id: 'discotecas', label: '🪩 Discotecas', icon: Disc3 },
 { id: 'medios', label: '📻 Medios', icon: Radio },
 { id: 'grupos', label: '🎸 Grupos', icon: Users },
 { id: 'managements', label: '💼 Managements', icon: Briefcase }
 ].map((tab) => {
 const isActive = templateTab === tab.id;
 const IconComp = tab.icon;
 return (
 <button
 key={tab.id}
 type="button"
 id={`template-tab-${tab.id}`}
 onClick={() => setTemplateTab(tab.id as TemplateCategory)}
 className={`py-1.5 px-2.5 rounded-lg text-[10px] font-sans font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
 isActive
 ? isStitchLight
 ? 'bg-white text-sky-400 shadow-sm'
 : 'bg-[#f2ca50] text-[#3c2f00] font-extrabold shadow-md'
 : isStitchLight
 ? 'text-slate-500 hover:text-slate-800'
 : 'text-neutral-400 hover:text-neutral-200'
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
 <div className={`p-3 rounded-xl text-[10px] font-sans flex items-center justify-between ${
 templateTab === 'medios'
 ? isStitchLight ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-500/15 text-rose-400'
 : templateTab === 'grupos'
 ? isStitchLight ? (isStitchLight ? 'bg-emerald-100 text-emerald-700' : 'bg-[#10b981]/15 text-[#10b981]') : 'bg-[#10b981]/15/30 text-[#10b981]'
 : templateTab === 'discotecas'
 ? isStitchLight ? 'bg-purple-50 text-purple-900' : 'bg-purple-500/10 text-purple-300'
 : isStitchLight ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-500/15 text-sky-400'
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
   <div className="p-3 bg-amber-500/15 border border-amber-500/30 text-amber-200 text-[11px] rounded-xl flex items-center justify-between font-sans animate-in fade-in">
     <span>{optimizationFeedbackMsg}</span>
     <button onClick={() => setOptimizationFeedbackMsg(null)} className="text-amber-400 font-bold ml-2 hover:text-white cursor-pointer">✕</button>
   </div>
 )}

 <div className="space-y-1.5">
 <label className={`block text-[10px] uppercase font-sans tracking-wider ${isStitchLight ? 'text-slate-600' : 'text-neutral-300'}`}>Asunto del Email por Defecto</label>
 <input
 id="template-subject"
 type="text"
 value={activeTemplate.subject}
 onChange={(e) => activeTemplate.setSubject(e.target.value)}
 className={`w-full rounded-lg px-2 py-1 text-[10px] focus:outline-none transition-all font-sans ${
 isStitchLight
 ? 'bg-white text-slate-800 focus:-indigo-500 focus:ring-1 focus:ring-indigo-500'
 : 'bg-[#131313] text-[#e5e2e1] focus:-[#f2ca50]/50'
 }`}
 />
 </div>

 <div className="space-y-1.5">
 <label className={`block text-[10px] uppercase font-sans tracking-wider ${isStitchLight ? 'text-slate-600' : 'text-neutral-300'}`}>Cuerpo de la Plantilla de Correo de Presentación</label>
 <textarea
 id="template-body"
 rows={8}
 value={activeTemplate.body}
 onChange={(e) => activeTemplate.setBody(e.target.value)}
 className={`w-full rounded-lg p-3 text-[10px] focus:outline-none transition-all font-sans leading-relaxed ${
 isStitchLight
 ? 'bg-white text-slate-800 focus:-indigo-500 focus:ring-1 focus:ring-indigo-500'
 : 'bg-[#131313] text-[#e5e2e1] focus:-[#f2ca50]/50'
 }`}
 placeholder="Escribe el cuerpo de la plantilla usando {{nombre_sala}}, {{ciudad}} etc..."
 />
 </div>

 <div className="space-y-1.5">
 <label className={`block text-[10px] uppercase font-sans tracking-wider flex items-center gap-1.5 ${isStitchLight ? 'text-sky-400' : 'text-[#ffb596]'}`}>
 <Sparkles className="w-3.5 h-3.5" /> Pautas AI (Directrices de Redacción Subjetiva)
 </label>
 <textarea
 id="template-guidelines"
 rows={3}
 value={activeTemplate.guidelines}
 onChange={(e) => activeTemplate.setGuidelines(e.target.value)}
 className={`w-full rounded-lg p-3 text-[10px] focus:outline-none transition-all font-sans leading-relaxed ${
 isStitchLight
 ? 'bg-white text-slate-800 focus:-indigo-500'
 : 'bg-[#131313] text-[#e5e2e1] focus:-[#ffb596]/50'
 }`}
 placeholder="Ej: Mantén un tono periodístico, enfatiza el lanzamiento del single..."
 />
 </div>

 <div className="space-y-3 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10">
 <div className="flex items-center justify-between">
 <label className="block text-[10px] uppercase font-sans font-bold tracking-wider text-amber-300 flex items-center gap-1.5">
 <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" /> Evaluación y Entrenamiento de la Plantilla
 </label>
 {(templateToneRating > 0 || templateContentRating > 0 || templateCustomInstruction) && (
 <button 
 type="button" 
 onClick={() => {
   setTemplateToneRating(0);
   setTemplateContentRating(0);
   setTemplateCustomInstruction('');
 }}
 className="text-[9px] text-amber-400 font-bold hover:underline cursor-pointer"
 >
 Limpiar todo
 </button>
 )}
 </div>

 {/* Estrellitas de Tono y Contenido */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
 {/* Tono y Estilo */}
 <div className="p-2 bg-[#131313] rounded-lg border border-amber-500/20 space-y-1">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-bold text-amber-200">Tono y Estilo</span>
 <span className="text-[10px] font-mono text-amber-400 font-bold">
 {templateToneRating > 0 ? `${templateToneRating}/5` : 'Sin calificar'}
 </span>
 </div>
 <div className="flex items-center gap-1">
 {[1, 2, 3, 4, 5].map((star) => (
 <button
 key={`crm-template-tone-${star}`}
 type="button"
 onClick={() => setTemplateToneRating(templateToneRating === star ? 0 : star)}
 className={`p-0.5 rounded hover:bg-amber-500/20 transition-colors cursor-pointer ${
   templateToneRating >= star ? 'text-amber-400' : 'text-neutral-600'
 }`}
 title={`Calificar tono y estilo: ${star}/5`}
 >
 <Star className="w-4 h-4 fill-current" />
 </button>
 ))}
 </div>
 </div>

 {/* Contenido y Estructura */}
 <div className="p-2 bg-[#131313] rounded-lg border border-amber-500/20 space-y-1">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-bold text-amber-200">Contenido y Estructura</span>
 <span className="text-[10px] font-mono text-amber-400 font-bold">
 {templateContentRating > 0 ? `${templateContentRating}/5` : 'Sin calificar'}
 </span>
 </div>
 <div className="flex items-center gap-1">
 {[1, 2, 3, 4, 5].map((star) => (
 <button
 key={`crm-template-content-${star}`}
 type="button"
 onClick={() => setTemplateContentRating(templateContentRating === star ? 0 : star)}
 className={`p-0.5 rounded hover:bg-amber-500/20 transition-colors cursor-pointer ${
   templateContentRating >= star ? 'text-amber-400' : 'text-neutral-600'
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
 <label className="block text-[10px] uppercase font-sans font-bold tracking-wider text-amber-300 flex items-center gap-1.5">
 <MessageSquare className="w-3.5 h-3.5 text-amber-400" /> Comentario o Corrección Directa
 </label>
 <textarea
 id="template-custom-instruction"
 rows={2}
 value={templateCustomInstruction}
 onChange={(e) => setTemplateCustomInstruction(e.target.value)}
 className="w-full rounded-lg p-2.5 text-[10px] bg-[#131313] text-[#e5e2e1] border border-amber-500/30 focus:border-amber-400 focus:outline-none font-sans leading-relaxed"
 placeholder="Ej: 'Haz la plantilla de salas un 20% más corta, resalta nuestro directo enérgico sin instrumentos de viento y pide propuesta de fecha para el próximo trimestre...'"
 />
 </div>
 <div className="text-[9px] text-amber-300/80 font-sans leading-tight">
 💡 Califica con estrellas el tono y el contenido e introduce comentarios. Al hacer clic abajo en <strong>Regenerar</strong>, la IA usará tus valoraciones para optimizar la plantilla.
 </div>
 </div>

 <div className="flex flex-wrap gap-2 pt-2">
 <button
 id="template-btn-optimize"
 type="button"
 onClick={handleOptimizeTemplate}
 disabled={isOptimizingTemplate}
 className="py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
 title="Re-redacta la plantilla y sus pautas integrando todo el feedback histórico de valoraciones del mánager"
 >
 <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${isOptimizingTemplate ? 'animate-spin' : ''}`} />
 <span>{isOptimizingTemplate ? 'Regenerando con IA...' : '✨ Regenerar Plantilla con IA y Aprendizaje'}</span>
 </button>
 <button
 id="template-btn-test"
 onClick={handleTestPrompt}
 disabled={isTestingPrompt}
 className={`px-2 py-1 font-sans text-[10px] rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
 isStitchLight
 ? 'bg-white hover:bg-slate-50 text-slate-700'
 : 'bg-neutral-900 hover:-neutral-700 text-neutral-300'
 }`}
 >
 {isTestingPrompt ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
 <span>Probar Prompt</span>
 </button>
 <button
 id="template-btn-save"
 onClick={handleSaveTemplates}
 className={`flex-1 py-2 font-sans font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center active:scale-95 ${
 isStitchLight
 ? 'bg-sky-500/15 hover:bg-sky-500/15 text-white shadow-md shadow-indigo-100'
 : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 shadow-lg shadow-[#f2ca50]/10'
 }`}
 >
 Guardar Plantillas y Directrices
 </button>
 </div>
 </div>

 {/* Test / Prompt Output side */}
 <div className={` rounded-xl p-4 flex flex-col justify-between ${
 isStitchLight
 ? 'bg-slate-50'
 : 'bg-[#131313]'
 }`}>
 <div className="space-y-3">
 <div className={`flex items-center gap-2 pb-2 ${isStitchLight ? '-slate-200' : '-neutral-900'}`}>
 <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isStitchLight ? 'bg-sky-500/15' : 'bg-[#f2ca50]'}`} />
 <h4 className={`text-[10px] font-sans uppercase tracking-widest ${textSub}`}>Sandbox de Simulación de Redacción AI</h4>
 </div>
 
 <div className={`text-[10px] leading-relaxed font-sans ${textSub}`}>
 Cuando el agente de Supabase <strong>"Redactor"</strong> corre, lee estas plantillas y pautas, las mezcla con los detalles del contacto capturado por el <strong>"Scout"</strong> (aforo, ubicación, género, redes) y genera un borrador adaptado para que lo revises en esta misma pantalla.
 </div>

 {testPromptResult ? (
 <div className="space-y-3">
 <div className={`rounded-lg p-3.5 text-[10px] font-sans whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto animate-in fade-in duration-300 select-text ${
 isStitchLight
 ? 'bg-white text-slate-700 border border-slate-200'
 : 'bg-[#1c1b1b] text-neutral-300 border border-neutral-800'
 }`}>
 {testPromptResult}
 </div>

 {/* Valoración directa del resultado generado en la simulación */}
 <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 font-sans">
 <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" /> Valorar esta plantilla / resultado
 </span>
 {(templateToneRating > 0 || templateContentRating > 0) && (
 <span className="text-[9px] text-amber-400 font-mono">
 Tono: {templateToneRating || '-'}/5 | Contenido: {templateContentRating || '-'}/5
 </span>
 )}
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 {/* Tono */}
 <div className="p-2 bg-[#131313] rounded-lg border border-amber-500/20 space-y-1">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-bold text-amber-200">Tono y Estilo</span>
 <span className="text-[10px] font-mono text-amber-400 font-bold">
 {templateToneRating > 0 ? `${templateToneRating}/5` : '⭐'}
 </span>
 </div>
 <div className="flex items-center gap-1">
 {[1, 2, 3, 4, 5].map((star) => (
 <button
 key={`sandbox-tone-${star}`}
 type="button"
 onClick={() => setTemplateToneRating(templateToneRating === star ? 0 : star)}
 className={`p-0.5 rounded hover:bg-amber-500/20 transition-colors cursor-pointer ${
 templateToneRating >= star ? 'text-amber-400' : 'text-neutral-600'
 }`}
 title={`Calificar tono: ${star}/5`}
 >
 <Star className="w-4 h-4 fill-current" />
 </button>
 ))}
 </div>
 </div>

 {/* Contenido */}
 <div className="p-2 bg-[#131313] rounded-lg border border-amber-500/20 space-y-1">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-bold text-amber-200">Contenido y Estructura</span>
 <span className="text-[10px] font-mono text-amber-400 font-bold">
 {templateContentRating > 0 ? `${templateContentRating}/5` : '⭐'}
 </span>
 </div>
 <div className="flex items-center gap-1">
 {[1, 2, 3, 4, 5].map((star) => (
 <button
 key={`sandbox-content-${star}`}
 type="button"
 onClick={() => setTemplateContentRating(templateContentRating === star ? 0 : star)}
 className={`p-0.5 rounded hover:bg-amber-500/20 transition-colors cursor-pointer ${
 templateContentRating >= star ? 'text-amber-400' : 'text-neutral-600'
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
 className="w-full py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
 >
 <Sparkles className={`w-3.5 h-3.5 ${isOptimizingTemplate ? 'animate-spin' : ''}`} />
 <span>Re-generar plantilla usando estas valoraciones ✨</span>
 </button>
 </div>
 </div>
 ) : (
 <div className={`border-2 border-dashed rounded-lg p-12 text-center text-[10px] font-sans ${
 isStitchLight
 ? 'border-slate-200 text-slate-400'
 : 'border-neutral-800 text-neutral-600'
 }`}>
 Haz clic en "Probar Prompt" a la izquierda para simular el resultado de generación del Redactor AI basado en tus directrices actuales.
 </div>
 )}
 </div>

 <div className={`text-[10px] font-sans mt-4 leading-normal text-right ${textMuted}`}>
 Módulo de Modelado AI de BandManager.ai. Powered by Gemini.
 </div>
 </div>
 </div>
 </>
 );
 })()}

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
    bandName={effectiveBandName || 'Tu Banda'}
    bandId={currentBandId || currentUser?.band_id || 'band-bakandeya'}
    currentUser={currentUser}
    isStitchLight={isStitchLight}
    onOpenTemplatesSection={() => {
      // Focus on template tab
      const el = document.getElementById('ai-template-config-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }}
  />

 </div>
 );
}
