import { useEffect, type RefObject } from 'react';
import type { AudioTrack } from '../types';
import { resolveAudioUrl } from '../utils/audioStorage';

const DERIVA_MAX_S = 0.15;

/**
 * Reproduce `pistas` (stems) siguiendo al `<audio>` principal, que sigue siendo el reloj del visor
 * (acordes, letra y barra de posición no cambian). Cuando hay pistas, el principal se silencia.
 * Con `pistas` vacío no hace nada y el principal suena entero.
 */
export function useMezclaStems(audioRef: RefObject<HTMLAudioElement | null>, pistas: AudioTrack[], audioUrl: string): void {
  const clave = pistas.map((p) => p.id).join('|');

  useEffect(() => {
    const maestro = audioRef.current;
    if (!maestro || pistas.length === 0) return;
    let vivo = true;
    maestro.muted = true;
    const esclavos: HTMLAudioElement[] = [];

    const alinear = () => {
      for (const el of esclavos) if (Math.abs(el.currentTime - maestro.currentTime) > DERIVA_MAX_S) el.currentTime = maestro.currentTime;
    };
    const tocar = () => { alinear(); esclavos.forEach((el) => { void el.play().catch(() => {}); }); };
    const parar = () => esclavos.forEach((el) => el.pause());
    const ritmo = () => esclavos.forEach((el) => { el.playbackRate = maestro.playbackRate; });

    maestro.addEventListener('play', tocar);
    maestro.addEventListener('pause', parar);
    maestro.addEventListener('seeked', alinear);
    maestro.addEventListener('timeupdate', alinear);
    maestro.addEventListener('ratechange', ritmo);

    (async () => {
      for (const p of pistas) {
        const el = new Audio();
        el.preload = 'auto';
        el.crossOrigin = 'anonymous';
        el.volume = Math.min(1, Math.max(0, p.volumen ?? 1));
        try { el.src = (await resolveAudioUrl(p.audioUrl)) || p.audioUrl; } catch { el.src = p.audioUrl; }
        if (!vivo) return;
        esclavos.push(el);
      }
      ritmo();
      if (!maestro.paused) tocar();
    })();

    return () => {
      vivo = false;
      maestro.muted = false;
      maestro.removeEventListener('play', tocar);
      maestro.removeEventListener('pause', parar);
      maestro.removeEventListener('seeked', alinear);
      maestro.removeEventListener('timeupdate', alinear);
      maestro.removeEventListener('ratechange', ritmo);
      esclavos.forEach((el) => { el.pause(); el.removeAttribute('src'); el.load(); });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, audioUrl, audioRef]);
}
