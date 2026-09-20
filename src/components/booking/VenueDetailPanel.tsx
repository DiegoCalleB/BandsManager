import React, { useState, useEffect } from'react';
import { Lead, LeadStatus, LeadType, InteractionLog, Setlist } from'../../types';
import { LeadHealthBadge } from'./LeadHealthBadge';
import { VerifiedBadge } from'../common/VerifiedBadge';
import { LeadAvatar } from'./LeadAvatar';
import { ReliabilityBadge } from'../common/ReliabilityBadge';
import { FavoriteButton } from'../common/FavoriteButton';
import { isLeadVerificado } from'../../utils/leadReliability';
import DirectionsCard from'../DirectionsCard';
import { apiFetch } from'../../utils/api';
import { api } from'../../services/api';
import { MultiModelPitchComparatorModal } from'./MultiModelPitchComparatorModal';
import { BoloConfirmadoSetlistModal } from'./BoloConfirmadoSetlistModal';
import { formatFestivalDateRange, toIsoDateString } from'../../utils/festivalDateFormat';
import { HolidayDateWarning } from'../common/HolidayDateWarning';
import { PublicoSilhouette } from'../ui/PublicoSilhouette';
import {
 Edit3,
 X,
 Sparkles,
 MessageCircle,
 PhoneCall,
 Mail,
 CheckCircle2,
 History,
 Save,
 Trash2,
 ChevronDown,
 Send,
 AlertCircle,
 Copy,
 ExternalLink,
 Star,
 MessageSquare,
 RefreshCw,
 Loader2,
 Upload,
 Undo2,
 RotateCcw,
 Layers
} from'lucide-react';

interface VenueDetailPanelProps {
 selectedLead: Lead | null;
 onClose: () => void;
 onUpdateLead: (id: string, updates: Partial<Lead>) => void;
 onDeleteLead?: (id: string, name: string) => void;
 getStatusBadgeClass: (status: LeadStatus | string) => string;
 getStatusLabel: (status: LeadStatus | string) => string;
 getStatusDotColor: (status: LeadStatus | string) => string;
 normalizeStatus: (status: string) => LeadStatus;
 normalizeType: (type?: string) => string;
 autoDetectVenueAddress: (venueName: string, city: string) => string;
 sectionTab:'salas' |'medios' |'grupos';
 isStitchLight?: boolean;
 activeCampaign?: any;
 onLeadLogoUpload?: (file: File) => Promise<string | null> | void;
 isUploadingLeadLogo?: boolean;
}

