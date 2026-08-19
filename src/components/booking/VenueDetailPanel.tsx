import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus, LeadType, InteractionLog } from '../../types';
import { LeadHealthBadge } from './LeadHealthBadge';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { LeadAvatar } from './LeadAvatar';
import { ReliabilityBadge } from '../common/ReliabilityBadge';
import { FavoriteButton } from '../common/FavoriteButton';
import { isLeadVerificado } from '../../utils/leadReliability';
import DirectionsCard from '../DirectionsCard';
import { apiFetch } from '../../utils/api';
import { MultiModelPitchComparatorModal } from './MultiModelPitchComparatorModal';
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
} from 'lucide-react';

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
  sectionTab: 'salas' | 'medios' | 'grupos';
  isStitchLight?: boolean;
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
  onLeadLogoUpload,
  isUploadingLeadLogo = false
}) => {
  if (!selectedLead) return null;

  // Active Tab inside panel
  const [activeTab, setActiveTab] = useState<'info' | 'emails' | 'bitacora'>('info');

  // Edit Lead State
  const [isEditingLeadInfo, setIsEditingLeadInfo] = useState(false);
  const [editedLeadInfo, setEditedLeadInfo] = useState<Partial<Lead>>({ ...selectedLead });

  // Pitch Editing & Feedback State
  const [isEditingPitch, setIsEditingPitch] = useState(false);
  const [editedPitch, setEditedPitch] = useState(selectedLead.pitch_generado || '');
  const [toneRating, setToneRating] = useState<number>(0);
  const [contentRating, setContentRating] = useState<number>(0);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [feedbackScope, setFeedbackScope] = useState<'este_pitch' | 'global'>('este_pitch');
  const [isRegeneratingPitch, setIsRegeneratingPitch] = useState(false);
  const [isRevertingPitch, setIsRevertingPitch] = useState(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState<string | null>(null);
  const [showFeedbackHistory, setShowFeedbackHistory] = useState(false);
  const [showMultiModelModal, setShowMultiModelModal] = useState(false);
  const [selectedAiModel, setSelectedAiModel] = useState<'gemini' | 'deepseek' | 'claude'>('gemini');

  // Clean helper for values like #ERROR!
  const cleanVal = (val?: string) => {
    if (!val || val.includes('#ERROR!') || val.includes('#N/A') || val.includes('#VALUE!')) return '';
    return val;
  };

  // Sync state when selected lead changes or pitch updates
  useEffect(() => {
    setEditedPitch(selectedLead.pitch_generado || '');
    setEditedLeadInfo({
      ...selectedLead,
      telefono: cleanVal(selectedLead.telefono),
      contacto_nombre: cleanVal(selectedLead.contacto_nombre),
      email_contacto: cleanVal(selectedLead.email_contacto),
      direccion: cleanVal(selectedLead.direccion),
    });
  }, [selectedLead.id, selectedLead.pitch_generado, selectedLead.imagen_url, selectedLead.icono]);

  const handleRegeneratePitchWithFeedback = async (targetProvider?: 'gemini' | 'deepseek' | 'claude') => {
    setIsRegeneratingPitch(true);
    setFeedbackSuccessMsg(null);
    const providerToUse = targetProvider || selectedAiModel;
    try {
      const token = localStorage.getItem('bakandeya_token') || localStorage.getItem('token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }
      const res = await fetch(`/api/leads/${selectedLead.id}/regenerate-pitch`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tono_rating: toneRating || undefined,
          contenido_rating: contentRating || undefined,
          comentario: feedbackComment || undefined,
          alcance: feedbackScope,
          provider: providerToUse
        })
      });

      const data = await res.json().catch(() => ({ success: false, error: 'Respuesta inválida del servidor' }));
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
        const modelLabel = providerToUse === 'claude' ? 'Claude 3.5 Haiku' : providerToUse === 'deepseek' ? 'DeepSeek V3' : 'Gemini 3.7 Flash';
        if (feedbackScope === 'global') {
          setFeedbackSuccessMsg(`¡Pitch reescrito con ${modelLabel}! Aprendizaje guardado en la memoria global.`);
        } else {
          setFeedbackSuccessMsg(`¡Pitch reescrito con ${modelLabel} aplicando tus notas a esta sala!`);
        }
        setTimeout(() => setFeedbackSuccessMsg(null), 4500);
      } else {
        alert(data.error || 'No se pudo regenerar el pitch.');
      }
    } catch (err: any) {
      console.error('Error al regenerar pitch:', err);
      alert(`Error de conexión al reescribir el pitch con IA: ${err.message || 'Verifica la conexión'}`);
    } finally {
      setIsRegeneratingPitch(false);
    }
  };

  const handleRevertPitch = async (targetLogId?: string) => {
    if (!selectedLead) return;
    setIsRevertingPitch(true);
    try {
      const token = localStorage.getItem('bakandeya_token') || localStorage.getItem('token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }
      const res = await fetch(`/api/leads/${selectedLead.id}/revert-pitch`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ logId: targetLogId })
      });

      const data = await res.json().catch(() => ({ success: false, error: 'Respuesta inválida del servidor' }));
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
        alert(data.error || 'No se pudo restaurar el pitch anterior.');
      }
    } catch (err) {
      console.error('Error al deshacer entrenamiento del pitch:', err);
      alert('Error de conexión al restaurar el pitch anterior.');
    } finally {
      setIsRevertingPitch(false);
    }
  };

  // Bitácora state
  const [interactionType, setInteractionType] = useState<InteractionLog['tipo']>('Llamada');
  const [interactionAutor, setInteractionAutor] = useState('Diego (Manager)');
  const [interactionNotes, setInteractionNotes] = useState('');
  const [interactionResultado, setInteractionResultado] = useState<InteractionLog['resultado']>('Interesado');

  // Quick Copy status
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [isSearchingLogo, setIsSearchingLogo] = useState(false);
  const [isEnrichingLead, setIsEnrichingLead] = useState(false);
  const [enrichStatusMsg, setEnrichStatusMsg] = useState<string | null>(null);

  const handleEnrichLead = async () => {
    if (!selectedLead?.id) return;
    setIsEnrichingLead(true);
    setEnrichStatusMsg('Investigando y completando datos oficiales sin inventar...');
    try {
      const res = await apiFetch('/api/leads/enrich-lead', {
        method: 'POST',
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
        setEnrichStatusMsg(res.error || 'No se encontraron datos nuevos verificables.');
        setTimeout(() => setEnrichStatusMsg(null), 4000);
      }
    } catch (err: any) {
      console.error('Error enriqueciendo lead:', err);
      setEnrichStatusMsg(err.message || 'Error al completar datos.');
      setTimeout(() => setEnrichStatusMsg(null), 4000);
    } finally {
      setIsEnrichingLead(false);
    }
  };

  const handleAutoSearchLogo = async () => {
    const venueName = (editedLeadInfo.nombre_sala || selectedLead.nombre_sala || '').trim();
    if (!venueName) return;
    setIsSearchingLogo(true);
    try {
      const res = await apiFetch('/api/leads/ai-lookup', {
        method: 'POST',
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
    onUpdateLead(selectedLead.id, { estado: newStatus });
  };

  const isReplyStage = (selectedLead.hilo_emails && selectedLead.hilo_emails.length > 0) || selectedLead.estado === 'respondido' || selectedLead.estado === 'negociando';

  const handleSavePitch = () => {
    const approvalState = isReplyStage ? 'aprobado_respuesta' : 'aprobado_propuesta';
    onUpdateLead(selectedLead.id, { pitch_generado: editedPitch, estado: approvalState });
    setIsEditingPitch(false);
  };

  const handleApprovePitchDirectly = () => {
    const approvalState = isReplyStage ? 'aprobado_respuesta' : 'aprobado_propuesta';
    onUpdateLead(selectedLead.id, { estado: approvalState });
  };

  const handleAddInteractionLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interactionNotes.trim()) return;

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
    if (interactionResultado === 'Interesado') {
      newStatus = 'negociando';
    } else if (interactionResultado === 'Acuerdo cerrado') {
      newStatus = 'confirmado';
    } else if (interactionResultado === 'Rechazado') {
      newStatus = 'no_interesado';
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

  const phoneClean = selectedLead.telefono ? selectedLead.telefono.replace(/\D/g, '') : '';

  return (
    <div className="w-full space-y-5 relative">
      {/* HEADER CARD */}
      <div className="bg-[#1A1918] rounded-2xl p-4 sm:p-5 border border-zinc-800 shadow-xl space-y-4">
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
                <h3 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-zinc-50 notranslate" translate="no">
                  {selectedLead.nombre_sala}
                </h3>
                <VerifiedBadge isVerified={isLeadVerificado(selectedLead)} size="md" showLabel={true} />
              </div>
              <p className="text-xs sm:text-sm font-sans mt-0.5 text-zinc-300">
                {selectedLead.ciudad} • {selectedLead.genero || 'Variado'} •{' '}
                {selectedLead.roster 
                  ? `Róster: ${selectedLead.roster}` 
                  : (['agencia', 'manager', 'productora', 'sello'].includes(String(selectedLead.tipo || '').toLowerCase())
                      ? 'Agencia de Booking'
                      : (selectedLead.aforo ? `${selectedLead.aforo} pax` : 'Aforo n/d'))}
              </p>
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
              className="p-2 rounded-xl bg-[#252423] hover:bg-[#2e2d2b] text-zinc-300 hover:text-white transition-colors cursor-pointer border border-zinc-700/60"
              title="Editar ficha completa"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            {onDeleteLead && (
              <button
                onClick={() => onDeleteLead(selectedLead.id, selectedLead.nombre_sala)}
                className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white transition-colors cursor-pointer border border-rose-800/60"
                title="Eliminar y guardar en lista negra"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#252423] hover:bg-[#2e2d2b] text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-700/60"
              title="Cerrar panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lead Health / Temperature Badge & Quality Indicator & Category Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <LeadHealthBadge lead={selectedLead} showDescription={true} size="md" />
            <ReliabilityBadge item={selectedLead} size="md" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category / Type Recategorizer */}
            <div className="flex items-center gap-1.5 bg-[#121110] px-2.5 py-1 rounded-xl border border-amber-500/30">
              <span className="text-[10px] text-amber-400 font-mono font-bold uppercase">Tipo:</span>
              <select
                value={String(selectedLead.tipo || 'sala').toLowerCase()}
                onChange={(e) => {
                  const newType = e.target.value as LeadType;
                  onUpdateLead(selectedLead.id, { tipo: newType });
                }}
                className="text-xs font-sans font-bold text-amber-300 bg-transparent cursor-pointer focus:outline-none"
                title="Cambiar categoría / tipo de este lead"
              >
                <option value="sala" className="bg-zinc-900 text-zinc-100">🏟️ Sala de Conciertos</option>
                <option value="festival" className="bg-zinc-900 text-zinc-100">🎪 Festival</option>
                <option value="ayuntamiento" className="bg-zinc-900 text-zinc-100">🏛️ Ayuntamiento / Fiestas</option>
                <option value="discoteca" className="bg-zinc-900 text-zinc-100">🪩 Discoteca / Club</option>
                <option value="grupo" className="bg-zinc-900 text-zinc-100">🎸 Grupo / Banda Aliada</option>
                <option value="agencia" className="bg-zinc-900 text-zinc-100">💼 Agencia de Booking</option>
                <option value="manager" className="bg-zinc-900 text-zinc-100">👔 Manager / Representante</option>
                <option value="productora" className="bg-zinc-900 text-zinc-100">🎬 Productora de Eventos</option>
                <option value="sello" className="bg-zinc-900 text-zinc-100">💿 Discográfica / Sello</option>
                <option value="medio" className="bg-zinc-900 text-zinc-100">📻 Medio / Prensa / Radio</option>
              </select>
            </div>

            {/* Status selector */}
            <div className="flex items-center gap-1.5 bg-[#121110] px-2.5 py-1 rounded-xl border border-zinc-800">
              <span className={`w-2 h-2 rounded-full ${getStatusDotColor(selectedLead.estado)}`} />
              <select
                value={normalizeStatus(selectedLead.estado)}
                onChange={(e) => handleCorrectStatus(e.target.value as LeadStatus)}
                className="text-xs font-sans font-bold text-zinc-100 bg-transparent cursor-pointer focus:outline-none"
              >
                <option value="nuevo" className="bg-zinc-900">
                  Por contactar (nuevo)
                </option>
                <option value="esperando_respuesta" className="bg-zinc-900">
                  Contactado (esperando respuesta)
                </option>
                <option value="respondido" className="bg-zinc-900">
                  En conversación (ha respondido)
                </option>
                <option value="negociando" className="bg-zinc-900">
                  En negociación
                </option>
                <option value="confirmado" className="bg-zinc-900">
                  Concierto confirmado 🎉
                </option>
                <option value="aplazado" className="bg-zinc-900">
                  Aplazado (recontactar luego) ⏳
                </option>
                <option value="no_interesado" className="bg-zinc-900">
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
              className="py-2.5 px-3 bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Directo</span>
            </a>
          ) : null}

          {selectedLead.telefono ? (
            <a
              href={`tel:${selectedLead.telefono}`}
              className="py-2.5 px-3 bg-sky-950/90 hover:bg-sky-900 border border-sky-700/80 text-sky-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <PhoneCall className="w-4 h-4 text-sky-400" />
              <span>Llamar por Tel</span>
            </a>
          ) : null}
        </div>

        {/* Agent Workflow & Sub-status Banner (Option A 2-Dimensional Model) */}
        {(() => {
          const rawStatus = String(selectedLead.estado || '');
          const isPending = rawStatus === 'pendiente_aprobacion' || (rawStatus === 'nuevo' && !!selectedLead.pitch_generado && !selectedLead.fecha_envio);
          const isApproved = rawStatus.startsWith('aprobado');
          const isSent = normalizeStatus(rawStatus) === 'esperando_respuesta';

          if (isPending) {
            return (
              <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-xl flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-amber-300">
                      {isReplyStage ? '💬 Respuesta redactada por IA — Pendiente de aprobación' : '✉️ Pitch inicial redactado por IA — Pendiente de aprobación'}
                    </p>
                    <p className="text-[10px] text-zinc-400 truncate">
                      {isReplyStage ? 'Revisa el borrador para responder a la sala y autorizar su envío.' : 'Revisa la propuesta inicial para autorizar al agente de envíos.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleApprovePitchDirectly}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg shrink-0 flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Aprobar</span>
                </button>
              </div>
            );
          }

          if (isApproved) {
            return (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0 ml-1" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-emerald-300">
                    🚀 {rawStatus === 'aprobado_respuesta' ? 'Respuesta Aprobada' : 'Propuesta Aprobada'} — En cola del Agente Enviador
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    El agente despachará este correo respetando las normas de envío y rate-limiting.
                  </p>
                </div>
              </div>
            );
          }

          if (isSent) {
            return (
              <div className="p-2 bg-sky-500/10 border border-sky-500/25 rounded-xl flex items-center gap-2 text-xs text-sky-300">
                <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0 ml-1" />
                <span className="text-[11px] font-medium">
                  📬 Email enviado el {selectedLead.fecha_envio || 'recientemente'} • Agente a la espera de respuesta de la sala
                </span>
              </div>
            );
          }

          return null;
        })()}
      </div>

      {/* CONTACT & LOCATION CARD */}
      <div className="bg-[#1A1918] rounded-xl p-4 space-y-2.5 border border-zinc-800">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-zinc-400">
            Ficha de Contacto & Ubicación
          </p>
          <div className="flex items-center gap-2">
            {selectedLead.email_contacto && (
              <span className="text-xs text-amber-300 font-mono font-medium truncate max-w-[160px] notranslate" translate="no">
                {selectedLead.email_contacto}
              </span>
            )}
            <button
              onClick={handleEnrichLead}
              disabled={isEnrichingLead}
              className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[10px] rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Scout Enriquecedor: Completa emails, webs y datos faltantes sin alucinaciones"
            >
              <Sparkles className={`w-3 h-3 text-amber-400 ${isEnrichingLead ? 'animate-spin' : ''}`} />
              <span>{isEnrichingLead ? 'Completando...' : 'Scout Enriquecedor'}</span>
            </button>
          </div>
        </div>

        {enrichStatusMsg && (
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-[11px] font-mono flex items-center gap-1.5 animate-fadeIn">
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            <span>{enrichStatusMsg}</span>
          </div>
        )}

        {selectedLead.direccion ? (
          <p className="text-xs font-sans font-bold text-zinc-100">{selectedLead.direccion}</p>
        ) : (
          <button
            onClick={() => {
              const detected = autoDetectVenueAddress(selectedLead.nombre_sala, selectedLead.ciudad);
              onUpdateLead(selectedLead.id, { direccion: detected });
            }}
            className="text-xs font-sans font-bold text-[#eab308] hover:text-[#facc15] cursor-pointer flex items-center gap-1.5"
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
      {(selectedLead.roster || ['agencia', 'manager', 'productora', 'sello', 'grupo'].includes(String(selectedLead.tipo || '').toLowerCase())) && (
        <div className="bg-[#1A1918] rounded-xl p-4 space-y-2 border border-amber-500/30">
          <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <span>🎸</span> Róster de Artistas & Servicios de Representación
          </p>
          {selectedLead.roster ? (
            <p className="text-xs font-sans text-zinc-200 bg-black/40 p-2.5 rounded-lg border border-zinc-800 leading-relaxed">
              {selectedLead.roster}
            </p>
          ) : (
            <p className="text-[11px] font-sans text-zinc-400 italic">
              Sin róster especificado. Haz clic en el botón de edición para añadir las bandas que gestiona.
            </p>
          )}
        </div>
      )}

      {/* NAVIGATION TABS (Pitch/Info | Email Thread | Bitácora) */}
      <div className="flex border-b border-zinc-800 gap-2 pt-1">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`pb-2 text-xs font-sans font-bold tracking-wide uppercase transition-all px-3 cursor-pointer ${
            activeTab === 'info'
              ? 'border-b-2 border-[#f2ca50] text-[#f2ca50]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Propuesta / Pitch
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('emails')}
          className={`pb-2 text-xs font-sans font-bold tracking-wide uppercase transition-all px-3 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'emails'
              ? 'border-b-2 border-[#f2ca50] text-[#f2ca50]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Correos</span>
          {selectedLead.hilo_emails && selectedLead.hilo_emails.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#f2ca50] text-[#3c2f00]">
              {selectedLead.hilo_emails.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bitacora')}
          className={`pb-2 text-xs font-sans font-bold tracking-wide uppercase transition-all px-3 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'bitacora'
              ? 'border-b-2 border-[#f2ca50] text-[#f2ca50]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Bitácora ({selectedLead.historial_contacto?.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: PITCH & DIRECT EDITING FORM */}
      {activeTab === 'info' && (
        <div className="space-y-4">
          {/* Edit Form Modal/Inline */}
          {isEditingLeadInfo && (
            <div className="p-4 rounded-xl space-y-3 bg-[#181818] border border-amber-500/40 text-zinc-100 shadow-xl">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <span className="font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" /> Editar Ficha ({selectedLead.nombre_sala})
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditingLeadInfo(false)}
                    className="px-2.5 py-1 text-xs rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveLeadInfo}
                    className="px-3 py-1 text-xs rounded bg-amber-500 text-black font-bold hover:bg-amber-400 cursor-pointer shadow-sm"
                  >
                    Guardar
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">
                      Nombre Sala / Espacio / Contacto
                    </label>
                    <input
                      type="text"
                      value={editedLeadInfo.nombre_sala || ''}
                      onChange={(e) =>
                        setEditedLeadInfo({ ...editedLeadInfo, nombre_sala: e.target.value })
                      }
                      className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono text-amber-400 font-bold mb-1">
                      Tipo / Categoría de Lead
                    </label>
                    <select
                      value={String(editedLeadInfo.tipo || 'sala').toLowerCase()}
                      onChange={(e) =>
                        setEditedLeadInfo({ ...editedLeadInfo, tipo: e.target.value as LeadType })
                      }
                      className="w-full p-2 rounded bg-zinc-900 border border-amber-500/50 text-amber-300 font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
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
                <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="block text-[10px] uppercase font-sans tracking-wider text-zinc-400">
                      Icono o Logo del Medio / Sala
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAutoSearchLogo}
                        disabled={isSearchingLogo}
                        className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] rounded-lg flex items-center gap-1.5 font-bold transition-all border border-amber-500/40 cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>{isSearchingLogo ? 'Buscando...' : '🔍 Buscar Logo'}</span>
                      </button>
                      {onLeadLogoUpload && (
                        <label className="cursor-pointer px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] rounded-lg flex items-center gap-1.5 font-bold transition-all border border-zinc-700">
                          <Upload className="w-3 h-3 text-amber-400" />
                          <span>{isUploadingLeadLogo ? 'Subiendo...' : 'Subir Logo'}</span>
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

                  {editedLeadInfo.imagen_url ? (
                    <div className="flex items-center gap-3 p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                      <img
                        src={editedLeadInfo.imagen_url}
                        alt="Logo"
                        className="w-10 h-10 rounded-lg object-cover border border-amber-500/50 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-zinc-300 font-bold truncate">
                          {editedLeadInfo.imagen_url}
                        </p>
                        <p className="text-[9px] text-zinc-500">Logo oficial guardado</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditedLeadInfo(prev => ({ ...prev, imagen_url: '' }))}
                        className="text-[10px] text-rose-400 hover:underline px-2 py-1 cursor-pointer"
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="text-[9px] text-zinc-400">O selecciona un emoji característico:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {['📻', '📰', '🌐', '🎙️', '📺', '🏛️', '🎪', '🪩', '🎸', '💼', '🎆', '⚡', '🔥'].map(
                          emoji => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => setEditedLeadInfo(prev => ({ ...prev, icono: emoji }))}
                              className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
                                editedLeadInfo.icono === emoji
                                  ? 'bg-amber-500 text-black font-bold scale-110 shadow-md border border-amber-400'
                                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
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
                  <label className="block text-[10px] uppercase font-mono text-amber-400 font-bold mb-1 flex items-center gap-1">
                    📍 Dirección Exacta (Calle, Número...)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Calle San Vicente Ferrer 33, 28004 Madrid"
                    value={editedLeadInfo.direccion || ''}
                    onChange={(e) =>
                      setEditedLeadInfo({ ...editedLeadInfo, direccion: e.target.value })
                    }
                    className="w-full p-2 rounded bg-zinc-900 border border-amber-500/50 text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Madrid"
                      value={editedLeadInfo.ciudad || ''}
                      onChange={(e) =>
                        setEditedLeadInfo({ ...editedLeadInfo, ciudad: e.target.value })
                      }
                      className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">
                      Región / Provincia
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Comunidad de Madrid"
                      value={editedLeadInfo.region || ''}
                      onChange={(e) =>
                        setEditedLeadInfo({ ...editedLeadInfo, region: e.target.value })
                      }
                      className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">
                      Persona de Contacto
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Carlos (Programador)"
                      value={editedLeadInfo.contacto_nombre || ''}
                      onChange={(e) =>
                        setEditedLeadInfo({ ...editedLeadInfo, contacto_nombre: e.target.value })
                      }
                      className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="contacto@sala.com"
                      value={editedLeadInfo.email_contacto || ''}
                      onChange={(e) =>
                        setEditedLeadInfo({ ...editedLeadInfo, email_contacto: e.target.value })
                      }
                      className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. +34 612 345 678"
                      value={editedLeadInfo.telefono || ''}
                      onChange={(e) =>
                        setEditedLeadInfo({ ...editedLeadInfo, telefono: e.target.value })
                      }
                      className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">
                      Aforo (personas)
                    </label>
                    <input
                      type="number"
                      placeholder="Ej. 500"
                      value={editedLeadInfo.aforo || 0}
                      onChange={(e) =>
                        setEditedLeadInfo({ ...editedLeadInfo, aforo: Number(e.target.value) })
                      }
                      className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-mono text-amber-400 mb-1">
                    Róster de Artistas / Bandas que representa
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Ska-P, Boikot, Zoo, La Raíz..."
                    value={editedLeadInfo.roster || ''}
                    onChange={(e) =>
                      setEditedLeadInfo({ ...editedLeadInfo, roster: e.target.value })
                    }
                    className="w-full p-2 rounded bg-zinc-900 border border-amber-500/40 text-amber-200 focus:outline-none text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">
                      Sitio Web
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={editedLeadInfo.website || ''}
                      onChange={(e) =>
                        setEditedLeadInfo({ ...editedLeadInfo, website: e.target.value })
                      }
                      className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">
                      Instagram
                    </label>
                    <input
                      type="text"
                      placeholder="@salaeltren"
                      value={editedLeadInfo.instagram || ''}
                      onChange={(e) =>
                        setEditedLeadInfo({ ...editedLeadInfo, instagram: e.target.value })
                      }
                      className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pitch Generator Section */}
          <div className="bg-[#1A1918] rounded-xl p-4 space-y-3 border border-zinc-800">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold font-sans uppercase text-amber-400 tracking-wider">
                {isReplyStage ? '💬 Respuesta Redactada por IA' : '✉️ Propuesta de Pitch Redactada'}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowMultiModelModal(true)}
                  className="px-2.5 py-1 bg-gradient-to-r from-amber-500/20 via-sky-500/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 border border-amber-500/40 rounded text-[11px] text-amber-300 font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  title="Compara en paralelo propuestas generadas por DeepSeek V3 y Gemini Flash"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Comparador A/B (DeepSeek vs Gemini) 🚀</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyPitch}
                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-[11px] text-zinc-200 font-sans flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedPitch ? '¡Copiado!' : 'Copiar'}</span>
                </button>

                {selectedLead.estado === 'pendiente_aprobacion' || selectedLead.estado === 'nuevo' ? (
                  <button
                    type="button"
                    onClick={handleApprovePitchDirectly}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded text-xs flex items-center gap-1 cursor-pointer shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isReplyStage ? 'Aprobar Respuesta' : 'Aprobar Pitch'}</span>
                  </button>
                ) : null}
              </div>
            </div>

            {isEditingPitch ? (
              <div className="space-y-2">
                <textarea
                  rows={6}
                  value={editedPitch}
                  onChange={(e) => setEditedPitch(e.target.value)}
                  className="w-full p-3 bg-black/60 rounded-xl border border-amber-500/50 text-xs text-zinc-100 font-sans focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditingPitch(false)}
                    className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded text-xs hover:bg-zinc-700 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSavePitch}
                    className="px-3 py-1 bg-amber-500 text-black font-bold rounded text-xs hover:bg-amber-400 cursor-pointer"
                  >
                    Guardar y Aprobar
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => {
                  setEditedPitch(editedPitch || selectedLead.pitch_generado || '');
                  setIsEditingPitch(true);
                }}
                className="p-3 bg-[#121110] rounded-xl border border-zinc-800 text-xs text-zinc-200 font-sans whitespace-pre-wrap leading-relaxed cursor-pointer hover:border-amber-500/40 transition-colors group relative"
              >
                {editedPitch || selectedLead.pitch_generado || 'Sin pitch generado.'}
                <span className="absolute bottom-2 right-2 text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                  Clic para editar ✏️
                </span>
              </div>
            )}

            {/* SECCIÓN DE FEEDBACK Y ENTRENAMIENTO IA DEL PITCH */}
            <div className="mt-4 p-3.5 bg-gradient-to-br from-[#181716] to-[#121110] rounded-xl border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300 font-sans uppercase tracking-wider">
                    Feedback & Entrenar Agente Redactor
                  </span>
                </div>
                {selectedLead.historial_feedback_pitch && selectedLead.historial_feedback_pitch.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowFeedbackHistory(!showFeedbackHistory)}
                    className="text-[10px] text-amber-400/80 hover:text-amber-300 underline font-mono cursor-pointer"
                  >
                    {showFeedbackHistory ? 'Ocultar historial' : `Historial (${selectedLead.historial_feedback_pitch.length})`}
                  </button>
                )}
              </div>

              {/* Ratings for Tone and Content */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {/* Tono Rating */}
                <div className="p-2.5 bg-black/40 rounded-lg border border-zinc-800 space-y-1.5">
                  <span className="text-[11px] font-bold text-zinc-300 block">Tono e Intención</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={`tone-${star}`}
                        type="button"
                        onClick={() => setToneRating(star)}
                        className={`p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer ${
                          toneRating >= star ? 'text-amber-400' : 'text-zinc-600'
                        }`}
                        title={`Calificar tono: ${star}/5`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    ))}
                    <span className="text-[10px] font-mono text-zinc-400 ml-1">
                      {toneRating > 0 ? `${toneRating}/5` : 'Sin calificar'}
                    </span>
                  </div>
                </div>

                {/* Content Rating */}
                <div className="p-2.5 bg-black/40 rounded-lg border border-zinc-800 space-y-1.5">
                  <span className="text-[11px] font-bold text-zinc-300 block">Contenido y Estructura</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={`content-${star}`}
                        type="button"
                        onClick={() => setContentRating(star)}
                        className={`p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer ${
                          contentRating >= star ? 'text-amber-400' : 'text-zinc-600'
                        }`}
                        title={`Calificar contenido: ${star}/5`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    ))}
                    <span className="text-[10px] font-mono text-zinc-400 ml-1">
                      {contentRating > 0 ? `${contentRating}/5` : 'Sin calificar'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Comments Area */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-300 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-amber-400" />
                  <span>Sugerencias o comentarios para mejorar este pitch:</span>
                </label>
                <textarea
                  rows={2}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Ej: 'Menciona que tocamos en el Viña Rock', 'Hazlo más corto y directo', 'Insiste en fecha para un sábado'..."
                  className="w-full p-2.5 bg-black/60 rounded-lg border border-zinc-700/80 text-xs text-zinc-200 placeholder-zinc-500 font-sans focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Scope Selector: Solo este pitch vs Memoria Global Futura */}
              <div className="p-2.5 bg-black/50 rounded-xl border border-zinc-800/80 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono block">
                  🎯 Alcance del entrenamiento IA:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    onClick={() => setFeedbackScope('este_pitch')}
                    className={`p-2 rounded-lg border cursor-pointer flex items-start gap-2 transition-all ${
                      feedbackScope === 'este_pitch'
                        ? 'bg-amber-500/15 border-amber-500/60 text-amber-200'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="feedbackScope"
                      checked={feedbackScope === 'este_pitch'}
                      onChange={() => setFeedbackScope('este_pitch')}
                      className="mt-0.5 accent-amber-500 shrink-0"
                    />
                    <div className="text-[11px] leading-tight">
                      <span className="font-bold text-zinc-100 block">Solo para este pitch</span>
                      <span className="text-[10px] opacity-80">Ajuste puntual exclusivo para {selectedLead.nombre_sala}.</span>
                    </div>
                  </label>

                  <label
                    onClick={() => setFeedbackScope('global')}
                    className={`p-2 rounded-lg border cursor-pointer flex items-start gap-2 transition-all ${
                      feedbackScope === 'global'
                        ? 'bg-amber-500/15 border-amber-500/60 text-amber-200'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="feedbackScope"
                      checked={feedbackScope === 'global'}
                      onChange={() => setFeedbackScope('global')}
                      className="mt-0.5 accent-amber-500 shrink-0"
                    />
                    <div className="text-[11px] leading-tight">
                      <span className="font-bold text-amber-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        Memoria general (Futuros pitches)
                      </span>
                      <span className="text-[10px] opacity-80">El Agente Redactor lo recordará como preferencia global.</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Success Banner */}
              {feedbackSuccessMsg && (
                <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{feedbackSuccessMsg}</span>
                </div>
              )}

              {/* Model selection pills for single-click regenerate */}
              <div className="flex items-center justify-between flex-wrap gap-2 p-2 bg-black/40 rounded-xl border border-zinc-800">
                <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase">
                  🤖 Motor de Redacción & Coste:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'deepseek' as const, name: 'DeepSeek V3 (Recomendado)', cost: '~0,00014 €', icon: '🚀' },
                    { id: 'gemini' as const, name: 'Gemini Flash (Free Tier)', cost: '~0,00018 €', icon: '⚡' }
                  ].map(m => {
                    const isSelected = selectedAiModel === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedAiModel(m.id)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                            : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                        }`}
                        title={`Coste aproximado por pitch: ${m.cost}`}
                      >
                        <span>{m.icon}</span>
                        <span>{m.name}</span>
                        <span className="font-mono text-[9px] text-emerald-400 bg-black/40 px-1 py-0.2 rounded border border-emerald-500/20">
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
                    className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-amber-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-amber-500/30 transition-all font-sans"
                    title="Deshacer el último entrenamiento y restaurar la versión del pitch anterior"
                  >
                    {isRevertingPitch ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    ) : (
                      <Undo2 className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>Deshacer y volver al pitch anterior</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleRegeneratePitchWithFeedback()}
                  disabled={isRegeneratingPitch || isRevertingPitch}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all font-sans"
                >
                  {isRegeneratingPitch ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Entrenando {selectedAiModel === 'claude' ? 'Claude' : selectedAiModel === 'deepseek' ? 'DeepSeek' : 'Gemini'}...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Reescribir con {selectedAiModel === 'claude' ? 'Claude Haiku' : selectedAiModel === 'deepseek' ? 'DeepSeek V3' : 'Gemini Flash'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* History drawer if enabled */}
              {showFeedbackHistory && selectedLead.historial_feedback_pitch && selectedLead.historial_feedback_pitch.length > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2">
                  <span className="text-[11px] font-bold text-amber-400 font-mono block uppercase">
                    Historial de Aprendizaje e Iteraciones IA
                  </span>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectedLead.historial_feedback_pitch.map((log) => (
                      <div key={log.id} className={`p-2.5 rounded-lg border text-[11px] space-y-1.5 transition-all ${
                        log.deshecho 
                          ? 'bg-black/30 border-zinc-800/50 opacity-60' 
                          : 'bg-black/50 border-zinc-800/80'
                      }`}>
                        <div className="flex items-center justify-between text-zinc-400 text-[10px] font-mono">
                          <span>{new Date(log.fecha).toLocaleString()}</span>
                          <div className="flex items-center gap-2">
                            {log.alcance === 'global' ? (
                              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[9px] font-bold flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                                Memoria Global
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded text-[9px]">
                                Solo este pitch
                              </span>
                            )}
                            <span>Tono: {log.tono_rating ? `${log.tono_rating}/5` : '-'} | Contenido: {log.contenido_rating ? `${log.contenido_rating}/5` : '-'}</span>
                            {log.deshecho && (
                              <span className="px-1.5 py-0.5 bg-amber-950/60 text-amber-400 border border-amber-500/30 rounded text-[9px] font-bold">
                                [Deshecho]
                              </span>
                            )}
                          </div>
                        </div>

                        {log.comentario && (
                          <p className="text-amber-200/90 italic font-sans">
                            &ldquo;{log.comentario}&rdquo;
                          </p>
                        )}

                        {log.pitch_previo && !log.deshecho && (
                          <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
                            <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[220px]" title={log.pitch_previo}>
                              Pitch previo: {log.pitch_previo.slice(0, 38)}...
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRevertPitch(log.id)}
                              disabled={isRevertingPitch}
                              className="text-[10px] text-amber-400 hover:text-amber-300 font-mono underline flex items-center gap-1 cursor-pointer shrink-0"
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
      {activeTab === 'emails' && (
        <div className="space-y-3">
          {(selectedLead.hilo_emails || []).length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-[#1A1918] border border-zinc-800 text-zinc-400 text-xs italic">
              No hay correos registrados en el historial de esta sala aún.
            </div>
          ) : (
            (selectedLead.hilo_emails || []).map((msg) => (
              <div
                key={msg.id}
                className={`p-3.5 rounded-xl border space-y-1.5 text-xs font-sans ${
                  msg.remitente === 'sala'
                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-100'
                    : 'bg-[#121110] border-zinc-800 text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-[11px]">
                  <span className={msg.remitente === 'sala' ? 'text-amber-400' : 'text-sky-400'}>
                    {msg.remitente_nombre} ({msg.remitente === 'sala' ? 'Programador' : 'Bakandeya'})
                  </span>
                  <span className="text-zinc-500 text-[10px] font-mono">{msg.fecha}</span>
                </div>
                <div className="font-bold text-zinc-100">{msg.asunto}</div>
                <p className="whitespace-pre-wrap text-zinc-300 leading-snug">{msg.mensaje}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: CONTACT BITÁCORA */}
      {activeTab === 'bitacora' && (
        <div className="bg-[#1A1918] rounded-xl p-4 space-y-3 border border border-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#eab308]" />
              <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider font-sans">
                Bitácora de Contacto y Llamadas
              </h4>
            </div>
            <span className="text-[10px] text-[#eab308]/80 font-mono">
              {(selectedLead.historial_contacto || []).length} registros
            </span>
          </div>

          {/* Log Form */}
          <form
            onSubmit={handleAddInteractionLog}
            className="space-y-3 bg-[#121110] p-3 rounded-xl border border-zinc-800"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Interaction Type Selector */}
              <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-zinc-800">
                {(['Llamada', 'WhatsApp', 'Email', 'Reunión', 'Otro'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setInteractionType(type)}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      interactionType === type
                        ? 'bg-[#eab308] text-black font-bold shadow-xs'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {type === 'Llamada'
                      ? '📞'
                      : type === 'WhatsApp'
                      ? '💬'
                      : type === 'Email'
                      ? '✉️'
                      : type === 'Reunión'
                      ? '🤝'
                      : '📝'}{' '}
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
                className="px-2 py-1 text-[10px] bg-zinc-900 border border-zinc-800 rounded text-neutral-300 w-28 focus:outline-none"
              />
            </div>

            {/* Result Outcome Pills */}
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-sans">
                Resultado del contacto:
              </span>
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    'Interesado',
                    'Enviar propuesta',
                    'Seguimiento pendiente',
                    'Acuerdo cerrado',
                    'Rechazado',
                    'Info recibida'
                  ] as const
                ).map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setInteractionResultado(res)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                      interactionResultado === res
                        ? res === 'Interesado' || res === 'Acuerdo cerrado'
                          ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/60 font-bold'
                          : res === 'Rechazado'
                          ? 'bg-rose-500/30 text-rose-300 border border-rose-500/60 font-bold'
                          : 'bg-sky-500/30 text-sky-300 border border-sky-500/60 font-bold'
                        : 'bg-zinc-900 text-neutral-400 hover:text-white border border-zinc-800'
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
              className="w-full bg-black/50 rounded-lg p-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 resize-none font-sans"
            />

            <button
              type="submit"
              className="w-full py-2 bg-[#eab308] hover:bg-[#eab308]/90 text-black font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Anotar en Bitácora</span>
            </button>
          </form>

          {/* Timeline Feed */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
            {(selectedLead.historial_contacto || []).length === 0 ? (
              <p className="text-[11px] text-zinc-500 italic text-center py-3">
                No hay llamadas ni mensajes registrados aún para esta sala.
              </p>
            ) : (
              (selectedLead.historial_contacto || []).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-lg bg-[#121110] border border-zinc-800 space-y-1.5 text-xs font-sans relative group"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-amber-300">
                        {log.tipo === 'Llamada'
                          ? '📞 Llamada'
                          : log.tipo === 'WhatsApp'
                          ? '💬 WhatsApp'
                          : log.tipo === 'Email'
                          ? '✉️ Email'
                          : log.tipo === 'Reunión'
                          ? '🤝 Reunión'
                          : '📝 Nota'}
                      </span>
                      <span className="text-zinc-400">{log.autor || 'Agente'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 font-mono">{log.fecha}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteInteractionLog(log.id)}
                        className="text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
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
                          log.resultado === 'Interesado' || log.resultado === 'Acuerdo cerrado'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : log.resultado === 'Rechazado'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-sky-500/20 text-sky-400'
                        }`}
                      >
                        {log.resultado}
                      </span>
                    </div>
                  )}

                  <p className="text-zinc-200 text-[11px] leading-snug whitespace-pre-wrap select-text">
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
        onSelectProposal={(text, providerName) => {
          setEditedPitch(text);
          selectedLead.pitch_generado = text;
          onUpdateLead(selectedLead.id, { pitch_generado: text });
          const label = providerName === 'claude' ? 'Claude 3.5 Haiku' : providerName === 'deepseek' ? 'DeepSeek V3' : 'Gemini 3.7 Flash';
          setFeedbackSuccessMsg(`¡Propuesta de ${label} seleccionada y aplicada a la sala!`);
          setTimeout(() => setFeedbackSuccessMsg(null), 5000);
        }}
      />
    </div>
  );
};
