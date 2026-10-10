/**
 * Barra de práctica del modo ensayo para el tema actual.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Headphones,Sliders,Sparkles } from "lucide-react";
import { getIdeaTracks } from "../../utils/irisTracks";
import { Button } from "../ui";
import { useSetlistPerformance } from "./SetlistPerformanceContext";

/**
 * Barra de práctica del modo ensayo para el tema actual.
 * @returns Sección de interfaz.
 */
export function PerformanceRehearsalBar() {
  const { modeArchetype, isBlock, currentSong, glareMode, irisStemIdea, handleLaunchPractice, handleLaunchStudio } = useSetlistPerformance();
  return (
    <>
      {modeArchetype === "ensayo" && !isBlock && currentSong && (
  <div
    className={`shrink-0 px-3 sm:px-4 py-2 flex items-center justify-between gap-3 text-xs z-20 ${
      glareMode
      ? "bg-[var(--ok)]/10 text-[var(--ok)]"
      : "bg-[var(--ok-soft)]/40 text-[var(--ink)]"
    }`}
  >
    <div className="flex items-center gap-2 min-w-0">
      <div
      className={`w-7 h-7 rounded-[var(--r-s)] flex items-center justify-center shrink-0 ${
        glareMode
          ? "bg-[var(--ok)]/30 text-[var(--ink)]"
          : "bg-[var(--ok)]/20 text-[var(--ink)]"
      }`}
      >
      <Headphones className="w-4 h-4" />
      </div>
      <div className="truncate">
      <span className="font-bold text-[var(--ok)]">
        Modo ensayo activo
      </span>
      <span className="opacity-80 ml-2 font-sans text-xs">
        {currentSong.tonalidad ? `Tono: ${currentSong.tonalidad}` : ""}
        {currentSong.bpm ? ` · ${currentSong.bpm} BPM` : ""}
        {irisStemIdea
          ? ` · ${getIdeaTracks(irisStemIdea).length} pistas Iris`
          : " · Sin pistas separadas"}
      </span>
      </div>
    </div>
    <div className="flex items-center gap-1.5 shrink-0">
      {irisStemIdea ? (
      <Button
        variant="primary"
        size="xs"
        type="button"
        onClick={() => handleLaunchPractice()}
        className="items-center gap-1"
      >
        <Headphones className="w-3.5 h-3.5" />
        <span>Abrir sala de ensayo</span>
      </Button>
      ) : (
      <button
        type="button"
        onClick={() => handleLaunchStudio()}
        className="px-2.5 py-1 rounded-[var(--r-pill)] bg-[var(--tentative)] hover:bg-[var(--tentative)] text-[var(--on-tentative)] font-bold text-xs flex items-center gap-1 transition active:scale-[0.97] cursor-pointer"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Separar en Studio</span>
      </button>
      )}
      <Button
      variant="neutral"
      size="xs"
      type="button"
      onClick={() => handleLaunchStudio()}
      className="items-center gap-1700"
      >
      <Sliders className="w-3.5 h-3.5 text-[var(--tentative)]" />
      <span>Studio</span>
      </Button>
    </div>
  </div>
      )}
    </>
  );
}
