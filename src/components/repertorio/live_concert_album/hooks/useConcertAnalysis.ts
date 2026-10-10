/**
 * Analiza el concierto con IA, autoclasifica cortes y detecta/ajusta los CUEs musicales.
 * Extraído de LiveConcertToAlbumModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch, SetStateAction, useState } from "react";
import { apiFetch } from "../../../../utils/api";
import { getErrorMessage } from "../../../../utils/errorMessage";
import type { AnalyzeConcertResponse, TrackCutItem, TracksUpdateResponse } from "../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface ConcertAnalysisParams {
  youtubeUrl: string;
  uploadedFile: File;
  setErrorMessage: Dispatch<SetStateAction<string>>;
  setIsAnalyzing: Dispatch<SetStateAction<boolean>>;
  setAnalysisStatus: Dispatch<SetStateAction<string>>;
  setGeneratedResult: Dispatch<SetStateAction<{ albumId: string; deliverablePath: string; tracks: TrackCutItem[]; }>>;
  uploadFileBinary: (file: File, folder?: string, onProgress?: (msg: string) => void) => Promise<string>;
  setAnalyzedSourcePath: Dispatch<SetStateAction<string>>;
  artistName: string;
  bandName: string;
  setAlbumTitle: Dispatch<SetStateAction<string>>;
  setArtistName: Dispatch<SetStateAction<string>>;
  setTracks: Dispatch<SetStateAction<TrackCutItem[]>>;
  setYoutubeBlocked: Dispatch<SetStateAction<boolean>>;
  setAudioAvailable: Dispatch<SetStateAction<boolean>>;
  tracks: TrackCutItem[];
  albumTitle: string;
  analyzedSourcePath: string;
  pushHistorySnapshot: () => void;
}

/**
 * Analiza el concierto con IA, autoclasifica cortes y detecta/ajusta los CUEs musicales.
 * @param params Estado y callbacks del contenedor ({@link ConcertAnalysisParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useConcertAnalysis({ youtubeUrl, uploadedFile, setErrorMessage, setIsAnalyzing, setAnalysisStatus, setGeneratedResult, uploadFileBinary, setAnalyzedSourcePath, artistName, bandName, setAlbumTitle, setArtistName, setTracks, setYoutubeBlocked, setAudioAvailable, tracks, albumTitle, analyzedSourcePath, pushHistorySnapshot }: ConcertAnalysisParams) {
  const [useAi, setUseAi] = useState(true);

  const [transcribeFirst, setTranscribeFirst] = useState(true);

  const [isClassifying, setIsClassifying] = useState(false);

  const [isDetectingCues, setIsDetectingCues] = useState(false);

  // Step 1: Run Analysis
  const handleAnalyzeConcert = async () => {
    if (!youtubeUrl && !uploadedFile) {
      setErrorMessage(
        "Por favor, introduce una URL de YouTube o selecciona un archivo de vídeo/audio local.",
      );
      return;
    }

    setErrorMessage(null);
    setIsAnalyzing(true);
    setAnalysisStatus("Extrayendo metadatos y analizando silenciogramas...");
    setGeneratedResult(null);

    try {
      let sourceFilePath = "";

      // If user uploaded local file, upload to temp folder first using FormData chunk streaming
      if (uploadedFile) {
        setAnalysisStatus("Subiendo archivo local al servidor...");
        sourceFilePath = await uploadFileBinary(
          uploadedFile,
          "conciertos_fuente",
          (msg) => {
            setAnalysisStatus(msg);
          },
        );
        setAnalyzedSourcePath(sourceFilePath);
      }

      setAnalysisStatus(
        useAi
          ? transcribeFirst
            ? "Transcribiendo y analizando el audio completo con IA para alinear cortes y letras..."
            : "Analizando acústica y detectando estructura del concierto..."
          : "Detectando silencios, pausas y capítulos del concierto...",
      );

      const data = await apiFetch<AnalyzeConcertResponse>("/api/concert-to-album/analyze", {
        method: "POST",
        body: JSON.stringify({
          url: youtubeUrl.trim(),
          sourceFilePath,
          useAi,
          transcribeFirst,
          bandName: artistName || bandName,
        }),
      });

      setAlbumTitle(data.albumTitle || `Directo - ${artistName}`);
      setArtistName(data.artist || artistName);
      setTracks(data.tracks || []);
      if (typeof data.youtubeBlocked !== "undefined")
        setYoutubeBlocked(Boolean(data.youtubeBlocked));
      if (typeof data.audioAvailable !== "undefined")
        setAudioAvailable(Boolean(data.audioAvailable));
    } catch (err) {
      console.error("Error analyzing concert:", err);
      setErrorMessage(
        getErrorMessage(err, "Error durante el análisis del concierto."),
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-classify songs vs dialogue automatically
  const handleAutoClassifyTracks = async () => {
    if (!tracks || tracks.length === 0) return;
    setIsClassifying(true);
    try {
      const data = await apiFetch<TracksUpdateResponse>("/api/concert-to-album/classify-tracks", {
        method: "POST",
        body: JSON.stringify({
          tracks,
          bandName: artistName || bandName,
          albumTitle: albumTitle || "Directo en Vivo",
          useAi,
        }),
      });

      if (data?.tracks) {
        setTracks(data.tracks);
      }
    } catch (err) {
      console.error("Error auto-classifying tracks:", err);
      alert(getErrorMessage(err, "No se pudo completar la auto-clasificación."));
    } finally {
      setIsClassifying(false);
    }
  };

  // Autodetectar CUEs de inicio musical para cada pista
  const handleAutoDetectCues = async () => {
    if (!tracks || tracks.length === 0) return;
    setIsDetectingCues(true);
    try {
      const data = await apiFetch<TracksUpdateResponse>("/api/concert-to-album/detect-cues", {
        method: "POST",
        body: JSON.stringify({
          tracks,
          sourceFilePath: analyzedSourcePath,
          url: youtubeUrl.trim(),
        }),
      });

      if (data?.tracks) {
        pushHistorySnapshot();
        setTracks(data.tracks);
      }
    } catch (err) {
      console.error("Error auto-detecting cues:", err);
      alert(getErrorMessage(err, "No se pudo completar la autodetección de CUEs."));
    } finally {
      setIsDetectingCues(false);
    }
  };

  // Ajustar el inicio de una pista a su CUE In exacto
  const handleSnapTrackStartToCue = (trackIndex: number) => {
    const idx = tracks.findIndex((t) => t.index === trackIndex);
    if (idx < 0) return;
    const track = tracks[idx];
    if (!track.cueIn || track.cueIn <= 0.1) return;

    pushHistorySnapshot();
    const newStart = Math.round((track.start + track.cueIn) * 10) / 10;
    const newDuration = Math.max(
      0.5,
      Math.round((track.end - newStart) * 10) / 10,
    );
    const updated = [...tracks];
    updated[idx] = {
      ...track,
      start: newStart,
      duration: newDuration,
      cueIn: 0,
    };
    setTracks(updated);
  };

  // Ajustar todos los temas musicales a sus CUEs detectados
  const handleSnapAllTracksToCues = () => {
    pushHistorySnapshot();
    let adjustedCount = 0;
    const updated = tracks.map((t) => {
      if (t.type === "musica" && t.cueIn && t.cueIn > 0.2) {
        const newStart = Math.round((t.start + t.cueIn) * 10) / 10;
        const newDuration = Math.max(
          0.5,
          Math.round((t.end - newStart) * 10) / 10,
        );
        adjustedCount++;
        return {
          ...t,
          start: newStart,
          duration: newDuration,
          cueIn: 0,
        };
      }
      return t;
    });
    setTracks(updated);
    if (adjustedCount > 0) {
      alert(
        `Se han ajustado los puntos de inicio de ${adjustedCount} temas para arrancar exactamente en la entrada musical.`,
      );
    }
  };

  return { useAi, setUseAi, handleAnalyzeConcert, transcribeFirst, setTranscribeFirst, handleAutoDetectCues, isDetectingCues, handleSnapAllTracksToCues, handleAutoClassifyTracks, isClassifying, handleSnapTrackStartToCue };
}
