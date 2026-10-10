/**
 * Panel de práctica con stems Iris abierto desde el propio visor.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { getIdeaTracks } from "../../utils/irisTracks";
import PracticeModePanel from "../PracticeModePanel";
import { useSetlistPerformance } from "./SetlistPerformanceContext";

/**
 * Panel de práctica con stems Iris abierto desde el propio visor.
 * @returns Sección de interfaz.
 */
export function PerformancePracticePanel() {
  const { internalPracticeIdea, internalPracticeSong, currentSong, currentUser, glareMode, setInternalPracticeIdea, setInternalPracticeSong, handleLaunchStudio, onUpdateSong } = useSetlistPerformance();
  return (
    <>
      {internalPracticeIdea && (internalPracticeSong || currentSong) && (
  <PracticeModePanel
    song={internalPracticeSong || currentSong!}
    idea={internalPracticeIdea}
    tracks={getIdeaTracks(internalPracticeIdea)}
    currentUser={currentUser}
    glareMode={glareMode}
    onClose={() => {
      setInternalPracticeIdea(null);
      setInternalPracticeSong(null);
    }}
    onOpenStudio={() => {
      const s = internalPracticeSong || currentSong;
      setInternalPracticeIdea(null);
      setInternalPracticeSong(null);
      if (s) handleLaunchStudio(s);
    }}
    onApplyAsMainChords={(cifradoTexto, guiaSustituto) => {
      const s = internalPracticeSong || currentSong;
      if (s) {
      onUpdateSong?.({ ...s, cifradoTexto, guiaSustituto });
      }
    }}
  />
      )}
    </>
  );
}
