import React from 'react';
import { 
  X, Volume2, VolumeX, AlertCircle, Clock, ChevronLeft, ChevronRight,
  Film, CheckCircle2, Check, RefreshCw, ExternalLink, RotateCcw,
  Sparkles, Share2, Flame, Music
} from 'lucide-react';
import { ThemeColors } from '../../types';
import { getYouTubeId, parseRangeTimes, formatTime, SubtitleCue } from '../../utils/reelsUtils';

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
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 lg:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="w-full flex items-center justify-between pb-2 px-1 max-w-6xl mx-auto lg:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">Modo Cine · Reels</span>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-xl bg-neutral-800 text-amber-400 hover:text-white font-bold text-xs font-mono flex items-center gap-1.5 cursor-pointer border border-neutral-700"
        >
          <X className="w-4 h-4" /> <span>Cerrar</span>
        </button>
      </div>

      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col lg:flex-row h-auto lg:h-[90vh] lg:max-h-[90vh] overflow-visible lg:overflow-hidden"
      >
        {/* Left Column: Big 9:16 phone mockup */}
        <div className="w-full lg:w-[460px] bg-neutral-950/80 p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-neutral-800 relative select-none shrink-0">
          <div className="absolute top-4 left-6 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider">MODO CINE ACTIVO</span>
          </div>

          <button
            id="btn-close-theater-mobile"
            onClick={onClose}
            className="absolute top-3 right-4 z-50 p-2.5 rounded-full bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white transition-all cursor-pointer lg:hidden"
            title="Cerrar modo cine"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Physical phone mock wrapper */}
          <div className="relative w-full max-w-[320px] aspect-[9/16] rounded-[36px] overflow-hidden border border-neutral-700/80 bg-black shadow-inner shadow-black flex flex-col justify-between p-4 pt-10 pb-5">
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-4 rounded-full bg-neutral-900 border border-neutral-800/50 z-20 flex items-center justify-center">
              <div className="w-8 h-1 rounded-full bg-neutral-700" />
            </div>

            {/* Video / Player */}
            {inputType === 'youtube' && getYouTubeId(youtubeUrl) ? (
              (() => {
                const { start, end } = parseRangeTimes(phoneDuration);
                if (renderedClipUrl) {
                  return (
                    <div className="absolute inset-0 z-0 overflow-hidden bg-black">
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
                        <div className="absolute bottom-20 left-3 right-3 z-40 bg-black/80 px-2 py-1.5 rounded-xl border border-amber-500/40 text-center backdrop-blur-sm shadow-xl">
                          <span className="text-[10px] font-sans font-black tracking-wide text-amber-300 uppercase leading-tight">
                            ✨ {currentSubtitleText} ✨
                          </span>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="absolute inset-0 z-0 overflow-hidden bg-black">
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
              <div className="absolute inset-0 z-0 overflow-hidden bg-black">
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
              <div className="absolute inset-0 z-0 bg-neutral-900 flex flex-col items-center justify-center p-4">
                <AlertCircle className="w-8 h-8 text-neutral-600 mb-2" />
                <span className="text-xs font-mono text-neutral-500">No hay vídeo cargado</span>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/85 pointer-events-none z-10" />

            {/* Platform overlay icons */}
            {platformIcons[selectedPlatform] && (
              <div className="absolute right-2 bottom-24 z-20 flex flex-col gap-3 items-center pointer-events-none">
                {platformIcons[selectedPlatform].map((Icon, idx) => (
                  <div key={idx} className="w-7 h-7 rounded-full bg-black/35 backdrop-blur-sm flex items-center justify-center text-white/85">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                ))}
              </div>
            )}

            {/* Video Info Overlays inside the phone */}
            <div className="z-10 flex justify-between items-center">
              <span className="text-[8px] font-mono text-amber-400 font-extrabold tracking-widest bg-black/40 py-1 px-2 rounded-full border border-white/5 uppercase">
                Clip #{selectedHighlightIndex + 1}
              </span>
              <div className="flex gap-1 items-center bg-black/40 py-1 px-2 rounded-full border border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                <span className="text-[8px] font-mono text-red-400 font-bold">1080P HD</span>
              </div>
            </div>

            <div className="z-10 space-y-2 mt-auto text-left">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full border border-amber-500/40 bg-amber-500/20 flex items-center justify-center text-[8px] font-mono font-bold text-amber-300">{nombreBanda.charAt(0).toUpperCase()}</span>
                <div>
                  <span className="text-[9px] font-bold text-white block truncate max-w-[120px]">{instagramHandle || nombreBanda}</span>
                  <span className="text-[7px] font-mono text-neutral-400 block truncate max-w-[120px]">{nombreBanda}</span>
                </div>
              </div>

              {highlights[selectedHighlightIndex] && (
                <h4 className="text-[10px] text-neutral-100 font-bold line-clamp-1">
                  🎬 {highlights[selectedHighlightIndex]?.title}
                </h4>
              )}

              <p className="text-[9px] text-neutral-200 line-clamp-3 leading-normal font-sans">
                {editedCopy || (highlights[selectedHighlightIndex]?.recommendedCopy || '')}
              </p>

              <div className="flex items-center gap-1 text-[8px] font-mono bg-black/60 text-amber-300 border border-neutral-800/50 py-1 px-2 rounded-full max-w-[150px] truncate">
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
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 hover:bg-neutral-850 active:scale-95 transition-all cursor-pointer shadow-lg select-none text-xs font-mono font-bold"
            >
              {isPreviewMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-red-400 animate-pulse" />
                  <span>Activar Audio</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span>Silenciar Audio</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Information, Copy Editor & Scheduler */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between overflow-y-visible lg:overflow-y-auto bg-neutral-900 text-left">
          
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30 tracking-wider">
                    Highlight de Alto Impacto
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase bg-sky-500/15 text-sky-400 border border-sky-500/20 tracking-wider">
                    {highlights[selectedHighlightIndex]?.range || 'N/D'}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white font-sans tracking-tight">
                  {highlights[selectedHighlightIndex]?.title || 'Clip sin título'}
                </h2>
              </div>
              
              <button
                id="btn-close-theater"
                onClick={onClose}
                className="p-2 rounded-xl bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/50 text-neutral-400 hover:text-white transition-all cursor-pointer"
                title="Cerrar modo cine"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Virality Card & Reason */}
            <div className="p-4 rounded-2xl bg-neutral-950/50 border border-neutral-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">Por qué este momento es viral</span>
                <p className="text-xs text-neutral-300 leading-relaxed max-w-xl">
                  {highlights[selectedHighlightIndex]?.description || 'La IA está analizando los ganchos emocionales de este intervalo.'}
                </p>
              </div>
              
              <div className="flex items-center gap-3 shrink-0 bg-neutral-900 p-3 rounded-xl border border-neutral-800">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <span className="text-[11px] font-mono font-extrabold text-white">
                    {highlights[selectedHighlightIndex]?.virality || 95}%
                  </span>
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-bold text-white">Viralidad</span>
                  </div>
                  <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest block font-bold">POTENCIAL MÁXIMO</span>
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
                  <div className="p-5 rounded-2xl bg-neutral-950/60 border border-neutral-800/85 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-mono font-extrabold uppercase text-neutral-300 tracking-wider">
                          Línea de Tiempo Interactiva
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                        REPRODUCIENDO CROP
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[10px] text-neutral-400 font-mono flex justify-between px-1">
                        <span>00:00</span>
                        <span>{formatTime(totalDuration)}</span>
                      </div>

                      <div 
                        id="interactive-timeline-container"
                        onClick={handleTimelineClick}
                        className="relative w-full h-10 bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 flex items-center cursor-pointer group"
                      >
                        <div 
                          className="absolute top-1 bottom-1 bg-amber-500/20 border border-amber-500 rounded-md flex items-center justify-between px-2"
                          style={{ left: `${startPct}%`, width: `${activeWidth}%` }}
                        >
                          <span className="text-[8px] font-mono text-amber-300 font-extrabold">START</span>
                          <span className="text-[8px] font-mono text-amber-200">Recorte ({duration}s)</span>
                          <span className="text-[8px] font-mono text-amber-300 font-extrabold">END</span>
                        </div>

                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                          style={{ left: `${playheadPct}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[10px] font-mono text-neutral-400 px-1">
                        <span>⏱️ Inicio: <strong className="text-white font-bold">{formatTime(start)}</strong></span>
                        <span className="text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full font-bold">
                          Duración: {duration} segundos
                        </span>
                        <span>⏱️ Fin: <strong className="text-white font-bold">{formatTime(end)}</strong></span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-850">
                      <div className="space-y-1.5 text-left">
                        <span className="text-[10.5px] font-mono text-neutral-400 font-extrabold uppercase tracking-wider block">⬅️ Ajustar Inicio</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleAdjustCrop('start_minus')}
                            className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono font-bold text-neutral-300 flex items-center justify-center gap-1 cursor-pointer hover:bg-neutral-800"
                          >
                            <ChevronLeft className="w-4 h-4 text-emerald-400" />
                            <span>-1s</span>
                          </button>
                          <button
                            type="button"
                            disabled={start >= end - 1}
                            onClick={() => handleAdjustCrop('start_plus')}
                            className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono font-bold text-neutral-300 flex items-center justify-center gap-1 disabled:opacity-30 cursor-pointer hover:bg-neutral-800"
                          >
                            <span>+1s</span>
                            <ChevronRight className="w-4 h-4 text-amber-500" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-left">
                        <span className="text-[10.5px] font-mono text-neutral-400 font-extrabold uppercase tracking-wider block">➡️ Ajustar Fin</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={end <= start + 1}
                            onClick={() => handleAdjustCrop('end_minus')}
                            className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono font-bold text-neutral-300 flex items-center justify-center gap-1 disabled:opacity-30 cursor-pointer hover:bg-neutral-800"
                          >
                            <ChevronLeft className="w-4 h-4 text-amber-500" />
                            <span>-1s</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustCrop('end_plus')}
                            className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono font-bold text-neutral-300 flex items-center justify-center gap-1 cursor-pointer hover:bg-neutral-800"
                          >
                            <span>+1s</span>
                            <ChevronRight className="w-4 h-4 text-emerald-400" />
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
              <div className="p-5 rounded-2xl bg-neutral-950/60 border border-neutral-800/85 space-y-4">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-mono font-extrabold uppercase text-neutral-300 tracking-wider">
                    Generador de Reel Físico y Subtítulos (9:16)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <span className="block text-[9px] font-mono uppercase text-neutral-500 tracking-wider">Encuadre vertical</span>
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
                          className={`px-2 py-1.5 rounded-lg text-[9.5px] font-mono font-bold cursor-pointer transition-all ${
                            cropMode === opcion.valor
                              ? 'bg-amber-400 text-neutral-950'
                              : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
                          }`}
                        >
                          {opcion.etiqueta}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="block text-[9px] font-mono uppercase text-neutral-500 tracking-wider">Subtítulos</span>
                    <button
                      type="button"
                      onClick={() => setBurnSubtitles(v => !v)}
                      disabled={isCuttingVideo}
                      className={`w-full px-3 py-1.5 rounded-lg text-[9.5px] font-mono font-bold cursor-pointer flex items-center justify-center gap-2 transition-all ${
                        burnSubtitles
                          ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                          : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
                      }`}
                    >
                      {burnSubtitles ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5 opacity-40" />}
                      <span>{burnSubtitles ? 'Incrustados en el vídeo' : 'Solo pista .vtt'}</span>
                    </button>
                  </div>
                </div>

                {isCuttingVideo ? (
                  <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800 space-y-3 animate-pulse">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
                      <span className="text-xs font-mono font-extrabold text-neutral-200">
                        RENDERIZANDO ARCHIVOS...
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-300 font-mono pl-8">
                      ⚡ {cuttingProgressText}
                    </p>
                  </div>
                ) : renderedClipUrl ? (
                  <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span className="text-xs font-mono font-extrabold text-emerald-200 uppercase tracking-wider">
                          ¡Reel Renderizado con Éxito!
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <a
                        href={renderedClipUrl}
                        download={`reel-${highlights[selectedHighlightIndex]?.range || 'clip'}.mp4`}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono font-bold text-amber-400 flex items-center justify-center gap-1.5 cursor-pointer"
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
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 font-black uppercase text-xs text-neutral-950 tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-neutral-950 fill-neutral-950" />
                    <span>✂️ Renderizar Reel Físico + Auto-Subtítulos (9:16)</span>
                  </button>
                )}
              </div>
            )}

            {/* Copy Editor Area */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                  📝 Copy de Publicación
                </label>
                <button
                  type="button"
                  onClick={() => handleCopyToClipboard(editedCopy || '')}
                  className="text-xs font-mono text-amber-400 hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0"
                >
                  {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copySuccess ? '¡Copiado!' : 'Copiar texto'}</span>
                </button>
              </div>
              <textarea
                value={editedCopy}
                onChange={(e) => setEditedCopy(e.target.value)}
                rows={5}
                placeholder="Escribe el copy para tus redes..."
                className="w-full text-xs font-sans bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-200 focus:outline-none"
              />
            </div>

            {/* Scheduling controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-neutral-950/30 border border-neutral-800/50">
              <div>
                <label className="block text-[9px] font-mono uppercase text-neutral-500 mb-1 font-bold">Plataforma</label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => {
                    const nueva = e.target.value;
                    setSelectedPlatform(nueva);
                    setEditedCopy(copyForPlatform(highlights[selectedHighlightIndex], nueva));
                  }}
                  className="w-full text-xs font-mono bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-white"
                >
                  <option value="Instagram">Instagram Reel</option>
                  <option value="TikTok">TikTok Video</option>
                  <option value="YouTube">YouTube Shorts</option>
                  <option value="Facebook">Facebook</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-mono uppercase text-neutral-500 mb-1 font-bold">Fecha</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full text-xs font-mono bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono uppercase text-neutral-500 mb-1 font-bold">Hora</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full text-xs font-mono bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-white"
                />
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="mt-6 pt-4 border-t border-neutral-850 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              {schedulingSuccess ? (
                <span className="text-emerald-400 text-xs font-bold font-mono">¡Clip programado con éxito!</span>
              ) : (
                <span className="text-[10px] font-mono text-neutral-500">Se sincroniza con el calendario</span>
              )}
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white text-xs font-mono font-bold cursor-pointer"
              >
                Salir
              </button>

              <button
                type="button"
                onClick={(e) => handleSchedulePost(e)}
                disabled={isScheduling || !editedCopy.trim()}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-amber-400 text-neutral-950 font-bold hover:bg-amber-300 active:scale-95 transition-all text-xs font-mono cursor-pointer disabled:opacity-40"
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
