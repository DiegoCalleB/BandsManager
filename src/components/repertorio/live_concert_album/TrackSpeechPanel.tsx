/**
 * Transcripción editable del discurso o presentación de un corte de tipo diálogo.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Sparkles } from "lucide-react";
import { Textarea } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { useLiveConcertAlbum } from "./LiveConcertAlbumContext";
import { TrackCutItem } from "./types";

/** Datos propios de cada instancia (el resto sale del contexto del flujo). */
export interface TrackSpeechPanelProps {
  track: TrackCutItem;
}

/**
 * Transcripción editable del discurso o presentación de un corte de tipo diálogo.
 * @returns Sección de interfaz.
 */
export function TrackSpeechPanel({ track }: TrackSpeechPanelProps) {
  const { handleTranscribeSpeech, transcribingIndex, handleUpdateTrack } = useLiveConcertAlbum();
  return (
    <>
      {/* Speech Transcription row */}
      {track.type === "dialogo" && (
        <div className="pl-9 pt-2 space-y-1.5/20 mt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-xs font-bold text-[var(--tentative)]/80 flex items-center gap-1.5">
              <ShowIcon inline emoji="🗣️" />Transcripción del Speech / Intro:
            </span>
            <button
              onClick={() => handleTranscribeSpeech(track)}
              disabled={transcribingIndex === track.index}
              className="px-2.5 py-0.5 text-micro font-bold rounded bg-[var(--tentative)] text-[var(--on-tentative)] hover:bg-[var(--tentative)]/80 flex items-center gap-1 transition-ui"
            >
              <Sparkles className="w-3 h-3 text-[var(--tentative)]" />
              {transcribingIndex === track.index
                ? "Transcribiendo..."
                : "Re-Transcribir Speech"}
            </button>
          </div>
          <Textarea
            value={track.speechTranscription || ""}
            onChange={(e) =>
              handleUpdateTrack(
                track.index,
                "speechTranscription",
                e.target.value,
              )
            }
            placeholder="[Intro musical / Palabras del artista al público]…"
            rows={2}
            className="w-full"
          />
        </div>
      )}
    </>
  );
}
