/**
 * Reanaliza un clip con IA usando la nota y las valoraciones del usuario (feedback de tono y contenido).
 * Extraído de ReelsCenter.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch, SetStateAction } from "react";
import { apiFetch } from "../../../utils/api";
import { HighlightClip } from "../../../utils/reelsUtils";
import type { ClipReanalysisResponse } from "../reelsApiTypes";
import { copyForPlatform, parseRangeTimes, videoKeyDeArchivo } from "../reelsHelpers";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface ClipReanalysisParams {
  highlights: HighlightClip[];
  selectedHighlightIndex: number;
  setIsReanalyzingClip: Dispatch<SetStateAction<boolean>>;
  setReanalyzeSuccessMsg: Dispatch<SetStateAction<string>>;
  youtubeUrl: string;
  selectedFile: { name: string; size: number; };
  videoTopic: string;
  clipUserNote: string;
  inputType: "file" | "youtube";
  contentType: "auto" | "concierto" | "videoclip" | "ensayo";
  detectedContentType: string;
  clipToneRating: number;
  clipContentRating: number;
  clipFeedbackScope: "este_reel" | "global";
  setHighlights: Dispatch<SetStateAction<HighlightClip[]>>;
  setEditedCopy: Dispatch<SetStateAction<string>>;
  selectedPlatform: "Instagram" | "TikTok" | "YouTube" | "Facebook";
  setClipToneRating: Dispatch<SetStateAction<number>>;
  setClipContentRating: Dispatch<SetStateAction<number>>;
}

/**
 * Reanaliza un clip con IA usando la nota y las valoraciones del usuario (feedback de tono y contenido).
 * @param params Estado y callbacks del contenedor ({@link ClipReanalysisParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useClipReanalysis({ highlights, selectedHighlightIndex, setIsReanalyzingClip, setReanalyzeSuccessMsg, youtubeUrl, selectedFile, videoTopic, clipUserNote, inputType, contentType, detectedContentType, clipToneRating, clipContentRating, clipFeedbackScope, setHighlights, setEditedCopy, selectedPlatform, setClipToneRating, setClipContentRating }: ClipReanalysisParams) {
  const handleReanalyzeClip = async () => {
    const activeClip = highlights[selectedHighlightIndex];
    if (!activeClip) return;

    setIsReanalyzingClip(true);
    setReanalyzeSuccessMsg(null);

    const { start, duration } = parseRangeTimes(activeClip.range);

    try {
      const response = await apiFetch("/api/reanalyze-clip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtubeUrl,
          fileName: selectedFile?.name,
          videoTitle: videoTopic || selectedFile?.name,
          start,
          duration,
          userNotes: clipUserNote,
          currentTitle: activeClip.title,
          currentCopy: activeClip.recommendedCopy,
          // Para que el highlight reanalizado se actualice también en lo que ya se guardó en BD,
          // no solo en la pantalla actual.
          highlightId: activeClip.id,
          videoKey:
            inputType === "file" ? videoKeyDeArchivo(selectedFile) : undefined,
          contentType:
            contentType !== "auto"
              ? contentType
              : detectedContentType || undefined,
          tonoRating: clipToneRating || undefined,
          contenidoRating: clipContentRating || undefined,
          alcance: clipFeedbackScope,
        }),
      });

      const data = response as ClipReanalysisResponse;
      if (data?.success && data.analysis) {
        const {
          title,
          reason,
          recommendedCopy,
          hashtags,
          energyLevel,
          confidence,
          hookText,
          copyTikTok,
          copyFacebook,
          cta,
        } = data.analysis;

        let clipActualizado: HighlightClip | null = null;
        setHighlights((prev) =>
          prev.map((clip, idx) => {
            if (idx === selectedHighlightIndex) {
              clipActualizado = {
                ...clip,
                title: title || clip.title,
                reason: reason || clip.reason,
                recommendedCopy: recommendedCopy || clip.recommendedCopy,
                hashtags: hashtags || clip.hashtags,
                energyLevel: energyLevel || clip.energyLevel,
                confidence: confidence || clip.confidence,
                hookText: hookText || clip.hookText,
                copyTikTok: copyTikTok || clip.copyTikTok,
                copyFacebook: copyFacebook || clip.copyFacebook,
                cta: cta || clip.cta,
              };
              return clipActualizado;
            }
            return clip;
          }),
        );

        if (clipActualizado) {
          setEditedCopy(copyForPlatform(clipActualizado, selectedPlatform));
        }

        const huboFeedback = Boolean(
          clipUserNote.trim() || clipToneRating || clipContentRating,
        );
        setReanalyzeSuccessMsg(
          data.generatedByAI === false
            ? "Fragmento actualizado (la IA no estaba disponible: se ha usado una plantilla con tus notas)."
            : huboFeedback && clipFeedbackScope === "global"
              ? "¡Análisis refinado! Este ajuste se recordará también en tus próximos Reels."
              : "¡Análisis del fragmento refinado con éxito!",
        );
        setTimeout(() => setReanalyzeSuccessMsg(null), 5000);
        // Se resetea la valoración tras usarla: es feedback sobre ESA versión, no debe arrastrarse
        // a la siguiente regeneración como si aplicara también a ella.
        setClipToneRating(0);
        setClipContentRating(0);
      } else {
        alert(data?.error || "No se pudo reanalizar el fragmento.");
      }
    } catch (err) {
      console.error("Error reanalyzing clip:", err);
      alert("Hubo un problema al conectar con el servidor para el reanálisis.");
    } finally {
      setIsReanalyzingClip(false);
    }
  };

  return { handleReanalyzeClip };
}
