/**
 * Panel de confirmación de eliminación dentro de la ficha.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { AlertTriangle } from "lucide-react";
import { Button } from "../../ui";
import { useEventDetail } from "./EventDetailContext";

/**
 * Panel de confirmación de eliminación dentro de la ficha.
 * @returns Sección de interfaz.
 */
export function DeleteConfirmPanel() {
  const { isConfirmingDelete, modalEvent, isConcert, setDeletingEventConfirmId, handleDeleteEventFromModal } = useEventDetail();
  return (
    <>
{/* Panel de Confirmación de Eliminación In-Modal */}
            {isConfirmingDelete && modalEvent && (
              <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--alert)] text-[var(--on-alert)] flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[var(--alert)] shrink-0" />
                  <div>
                    <p className="text-xs font-mono font-bold text-[var(--alert)]">
                      ¿Confirmas que deseas eliminar este {isConcert ? 'concierto' : 'ensayo'}?
                    </p>
                    <p className="text-micro text-[var(--alert)]/80 font-sans">
                      Esta acción es definitiva y retirará el evento del calendario y agenda de la banda.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="neutral"
                    size="xs"
                    type="button"
                    onClick={() => setDeletingEventConfirmId(null)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="danger"
                    size="xs"
                    type="button"
                    onClick={() => handleDeleteEventFromModal(modalEvent.id, isConcert)}
                  >
                    Sí, eliminar definitivamente
                  </Button>
                </div>
              </div>
            )}
    </>
  );
}
