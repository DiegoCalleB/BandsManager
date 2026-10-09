/**
 * Panel de feedback y entrenamiento IA del pitch.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
 
import { LinkButton, Textarea, Button } from "../../ui";
import { Star, MessageSquare, CheckCircle2, Loader2, Undo2, RefreshCw, RotateCcw } from "lucide-react";
import { ShowIcon } from "../../ui/ShowIcon";
import { Lead } from "../../../types";
import React, { Dispatch, SetStateAction } from "react";

/** Estado y callbacks que el contenedor inyecta a la sección. */
export interface VenuePitchFeedbackPanelProps {
  selectedLead: Lead;
  setShowFeedbackHistory: Dispatch<SetStateAction<boolean>>;
  showFeedbackHistory: boolean;
  setToneRating: Dispatch<SetStateAction<number>>;
  toneRating: number;
  setContentRating: Dispatch<SetStateAction<number>>;
  contentRating: number;
  feedbackComment: string;
  setFeedbackComment: Dispatch<SetStateAction<string>>;
  setFeedbackScope: Dispatch<SetStateAction<"este_pitch" | "global">>;
  feedbackScope: "este_pitch" | "global";
  feedbackSuccessMsg: string;
  selectedAiModel: "gemini" | "deepseek";
  setSelectedAiModel: Dispatch<SetStateAction<"gemini" | "deepseek">>;
  handleRevertPitch: (targetLogId?: string) => Promise<void>;
  isRevertingPitch: boolean;
  isRegeneratingPitch: boolean;
  handleRegeneratePitchWithFeedback: (targetProvider?: "gemini" | "deepseek") => Promise<void>;
}

/**
 * Panel de feedback y entrenamiento IA del pitch.
 * @param props Estado y callbacks del contenedor ({@link VenuePitchFeedbackPanelProps}).
 * @returns Sección de interfaz.
 */
