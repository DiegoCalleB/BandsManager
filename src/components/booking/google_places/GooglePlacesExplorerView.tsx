import { ModalPortal } from "../../common/ModalPortal";
import { ExplorerHeader } from "./ExplorerHeader";
import { MassCampaignPanel } from "./MassCampaignPanel";
import { PlaceDiscardedModal } from "./PlaceDiscardedModal";
import { PlaceDiscardToast } from "./PlaceDiscardToast";
import { PlacesResultsList } from "./PlacesResultsList";
import { PlaceStatusBanners } from "./PlaceStatusBanners";
import { ScoutFilterBar } from "./ScoutFilterBar";

import { useGooglePlacesExplorer } from "./GooglePlacesExplorerContext";

/**
 * Vista del explorador de lugares: cabecera, búsqueda masiva, filtros, resultados y descartados.
 * @returns Modal completo del explorador.
 */
export function GooglePlacesExplorerView() {
  const { isOpen, onClose } = useGooglePlacesExplorer();
  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center p-2 sm:p-4 md:p-6 bg-[var(--scrim)]/90 overflow-y-auto overscroll-contain pt-2 pb-24 sm:py-6 animate-fadeIn">
        <div
          className={`w-full max-w-4xl max-h-[92dvh] sm:max-h-[90vh] my-auto flex flex-col rounded-[var(--r-l)] overflow-hidden bg-[var(--surface)] text-[var(--ink)]`}
        >
          {/* Header */}
          <ExplorerHeader />

          {/* Content Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Búsqueda Masiva de Campaña Activa: Recintos, Locales y Discotecas con Aforo y Estilo */}
            <MassCampaignPanel />

            {/* Discard Toast */}
            <PlaceDiscardToast />

            {/* Main Filter and Search Bar */}
            <ScoutFilterBar />

            {/* Status / Errors / Search Source */}
            <PlaceStatusBanners />

            {/* Places Results List */}
            <PlacesResultsList />
          </div>

          {/* Discarded Suggestions Sub-Modal */}
          <PlaceDiscardedModal />
        </div>
      </div>
    </ModalPortal>
  );
}
