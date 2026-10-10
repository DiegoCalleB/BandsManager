/**
 * Pestañas de ciudades configurables.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Check,MapPin,Plus,X } from "lucide-react";
import { Button,Input,LinkButton } from "../ui";
import { useFansPanel } from "./FansPanelContext";

/**
 * Pestañas de ciudades configurables.
 * @returns Sección de interfaz.
 */
export function FansCityTabsBar() {
  const { selectedCityFilter, setSelectedCityFilter, fans, customCityChips, handleRemoveCityTab, isAddingCity, handleAddCityTab, newCityInput, setNewCityInput, setIsAddingCity } = useFansPanel();
  return (
    <>
{/* Configurable City Tabs Bar */}
          <div className="space-y-2 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--ink-2)] font-sans flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[var(--acc)]" />
                Filtrar por Ciudad (Pestañas Configurables Guardadas en BBDD)
              </span>
              {selectedCityFilter && (
                <LinkButton
                  onClick={() => setSelectedCityFilter("")}
                >
                  Limpiar filtro ciudad
                </LinkButton>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                variant={selectedCityFilter === "" ? "inverse" : "neutral"}
                size="xs"
                type="button"
                onClick={() => setSelectedCityFilter("")}
              >
                Todas ({fans.length})
              </Button>

              {customCityChips.map((city) => {
                const count = fans.filter(
                  (f) =>
                    f.ciudad &&
                    f.ciudad.toLowerCase().includes(city.toLowerCase()),
                ).length;
                const isSelected =
                  selectedCityFilter.toLowerCase() === city.toLowerCase();
                return (
                  <div
                    key={city}
                    onClick={() => setSelectedCityFilter(city)}
                    className={`group/city inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-m)] text-xs font-sans font-bold transition-ui cursor-pointer ${
                      isSelected
                        ? "bg-[var(--ink)] text-[var(--bg)]"
                        : "bg-[var(--sunken)] hover:bg-[var(--surface)] text-[var(--ink-2)]"
                    }`}
                  >
                    <span>{city}</span>
                    <span
                      className={`text-micro px-1.5 py-0.5 rounded-[var(--r-pill)] font-bold ${
                        isSelected
                          ? "bg-[var(--surface)]/20 text-[var(--ink)]"
                          : "bg-[var(--surface)] text-[var(--acc)]"
                      }`}
                    >
                      {count}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveCityTab(city, e)}
                      className={`p-0.5 rounded-[var(--r-pill)] hover:bg-[var(--alert)]/30 transition opacity-60 group-hover/city:opacity-100 ${
                        isSelected
                          ? "hover:text-[var(--alert)] text-[var(--ink)]"
                          : "hover:text-[var(--ink-2)] text-[var(--ink-2)]"
                      }`}
                      title={`Eliminar pestaña ${city}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              {isAddingCity ? (
                <form
                  onSubmit={handleAddCityTab}
                  className="flex items-center gap-1"
                >
                  <Input
                    size="sm"
                    type="text"
                    autoFocus
                    placeholder="Nueva ciudad…"
                    value={newCityInput}
                    onChange={(e) => setNewCityInput(e.target.value)}
                    className="w-36"
                  />
                  <Button
                    variant="primary"
                    size="xs"
                    type="submit"
                    title="Guardar ciudad"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="neutral"
                    size="xs"
                    type="button"
                    onClick={() => {
                      setIsAddingCity(false);
                      setNewCityInput("");
                    }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </form>
              ) : (
                <Button
                  variant="neutral"
                  size="xs"
                  type="button"
                  onClick={() => setIsAddingCity(true)}
                  className="items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir ciudad</span>
                </Button>
              )}
            </div>
          </div>
    </>
  );
}