export function VenuePitchFeedbackPanel({ selectedLead, setShowFeedbackHistory, showFeedbackHistory, setToneRating, toneRating, setContentRating, contentRating, feedbackComment, setFeedbackComment, setFeedbackScope, feedbackScope, feedbackSuccessMsg, selectedAiModel, setSelectedAiModel, handleRevertPitch, isRevertingPitch, isRegeneratingPitch, handleRegeneratePitchWithFeedback }: VenuePitchFeedbackPanelProps) {
  return (
    <>
{/* SECCIÓN DE FEEDBACK Y ENTRENAMIENTO IA DEL PITCH (DYNAMIC FEW-SHOT & SELF-REFINING TONE DNA) */}
            <div className="mt-4 p-3.5 bg-[var(--surface)]  rounded-[var(--r-m)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--acc)]/70 font-sans flex items-center gap-1.5">
                    Aprendizaje agéntico y ADN de tono
                    <span className="text-micro bg-[var(--acc)]/20 text-[var(--ink)] px-1.5 py-0.5 rounded font-sans font-normal">
                      Dynamic Few-Shot
                    </span>
                  </span>
                </div>
                {selectedLead.historial_feedback_pitch &&
                  selectedLead.historial_feedback_pitch.length > 0 && (
                    <LinkButton
                      size="xs"
                      type="button"
                      onClick={() =>
                        setShowFeedbackHistory(!showFeedbackHistory)
                      }
                    >
                      {showFeedbackHistory
                        ? "Ocultar historial"
                        : `Historial (${selectedLead.historial_feedback_pitch.length})`}
                    </LinkButton>
                  )}
              </div>

              {/* Ratings for Tone and Content */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {/* Tono Rating */}
                <div className="p-2.5 bg-[var(--sunken)] rounded-[var(--r-s)] space-y-1.5">
                  <span className="text-xs font-bold text-[var(--ink-2)] block">
                    Tono e Intención
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={`tone-${star}`}
                        type="button"
                        onClick={() => setToneRating(star)}
                        className={`p-1 rounded hover:bg-[var(--surface)] transition-colors cursor-pointer ${
                          toneRating >= star
                            ? "text-[var(--acc)]"
                            : "text-[var(--ink-2)]"
                        }`}
                        title={`Calificar tono: ${star}/5`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    ))}
                    <span className="text-micro font-sans text-[var(--ink-2)] ml-1">
                      {toneRating > 0 ? `${toneRating}/5` : "Sin calificar"}
                    </span>
                  </div>
                </div>

                {/* Content Rating */}
                <div className="p-2.5 bg-[var(--sunken)] rounded-[var(--r-s)] space-y-1.5">
                  <span className="text-xs font-bold text-[var(--ink-2)] block">
                    Contenido y Estructura
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={`content-${star}`}
                        type="button"
                        onClick={() => setContentRating(star)}
                        className={`p-1 rounded hover:bg-[var(--surface)] transition-colors cursor-pointer ${
                          contentRating >= star
                            ? "text-[var(--acc)]"
                            : "text-[var(--ink-2)]"
                        }`}
                        title={`Calificar contenido: ${star}/5`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    ))}
                    <span className="text-micro font-sans text-[var(--ink-2)] ml-1">
                      {contentRating > 0
                        ? `${contentRating}/5`
                        : "Sin calificar"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Comments Area */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--ink-2)] flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-[var(--acc)]" />
                  <span>
                    Sugerencias o comentarios para mejorar este pitch:
                  </span>
                </label>
                <Textarea
                  rows={4}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Ej:'Menciona que tocamos en el Viña Rock','Hazlo más corto y directo','Insiste en fecha para un sábado'…"
                  className="w-full min-h-[90px]"
                />
              </div>

              {/* Scope Selector: Solo este pitch vs Memoria Global Futura */}
              <div className="p-2.5 bg-[var(--sunken)] rounded-[var(--r-m)] space-y-2">
                <span className="text-micro font-bold text-[var(--ink-2)] font-sans block">
                  <ShowIcon inline emoji="🎯" />Alcance del entrenamiento IA:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    onClick={() => setFeedbackScope("este_pitch")}
                    className={`p-2 rounded-[var(--r-s)] cursor-pointer flex items-start gap-2 transition-ui ${
                      feedbackScope === "este_pitch"
                        ? "bg-[var(--acc)]/15  text-[var(--ink)]"
                        : "bg-[var(--bg)]/60 text-[var(--ink-2)] "
                    } hover:brightness-95`}
                  >
                    <input
                      type="radio"
                      name="feedbackScope"
                      checked={feedbackScope === "este_pitch"}
                      onChange={() => setFeedbackScope("este_pitch")}
                      className="mt-0.5 accent-[var(--acc)] shrink-0"
                    />
                    <div className="text-xs leading-tight">
                      <span className="font-bold text-[var(--ink)] block">
                        Solo para este pitch
                      </span>
                      <span className="text-micro opacity-80">
                        Ajuste puntual exclusivo para {selectedLead.nombre_sala}
                        .
                      </span>
                    </div>
                  </label>

                  <label
                    onClick={() => setFeedbackScope("global")}
                    className={`p-2 rounded-[var(--r-s)] cursor-pointer flex items-start gap-2 transition-ui ${
                      feedbackScope === "global"
                        ? "bg-[var(--acc)]/15  text-[var(--ink)]"
                        : "bg-[var(--bg)]/60 text-[var(--ink-2)] "
                    } hover:brightness-95`}
                  >
                    <input
                      type="radio"
                      name="feedbackScope"
                      checked={feedbackScope === "global"}
                      onChange={() => setFeedbackScope("global")}
                      className="mt-0.5 accent-[var(--acc)] shrink-0"
                    />
                    <div className="text-xs leading-tight">
                      <span className="font-bold text-[var(--acc)]/70 flex items-center gap-1">
                        Memoria general (Futuros pitches)
                      </span>
                      <span className="text-micro opacity-80">
                        El Agente Redactor lo recordará como preferencia global.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Success Banner */}
              {feedbackSuccessMsg && (
                <div className="p-2 bg-[var(--ok)]/20 rounded-[var(--r-s)] text-[var(--ink)] text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--ok)]" />
                  <span>{feedbackSuccessMsg}</span>
                </div>
              )}

              {/* Model selection pills for single-click regenerate */}
              <div className="flex items-center justify-between flex-wrap gap-2 p-2 bg-[var(--sunken)] rounded-[var(--r-m)]">
                <span className="text-micro font-sans text-[var(--ink-2)] font-bold">
                  <ShowIcon inline emoji="🤖" />Motor de Redacción y Coste:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    {
                      id: "deepseek" as const,
                      name: "DeepSeek V3 (Recomendado)",
                      cost: "~0,00014 €",
                      icon: "🚀",
                    },
                    {
                      id: "gemini" as const,
                      name: "Gemini Flash (Free Tier)",
                      cost: "~0,00018 €",
                      icon: "⚡",
                    },
                  ].map((m) => {
                    const isSelected = selectedAiModel === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedAiModel(m.id)}
                        className={`px-2 py-1 rounded-[var(--r-pill)] text-micro font-bold flex items-center gap-1.5 transition-ui cursor-pointer ${
                          isSelected
                            ? "bg-[var(--acc)]/20 text-[var(--ink)] "
                            : "bg-[var(--bg)]/60 text-[var(--ink-2)] "
                        } hover:brightness-95`}
                        title={`Coste aproximado por pitch: ${m.cost}`}
                      >
                        <span><ShowIcon inline emoji={m.icon} /></span>
                        <span>{m.name}</span>
                        <span className="font-sans text-micro text-[var(--ok)] bg-[var(--sunken)] px-1 py-0.2 rounded">
                          {m.cost}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2 pt-1">
                {selectedLead.historial_feedback_pitch &&
                  selectedLead.historial_feedback_pitch.some(
                    (l) => !l.deshecho && l.pitch_previo,
                  ) && (
                    <Button
                      variant="neutral"
                      size="sm"
                      type="button"
                      onClick={() => handleRevertPitch()}
                      disabled={isRevertingPitch || isRegeneratingPitch}
                      className="items-center justify-center gap-1.5"
                      title="Deshacer el último entrenamiento y restaurar la versión del pitch anterior"
                    >
                      {isRevertingPitch ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--acc)]" />
                      ) : (
                        <Undo2 className="w-3.5 h-3.5 text-[var(--acc)]" />
                      )}
                      <span>Deshacer y volver al pitch anterior</span>
                    </Button>
                  )}

                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  onClick={() => handleRegeneratePitchWithFeedback()}
                  disabled={isRegeneratingPitch || isRevertingPitch}
                  className="items-center justify-center gap-2"
                >
                  {isRegeneratingPitch ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        Entrenando{" "}
                        {selectedAiModel === "deepseek" ? "DeepSeek" : "Gemini"}
                        ...
                      </span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>
                        Reescribir con{" "}
                        {selectedAiModel === "deepseek"
                          ? "DeepSeek V3"
                          : "Gemini Flash"}
                      </span>
                    </>
                  )}
                </Button>
              </div>

              {/* History drawer if enabled */}
              {showFeedbackHistory &&
                selectedLead.historial_feedback_pitch &&
                selectedLead.historial_feedback_pitch.length > 0 && (
                  <div className="mt-3 pt-3800 space-y-2">
                    <span className="text-xs font-bold text-[var(--acc)] font-sans block">
                      Historial de aprendizaje e iteraciones IA
                    </span>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {selectedLead.historial_feedback_pitch.map((log) => (
                        <div
                          key={log.id}
                          className={`p-2.5 rounded-[var(--r-s)] text-xs space-y-1.5 transition-ui ${
                            log.deshecho
                              ? "bg-[var(--sunken)]/50 opacity-60"
                              : "bg-[var(--sunken)]/80"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[var(--ink-2)] text-micro font-sans">
                            <span>{new Date(log.fecha).toLocaleString()}</span>
                            <div className="flex items-center gap-2">
                              {log.alcance === "global" ? (
                                <span className="px-1.5 py-0.5 bg-[var(--acc)]/20 text-[var(--ink)] rounded text-micro font-bold flex items-center gap-1">
                                  Memoria global
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 bg-[var(--sunken)] text-[var(--ink-2)] rounded text-micro">
                                  Solo este pitch
                                </span>
                              )}
                              <span>
                                Tono:{" "}
                                {log.tono_rating ? `${log.tono_rating}/5` : "-"}{" "}
                                | Contenido:{" "}
                                {log.contenido_rating
                                  ? `${log.contenido_rating}/5`
                                  : "-"}
                              </span>
                              {log.deshecho && (
                                <span className="px-1.5 py-0.5 bg-[var(--acc-soft)] text-[var(--acc)] rounded text-micro font-bold">
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
                            <div className="flex items-center justify-between pt-1800/60">
                              <span
                                className="text-micro text-[var(--ink-2)] font-sans truncate max-w-[220px]"
                                title={log.pitch_previo}
                              >
                                Pitch previo: {log.pitch_previo.slice(0, 38)}...
                              </span>
                              <LinkButton
                                size="xs"
                                type="button"
                                onClick={() => handleRevertPitch(log.id)}
                                disabled={isRevertingPitch}
                                className="shrink-0"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Volver a este pitch anterior
                              </LinkButton>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
    </>
  );
}
