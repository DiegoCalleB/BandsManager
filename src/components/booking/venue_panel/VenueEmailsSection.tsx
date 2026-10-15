import type { VenueThreadEntry } from "./venuePanelTypes";
/**
 * Pestaña de hilo de correos y simulación de respuesta.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
 
import { Clock,Handshake,Loader2,Sparkles } from "lucide-react";
import { Dispatch,SetStateAction } from "react";
import { Lead } from "../../../types";
import { generateFollowupTemplate,getDaysSinceContact,isLeadNeedsFollowup } from "../../../utils/bookingFollowup";
import { getCommercialDealSnippets } from "../../../utils/bookingTourContext";
import { Button } from "../../ui";
import { PublicoSilhouette } from "../../ui/PublicoSilhouette";
import { ShowIcon } from "../../ui/ShowIcon";

/** Estado y callbacks que el contenedor inyecta a la sección. */
export interface VenueEmailsSectionProps {
  activeTab: "info" | "emails" | "intelligence" | "copilot" | "bitacora";
  selectedLead: Lead;
  bandName: string;
  setEditedPitch: Dispatch<SetStateAction<string>>;
  setIsEditingPitch: Dispatch<SetStateAction<boolean>>;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  setActiveTab: Dispatch<SetStateAction<"info" | "emails" | "intelligence" | "copilot" | "bitacora">>;
  hiloCompleto: VenueThreadEntry[];
  handleAnalyzeMessageSentiment: (messageId: string, messageText: string) => Promise<void>;
  isAnalyzingMessageSentiment: string;
  editedPitch: string;
}

/**
 * Pestaña de hilo de correos y simulación de respuesta.
 * @param props Estado y callbacks del contenedor ({@link VenueEmailsSectionProps}).
 * @returns Sección de interfaz.
 */
