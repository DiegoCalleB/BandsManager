import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, SkipBack, SkipForward, X } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { Button, IconButton } from '../ui';

export interface ColaBanda {
  id: string;
  nombre: string;
}

interface BandPreviewPlayerProps {
  cola: ColaBanda[];
  inicio: number;
  onClose: () => void;
}

interface PreviewBanda {
  preview: string;
  cancion: string;
  artista: string;
  fans: number;
}

/**
 * Reproductor de previews de 30 s (Deezer) con cola: al acabar una banda pasa a la siguiente,
 * y salta solas las que no tienen preview. Sin iframe ni Premium de Spotify.
 */
export const BandPreviewPlayer: React.FC<BandPreviewPlayerProps> = ({ cola, inicio, onClose }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [indice, setIndice] = useState(inicio);
  // Resultado de la última carga, con el índice al que pertenece: así no hace falta resetear
  // estado dentro del efecto (una carga vieja nunca se confunde con la actual).
  const [carga, setCarga] = useState<{ indice: number; preview: PreviewBanda | null; error: boolean } | null>(null);
  const [reproduciendo, setReproduciendo] = useState(false);

  const actualId = cola[indice]?.id;
  const cargando = !!actualId && carga?.indice !== indice;
  const preview = carga?.indice === indice ? carga.preview : null;
  const sinPreview = carga?.indice === indice && carga.error;

  // Carga el preview de la banda actual; si no tiene, pasa a la siguiente.
  useEffect(() => {
    if (!actualId) return;
    let cancelado = false;
    apiFetch<{ success: boolean; preview: PreviewBanda | null }>(`/api/bands/${actualId}/preview`)
      .then((data) => {
        if (cancelado) return;
        if (data?.preview) setCarga({ indice, preview: data.preview, error: false });
        else setIndice((i) => i + 1);
      })
      .catch(() => {
        if (!cancelado) setCarga({ indice, preview: null, error: true });
      });
    return () => {
      cancelado = true;
    };
  }, [indice, actualId]);

  // Con preview nuevo, arranca la reproducción.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !preview) return;
    audio.src = preview.preview;
    audio.play().catch(() => setReproduciendo(false));
  }, [preview]);

  const alternar = () => {
    const audio = audioRef.current;
    if (!audio || !preview) return;
    if (audio.paused) audio.play().catch(() => setReproduciendo(false));
    else audio.pause();
  };

  if (!cola[indice]) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 px-4 py-3 bg-[var(--surface)] text-sm text-[var(--ink-2)] flex items-center justify-between">
        <span>Ninguna banda de la lista tiene preview disponible.</span>
        <IconButton label="Cerrar reproductor" onClick={onClose}>
          <X className="w-4 h-4" />
        </IconButton>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 py-3 bg-[var(--surface)] font-sans">
      <audio
        ref={audioRef}
        onPlay={() => setReproduciendo(true)}
        onPause={() => setReproduciendo(false)}
        onEnded={() => setIndice((i) => i + 1)}
        onError={() => setIndice((i) => i + 1)}
        className="hidden"
      />
      <div className="max-w-3xl mx-auto flex items-center gap-3">
        <IconButton label="Banda anterior" onClick={() => setIndice((i) => Math.max(0, i - 1))} disabled={indice === 0}>
          <SkipBack className="w-4 h-4" />
        </IconButton>

        <Button
          variant="primary"
          size="icon-sm"
          onClick={alternar}
          disabled={!preview}
          aria-label={reproduciendo ? 'Pausa' : 'Reproducir'}
        >
          {reproduciendo ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>

        <IconButton label="Banda siguiente" onClick={() => setIndice((i) => i + 1)} disabled={indice >= cola.length - 1}>
          <SkipForward className="w-4 h-4" />
        </IconButton>

        <div className="min-w-0 flex-1">
          <div className="font-bold text-[var(--ink)] truncate">{cola[indice].nombre}</div>
          <div className="text-micro text-[var(--ink-2)] truncate">
            {cargando && 'Buscando preview…'}
            {sinPreview && 'No se pudo cargar el preview'}
            {preview && `${preview.cancion} · vista previa de 30 s`}
          </div>
        </div>

        <span className="text-micro text-[var(--ink-3)] tabular-nums hidden sm:inline">
          {indice + 1}/{cola.length}
        </span>

        <IconButton label="Cerrar reproductor" onClick={onClose}>
          <X className="w-4 h-4" />
        </IconButton>
      </div>
    </div>
  );
};
