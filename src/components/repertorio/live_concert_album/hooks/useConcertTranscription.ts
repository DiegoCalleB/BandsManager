/**
 * Transcribe con IA discursos, letras y acordes de los cortes, de uno en uno o en lote.
 * Extraído de LiveConcertToAlbumModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import { apiFetch } from "../../../../utils/api";
import { getErrorMessage } from "../../../../utils/errorMessage";
import type { SongTranscriptionResponse, SpeechTranscriptionResponse, TrackCutItem } from "../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface ConcertTranscriptionParams {
  youtubeUrl: string;
  analyzedSourcePath: string;
  artistName: string;
  bandName: string;
  handleUpdateTrack: (index: number, key: keyof TrackCutItem, value: TrackCutItem[keyof TrackCutItem]) => void;
  selectedIndices: number[];
  tracks: TrackCutItem[];
  pushHistorySnapshot: () => void;
}

/**
 * Transcribe con IA discursos, letras y acordes de los cortes, de uno en uno o en lote.
 * @param params Estado y callbacks del contenedor ({@link ConcertTranscriptionParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useConcertTranscription({ youtubeUrl, analyzedSourcePath, artistName, bandName, handleUpdateTrack, selectedIndices, tracks, pushHistorySnapshot }: ConcertTranscriptionParams) {
  const [transcribingIndex, setTranscribingIndex] = useState<number | null>(
    null,
  );

  const [transcribingChordsIndex, setTranscribingChordsIndex] = useState<
    number | null
  >(null);

  const [expandedChordsIndex, setExpandedChordsIndex] = useState<number | null>(
    null,
  );

  const [expandAllChords, setExpandAllChords] = useState(true);

  const [isTranscribingAll, setIsTranscribingAll] = useState(false);

  const [transcribeAllProgress, setTranscribeAllProgress] = useState<{
    current: number;
    total: number;
    title: string;
    stopRequested?: boolean;
  } | null>(null);

  // Transcribe spoken speech / interlude with Gemini AI
  const handleTranscribeSpeech = async (track: TrackCutItem) => {
    setTranscribingIndex(track.index);
    try {
      const data = await apiFetch<SpeechTranscriptionResponse>("/api/concert-to-album/transcribe-speech", {
        method: "POST",
        body: JSON.stringify({
          trackTitle: track.title,
          url: youtubeUrl.trim(),
          sourceFilePath: analyzedSourcePath,
          start: track.start,
          end: track.end,
          trackIndex: track.index,
          audioUrl: track.audioUrl,
          promptContext: `Interludio o presentación del artista (${artistName || bandName}) en el concierto`,
        }),
      });

      if (data?.transcription) {
        handleUpdateTrack(
          track.index,
          "speechTranscription",
          data.transcription,
        );
      }
    } catch (err) {
      console.error("Error transcribing speech:", err);
      alert(getErrorMessage(err, "No se pudo generar la transcripción del discurso."));
    } finally {
      setTranscribingIndex(null);
    }
  };

  // Transcribe song lyrics and chords sheet with AI
  const handleTranscribeSongChordsAndLyrics = async (track: TrackCutItem) => {
    setTranscribingChordsIndex(track.index);
    try {
      const data = await apiFetch<SongTranscriptionResponse>("/api/concert-to-album/transcribe-song", {
        method: "POST",
        body: JSON.stringify({
          title: track.title,
          artist: artistName || bandName,
          duration: track.duration,
          speechTranscription: track.speechTranscription,
          audioUrl: track.audioUrl,
          url: youtubeUrl.trim(),
          sourceFilePath: analyzedSourcePath,
          start: track.start,
          end: track.end,
          trackIndex: track.index,
        }),
      });

      if (data?.lyricsWithChords) {
        handleUpdateTrack(
          track.index,
          "lyricsWithChords",
          data.lyricsWithChords,
        );
        if (data.tonalidad)
          handleUpdateTrack(track.index, "tonalidad", data.tonalidad);
        if (data.bpm) handleUpdateTrack(track.index, "bpm", data.bpm);
        setExpandedChordsIndex(track.index);
      }
    } catch (err) {
      console.error("Error transcribing song chords:", err);
      alert(getErrorMessage(err, "No se pudo generar la transcripción de acordes."));
    } finally {
      setTranscribingChordsIndex(null);
    }
  };

  // Transcribe all or selected concert tracks automatically with Gemini AI
  const handleTranscribeAllConcert = async () => {
    const targetTracks =
      selectedIndices.length > 0
        ? tracks.filter((t) => selectedIndices.includes(t.index))
        : tracks;

    if (!targetTracks || targetTracks.length === 0) {
      alert("No hay pistas en el tracklist para transcribir.");
      return;
    }

    pushHistorySnapshot();
    setIsTranscribingAll(true);

    for (let i = 0; i < targetTracks.length; i++) {
      const track = targetTracks[i];
      setTranscribeAllProgress({
        current: i + 1,
        total: targetTracks.length,
        title: track.title,
      });

      try {
        if (track.type === "dialogo") {
          // Transcribe speech/interlude
          setTranscribingIndex(track.index);
          const response = await fetch(
            "/api/concert-to-album/transcribe-speech",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                trackTitle: track.title,
                url: youtubeUrl.trim(),
                sourceFilePath: analyzedSourcePath,
                start: track.start,
                end: track.end,
                trackIndex: track.index,
                audioUrl: track.audioUrl,
                promptContext: `Interludio o presentación del artista (${artistName || bandName}) en el concierto`,
              }),
            },
          );

          if (response.ok) {
            const data = await response.json();
            if (data.transcription) {
              handleUpdateTrack(
                track.index,
                "speechTranscription",
                data.transcription,
              );
            }
          }
          setTranscribingIndex(null);
        } else {
          // Transcribe song lyrics and chords
          setTranscribingChordsIndex(track.index);
          const response = await fetch(
            "/api/concert-to-album/transcribe-song",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: track.title,
                artist: artistName || bandName,
                duration: track.duration,
                speechTranscription: track.speechTranscription,
                audioUrl: track.audioUrl,
                url: youtubeUrl.trim(),
                sourceFilePath: analyzedSourcePath,
                start: track.start,
                end: track.end,
                trackIndex: track.index,
              }),
            },
          );

          if (response.ok) {
            const data = await response.json();
            if (data.lyricsWithChords)
              handleUpdateTrack(
                track.index,
                "lyricsWithChords",
                data.lyricsWithChords,
              );
            if (data.tonalidad)
              handleUpdateTrack(track.index, "tonalidad", data.tonalidad);
            if (data.bpm) handleUpdateTrack(track.index, "bpm", data.bpm);
          }
          setTranscribingChordsIndex(null);
        }
      } catch (err) {
        console.error(
          `Error al transcribir pista ${track.index} (${track.title}):`,
          err,
        );
      }
    }

    setIsTranscribingAll(false);
    setTranscribeAllProgress(null);
  };

  return { isTranscribingAll, handleTranscribeAllConcert, transcribeAllProgress, setExpandAllChords, expandAllChords, expandedChordsIndex, setExpandedChordsIndex, handleTranscribeSongChordsAndLyrics, transcribingChordsIndex, handleTranscribeSpeech, transcribingIndex };
}
