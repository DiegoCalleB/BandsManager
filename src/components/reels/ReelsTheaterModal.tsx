import React from 'react';
import { 
  X, Volume2, VolumeX, AlertCircle, Clock, ChevronLeft, ChevronRight,
  Film, CheckCircle2, Check, RefreshCw, ExternalLink, RotateCcw,
  Sparkles, Share2, Flame, Music
} from 'lucide-react';
import { ThemeColors } from '../../types';
import { getYouTubeId, parseRangeTimes, formatTime, SubtitleCue } from '../../utils/reelsUtils';
import { ShowIcon } from '../ui/ShowIcon';

export interface ReelsTheaterModalProps {
  isOpen: boolean;
  onClose: () => void;
  colors: ThemeColors;
  nombreBanda: string;
  instagramHandle?: string;
  bandName?: string;
  selectedPlatform: string;
  setSelectedPlatform: (p: any) => void;
  phoneDuration: string;
  inputType: 'youtube' | 'file';
  youtubeUrl: string;
  localVideoUrl: string | null;
  renderedClipUrl: string | null;
  renderedSubUrl: string | null;
  renderedBurnedSubs: boolean;
  renderedClipSize: number;
  renderedStoredPermanently: boolean;
  sinTranscripcionReal: boolean;
  subtitleCues: SubtitleCue[];
  currentSubtitleText: string;
  setCurrentSubtitleText: (text: string) => void;
  wordOffsets: any[];
  isPreviewMuted: boolean;
  setIsPreviewMuted: (muted: boolean) => void;
  showSafeZone: boolean;
  ytLoopCount: number;
  setYtLoopCount: React.Dispatch<React.SetStateAction<number>>;
  simulatedTime: number;
  setSimulatedTime: (time: number) => void;
  timelineDuration: number;
  highlights: any[];
  setHighlights: React.Dispatch<React.SetStateAction<any[]>>;
  selectedHighlightIndex: number;
  videoMeta?: any;
  editedCopy: string;
  setEditedCopy: React.Dispatch<React.SetStateAction<string>>;
  copySuccess: boolean;
  handleCopyToClipboard: (text: string) => void;
  copyForPlatform: (clip: any, plat: string) => string;
  // Cropping & physical cut
  cropMode: 'crop' | 'blur' | 'none';
  setCropMode: (mode: 'crop' | 'blur' | 'none') => void;
  burnSubtitles: boolean;
  setBurnSubtitles: React.Dispatch<React.SetStateAction<boolean>>;
  karaokeSubtitles: boolean;
  setKaraokeSubtitles: React.Dispatch<React.SetStateAction<boolean>>;
  isCuttingVideo: boolean;
  cuttingProgressText: string;
  cuttingError: string | null;
  handleCutPhysicalVideo: () => void;
  handleAdjustCrop: (action: 'start_minus' | 'start_plus' | 'end_minus' | 'end_plus') => void;
  setDraggingBoundary: (b: 'start' | 'end' | null) => void;
  // Scheduling
  scheduledDate: string;
  setScheduledDate: (date: string) => void;
  scheduledTime: string;
  setScheduledTime: (time: string) => void;
  optimalTime?: any;
  isScheduling: boolean;
  schedulingSuccess: boolean;
  scheduleErrors: string[];
  scheduleWarnings: string[];
  handleSchedulePost: (e: React.FormEvent) => void;
  platformIcons: Record<string, any[]>;
}

