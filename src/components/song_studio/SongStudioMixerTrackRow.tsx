/**
 * Fila de una pista del mezclador
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/exhaustive-deps
*/
import { GripVertical, Check, Edit2, VolumeX, Volume2, Sliders, X, ChevronUp, ChevronDown } from "lucide-react";
import { getTrackRainbowColor } from "./trackColors";
import { Input, IconButton, Button } from "../ui";
import { ideasConFondo } from "../../utils/ideaDeAtril";
import { cancionConIdeas } from "../../utils/irisTracks";
import WaveformTrack from "../WaveformTrack";
import { ShowIcon } from "../ui/ShowIcon";
import { AudioTrack, SongAudioIdea, Song } from "../../types";
import React, { Dispatch, SetStateAction, RefObject } from "react";

/** Estado y callbacks que el contenedor inyecta a la sección. */
export interface SongStudioMixerTrackRowProps {
  tr: AudioTrack;
  draggedTrackInfo: { ideaId: string; index: number; };
  idea: SongAudioIdea;
  setDragOverTrackIndex: Dispatch<SetStateAction<number>>;
  idx: number;
  handleDropTrack: (idea: SongAudioIdea, dropIndex: number) => void;
  isDraggingThisTrack: boolean;
  isDragOverThisTrack: boolean;
  isMuted: boolean;
  isSolo: any;
  hasSoloInIdea: boolean;
  tracks: AudioTrack[];
  esBase: boolean;
  setDraggedTrackInfo: Dispatch<SetStateAction<{ ideaId: string; index: number; }>>;
  isEditing: boolean;
  editingTrackName: string;
  setEditingTrackName: Dispatch<SetStateAction<string>>;
  handleSaveTrackName: (idea: SongAudioIdea, trackId: string, newName: string) => void;
  setEditingTrackId: Dispatch<SetStateAction<string>>;
  handleToggleMuteTrack: (idea: SongAudioIdea, trackId: string) => void;
  handleToggleSoloTrack: (idea: SongAudioIdea, trackId: string) => void;
  vol: number;
  handleTrackVolumeChange: (idea: SongAudioIdea, trackId: string, newVol: number) => void;
  setExpandedTrackSettingsId: Dispatch<SetStateAction<string>>;
  expandedTrackSettingsId: string;
  formatDesfase: (ms?: number) => string;
  song: Song;
  trackAudioRefs: RefObject<Record<string, HTMLAudioElement>>;
  onUpdateSong: (updatedSong: Song) => void;
  resolvedAudioUrls: Record<string, string>;
  duration: number;
  durationMap: Record<string, number>;
  currentTime: number;
  handleSeekIdea: (idea: SongAudioIdea, newTime: number) => void;
  setDurationMap: Dispatch<SetStateAction<Record<string, number>>>;
  handleTrackPanChange: (idea: SongAudioIdea, trackId: string, pan: number) => void;
  cleaningTrackId: string;
  handleCleanTrackAudio: (idea: SongAudioIdea, track: AudioTrack) => Promise<void>;
  handleTrackEqChange: (idea: SongAudioIdea, trackId: string, band: "low" | "mid" | "high", value: number) => void;
  handleAutoSyncTrackLatency: (idea: SongAudioIdea, track: AudioTrack) => Promise<void>;
  handleTrackDesfaseChange: (idea: SongAudioIdea, trackId: string, newDesfaseMs: number) => void;
  handleMoveTrack: (idea: SongAudioIdea, trackId: string, direction: "up" | "down") => void;
  handleDeleteTrack: (idea: SongAudioIdea, trackId: string) => void;
}

/**
 * Fila de una pista del mezclador
 * @param props Estado y callbacks del contenedor ({@link SongStudioMixerTrackRowProps}).
 * @returns Sección de interfaz.
 */
