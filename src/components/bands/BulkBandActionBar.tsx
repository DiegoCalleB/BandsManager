import React, { useState } from "react";
import { BandRelationshipStatus } from "../../types";
import { ModalPortal } from "../common/ModalPortal";
import {
  CheckSquare,
  MinusSquare,
  Square,
  X,
  ChevronDown,
  Sparkles,
  Download,
  Trash2,
  Star,
  CheckCircle2,
  Repeat,
  Clock,
  ArrowRight,
  Users,
  ShieldAlert,
} from "lucide-react";
import { ShowIcon } from '../ui/ShowIcon';

interface BulkBandActionBarProps {
  selectedCount: number;
  totalFilteredCount: number;
  isAllSelected: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkStatusChange: (status: BandRelationshipStatus) => void;
  onBulkGeneratePitch: () => void;
  onBulkToggleFavorite: (isFav: boolean) => void;
  onBulkExportCsv: () => void;
  onBulkDelete: () => void;
}

const BAND_STATUS_OPTIONS: {
  status: BandRelationshipStatus;
  label: string;
  color: string;
  icon: any;
}[] = [
  {
    status: "sin_contactar",
    label: "Sin Contactar",
    color: "bg-[var(--ink-3)]/60 text-[var(--ink)]",
    icon: Clock,
  },
  {
    status: "intercambio_propuesto",
    label: "Intercambio Propuesto",
    color: "bg-[var(--acc)]/20 text-[var(--ink)]",
    icon: Repeat,
  },
  {
    status: "pendiente_respuesta",
    label: "Pendiente Respuesta",
    color: "bg-[var(--acc)]/20 text-[var(--acc-ink)] ",
    icon: Clock,
  },
  {
    status: "concierto_agendado",
    label: "Concierto / Bolo Agendado",
    color: "bg-[var(--ok)]/30 text-[var(--ink)]",
    icon: CheckCircle2,
  },
  {
    status: "colegas_aliados",
    label: "Colegas / Aliados de Gira",
    color: "bg-[var(--tentative)]/20 text-[var(--tentative)]",
    icon: Users,
  },
  {
    status: "no_disponible",
    label: "No Disponible / Descartado",
    color: "bg-[var(--alert)]/20 text-[var(--ink)]",
    icon: ShieldAlert,
  },
];

