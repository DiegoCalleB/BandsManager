import { BandCardsGrid } from "./BandCardsGrid";
import { BandSettingsModal } from "./BandSettingsModal";
import { BandSwitcherFooter } from "./BandSwitcherFooter";
import { CreateBandModal } from "./CreateBandModal";
import { DeleteBandModal } from "./DeleteBandModal";
import { UpgradePlanModal } from "./UpgradePlanModal";
/**
 * Vista del selector de bandas: lista, búsqueda, reordenación, creación y modales.
 * Extraído de BandSwitcherModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import {
Check,
Search,
X
} from "lucide-react";
import { ModalPortal } from "../common/ModalPortal";
import { Button,Input } from '../ui';



import { useBandSwitcher } from "./BandSwitcherContext";

/**
 * Vista del selector de bandas.
 * @returns Modal completo del selector.
 */
export function BandSwitcherLayout() {
  const { errorMessage, isOpen, onClose, searchQuery, setSearchQuery, successMessage, switchingBandId, uniqueBands } = useBandSwitcher();
  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/90 overflow-y-auto overscroll-contain animate-fadeIn">
        {/* Background ambient */}

        {/* Main Container */}
        <div className="relative w-full max-w-4xl bg-[var(--surface)] rounded-[var(--r-l)] overflow-hidden flex flex-col p-6 md:p-10 text-center my-auto max-h-[90vh] overflow-y-auto">
          {/* Close Button */}
          <Button
            variant="neutral"
            size="sm"
            onClick={onClose}
            disabled={!!switchingBandId}
            className="absolute top-5 right-5"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </Button>

          {/* Top Header */}
          <div className="flex flex-col items-center mb-6 md:mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[var(--r-pill)] bg-[var(--acc)]/10 text-[var(--ink)] text-xs font-sans font-bold mb-3">
              <span>Perfil y selección de banda</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black font-display text-[var(--ink)]">
              ¿Quién toca hoy?
            </h2>
            <p className="text-[var(--ink-2)] text-xs md:text-sm font-sans max-w-lg mt-2">
              Elige tu proyecto musical activo, marca tu{" "}
              <strong className="text-[var(--acc)] font-semibold">
                Banda principal
              </strong>{" "}
              o reordena tus proyectos arrastrándolos o con las flechas.
            </p>

            {/* Search bar if multiple bands */}
            {uniqueBands.length > 2 && (
              <div className="relative w-full max-w-xs mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--ink-2)]" />
                <Input
                  size="sm"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar proyecto…"
                  className="w-full pl-9 pr-3"
                />
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-[var(--alert)]/15 text-[var(--ink)] text-xs rounded-[var(--r-m)] font-medium">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-[var(--ok)]/15 text-[var(--ink)] text-xs rounded-[var(--r-m)] font-medium flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-[var(--ok)]" />
              <span>{successMessage}</span>
            </div>
          )}

          <BandCardsGrid />

          <BandSwitcherFooter />
        </div>

        <BandSettingsModal />

        <CreateBandModal />

        <DeleteBandModal />

        <UpgradePlanModal />
      </div>
    </ModalPortal>
  );
}
