/**
 * Fila superior del corte: selección, tipo, tiempos, CUEs y acciones.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ArrowDown, ArrowUp, CheckSquare, Combine, Pause, Play, RefreshCw, Scissors, Square, Target, Trash2 } from "lucide-react";
import { IconButton, Input, Select } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { useLiveConcertAlbum } from "./LiveConcertAlbumContext";
import { formatSeconds, parseTimeToSeconds } from "./timeFormat";
import { TrackCutItem } from "./types";

/** Datos propios de cada instancia (el resto sale del contexto del flujo). */
export interface TrackHeaderRowProps {
  track: TrackCutItem;
  isSelected: boolean;
  isLoadingPreview: boolean;
  isPlayingThis: boolean;
  idx: number;
}

/**
 * Fila superior del corte: selección, tipo, tiempos, CUEs y acciones.
 * @returns Sección de interfaz.
 */
export function TrackHeaderRow({ track, isSelected, isLoadingPreview, isPlayingThis, idx }: TrackHeaderRowProps) {
  const { handleToggleSelectTrack, handleUpdateTrack, handlePlaySnippetPreview, handleSnapTrackStartToCue, handleSplitTrack, tracks, handleMergeWithNext, handleMoveTrack, handleDeleteTrack } = useLiveConcertAlbum();
  return (
    <>
      {/* Top Row: Track Controls, Type, Timestamps, and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 ">
        {/* Checkbox, Index & Type Switcher */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              handleToggleSelectTrack(track.index)
            }
            className="text-[var(--ink-2)] hover:text-[var(--acc)] p-0.5 transition-colors"
            title="Seleccionar para fusionar varias pistas"
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-[var(--acc)]" />
            ) : (
              <Square className="w-4 h-4 text-[var(--ink-2)]" />
            )}
          </button>

          <span className="w-7 text-center font-sans font-bold text-xs text-[var(--ink-2)] bg-[var(--surface)]/90 px-1.5 py-0.5 rounded">
            #{String(track.index).padStart(2, "0")}
          </span>

          <Select
            size="sm"
            value={track.type}
            onChange={(e) => {
              const newType = e.target.value as
                | "musica"
                | "dialogo";
              handleUpdateTrack(track.index, "type", newType);
              if (
                newType === "dialogo" &&
                (track.title.startsWith("Tema ") ||
                  track.title.startsWith("Pista "))
              ) {
                handleUpdateTrack(
                  track.index,
                  "title",
                  `Presentación / Speech ${track.index}`,
                );
              } else if (
                newType === "musica" &&
                (track.title.startsWith("Presentación") ||
                  track.title.startsWith("Speech"))
              ) {
                handleUpdateTrack(
                  track.index,
                  "title",
                  `Tema ${track.index}`,
                );
              }
            }}
            title="Haz clic para alternar entre canción y speech/Presentación"
          >
            <option value="musica">
              Canción completa
            </option>
            <option value="dialogo">
              Speech / presentación
            </option>
          </Select>
        </div>

        {/* Timestamps & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timestamps */}
          <div className="flex items-center gap-1.5 text-xs font-sans bg-[var(--surface)]/80 px-2 py-1 rounded-[var(--r-s)]">
            <span className="text-[var(--ink-2)] text-xs">
              Inicio:
            </span>
            <Input
              size="sm"
              type="text"
              value={formatSeconds(track.start)}
              onChange={(e) =>
                handleUpdateTrack(
                  track.index,
                  "start",
                  parseTimeToSeconds(e.target.value),
                )
              }
              className="w-14 text-center"
              title="Tiempo de inicio (MM:SS)"
            />
            <span className="text-[var(--ink-2)] text-xs">
              Fin:
            </span>
            <Input
              size="sm"
              type="text"
              value={formatSeconds(track.end)}
              onChange={(e) =>
                handleUpdateTrack(
                  track.index,
                  "end",
                  parseTimeToSeconds(e.target.value),
                )
              }
              className="w-14 text-center"
              title="Tiempo de fin (MM:SS)"
            />
            <span className="text-[var(--ink-2)] font-bold text-xs">
              ({formatSeconds(track.duration)})
            </span>
          </div>

          {/* CUE In detected badge & snap buttons */}
          {typeof track.cueIn === "number" &&
            track.cueIn > 0.1 && (
              <div className="flex items-center gap-1.5 bg-[var(--bg)]/70 text-[var(--tentative)] px-2.5 py-1 rounded-[var(--r-s)] text-xs font-sans">
                <Target className="w-3.5 h-3.5 text-[var(--ink-2)] shrink-0" />
                <span className="text-xs">
                  CUE:{" "}
                  <strong>+{track.cueIn.toFixed(1)}s</strong>
                </span>
                <button
                  onClick={() =>
                    handlePlaySnippetPreview(track, true)
                  }
                  className="px-1.5 py-0.5 bg-[var(--acc)] hover:bg-[var(--acc)] text-[var(--on-acc)] rounded font-sans text-micro font-bold flex items-center gap-1 transition-ui cursor-pointer"
                  title="Reproducir desde el punto CUE de entrada musical"
                >
                  <Play className="w-2.5 h-2.5" /> Desde CUE
                </button>
                <button
                  onClick={() =>
                    handleSnapTrackStartToCue(track.index)
                  }
                  className="px-1.5 py-0.5 bg-[var(--acc)]/20 hover:bg-[var(--acc)] text-[var(--ink)] hover:text-[var(--ink)] rounded font-sans text-micro font-bold transition-ui cursor-pointer"
                  title="Ajustar tiempo de inicio para que arranque exactamente en este CUE musical"
                >
                  <ShowIcon inline emoji="⚡" />Ajustar inicio
                </button>
              </div>
            )}

          {track.hasApplauseIntro && (
            <span
              className="text-micro px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--surface)] text-[var(--ink-2)] flex items-center gap-1"
              title="Se detectó charla o aplauso antes de la entrada musical"
            >
              <ShowIcon inline emoji="👏" />Charla previa
            </span>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Play snippet preview button */}
            <button
              onClick={() => handlePlaySnippetPreview(track)}
              disabled={isLoadingPreview}
              className={`px-2.5 py-1 rounded-[var(--r-pill)] text-xs font-bold flex items-center gap-1 transition-ui ${
                isPlayingThis
                  ? "bg-[var(--ink)] text-[var(--bg)]"
                  : "bg-[var(--surface)] hover:bg-[var(--acc)] hover:text-[var(--ink)] text-[var(--ink-2)]"
              }`}
              title="Reproducir este trozo para escucharlo y clasificarlo"
            >
              {isLoadingPreview ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">
                    Generando…
                  </span>
                </>
              ) : isPlayingThis ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    Pausar
                  </span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    Escuchar
                  </span>
                </>
              )}
            </button>

            {/* Split track in two button */}
            <button
              onClick={() => handleSplitTrack(track.index)}
              className="p-1.5 rounded-[var(--r-pill)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--alert)] flex items-center gap-1 text-xs font-bold"
              title="Dividir este tramo en 2 partes"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-micro">
                Dividir
              </span>
            </button>

            {/* Merge with next button */}
            {idx < tracks.length - 1 && (
              <button
                onClick={() =>
                  handleMergeWithNext(track.index)
                }
                className="p-1.5 rounded-[var(--r-pill)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--acc)]"
                title={`Fusionar con el siguiente (#${track.index + 1})`}
              >
                <Combine className="w-3.5 h-3.5" />
              </button>
            )}

            <IconButton
              label="Mover arriba"
              size="icon-xs"
              onClick={() =>
                handleMoveTrack(track.index, "up")
              }
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </IconButton>
            <IconButton
              label="Mover abajo"
              size="icon-xs"
              onClick={() =>
                handleMoveTrack(track.index, "down")
              }
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </IconButton>
            <IconButton
              label="Eliminar corte"
              variant="danger"
              size="icon-xs"
              onClick={() => handleDeleteTrack(track.index)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </IconButton>
          </div>
        </div>
      </div>
    </>
  );
}
