/**
 * Panel unificado de filtros (escritorio, tableta y móvil).
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { normalizeType } from "../../../utils/bookingUtils";
import { BookingFiltersPanel } from "../BookingFiltersPanel";
import { useBookingCrm } from "./BookingCrmContext";

/**
 * Panel unificado de filtros (escritorio, tableta y móvil).
 * @returns Sección de interfaz.
 */
export function FiltersPanelSection() {
  const { isMobileFiltersOpen, setIsMobileFiltersOpen, sectionTab, handleSelectSectionTab, viewMode, setViewMode, typeFilter, setTypeFilter, onlyFavoritesFilter, setOnlyFavoritesFilter, onlyVerifiedFilter, setOnlyVerifiedFilter, minCapacityFilter, setMinCapacityFilter, isSavingFilterOpen, setIsSavingFilterOpen, newFilterName, setNewFilterName, handleSaveCurrentFilter, savedFilters, activeSavedFilterId, handleApplySavedFilter, handleDeleteSavedFilter, selectedCityFilter, setSelectedCityFilter, handleClearAllFilters, filteredLeads, sectionLeads, activeLeadsForSection, displayCityChips, cityCounts } = useBookingCrm();
  return (
    <>
      {/* ⚡ UNIFIED COMPACT FILTERS PANEL (Desktop, Tablet & Mobile) */}
      <BookingFiltersPanel
      isOpen={isMobileFiltersOpen}
      onClose={() => setIsMobileFiltersOpen(false)}
      sectionTab={sectionTab}
      handleSelectSectionTab={handleSelectSectionTab}
      viewMode={viewMode}
      setViewMode={setViewMode}
      typeFilter={typeFilter}
      setTypeFilter={setTypeFilter}
      onlyFavoritesFilter={onlyFavoritesFilter}
      setOnlyFavoritesFilter={setOnlyFavoritesFilter}
      onlyVerifiedFilter={onlyVerifiedFilter}
      setOnlyVerifiedFilter={setOnlyVerifiedFilter}
      minCapacityFilter={minCapacityFilter}
      setMinCapacityFilter={setMinCapacityFilter}
      isSavingFilterOpen={isSavingFilterOpen}
      setIsSavingFilterOpen={setIsSavingFilterOpen}
      newFilterName={newFilterName}
      setNewFilterName={setNewFilterName}
      handleSaveCurrentFilter={handleSaveCurrentFilter}
      savedFilters={savedFilters}
      activeSavedFilterId={activeSavedFilterId}
      handleApplySavedFilter={handleApplySavedFilter}
      handleDeleteSavedFilter={handleDeleteSavedFilter}
      selectedCityFilter={selectedCityFilter}
      setSelectedCityFilter={setSelectedCityFilter}
      handleClearAllFilters={handleClearAllFilters}
      filteredCount={filteredLeads.length}
      sectionLeads={sectionLeads}
      normalizeType={normalizeType}
      activeLeadsForSection={activeLeadsForSection}
      displayCityChips={displayCityChips}
      cityCounts={cityCounts}
      />
    </>
  );
}
