import React, { useState, useEffect } from'react';
import { X, Loader, AlertCircle, Wand2, Star, Sparkles } from'lucide-react';
import { IndexChange, adjustPosition1 } from'../../utils/setlistActionPositionAdjust';
import { EnergyChart, EnergyChartPoint, EnergyChartZone } from'./EnergyChart';

/** Feedback opcional que el usuario deja al pedir un plan (nuevo o"Regenerar"): valorar con
 * estrellas + comentario libre, igual que el mismo patrón ya usado para entrenar los Reels y los
 * pitches de booking. `alcance` decide si esto queda como memoria para futuros setlists o es solo
 * un ajuste puntual para este intento. */
export interface SetlistFeedbackInput {
 intensidad_rating?: number;
 contenido_rating?: number;
 comentario?: string;
 alcance?:'este_setlist' |'global';
}

export type PerfectSetlistActionType ='reorder' |'remove_song' |'add_song' |'add_block';

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
 /** Nombre del setlist sobre el que se está trabajando AHORA — tras generar un plan esto pasa a
 * ser la copia ("... (Setlist Perfecto)"), nunca el original, para que quede claro dónde caen
 * las acciones que se apliquen. */
 setlistName?: string;
 loading: boolean;
 plan: PerfectSetlistPlan | null;
 error: string | null;
 /** Pide un plan nuevo. La PRIMERA vez, generarlo con éxito duplica el setlist activo antes de
 * que se pueda aplicar ninguna acción (lo gestiona el padre) — el original nunca se toca. Las
 * siguientes veces ("Regenerar") reutilizan esa misma copia en vez de crear otra — pasar
 * `true` (botón"Nueva copia") fuerza duplicar de nuevo aunque ya exista una. */
 onGenerate: (forceNewCopy?: boolean, feedback?: SetlistFeedbackInput) => void;
 /** Ejecuta la acción concreta (reordena/quita/añade canción o bloque) contra el setlist activo
 * (la copia). `sourceKey` identifica esta acción para que su propio botón se convierta en
 *"Deshacer" mientras siga siendo la más reciente, igual que en el Análisis IA. */
 onApplyAction: (action: PerfectSetlistAction, sourceKey: string) => void;
 canUndo?: boolean;
 onUndo?: () => void;
 undoSourceKey?: string | null;
 /** Datos del Mapa de Energía para mostrar un mini-gráfico integrado en el modal, igual que en el
 * Análisis IA — así se ve de un vistazo el efecto de aplicar cada acción sin tener que cerrar el
 * modal para mirar el gráfico grande de fondo. */
 chartData?: EnergyChartPoint[];
 yDomain?: [number, number];
 zonasEnergia?: EnergyChartZone[];
 /** Arrastrar un punto del mini-gráfico reordena el setlist directamente, igual que en el gráfico
 * grande — independiente de aplicar acciones del plan una a una. */
 onReorder?: (fromIndex: number, toIndex: number, sourceKey?: string) => void;
 /** Arrastrar un punto en vertical cambia su energía (1-20) directamente desde este mini-gráfico. */
 onEnergyChange?: (point: EnergyChartPoint, newScore: number) => void;
}

const BLOCK_TYPE_LABELS: Record<string, string> = {
 chapa:'Chapa / discurso con público',
 descanso:'Pausa / descanso',
 bis:'Bis',
 bloque_header:'Bloque / sección',
 interludio:'Interludio',
 presentacion:'Presentación de la banda',
 beatbox:'Solo de batería/percusión',
 intro_tema:'Intro / historia del tema',
 solo_performance:'Solo instrumental',
 cambio_instrumento:'Cambio de instrumento',
 otro:'Bloque'
};

/** Qué desplazamiento sufre el resto del array de items al ejecutar esta acción — se usa para
 * reajustar las posiciones de las demás acciones pendientes justo después de aplicar esta. */
function changeFromAction(a: PerfectSetlistAction): IndexChange | null {
 switch (a.type) {
 case'reorder':
 return a.from_position != null && a.to_position != null
 ? { type:'move', from: a.from_position - 1, to: a.to_position - 1 }
 : null;
 case'remove_song':
 return a.item_position != null ? { type:'remove', at: a.item_position - 1 } : null;
 case'add_song':
 case'add_block':
 return a.insert_at_position != null ? { type:'insert', at: a.insert_at_position - 1 } : null;
 default:
 return null;
 }
}

