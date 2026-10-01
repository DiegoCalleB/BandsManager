import React, { useState, useMemo } from "react";
import {
  X,
  Copy,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Trash2,
  Merge,
  Sparkles,
  MapPin,
  Mail,
  Phone,
  Globe,
  ExternalLink,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Lead } from "../../types";
import {
  findDuplicateLeads,
  DuplicateGroup,
  DuplicateMatchReason,
  mergeTwoLeads,
  calculateLeadCompletenessScore,
} from "../../utils/duplicateLeads";
import { ModalPortal } from "../common/ModalPortal";
import { apiFetch } from "../../utils/api";
import { ShowIcon } from '../ui/ShowIcon';
import { Button, IconButton, LinkButton } from '../ui';

interface LeadDuplicatesModalProps {
  /** Heredado de main: Espectro resuelve el tema en tokens, así que se acepta y se ignora. */
  isStitchLight?: boolean;
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  onUpdateLead?: (lead: Lead) => void;
  onDeleteLead?: (id: string) => void;
}

export const LeadDuplicatesModal: React.FC<LeadDuplicatesModalProps> = ({
  isOpen,
  onClose,
  leads,
  onUpdateLead,
  onDeleteLead,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [ignoredGroupIds, setIgnoredGroupIds] = useState<Set<string>>(
    new Set(),
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Analizar duplicados
  const rawGroups = useMemo(() => {
    return findDuplicateLeads(leads);
  }, [leads]);

  // Filtrar grupos ignorados o por tipo
  const duplicateGroups = useMemo(() => {
    return rawGroups.filter((g) => {
      if (ignoredGroupIds.has(g.id)) return false;
      if (selectedFilter === "all") return true;
      return g.matchReason === selectedFilter;
    });
  }, [rawGroups, ignoredGroupIds, selectedFilter]);

  const totalInvolvedLeads = useMemo(() => {
    const ids = new Set<string>();
    duplicateGroups.forEach((g) => g.leads.forEach((l) => ids.add(l.id)));
    return ids.size;
  }, [duplicateGroups]);

  if (!isOpen) return null;

  // Fusionar un grupo conservando el lead especificado
  const handleMergeGroup = async (
    group: DuplicateGroup,
    keepLeadId: string,
  ) => {
    setIsProcessing(true);
    try {
      const targetLead = group.leads.find((l) => l.id === keepLeadId);
      if (!targetLead) return;

      let mergedLead = { ...targetLead };
      const secondaryLeads = group.leads.filter((l) => l.id !== keepLeadId);

      for (const sec of secondaryLeads) {
        mergedLead = mergeTwoLeads(mergedLead, sec);
      }

      // 1. Actualizar el lead principal en el backend
      await apiFetch(`/api/leads/${mergedLead.id}`, {
        method: "PUT",
        body: JSON.stringify(mergedLead),
      });
      onUpdateLead?.(mergedLead);

      // 2. Eliminar los secundarios
      const idsToDelete = secondaryLeads.map((l) => l.id);
      if (idsToDelete.length > 0) {
        try {
          await apiFetch("/api/leads/bulk-delete", {
            method: "POST",
            body: JSON.stringify({ ids: idsToDelete }),
          });
        } catch {
          // Fallback a borrado individual si bulk falla
          for (const id of idsToDelete) {
            await apiFetch(`/api/leads/${id}`, { method: "DELETE" });
          }
        }

        idsToDelete.forEach((id) => onDeleteLead?.(id));
      }

      setIgnoredGroupIds((prev) => new Set(prev).add(group.id));
      window.dispatchEvent(new CustomEvent("app-data-updated"));
      setSuccessMessage(`Sala "${mergedLead.nombre_sala}" fusionada con éxito.`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      console.error("Error al fusionar grupo:", err);
      alert(
        "Hubo un error al fusionar las salas. Por favor, inténtalo de nuevo.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Eliminar un lead individual duplicado
  const handleDeleteSingleLead = async (leadId: string, leadName: string) => {
    if (
      !confirm(
        `¿Seguro que deseas eliminar el registro duplicado "${leadName}"?`,
      )
    )
      return;

    setIsProcessing(true);
    try {
      await apiFetch(`/api/leads/${leadId}`, { method: "DELETE" });
      onDeleteLead?.(leadId);
      window.dispatchEvent(new CustomEvent("app-data-updated"));
      setSuccessMessage(`Registro "${leadName}" eliminado.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error deleting lead:", err);
      alert("Error al eliminar el lead.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Fusionar todos los duplicados automáticamente
  const handleMergeAllAuto = async () => {
    if (
      !confirm(
        `¿Deseas fusionar automáticamente los ${duplicateGroups.length} grupos detectados? Se conservará el registro más completo de cada grupo y se combinarán teléfonos, notas y datos de contacto.`,
      )
    ) {
      return;
    }

    setIsProcessing(true);
    let count = 0;
    try {
      for (const group of duplicateGroups) {
        const keepId = group.suggestedKeepId;
        const targetLead = group.leads.find((l) => l.id === keepId);
        if (!targetLead) continue;

        let mergedLead = { ...targetLead };
        const secondaryLeads = group.leads.filter((l) => l.id !== keepId);

        for (const sec of secondaryLeads) {
          mergedLead = mergeTwoLeads(mergedLead, sec);
        }

        await apiFetch(`/api/leads/${mergedLead.id}`, {
          method: "PUT",
          body: JSON.stringify(mergedLead),
        });
        onUpdateLead?.(mergedLead);

        const idsToDelete = secondaryLeads.map((l) => l.id);
        if (idsToDelete.length > 0) {
          try {
            await apiFetch("/api/leads/bulk-delete", {
              method: "POST",
              body: JSON.stringify({ ids: idsToDelete }),
            });
          } catch {
            for (const id of idsToDelete) {
              await apiFetch(`/api/leads/${id}`, { method: "DELETE" });
            }
          }
          idsToDelete.forEach((id) => onDeleteLead?.(id));
        }
        count++;
      }

      window.dispatchEvent(new CustomEvent("app-data-updated"));
      setSuccessMessage(
        `Se han fusionado con éxito ${count} grupos de salas duplicadas.`,
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error("Error merging all leads:", err);
      alert("Ocurrió un problema durante la fusión automática masiva.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reasonCounts = {
    all: rawGroups.length,
    same_email: rawGroups.filter((g) => g.matchReason === "same_email").length,
    same_name_and_city: rawGroups.filter(
      (g) => g.matchReason === "same_name_and_city",
    ).length,
    similar_name_same_city: rawGroups.filter(
      (g) => g.matchReason === "similar_name_same_city",
    ).length,
    same_website: rawGroups.filter((g) => g.matchReason === "same_website")
      .length,
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-[var(--scrim)]/80 animate-in fade-in duration-200">
        <div
          className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[var(--r-l)] overflow-hidden transition-ui ${"bg-[var(--surface)] text-[var(--ink)]"}`}
        >
          {/* Header */}
          <div
            className={`p-4 sm:p-5 flex items-center justify-between shrink-0 ${"bg-[var(--sunken)]"}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/15 text-[var(--acc-ink)]">
                <Copy className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-[var(--ink)]">
                    Detector y limpiador de duplicados
                  </h2>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-[var(--r-pill)] bg-[var(--acc)]/15 text-[var(--acc-ink)]">
                    {duplicateGroups.length}{" "}
                    {duplicateGroups.length === 1 ? "grupo" : "grupos"}
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${"text-[var(--ink-2)]"}`}>
                  Detecta salas y contactos repetidos por email idéntico, nombre
                  y ciudad, o dominios coincidentes.
                </p>
              </div>
            </div>

            <Button variant="ghost" size="sm" aria-label="Cerrar"
              type="button"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="bg-[var(--ok)]/15 px-4 py-2.5 flex items-center gap-2 text-xs font-medium text-[var(--ink)] animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-[var(--ok)] shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Controls & Filter Bar */}
          <div
            className={`p-3 sm:px-5 flex flex-wrap items-center justify-between gap-2.5 shrink-0 ${"bg-[var(--sunken)]/60"}`}
          >
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto shrink-0 py-1 max-w-full text-xs">
              <button
                type="button"
                onClick={() => setSelectedFilter("all")}
                className={`px-3 py-1.5 rounded-[var(--r-pill)] font-medium transition cursor-pointer shrink-0 ${
                  selectedFilter === "all"
                    ? "bg-[var(--ink)] text-[var(--bg)] font-bold"
                    : "bg-[var(--surface)] text-[var(--ink-2)] hover:bg-[var(--sunken)]"
                }`}
              >
                Todos ({reasonCounts.all})
              </button>
              {reasonCounts.same_email > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedFilter("same_email")}
                  className={`px-3 py-1.5 rounded-[var(--r-pill)] font-medium transition cursor-pointer shrink-0 ${
                    selectedFilter === "same_email"
                      ? "bg-[var(--ink)] text-[var(--bg)] font-bold"
                      : "bg-[var(--surface)] text-[var(--ink-2)] hover:bg-[var(--sunken)]"
                  }`}
                >
                  Mismo Email ({reasonCounts.same_email})
                </button>
              )}
              {reasonCounts.same_name_and_city > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedFilter("same_name_and_city")}
                  className={`px-3 py-1.5 rounded-[var(--r-pill)] font-medium transition cursor-pointer shrink-0 ${
                    selectedFilter === "same_name_and_city"
                      ? "bg-[var(--ink)] text-[var(--bg)] font-bold"
                      : "bg-[var(--surface)] text-[var(--ink-2)] hover:bg-[var(--sunken)]"
                  }`}
                >
                  Mismo Nombre y Ciudad ({reasonCounts.same_name_and_city})
                </button>
              )}
              {reasonCounts.similar_name_same_city > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedFilter("similar_name_same_city")}
                  className={`px-3 py-1.5 rounded-[var(--r-pill)] font-medium transition cursor-pointer shrink-0 ${
                    selectedFilter === "similar_name_same_city"
                      ? "bg-[var(--ink)] text-[var(--bg)] font-bold"
                      : "bg-[var(--surface)] text-[var(--ink-2)] hover:bg-[var(--sunken)]"
                  }`}
                >
                  Nombre Similar ({reasonCounts.similar_name_same_city})
                </button>
              )}
              {reasonCounts.same_website > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedFilter("same_website")}
                  className={`px-3 py-1.5 rounded-[var(--r-pill)] font-medium transition cursor-pointer shrink-0 ${
                    selectedFilter === "same_website"
                      ? "bg-[var(--ink)] text-[var(--bg)] font-bold"
                      : "bg-[var(--surface)] text-[var(--ink-2)] hover:bg-[var(--sunken)]"
                  }`}
                >
                  Misma Web ({reasonCounts.same_website})
                </button>
              )}
            </div>

            {/* Bulk Action */}
            {duplicateGroups.length > 0 && (
              <Button
                variant="primary"
                size="xs"
                type="button"
                disabled={isProcessing}
                onClick={handleMergeAllAuto}
                className="items-center gap-1.5 shrink-0 ml-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fusionar todos automáticamente</span>
              </Button>
            )}
          </div>

          {/* List of Duplicate Groups */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {duplicateGroups.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-[var(--r-pill)] bg-[var(--ok)]/10 text-[var(--ok)] flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[var(--ink)]">
                  ¡No se han encontrado salas ni leads duplicados!
                </h3>
                <p className="text-xs text-[var(--ink-2)] max-w-md mx-auto">
                  Tu base de datos está perfectamente limpia y organizada. No
                  hay coincidencias conflictivas de nombres, correos ni
                  recintos.
                </p>
              </div>
            ) : (
              duplicateGroups.map((group) => (
                <div
                  key={group.id}
                  className={`rounded-[var(--r-l)] p-4 transition-ui ${"bg-[var(--bg)]/70"}`}
                >
                  {/* Group Top Info */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 ">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-[var(--r-s)] text-xs font-semibold bg-[var(--acc)]/15 text-[var(--acc-ink)] flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {group.matchReasonLabel}
                      </span>
                      <span className="text-xs text-[var(--ink-2)]">
                        {group.confidence}% de certeza
                      </span>
                    </div>

                    <LinkButton
                      tone="muted"
                      type="button"
                      onClick={() =>
                        setIgnoredGroupIds((prev) =>
                          new Set(prev).add(group.id),
                        )
                      }
                    >
                      Ignorar (No son duplicados)
                    </LinkButton>
                  </div>

                  {/* Comparative Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {group.leads.map((lead) => {
                      const isSuggested = lead.id === group.suggestedKeepId;
                      const score = calculateLeadCompletenessScore(lead);

                      return (
                        <div
                          key={lead.id}
                          className={`rounded-[var(--r-m)] p-3.5 flex flex-col justify-between transition-ui ${
                            isSuggested
                              ? "bg-[var(--accent-alt)]/10"
                              : "bg-[var(--surface)]"
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-bold text-sm text-[var(--ink)] truncate">
                                    {lead.nombre_sala}
                                  </h4>
                                  {isSuggested && (
                                    <span className="px-1.5 py-0.5 rounded text-micro font-bold bg-[var(--acc)] text-[var(--on-acc)]">
                                      <ShowIcon inline emoji="⭐" />Recomendado
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-[var(--ink-2)] mt-0.5">
                                  <MapPin className="w-3 h-3 text-[var(--ink-2)] shrink-0" />
                                  <span>{lead.ciudad || "Sin ciudad"}</span>
                                  {lead.region && <span>· {lead.region}</span>}
                                </div>
                              </div>

                              <span className="px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-semibold bg-[var(--surface)]/80 text-[var(--ink-2)] capitalize shrink-0">
                                {lead.estado || "nuevo"}
                              </span>
                            </div>

                            {/* Contact Details */}
                            <div className="space-y-1 text-xs text-[var(--ink-2)] pt-1">
                              {lead.email_contacto ? (
                                <div className="flex items-center gap-1.5 truncate">
                                  <Mail className="w-3 h-3 text-[var(--ink-2)] shrink-0" />
                                  <span className="truncate">
                                    {lead.email_contacto}
                                  </span>
                                </div>
                              ) : (
                                <div className="text-xs text-[var(--ink-2)] italic">
                                  Sin correo electrónico
                                </div>
                              )}

                              {lead.telefono_movil && (
                                <div className="flex items-center gap-1.5 truncate text-[var(--ok)] font-medium">
                                  <span><ShowIcon inline emoji="📱" /></span>
                                  <span>{lead.telefono_movil}</span>
                                </div>
                              )}

                              {lead.telefono_fijo && (
                                <div className="flex items-center gap-1.5 truncate text-[var(--acc)] font-medium">
                                  <span><ShowIcon inline emoji="☎️" /></span>
                                  <span>{lead.telefono_fijo}</span>
                                </div>
                              )}

                              {!lead.telefono_movil &&
                                !lead.telefono_fijo &&
                                lead.telefono && (
                                  <div className="flex items-center gap-1.5 truncate">
                                    <Phone className="w-3 h-3 text-[var(--ink-2)] shrink-0" />
                                    <span>{lead.telefono}</span>
                                  </div>
                                )}

                              {lead.website && (
                                <div className="flex items-center gap-1.5 truncate text-xs text-[var(--ink-2)]">
                                  <Globe className="w-3 h-3 shrink-0" />
                                  <span className="truncate">
                                    {lead.website}
                                  </span>
                                </div>
                              )}

                              {lead.aforo ? (
                                <div className="text-xs text-[var(--ink-2)]">
                                  Aforo:{" "}
                                  <span className="font-medium text-[var(--ink)]">
                                    {lead.aforo} personas
                                  </span>
                                </div>
                              ) : null}

                              {lead.notas && (
                                <p className="text-xs text-[var(--ink-2)] line-clamp-2 bg-[var(--sunken)] p-1.5 rounded-[var(--r-s)] mt-1">
                                  {lead.notas}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Card Actions */}
                          <div className="mt-3.5 pt-2.5  flex items-center justify-between gap-2">
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleMergeGroup(group, lead.id)}
                              className={`px-2.5 py-1.5 rounded-[var(--r-pill)] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                isSuggested
                                  ? "bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)]"
                                  : "bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink)]"
                              }`}
                              title="Conserva este lead y añade todos los teléfonos, notas y datos de los demás"
                            >
                              <Merge className="w-3.5 h-3.5" />
                              <span>Conservar y fusionar aquí</span>
                            </button>

                            <IconButton
                              label="Eliminar solo este registro individual"
                              variant="danger"
                              type="button"
                              disabled={isProcessing}
                              onClick={() =>
                                handleDeleteSingleLead(
                                  lead.id,
                                  lead.nombre_sala,
                                )
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </IconButton>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            className={`p-3 sm:px-5 flex items-center justify-between text-xs ${"bg-[var(--bg)] text-[var(--ink-2)]"}`}
          >
            <span>
              Total analizado:{" "}
              <strong className="text-[var(--ink)]">{leads.length}</strong>{" "}
              salas y leads.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-[var(--r-pill)] font-medium bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink)] transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
