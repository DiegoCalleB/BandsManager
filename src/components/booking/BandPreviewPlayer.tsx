import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ExternalLink, ListMusic, Pause, Play, SkipBack, SkipForward, X } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { Button, IconButton } from '../ui';

export interface ColaBanda {
  id: string;
  nombre: string;
  spotifyUrl?: string | null;
}

interface BandPreviewPlayerProps {
  cola: ColaBanda[];
  inicio: number;
  onClose: () => void;
}

interface TemaPreview {
  titulo: string;
  preview: string;
  imagen: string;
}

interface PreviewBanda {
  artista: string;
  imagen: string;
  fans: number;
  temas: TemaPreview[];
}

/**
 * Reproductor de previews de 30 s (Deezer) con cola de bandas y lista de temas.
 * Cada banda reproduce sus temas en orden; al acabar pasa a la siguiente banda con preview.
 * Se monta con una `key` nueva en cada pulsación de Escuchar, así una cola nueva siempre arranca.
 */
export const BandPreviewPlayer: React.FC<BandPreviewPlayerProps> = ({ cola, inicio, onClose }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [indice, setIndice] = useState(inicio);
  const [temaIdx, setTemaIdx] = useState(0);
  // Último resultado, con el índice de banda al que pertenece: una carga vieja nunca se confunde.
  const [carga, setCarga] = useState<{ indice: number; data: PreviewBanda | null; error: boolean } | null>(null);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [listaAbierta, setListaAbierta] = useState(false);

  const actual = cola[indice];
  const actualId = actual?.id;
  const cargando = !!actualId && carga?.indice !== indice;
  const data = carga?.indice === indice ? carga.data : null;
  const sinPreview = carga?.indice === indice && carga.error;
  const tema = data?.temas[temaIdx];

  // Carga los temas de la banda actual; si no tiene ninguno, pasa a la siguiente.
  useEffect(() => {
    if (!actualId) return;
    let cancelado = false;
    apiFetch<{ success: boolean; preview: PreviewBanda | null }>(`/api/bands/${actualId}/preview`)
      .then((res) => {
        if (cancelado) return;
        if (res?.preview?.temas?.length) {
          setTemaIdx(0);
          setCarga({ indice, data: res.preview, error: false });
        } else {
          setIndice((i) => i + 1);
        }
      })
      .catch(() => {
        if (!cancelado) setCarga({ indice, data: null, error: true });
      });
    return () => {
      cancelado = true;
    };
  }, [indice, actualId]);

  // Cada vez que cambia el tema (o llegan temas nuevos), carga el audio y reproduce.
  const urlTema = tema?.preview;
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !urlTema) return;
    audio.src = urlTema;
    audio.play().catch(() => setReproduciendo(false));
  }, [urlTema]);

  const alternar = () => {
    const audio = audioRef.current;
    if (!audio || !tema) return;
    if (audio.paused) audio.play().catch(() => setReproduciendo(false));
    else audio.pause();
  };

  const temaAnterior = () => {
    if (temaIdx > 0) setTemaIdx(temaIdx - 1);
    else setIndice((i) => Math.max(0, i - 1));
  };

  const temaSiguiente = () => {
    if (data && temaIdx < data.temas.length - 1) setTemaIdx(temaIdx + 1);
    else setIndice((i) => i + 1);
  };

  if (!actual) {
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
    <div className="fixed inset-x-0 bottom-0 z-40 bg-[var(--surface)] font-sans">
      <audio
        ref={audioRef}
        onPlay={() => setReproduciendo(true)}
        onPause={() => setReproduciendo(false)}
        onEnded={temaSiguiente}
        onError={temaSiguiente}
        className="hidden"
      />

      {listaAbierta && data && (
        <ol className="max-h-[40vh] overflow-y-auto px-4 pt-3 pb-2 max-w-3xl mx-auto space-y-0.5">
          {data.temas.map((t, i) => {
            const activo = i === temaIdx;
            return (
              <li key={`${t.titulo}-${i}`}>
                <button
                  type="button"
                  onClick={() => setTemaIdx(i)}
                  className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-[var(--r-s)] text-left transition-ui ${
                    activo ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)]' : 'text-[var(--ink)] hover:bg-[var(--sunken)]'
                  }`}
                >
                  <span className="w-5 text-micro tabular-nums text-[var(--ink-2)] text-right">
                    {activo && reproduciendo ? <Pause className="w-3.5 h-3.5 inline" /> : i + 1}
                  </span>
                  {t.imagen && <img src={t.imagen} alt="" className="size-8 rounded-[var(--r-s)] object-cover" />}
                  <span className="flex-1 min-w-0 truncate text-sm font-semibold">{t.titulo}</span>
                </button>
              </li>
            );
          })}
        </ol>
      )}

      <div className="px-4 py-3 max-w-3xl mx-auto flex items-center gap-3">
        {data?.imagen ? (
          <img src={data.imagen} alt="" className="size-10 rounded-full object-cover shrink-0" />
        ) : (
          <div className="size-10 rounded-full bg-[var(--sunken)] shrink-0" aria-hidden />
        )}

        <div className="min-w-0 flex-1">
          <div className="font-bold text-sm text-[var(--ink)] truncate">{actual.nombre}</div>
          <div className="text-micro text-[var(--ink-2)] truncate">
            {cargando && 'Buscando canciones…'}
            {sinPreview && 'No se pudo cargar el preview'}
            {tema && `${tema.titulo} · ${temaIdx + 1}/${data?.temas.length} · 30 s`}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <IconButton label="Anterior" onClick={temaAnterior} disabled={indice === 0 && temaIdx === 0}>
            <SkipBack className="w-4 h-4" />
          </IconButton>
          <Button variant="primary" size="icon-sm" onClick={alternar} disabled={!tema} aria-label={reproduciendo ? 'Pausa' : 'Reproducir'}>
            {reproduciendo ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <IconButton label="Siguiente" onClick={temaSiguiente} disabled={indice >= cola.length - 1 && (!data || temaIdx >= data.temas.length - 1)}>
            <SkipForward className="w-4 h-4" />
          </IconButton>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          {actual.spotifyUrl && (
            <a
              href={actual.spotifyUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-micro text-[var(--acc-ink)] hover:underline px-2"
              title="Abrir en Spotify"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Spotify
            </a>
          )}
        </div>

        {data && (
          <IconButton label={listaAbierta ? 'Ocultar canciones' : 'Ver canciones'} onClick={() => setListaAbierta((v) => !v)}>
            {listaAbierta ? <ChevronDown className="w-4 h-4" /> : <ListMusic className="w-4 h-4" />}
          </IconButton>
        )}

        <IconButton label="Cerrar reproductor" onClick={onClose}>
          <X className="w-4 h-4" />
        </IconButton>
      </div>
    </div>
  );
};
