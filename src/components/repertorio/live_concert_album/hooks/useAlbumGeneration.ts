/**
 * Genera el disco (corte en servidor), crea el setlist del concierto y guarda el álbum en el catálogo.
 * Extraído de LiveConcertToAlbumModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch, SetStateAction, useState } from "react";
import { apiFetch } from "../../../../utils/api";
import { getErrorMessage } from "../../../../utils/errorMessage";
import type { ConcertSetlistDraft, ProcessAlbumResponse, TrackCutItem } from "../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface AlbumGenerationParams {
  tracks: TrackCutItem[];
  setErrorMessage: Dispatch<SetStateAction<string>>;
  youtubeUrl: string;
  analyzedSourcePath: string;
  albumTitle: string;
  artistName: string;
  bandName: string;
  setGeneratedResult: Dispatch<SetStateAction<{ albumId: string; deliverablePath: string; tracks: TrackCutItem[]; }>>;
  setTracks: Dispatch<SetStateAction<TrackCutItem[]>>;
  generatedResult: { albumId: string; deliverablePath: string; tracks: TrackCutItem[]; };
  onSaveSetlist?: (newSetlist: ConcertSetlistDraft) => void;
  onSaveAlbumToCatalog: (albumTitle: string, tracks: TrackCutItem[]) => void;
}

/**
 * Genera el disco (corte en servidor), crea el setlist del concierto y guarda el álbum en el catálogo.
 * @param params Estado y callbacks del contenedor ({@link AlbumGenerationParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useAlbumGeneration({ tracks, setErrorMessage, youtubeUrl, analyzedSourcePath, albumTitle, artistName, bandName, setGeneratedResult, setTracks, generatedResult, onSaveSetlist, onSaveAlbumToCatalog }: AlbumGenerationParams) {
  const [isProcessing, setIsProcessing] = useState(false);

  const [processingStatus, setProcessingStatus] = useState("");

  const [savedSuccessMsg, setSavedSuccessMsg] = useState(false);

  // Step 2: Slice & Generate Album
  const handleProcessAndSlice = async () => {
    if (!tracks || tracks.length === 0) {
      setErrorMessage("No hay pistas configuradas para trocear.");
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);
    setProcessingStatus("Troceando archivos de audio de alta fidelidad...");

    try {
      const data = await apiFetch<ProcessAlbumResponse>("/api/concert-to-album/process", {
        method: "POST",
        body: JSON.stringify({
          url: youtubeUrl.trim(),
          sourceFilePath: analyzedSourcePath,
          tracks,
          albumTitle: albumTitle || "Directo en Vivo",
          artist: artistName || bandName,
        }),
      });

      setGeneratedResult({
        albumId: data.albumId,
        deliverablePath: data.deliverablePath,
        tracks: data.tracks,
      });
      setTracks(data.tracks);
    } catch (err) {
      console.error("Error slicing concert:", err);
      setErrorMessage(
        getErrorMessage(err, "Error al procesar el troceado del disco."),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Create Setlist from Concert
  const handleCreateSetlistFromConcert = async () => {
    const trackListToUse = generatedResult ? generatedResult.tracks : tracks;
    if (!trackListToUse || trackListToUse.length === 0) return;

    const setlistTitle = `Directo: ${albumTitle || "Concierto en Vivo"}`;
    const setlistItems = trackListToUse.map((t, idx) => ({
      id: `i_live_${Date.now()}_${idx}`,
      tipoItem: t.type === "musica" ? "cancion" : "intro_tema",
      tituloCustom: t.title,
      notaTema:
        t.speechTranscription ||
        (t.type === "musica"
          ? `Tonalidad: ${t.tonalidad || "Mim"} | BPM: ${t.bpm || 120}`
          : ""),
      duracionEstimadaMinutos: Math.max(1, Math.round(t.duration / 60)),
      duracionEstimadaSegundos: t.duration || 180,
    }));

    const totalMinutos = setlistItems.reduce(
      (acc, it) => acc + (it.duracionEstimadaMinutos || 3),
      0,
    );

    const newSetlist = {
      id: `setlist_${Date.now()}`,
      nombre: setlistTitle,
      descripcion: `Setlist generado automáticamente a partir del audio en directo de ${albumTitle || "Concierto en Vivo"}`,
      tipoFormato: "directo",
      duracionTotalEstimadaMinutos: totalMinutos,
      fechaCreacion: new Date().toISOString().split("T")[0],
      fechaUltimaEdicion: new Date().toISOString().split("T")[0],
      items: setlistItems,
    };

    try {
      // Persist to Supabase Backend via API (band_id validated server-side)
      await apiFetch("/api/setlists", {
        method: "POST",
        body: JSON.stringify(newSetlist),
      });

      if (onSaveSetlist) {
        onSaveSetlist(newSetlist);
      }

      alert(
        `¡Setlist "${setlistTitle}" creado con éxito en tu Gestor de Repertorio/Setlists!`,
      );
    } catch (err) {
      console.warn("Error saving setlist:", err);
      alert("Error al guardar el setlist.");
    }
  };

  const handleSaveToCatalog = () => {
    if (!generatedResult) return;
    onSaveAlbumToCatalog(
      albumTitle || "Directo en Vivo",
      generatedResult.tracks,
    );
    setSavedSuccessMsg(true);
    setTimeout(() => setSavedSuccessMsg(false), 4000);
  };

  return { handleProcessAndSlice, isProcessing, processingStatus, handleCreateSetlistFromConcert, handleSaveToCatalog, savedSuccessMsg };
}
