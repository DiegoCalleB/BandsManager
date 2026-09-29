import React, { useState } from "react";
import { Lead, LeadStatus } from "../../types";
import { ModalPortal } from "../common/ModalPortal";
import {
  CheckSquare,
  MinusSquare,
  Square,
  X,
  ChevronDown,
  Sparkles,
  Search,
  Download,
  Trash2,
  Star,
  CheckCircle2,
  Send,
  Clock,
  ArrowRight,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";

interface BulkLeadsActionBarProps {
  selectedCount: number;
  totalFilteredCount: number;
  isAllSelected: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkStatusChange: (status: LeadStatus) => void;
  onBulkGeneratePitches: () => void;
  onBulkEnrich: () => void;
  onBulkToggleFavorite: (isFav: boolean) => void;
  onBulkExportCsv: () => void;
  onBulkDelete: () => void;
  sectionTab?: "salas" | "medios" | "grupos";
}

const STATUS_OPTIONS: {
  status: LeadStatus;
  label: string;
  color: string;
  icon: any;
}[] = [
  {
    status: "nuevo",
    label: "Nuevo Lead",
    color: "bg-[var(--tentative)]/50 text-[var(--acc)]/80",
    icon: Sparkles,
  },
  {
    status: "pendiente_aprobacion",
    label: "Pendiente Aprobación",
    color: "bg-[var(--acc)]/20 text-[var(--acc)]/70 ",
    icon: Clock,
  },
  {
    status: "aprobado",
    label: "Aprobado (Listo para envío)",
    color: "bg-[var(--ok)]/20 text-[var(--ink-2)]/40",
    icon: CheckCircle2,
  },
  {
    status: "esperando_respuesta",
    label: "Esperando Respuesta",
    color: "bg-[var(--acc)]/20 text-[var(--ink-2)]/40",
    icon: Send,
  },
  {
    status: "contactado",
    label: "Contactado",
    color: "bg-[var(--acc)]/20 text-[var(--acc)]/80",
    icon: MessageSquare,
  },
  {
    status: "respondido",
    label: "Respondido / Conversación",
    color: "bg-[var(--tentative)]/20 text-[var(--tentative)]/50",
    icon: MessageSquare,
  },
  {
    status: "negociando",
    label: "Negociando Caché / Fecha",
    color: "bg-[var(--tentative)]/20 text-[var(--tentative)]/80",
    icon: ArrowRight,
  },
  {
    status: "confirmado",
    label: "Confirmado (Cerrado)",
    color: "bg-[var(--ok)]/30 text-[var(--ink)]",
    icon: CheckCircle2,
  },
  {
    status: "aplazado",
    label: "Aplazado (Próxima temp.)",
    color: "bg-[var(--ink-3)]/60 text-[var(--ink-2)]",
    icon: Clock,
  },
  {
    status: "no_interesado",
    label: "No Interesado / Descartado",
    color: "bg-[var(--alert)]/20 text-[var(--ink-2)]/40",
    icon: ShieldAlert,
  },
];

export const BulkLeadsActionBar: React.FC<BulkLeadsActionBarProps> = ({
  selectedCount,
  totalFilteredCount,
  isAllSelected,
  onSelectAll,
  onDeselectAll,
  onBulkStatusChange,
  onBulkGeneratePitches,
  onBulkEnrich,
  onBulkToggleFavorite,
  onBulkExportCsv,
  onBulkDelete,
  sectionTab = "salas",
}) => {
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  if (selectedCount === 0) return null;

  const itemLabel =
    sectionTab === "medios"
      ? "medios"
      : sectionTab === "grupos"
        ? "bandas"
        : "salas";

  return (
    <>
      {/* Gmail-Style Sticky Top Actions Toolbar */}
      <div
        id="bulk-leads-action-bar"
        className={`sticky top-2 z-30 w-full mb-3 rounded-[var(--r-l)] p-2.5 sm:p-3 transition-all animate-slide-up ${"bg-[var(--surface)]/95 text-[var(--ink)] shadow-black/80"}`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-3">
          {/* Left section: Checkbox toggle, counter badge and quick Gmail-style select prompt */}
          <div className="flex items-center justify-between w-full md:w-auto gap-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={isAllSelected ? onDeselectAll : onSelectAll}
                className={`p-1.5 rounded-[var(--r-s)] transition-colors cursor-pointer shrink-0 ${"hover:bg-[var(--surface)] text-[var(--acc)]"}`}
                title={
                  isAllSelected
                    ? "Deseleccionar todo"
                    : `Seleccionar las ${totalFilteredCount} ${itemLabel}`
                }
              >
                {isAllSelected ? (
                  <CheckSquare className="w-5 h-5" />
                ) : selectedCount > 0 ? (
                  <MinusSquare className="w-5 h-5" />
                ) : (
                  <Square className="w-5 h-5 text-[var(--ink-2)]" />
                )}
              </button>

              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-[var(--r-s)] bg-[var(--acc)] text-[var(--on-acc)] font-bold flex items-center justify-center text-xs font-sans shrink-0">
                  {selectedCount}
                </span>
                <div className="leading-tight">
                  <div className="text-xs font-bold font-display flex items-center gap-1.5 flex-wrap">
                    <span>
                      {selectedCount} {itemLabel}{" "}
                      {selectedCount === 1 ? "seleccionada" : "seleccionadas"}
                    </span>
                    {!isAllSelected && totalFilteredCount > selectedCount && (
                      <button
                        type="button"
                        onClick={onSelectAll}
                        className="text-[11px] text-[var(--acc)] hover:underline font-sans cursor-pointer font-semibold underline-offset-2"
                        title={`Seleccionar los ${totalFilteredCount} registros filtrados`}
                      >
                        (Seleccionar las {totalFilteredCount})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick close / deselect on mobile */}
            <button
              type="button"
              onClick={onDeselectAll}
              className={`md:hidden p-1.5 rounded-[var(--r-s)] transition-colors cursor-pointer ${"text-[var(--ink-2)] hover:bg-[var(--sunken)]"}`}
              title="Cerrar selección"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Right section: Gmail-Style Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 w-full md:w-auto">
            {/* Status Change Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className={`px-3 py-1.5 rounded-[var(--r-m)] text-xs font-sans font-bold transition-all flex items-center gap-1.5 cursor-pointer ${"bg-[var(--accent-alt)]/10 hover:bg-[var(--accent-alt)]/30 text-[var(--accent-alt)]"}`}
                title="Cambiar el estado de todos los seleccionados"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--acc)]" />
                <span>Estado</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[var(--acc)] transition-transform ${isStatusDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Status Dropdown Menu (Opens downwards) */}
              {isStatusDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsStatusDropdownOpen(false)}
                  />
                  <div
                    className={`absolute top-full mt-2 right-0 z-50 w-64 rounded-[var(--r-l)] p-2 space-y-1 animate-scale-up max-h-72 overflow-y-auto ${"bg-[var(--surface)]"}`}
                  >
                    <div
                      className={`px-2 py-1 text-[10px] font-sans font-bold ${"text-[var(--ink-2)]"}`}
                    >
                      Mover {selectedCount} {itemLabel} a:
                    </div>
                    {STATUS_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.status}
                          type="button"
                          onClick={() => {
                            onBulkStatusChange(opt.status);
                            setIsStatusDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-[var(--r-s)] text-xs font-sans font-bold flex items-center gap-2 transition-all cursor-pointer ${"hover:bg-[var(--sunken)]"} ${opt.color}`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* AI Pitch Mass Generator */}
            <button
              type="button"
              onClick={onBulkGeneratePitches}
              className={`px-3 py-1.5 rounded-[var(--r-m)] text-xs font-sans font-bold transition-all flex items-center gap-1.5 cursor-pointer ${"bg-[var(--acc)]/80  hover:bg-[var(--acc)] text-[var(--acc)]/40"}`}
              title="Generar propuestas de pitch con IA para todos los seleccionados"
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]" />
              <span className="hidden sm:inline">Pitches IA</span>
              <span className="sm:hidden">Pitch</span>
            </button>

            {/* AI Contact Enrichment */}
            <button
              type="button"
              onClick={onBulkEnrich}
              className={`px-3 py-1.5 rounded-[var(--r-m)] text-xs font-sans font-bold transition-all flex items-center gap-1.5 cursor-pointer ${"bg-[var(--acc)]/80  hover:bg-[var(--acc)] text-[var(--tentative)]/40"}`}
              title="Buscar y enriquecer teléfonos, emails y redes con Scout IA"
            >
              <Search className="w-3.5 h-3.5 text-[var(--ink-2)]" />
              <span className="hidden sm:inline">Enriquecer IA</span>
              <span className="sm:hidden">Enriquecer</span>
            </button>

            {/* Favorite toggle */}
            <button
              type="button"
              onClick={() => onBulkToggleFavorite(true)}
              className={`p-1.5 rounded-[var(--r-m)] text-xs transition-all cursor-pointer ${"bg-[var(--sunken)] hover:bg-[var(--ink-3)]/60 text-[var(--acc)]/70"}`}
              title="Marcar como favoritos"
            >
              <Star className="w-4 h-4 fill-[var(--acc)]/30 text-[var(--acc)]" />
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={onBulkExportCsv}
              className={`px-2.5 py-1.5 rounded-[var(--r-m)] text-xs font-sans font-semibold transition-all flex items-center gap-1 cursor-pointer ${"bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--ink-2)]"}`}
              title="Exportar selección a CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">CSV</span>
            </button>

            {/* Delete button */}
            <button
              type="button"
              onClick={() => setIsConfirmDeleteOpen(true)}
              className="p-1.5 bg-[var(--alert-soft)] hover:bg-[var(--alert-soft)] text-[var(--ink-2)] rounded-[var(--r-m)] transition-all cursor-pointer"
              title={`Eliminar ${selectedCount} ${itemLabel}`}
            >
              <Trash2 className="w-4 h-4 text-[var(--alert)]" />
            </button>

            {/* Deselect Close Button (Desktop) */}
            <button
              type="button"
              onClick={onDeselectAll}
              className={`hidden md:flex p-1.5 rounded-[var(--r-m)] transition-colors cursor-pointer ${"text-[var(--ink-2)] hover:bg-[var(--sunken)]"}`}
              title="Deseleccionar todo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Bulk Deletion */}
      <ModalPortal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
      >
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/80 overflow-y-auto overscroll-contain animate-fade-in">
          <div className="w-full max-w-md bg-[var(--surface)] rounded-[var(--r-l)] p-5 space-y-4 my-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--alert)]/20 flex items-center justify-center text-[var(--alert)] shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--ink)] font-display">
                  ¿Eliminar {selectedCount} {itemLabel}?
                </h3>
                <p className="text-xs text-[var(--ink-2)] font-sans">
                  Esta acción eliminará los registros seleccionados de la base
                  de datos.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-[var(--r-m)] bg-[var(--alert-soft)] text-xs text-[var(--ink)] font-sans">
              ⚠️ Se borrarán definitivamente {selectedCount} elementos del CRM.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2800/80">
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(false)}
                className="px-3.5 py-2 rounded-[var(--r-m)] text-xs font-sans font-bold bg-[var(--sunken)] hover:bg-[var(--ink-3)]/60 text-[var(--ink-2)] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmDeleteOpen(false);
                  onBulkDelete();
                }}
                className="px-4 py-2 rounded-[var(--r-m)] text-xs font-sans font-bold bg-[var(--alert)] hover:bg-[var(--alert)] text-[var(--ink)] transition-colors cursor-pointer"
              >
                Sí, eliminar {selectedCount}
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    </>
  );
};
