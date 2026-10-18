import type { Setlist } from "../../../types";
/**
 * d
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Disc3,Radio } from "lucide-react";
import { hasModuleAccess } from "../../../utils/planPermissions";
import { Button,Select } from "../../ui";
import { useCalendar } from "../CalendarContext";

/**
 * d
 * @returns Sección de interfaz.
 */
export function EventSetlistWidget() {
  const { isPromoPlan, currentUser, selectedConcert, selectedRehearsal, assignedSetlist, currentSetlistId, onUpdateConcert, onUpdateRehearsal, availableSetlists, setActiveStageInitialMode, setActiveStageSetlist } = useCalendar();
  return (
    <>
      {/* REPERTORIO / SETLIST ASIGNADO */}
      {(!isPromoPlan || hasModuleAccess(currentUser?.plan, 'repertorio')) && (selectedConcert || selectedRehearsal) && (
        <div className={` pt-2.5 mt-2.5 ${''}`}>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 text-micro font-mono font-bold text-[var(--acc)]">
              <Disc3 className="w-3.5 h-3.5 shrink-0 animate-spin-slow" />
              <span>Repertorio Asignado:</span>
            </div>
            {assignedSetlist && (
              <span className="text-micro font-mono px-2 py-1 rounded bg-[var(--ok)]/15 text-[var(--ink)] font-bold">
                {assignedSetlist.items?.length || 0} canciones/ítems
              </span>
            )}
          </div>

          <Select
            size="sm"
            value={currentSetlistId || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (selectedConcert) {
                onUpdateConcert(selectedConcert.id, { setlistId: val });
              } else if (selectedRehearsal) {
                onUpdateRehearsal(selectedRehearsal.id, { setlistId: val });
              }
            }}
            wrapperClassName="w-full"
          >
            <option value="">-- Sin repertorio asignado --</option>
            {availableSetlists.map((s: Setlist) => (
              <option key={s.id} value={s.id}>
                {s.nombre} ({s.tipoFormato})
              </option>
            ))}
          </Select>

          {assignedSetlist && (
            <div className="mt-2.5 flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                type="button"
                id="calendar-launch-stage-mode-btn"
                onClick={() => {
                  setActiveStageInitialMode(selectedConcert ? 'directo' : 'ensayo');
                  setActiveStageSetlist(assignedSetlist);
                }}
                className="flex-1 items-center justify-center gap-2/20"
                title="Lanzar modo escenario / vista de directo para este evento"
              >
                <Radio className="w-3.5 h-3.5 text-[var(--ink)]" />
                <span>{selectedConcert ? 'Lanzar Modo Escenario' : 'Lanzar Modo Ensayo'}</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
