import { useCallback, useEffect, useRef, useState } from 'react';
import type { AudioTrack, Song, SongAudioIdea } from '../types';
import { apiFetch } from '../utils/api';
import { computeAutoBalanceVolumes } from '../utils/audioLatency';
import { resolveAudioUrl, saveAudioToStorage, uploadFileToServer } from '../utils/audioStorage';
import { resolverAudioUrlParaSubida } from '../utils/audioParaSubida';
import { getIdeaTracks } from '../utils/irisTracks';
import { separateAudioIntoStems, type IsolatedStemResult } from '../utils/stemSeparator';
import {
  autorDeSeparacion,
  avanzarProgreso,
  describirErrorSeparacion,
  esErrorDeRed,
  esperaMaximaMs,
  fusionarPistasServidor,
  ideasConSeparacion,
  mensajeTiempoAgotado,
  motorFinal,
  pistasSinMaestra,
  textoFaseEspera,
  textoInicio,
  textoProcesando,
  textoVerificando,
  type MotorIris,
  type ProgresoIris,
} from '../utils/separacionIris';

interface Opciones {
  song: Song;
  onUpdateSong: (song: Song) => void;
  /** Motor elegido en la UI; `separar` puede anularlo por llamada. */
  motor: MotorIris;
  /** Pistas pedidas en la UI; `separar` puede anularlas por llamada. */
  pistasElegidas: string[];
  /** Se llama con los ids de la idea ya separada para que la UI la deje desplegada. */
  alTerminarIdea?: (ids: string[]) => void;
  /**
   * Corta la separación al desmontar. Para quien no es dueño de la canción (el Atril): su `song` se
   * queda viejo al cerrarse y escribir con él pisaría ediciones posteriores. El servidor guarda el
   * resultado, así que volver a lanzarla no repite el gasto de GPU.
   */
  cancelarAlDesmontar?: boolean;
}

/**
 * Orquesta la separación de pistas con Iris: lanza la petición, sondea el servidor, cae al
 * motor del navegador si no hay pistas, equilibra volúmenes y escribe el resultado en la canción.
 * Toda la lógica de decisión vive en `utils/separacionIris` (probada); aquí solo hay estado y red.
 *
 * `song`, `onUpdateSong` y las opciones se leen por ref en el momento de escribir: una separación
 * puede durar minutos y la canción habrá cambiado entre tanto (antes se pisaba con la versión vieja).
 */
