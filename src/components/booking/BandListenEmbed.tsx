import React, { useState } from 'react';
import { Play, X } from 'lucide-react';
import { Button } from '../ui';
import { spotifyArtistEmbedUrl } from '../../utils/spotifyEmbed';

interface BandListenEmbedProps {
  /** Enlace guardado de la banda (`spotify_youtube`): solo se usa si es un artista de Spotify. */
  spotifyUrl?: string | null;
  bandName: string;
}

/**
 * Botón «Escuchar» + reproductor de Spotify desplegable.
 *
 * El iframe no existe hasta que se pulsa: una lista de bandas con un iframe por tarjeta
 * descargaría decenas de reproductores a la vez. Sin enlace de Spotify válido no pinta nada.
 */
export const BandListenEmbed: React.FC<BandListenEmbedProps> = ({ spotifyUrl, bandName }) => {
  const [abierto, setAbierto] = useState(false);
  const embedUrl = spotifyArtistEmbedUrl(spotifyUrl);
  if (!embedUrl) return null;

  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        size="xs"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        title={abierto ? 'Cerrar reproductor' : `Escuchar completo a ${bandName} en Spotify`}
        className="gap-1.5 text-[var(--acc-ink)]"
      >
        {abierto ? <X className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        <span>{abierto ? 'Cerrar' : 'Completo en Spotify'}</span>
      </Button>

      {abierto && (
        <iframe
          src={embedUrl}
          title={`Spotify: ${bandName}`}
          loading="lazy"
          allow="encrypted-media; clipboard-write"
          referrerPolicy="strict-origin-when-cross-origin"
          className="w-full h-[152px] rounded-[var(--r-m)] bg-[var(--sunken)]"
          style={{ border: 0 }}
        />
      )}
    </div>
  );
};
