/**
 * Modal de trabajo de la sala seleccionada (escritorio y móvil).
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import type { ComponentProps } from 'react';
import { autoDetectVenueAddress, normalizeStatus, normalizeType } from "../../../utils/bookingUtils";
import { VenueWorkspaceModal } from "../venue_modal/VenueWorkspaceModal";
import { useBookingCrm } from "./BookingCrmContext";

/**
 * Modal de trabajo de la sala seleccionada (escritorio y móvil).
 * @returns Sección de interfaz.
 */
export function VenueWorkspaceHost() {
  const { selectedLead, setSelectedLead, filteredLeads, handleOpenLead, onUpdateLead, handleDeleteSingleLead, getStatusBadgeClass, getStatusLabel, getStatusDotColor, sectionTab, activeCampaign, handleLeadLogoUpload, isUploadingLeadLogo, venueDetailInitialTab, setRouteAnchorCity, effectiveBandName, concerts } = useBookingCrm();
  return (
    <>
      {/* UNIFIED VENUE WORKSPACE MODAL (Desktop & Mobile) */}
      <VenueWorkspaceModal
      isOpen={Boolean(selectedLead)}
      onClose={() => setSelectedLead(null)}
      leads={filteredLeads}
      selectedLead={selectedLead}
      onSelectLead={handleOpenLead}
      onUpdateLead={onUpdateLead}
      onDeleteLead={handleDeleteSingleLead}
      getStatusBadgeClass={getStatusBadgeClass}
      getStatusLabel={getStatusLabel}
      getStatusDotColor={getStatusDotColor}
      normalizeStatus={normalizeStatus}
      normalizeType={normalizeType}
      autoDetectVenueAddress={autoDetectVenueAddress}
      sectionTab={sectionTab}
      activeCampaign={activeCampaign}
      onLeadLogoUpload={(file) => handleLeadLogoUpload(file, true)}
      isUploadingLeadLogo={isUploadingLeadLogo}
      initialTab={venueDetailInitialTab === 'info' ? 'pitch' : (venueDetailInitialTab as ComponentProps<typeof VenueWorkspaceModal>['initialTab'])}
      onFilterByRouteCity={setRouteAnchorCity}
      bandName={effectiveBandName}
      concerts={concerts}
      />
    </>
  );
}
