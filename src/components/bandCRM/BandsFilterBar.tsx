/**
 * Barra de búsqueda y filtros de bandas con selector de vista.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { CheckSquare, LayoutGrid, List, Map, MinusSquare, Search, Square, X } from "lucide-react";
import { BandRelationshipStatus } from "../../types";
import { Button, IconButton, Input, Select } from "../ui";
import { useBandCrm } from "./BandCrmContext";

/**
 * Barra de búsqueda y filtros de bandas con selector de vista.
 * @returns Sección de interfaz.
 */
export function BandsFilterBar() {
  const { colors, searchTerm, setSearchTerm, statusFilter, setStatusFilter, locationFilter, setLocationFilter, availableLocations, filteredBands, selectedBandIds, handleDeselectAllBands, handleSelectAllFilteredBands, setViewMode, viewMode } = useBandCrm();
  return (
    <>
      {/* 2. FILTER & SEARCH CONTROL BAR */}
      <div className={`p-4 rounded-[var(--r-m)] ${colors.card} space-y-3`}>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-2)]" />
            <Input
              size="sm"
              id="band-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por banda, estilo, ciudad o contacto…"
              className="w-full pl-9 pr-3"
            />
            {searchTerm && (
              <IconButton
                label="Cerrar"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2"
              >
                <X className="w-3.5 h-3.5" />
              </IconButton>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Dropdown */}
            <Select
              size="sm"
              id="band-filter-status"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as BandRelationshipStatus | "todos",
                )
              }
            >
              <option value="todos">Todos los Estados</option>
              <option value="colegas_aliados">Colegas / Aliados</option>
              <option value="concierto_agendado">
                Concierto Agendado
              </option>
              <option value="intercambio_propuesto">
                Intercambio Propuesto
              </option>
              <option value="pendiente_respuesta">
                Pendiente respuesta
              </option>
              <option value="sin_contactar">Sin Contactar</option>
              <option value="no_disponible">No Disponible</option>
            </Select>

            {/* Location Filter Dropdown */}
            <Select
              size="sm"
              id="band-filter-location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              wrapperClassName="max-w-[160px] truncate"
            >
              <option value="todos">Todas las ciudades</option>
              {availableLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </Select>

            {/* Quick Selection Toggle */}
            {filteredBands.length > 0 && (
              <button
                type="button"
                onClick={
                  selectedBandIds.length === filteredBands.length
                    ? handleDeselectAllBands
                    : handleSelectAllFilteredBands
                }
                className={`px-2.5 py-1 rounded-[var(--r-pill)] text-micro font-sans font-bold transition-ui cursor-pointer flex items-center gap-1.5 ${
                  selectedBandIds.length > 0
                    ? "bg-[var(--ink)] text-[var(--bg)] hover:opacity-90"
                    : "max-sm:hidden bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)]"
                }`}
                title={
                  selectedBandIds.length === filteredBands.length
                    ? "Deseleccionar todas"
                    : "Seleccionar todas las filtradas"
                }
              >
                {selectedBandIds.length === filteredBands.length ? (
                  <CheckSquare className="w-3.5 h-3.5 text-[var(--acc)]" />
                ) : selectedBandIds.length > 0 ? (
                  <MinusSquare className="w-3.5 h-3.5 text-[var(--acc)]" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-[var(--ink-2)]" />
                )}
                <span>
                  {selectedBandIds.length > 0
                    ? `${selectedBandIds.length}/${filteredBands.length}`
                    : "Sel. Todos"}
                </span>
              </button>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-[var(--surface)] rounded-[var(--r-m)] shrink-0">
              <button
                id="view-grid-btn"
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-[var(--r-s)] transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-[var(--ink)] text-[var(--bg)]"
                    : "text-[var(--ink-2)] hover:text-[var(--ink)]"
                }`}
                title="Vista en tarjetas"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <Button
                variant={viewMode === "table" ? "selected" : "ghost"}
                size="xs"
                id="view-table-btn"
                type="button"
                onClick={() => setViewMode("table")}
                title="Vista en lista / tabla"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "map" ? "selected" : "ghost"}
                size="xs"
                id="view-map-btn"
                type="button"
                onClick={() => setViewMode("map")}
                title="Vista en mapa interactivo"
              >
                <Map className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
