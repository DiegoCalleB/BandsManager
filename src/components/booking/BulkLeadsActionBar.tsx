import { PopoverAncla } from '../ui/PopoverAncla';
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
import { ShowIcon } from '../ui/ShowIcon';
import { Button, LinkButton } from '../ui';

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
    color: "bg-[var(--tentative)] text-[var(--on-tentative)]",
    icon: Sparkles,
  },
  {
    status: "pendiente_aprobacion",
    label: "Pendiente Aprobación",
    color: "bg-[var(--acc)]/20 text-[var(--ink)] ",
    icon: Clock,
  },
  {
    status: "aprobado",
    label: "Aprobado (Listo para envío)",
    color: "bg-[var(--ok)]/20 text-[var(--ink)]",
    icon: CheckCircle2,
  },
  {
    status: "esperando_respuesta",
    label: "Esperando Respuesta",
    color: "bg-[var(--acc)]/20 text-[var(--ink)]",
    icon: Send,
  },
  {
    status: "contactado",
    label: "Contactado",
    color: "bg-[var(--acc)]/20 text-[var(--ink)]",
    icon: MessageSquare,
  },
  {
    status: "respondido",
    label: "Respondido / Conversación",
    color: "bg-[var(--tentative)]/20 text-[var(--tentative)]",
    icon: MessageSquare,
  },
  {
    status: "negociando",
    label: "Negociando Caché / Fecha",
    color: "bg-[var(--tentative)]/20 text-[var(--tentative)]",
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
    color: "bg-[var(--ink-3)]/60 text-[var(--ink)]",
    icon: Clock,
  },
  {
    status: "no_interesado",
    label: "No Interesado / Descartado",
    color: "bg-[var(--alert)]/20 text-[var(--ink)]",
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
        className={`sticky top-2 z-30 w-full mb-3 rounded-[var(--r-l)] p-2.5 sm:p-3 transition-ui animate-slide-up ${"bg-[var(--surface)]/95 text-[var(--ink)] shadow-black/80"}`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-3">
          {/* Left section: Checkbox toggle, counter badge and quick Gmail-style select prompt */}
          <div className="flex items-center justify-between w-full md:w-auto gap-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={isAllSelected ? onDeselectAll : onSelectAll}
                className={`p-1.5 rounded-[var(--r-pill)] transition-colors cursor-pointer shrink-0 ${"hover:bg-[var(--surface)] text-[var(--acc)]"}`}
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
                      <LinkButton
                        type="button"
                        onClick={onSelectAll}
                        title={`Seleccionar los ${totalFilteredCount} registros filtrados`}
                      >
                        (Seleccionar las {totalFilteredCount})
                      </LinkButton>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick close / deselect on mobile */}
            <Button
              variant="ghost"
              size="xs"
              type="button"
              onClick={onDeselectAll}
              className="md:hidden"
              title="Cerrar selección"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Right section: Gmail-Style Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 w-full md:w-auto">
            {/* Status Change Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className={`px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-sans font-bold transition-ui flex items-center gap-1.5 cursor-pointer ${"bg-[var(--accent-alt)]/10 hover:bg-[var(--accent-alt)]/30 text-[var(--accent-alt)]"}`}
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
                  <PopoverAncla
                    className={`absolute top-full mt-2 right-0 z-50 w-64 rounded-[var(--r-l)] p-2 space-y-1 animate-scale-up max-h-72 overflow-y-auto ${"bg-[var(--surface)]"}`}
                  >
                    <div
                      className={`px-2 py-1 text-micro font-sans font-bold ${"text-[var(--ink-2)]"}`}
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
                          className={`w-full text-left px-2.5 py-1.5 rounded-[var(--r-s)] text-xs font-sans font-bold flex items-center gap-2 transition-ui cursor-pointer ${"hover:bg-[var(--sunken)]"} ${opt.color}`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{opt.label}</span>
                        </button>
                      );
                    })}
                  </PopoverAncla>
                </>
              )}
            </div>

            {/* AI Pitch Mass Generator */}
            <Button
              variant="primary"
              size="xs"
              type="button"
              onClick={onBulkGeneratePitches}
              className="items-center gap-1.5"
              title="Generar propuestas de pitch con IA para todos los seleccionados"
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]" />
              <span className="hidden sm:inline">Pitches IA</span>
              <span className="sm:hidden">Pitch</span>
            </Button>

            {/* AI Contact Enrichment */}
            <Button
              variant="primary"
              size="xs"
              type="button"
              onClick={onBulkEnrich}
              className="items-center gap-1.5"
              title="Buscar y enriquecer teléfonos, emails y redes con Scout IA"
            >
              <Search className="w-3.5 h-3.5 text-[var(--ink-2)]" />
              <span className="hidden sm:inline">Enriquecer IA</span>
              <span className="sm:hidden">Enriquecer</span>
            </Button>

            {/* Favorite toggle */}
            <Button
              variant="neutral"
              size="xs"
              type="button"
              onClick={() => onBulkToggleFavorite(true)}
              title="Marcar como favoritos"
            >
              <Star className="w-4 h-4 fill-[var(--acc)]/30 text-[var(--acc)]" />
            </Button>

            {/* Export CSV */}
            <Button
              variant="neutral"
              size="xs"
              type="button"
              onClick={onBulkExportCsv}
              className="items-center gap-1"
              title="Exportar selección a CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">CSV</span>
            </Button>

            {/* Delete button */}
            <Button
              variant="danger"
              size="xs"
              type="button"
              onClick={() => setIsConfirmDeleteOpen(true)}
              title={`Eliminar ${selectedCount} ${itemLabel}`}
            >
              <Trash2 className="w-4 h-4 text-[var(--alert)]" />
            </Button>

            {/* Deselect Close Button (Desktop) */}
            <Button
              variant="ghost"
              size="xs"
              type="button"
              onClick={onDeselectAll}
              className="hidden"
              title="Deseleccionar todo"
            >
              <X className="w-4 h-4" />
            </Button>
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
              <div className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--alert)]/20 flex items-center justify-center text-[var(--ink)] shrink-0">
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
              <ShowIcon inline emoji="⚠️" />Se borrarán definitivamente {selectedCount} elementos del CRM.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2800/80">
              <Button
                variant="neutral"
                size="sm"
                type="button"
                onClick={() => setIsConfirmDeleteOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                type="button"
                onClick={() => {
                  setIsConfirmDeleteOpen(false);
                  onBulkDelete();
                }}
              >
                Sí, eliminar {selectedCount}
              </Button>
            </div>
          </div>
        </div>
      </ModalPortal>
    </>
  );
};
