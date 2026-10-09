/**
 * Banner del playbook táctico y extracción de entidades del lead.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/exhaustive-deps
*/
import { ShowIcon } from "../../ui/ShowIcon";
import { Button } from "../../ui";
import { Sparkles, Calendar, Coins, Sliders } from "lucide-react";
import { VenuePitchComposer } from "./VenuePitchComposer";
import { VenuePitchFeedbackPanel } from "./VenuePitchFeedbackPanel";
import { Lead } from "../../../types";
import React, { Dispatch, SetStateAction } from "react";

/** Estado y callbacks que el contenedor inyecta a la sección. */
export interface VenuePlaybookBannerProps {
  selectedLead: Lead;
  setEditedPitch: Dispatch<SetStateAction<string>>;
  setIsEditingPitch: Dispatch<SetStateAction<boolean>>;
  isReplyStage: boolean;
  setShowMultiModelModal: Dispatch<SetStateAction<boolean>>;
  handleCopyPitch: () => void;
  copiedPitch: boolean;
  setShowWhatsAppModal: Dispatch<SetStateAction<boolean>>;
  handleApprovePitchDirectly: () => void;
  isCreatingDraft: boolean;
  activeCampaign: any;
  handleRegeneratePitchWithFeedback: (targetProvider?: "gemini" | "deepseek") => Promise<void>;
  isRegeneratingPitch: boolean;
  editedLeadInfo: Partial<Lead>;
  editedPitch: string;
  bandName: string;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  isEditingPitch: boolean;
  handleSavePitch: () => void;
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
}

/**
 * Banner del playbook táctico y extracción de entidades del lead.
 * @param props Estado y callbacks del contenedor ({@link VenuePlaybookBannerProps}).
 * @returns Sección de interfaz.
 */
