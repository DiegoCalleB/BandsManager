/**
 * Fila editable de un corte: tipo, tiempos, reproductor de fragmento, letra/acordes y acciones.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { useLiveConcertAlbum } from "./LiveConcertAlbumContext";
import { TrackChordsPanel } from "./TrackChordsPanel";
import { TrackHeaderRow } from "./TrackHeaderRow";
import { TrackSnippetPlayer } from "./TrackSnippetPlayer";
import { TrackSpeechPanel } from "./TrackSpeechPanel";
import { TrackTitleRow } from "./TrackTitleRow";
import { TrackCutItem } from "./types";

/** Datos propios de cada instancia (el resto sale del contexto del flujo). */
export interface TrackRowProps {
  track: TrackCutItem;
  idx: number;
}

/**
 * Fila editable de un corte: tipo, tiempos, reproductor de fragmento, letra/acordes y acciones.
 * @returns Sección de interfaz.
 */
export function TrackRow({ track, idx }: TrackRowProps) {
  const { selectedIndices, loadingSnippetIndex, playingTrackUrl,} = useLiveConcertAlbum();
  const isSelected = selectedIndices.includes(track.index);
  const isLoadingPreview =
    loadingSnippetIndex === track.index;
  const isPlayingThis =
    playingTrackUrl === track.audioUrl && !!track.audioUrl;

  return (
    <div
      key={track.index}
      className={`p-3.5 rounded-[var(--r-m)] transition-ui space-y-2 ${
        isSelected
          ? "bg-[var(--acc)]/15 ring-1 ring-[var(--acc)]/50"
          : track.type === "musica"
            ? "bg-[var(--acc-soft)]  "
            : "bg-[var(--tentative)]/5 "
      }`}
    >
      <TrackHeaderRow track={track} isSelected={isSelected} isLoadingPreview={isLoadingPreview} isPlayingThis={isPlayingThis} idx={idx} />

      <TrackTitleRow track={track} />

      <TrackChordsPanel track={track} />

      <TrackSpeechPanel track={track} />

      <TrackSnippetPlayer track={track} />
    </div>
  );

}
