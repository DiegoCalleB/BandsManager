import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { getLowLatencyAudioStream, getSystemAudioLatencyMs } from '../utils/audioLatency';
import { limitarOffset, offsetInicial } from '../utils/grabarIdea';

export type FaseGrabacion = 'reposo' | 'grabando' | 'revisando';

export interface TomaGrabada {
  blob: Blob;
  url: string;
  mime: string;
}

/**
 * Graba una toma «en seco» (solo el micro) mientras suena el audio del Atril por los auriculares.
 * La toma arranca con el audio en 0; `offset` (s) es cuánto hay que adelantarla al reproducirla
 * para que caiga sobre la música (latencia de salida + entrada), y se afina a mano al revisarla.
 */
export function useGrabarIdea(audioRef: RefObject<HTMLAudioElement | null>) {
  const [fase, setFase] = useState<FaseGrabacion>('reposo');
  const [segundos, setSegundos] = useState(0);
  const [toma, setToma] = useState<TomaGrabada | null>(null);
  const [offset, setOffsetEstado] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const grabadora = useRef<MediaRecorder | null>(null);
  const flujo = useRef<MediaStream | null>(null);
  const trozos = useRef<Blob[]>([]);
  const reloj = useRef<ReturnType<typeof setInterval> | null>(null);
  const tomaUrl = useRef<string | null>(null);

  const liberarFlujo = () => {
    flujo.current?.getTracks().forEach((t) => t.stop());
    flujo.current = null;
    if (reloj.current) clearInterval(reloj.current);
    reloj.current = null;
  };

  const descartar = useCallback(() => {
    if (tomaUrl.current) URL.revokeObjectURL(tomaUrl.current);
    tomaUrl.current = null;
    setToma(null);
    setSegundos(0);
    setFase('reposo');
  }, []);

  const empezar = useCallback(async () => {
    setError(null);
    try {
      // Sin cancelación de eco ni supresión: con auriculares no hace falta y deforman el instrumento.
      const stream = await getLowLatencyAudioStream({ echoCancellation: false, noiseSuppression: false, autoGainControl: false });
      flujo.current = stream;
      const mime = ['audio/webm;codecs=opus', 'audio/mp4'].find((m) => MediaRecorder.isTypeSupported(m));
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      grabadora.current = rec;
      trozos.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) trozos.current.push(e.data); };
      rec.onstop = () => {
        const tipo = rec.mimeType || mime || 'audio/webm';
        const blob = new Blob(trozos.current, { type: tipo });
        const url = URL.createObjectURL(blob);
        tomaUrl.current = url;
        setToma({ blob, url, mime: tipo });
        setFase('revisando');
        liberarFlujo();
      };
      const maestro = audioRef.current;
      let latenciaMs = 0;
      if (maestro) {
        maestro.currentTime = 0;
        await maestro.play().catch(() => {});
        const ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (ctx) {
          const c = new ctx();
          latenciaMs = getSystemAudioLatencyMs(c);
          void c.close();
        }
      }
      setOffsetEstado(offsetInicial(latenciaMs, navigator.userAgent));
      rec.start(100);
      setSegundos(0);
      setFase('grabando');
      reloj.current = setInterval(() => setSegundos((s) => s + 1), 1000);
    } catch (e) {
      liberarFlujo();
      setFase('reposo');
      setError(e instanceof Error ? e.message : 'No se pudo acceder al micrófono.');
    }
  }, [audioRef]);

  const parar = useCallback(() => {
    audioRef.current?.pause();
    if (grabadora.current && grabadora.current.state !== 'inactive') grabadora.current.stop();
  }, [audioRef]);

  const setOffset = useCallback((s: number) => setOffsetEstado(limitarOffset(s)), []);

  useEffect(() => () => {
    if (grabadora.current && grabadora.current.state !== 'inactive') grabadora.current.stop();
    liberarFlujo();
    if (tomaUrl.current) URL.revokeObjectURL(tomaUrl.current);
  }, []);

  return { fase, segundos, toma, offset, setOffset, error, empezar, parar, descartar };
}