export const BulkBandActionBar: React.FC<BulkBandActionBarProps> = ({
  selectedCount,
  totalFilteredCount,
  isAllSelected,
  onSelectAll,
  onDeselectAll,
  onBulkStatusChange,
  onBulkGeneratePitch,
  onBulkToggleFavorite,
  onBulkExportCsv,
  onBulkDelete,
}) => {
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <>
      {/* Gmail-Style Sticky Top Actions Toolbar for Bands */}
      <div
        id="bulk-band-action-bar"
        className={`sticky top-2 z-30 w-full mb-3 rounded-[var(--r-l)] p-2.5 sm:p-3 transition-ui animate-slide-up ${"bg-[var(--surface)]/95 text-[var(--ink)] shadow-black/80"}`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-3">
          {/* Left section: Checkbox toggle, counter badge and quick select */}
          <div className="flex items-center justify-between w-full md:w-auto gap-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={isAllSelected ? onDeselectAll : onSelectAll}
                className={`p-1.5 rounded-[var(--r-pill)] transition-colors cursor-pointer shrink-0 ${"hover:bg-[var(--surface)] text-[var(--acc)]"}`}
                title={
                  isAllSelected
                    ? "Deseleccionar todo"
                    : `Seleccionar las ${totalFilteredCount} bandas`
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
                      {selectedCount}{" "}
                      {selectedCount === 1
                        ? "banda seleccionada"
                        : "bandas seleccionadas"}
                    </span>
                    {!isAllSelected && totalFilteredCount > selectedCount && (
                      <button
                        type="button"
                        onClick={onSelectAll}
                        className="text-xs text-[var(--acc)] hover:underline font-sans cursor-pointer font-semibold underline-offset-2"
                        title={`Seleccionar las ${totalFilteredCount} bandas`}
                      >
                        (Seleccionar las {totalFilteredCount})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick close on mobile */}
            <button
              type="button"
              onClick={onDeselectAll}
              className={`md:hidden p-1.5 rounded-[var(--r-pill)] transition-colors cursor-pointer ${"text-[var(--ink-2)] hover:bg-[var(--sunken)]"}`}
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
                className={`px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-sans font-bold transition-ui flex items-center gap-1.5 cursor-pointer ${"bg-[var(--accent-alt)]/10 hover:bg-[var(--accent-alt)]/30 text-[var(--accent-alt)]"}`}
                title="Cambiar estado de relación de las bandas seleccionadas"
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
                    className={`absolute top-full mt-2 right-0 z-50 w-60 rounded-[var(--r-l)] p-2 space-y-1 animate-scale-up max-h-72 overflow-y-auto ${"bg-[var(--surface)]"}`}
                  >
                    <div
                      className={`px-2 py-1 text-micro font-sans font-bold ${"text-[var(--ink-2)]"}`}
                    >
                      Mover {selectedCount} bandas a:
                    </div>
                    {BAND_STATUS_OPTIONS.map((opt) => {
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
                  </div>
                </>
              )}
            </div>

            {/* AI Date Swap Generator */}
            <button
              type="button"
              onClick={onBulkGeneratePitch}
              className={`px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-sans font-bold transition-ui flex items-center gap-1.5 cursor-pointer ${"bg-[var(--acc)]  hover:bg-[var(--acc)] text-[var(--on-acc)]"}`}
              title="Redactar propuestas de intercambio (date swaps) con IA"
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]" />
              <span className="hidden sm:inline">Swaps IA</span>
              <span className="sm:hidden">Swaps</span>
            </button>

            {/* Favorite toggle */}
            <button
              type="button"
              onClick={() => onBulkToggleFavorite(true)}
              className={`p-1.5 rounded-[var(--r-pill)] text-xs transition-ui cursor-pointer ${"bg-[var(--sunken)] hover:bg-[var(--ink-3)]/60 text-[var(--acc-ink)]"}`}
              title="Marcar bandas como favoritas"
            >
              <Star className="w-4 h-4 fill-[var(--acc)]/30 text-[var(--acc)]" />
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={onBulkExportCsv}
              className={`px-2.5 py-1.5 rounded-[var(--r-pill)] text-xs font-sans font-semibold transition-ui flex items-center gap-1 cursor-pointer ${"bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--ink-2)]"}`}
              title="Exportar bandas seleccionadas a CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">CSV</span>
            </button>

            {/* Delete button */}
            <button
              type="button"
              onClick={() => setIsConfirmDeleteOpen(true)}
              className="p-1.5 bg-[var(--alert-soft)] hover:bg-[var(--alert-soft)] text-[var(--ink-2)] rounded-[var(--r-pill)] transition-ui cursor-pointer"
              title={`Eliminar ${selectedCount} bandas`}
            >
              <Trash2 className="w-4 h-4 text-[var(--alert)]" />
            </button>

            {/* Deselect Close Button (Desktop) */}
            <button
              type="button"
              onClick={onDeselectAll}
              className={`hidden md:flex p-1.5 rounded-[var(--r-pill)] transition-colors cursor-pointer ${"text-[var(--ink-2)] hover:bg-[var(--sunken)]"}`}
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
              <div className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--alert)]/20 flex items-center justify-center text-[var(--ink)] shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--ink)] font-display">
                  ¿Eliminar {selectedCount} bandas?
                </h3>
                <p className="text-xs text-[var(--ink-2)] font-sans">
                  Esta acción eliminará los contactos de las bandas
                  seleccionadas.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-[var(--r-m)] bg-[var(--alert-soft)] text-xs text-[var(--ink)] font-sans">
              <ShowIcon inline emoji="⚠️" />Se borrarán definitivamente {selectedCount} bandas aliadas.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2800/80">
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(false)}
                className="px-3.5 py-2 rounded-[var(--r-pill)] text-xs font-sans font-bold bg-[var(--sunken)] hover:bg-[var(--ink-3)]/60 text-[var(--ink-2)] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmDeleteOpen(false);
                  onBulkDelete();
                }}
                className="px-4 py-2 rounded-[var(--r-pill)] text-xs font-sans font-bold bg-[var(--alert)] hover:brightness-95 text-[var(--on-alert)] transition-colors cursor-pointer"
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
