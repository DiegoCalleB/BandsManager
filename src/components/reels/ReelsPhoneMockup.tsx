import React, { useState } from 'react';
import { 
  Play, Heart, MessageCircle, Bookmark, Share2, Disc, 
  Gauge, Volume2, VolumeX, Maximize2,
  Music, Upload, CheckCircle2, UserPlus
} from 'lucide-react';
import { ThemeColors } from '../../types';
import { SUBTITLE_STYLES } from './ViralGrowthStudio';
import { getYouTubeId, parseRangeTimes, formatTime, SubtitleCue } from '../../utils/reelsUtils';

export interface ReelsPhoneMockupProps {
  colors: ThemeColors;
  isStitchLight?: boolean;
  activeTab: 'pipeline' | 'analyzer' | 'scheduler' | 'metrics';
  selectedPlatform: string;
  nombreBanda: string;
  instagramHandle?: string;
  phoneTitle: string;
  phoneText: string;
  phoneDuration: string;
  // Media playback
  inputType: 'youtube' | 'file';
  youtubeUrl: string;
  localVideoUrl: string | null;
  renderedClipUrl: string | null;
  renderedSubUrl: string | null;
  renderedBurnedSubs: boolean;
  subtitleCues: SubtitleCue[];
  currentSubtitleText: string;
  setCurrentSubtitleText: (text: string) => void;
  setLocalVideoDuration: (dur: number) => void;
  // Controls & toggles
  isPreviewMuted: boolean;
  setIsPreviewMuted: (muted: boolean) => void;
  isExpandedPreview: boolean;
  setIsExpandedPreview: (expanded: boolean) => void;
  showSafeZone: boolean;
  setShowSafeZone: (show: boolean) => void;
  ytLoopCount: number;
  simulatedTime: number;
  // Highlights & Clips
  highlights: any[];
  selectedHighlightIndex: number;
  videoMeta?: any;
  // Retention & Virality Enhancements
  isSeamlessLoop: boolean;
  isPunchInZoom: boolean;
  beatDropFx?: boolean;
  smartPan?: boolean;
  activeSubtitleStyle: 'gold' | 'neon' | 'cinematic' | 'minimal';
  showSpotifyBadge: boolean;
  showRetentionProgressBar: boolean;
  showTourSticker: boolean;
  tourStickerText: string;
  // Upload status
  uploadProgress: number | null;
  handleSimulateUpload: () => void;
}

