/**
 * Confirmación para salir de una banda.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Trash2 } from "lucide-react";
import { Button } from "../ui";
import { useBandSwitcher } from "./BandSwitcherContext";

/**
 * Confirmación para salir de una banda.
 * @returns Sección de interfaz.
 */
export function DeleteBandModal() {
  const { bandToDelete, setBandToDelete, handleConfirmLeaveBand } = useBandSwitcher();
  return (
    <>
{/* In-App Delete Band Confirmation Modal */}
        {bandToDelete && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/85 animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-[var(--r-l)] bg-[var(--surface)] text-[var(--ink-2)] p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--alert)]/15 flex items-center justify-center text-[var(--ink)] shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--ink)] font-sans">
                    ¿Eliminar proyecto?
                  </h3>
                  <p className="text-xs text-[var(--ink-2)]">
                    Desvincular de tu usuario
                  </p>
                </div>
              </div>

              <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                ¿Estás seguro de que deseas eliminar{" "}
                <strong className="text-[var(--ink)]">
                  "{bandToDelete.name}"
                </strong>{" "}
                de tu cuenta? Perderás el acceso a sus salas, eventos y
                repertorio.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="neutral"
                  size="xs"
                  type="button"
                  onClick={() => setBandToDelete(null)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  size="xs"
                  type="button"
                  onClick={handleConfirmLeaveBand}
                  className="items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Sí, eliminar</span>
                </Button>
              </div>
            </div>
          </div>
        )}
    </>
  );
}
