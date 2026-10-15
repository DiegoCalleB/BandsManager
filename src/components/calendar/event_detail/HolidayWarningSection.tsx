/**
 * Aviso de festivo, puente o éxodo vacacional en la ciudad del evento.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { HolidayDateWarning } from "../../common/HolidayDateWarning";
import { useEventDetail } from "./EventDetailContext";

/**
 * Aviso de festivo, puente o éxodo vacacional en la ciudad del evento.
 * @returns Sección de interfaz.
 */
export function HolidayWarningSection() {
  const { eventCity, eventDateStr } = useEventDetail();
  return (
    <>
{/* Aviso de festivo, puente o éxodo vacacional en la ciudad del evento */}
            {eventCity && eventDateStr && (
              <HolidayDateWarning date={eventDateStr} city={eventCity} />
            )}
    </>
  );
}
