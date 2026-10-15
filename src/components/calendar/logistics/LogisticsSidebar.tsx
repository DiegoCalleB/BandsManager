/**
 * Barra lateral de logística del calendario: día libre con agenda o detalle del evento con sus pestañas.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { useCalendar } from "../CalendarContext";
import { EventDetailPanel } from "./EventDetailPanel";
import { FreeDayCampaigns } from "./FreeDayCampaigns";

/**
 * Barra lateral de logística del calendario: día libre con agenda o detalle del evento con sus pestañas.
 * @returns Sección de interfaz.
 */
export function LogisticsSidebar() {
  const { colors, selectedEventDetails,} = useCalendar();
  return (
    <>
      <div className={`${colors.card} p-5 flex flex-col justify-between lg:col-span-1`}>
      {selectedEventDetails.type === 'free' ? (
      <FreeDayCampaigns />
      ) : (
      <EventDetailPanel />
      )}

      {/* Footer info */}
      <div
      className={` pt-4 mt-6 flex justify-between items-center text-micro font-mono ${
        ' text-[var(--ink-2)]'
      }`}
      >
      <span>Huso horario: Madrid (UTC+2)</span>
      <span className="text-[var(--ok)]">● Sincronizado</span>
      </div>
    </div>
    </>
  );
}
