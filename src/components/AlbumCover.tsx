import React, { useEffect, useState } from 'react';
import { resolveAudioUrl } from '../utils/audioStorage';
import { Disc3, Play, Pause } from 'lucide-react';

interface AlbumCoverProps {
  url?: string;
  coverUrl?: string;
  onUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPlay?: (e: React.MouseEvent) => void;
  isPlaying?: boolean;
  showPlayButton?: boolean;
  title?: string;
  artist?: string;
  size?: number;
  className?: string;
}

export const AlbumCover: React.FC<AlbumCoverProps> = ({
  url,
  coverUrl,
  onPlay,
  isPlaying = false,
  showPlayButton = false,
  className = ''
}) => {
  const targetUrl = url || coverUrl || '';
  // Se guarda para qué URL se resolvió: si cambia la portada, la anterior deja de valer sin efecto de reseteo.
  const [resuelta, setResuelta] = useState<{ para: string; url: string | null }>({ para: '', url: null });
  const resolvedUrl = targetUrl && resuelta.para === targetUrl ? resuelta.url : null;

  useEffect(() => {
    if (!targetUrl) return;
    let vivo = true;
    resolveAudioUrl(targetUrl)
      .then((res) => { if (vivo) setResuelta({ para: targetUrl, url: res }); })
      .catch(() => { if (vivo) setResuelta({ para: targetUrl, url: null }); });
    return () => { vivo = false; };
  }, [targetUrl]);

  return (
    <div
      onClick={onPlay}
      className={`aspect-square bg-cover bg-center bg-[var(--surface)]/80 flex items-center justify-center relative transition-ui group overflow-hidden ${onPlay ? 'cursor-pointer' : ''} ${className || 'w-full h-full'}`}
      style={{ backgroundImage: resolvedUrl ? `url(${resolvedUrl})` : 'none' }}
    >
      {!resolvedUrl && <Disc3 className="w-16 h-16 opacity-20 text-[var(--ink)]" />}

      {/* Floating Green Play Button */}
      {(onPlay || showPlayButton) && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onPlay) onPlay(e);
          }}
          className={`absolute bottom-3 right-3 w-12 h-12 rounded-[var(--r-pill)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink)] flex items-center justify-center transform transition-ui duration-200 cursor-pointer active:scale-[0.97] z-20 ${
            isPlaying
              ? 'translate-y-0 opacity-100 ring-2 ring-white/50 scale-105'
              : 'translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100'
          }`}
          title={isPlaying ? 'Pausar reproductor' : 'Reproducir álbum'}
        >
          {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
        </button>
      )}
    </div>
  );
};
