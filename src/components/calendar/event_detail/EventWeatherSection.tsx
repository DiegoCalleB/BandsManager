/**
 * Previsión meteorológica del evento.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { EventWeatherCard } from "../EventWeatherCard";
import { useEventDetail } from "./EventDetailContext";

/**
 * Previsión meteorológica del evento.
 * @returns Sección de interfaz.
 */
export function EventWeatherSection() {
  const { eventCity, eventDateStr, eventTimeStr, isStitchLight, setModalWeatherAlertsState } = useEventDetail();
  return (
    <>
{/* Previsión Meteorológica Open-Meteo para el Evento */}
            {eventCity && eventDateStr && (
              <EventWeatherCard
                collapsible
                defaultExpanded={typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches}
                city={eventCity}
                dateStr={eventDateStr}
                timeStr={eventTimeStr}
                isStitchLight={isStitchLight}
                onAlertsDetected={(alerts) => setModalWeatherAlertsState(alerts)}
              />
            )}
    </>
  );
}
