import React, { useState, useEffect, useRef } from 'react';
import { Song, ThemeColors } from '../types';
import {
  Play, Pause, SkipBack, SkipForward, Repeat, Volume2, VolumeX,
  ExternalLink, Disc, Sliders, X, Flame, Music, Sparkles, FileText, ChevronUp, ChevronDown
} from 'lucide-react';
import { parseGoogleDriveAudioUrl, isGoogleDriveUrl, resolveAudioUrl } from '../utils/audioStorage';
import { CROSSFADE_SECONDS, computeCrossfadeGains, shouldCrossfade } from '../utils/crossfade';

interface SpotifyPlayerBarProps {
  song: Song | null;
  songs: Song[];
  colors: ThemeColors;
  onSelectSong: (song: Song, autoPlay?: boolean) => void;
  onOpenStudio: (song: Song) => void;
  onUpdateSong?: (song: Song) => void;
  onClosePlayer: () => void;
  autoPlay?: boolean;
  playSignal?: number;
  onIsPlayingChange?: (isPlaying: boolean) => void;
}

function getRawAudioUrl(song: Song | null | undefined): string {
  if (!song) return '';
  return song.audioPrincipalUrl || (song.audioIdeas && song.audioIdeas[0]?.audioUrl) || (song as any).audioUrl || '';
}

