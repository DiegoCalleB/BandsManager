/**
 * Pestaña de pitch y edición directa de la ficha del lead.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/exhaustive-deps
*/
import { Edit3, Sparkles, Upload, Clock, Calendar, Coins, Sliders, Layers, Copy, MessageCircle, Loader2, CheckCircle2, CalendarCheck, Handshake, ShieldAlert, Star, MessageSquare, Undo2, RefreshCw, RotateCcw } from "lucide-react";
import { Input, Select, Button, Textarea, LinkButton } from "../../ui";
import { LeadType, Lead } from "../../../types";
import { ShowIcon } from "../../ui/ShowIcon";
import { toIsoDateString } from "../../../utils/festivalDateFormat";
import { isLeadNeedsFollowup, getDaysSinceContact, generateFollowupTemplate } from "../../../utils/bookingFollowup";
import { QuickDealSimulator } from "../QuickDealSimulator";
import { HolidayDateWarning } from "../../common/HolidayDateWarning";
import { getCommercialDealSnippets } from "../../../utils/bookingTourContext";
import { isStitchLight } from "./venueTheme";
import React, { Dispatch, SetStateAction } from "react";

/** Estado y callbacks que el contenedor inyecta a la sección. */
export interface VenuePitchInfoSectionProps {
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
 * Pestaña de pitch y edición directa de la ficha del lead.
 * @param props Estado y callbacks del contenedor ({@link VenuePitchInfoSectionProps}).
 * @returns Sección de interfaz.
 */
export function VenuePitchInfoSection({ activeTab, isEditingLeadInfo, selectedLead, setIsEditingLeadInfo, handleSaveLeadInfo, editedLeadInfo, setEditedLeadInfo, handleAutoSearchLogo, isSearchingLogo, onLeadLogoUpload, isUploadingLeadLogo, handleAutoExtractFestivalDates, isExtractingDates, bandName, setEditedPitch, setIsEditingPitch, handleRecalculateFinancial, isRecalculatingFinancial, isReplyStage, setShowMultiModelModal, handleCopyPitch, copiedPitch, setShowWhatsAppModal, handleApprovePitchDirectly, isCreatingDraft, activeCampaign, handleRegeneratePitchWithFeedback, isRegeneratingPitch, editedPitch, onUpdateLead, isEditingPitch, handleSavePitch, setShowFeedbackHistory, showFeedbackHistory, setToneRating, toneRating, setContentRating, contentRating, feedbackComment, setFeedbackComment, setFeedbackScope, feedbackScope, feedbackSuccessMsg, selectedAiModel, setSelectedAiModel, handleRevertPitch, isRevertingPitch }: VenuePitchInfoSectionProps) {
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
          </div>
        </div>
      )}
    </>
  );
}
