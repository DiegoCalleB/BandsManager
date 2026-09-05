import React, { useState, useEffect } from 'react';
import { X, Loader, AlertCircle, Wand2 } from 'lucide-react';
import { api } from '../../services/api';

export type PerfectSetlistActionType = 'reorder' | 'remove_song' | 'add_song' | 'add_block';

export interface PerfectSetlistAction {
  type: PerfectSetlistActionType;
  reason: string;
  from_position?: number;
  to_position?: number;
  item_position?: number;
  song_id?: string;
  song_title?: string;
  insert_at_position?: number;
  block_type?: string;
  title?: string;
  duracion_minutos?: number;
}

export interface PerfectSetlistPlan {
  summary: string;
  actions: PerfectSetlistAction[];
}

interface PerfectSetlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  setlistId: string;
  setlistName?: string;
  /** Ejecuta la acción concreta (reordena/quita/añade canción o bloque) contra el setlist activo.
   * `sourceKey` identifica esta acción para que su propio botón se convierta en "Deshacer"
   * mientras siga siendo la más reciente, igual que en el Análisis IA. */
  onApplyAction: (action: PerfectSetlistAction, sourceKey: string) => void;
  canUndo?: boolean;
  onUndo?: () => void;
  undoSourceKey?: string | null;
}

const BLOCK_TYPE_LABELS: Record<string, string> = {
  chapa: 'Chapa / discurso con público',
  descanso: 'Pausa / descanso',
  bis: 'Bis',
  bloque_header: 'Bloque / sección',
  interludio: 'Interludio',
  presentacion: 'Presentación de la banda',
  beatbox: 'Solo de batería/percusión',
  intro_tema: 'Intro / historia del tema',
  solo_performance: 'Solo instrumental',
  cambio_instrumento: 'Cambio de instrumento',
  otro: 'Bloque'
};

function describeAction(a: PerfectSetlistAction): { icon: string; label: string } {
  switch (a.type) {
    case 'reorder':
      return { icon: '↕️', label: `Reordenar: mover la posición ${a.from_position} a la ${a.to_position}` };
    case 'remove_song':
      return { icon: '➖', label: `Quitar del setlist: "${a.song_title || 'canción'}"` };
    case 'add_song':
      return { icon: '➕', label: `Añadir del catálogo: "${a.song_title || 'canción'}" en la posición ${a.insert_at_position}` };
    case 'add_block':
      return { icon: '📋', label: `Añadir bloque "${a.title}" (${BLOCK_TYPE_LABELS[a.block_type || ''] || a.block_type}) en la posición ${a.insert_at_position}` };
    default:
      return { icon: '•', label: 'Acción' };
  }
}

