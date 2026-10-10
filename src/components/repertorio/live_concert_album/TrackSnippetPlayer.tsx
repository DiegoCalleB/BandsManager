/**
 * Reproductor de fragmento del corte activo: barra de progreso, saltos, velocidad y ajuste de inicio/fin.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Pause, Play, RotateCcw, RotateCw, Scissors, Target, Volume2, X } from "lucide-react";
import { Button, IconButton } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { useLiveConcertAlbum } from "./LiveConcertAlbumContext";
import { formatSeconds } from "./timeFormat";
import { TrackCutItem } from "./types";

/** Datos propios de cada instancia (el resto sale del contexto del flujo). */
export interface TrackSnippetPlayerProps {
  track: TrackCutItem;
}

/**
 * Reproductor de fragmento del corte activo: barra de progreso, saltos, velocidad y ajuste de inicio/fin.
 * @returns Sección de interfaz.
 */
export function TrackSnippetPlayer({ track }: TrackSnippetPlayerProps) {
  const { activeSnippet, tracks, snippetAudioRef, setSnippetCurrentTime, handleSetStartFromCurrentSnippet, snippetCurrentTime, handleSetEndFromCurrentSnippet, handleSplitTrack, setActiveSnippet, getYouTubeVideoId, youtubeUrl, analyzedSourcePath, setSnippetDuration, setSnippetIsPlaying, snippetDuration, handleSeekSnippet, handleSkipSnippet, snippetIsPlaying, handleChangeSnippetSpeed, snippetSpeed } = useLiveConcertAlbum();
  return (
    <>
      {/* Interactive Audio Fragment Scrubber Player - Positioned directly underneath the active track */}
      {activeSnippet &&
        activeSnippet.trackIndex === track.index && (
          <div className="mt-3 p-3.5 bg-[var(--surface)]  rounded-[var(--r-m)] space-y-3 animate-fade-in ring-2 ring-[var(--acc)]/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[var(--r-s)] bg-[var(--acc)]/20 flex items-center justify-center text-[var(--ink)] shrink-0">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[var(--acc)] block">
                    Reproductor de Tramo: #
                    {activeSnippet.trackIndex}"{track.title}"
                  </span>
                  <span className="text-micro text-[var(--ink-2)] font-sans">
                    Línea de tiempo:{" "}
                    {formatSeconds(activeSnippet.start)} ➔{" "}
                    {formatSeconds(activeSnippet.end)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {/* Jump to detected CUE In if available */}
                {(() => {
                  const currentTrack = tracks.find(
                    (t) =>
                      t.index === activeSnippet.trackIndex,
                  );
                  if (
                    currentTrack?.cueIn &&
                    currentTrack.cueIn > 0.1
                  ) {
                    return (
                      <button
                        onClick={() => {
                          if (
                            snippetAudioRef.current &&
                            currentTrack.cueIn
                          ) {
                            snippetAudioRef.current.currentTime =
                              currentTrack.cueIn;
                            setSnippetCurrentTime(
                              currentTrack.cueIn,
                            );
                          }
                        }}
                        className="px-2.5 py-1 text-micro font-bold rounded bg-[var(--acc)]/20 text-[var(--ink)] hover:bg-[var(--acc)]/40 transition-ui flex items-center gap-1 cursor-pointer"
                        title="Saltar al CUE In de entrada musical detectado"
                      >
                        <Target className="w-3 h-3 text-[var(--ink-2)]" />
                        <span>
                          <ShowIcon inline emoji="🎯" />Ir a CUE (+
                          {currentTrack.cueIn.toFixed(1)}s)
                        </span>
                      </button>
                    );
                  }
                  return null;
                })()}

                {/* Set start/end markers from current position */}
                <button
                  onClick={() =>
                    handleSetStartFromCurrentSnippet(
                      activeSnippet.trackIndex,
                    )
                  }
                  className="px-2.5 py-1 text-micro font-bold rounded bg-[var(--acc)]/20 text-[var(--ink)] hover:bg-[var(--acc)]/40 transition-ui flex items-center gap-1"
                  title="Fijar el punto de inicio de este corte en el segundo actual de reproducción"
                >
                  <ShowIcon inline emoji="📍" />Ajustar Inicio (
                  {formatSeconds(
                    activeSnippet.start + snippetCurrentTime,
                  )}
                  )
                </button>

                <button
                  onClick={() =>
                    handleSetEndFromCurrentSnippet(
                      activeSnippet.trackIndex,
                    )
                  }
                  className="px-2.5 py-1 text-micro font-bold rounded bg-[var(--tentative)]/20 text-[var(--tentative)] hover:bg-[var(--tentative)]/40 transition-ui flex items-center gap-1"
                  title="Fijar el punto final de este corte en el segundo actual de reproducción"
                >
                  <ShowIcon inline emoji="📍" />Ajustar Fin (
                  {formatSeconds(
                    activeSnippet.start + snippetCurrentTime,
                  )}
                  )
                </button>

                <button
                  onClick={() => {
                    const currentAbs = Math.max(
                      0,
                      Math.round(
                        (activeSnippet.start +
                          snippetCurrentTime) *
                          10,
                      ) / 10,
                    );
                    handleSplitTrack(
                      activeSnippet.trackIndex,
                      currentAbs,
                    );
                  }}
                  className="px-2.5 py-1 text-micro font-bold rounded bg-[var(--alert)]/20 text-[var(--ink)] hover:bg-[var(--alert)]/40 transition-ui flex items-center gap-1"
                  title="Dividir este tramo en 2 partes exactamente en el segundo actual de reproducción"
                >
                  <Scissors className="w-3 h-3 text-[var(--alert)]" />
                  <span>
                    <ShowIcon inline emoji="✂️" />Dividir en 2 Aquí (
                    {formatSeconds(
                      activeSnippet.start +
                        snippetCurrentTime,
                    )}
                    )
                  </span>
                </button>

                <IconButton
                  label="Cerrar reproductor"
                  size="icon-xs"
                  onClick={() => setActiveSnippet(null)}
                >
                  <X className="w-4 h-4" />
                </IconButton>
              </div>
            </div>

            {/* Media Controller: YouTube Synced Embed OR HTML5 Audio Element */}
            {getYouTubeVideoId(youtubeUrl) &&
            !analyzedSourcePath &&
            !activeSnippet.audioUrl ? (
              <div className="space-y-2">
                <div className="relative rounded-[var(--r-s)] overflow-hidden bg-[var(--sunken)] aspect-video max-h-56 mx-auto">
                  <iframe
                    key={`yt-embed-${activeSnippet.trackIndex}-${Math.floor(activeSnippet.start)}`}
                    src={`https://www.youtube-nocookie.com/embed/${getYouTubeVideoId(youtubeUrl)}?start=${Math.floor(activeSnippet.start)}&end=${Math.ceil(activeSnippet.end)}&autoplay=1&enablejsapi=1&rel=0`}
                    title={track.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--acc-ink)] font-sans bg-[var(--surface)]/80 px-3 py-1.5 rounded-[var(--r-s)]">
                  <span>
                    <ShowIcon inline emoji="▶️" />Reproduciendo muestra sincronizada:{" "}
                    {formatSeconds(activeSnippet.start)} a{" "}
                    {formatSeconds(activeSnippet.end)}
                  </span>
                  <span className="text-[var(--ink-2)]">
                    Duración:{" "}
                    {formatSeconds(
                      activeSnippet.end - activeSnippet.start,
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <>
                {/* Audio element controller */}
                {activeSnippet.audioUrl && (
                  <audio
                    ref={snippetAudioRef}
                    src={activeSnippet.audioUrl}
                    autoPlay
                    onError={(e) => e.preventDefault()}
                    onTimeUpdate={(e) =>
                      setSnippetCurrentTime(
                        e.currentTarget.currentTime,
                      )
                    }
                    onLoadedMetadata={(e) =>
                      setSnippetDuration(
                        e.currentTarget.duration,
                      )
                    }
                    onPlay={() => setSnippetIsPlaying(true)}
                    onPause={() => setSnippetIsPlaying(false)}
                    onEnded={() => setSnippetIsPlaying(false)}
                  />
                )}

                {/* Range Slider Scrubber */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-sans font-bold text-[var(--acc)]/70">
                    <span>
                      {formatSeconds(snippetCurrentTime)}
                    </span>
                    <span className="text-micro text-[var(--ink-2)] font-sans">
                      Desplaza la barra para navegar por el
                      tramo
                    </span>
                    <span>
                      {formatSeconds(snippetDuration)}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={snippetDuration || 100}
                    step={0.1}
                    value={snippetCurrentTime}
                    onChange={(e) =>
                      handleSeekSnippet(
                        parseFloat(e.target.value),
                      )
                    }
                    className="w-full h-2.5 bg-[var(--sunken)] rounded-[var(--r-s)] appearance-none cursor-pointer accent-[var(--acc)] hover:accent-[var(--acc)] transition-ui"
                  />
                </div>

                {/* Player Controls Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSkipSnippet(-5)}
                      className="px-2.5 py-1 rounded bg-[var(--sunken)] hover:bg-[var(--surface)] text-[var(--ink-2)] text-xs font-bold flex items-center gap-1"
                      title="Retroceder 5 segundos"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />{" "}
                      -5s
                    </button>

                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => {
                        if (snippetAudioRef.current) {
                          if (snippetIsPlaying)
                            snippetAudioRef.current.pause();
                          else snippetAudioRef.current.play();
                        }
                      }}
                      className="items-center gap-1.5/10/20"
                    >
                      {snippetIsPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      {snippetIsPlaying
                        ? "Pausar"
                        : "Reproducir"}
                    </Button>

                    <button
                      onClick={() => handleSkipSnippet(5)}
                      className="px-2.5 py-1 rounded bg-[var(--sunken)] hover:bg-[var(--surface)] text-[var(--ink-2)] text-xs font-bold flex items-center gap-1"
                      title="Adelantar 5 segundos"
                    >
                      <RotateCw className="w-3.5 h-3.5" /> +5s
                    </button>
                  </div>

                  {/* Playback speed selector */}
                  <div className="flex items-center gap-1 bg-[var(--sunken)] p-1 rounded-[var(--r-s)] text-xs font-sans">
                    <span className="text-[var(--ink-2)] font-sans px-1 text-micro">
                      Velocidad:
                    </span>
                    {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                      <button
                        key={spd}
                        onClick={() =>
                          handleChangeSnippetSpeed(spd)
                        }
                        className={`px-1.5 py-0.5 rounded font-bold ${
                          snippetSpeed === spd
                            ? "bg-[var(--ink)] text-[var(--bg)]"
                            : "text-[var(--ink-2)] hover:text-[var(--ink)]"
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
    </>
  );
}
