import React, { useState } from "react";
import { BookingCampaign, PitchTemplateCategory } from "../../types";
import { CampanaAlcanceFields } from "./CampanaAlcanceFields";
import { CampanaFechasFields } from "./CampanaFechasFields"; import { textoDeRango } from "../../utils/textoDeRango";
import { Target, Calendar, MapPin, Users, Plus, X, Check, Trash2, Edit3, Compass, ShieldCheck, Flame, Wand2, Building2, Tent, Disc3, Radio, Briefcase, Landmark } from "lucide-react";
import { GenerateAllTemplatesModal } from "../booking/GenerateAllTemplatesModal";
import { apiFetch } from "../../utils/api";
import { ShowIcon } from '../ui/ShowIcon';
import { Button, IconButton, Input, LinkButton, Textarea } from '../ui';
import { comoErrorCapturado } from '../../utils/errorCapturado';
import type { NavigationOptions } from '../Dashboard';

/** Opciones con las que el gestor de campañas navega (además de las comunes, filtros de campaña). */
type OpcionesNavegacionCampana = NavigationOptions & { campaignFilter?: string; campaignCities?: string[] };

/** Respuesta de `POST /api/templates/generate-all`: una plantilla por categoría de lead. */
interface RespuestaGenerarPlantillas {
  success?: boolean;
  generatedResults?: Partial<Record<PitchTemplateCategory, { body?: string }>>;
  error?: string;
}

// Mismas 7 categorías y misma iconografía que src/components/booking/TemplateConfigSection.tsx
// (plantillas generales por tipo de lead), para que el mánager reconozca de un vistazo qué
// caso de uso está editando dentro de la campaña.
const PITCH_CATEGORIES: {
  id: PitchTemplateCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "salas", label: "Salas", icon: Building2 },
  { id: "festivales", label: "Festivales", icon: Tent },
  { id: "discotecas", label: "Discotecas", icon: Disc3 },
  { id: "medios", label: "Medios", icon: Radio },
  { id: "grupos", label: "Grupos", icon: Users },
  { id: "managements", label: "Managements", icon: Briefcase },
  { id: "ayuntamientos", label: "Ayuntamientos", icon: Landmark },
];

interface CampaignManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaigns: BookingCampaign[];
  activeCampaign: BookingCampaign | null;
  onSaveCampaign: (
    campaign: Partial<BookingCampaign>,
  ) => Promise<BookingCampaign>;
  onDeleteCampaign: (id: string) => Promise<void>;
  onSetActiveCampaign: (
    idOrCampaign: string | BookingCampaign | null,
  ) => Promise<void>;
  onNavigate?: (view: string, options?: OpcionesNavegacionCampana) => void;
}

