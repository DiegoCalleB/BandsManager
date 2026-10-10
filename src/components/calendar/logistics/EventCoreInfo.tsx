/**
 * Información principal del evento: hora, lugar, entradas, notas, convocatoria y widgets.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Clock,MapPin,Navigation,Ticket,Users } from "lucide-react";
import DirectionsCard from "../../DirectionsCard";
import { ShowIcon } from "../../ui/ShowIcon";
import { useCalendar } from "../CalendarContext";
import { isStitchLight } from "../calendarTheme";
import { ConcertBreakEvenCard } from "../ConcertBreakEvenCard";
import { ConcertQrWidget } from "./ConcertQrWidget";
import { EventSetlistWidget } from "./EventSetlistWidget";
import { RehearsalMeetingWidget } from "./RehearsalMeetingWidget";

/**
 * Información principal del evento: hora, lugar, entradas, notas, convocatoria y widgets.
 * @returns Sección de interfaz.
 */
export function EventCoreInfo() {
  const { textSub, selectedEventDetails, textTitle, isPromoPlan, selectedConcert, selectedRehearsal } = useCalendar();
  return (
    <>
      <div className={`space-y-3 mb-6 rounded-[var(--r-m)] p-3 ${'bg-[var(--surface)]'}`}>
        <div className="flex items-center gap-2 text-micro">
          <Clock className={`w-4 h-4 shrink-0 ${'text-[var(--acc)]'}`} />
          <span className={`font-mono ${textSub}`}>Hora:</span>
          <span className={`font-bold font-mono ${'text-[var(--acc)]'}`}>
            {selectedEventDetails.time}
          </span>
        </div>
        <div className="flex items-start gap-2 text-micro">
          <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${'text-[var(--acc)]'}`} />
          <div className="flex-1">
            <span className={`font-mono ${textSub}`}>Lugar:</span>
            <p className={`font-medium font-sans mt-0.5 ${textTitle}`}>{selectedEventDetails.lugar}</p>
            {selectedEventDetails.direccion && (
              <p className={`text-micro font-sans mt-1 ${'text-[var(--ink-2)]'}`}>
                <span className="font-semibold font-mono">Dirección:</span> {selectedEventDetails.direccion}
              </p>
            )}
          </div>
        </div>
        {selectedEventDetails.locationQuery && selectedEventDetails.type !== 'free' && (
          <div className="pt-3 mt-2.5 flex justify-center">
            <DirectionsCard
              query={selectedEventDetails.locationQuery}
              locationName={selectedEventDetails.lugar}
              address={selectedEventDetails.direccion}
              isStitchLight={isStitchLight}
            />
          </div>
        )}
        {!isPromoPlan && selectedEventDetails.type === 'concert' && (
          <div className={`flex items-center gap-2 text-micro pt-2 mt-1 ${''}`}>
            <span className={`font-mono ${textSub}`}>Compensación:</span>
            <span className="text-[var(--ok)] font-bold font-mono">{selectedEventDetails.fee}</span>
          </div>
        )}
        {selectedEventDetails.type === 'concert' && (selectedEventDetails.entradasUrl || selectedEventDetails.entradasLugarFisico) && (
          <div className="flex flex-col gap-1.5 pt-2 mt-1 border-t border-[var(--hair)]">
            {selectedEventDetails.entradasUrl && (
              <a
                href={selectedEventDetails.entradasUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[var(--r-m)] text-micro font-mono font-bold bg-[var(--ok)] text-[var(--on-ok)] hover:bg-[var(--ok)] transition-colors w-fit"
              >
                <Ticket className="w-3.5 h-3.5" /> Comprar entradas
              </a>
            )}
            {selectedEventDetails.entradasLugarFisico && (
              <div className="flex items-center gap-2 text-micro">
                <MapPin className="w-4 h-4 text-[var(--ok)] shrink-0" />
                <span className={`font-mono ${textSub}`}>También en:</span>
                <span className="font-semibold font-mono">{selectedEventDetails.entradasLugarFisico}</span>
              </div>
            )}
          </div>
        )}
        {!isPromoPlan && selectedEventDetails.type === 'concert' && selectedConcert && (
          <ConcertBreakEvenCard concert={selectedConcert} isStitchLight={isStitchLight} textTitle={textTitle} textSub={textSub} />
        )}
        {selectedEventDetails.notes && (
          <div
            className={`text-micro font-sans italic pt-2 leading-relaxed ${' text-[var(--ink-2)]'}`}
          >
            &ldquo;{selectedEventDetails.notes}&rdquo;
          </div>
        )}

        {selectedConcert?.giraNombre && (
          <div className="flex items-center gap-2 text-micro pt-2 border-t border-[var(--hair)] mt-2">
            <Navigation className="w-4 h-4 text-[var(--acc)] shrink-0" />
            <span className={`font-mono ${textSub}`}>Gira:</span>
            <span className="font-bold font-mono text-[var(--acc)]"><ShowIcon inline emoji="🚐" />{selectedConcert.giraNombre}</span>
          </div>
        )}

        {!isPromoPlan && (selectedConcert?.convocatoria_tipo || selectedRehearsal?.convocatoria_tipo) && (
          <div className="flex items-center gap-2 text-micro pt-2 border-t border-[var(--hair)] mt-2">
            <Users className="w-4 h-4 text-[var(--acc)] shrink-0" />
            <span className={`font-mono ${textSub}`}>Convocatoria:</span>
            <span className="font-bold font-mono text-[var(--acc)]">
              {(selectedConcert?.convocatoria_tipo || selectedRehearsal?.convocatoria_tipo) === 'completa'
                ? 'Banda Completa'
                : `Parcial (${(() => {
                    // Datos antiguos guardaban los nombres como texto suelto, de ahí la unión con string.
                    const raw = (selectedConcert?.convocados_nombres || selectedRehearsal?.convocados_nombres) as string | string[] | undefined;
                    if (Array.isArray(raw)) return raw.join(', ') || 'Seleccionados';
                    if (typeof raw === 'string' && raw.trim()) return raw.trim();
                    return 'Seleccionados';
                  })()})`}
            </span>
          </div>
        )}

        <ConcertQrWidget />
        <RehearsalMeetingWidget />

        <EventSetlistWidget />
      </div>
    </>
  );
}
