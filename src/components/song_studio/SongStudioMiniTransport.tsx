/**
 * Mini-transporte fijo: reproducir/pausar la idea activa sin volver a la cabecera
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Pause, Play } from "lucide-react";
import { Button } from "../ui";
import { useSongStudio } from "./SongStudioContext";

/**
 * Mini-transporte fijo: reproducir/pausar la idea activa sin volver a la cabecera
 * @returns Sección de interfaz.
 */
export function SongStudioMiniTransport() {
  const { song, playingIdeaId, expandedIdeaIds, currentTimeMap, durationMap, togglePlayIdea, formatTime } = useSongStudio();
  return (
    <>
      {/* Mini-transporte fijo: reproducir/pausar la idea activa sin tener que volver a subir
     hasta la cabecera cuando estás abajo del todo viendo las últimas pistas */}
      {(() => {
        const ideas = song.audioIdeas || [];
        const activeIdea =
          ideas.find((i) => i.id === playingIdeaId) ||
          (expandedIdeaIds.size === 1 ? ideas.find((i) => expandedIdeaIds.has(i.id)) : undefined);
        if (!activeIdea) return null;
        const isPlaying = playingIdeaId === activeIdea.id;
        const curTime = currentTimeMap[activeIdea.id] || 0;
        const dur = durationMap[activeIdea.id] || 0;
        return (
          <div className=" bg-[var(--bg)]/95 px-3 sm:px-4 py-2 flex items-center gap-3">
            <Button
              variant={isPlaying ? "primary" : "primary"}
              type="button"
              onClick={() => togglePlayIdea(activeIdea)}
              className="items-center justify-center shrink-0"
              title="Play / pausa"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </Button>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[var(--ink)] truncate">{activeIdea.titulo}</p>
              <p className="text-micro font-sans text-[var(--ink-2)]">
                {formatTime(curTime)} <span className="text-[var(--ink-2)]">/</span> {formatTime(dur)}
              </p>
            </div>
          </div>
        );
      })()}
    </>
  );
}