export function CampaignManagerModal({
  isOpen,
  onClose,
  campaigns,
  activeCampaign,
  onSaveCampaign,
  onDeleteCampaign,
  onSetActiveCampaign,
  onNavigate,
}: CampaignManagerModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(
    null,
  );
  const [formData, setFormData] = useState<Partial<BookingCampaign>>({
    name: "",
    targetCities: ["Madrid"],
    minCapacity: 300,
    maxCapacity: 500,
    targetDates: ["2026-12-04", "2026-12-05"],
    notes: "",
    customPitchTemplates: {},
    color: "var(--acc)",
    isActive: true,
  });
  const [activePitchCategory, setActivePitchCategory] =
    useState<PitchTemplateCategory>("salas");
  const [isMultiTemplatesModalOpen, setIsMultiTemplatesModalOpen] =
    useState(false);
  const [isGeneratingAllTemplates, setIsGeneratingAllTemplates] =
    useState(false);
  const [templateGenerationFeedback, setTemplateGenerationFeedback] = useState<
    string | null
  >(null);

  const handleGenerateAllCampaignTemplates = async (
    baseProposal: string,
  ): Promise<boolean> => {
    setIsGeneratingAllTemplates(true);
    setTemplateGenerationFeedback(null);
    try {
      const data = await apiFetch<RespuestaGenerarPlantillas>("/api/templates/generate-all", {
        method: "POST",
        body: JSON.stringify({
          baseProposal,
          saveToDatabase: false,
          campaignContext: {
            name: formData.name,
            targetCities: formData.targetCities,
            targetDates: formData.targetDates,
            minCapacity: formData.minCapacity,
            maxCapacity: formData.maxCapacity,
            notes: formData.notes,
          },
        }),
      });
      if (data?.success && data?.generatedResults) {
        const newTemplates: Record<PitchTemplateCategory, string> = {
          ...(formData.customPitchTemplates || {}),
          salas: data.generatedResults.salas?.body || "",
          festivales: data.generatedResults.festivales?.body || "",
          discotecas: data.generatedResults.discotecas?.body || "",
          medios: data.generatedResults.medios?.body || "",
          grupos: data.generatedResults.grupos?.body || "",
          managements: data.generatedResults.managements?.body || "",
          ayuntamientos: data.generatedResults.ayuntamientos?.body || "",
        };
        setFormData((prev) => ({
          ...prev,
          customPitchTemplates: newTemplates,
        }));
        setTemplateGenerationFeedback(
          "✨ Se han adaptado y aplicado con éxito las 7 plantillas para esta campaña.",
        );
        return true;
      } else {
        setTemplateGenerationFeedback(
          data.error || "Error al generar las plantillas de campaña.",
        );
        return false;
      }
    } catch (errCapturado) {
      const err = comoErrorCapturado(errCapturado);
      console.error("Error in handleGenerateAllCampaignTemplates:", err);
      setTemplateGenerationFeedback(
        "⚠️ Error de conexión al generar las plantillas.",
      );
      return false;
    } finally {
      setIsGeneratingAllTemplates(false);
    }
  };

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setEditingCampaignId(null);
    setFormData({
      name: "Nueva Campaña " + new Date().getFullYear(),
      targetCities: ["Madrid"],
      minCapacity: 250,
      maxCapacity: 500,
      targetDates: ["2026-12-04", "2026-12-05"],
      notes: "Búsqueda de salas y fechas para la gira.",
      customPitchTemplates: {},
      color: "var(--acc)",
      isActive: true,
    });
    setActivePitchCategory("salas");
    setIsEditing(true);
  };

  const handleStartEdit = (camp: BookingCampaign) => {
    setEditingCampaignId(camp.id);
    setFormData({
      name: camp.name,
      alcance: camp.alcance || "salas",
      targetCities: [...(camp.targetCities || [])],
      minCapacity: camp.minCapacity || 0,
      maxCapacity: camp.maxCapacity || 0,
      targetDates: [...(camp.targetDates || [])],
      targetDatesText: camp.targetDatesText || "",
      campaignStartDate: camp.campaignStartDate || "",
      campaignEndDate: camp.campaignEndDate || "",
      notes: camp.notes || "",
      customPitchTemplates: { ...(camp.customPitchTemplates || {}) },
      color: camp.color || "var(--acc)",
      isActive: camp.isActive,
    });
    setActivePitchCategory("salas");
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) return;
    const dates = formData.targetDates || [];
    const formattedDatesText = dates
      .map((d) => {
        const parts = d.split("-");
        if (parts.length === 3) {
          const date = new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2]),
          );
          return date.toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
          });
        }
        return d;
      })
      .join(", ");

    const payload = {
      id: editingCampaignId || undefined,
      name: formData.name.trim(),
      alcance: formData.alcance === "festivales" ? ("festivales" as const) : ("salas" as const),
      // En festivales no hay ciudad ni aforo: se guardan vacíos para que no filtren nada.
      targetCities: formData.alcance === "festivales" ? [] : formData.targetCities || [],
      minCapacity: formData.alcance === "festivales" ? 0 : Number(formData.minCapacity || 0),
      maxCapacity: formData.alcance === "festivales" ? 0 : Number(formData.maxCapacity || 0),
      // En festivales no hay fechas sueltas: solo una ventana opcional «desde – hasta» para filtrar por época del año.
      targetDates: formData.alcance === "festivales" ? [] : dates,
      targetDatesText: formData.alcance === "festivales" ? textoDeRango(formData.campaignStartDate, formData.campaignEndDate) : formattedDatesText,
      campaignStartDate: formData.alcance === "festivales" ? formData.campaignStartDate || "" : "",
      campaignEndDate: formData.alcance === "festivales" ? formData.campaignEndDate || "" : "",
      notes: formData.notes || "",
      customPitchTemplates: formData.customPitchTemplates || {},
      color: formData.color || "var(--acc)",
      isActive: formData.isActive ?? true,
    };

    await onSaveCampaign(payload);

    setIsEditing(false);
    setEditingCampaignId(null);
  };

  const handlePitchTemplateChange = (
    category: PitchTemplateCategory,
    value: string,
  ) => {
    setFormData({
      ...formData,
      customPitchTemplates: {
        ...(formData.customPitchTemplates || {}),
        [category]: value,
      },
    });
  };

  const filledPitchCategoriesCount = Object.values(
    formData.customPitchTemplates || {},
  ).filter((v) => (v || "").trim()).length;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/80 animate-fade-in">
      <div className="bg-[var(--surface)] rounded-[var(--r-l)] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 flex items-center justify-between bg-[var(--sunken)] ">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--hair)]/20 text-[var(--ink-2)] flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-display text-[var(--ink)] flex items-center gap-2">
                Gestor de campañas de booking
                <span className="text-micro font-sans font-bold px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--hair)]/20 text-[var(--ink-2)]">
                  {campaigns.length} disponibles
                </span>
              </h2>
              <p className="text-xs text-[var(--ink-2)] font-sans mt-0.5">
                Configura los objetivos de fechas, ciudades y aforo. Al activar
                una campaña, toda la web, el calendario y los pitches de IA se
                enfocarán en ella.
              </p>
            </div>
          </div>
          <IconButton
            label="Cerrar"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </IconButton>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {isEditing ? (
            /* Editing / Creation Form */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3">
                <span className="text-xs font-sans font-bold text-[var(--acc)]">
                  {editingCampaignId
                    ? "✎ Editar Campaña"
                    : "Crear Nueva Campaña"}
                </span>
                <LinkButton
                  tone="muted"
                  onClick={() => setIsEditing(false)}
                >
                  Volver a la lista
                </LinkButton>
              </div>

              {/* Name & Color */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-sans font-bold text-[var(--ink-2)] mb-1">
                    Nombre de la campaña *
                  </label>
                  <Input
                    size="sm"
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ej: Campaña Diciembre 2026"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-sans font-bold text-[var(--ink-2)] mb-1">
                    Color en calendario
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    {[
                      "var(--acc)",
                      "var(--acc)",
                      "var(--ok)",
                      "var(--ok)",
                      "var(--alert)",
                      "var(--acc)",
                    ].map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: col })}
                        className={`w-7 h-7 rounded-[var(--r-s)] transition-transform cursor-pointer ${
                          formData.color === col
                            ? "scale-110 ring-2 ring-[var(--ink)]/40"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <CampanaAlcanceFields formData={formData} setFormData={setFormData} />

              <CampanaFechasFields formData={formData} setFormData={setFormData} campaignId={editingCampaignId} />

              {/* Notes / Co-booking details */}
              <div>
                <label className="block text-xs font-sans font-bold text-[var(--ink-2)] mb-1">
                  Notas de Enfoque y Co-booking
                </label>
                <Textarea
                  rows={2}
                  value={formData.notes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Ej: Intercambio con bandas de ska/mestizaje locales para compartir backline y taquilla al 50%."
                  className="w-full"
                />
              </div>

              {/* Campaign-specific pitch templates, one per lead use case */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-mono font-bold text-[var(--ink-2)] flex items-center gap-2">
                    Plantillas de pitch de campaña por caso de uso
                    {filledPitchCategoriesCount > 0 && (
                      <span className="text-micro font-sans font-extrabold px-1.5 py-0.5 rounded bg-[var(--hair)]/20 text-[var(--ink-2)]">
                        {filledPitchCategoriesCount}/{PITCH_CATEGORIES.length}{" "}
                        definidas
                      </span>
                    )}
                  </label>

                  <Button
                    variant="neutral"
                    size="xs"
                    type="button"
                    onClick={() => setIsMultiTemplatesModalOpen(true)}
                    className="items-center gap-1.5"
                    title="Adapta automáticamente el mensaje y objetivo de esta campaña a las 7 categorías de recintos"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-[var(--acc)]" />
                    <span>Generar las 7 con IA</span>
                  </Button>
                </div>

                {templateGenerationFeedback && (
                  <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/10 text-[var(--ink)] text-xs flex items-center justify-between">
                    <span>{templateGenerationFeedback}</span>
                    <button
                      type="button"
                      onClick={() => setTemplateGenerationFeedback(null)}
                      className="font-bold text-[var(--acc)] hover:text-[var(--ink)] ml-2"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {PITCH_CATEGORIES.map((cat) => {
                    const hasContent = !!(
                      formData.customPitchTemplates?.[cat.id] || ""
                    ).trim();
                    const isSelected = activePitchCategory === cat.id;
                    return (
                      <Button
                        variant={isSelected ? "inverse" : "neutral"}
                        size="xs"
                        key={cat.id}
                        type="button"
                        onClick={() => setActivePitchCategory(cat.id)}
                        className="items-center gap-1"
                      >
                        <cat.icon className="w-3 h-3" />
                        {cat.label}
                        {hasContent && (
                          <span className="w-1.5 h-1.5 rounded-[var(--r-pill)] bg-[var(--ok)]" />
                        )}
                      </Button>
                    );
                  })}
                </div>
                <Textarea
                  key={activePitchCategory}
                  rows={3}
                  value={
                    formData.customPitchTemplates?.[activePitchCategory] || ""
                  }
                  onChange={(e) =>
                    handlePitchTemplateChange(
                      activePitchCategory,
                      e.target.value,
                    )
                  }
                  placeholder={`Ej: Mensaje clave que el Redactor IA debe priorizar para "${PITCH_CATEGORIES.find((c) => c.id === activePitchCategory)?.label}" mientras esta campaña esté activa. Déjalo vacío para usar solo la plantilla habitual de este tipo.`}
                  className="w-full"
                />
                <p className="text-xs text-[var(--ink-2)] italic mt-1">
                  <ShowIcon inline emoji="💡" />Cada caso de uso tiene su propio mensaje. Mientras esta
                  campaña esté activa, el Redactor IA prioriza el mensaje de la
                  categoría del lead sobre la plantilla habitual; las categorías
                  sin mensaje definido siguen usando solo la plantilla habitual.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-[var(--r-pill)] text-xs font-sans font-bold text-[var(--ink-2)] hover:text-[var(--ink)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70"
                >
                  Cancelar
                </button>
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  onClick={handleSave}
                  className="items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Guardar campaña
                </Button>
              </div>
            </div>
          ) : (
            /* Campaigns List & Switcher */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-sans font-bold text-[var(--ink-2)]">
                    Campañas registradas
                  </span>
                </div>
                <Button
                  variant="neutral"
                  size="xs"
                  onClick={handleStartCreate}
                  className="items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> + Nueva campaña
                </Button>
              </div>

              {/* General Mode Button (No active filter) */}
              <div
                onClick={() => onSetActiveCampaign(null)}
                className={`p-3.5 rounded-[var(--r-m)] transition-ui cursor-pointer flex items-center justify-between ${
                  !activeCampaign
                    ? "bg-[var(--surface)]/80 ring-1 ring-[var(--acc)]/30"
                    : "bg-[var(--sunken)] hover:text-[var(--ink-2)] hover:text-[var(--ink-2)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-[var(--r-s)] flex items-center justify-center ${
                      !activeCampaign
                        ? "bg-[var(--ink)] text-[var(--bg)]"
                        : "bg-[var(--surface)]/80 text-[var(--ink-2)]"
                    }`}
                  >
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--ink)]">
                        Modo general (Sin filtro de campaña)
                      </span>
                      {!activeCampaign && (
                        <span className="text-micro font-sans font-extrabold px-1.5 py-0.5 rounded bg-[var(--acc)] text-[var(--on-acc)]">
                          ACTIVO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--ink-2)]">
                      Muestra todas las salas, bandas y conciertos sin filtrar
                      por una campaña específica.
                    </p>
                  </div>
                </div>
                {!activeCampaign ? (
                  <Check className="w-5 h-5 text-[var(--acc)]" />
                ) : (
                  <span className="text-micro font-sans text-[var(--ink-2)] hover:text-[var(--ink-2)]">
                    Seleccionar
                  </span>
                )}
              </div>

              {/* List of custom campaigns */}
              <div className="space-y-3">
                {campaigns.map((camp) => {
                  const isActive = activeCampaign?.id === camp.id;
                  const themeColor = camp.color || "var(--acc)";
                  return (
                    <div
                      key={camp.id}
                      className={`p-4 rounded-[var(--r-m)] transition-ui relative overflow-hidden ${
                        isActive
                          ? "bg-[var(--surface)]/60 ring-1 ring-[var(--acc)]/30"
                          : "bg-[var(--sunken)] hover:"
                      }`}
                    >
                      {/* Left accent stripe */}
                      <div
                        className="absolute top-0 left-0 bottom-0 w-1.5"
                        style={{ backgroundColor: themeColor }}
                      />

                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 ml-2">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="w-2.5 h-2.5 rounded-[var(--r-pill)] shrink-0"
                              style={{ backgroundColor: themeColor }}
                            />
                            <h3 className="text-sm font-bold font-display text-[var(--ink)]">
                              {camp.name}
                            </h3>
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 text-micro font-sans font-extrabold px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--hair)]/20 text-[var(--ink-2)]">
                                <Flame className="w-2.5 h-2.5 text-[var(--acc)]" />
                                MODO ACTIVO EN LA WEB
                              </span>
                            ) : (
                              <LinkButton
                                size="xs"
                                type="button"
                                onClick={() => onSetActiveCampaign(camp)}
                              >
                                Activar modo campaña
                              </LinkButton>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--ink-2)] pt-0.5">
                            <span className="flex items-center gap-1 text-[var(--ink-2)]">
                              <MapPin className="w-3.5 h-3.5 text-[var(--ink-2)]" />
                              {camp.targetCities?.join(", ") ||
                                "Cualquier ciudad"}
                            </span>
                            <span className="flex items-center gap-1 text-[var(--acc)]/70">
                              <Users className="w-3.5 h-3.5 text-[var(--acc)]" />
                              {camp.minCapacity} - {camp.maxCapacity} pax
                            </span>
                            <span className="flex items-center gap-1 text-[var(--alert)]">
                              <Calendar className="w-3.5 h-3.5 text-[var(--alert)]" />
                              {camp.targetDates?.length || 0} fechas (
                              {camp.targetDatesText || "Sin definir"})
                            </span>
                            {Object.values(
                              camp.customPitchTemplates || {},
                            ).some((v) => (v || "").trim()) && (
                              <span className="flex items-center gap-1 text-[var(--ink-2)]">
                                {
                                  Object.values(
                                    camp.customPitchTemplates || {},
                                  ).filter((v) => (v || "").trim()).length
                                }{" "}
                                plantilla(s) propia(s)
                              </span>
                            )}
                          </div>

                          {camp.notes && (
                            <p className="text-xs text-[var(--ink-2)] italic font-sans pt-1">
                              &ldquo;{camp.notes}&rdquo;
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {isActive ? (
                            <div className="flex items-center gap-2">
                              {onNavigate && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    onNavigate("calendario", {
                                      selectedDate: camp.targetDates?.[0],
                                    });
                                  }}
                                  className="px-2.5 py-1.5 rounded-[var(--r-pill)] text-micro font-sans font-bold bg-[var(--hair)]/20 text-[var(--ink-2)] hover:bg-[var(--hair)]/30 flex items-center gap-1"
                                >
                                  <Calendar className="w-3 h-3" /> Ver en
                                  Calendario
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => onSetActiveCampaign(null)}
                                className="px-2.5 py-1.5 rounded-[var(--r-pill)] text-micro font-sans font-bold bg-[var(--surface)]/80 text-[var(--ink-2)] hover:bg-[var(--surface)]/70"
                              >
                                Desactivar
                              </button>
                            </div>
                          ) : (
                            <Button
                              variant="primary"
                              size="xs"
                              type="button"
                              onClick={() => onSetActiveCampaign(camp)}
                              className="items-center gap-1.5"
                            >
                              <Target className="w-3.5 h-3.5" /> Activar
                            </Button>
                          )}

                          <IconButton
                            label="Editar campaña"
                            type="button"
                            onClick={() => handleStartEdit(camp)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </IconButton>

                          <IconButton
                            label="Eliminar campaña"
                            variant="danger"
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `¿Eliminar la campaña "${camp.name}"?`,
                                )
                              ) {
                                onDeleteCampaign(camp.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </IconButton>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[var(--sunken)] flex justify-between items-center text-xs text-[var(--ink-2)]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--ok)]" />
            <span>Se guarda en tu cuenta</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-[var(--r-pill)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink)] font-sans font-bold text-xs"
          >
            Cerrar
          </button>
        </div>

        {/* Multi-templates generator modal for this campaign */}
        <GenerateAllTemplatesModal
          isOpen={isMultiTemplatesModalOpen}
          onClose={() => setIsMultiTemplatesModalOpen(false)}
          initialBaseText={formData.notes || ""}
          onGenerateAll={handleGenerateAllCampaignTemplates}
          isGenerating={isGeneratingAllTemplates}
          mode="campaign"
          campaignContext={{
            name: formData.name,
            targetCities: formData.targetCities,
            targetDates: formData.targetDates,
            minCapacity: formData.minCapacity,
            maxCapacity: formData.maxCapacity,
            notes: formData.notes,
          }}
        />
      </div>
    </div>
  );
}
export default CampaignManagerModal;
