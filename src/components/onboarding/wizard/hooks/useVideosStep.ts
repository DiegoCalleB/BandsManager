/**
 * Paso de vídeos: alta, borrado y destacado.
 * Extraído de OnboardingWizardModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import { EPKConfig,EPKVideo } from "../../../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface VideosStepParams {
  epkConfig: EPKConfig;
}

/**
 * Paso de vídeos: alta, borrado y destacado.
 * @param params Estado y callbacks del contenedor ({@link VideosStepParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useVideosStep({ epkConfig }: VideosStepParams) {
  // --- Step 5: Vídeos ---
  const [videos, setVideos] = useState<EPKVideo[]>(epkConfig?.videos || []);

  const [newVideoUrl, setNewVideoUrl] = useState("");

  const [newVideoTitle, setNewVideoTitle] = useState("");

  const [newVideoType, setNewVideoType] = useState<
    "videoclip" | "directo" | "entrevista" | "acustico"
  >("videoclip");

  // Videos Add/Remove/Toggle
  const handleAddVideo = () => {
    if (!newVideoUrl.trim()) return;
    const newVid: EPKVideo = {
      id: `vid_${Date.now()}`,
      url: newVideoUrl.trim(),
      titulo: newVideoTitle.trim() || `Vídeo ${videos.length + 1}`,
      destacado: videos.length === 0,
    };
    setVideos((prev) => [...prev, newVid]);
    setNewVideoUrl("");
    setNewVideoTitle("");
  };

  const handleRemoveVideo = (id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  };

  const handleToggleHighlightVideo = (id: string) => {
    setVideos((prev) =>
      prev.map((v) => ({
        ...v,
        destacado: v.id === id ? !v.destacado : false,
      })),
    );
  };

  return { setVideos, setNewVideoUrl, setNewVideoTitle, videos, newVideoUrl, newVideoTitle, newVideoType, setNewVideoType, handleAddVideo, handleRemoveVideo, handleToggleHighlightVideo };
}