export function SongStudioMixerTrackRow({ tr, draggedTrackInfo, idea, setDragOverTrackIndex, idx, handleDropTrack, isDraggingThisTrack, isDragOverThisTrack, isMuted, isSolo, hasSoloInIdea, tracks, esBase, setDraggedTrackInfo, isEditing, editingTrackName, setEditingTrackName, handleSaveTrackName, setEditingTrackId, handleToggleMuteTrack, handleToggleSoloTrack, vol, handleTrackVolumeChange, setExpandedTrackSettingsId, expandedTrackSettingsId, formatDesfase, song, trackAudioRefs, onUpdateSong, resolvedAudioUrls, duration, durationMap, currentTime, handleSeekIdea, setDurationMap, handleTrackPanChange, cleaningTrackId, handleCleanTrackAudio, handleTrackEqChange, handleAutoSyncTrackLatency, handleTrackDesfaseChange, handleMoveTrack, handleDeleteTrack }: SongStudioMixerTrackRowProps) {
  return (
    <>
<div
                                            key={tr.id}
                                            onDragOver={(e) => {
                                              e.preventDefault();
                                              if (draggedTrackInfo?.ideaId === idea.id) setDragOverTrackIndex(idx);
                                            }}
                                            onDragLeave={() => setDragOverTrackIndex((prev) => (prev === idx ? null : prev))}
                                            onDrop={(e) => {
                                              e.preventDefault();
                                              handleDropTrack(idea, idx);
                                            }}
                                            className={`rounded-[var(--r-m)] overflow-hidden transition-ui ${
                                              isDraggingThisTrack
                                                ? 'opacity-30 scale-[0.98]'
                                                : isDragOverThisTrack
                                                  ? 'ring-2 ring-[var(--acc)]/50 bg-[var(--tentative)]/10'
                                                  : isMuted
                                                    ? 'bg-[var(--alert)]/5 opacity-50 grayscale-[30%]'
                                                    : isSolo
                                                      ? 'bg-[var(--acc)]/10 /80 ring-1 ring-[var(--acc)]/40 border-l-[var(--acc)]/30'
                                                      : hasSoloInIdea
                                                        ? 'bg-[var(--surface)] /80 opacity-40 grayscale-[50%]'
                                                        : 'bg-[var(--ink)]/5 '
                                            } hover:brightness-95`}
                                          >
                                            <div className="flex items-stretch">
                                              {/* Asa de arrastre grande, ocupa todo el alto de la fila — igual sistema
 (HTML5 drag nativo) que ya funciona en el repertorio, pero con un
 objetivo táctil mucho mayor que un icono suelto */}
                                              {tracks.length > 1 && !esBase && (
                                                <div
                                                  draggable
                                                  onDragStart={() =>
                                                    setDraggedTrackInfo({
                                                      ideaId: idea.id,
                                                      index: idx,
                                                    })
                                                  }
                                                  onDragEnd={() => {
                                                    setDraggedTrackInfo(null);
                                                    setDragOverTrackIndex(null);
                                                  }}
                                                  className="w-7 shrink-0 flex items-center justify-center bg-[var(--sunken)] hover:bg-[var(--sunken)] active:bg-[var(--tentative)]/20 cursor-grab active:cursor-grabbing touch-none select-none"
                                                  title="Arrastrar para reordenar pista"
                                                >
                                                  <GripVertical className="w-4 h-4 text-[var(--ink-2)]" />
                                                </div>
                                              )}
                                              {/* Cubase-style compact row: name/controls sidebar left of the waveform on tablet/desktop; on mobile the sidebar becomes a bar above the waveform instead (too narrow to sit side by side) */}
                                              <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-stretch">
                                                {/* Sidebar: name + transport controls, 2 compact lines */}
                                                <div
                                                  className="w-full sm:w-[190px] shrink-0 flex flex-col justify-center gap-1 px-2 py-1 sm:border-b-0 sm:border-r bg-[var(--sunken)]"
                                                  title={tr.instrumento || undefined}
                                                >
                                                  {/* Line 1: number badge (coloreado por familia de instrumento, guiño a Iris) + name + edit */}
                                                  <div className="flex items-center gap-1 min-w-0">
                                                    <span
                                                      className="w-4 h-4 rounded font-sans text-micro font-bold flex items-center justify-center shrink-0"
                                                      style={{
                                                        backgroundColor: getTrackRainbowColor(tr, idx, '30'),
                                                        borderColor: getTrackRainbowColor(tr, idx, '80'),
                                                        color: getTrackRainbowColor(tr, idx),
                                                      }}
                                                    >
                                                      {idx + 1}
                                                    </span>

                                                    {isEditing ? (
                                                      <div className="flex items-center gap-1 min-w-0 flex-1">
                                                        <Input
                                                          size="sm"
                                                          type="text"
                                                          value={editingTrackName}
                                                          onChange={(e) => setEditingTrackName(e.target.value)}
                                                          onKeyDown={(e) =>
                                                            e.key === 'Enter' && handleSaveTrackName(idea, tr.id, editingTrackName)
                                                          }
                                                          className="w-full min-w-0"
                                                          autoFocus
                                                        />
                                                        <IconButton
                                                          label="Confirmar"
                                                          size="icon-xs"
                                                          type="button"
                                                          onClick={() => handleSaveTrackName(idea, tr.id, editingTrackName)}
                                                          className="shrink-0"
                                                        >
                                                          <Check className="w-3 h-3" />
                                                        </IconButton>
                                                      </div>
                                                    ) : (
                                                      <div className="flex items-center gap-1 min-w-0 flex-1">
                                                        <span className="text-xs font-bold text-[var(--ink)] font-sans truncate">
                                                          {tr.nombre}
                                                        </span>
                                                        {esBase && (
                                                          <span className="px-1.5 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)] text-[var(--on-acc)] text-micro font-bold shrink-0">
                                                            Iris
                                                          </span>
                                                        )}
                                                        {!esBase && <IconButton
                                                          label="Editar nombre de pista"
                                                          type="button"
                                                          onClick={() => {
                                                            setEditingTrackId(tr.id);
                                                            setEditingTrackName(tr.nombre);
                                                          }}
                                                          className="shrink-0"
                                                        >
                                                          <Edit2 className="w-2.5 h-2.5" />
                                                        </IconButton>}
                                                      </div>
                                                    )}
                                                  </div>

                                                  {/* Line 2: M/S + volume + ajustes + delete */}
                                                  <div className="flex items-center gap-1">
                                                    <button
                                                      type="button"
                                                      onClick={() => handleToggleMuteTrack(idea, tr.id)}
                                                      className={`px-1.5 py-0.5 rounded text-micro font-sans font-bold cursor-pointer transition-ui shrink-0 ${
                                                        isMuted
                                                          ? 'bg-[var(--alert)] text-[var(--on-alert)] ring-1 ring-[var(--alert)]/50'
                                                          : 'bg-[var(--surface)]/80 text-[var(--ink-2)] /80 hover:text-[var(--ink)] hover:bg-[var(--surface)]/70'
                                                      }`}
                                                      title="Mute (M) - Silenciar pista"
                                                    >
                                                      M
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => handleToggleSoloTrack(idea, tr.id)}
                                                      className={`px-1.5 py-0.5 rounded text-micro font-sans font-bold cursor-pointer transition-ui shrink-0 ${
                                                        isSolo
                                                          ? 'bg-[var(--ink)] text-[var(--bg)] ring-1 ring-[var(--acc)]/60'
                                                          : 'bg-[var(--surface)]/80 text-[var(--ink-2)] /80 hover:text-[var(--ink)] hover:bg-[var(--surface)]/70'
                                                      }`}
                                                      title="Solo (S) - Aísla esta pista en exclusiva (Cubase style)"
                                                    >
                                                      S
                                                    </button>

                                                    {vol === 0 || isMuted ? (
                                                      <VolumeX className="w-2.5 h-2.5 text-[var(--alert)] shrink-0" />
                                                    ) : (
                                                      <Volume2 className="w-2.5 h-2.5 text-[var(--tentative)] shrink-0" />
                                                    )}
                                                    <input
                                                      type="range"
                                                      min={0}
                                                      max={1}
                                                      step={0.05}
                                                      value={isMuted ? 0 : vol}
                                                      onChange={(e) => handleTrackVolumeChange(idea, tr.id, parseFloat(e.target.value))}
                                                      className="flex-1 min-w-0 accent-indigo-500 h-1 bg-[var(--surface)] rounded cursor-pointer"
                                                      title={`Volumen: ${Math.round(vol * 100)}%`}
                                                    />

                                                    {/* Toggle Advanced Track Settings Drawer */}
                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        setExpandedTrackSettingsId(expandedTrackSettingsId === tr.id ? null : tr.id)
                                                      }
                                                      className={`relative p-1 rounded cursor-pointer transition-ui shrink-0 ${
                                                        expandedTrackSettingsId === tr.id
                                                          ? 'bg-[var(--tentative)]/30 text-[var(--ink)]'
                                                          : 'bg-[var(--ink)]/5 text-[var(--ink-2)] hover:bg-[var(--ink)]/10'
                                                      }`}
                                                      title={`Ajustes de Pista: Paneo, Ecualizador 3 Bandas y Ajuste de Latencia${(tr.desfaseMs || 0) !== 0 ? ` · ${formatDesfase(tr.desfaseMs)}` : ''}`}
                                                    >
                                                      <Sliders className="w-2.5 h-2.5 text-[var(--tentative)]/80" />
                                                      {(tr.desfaseMs || 0) !== 0 && (
                                                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-[var(--r-pill)] bg-[var(--acc)] ring-1 ring-[var(--ink)]" />
                                                      )}
                                                    </button>
                                                    {esBase && (
                                                      <IconButton
                                                        label="Quitar de la idea (la pista sigue en Iris)"
                                                        type="button"
                                                        onClick={() => {
                                                          const stemId = tr.id.slice(`base-${idea.id}-`.length);
                                                          const ideasNuevas = ideasConFondo(
                                                            song.audioIdeas || [],
                                                            idea.id,
                                                            (idea.sobrePistas ?? []).filter((x) => x !== stemId),
                                                          ).map((i) => {
                                                            if (i.id !== idea.id || !i.mezclaBase) return i;
                                                            const { [stemId]: _q, ...resto } = i.mezclaBase;
                                                            return { ...i, mezclaBase: resto };
                                                          });
                                                          const el = trackAudioRefs.current[tr.id];
                                                          if (el) el.pause();
                                                          onUpdateSong(cancionConIdeas(song, ideasNuevas));
                                                        }}
                                                        className="shrink-0"
                                                      >
                                                        <X className="w-3 h-3" />
                                                      </IconButton>
                                                    )}
                                                  </div>
                                                </div>

                                                {/* Waveform Visualizer: fills remaining width, height = row height */}
                                                <div className="w-full sm:flex-1 relative bg-[var(--sunken)]">
                                                  <WaveformTrack
                                                    ref={(el) => {
                                                      trackAudioRefs.current[tr.id] = el as HTMLAudioElement;
                                                    }}
                                                    audioUrl={resolvedAudioUrls[tr.id] || tr.audioUrl}
                                                    color={getTrackRainbowColor(tr, idx)}
                                                    masterDuration={duration || 30}
                                                    trackDuration={trackAudioRefs.current[tr.id]?.duration || durationMap[tr.id]}
                                                    currentTime={currentTime}
                                                    onSeekTrack={(seekSec) => handleSeekIdea(idea, seekSec)}
                                                    onTrackLoaded={(dur) => {
                                                      if (dur > 0 && isFinite(dur)) {
                                                        setDurationMap((prev) => {
                                                          const cur = prev[idea.id] || 0;
                                                          if (dur > cur)
                                                            return {
                                                              ...prev,
                                                              [idea.id]: dur,
                                                            };
                                                          return prev;
                                                        });
                                                      }
                                                    }}
                                                  />
                                                </div>
                                              </div>
                                            </div>

                                            {/* Collapsible Advanced Track Settings Drawer (Pan, EQ, Latency Nudge) */}
                                            {expandedTrackSettingsId === tr.id && (
                                              <div className="mt-1 p-3 rounded-[var(--r-m)] bg-[var(--tentative)]/5 space-y-3 font-sans text-micro text-[var(--tentative)]">
                                                {/* Row 1: Paneo Estéreo & Limpiar Zumbidos */}
                                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3/10 pb-2">
                                                  {/* Stereo Pan Slider */}
                                                  <div
                                                    className="flex items-center gap-2 flex-1 min-w-[200px]"
                                                    title={`Paneo: ${tr.pan ? (tr.pan < 0 ? `L ${Math.round(Math.abs(tr.pan) * 100)}%` : `R ${Math.round(tr.pan * 100)}%`) : 'Centro'}`}
                                                  >
                                                    <span className="text-[var(--ink-2)] font-bold shrink-0"><ShowIcon inline emoji="🎧" />Paneo Estéreo:</span>
                                                    <span className="text-micro font-bold text-[var(--ink-2)]">L</span>
                                                    <input
                                                      type="range"
                                                      min={-1}
                                                      max={1}
                                                      step={0.05}
                                                      value={tr.pan ?? 0}
                                                      onChange={(e) => handleTrackPanChange(idea, tr.id, parseFloat(e.target.value))}
                                                      className="w-full accent-purple-400 h-1 bg-[var(--sunken)] rounded cursor-pointer"
                                                    />
                                                    <span className="text-micro font-bold text-[var(--ink-2)]">R</span>
                                                    <span className="text-micro text-[var(--tentative)]/80 font-bold shrink-0 min-w-[36px] text-right">
                                                      {tr.pan
                                                        ? tr.pan < 0
                                                          ? `L${Math.round(Math.abs(tr.pan) * 100)}`
                                                          : `R${Math.round(tr.pan * 100)}`
                                                        : 'C'}
                                                    </span>
                                                  </div>

                                                  {/* Clean Noise Filter Button */}
                                                  {!esBase && <Button
                                                    variant={cleaningTrackId === tr.id ? "neutral" : "neutral"}
                                                    size="xs"
                                                    type="button"
                                                    onClick={() => handleCleanTrackAudio(idea, tr)}
                                                    disabled={cleaningTrackId === tr.id}
                                                    className="shrink-0 items-center gap-1"
                                                    title="Limpiar ruido de fondo y zumbidos de esta pista con Filtro Studio DSP (High-Pass 80Hz + Notch)"
                                                  >
                                                    <span>{cleaningTrackId === tr.id ? 'Limpiando...' : 'Filtro Zumbidos'}</span>
                                                  </Button>}
                                                </div>

                                                {/* Row 2: 3-Band EQ */}
                                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3/10 pb-2">
                                                  <span className="text-[var(--ink-2)] font-bold shrink-0"><ShowIcon inline emoji="🎛️" />Ecualizador:</span>

                                                  <div className="flex-1 flex flex-col gap-1">
                                                    <div className="flex justify-between items-center text-[var(--ink-2)] text-micro">
                                                      <span>Graves (100Hz)</span>
                                                      <span className="font-bold text-[var(--tentative)]/80">{tr.eqLow || 0}dB</span>
                                                    </div>
                                                    <input
                                                      type="range"
                                                      min={-12}
                                                      max={12}
                                                      step={1}
                                                      value={tr.eqLow ?? 0}
                                                      onChange={(e) => handleTrackEqChange(idea, tr.id, 'low', parseFloat(e.target.value))}
                                                      className="w-full accent-purple-400 h-1 bg-[var(--sunken)] rounded cursor-pointer"
                                                    />
                                                  </div>

                                                  <div className="flex-1 flex flex-col gap-1">
                                                    <div className="flex justify-between items-center text-[var(--ink-2)] text-micro">
                                                      <span>Medios (1kHz)</span>
                                                      <span className="font-bold text-[var(--tentative)]/80">{tr.eqMid || 0}dB</span>
                                                    </div>
                                                    <input
                                                      type="range"
                                                      min={-12}
                                                      max={12}
                                                      step={1}
                                                      value={tr.eqMid ?? 0}
                                                      onChange={(e) => handleTrackEqChange(idea, tr.id, 'mid', parseFloat(e.target.value))}
                                                      className="w-full accent-purple-400 h-1 bg-[var(--sunken)] rounded cursor-pointer"
                                                    />
                                                  </div>

                                                  <div className="flex-1 flex flex-col gap-1">
                                                    <div className="flex justify-between items-center text-[var(--ink-2)] text-micro">
                                                      <span>Agudos (8kHz)</span>
                                                      <span className="font-bold text-[var(--tentative)]/80">{tr.eqHigh || 0}dB</span>
                                                    </div>
                                                    <input
                                                      type="range"
                                                      min={-12}
                                                      max={12}
                                                      step={1}
                                                      value={tr.eqHigh ?? 0}
                                                      onChange={(e) => handleTrackEqChange(idea, tr.id, 'high', parseFloat(e.target.value))}
                                                      className="w-full accent-purple-400 h-1 bg-[var(--sunken)] rounded cursor-pointer"
                                                    />
                                                  </div>

                                                  {(tr.eqLow !== 0 || tr.eqMid !== 0 || tr.eqHigh !== 0) && (
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        handleTrackEqChange(idea, tr.id, 'low', 0);
                                                        handleTrackEqChange(idea, tr.id, 'mid', 0);
                                                        handleTrackEqChange(idea, tr.id, 'high', 0);
                                                      }}
                                                      className="px-1.5 py-0.5 rounded bg-[var(--alert)]/20 hover:bg-[var(--alert)]/30 text-[var(--ink)] font-bold text-micro cursor-pointer shrink-0 self-end sm:self-center"
                                                      title="Resetear EQ a 0dB"
                                                    >
                                                      Reset EQ
                                                    </button>
                                                  )}
                                                </div>

                                                {/* Row 3: Latency Nudge & Sync IA */}
                                                <div className="space-y-1.5">
                                                  <div className="flex items-center justify-between gap-2">
                                                    <span
                                                      className="text-[var(--acc)] font-bold flex items-center gap-1"
                                                      title="Ajuste fino de latencia en milisegundos (-adelantar/+atrasar)"
                                                    >
                                                      <ShowIcon inline emoji="⏱️" />Desfase de Latencia:{' '}
                                                      <span className="text-[var(--ink)]">{formatDesfase(tr.desfaseMs)}</span>
                                                    </span>

                                                    <div className="flex items-center gap-1">
                                                      {!esBase && <button
                                                        type="button"
                                                        onClick={() => handleAutoSyncTrackLatency(idea, tr)}
                                                        className="px-2 py-0.5 rounded bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--ink)] font-bold cursor-pointer transition-colors flex items-center gap-1 text-micro"
                                                        title="Sincronizar automáticamente por IA/DSP comparando las ondas de sonido de la mezcla"
                                                      >
                                                        <ShowIcon inline emoji="⚡" />Sync Auto IA
                                                      </button>}
                                                      {(tr.desfaseMs || 0) !== 0 && (
                                                        <button
                                                          type="button"
                                                          onClick={() => handleTrackDesfaseChange(idea, tr.id, 0)}
                                                          className="px-1.5 py-0.5 rounded bg-[var(--alert)]/20 hover:bg-[var(--alert)]/30 text-[var(--ink)] font-bold text-micro cursor-pointer"
                                                          title="Resetear desfase a 0ms"
                                                        >
                                                          Reset 0ms
                                                        </button>
                                                      )}
                                                    </div>
                                                  </div>

                                                  {/* Nudge Buttons & Slider */}
                                                  <div className="flex items-center gap-1 justify-between">
                                                    <div className="flex items-center gap-1">
                                                      <button
                                                        type="button"
                                                        onClick={() => handleTrackDesfaseChange(idea, tr.id, (tr.desfaseMs || 0) - 10)}
                                                        className="px-1.5 py-0.5 rounded bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--ink)] font-bold text-micro cursor-pointer"
                                                      >
                                                        -10ms
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() => handleTrackDesfaseChange(idea, tr.id, (tr.desfaseMs || 0) - 1)}
                                                        className="px-1.5 py-0.5 rounded bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--ink)] font-bold text-micro cursor-pointer"
                                                      >
                                                        -1ms
                                                      </button>
                                                    </div>

                                                    <input
                                                      type="range"
                                                      min={-500}
                                                      max={500}
                                                      step={1}
                                                      value={tr.desfaseMs || 0}
                                                      onChange={(e) => handleTrackDesfaseChange(idea, tr.id, Number(e.target.value))}
                                                      className="w-full max-w-xs h-1 bg-[var(--sunken)] rounded appearance-none cursor-pointer accent-amber-400 mx-2"
                                                      title="Deslizar para sincronizar desfase en tiempo real (-500ms a +500ms)"
                                                    />

                                                    <div className="flex items-center gap-1">
                                                      <button
                                                        type="button"
                                                        onClick={() => handleTrackDesfaseChange(idea, tr.id, (tr.desfaseMs || 0) + 1)}
                                                        className="px-1.5 py-0.5 rounded bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--ink)] font-bold text-micro cursor-pointer"
                                                      >
                                                        +1ms
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() => handleTrackDesfaseChange(idea, tr.id, (tr.desfaseMs || 0) + 10)}
                                                        className="px-1.5 py-0.5 rounded bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--ink)] font-bold text-micro cursor-pointer"
                                                      >
                                                        +10ms
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>

                                                {/* Row 4: Reordenar / Borrar pista — acciones ocasionales, fuera de
 la fila principal para que no se pulsen sin querer */}
                                                {!esBase && <div className="flex items-center justify-between/10 pt-2">
                                                  <div className="flex items-center gap-1">
                                                    <span className="text-[var(--ink-2)] font-bold mr-1">Orden:</span>
                                                    <IconButton
                                                      label="Subir pista"
                                                      type="button"
                                                      onClick={() => handleMoveTrack(idea, tr.id, 'up')}
                                                      disabled={idx === 0}
                                                    >
                                                      <ChevronUp className="w-3.5 h-3.5" />
                                                    </IconButton>
                                                    <IconButton
                                                      label="Bajar pista"
                                                      type="button"
                                                      onClick={() => handleMoveTrack(idea, tr.id, 'down')}
                                                      disabled={idx === tracks.length - 1}
                                                    >
                                                      <ChevronDown className="w-3.5 h-3.5" />
                                                    </IconButton>
                                                  </div>
                                                  <Button
                                                    variant="danger"
                                                    size="xs"
                                                    type="button"
                                                    onClick={() => handleDeleteTrack(idea, tr.id)}
                                                    className="items-center gap-1.5"
                                                  >
                                                    <X className="w-3 h-3" /> Borrar pista
                                                  </Button>
                                                </div>}
                                              </div>
                                            )}
                                          </div>
    </>
  );
}
