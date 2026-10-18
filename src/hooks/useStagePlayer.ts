import { useState, useEffect, useMemo, useRef } from 'react';
import { Setlist, Song } from '../types';
import { getAudioContextClass } from '../components/song_studio/audioContext';
import { resolveAudioUrl } from '../utils/audioStorage';
import { CROSSFADE_SECONDS, computeCrossfadeGains, shouldCrossfade } from '../utils/crossfade';

/** Reproductor del Modo Escenario sobre el setlist activo (reproducción, autoplay y progreso). */
export function useStagePlayer(activeSetlist: Setlist | null, songs: Song[], parseMmSsToSeconds: (timeStr: string) => number) {
  // Stage Mode Concert Player State (Modo Escenario)
  const [stagePlayingIndex, setStagePlayingIndex] = useState<number | null>(null);
  const [stageIsPlaying, setStageIsPlaying] = useState<boolean>(false);
  const [stageAutoplayNext, setStageAutoplayNext] = useState<boolean>(true);
  const [stageCurrentTime, setStageCurrentTime] = useState<number>(0);
  const [stageResolvedUrl, setStageResolvedUrl] = useState<string>('');
  // Fundido real entre canciones consecutivas — desactivado por defecto: el corte duro de siempre
  // no cambia para nadie hasta que se active explícitamente desde Modo Escenario.
  const [stageCrossfadeEnabled, setStageCrossfadeEnabled] = useState<boolean>(false);
  const [isCrossfading, setIsCrossfading] = useState<boolean>(false);

  // Dos elementos <audio> en vez de uno: durante un fundido, uno sigue terminando la canción
  // actual mientras el otro ya ha arrancado la siguiente desde cero. `activeSlot` dice cuál de
  // los dos es "el de siempre" a efectos de play/pause/seek manuales — el otro solo se usa como
  // pista temporal de solape mientras dura el fundido.
  const stageAudioRef = useRef<HTMLAudioElement | null>(null);
  const stageAudioRefB = useRef<HTMLAudioElement | null>(null);
  const activeSlotRef = useRef<'A' | 'B'>('A');
  const [, forceActiveSlotRender] = useState(0);

  const stageSynthIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stageAudioCtxRef = useRef<AudioContext | null>(null);

  const crossfadeRafRef = useRef<number | null>(null);
  const isCrossfadingRef = useRef(false);
  // true justo después de que un fundido complete y promocione el índice — le dice al efecto de
  // "cargar item actual" que este cambio de índice ya tiene su audio sonando (arrancado durante el
  // fundido) y que NO debe recargar/relanzar la reproducción desde cero.
  const pendingCrossfadePromotionRef = useRef(false);

  const getActiveAudioEl = () => (activeSlotRef.current === 'A' ? stageAudioRef.current : stageAudioRefB.current);
  const getInactiveAudioEl = () => (activeSlotRef.current === 'A' ? stageAudioRefB.current : stageAudioRef.current);

  const cancelCrossfade = () => {
    if (crossfadeRafRef.current !== null) {
      cancelAnimationFrame(crossfadeRafRef.current);
      crossfadeRafRef.current = null;
    }
    if (isCrossfadingRef.current) {
      const inactive = getInactiveAudioEl();
      if (inactive) {
        inactive.pause();
        inactive.volume = 1;
      }
      const active = getActiveAudioEl();
      if (active) active.volume = 1;
      isCrossfadingRef.current = false;
      setIsCrossfading(false);
    }
  };

  // Cualquier cambio de índice que NO venga de un fundido recién completado (clic en una fila,
  // Siguiente/Anterior, cambio de setlist) corta un fundido en curso — sin esto, terminaría
  // aplicándose sobre la pista equivocada.
  useEffect(() => {
    if (pendingCrossfadePromotionRef.current) return;
    cancelCrossfade();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stagePlayingIndex]);

  // Audio y duración del ítem activo: se derivan al renderizar (no hace falta estado ni efecto).
  const itemActivo = useMemo(() => {
    const item = stagePlayingIndex === null ? undefined : activeSetlist?.items[stagePlayingIndex];
    if (!item) return null;
    if (item.tipoItem === 'cancion' && item.songId) {
      const song = songs.find((s) => s.id === item.songId);
      return {
        rawUrl: song ? song.audioPrincipalUrl || (song.audioIdeas && song.audioIdeas[0]?.audioUrl) || song.audioUrl || '' : '',
        durationSec: song ? song.duracionSegundos || parseMmSsToSeconds(song.duracion) || 210 : 180,
      };
    }
    return {
      rawUrl: item.audioUrl || '',
      durationSec: item.duracionEstimadaSegundos ?? (item.duracionEstimadaMinutos || 2) * 60,
    };
  }, [stagePlayingIndex, activeSetlist, songs, parseMmSsToSeconds]);
  const rawUrl = itemActivo?.rawUrl ?? '';
  const stageItemDuration = itemActivo ? (itemActivo.durationSec > 0 ? itemActivo.durationSec : 120) : 210;

  // Ajuste de estado al renderizar: cualquier cambio de índice, setlist o canciones reinicia el reloj,
  // y un ítem sin audio no puede conservar la url resuelta del anterior.
  const [claveCarga, setClaveCarga] = useState({ stagePlayingIndex, activeSetlist, songs });
  if (claveCarga.stagePlayingIndex !== stagePlayingIndex || claveCarga.activeSetlist !== activeSetlist || claveCarga.songs !== songs) {
    setClaveCarga({ stagePlayingIndex, activeSetlist, songs });
    setStageCurrentTime(0);
  }
  if (!rawUrl && stageResolvedUrl !== '') setStageResolvedUrl('');

  // Resuelve el audio del ítem activo y lo carga en el reproductor.
  useEffect(() => {
    if (!itemActivo) return;
    // El audio de un ítem promocionado por un fundido cruzado ya está sonando (arrancó durante el
    // fundido): solo se actualiza la url para la UI, sin recargar ni relanzar la reproducción
    // (eso reiniciaría la pista que ya viene sonando del fundido).
    const yaSonando = pendingCrossfadePromotionRef.current;
    pendingCrossfadePromotionRef.current = false;
    if (!rawUrl) return;

    resolveAudioUrl(rawUrl)
      .then((resolved) => {
        setStageResolvedUrl(resolved);
        if (yaSonando) return;
        const activeEl = getActiveAudioEl();
        if (activeEl) {
          activeEl.src = resolved;
          if (stageIsPlaying) {
            activeEl.play().catch(console.warn);
          }
        }
      })
      .catch(() => setStageResolvedUrl(''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stagePlayingIndex, activeSetlist, songs]);

  // Synthetic timer when no real audio file exists in Stage Mode
  useEffect(() => {
    if (stageIsPlaying && !stageResolvedUrl && stagePlayingIndex !== null && activeSetlist) {
      stageSynthIntervalRef.current = setInterval(() => {
        setStageCurrentTime((prev) => {
          const next = prev + 1;
          if (next >= stageItemDuration) {
            // Current track / speech finished -> Auto move to next item if autoplay enabled
            if (stageAutoplayNext && stagePlayingIndex < activeSetlist.items.length - 1) {
              setStagePlayingIndex(stagePlayingIndex + 1);
            } else {
              setStageIsPlaying(false);
              setStagePlayingIndex(null);
            }
            return 0;
          }
          return next;
        });

        // Subtle beat tone for simulation
        try {
          if (!stageAudioCtxRef.current) {
            stageAudioCtxRef.current = new (getAudioContextClass())();
          }
          if (stageAudioCtxRef.current.state === 'suspended') {
            stageAudioCtxRef.current.resume();
          }
          const osc = stageAudioCtxRef.current.createOscillator();
          const gain = stageAudioCtxRef.current.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(520, stageAudioCtxRef.current.currentTime);
          gain.gain.setValueAtTime(0.02, stageAudioCtxRef.current.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, stageAudioCtxRef.current.currentTime + 0.06);
          osc.connect(gain);
          gain.connect(stageAudioCtxRef.current.destination);
          osc.start();
          osc.stop(stageAudioCtxRef.current.currentTime + 0.06);
        } catch { /* contexto de audio suspendido o cerrado: el clic del metrónomo se omite */ }
      }, 1000);
    } else {
      if (stageSynthIntervalRef.current) clearInterval(stageSynthIntervalRef.current);
    }

    return () => {
      if (stageSynthIntervalRef.current) clearInterval(stageSynthIntervalRef.current);
    };
  }, [stageIsPlaying, stageResolvedUrl, stagePlayingIndex, stageItemDuration, stageAutoplayNext, activeSetlist]);

  // Cancela cualquier fundido pendiente al desmontar (cambio de pestaña/repertorio).
  useEffect(() => {
    return () => cancelCrossfade();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handlers for Stage Mode Concert Player Controls
  const toggleStagePlayPause = () => {
    if (!activeSetlist || activeSetlist.items.length === 0) return;

    if (stagePlayingIndex === null) {
      setStagePlayingIndex(0);
      setStageIsPlaying(true);
      return;
    }

    const activeEl = getActiveAudioEl();
    if (stageResolvedUrl && activeEl) {
      if (stageIsPlaying) {
        activeEl.pause();
        setStageIsPlaying(false);
      } else {
        activeEl
          .play()
          .then(() => setStageIsPlaying(true))
          .catch((err) => {
            console.warn('Stage playback notice:', err);
            setStageIsPlaying(false);
          });
      }
    } else {
      setStageIsPlaying(!stageIsPlaying);
    }
  };

  const handleStageNext = () => {
    if (!activeSetlist) return;
    cancelCrossfade();
    if (stagePlayingIndex === null) {
      setStagePlayingIndex(0);
      setStageIsPlaying(true);
    } else if (stagePlayingIndex < activeSetlist.items.length - 1) {
      setStagePlayingIndex(stagePlayingIndex + 1);
      setStageIsPlaying(true);
    }
  };

  const handleStagePrev = () => {
    if (!activeSetlist) return;
    cancelCrossfade();
    if (stagePlayingIndex === null) {
      setStagePlayingIndex(0);
      setStageIsPlaying(true);
    } else if (stagePlayingIndex > 0) {
      setStagePlayingIndex(stagePlayingIndex - 1);
      setStageIsPlaying(true);
    }
  };

  const handleStageSeek = (newTime: number) => {
    setStageCurrentTime(newTime);
    const activeEl = getActiveAudioEl();
    if (activeEl && stageResolvedUrl) {
      activeEl.currentTime = newTime;
    }
  };

  const handleStageAudioEnded = () => {
    if (stageAutoplayNext && activeSetlist && stagePlayingIndex !== null && stagePlayingIndex < activeSetlist.items.length - 1) {
      setStagePlayingIndex(stagePlayingIndex + 1);
    } else {
      setStageIsPlaying(false);
      setStagePlayingIndex(null);
    }
  };

  // Sustituye a "onTimeUpdate={(e) => setStageCurrentTime(...)}" — además de llevar el reloj,
  // decide si toca arrancar el fundido cruzado hacia la siguiente canción real del setlist.
  const handleStageTimeUpdate = (currentTimeSec: number) => {
    setStageCurrentTime(currentTimeSec);

    if (!stageCrossfadeEnabled || !stageAutoplayNext || isCrossfadingRef.current) return;
    if (stagePlayingIndex === null || !activeSetlist) return;
    if (stagePlayingIndex >= activeSetlist.items.length - 1) return; // última pista: no hay a qué fundir

    if (!shouldCrossfade(stageItemDuration) || stageItemDuration - currentTimeSec > CROSSFADE_SECONDS) return;

    const nextItem = activeSetlist.items[stagePlayingIndex + 1];
    // Solo se funde entre dos canciones reales — un interludio/presentación después no tiene un
    // "principio de canción" que enganchar, así que cae al corte duro normal de handleStageAudioEnded.
    if (!nextItem || nextItem.tipoItem !== 'cancion' || !nextItem.songId) return;
    const nextSong = songs.find((s) => s.id === nextItem.songId);
    const nextRawUrl = nextSong?.audioPrincipalUrl || nextSong?.audioIdeas?.[0]?.audioUrl || '';
    if (!nextRawUrl) return;

    const fromEl = getActiveAudioEl();
    const toEl = getInactiveAudioEl();
    if (!fromEl || !toEl) return;

    isCrossfadingRef.current = true;
    setIsCrossfading(true);
    const fromIndexAtStart = stagePlayingIndex;

    resolveAudioUrl(nextRawUrl)
      .then((resolved) => {
        if (!resolved || !isCrossfadingRef.current) {
          isCrossfadingRef.current = false;
          setIsCrossfading(false);
          return;
        }
        toEl.src = resolved;
        toEl.currentTime = 0;
        toEl.volume = 0;
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
          fromEl.volume = fromGain;
          toEl.volume = toGain;

          if (elapsed < fadeMs) {
            crossfadeRafRef.current = requestAnimationFrame(tick);
            return;
          }

          // Fundido completo: A se pausa/limpia y B pasa a ser la pista "activa" de verdad.
          fromEl.pause();
          fromEl.volume = 1;
          toEl.volume = 1;
          activeSlotRef.current = activeSlotRef.current === 'A' ? 'B' : 'A';
          forceActiveSlotRender((v) => v + 1);
          pendingCrossfadePromotionRef.current = true;
          isCrossfadingRef.current = false;
          setIsCrossfading(false);
          crossfadeRafRef.current = null;
          setStagePlayingIndex(fromIndexAtStart + 1);
        };

        crossfadeRafRef.current = requestAnimationFrame(tick);
      })
      .catch(() => {
        isCrossfadingRef.current = false;
        setIsCrossfading(false);
      });
  };

  return {
    stageAudioRef,
    stageAudioRefB,
    stagePlayingIndex,
    setStagePlayingIndex,
    stageIsPlaying,
    setStageIsPlaying,
    stageAutoplayNext,
    setStageAutoplayNext,
    stageCurrentTime,
    setStageCurrentTime,
    stageItemDuration,
    stageResolvedUrl,
    stageCrossfadeEnabled,
    setStageCrossfadeEnabled,
    isCrossfading,
    toggleStagePlayPause,
    handleStageNext,
    handleStagePrev,
    handleStageSeek,
    handleStageAudioEnded,
    handleStageTimeUpdate,
  };
}
