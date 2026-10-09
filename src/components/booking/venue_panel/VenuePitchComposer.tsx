/**
 * Barra de acciones, banners de campaña, fechas, snippets de deal y editor del pitch.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-explicit-any
*/
import { Layers, Copy, MessageCircle, Loader2, CheckCircle2, Sparkles, CalendarCheck, Handshake, ShieldAlert } from "lucide-react";
import { ShowIcon } from "../../ui/ShowIcon";
import { HolidayDateWarning } from "../../common/HolidayDateWarning";
import { Button, Textarea } from "../../ui";
import { getCommercialDealSnippets } from "../../../utils/bookingTourContext";
import React, { Dispatch, SetStateAction } from "react";
import { Lead } from "../../../types";

/** Estado y callbacks que el contenedor inyecta a la sección. */
export interface VenuePitchComposerProps {
  isReplyStage: boolean;
  setShowMultiModelModal: Dispatch<SetStateAction<boolean>>;
  handleCopyPitch: () => void;
  copiedPitch: boolean;
  setShowWhatsAppModal: Dispatch<SetStateAction<boolean>>;
  selectedLead: Lead;
  handleApprovePitchDirectly: () => void;
  isCreatingDraft: boolean;
  activeCampaign: any;
  handleRegeneratePitchWithFeedback: (targetProvider?: "gemini" | "deepseek") => Promise<void>;
  isRegeneratingPitch: boolean;
  editedLeadInfo: Partial<Lead>;
  editedPitch: string;
  setEditedPitch: Dispatch<SetStateAction<string>>;
  setIsEditingPitch: Dispatch<SetStateAction<boolean>>;
  bandName: string;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  isEditingPitch: boolean;
  handleSavePitch: () => void;
}

/**
 * Barra de acciones, banners de campaña, fechas, snippets de deal y editor del pitch.
 * @param props Estado y callbacks del contenedor ({@link VenuePitchComposerProps}).
 * @returns Sección de interfaz.
 */
