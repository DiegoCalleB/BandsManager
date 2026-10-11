/**
 * Vista de tarjetas de fans.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Check,MapPin,Trash2 } from "lucide-react";
import { IconButton } from "../ui";
import { PublicoSilhouette } from "../ui/PublicoSilhouette";
import { useFansPanel } from "./FansPanelContext";

/**
 * Vista de tarjetas de fans.
 * @returns Sección de interfaz.
 */
export function FansGridView() {
  const { viewMode, filteredFans, onDeleteFan } = useFansPanel();
  return (
    <>
{viewMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFans.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-12">
                  <PublicoSilhouette opacity={0.12} size="medium" />
                  <p className="mt-6 font-medium text-[var(--ink)] text-sm">
                    Sin fans que coincidan
                  </p>
                  <p className="mt-2 text-[var(--ink-2)] text-xs max-w-xs text-center">
                    Ajusta los filtros o espera a que tus primeros fans se unan.
                  </p>
                </div>
              ) : (
                filteredFans.map((fan) => (
                  <div
                    key={fan.id}
                    className="bg-[var(--sunken)]  rounded-[var(--r-l)] p-4 transition-ui space-y-3 relative group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--acc)]/10 flex items-center justify-center text-[var(--ink)] font-bold text-sm">
                          {fan.nombre.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-[var(--ink)] text-sm truncate max-w-[160px]">
                            {fan.nombre}
                          </h4>
                          <p className="text-xs font-sans text-[var(--ink-2)] truncate max-w-[160px]">
                            {fan.email}
                          </p>
                        </div>
                      </div>
                      <IconButton
                        label="Eliminar Fan"
                        variant="danger"
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Eliminar fan ${fan.nombre}?`)) {
                            onDeleteFan(fan.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </IconButton>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-sans pt-2 ">
                      <div className="bg-[var(--surface)]/80 p-2 rounded-[var(--r-s)]">
                        <span className="text-[var(--ink-2)] text-micro block">
                          Ciudad
                        </span>
                        <span className="text-[var(--ink-2)] flex items-center gap-1 font-semibold">
                          <MapPin className="w-3 h-3 text-[var(--acc)] shrink-0" />
                          <span className="truncate">
                            {fan.ciudad || "No especificada"}
                          </span>
                        </span>
                      </div>
                      <div className="bg-[var(--surface)]/80 p-2 rounded-[var(--r-s)]">
                        <span className="text-[var(--ink-2)] text-micro block">
                          Origen / canal
                        </span>
                        <span className="text-[var(--acc)] truncate block font-semibold">
                          {fan.comoConocio ||
                            fan.conciertoOrigenNombre ||
                            "Directo"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-micro font-sans text-[var(--ink-2)] pt-1">
                      <span>Registrado: {fan.fechaCaptura || "Reciente"}</span>
                      {fan.consentimientoRGPD && (
                        <span className="text-[var(--ok)] font-bold flex items-center gap-1 bg-[var(--ok)]/10 px-2 py-0.5 rounded-[var(--r-pill)]">
                          <Check className="w-3 h-3" /> RGPD Ok
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
    </>
  );
}