/** Reajusta las 4 posibles posiciones de UNA acción pendiente tras el cambio que dejó otra acción
 * ya aplicada. Devuelve null si alguna posición que esta acción necesita señalaba justo el item
 * que la otra acción acaba de quitar — en ese caso ya no hay forma correcta de ejecutarla. */
function adjustActionAfterChange(a: PerfectSetlistAction, change: IndexChange): PerfectSetlistAction | null {
 const from_position = adjustPosition1(a.from_position, change);
 const to_position = adjustPosition1(a.to_position, change);
 const item_position = adjustPosition1(a.item_position, change);
 const insert_at_position = adjustPosition1(a.insert_at_position, change);
 if (from_position === null || to_position === null || item_position === null || insert_at_position === null) {
 return null;
 }
 return {
 ...a,
 from_position: from_position ?? undefined,
 to_position: to_position ?? undefined,
 item_position: item_position ?? undefined,
 insert_at_position: insert_at_position ?? undefined
 };
}

function describeAction(a: PerfectSetlistAction): { icon: string; label: string } {
 switch (a.type) {
 case'reorder':
 return { icon:'↕️', label: `Reordenar: mover la posición ${a.from_position} a la ${a.to_position}` };
 case'remove_song':
 return { icon:'➖', label: `Quitar del setlist:"${a.song_title ||'canción'}"` };
 case'add_song':
 return { icon:'➕', label: `Añadir del catálogo:"${a.song_title ||'canción'}" en la posición ${a.insert_at_position}` };
 case'add_block':
 return { icon:'📋', label: `Añadir bloque"${a.title}" (${BLOCK_TYPE_LABELS[a.block_type ||''] || a.block_type}) en la posición ${a.insert_at_position}` };
 default:
 return { icon:'•', label:'Acción' };
 }
}