export const VenueDetailPanel: React.FC<VenueDetailPanelProps> = ({
 selectedLead,
 onClose,
 onUpdateLead,
 onDeleteLead,
 getStatusBadgeClass,
 getStatusLabel,
 getStatusDotColor,
 normalizeStatus,
 normalizeType,
 autoDetectVenueAddress,
 sectionTab,
 isStitchLight = false,
 activeCampaign,
 onLeadLogoUpload,
 isUploadingLeadLogo = false
}) => {
 // Active Tab inside panel
 const [activeTab, setActiveTab] = useState<'info' |'emails' |'bitacora'>('info');

 // Edit Lead State
 const [isEditingLeadInfo, setIsEditingLeadInfo] = useState(false);
 const [editedLeadInfo, setEditedLeadInfo] = useState<Partial<Lead>>({ ...selectedLead });

 useEffect(() => {
 setEditedLeadInfo({ ...selectedLead });
 }, [selectedLead]);

 // Pitch Editing & Feedback State
 const [isEditingPitch, setIsEditingPitch] = useState(false);
 const [editedPitch, setEditedPitch] = useState(selectedLead?.pitch_generado ||'');
 const [toneRating, setToneRating] = useState<number>(0);
 const [contentRating, setContentRating] = useState<number>(0);
 const [feedbackComment, setFeedbackComment] = useState<string>('');
 const [feedbackScope, setFeedbackScope] = useState<'este_pitch' |'global'>('este_pitch');
 const [isRegeneratingPitch, setIsRegeneratingPitch] = useState(false);
 const [isRevertingPitch, setIsRevertingPitch] = useState(false);
 const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState<string | null>(null);
 const [showFeedbackHistory, setShowFeedbackHistory] = useState(false);
 const [showMultiModelModal, setShowMultiModelModal] = useState(false);
 const [selectedAiModel, setSelectedAiModel] = useState<'gemini' |'deepseek'>('gemini');

 // Bolo Confirmado -> Setlist Optimization Modal
 const [showBoloConfirmadoModal, setShowBoloConfirmadoModal] = useState(false);
 const [feedbackBoloMsg, setFeedbackBoloMsg] = useState<string | null>(null);

 // Bitácora state
 const [interactionType, setInteractionType] = useState<InteractionLog['tipo']>('Llamada');
 const [interactionAutor, setInteractionAutor] = useState('Mánager / Booking');
 const [interactionNotes, setInteractionNotes] = useState('');
 const [interactionResultado, setInteractionResultado] = useState<InteractionLog['resultado']>('Interesado');

 // Quick Copy status
 const [copiedPitch, setCopiedPitch] = useState(false);
 const [isSearchingLogo, setIsSearchingLogo] = useState(false);
 const [isEnrichingLead, setIsEnrichingLead] = useState(false);
 const [enrichStatusMsg, setEnrichStatusMsg] = useState<string | null>(null);
 const [isCreatingDraft, setIsCreatingDraft] = useState(false);
 const [draftError, setDraftError] = useState<string | null>(null);
 const [isExtractingDates, setIsExtractingDates] = useState(false);

 const handleAutoExtractFestivalDates = async () => {
 if (!selectedLead) return;
 try {
 setIsExtractingDates(true);
 const res: any = await apiFetch('/api/leads/enrich-lead', {
 method:'POST',
 body: JSON.stringify({ leadId: selectedLead.id, force: true })
 });
 if (res?.lead) {
 if (res.lead.festival_start_date) {
 setEditedLeadInfo(prev => ({
 ...prev,
 festival_start_date: res.lead.festival_start_date,
 festival_end_date: res.lead.festival_end_date || res.lead.festival_start_date
 }));
 }
 if (onUpdateLead) {
 onUpdateLead(selectedLead.id, res.lead);
 }
 }
 } catch (err: any) {
 console.warn('Error enriqueciendo fechas:', err);
 } finally {
 setIsExtractingDates(false);
 }
 };

 // Historial real de conversación (lead_messages, escrito por el Enviador/Lector) - independiente
 // de selectedLead.hilo_emails, que solo lo rellena el sync manual de Gmail del cliente. Sin esto,
 // los pitches enviados de verdad y las respuestas detectadas automáticamente nunca aparecían aquí.
 const [leadMessages, setLeadMessages] = useState<Array<{ id: string; remitente:'banda' |'sala'; remitente_nombre: string; asunto: string; mensaje: string; fecha: string }>>([]);

 useEffect(() => {
 if (!selectedLead?.id) { setLeadMessages([]); return; }
 let isMounted = true;
 api.getLeadMessages(selectedLead.id)
 .then((res) => { if (isMounted) setLeadMessages(res?.messages || []); })
 .catch(() => { if (isMounted) setLeadMessages([]); });
 return () => { isMounted = false; };
 }, [selectedLead?.id]);

 // Une el hilo manual (hilo_emails) con el real (lead_messages), sin duplicar por asunto+fecha
 // aproximada, y ordenado cronológicamente - una banda puede tener las dos fuentes a la vez si
 // sincronizó Gmail a mano alguna vez además de dejar que los agentes trabajen.
 const hiloCompleto = React.useMemo(() => {
 const manual = (selectedLead?.hilo_emails || []).map((m: any) => ({ ...m, _origen:'manual' as const }));
 const real = leadMessages.map((m) => ({ ...m, _origen:'real' as const }));
 const todos = [...real, ...manual].filter((m, idx, arr) =>
 arr.findIndex((o) => o.mensaje === m.mensaje && o.remitente === m.remitente) === idx
 );
 return todos.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
 }, [selectedLead?.hilo_emails, leadMessages]);

 // Clean helper for values like #ERROR!
 const cleanVal = (val?: string) => {
 if (!val || val.includes('#ERROR!') || val.includes('#N/A') || val.includes('#VALUE!')) return'';
 return val;
 };

 // Sync state when selected lead changes or pitch updates
 useEffect(() => {
 if (!selectedLead) return;
 setEditedPitch(selectedLead.pitch_generado ||'');
 setEditedLeadInfo({
 ...selectedLead,
 telefono: cleanVal(selectedLead.telefono),
 contacto_nombre: cleanVal(selectedLead.contacto_nombre),
 email_contacto: cleanVal(selectedLead.email_contacto),
 direccion: cleanVal(selectedLead.direccion),
 });
 }, [selectedLead?.id, selectedLead?.pitch_generado, selectedLead?.imagen_url, selectedLead?.icono]);

 // Los hooks de arriba tienen que ejecutarse siempre en el mismo orden (ver
 // react-hooks/rules-of-hooks): este guard vivía ANTES de ellos, así que abrir el panel con
 // una sala nueva cambiaba cuántos hooks se ejecutaban entre un render y el siguiente.
 if (!selectedLead) return null;

 const handleRegeneratePitchWithFeedback = async (targetProvider?:'gemini' |'deepseek') => {
 setIsRegeneratingPitch(true);
 setFeedbackSuccessMsg(null);
 const providerToUse = targetProvider || selectedAiModel;
 try {
 const token = localStorage.getItem('bakandeya_token') || localStorage.getItem('token') ||'';
 const headers: Record<string, string> = {'Content-Type':'application/json'
 };
 if (token) {
 headers['Authorization'] = `Bearer ${token}`;
 headers['x-auth-token'] = token;
 }
 // En etapa de respuesta usa el endpoint del Contestador (prompt con el mensaje entrante
 // real y el hilo) en vez del de pitch inicial - antes ambos casos llamaban al mismo
 // endpoint de pitch, perdiendo el contexto de a qué estaba respondiendo la banda.
 const endpoint = isReplyStage
 ? `/api/leads/${selectedLead.id}/regenerate-reply`
 : `/api/leads/${selectedLead.id}/regenerate-pitch`;
 const res = await fetch(endpoint, {
 method:'POST',
 headers,
 body: JSON.stringify({
 tono_rating: toneRating || undefined,
 contenido_rating: contentRating || undefined,
 comentario: feedbackComment || undefined,
 alcance: feedbackScope,
 provider: providerToUse,
 activeCampaign
 })
 });

 const data = await res.json().catch(() => ({ success: false, error:'Respuesta inválida del servidor' }));
 if (res.ok && data.success && data.newPitchText) {
 setEditedPitch(data.newPitchText);
 setIsEditingPitch(false);
 selectedLead.pitch_generado = data.newPitchText;
 const updatedHistory = data.feedbackLog 
 ? [data.feedbackLog, ...(selectedLead.historial_feedback_pitch || [])]
 : (selectedLead.historial_feedback_pitch || []);
 selectedLead.historial_feedback_pitch = updatedHistory;

 onUpdateLead(selectedLead.id, {
 pitch_generado: data.newPitchText,
 historial_feedback_pitch: updatedHistory
 });

 // Reset feedback form after successful save & regenerate
 setToneRating(0);
 setContentRating(0);
 setFeedbackComment('');
 const modelLabel = providerToUse ==='deepseek' ?'DeepSeek V3' :'Gemini 3.7 Flash';
 if (feedbackScope ==='global') {
 setFeedbackSuccessMsg(`¡Pitch reescrito con ${modelLabel}! Aprendizaje guardado en la memoria global.`);
 } else {
 setFeedbackSuccessMsg(`¡Pitch reescrito con ${modelLabel} aplicando tus notas a esta sala!`);
 }
 setTimeout(() => setFeedbackSuccessMsg(null), 4500);
 } else {
 alert(data.error ||'No se pudo regenerar el pitch.');
 }
 } catch (err: any) {
 console.error('Error al regenerar pitch:', err);
 alert(`Error de conexión al reescribir el pitch con IA: ${err.message ||'Verifica la conexión'}`);
 } finally {
 setIsRegeneratingPitch(false);
 }
 };

 const handleRevertPitch = async (targetLogId?: string) => {
 if (!selectedLead) return;
 setIsRevertingPitch(true);
 try {
 const token = localStorage.getItem('bakandeya_token') || localStorage.getItem('token') ||'';
 const headers: Record<string, string> = {'Content-Type':'application/json'
 };
 if (token) {
 headers['Authorization'] = `Bearer ${token}`;
 headers['x-auth-token'] = token;
 }
 const res = await fetch(`/api/leads/${selectedLead.id}/revert-pitch`, {
 method:'POST',
 headers,
 body: JSON.stringify({ logId: targetLogId })
 });

 const data = await res.json().catch(() => ({ success: false, error:'Respuesta inválida del servidor' }));
 if (res.ok && data.success && data.restoredPitch !== undefined) {
 const restored = data.restoredPitch;
 setEditedPitch(restored);
 setIsEditingPitch(false);
 selectedLead.pitch_generado = restored;

 const updatedHistory = (selectedLead.historial_feedback_pitch || []).map((item) => {
 if (item.id === (data.revertedLogId || targetLogId || (selectedLead.historial_feedback_pitch?.[0]?.id))) {
 return { ...item, deshecho: true };
 }
 return item;
 });
 selectedLead.historial_feedback_pitch = updatedHistory;

 onUpdateLead(selectedLead.id, {
 pitch_generado: restored,
 historial_feedback_pitch: updatedHistory
 });

 setFeedbackSuccessMsg('↩️ Entrenamiento deshecho: Se ha restaurado el pitch anterior.');
 setTimeout(() => setFeedbackSuccessMsg(null), 5000);
 } else {
 alert(data.error ||'No se pudo restaurar el pitch anterior.');
 }
 } catch (err) {
 console.error('Error al deshacer entrenamiento del pitch:', err);
 alert('Error de conexión al restaurar el pitch anterior.');
 } finally {
 setIsRevertingPitch(false);
 }
 };

 const handleEnrichLead = async () => {
 if (!selectedLead?.id) return;
 setIsEnrichingLead(true);
 setEnrichStatusMsg('Investigando y completando datos oficiales sin inventar...');
 try {
 const res = await apiFetch('/api/leads/enrich-lead', {
 method:'POST',
 body: JSON.stringify({
 leadId: selectedLead.id,
 force: true
 })
 });
 if (res.success && res.lead) {
 onUpdateLead(selectedLead.id, res.lead);
 setEditedLeadInfo(res.lead);
 setEnrichStatusMsg('✨ ¡Datos completados y verificados con éxito!');
 setTimeout(() => setEnrichStatusMsg(null), 4000);
 } else {
 setEnrichStatusMsg(res.error ||'No se encontraron datos nuevos verificables.');
 setTimeout(() => setEnrichStatusMsg(null), 4000);
 }
 } catch (err: any) {
 console.error('Error enriqueciendo lead:', err);
 setEnrichStatusMsg(err.message ||'Error al completar datos.');
 setTimeout(() => setEnrichStatusMsg(null), 4000);
 } finally {
 setIsEnrichingLead(false);
 }
 };

 const handleAutoSearchLogo = async () => {
 const venueName = (editedLeadInfo.nombre_sala || selectedLead.nombre_sala ||'').trim();
 if (!venueName) return;
 setIsSearchingLogo(true);
 try {
 const res = await apiFetch('/api/leads/ai-lookup', {
 method:'POST',
 body: JSON.stringify({
 nombre_sala: venueName,
 ciudad: editedLeadInfo.ciudad || selectedLead.ciudad,
 leadId: selectedLead.id
 })
 });
 if (res.success && res.data) {
 setEditedLeadInfo(prev => ({
 ...prev,
 imagen_url: res.data.imagen_url || prev.imagen_url,
 icono: res.data.icono || prev.icono,
 website: res.data.website || prev.website,
 instagram: res.data.instagram || prev.instagram
 }));
 if (res.data.imagen_url) {
 onUpdateLead(selectedLead.id, {
 imagen_url: res.data.imagen_url,
 icono: res.data.icono || editedLeadInfo.icono,
 website: res.data.website || editedLeadInfo.website
 });
 }
 }
 } catch (err) {
 console.error('Error auto-searching logo:', err);
 } finally {
 setIsSearchingLogo(false);
 }
 };

 // Sync edits when lead changes
 const handleStartEdit = () => {
 setEditedLeadInfo({ ...selectedLead });
 setIsEditingLeadInfo(true);
 };

 const handleSaveLeadInfo = () => {
 if (!editedLeadInfo.nombre_sala) return;
 onUpdateLead(selectedLead.id, editedLeadInfo);
 setIsEditingLeadInfo(false);
 };

 const handleCorrectStatus = (newStatus: LeadStatus) => {
 if (newStatus ==='confirmado') {
 setShowBoloConfirmadoModal(true);
 return;
 }
 onUpdateLead(selectedLead.id, { estado: newStatus });
 };

 const handleConfirmWithSetlist = async (data: {
 concertDate: string;
 cacheAmount?: number;
 setlistId: string;
 newSetlist?: Setlist;
 }) => {
 try {
 // 1. Si se generó un nuevo setlist automático a medida, guardarlo
 if (data.newSetlist) {
 await apiFetch('/api/setlists', {
 method:'POST',
 body: JSON.stringify(data.newSetlist)
 }).catch(err => console.warn('Error guardando setlist generado:', err));
 }

 // 2. Crear el concierto en el calendario con la vinculación al setlist y al bolo
 const isFestival = selectedLead.tipo ==='festival' || selectedLead.tipo ==='ayuntamiento';
 const newConcert = {
 id: `concert-crm-${selectedLead.id}-${Date.now()}`,
 fecha: data.concertDate,
 ciudad: selectedLead.ciudad ||'Ciudad por definir',
 sala: selectedLead.nombre_sala,
 direccion: selectedLead.direccion ||'',
 cache: data.cacheAmount || 0,
 aforo_vendido: 0,
 aforo_total: selectedLead.aforo || 0,
 contrato_firmado: true,
 estado_pago:'pendiente',
 notas: `Bolo confirmado desde el CRM. Lead: ${selectedLead.nombre_sala}`,
 tipo: isFestival ?'festival' :'sala',
 setlistId: data.setlistId
 };

 await apiFetch('/api/concerts', {
 method:'POST',
 body: JSON.stringify(newConcert)
 }).catch(err => console.warn('Error creando concierto:', err));

 // 3. Actualizar estado del lead en Supabase
 onUpdateLead(selectedLead.id, { estado:'confirmado' });
 setShowBoloConfirmadoModal(false);
 setFeedbackBoloMsg('🎉 ¡Bolo confirmado y repertorio asignado en el calendario!');
 setTimeout(() => setFeedbackBoloMsg(null), 5000);
 } catch (err) {
 console.error('Error al confirmar bolo con setlist:', err);
 onUpdateLead(selectedLead.id, { estado:'confirmado' });
 setShowBoloConfirmadoModal(false);
 }
 };

 const handleConfirmWithoutSetlist = () => {
 onUpdateLead(selectedLead.id, { estado:'confirmado' });
 setShowBoloConfirmadoModal(false);
 setFeedbackBoloMsg('🎉 Concierto marcado como confirmado en el CRM.');
 setTimeout(() => setFeedbackBoloMsg(null), 4000);
 };

 // hiloCompleto (lead_messages real + hilo_emails manual) es la señal fiable de que ya hubo
 // conversación con la sala - antes solo se miraba hilo_emails (el campo legado que solo rellena
 // el sync manual de Gmail) y el estado, así que un lead cuya respuesta el Lector auto-redactó
 // (estado'pendiente_aprobacion', ver server/services/lectorAgent.ts) dejaba de detectarse como
 //"en fase de respuesta" y el botón"Aprobar" mandaba aprobado_propuesta en vez de
 // aprobado_respuesta, haciendo que el Enviador lo tratase como pitch nuevo (asunto sin"Re:",
 // vuelta a'contactado' en vez de'negociando').
 const isReplyStage = hiloCompleto.length > 0 || selectedLead.estado ==='respondido' || selectedLead.estado ==='negociando';

 // Al aprobar se dispara el Agente Enviador en el servidor para este lead concreto
 // (POST /api/trigger-agent, el mismo endpoint que usa el scheduler) en vez de crear el
 // borrador desde el navegador: el servidor ya sabe elegir entre la API de Gmail por OAuth
 // (sin contraseña, sin popup - ver server/services/gmailApiClient.ts) y el camino IMAP con
 // contraseña de aplicación para Outlook (server/services/agentEngine.ts). Así el botón
 //"Aprobar" y el Agente Enviador programado comparten una sola implementación, sin duplicar
 // lógica ni depender de Firebase/popup en el cliente. Si falla (sin email de contacto, sin
 // ninguna cuenta conectada...), el lead cae de todos modos en el estado de aprobado clásico
 // para no perder la aprobación humana.
 const createDraftAndApprove = async (pitchText: string, alsoSavePitch: boolean) => {
 const approvalState = isReplyStage ?'aprobado_respuesta' :'aprobado_propuesta';

 setIsCreatingDraft(true);
 setDraftError(null);

 // El Enviador (server/services/agentEngine.ts), cuando se dispara para un lead concreto como
 // aquí, lo busca por id SIN filtrar por estado - decide si es respuesta (asunto"Re:",
 // pasa a'negociando' al enviar) mirando lead.estado ==='aprobado_respuesta' en Supabase EN
 // ESE MOMENTO. Antes esto solo se guardaba si la petición fallaba, así que en el camino
 // normal el Enviador seguía viendo el estado anterior (p.ej.'pendiente_aprobacion') y
 // trataba cualquier respuesta aprobada como si fuera un pitch nuevo. Hace falta escribirlo
 // (y esperar a que el PATCH llegue a Supabase) ANTES de disparar el agente.
 const updates: Partial<Lead> = { estado: approvalState };
 if (alsoSavePitch) updates.pitch_generado = pitchText;
 await onUpdateLead(selectedLead.id, updates);

 let draftError ='';
 try {
 const data = await apiFetch('/api/trigger-agent', {
 method:'POST',
 body: JSON.stringify({
 agentName:'enviador',
 params: { id: selectedLead.id, trigger_type:'usuario_manual' }
 })
 });

 const leadResult = Array.isArray(data.results) ? data.results.find((r: any) => r.id === selectedLead.id) : null;
 if (leadResult?.status ==='borrador' || leadResult?.status ==='enviado') {
 onUpdateLead(selectedLead.id, { estado:'borrador_creado' });
 } else {
 draftError = leadResult?.error || data.message ||'No se pudo crear el borrador.';
 }
 } catch (err: any) {
 console.error('Error aprobando lead:', err);
 draftError = err.message ||'Error al aprobar el lead.';
 }

 if (draftError) {
 // El estado ya quedó en approvalState (guardado arriba) - el mánager puede reintentar la
 // aprobación sin perderla.
 setDraftError(draftError);
 }

 setIsCreatingDraft(false);
 };

 const handleSavePitch = () => {
 setIsEditingPitch(false);
 void createDraftAndApprove(editedPitch, true);
 };

 const handleApprovePitchDirectly = () => {
 void createDraftAndApprove(selectedLead.pitch_generado ||'', false);
 };

 const handleAddInteractionLog = (e: React.FormEvent) => {
 e.preventDefault();
 if (!interactionNotes.trim()) return;

 const nowStr = new Date().toISOString().replace('T','').slice(0, 16);
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
 if (interactionResultado ==='Interesado') {
 newStatus ='negociando';
 } else if (interactionResultado ==='Acuerdo cerrado') {
 newStatus ='confirmado';
 } else if (interactionResultado ==='Rechazado') {
 newStatus ='no_interesado';
 }

 onUpdateLead(selectedLead.id, {
 historial_contacto: updatedLogs,
 estado: newStatus,
 fecha_ultima_respuesta: new Date().toISOString().slice(0, 10)
 });

 setInteractionNotes('');
 };

 const handleDeleteInteractionLog = (logId: string) => {
 if (!selectedLead.historial_contacto) return;
 const updated = selectedLead.historial_contacto.filter((l) => l.id !== logId);
 onUpdateLead(selectedLead.id, { historial_contacto: updated });
 };

 const handleCopyPitch = () => {
 if (selectedLead.pitch_generado) {
 navigator.clipboard.writeText(selectedLead.pitch_generado);
 setCopiedPitch(true);
 setTimeout(() => setCopiedPitch(false), 2000);
 }
 };

 const phoneClean = selectedLead.telefono ? selectedLead.telefono.replace(/\D/g,'') :'';

 return (
 <div className="w-full space-y-5 relative">
 {/* Feedback Alert for Bolo Confirmado */}
 {feedbackBoloMsg && (
 <div className="p-3.5 rounded-[var(--r-l)] bg-emerald-500/20 text-[var(--ink-2)] font-mono text-xs font-bold flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
 <div className="flex items-center gap-2">
 <Sparkles className="w-4 h-4 text-emerald-400" />
 <span>{feedbackBoloMsg}</span>
 </div>
 <button
 onClick={() => setFeedbackBoloMsg(null)}
 className="text-emerald-400 hover:text-[var(--ink)] cursor-pointer"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 )}

 {/* HEADER CARD */}
 <div className="bg-[var(--sunken)] rounded-[var(--r-l)] p-4 sm:p-5 border-[var(--hair)]800 shadow-xl space-y-4">
 {/* Title Bar */}
 <div className="flex justify-between items-start gap-2">
 <div className="flex items-center gap-3">
 <LeadAvatar
 lead={selectedLead}
 size="lg"
 showCameraHover={false}
 />
 <div>
 <div className="flex items-center gap-2">
 <h3 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[var(--ink)] notranslate" translate="no">
 {selectedLead.nombre_sala}
 </h3>
 <VerifiedBadge isVerified={isLeadVerificado(selectedLead)} size="md" showLabel={true} />
 </div>
 <p className="text-xs sm:text-sm font-sans mt-0.5 text-[var(--ink-2)]">
 {selectedLead.ciudad} • {selectedLead.genero ||'Variado'} •{''}
 {selectedLead.roster
 ? `Róster: ${selectedLead.roster}`
 : (['agencia','manager','productora','sello'].includes(String(selectedLead.tipo ||'').toLowerCase())
 ?'Agencia de Booking'
 : (selectedLead.aforo ? `${selectedLead.aforo} pax` :'Aforo n/d'))}
 </p>
 {selectedLead.festival_start_date && selectedLead.festival_end_date && (
 <div className="space-y-1 mt-1">
 <p className="text-xs sm:text-sm font-sans text-[var(--acc)] flex items-center gap-1.5">
 <span className="text-lg">🎪</span>
 <span className="font-semibold">Festival/Evento:</span>
 <span>{formatFestivalDateRange(selectedLead.festival_start_date, selectedLead.festival_end_date)}</span>
 </p>
 <HolidayDateWarning date={selectedLead.festival_start_date} city={selectedLead.ciudad} compact />
 </div>
 )}
 </div>
 </div>

 <div className="flex items-center gap-1.5">
 <FavoriteButton 
 isFavorite={!!selectedLead.es_favorito}
 onToggle={(newVal) => onUpdateLead(selectedLead.id, { es_favorito: newVal })}
 size="md"
 />
 <button
 onClick={handleStartEdit}
 className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors cursor-pointer"
 title="Editar ficha completa"
 >
 <Edit3 className="w-4 h-4" />
 </button>
 {onDeleteLead && (
 <button
 onClick={() => onDeleteLead(selectedLead.id, selectedLead.nombre_sala)}
 className="p-2 rounded-[var(--r-m)] bg-[var(--alert-soft)] hover:bg-[var(--alert-soft)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors cursor-pointer"
 title="Eliminar y guardar en lista negra"
 >
 <Trash2 className="w-4 h-4 text-rose-400" />
 </button>
 )}
 <button
 onClick={onClose}
 className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors cursor-pointer"
 title="Cerrar panel"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 </div>

 {/* Lead Health / Temperature Badge & Quality Indicator & Category Selector */}
 <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--hair)]800/80">
 <div className="flex flex-wrap items-center gap-2">
 <LeadHealthBadge lead={selectedLead} showDescription={true} size="md" />
 <ReliabilityBadge item={selectedLead} size="md" />
 </div>

 <div className="flex flex-wrap items-center gap-2">
 {/* Category / Type Recategorizer */}
 <div className="flex items-center gap-1.5 bg-[var(--bg)] px-2.5 py-1 rounded-[var(--r-m)]">
 <span className="text-[10px] text-[var(--acc)] font-mono font-bold uppercase">Tipo:</span>
 <select
 value={String(selectedLead.tipo ||'sala').toLowerCase()}
 onChange={(e) => {
 const newType = e.target.value as LeadType;
 onUpdateLead(selectedLead.id, { tipo: newType });
 }}
 className="text-xs font-sans font-bold text-[var(--acc)]/70 bg-transparent cursor-pointer focus:outline-none"
 title="Cambiar categoría / tipo de este lead"
 >
 <option value="sala" className="bg-[var(--bg)] text-[var(--ink)]">🏟️ Sala de Conciertos</option>
 <option value="festival" className="bg-[var(--bg)] text-[var(--ink)]">🎪 Festival</option>
 <option value="ayuntamiento" className="bg-[var(--bg)] text-[var(--ink)]">🏛️ Ayuntamiento / Fiestas</option>
 <option value="discoteca" className="bg-[var(--bg)] text-[var(--ink)]">🪩 Discoteca / Club</option>
 <option value="grupo" className="bg-[var(--bg)] text-[var(--ink)]">🎸 Grupo / Banda Aliada</option>
 <option value="agencia" className="bg-[var(--bg)] text-[var(--ink)]">💼 Agencia de Booking</option>
 <option value="manager" className="bg-[var(--bg)] text-[var(--ink)]">👔 Manager / Representante</option>
 <option value="productora" className="bg-[var(--bg)] text-[var(--ink)]">🎬 Productora de Eventos</option>
 <option value="sello" className="bg-[var(--bg)] text-[var(--ink)]">💿 Discográfica / Sello</option>
 <option value="medio" className="bg-[var(--bg)] text-[var(--ink)]">📻 Medio / Prensa / Radio</option>
 </select>
 </div>

 {/* Status selector */}
 <div className="flex items-center gap-1.5 bg-[var(--bg)] px-2.5 py-1 rounded-[var(--r-m)] border-[var(--hair)]800">
 <span className={`w-2 h-2 rounded-full ${getStatusDotColor(selectedLead.estado)}`} />
 <select
 value={normalizeStatus(selectedLead.estado)}
 onChange={(e) => handleCorrectStatus(e.target.value as LeadStatus)}
 className="text-xs font-sans font-bold text-[var(--ink)] bg-transparent cursor-pointer focus:outline-none"
 >
 <option value="nuevo" className="bg-[var(--bg)]">
 Por contactar (nuevo)
 </option>
 <option value="esperando_respuesta" className="bg-[var(--bg)]">
 Contactado (esperando respuesta)
 </option>
 <option value="respondido" className="bg-[var(--bg)]">
 En conversación (ha respondido)
 </option>
 <option value="negociando" className="bg-[var(--bg)]">
 En negociación
 </option>
 <option value="confirmado" className="bg-[var(--bg)]">
 Concierto confirmado 🎉
 </option>
 <option value="aplazado" className="bg-[var(--bg)]">
 Aplazado (recontactar luego) ⏳
 </option>
 <option value="no_interesado" className="bg-[var(--bg)]">
 Descartado / No interesado
 </option>
 </select>
 </div>
 </div>
 </div>

 {/* Quick Action Bar for Booking Manager */}
 <div className="grid grid-cols-2 gap-2 pt-1">
 {phoneClean ? (
 <a
 href={`https://wa.me/${phoneClean}`}
 target="_blank"
 rel="noreferrer"
 className="py-2.5 px-3 bg-[var(--ok-soft)] hover:bg-[var(--ok-soft)] text-[var(--ink-2)] rounded-[var(--r-m)] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
 >
 <MessageCircle className="w-4 h-4 text-emerald-400" />
 <span>WhatsApp Directo</span>
 </a>
 ) : null}

 {selectedLead.telefono ? (
 <a
 href={`tel:${selectedLead.telefono}`}
 className="py-2.5 px-3 bg-sky-950/90 hover:bg-sky-900 text-sky-300 rounded-[var(--r-m)] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
 >
 <PhoneCall className="w-4 h-4 text-sky-400" />
 <span>Llamar por Tel</span>
 </a>
 ) : null}
 </div>

 {/* Agent Workflow & Sub-status Banner (Option A 2-Dimensional Model) */}
 {(() => {
 const rawStatus = String(selectedLead.estado ||'');
 const isPending = rawStatus ==='pendiente_aprobacion' || (rawStatus ==='nuevo' && !!selectedLead.pitch_generado && !selectedLead.fecha_envio);
 const isDraftCreated = rawStatus ==='borrador_creado';
 const isApproved = rawStatus.startsWith('aprobado');
 const isSent = normalizeStatus(rawStatus) ==='esperando_respuesta';

 if (isPending) {
 return (
 <div className="p-3 bg-[var(--acc)]/10 rounded-[var(--r-m)] flex items-center justify-between gap-2.5">
 <div className="flex items-center gap-2.5 min-w-0">
 <div className="w-8 h-8 rounded-[var(--r-s)] bg-[var(--acc)]/20 flex items-center justify-center shrink-0">
 <Sparkles className="w-4 h-4 text-[var(--acc)]" />
 </div>
 <div className="min-w-0">
 <p className="text-xs font-bold text-[var(--acc)]/70">
 {isReplyStage ?'💬 Respuesta redactada por IA — Pendiente de aprobación' :'✉️ Pitch inicial redactado por IA — Pendiente de aprobación'}
 </p>
 <p className="text-[10px] text-[var(--ink-2)] truncate">
 {isReplyStage ?'Revisa el borrador para responder a la sala y autorizar su envío.' :'Revisa la propuesta inicial para autorizar al agente de envíos.'}
 </p>
 </div>
 </div>
 <button
 type="button"
 onClick={handleApprovePitchDirectly}
 disabled={isCreatingDraft}
 className="px-3 py-1.5 bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--acc-ink)] font-bold text-xs rounded-[var(--r-s)] shrink-0 flex items-center gap-1 cursor-pointer shadow-sm disabled:opacity-50"
 >
 {isCreatingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
 <span>{isCreatingDraft ?'Creando borrador...' :'Aprobar'}</span>
 </button>
 </div>
 );
 }

 if (isDraftCreated) {
 return (
 <div className="p-2.5 bg-cyan-500/10 rounded-[var(--r-m)] flex items-center gap-2.5">
 <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0 ml-1" />
 <div className="min-w-0">
 <p className="text-xs font-bold text-cyan-300">
 📝 Borrador creado en tu Gmail
 </p>
 <p className="text-[10px] text-[var(--ink-2)]">
 Revísalo en tu bandeja de borradores y envíalo cuando quieras — no se ha enviado nada automáticamente.
 </p>
 </div>
 </div>
 );
 }

 if (isApproved) {
 return (
 <div className="p-2.5 bg-emerald-500/10 rounded-[var(--r-m)] flex items-center justify-between gap-2.5">
 <div className="flex items-center gap-2.5 min-w-0">
 <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0 ml-1" />
 <div className="min-w-0">
 <p className="text-xs font-bold text-[var(--ink-2)]">
 🚀 {rawStatus ==='aprobado_respuesta' ?'Respuesta Aprobada' :'Propuesta Aprobada'} — En cola del Agente Enviador
 </p>
 <p className="text-[10px] text-[var(--ink-2)]">
 {draftError
 ? `No se pudo crear el borrador en Gmail (${draftError}). El lead quedó en cola para el Agente Enviador por email.`
 :'El agente despachará este correo respetando las normas de envío y rate-limiting.'}
 </p>
 </div>
 </div>
 <button
 type="button"
 disabled={isCreatingDraft}
 onClick={async () => {
 setIsCreatingDraft(true);
 setDraftError(null);
 try {
 const data = await apiFetch('/api/trigger-agent', {
 method:'POST',
 body: JSON.stringify({
 agentName:'enviador',
 params: { id: selectedLead.id, trigger_type:'usuario_manual' }
 })
 });
 const leadResult = Array.isArray(data.results) ? data.results.find((r: any) => r.id === selectedLead.id) : null;
 if (leadResult?.status ==='borrador' || leadResult?.status ==='enviado') {
 onUpdateLead(selectedLead.id, { estado: leadResult?.status ==='enviado' ? (leadResult?.estado_nuevo ||'contactado') :'borrador_creado' });
 } else if (leadResult?.error || data.message) {
 setDraftError(leadResult?.error || data.message);
 }
 } catch (err: any) {
 setDraftError(err.message ||'Error al despachar el correo.');
 } finally {
 setIsCreatingDraft(false);
 }
 }}
 className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-[var(--r-s)] shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
 title="Forzar el despacho inmediato de este correo por el Agente Enviador"
 >
 {isCreatingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
 <span>{isCreatingDraft ?'Enviando...' :'Despachar Ahora'}</span>
 </button>
 </div>
 );
 }

 if (isSent) {
 return (
 <div className="p-2 bg-sky-500/10 rounded-[var(--r-m)] flex items-center gap-2 text-xs text-sky-300">
 <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0 ml-1" />
 <span className="text-[11px] font-medium">
 📬 Email enviado el {selectedLead.fecha_envio ||'recientemente'} • Agente a la espera de respuesta de la sala
 </span>
 </div>
 );
 }

 return null;
 })()}
 </div>

 {/* CONTACT & LOCATION CARD */}
 <div className="bg-[var(--sunken)] rounded-[var(--r-m)] p-4 space-y-2.5 border-[var(--hair)]800">
 <div className="flex items-center justify-between">
 <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-[var(--ink-2)]">
 Ficha de Contacto & Ubicación
 </p>
 <div className="flex items-center gap-2 flex-wrap justify-end">
 {selectedLead.email_contacto && (
 <span className="text-xs text-[var(--acc)]/70 font-mono font-medium truncate max-w-[200px] notranslate" translate="no" title={`Email Principal: ${selectedLead.email_contacto}`}>
 ✉️ {selectedLead.email_contacto}
 </span>
 )}
 {selectedLead.email_secundario && (
 <span className="text-xs text-[var(--acc)]/80 font-mono font-medium truncate max-w-[200px] notranslate" translate="no" title={`Email Secundario / Promotora: ${selectedLead.email_secundario}`}>
 ✉️2 {selectedLead.email_secundario}
 </span>
 )}
 <button
 onClick={handleEnrichLead}
 disabled={isEnrichingLead}
 className="px-2.5 py-1 bg-[var(--acc)]/15 hover:bg-[var(--acc)]/25 text-[var(--acc)]/70 text-[10px] rounded-[var(--r-s)] font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
 title="Scout Enriquecedor: Completa emails, webs y datos faltantes sin alucinaciones"
 >
 <Sparkles className={`w-3 h-3 text-[var(--acc)] ${isEnrichingLead ?'animate-spin' :''}`} />
 <span>{isEnrichingLead ?'Completando...' :'Scout Enriquecedor'}</span>
 </button>
 </div>
 </div>

 {enrichStatusMsg && (
 <div className="p-2 bg-[var(--acc)]/10 rounded-[var(--r-s)] text-[var(--acc)]/70 text-[11px] font-mono flex items-center gap-1.5 animate-fadeIn">
 <Sparkles className="w-3 h-3 text-[var(--acc)] shrink-0" />
 <span>{enrichStatusMsg}</span>
 </div>
 )}

 {selectedLead.direccion ? (
 <p className="text-xs font-sans font-bold text-[var(--ink)]">{selectedLead.direccion}</p>
 ) : (
 <button
 onClick={() => {
 const detected = autoDetectVenueAddress(selectedLead.nombre_sala, selectedLead.ciudad);
 onUpdateLead(selectedLead.id, { direccion: detected });
 }}
 className="text-xs font-sans font-bold text-[var(--acc)] hover:text-[#facc15] cursor-pointer flex items-center gap-1.5"
 >
 <Sparkles className="w-3.5 h-3.5" />
 Auto-detectar dirección exacta
 </button>
 )}

 <div className="pt-1 flex justify-center">
 <DirectionsCard
 query={
 selectedLead.direccion || `${selectedLead.nombre_sala}, ${selectedLead.ciudad}`
 }
 locationName={selectedLead.nombre_sala}
 address={selectedLead.direccion || selectedLead.ciudad}
 isStitchLight={isStitchLight}
 />
 </div>
 </div>

 {/* ROSTER / ARTISTAS REPRESENTADOS (Si aplica) */}
 {(selectedLead.roster || ['agencia','manager','productora','sello','grupo'].includes(String(selectedLead.tipo ||'').toLowerCase())) && (
 <div className="bg-[var(--sunken)] rounded-[var(--r-m)] p-4 space-y-2">
 <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-[var(--acc)] flex items-center gap-1.5">
 <span>🎸</span> Róster de Artistas & Servicios de Representación
 </p>
 {selectedLead.roster ? (
 <p className="text-xs font-sans text-[var(--ink)] bg-black/40 p-2.5 rounded-[var(--r-s)] border-[var(--hair)]800 leading-relaxed">
 {selectedLead.roster}
 </p>
 ) : (
 <p className="text-[11px] font-sans text-[var(--ink-2)] italic">
 Sin róster especificado. Haz clic en el botón de edición para añadir las bandas que gestiona.
 </p>
 )}
 </div>
 )}

 {/* NAVIGATION TABS (Pitch/Info | Email Thread | Bitácora) */}
 <div className="flex border-b border-[var(--hair)]800 gap-2 pt-1">
 <button
 type="button"
 onClick={() => setActiveTab('info')}
 className={`pb-2 text-xs font-sans font-bold tracking-wide uppercase transition-all px-3 cursor-pointer ${
 activeTab ==='info'
 ?'border-b-2 border-[var(--acc)] text-[var(--acc)]'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 Propuesta / Pitch
 </button>

 <button
 type="button"
 onClick={() => setActiveTab('emails')}
 className={`pb-2 text-xs font-sans font-bold tracking-wide uppercase transition-all px-3 flex items-center gap-1.5 cursor-pointer ${
 activeTab ==='emails'
 ?'border-b-2 border-[var(--acc)] text-[var(--acc)]'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 <Mail className="w-3.5 h-3.5" />
 <span>Correos</span>
 {hiloCompleto.length > 0 && (
 <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[var(--acc)] text-[var(--acc-ink)]">
 {hiloCompleto.length}
 </span>
 )}
 </button>

 <button
 type="button"
 onClick={() => setActiveTab('bitacora')}
 className={`pb-2 text-xs font-sans font-bold tracking-wide uppercase transition-all px-3 flex items-center gap-1.5 cursor-pointer ${
 activeTab ==='bitacora'
 ?'border-b-2 border-[var(--acc)] text-[var(--acc)]'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 <History className="w-3.5 h-3.5" />
 <span>Bitácora ({selectedLead.historial_contacto?.length || 0})</span>
 </button>
 </div>

 {/* TAB 1: PITCH & DIRECT EDITING FORM */}
 {activeTab ==='info' && (
 <div className="space-y-4">
 {/* Edit Form Modal/Inline */}
 {isEditingLeadInfo && (
 <div className="p-4 rounded-[var(--r-m)] space-y-3 bg-[var(--surface)] text-[var(--ink)] shadow-xl">
 <div className="flex justify-between items-center pb-2 border-b border-[var(--hair)]800">
 <span className="font-bold text-xs uppercase tracking-wider text-[var(--acc)] flex items-center gap-1.5">
 <Edit3 className="w-3.5 h-3.5" /> Editar Ficha ({selectedLead.nombre_sala})
 </span>
 <div className="flex gap-2">
 <button
 onClick={() => setIsEditingLeadInfo(false)}
 className="px-2.5 py-1 text-xs rounded bg-[var(--sunken)] text-[var(--ink-2)] hover:bg-zinc-700 cursor-pointer"
 >
 Cancelar
 </button>
 <button
 onClick={handleSaveLeadInfo}
 className="px-3 py-1 text-xs rounded bg-[var(--acc)] text-[var(--acc-ink)] font-bold hover:bg-[var(--acc)]/60 cursor-pointer shadow-sm"
 >
 Guardar
 </button>
 </div>
 </div>

 <div className="space-y-3 text-xs">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 <div>
 <label className="block text-[10px] uppercase font-mono text-[var(--ink-2)] mb-1">
 Nombre Sala / Espacio / Contacto
 </label>
 <input
 type="text"
 value={editedLeadInfo.nombre_sala ||''}
 onChange={(e) =>
 setEditedLeadInfo({ ...editedLeadInfo, nombre_sala: e.target.value })
 }
 className="w-full p-2 rounded bg-[var(--bg)] border-[var(--hair)]700 text-[var(--ink)] focus:outline-none focus:"
 />
 </div>

 <div>
 <label className="block text-[10px] uppercase font-mono text-[var(--acc)] font-bold mb-1">
 Tipo / Categoría de Lead
 </label>
 <select
 value={String(editedLeadInfo.tipo ||'sala').toLowerCase()}
 onChange={(e) =>
 setEditedLeadInfo({ ...editedLeadInfo, tipo: e.target.value as LeadType })
 }
 className="w-full p-2 rounded bg-[var(--bg)] text-[var(--acc)]/70 font-bold focus:outline-none focus: cursor-pointer"
 >
 <option value="sala">🏟️ Sala de Conciertos</option>
 <option value="festival">🎪 Festival</option>
 <option value="ayuntamiento">🏛️ Ayuntamiento / Fiestas</option>
 <option value="discoteca">🪩 Discoteca / Club</option>
 <option value="grupo">🎸 Grupo / Banda Aliada</option>
 <option value="agencia">💼 Agencia de Booking</option>
 <option value="manager">👔 Manager / Representante</option>
 <option value="productora">🎬 Productora de Eventos</option>
 <option value="sello">💿 Discográfica / Sello</option>
 <option value="medio">📻 Medio / Prensa / Radio</option>
 </select>
 </div>
 </div>

 {/* Logo Selector */}
 <div className="bg-[var(--bg)]/60 p-3 rounded-[var(--r-m)] border-[var(--hair)]800 space-y-2.5">
 <div className="flex items-center justify-between flex-wrap gap-2">
 <label className="block text-[10px] uppercase font-sans tracking-wider text-[var(--ink-2)]">
 Icono o Logo del Medio / Sala
 </label>
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={handleAutoSearchLogo}
 disabled={isSearchingLogo}
 className="px-2.5 py-1 bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--acc)]/70 text-[10px] rounded-[var(--r-s)] flex items-center gap-1.5 font-bold transition-all cursor-pointer disabled:opacity-50"
 >
 <Sparkles className="w-3 h-3 text-[var(--acc)]" />
 <span>{isSearchingLogo ?'Buscando...' :'🔍 Buscar Logo'}</span>
 </button>
 {onLeadLogoUpload && (
 <label className="cursor-pointer px-2.5 py-1 bg-[var(--sunken)] hover:bg-zinc-700 text-[var(--ink)] text-[10px] rounded-[var(--r-s)] flex items-center gap-1.5 font-bold transition-all border-[var(--hair)]700">
 <Upload className="w-3 h-3 text-[var(--acc)]" />
 <span>{isUploadingLeadLogo ?'Subiendo...' :'Subir Logo'}</span>
 <input
 type="file"
 accept="image/*"
 className="hidden"
 onChange={async e => {
 if (e.target.files && e.target.files[0]) {
 const file = e.target.files[0];
 const uploadedUrl = await onLeadLogoUpload(file);
 if (uploadedUrl) {
 setEditedLeadInfo(prev => ({ ...prev, imagen_url: uploadedUrl }));
 }
 }
 }}
 disabled={isUploadingLeadLogo}
 />
 </label>
 )}
 </div>
 </div>

 {editedLeadInfo.imagen_url && editedLeadInfo.imagen_url.trim() !=='' ? (
 <div className="flex items-center gap-3 p-2 bg-zinc-950 rounded-[var(--r-s)] border-[var(--hair)]800">
 <img
 src={editedLeadInfo.imagen_url}
 alt="Logo"
 className="w-10 h-10 rounded-[var(--r-s)] object-contain bg-[var(--bg)] shrink-0"
 onError={(e) => {
 e.currentTarget.style.display ='none';
 }}
 />
 <div className="flex-1 min-w-0">
 <p className="text-[10px] text-[var(--ink-2)] font-bold truncate">
 {editedLeadInfo.imagen_url}
 </p>
 <p className="text-[9px] text-[var(--ink-3)]">Logo oficial guardado</p>
 </div>
 <button
 type="button"
 onClick={() => setEditedLeadInfo(prev => ({ ...prev, imagen_url:'' }))}
 className="text-[10px] text-rose-400 hover:underline px-2 py-1 cursor-pointer"
 >
 Quitar
 </button>
 </div>
 ) : (
 <div className="space-y-1.5">
 <p className="text-[9px] text-[var(--ink-2)]">O selecciona un emoji característico:</p>
 <div className="flex flex-wrap gap-1.5">
 {['📻','📰','🌐','🎙️','📺','🏛️','🎪','🪩','🎸','💼','🎆','⚡','🔥'].map(
 emoji => (
 <button
 key={emoji}
 type="button"
 onClick={() => setEditedLeadInfo(prev => ({ ...prev, icono: emoji }))}
 className={`w-7 h-7 rounded-[var(--r-s)] text-sm flex items-center justify-center transition-all cursor-pointer ${
 editedLeadInfo.icono === emoji
 ?'bg-[var(--acc)] text-[var(--acc-ink)] font-bold scale-110 shadow-md'
 :'bg-[var(--sunken)]/80 text-[var(--ink-2)] hover:bg-zinc-700'
 }`}
 >
 {emoji}
 </button>
 )
 )}
 </div>
 </div>
 )}
 </div>

 {/* DIRECCIÓN / CALLE */}
 <div>
 <label className="block text-[10px] uppercase font-mono text-[var(--acc)] font-bold mb-1 flex items-center gap-1">
 📍 Dirección Exacta (Calle, Número...)
 </label>
 <input
 type="text"
 placeholder="Ej. Calle San Vicente Ferrer 33, 28004 Madrid"
 value={editedLeadInfo.direccion ||''}
 onChange={(e) =>
 setEditedLeadInfo({ ...editedLeadInfo, direccion: e.target.value })
 }
 className="w-full p-2 rounded bg-[var(--bg)] text-[var(--ink)] focus:outline-none focus:"
 />
 </div>

 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className="block text-[10px] uppercase font-mono text-[var(--ink-2)] mb-1">
 Ciudad
 </label>
 <input
 type="text"
 placeholder="Ej. Madrid"
 value={editedLeadInfo.ciudad ||''}
 onChange={(e) =>
 setEditedLeadInfo({ ...editedLeadInfo, ciudad: e.target.value })
 }
 className="w-full p-2 rounded bg-[var(--bg)] border-[var(--hair)]700 text-[var(--ink)] focus:outline-none"
 />
 </div>
 <div>
 <label className="block text-[10px] uppercase font-mono text-[var(--ink-2)] mb-1">
 Región / Provincia
 </label>
 <input
 type="text"
 placeholder="Ej. Comunidad de Madrid"
 value={editedLeadInfo.region ||''}
 onChange={(e) =>
 setEditedLeadInfo({ ...editedLeadInfo, region: e.target.value })
 }
 className="w-full p-2 rounded bg-[var(--bg)] border-[var(--hair)]700 text-[var(--ink)] focus:outline-none"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className="block text-[10px] uppercase font-mono text-[var(--ink-2)] mb-1">
 Persona de Contacto
 </label>
 <input
 type="text"
 placeholder="Ej. Carlos (Programador)"
 value={editedLeadInfo.contacto_nombre ||''}
 onChange={(e) =>
 setEditedLeadInfo({ ...editedLeadInfo, contacto_nombre: e.target.value })
 }
 className="w-full p-2 rounded bg-[var(--bg)] border-[var(--hair)]700 text-[var(--ink)] focus:outline-none"
 />
 </div>
 <div>
 <label className="block text-[10px] uppercase font-mono text-[var(--ink-2)] mb-1">
 Email Principal (Contratación)
 </label>
 <input
 type="email"
 placeholder="info@salanazcaconciertos.com"
 value={editedLeadInfo.email_contacto ||''}
 onChange={(e) =>
 setEditedLeadInfo({ ...editedLeadInfo, email_contacto: e.target.value })
 }
 className="w-full p-2 rounded bg-[var(--bg)] border-[var(--hair)]700 text-[var(--ink)] focus:outline-none"
 />
 </div>
 </div>

 <div>
 <label className="block text-[10px] uppercase font-mono text-[var(--acc)] font-bold mb-1">
 ✉️ Email Secundario / Promotora / Alternativo
 </label>
 <input
 type="email"
 placeholder="info@magnetikproducciones.com (o varios separados por coma)"
 value={editedLeadInfo.email_secundario ||''}
 onChange={(e) =>
 setEditedLeadInfo({ ...editedLeadInfo, email_secundario: e.target.value })
 }
 className="w-full p-2 rounded bg-[var(--bg)] text-[var(--ink)] focus:outline-none text-xs"
 />
 </div>

 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className="block text-[10px] uppercase font-mono text-[var(--ink-2)] mb-1">
 Teléfono
 </label>
 <input
 type="text"
 placeholder="Ej. +34 612 345 678"
 value={editedLeadInfo.telefono ||''}
 onChange={(e) =>
 setEditedLeadInfo({ ...editedLeadInfo, telefono: e.target.value })
 }
 className="w-full p-2 rounded bg-[var(--bg)] border-[var(--hair)]700 text-[var(--ink)] focus:outline-none"
 />
 </div>
 <div>
 <label className="block text-[10px] uppercase font-mono text-[var(--ink-2)] mb-1">
 Aforo (personas)
 </label>
 <input
 type="number"
 placeholder="Ej. 500"
 value={editedLeadInfo.aforo || 0}
 onChange={(e) =>
 setEditedLeadInfo({ ...editedLeadInfo, aforo: Number(e.target.value) })
 }
 className="w-full p-2 rounded bg-[var(--bg)] border-[var(--hair)]700 text-[var(--ink)] focus:outline-none"
 />
 </div>
 </div>

 <div className="space-y-1">
 <label className="block text-[10px] uppercase font-mono text-[var(--acc)] mb-1">
 Róster de Artistas / Bandas que representa
 </label>
 <input
 type="text"
 placeholder="Ej. Ska-P, Boikot, Zoo, La Raíz..."
 value={editedLeadInfo.roster ||''}
 onChange={(e) =>
 setEditedLeadInfo({ ...editedLeadInfo, roster: e.target.value })
 }
 className="w-full p-2 rounded bg-[var(--bg)] text-[var(--ink)] focus:outline-none text-xs"
 />
 </div>

 <div className="space-y-1">
 <div className="flex items-center justify-between">
 <span className="text-[10px] uppercase font-mono text-[var(--acc)]">
 🎪 Fechas del Festival (Inicio / Fin)
 </span>
 <button
 type="button"
 onClick={handleAutoExtractFestivalDates}
 disabled={isExtractingDates}
 className="px-2 py-0.5 rounded bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--acc)]/70 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
 title="Buscar fechas del festival automáticamente con IA y base de datos de festivales"
 >
 <Sparkles className="w-3 h-3 text-[var(--acc)]" />
 <span>{isExtractingDates ?'Buscando fechas...' :'⚡ Rellenar Fechas con IA'}</span>
 </button>
 </div>
 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className="block text-[10px] uppercase font-mono text-[var(--ink-2)] mb-1">
 Inicio Festival (dd/mm/yyyy)
 </label>
 <input
 type="date"
 value={toIsoDateString(editedLeadInfo.festival_start_date)}
 onChange={(e) =>
 setEditedLeadInfo({ ...editedLeadInfo, festival_start_date: e.target.value || undefined })
 }
 className="w-full p-2 rounded bg-[var(--bg)] text-[var(--ink)] focus:outline-none"
 />
 </div>
 <div>
 <label className="block text-[10px] uppercase font-mono text-[var(--acc)] mb-1">
 🎪 Fin Festival (dd/mm/yyyy)
 </label>
 <input
 type="date"
 value={toIsoDateString(editedLeadInfo.festival_end_date)}
 onChange={(e) =>
 setEditedLeadInfo({ ...editedLeadInfo, festival_end_date: e.target.value || undefined })
 }
 className="w-full p-2 rounded bg-[var(--bg)] text-[var(--ink)] focus:outline-none"
 />
 </div>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className="block text-[10px] uppercase font-mono text-[var(--ink-2)] mb-1">
 Sitio Web
 </label>
 <input
 type="url"
 placeholder="https://..."
 value={editedLeadInfo.website ||''}
 onChange={(e) =>
 setEditedLeadInfo({ ...editedLeadInfo, website: e.target.value })
 }
 className="w-full p-2 rounded bg-[var(--bg)] border-[var(--hair)]700 text-[var(--ink)] focus:outline-none"
 />
 </div>
 <div>
 <label className="block text-[10px] uppercase font-mono text-[var(--ink-2)] mb-1">
 Instagram
 </label>
 <input
 type="text"
 placeholder="@salaeltren"
 value={editedLeadInfo.instagram ||''}
 onChange={(e) =>
 setEditedLeadInfo({ ...editedLeadInfo, instagram: e.target.value })
 }
 className="w-full p-2 rounded bg-[var(--bg)] border-[var(--hair)]700 text-[var(--ink)] focus:outline-none"
 />
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Pitch Generator Section */}
 <div className="bg-[var(--sunken)] rounded-[var(--r-m)] p-4 space-y-3 border-[var(--hair)]800">
 <div className="flex items-center justify-between flex-wrap gap-2">
 <span className="text-xs font-bold font-sans uppercase text-[var(--acc)] tracking-wider">
 {isReplyStage ?'💬 Respuesta Redactada por IA' :'✉️ Propuesta de Pitch Redactada'}
 </span>
 <div className="flex items-center gap-1.5 flex-wrap">
 <button
 type="button"
 onClick={() => setShowMultiModelModal(true)}
 className="px-2.5 py-1 bg-gradient-to-r from-amber-500/20 via-sky-500/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 rounded text-[11px] text-[var(--acc)]/70 font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
 title="Compara en paralelo propuestas generadas por DeepSeek V3 y Gemini Flash"
 >
 <Layers className="w-3.5 h-3.5 text-[var(--acc)]" />
 <span>Comparador A/B (DeepSeek vs Gemini) 🚀</span>
 </button>

 <button
 type="button"
 onClick={handleCopyPitch}
 className="px-2 py-1 bg-[var(--sunken)] hover:bg-zinc-700 rounded text-[11px] text-[var(--ink)] font-sans flex items-center gap-1 cursor-pointer"
 >
 <Copy className="w-3 h-3" />
 <span>{copiedPitch ?'¡Copiado!' :'Copiar'}</span>
 </button>

 {selectedLead.estado ==='pendiente_aprobacion' || selectedLead.estado ==='nuevo' ? (
 <button
 type="button"
 onClick={handleApprovePitchDirectly}
 disabled={isCreatingDraft}
 className="px-2.5 py-1 bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--acc-ink)] font-bold rounded text-xs flex items-center gap-1 cursor-pointer shadow-sm disabled:opacity-50"
 >
 {isCreatingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
 <span>{isCreatingDraft ?'Creando borrador...' : (isReplyStage ?'Aprobar Respuesta' :'Aprobar Pitch')}</span>
 </button>
 ) : null}
 </div>
 </div>

 {/* Active Campaign Context Banner in Pitch Section */}
 {activeCampaign && (activeCampaign.isActive !== false) && (
 <div className="mb-2.5 p-2.5 bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-purple-950/40 rounded-[var(--r-m)] space-y-2 shadow-xs">
 <div className="flex items-center justify-between gap-2">
 <div className="flex items-center gap-2 min-w-0">
 <span className="text-xs shrink-0">🎯</span>
 <div className="min-w-0">
 <span className="text-[11px] font-bold text-purple-200 truncate block">
 Campaña: {activeCampaign.name}
 </span>
 <span className="text-[10px] text-purple-300/80 truncate block">
 Fechas objetivo: {activeCampaign.targetDatesText || (Array.isArray(activeCampaign.targetDates) ? activeCampaign.targetDates.join(',') :'Próximos meses')} · Aforo: {activeCampaign.minCapacity || 0}-{activeCampaign.maxCapacity ||'sin límite'} pax
 </span>
 </div>
 </div>
 <button
 type="button"
 onClick={() => handleRegeneratePitchWithFeedback()}
 disabled={isRegeneratingPitch}
 className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-[var(--ink)] font-bold rounded text-[10px] flex items-center gap-1 transition-all cursor-pointer shrink-0 shadow-sm disabled:opacity-50"
 title="Reescribe el pitch adaptándolo a las fechas y aforo de esta campaña"
 >
 <Sparkles className="w-3 h-3" />
 <span>Adaptar a Campaña</span>
 </button>
 </div>

 {/* Chequeo de festivos en fechas de campaña para la ciudad de este lead */}
 {Array.isArray(activeCampaign.targetDates) && activeCampaign.targetDates.length > 0 && selectedLead.ciudad && (
 <div className="flex flex-wrap gap-1 pt-1 border-t border-purple-500/20">
 {activeCampaign.targetDates.map((tDate) => (
 <HolidayDateWarning key={tDate} date={tDate} city={selectedLead.ciudad} compact />
 ))}
 </div>
 )}
 </div>
 )}

 {isEditingPitch ? (
 <div className="space-y-2">
 <textarea
 rows={6}
 value={editedPitch}
 onChange={(e) => setEditedPitch(e.target.value)}
 className="w-full p-3 bg-black/60 rounded-[var(--r-m)] text-xs text-[var(--ink)] font-sans focus:outline-none focus:ring-1 focus:ring-amber-400"
 />
 <div className="flex items-center justify-between gap-2">
 <span className="text-[10px] text-[var(--ink-3)] font-mono" title="Esta corrección se suma a las demás para refinar automáticamente cómo escribe la IA en esta categoría (ver ADN de Tono > Reglas Aprendidas). Si es un caso puntual y no quieres que influya, usa'Regenerar' con estrellas/comentario y marca'Solo para esta sala' en vez de editar aquí.">
 ✏️ Esta edición se usará también para entrenar al Redactor
 </span>
 <div className="flex gap-2 shrink-0">
 <button
 onClick={() => setIsEditingPitch(false)}
 className="px-3 py-1 bg-[var(--sunken)] text-[var(--ink-2)] rounded text-xs hover:bg-zinc-700 cursor-pointer"
 >
 Cancelar
 </button>
 <button
 onClick={handleSavePitch}
 className="px-3 py-1 bg-[var(--acc)] text-[var(--acc-ink)] font-bold rounded text-xs hover:bg-[var(--acc)]/60 cursor-pointer"
 >
 Guardar y Aprobar
 </button>
 </div>
 </div>
 </div>
 ) : (
 <div
 onClick={() => {
 setEditedPitch(editedPitch || selectedLead.pitch_generado ||'');
 setIsEditingPitch(true);
 }}
 className="p-3 bg-[var(--bg)] rounded-[var(--r-m)] border-[var(--hair)]800 text-xs text-[var(--ink)] font-sans whitespace-pre-wrap leading-relaxed cursor-pointer hover:/40 transition-colors group relative"
 >
 {editedPitch || selectedLead.pitch_generado ||'Sin pitch generado.'}
 <span className="absolute bottom-2 right-2 text-[10px] text-[var(--acc)] opacity-0 group-hover:opacity-100 transition-opacity font-bold">
 Clic para editar ✏️
 </span>
 </div>
 )}

 {/* SECCIÓN DE FEEDBACK Y ENTRENAMIENTO IA DEL PITCH (DYNAMIC FEW-SHOT & SELF-REFINING TONE DNA) */}
 <div className="mt-4 p-3.5 bg-gradient-to-br from-[var(--surface)] to-[var(--bg)] rounded-[var(--r-m)] space-y-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Sparkles className="w-4 h-4 text-[var(--acc)]" />
 <span className="text-xs font-bold text-[var(--acc)]/70 font-sans uppercase tracking-wider flex items-center gap-1.5">
 Aprendizaje Agéntico & ADN de Tono
 <span className="text-[9px] bg-[var(--acc)]/20 text-[var(--acc)]/70 px-1.5 py-0.5 rounded font-mono font-normal">
 Dynamic Few-Shot
 </span>
 </span>
 </div>
 {selectedLead.historial_feedback_pitch && selectedLead.historial_feedback_pitch.length > 0 && (
 <button
 type="button"
 onClick={() => setShowFeedbackHistory(!showFeedbackHistory)}
 className="text-[10px] text-[var(--acc)]/80 hover:text-[var(--acc)]/70 underline font-mono cursor-pointer"
 >
 {showFeedbackHistory ?'Ocultar historial' : `Historial (${selectedLead.historial_feedback_pitch.length})`}
 </button>
 )}
 </div>

 {/* Ratings for Tone and Content */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
 {/* Tono Rating */}
 <div className="p-2.5 bg-black/40 rounded-[var(--r-s)] border-[var(--hair)]800 space-y-1.5">
 <span className="text-[11px] font-bold text-[var(--ink-2)] block">Tono e Intención</span>
 <div className="flex items-center gap-1">
 {[1, 2, 3, 4, 5].map((star) => (
 <button
 key={`tone-${star}`}
 type="button"
 onClick={() => setToneRating(star)}
 className={`p-1 rounded hover:bg-[var(--surface)] transition-colors cursor-pointer ${
 toneRating >= star ?'text-[var(--acc)]' :'text-[var(--ink-2)]'
 }`}
 title={`Calificar tono: ${star}/5`}
 >
 <Star className="w-4 h-4 fill-current" />
 </button>
 ))}
 <span className="text-[10px] font-mono text-[var(--ink-2)] ml-1">
 {toneRating > 0 ? `${toneRating}/5` :'Sin calificar'}
 </span>
 </div>
 </div>

 {/* Content Rating */}
 <div className="p-2.5 bg-black/40 rounded-[var(--r-s)] border-[var(--hair)]800 space-y-1.5">
 <span className="text-[11px] font-bold text-[var(--ink-2)] block">Contenido y Estructura</span>
 <div className="flex items-center gap-1">
 {[1, 2, 3, 4, 5].map((star) => (
 <button
 key={`content-${star}`}
 type="button"
 onClick={() => setContentRating(star)}
 className={`p-1 rounded hover:bg-[var(--surface)] transition-colors cursor-pointer ${
 contentRating >= star ?'text-[var(--acc)]' :'text-[var(--ink-2)]'
 }`}
 title={`Calificar contenido: ${star}/5`}
 >
 <Star className="w-4 h-4 fill-current" />
 </button>
 ))}
 <span className="text-[10px] font-mono text-[var(--ink-2)] ml-1">
 {contentRating > 0 ? `${contentRating}/5` :'Sin calificar'}
 </span>
 </div>
 </div>
 </div>

 {/* Comments Area */}
 <div className="space-y-1">
 <label className="text-[11px] font-medium text-[var(--ink-2)] flex items-center gap-1">
 <MessageSquare className="w-3 h-3 text-[var(--acc)]" />
 <span>Sugerencias o comentarios para mejorar este pitch:</span>
 </label>
 <textarea
 rows={2}
 value={feedbackComment}
 onChange={(e) => setFeedbackComment(e.target.value)}
 placeholder="Ej:'Menciona que tocamos en el Viña Rock','Hazlo más corto y directo','Insiste en fecha para un sábado'..."
 className="w-full p-2.5 bg-black/60 rounded-[var(--r-s)] text-xs text-[var(--ink)] placeholder-zinc-500 font-sans focus:outline-none focus:"
 />
 </div>

 {/* Scope Selector: Solo este pitch vs Memoria Global Futura */}
 <div className="p-2.5 bg-black/50 rounded-[var(--r-m)] space-y-2">
 <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-2)] font-mono block">
 🎯 Alcance del entrenamiento IA:
 </span>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 <label
 onClick={() => setFeedbackScope('este_pitch')}
 className={`p-2 rounded-[var(--r-s)] cursor-pointer flex items-start gap-2 transition-all ${
 feedbackScope ==='este_pitch'
 ?'bg-[var(--acc)]/15 /60 text-[var(--ink)]'
 :'bg-[var(--bg)]/60 border-[var(--hair)]800 text-[var(--ink-2)] hover:border-[var(--hair)]700'
 }`}
 >
 <input
 type="radio"
 name="feedbackScope"
 checked={feedbackScope ==='este_pitch'}
 onChange={() => setFeedbackScope('este_pitch')}
 className="mt-0.5 accent-amber-500 shrink-0"
 />
 <div className="text-[11px] leading-tight">
 <span className="font-bold text-[var(--ink)] block">Solo para este pitch</span>
 <span className="text-[10px] opacity-80">Ajuste puntual exclusivo para {selectedLead.nombre_sala}.</span>
 </div>
 </label>

 <label
 onClick={() => setFeedbackScope('global')}
 className={`p-2 rounded-[var(--r-s)] cursor-pointer flex items-start gap-2 transition-all ${
 feedbackScope ==='global'
 ?'bg-[var(--acc)]/15 /60 text-[var(--ink)]'
 :'bg-[var(--bg)]/60 border-[var(--hair)]800 text-[var(--ink-2)] hover:border-[var(--hair)]700'
 }`}
 >
 <input
 type="radio"
 name="feedbackScope"
 checked={feedbackScope ==='global'}
 onChange={() => setFeedbackScope('global')}
 className="mt-0.5 accent-amber-500 shrink-0"
 />
 <div className="text-[11px] leading-tight">
 <span className="font-bold text-[var(--acc)]/70 flex items-center gap-1">
 <Sparkles className="w-3 h-3 text-[var(--acc)]" />
 Memoria general (Futuros pitches)
 </span>
 <span className="text-[10px] opacity-80">El Agente Redactor lo recordará como preferencia global.</span>
 </div>
 </label>
 </div>
 </div>

 {/* Success Banner */}
 {feedbackSuccessMsg && (
 <div className="p-2 bg-emerald-500/20 rounded-[var(--r-s)] text-[var(--ink-2)] text-xs font-medium flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
 <span>{feedbackSuccessMsg}</span>
 </div>
 )}

 {/* Model selection pills for single-click regenerate */}
 <div className="flex items-center justify-between flex-wrap gap-2 p-2 bg-black/40 rounded-[var(--r-m)] border-[var(--hair)]800">
 <span className="text-[10px] font-mono text-[var(--ink-2)] font-bold uppercase">
 🤖 Motor de Redacción & Coste:
 </span>
 <div className="flex items-center gap-1.5 flex-wrap">
 {[
 { id:'deepseek' as const, name:'DeepSeek V3 (Recomendado)', cost:'~0,00014 €', icon:'🚀' },
 { id:'gemini' as const, name:'Gemini Flash (Free Tier)', cost:'~0,00018 €', icon:'⚡' }
 ].map(m => {
 const isSelected = selectedAiModel === m.id;
 return (
 <button
 key={m.id}
 type="button"
 onClick={() => setSelectedAiModel(m.id)}
 className={`px-2 py-1 rounded-[var(--r-s)] text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
 isSelected
 ?'bg-[var(--acc)]/20 text-[var(--acc)]/70 /50 shadow-sm'
 :'bg-[var(--bg)]/60 text-[var(--ink-2)] border-[var(--hair)]800 hover:border-[var(--hair)]700'
 }`}
 title={`Coste aproximado por pitch: ${m.cost}`}
 >
 <span>{m.icon}</span>
 <span>{m.name}</span>
 <span className="font-mono text-[9px] text-emerald-400 bg-black/40 px-1 py-0.2 rounded">
 {m.cost}
 </span>
 </button>
 );
 })}
 </div>
 </div>

 {/* Action buttons */}
 <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2 pt-1">
 {selectedLead.historial_feedback_pitch && selectedLead.historial_feedback_pitch.some(l => !l.deshecho && l.pitch_previo) && (
 <button
 type="button"
 onClick={() => handleRevertPitch()}
 disabled={isRevertingPitch || isRegeneratingPitch}
 className="px-3.5 py-2 bg-[var(--sunken)] hover:bg-zinc-700 disabled:opacity-50 text-[var(--acc)]/70 font-semibold rounded-[var(--r-m)] text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all font-sans"
 title="Deshacer el último entrenamiento y restaurar la versión del pitch anterior"
 >
 {isRevertingPitch ? (
 <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--acc)]" />
 ) : (
 <Undo2 className="w-3.5 h-3.5 text-[var(--acc)]" />
 )}
 <span>Deshacer y volver al pitch anterior</span>
 </button>
 )}

 <button
 type="button"
 onClick={() => handleRegeneratePitchWithFeedback()}
 disabled={isRegeneratingPitch || isRevertingPitch}
 className="px-4 py-2 bg-[var(--acc)] hover:bg-[var(--acc)]/60 disabled:opacity-50 text-black font-bold rounded-[var(--r-m)] text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all font-sans"
 >
 {isRegeneratingPitch ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin" />
 <span>Entrenando {selectedAiModel ==='deepseek' ?'DeepSeek' :'Gemini'}...</span>
 </>
 ) : (
 <>
 <RefreshCw className="w-4 h-4" />
 <span>Reescribir con {selectedAiModel ==='deepseek' ?'DeepSeek V3' :'Gemini Flash'}</span>
 </>
 )}
 </button>
 </div>

 {/* History drawer if enabled */}
 {showFeedbackHistory && selectedLead.historial_feedback_pitch && selectedLead.historial_feedback_pitch.length > 0 && (
 <div className="mt-3 pt-3 border-t border-[var(--hair)]800 space-y-2">
 <span className="text-[11px] font-bold text-[var(--acc)] font-mono block uppercase">
 Historial de Aprendizaje e Iteraciones IA
 </span>
 <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
 {selectedLead.historial_feedback_pitch.map((log) => (
 <div key={log.id} className={`p-2.5 rounded-[var(--r-s)] text-[11px] space-y-1.5 transition-all ${
 log.deshecho 
 ?'bg-black/30 border-[var(--hair)]800/50 opacity-60' 
 :'bg-black/50 border-[var(--hair)]800/80'
 }`}>
 <div className="flex items-center justify-between text-[var(--ink-2)] text-[10px] font-mono">
 <span>{new Date(log.fecha).toLocaleString()}</span>
 <div className="flex items-center gap-2">
 {log.alcance ==='global' ? (
 <span className="px-1.5 py-0.5 bg-[var(--acc)]/20 text-[var(--acc)]/70 rounded text-[9px] font-bold flex items-center gap-1">
 <Sparkles className="w-2.5 h-2.5 text-[var(--acc)]" />
 Memoria Global
 </span>
 ) : (
 <span className="px-1.5 py-0.5 bg-[var(--sunken)] text-[var(--ink-2)] border-[var(--hair)]700 rounded text-[9px]">
 Solo este pitch
 </span>
 )}
 <span>Tono: {log.tono_rating ? `${log.tono_rating}/5` :'-'} | Contenido: {log.contenido_rating ? `${log.contenido_rating}/5` :'-'}</span>
 {log.deshecho && (
 <span className="px-1.5 py-0.5 bg-[var(--acc-soft)] text-[var(--acc)] rounded text-[9px] font-bold">
 [Deshecho]
 </span>
 )}
 </div>
 </div>

 {log.comentario && (
 <p className="text-[var(--ink)]/90 italic font-sans">
 &ldquo;{log.comentario}&rdquo;
 </p>
 )}

 {log.pitch_previo && !log.deshecho && (
 <div className="flex items-center justify-between pt-1 border-t border-[var(--hair)]800/60">
 <span className="text-[10px] text-[var(--ink-2)] font-mono truncate max-w-[220px]" title={log.pitch_previo}>
 Pitch previo: {log.pitch_previo.slice(0, 38)}...
 </span>
 <button
 type="button"
 onClick={() => handleRevertPitch(log.id)}
 disabled={isRevertingPitch}
 className="text-[10px] text-[var(--acc)] hover:text-[var(--acc)]/70 font-mono underline flex items-center gap-1 cursor-pointer shrink-0"
 >
 <RotateCcw className="w-3 h-3" />
 Volver a este pitch anterior
 </button>
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 )}

 {/* TAB 2: EMAIL THREAD & REPLY SIMULATION */}
 {activeTab ==='emails' && (
 <div className="space-y-3">
 {hiloCompleto.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-10 px-6">
 <PublicoSilhouette opacity={12} size="small" />
 <p className="mt-4 font-medium text-[var(--ink)] text-xs">Sin correspondencia</p>
 <p className="mt-2 text-[var(--ink-2)] text-xs max-w-xs text-center">
 Los correos y conversaciones con esta sala aparecerán aquí.
 </p>
 </div>
 ) : (
 hiloCompleto.map((msg) => (
 <div
 key={msg.id}
 className={`p-3.5 rounded-[var(--r-m)] space-y-1.5 text-xs font-sans ${
 msg.remitente ==='sala'
 ?'bg-[var(--acc-soft)] /40 text-amber-100'
 :'bg-[var(--bg)] border-[var(--hair)]800 text-[var(--ink)]'
 }`}
 >
 <div className="flex items-center justify-between font-bold text-[11px]">
 <span className={msg.remitente ==='sala' ?'text-[var(--acc)]' :'text-sky-400'}>
 {msg.remitente_nombre} ({msg.remitente ==='sala' ?'Programador' :'Bakandeya'})
 </span>
 <span className="text-[var(--ink-3)] text-[10px] font-mono">{msg.fecha}</span>
 </div>
 <div className="font-bold text-[var(--ink)]">{msg.asunto}</div>
 <p className="whitespace-pre-wrap text-[var(--ink-2)] leading-snug">{msg.mensaje}</p>
 </div>
 ))
 )}
 </div>
 )}

 {/* TAB 3: CONTACT BITÁCORA */}
 {activeTab ==='bitacora' && (
 <div className="bg-[var(--sunken)] rounded-[var(--r-m)] p-4 space-y-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <History className="w-4 h-4 text-[var(--acc)]" />
 <h4 className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider font-sans">
 Bitácora de Contacto y Llamadas
 </h4>
 </div>
 <span className="text-[10px] text-[var(--acc)]/80 font-mono">
 {(selectedLead.historial_contacto || []).length} registros
 </span>
 </div>

 {/* Log Form */}
 <form
 onSubmit={handleAddInteractionLog}
 className="space-y-3 bg-[var(--bg)] p-3 rounded-[var(--r-m)] border-[var(--hair)]800"
 >
 <div className="flex flex-wrap items-center justify-between gap-2">
 {/* Interaction Type Selector */}
 <div className="flex items-center gap-1 bg-black/60 p-1 rounded-[var(--r-s)] border-[var(--hair)]800">
 {(['Llamada','WhatsApp','Email','Reunión','Otro'] as const).map((type) => (
 <button
 key={type}
 type="button"
 onClick={() => setInteractionType(type)}
 className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
 interactionType === type
 ?'bg-[var(--acc)] text-[var(--acc-ink)] font-bold shadow-xs'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 {type ==='Llamada'
 ?'📞'
 : type ==='WhatsApp'
 ?'💬'
 : type ==='Email'
 ?'✉️'
 : type ==='Reunión'
 ?'🤝'
 :'📝'}{''}
 {type}
 </button>
 ))}
 </div>

 {/* Author input */}
 <input
 type="text"
 value={interactionAutor}
 onChange={(e) => setInteractionAutor(e.target.value)}
 placeholder="Tu nombre..."
 className="px-2 py-1 text-[10px] bg-[var(--bg)] border-[var(--hair)]800 rounded text-[var(--ink)] w-28 focus:outline-none"
 />
 </div>

 {/* Result Outcome Pills */}
 <div className="space-y-1">
 <span className="text-[9px] uppercase tracking-wider text-[var(--ink-2)] font-sans">
 Resultado del contacto:
 </span>
 <div className="flex flex-wrap gap-1">
 {(
 ['Interesado','Enviar propuesta','Seguimiento pendiente','Acuerdo cerrado','Rechazado','Info recibida'
 ] as const
 ).map((res) => (
 <button
 key={res}
 type="button"
 onClick={() => setInteractionResultado(res)}
 className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
 interactionResultado === res
 ? res ==='Interesado' || res ==='Acuerdo cerrado'
 ?'bg-emerald-500/30 text-[var(--ink-2)] font-bold'
 : res ==='Rechazado'
 ?'bg-rose-500/30 text-[var(--ink-2)] font-bold'
 :'bg-sky-500/30 text-sky-300 font-bold'
 :'bg-[var(--bg)] text-[var(--ink-2)] hover:text-[var(--ink)] border-[var(--hair)]800'
 }`}
 >
 {res}
 </button>
 ))}
 </div>
 </div>

 {/* Notes textarea */}
 <textarea
 rows={2}
 required
 value={interactionNotes}
 onChange={(e) => setInteractionNotes(e.target.value)}
 placeholder="Ej: Hablé con Carlos por WhatsApp. Pide propuesta de fechas para Noviembre..."
 className="w-full bg-black/50 rounded-[var(--r-s)] p-2.5 text-xs text-[var(--ink)] placeholder:text-[var(--ink-2)] focus:outline-none focus:ring-1 focus:ring-[var(--acc)]/50 resize-none font-sans"
 />

 <button
 type="submit"
 className="w-full py-2 bg-[var(--acc)] hover:bg-[var(--acc)]/90 text-black font-bold text-xs rounded-[var(--r-s)] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
 >
 <Save className="w-3.5 h-3.5" />
 <span>Anotar en Bitácora</span>
 </button>
 </form>

 {/* Timeline Feed */}
 <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
 {(selectedLead.historial_contacto || []).length === 0 ? (
 <div className="flex flex-col items-center justify-center py-6">
 <PublicoSilhouette opacity={12} size="small" />
 <p className="mt-3 font-medium text-[var(--ink)] text-[11px]">Sin interacciones</p>
 <p className="mt-1.5 text-[var(--ink-2)] text-[10px] max-w-xs text-center">
 Registra llamadas y mensajes desde la entrada de contacto.
 </p>
 </div>
 ) : (
 (selectedLead.historial_contacto || []).map((log) => (
 <div
 key={log.id}
 className="p-2.5 rounded-[var(--r-s)] bg-[var(--bg)] border-[var(--hair)]800 space-y-1.5 text-xs font-sans relative group"
 >
 <div className="flex items-center justify-between text-[10px]">
 <div className="flex items-center gap-1.5 font-bold">
 <span className="px-1.5 py-0.5 rounded bg-[var(--sunken)] text-[var(--acc)]/70">
 {log.tipo ==='Llamada'
 ?'📞 Llamada'
 : log.tipo ==='WhatsApp'
 ?'💬 WhatsApp'
 : log.tipo ==='Email'
 ?'✉️ Email'
 : log.tipo ==='Reunión'
 ?'🤝 Reunión'
 :'📝 Nota'}
 </span>
 <span className="text-[var(--ink-2)]">{log.autor ||'Agente'}</span>
 </div>
 <div className="flex items-center gap-2">
 <span className="text-[var(--ink-3)] font-mono">{log.fecha}</span>
 <button
 type="button"
 onClick={() => handleDeleteInteractionLog(log.id)}
 className="text-[var(--ink-2)] hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
 title="Borrar entrada"
 >
 <Trash2 className="w-3 h-3" />
 </button>
 </div>
 </div>

 {log.resultado && (
 <div>
 <span
 className={`inline-block text-[9px] px-1.5 py-0.2 rounded font-bold ${
 log.resultado ==='Interesado' || log.resultado ==='Acuerdo cerrado'
 ?'bg-emerald-500/20 text-emerald-400'
 : log.resultado ==='Rechazado'
 ?'bg-rose-500/20 text-rose-400'
 :'bg-sky-500/20 text-sky-400'
 }`}
 >
 {log.resultado}
 </span>
 </div>
 )}

 <p className="text-[var(--ink)] text-[11px] leading-snug whitespace-pre-wrap select-text">
 {log.notas}
 </p>
 </div>
 ))
 )}
 </div>
 </div>
 )}

 {/* Multi-Model Parallel Pitch Comparator Modal (A/B/C Testing) */}
 <MultiModelPitchComparatorModal
 isOpen={showMultiModelModal}
 onClose={() => setShowMultiModelModal(false)}
 lead={selectedLead}
 isStitchLight={isStitchLight}
 activeCampaign={activeCampaign}
 onSelectProposal={(text, providerName) => {
 setEditedPitch(text);
 selectedLead.pitch_generado = text;
 onUpdateLead(selectedLead.id, { pitch_generado: text });
 const label = providerName ==='deepseek' ?'DeepSeek V3' :'Gemini 3.7 Flash';
 setFeedbackSuccessMsg(`¡Propuesta de ${label} seleccionada y aplicada a la sala!`);
 setTimeout(() => setFeedbackSuccessMsg(null), 5000);
 }}
 />

 {/* Modal de Conexión CRM -> Bolo -> Repertorio Óptimo */}
 <BoloConfirmadoSetlistModal
 isOpen={showBoloConfirmadoModal}
 lead={selectedLead}
 onClose={() => setShowBoloConfirmadoModal(false)}
 onConfirmWithSetlist={handleConfirmWithSetlist}
 onConfirmWithoutSetlist={handleConfirmWithoutSetlist}
 isStitchLight={isStitchLight}
 />
 </div>
 );
};
