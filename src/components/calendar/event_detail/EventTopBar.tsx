/**
 * Barra superior con navegación cronológica entre eventos.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ChevronLeft,ChevronRight } from "lucide-react";
import { Button } from "../../ui";
import { useEventDetail } from "./EventDetailContext";

/**
 * Barra superior con navegación cronológica entre eventos.
 * @returns Sección de interfaz.
 */
export function EventTopBar() {
  const { goToAdjacentEvent, allChronologicalEvents, activeChronoIndex, modalPosLabel, setShowEventFichaModal } = useEventDetail();
  return (
    <>
{/* Barra superior del modal: navegación cronológica entre eventos */}
          <div
            className={`sticky top-0 z-10 flex items-center justify-between gap-2 px-4 sm:px-6 py-3 ${
              'bg-[var(--surface)]/95'
            }`}
          >
            <button data-raw
              type="button"
              onClick={() => goToAdjacentEvent(-1)}
              disabled={allChronologicalEvents.length === 0 || activeChronoIndex <= 0}
              className="flex items-center gap-1 px-2 py-1.5 rounded-[var(--r-pill)] text-xs font-mono font-bold text-[var(--acc)] hover:bg-[var(--acc)]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Evento anterior (←)"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>

            <div className="flex flex-col items-center min-w-0">
              <span className="text-micro font-sans text-[var(--acc-ink)] font-semibold">Ficha de evento</span>
              {modalPosLabel && (
                <span className={`text-micro font-mono font-bold ${'text-[var(--ink-2)]'}`}>
                  {modalPosLabel}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => goToAdjacentEvent(1)}
                disabled={
                  allChronologicalEvents.length === 0 || activeChronoIndex < 0 || activeChronoIndex >= allChronologicalEvents.length - 1
                }
                className="flex items-center gap-1 px-2 py-1.5 rounded-[var(--r-pill)] text-xs font-mono font-bold text-[var(--acc)] hover:bg-[var(--acc)]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Evento siguiente (→)"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <Button
                variant="ghost"
                size="xs"
                type="button"
                onClick={() => setShowEventFichaModal(false)}
                title="Cerrar (Esc)"
              >
                ✕
              </Button>
            </div>
          </div>
    </>
  );
}
