/**
 * Tarjeta de una idea de audio: cabecera, transporte, mezclador, overdub, votos y comentarios
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { motion } from "motion/react";
import { SongAudioIdea } from "../../types";
import { getIdeaTracks } from "./ideaTracks";
import { useSongStudio } from "./SongStudioContext";
import { SongStudioIdeaComments } from "./SongStudioIdeaComments";
import { SongStudioIdeaHeader } from "./SongStudioIdeaHeader";
import { SongStudioIdeaMixer } from "./SongStudioIdeaMixer";
import { SongStudioIdeaTrackActions } from "./SongStudioIdeaTrackActions";
import { SongStudioIdeaTransport } from "./SongStudioIdeaTransport";
import { SongStudioIdeaVoteBar } from "./SongStudioIdeaVoteBar";
import { SongStudioOverdubDrawer } from "./SongStudioOverdubDrawer";
import { SECCIONES_TEMA } from "./studioConstants";

/** Datos propios de cada instancia (el resto sale del contexto del estudio). */
export interface SongStudioIdeaCardProps {
  opts?: { iris?: boolean; };
  idea: SongAudioIdea;
}

/**
 * Tarjeta de una idea de audio: cabecera, transporte, mezclador, overdub, votos y comentarios
 * @returns Sección de interfaz.
 */
export function SongStudioIdeaCard({ opts, idea }: SongStudioIdeaCardProps) {
  const { playingIdeaId, currentTimeMap, durationMap, currentUsername, addingTrackIdeaId, expandedIdeaIds,} = useSongStudio();
  const modoIris = !!opts?.iris;
  const isPlaying = playingIdeaId === idea.id;
  const currentTime = currentTimeMap[idea.id] || 0;
  const rawDuration = durationMap[idea.id];
  const duration = rawDuration && !isNaN(rawDuration) && isFinite(rawDuration) && rawDuration > 0 ? rawDuration : 0;
  const sectionInfo = SECCIONES_TEMA.find((s) => s.key === idea.seccion) || SECCIONES_TEMA[0];
  const votes = idea.votos || [];
  const hasVoted = votes.includes(currentUsername);
  const tracks = getIdeaTracks(idea);
  const isAddingTrack = addingTrackIdeaId === idea.id;
  const isIdeaExpanded = modoIris || expandedIdeaIds.has(idea.id);

  return (
    <motion.div
      key={idea.id}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      className={`p-4 sm:p-5 rounded-[var(--r-l)] transition-ui space-y-4 ${
        isPlaying
          ? 'bg-[var(--tentative)]/5 ring-1 ring-[var(--acc)]/30'
          : 'bg-[var(--ink)]/5 '
      } hover:brightness-95`}
    >
      <SongStudioIdeaHeader modoIris={modoIris} idea={idea} isIdeaExpanded={isIdeaExpanded} sectionInfo={sectionInfo} tracks={tracks} isPlaying={isPlaying} />

      {isIdeaExpanded && (
        <>
          {!modoIris && idea.notas && (
            <p className="text-xs text-[var(--ink-2)] italic bg-[var(--sunken)] p-2.5 rounded-[var(--r-m)]">
              "{idea.notas}"
            </p>
          )}

          <SongStudioIdeaTrackActions modoIris={modoIris} idea={idea} tracks={tracks} />

          <SongStudioIdeaTransport isPlaying={isPlaying} idea={idea} modoIris={modoIris} tracks={tracks} currentTime={currentTime} duration={duration} />

          <SongStudioIdeaMixer idea={idea} tracks={tracks} duration={duration} currentTime={currentTime} />

          <SongStudioOverdubDrawer isAddingTrack={isAddingTrack} idea={idea} />

          <SongStudioIdeaVoteBar idea={idea} hasVoted={hasVoted} votes={votes} />

          <SongStudioIdeaComments idea={idea} currentTime={currentTime} />
        </>
      )}
    </motion.div>
  );

}