export default function SpotifyPlayerBar({
  song,
  songs,
  colors,
  onSelectSong,
  onOpenStudio,
  onUpdateSong,
  onClosePlayer,
  autoPlay = false,
  playSignal = 0,
  onIsPlayingChange
}: SpotifyPlayerBarProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isMinimized, setIsMinimized] = useState(false);
  // Fundido real (5s, curva de potencia constante) al pasar al siguiente tema de la cola —
  // desactivado por defecto, mismo interruptor tanto si la cola es el catálogo, un álbum de
  // Discografía o un repertorio (ver `songs`, que decide qué es "el siguiente tema" en cada caso).
  const [crossfadeEnabled, setCrossfadeEnabled] = useState(false);
  const [isCrossfading, setIsCrossfading] = useState(false);

  // Dos <audio> en vez de uno: durante un fundido, uno termina el tema actual mientras el otro ya
  // reproduce el siguiente desde cero (mismo patrón que useStagePlayer.ts). `activeSlotRef` dice
  // cuál de los dos es "el de siempre" a efectos de play/pause/seek/volumen manuales — el otro
  // solo se usa como pista temporal de solape mientras dura el fundido.
  const audioRefA = useRef<HTMLAudioElement | null>(null);
  const audioRefB = useRef<HTMLAudioElement | null>(null);
  const activeSlotRef = useRef<'A' | 'B'>('A');
  const getActiveAudioEl = () => (activeSlotRef.current === 'A' ? audioRefA.current : audioRefB.current);
  const getInactiveAudioEl = () => (activeSlotRef.current === 'A' ? audioRefB.current : audioRefA.current);

  // Audio Synth fallback for songs without custom audio file
  const synthIntervalRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [activeAudioUrl, setActiveAudioUrl] = useState<string>('');

  const crossfadeRafRef = useRef<number | null>(null);
  const isCrossfadingRef = useRef(false);
  // Id de la última canción que llegó aquí por un fundido recién completado — le dice al efecto
  // de "cambió la canción" que ese tema ya está sonando de verdad (arrancó durante el fundido) y
  // que NO debe recargar el audio ni relanzar la reproducción desde cero.
  const promotedSongIdRef = useRef<string | null>(null);

  const cancelCrossfade = () => {
    if (crossfadeRafRef.current !== null) {
      cancelAnimationFrame(crossfadeRafRef.current);
      crossfadeRafRef.current = null;
    }
    if (isCrossfadingRef.current) {
      const inactive = getInactiveAudioEl();
      if (inactive) {
        inactive.pause();
        inactive.volume = isMuted ? 0 : volume;
      }
      const active = getActiveAudioEl();
      if (active) active.volume = isMuted ? 0 : volume;
      isCrossfadingRef.current = false;
      setIsCrossfading(false);
    }
  };

  // Extract and resolve active audio URL asynchronously (supporting IndexedDB & Drive)
  useEffect(() => {
    let isMounted = true;
    if (!song) {
      setActiveAudioUrl('');
      return;
    }

    const rawUrl = getRawAudioUrl(song);

    if (!rawUrl) {
      setActiveAudioUrl('');
      return;
    }

    resolveAudioUrl(rawUrl).then((resolved) => {
      if (isMounted) {
        setActiveAudioUrl(resolved);
      }
    }).catch(err => {
      console.warn('Error resolving audio URL:', err);
      if (isMounted) setActiveAudioUrl('');
    });

    return () => {
      isMounted = false;
    };
  }, [song]);

  // Sync isPlaying state to parent if callback provided
  useEffect(() => {
    onIsPlayingChange?.(isPlaying);
  }, [isPlaying, onIsPlayingChange]);

  const lastHandledSignalRef = useRef<number>(0);
  const lastSongIdRef = useRef<string | null>(null);

  // Cualquier cambio de canción que NO venga de un fundido recién completado corta un fundido en
  // curso — sin esto, terminaría aplicándose sobre la pista equivocada.
  useEffect(() => {
    if (promotedSongIdRef.current === song?.id) return;
    cancelCrossfade();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song?.id]);

  // When song, activeAudioUrl, autoPlay, or playSignal changes
  useEffect(() => {
    if (!song) {
      setIsPlaying(false);
      lastSongIdRef.current = null;
      return;
    }

    const isNewSong = lastSongIdRef.current !== song.id;
    lastSongIdRef.current = song.id;

    if (promotedSongIdRef.current === song.id) {
      // Este tema llegó aquí por un fundido: ya está sonando de verdad desde antes (arrancó en
      // el elemento <audio> inactivo mientras el anterior terminaba) — solo se refresca la
      // duración (real, leída directamente del elemento ya activo) para la UI, sin tocar el audio.
      const activeEl = getActiveAudioEl();
      const realDuration = activeEl?.duration;
      setDuration(realDuration && isFinite(realDuration) ? realDuration : (song.duracionSegundos || 210));
      return;
    }

    const hasNewPlaySignal = !!(playSignal && playSignal !== lastHandledSignalRef.current);
    if (playSignal) {
      lastHandledSignalRef.current = playSignal;
    }

    const shouldPlayNow = autoPlay || hasNewPlaySignal;

    setCurrentTime(0);
    const estDuration = song.duracionSegundos || 210;
    setDuration(estDuration);

    const activeEl = getActiveAudioEl();

    if (activeAudioUrl) {
      if (activeEl) {
        activeEl.src = activeAudioUrl;
        activeEl.playbackRate = playbackRate;
        activeEl.volume = isMuted ? 0 : volume;

        if (shouldPlayNow) {
          activeEl.currentTime = 0;
          activeEl.play().then(() => {
            setIsPlaying(true);
          }).catch(err => {
            console.warn('Playback deferred or blocked:', err);
            setIsPlaying(false);
          });
        } else if (isNewSong) {
          activeEl.pause();
          activeEl.currentTime = 0;
          setIsPlaying(false);
        } else if (!autoPlay && !hasNewPlaySignal) {
          activeEl.pause();
          setIsPlaying(false);
        }
      }
    } else {
      if (shouldPlayNow) {
        setIsPlaying(true);
      } else if (isNewSong) {
        setIsPlaying(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song, activeAudioUrl, autoPlay, playSignal]);

  // Playback rate effect
  useEffect(() => {
    const el = getActiveAudioEl();
    if (el) el.playbackRate = playbackRate;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackRate]);

  // Volume effect
  useEffect(() => {
    if (isCrossfadingRef.current) return; // el fundido lleva el volumen de las dos pistas mientras dura
    const el = getActiveAudioEl();
    if (el) el.volume = isMuted ? 0 : volume;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume, isMuted]);

  // Loop effect
  useEffect(() => {
    const el = getActiveAudioEl();
    if (el) el.loop = isLooping;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLooping]);

  // Synthetic practice beat generator when no audio URL exists
  useEffect(() => {
    if (isPlaying && !activeAudioUrl && song) {
      const bpm = song.bpm || 120;
      const intervalMs = (60 / bpm) * 1000;

      synthIntervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + (60 / bpm);
          if (next >= (song.duracionSegundos || 210)) {
            if (isLooping) return 0;
            setIsPlaying(false);
            return 0;
          }
          return next;
        });

        // Simple subtle click synth sound for practice
        try {
          if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          }
          if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
          }
          const osc = audioCtxRef.current.createOscillator();
          const gain = audioCtxRef.current.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, audioCtxRef.current.currentTime);
          gain.gain.setValueAtTime(0.05, audioCtxRef.current.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.08);
          osc.connect(gain);
          gain.connect(audioCtxRef.current.destination);
          osc.start();
          osc.stop(audioCtxRef.current.currentTime + 0.08);
        } catch {
          // ignore web audio context limits
        }
      }, intervalMs);
    } else {
      if (synthIntervalRef.current) {
        clearInterval(synthIntervalRef.current);
      }
    }

    return () => {
      if (synthIntervalRef.current) {
        clearInterval(synthIntervalRef.current);
      }
    };
  }, [isPlaying, activeAudioUrl, song, isLooping]);

  // Cancela cualquier fundido pendiente al desmontar el reproductor.
  useEffect(() => {
    return () => cancelCrossfade();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!song) return null;

  const currentIdx = songs.findIndex(s => s.id === song.id);
  // Mismo cálculo que handleNext (con vuelta al principio de la cola) — se usa tanto para saltar
  // manualmente como para saber a qué tema fundir cuando se acerca el final del actual.
  const nextQueueSong: Song | null = songs.length > 0
    ? (currentIdx >= 0 && currentIdx < songs.length - 1 ? songs[currentIdx + 1] : songs[0])
    : null;

  const handlePrev = () => {
    cancelCrossfade();
    if (currentIdx > 0) {
      onSelectSong(songs[currentIdx - 1]);
    } else {
      onSelectSong(songs[songs.length - 1]);
    }
  };

  const handleNext = (autoPlayNext: boolean = false) => {
    cancelCrossfade();
    if (currentIdx >= 0 && currentIdx < songs.length - 1) {
      onSelectSong(songs[currentIdx + 1], autoPlayNext);
    } else {
      onSelectSong(songs[0], autoPlayNext);
    }
  };

  const handleEnded = () => {
    if (isLooping) {
      const el = getActiveAudioEl();
      if (el) {
        el.currentTime = 0;
        el.play();
      }
    } else {
      // Al terminar una canción, la siguiente debe reproducirse automáticamente (autoPlay=true)
      handleNext(true);
    }
  };

  const togglePlayPause = () => {
    const el = getActiveAudioEl();
    if (activeAudioUrl && el) {
      if (isPlaying) {
        el.pause();
        setIsPlaying(false);
      } else {
        el.play().then(() => setIsPlaying(true)).catch(console.error);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
    const el = getActiveAudioEl();
    if (el && activeAudioUrl) {
      el.currentTime = newTime;
    }
  };

  // Arranca el fundido cruzado cuando quedan CROSSFADE_SECONDS o menos del tema actual — llamado
  // desde onTimeUpdate del <audio> activo en vez de un setInterval propio, así no hay dos relojes
  // compitiendo por decidir "cuánto queda".
  const handleActiveTimeUpdate = (currentTimeSec: number) => {
    setCurrentTime(currentTimeSec);

    if (!crossfadeEnabled || isLooping || isCrossfadingRef.current) return;
    if (!nextQueueSong || nextQueueSong.id === song.id) return; // cola de un solo tema: nada que fundir
    if (!duration || !shouldCrossfade(duration) || duration - currentTimeSec > CROSSFADE_SECONDS) return;

    const nextRawUrl = getRawAudioUrl(nextQueueSong);
    if (!nextRawUrl) return;

    const fromEl = getActiveAudioEl();
    const toEl = getInactiveAudioEl();
    if (!fromEl || !toEl) return;

    isCrossfadingRef.current = true;
    setIsCrossfading(true);
    const baseVolume = isMuted ? 0 : volume;

    resolveAudioUrl(nextRawUrl).then((resolved) => {
      if (!resolved || !isCrossfadingRef.current) {
        isCrossfadingRef.current = false;
        setIsCrossfading(false);
        return;
      }
      toEl.src = resolved;
      toEl.currentTime = 0;
      toEl.volume = 0;
      toEl.playbackRate = playbackRate;
      toEl.play().catch(() => {
        isCrossfadingRef.current = false;
        setIsCrossfading(false);
      });

      const fadeMs = CROSSFADE_SECONDS * 1000;
      const startTs = performance.now();

      const tick = () => {
        if (!isCrossfadingRef.current) return; // cancelado a mitad de camino (cancelCrossfade)
        const elapsed = performance.now() - startTs;
        const { fromGain, toGain } = computeCrossfadeGains(elapsed, fadeMs);
        fromEl.volume = fromGain * baseVolume;
        toEl.volume = toGain * baseVolume;

        if (elapsed < fadeMs) {
          crossfadeRafRef.current = requestAnimationFrame(tick);
          return;
        }

        // Fundido completo: A se pausa/limpia y B pasa a ser la pista "activa" de verdad.
        fromEl.pause();
        fromEl.volume = baseVolume;
        toEl.volume = baseVolume;
        activeSlotRef.current = activeSlotRef.current === 'A' ? 'B' : 'A';
        promotedSongIdRef.current = nextQueueSong.id;
        isCrossfadingRef.current = false;
        setIsCrossfading(false);
        crossfadeRafRef.current = null;
        onSelectSong(nextQueueSong, false);
      };
      crossfadeRafRef.current = requestAnimationFrame(tick);
    }).catch(() => {
      isCrossfadingRef.current = false;
      setIsCrossfading(false);
    });
  };

  const formatSecs = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isDrive = isGoogleDriveUrl(song.audioPrincipalUrl || '');

  // z-50, no z-40: App.tsx tiene su propia barra de pestañas fija en móvil a z-40 (bottom-0,
  // h-16) — con el mismo z-index, cuál tapa a cuál dependería del orden en el DOM y podría acabar
  // esta barra debajo de esa. Se renderiza vía portal a document.body (ver
  // RepertorioSetlists.tsx), así que z-50 la deja siempre por encima sin pelear por el orden.
  // left-0 en móvil, md:left-[240px] en desktop para no tapar el sidebar (w-[240px]) de App.tsx.
  // En móvil: bottom-[64px] para no tapar la barra de navegación inferior (h-16 = 64px).
  return (
    <div className={`fixed bottom-[64px] sm:bottom-0 left-0 md:left-[240px] right-0 z-50 transition-all duration-300 shadow-2xl ${
      isMinimized ? 'translate-y-[calc(100%-2.5rem)]' : 'translate-y-0'
    }`}>
      {/* Dos <audio> en vez de uno (ver activeSlotRef arriba) — solo el activo actualiza el reloj
          en pantalla y decide cuándo fundir; el otro solo se usa como pista temporal de solape. */}
      <audio
        ref={audioRefA}
        preload="auto"
        onTimeUpdate={() => { if (activeSlotRef.current === 'A' && audioRefA.current) handleActiveTimeUpdate(audioRefA.current.currentTime); }}
        onLoadedMetadata={() => { if (activeSlotRef.current === 'A' && audioRefA.current?.duration) setDuration(audioRefA.current.duration); }}
        onEnded={() => { if (activeSlotRef.current === 'A') handleEnded(); }}
      />
      <audio
        ref={audioRefB}
        preload="auto"
        onTimeUpdate={() => { if (activeSlotRef.current === 'B' && audioRefB.current) handleActiveTimeUpdate(audioRefB.current.currentTime); }}
        onLoadedMetadata={() => { if (activeSlotRef.current === 'B' && audioRefB.current?.duration) setDuration(audioRefB.current.duration); }}
        onEnded={() => { if (activeSlotRef.current === 'B') handleEnded(); }}
      />

      <div className="bg-[#121212]/98 backdrop-blur-2xl border-t border-[#282828] text-white px-4 py-3 max-w-full shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">

          {/* Left: Song Info */}
          <div className="flex items-center justify-between w-full md:w-1/4 min-w-0">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative shrink-0 w-14 h-14 rounded-lg bg-[#282828] shadow-md overflow-hidden group border border-white/5">
                {song.portadaUrl ? (
                  <img src={song.portadaUrl} alt={song.titulo} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#1db954]/30 via-zinc-800 to-black flex items-center justify-center">
                    <Disc className={`w-7 h-7 ${isPlaying ? 'animate-spin-slow text-[#1db954]' : 'text-zinc-400'}`} />
                  </div>
                )}
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-0.5">
                    <span className="w-1 h-4 bg-[#1db954] rounded-full animate-pulse" />
                    <span className="w-1 h-6 bg-[#1ed760] rounded-full animate-pulse delay-75" />
                    <span className="w-1 h-3 bg-[#1db954] rounded-full animate-pulse delay-150" />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white hover:underline cursor-pointer truncate">{song.titulo}</h4>
                  {onUpdateSong && (
                    <button
                      type="button"
                      onClick={() => onUpdateSong({ ...song, favoritoGeneral: !song.favoritoGeneral })}
                      className="text-zinc-400 hover:text-[#1db954] transition cursor-pointer p-0.5"
                      title={song.favoritoGeneral ? "Guardado en Favoritos" : "Guardar en Favoritos"}
                    >
                      <Sparkles className={`w-4 h-4 ${song.favoritoGeneral ? 'text-[#1db954] fill-[#1db954]' : ''}`} />
                    </button>
                  )}
                  {isDrive && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                      Drive
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#b3b3b3] font-mono mt-0.5 truncate">
                  <span className="text-white font-medium">{song.artista || 'Banda'}</span>
                  <span>•</span>
                  <span className="text-[#1db954] font-semibold">{song.tonalidad || 'Am'}</span>
                  <span>•</span>
                  <span>{song.bpm} BPM</span>
                  {isCrossfading && nextQueueSong && (
                    <>
                      <span>•</span>
                      <span className="text-sky-400 font-semibold animate-pulse">🔀 → {nextQueueSong.titulo}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Minimizar a una tira de ~2.5rem (ver el translate-y de más arriba) — antes solo
                disponible en móvil (`md:hidden`); ahora también en escritorio, para poder dejar
                la barra ocupando lo mínimo cuando no hace falta verla entera. */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-zinc-400 hover:text-white cursor-pointer"
                title={isMinimized ? "Expandir Reproductor" : "Minimizar"}
              >
                {isMinimized ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Center: Playback Controls & Timeline Scrubber */}
          <div className="flex flex-col items-center gap-1.5 w-full md:w-2/4">

            {/* Control Buttons */}
            <div className="flex items-center gap-4">
              {/* Loop Practice Toggle */}
              <button
                onClick={() => setIsLooping(!isLooping)}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${
                  isLooping
                    ? 'text-[#1db954] bg-[#1db954]/10'
                    : 'text-[#b3b3b3] hover:text-white'
                }`}
                title={isLooping ? "Repetir tema activado" : "Activar Bucle"}
              >
                <Repeat className="w-4 h-4" />
              </button>

              {/* Prev Song */}
              <button
                onClick={() => handlePrev()}
                className="p-1 text-[#b3b3b3] hover:text-white transition-all cursor-pointer active:scale-90"
                title="Canción Anterior"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              {/* Play / Pause - Authentic Spotify Green Circle */}
              <button
                onClick={togglePlayPause}
                className="w-10 h-10 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-bold flex items-center justify-center shadow-lg cursor-pointer transition-all hover:scale-105 active:scale-95"
                title={isPlaying ? "Pausar" : "Reproducir Canción"}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              {/* Next Song */}
              <button
                onClick={() => handleNext(false)}
                className="p-1 text-[#b3b3b3] hover:text-white transition-all cursor-pointer active:scale-90"
                title="Siguiente Canción"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>

              {/* Crossfade Toggle — fundido real de 5s al pasar al siguiente tema de la cola */}
              <button
                onClick={() => setCrossfadeEnabled(!crossfadeEnabled)}
                className={`p-1.5 rounded-full transition-all cursor-pointer text-sm ${
                  crossfadeEnabled
                    ? 'text-sky-400 bg-sky-400/10'
                    : 'text-[#b3b3b3] hover:text-white'
                }`}
                title={crossfadeEnabled ? "Fundido entre temas activado (5s)" : "Activar fundido entre temas (5s)"}
              >
                🔀
              </button>

              {/* Speed multiplier selector */}
              <select
                value={playbackRate}
                onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                className="bg-[#282828] text-[#1db954] text-[10px] font-mono rounded px-1.5 py-1 cursor-pointer hover:bg-zinc-700 focus:outline-none border border-white/5"
                title="Velocidad de Reproducción"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1.0}>1.0x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
              </select>
            </div>

            {/* Timeline Slider */}
            <div className="w-full flex items-center gap-2 text-[11px] font-mono text-[#b3b3b3]">
              <span className="w-9 text-right shrink-0">{formatSecs(currentTime)}</span>

              <div className="relative flex-1 flex items-center">
                <input
                  type="range"
                  min={0}
                  max={duration || 210}
                  step={0.5}
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="w-full h-1 bg-[#4d4d4d] rounded-lg appearance-none cursor-pointer accent-[#1db954] hover:accent-[#1ed760] focus:outline-none"
                />
              </div>

              <span className="w-9 text-left shrink-0">{formatSecs(duration)}</span>
            </div>
          </div>

          {/* Right: Actions & Volume */}
          <div className="flex items-center justify-end gap-2.5 w-full md:w-1/4">

            {/* Chords link if available */}
            {song.enlaceAcordes && (
              <a
                href={song.enlaceAcordes}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-[#282828] hover:bg-[#3e3e3e] text-[#b3b3b3] hover:text-white text-xs font-mono flex items-center gap-1 transition-all cursor-pointer"
                title="Ver Acordes / Partitura"
              >
                <FileText className="w-3.5 h-3.5 text-[#1db954]" />
                <span className="hidden lg:inline text-[11px]">Acordes</span>
              </a>
            )}

            {/* Studio / Arreglos Button */}
            <button
              onClick={() => onOpenStudio(song)}
              className="px-3 py-1.5 rounded-full bg-[#1db954]/15 hover:bg-[#1db954]/25 text-[#1ed760] border border-[#1db954]/30 font-bold text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title="Abrir Estudio de Arreglos e Ideas"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="text-[11px]">Estudio</span>
            </button>

            {/* Volume */}
            <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-[#282828]">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-[#b3b3b3] hover:text-white p-1"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  setIsMuted(false);
                }}
                className="w-16 h-1 bg-[#4d4d4d] rounded-lg appearance-none cursor-pointer accent-[#1db954]"
              />
            </div>

            {/* Close Player */}
            <button
              onClick={onClosePlayer}
              className="p-1.5 text-zinc-500 hover:text-white transition-all ml-1"
              title="Cerrar Reproductor"
            >
              <X className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}
