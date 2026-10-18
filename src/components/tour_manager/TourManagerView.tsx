import { TourCardsGrid } from "./TourCardsGrid";
import { TourDeleteModal } from "./TourDeleteModal";
import { TourEditModal } from "./TourEditModal";
import { TourManagerHeader } from "./TourManagerHeader";
/**
 * Vista del gestor de giras: listado, tarjetas de gira y modal de edición.
 * Extraído de TourManager.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import {
ArrowRight,
CheckCircle2
} from "lucide-react";


import { useTourManager } from "./TourManagerContext";

/**
 * Vista del gestor de giras.
 * @returns Pantalla completa del gestor.
 */
export function TourManagerView() {
  const { colors, onNavigate, syncFeedback,} = useTourManager();
  return (
    <div data-modulo="sala" className={`space-y-6 ${colors.text}`}>
      {/* Header */}
      <TourManagerHeader />

      {/* Sync Toast Feedback */}
      {syncFeedback && (
        <div className="p-3.5 px-4 rounded-[var(--r-m)] text-xs flex items-center justify-between gap-3 bg-[var(--ok)]/10 text-[var(--ink-2)] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[var(--ok)] shrink-0" />
            <span className="font-sans">{syncFeedback.message}</span>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate("finanzas")}
              className="px-2.5 py-1 rounded bg-[var(--ok)]/20 hover:bg-[var(--ok)]/30 text-[var(--ink)] font-sans text-micro font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Ver en Finanzas</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      <TourCardsGrid />

      {/* Modal Formulario de Gira */}
      <TourEditModal />

      {/* Modal Confirm Deletion */}
      <TourDeleteModal />
    </div>
  );
}
