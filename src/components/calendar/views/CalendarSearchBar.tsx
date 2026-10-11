/**
 * Buscador de eventos por palabras clave, sala, ciudad, banda o evento.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Search, X } from "lucide-react";
import { IconButton } from "../../ui";
import { useCalendar } from "../CalendarContext";

/**
 * Buscador de eventos por palabras clave, sala, ciudad, banda o evento.
 * @returns Sección de interfaz.
 */
export function CalendarSearchBar() {
  const { showMobileSearch, calendarSearchTerm, setCalendarSearchTerm, filteredConcerts, filteredRehearsals } = useCalendar();
  return (
    <>
      {/* Quick Search Bar across calendar events (Palabras clave, sala, ciudad, banda, evento) */}
      <div className={`mt-3 pt-2 ${showMobileSearch || calendarSearchTerm ? "" : "hidden"} sm:block`}>
        <div className="flex items-center gap-2">
          <div
            className={`relative flex-1 flex items-center rounded-[var(--r-m)] transition-ui ${
              'bg-[var(--sunken)] focus:ring-1 focus:ring-[var(--ink-3)] shadow-xs'
            }`}
          >
            <Search className="w-4 h-4 ml-3 text-[var(--ink-2)] shrink-0" />
            <input data-raw
              type="text"
              value={calendarSearchTerm}
              onChange={(e) => setCalendarSearchTerm(e.target.value)}
              placeholder="Buscar evento, sala, ciudad, artista, notas (ej. Joy Eslava, Madrid, acústico)…"
              className={`w-full px-2.5 py-1.5 text-xs font-sans bg-transparent outline-none ${
                'text-[var(--ink)] placeholder:text-[var(--ink-2)]'
              }`}
            />
            {calendarSearchTerm && (
              <IconButton
                label="Borrar búsqueda"
                size="icon-xs"
                type="button"
                onClick={() => setCalendarSearchTerm('')}
                className="mr-2"
              >
                <X className="w-3.5 h-3.5" />
              </IconButton>
            )}
          </div>
          {calendarSearchTerm && (
            <div className="text-xs font-mono shrink-0 px-2 py-1 rounded-[var(--r-m)] bg-[var(--acc)]/15 text-[var(--ink)] ">
              {filteredConcerts.length + filteredRehearsals.length} resultados
            </div>
          )}
        </div>
      </div>
    </>
  );
}
