import React, { useEffect, useState } from "react";
import { ShowIcon } from '../ui/ShowIcon';

const SILENT_AUDIO_URI =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
import { Song, Setlist, SetlistItem } from "../../types";
import {
  Printer,
  Music,
  Mic,
  Radio,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Repeat,
  Heart,
  Activity,
  Footprints,
  Zap,
  FileText,
  WifiOff,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PublicoSilhouette } from "../ui/PublicoSilhouette";
import { SHOW_ITEM_TYPES, formatSecondsToMmSs } from "../RepertorioSetlists";
import { cacheActiveStageSetlist } from "../../utils/stageOfflineCache";
import { formatSongTitle } from "../../utils/formatSongTitle";
import { Button, Select } from '../ui';

interface EscenarioViewProps {
  activeSetlist: Setlist | null;
  setlists: Setlist[];
  activeSetlistId: string;
  setActiveSetlistId: (id: string) => void;
  songs: Song[];
  setShowPdfPreview: (val: boolean) => void;
  stageAudioRef: React.RefObject<HTMLAudioElement | null>;
  stageAudioRefB: React.RefObject<HTMLAudioElement | null>;
  stagePlayingIndex: number | null;
  setStagePlayingIndex: (idx: number | null) => void;
  stageIsPlaying: boolean;
  setStageIsPlaying: (playing: boolean) => void;
  stageCurrentTime: number;
  stageItemDuration: number;
  stageResolvedUrl: string | null;
  stageAutoplayNext: boolean;
  setStageAutoplayNext: (val: boolean) => void;
  stageCrossfadeEnabled: boolean;
  setStageCrossfadeEnabled: (val: boolean) => void;
  isCrossfading: boolean;
  handleStageAudioEnded: () => void;
  handleStageTimeUpdate: (currentTimeSec: number) => void;
  handleStageSeek: (val: number) => void;
  handleStagePrev: () => void;
  handleStageNext: () => void;
  toggleStagePlayPause: () => void;
  toggleFavoriteSong: (id: string) => void;
  setEditingShowItem: (item: SetlistItem | null) => void;
  setShowItemAudioUrl: (url: string) => void;
  setShowShowItemModal: (val: boolean) => void;
  formatItemDuration: (item: SetlistItem) => string;
  /** true cuando este componente se embebe dentro de la pestaña Repertorio (ver
   * RepertorioSetlists.tsx, toggle"Reproducir concierto") en vez de vivir en su propia pestaña
   * — oculta el selector de repertorio, el botón"Imprimir/Exportar" y la lista de solo lectura
   * de temas, porque Repertorio ya tiene su propio selector, su propio"Imprimir/Exportar" y su
   * propia lista (editable, con arrastre) — mostrarlos dos veces sería puro ruido. Solo se queda
   * la consola del reproductor (metadata, controles, barra de progreso, atajos). */
  embedded?: boolean;
}

const StageMetronomeDot: React.FC<{ isPlaying: boolean; bpm: number }> =
  React.memo(({ isPlaying, bpm }) => {
    const [tick, setTick] = useState(false);

    useEffect(() => {
      if (!isPlaying || !bpm || bpm <= 0) {
        setTick(false);
        return;
      }
      const intervalMs = (60 / bpm) * 1000;
      const interval = setInterval(
        () => {
          setTick((prev) => !prev);
        },
        Math.max(80, intervalMs / 2),
      );
      return () => clearInterval(interval);
    }, [isPlaying, bpm]);

    return (
      <span
        className={`w-2 h-2 rounded-[var(--r-pill)] transition-ui duration-75 ${
          isPlaying
            ? tick
              ? "bg-[var(--acc)] scale-125"
              : "bg-[var(--acc)] scale-90"
            : "bg-[var(--surface)]"
        }`}
      />
    );
  });

