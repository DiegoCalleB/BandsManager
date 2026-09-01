import React, { useState } from 'react';
import { BandContact } from '../../types';
import { Sparkles, X, Check, Copy, MessageSquare, Radio, Flame, MessageCircle, HeartHandshake, Pencil, Save, XCircle, RefreshCw, Brain, GraduationCap } from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';
import { apiFetch } from '../../utils/api';
import { api } from '../../services/api';

const CATEGORY_LABELS: Record<string, string> = {
  salas: '🏛️ Salas',
  festivales: '🎪 Festivales',
  discotecas: '🪩 Discotecas',
  medios: '📻 Medios',
  grupos: '🎸 Grupos',
  managements: '💼 Managements',
  ayuntamientos: '🎉 Ayuntamientos'
};

export interface ToneAnalysisData {
  nombre_entidad?: string;
  es_emisor?: boolean;
  redes_rastreadas?: string[];
  tono_comunicacion?: string;
  tratamiento_habitual?: string;
  nivel_energia?: string;
  vocabulario_clave?: string[];
  frases_emblematicas_extraidas?: string[];
  emojis_frecuentes?: string[];
  valores_e_intereses?: string[];
  /** El tono no es idéntico en todas las redes (Facebook más institucional, TikTok más gamberro...). */
  matices_por_red?: { instagram?: string; tiktok?: string; youtube?: string; facebook?: string };
  /** Frases reales de directo (habla al público entre canciones), acumuladas desde transcripciones de conciertos ya analizados en Reels. Se generan solas, no se editan a mano aquí. */
  frases_directo_extraidas?: string[];
  puntos_fuertes_para_conectar?: string;
  recomendacion_pitch?: string;
  pitch_personalizado_ejemplo?: string;
  /** Self-Refining Tone DNA: reglas que la IA extrae sola de las correcciones del mánager a los pitches (primer contacto), separadas por categoría de destinatario. `reglas_estilo_aprendidas` se fusiona (no se sobreescribe) en cada refinamiento; `reglas_manuales` la escribe el mánager y NUNCA la toca el refinamiento automático. */
  reglas_por_categoria?: Record<string, {
    reglas_estilo_aprendidas?: string[];
    reglas_manuales?: string[];
    vocabulario_aprendido?: string[];
    terminos_a_evitar?: string[];
    actualizado?: string;
  }>;
  /** Igual que reglas_por_categoria pero para RESPUESTAS (contestaciones a una sala que ya
   * escribió) - cubo separado a propósito, ver server/db/pitchLearning.ts: corregir cómo se
   * responde a una negociación no debe enseñarle al sistema a redactar mal el primer contacto. */
  reglas_por_categoria_respuesta?: Record<string, {
    reglas_estilo_aprendidas?: string[];
    reglas_manuales?: string[];
    vocabulario_aprendido?: string[];
    terminos_a_evitar?: string[];
    actualizado?: string;
  }>;
}

/** Borrador de edición manual: los campos de lista se editan como texto y se parten al guardar. */
interface ToneDraft {
  tono_comunicacion: string;
  tratamiento_habitual: string;
  nivel_energia: string;
  vocabulario_clave: string;
  frases_emblematicas_extraidas: string;
  emojis_frecuentes: string;
  matiz_instagram: string;
  matiz_tiktok: string;
  matiz_youtube: string;
  matiz_facebook: string;
  puntos_fuertes_para_conectar: string;
  recomendacion_pitch: string;
}

function toDraft(toneData: ToneAnalysisData | null): ToneDraft {
  return {
    tono_comunicacion: toneData?.tono_comunicacion || '',
    tratamiento_habitual: toneData?.tratamiento_habitual || '',
    nivel_energia: toneData?.nivel_energia || '',
    vocabulario_clave: (toneData?.vocabulario_clave || []).join(', '),
    frases_emblematicas_extraidas: (toneData?.frases_emblematicas_extraidas || []).join('\n'),
    emojis_frecuentes: (toneData?.emojis_frecuentes || []).join(' '),
    matiz_instagram: toneData?.matices_por_red?.instagram || '',
    matiz_tiktok: toneData?.matices_por_red?.tiktok || '',
    matiz_youtube: toneData?.matices_por_red?.youtube || '',
    matiz_facebook: toneData?.matices_por_red?.facebook || '',
    puntos_fuertes_para_conectar: toneData?.puntos_fuertes_para_conectar || '',
    recomendacion_pitch: toneData?.recomendacion_pitch || '',
  };
}

