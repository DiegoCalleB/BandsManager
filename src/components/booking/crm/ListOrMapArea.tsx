/**
 * Área principal: mapa de leads o tabla de leads según la vista.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { normalizeType } from "../../../utils/bookingUtils";
import { VenueMap } from "../../VenueMap";
import { LeadsTable } from "../LeadsTable";
import { useBookingCrm } from "./BookingCrmContext";

/**
 * Área principal: mapa de leads o tabla de leads según la vista.
 * @returns Sección de interfaz.
 */
export function ListOrMapArea() {
  const { viewMode, filteredLeads, selectedLead, handleOpenLead, onUpdateLead, selectedCityFilter, handleDeleteSingleLead, activeCampaign, handleLeadLogoUpload, getStatusBadgeClass, getStatusLabel, sectionTab, selectedLeadIds, setSelectedLeadIds, setRouteAnchorCity, effectiveBandName, concerts } = useBookingCrm();
  return (
    <>
      {/* Main Display Area: Map vs List */}
      {viewMode === 'map' ? (
      <VenueMap
        leads={filteredLeads}
        selectedLead={selectedLead}
        onSelectLead={handleOpenLead}
        onUpdateLead={onUpdateLead}
        activeCityFilter={selectedCityFilter}
        activeRegionFilter=""
      />
      ) : (
      <LeadsTable
        onDeleteLead={handleDeleteSingleLead}
        leads={filteredLeads}
        selectedLead={selectedLead}
        onSelectLead={handleOpenLead}
        onUpdateLead={onUpdateLead}
        activeCampaign={activeCampaign}
        onLeadLogoUpload={(file) => handleLeadLogoUpload(file, false)}
        viewMode={viewMode === 'grid' ? 'grid' : 'table'}
        getStatusBadgeClass={getStatusBadgeClass}
        getStatusLabel={getStatusLabel}
        normalizeType={normalizeType}
        sectionTab={sectionTab}
        selectedLeadIds={selectedLeadIds}
        onToggleSelectLead={(id, e) => {
          if (e) e.stopPropagation();
          setSelectedLeadIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
        }}
        onSelectAllFiltered={() => {
          setSelectedLeadIds(filteredLeads.map((l) => l.id));
        }}
        onDeselectAll={() => setSelectedLeadIds([])}
        isAllSelected={filteredLeads.length > 0 && filteredLeads.every((l) => selectedLeadIds.includes(l.id))}
        isSomeSelected={filteredLeads.length > 0 && filteredLeads.some((l) => selectedLeadIds.includes(l.id))}
        onFilterByRouteCity={setRouteAnchorCity}
        effectiveBandName={effectiveBandName}
        concerts={concerts}
      />
      )}
    </>
  );
}
