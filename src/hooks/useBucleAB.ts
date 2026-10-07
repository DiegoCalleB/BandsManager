import { useCallback, useEffect, useState, type RefObject } from 'react';
import { marcarExtremo, saltoDeBucle, SIN_BUCLE, type BucleAB } from '../utils/bucleAB';

/**
 * Bucle A/B sobre el `<audio>` principal del Atril. Los stems siguen al principal, así que
 * saltar el principal basta para que todo el bucle suene alineado.
 */
export function useBucleAB(audioRef: RefObject<HTMLAudioElement | null>, audioUrl: string) {
  const [bucle, setBucle] = useState<BucleAB>(SIN_BUCLE);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || bucle.b == null) return;
    const alTiempo = () => {
      const salto = saltoDeBucle(el.currentTime, bucle.a, bucle.b);
      if (salto != null) el.currentTime = salto;
    };
    el.addEventListener('timeupdate', alTiempo);
    return () => el.removeEventListener('timeupdate', alTiempo);
  }, [audioRef, audioUrl, bucle]);

  const marcar = useCallback(
    (extremo: 'a' | 'b') => {
      const t = audioRef.current?.currentTime;
      if (t != null) setBucle((b) => marcarExtremo(b, extremo, t));
    },
    [audioRef],
  );
  const limpiar = useCallback(() => setBucle(SIN_BUCLE), []);

  return { bucle, marcar, limpiar };
}
