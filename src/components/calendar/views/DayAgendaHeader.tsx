/**
 * Cabecera de la agenda del día con acciones rápidas de alta.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Maximize2 } from "lucide-react";
import { Button } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { useCalendar } from "../CalendarContext";

/**
 * Cabecera de la agenda del día con acciones rápidas de alta.
 * @returns Sección de interfaz.
 */
export function DayAgendaHeader() {
  const { selectedDate, monthNames, textTitle, dayEventsList, textSub, selectedConcert, selectedRehearsal, setShowEventFichaModal, setShowCreateModal } = useCalendar();
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-[var(--r-m)] flex flex-col items-center justify-center font-sans font-bold shrink-0 bg-[var(--acc)]/15 text-[var(--ink)] border border-[var(--acc)]/30"
          >
            <span className="text-sm leading-none">{selectedDate.getDate()}</span>
            <span className="text-micro mt-0.5 opacity-80">{monthNames[selectedDate.getMonth()]?.slice(0, 3)}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`text-xs sm:text-sm font-bold font-display capitalize ${textTitle}`}>
                {selectedDate.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </h4>
              {dayEventsList.length > 0 && (
                <span className="px-2 py-0.2 rounded-[var(--r-pill)] text-micro font-sans font-bold bg-[var(--acc)]/20 text-[var(--ink)]">
                  {dayEventsList.length} {dayEventsList.length === 1 ? 'evento' : 'eventos'}
                </span>
              )}
            </div>
            <p className={`text-micro sm:text-xs font-sans ${textSub}`}>
              {dayEventsList.length === 0
                ? 'Día libre · Sin actividad programada'
                : selectedConcert
                  ? `Concierto en ${selectedConcert.sala}${selectedConcert.ciudad ? ` (${selectedConcert.ciudad})` : ''}`
                  : selectedRehearsal
                    ? selectedRehearsal.tipo_evento === 'reunion'
                      ? `Reunión: ${selectedRehearsal.asunto || 'Coordinación'}`
                      : `Ensayo en ${selectedRehearsal.lugar}`
                    : 'Eventos del día'}
            </p>
          </div>
        </div>

        {/* Botones de acción rápida para la fecha seleccionada */}
        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
          {dayEventsList.length > 0 && (
            <Button
              variant="primary"
              size="xs"
              type="button"
              onClick={() => setShowEventFichaModal(true)}
              className="items-center gap-1 font-bold"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Ver evento en modal</span>
            </Button>
          )}
          <Button
            variant="raised"
            size="xs"
            type="button"
            onClick={() => setShowCreateModal('concert')}
            className="items-center gap-1"
          >
            <span><ShowIcon inline emoji="🎸" /></span> + Concierto
          </Button>
          <Button
            variant="raised"
            size="xs"
            type="button"
            onClick={() => setShowCreateModal('rehearsal')}
            className="items-center gap-1"
          >
            <span><ShowIcon inline emoji="🥁" /></span> + Ensayo
          </Button>
        </div>
      </div>
    </>
  );
}