export function VenueEmailsSection({ activeTab, selectedLead, bandName, setEditedPitch, setIsEditingPitch, onUpdateLead, setActiveTab, hiloCompleto, handleAnalyzeMessageSentiment, isAnalyzingMessageSentiment, editedPitch }: VenueEmailsSectionProps) {
  return (
    <>
{/* TAB 2: EMAIL THREAD & REPLY SIMULATION */}
      {activeTab === "emails" && (
        <div className="space-y-3">
          {/* ⏰ Gentle Nudge / Seguimiento Recomendado Banner */}
          {isLeadNeedsFollowup(selectedLead) && (
            <div className="p-3 bg-[var(--acc)]/40 rounded-[var(--r-m)] flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[var(--r-m)] bg-[var(--acc)]/20 flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5 text-[var(--acc)]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[var(--acc)] font-sans block">
                    <ShowIcon inline emoji="⏰" />Seguimiento Pendiente (
                    {getDaysSinceContact(selectedLead)} días sin respuesta)
                  </span>
                  <span className="text-xs text-[var(--ink-2)] font-sans">
                    Envía un recordatorio educado de 40 palabras para reactivar
                    la conversación con la sala.
                  </span>
                </div>
              </div>
              <Button
                variant="primary"
                size="xs"
                type="button"
                onClick={() => {
                  const draft = generateFollowupTemplate(
                    selectedLead,
                    bandName || "la banda",
                  );
                  setEditedPitch(draft);
                  setIsEditingPitch(true);
                  if (onUpdateLead) {
                    onUpdateLead(selectedLead.id, { pitch_generado: draft });
                  }
                  setActiveTab("info");
                }}
                className="items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3" />
                <span>Cargar nudge de seguimiento</span>
              </Button>
            </div>
          )}

          {hiloCompleto.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-6">
              <PublicoSilhouette opacity={0.12} size="small" />
              <p className="mt-4 font-medium text-[var(--ink)] text-xs">
                Sin correspondencia
              </p>
              <p className="mt-2 text-[var(--ink-2)] text-xs max-w-xs text-center">
                Los correos y conversaciones con esta sala aparecerán aquí.
              </p>
            </div>
          ) : (
            hiloCompleto.map((msg) => (
              <div
                key={msg.id}
                className={`p-3.5 rounded-[var(--r-m)] space-y-2 text-xs font-sans transition-ui ${
                  msg.remitente === "sala"
                    ? "bg-[var(--acc-soft)]  text-[var(--acc)]"
                    : "bg-[var(--bg)] text-[var(--ink)]"
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={
                        msg.remitente === "sala"
                          ? "text-[var(--acc)]"
                          : "text-[var(--ink-2)]"
                      }
                    >
                      {msg.remitente_nombre} (
                      {msg.remitente === "sala" ? "Programador" : (bandName || "La banda")})
                    </span>
                    {msg.remitente === "sala" && msg.sentimiento && (
                      <span
                        className={`px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-bold flex items-center gap-1 ${
                          msg.sentimiento.includes("positivo")
                            ? "bg-[var(--ok)] text-[var(--on-ok)]"
                            : msg.sentimiento.includes("negativo")
                              ? "bg-[var(--alert)] text-[var(--on-alert)]"
                              : "bg-[var(--sunken)] text-[var(--ink-2)]"
                        }`}
                      >
                        {msg.sentimiento_label || msg.sentimiento}
                        {msg.sentimiento_score !== undefined && (
                          <span className="font-mono text-micro opacity-80">
                            (
                            {msg.sentimiento_score > 0
                              ? `+${msg.sentimiento_score}`
                              : msg.sentimiento_score}
                            )
                          </span>
                        )}
                      </span>
                    )}
                    {msg.remitente === "sala" && msg.intencion_etiqueta && (
                      <span className="px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-medium bg-[var(--acc)]/20 text-[var(--ink)]">
                        {msg.intencion_etiqueta}
                      </span>
                    )}
                    {msg.remitente === "sala" && msg.temperatura && (
                      <span className="px-1.5 py-0.5 rounded text-micro bg-[var(--sunken)] text-[var(--ink-2)] font-mono">
                        {msg.temperatura === "muy_caliente"
                          ? "Muy Caliente"
                          : msg.temperatura === "caliente"
                            ? "Caliente"
                            : msg.temperatura === "tibio"
                              ? "Tibio"
                              : "Frío"}
                      </span>
                    )}
                  </div>
                  <span className="text-[var(--ink-2)] text-micro font-sans">
                    {msg.fecha}
                  </span>
                </div>

                <div className="font-bold text-[var(--ink)]">{msg.asunto}</div>
                <p className="whitespace-pre-wrap text-[var(--ink-2)] leading-snug">
                  {msg.mensaje}
                </p>

                {/* Sentiment & Intent Deep Dive for Sala Messages */}
                {msg.remitente === "sala" && (
                  <div className="pt-2 border-t border-[var(--hair)] space-y-2">
                    {msg.resumen_ejecutivo && (
                      <div className="p-2 rounded-[var(--r-m)] bg-[var(--sunken)] text-xs space-y-1 bg-[var(--acc)]/10">
                        <div className="flex items-center justify-between text-micro font-mono text-[var(--acc)] font-bold">
                          <span>Resumen y estrategia lector IA</span>
                        </div>
                        <p className="text-[var(--ink-2)] italic">
                          {msg.resumen_ejecutivo}
                        </p>
                        {msg.sugerencia_estrategia && (
                          <p className="text-[var(--acc)]/90 font-medium">
                            <ShowIcon inline emoji="💡" />{msg.sugerencia_estrategia}
                          </p>
                        )}
                      </div>
                    )}

                    {msg.objeciones && msg.objeciones.length > 0 && (
                      <div className="p-2 rounded-[var(--r-m)] bg-[var(--alert)]/30 text-xs text-[var(--ink)] space-y-1">
                        <span className="font-bold text-[var(--alert)] text-micro font-mono block">
                          Objeciones / Reticencias Detectadas:
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-[var(--ink-2)]">
                          {msg.objeciones.map((obj, i) => (
                            <li key={i}>{obj}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {!msg.sentimiento && (
                      <div className="flex justify-end pt-1">
                        <Button
                          variant="neutral"
                          size="xs"
                          type="button"
                          onClick={() =>
                            handleAnalyzeMessageSentiment(msg.id, msg.mensaje)
                          }
                          disabled={isAnalyzingMessageSentiment === msg.id}
                          className="items-center gap-1.5"
                        >
                          {isAnalyzingMessageSentiment === msg.id ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin text-[var(--acc)]" />
                              <span>Analizando sentimiento…</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 text-[var(--acc)]" />
                              <span>Analizar sentimiento e intención</span>
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {/* Quick Manager Reply Actions with Deal Snippets */}
          <div className="p-3 bg-[var(--sunken)]/90 rounded-[var(--r-m)] space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-micro font-mono font-bold text-[var(--ok)] flex items-center gap-1.5">
                <Handshake className="w-3.5 h-3.5 text-[var(--ok)]" />
                <span>
                  ¿La sala pide condiciones económicas? Inserta propuesta:
                </span>
              </span>
              <span className="text-micro text-[var(--ink-2)] font-sans">
                Carga borrador y pasa a revisión
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              {getCommercialDealSnippets(
                bandName || "la banda",
                selectedLead,
              ).map((deal) => (
                <button
                  key={deal.id}
                  type="button"
                  onClick={() => {
                    const current =
                      editedPitch || selectedLead.pitch_generado || "";
                    const updated = current
                      ? `${current}\n\n${deal.textoCompleto}`
                      : deal.textoCompleto;
                    setEditedPitch(updated);
                    setIsEditingPitch(true);
                    if (onUpdateLead) {
                      onUpdateLead(selectedLead.id, {
                        pitch_generado: updated,
                      });
                    }
                    setActiveTab("info");
                  }}
                  className="p-2 rounded-[var(--r-m)] bg-[var(--sunken)] hover:bg-[var(--surface)]/80 text-left transition-ui group cursor-pointer"
                  title={deal.descripcionCorta}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-[var(--ink-2)] group-hover:text-[var(--ok)] transition-colors">
                      {deal.label}
                    </span>
                    <span className="text-micro font-medium px-1.5 py-0.2 rounded bg-[var(--surface)] text-[var(--ink-2)] group-hover:bg-[var(--ok)]/20 group-hover:text-[var(--ok)]">
                      {deal.badge}
                    </span>
                  </div>
                  <p className="text-micro text-[var(--ink-2)] line-clamp-1 group-hover:text-[var(--ink-2)]">
                    {deal.descripcionCorta}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