export function PerfectSetlistModal({ isOpen, onClose, setlistName, loading, plan, error, onGenerate, onApplyAction, canUndo = false, onUndo, undoSourceKey = null, chartData, yDomain, zonasEnergia, onReorder, onEnergyChange }: PerfectSetlistModalProps) {
 // Copia local de las acciones del plan que SÍ se reajusta tras cada"Aplicar" — el plan en sí
 // (prop) se queda fijo con las posiciones de cuando se generó, pero aplicar una acción cambia el
 // array real del setlist, y las demás acciones pendientes seguían apuntando a la posición VIEJA.
 // Antes esto hacía que solo se pudiera aplicar una con confianza: la segunda podía mover/quitar
 // el item equivocado sin avisar. Ahora, justo después de aplicar una, se reajustan las posiciones
 // de las que quedan pendientes (ver adjustActionAfterChange) para que apliquen sobre el item
 // correcto — o se marcan como ya no aplicables si la acción anterior quitó justo ese item.
 const [liveActions, setLiveActions] = useState<PerfectSetlistAction[] | null>(null);
 const [appliedActionIndices, setAppliedActionIndices] = useState<Set<number>>(new Set());
 const [invalidActionIndices, setInvalidActionIndices] = useState<Set<number>>(new Set());
 // Foto de liveActions/invalidActionIndices justo ANTES de la última acción aplicada —"Deshacer"
 // no solo debe revertir el setlist real (eso ya lo hace onUndo), también debe devolver las
 // demás acciones pendientes a las posiciones que tenían antes de que ESTA las reajustara. Un
 // solo nivel, igual que el propio snapshot de undo del setlist (solo la más reciente es deshacible).
 const [preApplySnapshot, setPreApplySnapshot] = useState<{ liveActions: PerfectSetlistAction[]; invalidActionIndices: Set<number> } | null>(null);

 // Feedback opcional para la próxima generación (nueva o"Regenerar") — mismo patrón que ya usan
 // los Reels y los pitches de booking: valorar + comentar, y decidir si se recuerda para siempre
 // o es solo un ajuste puntual de este intento.
 const [intensidadRating, setIntensidadRating] = useState(0);
 const [contenidoRating, setContenidoRating] = useState(0);
 const [comentarioFeedback, setComentarioFeedback] = useState('');
 const [feedbackScope, setFeedbackScope] = useState<'este_setlist' |'global'>('este_setlist');

 useEffect(() => {
 setLiveActions(plan ? plan.actions : null);
 setAppliedActionIndices(new Set());
 setInvalidActionIndices(new Set());
 setPreApplySnapshot(null);
 }, [plan]);

 if (!isOpen) return null;

 const currentFeedback = (): SetlistFeedbackInput | undefined => {
 if (!intensidadRating && !contenidoRating && !comentarioFeedback.trim()) return undefined;
 return {
 intensidad_rating: intensidadRating || undefined,
 contenido_rating: contenidoRating || undefined,
 comentario: comentarioFeedback.trim() || undefined,
 alcance: feedbackScope
 };
 };

 const handleGenerateWithFeedback = (forceNewCopy?: boolean) => {
 onGenerate(forceNewCopy, currentFeedback());
 // Igual que en Reels/pitches: tras pedir el plan, se limpia el formulario de feedback —
 // ya quedó aplicado a este intento y, si el alcance era"global", ya quedó guardado como memoria.
 setIntensidadRating(0);
 setContenidoRating(0);
 setComentarioFeedback('');
 };

 const handleApply = (idx: number) => {
 if (!liveActions) return;
 const action = liveActions[idx];
 const sourceKey = `perfect-setlist-${idx}`;

 setPreApplySnapshot({ liveActions, invalidActionIndices: new Set(invalidActionIndices) });
 onApplyAction(action, sourceKey);
 setAppliedActionIndices(prev => new Set(prev).add(idx));

 const change = changeFromAction(action);
 if (!change) return;
 const next = [...liveActions];
 const nextInvalid = new Set(invalidActionIndices);
 for (let i = 0; i < next.length; i++) {
 if (i === idx || appliedActionIndices.has(i) || invalidActionIndices.has(i)) continue;
 const adjusted = adjustActionAfterChange(next[i], change);
 if (adjusted === null) nextInvalid.add(i);
 else next[i] = adjusted;
 }
 setLiveActions(next);
 setInvalidActionIndices(nextInvalid);
 };

 const handleUndo = (idx: number) => {
 onUndo?.();
 setAppliedActionIndices(prev => {
 const next = new Set(prev);
 next.delete(idx);
 return next;
 });
 if (preApplySnapshot) {
 setLiveActions(preApplySnapshot.liveActions);
 setInvalidActionIndices(preApplySnapshot.invalidActionIndices);
 setPreApplySnapshot(null);
 }
 };

 const hasChart = !!chartData && chartData.length > 0 && !!yDomain;

 return (
 <div className="fixed inset-0 flex items-start justify-center z-50 p-4 pt-12 pointer-events-none">
 <div className="bg-[var(--surface)] rounded-[var(--r-s)] w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl pointer-events-auto">
 {/* Header + Mapa de Energía en un único bloque sticky, mismo patrón que el Análisis IA —
 así el gráfico se ve siempre arriba mientras se hace scroll por las acciones del plan. */}
 <div className="sticky top-0 z-10 bg-[var(--surface)]">
 <div className="border-b p-3 flex justify-between items-center">
 <div className="flex items-center gap-2.5">
 <Wand2 className="w-5 h-5 text-[var(--ok)]" />
 <div>
 <h2 className="text-base font-bold">Setlist Perfecto</h2>
 {setlistName && <p className="text-xs text-[var(--ink-2)]">{setlistName}</p>}
 </div>
 </div>
 <div className="flex items-center gap-1.5">
 {canUndo && (
 <button
 onClick={onUndo}
 className="px-2 py-1 rounded-[var(--r-s)] bg-[var(--acc-soft)] hover:bg-[var(--acc-soft)] text-[var(--acc)]/70 hover:text-[var(--acc)] transition text-[11px] font-mono font-medium flex items-center gap-1"
 title="Deshacer el último cambio del setlist"
 >
 ↩️ Deshacer
 </button>
 )}
 <button onClick={onClose} className="p-2 hover:bg-[var(--surface)]/80 rounded-[var(--r-s)] transition">
 <X className="w-4 h-4" />
 </button>
 </div>
 </div>

 {/* Mapa de Energía integrado: arrastrar un punto reordena el setlist directamente, igual
 que en el gráfico grande de fuera. */}
 {hasChart && (
 <div className="border-b p-3">
 <EnergyChart
 setlistKey="perfect-setlist"
 chartData={chartData!}
 yDomain={yDomain!}
 zonasEnergia={zonasEnergia || []}
 height={190}
 compact
 onReorder={onReorder}
 onEnergyChange={onEnergyChange}
 />
 </div>
 )}
 </div>

 <div className="p-4 space-y-4">
 {!plan && !loading && !error && (
 <div className="text-center py-8">
 <Wand2 className="w-12 h-12 text-[var(--ok)]/50 mx-auto mb-4" />
 <p className="text-[var(--ink-2)] mb-3">
 Deja que la IA revise este setlist Y el resto de tu catálogo, y te proponga un plan
 de cambios: reordenar canciones, quitar las que no encajen, añadir otras del
 repertorio que sí, y sugerir bloques (presentación, pausa, bis...) donde falten.
 </p>
 <p className="text-xs text-[var(--ink-2)] mb-6">
 No se toca este setlist: en cuanto se genere el plan, se trabaja sobre una copia nueva.
 </p>
 <button
 onClick={() => onGenerate()}
 className="bg-[var(--ok)] hover:bg-[var(--ok)] text-[var(--ink)] px-6 py-2 rounded-[var(--r-s)] transition font-medium"
 >
 Generar Plan
 </button>
 </div>
 )}

 {loading && (
 <div className="text-center py-12">
 <Loader className="w-8 h-8 animate-spin text-[var(--ok)] mx-auto mb-4" />
 <p className="text-[var(--ink-2)]">Analizando setlist y catálogo...</p>
 </div>
 )}

 {error && (
 <div className="bg-[var(--alert)]/20 border-[var(--alert)] rounded-[var(--r-s)] p-4 flex gap-3">
 <AlertCircle className="w-5 h-5 text-[var(--alert)] flex-shrink-0 mt-0.5" />
 <div>
 <p className="font-medium text-[var(--alert)]">Error</p>
 <p className="text-sm text-[var(--alert)]">{error}</p>
 <button onClick={() => onGenerate()} className="mt-3 text-sm text-[var(--alert)] hover:text-[var(--alert)] underline">
 Reintentar
 </button>
 </div>
 </div>
 )}

 {plan && liveActions && (
 <div className="space-y-4">
 <div className="bg-[var(--surface)]/80 rounded-[var(--r-s)] p-3">
 <p className="text-xs text-[var(--ink-2)] mb-1.5">🪄 Resumen del plan</p>
 <p className="text-sm text-[var(--ink-2)]">{plan.summary}</p>
 </div>

 {liveActions.length === 0 && (
 <p className="text-sm text-[var(--ink-2)] text-center py-4">
 Este setlist ya está bien construido — no hay cambios que proponer ahora mismo.
 </p>
 )}

 <div className="space-y-2">
 {liveActions.map((action, idx) => {
 const { icon, label } = describeAction(action);
 const sourceKey = `perfect-setlist-${idx}`;
 const isCurrentUndo = undoSourceKey === sourceKey;
 const isApplied = appliedActionIndices.has(idx);
 const isInvalid = invalidActionIndices.has(idx);

 return (
 <div key={idx} className={`rounded-[var(--r-s)] p-3 flex items-start gap-2.5 ${isInvalid ?'bg-[var(--surface)] opacity-50' :'bg-[var(--surface)]/80'}`}>
 <span className="text-sm mt-0.5">{icon}</span>
 <div className="flex-1">
 <p className="text-sm font-medium text-[var(--ink-2)]">{label}</p>
 <p className="text-xs text-[var(--ink-2)] mt-0.5">{action.reason}</p>
 </div>
 {isInvalid ? (
 <span className="shrink-0 text-[10px] text-[var(--ink-2)] font-mono font-medium whitespace-nowrap" title="Un cambio anterior afectó al item que esta acción necesitaba">
 ⚠️ Ya no aplica
 </span>
 ) : isCurrentUndo ? (
 <button
 type="button"
 onClick={() => handleUndo(idx)}
 className="shrink-0 px-2 py-0.5 rounded bg-[var(--acc-soft)] hover:bg-[var(--acc-soft)] text-[var(--acc)]/70 hover:text-[var(--acc)] font-bold text-[10px] font-mono transition whitespace-nowrap"
 title="Deshacer este cambio"
 >
 ↩️ Deshacer
 </button>
 ) : isApplied ? (
 <span className="shrink-0 text-[10px] text-[var(--ok)] font-mono font-medium whitespace-nowrap">✓ Aplicado</span>
 ) : (
 <button
 type="button"
 onClick={() => handleApply(idx)}
 className="shrink-0 px-2 py-0.5 rounded bg-[var(--ok)]/50 hover:bg-[var(--ok)] text-[var(--ok)] font-bold text-[10px] font-mono transition whitespace-nowrap"
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
 <div className="px-4 pb-4 space-y-2.5">
 {/* Feedback para la próxima generación — mismo patrón que ya entrena los Reels y los
 pitches de booking: valorar + comentar, y elegir si se recuerda para siempre. */}
 <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--surface)]/60 space-y-2">
 <div className="flex flex-wrap items-center gap-2">
 <div className="flex items-center gap-1">
 <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--ink-2)]">Intensidad</span>
 {[1, 2, 3, 4, 5].map((star) => (
 <button
 key={`intensidad-${star}`}
 type="button"
 onClick={() => setIntensidadRating(intensidadRating === star ? 0 : star)}
 className={`p-0.5 rounded cursor-pointer transition-colors ${intensidadRating >= star ?'text-[var(--acc)]' :'text-[var(--ink-2)] hover:text-[var(--ink-2)]'}`}
 title={`Valorar la intensidad/energía: ${star}/5`}
 >
 <Star className="w-3 h-3 fill-current" />
 </button>
 ))}
 </div>
 <div className="flex items-center gap-1">
 <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--ink-2)]">Contenido</span>
 {[1, 2, 3, 4, 5].map((star) => (
 <button
 key={`contenido-${star}`}
 type="button"
 onClick={() => setContenidoRating(contenidoRating === star ? 0 : star)}
 className={`p-0.5 rounded cursor-pointer transition-colors ${contenidoRating >= star ?'text-[var(--acc)]' :'text-[var(--ink-2)] hover:text-[var(--ink-2)]'}`}
 title={`Valorar el contenido/selección de temas: ${star}/5`}
 >
 <Star className="w-3 h-3 fill-current" />
 </button>
 ))}
 </div>
 </div>
 <textarea
 rows={2}
 value={comentarioFeedback}
 onChange={(e) => setComentarioFeedback(e.target.value)}
 placeholder="Ej:'Evita más de una balada seguida','el bis siempre un tema conocido'..."
 className="w-full p-2 bg-black/60 rounded-[var(--r-s)] text-[11px] text-[var(--ink-2)] placeholder-[var(--ink-2)] font-sans focus:outline-none focus:"
 />
 <div className="flex items-center gap-1.5 text-[10px] font-mono">
 <span className="text-[var(--ink-2)] uppercase tracking-wider">Alcance:</span>
 <button
 type="button"
 onClick={() => setFeedbackScope('este_setlist')}
 className={`px-2 py-1 rounded-[var(--r-s)] cursor-pointer transition-all ${
 feedbackScope ==='este_setlist' ?'bg-[var(--surface)]/70 text-[var(--ink)] font-bold' :'bg-transparent text-[var(--ink-2)] hover:text-[var(--ink-2)]'
 }`}
 >
 Solo este plan
 </button>
 <button
 type="button"
 onClick={() => setFeedbackScope('global')}
 className={`px-2 py-1 rounded-[var(--r-s)] cursor-pointer transition-all flex items-center gap-1 ${
 feedbackScope ==='global' ?'bg-[var(--acc)]/20 text-[var(--acc)]/70 font-bold' :'bg-transparent text-[var(--ink-2)] hover:text-[var(--ink-2)]'
 }`}
 title="La IA recordará esta corrección también para futuros setlists de la banda"
 >
 <Sparkles className="w-3 h-3" /> Recordar para siempre
 </button>
 </div>
 </div>

 <div className="flex gap-3">
 <button
 onClick={() => handleGenerateWithFeedback()}
 title="Genera un plan nuevo sobre la misma copia de trabajo, sin crear otra"
 className="flex-1 bg-[var(--ok)] hover:bg-[var(--ok)] text-[var(--ink)] px-4 py-2 rounded-[var(--r-s)] transition font-medium text-sm"
 >
 🔄 Regenerar
 </button>
 <button
 onClick={() => handleGenerateWithFeedback(true)}
 title="Crea una copia nueva desde cero en vez de reutilizar la actual"
 className="flex-1 bg-[var(--surface)]/70 hover:bg-neutral-600 text-[var(--ink-2)] px-4 py-2 rounded-[var(--r-s)] transition font-medium text-sm"
 >
 🆕 Nueva copia
 </button>
 <button
 onClick={onClose}
 className="flex-1 bg-[var(--surface)]/70 hover:bg-neutral-600 text-[var(--ink)] px-4 py-2 rounded-[var(--r-s)] transition font-medium text-sm"
 >
 Cerrar
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}
