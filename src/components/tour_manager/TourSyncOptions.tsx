/**
 * Opciones de sincronización con calendario y finanzas.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ShowIcon } from "../ui/ShowIcon";
import { useTourManager } from "./TourManagerContext";

/**
 * Opciones de sincronización con calendario y finanzas.
 * @returns Sección de interfaz.
 */
export function TourSyncOptions() {
  const { formSincronizarCalendario, setFormSincronizarCalendario } = useTourManager();
  return (
    <>
<div className="p-4 rounded-[var(--r-m)] bg-[var(--bg)]/30 space-y-2.5">
                    <span className="text-xs font-sans font-bold text-[var(--ink-2)] block">
                      <ShowIcon inline emoji="⚡" />Integración con calendario y finanzas
                    </span>

                    <label className="flex items-center gap-2.5 text-xs text-[var(--ink)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formSincronizarCalendario}
                        onChange={(e) =>
                          setFormSincronizarCalendario(e.target.checked)
                        }
                        className="rounded text-[var(--acc)] focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <span>
                        <strong className="text-[var(--ink)]">
                          <ShowIcon inline emoji="📅" />Sincronizar paradas en el Calendario oficial de la
                          Banda:
                        </strong>{" "}
                        Crea/actualiza automáticamente los conciertos
                        correspondientes con los miembros convocados y badge de
                        gira.
                      </span>
                    </label>
                  </div>
    </>
  );
}
