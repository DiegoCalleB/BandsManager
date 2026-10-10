/**
 * Tarjeta detallada del ensayo o reunión seleccionado.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Bell, Edit, Maximize2 } from "lucide-react";
import { ShowIcon } from "../../ui/ShowIcon";
import { useCalendar } from "../CalendarContext";
import type { BandTaggedEvent } from "../calendarTypes";

/**
 * Tarjeta detallada del ensayo o reunión seleccionado.
 * @returns Sección de interfaz.
 */
export function RehearsalDetailCard() {
  const { selectedRehearsal, getBandIdentity, textTitle, setShowEventFichaModal, setReminderNotes, setReminderSuccessMsg, setReminderErrorMsg, setShowReminderModal, setViewingRehearsal } = useCalendar();
  return (
    <>
      {/* Tarjeta detallada del ensayo activo */}
      {selectedRehearsal &&
        (() => {
          const isReu = selectedRehearsal.tipo_evento === 'reunion';
          const bandInfo = getBandIdentity(
            selectedRehearsal.band_id,
            (selectedRehearsal as BandTaggedEvent).bandName || (selectedRehearsal as BandTaggedEvent).band_name
          );
          return (
            <div
              className={`p-3.5 rounded-[var(--r-m)] space-y-2.5 ${
                isReu ? 'bg-[var(--tentative)]/10' : 'bg-[var(--ok-soft)]/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`px-2 py-0.5 rounded-[var(--r-s)] text-micro font-sans font-bold ${
                        isReu ? 'bg-[var(--tentative)] text-[var(--on-tentative)]' : 'bg-[var(--ok)] text-[var(--on-ok)]'
                      }`}
                    >
                      {isReu ? 'Reunión' : 'Ensayo'}
                    </span>
                    <span className="px-2 py-0.5 rounded-[var(--r-s)] text-micro font-sans font-bold bg-[var(--surface)]/80 text-[var(--ink-2)]">
                      {bandInfo.name}
                    </span>
                    {selectedRehearsal.hora && (
                      <span className="px-2 py-0.5 rounded-[var(--r-s)] text-micro font-sans font-bold text-[var(--ink)] bg-[var(--surface)]/80">
                        <ShowIcon inline emoji="🕒" />{selectedRehearsal.hora}
                      </span>
                    )}
                  </div>
                  <h3 className={`text-base sm:text-lg font-bold font-display ${textTitle}`}>
                    {isReu ? selectedRehearsal.asunto || 'Reunión de Banda' : selectedRehearsal.lugar}
                  </h3>
                  {isReu && selectedRehearsal.enlace_reunion && (
                    <p className="text-micro font-sans text-[var(--ink-2)] mt-0.5 truncate">
                      <ShowIcon inline emoji="🔗" />{selectedRehearsal.enlace_reunion}
                    </p>
                  )}
                  {!isReu && selectedRehearsal.notas && (
                    <p className="text-micro font-sans text-[var(--ink-2)] mt-0.5 line-clamp-2"><ShowIcon inline emoji="📝" />{selectedRehearsal.notas}</p>
                  )}
                </div>

                {/* Botón de acción principal: Abrir Ficha */}
                <button
                  type="button"
                  onClick={() => setShowEventFichaModal(true)}
                  className={`px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-sans font-bold flex items-center gap-1.5 cursor-pointer transition-ui active:scale-[0.97] ${
                    isReu
                      ? 'bg-[var(--tentative)] hover:bg-[var(--tentative)]/80 text-[var(--on-tentative)]'
                      : 'bg-[var(--ok)] hover:brightness-95 text-[var(--on-ok)]'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Abrir ficha</span>
                </button>
              </div>

              {/* Fila de asistentes */}
              {(() => {
                const raw = selectedRehearsal.asistentes;
                let list: string[] = [];
                if (Array.isArray(raw)) {
                  list = raw;
                } else if (typeof raw === 'string' && (raw as string).trim()) {
                  const s = (raw as string).trim();
                  if (s.startsWith('[') && s.endsWith(']')) {
                    try {
                      const p = JSON.parse(s);
                      if (Array.isArray(p)) list = p;
                    } catch {
                      // Asistentes guardados ilegibles: se parte de lista vacía.
                    }
                  }
                  if (list.length === 0) {
                    list = s
                      .split(',')
                      .map((x) => x.trim())
                      .filter(Boolean);
                  }
                }
                if (list.length === 0) return null;
                return (
                  <div className="flex items-center gap-2 text-micro font-sans text-[var(--ink)] flex-wrap pt-1">
                    <span className="text-[var(--ink-2)]">Convocados:</span>
                    {list.map((a, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-[var(--surface)]/80 text-[var(--ink-2)]">
                        {typeof a === 'string' ? a : String(a)}
                      </span>
                    ))}
                  </div>
                );
              })()}

              {/* Botones secundarios */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setReminderNotes('');
                    setReminderSuccessMsg(null);
                    setReminderErrorMsg(null);
                    setShowReminderModal(true);
                  }}
                  className="px-2.5 py-1 rounded-[var(--r-pill)] text-micro font-sans font-bold bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] flex items-center gap-1 cursor-pointer"
                >
                  <Bell className="w-3 h-3 text-[var(--ink-2)]" />
                  <span>Notificar convocatoria</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingRehearsal(selectedRehearsal)}
                  className="px-2.5 py-1 rounded-[var(--r-pill)] text-micro font-sans font-bold bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] flex items-center gap-1 cursor-pointer"
                >
                  <Edit className="w-3 h-3 text-[var(--ok)]" />
                  <span>Editar ensayo</span>
                </button>
              </div>
            </div>
          );
        })()}
    </>
  );
}
