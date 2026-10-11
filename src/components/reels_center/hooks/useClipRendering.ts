/**
 * Corta el vídeo físico en servidor, captura la miniatura y descarga el pack completo del clip.
 * Extraído de ReelsCenter.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch, SetStateAction } from "react";
import { apiFetch } from "../../../utils/api";
import { getErrorMessage } from "../../../utils/errorMessage";
import { getYouTubeId, HighlightClip, OptimalTime } from "../../../utils/reelsUtils";
import type { CutClipResponse } from "../reelsApiTypes";
import { formatTime, parseRangeTimes } from "../reelsHelpers";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface ClipRenderingParams {
  highlights: HighlightClip[];
  selectedHighlightIndex: number;
  youtubeUrl: string;
  setIsCuttingVideo: Dispatch<SetStateAction<boolean>>;
  setCuttingError: Dispatch<SetStateAction<string>>;
  setCuttingProgressText: Dispatch<SetStateAction<string>>;
  setWordOffsets: Dispatch<SetStateAction<{ word: string; start: number; end: number; }[]>>;
  setSinTranscripcionReal: Dispatch<SetStateAction<boolean>>;
  cropMode: "crop" | "blur" | "none" | "smart_pan";
  burnSubtitles: boolean;
  karaokeSubtitles: boolean;
  renderedClipUrl: string;
  renderedSubUrl: string;
  setRenderedClipUrl: Dispatch<SetStateAction<string>>;
  setRenderedClipSize: Dispatch<SetStateAction<number>>;
  setRenderedBurnedSubs: Dispatch<SetStateAction<boolean>>;
  setRenderedStoredPermanently: Dispatch<SetStateAction<boolean>>;
  setRenderedSubUrl: Dispatch<SetStateAction<string>>;
  setSubtitleCues: Dispatch<SetStateAction<{ text: string; start: number; end: number; }[]>>;
  bandName: string;
  setThumbnailCapturedSuccess: Dispatch<SetStateAction<boolean>>;
  selectedPlatform: "Instagram" | "TikTok" | "YouTube" | "Facebook";
  editedCopy: string;
  optimalTime: OptimalTime;
  nombreBanda: string;
  copyObjective: "viral" | "comunidad" | "conversion";
  subtitleCues: { text: string; start: number; end: number; }[];
  setPackDownloadedSuccess: Dispatch<SetStateAction<boolean>>;
}

/**
 * Corta el vídeo físico en servidor, captura la miniatura y descarga el pack completo del clip.
 * @param params Estado y callbacks del contenedor ({@link ClipRenderingParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useClipRendering({ highlights, selectedHighlightIndex, youtubeUrl, setIsCuttingVideo, setCuttingError, setCuttingProgressText, setWordOffsets, setSinTranscripcionReal, cropMode, burnSubtitles, karaokeSubtitles, renderedClipUrl, renderedSubUrl, setRenderedClipUrl, setRenderedClipSize, setRenderedBurnedSubs, setRenderedStoredPermanently, setRenderedSubUrl, setSubtitleCues, bandName, setThumbnailCapturedSuccess, selectedPlatform, editedCopy, optimalTime, nombreBanda, copyObjective, subtitleCues, setPackDownloadedSuccess }: ClipRenderingParams) {
  const handleCutPhysicalVideo = async () => {
    const activeClip = highlights[selectedHighlightIndex];
    if (!activeClip || !youtubeUrl) return;

    setIsCuttingVideo(true);
    setCuttingError(null);
    setCuttingProgressText("Conectando con el servidor...");
    setWordOffsets([]);
    setSinTranscripcionReal(false);

    const { start, duration } = parseRangeTimes(activeClip.range);
    const clipId = `reel-${selectedHighlightIndex}-${Date.now()}`;

    const progressSteps = [
      "Descargando el vídeo de YouTube...",
      "Extrayendo la mejor pista de vídeo y audio disponible...",
      "Preparando ffmpeg...",
      `Recortando de ${formatTime(start)} a ${formatTime(start + duration)}...`,
      cropMode === "blur"
        ? "Componiendo fondo desenfocado en 9:16 (no se recorta a nadie)..."
        : cropMode === "crop"
          ? "Aplicando encuadre vertical 9:16..."
          : "Manteniendo el encuadre original...",
      "Buscando la transcripción de YouTube para los subtítulos...",
      burnSubtitles
        ? "Incrustando los subtítulos en la imagen..."
        : "Generando la pista de subtítulos (.vtt)...",
      "Codificando el MP4 final...",
      "Últimos ajustes...",
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < progressSteps.length - 1) {
        currentStep++;
        setCuttingProgressText(progressSteps[currentStep]);
      }
    }, 2500);

    try {
      const res = await apiFetch("/api/cut-video-clip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtubeUrl,
          start,
          duration,
          clipId,
          cropMode,
          burnSubtitles,
          karaokeSubtitles,
          // Flag antiguo, por si el servidor todavía no está actualizado.
          cropVertical: cropMode !== "none",
        }),
      });

      clearInterval(interval);

      // apiFetch ya devuelve el JSON parseado, no una Response: llamar a res.json() aquí
      // reventaba con"res.json is not a function" y res.ok era siempre undefined.
      const data = res as CutClipResponse;
      if (!data?.success) {
        throw new Error(data?.error || "Error al codificar el clip de vídeo.");
      }

      // Los blobs anteriores dejan de hacer falta en cuanto llega un clip nuevo.
      if (renderedClipUrl && renderedClipUrl.startsWith("blob:")) {
        URL.revokeObjectURL(renderedClipUrl);
      }
      if (renderedSubUrl && renderedSubUrl.startsWith("blob:")) {
        URL.revokeObjectURL(renderedSubUrl);
      }

      // El servidor sirve ahora el clip como archivo estático. El base64 se mantiene como
      // respaldo: metía 30 MB dentro de un JSON y reventaba el límite del body.
      let nuevaUrl: string | null = null;
      if (data.clipUrl) {
        nuevaUrl = String(data.clipUrl);
      } else if (data.videoBase64) {
        const parts = String(data.videoBase64).split(",");
        const mimeString = parts[0].split(":")[1].split(";")[0];
        const byteString = atob(parts[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        nuevaUrl = URL.createObjectURL(new Blob([ab], { type: mimeString }));
      }

      if (!nuevaUrl) {
        throw new Error("El servidor no devolvió ningún clip renderizado.");
      }
      setRenderedClipUrl(nuevaUrl);
      setRenderedClipSize(Number(data.fileSize) || 0);
      setRenderedBurnedSubs(Boolean(data.burnedSubtitles));
      setRenderedStoredPermanently(Boolean(data.storedPermanently));

      if (data.vttContent) {
        const vttBlob = new Blob([data.vttContent], { type: "text/vtt" });
        setRenderedSubUrl(URL.createObjectURL(vttBlob));
      } else {
        setRenderedSubUrl(null);
      }

      setSubtitleCues(data.subtitles || []);
      setWordOffsets(data.words || []);
      setSinTranscripcionReal(Boolean(data.sinTranscripcionReal));
      setCuttingProgressText("¡Clip renderizado y listo para descargar!");
    } catch (err) {
      clearInterval(interval);
      setCuttingError(getErrorMessage(err, "Error al renderizar el clip."));
    } finally {
      setIsCuttingVideo(false);
    }
  };

  // Captura instantánea de fotograma / miniatura para la portada
  const handleCaptureThumbnail = () => {
    const clip = highlights[selectedHighlightIndex];
    const bName = (bandName || "banda")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    const clipName = clip?.title
      ? clip.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 20)
      : `clip-${selectedHighlightIndex + 1}`;

    const video = document.querySelector("video") as HTMLVideoElement | null;
    if (video && video.videoWidth > 0) {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
          const a = document.createElement("a");
          a.href = dataUrl;
          a.download = `portada_reel_${bName}_${clipName}.jpg`;
          a.click();
          setThumbnailCapturedSuccess(true);
          setTimeout(() => setThumbnailCapturedSuccess(false), 2500);
          return;
        }
      } catch (e) {
        console.warn("No se pudo capturar canvas directo:", e);
      }
    }

    const ytid = getYouTubeId(youtubeUrl);
    if (ytid) {
      const highResThumb = `https://img.youtube.com/vi/${ytid}/maxresdefault.jpg`;
      const a = document.createElement("a");
      a.href = highResThumb;
      a.target = "_blank";
      a.download = `portada_reel_${bName}_${clipName}.jpg`;
      a.click();
      setThumbnailCapturedSuccess(true);
      setTimeout(() => setThumbnailCapturedSuccess(false), 2500);
    }
  };

  // Descarga del Pack Completo en 1-Click (Video + Subtítulos + Copy TXT + Portada)
  const handleDownloadCompletePack = () => {
    const clip = highlights[selectedHighlightIndex];
    if (!clip) return;

    const bName = (bandName || "banda")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    const clipName = clip.title
      ? clip.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 25)
      : `clip-${selectedHighlightIndex + 1}`;

    // 1. Descargar Ficha de Publicación TXT
    const hookText = clip.hookText
      ? `🎯 GANCHO VISUAL EN PANTALLA (0-3s):\n"${clip.hookText}"\n\n`
      : "";
    const copyText = `📝 TEXTO PARA EL POST (${selectedPlatform.toUpperCase()}):\n${editedCopy.trim()}\n\n`;
    const ctaText = clip.cta ? `👉 LLAMADA A LA ACCIÓN:\n${clip.cta}\n\n` : "";
    const tagsText =
      clip.hashtags && clip.hashtags.length > 0
        ? `🏷️ HASHTAGS:\n${clip.hashtags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ")}\n\n`
        : "";
    const horaOptima = optimalTime
      ? `⏰ MEJOR HORA RECOMENDADA PARA PUBLICAR:\n${optimalTime.time} (${optimalTime.reason})\n\n`
      : "";
    const metaInfo = `🎵 ARTISTA: ${nombreBanda}\n🎬 RECORTE: ${clip.range || "0:00-0:30"} (${clip.duration || 30}s)\n⚡ OBJETIVO: ${copyObjective.toUpperCase()}\n`;

    const txtContent = `${hookText}${copyText}${ctaText}${tagsText}${horaOptima}${metaInfo}`;
    const blobTxt = new Blob([txtContent], {
      type: "text/plain;charset=utf-8",
    });
    const urlTxt = URL.createObjectURL(blobTxt);
    const aTxt = document.createElement("a");
    aTxt.href = urlTxt;
    aTxt.download = `post_${selectedPlatform.toLowerCase()}_${bName}_${clipName}.txt`;
    aTxt.click();
    URL.revokeObjectURL(urlTxt);

    // 2. Descargar Subtítulos VTT si están disponibles
    if (renderedSubUrl) {
      const aSub = document.createElement("a");
      aSub.href = renderedSubUrl;
      aSub.download = `subtitulos_${bName}_${clipName}.vtt`;
      aSub.click();
    } else if (subtitleCues.length > 0) {
      let vttContent = "WEBVTT\n\n";
      subtitleCues.forEach((c, idx) => {
        vttContent += `${idx + 1}\n${formatTime(c.start)}.000 --> ${formatTime(c.end)}.000\n${c.text}\n\n`;
      });
      const blobVtt = new Blob([vttContent], {
        type: "text/vtt;charset=utf-8",
      });
      const urlVtt = URL.createObjectURL(blobVtt);
      const aVtt = document.createElement("a");
      aVtt.href = urlVtt;
      aVtt.download = `subtitulos_${bName}_${clipName}.vtt`;
      aVtt.click();
      URL.revokeObjectURL(urlVtt);
    }

    // 3. Descargar Vídeo MP4 si ya está renderizado
    if (renderedClipUrl) {
      const aVid = document.createElement("a");
      aVid.href = renderedClipUrl;
      aVid.download = `video_reel_${bName}_${clipName}.mp4`;
      aVid.click();
    }

    // 4. Capturar miniatura
    handleCaptureThumbnail();

    setPackDownloadedSuccess(true);
    setTimeout(() => setPackDownloadedSuccess(false), 3500);
  };

  return { handleDownloadCompletePack, handleCaptureThumbnail, handleCutPhysicalVideo };
}
