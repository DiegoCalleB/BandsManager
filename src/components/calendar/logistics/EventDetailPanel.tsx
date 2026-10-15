/**
 * Detalle del evento seleccionado: cabecera, previsión, información principal y pestañas de logística.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Maximize2 } from "lucide-react";
import { Button } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { useCalendar } from "../CalendarContext";
import { EventCoreInfo } from "./EventCoreInfo";
import { EventWeatherPanel } from "./EventWeatherPanel";
import { LogisticsSubtabsBar } from "./LogisticsSubtabsBar";
import { LogisticsTabContent } from "./LogisticsTabContent";
import { MultiDayEventSelector } from "./MultiDayEventSelector";

/**
 * Detalle del evento seleccionado: cabecera, previsión, información principal y pestañas de logística.
 * @returns Sección de interfaz.
 */
export function EventDetailPanel() {
  const { selectedDate, monthNames, selectedConcert, selectedRehearsal, getEventBandName, textTitle, selectedEventTitle, textSub, setShowEventFichaModal, setReminderNotes, setReminderSuccessMsg, setReminderErrorMsg, setShowReminderModal, setViewingConcert, setViewingRehearsal, onDeleteConcert, setSelectedEventId, onDeleteRehearsal } = useCalendar();
  return (
    <>
      <div id="calendar-event-detail-sidebar" className="concert-detail-view">
        {/* Day details */}
        <div className={`pb-4 mb-4 flex items-center gap-3 border-b ${'border-[var(--hair)]'}`}>
          <div
            className={`w-11 h-11 rounded-[var(--r-m)] flex flex-col items-center justify-center shrink-0 ${
              'bg-[var(--sunken)] text-[var(--ink)]'
            }`}
          >
            <span className={`text-base font-mono font-bold leading-none ${'text-[var(--acc)]'}`}>
              {selectedDate.getDate()}
            </span>
            <span
              className={`text-micro font-mono font-extrabold mt-0.5 ${'text-[var(--ink-2)]'}`}
            >
              {monthNames[selectedDate.getMonth()]?.slice(0, 3).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <div
                className={`text-micro font-mono font-bold ${'text-[var(--acc)]'}`}
              >
                Logística de ensayos y conciertos
              </div>
              {(selectedConcert || selectedRehearsal) && (
                <span className="px-2 py-0.5 rounded-[var(--r-s)] text-micro font-mono font-bold bg-[var(--acc)]/20 text-[var(--ink)] shadow-xs flex items-center gap-1">
                  <ShowIcon inline emoji="🎸" />Banda: {getEventBandName(selectedConcert || selectedRehearsal)}
                </span>
              )}
            </div>
            <h3 className={`text-lg font-bold font-display mt-0.5 ${textTitle}`}>{selectedEventTitle}</h3>
            <p className={`text-micro font-mono mt-0.5 ${textSub}`}>
              {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}, {selectedDate.getFullYear()}
            </p>
          </div>
          <div className="flex flex-col gap-1.5 shrink-0 self-start">
            {(selectedConcert || selectedRehearsal) && (
              <Button
                variant="neutral"
                size="xs"
                type="button"
                onClick={() => setShowEventFichaModal(true)}
                className="hidden items-center gap-1"
                title="Ampliar esta ficha en un modal centrado"
              >
                <Maximize2 className="w-3 h-3" />
                Ampliar
              </Button>
            )}
            {(selectedConcert || selectedRehearsal) && (
              <Button
                variant="neutral"
                size="xs"
                type="button"
                onClick={() => {
                  setReminderNotes('');
                  setReminderSuccessMsg(null);
                  setReminderErrorMsg(null);
                  setShowReminderModal(true);
                }}
                className="items-center gap-1"
                title="Enviar un recordatorio por correo/notificación a los convocados"
              >
                <ShowIcon inline emoji="🔔" />Notificar banda
              </Button>
            )}
            {selectedConcert && (
              <Button
                variant="neutral"
                size="xs"
                type="button"
                onClick={() => setViewingConcert(selectedConcert)}
                className="items-center gap-1"
                title="Editar ficha completa del concierto"
              >
                <ShowIcon inline emoji="✎" />Editar ficha
              </Button>
            )}
            {selectedRehearsal && (
              <Button
                variant="neutral"
                size="xs"
                type="button"
                onClick={() => setViewingRehearsal(selectedRehearsal)}
                className="items-center gap-1"
                title="Editar ficha completa del ensayo"
              >
                <ShowIcon inline emoji="✎" />Editar ficha
              </Button>
            )}
            {selectedConcert && onDeleteConcert && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`¿Eliminar el concierto en ${selectedConcert.sala}? Esta acción no se puede deshacer.`)) {
                    setSelectedEventId(null);
                    onDeleteConcert(selectedConcert.id);
                  }
                }}
                className="px-2.5 py-1.5 text-micro font-mono font-bold rounded-[var(--r-pill)] transition-colors cursor-pointer bg-[var(--alert)]/40 text-[var(--ink)] hover:bg-[var(--alert)]/50"
              >
                <ShowIcon inline emoji="🗑" />Eliminar
              </button>
            )}
            {selectedRehearsal && onDeleteRehearsal && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`¿Eliminar este ensayo en ${selectedRehearsal.lugar}? Esta acción no se puede deshacer.`)) {
                    setSelectedEventId(null);
                    onDeleteRehearsal(selectedRehearsal.id);
                  }
                }}
                className="px-2.5 py-1.5 text-micro font-mono font-bold rounded-[var(--r-pill)] transition-colors cursor-pointer bg-[var(--alert)]/40 text-[var(--ink)] hover:bg-[var(--alert)]/50"
              >
                <ShowIcon inline emoji="🗑" />Eliminar
              </button>
            )}
          </div>
        </div>

        <MultiDayEventSelector />

        <EventWeatherPanel />

        {/* Core Info */}
        <EventCoreInfo />

        <LogisticsSubtabsBar />

        <LogisticsTabContent />
      </div>
    </>
  );
}