export function PerfectSetlistModal({ isOpen, onClose, setlistId, setlistName, onApplyAction, canUndo = false, onUndo, undoSourceKey = null }: PerfectSetlistModalProps) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PerfectSetlistPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Qué acciones ya se aplicaron en esta sesión del modal — igual que en el Análisis IA, tras
  // aplicar una el botón pasa a "Deshacer" solo mientras siga siendo la acción más reciente
  // (el snapshot de undo de un solo nivel no puede revertir nada anterior a eso).
  const [appliedActionIndices, setAppliedActionIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setPlan(null);
      setError(null);
      setAppliedActionIndices(new Set());
    }
  }, [isOpen, setlistId]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.generatePerfectSetlist(setlistId);
      if (result.success && result.plan) {
        setPlan(result.plan);
        setAppliedActionIndices(new Set());
      } else {
        setError(result.error || 'Error al generar el plan');
      }
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-start justify-center z-50 p-4 pt-12 pointer-events-none">
      <div className="bg-neutral-900 rounded-lg w-full max-w-2xl max-h-[85vh] overflow-y-auto border border-neutral-700 shadow-2xl pointer-events-auto">
        <div className="sticky top-0 z-10 bg-neutral-900 border-b border-neutral-700 p-3 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <Wand2 className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold">Setlist Perfecto</h2>
              {setlistName && <p className="text-xs text-neutral-400">{setlistName}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {canUndo && (
              <button
                onClick={onUndo}
                className="px-2 py-1 rounded-lg bg-amber-900/40 hover:bg-amber-800/60 text-amber-300 hover:text-amber-100 transition text-[11px] font-mono font-medium flex items-center gap-1"
                title="Deshacer el último cambio del setlist"
              >
                ↩️ Deshacer
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-lg transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {!plan && !loading && !error && (
            <div className="text-center py-8">
              <Wand2 className="w-12 h-12 text-emerald-400/50 mx-auto mb-4" />
              <p className="text-neutral-300 mb-6">
                Deja que la IA revise este setlist Y el resto de tu catálogo, y te proponga un plan
                de cambios: reordenar canciones, quitar las que no encajen, añadir otras del
                repertorio que sí, y sugerir bloques (presentación, pausa, bis...) donde falten.
              </p>
              <button
                onClick={handleGenerate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition font-medium"
              >
                Generar Plan
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <Loader className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-4" />
              <p className="text-neutral-400">Analizando setlist y catálogo...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-200">Error</p>
                <p className="text-sm text-red-300">{error}</p>
                <button onClick={handleGenerate} className="mt-3 text-sm text-red-300 hover:text-red-200 underline">
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {plan && (
            <div className="space-y-4">
              <div className="bg-neutral-800 rounded-lg p-3 border border-neutral-700">
                <p className="text-xs text-neutral-400 mb-1.5">🪄 Resumen del plan</p>
                <p className="text-sm text-neutral-200">{plan.summary}</p>
              </div>

              {plan.actions.length === 0 && (
                <p className="text-sm text-neutral-400 text-center py-4">
                  Este setlist ya está bien construido — no hay cambios que proponer ahora mismo.
                </p>
              )}

              <div className="space-y-2">
                {plan.actions.map((action, idx) => {
                  const { icon, label } = describeAction(action);
                  const sourceKey = `perfect-setlist-${idx}`;
                  const isCurrentUndo = undoSourceKey === sourceKey;
                  const isApplied = appliedActionIndices.has(idx);

                  return (
                    <div key={idx} className="rounded-lg p-3 border bg-neutral-800 border-neutral-700 flex items-start gap-2.5">
                      <span className="text-sm mt-0.5">{icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-neutral-100">{label}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">{action.reason}</p>
                      </div>
                      {isCurrentUndo ? (
                        <button
                          type="button"
                          onClick={() => {
                            onUndo?.();
                            setAppliedActionIndices(prev => {
                              const next = new Set(prev);
                              next.delete(idx);
                              return next;
                            });
                          }}
                          className="shrink-0 px-2 py-0.5 rounded bg-amber-900/40 hover:bg-amber-800/60 text-amber-300 hover:text-amber-100 font-bold text-[10px] font-mono transition whitespace-nowrap"
                          title="Deshacer este cambio"
                        >
                          ↩️ Deshacer
                        </button>
                      ) : isApplied ? (
                        <span className="shrink-0 text-[10px] text-emerald-400 font-mono font-medium whitespace-nowrap">✓ Aplicado</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onApplyAction(action, sourceKey);
                            setAppliedActionIndices(prev => new Set(prev).add(idx));
                          }}
                          className="shrink-0 px-2 py-0.5 rounded bg-emerald-700/50 hover:bg-emerald-600 text-emerald-100 font-bold text-[10px] font-mono transition whitespace-nowrap"
                          title="Aplicar este cambio al setlist"
                        >
                          ✓ Aplicar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {plan && (
          <div className="px-4 pb-4 flex gap-3">
            <button
              onClick={handleGenerate}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition font-medium text-sm"
            >
              🔄 Regenerar
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded-lg transition font-medium text-sm"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
