/**
 * Lanza el análisis IA del vídeo (YouTube o archivo local) y vuelca los highlights resultantes.
 * Extraído de ReelsCenter.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch, SetStateAction } from "react";
import { apiFetch } from "../../../utils/api";
import { getErrorMessage } from "../../../utils/errorMessage";
import { HighlightClip, OptimalTime } from "../../../utils/reelsUtils";
import type { AnalyzeVideoResponse } from "../reelsApiTypes";
import type { YoutubeVideoMeta } from "../reelsHelpers";
import { copyForPlatform, videoKeyDeArchivo } from "../reelsHelpers";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface VideoAnalyzerParams {
  inputType: "file" | "youtube";
  selectedFile: { name: string; size: number; };
  youtubeUrl: string;
  setRenderedClipUrl: Dispatch<SetStateAction<string>>;
  setRenderedClipSize: Dispatch<SetStateAction<number>>;
  setRenderedBurnedSubs: Dispatch<SetStateAction<boolean>>;
  setRenderedStoredPermanently: Dispatch<SetStateAction<boolean>>;
  setRenderedSubUrl: Dispatch<SetStateAction<string>>;
  setSubtitleCues: Dispatch<SetStateAction<{ text: string; start: number; end: number; }[]>>;
  setWordOffsets: Dispatch<SetStateAction<{ word: string; start: number; end: number; }[]>>;
  setCurrentSubtitleText: Dispatch<SetStateAction<string>>;
  setCuttingError: Dispatch<SetStateAction<string>>;
  setIsAnalyzing: Dispatch<SetStateAction<boolean>>;
  setAnalysisError: Dispatch<SetStateAction<string>>;
  setAnalysisNotice: Dispatch<SetStateAction<string>>;
  setEnergyWindows: Dispatch<SetStateAction<{ start: number; end: number; score: number; }[]>>;
  setViralWindows: Dispatch<SetStateAction<{ start: number; end: number; energia: number; arranque: number; dinamismo: number; score: number; motivo: string; }[]>>;
  setLoadedFromSaveAt: Dispatch<SetStateAction<string>>;
  setLoadingStep: Dispatch<SetStateAction<number>>;
  setDetectedContentType: Dispatch<SetStateAction<string>>;
  getLoadingSteps: () => string[];
  videoDuration: number;
  localVideoDuration: number;
  videoMeta: YoutubeVideoMeta;
  contentType: "auto" | "concierto" | "videoclip" | "ensayo";
  videoTopic: string;
  setHighlights: Dispatch<SetStateAction<HighlightClip[]>>;
  setOptimalTime: Dispatch<SetStateAction<OptimalTime>>;
  setSelectedHighlightIndex: Dispatch<SetStateAction<number>>;
  setVideoMeta: Dispatch<SetStateAction<YoutubeVideoMeta>>;
  setEditedCopy: Dispatch<SetStateAction<string>>;
  selectedPlatform: "Instagram" | "TikTok" | "YouTube" | "Facebook";
  setScheduledDate: Dispatch<SetStateAction<string>>;
  setScheduledTime: Dispatch<SetStateAction<string>>;
}

/**
 * Lanza el análisis IA del vídeo (YouTube o archivo local) y vuelca los highlights resultantes.
 * @param params Estado y callbacks del contenedor ({@link VideoAnalyzerParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useVideoAnalyzer({ inputType, selectedFile, youtubeUrl, setRenderedClipUrl, setRenderedClipSize, setRenderedBurnedSubs, setRenderedStoredPermanently, setRenderedSubUrl, setSubtitleCues, setWordOffsets, setCurrentSubtitleText, setCuttingError, setIsAnalyzing, setAnalysisError, setAnalysisNotice, setEnergyWindows, setViralWindows, setLoadedFromSaveAt, setLoadingStep, setDetectedContentType, getLoadingSteps, videoDuration, localVideoDuration, videoMeta, contentType, videoTopic, setHighlights, setOptimalTime, setSelectedHighlightIndex, setVideoMeta, setEditedCopy, selectedPlatform, setScheduledDate, setScheduledTime }: VideoAnalyzerParams) {
  // Trigger Highlight Extraction via backend API
  const handleAnalyzeVideo = async () => {
    if (inputType === "file" && !selectedFile) return;
    if (inputType === "youtube" && !youtubeUrl) return;

    // Reset physical clip and subtitle state for the new video
    setRenderedClipUrl(null);
    setRenderedClipSize(0);
    setRenderedBurnedSubs(false);
    setRenderedStoredPermanently(false);
    setRenderedSubUrl(null);
    setSubtitleCues([]);
    setWordOffsets([]);
    setCurrentSubtitleText("");
    setCuttingError(null);

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisNotice(null);
    setEnergyWindows([]);
    setViralWindows([]);
    // Un análisis pedido a propósito siempre es fresco, así que no arrastramos el aviso de
    //"esto es lo que había guardado" de una vez anterior.
    setLoadedFromSaveAt(null);
    setLoadingStep(0);
    // El tipo detectado se pisa con el que devuelva este análisis nuevo; hasta entonces no
    // mostramos el de un vídeo anterior.
    setDetectedContentType(null);

    const steps = getLoadingSteps();

    // Simulate stepping for user feedback
    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 1500);

    try {
      const targetYtUrl =
        inputType === "youtube" ? youtubeUrl : youtubeUrl || undefined;
      const res = await apiFetch("/api/analyze-video-highlights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: inputType === "file" ? selectedFile?.name : undefined,
          youtubeUrl: targetYtUrl,
          // targetDuration = cuánto debe durar cada clip; knownDuration = cuánto dura el vídeo.
          // Antes ambas cosas viajaban en el mismo campo y la IA recibía"el vídeo dura 30 s".
          targetDuration: videoDuration,
          knownDuration:
            inputType === "file"
              ? localVideoDuration > 0
                ? localVideoDuration
                : undefined
              : videoMeta?.durationKnown
                ? videoMeta.duration
                : undefined,
          // Sin esto, un vídeo subido como archivo nunca se podía guardar ni recuperar: el
          // servidor nunca ve el archivo en sí, así que necesita esta clave para reconocerlo.
          videoKey:
            inputType === "file" ? videoKeyDeArchivo(selectedFile) : undefined,
          contentType: contentType !== "auto" ? contentType : undefined,
          videoDuration: videoDuration,
          videoTopic: videoTopic || undefined,
        }),
      });

      clearInterval(stepInterval);

      // apiFetch resuelve ya con el JSON parseado (o lanza si la respuesta no fue 2xx),
      // así que aquí no hay ninguna Response sobre la que llamar a .json().
      const data = res as AnalyzeVideoResponse;

      if (!data?.success) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Error al procesar el vídeo en el servidor. Revisa tu sesión o inténtalo de nuevo.",
        );
      }

      setHighlights(data.highlights || []);
      setOptimalTime(data.optimalTime || null);
      setSelectedHighlightIndex(0);
      setAnalysisNotice(data.notice || null);
      setEnergyWindows(
        Array.isArray(data.energyWindows) ? data.energyWindows : [],
      );
      setViralWindows(
        Array.isArray(data.viralWindows) ? data.viralWindows : [],
      );
      setDetectedContentType(data.contentType || null);
      if (data.videoMeta && data.videoMeta.videoId) {
        setVideoMeta(data.videoMeta as YoutubeVideoMeta);
      }

      // Initialize editing form fields
      if (data.highlights && data.highlights.length > 0) {
        const firstClip = data.highlights[0] as HighlightClip & { copy?: string };
        setEditedCopy(copyForPlatform(firstClip, selectedPlatform) || firstClip.copy || "");
      }
      if (data.optimalTime) {
        setScheduledDate(data.optimalTime.date || "2026-07-30");
        setScheduledTime(data.optimalTime.time || "20:30");
      }
    } catch (err) {
      clearInterval(stepInterval);
      setAnalysisError(getErrorMessage(err, "Error de conexión con la IA."));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { handleAnalyzeVideo };
}
