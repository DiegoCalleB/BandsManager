import React, { useState, useEffect, useRef } from'react';
import { BandContact, BandRelationshipStatus, ThemeColors, Lead } from'../types';
import { api, getAuthHeaders } from'../services/api';
import BandMap from'./BandMap';
import { BandPitchModal } from'./bandCRM/BandPitchModal';
import { BandToneModal, ToneAnalysisData } from'./bandCRM/BandToneModal';
import { ChangeBandImageModal } from'./bandCRM/ChangeBandImageModal';
import { AIBandScoutModal } from'./bandCRM/AIBandScoutModal';
import { uploadFileToServer } from'../utils/audioStorage';
import { FavoriteButton } from'./common/FavoriteButton';
import { VerifiedBadge } from'./common/VerifiedBadge';
import { ReliabilityBadge } from'./common/ReliabilityBadge';
import { isLeadVerificado } from'../utils/leadReliability';
import { 
 Users, Music, MapPin, Clock, Sparkles, Plus, Search, Filter, Edit3, Trash2, 
 Copy, Check, ExternalLink, Send, MessageCircle, RefreshCw, LayoutGrid, List, 
 Handshake, Repeat, Zap, Share2, X, Star, Radio, Phone, Mail, Globe, AlertCircle, Building2, Map, FileSpreadsheet,
 Loader2, Bot, Upload, Image as ImageIcon, CheckSquare, Square, MinusSquare, Briefcase
} from'lucide-react';
import { BulkBandActionBar } from'./bands/BulkBandActionBar';
import { BulkProgressModal, BulkProgressItem } from'./booking/BulkProgressModal';


interface BandCRMProps {
 colors: ThemeColors;
 leads?: Lead[];
 onAddLead?: (lead: Lead) => void;
 onUpdateLead?: (id: string, updatedFields: Partial<Lead>) => void;
 onDeleteBand?: (id: string) => void;
 currentBandId?: string;
 onNavigate?: (view: any, options?: any) => void;
}