export function useSeparacionIris({ song, onUpdateSong, motor, pistasElegidas, alTerminarIdea, cancelarAlDesmontar }: Opciones) {
  const [isSeparatingStemsAi, setIsSeparatingStemsAi] = useState(false);
  const [separationElapsedSeconds, setSeparationElapsedSeconds] = useState(0);
  const [showStemErrorDetails, setShowStemErrorDetails] = useState(false);
  const [copiedStemError, setCopiedStemError] = useState(false);
  const [stemProgressModal, setStemProgressModal] = useState<ProgresoIris | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const songRef = useRef(song);
  const onUpdateSongRef = useRef(onUpdateSong);
  const motorRef = useRef(motor);
  const pistasRef = useRef(pistasElegidas);
  const alTerminarRef = useRef(alTerminarIdea);
  songRef.current = song;
  onUpdateSongRef.current = onUpdateSong;
  motorRef.current = motor;
  pistasRef.current = pistasElegidas;
  alTerminarRef.current = alTerminarIdea;

  const cancelar = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsSeparatingStemsAi(false);
    setStemProgressModal(null);
  }, []);

  useEffect(() => {
    if (!cancelarAlDesmontar) return;
    return () => abortRef.current?.abort();
  }, [cancelarAlDesmontar]);

  const separar = useCallback(async (targetIdea: SongAudioIdea, overrideEngine?: MotorIris, stemsToInclude?: string[]) => {
    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;
    const abortado = () => abortController.signal.aborted;

    setIsSeparatingStemsAi(true);
    setSeparationElapsedSeconds(0);
    const engineToUse: MotorIris = overrideEngine || motorRef.current;
    const activeStemsToInclude = stemsToInclude || pistasRef.current;
    const cancion = songRef.current;

    setStemProgressModal({
      isOpen: true,
      songTitle: cancion.titulo,
      ideaTitle: targetIdea.titulo,
      targetIdea,
      stage: 'preparing',
      progressPct: 15,
      currentStepText: textoInicio(engineToUse),
      engineChoice: engineToUse,
    });

    const elapsedTimer = setInterval(() => {
      if (abortado()) {
        clearInterval(elapsedTimer);
        return;
      }
      setSeparationElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Única fuente de verdad del % en cada fase: el sondeo de estado solo cambia el texto, así
    // nunca compiten dos relojes por el mismo valor y la barra no retrocede.
    const progressTimer = setInterval(() => {
      if (abortado()) {
        clearInterval(progressTimer);
        return;
      }
      setStemProgressModal((prev) => avanzarProgreso(prev, Date.now()));
    }, 350);

    const peticion = {
      songTitle: cancion.titulo,
      sectionName: targetIdea.seccion,
      bpm: cancion.bpm,
      key: cancion.tonalidad,
      forceEngine: engineToUse,
      requestedStems: activeStemsToInclude,
    };

    try {
      setStemProgressModal((prev) =>
        prev ? { ...prev, stage: 'preparing', progressPct: 25, currentStepText: textoVerificando(engineToUse) } : null
      );

      const sendableAudioUrl = await resolverAudioUrlParaSubida(targetIdea.audioUrl);
      if (abortado()) return;

      setStemProgressModal((prev) =>
        prev
          ? { ...prev, stage: 'demucs', progressPct: 45, demucsStartedAt: Date.now(), currentStepText: textoProcesando(engineToUse) }
          : null
      );

      const lanzar = () =>
        apiFetch('/api/ai-stem-separation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...peticion, audioUrl: sendableAudioUrl }),
        });

      let kickoff: any;
      try {
        kickoff = await lanzar();
      } catch (kickoffErr: any) {
        if (esErrorDeRed(kickoffErr) && !abortado()) {
          // Reintento rápido en caso de micro-corte o reconexión de red
          await new Promise((r) => setTimeout(r, 1200));
          if (abortado()) return;
          kickoff = await lanzar();
        } else {
          throw kickoffErr;
        }
      }

      if (abortado()) return;
      let data = kickoff;

      // El servidor responde al instante (202) y sigue en segundo plano para no chocar con el límite
      // de ~5 min de conexión inactiva del proxy de Railway: sondeamos el resultado.
      if (kickoff?.status === 'processing') {
        const pollStartedAt = Date.now();
        const maxWaitMs = esperaMaximaMs(engineToUse);
        let fallosDeRedSeguidos = 0;

        while (true) {
          if (abortado()) return;
          await new Promise((r) => setTimeout(r, 3000));
          if (abortado()) return;

          const segundos = Math.round((Date.now() - pollStartedAt) / 1000);
          setStemProgressModal((prev) =>
            prev ? { ...prev, stage: 'demucs', currentStepText: textoFaseEspera(engineToUse, segundos) } : null
          );

          let statusRes: any = null;
          try {
            statusRes = await apiFetch(
              `/api/ai-stem-separation/status?songHash=${encodeURIComponent(kickoff.songHash)}&engine=${encodeURIComponent(kickoff.engine)}`
            );
            fallosDeRedSeguidos = 0;
          } catch (pollErr: any) {
            if (esErrorDeRed(pollErr) && fallosDeRedSeguidos < 4 && !abortado()) {
              fallosDeRedSeguidos++;
              console.warn(`[Stem Polling] Fallo transitorio de red (${fallosDeRedSeguidos}/4). Reintentando en el próximo ciclo...`);
              continue;
            }
            throw pollErr;
          }

          if (abortado()) return;

          if (statusRes?.status === 'completed') {
            data = statusRes;
            break;
          }
          if (Date.now() - pollStartedAt > maxWaitMs) throw new Error(mensajeTiempoAgotado(engineToUse));
          // 'processing' o 'not_found' (aún no escrito en caché): seguimos esperando. Un 'failed' hace
          // que apiFetch lance y caiga en el catch de abajo con el mismo error enriquecido.
        }
      }

      if (abortado()) return;

      setStemProgressModal((prev) =>
        prev ? { ...prev, stage: 'persisting', progressPct: 92, currentStepText: 'Sincronizando pistas aisladas MP3 HQ en la nube...' } : null
      );

      const existentes = pistasSinMaestra(getIdeaTracks(targetIdea), targetIdea);
      let newTracks: AudioTrack[] = existentes;
      let stemsAdded = 0;

      if (data.stems && Array.isArray(data.stems) && data.stems.length > 0) {
        const fusion = fusionarPistasServidor({
          existentes,
          stems: data.stems,
          autor: autorDeSeparacion(data, engineToUse),
          pedidas: activeStemsToInclude,
          fecha: new Date().toISOString().split('T')[0],
          nuevoId: (inst) => `stem-ai-${inst}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        });
        newTracks = fusion.pistas;
        stemsAdded = fusion.anadidas;
      } else {
        let renderedStems: IsolatedStemResult[] = [];
        try {
          renderedStems = await separateAudioIntoStems(targetIdea.audioUrl, activeStemsToInclude);
        } catch (renderErr) {
          console.warn('Could not render client audio stem buffers:', renderErr);
        }

        if (renderedStems.length > 0) {
          // Guardado persistente de cada stem en servidor/IndexedDB (sin depender de blob URLs efímeras)
          await Promise.all(
            renderedStems.map(async (stemRes) => {
              let uploadedUrl = stemRes.audioUrl;
              try {
                const wavFile = new File([stemRes.audioBlob], `stem-${stemRes.instrument.toLowerCase()}-${Date.now()}.wav`, {
                  type: 'audio/wav',
                });
                uploadedUrl = await uploadFileToServer(wavFile, { category: 'stems', folder: 'separated' });
              } catch (upErr) {
                console.warn('Using IndexedDB fallback for stem upload:', upErr);
                try {
                  const key = `stem_${stemRes.instrument.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
                  await saveAudioToStorage(key, stemRes.audioBlob);
                  uploadedUrl = `indexeddb:${key}`;
                } catch (idbErr) {
                  console.warn('IndexedDB fallback error:', idbErr);
                }
              }

              if (!newTracks.some((t) => t.nombre.includes(stemRes.instrument))) {
                newTracks.push({
                  id: `stem-ai-${stemRes.instrument.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  nombre: stemRes.trackName,
                  audioUrl: uploadedUrl,
                  autor: 'Anti-Phase AI Engine',
                  instrumento: stemRes.instrument,
                  formato: stemRes.formato || 'WAV',
                  tamano: stemRes.tamano || '3.2 MB',
                  fecha: new Date().toISOString().split('T')[0],
                  volumen: stemRes.recommendedVolume || 1,
                  muted: false,
                });
                stemsAdded++;
              }
            })
          );
        }
      }

      // Nivelamos el volumen inicial con el RMS real de cada pista, en vez del valor genérico por
      // instrumento: así la primera mezcla ya suena equilibrada. Si falla, se queda el volumen por defecto.
      setStemProgressModal((prev) =>
        prev ? { ...prev, currentStepText: 'Analizando volumen real de cada pista para una mezcla inicial equilibrada...' } : null
      );
      try {
        const volumes = await computeAutoBalanceVolumes(
          newTracks.map((t) => ({ id: t.id, audioUrl: t.audioUrl })),
          resolveAudioUrl
        );
        newTracks = newTracks.map((t) => (volumes[t.id] !== undefined ? { ...t, volumen: volumes[t.id] } : t));
      } catch (balanceErr) {
        console.warn('[Stem Separation] Auto-Balance inicial falló, se mantienen los volúmenes por defecto:', balanceErr);
      }

      const motorAnotado = motorFinal(data, engineToUse);
      // Se lee la canción ahora (no la de hace minutos) para no pisar lo que se haya editado mientras tanto.
      const actual = songRef.current;
      const { ideas, idea } = ideasConSeparacion(actual.audioIdeas, targetIdea, newTracks, {
        motor: motorAnotado,
        neural: !!data.isNeural,
        degradado: !!data.degraded,
        procesadoEn: new Date().toISOString(),
      });
      onUpdateSongRef.current({ ...actual, audioIdeas: ideas });
      alTerminarRef.current?.([targetIdea.id, idea.id]);

      const stemsInfo = newTracks.map((t) => ({
        instrument: t.instrumento || 'Pista',
        trackName: t.nombre,
        formato: t.formato || (t.audioUrl?.toLowerCase().includes('.wav') ? 'WAV' : 'MP3'),
        tamano: t.tamano || '2.5 MB',
        audioUrl: t.audioUrl,
      }));

      clearInterval(progressTimer);
      clearInterval(elapsedTimer);
      setStemProgressModal({
        isOpen: true,
        songTitle: actual.titulo,
        ideaTitle: targetIdea.titulo,
        targetIdea,
        stage: 'completed',
        progressPct: 100,
        currentStepText: data.degraded
          ? '¡Pistas procesadas en Modo Degradado (DSP básico) y montadas en el mezclador!'
          : '¡Pistas aisladas montadas en el mezclador con éxito!',
        isNeural: !!data.isNeural,
        engineUsed: data.engineUsed,
        degraded: !!data.degraded,
        degradedReason: data.degradedReason,
        separationEngine: motorAnotado,
        engineChoice: engineToUse,
        stemsAdded: stemsAdded || 5,
        stemsInfo,
        executionTimeSec: data.executionTimeSec,
        timingBreakdown: data.timingBreakdown,
      });
    } catch (err: any) {
      clearInterval(progressTimer);
      clearInterval(elapsedTimer);
      console.error('Error en separación de stems por IA:', err);
      const info = describirErrorSeparacion(err, engineToUse);

      setShowStemErrorDetails(false);
      setCopiedStemError(false);

      setStemProgressModal({
        isOpen: true,
        songTitle: songRef.current.titulo,
        ideaTitle: targetIdea.titulo,
        targetIdea,
        stage: 'error',
        progressPct: 0,
        currentStepText: 'Error al procesar la separación.',
        ...info,
        engineChoice: engineToUse,
      });
    } finally {
      setIsSeparatingStemsAi(false);
    }
  }, []);

  return {
    isSeparatingStemsAi,
    separationElapsedSeconds,
    stemProgressModal,
    setStemProgressModal,
    showStemErrorDetails,
    setShowStemErrorDetails,
    copiedStemError,
    setCopiedStemError,
    handlePerformAiStemSeparation: separar,
    handleCancelStemSeparation: cancelar,
  };
}