export const ReelsPhoneMockup: React.FC<ReelsPhoneMockupProps> = ({
  isStitchLight,
  activeTab,
  selectedPlatform,
  nombreBanda,
  instagramHandle,
  phoneTitle,
  phoneText,
  phoneDuration,
  inputType,
  youtubeUrl,
  localVideoUrl,
  renderedClipUrl,
  renderedSubUrl,
  renderedBurnedSubs,
  subtitleCues,
  currentSubtitleText,
  setCurrentSubtitleText,
  setLocalVideoDuration,
  isPreviewMuted,
  setIsPreviewMuted,
  isExpandedPreview,
  setIsExpandedPreview,
  showSafeZone,
  setShowSafeZone,
  ytLoopCount,
  simulatedTime,
  highlights,
  selectedHighlightIndex,
  videoMeta,
  isSeamlessLoop,
  isPunchInZoom,
  beatDropFx,
  smartPan,
  activeSubtitleStyle,
  showSpotifyBadge,
  showRetentionProgressBar,
  showTourSticker,
  tourStickerText,
  uploadProgress,
  handleSimulateUpload
}) => {
  // Framing mode for widescreen YouTube / video files:
  // 'fit' = 100% video visible centered with dark ambient backdrop (no crop, no split seam)
  // 'left' = zoom left 1/3 (singer/stage)
  // 'center' = zoom 50%
  // 'right' = zoom right 1/3 (artwork/instruments)
  const [previewFraming, setPreviewFraming] = useState<'fit' | 'left' | 'center' | 'right'>('fit');

  // Beat drop flash effect
  const isBeatDropActive = Boolean(beatDropFx && (simulatedTime % 4 < 0.25 || simulatedTime % 7 < 0.3));
  const panOffset = smartPan ? Math.sin((simulatedTime / 10) * 2 * Math.PI) * 20 : 0;
  
  const currentHighlight = highlights[selectedHighlightIndex];
  const { start, end, duration } = currentHighlight ? parseRangeTimes(currentHighlight.range) : { start: 0, end: 0, duration: 0 };
  const progressPct = duration > 0 ? Math.min(100, (simulatedTime / duration) * 100) : 0;

  return (
    <div className={`w-full max-w-[340px] mx-auto rounded-[44px] p-3.5 border-4 shadow-2xl relative select-none transition-all ${
      isStitchLight
        ? 'bg-slate-900 border-slate-700 shadow-indigo-500/10'
        : 'bg-[#0c0d0e] border-neutral-800 shadow-2xl shadow-black/90 ring-1 ring-white/10'
    }`}>
      
      {/* Sleek Top Control Strip: Audio / SafeZone / Fullscreen */}
      <div className="flex items-center justify-between px-2 pb-2.5">
        {/* Dynamic Notch / Island */}
        <div className="w-20 h-4 bg-neutral-950 rounded-full border border-neutral-800 flex items-center justify-center gap-1.5 shadow-inner">
          <div className="w-2 h-2 rounded-full bg-cyan-950/80 border border-cyan-800/40" />
          <div className="w-6 h-1 rounded-full bg-neutral-800" />
        </div>

        {/* Minimalist Glass Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            id="btn-toggle-safezone"
            type="button"
            onClick={() => setShowSafeZone(!showSafeZone)}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              showSafeZone 
                ? 'bg-amber-400 text-neutral-950 shadow-md font-bold' 
                : 'bg-neutral-800/90 text-neutral-300 hover:text-white hover:bg-neutral-700 border border-white/10'
            }`}
            title="Cuadrícula Safe-Zone (TikTok & Reels)"
          >
            <Gauge className="w-3.5 h-3.5" />
          </button>

          <button
            id="btn-toggle-sound"
            type="button"
            onClick={() => setIsPreviewMuted(!isPreviewMuted)}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isPreviewMuted
                ? 'bg-neutral-800/90 text-red-400 border border-red-500/30 hover:bg-neutral-700'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}
            title={isPreviewMuted ? 'Activar sonido' : 'Silenciar sonido'}
          >
            {isPreviewMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            id="btn-maximize-preview"
            type="button"
            onClick={() => setIsExpandedPreview(true)}
            className="w-7 h-7 rounded-full bg-neutral-800/90 text-neutral-300 hover:text-white hover:bg-neutral-700 border border-white/10 flex items-center justify-center transition-all cursor-pointer"
            title="Ver a pantalla completa"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Encuadre Rápido (16:9 Completo vs Izquierda/Centro/Derecha) */}
      {activeTab === 'analyzer' && ((inputType === 'youtube' && getYouTubeId(youtubeUrl)) || (inputType === 'file' && localVideoUrl)) && (
        <div className="mb-2 px-1 flex items-center justify-between bg-neutral-950/80 p-1 rounded-xl border border-neutral-800 text-[8px] font-mono">
          <span className="text-neutral-400 pl-1">Encuadre:</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPreviewFraming('fit')}
              className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                previewFraming === 'fit' ? 'bg-amber-400 text-neutral-950 font-black' : 'text-neutral-400 hover:text-white'
              }`}
              title="Muestra el vídeo 16:9 completo sin recortar nada"
            >
              📺 16:9 Completo
            </button>
            <button
              type="button"
              onClick={() => setPreviewFraming('left')}
              className={`px-1.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                previewFraming === 'left' ? 'bg-amber-400 text-neutral-950 font-black' : 'text-neutral-400 hover:text-white'
              }`}
              title="Enfoca el tercio izquierdo (Músico/Cantante)"
            >
              👤 Izq
            </button>
            <button
              type="button"
              onClick={() => setPreviewFraming('center')}
              className={`px-1.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                previewFraming === 'center' ? 'bg-amber-400 text-neutral-950 font-black' : 'text-neutral-400 hover:text-white'
              }`}
              title="Enfoca el centro del plano"
            >
              🎯 Centro
            </button>
            <button
              type="button"
              onClick={() => setPreviewFraming('right')}
              className={`px-1.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                previewFraming === 'right' ? 'bg-amber-400 text-neutral-950 font-black' : 'text-neutral-400 hover:text-white'
              }`}
              title="Enfoca el tercio derecho"
            >
              🎨 Der
            </button>
          </div>
        </div>
      )}

      {/* Screen Frame 9:16 */}
      <div className="w-full aspect-[9/16] bg-black rounded-[30px] overflow-hidden relative border border-neutral-800 shadow-inner flex flex-col justify-between">
        
        {/* Ambient Top & Bottom Scrim Gradients */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 via-black/20 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none z-10" />

        {/* Video Player or Mock Wave */}
        {activeTab === 'analyzer' && inputType === 'youtube' && getYouTubeId(youtubeUrl) && !isExpandedPreview ? (
          (() => {
            const { start: ytStart, end: ytEnd } = parseRangeTimes(phoneDuration);
            const ytId = getYouTubeId(youtubeUrl);
            if (renderedClipUrl) {
              return (
                <div className="absolute inset-0 z-0 overflow-hidden bg-black flex items-center justify-center">
                  <video
                    key={`mini-rendered-${renderedClipUrl}-${isPreviewMuted ? 'muted' : 'unmuted'}`}
                    src={renderedClipUrl}
                    autoPlay
                    muted={isPreviewMuted}
                    loop
                    playsInline
                    className={`w-full h-full ${previewFraming === 'fit' ? 'object-contain' : 'object-cover'}`}
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
                  {isBeatDropActive && (
                    <div className="absolute inset-0 z-20 bg-cyan-400/20 mix-blend-screen pointer-events-none animate-pulse" />
                  )}
                </div>
              );
            }

            return (
              <div className="absolute inset-0 z-0 overflow-hidden bg-neutral-950 flex items-center justify-center">
                {/* Clean video frame positioning based on user selected framing */}
                {previewFraming === 'fit' ? (
                  <div className="relative w-full aspect-[16/9] overflow-hidden bg-black shadow-2xl flex items-center justify-center">
                    <iframe
                      key={`${ytId}-${ytStart}-${ytEnd}-${isPreviewMuted ? 'muted' : 'unmuted'}-${ytLoopCount}`}
                      src={`https://www.youtube.com/embed/${ytId}?start=${ytStart}&end=${ytEnd}&autoplay=1&mute=${isPreviewMuted ? 1 : 0}&controls=0&modestbranding=1&loop=1&playlist=${ytId}&showinfo=0&rel=0&iv_load_policy=3`}
                      className="w-full h-full object-cover pointer-events-none"
                      style={{ border: 0 }}
                      allow="autoplay; encrypted-media"
                      title="Highlight Clip Video Player"
                    />
                  </div>
                ) : (
                  <iframe
                    key={`${ytId}-${ytStart}-${ytEnd}-${isPreviewMuted ? 'muted' : 'unmuted'}-${ytLoopCount}-${previewFraming}`}
                    src={`https://www.youtube.com/embed/${ytId}?start=${ytStart}&end=${ytEnd}&autoplay=1&mute=${isPreviewMuted ? 1 : 0}&controls=0&modestbranding=1&loop=1&playlist=${ytId}&showinfo=0&rel=0&iv_load_policy=3`}
                    className={`absolute w-[280%] h-full pointer-events-none opacity-95 transition-all duration-500 ease-out ${
                      previewFraming === 'left' ? 'left-0' : previewFraming === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2'
                    }`}
                    style={{ border: 0 }}
                    allow="autoplay; encrypted-media"
                    title="Highlight Clip Video Player"
                  />
                )}
                {isBeatDropActive && (
                  <div className="absolute inset-0 z-20 bg-cyan-400/20 mix-blend-screen pointer-events-none animate-pulse" />
                )}
              </div>
            );
          })()
        ) : activeTab === 'analyzer' && inputType === 'file' && localVideoUrl && !isExpandedPreview ? (
          <div className="absolute inset-0 z-0 overflow-hidden bg-neutral-950 flex items-center justify-center">
            <video
              key={`${localVideoUrl}-${isPreviewMuted ? 'muted' : 'unmuted'}-${previewFraming}`}
              src={localVideoUrl}
              autoPlay
              muted={isPreviewMuted}
              loop
              playsInline
              className={`w-full h-full ${previewFraming === 'fit' ? 'object-contain' : 'object-cover'} transition-all duration-300`}
              onTimeUpdate={(e) => {
                const video = e.currentTarget;
                const { start: fStart, end: fEnd } = parseRangeTimes(phoneDuration);
                if (fEnd > fStart) {
                  if (video.currentTime < fStart) video.currentTime = fStart;
                  if (video.currentTime >= fEnd) {
                    video.currentTime = fStart;
                    video.play().catch(() => {});
                  }
                }
              }}
              onLoadedMetadata={(e) => {
                const video = e.currentTarget;
                if (Number.isFinite(video.duration) && video.duration > 0) {
                  setLocalVideoDuration(Math.floor(video.duration));
                }
                const { start: fStart } = parseRangeTimes(phoneDuration);
                video.currentTime = fStart;
              }}
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black z-0 flex flex-col items-center justify-center p-4">
            <div className="w-14 h-14 rounded-full bg-neutral-900/80 border border-neutral-800 flex items-center justify-center text-amber-400 shadow-xl mb-3 animate-pulse">
              <Music className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-400 uppercase text-center">
              {activeTab === 'analyzer' && highlights.length > 0 ? 'Clip Listo para Previsualizar' : 'Band Clip Studio'}
            </span>
            {phoneDuration && (
              <span className="text-[9px] font-mono mt-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-400">
                {phoneDuration}
              </span>
            )}
          </div>
        )}

        {/* Top Header: Authentic Platform Navigation */}
        <div className="flex justify-between items-center z-20 px-3.5 pt-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-display font-black text-white tracking-wide drop-shadow">
              {selectedPlatform === 'TikTok' ? 'Para ti' : 'Reels'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[7.5px] font-mono text-neutral-300 font-semibold tracking-wider">PREVIEW</span>
          </div>
        </div>

        {/* 🎯 Sticky Viral Hook & Interactive Stickers Layer (Cleanly Stacked) */}
        <div className="absolute top-11 inset-x-3 z-20 flex flex-col items-center gap-2 pointer-events-none">
          
          {/* Main Hook Sticker */}
          {highlights[selectedHighlightIndex]?.hookText && (
            <div className="w-full max-w-[260px] animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-neutral-950/90 backdrop-blur-md border border-amber-400/70 px-3 py-1.5 rounded-xl shadow-2xl text-center">
                <span className="text-[9.5px] font-display font-black text-amber-300 leading-snug uppercase tracking-wide block drop-shadow-md">
                  {highlights[selectedHighlightIndex].hookText}
                </span>
              </div>
            </div>
          )}

          {/* Spotify Pill Sticker */}
          {showSpotifyBadge && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md border border-emerald-500/50 text-emerald-300 text-[7.5px] font-mono font-bold shadow-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="truncate max-w-[180px]">🎧 Escucha · {videoMeta?.title || nombreBanda}</span>
            </div>
          )}

          {/* Tour Date / Ticket Sticker */}
          {showTourSticker && tourStickerText && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 text-neutral-950 text-[8px] font-mono font-black shadow-xl tracking-wider">
              <span>🎟️ {tourStickerText}</span>
            </div>
          )}
        </div>

        {/* 💬 Dynamic Kinetic Subtitles Overlay */}
        {activeTab === 'analyzer' && currentSubtitleText && !renderedBurnedSubs && (
          <div className="absolute top-[48%] inset-x-3 -translate-y-1/2 z-20 pointer-events-none text-center">
            {(() => {
              const activeStyleObj = SUBTITLE_STYLES.find(s => s.id === activeSubtitleStyle) || SUBTITLE_STYLES[0];
              return (
                <span className={`inline-block text-[11px] max-w-[90%] mx-auto leading-relaxed ${activeStyleObj.fontClass} ${activeStyleObj.colorClass} ${activeStyleObj.bgClass} shadow-2xl animate-pulse`}>
                  {currentSubtitleText}
                </span>
              );
            })()}
          </div>
        )}

        {/* Safe-Zone Guide Grid (When Activated) */}
        {showSafeZone && (
          <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-3 border-2 border-dashed border-amber-400/60 bg-amber-500/5">
            <div className="bg-red-500/20 border border-red-500/40 p-1 rounded text-center">
              <span className="text-[7px] font-mono uppercase text-red-300 font-bold">Zona Header (Historias / Filtros)</span>
            </div>
            <div className="flex justify-between items-center my-auto">
              <div className="p-1.5 border border-dashed border-emerald-400/60 bg-emerald-500/10 rounded max-w-[70%]">
                <span className="text-[7.5px] font-mono uppercase text-emerald-300 font-bold block">✨ SAFE ZONE REELS</span>
                <span className="text-[6.5px] font-sans text-emerald-200/80">Área libre de botones y texto nativo</span>
              </div>
              <div className="bg-red-500/20 border border-red-500/40 px-1.5 py-4 rounded text-center">
                <span className="text-[6.5px] font-mono uppercase text-red-300 font-bold block">Botones</span>
              </div>
            </div>
            <div className="bg-red-500/20 border border-red-500/40 p-1 rounded text-center">
              <span className="text-[7px] font-mono uppercase text-red-300 font-bold">Zona Inferior (Pie de foto & Audio)</span>
            </div>
          </div>
        )}

        {/* Right Action Icons Column (Authentic Instagram / TikTok Layout) */}
        <div className="absolute right-2.5 bottom-12 z-20 flex flex-col items-center gap-3">
          {/* Avatar with Follow Button */}
          <div className="relative mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 p-0.5 flex items-center justify-center shadow-lg">
              <span className="w-full h-full rounded-full bg-neutral-950 flex items-center justify-center text-[9px] font-bold text-white uppercase">
                {nombreBanda.charAt(0)}
              </span>
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-white text-[9px] font-black leading-none shadow">
              +
            </div>
          </div>

          {/* Like */}
          <div className="flex flex-col items-center gap-0.5 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:scale-110 transition-transform">
              <Heart className="w-4 h-4 fill-white/10" />
            </div>
            <span className="text-[8px] font-mono text-white font-bold drop-shadow">1.4k</span>
          </div>

          {/* Comment */}
          <div className="flex flex-col items-center gap-0.5 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:scale-110 transition-transform">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span className="text-[8px] font-mono text-white font-bold drop-shadow">62</span>
          </div>

          {/* Share */}
          <div className="flex flex-col items-center gap-0.5 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:scale-110 transition-transform">
              <Share2 className="w-4 h-4" />
            </div>
            <span className="text-[8px] font-mono text-white font-bold drop-shadow">89</span>
          </div>

          {/* Rotating Audio Vinyl */}
          <div className="w-7 h-7 rounded-full bg-neutral-900 border-2 border-neutral-700 flex items-center justify-center animate-spin shadow-lg mt-0.5">
            <Disc className="w-3.5 h-3.5 text-amber-400" />
          </div>
        </div>

        {/* Bottom Metadata: Account, Caption & Audio Marquee */}
        <div className="z-20 px-3.5 pb-3.5 pr-14 space-y-1.5 mt-auto">
          {/* Profile Handle & Follow */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-white tracking-wide truncate max-w-[120px] drop-shadow">
              @{instagramHandle || nombreBanda.toLowerCase().replace(/\s+/g, '')}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-white/20 backdrop-blur-md text-white text-[7.5px] font-semibold flex items-center gap-0.5">
              <UserPlus className="w-2.5 h-2.5" /> Seguir
            </span>
          </div>

          {/* Post Caption (Clean, 2 lines max, legible) */}
          <p className="text-[9px] text-neutral-100 font-sans leading-snug line-clamp-2 drop-shadow-md">
            {phoneText || phoneTitle || `Nuevo avance en directo de ${nombreBanda} 🔥🎸`}
          </p>

          {/* Audio Track Tag */}
          <div className="flex items-center gap-1.5 text-[8px] font-mono text-neutral-300 pt-0.5">
            <Music className="w-2.5 h-2.5 text-amber-400 shrink-0" />
            <span className="truncate max-w-[160px] drop-shadow">
              {videoMeta?.title ? `${videoMeta.title}` : `Audio original · ${nombreBanda}`}
            </span>
          </div>
        </div>

        {/* Ultra-thin Scrubber Progress Bar at Bottom Edge */}
        <div className="absolute bottom-0 inset-x-0 h-1 bg-neutral-900/80 z-30">
          <div 
            className={`h-full transition-all duration-300 ${
              isSeamlessLoop
                ? 'bg-gradient-to-r from-rose-500 via-amber-400 to-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]'
                : 'bg-amber-400'
            }`}
            style={{ width: `${Math.max(2, progressPct)}%` }}
          />
        </div>

      </div>

      {/* ⏱️ Technical Timing Card (Cleanly Placed Below the Smartphone Screen) */}
      {activeTab === 'analyzer' && currentHighlight && (
        <div className="mt-3 p-2.5 rounded-2xl bg-neutral-950 border border-neutral-800/80 shadow-inner space-y-1.5">
          <div className="flex justify-between items-center text-[8px] font-mono font-bold">
            <span className={isSeamlessLoop ? 'text-rose-400 flex items-center gap-1' : 'text-amber-400'}>
              {isSeamlessLoop ? '🔁 120% SEAMLESS LOOP' : '⏱️ RECORTE SELECCIONADO'}
            </span>
            <span className="text-neutral-400">
              {formatTime(start + simulatedTime)} / {formatTime(end)}
            </span>
          </div>
          <div className="flex justify-between text-[7px] font-mono text-neutral-500 pt-0.5 border-t border-neutral-900">
            <span>Inicio: <strong className="text-neutral-300">{formatTime(start)}</strong></span>
            <span>Duración: <strong className="text-neutral-300">{duration}s</strong></span>
            <span>Fin: <strong className="text-neutral-300">{formatTime(end)}</strong></span>
          </div>
        </div>
      )}

      {/* Direct Channel Dispatch Status */}
      <div className="flex justify-between items-center pt-3 mt-2 border-t border-neutral-800/60 px-1">
        <span className="text-[9px] font-mono text-neutral-400">Canal de Emisión</span>
        <button
          id="btn-reels-upload"
          onClick={handleSimulateUpload}
          disabled={uploadProgress !== null}
          className={`text-[9px] font-mono hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-40 bg-transparent border-0 ${
            isStitchLight ? 'text-indigo-400' : 'text-amber-400'
          }`}
        >
          <Upload className="w-3 h-3" /> Subir Directo
        </button>
      </div>

      {uploadProgress !== null && (
        <div className="space-y-1 mt-2">
          <div className="flex justify-between items-center text-[8px] font-mono text-neutral-400">
            <span>Transmitiendo a APIs de Redes Sociales...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-neutral-950 border border-neutral-900">
            <div 
              className={`h-full transition-all duration-200 ${isStitchLight ? 'bg-indigo-600' : 'bg-amber-400'}`} 
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {uploadProgress === null && (
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-neutral-500 justify-end mt-1.5 px-1">
          <CheckCircle2 className="w-3 h-3 text-neutral-600" />
          <span>Todo sincronizado</span>
        </div>
      )}

    </div>
  );
};
