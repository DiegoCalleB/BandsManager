/**
 * Búsqueda, filtros, selector de vista y acciones del listado.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Filter,LayoutGrid,List,Map as MapIcon,MessageCircle,Search } from "lucide-react";
import { Button,Input,Select } from "../ui";
import { useFansPanel } from "./FansPanelContext";

/**
 * Búsqueda, filtros, selector de vista y acciones del listado.
 * @returns Sección de interfaz.
 */
export function FansToolbar() {
  const { searchQuery, setSearchQuery, filterOrigen, setFilterOrigen, uniqueConcertIds, selectedNivelFilter, setSelectedNivelFilter, viewMode, setViewMode, filteredFans } = useFansPanel();
  return (
    <>
<div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-[var(--ink-2)] absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  size="sm"
                  type="text"
                  placeholder="Buscar por nombre, email o ciudad…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3"
                />
              </div>
              <div className="relative w-full sm:w-64">
                <Filter className="w-4 h-4 text-[var(--ink-2)] absolute left-3 top-1/2 -translate-y-1/2" />
                <select data-raw
                  value={filterOrigen}
                  onChange={(e) => setFilterOrigen(e.target.value)}
                  className="w-full bg-[var(--sunken)] focus:rounded-[var(--r-m)] pl-9 pr-3 py-2 text-xs text-[var(--ink)] outline-none appearance-none font-sans"
                >
                  <option value="">Todos los orígenes</option>
                  {uniqueConcertIds.map((c) => (
                    <option key={c.id} value={c.id}>
                      Concierto: {c.name}
                    </option>
                  ))}
                  <option value="Otros">Redes sociales / amigos / otros</option>
                </select>
              </div>
              <div className="relative w-full sm:w-48">
                <Select
                  size="sm"
                  value={selectedNivelFilter}
                  onChange={(e) => setSelectedNivelFilter(e.target.value)}
                  wrapperClassName="w-full"
                >
                  <option value="">Todos los niveles</option>
                  <option value="superfan">Superfan</option>
                  <option value="fundador">Fan Fundador</option>
                  <option value="fiel">Fan Fiel</option>
                  <option value="backstage">VIP Backstage</option>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Switcher */}
              <div className="flex items-center gap-1 p-1 bg-[var(--sunken)] rounded-[var(--r-m)]">
                <Button
                  variant={viewMode === "feed" ? "selected" : "ghost"}
                  size="xs"
                  type="button"
                  onClick={() => setViewMode("feed")}
                  className="items-center gap-1.5"
                  title="Muro social y comunidad"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Muro Social</span>
                </Button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`px-2.5 py-1 rounded-[var(--r-s)] text-xs font-sans font-bold flex items-center gap-1.5 transition-ui cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-[var(--ink)] text-[var(--bg)]"
                      : "text-[var(--ink-2)] hover:text-[var(--ink)]"
                  }`}
                  title="Vista en tarjetas"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Tarjetas</span>
                </button>
                <Button
                  variant={viewMode === "table" ? "selected" : "ghost"}
                  size="xs"
                  type="button"
                  onClick={() => setViewMode("table")}
                  className="items-center gap-1.5"
                  title="Vista en detalles / tabla"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Tabla CRM</span>
                </Button>
                <Button
                  variant={viewMode === "map" ? "selected" : "ghost"}
                  size="xs"
                  type="button"
                  onClick={() => setViewMode("map")}
                  className="items-center gap-1.5"
                  title="Vista en mapa por ciudades"
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>Mapa</span>
                </Button>
              </div>

              <span className="text-xs text-[var(--ink-2)] font-sans shrink-0 hidden sm:inline">
                {filteredFans.length} resultados
              </span>
            </div>
          </div>
    </>
  );
}
