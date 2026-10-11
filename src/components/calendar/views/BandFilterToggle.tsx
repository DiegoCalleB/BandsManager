/**
 * Selector Todas/Mi banda para usuarios con varias bandas.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { DoorClosed, Mic, Music, Users } from "lucide-react";
import { Button } from "../../ui";
import { useCalendar } from "../CalendarContext";

/**
 * Selector Todas/Mi banda para usuarios con varias bandas.
 * @returns Sección de interfaz.
 */
export function BandFilterToggle() {
  const { isMultiBandUser, filterBandMode, setFilterBandMode, concerts, rehearsals, activeBandName, activeBandConcerts, activeBandRehearsals } = useCalendar();
  return (
    <>
      {/* Band Filter Mode Segment Toggle */}
      {isMultiBandUser && (
        <div className={`flex items-center rounded-[var(--r-m)] p-1 gap-1 shrink-0 ${'bg-[var(--sunken)]'}`}>
          <Button
            variant={filterBandMode === 'all' ? "selected" : "ghost"}
            size="xs"
            id="calendar-view-all-bands-btn"
            onClick={() => setFilterBandMode('all')}
            className="flex-1 items-center justify-center gap-1.5 whitespace-nowrap min-w-0"
            title="Ver eventos de todos los grupos"
          >
            <Users className="w-3 h-3 shrink-0" />
            <span className="truncate">Todas las bandas</span>
            <span
              className={`hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-micro font-sans font-extrabold shrink-0 ${
                filterBandMode === 'all' ? 'bg-[var(--sunken)] text-[var(--ink)]' : 'bg-[var(--sunken)]/50 text-[var(--ink-2)]'
              }`}
            >
              <span className="inline-flex items-center gap-0.5 text-[var(--ok)]" title={`${concerts.length} directos totales`}>
                <Mic className="w-2.5 h-2.5" />
                {concerts.length}
              </span>
              <span className="opacity-30">•</span>
              <span
                className="inline-flex items-center gap-0.5 text-[var(--tentative)]"
                title={`${rehearsals.length} ensayos totales`}
              >
                <DoorClosed className="w-2.5 h-2.5" />
                {rehearsals.length}
              </span>
            </span>
          </Button>

          <Button
            variant={filterBandMode === 'active' ? "selected" : "ghost"}
            size="xs"
            id="calendar-view-active-band-btn"
            onClick={() => setFilterBandMode('active')}
            className="flex-1 items-center justify-center gap-1.5 whitespace-nowrap min-w-0"
            title={`Filtrar solo ${activeBandName}`}
          >
            <Music className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[90px] sm:max-w-none">{activeBandName}</span>
            <span
              className={`hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-micro font-sans font-extrabold shrink-0 ${
                filterBandMode === 'active' ? 'bg-[var(--sunken)] text-[var(--ink)]' : 'bg-[var(--sunken)]/50 text-[var(--ink-2)]'
              }`}
            >
              <span className="inline-flex items-center gap-0.5 text-[var(--ok)]" title={`${activeBandConcerts.length} directos`}>
                <Mic className="w-2.5 h-2.5" />
                {activeBandConcerts.length}
              </span>
              <span className="opacity-30">•</span>
              <span
                className="inline-flex items-center gap-0.5 text-[var(--tentative)]"
                title={`${activeBandRehearsals.length} ensayos`}
              >
                <DoorClosed className="w-2.5 h-2.5" />
                {activeBandRehearsals.length}
              </span>
            </span>
          </Button>
        </div>
      )}
    </>
  );
}