export const EscenarioView: React.FC<EscenarioViewProps> = ({
  activeSetlist,
  setlists,
  activeSetlistId,
  setActiveSetlistId,
  songs,
  setShowPdfPreview,
  stageAudioRef,
  stageAudioRefB,
  stagePlayingIndex,
  setStagePlayingIndex,
  stageIsPlaying,
  setStageIsPlaying,
  stageCurrentTime,
  stageItemDuration,
  stageResolvedUrl,
  stageAutoplayNext,
  setStageAutoplayNext,
  stageCrossfadeEnabled,
  setStageCrossfadeEnabled,
  isCrossfading,
  handleStageAudioEnded,
  handleStageTimeUpdate,
  handleStageSeek,
  handleStagePrev,
  handleStageNext,
  toggleStagePlayPause,
  toggleFavoriteSong,
  setEditingShowItem,
  setShowItemAudioUrl,
  setShowShowItemModal,
  formatItemDuration,
  embedded = false,
}) => {
  const currentStageItem =
    stagePlayingIndex !== null && activeSetlist
      ? activeSetlist.items[stagePlayingIndex]
      : null;
  const currentStageSong =
    currentStageItem && currentStageItem.tipoItem === "cancion"
      ? songs.find((s) => s.id === currentStageItem.songId)
      : null;
  const nextStageItem =
    stagePlayingIndex !== null && activeSetlist
      ? activeSetlist.items[stagePlayingIndex + 1]
      : null;
  const nextStageSong =
    nextStageItem && nextStageItem.tipoItem === "cancion"
      ? songs.find((s) => s.id === nextStageItem.songId)
      : null;
  const isCurrentSongFavorited = currentStageSong?.favoritoGeneral || false;
  const stageProgressPct =
    stageItemDuration > 0
      ? Math.min(100, (stageCurrentTime / stageItemDuration) * 100)
      : 0;

  // Visual metronome state based on active track BPM
  const currentBpm = Number(currentStageSong?.bpm) || 120;
  const [showPedalShortcuts, setShowPedalShortcuts] = useState(false);

  // Offline Stage Mode & Local Cache
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [isCached, setIsCached] = useState(false);
  const [showChordsPanel, setShowChordsPanel] = useState(false);
  const [chordsFontSize, setChordsFontSize] = useState<
    "sm" | "base" | "lg" | "xl"
  >("base");

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto-caching setlist and relevant songs into persistent storage
  useEffect(() => {
    if (activeSetlist && songs.length > 0) {
      const success = cacheActiveStageSetlist(activeSetlist, songs);
      setIsCached(success);
    }
  }, [activeSetlist, songs]);

  // Bluetooth Pedal / Keyboard Shortcuts (PageDown = Next, PageUp = Prev, Space = Play/Pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when user is typing in an input or textarea
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement)?.tagName,
        )
      ) {
        return;
      }
      if (e.key === "PageDown" || e.key === "ArrowRight" || e.key === "]") {
        e.preventDefault();
        handleStageNext();
      } else if (e.key === "PageUp" || e.key === "ArrowLeft" || e.key === "[") {
        e.preventDefault();
        handleStagePrev();
      } else if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        toggleStagePlayPause();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleStageNext, handleStagePrev, toggleStagePlayPause]);

  return (
    <div className="p-4 sm:p-6 rounded-[var(--r-l)] bg-[var(--sunken)] space-y-6 text-[var(--ink)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-[var(--r-pill)] bg-[var(--surface)]/20 text-[var(--ok)] font-sans text-micro font-bold inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-[var(--r-pill)] bg-[var(--surface)] " />
              Directo y concierto
            </span>

            {/* Offline Robustness Badge */}
            {!isOnline ? (
              <span
                className="px-2.5 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)]/20 text-[var(--acc-ink)] font-sans text-micro font-bold inline-flex items-center gap-1.5"
                title="Sin conexión a internet: funcionando 100% con el repertorio y letras cacheados localmente"
              >
                <WifiOff className="w-3 h-3 text-[var(--acc)]" />
                Modo offline activo
              </span>
            ) : isCached ? (
              <span
                className="px-2.5 py-0.5 rounded-[var(--r-pill)] bg-[var(--ok)]/10 text-[var(--ok)] font-sans text-micro font-bold inline-flex items-center gap-1.5"
                title="Repertorio, letras, acordes y tempos guardados localmente para tocar sin red"
              >
                <Check className="w-3 h-3 text-[var(--ok)]" />
                Caché offline listo
              </span>
            ) : null}
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-sans text-[var(--ink)] mt-1">
            {activeSetlist ? activeSetlist.nombre : "Sin Setlist Seleccionado"}
          </h2>
        </div>

        {/* Selector de repertorio + Imprimir/Exportar: Repertorio ya tiene los suyos propios
 (sidebar de setlists + menú"⋯") cuando este reproductor va embebido ahí — mostrarlos
 aquí también sería un control duplicado en la misma pantalla. */}
        {!embedded && (
          <div className="flex items-center gap-2">
            <Select
              size="sm"
              value={activeSetlistId}
              onChange={(e) => setActiveSetlistId(e.target.value)}
            >
              {setlists.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </Select>

            <Button
              variant="primary"
              size="xs"
              onClick={() => setShowPdfPreview(true)}
              className="items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / exportar</span>
            </Button>
          </div>
        )}
      </div>

      {/* Dos <audio> en vez de uno: durante un fundido cruzado, uno termina la canción actual
 mientras el otro ya reproduce la siguiente desde cero — ver useStagePlayer.ts. Cuando el
 fundido está desactivado, el segundo simplemente no se usa nunca. */}
      <audio
        ref={stageAudioRef as any}
        src={SILENT_AUDIO_URI}
        preload="none"
        onError={(e) => e.preventDefault()}
        onEnded={handleStageAudioEnded}
        onTimeUpdate={(e) =>
          handleStageTimeUpdate(Math.round(e.currentTarget.currentTime))
        }
      />
      <audio
        ref={stageAudioRefB as any}
        src={SILENT_AUDIO_URI}
        preload="none"
        onError={(e) => e.preventDefault()}
        onEnded={handleStageAudioEnded}
      />

      {/* CONCERT PLAYER CONSOLE (SPOTIFY LIVE BAR) */}
      {activeSetlist && activeSetlist.items.length > 0 && (
        <div className="p-5 sm:p-6 rounded-[var(--r-l)] bg-[var(--surface)] space-y-4 relative overflow-hidden">
          {/* Subtle top line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--hair)]" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Active Track Metadata & Heart Favorite */}
            <div className="flex items-center gap-3.5 w-full md:w-auto">
              <div className="w-13 h-13 rounded-[var(--r-m)] bg-[var(--sunken)] flex items-center justify-center shrink-0 relative overflow-hidden group">
                {currentStageSong?.portadaUrl ? (
                  <img
                    src={currentStageSong.portadaUrl}
                    alt={currentStageSong.titulo}
                    className="w-full h-full object-cover"
                  />
                ) : stagePlayingIndex !== null ? (
                  currentStageItem?.tipoItem === "cancion" ? (
                    <Music className="w-6 h-6 text-[var(--ok)]" />
                  ) : (
                    <Mic className="w-6 h-6 text-[var(--acc)]" />
                  )
                ) : (
                  <Radio className="w-6 h-6 text-[var(--ink-2)]" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-micro font-sans text-[var(--ink-2)] font-bold flex items-center gap-2">
                  <span>
                    {stagePlayingIndex !== null
                      ? `En Directo (${stagePlayingIndex + 1}/${activeSetlist.items.length})`
                      : "Reproductor de Concierto"}
                  </span>
                  {stageResolvedUrl ? (
                    <span className="px-2 py-0.5 rounded-[var(--r-pill)] text-micro bg-[var(--surface)]/20 text-[var(--ok)] font-bold">
                      Audio real
                    </span>
                  ) : stagePlayingIndex !== null ? (
                    <span className="px-2 py-0.5 rounded-[var(--r-pill)] text-micro bg-[var(--acc)]/20 text-[var(--acc-ink)] font-bold">
                      Simulación
                    </span>
                  ) : null}
                  {isCrossfading && nextStageSong && (
                    <span className="px-2 py-0.5 rounded-[var(--r-pill)] text-micro bg-[var(--acc)]/20 text-[var(--acc-ink)] font-bold flex items-center gap-1">
                      <ShowIcon inline emoji="🔀" />Fundiendo → {formatSongTitle(nextStageSong.titulo)}
                    </span>
                  )}
                </div>

                <div className="text-base sm:text-lg font-extrabold font-sans text-[var(--ink)] truncate max-w-xs sm:max-w-md flex items-center gap-2">
                  <span>
                    {currentStageItem
                      ? currentStageItem.tipoItem === "cancion"
                        ? currentStageSong
                          ? formatSongTitle(currentStageSong.titulo)
                          : "Canción"
                        : currentStageItem.tituloCustom ||
                          "Interludio / Presentación"
                      : "Listos para iniciar el concierto"}
                  </span>
                </div>

                {currentStageSong && (
                  <div className="text-xs font-sans text-[var(--ink-2)] flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="font-bold text-[var(--ink)]">
                      {currentStageSong.tonalidad || "Am"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5 font-bold text-[var(--acc)]/70">
                      <StageMetronomeDot
                        isPlaying={stageIsPlaying}
                        bpm={currentBpm}
                      />
                      {currentStageSong.bpm || 120} BPM
                    </span>
                    {currentStageSong.afinacion && (
                      <>
                        <span>•</span>
                        <span className="text-[var(--acc)]/90">
                          {currentStageSong.afinacion}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Bluetooth Pedal Indicator & Info */}
              <Button
                variant={showPedalShortcuts ? "soft" : "neutral"}
                size="sm"
                type="button"
                onClick={() => setShowPedalShortcuts(!showPedalShortcuts)}
                className="items-center gap-1"
                title="Atajos de teclado / pedal bluetooth para pasar canciones sin manos"
              >
                <Footprints className="w-3.5 h-3.5 text-[var(--acc)]" />
                <span className="hidden sm:inline">Pedal</span>
              </Button>

              {/* Heart Favorite Button (Spotify Style) */}
              {currentStageSong && (
                <button
                  onClick={() => toggleFavoriteSong(currentStageSong.id)}
                  className="p-2.5 rounded-[var(--r-pill)] hover:bg-[var(--surface)] transition-ui cursor-pointer group flex items-center justify-center shrink-0 ml-1"
                  title={
                    isCurrentSongFavorited
                      ? "Quitar de tus temas favoritos"
                      : "Guardar en tus favoritos (Spotify)"
                  }
                >
                  <Heart
                    className={`w-5 h-5 transition-ui transform group-active:scale-125 ${
                      isCurrentSongFavorited
                        ? "fill-[var(--ok)] text-[var(--ok)] scale-110"
                        : "text-[var(--ink-2)] group-hover:text-[var(--ink)]"
                    }`}
                  />
                </button>
              )}

              {/* Modify Audio Button for Show Items in Stage Mode */}
              {currentStageItem && currentStageItem.tipoItem !== "cancion" && (
                <Button
                  variant="primary"
                  size="xs"
                  onClick={() => {
                    setEditingShowItem(currentStageItem);
                    setShowItemAudioUrl(currentStageItem.audioUrl || "");
                    setShowShowItemModal(true);
                  }}
                  className="items-center gap-1.5 shrink-0 ml-1"
                  title="Grabar o subir audio para esta presentación / interludio"
                >
                  <Mic className="w-4 h-4 text-[var(--acc)]" />
                  <span className="hidden sm:inline">
                    {currentStageItem.audioUrl
                      ? "Modificar Audio"
                      : "+ Subir / Grabar Audio"}
                  </span>
                </Button>
              )}
            </div>

            {/* Minimalist Circular Playback Controls */}
            <div className="flex items-center gap-3">
              {/* Previous Track */}
              <button data-raw
                onClick={handleStagePrev}
                className="w-10 h-10 rounded-[var(--r-pill)] bg-[var(--sunken)] hover:bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)] flex items-center justify-center transition-ui active:scale-[0.97] cursor-pointer"
                title="Pista anterior"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              {/* Play / Pause Circular Main Button */}
              <button data-raw
                onClick={toggleStagePlayPause}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-[var(--r-pill)] bg-[var(--sunken)] hover:bg-[var(--surface)] text-[var(--ink)] font-extrabold flex items-center justify-center/25 cursor-pointer active:scale-[0.97] transition-ui"
                title={stageIsPlaying ? "Pausar show" : "Iniciar directo"}
              >
                {stageIsPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play
                    className="w-6 h-6 fill-current ml-0.5"
                    strokeWidth={2.5}
                  />
                )}
              </button>

              {/* Next Track */}
              <button data-raw
                onClick={handleStageNext}
                className="w-10 h-10 rounded-[var(--r-pill)] bg-[var(--sunken)] hover:bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)] flex items-center justify-center transition-ui active:scale-[0.97] cursor-pointer"
                title="Pista siguiente"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>

              {/* Autoplay / Repeat Continuous Link */}
              <button
                onClick={() => setStageAutoplayNext(!stageAutoplayNext)}
                className={`w-10 h-10 rounded-[var(--r-pill)] flex items-center justify-center cursor-pointer transition-ui ${
                  stageAutoplayNext
                    ? "bg-[var(--surface)]/20 text-[var(--ok)]"
                    : "bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]"
                }`}
                title={
                  stageAutoplayNext
                    ? "Autoplay continuo activado"
                    : "Autoplay desactivado"
                }
              >
                <Repeat className="w-4 h-4" />
              </button>

              {/* Fundido real entre canciones consecutivas (5s, curva de potencia constante) —
 desactivado por defecto, junto al botón de Autoplay del que depende. */}
              <button
                onClick={() => setStageCrossfadeEnabled(!stageCrossfadeEnabled)}
                className={`w-10 h-10 rounded-[var(--r-pill)] flex items-center justify-center cursor-pointer transition-ui text-base ${
                  stageCrossfadeEnabled
                    ? "bg-[var(--acc)]/20 text-[var(--acc-ink)]"
                    : "bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]"
                }`}
                title={
                  stageCrossfadeEnabled
                    ? "Fundido entre canciones activado (5s)"
                    : "Fundido entre canciones desactivado (corte directo)"
                }
              >
                <ShowIcon inline emoji="🔀" />
              </button>
            </div>
          </div>

          {/* Striated / Ridged Progress Seeker Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-xs font-sans text-[var(--ink-2)] font-bold px-0.5">
              <span>{formatSecondsToMmSs(stageCurrentTime)}</span>
              <span className="text-micro text-[var(--ink-2)] font-sans">
                {stageIsPlaying ? "• EN REPRODUCCIÓN" : "PAUSADO"}
              </span>
              <span>{formatSecondsToMmSs(stageItemDuration)}</span>
            </div>

            {/* Ridged Progress Track */}
            <div className="relative w-full h-3.5 rounded-[var(--r-pill)] bg-[var(--sunken)] overflow-hidden group cursor-pointer flex items-center">
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg, var(--surface) 0px, var(--surface) 1.5px, transparent 1.5px, transparent 7px)",
                }}
              />

              <div
                className="h-full bg-[var(--ok)]  transition-ui duration-150 relative"
                style={{ width: `${stageProgressPct}%` }}
              >
                <div
                  className="absolute inset-0 opacity-40 pointer-events-none"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(90deg, transparent 0px, transparent 3px, var(--shadow-dark) 3px, var(--shadow-dark) 6px)",
                  }}
                />
                <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-[var(--surface)] opacity-90" />
              </div>

              <input
                type="range"
                min={0}
                max={stageItemDuration || 100}
                value={stageCurrentTime}
                onChange={(e) => handleStageSeek(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              />
            </div>
          </div>

          {/* Bluetooth Pedal / Foot Controller Helper Banner */}
          {showPedalShortcuts && (
            <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--acc)]/10 text-[var(--ink)] text-xs font-sans space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between font-bold text-[var(--acc)]/70">
                <span className="flex items-center gap-1.5">
                  <Footprints className="w-4 h-4 text-[var(--acc)]" />
                  <span>
                    Compatibilidad con Pedal Bluetooth / Controlador de Pie
                    (AirTurn, PageFlip, Donner, iRig):
                  </span>
                </span>
                <span className="text-micro px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)]/20 text-[var(--acc-ink)]">
                  Activo
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded-[var(--r-s)] bg-[var(--sunken)]">
                  <span className="font-bold text-[var(--ink)]">
                    <ShowIcon inline emoji="🦶" />Pista Siguiente:
                  </span>{" "}
                  <code className="bg-[var(--surface)] px-1.5 py-0.5 rounded text-[var(--acc)]/70">
                    PageDown
                  </code>{" "}
                  /{" "}
                  <code className="bg-[var(--surface)] px-1.5 py-0.5 rounded text-[var(--acc)]/70">
                    →
                  </code>{" "}
                  /{" "}
                  <code className="bg-[var(--surface)] px-1.5 py-0.5 rounded text-[var(--acc)]/70">
                    ]
                  </code>
                </div>
                <div className="p-2 rounded-[var(--r-s)] bg-[var(--sunken)]">
                  <span className="font-bold text-[var(--ink)]">
                    <ShowIcon inline emoji="🦶" />Pista Anterior:
                  </span>{" "}
                  <code className="bg-[var(--surface)] px-1.5 py-0.5 rounded text-[var(--acc)]/70">
                    PageUp
                  </code>{" "}
                  /{" "}
                  <code className="bg-[var(--surface)] px-1.5 py-0.5 rounded text-[var(--acc)]/70">
                    ←
                  </code>{" "}
                  /{" "}
                  <code className="bg-[var(--surface)] px-1.5 py-0.5 rounded text-[var(--acc)]/70">
                    [
                  </code>
                </div>
                <div className="p-2 rounded-[var(--r-s)] bg-[var(--sunken)]">
                  <span className="font-bold text-[var(--ink)]">
                    <ShowIcon inline emoji="🦶" />Play / Pausa:
                  </span>{" "}
                  <code className="bg-[var(--surface)] px-1.5 py-0.5 rounded text-[var(--acc)]/70">
                    Barra Espaciadora
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stage Actions: Pedal Helper & Live Lyrics/Chords Teleprompter */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-2">
              <Button
                variant={showPedalShortcuts ? "soft" : "neutral"}
                size="xs"
                type="button"
                onClick={() => setShowPedalShortcuts(!showPedalShortcuts)}
                className="items-center gap-1.5"
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>Pedal Bluetooth</span>
              </Button>

              <button
                type="button"
                onClick={() => setShowChordsPanel(!showChordsPanel)}
                className={`text-xs font-sans px-3 py-1.5 rounded-[var(--r-pill)] flex items-center gap-1.5 transition-colors cursor-pointer font-bold ${
                  showChordsPanel
                    ? "bg-[var(--surface)]/20 text-[var(--ok)]"
                    : "bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]"
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-[var(--ok)]" />
                <span>
                  {showChordsPanel
                    ? "Ocultar Letra/Acordes"
                    : "Letra y Acordes en Directo"}
                </span>
              </button>
            </div>

            {currentStageSong && (
              <div className="text-xs font-sans text-[var(--ink-2)] flex items-center gap-2">
                {currentStageSong.tonalidad && (
                  <span className="px-2 py-0.5 rounded bg-[var(--sunken)] text-[var(--acc-ink)] font-bold">
                    Tono: {currentStageSong.tonalidad}
                  </span>
                )}
                {currentStageSong.bpm && (
                  <span className="px-2 py-0.5 rounded bg-[var(--sunken)] text-[var(--ink-2)]">
                    {currentStageSong.bpm} BPM
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Live Stage Lyrics & Chords Teleprompter Drawer (Offline-safe) */}
          {showChordsPanel && (
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-2800 pb-2.5">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--ok)]" />
                  <h4 className="font-sans text-sm font-bold text-[var(--ink)]">
                    {currentStageSong
                      ? formatSongTitle(currentStageSong.titulo)
                      : "Sin tema seleccionado"}
                  </h4>
                  {currentStageSong?.afinacion && (
                    <span className="text-micro font-sans px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--ink-2)]">
                      {currentStageSong.afinacion}
                    </span>
                  )}
                </div>

                {/* Font Size controls for stage readability */}
                <div className="flex items-center gap-1.5 text-xs font-sans">
                  <span className="text-[var(--ink-2)] mr-1 text-micro font-bold">
                    Tamaño:
                  </span>
                  <button
                    type="button"
                    onClick={() => setChordsFontSize("sm")}
                    className={`px-2 py-0.5 rounded ${chordsFontSize === "sm" ? "bg-[var(--surface)] text-[var(--ink)] font-bold" : "bg-[var(--sunken)] text-[var(--ink-2)]"}`}
                  >
                    A-
                  </button>
                  <button
                    type="button"
                    onClick={() => setChordsFontSize("base")}
                    className={`px-2 py-0.5 rounded ${chordsFontSize === "base" ? "bg-[var(--surface)] text-[var(--ink)] font-bold" : "bg-[var(--sunken)] text-[var(--ink-2)]"}`}
                  >
                    A
                  </button>
                  <button
                    type="button"
                    onClick={() => setChordsFontSize("lg")}
                    className={`px-2 py-0.5 rounded ${chordsFontSize === "lg" ? "bg-[var(--surface)] text-[var(--ink)] font-bold" : "bg-[var(--sunken)] text-[var(--ink-2)]"}`}
                  >
                    A+
                  </button>
                  <button
                    type="button"
                    onClick={() => setChordsFontSize("xl")}
                    className={`px-2 py-0.5 rounded ${chordsFontSize === "xl" ? "bg-[var(--surface)] text-[var(--ink)] font-bold" : "bg-[var(--sunken)] text-[var(--ink-2)]"}`}
                  >
                    A++
                  </button>
                </div>
              </div>

              {/* Chords and Lyrics View */}
              {currentStageSong?.cifradoTexto ? (
                <div className="max-h-[380px] overflow-y-auto pr-1">
                  <pre
                    className={`font-sans text-[var(--ink)] whitespace-pre-wrap select-text leading-relaxed ${
                      chordsFontSize === "sm"
                        ? "text-xs"
                        : chordsFontSize === "base"
                          ? "text-sm"
                          : chordsFontSize === "lg"
                            ? "text-base"
                            : "text-lg font-bold"
                    }`}
                  >
                    {currentStageSong.cifradoTexto}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <PublicoSilhouette opacity={0.12} size="small" />
                  <p className="mt-4 font-medium text-[var(--ink)] text-sm">
                    Sin cifrado disponible
                  </p>
                  <p className="mt-2 text-[var(--ink-2)] text-xs max-w-xs">
                    Añade acordes y letra desde Repertorio para verlos aquí en
                    directo.
                  </p>
                </div>
              )}

              {/* Musician/Substitute notes if present */}
              {currentStageSong?.notasRepertorio && (
                <div className="p-2.5 rounded bg-[var(--bg)]/80 text-xs font-sans text-[var(--ink)]/90">
                  <span className="font-bold text-[var(--acc)]">
                    <ShowIcon inline emoji="💡" />Nota de directo:
                  </span>{" "}
                  {currentStageSong.notasRepertorio}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lista de solo lectura de temas: Repertorio ya trae su propia lista (editable, con
 arrastre, notas, popover de energía...) cuando este reproductor va embebido ahí —
 repetirla aquí sería la misma información dos veces en la misma pantalla. */}
      {!embedded && activeSetlist ? (
        <div className="bg-[var(--surface)] rounded-[var(--r-l)] overflow-hidden p-4 sm:p-6">
          <div className="overflow-x-auto shrink-0">
            <div className="min-w-[650px] space-y-2">
              <div className="grid grid-cols-12 text-xs font-sans font-extrabold text-[var(--ink-2)] pb-3800/80 px-3">
                <div className="col-span-1">#</div>
                <div className="col-span-6">TÍTULO DEL TEMA / EVENTO</div>
                <div className="col-span-2 text-center">TONO / CATEGORÍA</div>
                <div className="col-span-1 text-center">BPM</div>
                <div className="col-span-2 text-right">DURACIÓN</div>
              </div>

              {activeSetlist.items.map((it, idx) => {
                if (it.tipoItem === "cancion" && it.songId) {
                  const s = songs.find((x) => x.id === it.songId);
                  if (!s) return null;

                  const isPlayingThis =
                    stagePlayingIndex === idx && stageIsPlaying;
                  const isSelectedThis = stagePlayingIndex === idx;

                  return (
                    <div
                      key={it.id}
                      className={`grid grid-cols-12 items-center py-3.5 px-3 rounded-[var(--r-m)] transition-ui cursor-pointer ${
                        isSelectedThis
                          ? "bg-[var(--surface)]/15 text-[var(--ink)]"
                          : "hover:bg-[var(--surface)]/60 text-[var(--ink-2)]"
                      }`}
                    >
                      <div className="col-span-1 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setStagePlayingIndex(idx);
                            setStageIsPlaying(
                              !(stagePlayingIndex === idx && stageIsPlaying),
                            );
                          }}
                          className={`w-8 h-8 rounded-[var(--r-pill)] flex items-center justify-center cursor-pointer transition-ui ${
                            isPlayingThis
                              ? "bg-[var(--surface)] text-[var(--ink)] font-bold scale-105"
                              : "bg-[var(--surface)] text-[var(--ok)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
                          }`}
                          title={
                            isPlayingThis ? "Pausar" : "Reproducir este tema"
                          }
                        >
                          {isPlayingThis ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </button>
                        <span className="font-sans text-xs font-bold text-[var(--ink-2)]">
                          {idx + 1}
                        </span>
                      </div>

                      <div className="col-span-6">
                        <div className="text-base sm:text-lg font-bold font-sans text-[var(--ink)] flex items-center gap-2">
                          <span>{formatSongTitle(s.titulo)}</span>
                          {isPlayingThis && (
                            <div className="flex items-end gap-0.5 h-3">
                              <span className="w-0.5 h-full bg-[var(--surface)]" />
                              <span className="w-0.5 h-2/3 bg-[var(--surface)] delay-75" />
                              <span className="w-0.5 h-4/5 bg-[var(--surface)] delay-150" />
                            </div>
                          )}
                        </div>
                        {it.notaTema && (
                          <div className="text-xs font-sans text-[var(--acc)] mt-0.5 flex items-center gap-1">
                            <span><ShowIcon inline emoji="⚠️" /></span>
                            <span>{it.notaTema}</span>
                          </div>
                        )}
                      </div>

                      <div className="col-span-2 text-center">
                        <span className="px-2.5 py-1 bg-[var(--surface)]/20 text-[var(--ok)] rounded-[var(--r-s)] text-xs font-sans font-bold">
                          {s.tonalidad || "Am"}
                        </span>
                      </div>

                      <div className="col-span-1 text-center font-sans text-xs text-[var(--ink-2)] font-bold">
                        {s.bpm || "—"}
                      </div>

                      <div className="col-span-2 text-right font-sans text-xs text-[var(--ink-2)] font-bold">
                        {s.duracion}
                      </div>
                    </div>
                  );
                } else if (
                  it.tipoItem === "bloque" &&
                  it.bloqueSubtipo === "header"
                ) {
                  return (
                    <div
                      key={it.id}
                      className="py-3 px-4 bg-[var(--ok)]/20  rounded-[var(--r-m)] font-sans text-[var(--ink)] font-extrabold text-xs flex items-center gap-2 my-2"
                    >
                      <span className="text-sm"><ShowIcon inline emoji="⚡" /></span>
                      <span>{it.tituloCustom || "SECCIÓN DEL SHOW"}</span>
                    </div>
                  );
                } else {
                  const typeConfig =
                    SHOW_ITEM_TYPES[it.tipoItem] || SHOW_ITEM_TYPES.otro;
                  const durationText = formatItemDuration(it);
                  const isPlayingThis =
                    stagePlayingIndex === idx && stageIsPlaying;
                  const isSelectedThis = stagePlayingIndex === idx;

                  return (
                    <div
                      key={it.id}
                      className={`grid grid-cols-12 items-center py-3.5 px-3 rounded-[var(--r-m)] transition-ui cursor-pointer ${
                        isSelectedThis
                          ? "bg-[var(--acc)]/15 text-[var(--ink)]"
                          : "hover:bg-[var(--surface)]/60 text-[var(--ink-2)]"
                      }`}
                      onClick={() => {
                        setStagePlayingIndex(idx);
                        if (stagePlayingIndex === idx) {
                          setStageIsPlaying(!stageIsPlaying);
                        } else {
                          setStageIsPlaying(true);
                        }
                      }}
                    >
                      <div className="col-span-1 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setStagePlayingIndex(idx);
                            setStageIsPlaying(!isPlayingThis);
                          }}
                          className={`w-8 h-8 rounded-[var(--r-pill)] flex items-center justify-center cursor-pointer transition-ui ${
                            isPlayingThis
                              ? "bg-[var(--acc)] text-[var(--on-acc)] font-bold scale-105"
                              : "bg-[var(--surface)] text-[var(--acc)] hover:bg-[var(--acc)] hover:text-[var(--ink)]"
                          }`}
                          title={
                            isPlayingThis
                              ? "Pausar"
                              : "Reproducir discurso / audio"
                          }
                        >
                          {isPlayingThis ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </button>
                        <span className="font-sans text-xs font-bold text-[var(--ink-2)]">
                          {idx + 1}
                        </span>
                      </div>

                      <div className="col-span-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold font-sans text-[var(--ink)]">
                              <ShowIcon inline emoji={typeConfig.icon} />{" "}
                              {it.tituloCustom ||
                                "Interludio / Evento del Show"}
                            </span>
                            {it.audioUrl && (
                              <span className="text-micro font-sans px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)]/20 text-[var(--acc-ink)] font-bold flex items-center gap-1">
                                <Mic className="w-3 h-3" /> Audio real
                              </span>
                            )}
                          </div>
                          {it.notaTema && (
                            <div className="text-micro font-sans text-[var(--ink-2)] mt-0.5">
                              <ShowIcon inline emoji="📝" />{it.notaTema}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="primary"
                          size="xs"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingShowItem(it);
                            setShowItemAudioUrl(it.audioUrl || "");
                            setShowShowItemModal(true);
                          }}
                          className="items-center gap-1 shrink-0 self-start sm:self-auto"
                          title="Modificar audio o grabación de este evento"
                        >
                          <Mic className="w-3 h-3 text-[var(--acc)]" />
                          <span>
                            {it.audioUrl ? "Modificar Audio" : "+ Audio"}
                          </span>
                        </Button>
                      </div>

                      <div className="col-span-2 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-[var(--r-pill)] text-micro font-sans font-bold ${typeConfig.text}`}
                        >
                          {typeConfig.label}
                        </span>
                      </div>

                      <div className="col-span-1 text-center font-sans text-xs text-[var(--ink-2)]">
                        —
                      </div>

                      <div className="col-span-2 text-right font-sans text-xs text-[var(--acc)]/70 font-bold">
                        <ShowIcon inline emoji="⏱️" />{durationText}
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
