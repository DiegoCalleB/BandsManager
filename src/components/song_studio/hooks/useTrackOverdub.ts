/**
 * Alta de pistas nuevas en una idea: grabación overdub con cuenta atrás, subida de archivo, limpieza de audio y autosincronía de latencia
 * Extraído de SongStudioModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/set-state-in-effect,
 react-hooks/exhaustive-deps,
 react-hooks/purity,
 react-hooks/immutability
*/
import { SongAudioIdea, AudioTrack, Song } from "../../../types";
import { getLowLatencyAudioStream, createCleanAudioRecordingPipeline, autoDetectAudioLatencyOffset, trimAudioBlobLatency, cleanAudioBlobOffline } from "../../../utils/audioLatency";
import { getIdeaTracks } from "../ideaTracks";
import { SILENT_AUDIO_URI } from "../silentAudio";
import { pistasBaseDeIdea } from "../../../utils/ideaDeAtril";
import { pistasDeCancion, cancionConPistas } from "../../../utils/irisTracks";
import { resolveAudioUrl, uploadFileToServer, getAudioBlobFromUrl } from "../../../utils/audioStorage";
import { RefObject, Dispatch, SetStateAction } from "react";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface TrackOverdubParams {
  useCountInMetronome: boolean;
  triggerCountInBeeps: (bpm: number, onDone: () => void) => void;
  song: Song;
  studioAudioCtxRef: RefObject<AudioContext>;
  useEchoCancellation: boolean;
  useNoiseSuppression: boolean;
  setActiveRecordingStream: Dispatch<SetStateAction<MediaStream>>;
  useCleanDSPFilter: boolean;
  cleanPipelineRef: RefObject<any>;
  trackMediaRecorderRef: RefObject<MediaRecorder>;
  trackAudioChunksRef: RefObject<Blob[]>;
  setCurrentTimeMap: Dispatch<SetStateAction<Record<string, number>>>;
  resolvedAudioUrls: Record<string, string>;
  trackAudioRefs: RefObject<Record<string, HTMLAudioElement>>;
  applyMasterToElementVolume: (perTrackGain: number) => number;
  basePlayRefs: RefObject<HTMLAudioElement[]>;
  setIsRecordingTrack: Dispatch<SetStateAction<boolean>>;
  setRecordingTrackIdeaId: Dispatch<SetStateAction<string>>;
  setRecordingTrackTime: Dispatch<SetStateAction<number>>;
  trackRecordingTimerRef: RefObject<any>;
  playingIdeaIdRef: RefObject<string>;
  setPlayingIdeaId: Dispatch<SetStateAction<string>>;
  runMasterSyncLoop: (idea: SongAudioIdea) => void;
  syncAnimationFrameRef: RefObject<number>;
  setIsUploading: Dispatch<SetStateAction<boolean>>;
  autoLatencyTrimMs: number;
  newTrackName: string;
  newTrackInstrument: string;
  setCleaningTrackId: Dispatch<SetStateAction<string>>;
  handleTrackDesfaseChange: (idea: SongAudioIdea, trackId: string, newDesfaseMs: number) => void;
  onUpdateSong: (updatedSong: Song) => void;
  currentUsername: string;
  setAddingTrackIdeaId: Dispatch<SetStateAction<string>>;
  setNewTrackName: Dispatch<SetStateAction<string>>;
  setNewTrackInstrument: Dispatch<SetStateAction<string>>;
  setSelectedTrackFile: Dispatch<SetStateAction<File>>;
}

