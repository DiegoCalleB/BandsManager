/**
 * Estado del análisis, metadatos de YouTube, línea de tiempo interactiva y simulación de reproducción.
 * Extraído de ReelsCenter.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { apiFetch } from "../../../utils/api";
import { getErrorMessage } from "../../../utils/errorMessage";
import { HighlightClip, OptimalTime, getYouTubeId } from "../../../utils/reelsUtils";
import type { EnergyWindow, SavedReelAnalysisResponse, ViralWindow, YoutubeMetaResponse } from "../reelsApiTypes";
import type { YoutubeVideoMeta } from "../reelsHelpers";
import { copyForPlatform, parseRangeTimes } from "../reelsHelpers";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface AnalysisTimelineParams {
  youtubeUrl: string;
  inputType: "file" | "youtube";
  setEditedCopy: Dispatch<SetStateAction<string>>;
  selectedPlatform: "Instagram" | "TikTok" | "YouTube" | "Facebook";
  setDetectedContentType: Dispatch<SetStateAction<string>>;
  setLoadedFromSaveAt: Dispatch<SetStateAction<string>>;
  localVideoDuration: number;
  activeTab: "pipeline" | "analyzer";
}

/**
 * Estado del análisis, metadatos de YouTube, línea de tiempo interactiva y simulación de reproducción.
 * @param params Estado y callbacks del contenedor ({@link AnalysisTimelineParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useAnalysisTimeline({ youtubeUrl, inputType, setEditedCopy, selectedPlatform, setDetectedContentType, setLoadedFromSaveAt, localVideoDuration, activeTab }: AnalysisTimelineParams) {
  const [videoTopic, setVideoTopic] = useState("");

  // Duración objetivo del CLIP que queremos sacar (15/30/60), no la del vídeo de origen.
  const [videoDuration, setVideoDuration] = useState(30);

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Ficha real del vídeo de YouTube. Antes la línea de tiempo asumía siempre 120 s, así que
  // en un directo de 40 minutos los marcadores no se correspondían con nada.
  const [videoMeta, setVideoMeta] = useState<YoutubeVideoMeta | null>(null);

  const [isFetchingMeta, setIsFetchingMeta] = useState(false);

  const [metaError, setMetaError] = useState<string | null>(null);

  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null);

  // Tramos con más volumen medidos en el audio real. Es lo que permite acertar en material
  // instrumental, donde no hay transcripción de la que tirar.
  const [energyWindows, setEnergyWindows] = useState<EnergyWindow[]>([]);

  // Versión con el desglose por señal (volumen / arranque / ritmo visual). Cuando el backend
  // no llega a calcularla (p.ej. sin yt-dlp para leer el audio en streaming) se cae a
  // energyWindows, que solo trae el score combinado.
  const [viralWindows, setViralWindows] = useState<ViralWindow[]>([]);

  // Opciones de renderizado del clip físico
  const [cropMode, setCropMode] = useState<"crop" | "blur" | "none" | "smart_pan">("crop");

  const [burnSubtitles, setBurnSubtitles] = useState(false);

  // Resaltado palabra por palabra (estilo TikTok/CapCut) en vez del subtítulo estático de siempre.
  const [karaokeSubtitles, setKaraokeSubtitles] = useState(true);

  const [loadingStep, setLoadingStep] = useState(0);

  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Results from Backend
  const [highlights, setHighlights] = useState<HighlightClip[]>([]);

  const [optimalTime, setOptimalTime] = useState<OptimalTime | null>(null);

  const [selectedHighlightIndex, setSelectedHighlightIndex] =
    useState<number>(0);

  const [simulatedTime, setSimulatedTime] = useState<number>(0);

  const [ytLoopCount, setYtLoopCount] = useState<number>(0);

  const [draggingBoundary, setDraggingBoundary] = useState<
    "start" | "end" | null
  >(null);

  // Al escribir/pegar una URL de YouTube pedimos su ficha real (título, duración, canal,
  // si tiene subtítulos). Sin esto trabajábamos a ciegas y la línea de tiempo mentía.
  useEffect(() => {
    const videoId = getYouTubeId(youtubeUrl);
    if (inputType !== "youtube" || !videoId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- limpia la ficha cuando la URL deja de ser un vídeo válido
      setVideoMeta(null);
      setMetaError(null);
      setIsFetchingMeta(false);
      return;
    }

    if (videoMeta && videoMeta.videoId === videoId) return;

    let cancelado = false;
    setIsFetchingMeta(true);
    setMetaError(null);

    const temporizador = setTimeout(async () => {
      try {
        const data = await apiFetch<YoutubeMetaResponse>(
          `/api/youtube-meta?url=${encodeURIComponent(youtubeUrl)}`,
        );
        if (cancelado) return;
        if (data?.success && data.meta) {
          setVideoMeta(data.meta as YoutubeVideoMeta);
          // Rellenamos el contexto con el título real en vez del texto genérico de relleno.
          setVideoTopic((prev) =>
            prev.trim() ? prev : data.meta.title || prev,
          );

          // Si este vídeo ya se analizó antes, recuperamos ese análisis en vez de dejar la
          // pantalla vacía hasta que el usuario pulse"Analizar" (y sin gastar otra llamada a
          // Gemini). Solo si no hay ya algo en pantalla: nunca se pisa un análisis en curso.
          try {
            const guardado = await apiFetch<SavedReelAnalysisResponse>(
              `/api/reel-analysis?youtubeUrl=${encodeURIComponent(youtubeUrl)}`,
            );
            if (!cancelado && guardado?.success && guardado.found) {
              setHighlights((prev) => {
                if (prev.length > 0) return prev;
                setSelectedHighlightIndex(0);
                setEditedCopy(
                  copyForPlatform(guardado.highlights?.[0], selectedPlatform),
                );
                setOptimalTime(guardado.optimalTime || null);
                setEnergyWindows(
                  Array.isArray(guardado.energyWindows)
                    ? guardado.energyWindows
                    : [],
                );
                setViralWindows(
                  Array.isArray(guardado.videoMeta?.viralWindows)
                    ? guardado.videoMeta.viralWindows
                    : [],
                );
                setDetectedContentType(guardado.videoMeta?.contentType || null);
                setLoadedFromSaveAt(
                  guardado.savedAt || new Date().toISOString(),
                );
                return guardado.highlights || [];
              });
            }
          } catch (err) {
            // Recuperar el análisis guardado es una comodidad: si falla, simplemente no aparece
            // y el flujo normal de"pegar URL y Analizar" sigue funcionando igual.
            console.warn("No se pudo recuperar un análisis guardado:", err);
          }
        } else {
          setMetaError(data?.error || "No se pudo leer la ficha del vídeo.");
        }
      } catch (err) {
        if (!cancelado)
          setMetaError(getErrorMessage(err, "No se pudo leer la ficha del vídeo."));
      } finally {
        if (!cancelado) setIsFetchingMeta(false);
      }
    }, 600);

    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
    // videoMeta queda fuera a propósito: solo se relee cuando cambia la URL o el tipo de entrada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeUrl, inputType]);

  /** Duración de referencia para la línea de tiempo: la real si la conocemos. */
  const timelineDuration = React.useMemo(() => {
    if (inputType === "file" && localVideoDuration > 0)
      return localVideoDuration;
    if (videoMeta?.durationKnown && videoMeta.duration > 0)
      return videoMeta.duration;
    const clip = highlights[selectedHighlightIndex];
    const { end } = parseRangeTimes(clip?.range);
    return Math.max(120, end + 30);
  }, [
    videoMeta,
    highlights,
    selectedHighlightIndex,
    inputType,
    localVideoDuration,
  ]);

  // Global drag handler for timeline dragging
  useEffect(() => {
    if (!draggingBoundary) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const container = document.getElementById(
        "interactive-timeline-container",
      );
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickPct = Math.max(0, Math.min(1, clickX / rect.width));

      const currentClip = highlights[selectedHighlightIndex];
      if (!currentClip) return;
      const { start, end } = parseRangeTimes(currentClip.range);
      const totalDuration = timelineDuration;
      const targetSeconds = Math.round(clickPct * totalDuration);

      let newStart = start;
      let newEnd = end;

      if (draggingBoundary === "start") {
        newStart = Math.max(0, Math.min(targetSeconds, end - 1));
      } else if (draggingBoundary === "end") {
        // No dejamos arrastrar más allá del final real del vídeo: un rango imposible
        // llegaba a ffmpeg y devolvía un recorte vacío.
        newEnd = Math.min(totalDuration, Math.max(targetSeconds, start + 1));
      }

      const formatSecsToMMSS = (totalSecs: number) => {
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      };

      const newRange = `${formatSecsToMMSS(newStart)}-${formatSecsToMMSS(newEnd)}`;
      setHighlights((prev) =>
        prev.map((clip, idx) =>
          idx === selectedHighlightIndex ? { ...clip, range: newRange } : clip,
        ),
      );
    };

    const handleGlobalMouseUp = () => {
      setDraggingBoundary(null);
      setSimulatedTime(0);
      setYtLoopCount((c) => c + 1);
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);

    const handleGlobalTouchMove = (e: TouchEvent) => {
      const container = document.getElementById(
        "interactive-timeline-container",
      );
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const touch = e.touches[0];
      if (!touch) return;
      const clickX = touch.clientX - rect.left;
      const clickPct = Math.max(0, Math.min(1, clickX / rect.width));

      const currentClip = highlights[selectedHighlightIndex];
      if (!currentClip) return;
      const { start, end } = parseRangeTimes(currentClip.range);
      const totalDuration = timelineDuration;
      const targetSeconds = Math.round(clickPct * totalDuration);

      let newStart = start;
      let newEnd = end;

      if (draggingBoundary === "start") {
        newStart = Math.max(0, Math.min(targetSeconds, end - 1));
      } else if (draggingBoundary === "end") {
        // No dejamos arrastrar más allá del final real del vídeo: un rango imposible
        // llegaba a ffmpeg y devolvía un recorte vacío.
        newEnd = Math.min(totalDuration, Math.max(targetSeconds, start + 1));
      }

      const formatSecsToMMSS = (totalSecs: number) => {
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      };

      const newRange = `${formatSecsToMMSS(newStart)}-${formatSecsToMMSS(newEnd)}`;
      setHighlights((prev) =>
        prev.map((clip, idx) =>
          idx === selectedHighlightIndex ? { ...clip, range: newRange } : clip,
        ),
      );
    };

    const handleGlobalTouchEnd = () => {
      setDraggingBoundary(null);
      setSimulatedTime(0);
      setYtLoopCount((c) => c + 1);
    };

    window.addEventListener("touchmove", handleGlobalTouchMove, {
      passive: true,
    });
    window.addEventListener("touchend", handleGlobalTouchEnd);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("touchmove", handleGlobalTouchMove);
      window.removeEventListener("touchend", handleGlobalTouchEnd);
    };
  }, [draggingBoundary, highlights, selectedHighlightIndex, timelineDuration]);

  // Simulated playback time for highlight looping
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const currentClip = highlights[selectedHighlightIndex];
    if (currentClip && activeTab === "analyzer") {
      const { duration } = parseRangeTimes(currentClip.range);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reinicia la simulación al cambiar de clip
      setSimulatedTime(0);
      setYtLoopCount(0);
      if (duration > 0) {
        interval = setInterval(() => {
          setSimulatedTime((prev) => {
            if (prev >= duration - 1) {
              setYtLoopCount((c) => c + 1);
              return 0; // loop back to 0
            }
            return prev + 1;
          });
        }, 1000);
      }
    } else {
      setSimulatedTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedHighlightIndex, highlights, activeTab]);

  // Pasos reales del backend. Los de antes describían un análisis espectral y un modelo de
  // BPM que no existen en ningún sitio del código.
  const getLoadingSteps = () => {
    const firstStep =
      inputType === "youtube"
        ? "Leyendo la ficha del vídeo de YouTube..."
        : "Preparando el metraje subido...";
    return [
      firstStep,
      "Descargando la transcripción con marcas de tiempo (si la hay)...",
      "Midiendo el volumen del audio para localizar los subidones...",
      "Enviando el contexto real de tu banda al modelo...",
      `Buscando los mejores fragmentos de ~${videoDuration} s...`,
      "Redactando copys, hooks y hashtags...",
    ];
  };

  return { setVideoTopic, setIsAnalyzing, setAnalysisError, setAnalysisNotice, setEnergyWindows, setViralWindows, setLoadingStep, getLoadingSteps, videoDuration, videoMeta, videoTopic, setHighlights, setOptimalTime, setSelectedHighlightIndex, setVideoMeta, highlights, selectedHighlightIndex, setSimulatedTime, setYtLoopCount, cropMode, burnSubtitles, karaokeSubtitles, optimalTime, isFetchingMeta, metaError, setVideoDuration, isAnalyzing, loadingStep, analysisError, analysisNotice, viralWindows, energyWindows, timelineDuration, setCropMode, ytLoopCount, simulatedTime, setBurnSubtitles, setKaraokeSubtitles, setDraggingBoundary };
}
