/**
 * d
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ExternalLink,Video } from "lucide-react";
import { ShowIcon } from "../../ui/ShowIcon";
import { useCalendar } from "../CalendarContext";

/**
 * d
 * @returns Sección de interfaz.
 */
export function RehearsalMeetingWidget() {
  const { selectedRehearsal } = useCalendar();
  return (
    <>
      {/* WIDGET REUNIÓN (ENLACE VIDEOCONFERENCIA / ASUNTO) */}
      {selectedRehearsal?.tipo_evento === 'reunion' && (
        <div className={`mt-3 pt-3 border-t ${'border-[var(--hair)]'}`}>
          <div className="flex items-center justify-between gap-1 mb-2">
            <div className="flex items-center gap-1.5 text-micro font-mono font-bold text-[var(--acc)]">
              <Video className="w-3.5 h-3.5 shrink-0 text-[var(--acc)]" />
              <span>Detalles de la Reunión:</span>
            </div>
            <span className="text-micro font-mono px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)]/15 text-[var(--ink)] ">
              <ShowIcon inline emoji="🤝" />Coordinación
            </span>
          </div>

          <div
            className={`p-2.5 rounded-[var(--r-m)] space-y-2 ${
              'bg-[var(--sunken)] '
            }`}
          >
            {selectedRehearsal.asunto && (
              <div className="text-xs font-semibold text-[var(--acc)]"><ShowIcon inline emoji="📌" />{selectedRehearsal.asunto}</div>
            )}
            <div className="text-micro text-[var(--ink-2)] flex items-center gap-1.5">
              <span><ShowIcon inline emoji="📍" />{selectedRehearsal.lugar}</span>
            </div>

            {selectedRehearsal.enlace_reunion && (
              <div className="pt-1 flex items-center gap-2">
                <a
                  href={
                    selectedRehearsal.enlace_reunion.startsWith('http')
                      ? selectedRehearsal.enlace_reunion
                      : `https://${selectedRehearsal.enlace_reunion}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-3 py-1.5 bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] rounded-[var(--r-m)] text-xs font-mono font-bold flex items-center justify-center gap-1.5/20 transition-ui cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Unirse a Videollamada</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
