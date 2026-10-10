/**
 * Confirmación de borrado de una gira.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Trash2 } from "lucide-react";
import { ModalPortal } from "../common/ModalPortal";
import { Button } from "../ui";
import { useTourManager } from "./TourManagerContext";

/**
 * Confirmación de borrado de una gira.
 * @returns Sección de interfaz.
 */
export function TourDeleteModal() {
  const { tourToDelete, setTourToDelete, colors, confirmDelete } = useTourManager();
  return (
    <>
{tourToDelete && (
        <ModalPortal
          isOpen={!!tourToDelete}
          onClose={() => setTourToDelete(null)}
        >
          <div className="fixed inset-0 bg-[var(--scrim)]/80 z-[9999] flex items-center justify-center p-4 overflow-y-auto overscroll-contain">
            <div
              className={`w-full max-w-md rounded-[var(--r-l)] ${colors.card} p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto`}
            >
              <div className="flex items-center gap-3 text-[var(--alert)]">
                <div className="p-3 rounded-[var(--r-pill)] bg-[var(--alert)]/10 shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[var(--ink)] font-display">
                    ¿Eliminar esta gira?
                  </h3>
                  <p className="text-xs text-[var(--ink-2)] mt-0.5">
                    Esta acción eliminará la gira y no se puede deshacer.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-[var(--r-m)] bg-[var(--sunken)] text-sm text-[var(--ink-2)]">
                Gira:{" "}
                <strong className="text-[var(--ink)]">
                  {tourToDelete.name}
                </strong>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTourToDelete(null)}
                  className="px-4 py-2 rounded-[var(--r-pill)] text-xs font-sans font-bold bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink)] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <Button
                  variant="danger"
                  size="sm"
                  type="button"
                  onClick={confirmDelete}
                  className="items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  Sí, eliminar Gira
                </Button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}