export function VenuePitchComposer({ isReplyStage, setShowMultiModelModal, handleCopyPitch, copiedPitch, setShowWhatsAppModal, selectedLead, handleApprovePitchDirectly, isCreatingDraft, activeCampaign, handleRegeneratePitchWithFeedback, isRegeneratingPitch, editedLeadInfo, editedPitch, setEditedPitch, setIsEditingPitch, bandName, onUpdateLead, isEditingPitch, handleSavePitch }: VenuePitchComposerProps) {
  return (
    <>
<div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold font-sans text-[var(--acc)]">
                {isReplyStage
                  ? "Respuesta Redactada por IA"
                  : "Propuesta de Pitch Redactada"}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowMultiModelModal(true)}
                  className="px-2.5 py-1 bg-[var(--acc)]/20  hover:bg-[var(--acc)]/30 rounded text-xs text-[var(--ink)] font-bold flex items-center gap-1.5 cursor-pointer transition-ui"
                  title="Compara en paralelo propuestas generadas por DeepSeek V3 y Gemini Flash"
                >
                  <Layers className="w-3.5 h-3.5 text-[var(--acc)]" />
                  <span>Comparador A/B (DeepSeek vs Gemini) <ShowIcon inline emoji="🚀" /></span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyPitch}
                  className="px-2 py-1 bg-[var(--surface)] hover:bg-[var(--ink-3)]/60 rounded text-xs text-[var(--ink)] font-sans flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedPitch ? "¡Copiado!" : "Copiar"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowWhatsAppModal(true)}
                  className="px-2 py-1 bg-[var(--ok)] hover:bg-[var(--ok)] text-[var(--on-ok)] rounded text-xs font-sans flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  title="Abrir propuesta optimizada en WhatsApp"
                >
                  <MessageCircle className="w-3 h-3 text-[var(--ok)]" />
                  <span>WhatsApp</span>
                </button>

                {selectedLead.estado === "pendiente_aprobacion" ||
                selectedLead.estado === "nuevo" ? (
                  <button
                    type="button"
                    onClick={handleApprovePitchDirectly}
                    disabled={isCreatingDraft}
                    className="px-2.5 py-1 bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] font-bold rounded text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isCreatingDraft ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {isCreatingDraft
                        ? "Creando borrador..."
                        : isReplyStage
                          ? "Aprobar Respuesta"
                          : "Aprobar Pitch"}
                    </span>
                  </button>
                ) : null}
              </div>
            </div>

            {/* Active Campaign Context Banner in Pitch Section */}
            {activeCampaign && activeCampaign.isActive !== false && (
              <div className="mb-2.5 p-2.5 bg-[var(--acc)]/40  rounded-[var(--r-m)] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs shrink-0"><ShowIcon inline emoji="🎯" /></span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-[var(--acc-ink)] truncate block">
                        Campaña: {activeCampaign.name}
                      </span>
                      <span className="text-micro text-[var(--tentative)]/80 truncate block">
                        Fechas objetivo:{" "}
                        {activeCampaign.targetDatesText ||
                          (Array.isArray(activeCampaign.targetDates)
                            ? activeCampaign.targetDates.join(",")
                            : "Próximos meses")}{" "}
                        · Aforo: {activeCampaign.minCapacity || 0}-
                        {activeCampaign.maxCapacity || "sin límite"} pax
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRegeneratePitchWithFeedback()}
                    disabled={isRegeneratingPitch}
                    className="px-2.5 py-1 bg-[var(--acc)] hover:bg-[var(--tentative)] text-[var(--on-acc)] font-bold rounded text-micro flex items-center gap-1 transition-ui cursor-pointer shrink-0 disabled:opacity-50"
                    title="Reescribe el pitch adaptándolo a las fechas y aforo de esta campaña"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Adaptar a campaña</span>
                  </button>
                </div>

                {/* Chequeo de festivos en fechas de campaña para la ciudad de este lead */}
                {Array.isArray(activeCampaign.targetDates) &&
                  activeCampaign.targetDates.length > 0 &&
                  selectedLead.ciudad && (
                    <div className="flex flex-wrap gap-1 pt-1/20">
                      {activeCampaign.targetDates.map((tDate) => (
                        <HolidayDateWarning
                          key={tDate}
                          date={tDate}
                          city={selectedLead.ciudad}
                          compact
                        />
                      ))}
                    </div>
                  )}
              </div>
            )}

            {/* Quick Available Dates Insertion Pills */}
            {(() => {
              const fechasLibres =
                editedLeadInfo?.fechas_libres_detectadas &&
                editedLeadInfo.fechas_libres_detectadas.length > 0
                  ? editedLeadInfo.fechas_libres_detectadas
                  : selectedLead?.fechas_libres_detectadas || [];
              if (!fechasLibres || fechasLibres.length === 0) return null;
              return (
                <div className="bg-[var(--acc)]/40 p-2.5 rounded-[var(--r-m)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-micro font-mono font-bold text-[var(--acc)] flex items-center gap-1">
                      <CalendarCheck className="w-3.5 h-3.5 text-[var(--acc)]" />
                      Fechas Libres Detectadas por Radar (Insertar en 1 clic):
                    </span>
                    <span className="text-micro text-[var(--acc)]/80 font-sans">
                      Basado en agenda pública del recinto
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {fechasLibres.map((fecha, idx) => (
                      <Button
                        variant="primary"
                        size="xs"
                        key={`quick-pitch-date-${idx}`}
                        type="button"
                        onClick={() => {
                          const dateText = `\n\nHemos visto que tenéis disponible en vuestra programación el ${fecha}, así que esa fecha nos encajaría ideal para celebrar el concierto.`;
                          const current =
                            editedPitch || selectedLead?.pitch_generado || "";
                          if (!current.includes(fecha)) {
                            const updated = (current + dateText).trim();
                            setEditedPitch(updated);
                            setIsEditingPitch(true);
                          }
                        }}
                        className="items-center gap-1"
                        title={`Inserta la propuesta para la fecha libre ${fecha} en el borrador`}
                      >
                        <span><ShowIcon inline emoji="📅" />Proponer {fecha}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* 💰 Commercial Deal Snippets (Punto 2: Taquilla 100%, Garantía Mínima + %, Caché Fijo) */}
            <div className="bg-[var(--sunken)]/90 p-2.5 rounded-[var(--r-m)] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-micro font-mono font-bold text-[var(--ok)] flex items-center gap-1.5">
                  <Handshake className="w-3.5 h-3.5 text-[var(--ok)]" />
                  Condiciones Comerciales (Insertar propuesta con 1 clic):
                </span>
                <span className="text-micro text-[var(--ink-2)] font-sans">
                  Fórmulas estándar de mánager profesional
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
                      if (!current.includes(deal.textoCompleto.trim())) {
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
                      }
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

            {/* Quick Manager Safeguard Pills */}
            <div className="bg-[var(--sunken)]/80 p-2.5 rounded-[var(--r-m)] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-micro font-mono font-bold text-[var(--acc)] flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-[var(--acc)]" />
                  Salvaguardas de Mánager (Insertar cláusula con 1 clic):
                </span>
                <span className="text-micro text-[var(--ink-2)] font-sans">
                  Protege a la banda antes de enviar
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  {
                    id: "hold",
                    label: "Pedir Pre-reserva (Hold 48h)",
                    text: "\n\nPara dejarla asegurada mientras cuadramos la logística de viaje y disponibilidad de los músicos, ¿os parece bien dejar la fecha en Pre-reserva (Hold / Option 1) durante 48 horas? En cuanto lo coordinemos os damos confirmación definitiva para formalizar contrato y rider.",
                    color:
                      "text-[var(--ink)] bg-[var(--acc)]/10 hover:brightness-95",
                  },
                  {
                    id: "curfew",
                    label: "Preguntar Curfew / Horarios",
                    text: "\n\nPor coordinar bien la duración del pase y prueba de sonido: ¿cuál es el horario estricto de finalización de música en vivo (curfew) de la sala y tenéis limitador de decibelios?",
                    color:
                      "text-[var(--ink)] bg-[var(--acc)]/10 hover:brightness-95",
                  },
                  {
                    id: "taquilla",
                    label: "Clarificar Gastos Taquilla",
                    text: "\n\nRespecto a las condiciones de taquilla: ¿en el reparto pactado están ya incluidos el técnico de sonido de la sala y portería, o existe algún canon o gasto fijo deducible antes de la liquidación?",
                    color:
                      "text-[var(--ok)] bg-[var(--ok)]/10 hover:brightness-95",
                  },
                  {
                    id: "rider",
                    label: "Confirmar D.I. y Rider",
                    text: "\n\nEn cuanto a producción: os pasamos nuestro rider técnico para que lo reviséis. ¿Nos podéis facilitar el rider técnico de la sala para revisarlo con el equipo?",
                    color:
                      "text-[var(--ink)] bg-[var(--acc)]/10 hover:brightness-95",
                  },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => {
                      const current =
                        editedPitch || selectedLead.pitch_generado || "";
                      if (!current.includes(pill.text.trim())) {
                        const updated = (current + pill.text).trim();
                        setEditedPitch(updated);
                        setIsEditingPitch(true);
                      }
                    }}
                    className={`px-2 py-1 rounded-[var(--r-m)] text-micro font-sans font-medium flex items-center gap-1 transition-ui cursor-pointer ${pill.color}`}
                    title="Inserta esta cláusula protectora al final del borrador actual"
                  >
                    <span>{pill.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {isEditingPitch ? (
              <div className="space-y-2">
                <Textarea
                  rows={10}
                  value={editedPitch}
                  onChange={(e) => setEditedPitch(e.target.value)}
                  className="w-full min-h-[180px]"
                />
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-micro text-[var(--ink-2)] font-sans"
                    title="Esta corrección se suma a las demás para refinar automáticamente cómo escribe la IA en esta categoría (ver ADN de Tono > Reglas Aprendidas). Si es un caso puntual y no quieres que influya, usa'Regenerar' con estrellas/comentario y marca'Solo para esta sala' en vez de editar aquí."
                  >
                    <ShowIcon inline emoji="✏️" />Esta edición se usará también para entrenar al Redactor
                  </span>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setIsEditingPitch(false)}
                      className="px-3 py-1 bg-[var(--surface)] text-[var(--ink-2)] rounded text-xs hover:bg-[var(--ink-3)]/60 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSavePitch}
                      className="px-3 py-1 bg-[var(--acc)] text-[var(--on-acc)] font-bold rounded text-xs hover:bg-[var(--acc)]/60 cursor-pointer"
                    >
                      Guardar y aprobar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => {
                  setEditedPitch(
                    editedPitch || selectedLead.pitch_generado || "",
                  );
                  setIsEditingPitch(true);
                }}
                className="p-3 bg-[var(--surface)] rounded-[var(--r-m)] text-xs text-[var(--ink)] font-sans whitespace-pre-wrap leading-relaxed cursor-pointer  transition-colors group relative"
              >
                {editedPitch ||
                  selectedLead.pitch_generado ||
                  "Sin pitch generado."}
                <span className="absolute bottom-2 right-2 text-micro text-[var(--acc)] opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                  Clic para editar <ShowIcon inline emoji="✏️" />
                </span>
              </div>
            )}
    </>
  );
}
