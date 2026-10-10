/**
 * Búsqueda, tipo, filtros, campaña y conmutador de vista (lista/mapa).
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ChevronDown, Filter, LayoutGrid, List, Map as MapIcon, Search, Target, X } from "lucide-react";
import { normalizeType } from "../../../utils/bookingUtils";
import { Button, IconButton, Input } from "../../ui";
import { useBookingCrm } from "./BookingCrmContext";

/**
 * Búsqueda, tipo, filtros, campaña y conmutador de vista (lista/mapa).
 * @returns Sección de interfaz.
 */
export function SearchAndViewRow() {
  const { sectionTab, searchTerm, setSearchTerm, typeFilter, setTypeFilter, sectionLeads, activeFiltersCount, isMobileFiltersOpen, setIsMobileFiltersOpen, activeCampaign, filterByCampaign, setFilterByCampaign, filteredLeads, viewMode, setViewMode } = useBookingCrm();
  return (
    <>
      {/* Search & View Mode Switcher Row — Responsive (Mobile simple, PC full) */}
      <div className="flex flex-col gap-2.5">
        {/* BÚSQUEDA — Siempre visible */}
        <div className="flex-1 flex gap-2 items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 pointer-events-none transition-colors text-[var(--acc-ink)]" />
            <Input
              size="sm"
              id="crm-search"
              type="text"
              placeholder={
                sectionTab === 'medios'
                  ? 'Buscar medio...'
                  : sectionTab === 'grupos'
                    ? 'Buscar management...'
                    : 'Buscar escenario...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 ${searchTerm ? "pr-8" : "pr-3"}`}
            />
            {searchTerm && (
              <IconButton
                label="Borrar búsqueda"
                size="icon-xs"
                id="crm-search-clear"
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5"
              >
                <X className="w-3.5 h-3.5" />
              </IconButton>
            )}
          </div>

          {/* Tipo Dropdown Selector — Solo en PC */}
          <div className="hidden sm:block relative shrink-0">
            <select data-raw
              id="crm-type-filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              aria-label="Filtrar por tipo"
              className={`px-3 py-2 pr-7 rounded-[var(--r-m)] text-xs font-semibold font-sans transition-colors cursor-pointer appearance-none ${
                typeFilter !== 'todos'
                  ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)] font-bold'
                  : 'bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              {sectionTab === 'medios' ? (
                <>
                  <option value="todos">Todos los medios ({sectionLeads.length})</option>
                  <option value="radio">Radios</option>
                  <option value="tv">TV</option>
                  <option value="prensa">Prensa</option>
                  <option value="redes">Redes</option>
                  <option value="podcast">Podcasts</option>
                </>
              ) : sectionTab === 'grupos' ? (
                <>
                  <option value="todos">Todas las entidades ({sectionLeads.length})</option>
                  <option value="grupo">Grupos</option>
                  <option value="agencia">Agencias</option>
                  <option value="manager">Mánagers</option>
                  <option value="productora">Productoras</option>
                  <option value="sello">Sellos</option>
                </>
              ) : (
                <>
                  <option value="todos">Tipo: Todos ({sectionLeads.length})</option>
                  <option value="sala">Salas ({sectionLeads.filter((l) => normalizeType(l.tipo) === 'sala').length})</option>
                  <option value="festival">
                    Festivales ({sectionLeads.filter((l) => normalizeType(l.tipo) === 'festival').length})
                  </option>
                  <option value="discoteca">
                    Discotecas ({sectionLeads.filter((l) => normalizeType(l.tipo) === 'discoteca').length})
                  </option>
                  <option value="ayuntamiento">
                    Ayuntamientos ({sectionLeads.filter((l) => normalizeType(l.tipo) === 'ayuntamiento').length})
                  </option>
                  <option value="agencia">
                    Agencias (
                    {sectionLeads.filter((l) => normalizeType(l.tipo) === 'agencia' || normalizeType(l.tipo) === 'manager').length})
                  </option>
                  <option value="sello">Sellos ({sectionLeads.filter((l) => normalizeType(l.tipo) === 'sello').length})</option>
                  <option value="productora">
                    Productores (
                    {
                      sectionLeads.filter((l) => normalizeType(l.tipo) === 'productora' || normalizeType(l.tipo) === 'productor')
                        .length
                    }
                    )
                  </option>
                  <option value="grupo">
                    Bandas Amigas ({sectionLeads.filter((l) => normalizeType(l.tipo) === 'grupo').length})
                  </option>
                </>
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-2.5 pointer-events-none opacity-60" />
          </div>

          {/* Filters & Campaign — PC only, Mobile in Herramientas */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <Button
              variant={activeFiltersCount > 0 || isMobileFiltersOpen ? "inverse" : "neutral"}
              size="sm"
              id="toggle-filters-btn"
              type="button"
              onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              className="items-center gap-1.5 shrink-0"
              title="Filtros avanzados y búsquedas guardadas"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-[var(--r-pill)] bg-[var(--acc)] text-[var(--on-acc)] text-micro font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>

            {activeCampaign && (
              <Button
                variant={filterByCampaign ? "inverse" : "neutral"}
                size="sm"
                id="crm-campaign-filter-btn"
                type="button"
                onClick={() => setFilterByCampaign(!filterByCampaign)}
                className="items-center gap-1.5 shrink-0"
                title={filterByCampaign ? 'Quitar filtro de campaña' : 'Filtrar por campaña'}
              >
                <Target className="w-3.5 h-3.5 text-[var(--acc-ink)] shrink-0" />
                <span>{filterByCampaign ? 'Campaña' : 'Campaña'}</span>
                {filterByCampaign && (
                  <span className="px-1.5 py-0.2 rounded-[var(--r-pill)] bg-[var(--acc)]/20 text-[var(--ink)] text-micro font-semibold tabular-nums">
                    {filteredLeads.length}
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* View Mode Toggle Switcher — PC: Completo, Móvil: Compacto */}
        <div className="flex items-center justify-between sm:justify-start gap-1 shrink-0">
          <div className="p-1 rounded-[var(--r-m)] flex items-center gap-1 bg-[var(--sunken)]">
            <Button
              variant={viewMode === 'grid' ? "selected" : "ghost"}
              size="xs"
              id="crm-view-grid"
              type="button"
              onClick={() => setViewMode('grid')}
              className="items-center justify-center gap-1.5"
              title="Vista en tarjetas"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tarjetas</span>
            </Button>
            <Button
              variant={viewMode === 'table' ? "selected" : "ghost"}
              size="xs"
              id="crm-view-table"
              type="button"
              onClick={() => setViewMode('table')}
              className="items-center justify-center gap-1.5"
              title="Vista en detalles / tabla"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Detalles</span>
            </Button>
            <Button
              variant={viewMode === 'map' ? "selected" : "ghost"}
              size="xs"
              id="crm-view-map"
              type="button"
              onClick={() => setViewMode('map')}
              className="items-center justify-center gap-1.5"
              title="Vista en mapa GPS interactivo"
            >
              <MapIcon className={`w-3.5 h-3.5 ${viewMode === 'map' ? 'text-[var(--on-acc)]' : 'text-[var(--ink-2)]'}`} />
              <span className="hidden sm:inline">Mapa</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
