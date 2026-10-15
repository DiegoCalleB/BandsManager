/**
 * Entrada de archivo local: cambio de vídeo, arrastrar y soltar y selector de archivos.
 * Extraído de ReelsCenter.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React, { Dispatch, SetStateAction } from "react";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface VideoFileInputParams {
  setLocalVideoUrl: Dispatch<SetStateAction<string>>;
  setDragActive: Dispatch<SetStateAction<boolean>>;
  setSelectedFile: Dispatch<SetStateAction<{ name: string; size: number; }>>;
  setLocalVideoDuration: Dispatch<SetStateAction<number>>;
  setVideoTopic: Dispatch<SetStateAction<string>>;
}

/**
 * Entrada de archivo local: cambio de vídeo, arrastrar y soltar y selector de archivos.
 * @param params Estado y callbacks del contenedor ({@link VideoFileInputParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useVideoFileInput({ setLocalVideoUrl, setDragActive, setSelectedFile, setLocalVideoDuration, setVideoTopic }: VideoFileInputParams) {
  // Drag & Drop helper
  /**
   * Cambia el vídeo local revocando antes el blob anterior. Elegir otro archivo sin pasar por
   * el botón de"eliminar" dejaba el vídeo previo entero retenido en memoria por su object URL.
   */
  const cambiarVideoLocal = (file: File | null) => {
    setLocalVideoUrl((prev) => {
      if (prev && prev.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(prev);
        } catch {
          /* ya revocado */
        }
      }
      if (!file) return null;
      try {
        return URL.createObjectURL(file);
      } catch (err) {
        console.error("Error creating Object URL for video:", err);
        return null;
      }
    });
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile({
        name: file.name,
        size: file.size,
      });
      setLocalVideoDuration(0);
      cambiarVideoLocal(file);
      // Try to auto-extract context from file name
      const cleanName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/_/g, " ")
        .replace(/-/g, " ");
      setVideoTopic(cleanName);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile({
        name: file.name,
        size: file.size,
      });
      setLocalVideoDuration(0);
      cambiarVideoLocal(file);
      const cleanName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/_/g, " ")
        .replace(/-/g, " ");
      setVideoTopic(cleanName);
    }
  };

  return { handleFileDrop, handleFileSelect, cambiarVideoLocal };
}
