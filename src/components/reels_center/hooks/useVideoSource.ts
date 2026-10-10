/**
 * Origen del vídeo: tipo de entrada, URL de YouTube, archivo local y vista previa ampliada.
 * Extraído de ReelsCenter.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useEffect, useState } from "react";

/**
 * Origen del vídeo: tipo de entrada, URL de YouTube, archivo local y vista previa ampliada.
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useVideoSource() {
  // New AI Analyzer States
  const [inputType, setInputType] = useState<"file" | "youtube">("file");

  const [youtubeUrl, setYoutubeUrl] = useState("");

  const [dragActive, setDragActive] = useState(false);

  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
  } | null>(null);

  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);

  // Duración real del archivo subido. Sin ella, al analizar un vídeo local el backend
  // trabajaba a ciegas y repartía los cortes sobre una duración inventada.
  const [localVideoDuration, setLocalVideoDuration] = useState<number>(0);

  const [isPreviewMuted, setIsPreviewMuted] = useState(true);

  const [isExpandedPreview, setIsExpandedPreview] = useState(false);

  useEffect(() => {
    if (isExpandedPreview) {
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        const modalEl = document.getElementById("theater-mode-modal");
        if (modalEl) modalEl.scrollTop = 0;
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      }, 10);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isExpandedPreview]);

  // Close expanded preview modal when Escape is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpandedPreview) {
        setIsExpandedPreview(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpandedPreview]);

  return { localVideoUrl, youtubeUrl, inputType, localVideoDuration, setLocalVideoUrl, setDragActive, setSelectedFile, setLocalVideoDuration, selectedFile, setInputType, dragActive, setYoutubeUrl, isPreviewMuted, setIsPreviewMuted, isExpandedPreview, setIsExpandedPreview };
}
