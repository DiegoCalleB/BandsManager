import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { Camera } from 'lucide-react';

interface LeadAvatarProps {
  lead: Partial<Lead>;
  size?: 'sm' | 'md' | 'lg';
  onClick?: (e: React.MouseEvent) => void;
  showCameraHover?: boolean;
  className?: string;
}

export const LeadAvatar: React.FC<LeadAvatarProps> = ({
  lead,
  size = 'sm',
  onClick,
  showCameraHover = true,
  className = ''
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [lead.id, lead.imagen_url]);

  // Clean raw image URL: convert icon.horse URLs to Google Favicon API
  let imgUrl = lead.imagen_url || '';
  if (imgUrl.includes('icon.horse/icon/')) {
    const domain = imgUrl.replace('https://icon.horse/icon/', '').replace('http://icon.horse/icon/', '').split('/')[0];
    if (domain) {
      imgUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    }
  }

  // Determine fallback emoji
  const getFallbackEmoji = () => {
    // If lead.icono is a valid emoji (not a URL)
    if (lead.icono && !lead.icono.startsWith('http')) {
      return lead.icono;
    }

    const typeStr = (lead.tipo || '').toLowerCase();
    const nameStr = (lead.nombre_sala || '').toLowerCase();
    const genStr = (lead.genero || '').toLowerCase();

    if (typeStr.includes('agenc') || nameStr.includes('agenc') || genStr.includes('agenc')) return '💼';
    if (typeStr.includes('manag') || nameStr.includes('manag') || genStr.includes('manag')) return '👔';
    if (typeStr.includes('product') || nameStr.includes('product') || genStr.includes('product')) return '🎬';
    if (typeStr.includes('sello') || nameStr.includes('sello') || genStr.includes('discog')) return '🏷️';
    if (typeStr.includes('grup') || typeStr.includes('banda') || nameStr.includes('banda') || genStr.includes('banda')) return '🎸';
    if (typeStr.includes('festiv') || nameStr.includes('fest') || genStr.includes('fest')) return '🎪';
    if (typeStr.includes('discoteca')) return '🪩';
    if (typeStr.includes('ayuntamiento') || nameStr.includes('ayuntamiento')) return '🏛️';
    if (typeStr.includes('medio') || genStr.includes('radio') || nameStr.includes('radio')) {
      if (nameStr.includes('tv') || nameStr.includes('tele')) return '📺';
      if (nameStr.includes('press') || nameStr.includes('prensa') || nameStr.includes('revista')) return '📰';
      if (nameStr.includes('podcast')) return '🎙️';
      return '📻';
    }
    if (nameStr.includes('pub') || nameStr.includes('bar') || genStr.includes('bar')) return '🍸';

    return '🏛️';
  };

  const emoji = getFallbackEmoji();

  // Size styling
  const containerSize =
    size === 'lg'
      ? 'w-14 h-14 rounded-2xl text-2xl'
      : size === 'md'
      ? 'w-12 h-12 rounded-xl text-xl'
      : 'w-8 h-8 rounded-lg text-xs';

  const imgSize =
    size === 'lg'
      ? 'w-14 h-14 rounded-2xl p-1 border-2 border-[#f2ca50]'
      : size === 'md'
      ? 'w-12 h-12 rounded-xl p-1 border border-[#f2ca50]/50'
      : 'w-8 h-8 rounded-lg p-0.5 border border-[#f2ca50]/50';

  const cameraIconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';

  return (
    <div
      onClick={onClick}
      className={`relative group/avatar shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      title={onClick ? "Haz clic para cambiar la imagen o logo" : lead.nombre_sala}
    >
      {imgUrl && !imgError ? (
        <img
          src={imgUrl}
          alt={lead.nombre_sala || 'Logo'}
          className={`${imgSize} object-contain bg-zinc-900/90 shrink-0 shadow-sm transition-opacity group-hover/avatar:opacity-60`}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className={`${containerSize} bg-zinc-800 border border-zinc-700/60 flex items-center justify-center shrink-0 shadow-inner group-hover/avatar:bg-zinc-700 transition-colors`}>
          <span>{emoji}</span>
        </div>
      )}

      {showCameraHover && onClick && (
        <div className="absolute inset-0 bg-black/75 rounded-lg opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity border border-[#f2ca50]">
          <Camera className={`${cameraIconSize} text-[#f2ca50]`} />
        </div>
      )}
    </div>
  );
};
