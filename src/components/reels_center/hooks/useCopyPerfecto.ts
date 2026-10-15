/**
 * Copy perfecto del corte seleccionado: pide candidatos al servidor (generar → auditar → juzgar)
 * y aplica el que elija la banda a todos los textos del corte, no solo al de la plataforma activa.
 */
import { Dispatch, SetStateAction, useState } from "react";
import { apiFetch } from "../../../utils/api";
import { getErrorMessage } from "../../../utils/errorMessage";
import type { HighlightClip } from "../../../utils/reelsUtils";
import type { CandidatoCopyApi, CopyPerfectoResponse } from "../reelsApiTypes";
import { copyForPlatform } from "../reelsHelpers";

export interface CopyPerfectoParams {
  highlights: HighlightClip[];
  selectedHighlightIndex: number;
  setHighlights: Dispatch<SetStateAction<HighlightClip[]>>;
  setEditedCopy: Dispatch<SetStateAction<string>>;
  selectedPlatform: "Instagram" | "TikTok" | "YouTube" | "Facebook";
  contentType: string;
}

export function useCopyPerfecto({ highlights, selectedHighlightIndex, setHighlights, setEditedCopy, selectedPlatform, contentType }: CopyPerfectoParams) {
  const [mejorandoCopy, setMejorandoCopy] = useState(false);
  const [opcionesCopy, setOpcionesCopy] = useState<CandidatoCopyApi[]>([]);
  const [motivoCopy, setMotivoCopy] = useState("");
  const [errorCopy, setErrorCopy] = useState("");

  const mejorarCopy = async () => {
    const clip = highlights[selectedHighlightIndex];
    if (!clip) return;
    setMejorandoCopy(true);
    setErrorCopy("");
    setOpcionesCopy([]);
    try {
      const res = await apiFetch<CopyPerfectoResponse>("/api/reels/copy-perfecto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: clip.title,
          reason: clip.reason,
          contentType,
          hookText: clip.hookText,
          recommendedCopy: clip.recommendedCopy,
          copyTikTok: clip.copyTikTok,
          copyYouTube: clip.copyYouTube,
          copyFacebook: clip.copyFacebook,
          hashtags: clip.hashtags
        })
      });
      if (!res?.success || !res.ganador) throw new Error(res?.error || "No se pudo mejorar el copy.");
      setOpcionesCopy([res.ganador, ...(res.alternativas || [])]);
      setMotivoCopy(res.motivo || "");
    } catch (err) {
      setErrorCopy(getErrorMessage(err));
    } finally {
      setMejorandoCopy(false);
    }
  };

  const aplicarCopy = (opcion: CandidatoCopyApi) => {
    const actualizado: HighlightClip = { ...highlights[selectedHighlightIndex], ...opcion.copy };
    setHighlights((prev) => prev.map((h, i) => (i === selectedHighlightIndex ? actualizado : h)));
    setEditedCopy(copyForPlatform(actualizado, selectedPlatform));
    setOpcionesCopy([]);
    setMotivoCopy("");
  };

  return { mejorandoCopy, opcionesCopy, motivoCopy, errorCopy, mejorarCopy, aplicarCopy };
}
