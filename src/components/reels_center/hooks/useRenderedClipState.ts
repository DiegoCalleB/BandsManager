/**
 * Estado del clip renderizado (URLs, subtítulos, tamaño) y limpieza de URLs blob.
 * Extraído de ReelsCenter.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React, { useEffect, useState } from "react";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface RenderedClipStateParams {
  localVideoUrl: string;
}

/**
 * Estado del clip renderizado (URLs, subtítulos, tamaño) y limpieza de URLs blob.
 * @param params Estado y callbacks del contenedor ({@link RenderedClipStateParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useRenderedClipState({ localVideoUrl }: RenderedClipStateParams) {
  // Real physical video cutting and subtitle states
  const [renderedClipUrl, setRenderedClipUrl] = useState<string | null>(null);

  const [renderedSubUrl, setRenderedSubUrl] = useState<string | null>(null);

  const [subtitleCues, setSubtitleCues] = useState<
    Array<{ text: string; start: number; end: number }>
  >([]);

  const [wordOffsets, setWordOffsets] = useState<
    Array<{ word: string; start: number; end: number }>
  >([]);
  const [currentSubtitleText, setCurrentSubtitleText] = useState<string>("");

  const [isCuttingVideo, setIsCuttingVideo] = useState(false);

  const [cuttingProgressText, setCuttingProgressText] = useState("");

  const [cuttingError, setCuttingError] = useState<string | null>(null);

  const [sinTranscripcionReal, setSinTranscripcionReal] =
    useState<boolean>(false);

  const [renderedClipSize, setRenderedClipSize] = useState<number>(0);

  const [renderedBurnedSubs, setRenderedBurnedSubs] = useState<boolean>(false);

  // Si el clip se subió a Supabase Storage sobrevive a un redeploy; si no, solo vive en el
  // disco del servidor hasta el próximo despliegue.
  const [renderedStoredPermanently, setRenderedStoredPermanently] =
    useState<boolean>(false);

  // Cuándo se guardó el análisis que se está viendo, si viene recuperado de la BD en vez de
  // recién calculado. null cuando el análisis en pantalla es fresco (o no hay ninguno).
  const [loadedFromSaveAt, setLoadedFromSaveAt] = useState<string | null>(null);

  const [packDownloadedSuccess, setPackDownloadedSuccess] =
    useState<boolean>(false);

  const [thumbnailCapturedSuccess, setThumbnailCapturedSuccess] =
    useState<boolean>(false);

  // Al salir del centro de Reels hay que soltar los blobs: sin esto, el vídeo local y el clip
  // renderizado se quedaban retenidos en memoria hasta recargar la página entera.
  const urlsVivas = React.useRef<{
    local: string | null;
    clip: string | null;
    subs: string | null;
  }>({
    local: null,
    clip: null,
    subs: null,
  });

  useEffect(() => {
    urlsVivas.current = {
      local: localVideoUrl,
      clip: renderedClipUrl,
      subs: renderedSubUrl,
    };
  }, [localVideoUrl, renderedClipUrl, renderedSubUrl]);

  useEffect(() => {
    return () => {
      for (const url of Object.values(urlsVivas.current)) {
        if (url && url.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(url);
          } catch {
            /* ya revocado */
          }
        }
      }
    };
  }, []);

  return { renderedClipUrl, setLoadedFromSaveAt, setRenderedClipUrl, setRenderedClipSize, setRenderedBurnedSubs, setRenderedStoredPermanently, setRenderedSubUrl, setSubtitleCues, setWordOffsets, setCurrentSubtitleText, setCuttingError, setIsCuttingVideo, setCuttingProgressText, setSinTranscripcionReal, renderedSubUrl, setThumbnailCapturedSuccess, subtitleCues, setPackDownloadedSuccess, loadedFromSaveAt, packDownloadedSuccess, thumbnailCapturedSuccess, renderedBurnedSubs, currentSubtitleText, renderedClipSize, renderedStoredPermanently, sinTranscripcionReal, wordOffsets, isCuttingVideo, cuttingProgressText, cuttingError };
}
