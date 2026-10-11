/**
 * Letra y acordes de un corte musical: transcripción IA, vista previa plegada y editor.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Check, ChevronDown, ChevronUp, Music2, Sparkles } from "lucide-react";
import { Button, Input, Textarea } from "../../ui";
import { useLiveConcertAlbum } from "./LiveConcertAlbumContext";
import { TrackCutItem } from "./types";

/** Datos propios de cada instancia (el resto sale del contexto del flujo). */
export interface TrackChordsPanelProps {
  track: TrackCutItem;
}

/**
 * Letra y acordes de un corte musical: transcripción IA, vista previa plegada y editor.
 * @returns Sección de interfaz.
 */
export function TrackChordsPanel({ track }: TrackChordsPanelProps) {
  const { handleUpdateTrack, handleTranscribeSongChordsAndLyrics, transcribingChordsIndex, setExpandedChordsIndex, expandedChordsIndex, expandAllChords } = useLiveConcertAlbum();
  return (
    <>
      {/* Song Chords & Lyrics Control Row */}
      {track.type === "musica" && (
        <div className="pl-9 pt-1.5 space-y-2  mt-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[var(--ink-2)] font-semibold text-xs">
                Ton:
              </span>
              <Input
                size="sm"
                type="text"
                value={track.tonalidad || "Mim"}
                onChange={(e) =>
                  handleUpdateTrack(
                    track.index,
                    "tonalidad",
                    e.target.value,
                  )
                }
                className="w-14 text-center"
                placeholder="Mim"
              />
              <span className="text-[var(--ink-2)] font-semibold text-xs">
                BPM:
              </span>
              <Input
                size="sm"
                type="number"
                value={track.bpm || 120}
                onChange={(e) =>
                  handleUpdateTrack(
                    track.index,
                    "bpm",
                    parseInt(e.target.value) || 120,
                  )
                }
                className="w-14 text-center"
                placeholder="120"
              />
              {track.lyricsWithChords ? (
                <span className="px-2 py-0.5 text-micro font-bold rounded-[var(--r-pill)] bg-[var(--ok)]/20 text-[var(--ink)] flex items-center gap-1">
                  <Check className="w-3 h-3" /> Cifrado &
                  letra listos
                </span>
              ) : (
                <span className="px-2 py-0.5 text-micro font-semibold rounded-[var(--r-pill)] bg-[var(--surface)] text-[var(--ink-2)]">
                  Sin cifrado aún
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="neutral"
                size="xs"
                onClick={() =>
                  handleTranscribeSongChordsAndLyrics(track)
                }
                disabled={
                  transcribingChordsIndex === track.index
                }
                className="items-center gap-1.5"
                title="Generar o actualizar automáticamente letra transcrita con cifrado de acordes con Gemini AI"
              >
                <Sparkles
                  className={`w-3 h-3 text-[var(--acc)] ${transcribingChordsIndex === track.index ? "animate-spin" : ""}`}
                />
                {transcribingChordsIndex === track.index
                  ? "Transcribiendo..."
                  : "Re-Transcribir Letra y Acordes"}
              </Button>

              <button
                onClick={() =>
                  setExpandedChordsIndex(
                    expandedChordsIndex === track.index
                      ? null
                      : track.index,
                  )
                }
                className="px-2.5 py-1 text-xs font-bold rounded-[var(--r-pill)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] flex items-center gap-1"
              >
                <Music2 className="w-3 h-3 text-[var(--acc)]" />
                {expandedChordsIndex === track.index ||
                expandAllChords
                  ? "Ocultar Cifrado"
                  : "Ver/Editar Cifrado"}
                {expandedChordsIndex === track.index ||
                expandAllChords ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>

          {/* Collapsed Preview snippet of chords/lyrics if populated */}
          {!expandAllChords &&
            expandedChordsIndex !== track.index &&
            track.lyricsWithChords && (
              <div
                onClick={() =>
                  setExpandedChordsIndex(track.index)
                }
                className="p-2.5 bg-[var(--surface)]/90 rounded-[var(--r-m)] font-sans text-xs text-[var(--ink)]/90 cursor-pointer  transition-ui flex items-center justify-between gap-2"
              >
                <div className="truncate italic flex items-center gap-2">
                  <Music2 className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
                  <span className="font-bold text-[var(--acc)]/70 not-italic">
                    Cifrado:
                  </span>
                  <span className="truncate">
                    "
                    {track.lyricsWithChords
                      .split("\n")
                      .filter(Boolean)
                      .slice(0, 2)
                      .join(" / ")}
                    "
                  </span>
                </div>
                <span className="text-micro bg-[var(--acc)]/20 text-[var(--ink)] px-2 py-0.5 rounded-[var(--r-s)] font-sans font-bold shrink-0 flex items-center gap-1">
                  Ver completo ➔
                </span>
              </div>
            )}

          {/* Expanded Chord Sheet Textarea Editor */}
          {(expandAllChords ||
            expandedChordsIndex === track.index) && (
            <div className="p-3 bg-[var(--surface)] rounded-[var(--r-m)] space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--ink-2)]">
                <span className="flex items-center gap-1.5 text-[var(--acc)]">
                  <Music2 className="w-3.5 h-3.5" /> Editor de
                  Cifrado y Letra (Formato LaCuerda / Ultimate
                  Guitar)
                </span>
                <span className="text-micro text-[var(--ink-2)]">
                  Usa [Acorde] antes de la palabra o líneas
                  superiores de acordes
                </span>
              </div>
              <Textarea
                value={track.lyricsWithChords || ""}
                onChange={(e) =>
                  handleUpdateTrack(
                    track.index,
                    "lyricsWithChords",
                    e.target.value,
                  )
                }
                placeholder="[Intro]&#10;[Mim] [Do] [Sol] [Re]&#10;&#10;[Verso 1]&#10;[Mim]En la noche del concierto [Do]cantamos juntos…"
                rows={8}
                className="w-full"
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
