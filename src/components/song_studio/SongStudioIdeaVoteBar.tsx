/**
 * Barra de «Me gusta» y «Hacer maqueta principal» de una idea
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Sparkles, ThumbsUp } from "lucide-react";
import { SongAudioIdea } from "../../types";
import { resolverAudioUrlParaSubida } from "../../utils/audioParaSubida";
import { useSongStudio } from "./SongStudioContext";

/** Estado y callbacks que el contenedor inyecta a la sección. */
export interface SongStudioIdeaVoteBarProps {
  idea: SongAudioIdea;
  hasVoted: boolean;
  votes: string[];
}

/**
 * Barra de «Me gusta» y «Hacer maqueta principal» de una idea
 * @param props Estado y callbacks del contenedor ({@link SongStudioIdeaVoteBarProps}).
 * @returns Sección de interfaz.
 */
export function SongStudioIdeaVoteBar({ idea, hasVoted, votes }: SongStudioIdeaVoteBarProps) {
  const { handleToggleVote, onUpdateSong, song } = useSongStudio();
  return (
    <>
      {/* Upvote & Main Audio buttons */}
      <div className="flex items-center justify-between gap-2 pt-2">
        <button
          type="button"
          onClick={() => handleToggleVote(idea.id)}
          className={`px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-sans font-bold flex items-center gap-1.5 transition-ui cursor-pointer ${
            hasVoted
              ? 'bg-[var(--ok)]/20 text-[var(--ink)]'
              : 'bg-[var(--ink)]/5 text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--ink)]/10'
          }`}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-current' : ''}`} />
          <span>Me gusta ({votes.length})</span>
        </button>

        <button
          type="button"
          onClick={async () => {
            // resolverAudioUrlParaSubida: si esta idea es una grabación reciente
            // aún no subida (blob:/indexeddb: local del navegador), la sube antes
            // de fijarla como maqueta — si no, la canción se quedaba con una URL
            // que ni el propio servidor puede llegar a descargar.
            const audioUrlPermanente = await resolverAudioUrlParaSubida(idea.audioUrl);
            onUpdateSong({
              ...song,
              audioPrincipalUrl: audioUrlPermanente,
            });
            alert(`"${idea.titulo}" establecida como Maqueta Principal del tema.`);
          }}
          className={`px-2.5 py-1.5 rounded-[var(--r-pill)] text-micro font-sans font-bold flex items-center gap-1 transition-ui cursor-pointer ${
            song.audioPrincipalUrl === idea.audioUrl
              ? 'bg-[var(--acc)]/20 text-[var(--ink)]'
              : 'bg-[var(--ink)]/5 text-[var(--ink-2)] hover:text-[var(--acc)]/70 hover:bg-[var(--ink)]/10'
          }`}
          title="Establecer esta idea como la maqueta principal del tema"
        >
          <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]" />
          <span>{song.audioPrincipalUrl === idea.audioUrl ? 'Maqueta Principal' : 'Hacer Maqueta Principal'}</span>
        </button>
      </div>
    </>
  );
}
