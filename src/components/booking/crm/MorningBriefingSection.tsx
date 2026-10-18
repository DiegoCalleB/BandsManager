/**
 * Radar diario del mánager con las acciones prioritarias.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { MorningBriefingRadar } from "../MorningBriefingRadar";
import { useBookingCrm } from "./BookingCrmContext";
import { isStitchLight } from "./crmTheme";

/**
 * Radar diario del mánager con las acciones prioritarias.
 * @returns Sección de interfaz.
 */
export function MorningBriefingSection() {
  const { leads, concerts, tours, handleOpenLead, onUpdateLead, setRoadbookModalLead, selectedLead, setIsRoadbookModalOpen, effectiveBandName } = useBookingCrm();
  return (
    <>
      {/* 🌟 MORNING BRIEFING & RADAR DEL MÁNAGER (5-MINUTE DAILY ACTION RADAR) */}
      <div className="mb-2">
      <MorningBriefingRadar
        leads={leads}
        concerts={concerts}
        tours={tours}
        onSelectLead={(lead, options) => {
          handleOpenLead(lead, options);
        }}
        onApproveLead={(lead) => {
          onUpdateLead(lead.id, { estado: 'aprobado_propuesta' });
        }}
        onOpenRoadbookModal={(lead) => {
          setRoadbookModalLead(lead || selectedLead || leads[0] || null);
          setIsRoadbookModalOpen(true);
        }}
        isStitchLight={isStitchLight}
        bandName={effectiveBandName}
      />
      </div>
    </>
  );
}
