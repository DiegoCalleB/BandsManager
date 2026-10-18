/**
 * Cabecera: veredicto de la unión, navegación entre transiciones y cierre.
 */
import { ChevronLeft, ChevronRight, Headphones, X } from "lucide-react";
import { IconButton } from "../../ui";
import { useSongTransition } from "./SongTransitionContext";

/** Cabecera: veredicto de la unión, navegación entre transiciones y cierre. */
export function TransitionHeader() {
  const { diagnosis, indexA, indexB, totalItemsCount, onNavigateTransition, canGoPrev, canGoNext, stopPlayback, onClose } = useSongTransition();
  return (
    <div className="flex items-center justify-between px-3.5 py-2 bg-[var(--sunken)] shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-[var(--r-s)] bg-[var(--acc)]/10 flex items-center justify-center text-[var(--ink)] shrink-0">
          <Headphones className="w-3.5 h-3.5" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xs sm:text-sm font-bold text-[var(--ink)] tracking-tight">
              Comprobar unión y transición
            </h2>
            <span className="px-1.5 py-0.2 rounded-[var(--r-pill)] text-micro font-sans font-bold bg-[var(--acc)]/10 text-[var(--ink)]">
              #{indexA + 1} ➔ #{indexB + 1}
            </span>
            <span
              className={`hidden sm:inline-flex px-1.5 py-0.2 rounded-[var(--r-pill)] text-micro font-bold ${diagnosis.verdict.badgeClass}`}
            >
              {diagnosis.verdict.badgeLabel} ({diagnosis.scorePercent}%)
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Previous / Next navigation */}
        {onNavigateTransition && (
          <div className="flex items-center bg-[var(--surface)] rounded-[var(--r-s)] p-0.5">
            <IconButton
              label="Transición anterior en el repertorio"
              size="icon-xs"
              type="button"
              disabled={!canGoPrev}
              onClick={() => {
                if (canGoPrev) {
                  stopPlayback();
                  onNavigateTransition(indexA - 1, indexA);
                }
              }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </IconButton>
            <span className="text-micro font-sans px-1.5 text-[var(--ink-2)]">
              {indexA + 1}/{totalItemsCount || indexB + 1}
            </span>
            <IconButton
              label="Siguiente transición en el repertorio"
              size="icon-xs"
              type="button"
              disabled={!canGoNext}
              onClick={() => {
                if (canGoNext) {
                  stopPlayback();
                  onNavigateTransition(indexB, indexB + 1);
                }
              }}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </IconButton>
          </div>
        )}

        <IconButton
          label="Cerrar"
          size="icon-sm"
          type="button"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </IconButton>
      </div>
    </div>
  );
}
