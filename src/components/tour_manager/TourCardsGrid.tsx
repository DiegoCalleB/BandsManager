/**
 * Tarjetas de las giras existentes.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Calendar,DollarSign,Edit3,Plus,Trash2,TrendingUp,Truck,Users } from "lucide-react";
import { HolidayDateWarning } from "../common/HolidayDateWarning";
import { Button,IconButton } from "../ui";
import { PublicoSilhouette } from "../ui/PublicoSilhouette";
import { useTourManager } from "./TourManagerContext";

/**
 * Tarjetas de las giras existentes.
 * @returns Sección de interfaz.
 */
export function TourCardsGrid() {
  const { tours, handleOpenCreateModal, availableMembers, currentUser, colors, handleOpenEditModal, handleDelete, handleVolcarEnFinanzas, onNavigate } = useTourManager();
  return (
    <>
{/* Tour List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {tours.length === 0 ? (
          <div className="col-span-full p-8 text-center rounded-[var(--r-l)] bg-[var(--surface)]">
            <PublicoSilhouette
              opacity={0.12}
              size="large"
              className="mx-auto mb-4"
            />
            <h3 className="text-lg font-bold text-[var(--ink)] mb-2">
              La gira está vacía
            </h3>
            <p className="text-sm text-[var(--ink-2)] max-w-md mx-auto mb-4">
              Agrupa tus conciertos en una gira y calcula gasolina, dietas, alojamiento y lo que
              queda por cabeza.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateModal}
              className="items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Crear primera gira
            </Button>
          </div>
        ) : (
          (() => {
            const seen = new Set<string>();
            const uniqueTours = tours.filter((t, index) => {
              const key = t.id || `tour-${index}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
            return uniqueTours.map((tour, index) => {
              const totalGastos = tour.stops.reduce(
                (sum, s) =>
                  sum +
                  (s.gastosAlojamiento || 0) +
                  (s.gastosGasolina || 0) +
                  (s.gastosDietas || 0),
                0,
              );
              const totalIngresos = tour.stops.reduce(
                (sum, s) => sum + (s.ingresoCacheEstimated || 0),
                0,
              );
              const beneficioNeto = totalIngresos - totalGastos;
              const totalKm = tour.stops.reduce(
                (sum, s) => sum + (s.distanciaAnteriorKm || 0),
                0,
              );

              const vehiclesCount =
                tour.vehiculos?.length || (tour.vehiculo ? 1 : 0);

              // Formación info
              const isFormacionParcial = tour.convocatoria_tipo === "parcial";
              const convocadosCount =
                isFormacionParcial && tour.convocados_ids
                  ? tour.convocados_ids.length
                  : availableMembers.length;

              const isCurrentUserConvocado =
                !currentUser?.id ||
                !isFormacionParcial ||
                (tour.convocados_ids &&
                  tour.convocados_ids.includes(currentUser.id));

              return (
                <div
                  key={tour.id || `tour-${index}`}
                  className={`p-5 rounded-[var(--r-l)] ${colors.card} group hover:bg-[var(--sunken)] transition-colors flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg font-display">
                            {tour.nombre}
                          </h3>
                          {isCurrentUserConvocado ? (
                            <span className="px-2 py-0.5 rounded text-micro font-sans font-bold bg-[var(--ok)]/20 text-[var(--ink)]">
                              ✓ Convocado
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-micro font-sans font-bold bg-[var(--surface)]/80 text-[var(--ink-2)]">
                              No convocado
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-micro font-sans font-bold
 ${
   tour.estado === "confirmada"
     ? colors.badgeGreen
     : tour.estado === "planificacion"
       ? colors.badgeYellow
       : tour.estado === "cancelada"
         ? colors.badgeRed
         : "bg-[var(--surface)]/80 text-[var(--ink)]"
 }`}
                          >
                            {tour.estado}
                          </span>
                          <span
                            className={`text-micro ${colors.textMuted} flex items-center gap-1 font-sans`}
                          >
                            <Calendar className="w-3 h-3" />
                            {tour.fechaInicio} — {tour.fechaFin}
                          </span>
                          {/* Convocatoria Badge */}
                          <span
                            className={`text-micro px-2 py-0.5 rounded font-sans flex items-center gap-1 ${
                              isFormacionParcial
                                ? "bg-[var(--tentative)]/10 text-[var(--tentative)]"
                                : "bg-[var(--ok)]/10 text-[var(--ink-2)]"
                            }`}
                            title={
                              tour.convocados_nombres?.join(", ") ||
                              "Toda la banda"
                            }
                          >
                            <Users className="w-3 h-3" />
                            {isFormacionParcial
                              ? `Banda Parcial (${convocadosCount} músicos)`
                              : `Banda Completa (${availableMembers.length})`}
                          </span>
                          {totalKm > 0 && (
                            <span className="text-micro text-[var(--ink-2)] bg-[var(--acc)]/10 px-2 py-0.5 rounded font-sans">
                              {totalKm} km
                            </span>
                          )}
                          {vehiclesCount > 1 ? (
                            <span
                              className="text-micro text-[var(--ink)] bg-[var(--acc)]/10 px-2 py-0.5 rounded font-sans flex items-center gap-1"
                              title={tour.vehiculos
                                ?.map((v) => v.nombre)
                                .join(" + ")}
                            >
                              <Truck className="w-3 h-3 text-[var(--acc)]" />
                              {vehiclesCount} vehículos
                            </span>
                          ) : tour.vehiculo ? (
                            <span className="text-micro text-[var(--ink)] bg-[var(--acc)]/10 px-2 py-0.5 rounded font-sans flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              {tour.vehiculo}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <IconButton
                          label="Editar"
                          onClick={() => handleOpenEditModal(tour)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </IconButton>
                        <IconButton
                          label="Eliminar"
                          variant="danger"
                          onClick={() => handleDelete(tour.id, tour.nombre)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </IconButton>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--sunken)]">
                        <span className="text-micro text-[var(--ink-2)] block font-sans">
                          Logística
                        </span>
                        <div className="text-xs font-bold text-[var(--alert)] mt-0.5">
                          -{totalGastos} €
                        </div>
                      </div>
                      <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--sunken)]">
                        <span className="text-micro text-[var(--ink-2)] block font-sans">
                          Caché Est.
                        </span>
                        <div className="text-xs font-bold text-[var(--ok)] mt-0.5">
                          +{totalIngresos} €
                        </div>
                      </div>
                      <div
                        className={`p-2.5 rounded-[var(--r-m)] ${beneficioNeto >= 0 ? "bg-[var(--ok)]/10 text-[var(--ok)]" : "bg-[var(--alert)]/10 text-[var(--alert)]"}`}
                      >
                        <span className="text-micro opacity-80 block font-sans">
                          Margen neto
                        </span>
                        <div className="text-xs font-extrabold mt-0.5 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {beneficioNeto >= 0
                            ? `+${beneficioNeto}`
                            : beneficioNeto}{" "}
                          €
                        </div>
                      </div>
                    </div>

                    {/* Ruta & Paradas */}
                    <div>
                      <h4 className="text-micro font-sans text-[var(--ink-2)] mb-2 flex justify-between items-center">
                        <span>Ruta ({tour.stops.length} paradas)</span>
                        <span
                          className="text-[var(--ink-2)] truncate max-w-[200px]"
                          title={
                            tour.vehiculos?.map((v) => v.nombre).join(",") ||
                            tour.vehiculo
                          }
                        >
                          {tour.vehiculos && tour.vehiculos.length > 1
                            ? `${tour.vehiculos.length} Vehículos`
                            : tour.vehiculo || "1 Vehículo"}
                        </span>
                      </h4>
                      <div className="space-y-1.5">
                        {tour.stops.length === 0 ? (
                          <span className="text-micro text-[var(--ink-2)] italic">
                            Sin paradas configuradas
                          </span>
                        ) : (
                          tour.stops.slice(0, 4).map((stop, idx) => (
                            <div
                              key={`tour-${tour.id || index}-stop-${stop.id || idx}-${idx}`}
                              className="py-1 px-2 rounded-[var(--r-s)] bg-[var(--sunken)] space-y-1"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-[var(--ink-2)] font-sans text-xs font-bold">
                                    {idx + 1}.
                                  </span>
                                  <span className="font-bold truncate text-[var(--ink)] text-xs sm:text-sm">
                                    {stop.ciudad || "Por determinar"}
                                  </span>
                                  <span className="text-[var(--ink-2)] text-xs font-semibold truncate">
                                    ({stop.sala || "Sala tbd"})
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 font-sans text-xs">
                                  {stop.ingresoCacheEstimated ? (
                                    <span className="text-[var(--ok)] font-bold">
                                      +{stop.ingresoCacheEstimated}€
                                    </span>
                                  ) : null}
                                  <span className="text-[var(--acc)]/70 font-sans text-xs font-bold">
                                    {stop.fecha}
                                  </span>
                                </div>
                              </div>
                              <HolidayDateWarning
                                date={stop.fecha}
                                city={stop.ciudad}
                                compact
                              />
                            </div>
                          ))
                        )}
                        {tour.stops.length > 4 && (
                          <div className="text-micro text-center text-[var(--ink-2)] pt-1 font-sans">
                            + {tour.stops.length - 4} paradas adicionales
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones de Sincronización */}
                  <div className="pt-4 mt-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="neutral"
                        size="xs"
                        type="button"
                        onClick={() => handleVolcarEnFinanzas(tour)}
                        className="items-center gap-1.5"
                        title="Registra los cachés y gastos logísticos calculados en el libro diario de Finanzas"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Volcar en Finanzas</span>
                      </Button>

                      {onNavigate && (
                        <Button
                          variant="neutral"
                          size="xs"
                          type="button"
                          onClick={() =>
                            onNavigate("calendario", {
                              selectedDate: tour.fechaInicio,
                            })
                          }
                          className="items-center gap-1.5"
                          title="Abrir agenda y ver paradas de la gira en el calendario"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Ver en Calendario</span>
                        </Button>
                      )}
                    </div>

                    <span className="text-micro text-[var(--ink-2)] font-sans">
                      {tour.stops.length} fechas
                    </span>
                  </div>
                </div>
              );
            });
          })()
        )}
      </div>
    </>
  );
}
