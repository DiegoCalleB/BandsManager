/**
 * Línea de tiempo visual del concierto con los cortes coloreados por tipo.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Sliders } from "lucide-react";
import { useLiveConcertAlbum } from "./LiveConcertAlbumContext";
import { formatSeconds } from "./timeFormat";

/**
 * Línea de tiempo visual del concierto con los cortes coloreados por tipo.
 * @returns Sección de interfaz.
 */
export function ConcertTimeline() {
  const { tracks, expandedChordsIndex, setExpandedChordsIndex } = useLiveConcertAlbum();
  return (
    <>
      {/* Interactive Visual Concert Timeline */}
      {tracks.length > 0 && (
        <div className="bg-[var(--sunken)] p-3 rounded-[var(--r-m)] space-y-1.5">
          <div className="flex items-center justify-between text-xs font-sans text-[var(--ink-2)]">
            <span className="flex items-center gap-1 font-bold text-[var(--acc)]">
              <Sliders className="w-3.5 h-3.5" /> Línea del tiempo del
              concierto
            </span>
            <span>
              Duración estimada:{" "}
              {formatSeconds(
                Math.max(...tracks.map((t) => t.end), 0),
              )}
            </span>
          </div>
          <div className="h-6 w-full bg-[var(--surface)] rounded-[var(--r-s)] overflow-hidden flex p-0.5 gap-0.5">
            {(() => {
              const totalSecs = Math.max(
                ...tracks.map((t) => t.end),
                1,
              );
              return tracks.map((tr) => {
                const pct = Math.max(
                  1,
                  (tr.duration / totalSecs) * 100,
                );
                const isSong = tr.type === "musica";
                const isExpanded = expandedChordsIndex === tr.index;
                return (
                  <div
                    key={tr.index}
                    style={{ width: `${pct}%` }}
                    onClick={() =>
                      tr.type === "musica" &&
                      setExpandedChordsIndex(
                        isExpanded ? null : tr.index,
                      )
                    }
                    className={`h-full rounded relative group cursor-pointer transition-ui flex items-center justify-center text-micro font-sans font-bold truncate px-1 ${
                      isSong
                        ? "bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--on-acc)]"
                        : "bg-[var(--tentative)] hover:bg-[var(--tentative)] text-[var(--on-tentative)]"
                    }`}
                    title={`#${tr.index} ${tr.title} (${formatSeconds(tr.duration)})`}
                  >
                    <span className="truncate">
                      {tr.index}. {tr.title}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
    </>
  );
}
