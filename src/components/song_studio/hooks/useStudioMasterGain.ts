/**
 * Volumen maestro de Song Studio: nodo de ganancia global del AudioContext y aplicación al volumen de cada elemento
 * Extraído de SongStudioModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { RefObject, useEffect, useRef, useState } from "react";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface StudioMasterGainParams {
  trackAudioRefs: RefObject<Record<string, HTMLAudioElement>>;
  lastPerTrackGainRef: RefObject<Record<string, number>>;
}

/**
 * Volumen maestro de Song Studio: nodo de ganancia global del AudioContext y aplicación al volumen de cada elemento
 * @param params Estado y callbacks del contenedor ({@link StudioMasterGainParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useStudioMasterGain({ trackAudioRefs, lastPerTrackGainRef }: StudioMasterGainParams) {
  // Volumen master de salida del Studio — control personal de escucha (nunca se guarda en song,
  // no es parte de la mezcla de la banda, solo cuánto suena EN TU dispositivo mientras trabajas).
  // Todas las pistas se conectan a este gain compartido en vez de ir directas a ctx.destination.
  const [masterVolume, setMasterVolume] = useState<number>(1);
  const masterGainNodeRef = useRef<GainNode | null>(null);
  const getOrCreateMasterGain = (ctx: AudioContext): GainNode => {
    if (!masterGainNodeRef.current || masterGainNodeRef.current.context !== ctx) {
      const g = ctx.createGain();
      g.gain.value = masterVolume;
      g.connect(ctx.destination);
      masterGainNodeRef.current = g;
    }
    return masterGainNodeRef.current;
  };
  // Para pistas de origen cruzado (Supabase Storage, la mayoría del audio real) el navegador nunca
  // llega a construir el MediaElementAudioSourceNode (ver isSameOriginOrBlob más abajo), así que el
  // GainNode maestro de arriba jamás entra en su cadena de audio — solo sirve para las pistas
  // mismo-origen/blob. Para que el master también afecte a esas pistas hay que aplicarlo al propio
  // `el.volume` nativo (con techo de 1.0: el elemento no puede amplificar por encima del 100%,
  // solo el GainNode puede boostear).
  const applyMasterToElementVolume = (perTrackGain: number) => Math.max(0, Math.min(1, perTrackGain * masterVolume));
  useEffect(() => {
    if (masterGainNodeRef.current) {
      masterGainNodeRef.current.gain.value = masterVolume;
    }
    // El GainNode de arriba solo alcanza a las pistas mismo-origen/blob (ver comentario encima de
    // getOrCreateMasterGain) — para la mayoría de pistas reales (Supabase Storage, origen cruzado)
    // el master no tenía NINGÚN efecto audible hasta este bucle: había que tocarlo a mano en cada
    // <audio> con la última ganancia por pista que updateTrackAudioDSP ya llevaba guardada.
    for (const [trackId, el] of Object.entries(trackAudioRefs.current)) {
      if (!el) continue;
      const perTrackGain = lastPerTrackGainRef.current[trackId] ?? 1;
      try {
        el.volume = applyMasterToElementVolume(perTrackGain);
      } catch { /* limpieza best-effort: puede fallar si el nodo ya se soltó */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masterVolume]);

  return { applyMasterToElementVolume, getOrCreateMasterGain, setMasterVolume, masterVolume };
}
