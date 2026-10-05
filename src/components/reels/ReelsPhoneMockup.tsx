import React, { useState } from 'react';
import { 
  Play, Heart, MessageCircle, Bookmark, Share2, Disc, 
  Gauge, Volume2, VolumeX, Maximize2,
  Music, Upload, CheckCircle2, UserPlus
} from 'lucide-react';
import { ThemeColors } from '../../types';
import { SUBTITLE_STYLES } from './ViralGrowthStudio';
import { getYouTubeId, parseRangeTimes, formatTime, SubtitleCue } from '../../utils/reelsUtils';
import { ShowIcon } from '../ui/ShowIcon';
import { Button, IconButton } from '../ui';

export interface ReelsPhoneMockupProps {
  colors: ThemeColors;
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
  // 'center' = zoom 50% vertical 9:16 (standard vertical Reel/TikTok)
  // 'left' = zoom left 1/3 (singer/stage)
  // 'right' = zoom right 1/3 (artwork/instruments)
  // 'fit' = 100% video visible centered with letterbox
  const [previewFraming, setPreviewFraming] = useState<'fit' | 'left' | 'center' | 'right'>('center');

  // Beat drop flash effect
  const isBeatDropActive = Boolean(beatDropFx && (simulatedTime % 4 < 0.25 || simulatedTime % 7 < 0.3));
  const panOffset = smartPan ? Math.sin((simulatedTime / 10) * 2 * Math.PI) * 20 : 0;
  
  const currentHighlight = highlights[selectedHighlightIndex];
  const { start, end, duration } = currentHighlight ? parseRangeTimes(currentHighlight.range) : { start: 0, end: 0, duration: 0 };
  const progressPct = duration > 0 ? Math.min(100, (simulatedTime / duration) * 100) : 0;