function partirLista(texto: string, separador: RegExp): string[] {
  return texto
    .split(separador)
    .map((s) => s.trim())
    .filter(Boolean);
}

interface BandToneModalProps {
  isOpen: boolean;
  onClose: () => void;
  band: BandContact | null;
  isStitchLight?: boolean;
  toneData: ToneAnalysisData | null;
  isLoading: boolean;
  /** Si el backend confirmó que este análisis quedó guardado de forma permanente (Supabase). */
  isSaved?: boolean;
  /**
   * Solo la banda EMISORA (la propia) se puede editar a mano: un contacto de booking del CRM
   * usa otro destino de guardado (band_contacts) que este modal no toca.
   */
  editable?: boolean;
  onReAnalyze: () => void;
  onUseTailoredPitch?: (text: string) => void;
  /** Se llama tras guardar una edición manual, con el ADN ya actualizado. */
  onSaved?: (data: ToneAnalysisData) => void;
  /**
   * Refresca solo las reglas de estilo aprendidas automáticamente (dna_expresion.reglas_por_categoria)
   * sin relanzar el rastreo caro de redes sociales que sí hace onReAnalyze.
   */
  onRefreshLearnedRules?: () => Promise<void>;
}

export const BandToneModal: React.FC<BandToneModalProps> = ({
  isOpen,
  onClose,
  band,
  isStitchLight = false,
  toneData,
  isLoading,
  isSaved,
  editable = false,
  onReAnalyze,
  onUseTailoredPitch,
  onSaved,
  onRefreshLearnedRules
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ToneDraft>(() => toDraft(toneData));
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainMessage, setTrainMessage] = useState<string | null>(null);
  // Edición manual de reglas aprendidas: clave compuesta "mode:categoria" (ej. "reply:salas")
  // para poder tener en curso ediciones de pitch y de respuesta a la vez sin pisarse.
  const [savingRuleKey, setSavingRuleKey] = useState<string | null>(null);
  const [newRuleText, setNewRuleText] = useState<Record<string, string>>({});

  if (!isOpen || !band) return null;

  const getLearnedBucket = (mode: 'pitch' | 'reply') =>
    (mode === 'reply' ? toneData?.reglas_por_categoria_respuesta : toneData?.reglas_por_categoria) || {};

  // 'auto' = reglas_estilo_aprendidas (las infiere la IA, se fusionan - no se sobreescriben -
  // en cada refinamiento automático). 'manual' = reglas_manuales (las escribe el mánager, el
  // refinamiento automático nunca las toca ni las borra por su cuenta).
  const handleDeleteLearnedRule = async (mode: 'pitch' | 'reply', category: string, source: 'auto' | 'manual', ruleIndex: number) => {
    const bucket = getLearnedBucket(mode)[category];
    const field = source === 'manual' ? 'reglas_manuales' : 'reglas_estilo_aprendidas';
    const current = bucket?.[field] || [];
    const updated = current.filter((_, i) => i !== ruleIndex);
    const key = `${mode}:${category}:${source}`;
    setSavingRuleKey(key);
    try {
      await api.updateLearnedToneRules({ mode, category, [field]: updated });
      await onRefreshLearnedRules?.();
    } catch (err) {
      console.error('Error borrando regla aprendida:', err);
    } finally {
      setSavingRuleKey(null);
    }
  };

  // Añadir siempre escribe en reglas_manuales, nunca en reglas_estilo_aprendidas: así lo que el
  // mánager mete a mano queda protegido del refinamiento automático para siempre, en vez de
  // arriesgarse a que la IA lo sustituya en el siguiente "Entrenar ADN de tono ahora".
  const handleAddLearnedRule = async (mode: 'pitch' | 'reply', category: string) => {
    const key = `${mode}:${category}:manual`;
    const text = (newRuleText[key] || '').trim();
    if (!text) return;
    const current = getLearnedBucket(mode)[category]?.reglas_manuales || [];
    setSavingRuleKey(key);
    try {
      await api.updateLearnedToneRules({ mode, category, reglas_manuales: [...current, text] });
      setNewRuleText(prev => ({ ...prev, [key]: '' }));
      await onRefreshLearnedRules?.();
    } catch (err) {
      console.error('Error añadiendo regla manual:', err);
    } finally {
      setSavingRuleKey(null);
    }
  };

  const handleTrainToneDna = async () => {
    setIsTraining(true);
    setTrainMessage(null);
    try {
      const res = await api.trainToneDna();
      setTrainMessage(res.message || (res.success ? 'Entrenamiento ejecutado.' : 'No se pudo entrenar el ADN de tono.'));
      if (res.success) await onRefreshLearnedRules?.();
    } catch (err: any) {
      console.error('Error entrenando el ADN de tono:', err);
      setTrainMessage(err?.message || 'Error de conexión al entrenar el ADN de tono.');
    } finally {
      setIsTraining(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleStartEdit = () => {
    setDraft(toDraft(toneData));
    setSaveError(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const cambios = {
        tono_comunicacion: draft.tono_comunicacion.trim(),
        tratamiento_habitual: draft.tratamiento_habitual.trim(),
        nivel_energia: draft.nivel_energia.trim(),
        vocabulario_clave: partirLista(draft.vocabulario_clave, /[,\n]/),
        frases_emblematicas_extraidas: partirLista(draft.frases_emblematicas_extraidas, /\n/),
        emojis_frecuentes: partirLista(draft.emojis_frecuentes, /[\s,]+/),
        matices_por_red: {
          instagram: draft.matiz_instagram.trim(),
          tiktok: draft.matiz_tiktok.trim(),
          youtube: draft.matiz_youtube.trim(),
          facebook: draft.matiz_facebook.trim(),
        },
        puntos_fuertes_para_conectar: draft.puntos_fuertes_para_conectar.trim(),
        recomendacion_pitch: draft.recomendacion_pitch.trim(),
      };
      const res = await apiFetch('/api/bands/tone-dna', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cambios)
      });
      const json = res as any;
      if (json?.success && json.data) {
        onSaved?.(json.data);
        setIsEditing(false);
      } else {
        setSaveError(json?.error || 'No se pudo guardar la edición.');
      }
    } catch (err: any) {
      console.error('Error guardando edición del ADN de tono:', err);
      setSaveError(err?.message || 'Error de conexión al guardar.');
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = `w-full p-2 rounded-lg font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-500/50 ${
    isStitchLight
      ? 'bg-white border border-slate-200 text-slate-800'
      : 'bg-black/40 border border-neutral-800 text-neutral-100'
  }`;
  const labelClass = 'text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400 block mb-1';

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto overscroll-contain">
        <div className={`w-full max-w-2xl rounded-2xl p-6 space-y-5 shadow-2xl relative overflow-hidden my-auto max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 ${
          isStitchLight ? 'bg-white text-slate-800' : 'bg-[#1c1b1b] text-neutral-100'
        }`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-display uppercase tracking-wider text-amber-400">
                Análisis de ADN de Expresión y Tono: {band.nombre_banda}
              </h3>
              <p className="text-[10px] text-neutral-400 font-mono">
                Rastreo IA Grounding de redes sociales y notas de prensa oficiales
              </p>
              {!isLoading && toneData && !isEditing && isSaved !== undefined && (
                isSaved ? (
                  <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                    <Check className="w-3 h-3" /> Guardado: la IA usará este tono en tus próximos Reels, Shorts y TikToks
                  </p>
                ) : (
                  <p className="text-[10px] text-amber-500 font-mono mt-0.5">
                    ⚠️ No se pudo guardar de forma permanente. Vuelve a analizarlo antes de usarlo en tus próximos posts.
                  </p>
                )
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {editable && !isLoading && toneData && !isEditing && (
              <button
                onClick={onReAnalyze}
                className="p-1.5 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer text-neutral-400 hover:text-amber-400"
                title="Volver a rastrear redes con IA (sustituye lo que haya, incluidas ediciones a mano)"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            {editable && !isLoading && toneData && !isEditing && (
              <button
                onClick={handleStartEdit}
                className="p-1.5 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer text-neutral-400 hover:text-amber-400"
                title="Editar a mano"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-neutral-400" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 animate-spin">
              <Radio className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold font-mono text-amber-400 uppercase tracking-widest">
                Scrapeando redes sociales de {band.nombre_banda}...
              </h4>
              <p className="text-[10px] text-neutral-400 font-mono max-w-md">
                Analizando publicaciones de Instagram, TikTok, estilo de comunicación, muletillas y tono de voz con Gemini Search Grounding...
              </p>
            </div>
          </div>
        ) : isEditing ? (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div>
                <label className={labelClass}>Tono General</label>
                <input
                  className={inputClass}
                  value={draft.tono_comunicacion}
                  onChange={(e) => setDraft({ ...draft, tono_comunicacion: e.target.value })}
                  placeholder="Cercano, directo, gamberro..."
                />
              </div>
              <div>
                <label className={labelClass}>Tratamiento</label>
                <input
                  className={inputClass}
                  value={draft.tratamiento_habitual}
                  onChange={(e) => setDraft({ ...draft, tratamiento_habitual: e.target.value })}
                  placeholder="Tú / Vosotros..."
                />
              </div>
              <div>
                <label className={labelClass}>Nivel de Energía</label>
                <input
                  className={inputClass}
                  value={draft.nivel_energia}
                  onChange={(e) => setDraft({ ...draft, nivel_energia: e.target.value })}
                  placeholder="Alta / Explosiva..."
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Vocabulario Clave & Muletillas (separadas por comas)</label>
              <input
                className={inputClass}
                value={draft.vocabulario_clave}
                onChange={(e) => setDraft({ ...draft, vocabulario_clave: e.target.value })}
                placeholder="familia, pogo, aúpa..."
              />
            </div>

            <div>
              <label className={labelClass}>Emojis que usáis (separados por espacios)</label>
              <input
                className={inputClass}
                value={draft.emojis_frecuentes}
                onChange={(e) => setDraft({ ...draft, emojis_frecuentes: e.target.value })}
                placeholder="🔥 ⚡ 🎷"
              />
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Matices de tono por red (no hablan igual en todas)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  className={inputClass}
                  value={draft.matiz_instagram}
                  onChange={(e) => setDraft({ ...draft, matiz_instagram: e.target.value })}
                  placeholder="Instagram: igual que el tono general..."
                />
                <input
                  className={inputClass}
                  value={draft.matiz_tiktok}
                  onChange={(e) => setDraft({ ...draft, matiz_tiktok: e.target.value })}
                  placeholder="TikTok: más gamberro y directo..."
                />
                <input
                  className={inputClass}
                  value={draft.matiz_youtube}
                  onChange={(e) => setDraft({ ...draft, matiz_youtube: e.target.value })}
                  placeholder="YouTube: más explicativo..."
                />
                <input
                  className={inputClass}
                  value={draft.matiz_facebook}
                  onChange={(e) => setDraft({ ...draft, matiz_facebook: e.target.value })}
                  placeholder="Facebook: más institucional..."
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Expresiones reales suyas (una por línea)</label>
              <textarea
                rows={3}
                className={inputClass}
                value={draft.frases_emblematicas_extraidas}
                onChange={(e) => setDraft({ ...draft, frases_emblematicas_extraidas: e.target.value })}
                placeholder={'nos vemos en las trincheras\naúpa familia'}
              />
            </div>

            <div>
              <label className={labelClass}>Punto de Conexión</label>
              <textarea
                rows={2}
                className={inputClass}
                value={draft.puntos_fuertes_para_conectar}
                onChange={(e) => setDraft({ ...draft, puntos_fuertes_para_conectar: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>Recomendación de Contacto</label>
              <textarea
                rows={2}
                className={inputClass}
                value={draft.recomendacion_pitch}
                onChange={(e) => setDraft({ ...draft, recomendacion_pitch: e.target.value })}
              />
            </div>

            {saveError && (
              <p className="text-[10px] font-mono text-red-400">{saveError}</p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-mono font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Save className="w-3.5 h-3.5" /> {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-300 font-mono font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <XCircle className="w-3.5 h-3.5" /> Cancelar
              </button>
            </div>
          </div>
        ) : toneData ? (
          <div className="space-y-4">
            {/* 1. Main Tone Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[10px] font-mono">
              <div className={`p-3 rounded-xl border ${isStitchLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900 border-neutral-800'}`}>
                <span className="text-neutral-500 uppercase tracking-wider block text-[9px]">Tono General</span>
                <span className="font-bold text-amber-400 block text-xs mt-0.5">
                  {toneData.tono_comunicacion || 'No especificado'}
                </span>
              </div>

              <div className={`p-3 rounded-xl border ${isStitchLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900 border-neutral-800'}`}>
                <span className="text-neutral-500 uppercase tracking-wider block text-[9px]">Tratamiento</span>
                <span className="font-bold text-sky-400 block text-xs mt-0.5">
                  {toneData.tratamiento_habitual || 'Tú / Informal'}
                </span>
              </div>

              <div className={`p-3 rounded-xl border ${isStitchLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900 border-neutral-800'}`}>
                <span className="text-neutral-500 uppercase tracking-wider block text-[9px]">Nivel de Energía</span>
                <span className="font-bold text-emerald-400 block text-xs mt-0.5">
                  {toneData.nivel_energia || 'Alta / Explosiva'}
                </span>
              </div>
            </div>

            {/* 2. Key Vocabulary, Quotes & Emojis */}
            <div className={`p-3.5 rounded-xl border space-y-2.5 ${isStitchLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900/60 border-neutral-800'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" /> Vocabulario Clave & Muletillas
                </span>
                {toneData.emojis_frecuentes && toneData.emojis_frecuentes.length > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-[9px] font-mono text-neutral-500 uppercase mr-1">Emojis:</span>
                    {toneData.emojis_frecuentes.map((e, idx) => (
                      <span key={idx}>{e}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {toneData.vocabulario_clave && toneData.vocabulario_clave.length > 0 ? (
                  toneData.vocabulario_clave.map((word, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-md text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20"
                    >
                      #{word}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] font-mono text-neutral-500">No se detectaron términos específicos.</span>
                )}
              </div>

              {/* Extracted Quotes from Reels/Posts */}
              {toneData.frases_emblematicas_extraidas && toneData.frases_emblematicas_extraidas.length > 0 && (
                <div className="pt-1.5 border-t border-neutral-800 space-y-1">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-400/90 block">
                    💬 Expresiones extraídas de sus Reels & Posts:
                  </span>
                  <div className="space-y-1">
                    {toneData.frases_emblematicas_extraidas.map((quote, idx) => (
                      <p key={idx} className="text-[10px] font-mono italic text-neutral-300 bg-black/30 p-1.5 rounded border border-neutral-800/60">
                        "{quote}"
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Frases reales de directo: se acumulan solas desde transcripciones de conciertos, no se editan aquí. */}
              {toneData.frases_directo_extraidas && toneData.frases_directo_extraidas.length > 0 && (
                <div className="pt-1.5 border-t border-neutral-800 space-y-1">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-400/90 block">
                    🎤 Frases reales dichas en directo (de vuestros propios conciertos):
                  </span>
                  <div className="space-y-1">
                    {toneData.frases_directo_extraidas.map((quote, idx) => (
                      <p key={idx} className="text-[10px] font-mono italic text-neutral-300 bg-black/30 p-1.5 rounded border border-neutral-800/60">
                        "{quote}"
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Per-platform tone nuances: el tono no es idéntico en todas las redes. */}
              {toneData.matices_por_red && Object.values(toneData.matices_por_red).some((v) => v && v.trim()) && (
                <div className="pt-1.5 border-t border-neutral-800 space-y-1.5">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-sky-400/90 block">
                    🎚️ Matices de tono según la red:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {([
                      ['instagram', 'Instagram'],
                      ['tiktok', 'TikTok'],
                      ['youtube', 'YouTube'],
                      ['facebook', 'Facebook'],
                    ] as const).map(([key, label]) =>
                      toneData.matices_por_red?.[key] ? (
                        <p key={key} className="text-[10px] font-mono text-neutral-300 bg-black/30 p-1.5 rounded border border-neutral-800/60">
                          <span className="text-sky-400 font-bold">{label}:</span> {toneData.matices_por_red[key]}
                        </p>
                      ) : null
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Pitch Recommendation & Connection Points */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px]">
              <div className={`p-3 rounded-xl border space-y-1 ${isStitchLight ? 'bg-amber-50/50 border-amber-200 text-amber-900' : 'bg-amber-950/20 border-amber-900/40 text-amber-200'}`}>
                <span className="font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1 text-[9px]">
                  <Flame className="w-3 h-3" /> Punto de Conexión con Bakandeya
                </span>
                <p className="font-sans leading-relaxed text-[11px]">
                  {toneData.puntos_fuertes_para_conectar || 'Intercambio de público festivo y potencia en directo.'}
                </p>
              </div>

              <div className={`p-3 rounded-xl border space-y-1 ${isStitchLight ? 'bg-sky-50/50 border-sky-200 text-sky-900' : 'bg-sky-950/20 border-sky-900/40 text-sky-200'}`}>
                <span className="font-mono font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1 text-[9px]">
                  <HeartHandshake className="w-3 h-3" /> Recomendación de Contacto
                </span>
                <p className="font-sans leading-relaxed text-[11px]">
                  {toneData.recomendacion_pitch || 'Escríbeles con energía, sin rodeos y proponiendo directo compartido.'}
                </p>
              </div>
            </div>

            {/* 4. Tailored Pitch Example */}
            {toneData.pitch_personalizado_ejemplo && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" /> Pitch Adaptado a su Forma de Expresarse
                  </label>
                  <button
                    onClick={() => handleCopy(toneData.pitch_personalizado_ejemplo || '')}
                    className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono text-[9px] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? '¡Copiado!' : 'Copiar Texto'}
                  </button>
                </div>

                <textarea
                  readOnly
                  rows={6}
                  value={toneData.pitch_personalizado_ejemplo}
                  className={`w-full p-3 rounded-xl font-mono text-[10px] leading-relaxed focus:outline-none ${
                    isStitchLight
                      ? 'bg-slate-50 border border-slate-200 text-slate-800'
                      : 'bg-black/60 border border-neutral-800 text-neutral-200'
                  }`}
                />

                {onUseTailoredPitch && (
                  <button
                    onClick={() => {
                      onUseTailoredPitch(toneData.pitch_personalizado_ejemplo || '');
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/20 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Usar este Pitch Personalizado en Co-Booking
                  </button>
                )}
              </div>
            )}

            {/* 5. Self-Refining Tone DNA: reglas aprendidas automáticamente de correcciones del mánager */}
            {editable && (
              <div className={`p-3.5 rounded-xl border space-y-2.5 ${isStitchLight ? 'bg-violet-50/50 border-violet-200' : 'bg-violet-950/20 border-violet-900/40'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5" /> Reglas Aprendidas de tus Correcciones (Self-Refining Tone DNA)
                  </span>
                  <button
                    onClick={handleTrainToneDna}
                    disabled={isTraining}
                    className="px-2 py-1 rounded bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 font-mono text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                    title="Fuerza el análisis de tus correcciones acumuladas ahora mismo, en vez de esperar al refinamiento automático"
                  >
                    {isTraining ? <RefreshCw className="w-3 h-3 animate-spin" /> : <GraduationCap className="w-3 h-3" />}
                    {isTraining ? 'Entrenando...' : 'Entrenar ADN de tono ahora'}
                  </button>
                </div>

                {trainMessage && (
                  <p className="text-[10px] font-mono text-violet-300/90">{trainMessage}</p>
                )}

                {(toneData.reglas_por_categoria && Object.keys(toneData.reglas_por_categoria).length > 0) ? (
                  <div className="space-y-2">
                    {Object.entries(toneData.reglas_por_categoria).map(([cat, reglas]) => {
                      const autoKey = `pitch:${cat}:auto`;
                      const manualKey = `pitch:${cat}:manual`;
                      const savingAuto = savingRuleKey === autoKey;
                      const savingManual = savingRuleKey === manualKey;
                      return (
                        <div key={cat} className="p-2.5 rounded-lg bg-black/30 border border-violet-900/30 space-y-1.5">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-violet-300">
                            {CATEGORY_LABELS[cat] || cat}
                          </span>
                          {reglas.reglas_manuales && reglas.reglas_manuales.length > 0 && (
                            <ul className="space-y-0.5">
                              {reglas.reglas_manuales.map((r, idx) => (
                                <li key={idx} className="text-[10px] font-sans text-amber-200 flex items-start justify-between gap-1.5 group">
                                  <span>🔒 {r}</span>
                                  <button
                                    onClick={() => handleDeleteLearnedRule('pitch', cat, 'manual', idx)}
                                    disabled={savingManual}
                                    title="Quitar esta regla manual"
                                    className="shrink-0 opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 transition-opacity cursor-pointer disabled:opacity-50"
                                  >
                                    ✕
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                          {reglas.reglas_estilo_aprendidas && reglas.reglas_estilo_aprendidas.length > 0 && (
                            <ul className="space-y-0.5">
                              {reglas.reglas_estilo_aprendidas.map((r, idx) => (
                                <li key={idx} className="text-[10px] font-sans text-neutral-300 flex items-start justify-between gap-1.5 group">
                                  <span>⭐ {r}</span>
                                  <button
                                    onClick={() => handleDeleteLearnedRule('pitch', cat, 'auto', idx)}
                                    disabled={savingAuto}
                                    title="Quitar esta regla (p. ej. si contradice tu configuración manual)"
                                    className="shrink-0 opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 transition-opacity cursor-pointer disabled:opacity-50"
                                  >
                                    ✕
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                          {reglas.vocabulario_aprendido && reglas.vocabulario_aprendido.length > 0 && (
                            <p className="text-[9px] font-mono text-emerald-400/80">
                              Vocabulario favorito: {reglas.vocabulario_aprendido.join(', ')}
                            </p>
                          )}
                          {reglas.terminos_a_evitar && reglas.terminos_a_evitar.length > 0 && (
                            <p className="text-[9px] font-mono text-red-400/80">
                              Términos prohibidos: {reglas.terminos_a_evitar.join(', ')}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 pt-1">
                            <input
                              type="text"
                              value={newRuleText[manualKey] || ''}
                              onChange={(e) => setNewRuleText(prev => ({ ...prev, [manualKey]: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleAddLearnedRule('pitch', cat); }}
                              placeholder="🔒 + añadir regla manual (protegida)..."
                              disabled={savingManual}
                              className="flex-1 px-2 py-1 rounded bg-black/40 border border-neutral-800 text-[10px] text-zinc-200 font-sans focus:outline-none focus:border-violet-500 disabled:opacity-50"
                            />
                            <button
                              onClick={() => handleAddLearnedRule('pitch', cat)}
                              disabled={savingManual || !(newRuleText[manualKey] || '').trim()}
                              className="px-2 py-1 rounded bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 text-[10px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-default"
                            >
                              {savingManual ? '...' : 'Añadir'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] font-mono text-neutral-500">
                    Todavía no hay reglas aprendidas. Corrige al menos 2 pitches para la misma categoría (Salas, Festivales...) y se generarán solas, o pulsa "Entrenar ADN de tono ahora". Para no esperar a eso, puedes pegar directamente conversaciones reales buenas en <strong className="text-violet-300">Booking CRM → Plantillas de Email → Hilos de Email de Ejemplo</strong>.
                  </p>
                )}
                <p className="text-[9px] font-mono text-neutral-600">
                  🔒 = regla escrita a mano, nunca se pierde al re-entrenar &nbsp;·&nbsp; ⭐ = detectada por la IA, se fusiona con lo anterior en cada re-entrenamiento
                </p>
              </div>
            )}

            {/* 6. Self-Refining Tone DNA de RESPUESTAS: cubo separado del de pitches (arriba) -
                corregir cómo se contesta a una negociación no debe enseñarle al sistema a
                redactar mal el primer contacto, y viceversa. Mismo botón de entrenar sirve para
                ambos (refineAllToneDnaCategoriesForBand refina las dos bolsas de una vez). */}
            {editable && (
              <div className={`p-3.5 rounded-xl border space-y-2.5 ${isStitchLight ? 'bg-sky-50/50 border-sky-200' : 'bg-sky-950/20 border-sky-900/40'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5" /> Reglas Aprendidas de tus RESPUESTAS a salas (Self-Refining Tone DNA)
                  </span>
                  <button
                    onClick={handleTrainToneDna}
                    disabled={isTraining}
                    className="px-2 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-mono text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                    title="Fuerza el análisis de tus correcciones acumuladas ahora mismo (pitches y respuestas), en vez de esperar al refinamiento automático"
                  >
                    {isTraining ? <RefreshCw className="w-3 h-3 animate-spin" /> : <GraduationCap className="w-3 h-3" />}
                    {isTraining ? 'Entrenando...' : 'Entrenar ADN de tono ahora'}
                  </button>
                </div>

                {(toneData.reglas_por_categoria_respuesta && Object.keys(toneData.reglas_por_categoria_respuesta).length > 0) ? (
                  <div className="space-y-2">
                    {Object.entries(toneData.reglas_por_categoria_respuesta).map(([cat, reglas]) => {
                      const autoKey = `reply:${cat}:auto`;
                      const manualKey = `reply:${cat}:manual`;
                      const savingAuto = savingRuleKey === autoKey;
                      const savingManual = savingRuleKey === manualKey;
                      return (
                        <div key={cat} className="p-2.5 rounded-lg bg-black/30 border border-sky-900/30 space-y-1.5">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-sky-300">
                            {CATEGORY_LABELS[cat] || cat}
                          </span>
                          {reglas.reglas_manuales && reglas.reglas_manuales.length > 0 && (
                            <ul className="space-y-0.5">
                              {reglas.reglas_manuales.map((r, idx) => (
                                <li key={idx} className="text-[10px] font-sans text-amber-200 flex items-start justify-between gap-1.5 group">
                                  <span>🔒 {r}</span>
                                  <button
                                    onClick={() => handleDeleteLearnedRule('reply', cat, 'manual', idx)}
                                    disabled={savingManual}
                                    title="Quitar esta regla manual"
                                    className="shrink-0 opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 transition-opacity cursor-pointer disabled:opacity-50"
                                  >
                                    ✕
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                          {reglas.reglas_estilo_aprendidas && reglas.reglas_estilo_aprendidas.length > 0 && (
                            <ul className="space-y-0.5">
                              {reglas.reglas_estilo_aprendidas.map((r, idx) => (
                                <li key={idx} className="text-[10px] font-sans text-neutral-300 flex items-start justify-between gap-1.5 group">
                                  <span>⭐ {r}</span>
                                  <button
                                    onClick={() => handleDeleteLearnedRule('reply', cat, 'auto', idx)}
                                    disabled={savingAuto}
                                    title="Quitar esta regla (p. ej. si contradice tu configuración manual de Estrategias de Respuesta)"
                                    className="shrink-0 opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 transition-opacity cursor-pointer disabled:opacity-50"
                                  >
                                    ✕
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                          {reglas.vocabulario_aprendido && reglas.vocabulario_aprendido.length > 0 && (
                            <p className="text-[9px] font-mono text-emerald-400/80">
                              Vocabulario favorito: {reglas.vocabulario_aprendido.join(', ')}
                            </p>
                          )}
                          {reglas.terminos_a_evitar && reglas.terminos_a_evitar.length > 0 && (
                            <p className="text-[9px] font-mono text-red-400/80">
                              Términos prohibidos: {reglas.terminos_a_evitar.join(', ')}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 pt-1">
                            <input
                              type="text"
                              value={newRuleText[manualKey] || ''}
                              onChange={(e) => setNewRuleText(prev => ({ ...prev, [manualKey]: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleAddLearnedRule('reply', cat); }}
                              placeholder="🔒 + añadir regla manual (protegida)..."
                              disabled={savingManual}
                              className="flex-1 px-2 py-1 rounded bg-black/40 border border-neutral-800 text-[10px] text-zinc-200 font-sans focus:outline-none focus:border-sky-500 disabled:opacity-50"
                            />
                            <button
                              onClick={() => handleAddLearnedRule('reply', cat)}
                              disabled={savingManual || !(newRuleText[manualKey] || '').trim()}
                              className="px-2 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[10px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-default"
                            >
                              {savingManual ? '...' : 'Añadir'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] font-mono text-neutral-500">
                    Todavía no hay reglas aprendidas de respuestas. Corrige al menos 2 respuestas para la misma categoría (Salas, Festivales...) y se generarán solas, o pulsa "Entrenar ADN de tono ahora". Para no esperar a eso, puedes pegar directamente conversaciones reales buenas en <strong className="text-sky-300">Booking CRM → Plantillas de Email → Hilos de Email de Ejemplo</strong>.
                  </p>
                )}
                <p className="text-[9px] font-mono text-neutral-600">
                  🔒 = regla escrita a mano, nunca se pierde al re-entrenar &nbsp;·&nbsp; ⭐ = detectada por la IA, se fusiona con lo anterior en cada re-entrenamiento
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center space-y-3">
            <p className="text-xs text-neutral-400 font-mono">No hay análisis generado para esta banda todavía.</p>
            <button
              onClick={onReAnalyze}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              Iniciar Análisis de Tono
            </button>
          </div>
        )}
      </div>
    </div>
    </ModalPortal>
  );
};
