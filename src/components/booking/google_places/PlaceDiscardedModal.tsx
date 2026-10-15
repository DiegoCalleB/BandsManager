/**
 * Submodal con las sugerencias descartadas y su restablecimiento.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Ban,RotateCcw,Trash2,X } from "lucide-react";
import { Button,IconButton } from "../../ui";
import { PublicoSilhouette } from "../../ui/PublicoSilhouette";
import { useGooglePlacesExplorer } from "./GooglePlacesExplorerContext";

/**
 * Submodal con las sugerencias descartadas y su restablecimiento.
 * @returns Sección de interfaz.
 */
export function PlaceDiscardedModal() {
  const { showDiscardedModal, discardedList, setShowDiscardedModal, handleRestorePlace, handleClearAllDiscarded } = useGooglePlacesExplorer();
  return (
    <>
      {showDiscardedModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 bg-[var(--scrim)]/80 animate-fadeIn">
          <div className="w-full max-w-lg bg-[var(--surface)] rounded-[var(--r-l)] overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4800 flex items-center justify-between bg-[var(--bg)]/60">
              <div className="flex items-center gap-2">
                <Ban className="w-4 h-4 text-[var(--alert)]" />
                <h3 className="text-sm font-bold text-[var(--ink)]">
                  Sugerencias No Deseadas ({discardedList.length})
                </h3>
              </div>
              <IconButton
                label="Cerrar"
                size="icon-xs"
                onClick={() => setShowDiscardedModal(false)}
              >
                <X className="w-4 h-4" />
              </IconButton>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {discardedList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <PublicoSilhouette opacity={0.12} size="small" />
                  <p className="mt-4 font-medium text-[var(--ink)] text-xs">
                    Sin sugerencias descartadas
                  </p>
                  <p className="mt-1.5 text-[var(--ink-2)] text-xs max-w-xs text-center">
                    Las salas que descartes aparecerán aquí.
                  </p>
                </div>
              ) : (
                discardedList.map((item) => (
                  <div
                    key={item.nombre_sala}
                    className="p-2.5 rounded-[var(--r-m)] bg-[var(--sunken)] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-[var(--ink)] truncate">
                        {item.nombre_sala}
                      </p>
                      <p className="text-micro text-[var(--ink-2)] font-sans">
                        {item.ciudad ? `${item.ciudad} • ` : ""}Descartada
                        el{" "}
                        {new Date(item.discarded_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="neutral"
                      size="xs"
                      type="button"
                      onClick={() => handleRestorePlace(item.nombre_sala)}
                      className="items-center gap-1 shrink-0"
                      title="Volver a permitir en sugerencias futuras"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restaurar</span>
                    </Button>
                  </div>
                ))
              )}
            </div>

            {discardedList.length > 0 && (
              <div className="p-3800 bg-[var(--bg)]/60 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleClearAllDiscarded}
                  className="text-xs font-bold text-[var(--alert)] hover:text-[var(--ink-2)] flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Restablecer todas</span>
                </button>

                <Button
                  variant="neutral"
                  size="xs"
                  type="button"
                  onClick={() => setShowDiscardedModal(false)}
                >
                  Cerrar
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