  return (
    <div className={`w-full max-w-[340px] mx-auto rounded-[44px] p-3.5 border-4 relative select-none transition-ui bg-[var(--sunken)] shadow-black/90 ring-1 ring-[var(--ink)]/10`}>
      
      {/* Sleek Top Control Strip: Audio / SafeZone / Fullscreen */}
      <div className="flex items-center justify-between px-2 pb-2.5">
        {/* Dynamic Notch / Island */}
        <div className="w-20 h-4 bg-[var(--surface)] rounded-full flex items-center justify-center gap-1.5 ">
          <div className="w-2 h-2 rounded-full bg-[var(--acc)] " />
          <div className="w-6 h-1 rounded-full bg-[var(--sunken)]" />
        </div>

        {/* Minimalist Glass Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            id="btn-toggle-safezone"
            type="button"
            onClick={() => setShowSafeZone(!showSafeZone)}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-ui cursor-pointer ${
              showSafeZone 
                ? 'bg-[var(--ink)] text-[var(--bg)] font-bold' 
                : 'bg-[var(--sunken)]/90 text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--sunken)] '
            }`}
            title="Cuadrícula Safe-Zone (TikTok y Reels)"
          >
            <Gauge className="w-3.5 h-3.5" />
          </button>

          <button
            id="btn-toggle-sound"
            type="button"
            onClick={() => setIsPreviewMuted(!isPreviewMuted)}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-ui cursor-pointer ${
              isPreviewMuted
                ? 'bg-[var(--sunken)]/90 text-[var(--alert)] hover:bg-[var(--sunken)] bg-[var(--alert)]/10'
                : 'bg-[var(--ok)]/20 text-[var(--ink)] '
            }`}
            title={isPreviewMuted ? 'Activar sonido' : 'Silenciar sonido'}
          >
            {isPreviewMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <IconButton
            label="Ver a pantalla completa"
            id="btn-maximize-preview"
            type="button"
            onClick={() => setIsExpandedPreview(true)}
            className="w-7 flex"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </IconButton>
        </div>
      </div>

      {/* Encuadre Rápido (16:9 Completo vs Izquierda/Centro/Derecha) */}
      {activeTab === 'analyzer' && ((inputType === 'youtube' && getYouTubeId(youtubeUrl)) || (inputType === 'file' && localVideoUrl)) && (
        <div className="mb-2 px-1 flex items-center justify-between bg-[var(--sunken)]/80 p-1 rounded-[var(--r-s)] text-micro font-mono">
          <span className="text-[var(--ink-2)] pl-1">Encuadre:</span>
          <div className="flex items-center gap-1">
            <Button
              variant={previewFraming === 'center' ? "selected" : "ghost"}
              size="xs"
              type="button"
              onClick={() => setPreviewFraming('center')}
              title="Enfoca verticalmente al centro (Reels 9:16)"
            >
              <ShowIcon inline emoji="🎯" />Vertical
            </Button>
            <Button
              variant={previewFraming === 'left' ? "selected" : "ghost"}
              size="xs"
              type="button"
              onClick={() => setPreviewFraming('left')}
              title="Enfoca el tercio izquierdo (Músico/Cantante)"
            >
              <ShowIcon inline emoji="👤" />Izq
            </Button>
            <Button
              variant={previewFraming === 'right' ? "selected" : "ghost"}
              size="xs"
              type="button"
              onClick={() => setPreviewFraming('right')}
              title="Enfoca el tercio derecho"
            >
              <ShowIcon inline emoji="🎨" />Der
            </Button>
            <Button
              variant={previewFraming === 'fit' ? "selected" : "ghost"}
              size="xs"
              type="button"
              onClick={() => setPreviewFraming('fit')}
              title="Muestra el vídeo 16:9 completo sin recortar nada"
            >
              <ShowIcon inline emoji="📺" />16:9
            </Button>
          </div>
        </div>
      )}

      {/* Screen Frame 9:16 */}
      <div className="w-full aspect-[9/16] bg-[var(--surface)] rounded-[30px] overflow-hidden relative flex flex-col justify-between">
        
        {/* Ambient Top & Bottom Scrim Gradients */}
        <div className="absolute inset-x-0 top-0 h-24 from-black/70 via-black/20 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-x-0 bottom-0 h-44 from-black/95 via-black/60 to-transparent pointer-events-none z-10" />

        {/* Video Player or Mock Wave */}
        {activeTab === 'analyzer' && inputType === 'youtube' && getYouTubeId(youtubeUrl) && !isExpandedPreview ? (
          (() => {
            const { start: ytStart, end: ytEnd } = parseRangeTimes(phoneDuration);
            const ytId = getYouTubeId(youtubeUrl);
            if (renderedClipUrl) {
              return (
                <div className="absolute inset-0 z-0 overflow-hidden bg-[var(--sunken)] flex items-center justify-center">
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
                    <div className="absolute inset-0 z-20 bg-[var(--acc)]/20 mix-blend-screen pointer-events-none" />
                  )}
                </div>
              );
            }

            return (
              <div className="absolute inset-0 z-0 overflow-hidden bg-[var(--sunken)] flex items-center justify-center">
                {/* Clean video frame positioning based on user selected framing */}
                {previewFraming === 'fit' ? (
                  <div className="relative w-full aspect-[16/9] overflow-hidden bg-[var(--sunken)] flex items-center justify-center">
                    <iframe
                      key={`${ytId}-${ytStart}-${ytEnd}-${isPreviewMuted ? 'muted' : 'unmuted'}-${ytLoopCount}`}
                      src={`https://www.youtube.com/embed/${ytId}?start=${ytStart}&end=${ytEnd}&autoplay=1&mute=${isPreviewMuted ? 1 : 0}&controls=0&modestbranding=1&loop=1&playlist=${ytId}&showinfo=0&rel=0&iv_load_policy=3`}
                      className="w-full h-full object-cover pointer-events-none"
                      style={{ border: 0 }}
                      allow="autoplay; encrypted-media"
                      title="Highlight clip video player"
                    />
                  </div>
                ) : (
                  <iframe
                    key={`${ytId}-${ytStart}-${ytEnd}-${isPreviewMuted ? 'muted' : 'unmuted'}-${ytLoopCount}-${previewFraming}`}
                    src={`https://www.youtube.com/embed/${ytId}?start=${ytStart}&end=${ytEnd}&autoplay=1&mute=${isPreviewMuted ? 1 : 0}&controls=0&modestbranding=1&loop=1&playlist=${ytId}&showinfo=0&rel=0&iv_load_policy=3`}
                    className={`absolute w-[280%] h-full pointer-events-none opacity-95 transition-ui duration-300 ease-out ${
                      previewFraming === 'left' ? 'left-0' : previewFraming === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2'
                    }`}
                    style={{ border: 0 }}
                    allow="autoplay; encrypted-media"
                    title="Highlight clip video player"
                  />
                )}
                {isBeatDropActive && (
                  <div className="absolute inset-0 z-20 bg-[var(--acc)]/20 mix-blend-screen pointer-events-none" />
                )}
              </div>
            );
          })()
        ) : activeTab === 'analyzer' && inputType === 'file' && localVideoUrl && !isExpandedPreview ? (
          <div className="absolute inset-0 z-0 overflow-hidden bg-[var(--sunken)] flex items-center justify-center">
            <video
              key={`${localVideoUrl}-${isPreviewMuted ? 'muted' : 'unmuted'}-${previewFraming}`}
              src={localVideoUrl}
              autoPlay
              muted={isPreviewMuted}
              loop
              playsInline
              className={`w-full h-full ${previewFraming === 'fit' ? 'object-contain' : 'object-cover'} transition-ui duration-300`}
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
          <div className="absolute inset-0 to-black z-0 flex flex-col items-center justify-center p-4">
            <div className="w-14 h-14 rounded-full bg-[var(--sunken)]/80 flex items-center justify-center text-[var(--acc-ink)] mb-3">
              <Music className="w-6 h-6" />
            </div>
            <span className="text-micro font-mono font-bold text-[var(--ink-2)] text-center">
              {activeTab === 'analyzer' && highlights.length > 0 ? 'Clip Listo para Previsualizar' : 'Band Clip Studio'}
            </span>
            {phoneDuration && (
              <span className="text-micro font-mono mt-1 px-2 py-0.5 rounded-full bg-[var(--ink)]/5 text-[var(--ink-2)]">
                {phoneDuration}
              </span>
            )}
          </div>
        )}

        {/* Top Header: Authentic Platform Navigation */}
        <div className="flex justify-between items-center z-20 px-3.5 pt-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-display font-bold text-[var(--ink)] ">
              {selectedPlatform === 'TikTok' ? 'Para ti' : 'Reels'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--scrim)]/40 ">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--alert)]" />
            <span className="text-micro font-mono text-[var(--ink-2)] font-semibold ">PREVIEW</span>
          </div>
        </div>

        {/* 🎯 Sticky Viral Hook & Interactive Stickers Layer (Cleanly Stacked) */}
        <div className="absolute top-11 inset-x-3 z-20 flex flex-col items-center gap-2 pointer-events-none">
          
          {/* Main Hook Sticker */}
          {highlights[selectedHighlightIndex]?.hookText && (
            <div className="w-full max-w-[260px] animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-[var(--sunken)]/90 px-3 py-1.5 rounded-[var(--r-s)] text-center bg-[var(--acc)]/10">
                <span className="text-micro font-display font-bold text-[var(--acc-ink)] leading-snug block ">
                  {highlights[selectedHighlightIndex].hookText}
                </span>
              </div>
            </div>
          )}

          {/* Spotify Pill Sticker */}
          {showSpotifyBadge && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--scrim)]/85 text-[var(--on-scrim)] text-micro font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)] " />
              <span className="truncate max-w-[180px]"><ShowIcon inline emoji="🎧" />Escucha · {videoMeta?.title || nombreBanda}</span>
            </div>
          )}

          {/* Tour Date / Ticket Sticker */}
          {showTourSticker && tourStickerText && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--r-s)] text-[var(--ink)] text-micro font-mono font-bold ">
              <span><ShowIcon inline emoji="🎟️" />{tourStickerText}</span>
            </div>
          )}
        </div>

        {/* 💬 Dynamic Kinetic Subtitles Overlay */}
        {activeTab === 'analyzer' && currentSubtitleText && !renderedBurnedSubs && (
          <div className="absolute top-[48%] inset-x-3 -translate-y-1/2 z-20 pointer-events-none text-center">
            {(() => {
              const activeStyleObj = SUBTITLE_STYLES.find(s => s.id === activeSubtitleStyle) || SUBTITLE_STYLES[0];
              return (
                <span className={`inline-block text-xs max-w-[90%] mx-auto leading-relaxed ${activeStyleObj.fontClass} ${activeStyleObj.colorClass} ${activeStyleObj.bgClass}`}>
                  {currentSubtitleText}
                </span>
              );
            })()}
          </div>
        )}

        {/* Safe-Zone Guide Grid (When Activated) */}
        {showSafeZone && (
          <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-3 border-2 border-dashed bg-[var(--acc)]/5">
            <div className="bg-[var(--alert)]/20 p-1 rounded text-center">
              <span className="text-micro font-mono text-[var(--alert)] font-bold">Zona header (historias / filtros)</span>
            </div>
            <div className="flex justify-between items-center my-auto">
              <div className="p-1.5 border-dashed bg-[var(--ok)]/10 rounded max-w-[70%]">
                <span className="text-micro font-mono text-[var(--ok)] font-bold block"><ShowIcon inline emoji="✨" />SAFE ZONE REELS</span>
                <span className="text-micro font-sans text-[var(--ok)]/80">Área libre de botones y texto nativo</span>
              </div>
              <div className="bg-[var(--alert)]/20 px-1.5 py-4 rounded text-center">
                <span className="text-micro font-mono text-[var(--alert)] font-bold block">Botones</span>
              </div>
            </div>
            <div className="bg-[var(--alert)]/20 p-1 rounded text-center">
              <span className="text-micro font-mono text-[var(--alert)] font-bold">Zona inferior (pie de foto y audio)</span>
            </div>
          </div>
        )}

        {/* Right Action Icons Column (Authentic Instagram / TikTok Layout) */}
        <div className="absolute right-2.5 bottom-12 z-20 flex flex-col items-center gap-3">
          {/* Avatar with Follow Button */}
          <div className="relative mb-1">
            <div className="w-8 h-8 rounded-full p-0.5 flex items-center justify-center ">
              <span className="w-full h-full rounded-full bg-[var(--sunken)] flex items-center justify-center text-micro font-bold text-[var(--ink)] ">
                {nombreBanda.charAt(0)}
              </span>
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-[var(--alert)] rounded-full flex items-center justify-center text-[var(--on-alert)] text-micro font-bold leading-none ">
              +
            </div>
          </div>

          {/* Like */}
          <div className="flex flex-col items-center gap-0.5 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-[var(--scrim)]/40 flex items-center justify-center text-[var(--ink)] transition-transform">
              <Heart className="w-4 h-4 fill-[var(--ink)]/10" />
            </div>
            <span className="text-micro font-mono text-[var(--ink)] font-bold ">1.4k</span>
          </div>

          {/* Comment */}
          <div className="flex flex-col items-center gap-0.5 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-[var(--scrim)]/40 flex items-center justify-center text-[var(--ink)] transition-transform">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span className="text-micro font-mono text-[var(--ink)] font-bold ">62</span>
          </div>

          {/* Share */}
          <div className="flex flex-col items-center gap-0.5 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-[var(--scrim)]/40 flex items-center justify-center text-[var(--ink)] transition-transform">
              <Share2 className="w-4 h-4" />
            </div>
            <span className="text-micro font-mono text-[var(--ink)] font-bold ">89</span>
          </div>

          {/* Rotating Audio Vinyl */}
          <div className="w-7 h-7 rounded-full bg-[var(--sunken)] border-2 flex items-center justify-center animate-spin mt-0.5">
            <Disc className="w-3.5 h-3.5 text-[var(--acc-ink)]" />
          </div>
        </div>

        {/* Bottom Metadata: Account, Caption & Audio Marquee */}
        <div className="z-20 px-3.5 pb-3.5 pr-14 space-y-1.5 mt-auto">
          {/* Profile Handle & Follow */}
          <div className="flex items-center gap-2">
            <span className="text-micro font-bold text-[var(--ink)] truncate max-w-[120px] ">
              @{instagramHandle || nombreBanda.toLowerCase().replace(/\s+/g, '')}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[var(--ink)]/20 text-[var(--ink)] text-micro font-semibold flex items-center gap-0.5">
              <UserPlus className="w-2.5 h-2.5" /> Seguir
            </span>
          </div>

          {/* Post Caption (Clean, 2 lines max, legible) */}
          <p className="text-micro text-[var(--ink)] font-sans leading-snug line-clamp-2 ">
            {phoneText || phoneTitle || `Nuevo avance en directo de ${nombreBanda} 🔥🎸`}
          </p>

          {/* Audio Track Tag */}
          <div className="flex items-center gap-1.5 text-micro font-mono text-[var(--ink-2)] pt-0.5">
            <Music className="w-2.5 h-2.5 text-[var(--acc-ink)] shrink-0" />
            <span className="truncate max-w-[160px] ">
              {videoMeta?.title ? `${videoMeta.title}` : `Audio original · ${nombreBanda}`}
            </span>
          </div>
        </div>

        {/* Ultra-thin Scrubber Progress Bar at Bottom Edge */}
        <div className="absolute bottom-0 inset-x-0 h-1 bg-[var(--sunken)]/80 z-30">
          <div 
            className={`h-full transition-ui duration-300 ${
              isSeamlessLoop
                ? ''
                : 'bg-[var(--acc)]'
            }`}
            style={{ width: `${Math.max(2, progressPct)}%` }}
          />
        </div>

      </div>

      {/* ⏱️ Technical Timing Card (Cleanly Placed Below the Smartphone Screen) */}
      {activeTab === 'analyzer' && currentHighlight && (
        <div className="mt-3 p-2.5 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1.5">
          <div className="flex justify-between items-center text-micro font-mono font-bold">
            <span className={isSeamlessLoop ? 'text-[var(--alert)] flex items-center gap-1' : 'text-[var(--acc-ink)]'}>
              {isSeamlessLoop ? '120% SEAMLESS LOOP' : 'RECORTE SELECCIONADO'}
            </span>
            <span className="text-[var(--ink-2)]">
              {formatTime(start + simulatedTime)} / {formatTime(end)}
            </span>
          </div>
          <div className="flex justify-between text-micro font-mono text-[var(--ink-2)] pt-0.5 border-t border-[var(--hair)]">
            <span>Inicio: <strong className="text-[var(--ink-2)]">{formatTime(start)}</strong></span>
            <span>Duración: <strong className="text-[var(--ink-2)]">{duration}s</strong></span>
            <span>Fin: <strong className="text-[var(--ink-2)]">{formatTime(end)}</strong></span>
          </div>
        </div>
      )}

      {/* Direct Channel Dispatch Status */}
      <div className="flex justify-between items-center pt-3 mt-2 border-t border-[var(--hair)] px-1">
        <span className="text-micro font-mono text-[var(--ink-2)]">Canal de Emisión</span>
        <button
          id="btn-reels-upload"
          onClick={handleSimulateUpload}
          disabled={uploadProgress !== null}
          className={`text-micro font-mono hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-40 bg-transparent border-0 text-[var(--acc-ink)]`}
        >
          <Upload className="w-3 h-3" /> Subir directo
        </button>
      </div>

      {uploadProgress !== null && (
        <div className="space-y-1 mt-2">
          <div className="flex justify-between items-center text-micro font-mono text-[var(--ink-2)]">
            <span>Transmitiendo a APIs de redes sociales…</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-[var(--surface)] ">
            <div 
              className={`h-full transition-ui duration-200 bg-[var(--acc)]`} 
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {uploadProgress === null && (
        <div className="flex items-center gap-1.5 text-micro font-mono text-[var(--ink-2)] justify-end mt-1.5 px-1">
          <CheckCircle2 className="w-3 h-3 text-[var(--ink-2)]" />
          <span>Todo sincronizado</span>
        </div>
      )}

    </div>
  );
};