export function VenuePlaybookBanner({ selectedLead, setEditedPitch, setIsEditingPitch, isReplyStage, setShowMultiModelModal, handleCopyPitch, copiedPitch, setShowWhatsAppModal, handleApprovePitchDirectly, isCreatingDraft, activeCampaign, handleRegeneratePitchWithFeedback, isRegeneratingPitch, editedLeadInfo, editedPitch, bandName, onUpdateLead, isEditingPitch, handleSavePitch, setShowFeedbackHistory, showFeedbackHistory, setToneRating, toneRating, setContentRating, contentRating, feedbackComment, setFeedbackComment, setFeedbackScope, feedbackScope, feedbackSuccessMsg, selectedAiModel, setSelectedAiModel, handleRevertPitch, isRevertingPitch }: VenuePlaybookBannerProps) {
  return (
    <>
{/* Pitch Generator Section */}
          <div className="bg-[var(--sunken)] rounded-[var(--r-m)] p-4 space-y-3800">
            {/* Tactical Playbook & Entity Extraction Banner if Available */}
            {(selectedLead.estrategia_playbook ||
              (selectedLead.fechas_propuestas_sala &&
                selectedLead.fechas_propuestas_sala.length > 0) ||
              selectedLead.condiciones_economicas_detectadas) && (
              <div className="p-3.5 bg-[var(--acc)]/40 rounded-[var(--r-m)] space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base"><ShowIcon inline emoji="⚡" /></span>
                    <div>
                      <h4 className="text-xs font-bold text-[var(--acc)] font-mono">
                        Playbook táctico y extracción de condiciones
                      </h4>
                      <p className="text-xs text-[var(--ink-2)] font-medium">
                        {selectedLead.estrategia_playbook?.titulo ||
                          "Análisis de Respuesta y Condiciones Extraídas"}
                      </p>
                    </div>
                  </div>
                  {selectedLead.estrategia_playbook?.propuesta_rapida && (
                    <Button
                      variant="primary"
                      size="xs"
                      type="button"
                      onClick={() => {
                        const quick =
                          selectedLead.estrategia_playbook?.propuesta_rapida;
                        if (quick) {
                          setEditedPitch(quick);
                          setIsEditingPitch(true);
                        }
                      }}
                      className="items-center gap-1"
                      title="Cargar la propuesta de respuesta sugerida por el playbook táctico"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Cargar propuesta rápida</span>
                    </Button>
                  )}
                </div>

                {/* Detected Entities: Dates / Economics / Tech */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-[var(--acc)]/30 text-xs">
                  {selectedLead.fechas_propuestas_sala &&
                    selectedLead.fechas_propuestas_sala.length > 0 && (
                      <div className="p-2 bg-[var(--sunken)] rounded-[var(--r-m)] space-y-1">
                        <span className="text-micro font-mono text-[var(--acc)] font-bold block flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[var(--acc)]" />
                          Fechas Propuestas:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {selectedLead.fechas_propuestas_sala.map((f, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--ink)] text-micro font-mono"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {selectedLead.condiciones_economicas_detectadas && (
                    <div className="p-2 bg-[var(--sunken)] rounded-[var(--r-m)] space-y-1">
                      <span className="text-micro font-mono text-[var(--ok)] font-bold block flex items-center gap-1">
                        <Coins className="w-3 h-3 text-[var(--ok)]" />
                        Economía Detectada:
                      </span>
                      <span className="text-xs text-[var(--ink-2)] font-mono block">
                        {selectedLead.condiciones_economicas_detectadas.tipo ||
                          "Modelo"}
                        :{" "}
                        {selectedLead.condiciones_economicas_detectadas.cifra ||
                          "n/d"}
                      </span>
                      {selectedLead.condiciones_economicas_detectadas
                        .detalles && (
                        <span className="text-micro text-[var(--ink-2)] block leading-tight">
                          {
                            selectedLead.condiciones_economicas_detectadas
                              .detalles
                          }
                        </span>
                      )}
                    </div>
                  )}

                  {selectedLead.requisitos_tecnicos_detectados &&
                    selectedLead.requisitos_tecnicos_detectados.length > 0 && (
                      <div className="p-2 bg-[var(--sunken)] rounded-[var(--r-m)] space-y-1">
                        <span className="text-micro font-mono text-[var(--acc)] font-bold block flex items-center gap-1">
                          <Sliders className="w-3 h-3 text-[var(--acc)]" />
                          Requisitos Técnicos:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {selectedLead.requisitos_tecnicos_detectados.map(
                            (r, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--ink)] text-micro"
                              >
                                {r}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>

                {selectedLead.estrategia_playbook?.pasos &&
                  selectedLead.estrategia_playbook.pasos.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-[var(--hair)]">
                      <span className="text-micro font-mono text-[var(--ink-2)] font-bold block">
                        Pasos Recomendados para Cerrar:
                      </span>
                      <ul className="space-y-0.5">
                        {selectedLead.estrategia_playbook.pasos.map(
                          (paso, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-[var(--ink-2)] flex items-start gap-1.5"
                            >
                              <span className="text-[var(--acc)] font-bold">
                                {idx + 1}.
                              </span>
                              <span>{paso}</span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
              </div>
            )}

            <VenuePitchComposer isReplyStage={isReplyStage} setShowMultiModelModal={setShowMultiModelModal} handleCopyPitch={handleCopyPitch} copiedPitch={copiedPitch} setShowWhatsAppModal={setShowWhatsAppModal} selectedLead={selectedLead} handleApprovePitchDirectly={handleApprovePitchDirectly} isCreatingDraft={isCreatingDraft} activeCampaign={activeCampaign} handleRegeneratePitchWithFeedback={handleRegeneratePitchWithFeedback} isRegeneratingPitch={isRegeneratingPitch} editedLeadInfo={editedLeadInfo} editedPitch={editedPitch} setEditedPitch={setEditedPitch} setIsEditingPitch={setIsEditingPitch} bandName={bandName} onUpdateLead={onUpdateLead} isEditingPitch={isEditingPitch} handleSavePitch={handleSavePitch} />

            <VenuePitchFeedbackPanel selectedLead={selectedLead} setShowFeedbackHistory={setShowFeedbackHistory} showFeedbackHistory={showFeedbackHistory} setToneRating={setToneRating} toneRating={toneRating} setContentRating={setContentRating} contentRating={contentRating} feedbackComment={feedbackComment} setFeedbackComment={setFeedbackComment} setFeedbackScope={setFeedbackScope} feedbackScope={feedbackScope} feedbackSuccessMsg={feedbackSuccessMsg} selectedAiModel={selectedAiModel} setSelectedAiModel={setSelectedAiModel} handleRevertPitch={handleRevertPitch} isRevertingPitch={isRevertingPitch} isRegeneratingPitch={isRegeneratingPitch} handleRegeneratePitchWithFeedback={handleRegeneratePitchWithFeedback} />
          </div>
    </>
  );
}