export default function BandCRM({ colors, leads = [], onAddLead, onUpdateLead, onDeleteBand, currentBandId, onNavigate }: BandCRMProps) {
 // Local state for band contacts with persistence
 const [bands, setBands] = useState<BandContact[]>([]);
 const [selectedBandIds, setSelectedBandIds] = useState<string[]>([]);
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
 const [isLoading, setIsLoading] = useState(true);

 const fetchBands = () => {
 const token = localStorage.getItem('bakandeya_token') || localStorage.getItem('token');
 fetch('/api/bands', {
 headers: {'Content-Type':'application/json',
 ...(token ? {'Authorization': `Bearer ${token}` } : {})
 }
 })
 .then(async res => {
 if (!res.ok) throw new Error(`HTTP error ${res.status}`);
 const contentType = res.headers.get("content-type");
 if (!contentType || !contentType.includes("application/json")) {
 throw new Error("Respuesta no es JSON válido");
 }
 return res.json();
 })
 .then(data => {
 if (data && data.bands) {
 setBands(data.bands);
 }
 })
 .catch(err => { if (err?.status !== 401) console.warn("Could not load bands:", err); })
 .finally(() => setIsLoading(false));
 };

 useEffect(() => {
 fetchBands();
 }, [currentBandId]);

 // Save changes to localStorage whenever bands state updates
 

 // Sync leads of type'grupo', management and productoras from the main leads list if new ones appear
 useEffect(() => {
 if (leads && leads.length > 0) {
 const groupLeads = leads.filter(l => {
 if (!l.tipo) return false;
 const norm = String(l.tipo).trim().toLowerCase();
 return norm ==='grupo' || norm.includes('grup') || norm.includes('banda') || norm.includes('artist')
 || norm ==='productora' || norm.includes('product') || norm ==='manager' || norm.includes('manag')
 || norm ==='agencia' || norm.includes('agenc') || norm ==='sello' || norm.includes('sello');
 });

 if (groupLeads.length > 0) {
 setBands(prevBands => {
 const existingIds = new Set(prevBands.map(b => b.id));
 const existingNames = new Set(prevBands.map(b => b.nombre_banda.toLowerCase().trim()));
 
 const newFromLeads: BandContact[] = groupLeads
 .filter(l => !existingIds.has(l.id) && !existingNames.has(l.nombre_sala.toLowerCase().trim()))
 .map(l => ({
 id: l.id || `lead-band-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
 nombre_banda: l.nombre_sala,
 estilo_musical: l.genero ||'Ska / Fusion / Mestizaje',
 localizacion: l.ciudad ||'España',
 estado_relacion: mapLeadStatusToBandStatus(l.estado),
 ultimo_contacto: l.fecha_ultima_respuesta || l.fecha_envio || new Date().toISOString().split('T')[0],
 contacto_nombre: l.contacto_nombre ||'Contacto Principal',
 email: l.email_contacto ||'',
 telefono: l.telefono ||'',
 instagram: l.instagram ||'',
 spotify_youtube: l.website ||'',
 aforo_promedio: l.aforo || 0,
 notas_colaboracion: l.notas || l.pitch_generado ||'Importado desde Leads de Booking.',
 ciudad_origen_swap: l.ciudad ||'España'
 }));

 if (newFromLeads.length === 0) return prevBands;
 return [...prevBands, ...newFromLeads];
 });
 }
 }
 }, [leads]);

 // Helper mapping from LeadStatus to BandRelationshipStatus
 function mapLeadStatusToBandStatus(status?: string): BandRelationshipStatus {
 switch (status) {
 case'aprobado': return'intercambio_propuesto';
 case'interesado':
 case'negociando': return'intercambio_propuesto';
 case'esperando_respuesta': return'pendiente_respuesta';
 default: return'sin_contactar';
 }
 }

 // UI Filter & Search state
 const [subTab, setSubTab] = useState<'co_booking' |'registered_bands'>('co_booking');
 const [registeredBands, setRegisteredBands] = useState<any[]>([]);
 const [isLoadingRegBands, setIsLoadingRegBands] = useState(false);

 const fetchRegisteredBands = () => {
 setIsLoadingRegBands(true);
 const token = localStorage.getItem('bakandeya_token') || localStorage.getItem('token');
 fetch('/api/registered-bands', {
 headers: {'Content-Type':'application/json',
 ...(token ? {'Authorization': `Bearer ${token}` } : {})
 }
 })
 .then(async res => {
 if (!res.ok) {
 throw new Error(`HTTP error ${res.status}`);
 }
 const contentType = res.headers.get("content-type");
 if (!contentType || !contentType.includes("application/json")) {
 throw new Error("Respuesta no es JSON válido");
 }
 return res.json();
 })
 .then(data => {
 if (data && data.registeredBands) {
 setRegisteredBands(data.registeredBands);
 }
 })
 .catch(err => { if (err?.status !== 401) console.warn("Could not load registered bands:", err); })
 .finally(() => setIsLoadingRegBands(false));
 };

 useEffect(() => {
 fetchRegisteredBands();
 }, [currentBandId]);

 const [searchTerm, setSearchTerm] = useState('');
 const [statusFilter, setStatusFilter] = useState<BandRelationshipStatus |'todos'>('todos');
 const [styleFilter, setStyleFilter] = useState<string>('todos');
 const [locationFilter, setLocationFilter] = useState<string>('todos');
 const [viewMode, setViewMode] = useState<'grid' |'table' |'map'>('table');

 // Modal State
 const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
 const [editingBand, setEditingBand] = useState<BandContact | null>(null);

 // Date Swap Generator Modal State
 const [isPitchModalOpen, setIsPitchModalOpen] = useState(false);
 const [selectedPitchBand, setSelectedPitchBand] = useState<BandContact | null>(null);
 const [proposedBakandeyaCity, setProposedBakandeyaCity] = useState<'Madrid' |'Sevilla' |'Ambas'>('Madrid');
 const [proposedMonth, setProposedMonth] = useState('Octubre / Noviembre 2026');
 const [proposedVenueBakandeya, setProposedVenueBakandeya] = useState('Sala Caracol / Gruta 77');
 const [copiedPitch, setCopiedPitch] = useState(false);
 const [customPitchText, setCustomPitchText] = useState<string>('');

 // Tone & Communication Scraper Modal State
 const [isToneModalOpen, setIsToneModalOpen] = useState(false);
 const [selectedToneBand, setSelectedToneBand] = useState<BandContact | null>(null);
 const [toneData, setToneData] = useState<ToneAnalysisData | null>(null);
 const [isAnalyzingTone, setIsAnalyzingTone] = useState(false);

 const handleAnalyzeTone = async (band: BandContact) => {
 setSelectedToneBand(band);
 setIsToneModalOpen(true);
 setIsAnalyzingTone(true);
 setToneData(null);

 try {
 const res = await fetch('/api/bands/analyze-tone', {
 method:'POST',
 headers: {'Content-Type':'application/json',
 ...getAuthHeaders()
 },
 body: JSON.stringify({
 nombre_entidad: band.nombre_banda,
 instagram: band.instagram,
 estilo_musical: band.estilo_musical,
 localizacion: band.localizacion,
 tipo:'Banda',
 save_to_band_id: band.id
 })
 });

 const resData = await res.json();
 if (resData.success && resData.data) {
 let finalData = resData.data;

 // Also load learned rules from tone-dna endpoint to ensure we have the latest reglas_por_categoria
 try {
 const toneDnaRes = await fetch('/api/bands/tone-dna', {
 headers: getAuthHeaders()
 });
 const toneDnaData = await toneDnaRes.json();
 if (toneDnaRes.ok && toneDnaData.data?.reglas_por_categoria) {
 finalData = {
 ...finalData,
 reglas_por_categoria: toneDnaData.data.reglas_por_categoria
 };
 }
 } catch (err) {
 console.warn('Could not load learned rules:', err);
 }

 setToneData(finalData);
 setBands(prev => prev.map(b => b.id === band.id ? {
 ...b,
 estilo_comunicacion: finalData.tono_comunicacion || b.estilo_comunicacion,
 dna_expresion: finalData
 } : b));
 } else {
 alert(resData.error ||'No se pudo obtener el análisis de tono.');
 }
 } catch (err) {
 console.error('Error analizando tono:', err);
 alert('Error de conexión al analizar el tono de comunicación.');
 } finally {
 setIsAnalyzingTone(false);
 }
 };

 // Form Fields State
 const [formName, setFormName] = useState('');
 const [formStyle, setFormStyle] = useState('Balkan Ska / Mestizaje');
 const [formLocation, setFormLocation] = useState('Madrid');
 const [formStatus, setFormStatus] = useState<BandRelationshipStatus>('sin_contactar');
 const [formLastContact, setFormLastContact] = useState(() => new Date().toISOString().split('T')[0]);
 const [formContactName, setFormContactName] = useState('');
 const [formEmail, setFormEmail] = useState('');
 const [formPhone, setFormPhone] = useState('');
 const [formInstagram, setFormInstagram] = useState('');
 const [formSpotifyYoutube, setFormSpotifyYoutube] = useState('');
 const [formAforo, setFormAforo] = useState<number>(0);
 const [formNotes, setFormNotes] = useState('');
 const [formIcon, setFormIcon] = useState('🎸');
 const [formImageUrl, setFormImageUrl] = useState('');
 const [isUploadingLogo, setIsUploadingLogo] = useState(false);
 const [activeCampaign, setActiveCampaign] = useState<any>(null);
 const [isScoutModalOpen, setIsScoutModalOpen] = useState(false);

 useEffect(() => {
 const saved = localStorage.getItem('bandmanager_active_campaign');
 if (saved) {
 try {
 setActiveCampaign(JSON.parse(saved));
 } catch (e) {}
 }
 }, []);

 const handleLogoUpload = async (file: File) => {
 if (!currentBandId) {
 alert('No hay ninguna banda activa para subir la imagen.');
 return;
 }
 try {
 setIsUploadingLogo(true);
 const url = await uploadFileToServer(file, { bandId: currentBandId, category:'grupos' });
 if (url) {
 setFormImageUrl(url);
 }
 } catch (err) {
 console.error('Error uploading band image:', err);
 alert('Error al subir la imagen a Supabase');
 } finally {
 setIsUploadingLogo(false);
 }
 };

 // AI Band Lookup state
 const [isAiSearching, setIsAiSearching] = useState(false);
 const [aiProposal, setAiProposal] = useState<any | null>(null);
 const [aiError, setAiError] = useState<string | null>(null);

 const handleAiLookup = async () => {
 if (!formName.trim()) {
 alert('Por favor introduce el nombre de la banda primero para buscar con IA.');
 return;
 }
 setIsAiSearching(true);
 setAiError(null);
 setAiProposal(null);
 try {
 const res = await fetch('/api/bands/ai-lookup', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({ nombre_banda: formName.trim(), localizacion: formLocation.trim() })
 });
 const data = await res.json();
 if (data.success && data.data) {
 setAiProposal(data.data);
 } else {
 setAiError(data.error ||'No se encontraron datos para esta banda.');
 }
 } catch (err: any) {
 console.error('Error en búsqueda de IA:', err);
 setAiError('Error al conectar con la IA para la búsqueda.');
 } finally {
 setIsAiSearching(false);
 }
 };

 const handleApplyAllAiData = () => {
 if (!aiProposal) return;
 if (aiProposal.estilo_musical) setFormStyle(aiProposal.estilo_musical);
 if (aiProposal.localizacion) setFormLocation(aiProposal.localizacion);
 if (aiProposal.contacto_nombre) setFormContactName(aiProposal.contacto_nombre);
 if (aiProposal.email) setFormEmail(aiProposal.email);
 if (aiProposal.telefono) setFormPhone(aiProposal.telefono);
 if (aiProposal.instagram) setFormInstagram(aiProposal.instagram);
 if (aiProposal.spotify_url || aiProposal.youtube_url) {
 setFormSpotifyYoutube(aiProposal.spotify_url || aiProposal.youtube_url);
 }
 if (aiProposal.icono) setFormIcon(aiProposal.icono);
 if (aiProposal.imagen_url) setFormImageUrl(aiProposal.imagen_url);
 if (aiProposal.biografia) {
 setFormNotes(prev => prev ? `${prev}\n\n[Bio IA]: ${aiProposal.biografia}` : aiProposal.biografia);
 }
 setAiProposal(null);
 };

 // Handle open modal for creation
 const handleOpenCreateModal = () => {
 setEditingBand(null);
 setFormName('');
 setFormStyle('Balkan Ska / Mestizaje');
 setFormLocation('Madrid');
 setFormStatus('sin_contactar');
 setFormLastContact(new Date().toISOString().split('T')[0]);
 setFormContactName('');
 setFormEmail('');
 setFormPhone('');
 setFormInstagram('');
 setFormSpotifyYoutube('');
 setFormAforo(0);
 setFormNotes('');
 setFormIcon('🎸');
 setFormImageUrl('');
 setAiProposal(null);
 setAiError(null);
 setIsAiSearching(false);
 setIsAddEditModalOpen(true);
 };

 // Handle open modal for editing
 const handleOpenEditModal = (band: BandContact) => {
 setEditingBand(band);
 setFormName(band.nombre_banda);
 setFormStyle(band.estilo_musical);
 setFormLocation(band.localizacion);
 setFormStatus(band.estado_relacion);
 setFormLastContact(band.ultimo_contacto);
 setFormContactName(band.contacto_nombre ||'');
 setFormEmail(band.email ||'');
 setFormPhone(band.telefono ||'');
 setFormInstagram(band.instagram ||'');
 setFormSpotifyYoutube(band.spotify_youtube ||'');
 setFormAforo(band.aforo_promedio || 0);
 setFormNotes(band.notas_colaboracion ||'');
 setFormIcon(band.icono ||'🎸');
 setFormImageUrl(band.imagen_url ||'');
 setAiProposal(null);
 setAiError(null);
 setIsAiSearching(false);
 setIsAddEditModalOpen(true);
 };

 // Handle Save (Create or Update)
 const handleSaveBand = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!formName.trim()) {
 alert('Por favor introduce el nombre de la banda.');
 return;
 }

 const token = localStorage.getItem('bakandeya_token');
 const headers = {'Content-Type':'application/json',
 ...(token ? {'Authorization': `Bearer ${token}` } : {})
 };

 if (editingBand) {
 // Update existing
 const updated: BandContact = {
 ...editingBand,
 nombre_banda: formName.trim(),
 estilo_musical: formStyle.trim(),
 localizacion: formLocation.trim(),
 estado_relacion: formStatus,
 ultimo_contacto: formLastContact,
 contacto_nombre: formContactName.trim(),
 email: formEmail.trim(),
 telefono: formPhone.trim(),
 instagram: formInstagram.trim(),
 spotify_youtube: formSpotifyYoutube.trim(),
 aforo_promedio: Number(formAforo) || 0,
 notas_colaboracion: formNotes.trim(),
 ciudad_origen_swap: formLocation.trim(),
 icono: formIcon,
 imagen_url: formImageUrl
 };

 setBands(prev => prev.map(b => b.id === editingBand.id ? updated : b));

 try {
 await fetch(`/api/bands/${editingBand.id}`, {
 method:'PUT',
 headers,
 body: JSON.stringify(updated)
 });
 } catch (err) {
 console.error("Error updating band on server:", err);
 }

 // Also sync back to main leads list if onUpdateLead is provided
 if (onUpdateLead) {
 onUpdateLead(editingBand.id, {
 nombre_sala: updated.nombre_banda,
 genero: updated.estilo_musical,
 ciudad: updated.localizacion,
 contacto_nombre: updated.contacto_nombre,
 email_contacto: updated.email,
 telefono: updated.telefono,
 instagram: updated.instagram,
 notas: updated.notas_colaboracion,
 icono: updated.icono,
 imagen_url: updated.imagen_url
 });
 }
 } else {
 // Create new
 const newBand: BandContact = {
 id: `band-${Date.now()}`,
 nombre_banda: formName.trim(),
 estilo_musical: formStyle.trim(),
 localizacion: formLocation.trim(),
 estado_relacion: formStatus,
 ultimo_contacto: formLastContact || new Date().toISOString().split('T')[0],
 contacto_nombre: formContactName.trim(),
 email: formEmail.trim(),
 telefono: formPhone.trim(),
 instagram: formInstagram.trim(),
 spotify_youtube: formSpotifyYoutube.trim(),
 aforo_promedio: Number(formAforo) || 0,
 notas_colaboracion: formNotes.trim(),
 ciudad_origen_swap: formLocation.trim(),
 icono: formIcon,
 imagen_url: formImageUrl
 };

 setBands(prev => [newBand, ...prev]);

 try {
 await fetch('/api/bands', {
 method:'POST',
 headers,
 body: JSON.stringify(newBand)
 });
 } catch (err) {
 console.error("Error creating band on server:", err);
 }

 // Sync to main leads list if onAddLead is provided
 if (onAddLead) {
 onAddLead({
 id: newBand.id,
 nombre_sala: newBand.nombre_banda,
 ciudad: newBand.localizacion,
 region: newBand.localizacion,
 aforo: newBand.aforo_promedio || 0,
 genero: newBand.estilo_musical,
 tipo:'grupo',
 email_contacto: newBand.email ||'',
 telefono: newBand.telefono ||'',
 instagram: newBand.instagram ||'',
 contacto_nombre: newBand.contacto_nombre ||'',
 fuente:'Red de Co-Booking Bandas',
 estado:'pendiente_aprobacion',
 pitch_generado: `Propuesta Date Swap: Bakandeya x ${newBand.nombre_banda}`,
 notas: newBand.notas_colaboracion ||'',
 icono: newBand.icono,
 imagen_url: newBand.imagen_url
 });
 }
 }

 setIsAddEditModalOpen(false);
 };

 // Handle Import Scouted Bands
 const handleImportScoutedBands = async (importedBands: Partial<BandContact>[]) => {
 const today = new Date().toISOString().split('T')[0];
 const newBands = [];
 
 for (const b of importedBands) {
 const newBand = {
 id: `temp-${Date.now()}-${Math.random()}`,
 nombre_banda: b.nombre_banda ||'Sin nombre',
 localizacion: b.localizacion ||'Desconocida',
 estilo_musical: b.estilo_musical ||'Mestizaje',
 estado_relacion:'sin_contactar' as BandRelationshipStatus,
 instagram: (b as any).instagram_url ||'',
 spotify: (b as any).spotify_url ||'',
 youtube: (b as any).youtube_url ||'',
 aforo_promedio: b.aforo_promedio || null,
 fecha_creacion: today,
 ultimo_contacto: today,
 notas: activeCampaign ? `Scouteada para campaña: ${activeCampaign.name}` :'Scouteada vía IA',
 es_favorito: false
 };
 newBands.push(newBand);
 try {
 await fetch('/api/bands', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify(newBand)
 });
 } catch (err) {
 console.error("Error creating scouted band", err);
 }
 }
 
 // Optimistic UI update
 setBands(prev => [...newBands, ...prev]);
 };

 // Handle Delete
 const handleDeleteBand = async (id: string, name: string) => {
 if (window.confirm(`¿Estás seguro de eliminar el contacto de la banda"${name}"?`)) {
 setBands(prev => prev.filter(b => b.id !== id));
 try {
 await fetch(`/api/bands/${id}`, { method:'DELETE' });
 } catch (err) { console.error("Error deleting band", err); }
 }
 };

 // Toggle Favorite
 const handleUpdateBandFavorite = async (id: string, isFav: boolean) => {
 setBands(prev => prev.map(b => b.id === id ? { ...b, es_favorito: isFav } : b));
 try {
 await fetch(`/api/bands/${id}`, {
 method:'PUT',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({ es_favorito: isFav })
 });
 } catch (err) { console.error("Error updating favorite status", err); }
 };

 // Quick Status update
 const handleQuickStatusChange = async (id: string, newStatus: BandRelationshipStatus) => {
 const today = new Date().toISOString().split('T')[0];
 const bandToUpdate = bands.find(b => b.id === id);
 if (!bandToUpdate) return;
 
 const updated = { ...bandToUpdate, estado_relacion: newStatus, ultimo_contacto: today };
 setBands(prev => prev.map(b => b.id === id ? updated : b));
 
 try {
 await fetch(`/api/bands/${id}`, {
 method:'PUT',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify(updated)
 });
 } catch (err) { console.error("Error updating band status", err); }
 };

 // Bulk action handlers
 const handleToggleSelectBand = (id: string, e?: React.MouseEvent) => {
 if (e) e.stopPropagation();
 setSelectedBandIds(prev =>
 prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
 );
 };

 const handleSelectAllFilteredBands = () => {
 setSelectedBandIds(filteredBands.map(b => b.id));
 };

 const handleDeselectAllBands = () => {
 setSelectedBandIds([]);
 };

 const handleBulkBandStatusChange = async (newStatus: BandRelationshipStatus) => {
 if (selectedBandIds.length === 0) return;
 const today = new Date().toISOString().split('T')[0];
 setBands(prev => prev.map(b => selectedBandIds.includes(b.id) ? { ...b, estado_relacion: newStatus, ultimo_contacto: today } : b));
 
 selectedBandIds.forEach(id => {
 fetch(`/api/bands/${id}`, {
 method:'PUT',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({ estado_relacion: newStatus, ultimo_contacto: today })
 }).catch(console.error);
 });
 };

 const handleBulkBandToggleFavorite = (isFav: boolean) => {
 if (selectedBandIds.length === 0) return;
 setBands(prev => prev.map(b => selectedBandIds.includes(b.id) ? { ...b, es_favorito: isFav } : b));
 selectedBandIds.forEach(id => {
 fetch(`/api/bands/${id}`, {
 method:'PUT',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({ es_favorito: isFav })
 }).catch(console.error);
 });
 };

 const handleBulkBandDelete = async () => {
 if (selectedBandIds.length === 0) return;
 const idsToDelete = [...selectedBandIds];
 setSelectedBandIds([]);
 setBands(prev => prev.filter(b => !idsToDelete.includes(b.id)));
 try {
 await api.bulkDeleteBands(idsToDelete);
 } catch (err) {
 console.error('Error bulk deleting bands:', err);
 fetchBands();
 }
 };

 const handleBulkBandExportCsv = () => {
 const bandsToExport = bands.filter(b => selectedBandIds.includes(b.id));
 if (bandsToExport.length === 0) return;

 const headers = ['Nombre Banda','Estilo Musical','Localización','Estado Relación','Contacto','Email','Teléfono','Instagram','Spotify / Web','Aforo Habitual','Notas'];
 const rows = bandsToExport.map(b => [
 `"${(b.nombre_banda ||'').replace(/"/g,'""')}"`,
 `"${(b.estilo_musical ||'').replace(/"/g,'""')}"`,
 `"${(b.localizacion ||'').replace(/"/g,'""')}"`,
 `"${(b.estado_relacion ||'').replace(/"/g,'""')}"`,
 `"${(b.contacto_nombre ||'').replace(/"/g,'""')}"`,
 `"${(b.email ||'').replace(/"/g,'""')}"`,
 `"${(b.telefono ||'').replace(/"/g,'""')}"`,
 `"${(b.instagram ||'').replace(/"/g,'""')}"`,
 `"${(b.spotify_youtube ||'').replace(/"/g,'""')}"`,
 `"${b.aforo_promedio ||''}"`,
 `"${(b.notas_colaboracion ||'').replace(/"/g,'""')}"`
 ]);

 const csvContent ='data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
 const encodedUri = encodeURI(csvContent);
 const link = document.createElement('a');
 link.setAttribute('href', encodedUri);
 link.setAttribute('download', `bandmanager_bandas_seleccionadas_${new Date().toISOString().slice(0, 10)}.csv`);
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 };

 const handleBulkGenerateSwaps = async () => {
 const targetBands = bands.filter(b => selectedBandIds.includes(b.id));
 if (targetBands.length === 0) return;

 const initialItems: BulkProgressItem[] = targetBands.map(b => ({
 id: b.id,
 name: b.nombre_banda,
 status:'pending'
 }));

 setBulkProgressState({
 isOpen: true,
 title:'Generando Propuestas Date Swap con IA',
 subtitle:'Redactando propuestas de intercambio de fechas y cartel doble',
 items: initialItems,
 currentIndex: 0,
 totalCount: initialItems.length,
 isCompleted: false
 });

 const updatedItems = [...initialItems];

 for (let i = 0; i < targetBands.length; i++) {
 const band = targetBands[i];
 updatedItems[i] = { ...updatedItems[i], status:'in_progress', detail:'Redactando propuesta swap...' };
 setBulkProgressState(prev => ({ ...prev, items: [...updatedItems], currentIndex: i }));

 try {
 const res = await fetch('/api/bands/generate-date-swap-pitch', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 bandName: band.nombre_banda,
 bandLocation: band.localizacion,
 bandStyle: band.estilo_musical,
 aforo: band.aforo_promedio
 })
 });

 const data = await res.json();
 const pitchText = data.pitch || data.data?.pitch || `Hola compas de ${band.nombre_banda},\n\nOs escribimos desde Bakandeya. Nos encanta vuestro estilo ${band.estilo_musical} y estamos planeando fechas por vuestra zona (${band.localizacion}). ¿Os cuadraría plantear un intercambio de fechas (Date Swap)? Nosotros os montamos fecha en nuestra ciudad y vosotros nos abrís en la vuestra.\n\n¡Un abrazo grande!`;

 const updatedBand = {
 ...band,
 estado_relacion:'propuesta_enviada' as BandRelationshipStatus,
 notas_colaboracion: `${band.notas_colaboracion ? band.notas_colaboracion +'\n\n' :''}[Propuesta Swap IA]:\n${pitchText}`
 };

 setBands(prev => prev.map(b => b.id === band.id ? updatedBand : b));
 await fetch(`/api/bands/${band.id}`, {
 method:'PUT',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify(updatedBand)
 });

 updatedItems[i] = { ...updatedItems[i], status:'success', detail:'Propuesta lista' };
 } catch (err: any) {
 updatedItems[i] = { ...updatedItems[i], status:'error', detail: err.message ||'Error al generar' };
 }

 setBulkProgressState(prev => ({ ...prev, items: [...updatedItems], currentIndex: i + 1 }));
 }

 setBulkProgressState(prev => ({ ...prev, isCompleted: true }));
 };

 // Filter logic
 const filteredBands = bands.filter(band => {
 // Search
 const searchLower = searchTerm.toLowerCase().trim();
 const matchesSearch = !searchLower || 
 band.nombre_banda.toLowerCase().includes(searchLower) ||
 band.estilo_musical.toLowerCase().includes(searchLower) ||
 band.localizacion.toLowerCase().includes(searchLower) ||
 (band.contacto_nombre && band.contacto_nombre.toLowerCase().includes(searchLower)) ||
 (band.email && band.email.toLowerCase().includes(searchLower));

 // Status filter
 const matchesStatus = statusFilter ==='todos' || band.estado_relacion === statusFilter;

 // Style filter
 const matchesStyle = styleFilter ==='todos' || 
 band.estilo_musical.toLowerCase().includes(styleFilter.toLowerCase());

 // Location filter
 const matchesLocation = locationFilter ==='todos' || 
 band.localizacion.toLowerCase().includes(locationFilter.toLowerCase());

 return matchesSearch && matchesStatus && matchesStyle && matchesLocation;
 });

 // Extract unique locations and styles for filter dropdowns
 const availableLocations = Array.from(new Set(bands.map(b => b.localizacion).filter(Boolean))).sort();
 const availableStyles = Array.from(new Set(bands.map(b => b.estilo_musical).filter(Boolean))).sort();

 // Metrics counts
 const totalBands = bands.length;
 const alliesCount = bands.filter(b => b.estado_relacion ==='colegas_aliados').length;
 const proposedSwapsCount = bands.filter(b => b.estado_relacion ==='intercambio_propuesto').length;
 const scheduledShowsCount = bands.filter(b => b.estado_relacion ==='concierto_agendado').length;

 // Render Status Badge
 const renderStatusBadge = (status: BandRelationshipStatus) => {
 switch (status) {
 case'colegas_aliados':
 return (
 <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[var(--r-s)] text-[10px] font-sans font-bold tracking-wider bg-[var(--surface)]/15 text-[var(--ok)] whitespace-nowrap shrink-0">
 <Handshake className="w-3 h-3 text-[var(--ok)] shrink-0" />
 <span>Colegas / Aliados</span>
 </span>
 );
 case'concierto_agendado':
 return (
 <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[var(--r-s)] text-[10px] font-sans font-bold tracking-wider bg-[var(--acc)]/15 text-[var(--acc)] whitespace-nowrap shrink-0">
 <Zap className="w-3 h-3 text-[var(--acc)] shrink-0" />
 <span>Concierto Agendado</span>
 </span>
 );
 case'intercambio_propuesto':
 return (
 <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[var(--r-s)] text-[10px] font-sans font-bold tracking-wider bg-[var(--acc)]/15 text-[var(--ink-2)] whitespace-nowrap shrink-0">
 <Repeat className="w-3 h-3 text-[var(--ink-2)] shrink-0" />
 <span>Intercambio Propuesto</span>
 </span>
 );
 case'pendiente_respuesta':
 return (
 <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[var(--r-s)] text-[10px] font-sans font-bold tracking-wider bg-[var(--tentative)]/15 text-[var(--tentative)]/80 whitespace-nowrap shrink-0">
 <Clock className="w-3 h-3 text-[var(--tentative)]/80 shrink-0" />
 <span>Pendiente Respuesta</span>
 </span>
 );
 case'no_disponible':
 return (
 <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[var(--r-s)] text-[10px] font-sans font-bold tracking-wider bg-[var(--alert)]/15 text-[var(--alert)] whitespace-nowrap shrink-0">
 <X className="w-3 h-3 text-[var(--alert)] shrink-0" />
 <span>No Disponible</span>
 </span>
 );
 case'sin_contactar':
 default:
 return (
 <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[var(--r-s)] text-[10px] font-sans font-bold tracking-wider bg-[var(--surface)]/80 text-[var(--ink-2)] whitespace-nowrap shrink-0">
 <Radio className="w-3 h-3 text-[var(--ink-2)] shrink-0" />
 <span>Sin Contactar</span>
 </span>
 );
 }
 };

 // Generate Date Swap Pitch Text
 const generatePitchText = (band: BandContact) => {
 if (activeCampaign && activeCampaign.isActive) {
 return `¡Buenas chavales de ${band.nombre_banda}! 🎸🔥

Os escribimos directamente desde Bakandeya (banda de Balkan-Ska, violín enérgico, loops analógicos y electrónica).

Nos mola mucho vuestra propuesta en ${band.estilo_musical} y vemos que tenéis fuerte tirón en ${band.localizacion}. Os escribimos porque estamos armando una campaña de conciertos muy especial y creemos que podríamos montar un cartelazo juntos.

Nuestro objetivo es un aforo de ${activeCampaign.minCapacity}-${activeCampaign.maxCapacity} personas en ${activeCampaign.targetCities.join(',')} para las fechas: ${activeCampaign.targetDatesText ||'la próxima temporada'}. 

Nuestra idea es montar un CO-BOOKING donde nosotros aportamos la producción y nuestro público en la ciudad, y vosotros sumáis vuestra fuerza para asegurar un *sold out* brutal. Además, dejamos la puerta abierta para devolveros la visita en ${band.localizacion} en el futuro compartiendo escenario y backline.

Podéis escuchar nuestra música y directo aquí:
https://youtube.com/bakandeya_live

¿Os cuadran las fechas? ¿Qué os parece la idea? Si os mola, hablamos por WhatsApp esta semana para cerrar los detalles de sala.

¡Un fuerte abrazo!
Bakandeya Agent Manager`;
 }

 return `¡Buenas chavales de ${band.nombre_banda}! 🎸🔥

Os escribimos directamente desde Bakandeya (banda de Balkan-Ska, violín enérgico, loops analógicos y electrónica de Madrid/Sevilla).

Nos mola mucho vuestra propuesta en ${band.estilo_musical} y vemos que tenéis fuerte tirón en ${band.localizacion}. Queremos proponer un INTERCAMBIO DE FECHAS / CO-BOOKING (Date Swap) para la temporada de ${proposedMonth}:

1. Os invitamos a tocar con nosotros en ${proposedBakandeyaCity} (${proposedVenueBakandeya}), compartiendo escenario, cartel y taquilla al 50%.
2. Montamos la fecha de vuelta en ${band.localizacion} en vuestro local habitual para sumar ambos públicos locales y abaratar gastos de furgoneta y backline.

Podéis escuchar nuestros directos de alta intensidad aquí:
https://youtube.com/bakandeya_live

¿Cómo lo veis? ¿Hablamos por WhatsApp o hacemos una breve llamada esta semana para cuadrar fechas?

¡Un fuerte abrazo!
Bakandeya Agent Manager IA & Músicos`;
 };

 const isStitchLight = (typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light') || colors.name?.toLowerCase().includes('light') || colors.bg.includes('f8fafc') || colors.bg.includes('white') || colors.bg.includes('slate-50') || false;

 return (
 <div className="w-full space-y-6">
 
 {/* 1. HEADER COMPACTO Y CONTROLES */}
 <div className={`p-3 sm:p-3.5 rounded-[var(--r-m)] transition-all ${colors.card} flex flex-col sm:flex-row sm:items-center justify-between gap-2.5`}>
 {/* Izquierda: Título y sub-pestañas */}
 <div className="flex items-center gap-2.5 flex-wrap">
 <div className="flex items-center gap-2">
 <h2 className="text-lg sm:text-xl font-bold font-display tracking-tight text-[var(--ink)] flex items-center gap-1.5">
 <Users className="w-4 h-4 text-[var(--acc)]" />
 <span>Grupos</span>
 </h2>
 <span className="text-[11px] font-sans text-[var(--ink-2)] bg-[var(--surface)] px-2 py-0.5 rounded-full">
 {totalBands}
 </span>
 </div>

 <div className="h-4 w-px bg-[var(--surface)]/80 hidden sm:block" />

 {/* Sub-tabs segmentadas */}
 <div className="flex items-center gap-1 bg-[var(--surface)]/80 p-0.5 rounded-[var(--r-s)]">
 <button
 type="button"
 onClick={() => setSubTab('co_booking')}
 className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
 subTab ==='co_booking'
 ?'bg-[var(--sunken)] text-[var(--ink)]'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 <span>Bandas Amigas</span>
 </button>

 {registeredBands.length > 0 && (
 <button
 type="button"
 onClick={() => { setSubTab('registered_bands'); fetchRegisteredBands(); }}
 className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
 subTab ==='registered_bands'
 ?'bg-[var(--ok)]/20 text-[var(--ink-2)]'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 <span>Registro</span>
 <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--ok)]/30 text-[var(--ink)] font-bold">
 {registeredBands.length}
 </span>
 </button>
 )}
 </div>
 </div>

 {/* Derecha: Acciones rápidas en una sola fila */}
 <div className="flex flex-wrap items-center gap-2 shrink-0">
 <button
 id="band-btn-[#date-swap-pitch]"
 type="button"
 onClick={() => {
 if (bands.length > 0) {
 setSelectedPitchBand(bands[0]);
 setIsPitchModalOpen(true);
 } else {
 alert('Añade primero una banda para generar un pitch de intercambio.');
 }
 }}
 className="px-2.5 py-1.5 rounded-[var(--r-s)] text-xs font-medium bg-[var(--acc)]/10 hover:bg-[var(--acc)]/20 text-[var(--tentative)]/40 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
 title="Generar pitch de intercambio de fechas (Date Swap)"
 >
 <Repeat className="w-3.5 h-3.5 text-[var(--ink-2)] shrink-0" />
 <span>Date Swap</span>
 </button>

 <button
 type="button"
 onClick={() => setIsScoutModalOpen(true)}
 className="px-2.5 py-1.5 rounded-[var(--r-s)] text-xs font-medium bg-[var(--acc)]/10 hover:bg-[var(--acc)]/20 text-[var(--acc)]/70 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
 title="Scout IA: Buscar bandas para co-booking"
 >
 <Sparkles className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
 <span>Scout IA</span>
 </button>

 <button
 id="band-btn-add-new"
 type="button"
 onClick={handleOpenCreateModal}
 className="px-3 py-1.5 rounded-[var(--r-s)] text-xs font-semibold bg-[var(--acc)] hover:bg-[var(--acc-soft)] text-[var(--on-acc)] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
 >
 <Plus className="w-3.5 h-3.5 shrink-0" />
 <span>Nueva Banda</span>
 </button>

 <a
 href="/api/export-excel"
 download="band_data.xlsx"
 className="px-2.5 py-1.5 rounded-[var(--r-s)] text-xs font-medium bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
 title="Exportar Excel Completo (.xlsx)"
 >
 <FileSpreadsheet className="w-3.5 h-3.5 text-[var(--ok)]" />
 <span className="hidden sm:inline">Excel</span>
 </a>
 </div>
 </div>

 {/* TAB 2: REGISTERED BANDS VIEW (registro_bandas) */}
 {subTab ==='registered_bands' ? (
 <div className={`p-5 rounded-[var(--r-l)] ${colors.card} space-y-4 `}>
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div>
 <h3 className="text-xl font-bold font-display text-[var(--ink)] flex items-center gap-2">
 <Building2 className="w-5 h-5 text-[var(--ok)]" />
 <span>Registro de Nuevas Bandas Clientes (registro_bandas)</span>
 </h3>
 <p className="text-xs text-[var(--ink-2)] font-sans mt-0.5">
 Tabla oficial de Supabase <span className="text-[var(--ok)] font-bold">registro_bandas</span> con la columna <span className="text-[var(--acc)]/70 font-bold">band_id</span> situándose en la extrema derecha.
 </p>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <button
 onClick={fetchRegisteredBands}
 className="p-2.5 rounded-[var(--r-m)] bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] text-xs font-sans flex items-center gap-1.5 transition-all cursor-pointer"
 >
 <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRegBands ?'animate-spin' :''}`} />
 <span>Actualizar</span>
 </button>
 <a
 href="/api/export-excel"
 download="band_data.xlsx"
 className="p-2.5 rounded-[var(--r-m)] bg-[var(--ok)]/20 hover:bg-[var(--ok)]/30 text-[var(--ink-2)] text-xs font-sans flex items-center gap-1.5 transition-all cursor-pointer"
 >
 <FileSpreadsheet className="w-3.5 h-3.5" />
 <span>Excel (.xlsx)</span>
 </a>
 </div>
 </div>

 <div className="overflow-x-auto rounded-[var(--r-m)]">
 <table className="w-full text-left border-collapse text-xs font-sans">
 <thead>
 <tr className="bg-[var(--surface)] text-[var(--ink-2)] tracking-wider text-[10px] border-b border-[var(--hair)]">
 <th className="p-3">ID Reg.</th>
 <th className="p-3">Nombre Banda</th>
 <th className="p-3">Email Contacto</th>
 <th className="p-3">Plan</th>
 <th className="p-3">Fecha Registro</th>
 <th className="p-3">Estado Cuenta</th>
 <th className="p-3">Notas</th>
 <th className="p-3 font-bold text-[var(--acc)]/80 bg-[var(--acc)]/10 border-l border-[var(--acc)]/20">user_id</th>
 <th className="p-3 text-right text-[var(--acc)]/70 bg-[var(--acc)]/10 border-l /20 font-bold">band_id</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[var(--hair)]800/60 bg-[var(--surface)]/40 text-[var(--ink-2)]">
 {registeredBands.length === 0 ? (
 <tr>
 <td colSpan={9} className="p-8 text-center text-[var(--ink-2)] italic">
 {isLoadingRegBands ?'Cargando bandas registradas...' :'No hay registros en registro_bandas aún.'}
 </td>
 </tr>
 ) : (
 registeredBands.map((band: any, idx: number) => (
 <tr key={band.id || `reg-${idx}`} className="hover:bg-[var(--surface)]/80 transition-colors">
 <td className="p-3 font-sans text-[var(--ink-2)]">{band.id || `reg-${idx + 1}`}</td>
 <td className="p-3 font-bold text-[var(--ink)] flex items-center gap-2">
 <span className="w-2 h-2 rounded-full bg-[var(--ok)]"></span>
 <span>{band.nombre_banda || band.nombreBanda || band.contacto_nombre}</span>
 </td>
 <td className="p-3 text-[var(--ink-2)]">{band.email ||'—'}</td>
 <td className="p-3">
 <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--tentative)]/15 text-[var(--tentative)]/50">
 {band.plan ||'emergente'}
 </span>
 </td>
 <td className="p-3 text-[var(--ink-2)]">
 {band.fecha_registro ? new Date(band.fecha_registro).toLocaleDateString() :'—'}
 </td>
 <td className="p-3">
 <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--ok)]/15 text-[var(--ok)]">
 {band.estado_cuenta ||'activo'}
 </span>
 </td>
 <td className="p-3 text-[var(--ink-2)] max-w-xs truncate">{band.notas ||'—'}</td>
 <td className="p-3 text-left font-bold text-[var(--acc)]/80 bg-[var(--acc)]/5 border-l border-[var(--acc)]/20 font-sans">
 {band.user_id ||'—'}
 </td>
 <td className="p-3 text-right font-bold text-[var(--acc)]/70 bg-[var(--acc)]/5 border-l /20 font-sans">
 {band.band_id || band.bandId ||'band-1'}
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 ) : (
 <>
 {/* 2. FILTER & SEARCH CONTROL BAR */}
 <div className={`p-4 rounded-[var(--r-m)] ${colors.card} space-y-3`}>
 <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
 
 {/* Search Bar */}
 <div className="relative flex-1 min-w-[220px]">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-2)]" />
 <input
 id="band-search-input"
 type="text"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 placeholder="Buscar por banda, estilo, ciudad o contacto..."
 className="w-full bg-[var(--surface)]/90 text-[var(--ink)] pl-9 pr-3 py-2 rounded-[var(--r-m)] text-[10px] font-sans focus:outline-none focus:-[var(--acc)]/50 transition-colors"
 />
 {searchTerm && (
 <button 
 onClick={() => setSearchTerm('')} 
 className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-2)] hover:text-[var(--ink)]"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 {/* Filters Row */}
 <div className="flex flex-wrap items-center gap-2">
 
 {/* Status Filter Dropdown */}
 <select
 id="band-filter-status"
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value as BandRelationshipStatus |'todos')}
 className="bg-[var(--surface)] text-[var(--ink-2)] px-2 py-1 rounded-[var(--r-m)] text-[10px] font-sans focus:outline-none focus:-[var(--acc)]/50 cursor-pointer"
 >
 <option value="todos">🤝 Todos los Estados</option>
 <option value="colegas_aliados">🤝 Colegas / Aliados</option>
 <option value="concierto_agendado">⚡ Concierto Agendado</option>
 <option value="intercambio_propuesto">🔄 Intercambio Propuesto</option>
 <option value="pendiente_respuesta">⏳ Pendiente Respuesta</option>
 <option value="sin_contactar">📡 Sin Contactar</option>
 <option value="no_disponible">❌ No Disponible</option>
 </select>

 {/* Location Filter Dropdown */}
 <select
 id="band-filter-location"
 value={locationFilter}
 onChange={(e) => setLocationFilter(e.target.value)}
 className="bg-[var(--surface)] text-[var(--ink-2)] px-2 py-1 rounded-[var(--r-m)] text-[10px] font-sans focus:outline-none focus:-[var(--acc)]/50 cursor-pointer max-w-[160px] truncate"
 >
 <option value="todos">📍 Todas las Ciudades</option>
 {availableLocations.map(loc => (
 <option key={loc} value={loc}>{loc}</option>
 ))}
 </select>

 {/* Quick Selection Toggle */}
 {filteredBands.length > 0 && (
 <button
 type="button"
 onClick={selectedBandIds.length === filteredBands.length ? handleDeselectAllBands : handleSelectAllFilteredBands}
 className={`px-2.5 py-1 rounded-[var(--r-m)] text-[10px] font-sans font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
 selectedBandIds.length > 0
 ?'bg-[var(--acc)]/15 text-[var(--acc)] border-[var(--acc)]/30 hover:bg-[var(--acc)]/25'
 :'bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 title={selectedBandIds.length === filteredBands.length ?'Deseleccionar todas' :'Seleccionar todas las filtradas'}
 >
 {selectedBandIds.length === filteredBands.length ? (
 <CheckSquare className="w-3.5 h-3.5 text-[var(--acc)]" />
 ) : selectedBandIds.length > 0 ? (
 <MinusSquare className="w-3.5 h-3.5 text-[var(--acc)]" />
 ) : (
 <Square className="w-3.5 h-3.5 text-[var(--ink-2)]" />
 )}
 <span>{selectedBandIds.length > 0 ? `${selectedBandIds.length}/${filteredBands.length}` :'Sel. Todos'}</span>
 </button>
 )}

 {/* View Mode Toggle */}
 <div className="flex items-center p-1 bg-[var(--surface)] rounded-[var(--r-m)] shrink-0">
 <button
 id="view-grid-btn"
 type="button"
 onClick={() => setViewMode('grid')}
 className={`p-1.5 rounded-[var(--r-s)] transition-colors cursor-pointer ${
 viewMode ==='grid' ?'bg-[var(--acc)] text-[var(--on-acc)]' :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 title="Vista en Tarjetas"
 >
 <LayoutGrid className="w-4 h-4" />
 </button>
 <button
 id="view-table-btn"
 type="button"
 onClick={() => setViewMode('table')}
 className={`p-1.5 rounded-[var(--r-s)] transition-colors cursor-pointer ${
 viewMode ==='table' ?'bg-[var(--acc)] text-[var(--on-acc)]' :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 title="Vista en Lista / Tabla"
 >
 <List className="w-4 h-4" />
 </button>
 <button
 id="view-map-btn"
 type="button"
 onClick={() => setViewMode('map')}
 className={`p-1.5 rounded-[var(--r-s)] transition-colors cursor-pointer ${
 viewMode ==='map' ?'bg-[var(--acc)] text-[var(--on-acc)]' :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 title="Vista en Mapa Interactivo"
 >
 <Map className="w-4 h-4" />
 </button>
 </div>
 </div>
 </div>
 </div>

 {/* 🎯 GMAIL-STYLE BULK ACTIONS BAR (STICKY AT TOP OF LIST) */}
 <BulkBandActionBar
 selectedCount={selectedBandIds.length}
 totalFilteredCount={filteredBands.length}
 isAllSelected={filteredBands.length > 0 && selectedBandIds.length === filteredBands.length}
 onSelectAll={handleSelectAllFilteredBands}
 onDeselectAll={handleDeselectAllBands}
 onBulkStatusChange={handleBulkBandStatusChange}
 onBulkGeneratePitch={handleBulkGenerateSwaps}
 onBulkToggleFavorite={handleBulkBandToggleFavorite}
 onBulkExportCsv={handleBulkBandExportCsv}
 onBulkDelete={handleBulkBandDelete}
 isStitchLight={isStitchLight}
 />

 {/* 3. BAND LIST CONTAINER */}
 {filteredBands.length === 0 ? (
 <div className={`p-12 rounded-[var(--r-l)] text-center space-y-3 ${colors.card} `}>
 <AlertCircle className="w-10 h-10 text-[var(--ink-2)] mx-auto" />
 <h3 className="text-sm font-sans font-bold text-[var(--ink-2)] tracking-wider">
 No se encontraron bandas
 </h3>
 <p className="text-[10px] text-[var(--ink-2)] max-w-md mx-auto font-sans">
 No hay bandas registradas que coincidan con los criterios de búsqueda o filtros seleccionados. Prorroga tu búsqueda o añade una nueva banda.
 </p>
 <button
 onClick={handleOpenCreateModal}
 className="mt-2 inline-flex items-center gap-2 px-2 py-1 bg-[var(--sunken)] hover:bg-[var(--ink-3)]/60 text-[var(--ink)] font-sans font-bold text-[10px] tracking-wider rounded-[var(--r-m)] transition-all cursor-pointer"
 >
 <Plus className="w-4 h-4" />
 <span>Añadir Primera Banda</span>
 </button>
 </div>
 ) : viewMode ==='map' ? (
 <BandMap
 bands={filteredBands}
 onSelectBand={(band) => handleOpenEditModal(band)}
 isStitchLight={isStitchLight}
 />
 ) : viewMode ==='grid' ? (
 /* GRID CARDS VIEW */
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {filteredBands.map((band) => {
 const isSelected = selectedBandIds.includes(band.id);
 return (
 <div
 key={band.id}
 className={`p-5 rounded-[var(--r-l)] transition-all flex flex-col justify-between space-y-4 ${colors.card} group relative overflow-hidden ${
 isSelected ?'ring-2 ring-[var(--acc)] border-[var(--acc)]/70 bg-[var(--surface)]' :'hover:-amber-0/40'
 }`}
 >
 <div className="space-y-3">
 {/* Card Top: Band Name & Status */}
 <div className="flex items-start justify-between gap-2">
 <div className="flex items-start gap-2.5 min-w-0">
 <button
 type="button"
 onClick={(e) => handleToggleSelectBand(band.id, e)}
 className="mt-0.5 p-1 rounded hover:bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--acc)] transition-colors cursor-pointer shrink-0"
 title={isSelected ?'Deseleccionar banda' :'Seleccionar banda'}
 >
 {isSelected ? (
 <CheckSquare className="w-4 h-4 text-[var(--acc)]" />
 ) : (
 <Square className="w-4 h-4 text-[var(--ink-2)] hover:text-[var(--ink-2)]" />
 )}
 </button>
 <div className="space-y-1 min-w-0">
 <div className="flex items-center gap-1.5 min-w-0">
 <h3 className="text-base font-bold font-display tracking-wider text-[var(--ink)] flex items-center gap-2 group-hover:text-[var(--acc)] transition-colors truncate min-w-0">
 {band.imagen_url ? (
 <img src={band.imagen_url} alt={band.nombre_banda} className="w-6 h-6 rounded-full object-cover border-[var(--acc)]/50 shrink-0" />
 ) : (
 <span className="text-sm shrink-0">{band.icono ||'🎸'}</span>
 )}
 <span className="truncate">{band.nombre_banda}</span>
 </h3>
 <VerifiedBadge isVerified={isLeadVerificado(band)} size="sm" />
 </div>
 
 <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-sans text-[var(--ink-2)]">
 <span className="bg-[var(--surface)]/80 px-2 py-0.5 rounded-md text-[var(--acc)] flex items-center gap-1 shrink-0 max-w-[160px]" title={band.estilo_musical}>
 <Music className="w-3 h-3 text-[var(--acc)] shrink-0" />
 <span className="truncate">{band.estilo_musical}</span>
 </span>

 <span className="bg-[var(--surface)]/80 px-2 py-0.5 rounded-md text-[var(--ink-2)] flex items-center gap-1 shrink-0 max-w-[140px]" title={band.localizacion}>
 <MapPin className="w-3 h-3 text-[var(--alert)] shrink-0" />
 <span className="truncate">{band.localizacion}</span>
 </span>

 <ReliabilityBadge item={band} size="sm" />
 </div>
 </div>
 </div>

 {/* Actions Dropdown / Quick Status & Favorite */}
 <div className="shrink-0 flex items-center gap-1.5">
 <FavoriteButton 
 isFavorite={!!band.es_favorito}
 onToggle={(newVal) => handleUpdateBandFavorite(band.id, newVal)}
 size="sm"
 />
 {renderStatusBadge(band.estado_relacion)}
 </div>
 </div>

 {/* Contact & Audience Row */}
 <div className="p-3 rounded-[var(--r-m)] bg-[var(--surface)]/80 text-[10px] font-sans space-y-2">
 <div className="flex items-center justify-between text-[var(--ink-2)]">
 <span className="text-[10px] text-[var(--ink-2)]">Contacto:</span>
 <span className="font-bold text-[var(--acc)]">{band.contacto_nombre ||'Sin especificar'}</span>
 </div>

 {band.email && (
 <div className="flex items-center justify-between text-[var(--ink-2)] truncate">
 <span className="text-[10px] text-[var(--ink-2)]">Email:</span>
 <a href={`mailto:${band.email}`} className="text-[var(--ink-2)] hover:underline truncate max-w-[180px]">
 {band.email}
 </a>
 </div>
 )}

 {band.telefono && (
 <div className="flex items-center justify-between text-[var(--ink-2)]">
 <span className="text-[10px] text-[var(--ink-2)]">Teléfono:</span>
 <a href={`tel:${band.telefono}`} className="text-[var(--ok)] hover:underline">
 {band.telefono}
 </a>
 </div>
 )}

 <div className="flex items-center justify-between text-[var(--ink-2)] pt-1">
 <span className="text-[10px] text-[var(--ink-2)]">Aforo habitual:</span>
 <span className="font-bold text-[var(--ink-2)]">{band.aforo_promedio ? `~${band.aforo_promedio} pers.` :'No indicado'}</span>
 </div>
 </div>

 {/* Notes & Collaboration Ideas */}
 {band.notas_colaboracion && (
 <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--surface)]/60 text-[10px] font-sans text-[var(--ink-2)] leading-relaxed italic">"{band.notas_colaboracion}"
 </div>
 )}
 </div>

 {/* Card Footer Actions */}
 <div className="pt-3 space-y-3">
 
 {/* Social Links & Last Contact */}
 <div className="flex items-center justify-between text-[10px] font-sans text-[var(--ink-2)]">
 <div className="flex items-center gap-2">
 {band.instagram && (
 <a 
 href={`https://instagram.com/${band.instagram.replace('@','')}`}
 target="_blank" 
 rel="noreferrer"
 className="text-[var(--acc)] hover:text-[var(--acc)] flex items-center gap-1"
 title="Ver Instagram"
 >
 <Globe className="w-3 h-3" />
 <span>{band.instagram}</span>
 </a>
 )}
 </div>

 <span className="flex items-center gap-1 text-[var(--ink-2)]">
 <Clock className="w-3 h-3 text-[var(--ink-2)]" />
 <span>Últ. contacto: {band.ultimo_contacto ||'Reciente'}</span>
 </span>
 </div>

 {/* Action Buttons */}
 <div className="flex items-center gap-2">
 {/* Analyze Tone */}
 <button
 onClick={() => handleAnalyzeTone(band)}
 className="py-1.5 px-2 bg-[var(--acc)]/15 hover:bg-[var(--acc)]/25 text-[var(--acc)] rounded-[var(--r-s)] text-[10px] font-sans font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
 title="Analizar forma de expresarse y tono en redes sociales con IA Grounding"
 >
 <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]" />
 <span>Tono Redes</span>
 </button>

 {/* Generate Pitch */}
 <button
 onClick={() => {
 setCustomPitchText('');
 setSelectedPitchBand(band);
 setIsPitchModalOpen(true);
 }}
 className="flex-1 py-1.5 px-2 bg-[var(--acc)]/15 hover:bg-[var(--acc)]/25 text-[var(--ink-2)] rounded-[var(--r-s)] text-[10px] font-sans font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
 title="Generar Pitch de Date Swap"
 >
 <Repeat className="w-3.5 h-3.5 text-[var(--ink-2)]" />
 <span>Pitch Date Swap</span>
 </button>

 {/* Edit */}
 <button
 onClick={() => handleOpenEditModal(band)}
 className="p-1.5 bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] rounded-[var(--r-s)] transition-colors cursor-pointer"
 title="Editar Banda"
 >
 <Edit3 className="w-3.5 h-3.5" />
 </button>

 {/* Delete */}
 <button
 onClick={() => handleDeleteBand(band.id, band.nombre_banda)}
 className="p-1.5 bg-[var(--alert)]/15 hover:bg-[var(--alert)]/15 text-[var(--alert)] rounded-[var(--r-s)] transition-colors cursor-pointer"
 title="Eliminar Banda"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 ) : (
 /* TABLE LIST VIEW */
 <div className={`rounded-[var(--r-l)] overflow-hidden ${colors.card} overflow-x-auto`}>
 <table className="w-full text-left text-[10px] font-sans min-w-[850px] border-collapse">
 <thead className="bg-[var(--surface)]/90 text-[var(--ink-2)] tracking-wider text-[10px] border-b border-[var(--hair)]">
 <tr>
 <th className="py-2.5 px-3 w-10 text-center whitespace-nowrap">
 <button
 type="button"
 onClick={selectedBandIds.length === filteredBands.length && filteredBands.length > 0 ? handleDeselectAllBands : handleSelectAllFilteredBands}
 className="text-[var(--ink-2)] hover:text-[var(--acc)] transition-colors cursor-pointer"
 title={selectedBandIds.length === filteredBands.length ?'Deseleccionar todas' :'Seleccionar todas'}
 >
 {filteredBands.length > 0 && selectedBandIds.length === filteredBands.length ? (
 <CheckSquare className="w-4 h-4 text-[var(--acc)]" />
 ) : selectedBandIds.length > 0 ? (
 <MinusSquare className="w-4 h-4 text-[var(--acc)]" />
 ) : (
 <Square className="w-4 h-4 text-[var(--ink-2)]" />
 )}
 </button>
 </th>
 <th className="py-2.5 px-3 whitespace-nowrap min-w-[170px]">Banda / Artista</th>
 <th className="py-2.5 px-3 whitespace-nowrap min-w-[150px]">Estilo Musical</th>
 <th className="py-2.5 px-3 whitespace-nowrap min-w-[140px]">Localización</th>
 <th className="py-2.5 px-3 whitespace-nowrap min-w-[140px]">Estado Relación</th>
 <th className="py-2.5 px-3 whitespace-nowrap min-w-[150px]">Contacto</th>
 <th className="py-2.5 px-3 whitespace-nowrap min-w-[90px]">Aforo Habitual</th>
 <th className="py-2.5 px-3 whitespace-nowrap min-w-[100px]">Último Contacto</th>
 <th className="py-2.5 px-3 whitespace-nowrap min-w-[130px] text-right">Acciones</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[var(--hair)]800/60 text-[var(--ink-2)]">
 {filteredBands.map((band) => {
 const isRowSelected = selectedBandIds.includes(band.id);
 return (
 <tr key={band.id} className={`transition-colors ${isRowSelected ?'bg-[var(--acc)]/10 hover:bg-[var(--acc)]/15' :'hover:bg-[var(--surface)]/50'}`}>
 <td className="py-2 px-3 w-10 text-center align-middle whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
 <button
 type="button"
 onClick={(e) => handleToggleSelectBand(band.id, e)}
 className="text-[var(--ink-2)] hover:text-[var(--acc)] transition-colors cursor-pointer"
 title={isRowSelected ?'Deseleccionar banda' :'Seleccionar banda'}
 >
 {isRowSelected ? (
 <CheckSquare className="w-4 h-4 text-[var(--acc)]" />
 ) : (
 <Square className="w-4 h-4 text-[var(--ink-2)] hover:text-[var(--ink-2)]" />
 )}
 </button>
 </td>
 <td className="py-2 px-3 font-bold text-[var(--ink)] align-middle whitespace-nowrap">
 <div className="flex items-center gap-2 min-w-0">
 {band.imagen_url ? (
 <img src={band.imagen_url} alt={band.nombre_banda} className="w-5 h-5 rounded-full object-cover border-[var(--acc)]/50 shrink-0" />
 ) : (
 <span className="text-xs shrink-0">{band.icono ||'🎸'}</span>
 )}
 <span className="truncate max-w-[150px] sm:max-w-[200px]" title={band.nombre_banda}>{band.nombre_banda}</span>
 </div>
 </td>
 <td className="py-2 px-3 text-[var(--acc)] align-middle whitespace-nowrap">
 <span className="truncate max-w-[150px] sm:max-w-[200px] block" title={band.estilo_musical}>
 {band.estilo_musical}
 </span>
 </td>
 <td className="py-2 px-3 align-middle whitespace-nowrap">
 <span className="inline-flex items-center gap-1 text-[var(--ink-2)] max-w-[140px] sm:max-w-[190px]" title={band.localizacion}>
 <MapPin className="w-3 h-3 text-[var(--alert)] shrink-0" />
 <span className="truncate">{band.localizacion}</span>
 </span>
 </td>
 <td className="py-2 px-3 align-middle whitespace-nowrap">{renderStatusBadge(band.estado_relacion)}</td>
 <td className="py-2 px-3 align-middle whitespace-nowrap">
 <div className="space-y-0.5 max-w-[160px]">
 <div className="text-[var(--acc)] font-bold truncate" title={band.contacto_nombre}>{band.contacto_nombre ||'-'}</div>
 <div className="text-[10px] text-[var(--ink-2)] truncate" title={band.email || band.telefono}>{band.email || band.telefono ||'-'}</div>
 </div>
 </td>
 <td className="py-2 px-3 font-sans align-middle whitespace-nowrap text-[var(--ink-2)]">{band.aforo_promedio ? `${band.aforo_promedio} pers.` :'-'}</td>
 <td className="py-2 px-3 text-[var(--ink-2)] align-middle whitespace-nowrap">{band.ultimo_contacto ||'-'}</td>
 <td className="py-2 px-3 text-right align-middle whitespace-nowrap">
 <div className="flex items-center justify-end gap-1.5">
 <button
 onClick={() => handleAnalyzeTone(band)}
 className="px-2 py-1 bg-[var(--acc)]/15 hover:bg-[var(--acc)]/25 text-[var(--acc)] rounded-[var(--r-s)] text-[10px] transition-all cursor-pointer flex items-center gap-1"
 title="Analizar forma de expresarse"
 >
 <Sparkles className="w-3 h-3 text-[var(--acc)]" />
 <span>Tono</span>
 </button>

 <button
 onClick={() => {
 setCustomPitchText('');
 setSelectedPitchBand(band);
 setIsPitchModalOpen(true);
 }}
 className="px-2 py-1 bg-[var(--acc)]/15 hover:bg-[var(--acc)]/25 text-[var(--ink-2)] rounded-[var(--r-s)] text-[10px] transition-all cursor-pointer flex items-center gap-1"
 >
 <Repeat className="w-3 h-3 text-[var(--ink-2)]" />
 <span>Pitch</span>
 </button>

 <button
 onClick={() => handleOpenEditModal(band)}
 className="p-1.5 bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] rounded-[var(--r-s)] transition-colors cursor-pointer"
 title="Editar"
 >
 <Edit3 className="w-3.5 h-3.5" />
 </button>

 <button
 onClick={() => handleDeleteBand(band.id, band.nombre_banda)}
 className="p-1.5 bg-[var(--alert)]/15 hover:bg-[var(--alert)]/15 text-[var(--alert)] rounded-[var(--r-s)] transition-colors cursor-pointer"
 title="Eliminar"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}
 </>
 )}

 {/* 4. MODAL: CREATE / EDIT BAND CONTACT */}
 {isAddEditModalOpen && (
 <div className="fixed inset-0 bg-[var(--scrim)]/85 flex items-center justify-center p-4 z-50">
 <div className={`w-full max-w-2xl rounded-[var(--r-l)] p-6 space-y-5 relative overflow-hidden max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 ${
 isStitchLight ?'bg-[var(--surface)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink-2)]'
 }`}>
 <div className="flex items-center justify-between pb-3">
 <div className="flex items-center gap-2">
 <Music className="w-5 h-5 text-[var(--acc)]" />
 <h3 className="text-base font-bold font-display tracking-wider">
 {editingBand ? `Editar Banda: ${editingBand.nombre_banda}` :'Añadir Nueva Banda al CRM'}
 </h3>
 </div>
 <button 
 onClick={() => setIsAddEditModalOpen(false)}
 className="p-1 hover:bg-[var(--surface)]/80 rounded-[var(--r-s)] transition-colors"
 >
 <X className="w-5 h-5 text-[var(--ink-2)]" />
 </button>
 </div>

 <form onSubmit={handleSaveBand} className="space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 
 {/* Nombre de la Banda */}
 <div className="space-y-1 md:col-span-2">
 <div className="flex items-center justify-between">
 <label className="block text-[10px] font-sans text-[var(--ink-2)]">Nombre de la Banda / Artista *</label>
 <button
 type="button"
 onClick={handleAiLookup}
 disabled={isAiSearching || !formName.trim()}
 className="flex items-center gap-1.5 text-[10px] font-sans font-bold px-2.5 py-1 rounded-[var(--r-m)] bg-[var(--acc)]/10 hover:bg-[var(--acc)]/20 text-[var(--acc)] border-[var(--acc)]/30 transition-all disabled:opacity-50 cursor-pointer"
 >
 {isAiSearching ? (
 <>
 <Loader2 className="w-3 h-3 animate-spin text-[var(--acc)]" />
 <span>Buscando en la Web...</span>
 </>
 ) : (
 <>
 <Sparkles className="w-3 h-3 text-[var(--acc)]" />
 <span>Buscar con IA (Autorellenar)</span>
 </>
 )}
 </button>
 </div>
 <input
 type="text"
 required
 value={formName}
 onChange={(e) => setFormName(e.target.value)}
 placeholder="Ej: Pardiez, La Señora Tomasa, Tarraco Ska..."
 className="w-full bg-[var(--surface)] text-[var(--ink)] px-3 py-1.5 rounded-[var(--r-m)] text-xs font-sans focus:outline-none focus:ring-1 focus:ring-[var(--acc)]/50"
 />
 </div>

 {/* AI Proposal Overlay / Card */}
 {isAiSearching && (
 <div className="md:col-span-2 p-3 bg-[var(--surface)]/90 border-[var(--acc)]/30 rounded-[var(--r-m)] flex items-center gap-3 text-xs text-[var(--acc)] font-sans">
 <Loader2 className="w-4 h-4 animate-spin text-[var(--acc)]" />
 <span>Buscando datos de"{formName}" con IA en la web...</span>
 </div>
 )}

 {aiError && (
 <div className="md:col-span-2 p-3 bg-[var(--alert-soft)] rounded-[var(--r-m)] flex items-center justify-between text-xs text-[var(--ink-2)] font-sans">
 <span>⚠️ {aiError}</span>
 <button type="button" onClick={() => setAiError(null)} className="p-1 hover:bg-[var(--alert-soft)] rounded">
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 )}

 {aiProposal && (
 <div className="md:col-span-2 p-3.5 bg-[var(--bg)] border-[var(--acc)]/40 rounded-[var(--r-m)] space-y-3 text-xs font-sans">
 <div className="flex items-center justify-between border-b border-[var(--hair)]800 pb-2">
 <div className="flex items-center gap-1.5 text-[var(--acc)] font-bold">
 <Sparkles className="w-4 h-4" />
 <span>Propuesta de la IA (Revisa antes de confirmar):</span>
 </div>
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={handleApplyAllAiData}
 className="px-3 py-1 bg-[var(--acc)] text-[var(--on-acc)] font-bold rounded-[var(--r-s)] text-[10px] hover:bg-[var(--acc-soft)] transition-all cursor-pointer flex items-center gap-1 shadow"
 >
 <Check className="w-3.5 h-3.5" />
 <span>Aplicar Todo</span>
 </button>
 <button
 type="button"
 onClick={() => setAiProposal(null)}
 className="p-1 hover:bg-[var(--surface)] text-[var(--ink-2)] rounded-[var(--r-s)] transition-colors cursor-pointer"
 title="Descartar propuesta"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[var(--ink-2)]">
 {aiProposal.estilo_musical && (
 <div className="flex items-center justify-between bg-[var(--bg)]/70 p-2 rounded-[var(--r-s)] border-[var(--hair)]800">
 <div className="truncate pr-2"><span className="text-[var(--ink-2)] font-bold">Estilo:</span> {aiProposal.estilo_musical}</div>
 <button type="button" onClick={() => setFormStyle(aiProposal.estilo_musical)} className="text-[10px] font-bold text-[var(--acc)] hover:underline cursor-pointer shrink-0">Usar</button>
 </div>
 )}

 {aiProposal.localizacion && (
 <div className="flex items-center justify-between bg-[var(--bg)]/70 p-2 rounded-[var(--r-s)] border-[var(--hair)]800">
 <div className="truncate pr-2"><span className="text-[var(--ink-2)] font-bold">Origen:</span> {aiProposal.localizacion}</div>
 <button type="button" onClick={() => setFormLocation(aiProposal.localizacion)} className="text-[10px] font-bold text-[var(--acc)] hover:underline cursor-pointer shrink-0">Usar</button>
 </div>
 )}

 {aiProposal.contacto_nombre && (
 <div className="flex items-center justify-between bg-[var(--bg)]/70 p-2 rounded-[var(--r-s)] border-[var(--hair)]800">
 <div className="truncate pr-2"><span className="text-[var(--ink-2)] font-bold">Contacto:</span> {aiProposal.contacto_nombre}</div>
 <button type="button" onClick={() => setFormContactName(aiProposal.contacto_nombre)} className="text-[10px] font-bold text-[var(--acc)] hover:underline cursor-pointer shrink-0">Usar</button>
 </div>
 )}

 {aiProposal.email && (
 <div className="flex items-center justify-between bg-[var(--bg)]/70 p-2 rounded-[var(--r-s)] border-[var(--hair)]800">
 <div className="truncate pr-2"><span className="text-[var(--ink-2)] font-bold">Email:</span> {aiProposal.email}</div>
 <button type="button" onClick={() => setFormEmail(aiProposal.email)} className="text-[10px] font-bold text-[var(--acc)] hover:underline cursor-pointer shrink-0">Usar</button>
 </div>
 )}

 {aiProposal.telefono && (
 <div className="flex items-center justify-between bg-[var(--bg)]/70 p-2 rounded-[var(--r-s)] border-[var(--hair)]800">
 <div className="truncate pr-2"><span className="text-[var(--ink-2)] font-bold">Tel:</span> {aiProposal.telefono}</div>
 <button type="button" onClick={() => setFormPhone(aiProposal.telefono)} className="text-[10px] font-bold text-[var(--acc)] hover:underline cursor-pointer shrink-0">Usar</button>
 </div>
 )}

 {aiProposal.instagram && (
 <div className="flex items-center justify-between bg-[var(--bg)]/70 p-2 rounded-[var(--r-s)] border-[var(--hair)]800">
 <div className="truncate pr-2"><span className="text-[var(--ink-2)] font-bold">Instagram:</span> {aiProposal.instagram}</div>
 <button type="button" onClick={() => setFormInstagram(aiProposal.instagram)} className="text-[10px] font-bold text-[var(--acc)] hover:underline cursor-pointer shrink-0">Usar</button>
 </div>
 )}

 {(aiProposal.spotify_url || aiProposal.youtube_url) && (
 <div className="flex items-center justify-between bg-[var(--bg)]/70 p-2 rounded-[var(--r-s)] border-[var(--hair)]800 sm:col-span-2">
 <div className="truncate max-w-[80%]"><span className="text-[var(--ink-2)] font-bold">Música / Media:</span> {aiProposal.spotify_url || aiProposal.youtube_url}</div>
 <button type="button" onClick={() => setFormSpotifyYoutube(aiProposal.spotify_url || aiProposal.youtube_url)} className="text-[10px] font-bold text-[var(--acc)] hover:underline cursor-pointer shrink-0">Usar</button>
 </div>
 )}

 {aiProposal.biografia && (
 <div className="bg-[var(--bg)]/70 p-2 rounded-[var(--r-s)] border-[var(--hair)]800 sm:col-span-2 space-y-1">
 <div className="flex items-center justify-between">
 <span className="text-[var(--ink-2)] font-bold">Resumen / Bio:</span>
 <button type="button" onClick={() => setFormNotes(prev => prev ? `${prev}\n\n[Bio IA]: ${aiProposal.biografia}` : aiProposal.biografia)} className="text-[10px] font-bold text-[var(--acc)] hover:underline cursor-pointer shrink-0">Añadir a Notas</button>
 </div>
 <p className="text-[10px] text-[var(--ink-2)] italic leading-relaxed">{aiProposal.biografia}</p>
 </div>
 )}
 </div>
 </div>
 )}

 {/* Icono o Imagen / Logo de la Banda */}
 <div className="space-y-2 sm:col-span-2 p-3 bg-[var(--surface)]/60 rounded-[var(--r-m)]">
 <label className="block text-[10px] font-sans text-[var(--acc)] font-bold">
 Icono o Logo / Foto de la Banda
 </label>

 <div className="flex flex-wrap items-center gap-3">
 {/* Preview current avatar */}
 <div className="w-10 h-10 rounded-full bg-[var(--surface)]/80 flex items-center justify-center overflow-hidden shrink-0">
 {formImageUrl ? (
 <img src={formImageUrl} alt="Logo Banda" className="w-full h-full object-cover" />
 ) : (
 <span className="text-xl">{formIcon ||'🎸'}</span>
 )}
 </div>

 {/* Emoji preset selection */}
 <div className="flex-1 space-y-1">
 <span className="text-[10px] text-[var(--ink-2)] block font-sans">Seleccionar icono emoji:</span>
 <div className="flex flex-wrap gap-1">
 {['🎸','🎹','🥁','🎤','🎷','🎺','🎧','🪕','🎻','⚡','🔥','🌟','🎶'].map(emoji => (
 <button
 key={emoji}
 type="button"
 onClick={() => { setFormIcon(emoji); }}
 className={`w-7 h-7 rounded-[var(--r-s)] text-sm flex items-center justify-center transition-all cursor-pointer ${
 formIcon === emoji && !formImageUrl
 ?'bg-[var(--acc)]/20 border-[var(--acc)] text-[var(--ink)] scale-110'
 :'bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)]'
 }`}
 >
 {emoji}
 </button>
 ))}
 </div>
 </div>

 {/* Upload file button */}
 <div className="shrink-0 space-y-1">
 <span className="text-[10px] text-[var(--ink-2)] block font-sans">O subir logo (Supabase):</span>
 <label className="cursor-pointer px-2.5 py-1.5 bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 rounded-[var(--r-m)] text-[10px] font-sans text-[var(--ink)] flex items-center gap-1.5 transition-all active:scale-95">
 {isUploadingLogo ? (
 <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--acc)]" />
 ) : (
 <Upload className="w-3.5 h-3.5 text-[var(--acc)]" />
 )}
 <span>{isUploadingLogo ?'Subiendo...' :'Subir Imagen'}</span>
 <input
 type="file"
 accept="image/*"
 className="hidden"
 onChange={(e) => {
 const file = e.target.files?.[0];
 if (file) handleLogoUpload(file);
 }}
 />
 </label>
 {formImageUrl && (
 <button
 type="button"
 onClick={() => setFormImageUrl('')}
 className="text-[9px] text-[var(--alert)] hover:underline block text-center"
 >
 Quitar imagen
 </button>
 )}
 </div>
 </div>
 </div>

 {/* Estilo Musical */}
 <div className="space-y-1">
 <label className="block text-[10px] font-sans text-[var(--ink-2)]">Estilo Musical *</label>
 <input
 type="text"
 required
 value={formStyle}
 onChange={(e) => setFormStyle(e.target.value)}
 placeholder="Ej: Balkan Ska, Reggae, Punk, Mestizaje..."
 className="w-full bg-[var(--surface)] text-[var(--ink)] px-2 py-1 rounded-[var(--r-m)] text-[10px] font-sans focus:outline-none focus:-[var(--acc)]/50"
 />
 </div>

 {/* Localización / Ciudad */}
 <div className="space-y-1">
 <label className="block text-[10px] font-sans text-[var(--ink-2)]">Localización / Ciudad Principal *</label>
 <input
 type="text"
 required
 value={formLocation}
 onChange={(e) => setFormLocation(e.target.value)}
 placeholder="Ej: Barcelona, Madrid, Valencia, Sevilla..."
 className="w-full bg-[var(--surface)] text-[var(--ink)] px-2 py-1 rounded-[var(--r-m)] text-[10px] font-sans focus:outline-none focus:-[var(--acc)]/50"
 />
 </div>

 {/* Estado de la Relación */}
 <div className="space-y-1">
 <label className="block text-[10px] font-sans text-[var(--ink-2)]">Estado de la Relación</label>
 <select
 value={formStatus}
 onChange={(e) => setFormStatus(e.target.value as BandRelationshipStatus)}
 className="w-full bg-[var(--surface)] text-[var(--ink)] px-2 py-1 rounded-[var(--r-m)] text-[10px] font-sans focus:outline-none focus:-[var(--acc)]/50 cursor-pointer"
 >
 <option value="sin_contactar">📡 Sin Contactar</option>
 <option value="intercambio_propuesto">🔄 Intercambio Propuesto (Date Swap)</option>
 <option value="concierto_agendado">⚡ Concierto Agendado</option>
 <option value="colegas_aliados">🤝 Colegas / Aliados de Gira</option>
 <option value="pendiente_respuesta">⏳ Pendiente Respuesta</option>
 <option value="no_disponible">❌ No Disponible</option>
 </select>
 </div>

 {/* Persona de Contacto */}
 <div className="space-y-1">
 <label className="block text-[10px] font-sans text-[var(--ink-2)]">Persona de Contacto / Rol</label>
 <input
 type="text"
 value={formContactName}
 onChange={(e) => setFormContactName(e.target.value)}
 placeholder="Ej: Carlos (Mánager / Teclista)"
 className="w-full bg-[var(--surface)] text-[var(--ink)] px-2 py-1 rounded-[var(--r-m)] text-[10px] font-sans focus:outline-none focus:-[var(--acc)]/50"
 />
 </div>

 {/* Último Contacto */}
 <div className="space-y-1">
 <label className="block text-[10px] font-sans text-[var(--ink-2)]">Fecha de Último Contacto</label>
 <input
 type="date"
 value={formLastContact}
 onChange={(e) => setFormLastContact(e.target.value)}
 className="w-full bg-[var(--surface)] text-[var(--ink)] px-2 py-1 rounded-[var(--r-m)] text-[10px] font-sans focus:outline-none focus:-[var(--acc)]/50"
 />
 </div>

 {/* Email */}
 <div className="space-y-1">
 <label className="block text-[10px] font-sans text-[var(--ink-2)]">Email de Contacto / Booking</label>
 <input
 type="email"
 value={formEmail}
 onChange={(e) => setFormEmail(e.target.value)}
 placeholder="ejemplo@banda.com"
 className="w-full bg-[var(--surface)] text-[var(--ink)] px-2 py-1 rounded-[var(--r-m)] text-[10px] font-sans focus:outline-none focus:-[var(--acc)]/50"
 />
 </div>

 {/* Teléfono */}
 <div className="space-y-1">
 <label className="block text-[10px] font-sans text-[var(--ink-2)]">Teléfono / WhatsApp</label>
 <input
 type="text"
 value={formPhone}
 onChange={(e) => setFormPhone(e.target.value)}
 placeholder="+34 600 000 000"
 className="w-full bg-[var(--surface)] text-[var(--ink)] px-2 py-1 rounded-[var(--r-m)] text-[10px] font-sans focus:outline-none focus:-[var(--acc)]/50"
 />
 </div>

 {/* Instagram */}
 <div className="space-y-1">
 <label className="block text-[10px] font-sans text-[var(--ink-2)]">Instagram</label>
 <input
 type="text"
 value={formInstagram}
 onChange={(e) => setFormInstagram(e.target.value)}
 placeholder="@nombrebanda"
 className="w-full bg-[var(--surface)] text-[var(--ink)] px-2 py-1 rounded-[var(--r-m)] text-[10px] font-sans focus:outline-none focus:-[var(--acc)]/50"
 />
 </div>

 {/* Aforo habitual */}
 <div className="space-y-1">
 <label className="block text-[10px] font-sans text-[var(--ink-2)]">Aforo Promedio que Mueven</label>
 <input
 type="number"
 value={formAforo}
 onChange={(e) => setFormAforo(Number(e.target.value))}
 placeholder="300"
 className="w-full bg-[var(--surface)] text-[var(--ink)] px-2 py-1 rounded-[var(--r-m)] text-[10px] font-sans focus:outline-none focus:-[var(--acc)]/50"
 />
 </div>
 </div>

 {/* Enlace Spotify / YouTube */}
 <div className="space-y-1">
 <label className="block text-[10px] font-sans text-[var(--ink-2)]">Enlace Spotify / YouTube / Dossier</label>
 <input
 type="url"
 value={formSpotifyYoutube}
 onChange={(e) => setFormSpotifyYoutube(e.target.value)}
 placeholder="https://open.spotify.com/artist/..."
 className="w-full bg-[var(--surface)] text-[var(--ink)] px-2 py-1 rounded-[var(--r-m)] text-[10px] font-sans focus:outline-none focus:-[var(--acc)]/50"
 />
 </div>

 {/* Notas de Colaboración */}
 <div className="space-y-1">
 <label className="block text-[10px] font-sans text-[var(--ink-2)]">Notas de Colaboración / Salas propuestas / Intercambios</label>
 <textarea
 rows={3}
 value={formNotes}
 onChange={(e) => setFormNotes(e.target.value)}
 placeholder="Escribe notas relevantes para la colaboración (ej. Dispuestos a compartir fecha en Sala Apolo, proponen fecha en Noviembre)..."
 className="w-full bg-[var(--surface)] text-[var(--ink)] p-3 rounded-[var(--r-m)] text-[10px] font-sans leading-relaxed focus:outline-none focus:-[var(--acc)]/50"
 />
 </div>

 {/* Buttons */}
 <div className="flex items-center justify-end gap-3 pt-3">
 <button
 type="button"
 onClick={() => setIsAddEditModalOpen(false)}
 className="px-2 py-1 bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] font-sans text-[10px] rounded-[var(--r-m)] transition-colors cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className="px-2 py-1 bg-[var(--sunken)] hover:bg-[var(--ink-3)]/60 text-[var(--ink)] font-sans font-bold text-[10px] tracking-wider rounded-[var(--r-m)] transition-all cursor-pointer"
 >
 {editingBand ?'Guardar Cambios' :'Añadir Banda'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* 5. MODAL: DATE SWAP PITCH GENERATOR */}
 <BandPitchModal
 isOpen={isPitchModalOpen}
 onClose={() => setIsPitchModalOpen(false)}
 band={selectedPitchBand}
 isStitchLight={isStitchLight}
 activeCampaign={activeCampaign}
 proposedBakandeyaCity={proposedBakandeyaCity}
 setProposedBakandeyaCity={setProposedBakandeyaCity}
 proposedVenueBakandeya={proposedVenueBakandeya}
 setProposedVenueBakandeya={setProposedVenueBakandeya}
 proposedMonth={proposedMonth}
 setProposedMonth={setProposedMonth}
 generatePitchText={generatePitchText}
 customPitchText={customPitchText}
 />

 {/* 6. MODAL: TONE & COMMUNICATION STYLE SCRAPER */}
 <BandToneModal
 isOpen={isToneModalOpen}
 onClose={() => setIsToneModalOpen(false)}
 band={selectedToneBand}
 isStitchLight={isStitchLight}
 toneData={toneData}
 isLoading={isAnalyzingTone}
 onReAnalyze={() => selectedToneBand && handleAnalyzeTone(selectedToneBand)}
 onUseTailoredPitch={(tailoredText) => {
 setCustomPitchText(tailoredText);
 setSelectedPitchBand(selectedToneBand);
 setIsPitchModalOpen(true);
 }}
 />

 <AIBandScoutModal
 isOpen={isScoutModalOpen}
 onClose={() => setIsScoutModalOpen(false)}
 activeCampaign={activeCampaign}
 onAddBands={handleImportScoutedBands}
 isStitchLight={isStitchLight}
 />



 {/* Bulk Progress Modal */}
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

 </div>
 );
}
