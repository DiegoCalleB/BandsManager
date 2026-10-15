/**
 * Reproductor de la unión: modo, Auto-CUE, estilo, línea de tiempo y controles.
 */
import { Play, Pause, RotateCcw, Volume2, VolumeX, Music, Scissors, Disc3 } from "lucide-react";
import { Button, IconButton } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { useSongTransition } from "./SongTransitionContext";

/** Reproductor de la unión: modo, Auto-CUE, estilo, línea de tiempo y controles. */
export function TransitionPlayer() {
  const { playbackMode, changeMode, autoCueEnabled, toggleAutoCue, config, updateConfig, timeline, handleSeek, cueAnalysis, indexA, indexB, currentTime, isPlaying, togglePlay, handleRestart, isMuted, setIsMuted, volume, changeVolume } = useSongTransition();
  return (
    <div className="p-2 sm:p-2.5 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-1.5">
      {/* Controls & Mode Ribbon Header */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
        {/* Mode Selector & Auto-CUE toggle */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center p-0.5 bg-[var(--surface)] rounded-[var(--r-s)]">
            <Button
              variant={playbackMode === "real" ? "selected" : "ghost"}
              size="xs"
              type="button"
              onClick={() => changeMode("real")}
              className="items-center gap-1"
            >
              <Disc3 className="w-3 h-3" />
              <span>Audio real</span>
            </Button>
            <Button
              variant={playbackMode === "synth" ? "selected" : "ghost"}
              size="xs"
              type="button"
              onClick={() => changeMode("synth")}
              className="items-center gap-1"
            >
              <Music className="w-3 h-3" />
              <span>Sinte</span>
            </Button>
          </div>

          {/* Auto-CUE Toggle Button */}
          <button
            type="button"
            onClick={toggleAutoCue}
            className={`px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-bold flex items-center gap-1 transition cursor-pointer ${
              autoCueEnabled
                ? "bg-[var(--acc)]/15 text-[var(--ink)] "
                : "bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)]"
            }`}
            title="Auto-CUE Inteligente: Detecta y salta automáticamente los huecos de silencio y aplausos al principio y final de canciones en directo"
          >
            <Scissors className="w-3 h-3" />
            <span>Auto-CUE: {autoCueEnabled ? "ON" : "OFF"}</span>
          </button>
        </div>

        {/* Transition Style Selector */}
        <div className="flex items-center gap-1 bg-[var(--surface)] p-0.5 rounded-[var(--r-s)]">
          <Button
            variant={config.style === "crossfade" ? "selected" : "ghost"}
            size="xs"
            type="button"
            onClick={() => updateConfig({ style: "crossfade" })}
          >
            Fundido ({config.fadeDurationSec}s)
          </Button>
          <Button
            variant={config.style === "segue" ? "selected" : "ghost"}
            size="xs"
            type="button"
            onClick={() => updateConfig({ style: "segue" })}
          >
            Corte (0s)
          </Button>
          <Button
            variant={config.style === "pause" ? "selected" : "ghost"}
            size="xs"
            type="button"
            onClick={() => updateConfig({ style: "pause" })}
          >
            Pausa ({config.pauseDurationSec}s)
          </Button>

          {/* Seconds selector for crossfade */}
          {config.style === "crossfade" && (
            <div className="flex items-center gap-0.5 pl-1700">
              {[2, 3, 5, 8].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => updateConfig({ fadeDurationSec: sec })}
                  className={`px-1 py-0.2 rounded font-sans text-micro transition cursor-pointer ${
                    config.fadeDurationSec === sec
                      ? "bg-[var(--acc)]/30 text-[var(--ink)] font-bold"
                      : "text-[var(--ink-2)] hover:text-[var(--ink)]"
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Visual Multi-Track Waveform Timeline with Scrubbing */}
      <div
        className="relative h-7 bg-[var(--surface)] rounded-[var(--r-s)] cursor-pointer overflow-hidden p-0.5 select-none"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          handleSeek(ratio * timeline.totalDurationSec);
        }}
      >
        {/* Track A segment */}
        <div
          className="absolute top-0.5 bottom-0.5 left-0.5 rounded bg-[var(--acc)]/20 flex items-center px-1.5"
          style={{
            width: `${(timeline.songAEndSec / timeline.totalDurationSec) * 100}%`,
          }}
        >
          <span className="text-micro font-sans font-bold text-[var(--acc)]/70 truncate flex items-center gap-0.5">
            {autoCueEnabled && cueAnalysis.A?.outroSilenceSec ? (
              <Scissors className="w-2 h-2 text-[var(--acc)] shrink-0" />
            ) : null}
            Fin #{indexA + 1}
          </span>
        </div>

        {/* Track B segment */}
        <div
          className="absolute top-0.5 bottom-0.5 right-0.5 rounded bg-[var(--ok)]/20 flex items-center justify-end px-1.5"
          style={{
            left: `${(timeline.songBStartSec / timeline.totalDurationSec) * 100}%`,
          }}
        >
          <span className="text-micro font-sans font-bold text-[var(--ink-2)] truncate flex items-center gap-0.5">
            {autoCueEnabled && cueAnalysis.B?.introSilenceSec ? (
              <Scissors className="w-2 h-2 text-[var(--ok)] shrink-0" />
            ) : null}
            Inicio #{indexB + 1}
          </span>
        </div>

        {/* Crossfade overlap highlight */}
        {config.style === "crossfade" && (
          <div
            className="absolute top-0.5 bottom-0.5 bg-[var(--acc)]/30   pointer-events-none flex items-center justify-center text-micro font-sans font-bold text-[var(--ink)]/90"
            style={{
              left: `${(timeline.crossfadeStartSec / timeline.totalDurationSec) * 100}%`,
              width: `${((timeline.crossfadeEndSec - timeline.crossfadeStartSec) / timeline.totalDurationSec) * 100}%`,
            }}
          >
            <ShowIcon inline emoji="⚡" />Fade
          </div>
        )}

        {/* Playhead Indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-[var(--surface)] z-20 pointer-events-none transition-ui duration-75"
          style={{
            left: `${(currentTime / timeline.totalDurationSec) * 100}%`,
          }}
        >
          <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[var(--sunken)] rounded-[var(--r-pill)] shadow" />
        </div>
      </div>

      {/* Player Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={togglePlay}
            className="w-7 h-7 rounded-[var(--r-s)] bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] font-bold flex items-center justify-center shadow transition active:scale-[0.97] cursor-pointer"
            title={
              isPlaying ? "Pausar comprobación" : "Reproducir unión"
            }
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-[var(--ink)]" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-[var(--ink)] ml-0.5" />
            )}
          </button>

          <IconButton
            label="Rebobinar al inicio del enlace"
            size="icon-xs"
            type="button"
            onClick={handleRestart}
          >
            <RotateCcw className="w-3 h-3" />
          </IconButton>

          {/* Volume Slider */}
          <div className="flex items-center gap-1 pl-1">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="text-[var(--ink-2)] hover:text-[var(--ink)] transition cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3 h-3" />
              ) : (
                <Volume2 className="w-3 h-3" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => changeVolume(parseFloat(e.target.value))}
              className="w-14 accent-[var(--acc)] cursor-pointer h-1"
            />
          </div>
        </div>

        {/* Progress Time & Status */}
        <div className="flex items-center gap-1.5">
          <span className="font-sans text-[var(--ink-2)] font-bold bg-[var(--surface)] px-1.5 py-0.5 rounded text-micro">
            <ShowIcon inline emoji="⏱️" />{currentTime.toFixed(1)}s /{" "}
            {timeline.totalDurationSec.toFixed(1)}s
          </span>
          {isPlaying && (
            <span className="px-1.5 py-0.5 rounded-[var(--r-pill)] text-micro font-bold bg-[var(--ok)]/20 text-[var(--ink)] flex items-center gap-1">
              <span className="w-1 h-1 rounded-[var(--r-pill)] bg-[var(--ok)]" />
              Sonando
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
