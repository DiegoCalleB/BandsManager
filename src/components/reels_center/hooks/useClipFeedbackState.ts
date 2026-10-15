/**
 * Estado de la nota y valoraciones del usuario para reanalizar un clip.
 * Extraído de ReelsCenter.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";

/**
 * Estado de la nota y valoraciones del usuario para reanalizar un clip.
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useClipFeedbackState() {
  // Clip Re-analysis states
  const [clipUserNote, setClipUserNote] = useState<string>("");

  const [isReanalyzingClip, setIsReanalyzingClip] = useState<boolean>(false);

  const [reanalyzeSuccessMsg, setReanalyzeSuccessMsg] = useState<string | null>(
    null,
  );

  // Valorar el título/copy anterior con estrellas + decidir si la corrección se recuerda para
  // todos los próximos Reels de la banda o es solo un ajuste puntual de este corte.
  const [clipToneRating, setClipToneRating] = useState<number>(0);

  const [clipContentRating, setClipContentRating] = useState<number>(0);

  const [clipFeedbackScope, setClipFeedbackScope] = useState<
    "este_reel" | "global"
  >("este_reel");

  return { setClipUserNote, setReanalyzeSuccessMsg, setIsReanalyzingClip, clipUserNote, clipToneRating, clipContentRating, clipFeedbackScope, setClipToneRating, setClipContentRating, isReanalyzingClip, setClipFeedbackScope, reanalyzeSuccessMsg };
}