export const ReelsTheaterModal: React.FC<ReelsTheaterModalProps> = ({
  isOpen,
  onClose,
  nombreBanda,
  instagramHandle,
  bandName,
  selectedPlatform,
  setSelectedPlatform,
  phoneDuration,
  inputType,
  youtubeUrl,
  localVideoUrl,
  renderedClipUrl,
  renderedSubUrl,
  renderedBurnedSubs,
  renderedClipSize,
  renderedStoredPermanently,
  sinTranscripcionReal,
  subtitleCues,
  currentSubtitleText,
  setCurrentSubtitleText,
  wordOffsets,
  isPreviewMuted,
  setIsPreviewMuted,
  showSafeZone,
  ytLoopCount,
  setYtLoopCount,
  simulatedTime,
  setSimulatedTime,
  timelineDuration,
  highlights,
  setHighlights,
  selectedHighlightIndex,
  videoMeta,
  editedCopy,
  setEditedCopy,
  copySuccess,
  handleCopyToClipboard,
  copyForPlatform,
  cropMode,
  setCropMode,
  burnSubtitles,
  setBurnSubtitles,
  karaokeSubtitles,
  setKaraokeSubtitles,
  isCuttingVideo,
  cuttingProgressText,
  cuttingError,
  handleCutPhysicalVideo,
  handleAdjustCrop,
  setDraggingBoundary,
  scheduledDate,
  setScheduledDate,
  scheduledTime,
  setScheduledTime,
  optimalTime,
  isScheduling,
  schedulingSuccess,
  scheduleErrors,
  scheduleWarnings,
  handleSchedulePost,
  platformIcons
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-[var(--scrim)]/95 flex items-center justify-center p-2 sm:p-4 lg:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="w-full flex items-center justify-between pb-2 px-1 max-w-6xl mx-auto lg:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--ok)]" />
          <span className="text-xs font-mono font-bold text-[var(--ink)] ">Modo Cine · Reels</span>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-[var(--r-pill)] bg-[var(--sunken)] text-[var(--acc-ink)] hover:text-[var(--ink)] font-bold text-xs font-mono flex items-center gap-1.5 cursor-pointer "
        >
          <X className="w-4 h-4" /> <span>Cerrar</span>
        </button>
      </div>

      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl bg-[var(--sunken)] rounded-3xl flex flex-col lg:flex-row h-auto lg:h-[90vh] lg:max-h-[90vh] overflow-visible lg:overflow-hidden"
      >
        {/* Left Column: Big 9:16 phone mockup */}
        <div className="w-full lg:w-[460px] bg-[var(--sunken)]/80 p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-[var(--hair)] relative select-none shrink-0">
          <div className="absolute top-4 left-6 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--ok)]" />
            <span className="text-micro font-mono text-[var(--ink-2)] font-bold ">MODO CINE ACTIVO</span>
          </div>

          <button
            id="btn-close-theater-mobile"
            onClick={onClose}
            className="absolute top-3 right-4 z-50 p-2.5 rounded-full bg-[var(--sunken)]/80 hover:bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-ui cursor-pointer lg:hidden"
            title="Cerrar modo cine"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Physical phone mock wrapper */}
          <div className="relative w-full max-w-[320px] aspect-[9/16] rounded-[36px] overflow-hidden bg-[var(--sunken)] shadow-black flex flex-col justify-between p-4 pt-10 pb-5">
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-4 rounded-full bg-[var(--surface)] z-20 flex items-center justify-center">
              <div className="w-8 h-1 rounded-full bg-[var(--sunken)]" />
            </div>

            {/* Video / Player */}
            {inputType === 'youtube' && getYouTubeId(youtubeUrl) ? (
              (() => {
                const { start, end } = parseRangeTimes(phoneDuration);
                if (renderedClipUrl) {
                  return (
                    <div className="absolute inset-0 z-0 overflow-hidden bg-[var(--sunken)]">
                      <video
                        key={`expanded-rendered-${renderedClipUrl}-${isPreviewMuted ? 'muted' : 'unmuted'}`}
                        src={renderedClipUrl}
                        autoPlay
                        muted={isPreviewMuted}
                        loop
                        controls
                        playsInline
                        className="absolute w-full h-full object-cover"
                        onTimeUpdate={(e) => {
                          const video = e.currentTarget;
                          const cur = video.currentTime;
                          if (subtitleCues && subtitleCues.length > 0) {
                            const activeCue = subtitleCues.find(cue => cur >= cue.start && cur <= cue.end);
                            setCurrentSubtitleText(activeCue ? activeCue.text : '');
                          }
                        }}
                      >
                        {renderedSubUrl && (
                          <track
                            src={renderedSubUrl}
                            kind="subtitles"
                            srcLang="es"
                            label="Español"
                            default
                          />
                        )}
                      </video>

                      {currentSubtitleText && !renderedBurnedSubs && (
                        <div className="absolute bottom-20 left-3 right-3 z-40 bg-[var(--scrim)]/80 px-2 py-1.5 rounded-xl text-center bg-[var(--acc)]/10">
                          <span className="text-micro font-sans font-bold text-[var(--acc-ink)] leading-tight">
                            <ShowIcon inline emoji="✨" />{currentSubtitleText} <ShowIcon inline emoji="✨" />
                          </span>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="absolute inset-0 z-0 overflow-hidden bg-[var(--sunken)]">
                    <iframe
                      key={`expanded-yt-${getYouTubeId(youtubeUrl)}-${start}-${end}-${isPreviewMuted ? 'muted' : 'unmuted'}-${ytLoopCount}`}
                      src={`https://www.youtube.com/embed/${getYouTubeId(youtubeUrl)}?start=${start}&end=${end}&autoplay=1&mute=${isPreviewMuted ? 1 : 0}&controls=1&modestbranding=1&loop=1&playlist=${getYouTubeId(youtubeUrl)}&showinfo=0&rel=0&iv_load_policy=3`}
                      className="absolute w-[280%] h-full left-1/2 -translate-x-1/2 object-cover"
                      allow="autoplay; encrypted-media; picture-in-picture"
                      title="Expanded Highlight Video Player"
                      style={{ border: 0 }}
                    />
                  </div>
                );
              })()
            ) : inputType === 'file' && localVideoUrl ? (
              <div className="absolute inset-0 z-0 overflow-hidden bg-[var(--sunken)]">
                <video
                  key={`expanded-file-${localVideoUrl}-${isPreviewMuted ? 'muted' : 'unmuted'}`}
                  src={localVideoUrl}
                  autoPlay
                  muted={isPreviewMuted}
                  loop
                  controls
                  playsInline
                  className="absolute w-full h-full object-cover"
                  onTimeUpdate={(e) => {
                    const video = e.currentTarget;
                    const { start, end } = parseRangeTimes(phoneDuration);
                    if (end > start) {
                      if (video.currentTime < start) video.currentTime = start;
                      if (video.currentTime >= end) {
                        video.currentTime = start;
                        video.play().catch(() => {});
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <div className="absolute inset-0 z-0 bg-[var(--surface)] flex flex-col items-center justify-center p-4">
                <AlertCircle className="w-8 h-8 text-[var(--ink-2)] mb-2" />
                <span className="text-xs font-mono text-[var(--ink-2)]">No hay vídeo cargado</span>
              </div>
            )}

            <div className="absolute inset-0 from-black/50 via-transparent to-black/85 pointer-events-none z-10" />

            {/* Platform overlay icons */}
            {platformIcons[selectedPlatform] && (
              <div className="absolute right-2 bottom-24 z-20 flex flex-col gap-3 items-center pointer-events-none">
                {platformIcons[selectedPlatform].map((Icon, idx) => (
                  <div key={idx} className="w-7 h-7 rounded-full bg-[var(--scrim)]/35 flex items-center justify-center text-[var(--ink)]">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                ))}
              </div>
            )}

            {/* Video Info Overlays inside the phone */}
            <div className="z-10 flex justify-between items-center">
              <span className="text-micro font-mono text-[var(--acc-ink)] font-extrabold bg-[var(--scrim)]/40 py-1 px-2 rounded-full ">
                Clip #{selectedHighlightIndex + 1}
              </span>
              <div className="flex gap-1 items-center bg-[var(--scrim)]/40 py-1 px-2 rounded-full ">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--alert)] animate-ping" />
                <span className="text-micro font-mono text-[var(--alert)] font-bold">1080P HD</span>
              </div>
            </div>

            <div className="z-10 space-y-2 mt-auto text-left">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[var(--acc)]/20 flex items-center justify-center text-micro font-mono font-bold text-[var(--acc-ink)]">{nombreBanda.charAt(0).toUpperCase()}</span>
                <div>
                  <span className="text-micro font-bold text-[var(--ink)] block truncate max-w-[120px]">{instagramHandle || nombreBanda}</span>
                  <span className="text-micro font-mono text-[var(--ink-2)] block truncate max-w-[120px]">{nombreBanda}</span>
                </div>
              </div>

              {highlights[selectedHighlightIndex] && (
                <h4 className="text-micro text-[var(--ink)] font-bold line-clamp-1">
                  <ShowIcon inline emoji="🎬" />{highlights[selectedHighlightIndex]?.title}
                </h4>
              )}

              <p className="text-micro text-[var(--ink)] line-clamp-3 leading-normal font-sans">
                {editedCopy || (highlights[selectedHighlightIndex]?.recommendedCopy || '')}
              </p>

              <div className="flex items-center gap-1 text-micro font-mono bg-[var(--scrim)]/60 text-[var(--acc-ink)] py-1 px-2 rounded-full max-w-[150px] truncate">
                <Music className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">{videoMeta?.title || `Audio original · ${nombreBanda}`}</span>
              </div>
            </div>

          </div>

          {/* Sound Toggle */}
          <div className="mt-4 flex items-center gap-2">
            <button
              id="expanded-mute-btn"
              onClick={() => setIsPreviewMuted(!isPreviewMuted)}
              className="flex items-center gap-2 px-4 py-2 rounded-[var(--r-pill)] bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-neutral-850 active:scale-[0.97] transition-ui cursor-pointer select-none text-xs font-mono font-bold"
            >
              {isPreviewMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-[var(--alert)]" />
                  <span>Activar Audio</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-[var(--ok)]" />
                  <span>Silenciar Audio</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Information, Copy Editor & Scheduler */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between overflow-y-visible lg:overflow-y-auto bg-[var(--surface)] text-left">
          
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded text-micro font-mono font-extrabold bg-[var(--acc)]/15 text-[var(--acc-ink)] ">
                    Highlight de Alto Impacto
                  </span>
                  <span className="px-2 py-0.5 rounded text-micro font-mono font-extrabold bg-[var(--acc)]/15 text-[var(--acc-ink)] ">
                    {highlights[selectedHighlightIndex]?.range || 'N/D'}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-[var(--ink)] font-sans ">
                  {highlights[selectedHighlightIndex]?.title || 'Clip sin título'}
                </h2>
              </div>
              
              <button
                id="btn-close-theater"
                onClick={onClose}
                className="p-2 rounded-[var(--r-pill)] bg-[var(--sunken)]/50 hover:bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-ui cursor-pointer"
                title="Cerrar modo cine"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Virality Card & Reason */}
            <div className="p-4 rounded-2xl bg-[var(--sunken)]/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-micro font-mono text-[var(--ink-2)] block">Por qué este momento es viral</span>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed max-w-xl">
                  {highlights[selectedHighlightIndex]?.description || 'La IA está analizando los ganchos emocionales de este intervalo.'}
                </p>
              </div>
              
              <div className="flex items-center gap-3 shrink-0 bg-[var(--sunken)] p-3 rounded-xl ">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <span className="text-xs font-mono font-extrabold text-[var(--ink)]">
                    {highlights[selectedHighlightIndex]?.virality || 95}%
                  </span>
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-[var(--acc-ink)] fill-[var(--acc)]" />
                    <span className="text-xs font-bold text-[var(--ink)]">Viralidad</span>
                  </div>
                  <span className="text-micro font-mono text-[var(--acc-ink)] block font-bold">POTENCIAL MÁXIMO</span>
                </div>
              </div>
            </div>

            {/* Interactive Crop Timeline */}
            {highlights[selectedHighlightIndex] && (() => {
              const { start, end, duration } = parseRangeTimes(highlights[selectedHighlightIndex]?.range);
              if (duration > 0) {
                const totalDuration = timelineDuration;
                const startPct = (start / totalDuration) * 100;
                const endPct = (end / totalDuration) * 100;
                const activeWidth = endPct - startPct;
                const playheadPct = ((start + simulatedTime) / totalDuration) * 100;

                const updateCropTimes = (newStart: number, newEnd: number) => {
                  const finalStart = Math.max(0, newStart);
                  const finalEnd = Math.max(finalStart + 1, newEnd);
                  
                  const formatSecsToMMSS = (totalSecs: number) => {
                    const mins = Math.floor(totalSecs / 60);
                    const secs = totalSecs % 60;
                    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                  };

                  const newRange = `${formatSecsToMMSS(finalStart)}-${formatSecsToMMSS(finalEnd)}`;
                  
                  setHighlights(prev => prev.map((clip, index) => 
                    index === selectedHighlightIndex ? { ...clip, range: newRange } : clip
                  ));
                  setSimulatedTime(0);
                  setYtLoopCount(c => c + 1);
                };

                const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const clickPct = clickX / rect.width;
                  const targetSeconds = Math.round(clickPct * totalDuration);

                  const distToStart = Math.abs(targetSeconds - start);
                  const distToEnd = Math.abs(targetSeconds - end);

                  let newStart = start;
                  let newEnd = end;

                  if (targetSeconds < start) {
                    newStart = targetSeconds;
                  } else if (targetSeconds > end) {
                    newEnd = targetSeconds;
                  } else {
                    if (distToStart < distToEnd) newStart = Math.min(targetSeconds, end - 1);
                    else newEnd = Math.max(targetSeconds, start + 1);
                  }
                  updateCropTimes(newStart, newEnd);
                };

                return (
                  <div className="p-5 rounded-2xl bg-[var(--sunken)]/60 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[var(--acc-ink)]" />
                        <span className="text-xs font-mono font-extrabold text-[var(--ink-2)] ">
                          Línea de Tiempo Interactiva
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-micro font-mono font-bold bg-[var(--acc)]/10 text-[var(--acc-ink)]">
                        REPRODUCIENDO CROP
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-micro text-[var(--ink-2)] font-mono flex justify-between px-1">
                        <span>00:00</span>
                        <span>{formatTime(totalDuration)}</span>
                      </div>

                      <div 
                        id="interactive-timeline-container"
                        onClick={handleTimelineClick}
                        className="relative w-full h-10 bg-[var(--sunken)] rounded-xl overflow-hidden flex items-center cursor-pointer group"
                      >
                        <div 
                          className="absolute top-1 bottom-1 bg-[var(--acc)]/20 rounded-md flex items-center justify-between px-2"
                          style={{ left: `${startPct}%`, width: `${activeWidth}%` }}
                        >
                          <span className="text-micro font-mono text-[var(--acc-ink)] font-extrabold">START</span>
                          <span className="text-micro font-mono text-[var(--acc-ink)]">Recorte ({duration}s)</span>
                          <span className="text-micro font-mono text-[var(--acc-ink)] font-extrabold">END</span>
                        </div>

                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-[var(--alert)] z-20"
                          style={{ left: `${playheadPct}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-micro font-mono text-[var(--ink-2)] px-1">
                        <span><ShowIcon inline emoji="⏱️" />Inicio: <strong className="text-[var(--ink)] font-bold">{formatTime(start)}</strong></span>
                        <span className="text-[var(--acc-ink)] bg-[var(--acc)]/10 px-2.5 py-0.5 rounded-full font-bold">
                          Duración: {duration} segundos
                        </span>
                        <span><ShowIcon inline emoji="⏱️" />Fin: <strong className="text-[var(--ink)] font-bold">{formatTime(end)}</strong></span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--hair)]">
                      <div className="space-y-1.5 text-left">
                        <span className="text-micro font-mono text-[var(--ink-2)] font-extrabold block"><ShowIcon inline emoji="⬅️" />Ajustar Inicio</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleAdjustCrop('start_minus')}
                            className="flex-1 px-3 py-2 rounded-[var(--r-pill)] bg-[var(--sunken)] text-xs font-mono font-bold text-[var(--ink-2)] flex items-center justify-center gap-1 cursor-pointer hover:bg-[var(--sunken)]"
                          >
                            <ChevronLeft className="w-4 h-4 text-[var(--ok)]" />
                            <span>-1s</span>
                          </button>
                          <button
                            type="button"
                            disabled={start >= end - 1}
                            onClick={() => handleAdjustCrop('start_plus')}
                            className="flex-1 px-3 py-2 rounded-[var(--r-pill)] bg-[var(--sunken)] text-xs font-mono font-bold text-[var(--ink-2)] flex items-center justify-center gap-1 disabled:opacity-30 cursor-pointer hover:bg-[var(--sunken)]"
                          >
                            <span>+1s</span>
                            <ChevronRight className="w-4 h-4 text-[var(--acc-ink)]" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-left">
                        <span className="text-micro font-mono text-[var(--ink-2)] font-extrabold block"><ShowIcon inline emoji="➡️" />Ajustar Fin</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={end <= start + 1}
                            onClick={() => handleAdjustCrop('end_minus')}
                            className="flex-1 px-3 py-2 rounded-[var(--r-pill)] bg-[var(--sunken)] text-xs font-mono font-bold text-[var(--ink-2)] flex items-center justify-center gap-1 disabled:opacity-30 cursor-pointer hover:bg-[var(--sunken)]"
                          >
                            <ChevronLeft className="w-4 h-4 text-[var(--acc-ink)]" />
                            <span>-1s</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustCrop('end_plus')}
                            className="flex-1 px-3 py-2 rounded-[var(--r-pill)] bg-[var(--sunken)] text-xs font-mono font-bold text-[var(--ink-2)] flex items-center justify-center gap-1 cursor-pointer hover:bg-[var(--sunken)]"
                          >
                            <span>+1s</span>
                            <ChevronRight className="w-4 h-4 text-[var(--ok)]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Physical Cut & Render Actions */}
            {highlights[selectedHighlightIndex] && youtubeUrl && (
              <div className="p-5 rounded-2xl bg-[var(--sunken)]/60 space-y-4">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-[var(--ok)] shrink-0" />
                  <span className="text-xs font-mono font-extrabold text-[var(--ink-2)] ">
                    Generador de Reel Físico y Subtítulos (9:16)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <span className="block text-micro font-mono text-[var(--ink-2)] ">Encuadre vertical</span>
                    <div className="grid grid-cols-3 gap-1">
                      {([
                        { valor: 'crop' as const, etiqueta: 'Recortar' },
                        { valor: 'blur' as const, etiqueta: 'Fondo blur' },
                        { valor: 'none' as const, etiqueta: 'Original' }
                      ]).map(opcion => (
                        <button
                          key={opcion.valor}
                          type="button"
                          onClick={() => setCropMode(opcion.valor)}
                          disabled={isCuttingVideo}
                          className={`px-2 py-1.5 rounded-[var(--r-pill)] text-micro font-mono font-bold cursor-pointer transition-ui ${
                            cropMode === opcion.valor
                              ? 'bg-[var(--acc)] text-[var(--on-acc)]'
                              : 'bg-[var(--sunken)] text-[var(--ink-2)]'
                          }`}
                        >
                          {opcion.etiqueta}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="block text-micro font-mono text-[var(--ink-2)] ">Subtítulos</span>
                    <button
                      type="button"
                      onClick={() => setBurnSubtitles(v => !v)}
                      disabled={isCuttingVideo}
                      className={`w-full px-3 py-1.5 rounded-lg text-micro font-mono font-bold cursor-pointer flex items-center justify-center gap-2 transition-ui ${
                        burnSubtitles
                          ? 'bg-[var(--ok)]/15 text-[var(--ok)]'
                          : 'bg-[var(--sunken)] text-[var(--ink-2)]'
                      }`}
                    >
                      {burnSubtitles ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5 opacity-40" />}
                      <span>{burnSubtitles ? 'Incrustados en el vídeo' : 'Solo pista .vtt'}</span>
                    </button>
                  </div>
                </div>

                {isCuttingVideo ? (
                  <div className="bg-[var(--sunken)]/80 p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="w-5 h-5 text-[var(--acc-ink)] animate-spin" />
                      <span className="text-xs font-mono font-extrabold text-[var(--ink)]">
                        RENDERIZANDO ARCHIVOS...
                      </span>
                    </div>
                    <p className="text-xs text-[var(--acc-ink)] font-mono pl-8">
                      <ShowIcon inline emoji="⚡" />{cuttingProgressText}
                    </p>
                  </div>
                ) : renderedClipUrl ? (
                  <div className="bg-[var(--ok)]/20 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-[var(--ok)] shrink-0" />
                        <span className="text-xs font-mono font-extrabold text-[var(--ok)] ">
                          ¡Reel Renderizado con Éxito!
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <a
                        href={renderedClipUrl}
                        download={`reel-${highlights[selectedHighlightIndex]?.range || 'clip'}.mp4`}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--sunken)] text-xs font-mono font-bold text-[var(--acc-ink)] flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Descargar MP4</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleCutPhysicalVideo}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs text-[var(--ink)] flex items-center justify-center gap-2 cursor-pointer transition-ui"
                  >
                    <Sparkles className="w-4 h-4 text-[var(--ink)] fill-[var(--ink-3)]" />
                    <span>Renderizar Reel Físico + Auto-Subtítulos (9:16)</span>
                  </button>
                )}
              </div>
            )}

            {/* Copy Editor Area */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono font-bold text-[var(--ink-2)] ">
                  <ShowIcon inline emoji="📝" />Copy de Publicación
                </label>
                <button
                  type="button"
                  onClick={() => handleCopyToClipboard(editedCopy || '')}
                  className="text-xs font-mono text-[var(--acc-ink)] hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0"
                >
                  {copySuccess ? <Check className="w-3.5 h-3.5 text-[var(--ok)]" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copySuccess ? '¡Copiado!' : 'Copiar texto'}</span>
                </button>
              </div>
              <textarea
                value={editedCopy}
                onChange={(e) => setEditedCopy(e.target.value)}
                rows={5}
                placeholder="Escribe el copy para tus redes..."
                className="w-full text-xs font-sans bg-[var(--sunken)] rounded-xl p-3 text-[var(--ink)] focus:outline-none"
              />
            </div>

            {/* Scheduling controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[var(--sunken)]/30 ">
              <div>
                <label className="block text-micro font-mono text-[var(--ink-2)] mb-1 font-bold">Plataforma</label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => {
                    const nueva = e.target.value;
                    setSelectedPlatform(nueva);
                    setEditedCopy(copyForPlatform(highlights[selectedHighlightIndex], nueva));
                  }}
                  className="w-full text-xs font-mono bg-[var(--sunken)] rounded-lg p-2 text-[var(--ink)]"
                >
                  <option value="Instagram">Instagram Reel</option>
                  <option value="TikTok">TikTok Video</option>
                  <option value="YouTube">YouTube Shorts</option>
                  <option value="Facebook">Facebook</option>
                </select>
              </div>

              <div>
                <label className="block text-micro font-mono text-[var(--ink-2)] mb-1 font-bold">Fecha</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full text-xs font-mono bg-[var(--sunken)] rounded-lg p-2 text-[var(--ink)]"
                />
              </div>

              <div>
                <label className="block text-micro font-mono text-[var(--ink-2)] mb-1 font-bold">Hora</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full text-xs font-mono bg-[var(--sunken)] rounded-lg p-2 text-[var(--ink)]"
                />
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="mt-6 pt-4 border-t border-[var(--hair)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              {schedulingSuccess ? (
                <span className="text-[var(--ok)] text-xs font-bold font-mono">¡Clip programado con éxito!</span>
              ) : (
                <span className="text-micro font-mono text-[var(--ink-2)]">Se sincroniza con el calendario</span>
              )}
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-[var(--ink-2)] hover:text-[var(--ink)] text-xs font-mono font-bold cursor-pointer"
              >
                Salir
              </button>

              <button
                type="button"
                onClick={(e) => handleSchedulePost(e)}
                disabled={isScheduling || !editedCopy.trim()}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-[var(--r-pill)] bg-[var(--acc)] text-[var(--on-acc)] font-bold hover:bg-[var(--acc)] active:scale-[0.97] transition-ui text-xs font-mono cursor-pointer disabled:opacity-40"
              >
                {isScheduling ? 'Guardando...' : 'Aprobar y Programar Post'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
