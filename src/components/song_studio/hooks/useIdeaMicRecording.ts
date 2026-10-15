import { getErrorMessage } from "../../../utils/errorMessage";
/**
 * Grabación de una idea nueva con el micrófono (inicio, parada y temporizador)
 * Extraído de SongStudioModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch, RefObject, SetStateAction } from "react";
import { cleanAudioBlobOffline, createCleanAudioRecordingPipeline, getLowLatencyAudioStream } from "../../../utils/audioLatency";
import { uploadFileToServer } from "../../../utils/audioStorage";
import type { CleanRecordingPipeline } from "./useTrackAudioDsp";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface IdeaMicRecordingParams {
  useEchoCancellation: boolean;
  useNoiseSuppression: boolean;
  setActiveRecordingStream: Dispatch<SetStateAction<MediaStream>>;
  useCleanDSPFilter: boolean;
  studioAudioCtxRef: RefObject<AudioContext>;
  mediaRecorderRef: RefObject<MediaRecorder>;
  audioChunksRef: RefObject<Blob[]>;
  recordingPromiseRef: RefObject<Promise<string>>;
  setIsUploading: Dispatch<SetStateAction<boolean>>;
  setRecordedAudioUrl: Dispatch<SetStateAction<string>>;
  setIsRecording: Dispatch<SetStateAction<boolean>>;
  setRecordingTime: Dispatch<SetStateAction<number>>;
  recordingTimerRef: RefObject<ReturnType<typeof setInterval> | null>;
}

/**
 * Grabación de una idea nueva con el micrófono (inicio, parada y temporizador)
 * @param params Estado y callbacks del contenedor ({@link IdeaMicRecordingParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useIdeaMicRecording({ useEchoCancellation, useNoiseSuppression, setActiveRecordingStream, useCleanDSPFilter, studioAudioCtxRef, mediaRecorderRef, audioChunksRef, recordingPromiseRef, setIsUploading, setRecordedAudioUrl, setIsRecording, setRecordingTime, recordingTimerRef }: IdeaMicRecordingParams) {
  // --- CREATE NEW MAIN IDEA FORM ---
  const startRecording = async () => {
    try {
      const rawStream = await getLowLatencyAudioStream({
        echoCancellation: useEchoCancellation,
        noiseSuppression: useNoiseSuppression,
        autoGainControl: false,
      });
      setActiveRecordingStream(rawStream);

      let streamToRecord = rawStream;
      let cleanPipeline: CleanRecordingPipeline | null = null;
      if (useCleanDSPFilter) {
        cleanPipeline = createCleanAudioRecordingPipeline(rawStream, studioAudioCtxRef.current);
        streamToRecord = cleanPipeline.cleanStream;
      }

      const mediaRecorder = new MediaRecorder(streamToRecord);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      let resolveFn: (url: string) => void = () => {};
      let rejectFn: (err: unknown) => void = () => {};
      recordingPromiseRef.current = new Promise<string>((resolve, reject) => {
        resolveFn = resolve;
        rejectFn = reject;
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        if (cleanPipeline) cleanPipeline.cleanup();
        rawStream.getTracks().forEach((track) => track.stop());

        const rawBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm',
        });
        try {
          setIsUploading(true);
          let finalBlob = rawBlob;
          if (useCleanDSPFilter) {
            finalBlob = await cleanAudioBlobOffline(rawBlob);
          }
          const file = new File([finalBlob], `recording-${Date.now()}.wav`, {
            type: 'audio/wav',
          });
          const url = await uploadFileToServer(file);
          setRecordedAudioUrl(url);
          resolveFn(url);
        } catch (err) {
          console.error('Error uploading mic recording:', err);
          rejectFn(err);
        } finally {
          setIsUploading(false);
        }
      };

      mediaRecorder.start(50);
      setIsRecording(true);
      setRecordingTime(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone capture warning:', getErrorMessage(err, 'error desconocido'));
      alert('No se pudo acceder al micrófono (' + getErrorMessage(err, 'comprueba los permisos del navegador') + ').');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setActiveRecordingStream(null);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  return { stopRecording, startRecording };
}
