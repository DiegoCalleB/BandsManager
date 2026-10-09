/**
 * Formulario inline para editar la ficha del lead.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-explicit-any
*/
import { Edit3, Sparkles, Upload, Clock } from "lucide-react";
import { Input, Select, Button } from "../../ui";
import { LeadType, Lead } from "../../../types";
import { ShowIcon } from "../../ui/ShowIcon";
import { toIsoDateString } from "../../../utils/festivalDateFormat";
import { isLeadNeedsFollowup, getDaysSinceContact, generateFollowupTemplate } from "../../../utils/bookingFollowup";
import { QuickDealSimulator } from "../QuickDealSimulator";
import { isStitchLight } from "./venueTheme";
import { VenuePlaybookBanner } from "./VenuePlaybookBanner";
import React, { Dispatch, SetStateAction } from "react";

/** Estado y callbacks que el contenedor inyecta a la sección. */
export interface VenueLeadInfoEditFormProps {
  activeTab: "info" | "emails" | "intelligence" | "copilot" | "bitacora";
  isEditingLeadInfo: boolean;
  selectedLead: Lead;
  setIsEditingLeadInfo: Dispatch<SetStateAction<boolean>>;
  handleSaveLeadInfo: () => void;
  editedLeadInfo: Partial<Lead>;
  setEditedLeadInfo: Dispatch<SetStateAction<Partial<Lead>>>;
  handleAutoSearchLogo: () => Promise<void>;
  isSearchingLogo: boolean;
  onLeadLogoUpload: (file: File) => void | Promise<string>;
  isUploadingLeadLogo: boolean;
  handleAutoExtractFestivalDates: () => Promise<void>;
  isExtractingDates: boolean;
  bandName: string;
  setEditedPitch: Dispatch<SetStateAction<string>>;
  setIsEditingPitch: Dispatch<SetStateAction<boolean>>;
  handleRecalculateFinancial: (overrideData?: { precioAnticipada: number; precioTaquilla: number; alquilerSalaFijo: number; porcentajeSala: number; gastosProduccionFijos: number; numMusicos: number; }) => Promise<void>;
  isRecalculatingFinancial: boolean;
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
  editedPitch: string;
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
 * Formulario inline para editar la ficha del lead.
 * @param props Estado y callbacks del contenedor ({@link VenueLeadInfoEditFormProps}).
 * @returns Sección de interfaz.
 */
export function VenueLeadInfoEditForm({ activeTab, isEditingLeadInfo, selectedLead, setIsEditingLeadInfo, handleSaveLeadInfo, editedLeadInfo, setEditedLeadInfo, handleAutoSearchLogo, isSearchingLogo, onLeadLogoUpload, isUploadingLeadLogo, handleAutoExtractFestivalDates, isExtractingDates, bandName, setEditedPitch, setIsEditingPitch, handleRecalculateFinancial, isRecalculatingFinancial, isReplyStage, setShowMultiModelModal, handleCopyPitch, copiedPitch, setShowWhatsAppModal, handleApprovePitchDirectly, isCreatingDraft, activeCampaign, handleRegeneratePitchWithFeedback, isRegeneratingPitch, editedPitch, onUpdateLead, isEditingPitch, handleSavePitch, setShowFeedbackHistory, showFeedbackHistory, setToneRating, toneRating, setContentRating, contentRating, feedbackComment, setFeedbackComment, setFeedbackScope, feedbackScope, feedbackSuccessMsg, selectedAiModel, setSelectedAiModel, handleRevertPitch, isRevertingPitch }: VenueLeadInfoEditFormProps) {
  return (
    <>
{/* TAB 1: PITCH & DIRECT EDITING FORM */}
      {activeTab === "info" && (
        <div className="space-y-4">
          {/* Edit Form Modal/Inline */}
          {isEditingLeadInfo && (
            <div className="p-4 rounded-[var(--r-m)] space-y-3 bg-[var(--surface)] text-[var(--ink)]">
              <div className="flex justify-between items-center pb-2800">
                <span className="font-bold text-xs text-[var(--acc)] flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" /> Editar Ficha (
                  {selectedLead.nombre_sala})
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditingLeadInfo(false)}
                    className="px-2.5 py-1 text-xs rounded bg-[var(--sunken)] text-[var(--ink-2)] hover:bg-[var(--ink-3)]/60 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveLeadInfo}
                    className="px-3 py-1 text-xs rounded bg-[var(--acc)] text-[var(--on-acc)] font-bold hover:bg-[var(--acc)]/60 cursor-pointer"
                  >
                    Guardar
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-micro font-sans text-[var(--ink-2)] mb-1">
                      Nombre sala / espacio / contacto
                    </label>
                    <Input size="sm" aria-label="Nombre sala / espacio / contacto"
                      type="text"
                      value={editedLeadInfo.nombre_sala || ""}
                      onChange={(e) =>
                        setEditedLeadInfo({
                          ...editedLeadInfo,
                          nombre_sala: e.target.value,
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-micro font-sans text-[var(--acc)] font-bold mb-1">
                      Tipo / categoría de lead
                    </label>
                    <Select size="sm" aria-label="Tipo / categoría de lead"
                      value={String(
                        editedLeadInfo.tipo || "sala",
                      ).toLowerCase()}
                      onChange={(e) =>
                        setEditedLeadInfo({
                          ...editedLeadInfo,
                          tipo: e.target.value as LeadType,
                        })
                      }
                      wrapperClassName="w-full"
                    >
                      <option value="sala">Sala de conciertos</option>
                      <option value="festival">Festival</option>
                      <option value="ayuntamiento">
                        Ayuntamiento / fiestas
                      </option>
                      <option value="discoteca">Discoteca / Club</option>
                      <option value="grupo">Grupo / banda aliada</option>
                      <option value="agencia">Agencia de Booking</option>
                      <option value="manager">
                        Manager / Representante
                      </option>
                      <option value="productora">
                        Productora de eventos
                      </option>
                      <option value="sello">Discográfica / Sello</option>
                      <option value="medio">Medio / prensa / radio</option>
                    </Select>
                  </div>
                </div>

                {/* Logo Selector */}
                <div className="bg-[var(--bg)]/60 p-3 rounded-[var(--r-m)] space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="block text-micro font-sans text-[var(--ink-2)]">
                      Icono o logo del medio / sala
                    </label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="neutral"
                        size="xs"
                        type="button"
                        onClick={handleAutoSearchLogo}
                        disabled={isSearchingLogo}
                        className="items-center gap-1.5"
                      >
                        <Sparkles className="w-3 h-3 text-[var(--acc)]" />
                        <span>
                          {isSearchingLogo ? "Buscando..." : "Buscar Logo"}
                        </span>
                      </Button>
                      {onLeadLogoUpload && (
                        <label className="cursor-pointer px-2.5 py-1 bg-[var(--sunken)] hover:bg-[var(--ink-3)]/60 text-[var(--ink)] text-micro rounded-[var(--r-s)] flex items-center gap-1.5 font-bold transition-all700">
                          <Upload className="w-3 h-3 text-[var(--acc)]" />
                          <span>
                            {isUploadingLeadLogo ? "Subiendo..." : "Subir Logo"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const uploadedUrl =
                                  await onLeadLogoUpload(file);
                                if (uploadedUrl) {
                                  setEditedLeadInfo((prev) => ({
                                    ...prev,
                                    imagen_url: uploadedUrl,
                                  }));
                                }
                              }
                            }}
                            disabled={isUploadingLeadLogo}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {editedLeadInfo.imagen_url &&
                  editedLeadInfo.imagen_url.trim() !== "" ? (
                    <div className="flex items-center gap-3 p-2 bg-[var(--bg)] rounded-[var(--r-s)]">
                      <img
                        src={editedLeadInfo.imagen_url}
                        alt="Logo"
                        className="w-10 h-10 rounded-[var(--r-s)] object-contain bg-[var(--bg)] shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-micro text-[var(--ink-2)] font-bold truncate">
                          {editedLeadInfo.imagen_url}
                        </p>
                        <p className="text-micro text-[var(--ink-2)]">
                          Logo oficial guardado
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setEditedLeadInfo((prev) => ({
                            ...prev,
                            imagen_url: "",
                          }))
                        }
                        className="text-micro text-[var(--alert)] hover:underline px-2 py-1 cursor-pointer"
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="text-micro text-[var(--ink-2)]">
                        O selecciona un emoji característico:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "📻",
                          "📰",
                          "🌐",
                          "🎙️",
                          "📺",
                          "🏛️",
                          "🎪",
                          "🪩",
                          "🎸",
                          "💼",
                          "🎆",
                          "⚡",
                          "🔥",
                        ].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() =>
                              setEditedLeadInfo((prev) => ({
                                ...prev,
                                icono: emoji,
                              }))
                            }
                            className={`w-7 h-7 rounded-[var(--r-s)] text-sm flex items-center justify-center transition-ui cursor-pointer ${
                              editedLeadInfo.icono === emoji
                                ? "bg-[var(--ink)] text-[var(--bg)] font-bold scale-110"
                                : "bg-[var(--sunken)]/80 text-[var(--ink-2)] hover:bg-[var(--ink-3)]/60"
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* DIRECCIÓN / CALLE */}
                <div>
                  <label className="block text-micro font-sans text-[var(--acc)] font-bold mb-1 flex items-center gap-1">
                    <ShowIcon inline emoji="📍" />Dirección exacta (calle, número…)
                  </label>
                  <Input
                    size="sm"
                    type="text"
                    placeholder="Ej. Calle San Vicente Ferrer 33, 28004 Madrid"
                    value={editedLeadInfo.direccion || ""}
                    onChange={(e) =>
                      setEditedLeadInfo({
                        ...editedLeadInfo,
                        direccion: e.target.value,
                      })
                    }
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-micro font-sans text-[var(--ink-2)] mb-1">
                      Ciudad
                    </label>
                    <Input
                      size="sm"
                      type="text"
                      placeholder="Ej. Madrid"
                      value={editedLeadInfo.ciudad || ""}
                      onChange={(e) =>
                        setEditedLeadInfo({
                          ...editedLeadInfo,
                          ciudad: e.target.value,
                        })
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-micro font-sans text-[var(--ink-2)] mb-1">
                      Región / provincia
                    </label>
                    <Input
                      size="sm"
                      type="text"
                      placeholder="Ej. Comunidad de Madrid"
                      value={editedLeadInfo.region || ""}
                      onChange={(e) =>
                        setEditedLeadInfo({
                          ...editedLeadInfo,
                          region: e.target.value,
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-micro font-sans text-[var(--ink-2)] mb-1">
                      Persona de contacto
                    </label>
                    <Input
                      size="sm"
                      type="text"
                      placeholder="Ej. Carlos (Programador)"
                      value={editedLeadInfo.contacto_nombre || ""}
                      onChange={(e) =>
                        setEditedLeadInfo({
                          ...editedLeadInfo,
                          contacto_nombre: e.target.value,
                        })
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-micro font-sans text-[var(--ink-2)] mb-1">
                      Email principal (Contratación)
                    </label>
                    <Input
                      size="sm"
                      type="email"
                      placeholder="info@salanazcaconciertos.com"
                      value={editedLeadInfo.email_contacto || ""}
                      onChange={(e) =>
                        setEditedLeadInfo({
                          ...editedLeadInfo,
                          email_contacto: e.target.value,
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-micro font-sans text-[var(--acc)] font-bold mb-1">
                    <ShowIcon inline emoji="✉️" />Email secundario / promotora / alternativo
                  </label>
                  <Input
                    size="sm"
                    type="email"
                    placeholder="info@magnetikproducciones.com (o varios separados por coma)"
                    value={editedLeadInfo.email_secundario || ""}
                    onChange={(e) =>
                      setEditedLeadInfo({
                        ...editedLeadInfo,
                        email_secundario: e.target.value,
                      })
                    }
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-micro font-mono text-[var(--ok)] font-bold mb-1 flex items-center gap-1">
                      <span><ShowIcon inline emoji="📱" />Teléfono móvil (WhatsApp)</span>
                    </label>
                    <Input
                      size="sm"
                      type="tel"
                      placeholder="Ej. +34 612 345 678"
                      value={editedLeadInfo.telefono_movil || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditedLeadInfo({
                          ...editedLeadInfo,
                          telefono_movil: val,
                          telefono:
                            val ||
                            editedLeadInfo.telefono_fijo ||
                            editedLeadInfo.telefono ||
                            "",
                        });
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-micro font-mono text-[var(--acc)] font-bold mb-1 flex items-center gap-1">
                      <span><ShowIcon inline emoji="☎️" />Teléfono fijo (sala / oficina)</span>
                    </label>
                    <Input
                      size="sm"
                      type="tel"
                      placeholder="Ej. +34 912 345 678"
                      value={editedLeadInfo.telefono_fijo || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditedLeadInfo({
                          ...editedLeadInfo,
                          telefono_fijo: val,
                          telefono:
                            editedLeadInfo.telefono_movil ||
                            val ||
                            editedLeadInfo.telefono ||
                            "",
                        });
                      }}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-micro font-sans text-[var(--ink-2)] mb-1">
                      Aforo (personas)
                    </label>
                    <Input
                      size="sm"
                      type="number"
                      placeholder="Ej. 500"
                      value={editedLeadInfo.aforo || 0}
                      onChange={(e) =>
                        setEditedLeadInfo({
                          ...editedLeadInfo,
                          aforo: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-micro font-mono text-[var(--ink-2)] mb-1">
                      Contacto / programador
                    </label>
                    <Input
                      size="sm"
                      type="text"
                      placeholder="Ej. Laura González (Directora Artística)"
                      value={editedLeadInfo.contacto_nombre || ""}
                      onChange={(e) =>
                        setEditedLeadInfo({
                          ...editedLeadInfo,
                          contacto_nombre: e.target.value,
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-micro font-sans text-[var(--acc)] mb-1">
                    Róster de artistas / bandas que representa
                  </label>
                  <Input
                    size="sm"
                    type="text"
                    placeholder="Ej. Ska-P, Boikot, Zoo, La Raíz…"
                    value={editedLeadInfo.roster || ""}
                    onChange={(e) =>
                      setEditedLeadInfo({
                        ...editedLeadInfo,
                        roster: e.target.value,
                      })
                    }
                    className="w-full"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-micro font-sans text-[var(--acc)]">
                      <ShowIcon inline emoji="🎪" />Fechas del festival (Inicio / fin)
                    </span>
                    <button
                      type="button"
                      onClick={handleAutoExtractFestivalDates}
                      disabled={isExtractingDates}
                      className="px-2 py-0.5 rounded bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--ink)] text-micro font-bold flex items-center gap-1 transition-ui cursor-pointer"
                      title="Buscar fechas del festival automáticamente con IA y base de datos de festivales"
                    >
                      <Sparkles className="w-3 h-3 text-[var(--acc)]" />
                      <span>
                        {isExtractingDates
                          ? "Buscando fechas..."
                          : "Rellenar Fechas con IA"}
                      </span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-micro font-sans text-[var(--ink-2)] mb-1">
                        Inicio Festival (dd/mm/yyyy)
                      </label>
                      <Input size="sm" aria-label="Inicio Festival (dd/mm/yyyy)"
                        type="date"
                        value={toIsoDateString(
                          editedLeadInfo.festival_start_date,
                        )}
                        onChange={(e) =>
                          setEditedLeadInfo({
                            ...editedLeadInfo,
                            festival_start_date: e.target.value || undefined,
                          })
                        }
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-micro font-sans text-[var(--acc)] mb-1">
                        <ShowIcon inline emoji="🎪" />Fin Festival (dd/mm/yyyy)
                      </label>
                      <Input size="sm" aria-label="Fin Festival (dd/mm/yyyy)"
                        type="date"
                        value={toIsoDateString(
                          editedLeadInfo.festival_end_date,
                        )}
                        onChange={(e) =>
                          setEditedLeadInfo({
                            ...editedLeadInfo,
                            festival_end_date: e.target.value || undefined,
                          })
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-micro font-sans text-[var(--ink-2)] mb-1">
                      Sitio Web
                    </label>
                    <Input
                      size="sm"
                      type="url"
                      placeholder="https://…"
                      value={editedLeadInfo.website || ""}
                      onChange={(e) =>
                        setEditedLeadInfo({
                          ...editedLeadInfo,
                          website: e.target.value,
                        })
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-micro font-sans text-[var(--ink-2)] mb-1">
                      Instagram
                    </label>
                    <Input
                      size="sm"
                      type="text"
                      placeholder="@salaeltren"
                      value={editedLeadInfo.instagram || ""}
                      onChange={(e) =>
                        setEditedLeadInfo({
                          ...editedLeadInfo,
                          instagram: e.target.value,
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

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
                    Es el momento idóneo para un “Gentle Nudge” breve (&lt;50
                    palabras) y cordial.
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
                }}
                className="items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3" />
                <span>Cargar Nudge (40 palabras)</span>
              </Button>
            </div>
          )}

          {/* 💰 Condiciones del Deal & Viabilidad (Break-Even) */}
          <QuickDealSimulator
            lead={selectedLead}
            onSaveDeal={handleRecalculateFinancial}
            isSaving={isRecalculatingFinancial}
            isStitchLight={isStitchLight}
          />

          <VenuePlaybookBanner selectedLead={selectedLead} setEditedPitch={setEditedPitch} setIsEditingPitch={setIsEditingPitch} isReplyStage={isReplyStage} setShowMultiModelModal={setShowMultiModelModal} handleCopyPitch={handleCopyPitch} copiedPitch={copiedPitch} setShowWhatsAppModal={setShowWhatsAppModal} handleApprovePitchDirectly={handleApprovePitchDirectly} isCreatingDraft={isCreatingDraft} activeCampaign={activeCampaign} handleRegeneratePitchWithFeedback={handleRegeneratePitchWithFeedback} isRegeneratingPitch={isRegeneratingPitch} editedLeadInfo={editedLeadInfo} editedPitch={editedPitch} bandName={bandName} onUpdateLead={onUpdateLead} isEditingPitch={isEditingPitch} handleSavePitch={handleSavePitch} setShowFeedbackHistory={setShowFeedbackHistory} showFeedbackHistory={showFeedbackHistory} setToneRating={setToneRating} toneRating={toneRating} setContentRating={setContentRating} contentRating={contentRating} feedbackComment={feedbackComment} setFeedbackComment={setFeedbackComment} setFeedbackScope={setFeedbackScope} feedbackScope={feedbackScope} feedbackSuccessMsg={feedbackSuccessMsg} selectedAiModel={selectedAiModel} setSelectedAiModel={setSelectedAiModel} handleRevertPitch={handleRevertPitch} isRevertingPitch={isRevertingPitch} />
        </div>
      )}
    </>
  );
}
