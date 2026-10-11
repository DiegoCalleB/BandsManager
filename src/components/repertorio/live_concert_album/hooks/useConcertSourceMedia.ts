/**
 * Gestiona la fuente del concierto: URL de YouTube, subida binaria por trozos, archivo local y audio demo.
 * Extraído de LiveConcertToAlbumModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React, { Dispatch, SetStateAction, useState } from "react";
import { apiFetch } from "../../../../utils/api";
import { getErrorMessage } from "../../../../utils/errorMessage";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface ConcertSourceMediaParams {
  setErrorMessage: Dispatch<SetStateAction<string>>;
  setAnalysisStatus: Dispatch<SetStateAction<string>>;
}

/**
 * Gestiona la fuente del concierto: URL de YouTube, subida binaria por trozos, archivo local y audio demo.
 * @param params Estado y callbacks del contenedor ({@link ConcertSourceMediaParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useConcertSourceMedia({ setErrorMessage, setAnalysisStatus }: ConcertSourceMediaParams) {
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [analyzedSourcePath, setAnalyzedSourcePath] = useState("");

  const [youtubeBlocked, setYoutubeBlocked] = useState(false);

  const [audioAvailable, setAudioAvailable] = useState(true);

  const [isLinkingLocalFile, setIsLinkingLocalFile] = useState(false);

  // Helper for binary streaming upload via FormData & Chunks (handles 1GB+ files cleanly without 413 limits)
  const uploadFileBinary = async (
    file: File,
    folder = "conciertos_fuente",
    onProgress?: (msg: string) => void,
  ): Promise<string> => {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks fit easily inside Cloud Run / proxy limits

    const token =
      localStorage.getItem("bandmanager_token") || localStorage.getItem("token");
    let activeBandId = "";
    try {
      const userStr = localStorage.getItem("bandmanager_user");
      if (userStr) activeBandId = JSON.parse(userStr)?.band_id || "";
    } catch {
      // localStorage no disponible: se envía la petición sin cabecera de banda explícita
    }

    const authHeaders: Record<string, string> = {};
    if (token) authHeaders["Authorization"] = `Bearer ${token}`;
    if (activeBandId) authHeaders["x-band-id"] = activeBandId;

    if (file.size <= 10 * 1024 * 1024) {
      if (onProgress) onProgress("Subiendo archivo...");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        throw new Error(
          `Falló la subida (${uploadRes.status}): ${errorText.substring(0, 100)}`,
        );
      }

      const uploadData = await uploadRes.json();
      return uploadData.filePath || uploadData.url || "";
    }

    // Chunked upload for files > 10MB
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(file.size, start + CHUNK_SIZE);
      const chunkBlob = file.slice(start, end);

      const formData = new FormData();
      formData.append("chunk", chunkBlob, file.name);
      formData.append("uploadId", uploadId);
      formData.append("chunkIndex", String(i));
      formData.append("totalChunks", String(totalChunks));
      formData.append("filename", file.name);
      formData.append("folder", folder);

      const percent = Math.round(((i + 1) / totalChunks) * 100);
      const mbUploaded = (end / (1024 * 1024)).toFixed(0);
      const mbTotal = (file.size / (1024 * 1024)).toFixed(0);
      if (onProgress) {
        onProgress(
          `Subiendo archivo en partes: ${percent}% (${mbUploaded}MB / ${mbTotal}MB)...`,
        );
      }

      const res = await fetch("/api/upload/chunk", {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          `Error subiendo la parte ${i + 1}/${totalChunks} (${res.status}): ${errorText.substring(0, 100)}`,
        );
      }

      const data = await res.json();
      if (data.completed) {
        return data.filePath || data.url || "";
      }
    }

    throw new Error("No se completó la subida del archivo.");
  };

  // Quick attach local MP3/MP4 media file for audio listening & Gemini audio transcription
  const handleAttachLocalAudioFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLinkingLocalFile(true);
    setErrorMessage(null);
    try {
      const sourceFilePath = await uploadFileBinary(
        file,
        "conciertos_fuente",
        (msg) => {
          setAnalysisStatus(msg);
        },
      );
      setAnalyzedSourcePath(sourceFilePath);
      setAudioAvailable(true);
      setYoutubeBlocked(false);
    } catch (err) {
      console.error("Error linking local audio file:", err);
      alert(getErrorMessage(err, "Error al vincular el archivo de audio local."));
    } finally {
      setIsLinkingLocalFile(false);
    }
  };

  const handleLoadDemoAudio = async () => {
    setIsLinkingLocalFile(true);
    setErrorMessage(null);
    try {
      const res = await apiFetch("/api/concert-to-album/demo-audio", {
        method: "POST",
      });
      if (res.success && res.filePath) {
        setAnalyzedSourcePath(res.filePath);
        setAudioAvailable(true);
        setYoutubeBlocked(false);
      } else {
        throw new Error("No se pudo generar el audio demo.");
      }
    } catch (err) {
      console.error("Error loading demo audio:", err);
      alert(getErrorMessage(err, "Error al cargar el audio demo."));
    } finally {
      setIsLinkingLocalFile(false);
    }
  };

  return { youtubeUrl, analyzedSourcePath, uploadedFile, uploadFileBinary, setAnalyzedSourcePath, setYoutubeBlocked, setAudioAvailable, setYoutubeUrl, setUploadedFile, audioAvailable, youtubeBlocked, handleLoadDemoAudio, isLinkingLocalFile, handleAttachLocalAudioFile };
}
