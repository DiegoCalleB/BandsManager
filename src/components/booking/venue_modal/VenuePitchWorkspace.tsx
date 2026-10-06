import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  CheckCircle2,
  Copy,
  Edit3,
  RotateCcw,
  Star,
  MessageCircle,
  Loader2,
  Check,
  Layers,
  ChevronDown,
  AlertCircle,
  Clock,
  Mail,
  Save,
  Undo2,
} from 'lucide-react';
import { Lead } from '../../../types';
import { Button, IconButton, Textarea, Select } from '../../ui';
import { ShowIcon } from '../../ui/ShowIcon';
import { apiFetch } from '../../../utils/api';
import { MultiModelPitchComparatorModal } from '../MultiModelPitchComparatorModal';

interface VenuePitchWorkspaceProps {
  lead: Lead;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  onOpenWhatsAppModal: () => void;
  activeCampaign?: any;
  bandName?: string;
}

export const VenuePitchWorkspace: React.FC<VenuePitchWorkspaceProps> = ({
  lead,
  onUpdateLead,
  onOpenWhatsAppModal,
  activeCampaign,
  bandName,
}) => {
  const [editedPitch, setEditedPitch] = useState(lead.pitch_generado || '');
  const [isEditingText, setIsEditingText] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini' | 'deepseek'>('gemini');
  const [showComparator, setShowComparator] = useState(false);

  // Feedback Few-Shot state
  const [toneRating, setToneRating] = useState<number>(0);
  const [contentRating, setContentRating] = useState<number>(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Sync state when lead changes
  useEffect(() => {
    setEditedPitch(lead.pitch_generado || '');
    setIsEditingText(false);
    setDraftError(null);
    setFeedbackSuccess(null);
  }, [lead.id, lead.pitch_generado]);

  // Is this reply stage (negotiating / responded) or initial pitch?
  const isReplyStage =
    lead.estado === 'respondido' ||
    lead.estado === 'negociando' ||
    lead.estado === 'aprobado_respuesta';

  // 1. REGENERATE PITCH WITH AI
  const handleRegenerate = async (providerOverride?: 'gemini' | 'deepseek') => {
    setIsRegenerating(true);
    setFeedbackSuccess(null);
    const provider = providerOverride || selectedModel;
    try {
      const endpoint = isReplyStage
        ? `/api/leads/${lead.id}/regenerate-reply`
        : `/api/leads/${lead.id}/regenerate-pitch`;

      const res = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          tono_rating: toneRating || undefined,
          contenido_rating: contentRating || undefined,
          comentario: feedbackComment || undefined,
          provider,
          activeCampaign,
        }),
      });

      if (res.success && res.newPitchText) {
        setEditedPitch(res.newPitchText);
        setIsEditingText(false);
        const updatedHistory = res.feedbackLog
          ? [res.feedbackLog, ...(lead.historial_feedback_pitch || [])]
          : lead.historial_feedback_pitch || [];

        onUpdateLead(lead.id, {
          pitch_generado: res.newPitchText,
          estado: 'pendiente_aprobacion',
          historial_feedback_pitch: updatedHistory,
        });

        setToneRating(0);
        setContentRating(0);
        setFeedbackComment('');
        setFeedbackSuccess('¡Propuesta regenerada con éxito con ADN de la banda!');
      } else {
        setDraftError(res.error || 'Error al regenerar con IA');
      }
    } catch (err: any) {
      setDraftError(err.message || 'Error de conexión con el agente');
    } finally {
      setIsRegenerating(false);
    }
  };

  // 2. APPROVE PITCH & DISPATCH (Human-in-the-loop)
  const handleApprove = async () => {
    setIsCreatingDraft(true);
    setDraftError(null);
    const approvalState = isReplyStage ? 'aprobado_respuesta' : 'aprobado_propuesta';

    // Step 1: Save approval state and text
    await onUpdateLead(lead.id, {
      estado: approvalState,
      pitch_generado: editedPitch,
    });

    // Step 2: Trigger agent dispatcher
    try {
      const res = await apiFetch('/api/trigger-agent', {
        method: 'POST',
        body: JSON.stringify({
          agentName: 'enviador',
          params: { id: lead.id, trigger_type: 'usuario_manual' },
        }),
      });

      const leadResult = Array.isArray(res.results)
        ? res.results.find((r: any) => r.id === lead.id)
        : null;

      if (leadResult?.status === 'borrador' || leadResult?.status === 'enviado') {
        onUpdateLead(lead.id, {
          estado: leadResult.status === 'enviado' ? (leadResult.estado_nuevo || 'contactado') : 'borrador_creado',
        });
      } else if (leadResult?.error || res.message) {
        setDraftError(leadResult?.error || res.message);
      }
    } catch (err: any) {
      setDraftError(err.message || 'Error al despachar el correo');
    } finally {
      setIsCreatingDraft(false);
    }
  };

  // 3. COPY PITCH
  const handleCopy = () => {
    navigator.clipboard.writeText(editedPitch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 4. SAVE MANUAL EDITS
  const handleSaveText = () => {
    setIsEditingText(false);
    onUpdateLead(lead.id, { pitch_generado: editedPitch });
  };

  const rawStatus = lead.estado || 'nuevo';
  const isPending = rawStatus === 'pendiente_aprobacion' || (rawStatus === 'nuevo' && !!lead.pitch_generado);
  const isApproved = rawStatus === 'aprobado_propuesta' || rawStatus === 'aprobado_respuesta';
  const isDraftCreated = rawStatus === 'borrador_creado';

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-4">
      {/* 1. AGENT WORKFLOW STATUS BANNER (HUMAN-IN-THE-LOOP) */}
      <div className="p-3.5 sm:p-4 rounded-[var(--r-l)] bg-[var(--surface)] border border-[var(--hair)] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-[var(--r-m)] flex items-center justify-center shrink-0 ${
              isPending
                ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)]'
                : isApproved
                  ? 'bg-[var(--ok-soft)] text-[var(--ok)]'
                  : isDraftCreated
                    ? 'bg-blue-500/15 text-blue-500'
                    : 'bg-[var(--sunken)] text-[var(--ink-2)]'
            }`}
          >
            {isPending ? (
              <Sparkles className="w-5 h-5 animate-pulse" />
            ) : isApproved ? (
              <Send className="w-5 h-5" />
            ) : isDraftCreated ? (
              <Mail className="w-5 h-5" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold font-display text-[var(--ink)] flex items-center gap-2">
              {isReplyStage ? 'Respuesta redactada por IA' : 'Propuesta de Pitch (IA)'}
              {isPending && (
                <span className="text-micro font-sans font-bold px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc-soft)] text-[var(--acc-ink)]">
                  Pendiente de revisión
                </span>
              )}
            </h3>
            <p className="text-xs text-[var(--ink-2)] mt-0.5">
              {isPending
                ? 'Revisa el borrador adaptado al ADN de tu banda y autoriza el despacho.'
                : isApproved
                  ? 'Propuesta aprobada — En cola de salida del Agente Enviador.'
                  : isDraftCreated
                    ? 'Borrador depositado en tu buzón — Listo para enviar.'
                    : `Estado actual: ${rawStatus}`}
            </p>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={handleApprove}
            disabled={isCreatingDraft || !editedPitch}
            className="items-center gap-2 px-4 shadow-sm"
            title="Autoriza el envío de este correo por el agente"
          >
            {isCreatingDraft ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Despachando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{isApproved ? 'Reenviar / Despachar' : 'Aprobar y Despachar'}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {draftError && (
        <div className="p-3 rounded-[var(--r-m)] bg-[var(--alert)]/10 border border-[var(--alert)]/30 text-[var(--alert)] text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{draftError}</span>
        </div>
      )}

      {feedbackSuccess && (
        <div className="p-3 rounded-[var(--r-m)] bg-[var(--ok-soft)] border border-[var(--ok)]/30 text-[var(--ok)] text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{feedbackSuccess}</span>
        </div>
      )}

      {/* 2. PITCH TOOLBAR (MODEL SELECTOR, REGENERATE, WHATSAPP, COPY, EDIT) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        <div className="flex items-center gap-2">
          {/* AI Model Selector */}
          <div className="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-[var(--r-m)] border border-[var(--hair)]">
            <button
              type="button"
              onClick={() => setSelectedModel('gemini')}
              className={`px-2.5 py-1 rounded-[var(--r-s)] text-xs font-semibold transition-colors cursor-pointer ${
                selectedModel === 'gemini'
                  ? 'bg-[var(--acc)] text-[var(--on-acc)] font-bold'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              Gemini 2.5
            </button>
            <button
              type="button"
              onClick={() => setSelectedModel('deepseek')}
              className={`px-2.5 py-1 rounded-[var(--r-s)] text-xs font-semibold transition-colors cursor-pointer ${
                selectedModel === 'deepseek'
                  ? 'bg-[var(--acc)] text-[var(--on-acc)] font-bold'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              DeepSeek V3
            </button>
          </div>

          {/* Regenerate Button */}
          <Button
            variant="neutral"
            size="xs"
            onClick={() => handleRegenerate()}
            disabled={isRegenerating}
            className="items-center gap-1.5"
            title="Vuelve a redactar el correo con nuevas variaciones basadas en el ADN de la banda"
          >
            {isRegenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--acc)]" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]" />
            )}
            <span>{isRegenerating ? 'Redactando...' : 'Regenerar'}</span>
          </Button>

          {/* Multi-model A/B Comparator */}
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setShowComparator(true)}
            className="hidden sm:inline-flex items-center gap-1.5 text-[var(--ink-2)]"
            title="Compara en paralelo propuestas generadas por DeepSeek y Gemini"
          >
            <Layers className="w-3.5 h-3.5 text-[var(--acc)]" />
            <span>Comparar A/B</span>
          </Button>
        </div>

        {/* Right Action Tools: WhatsApp, Copy, Edit */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="xs"
            onClick={onOpenWhatsAppModal}
            className="items-center gap-1.5 text-[var(--ok)] hover:bg-[var(--ok-soft)]"
            title="Llevar mensaje a WhatsApp adaptado"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[var(--ok)]" />
            <span>WhatsApp</span>
          </Button>

          <Button
            variant="ghost"
            size="xs"
            onClick={handleCopy}
            className="items-center gap-1.5"
            title="Copiar texto al portapapeles"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[var(--ok)]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </Button>

          <Button
            variant={isEditingText ? 'selected' : 'ghost'}
            size="xs"
            onClick={() => (isEditingText ? handleSaveText() : setIsEditingText(true))}
            className="items-center gap-1.5"
            title="Editar texto a mano"
          >
            {isEditingText ? <Save className="w-3.5 h-3.5 text-[var(--acc)]" /> : <Edit3 className="w-3.5 h-3.5" />}
            <span>{isEditingText ? 'Guardar' : 'Editar'}</span>
          </Button>
        </div>
      </div>

      {/* 3. PITCH CANVAS (THE CORE VIEW) */}
      <div className="w-full shrink-0 min-h-[200px] flex flex-col p-4 sm:p-5 bg-[var(--surface)] rounded-[var(--r-l)] border border-[var(--hair)] shadow-xs relative group">
        {isEditingText ? (
          <div className="flex-1 flex flex-col space-y-2">
            <Textarea
              rows={12}
              value={editedPitch}
              onChange={(e) => setEditedPitch(e.target.value)}
              className="w-full text-sm font-sans leading-relaxed p-3 rounded-[var(--r-m)] bg-[var(--bg)] border border-[var(--hair)] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--acc)] resize-y"
              placeholder="Escribe o retoca la propuesta de concierto..."
            />
            <div className="flex justify-end gap-2 pt-1">
              <Button size="xs" variant="ghost" onClick={() => setIsEditingText(false)}>
                Cancelar
              </Button>
              <Button size="xs" variant="primary" onClick={handleSaveText} className="items-center gap-1">
                <Save className="w-3.5 h-3.5" />
                <span>Guardar texto</span>
              </Button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setIsEditingText(true)}
            className="w-full text-sm font-sans text-[var(--ink)] whitespace-pre-wrap leading-relaxed cursor-text selection:bg-[var(--acc-soft)] pb-4"
            title="Haz clic para editar el texto directamente"
          >
            {editedPitch || (
              <span className="text-[var(--ink-2)] italic">
                Sin propuesta generada todavía. Pulsa el botón "Regenerar" para que el Agente Redactor redacte el pitch.
              </span>
            )}
          </div>
        )}

        {/* Subtle edit hint when hovering */}
        {!isEditingText && editedPitch && (
          <button
            type="button"
            onClick={() => setIsEditingText(true)}
            className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded-[var(--r-s)] bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)] text-micro font-medium flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <Edit3 className="w-3 h-3" />
            <span>Clic para editar</span>
          </button>
        )}
      </div>

      {/* 4. DYNAMIC FEW-SHOT & TONE LEARNING (AI TRAINING) */}
      <div className="w-full shrink-0 p-3.5 sm:p-4 rounded-[var(--r-l)] bg-[var(--sunken)]/60 border border-[var(--hair)] space-y-3 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-sans text-[var(--ink)]">
              Entrenamiento de Tono y Estilo
            </span>
            <span className="text-micro font-mono px-1.5 py-0.5 rounded bg-[var(--acc-soft)] text-[var(--acc-ink)] font-semibold">
              Dynamic Few-Shot
            </span>
          </div>
          <span className="text-micro text-[var(--ink-2)]">
            Califica para que el agente aprenda tus gustos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Tone rating */}
          <div className="p-2.5 bg-[var(--surface)] rounded-[var(--r-m)] border border-[var(--hair)] space-y-1">
            <span className="text-micro font-medium text-[var(--ink-2)] block">Tono e Intención</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={`tone-${star}`}
                  type="button"
                  onClick={() => setToneRating(star)}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    toneRating >= star ? 'text-[var(--acc)]' : 'text-[var(--hair)] hover:text-[var(--ink-2)]'
                  }`}
                  title={`Calificar tono: ${star}/5`}
                >
                  <Star className="w-4 h-4 fill-current" />
                </button>
              ))}
              <span className="text-micro font-mono text-[var(--ink-2)] ml-1">
                {toneRating > 0 ? `${toneRating}/5` : 'Sin calificar'}
              </span>
            </div>
          </div>

          {/* Content rating */}
          <div className="p-2.5 bg-[var(--surface)] rounded-[var(--r-m)] border border-[var(--hair)] space-y-1">
            <span className="text-micro font-medium text-[var(--ink-2)] block">Estructura y Contenido</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={`content-${star}`}
                  type="button"
                  onClick={() => setContentRating(star)}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    contentRating >= star ? 'text-[var(--acc)]' : 'text-[var(--hair)] hover:text-[var(--ink-2)]'
                  }`}
                  title={`Calificar contenido: ${star}/5`}
                >
                  <Star className="w-4 h-4 fill-current" />
                </button>
              ))}
              <span className="text-micro font-mono text-[var(--ink-2)] ml-1">
                {contentRating > 0 ? `${contentRating}/5` : 'Sin calificar'}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions & Prompt feedback input (Always available) */}
        <div className="space-y-2 pt-2 border-t border-[var(--hair)]/30">
          <div className="flex items-center justify-between">
            <span className="text-micro font-medium text-[var(--ink-2)]">
              Instrucción para afinar la redacción:
            </span>
            {feedbackComment && (
              <button
                type="button"
                onClick={() => setFeedbackComment('')}
                className="text-micro text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Instrucción (ej: hazlo más directo, cita que tocamos en Revenidas, pide tocar en viernes...)"
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              className="flex-1 text-xs p-2.5 rounded-[var(--r-m)] bg-[var(--surface)] border border-[var(--hair)] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--acc)]"
            />
            <Button
              variant="primary"
              size="xs"
              onClick={() => handleRegenerate()}
              disabled={isRegenerating}
              className="items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isRegenerating ? 'Redactando...' : 'Reajustar y Regenerar'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* MultiModel Comparator Modal */}
      {showComparator && (
        <MultiModelPitchComparatorModal
          isOpen={showComparator}
          onClose={() => setShowComparator(false)}
          lead={lead}
          activeCampaign={activeCampaign}
          onSelectProposal={(selectedText) => {
            setEditedPitch(selectedText);
            onUpdateLead(lead.id, { pitch_generado: selectedText });
            setShowComparator(false);
          }}
        />
      )}
    </div>
  );
};