/**
 * Alta de pistas nuevas en una idea: grabación overdub con cuenta atrás, subida de archivo, limpieza de audio y autosincronía de latencia
 * @param params Estado y callbacks del contenedor ({@link TrackOverdubParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useTrackOverdub({ useCountInMetronome, triggerCountInBeeps, song, studioAudioCtxRef, useEchoCancellation, useNoiseSuppression, setActiveRecordingStream, useCleanDSPFilter, cleanPipelineRef, trackMediaRecorderRef, trackAudioChunksRef, setCurrentTimeMap, resolvedAudioUrls, trackAudioRefs, applyMasterToElementVolume, basePlayRefs, setIsRecordingTrack, setRecordingTrackIdeaId, setRecordingTrackTime, trackRecordingTimerRef, playingIdeaIdRef, setPlayingIdeaId, runMasterSyncLoop, syncAnimationFrameRef, setIsUploading, autoLatencyTrimMs, newTrackName, newTrackInstrument, setCleaningTrackId, handleTrackDesfaseChange, onUpdateSong, currentUsername, setAddingTrackIdeaId, setNewTrackName, setNewTrackInstrument, setSelectedTrackFile }: TrackOverdubParams) {
  // --- OVERDUB / ADDING NEW TRACK TO IDEA ---
  const startRecordingTrackOverdub = async (idea: SongAudioIdea) => {
    if (useCountInMetronome) {
      triggerCountInBeeps(song.bpm || 120, () => {
        executeRecordingTrackOverdub(idea);
      });
    } else {
      executeRecordingTrackOverdub(idea);
    }
  };

  const executeRecordingTrackOverdub = async (idea: SongAudioIdea) => {
    try {
      // Resume studio audio context if suspended
      try {
        if (!studioAudioCtxRef.current) {
          const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtxClass) studioAudioCtxRef.current = new AudioCtxClass();
        }
        if (studioAudioCtxRef.current && studioAudioCtxRef.current.state === 'suspended') {
          await studioAudioCtxRef.current.resume();
        }
      } catch (e) {
        console.warn('AudioContext resume during overdub:', e);
      }

      // 1. Request microphone permission with hardware Echo Cancellation & Noise Suppression options
      const rawStream = await getLowLatencyAudioStream({
        echoCancellation: useEchoCancellation,
        noiseSuppression: useNoiseSuppression,
        autoGainControl: false,
      });
      setActiveRecordingStream(rawStream);

      let streamToRecord = rawStream;
      if (useCleanDSPFilter) {
        const pipeline = createCleanAudioRecordingPipeline(rawStream, studioAudioCtxRef.current);
        cleanPipelineRef.current = pipeline;
        streamToRecord = pipeline.cleanStream;
      }

      const recorderOptions: MediaRecorderOptions = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 256000 }
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? { mimeType: 'audio/mp4', audioBitsPerSecond: 256000 }
          : { audioBitsPerSecond: 256000 };

      const mediaRecorder = new MediaRecorder(streamToRecord, recorderOptions);
      trackMediaRecorderRef.current = mediaRecorder;
      trackAudioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) trackAudioChunksRef.current.push(e.data);
      };

      const tracks = getIdeaTracks(idea);
      const hasSolo = tracks.some((t: any) => t.solo);
      const activeBackingTracks = tracks.filter((t) => !t.muted && (!hasSolo || (t as any).solo));

      // 2. Pre-align backing tracks at position 0
      setCurrentTimeMap((prev) => ({ ...prev, [idea.id]: 0 }));
      tracks.forEach((tr) => {
        const resolvedUrl = resolvedAudioUrls[tr.id] || tr.audioUrl;
        let el = trackAudioRefs.current[tr.id];
        if (
          !el &&
          resolvedUrl &&
          typeof resolvedUrl === 'string' &&
          !resolvedUrl.startsWith('indexeddb:') &&
          !resolvedUrl.endsWith('undefined')
        ) {
          el = new Audio(resolvedUrl || SILENT_AUDIO_URI);
          trackAudioRefs.current[tr.id] = el;
        }
        if (el) {
          if (
            resolvedUrl &&
            typeof resolvedUrl === 'string' &&
            !resolvedUrl.startsWith('indexeddb:') &&
            !resolvedUrl.endsWith('undefined')
          ) {
            if (!el.src || !el.src.includes(resolvedUrl)) {
              el.src = resolvedUrl;
            }
          }
          try {
            el.currentTime = 0;
          } catch {}
          el.playbackRate = 1.0;
          const isMuted = tr.muted || (hasSolo && !(tr as any).solo);
          el.volume = applyMasterToElementVolume(isMuted ? 0 : (tr.volumen ?? 1));
        }
      });

      // 3. Play backing track audio FIRST so sound is emitted before mic recording captures performance
      const playPromises = activeBackingTracks.map((tr) => {
        const resolvedUrl = resolvedAudioUrls[tr.id] || tr.audioUrl;
        if (
          resolvedUrl &&
          typeof resolvedUrl === 'string' &&
          resolvedUrl.trim() !== '' &&
          !resolvedUrl.endsWith('undefined') &&
          !resolvedUrl.startsWith('indexeddb:')
        ) {
          let el = trackAudioRefs.current[tr.id];
          if (!el) {
            el = new Audio(resolvedUrl || SILENT_AUDIO_URI);
            trackAudioRefs.current[tr.id] = el;
          }
          if (!el.src || !el.src.includes(resolvedUrl)) {
            el.src = resolvedUrl;
          }
          if (el.readyState === 0) {
            try {
              el.load();
            } catch {}
          }
          try {
            el.currentTime = 0;
          } catch {}
          return el.play().catch((e) => console.warn('Backing track playback notice:', e?.message || e));
        }
        return Promise.resolve();
      });

      // Pistas de Iris elegidas para esta idea (por referencia, `sobrePistas`)
      const basePistas = pistasBaseDeIdea(idea, pistasDeCancion(song)).pistas;
      const basePlays = basePistas.map((st) => {
        const url = resolvedAudioUrls[st.id] || st.audioUrl;
        if (!url || typeof url !== 'string' || url.startsWith('indexeddb:') || url.endsWith('undefined')) return Promise.resolve();
        const el = new Audio(url);
        el.volume = applyMasterToElementVolume(st.muted ? 0 : (st.volumen ?? 1));
        basePlayRefs.current.push(el);
        return el.play().catch((e) => console.warn('Base track playback notice:', e?.message || e));
      });

      await Promise.all([...playPromises, ...basePlays]);

      // 4. Start MediaRecorder immediately after backing tracks begin playback
      mediaRecorder.start(20);
      setIsRecordingTrack(true);
      setRecordingTrackIdeaId(idea.id);
      setRecordingTrackTime(0);

      if (trackRecordingTimerRef.current) {
        clearInterval(trackRecordingTimerRef.current);
      }
      trackRecordingTimerRef.current = setInterval(() => {
        setRecordingTrackTime((prev) => prev + 1);
      }, 1000);

      // Launch master sync loop during overdub session
      playingIdeaIdRef.current = idea.id;
      setPlayingIdeaId(idea.id);
      runMasterSyncLoop(idea);

      mediaRecorder.onstop = async () => {
        if (syncAnimationFrameRef.current) {
          cancelAnimationFrame(syncAnimationFrameRef.current);
          syncAnimationFrameRef.current = null;
        }
        playingIdeaIdRef.current = null;
        setPlayingIdeaId(null);
        setIsRecordingTrack(false);
        setRecordingTrackIdeaId(null);

        if (trackRecordingTimerRef.current) {
          clearInterval(trackRecordingTimerRef.current);
        }

        // Stop all backing track audio elements
        tracks.forEach((tr) => {
          const el = trackAudioRefs.current[tr.id];
          if (el) {
            el.pause();
            el.playbackRate = 1.0;
          }
        });

        // Cleanup stream & DSP pipeline
        if (cleanPipelineRef.current) {
          cleanPipelineRef.current.cleanup();
          cleanPipelineRef.current = null;
        }
        rawStream.getTracks().forEach((track) => track.stop());

        const rawAudioBlob = new Blob(trackAudioChunksRef.current, {
          type: 'audio/webm',
        });

        try {
          setIsUploading(true);
          let finalBlob = rawAudioBlob;

          // Auto DSP/AI correlation latency detection against master backing track
          let detectedOffsetMs = 0;
          const refTrack = tracks[0] || (idea.audioUrl ? { audioUrl: idea.audioUrl } : null);
          if (refTrack && refTrack.audioUrl) {
            try {
              const masterResolvedUrl = await resolveAudioUrl(refTrack.audioUrl);
              detectedOffsetMs = await autoDetectAudioLatencyOffset(masterResolvedUrl, rawAudioBlob);
            } catch (e) {
              console.warn('Auto latency detection during overdub:', e);
            }
          }

          // Calculate total latency lag to physically trim from recording start
          const isMobileDevice = /iPad|iPhone|iPod|Android/i.test(navigator.userAgent);
          const defaultHardwareLagMs = isMobileDevice ? 240 : 120;

          let totalLagToTrimMs = defaultHardwareLagMs;
          if (autoLatencyTrimMs > 0) {
            totalLagToTrimMs = autoLatencyTrimMs;
          } else if (detectedOffsetMs > 0) {
            totalLagToTrimMs = detectedOffsetMs;
          }

          if (totalLagToTrimMs > 0) {
            finalBlob = await trimAudioBlobLatency(rawAudioBlob, totalLagToTrimMs);
          }
          if (useCleanDSPFilter) {
            finalBlob = await cleanAudioBlobOffline(finalBlob);
          }
          const file = new File([finalBlob], `track-${Date.now()}.wav`, {
            type: 'audio/wav',
          });
          const serverUrl = await uploadFileToServer(file);
          const trackName = newTrackName.trim() || `Pista ${tracks.length + 1}`;
          const instrument = newTrackInstrument.trim() || undefined;
          saveNewTrackToIdea(idea, serverUrl, trackName, instrument, totalLagToTrimMs);
        } catch (err) {
          console.error('Error uploading track recording:', err);
          alert('Error al guardar la nueva pista en el disco del servidor.');
        } finally {
          setIsUploading(false);
        }
      };
    } catch (err: any) {
      setIsRecordingTrack(false);
      setRecordingTrackIdeaId(null);
      if (trackRecordingTimerRef.current) {
        clearInterval(trackRecordingTimerRef.current);
      }
      console.warn('Microphone access for overdub not available:', err?.message || err);
      alert('No se pudo acceder al micrófono para grabar la pista (' + (err?.message || 'comprueba los permisos del navegador') + ').');
    }
  };

  const stopRecordingTrackOverdub = () => {
    basePlayRefs.current.forEach((el) => { try { el.pause(); } catch {} });
    basePlayRefs.current = [];
    if (trackMediaRecorderRef.current && trackMediaRecorderRef.current.state !== 'inactive') {
      trackMediaRecorderRef.current.stop();
    }
    setIsRecordingTrack(false);
    setRecordingTrackIdeaId(null);
    setActiveRecordingStream(null);
    if (trackRecordingTimerRef.current) {
      clearInterval(trackRecordingTimerRef.current);
    }
  };

  const handleAutoSyncTrackLatency = async (idea: SongAudioIdea, track: AudioTrack) => {
    try {
      setCleaningTrackId(track.id);
      const tracks = getIdeaTracks(idea);
      const masterTrack = tracks.find((t) => t.id !== track.id) || tracks[0];
      if (!masterTrack || masterTrack.id === track.id) {
        alert('Necesitas tener al menos otra pista de referencia en la mezcla para calcular la sincronización por IA.');
        return;
      }
      const masterUrl = await resolveAudioUrl(masterTrack.audioUrl);
      const trackBlob = await getAudioBlobFromUrl(track.audioUrl);

      const calculatedLagMs = await autoDetectAudioLatencyOffset(masterUrl, trackBlob);
      handleTrackDesfaseChange(idea, track.id, calculatedLagMs);
      alert(`⚡ ¡Sincronizado! Se detectó un desfase de +${calculatedLagMs}ms y se ajustó la pista.`);
    } catch (err) {
      console.error('Auto sync error:', err);
      alert('No se pudo calcular automáticamente la latencia. Puedes ajustarla manualmente.');
    } finally {
      setCleaningTrackId(null);
    }
  };

  const handleCleanTrackAudio = async (idea: SongAudioIdea, track: AudioTrack) => {
    try {
      setCleaningTrackId(track.id);
      const rawBlob = await getAudioBlobFromUrl(track.audioUrl);
      const cleanedBlob = await cleanAudioBlobOffline(rawBlob);
      const cleanedFile = new File([cleanedBlob], `clean-${track.nombre || 'pista'}-${Date.now()}.wav`, { type: 'audio/wav' });
      const serverUrl = await uploadFileToServer(cleanedFile);

      const tracks = getIdeaTracks(idea);
      const updatedTracks = tracks.map((t) => (t.id === track.id ? { ...t, audioUrl: serverUrl } : t));
      onUpdateSong(cancionConPistas(song, idea, updatedTracks));
    } catch (err) {
      console.error('Error cleaning track audio:', err);
      alert('No se pudo filtrar el ruido de la pista.');
    } finally {
      setCleaningTrackId(null);
    }
  };

  const handleUploadTrackFile = async (idea: SongAudioIdea, file: File) => {
    try {
      setIsUploading(true);
      const serverUrl = await uploadFileToServer(file);
      const fileNameClean = file.name ? file.name.replace(/\.[^/.]+$/, '') : '';
      const existingTracks = getIdeaTracks(idea);
      const trackName = newTrackName.trim() || fileNameClean || `Pista ${existingTracks.length + 1}`;
      const instrument = newTrackInstrument.trim() || undefined;
      saveNewTrackToIdea(idea, serverUrl, trackName, instrument);
    } catch (err) {
      alert('Error al procesar el archivo de audio de la pista.');
      console.error('Track upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const saveNewTrackToIdea = (
    idea: SongAudioIdea,
    audioUrl: string,
    customTrackName?: string,
    customInstrument?: string,
    initialDesfaseMs?: number
  ) => {
    const existingTracks = getIdeaTracks(idea);
    const trackName = customTrackName || newTrackName.trim() || `Pista ${existingTracks.length + 1}`;
    const instrument = customInstrument || newTrackInstrument.trim() || undefined;

    const newTrack: AudioTrack = {
      id: `track-${Date.now()}`,
      nombre: trackName,
      audioUrl,
      autor: currentUsername,
      instrumento: instrument,
      fecha: new Date().toISOString().split('T')[0],
      volumen: 1,
      muted: false,
      desfaseMs: initialDesfaseMs ?? 0,
    };

    const updatedTracks = [...existingTracks, newTrack];
    onUpdateSong(cancionConPistas(song, idea, updatedTracks));

    // Reset overdub form
    setAddingTrackIdeaId(null);
    setNewTrackName('');
    setNewTrackInstrument('');
    setSelectedTrackFile(null);
  };

  return { stopRecordingTrackOverdub, startRecordingTrackOverdub, saveNewTrackToIdea, handleCleanTrackAudio, handleAutoSyncTrackLatency, handleUploadTrackFile };
}
