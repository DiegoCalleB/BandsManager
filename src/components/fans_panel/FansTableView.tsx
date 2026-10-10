/**
 * Vista de tabla de fans.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Check,MapPin,Trash2 } from "lucide-react";
import { IconButton } from "../ui";
import { PublicoSilhouette } from "../ui/PublicoSilhouette";
import { useFansPanel } from "./FansPanelContext";

/**
 * Vista de tabla de fans.
 * @returns Sección de interfaz.
 */
export function FansTableView() {
  const { viewMode, filteredFans, onDeleteFan } = useFansPanel();
  return (
    <>
{viewMode === "table" && (
            <div className="overflow-x-auto shrink-0">
              <table className="w-full text-left text-xs text-[var(--ink-2)]">
                <thead className="bg-[var(--surface)] text-[var(--acc)] font-bold font-sans">
                  <tr>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Correo electrónico</th>
                    <th className="p-3">Ciudad</th>
                    <th className="p-3">Canal</th>
                    <th className="p-3">Concierto Asociado</th>
                    <th className="p-3 text-center">RGPD</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--hair)]">
                  {filteredFans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12">
                        <div className="flex flex-col items-center justify-center">
                          <PublicoSilhouette opacity={0.12} size="medium" />
                          <p className="mt-6 font-medium text-[var(--ink)] text-sm">
                            Sin fans que coincidan
                          </p>
                          <p className="mt-2 text-[var(--ink-2)] text-xs max-w-xs text-center">
                            Ajusta los filtros o espera a que tus primeros fans
                            se unan.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredFans.map((fan) => (
                      <tr
                        key={fan.id}
                        className="hover:bg-[var(--surface)]/20 transition group"
                      >
                        <td className="p-3 font-semibold text-[var(--ink)]">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-[var(--r-pill)] bg-[var(--acc)]/10 flex items-center justify-center text-[var(--ink)] font-bold text-micro">
                              {fan.nombre.charAt(0)}
                            </div>
                            {fan.nombre}
                          </div>
                        </td>
                        <td className="p-3 font-sans">{fan.email}</td>
                        <td className="p-3">
                          {fan.ciudad ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[var(--ink-2)]" />{" "}
                              {fan.ciudad}
                            </span>
                          ) : (
                            <span className="text-[var(--ink-2)]">-</span>
                          )}
                        </td>
                        <td className="p-3 font-sans text-micro text-[var(--ink-2)]">
                          {fan.comoConocio || "-"}
                        </td>
                        <td className="p-3 text-xs text-[var(--ok)] font-sans">
                          {fan.conciertoOrigenNombre || "-"}
                        </td>
                        <td className="p-3 text-center">
                          {fan.consentimientoRGPD ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[var(--ok)]/10 text-[var(--ok)]">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <IconButton
                            label="Eliminar"
                            variant="danger"
                            onClick={() => {
                              if (confirm(`¿Eliminar fan ${fan.nombre}?`)) {
                                onDeleteFan(fan.id);
                              }
                            }}
                            className="opacity-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </IconButton>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
    </>
  );
}
