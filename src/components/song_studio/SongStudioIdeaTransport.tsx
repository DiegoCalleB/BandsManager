/**
 * Transporte maestro de una idea: reproducir, parar, bucle, cue y línea de tiempo
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Disc, Pause, Play, Repeat, Square } from "lucide-react";
import { AudioTrack, SongAudioIdea } from "../../types";
import { Button, IconButton } from "../ui";
import { useSongStudio } from "./SongStudioContext";

/** Datos propios de cada instancia (el resto sale del contexto del estudio). */
export interface SongStudioIdeaTransportProps {
  isPlaying: boolean;
  idea: SongAudioIdea;
  modoIris: boolean;
  tracks: AudioTrack[];
  currentTime: number;
  duration: number;
}

/**
 * Transporte maestro de una idea: reproducir, parar, bucle, cue y línea de tiempo
 * @returns Sección de interfaz.
 */
export function SongStudioIdeaTransport({ isPlaying, idea, modoIris, tracks, currentTime, duration }: SongStudioIdeaTransportProps) {
  const { togglePlayIdea, handleStopIdea, loopConfigMap, toggleIdeaLoop, selectedSongBaseUrl, saveNewTrackToIdea, song, formatTime, handleSeekIdea } = useSongStudio();
  return (
    <>
      {/* MASTER MULTITRACK CONTROLS & TIMELINE */}
      <div className="p-2.5 sm:p-3.5 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-2 sm:space-y-3">
        {/* Streamlined Transport Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
          {/* Playback Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Play / Pause Toggle */}
            <Button
              variant={isPlaying ? "primary" : "primary"}
              size="sm"
              type="button"
              onClick={() => togglePlayIdea(idea)}
              className="items-center gap-2"
              title="Play / pausa (Espacio)"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'Pausa' : 'Reproducir'}</span>
            </Button>

            {/* Stop / Rewind to 0:00 */}
            <IconButton
              label="Detener e ir al inicio (Atajo: 0 / Home)"
              type="button"
              onClick={() => handleStopIdea(idea)}
            >
              <Square className="w-4 h-4 fill-current text-[var(--alert)]" />
            </IconButton>

            {/* Loop Toggle */}
            {(() => {
              const loopCfg = loopConfigMap[idea.id];
              const isLoopEnabled = !!loopCfg?.enabled;
              return (
                <button
                  type="button"
                  onClick={() => toggleIdeaLoop(idea)}
                  className={`px-2.5 py-1.5 rounded-[var(--r-pill)] font-sans text-xs font-bold flex items-center gap-1.5 transition-ui cursor-pointer ${
                    isLoopEnabled
                      ? 'bg-[var(--tentative)] text-[var(--on-tentative)] ring-1 ring-[var(--acc)]/50'
                      : 'bg-[var(--ink)]/5 hover:bg-[var(--ink)]/10 text-[var(--ink-2)]'
                  }`}
                  title="Bucle ON/OFF (Atajo: L)"
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span>{isLoopEnabled ? 'Bucle ON' : 'Bucle'}</span>
                </button>
              );
            })()}
          </div>

          {/* Extra Tools & Stems Actions:"+ Base Rítmica IA" vive en el menú ⋮ de la
     idea (es una acción ocasional, no algo que hace falta tener siempre a mano) */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {!modoIris && selectedSongBaseUrl && !tracks.some((t) => t.audioUrl === selectedSongBaseUrl) && (
              <Button
                variant="neutral"
                size="xs"
                type="button"
                onClick={() => {
                  saveNewTrackToIdea(idea, selectedSongBaseUrl, `🎵 Base: ${song.titulo} (Original)`, 'Tema Base');
                }}
                className="items-center gap-1.5"
                title="Cargar tema original como base"
              >
                <Disc className="w-3.5 h-3.5 text-[var(--acc)]" />
                <span>+ Base tema</span>
              </Button>
            )}
          </div>
        </div>

        {/* Timeline status & counter */}
        <div className="flex items-center justify-between text-xs font-sans text-[var(--ink-2)] pt-1">
          <span className="text-[var(--ink-2)] font-bold flex items-center gap-1.5">
            {isPlaying ? (
              <span className="w-2 h-2 rounded-[var(--r-pill)] bg-[var(--ok)] " />
            ) : (
              <span className="w-2 h-2 rounded-[var(--r-pill)] bg-[var(--ink-3)]" />
            )}
            {isPlaying ? 'Reproduciendo...' : 'Detenido'}
          </span>

          <div className="text-[var(--ok)] font-bold font-sans">
            {formatTime(currentTime)} <span className="text-[var(--ink-2)]">/</span> {formatTime(duration)}
          </div>
        </div>

        {/* Timeline Slider with Visual Cue Range Highlight */}
        {(() => {
          const loopCfg = loopConfigMap[idea.id];
          const isLoopEnabled = !!loopCfg?.enabled;
          const lStart = loopCfg?.start || 0;
          const lEnd = loopCfg?.end && loopCfg.end > lStart ? loopCfg.end : duration || 30;
          const dur = duration || 30;

          return (
            <div className="relative w-full pt-1 pb-1">
              {/* Visual Cue Loop Region */}
              {dur > 0 && isLoopEnabled && (
                <div
                  className="absolute top-1 bottom-1 bg-[var(--tentative)]/25 rounded pointer-events-none z-0"
                  style={{
                    left: `${Math.min(100, Math.max(0, (lStart / dur) * 100))}%`,
                    width: `${Math.min(100, Math.max(1, ((lEnd - lStart) / dur) * 100))}%`,
                  }}
                >
                  <span className="absolute -top-3 left-0 text-micro font-sans text-[var(--tentative)] font-bold bg-[var(--tentative)]/5 px-1 rounded">
                    Cue A
                  </span>
                  <span className="absolute -top-3 right-0 text-micro font-sans text-[var(--tentative)] font-bold bg-[var(--tentative)]/5 px-1 rounded">
                    Cue B
                  </span>
                </div>
              )}

              <input
                type="range"
                min={0}
                max={dur}
                step={0.05}
                value={currentTime}
                onChange={(e) => handleSeekIdea(idea, parseFloat(e.target.value))}
                className="w-full accent-indigo-500 h-2 bg-[var(--surface)] rounded-[var(--r-s)] cursor-pointer relative z-10 opacity-90 hover:opacity-100"
              />
            </div>
          );
        })()}
      </div>
    </>
  );
}
