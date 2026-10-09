/**
 * Banner del flujo de agentes y subestado agéntico del lead.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any
*/
import { Sparkles, Loader2, CheckCircle2, Send } from "lucide-react";
import { Button } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { apiFetch } from "../../../utils/api";
import { Lead, LeadStatus } from "../../../types";
import React, { Dispatch, SetStateAction } from "react";

/** Estado y callbacks que el contenedor inyecta a la sección. */
export interface VenueAgentWorkflowBannerProps {
  selectedLead: Lead;
  normalizeStatus: (status: string) => LeadStatus;
  isReplyStage: boolean;
  handleApprovePitchDirectly: () => void;
  isCreatingDraft: boolean;
  draftError: string;
  setIsCreatingDraft: Dispatch<SetStateAction<boolean>>;
  setDraftError: Dispatch<SetStateAction<string>>;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
}

/**
 * Banner del flujo de agentes y subestado agéntico del lead.
 * @param props Estado y callbacks del contenedor ({@link VenueAgentWorkflowBannerProps}).
 * @returns Sección de interfaz.
 */
export function VenueAgentWorkflowBanner({ selectedLead, normalizeStatus, isReplyStage, handleApprovePitchDirectly, isCreatingDraft, draftError, setIsCreatingDraft, setDraftError, onUpdateLead }: VenueAgentWorkflowBannerProps) {
  return (
    <>
{/* Agent Workflow & Sub-status Banner (Option A 2-Dimensional Model) */}
        {(() => {
          const rawStatus = String(selectedLead.estado || "");
          const isPending =
            rawStatus === "pendiente_aprobacion" ||
            (rawStatus === "nuevo" &&
              !!selectedLead.pitch_generado &&
              !selectedLead.fecha_envio);
          const isDraftCreated = rawStatus === "borrador_creado";
          const isApproved = rawStatus.startsWith("aprobado");
          const isSent = normalizeStatus(rawStatus) === "esperando_respuesta";

          if (isPending) {
            return (
              <div className="p-3 bg-[var(--acc)]/10 rounded-[var(--r-m)] flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-[var(--r-s)] bg-[var(--acc)]/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-[var(--acc)]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--acc)]/70">
                      {isReplyStage
                        ? "Respuesta redactada por IA — Pendiente de aprobación"
                        : "Pitch inicial redactado por IA — Pendiente de aprobación"}
                    </p>
                    <p className="text-micro text-[var(--ink-2)] truncate">
                      {isReplyStage
                        ? "Revisa el borrador para responder a la sala y autorizar su envío."
                        : "Revisa la propuesta inicial para autorizar al agente de envíos."}
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="xs"
                  type="button"
                  onClick={handleApprovePitchDirectly}
                  disabled={isCreatingDraft}
                  className="shrink-0 items-center gap-1"
                >
                  {isCreatingDraft ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isCreatingDraft ? "Creando borrador..." : "Aprobar"}
                  </span>
                </Button>
              </div>
            );
          }

          if (isDraftCreated) {
            return (
              <div className="p-2.5 bg-[var(--acc)]/10 rounded-[var(--r-m)] flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-[var(--r-pill)] bg-[var(--acc)] shrink-0 ml-1" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--acc)]/80">
                    <ShowIcon inline emoji="📝" />Borrador creado en tu Gmail
                  </p>
                  <p className="text-micro text-[var(--ink-2)]">
                    Revísalo en tu bandeja de borradores y envíalo cuando
                    quieras — no se ha enviado nada automáticamente.
                  </p>
                </div>
              </div>
            );
          }

          if (isApproved) {
            return (
              <div className="p-2.5 bg-[var(--ok)]/10 rounded-[var(--r-m)] flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-[var(--r-pill)] bg-[var(--ok)] shrink-0 ml-1" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--ink-2)]">
                      <ShowIcon inline emoji="🚀" />{" "}
                      {rawStatus === "aprobado_respuesta"
                        ? "Respuesta Aprobada"
                        : "Propuesta Aprobada"}{" "}
                      — En cola del Agente Enviador
                    </p>
                    <p className="text-micro text-[var(--ink-2)]">
                      {draftError
                        ? `No se pudo crear el borrador en Gmail (${draftError}). El lead quedó en cola para el Agente Enviador por email.`
                        : "El agente despachará este correo respetando las normas de envío y rate-limiting."}
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="xs"
                  type="button"
                  disabled={isCreatingDraft}
                  onClick={async () => {
                    setIsCreatingDraft(true);
                    setDraftError(null);
                    try {
                      const data = await apiFetch("/api/trigger-agent", {
                        method: "POST",
                        body: JSON.stringify({
                          agentName: "enviador",
                          params: {
                            id: selectedLead.id,
                            trigger_type: "usuario_manual",
                          },
                        }),
                      });
                      const leadResult = Array.isArray(data.results)
                        ? data.results.find(
                            (r: any) => r.id === selectedLead.id,
                          )
                        : null;
                      if (
                        leadResult?.status === "borrador" ||
                        leadResult?.status === "enviado"
                      ) {
                        onUpdateLead(selectedLead.id, {
                          estado:
                            leadResult?.status === "enviado"
                              ? leadResult?.estado_nuevo || "contactado"
                              : "borrador_creado",
                        });
                      } else if (leadResult?.error || data.message) {
                        setDraftError(leadResult?.error || data.message);
                      }
                    } catch (err: any) {
                      setDraftError(
                        err.message || "Error al despachar el correo.",
                      );
                    } finally {
                      setIsCreatingDraft(false);
                    }
                  }}
                  className="shrink-0 items-center gap-1.5"
                  title="Forzar el despacho inmediato de este correo por el agente enviador"
                >
                  {isCreatingDraft ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isCreatingDraft ? "Enviando..." : "Despachar Ahora"}
                  </span>
                </Button>
              </div>
            );
          }

          if (isSent) {
            const wasOpened = Boolean(
              selectedLead.email_abierto ||
              (selectedLead.veces_abierto && selectedLead.veces_abierto > 0),
            );
            const openCount = selectedLead.veces_abierto || 1;
            const clickCount = selectedLead.clics_epk || 0;

            return (
              <div className="p-2 bg-[var(--acc)]/10 rounded-[var(--r-m)] flex items-center gap-2 text-xs text-[var(--ink-2)]">
                <span className="w-2 h-2 rounded-[var(--r-pill)] bg-[var(--tentative)] shrink-0 ml-1" />
                <span className="text-xs font-medium">
                  <ShowIcon inline emoji="📬" />Email enviado el{" "}
                  {selectedLead.fecha_envio || "recientemente"} • Agente a la
                  espera de respuesta de la sala
                </span>
              </div>
            );
          }

          return null;
        })()}
    </>
  );
}
