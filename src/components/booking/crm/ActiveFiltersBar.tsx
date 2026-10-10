/**
 * Barra de píldoras con los filtros activos.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { X } from "lucide-react";
import { IconButton, LinkButton } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { useBookingCrm } from "./BookingCrmContext";

/**
 * Barra de píldoras con los filtros activos.
 * @returns Sección de interfaz.
 */
export function ActiveFiltersBar() {
  const { activeFiltersCount, isMobileFiltersOpen, selectedCityFilter, setSelectedCityFilter, typeFilter, setTypeFilter, onlyFavoritesFilter, setOnlyFavoritesFilter, onlyVerifiedFilter, setOnlyVerifiedFilter, minCapacityFilter, setMinCapacityFilter, activeSavedFilterId, savedFilters, setActiveSavedFilterId, handleClearAllFilters } = useBookingCrm();
  return (
    <>
      {/* Active Filters Pill Bar (Responsive on all screen sizes) */}
      {activeFiltersCount > 0 && !isMobileFiltersOpen && (
      <div className="flex items-center gap-1.5 overflow-x-auto shrink-0 pb-1 no-scrollbar text-xs animate-in fade-in duration-100">
        <span className="text-micro font-bold text-[var(--acc)] shrink-0">Filtros:</span>
        {selectedCityFilter && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--r-pill)] text-xs font-bold bg-[var(--acc)]/20 text-[var(--ink)] shrink-0">
            <ShowIcon inline emoji="📍" />{selectedCityFilter}
            <IconButton label="Cerrar" type="button" onClick={() => setSelectedCityFilter('')}>
              <X className="w-3 h-3" />
            </IconButton>
          </span>
        )}
        {typeFilter !== 'todos' && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--r-pill)] text-xs font-bold bg-[var(--acc)]/20 text-[var(--ink)] shrink-0">
            <ShowIcon inline emoji="🏛️" />{typeFilter}
            <IconButton label="Cerrar" type="button" onClick={() => setTypeFilter('todos')}>
              <X className="w-3 h-3" />
            </IconButton>
          </span>
        )}
        {onlyFavoritesFilter && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--r-pill)] text-xs font-bold bg-[var(--acc)]/20 text-[var(--ink)] shrink-0">
            <ShowIcon inline emoji="⭐" />Favoritos
            <IconButton label="Cerrar" type="button" onClick={() => setOnlyFavoritesFilter(false)}>
              <X className="w-3 h-3" />
            </IconButton>
          </span>
        )}
        {onlyVerifiedFilter && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--r-pill)] text-xs font-bold bg-[var(--acc)]/20 text-[var(--ink)] shrink-0">
            <ShowIcon inline emoji="✔" />Verificados
            <IconButton label="Cerrar" type="button" onClick={() => setOnlyVerifiedFilter(false)}>
              <X className="w-3 h-3" />
            </IconButton>
          </span>
        )}
        {minCapacityFilter > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--r-pill)] text-xs font-bold bg-[var(--acc)]/20 text-[var(--ink)] shrink-0">
            &gt;{minCapacityFilter} pax
            <IconButton label="Cerrar" type="button" onClick={() => setMinCapacityFilter(0)}>
              <X className="w-3 h-3" />
            </IconButton>
          </span>
        )}
        {activeSavedFilterId && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--r-pill)] text-xs font-bold bg-[var(--acc)]/20 text-[var(--ink)] shrink-0">
            <ShowIcon inline emoji="📌" />{savedFilters.find((f) => f.id === activeSavedFilterId)?.nombre || 'Búsqueda guardada'}
            <IconButton label="Cerrar" type="button" onClick={() => setActiveSavedFilterId(null)}>
              <X className="w-3 h-3" />
            </IconButton>
          </span>
        )}
        <LinkButton
          tone="muted"
          type="button"
          onClick={handleClearAllFilters}
          className="shrink-0 ml-1"
        >
          Limpiar todo
        </LinkButton>
      </div>
      )}
    </>
  );
}
