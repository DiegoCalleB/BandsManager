/**
 * Previsión meteorológica rápida del evento en el panel lateral.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { useCalendar } from "../CalendarContext";
import { EventWeatherCard } from "../EventWeatherCard";
import { isStitchLight } from "../calendarTheme";

/**
 * Previsión meteorológica rápida del evento en el panel lateral.
 * @returns Sección de interfaz.
 */
export function EventWeatherPanel() {
  const { selectedConcert, selectedRehearsal, selectedDateKey } = useCalendar();
  return (
    <>
      {/* Previsión Meteorológica Rápida en Panel Lateral */}
      {(selectedConcert?.ciudad || (selectedRehearsal?.lugar && selectedRehearsal.lugar.length > 2)) && (
        <div className="mb-4">
          <EventWeatherCard
            city={
              selectedConcert?.ciudad ||
              selectedRehearsal?.lugar?.split(',')[1]?.trim() ||
              selectedRehearsal?.lugar?.split('-')[1]?.trim() ||
              selectedRehearsal?.lugar ||
              ''
            }
            dateStr={selectedDateKey}
            timeStr={selectedConcert ? '21:30' : selectedRehearsal?.hora || '18:00'}
            isStitchLight={isStitchLight}
          />
        </div>
      )}
    </>
  );
}
