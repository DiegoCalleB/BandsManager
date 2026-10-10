/**
 * Opciones de estilo del clip (loop, zoom, subtítulos, pegatinas, layout) y piloto automático mágico.
 * Extraído de ReelsCenter.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch, SetStateAction, useState } from "react";
import { apiFetch } from "../../../utils/api";
import { HighlightClip } from "../../../utils/reelsUtils";
import type { ConcertsResponse } from "../reelsApiTypes";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface ReelStyleOptionsParams {
  highlights: HighlightClip[];
  handleSelectHighlight: (index: number) => void;
  selectedHighlightIndex: number;
  setHighlights: Dispatch<SetStateAction<HighlightClip[]>>;
  bandName: string;
}

/**
 * Opciones de estilo del clip (loop, zoom, subtítulos, pegatinas, layout) y piloto automático mágico.
 * @param params Estado y callbacks del contenedor ({@link ReelStyleOptionsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useReelStyleOptions({ highlights, handleSelectHighlight, selectedHighlightIndex, setHighlights, bandName }: ReelStyleOptionsParams) {
  // Viral Growth Engine 4.0: Bucle Infinito + Estilo de Subtítulos + Layouts + Punch-In Zoom + B-Roll Overlays
  const [isSeamlessLoop, setIsSeamlessLoop] = useState<boolean>(true);

  const [isPunchInZoom, setIsPunchInZoom] = useState<boolean>(true);

  const [activeSubtitleStyle, setActiveSubtitleStyle] = useState<
    "gold" | "neon" | "cinematic" | "minimal"
  >("gold");

  const [injectEmojis, setInjectEmojis] = useState<boolean>(true);

  const [showSpotifyBadge, setShowSpotifyBadge] = useState<boolean>(true);

  const [showRetentionProgressBar, setShowRetentionProgressBar] =
    useState<boolean>(true);

  const [showTourSticker, setShowTourSticker] = useState<boolean>(false);

  const [tourStickerText, setTourStickerText] = useState<string>(
    "🎟️ Gira 2026 · Próximo Bolo en Madrid",
  );

  const [layoutMode, setLayoutMode] = useState<"full" | "split" | "pip">(
    "full",
  );

  const [beatDropFx, setBeatDropFx] = useState<boolean>(true);

  const [smartPan, setSmartPan] = useState<boolean>(false);

  const [magicAppliedNotification, setMagicAppliedNotification] =
    useState<boolean>(false);

  // ✨ Auto-Director Mágico (1-Click God Mode)
  const handleTriggerMagicAutopilot = () => {
    if (highlights.length > 0) {
      let bestIdx = 0;
      let maxScore = -1;
      highlights.forEach((h, idx) => {
        const score = Number(h.virality || (h as HighlightClip & { score?: number }).score || 80);
        if (score > maxScore) {
          maxScore = score;
          bestIdx = idx;
        }
      });
      handleSelectHighlight(bestIdx);
    }

    setIsPunchInZoom(true);
    setIsSeamlessLoop(true);
    setBeatDropFx(true);
    setActiveSubtitleStyle("gold");
    setInjectEmojis(true);
    setShowSpotifyBadge(true);
    setShowRetentionProgressBar(true);
    setShowTourSticker(true);

    const bestClip = highlights[selectedHighlightIndex] || highlights[0];
    const autoHook =
      bestClip?.hookText ||
      "El momento exacto en que la sala entera explotó 🤯🔥";
    setHighlights((prev) =>
      prev.map((clip, idx) =>
        idx === selectedHighlightIndex ? { ...clip, hookText: autoHook } : clip,
      ),
    );

    if (!tourStickerText || tourStickerText.includes("Gira")) {
      setTourStickerText(
        "🎟️ Gira 2026 · " + (bandName || "En Concierto") + " (Entradas en Bio)",
      );
    }

    setMagicAppliedNotification(true);
    setTimeout(() => setMagicAppliedNotification(false), 4000);
  };

  // 🎟️ Sincronizar con Conciertos de la Banda
  const handleSyncFromTourCRM = async () => {
    try {
      const res = await apiFetch<ConcertsResponse>("/api/concerts");
      if (
        res?.success &&
        Array.isArray(res.concerts) &&
        res.concerts.length > 0
      ) {
        const proximo = res.concerts[0];
        setTourStickerText(
          "🎟️ " +
            (proximo.fecha || "Próx. Fecha") +
            " · " +
            (proximo.ciudad || "Directo") +
            " (" +
            (proximo.lugar || bandName) +
            ")",
        );
        setShowTourSticker(true);
      } else {
        setTourStickerText(
          "🎟️ Gira 2026 · " + bandName + " (Entradas en Link de Bio)",
        );
        setShowTourSticker(true);
      }
    } catch {
      setTourStickerText(
        "🎟️ Gira 2026 · " + bandName + " (Entradas en Link de Bio)",
      );
      setShowTourSticker(true);
    }
  };

  return { isSeamlessLoop, setIsSeamlessLoop, isPunchInZoom, setIsPunchInZoom, beatDropFx, setBeatDropFx, smartPan, setSmartPan, activeSubtitleStyle, setActiveSubtitleStyle, injectEmojis, setInjectEmojis, showSpotifyBadge, setShowSpotifyBadge, showRetentionProgressBar, setShowRetentionProgressBar, showTourSticker, setShowTourSticker, tourStickerText, setTourStickerText, handleSyncFromTourCRM, handleTriggerMagicAutopilot, magicAppliedNotification, layoutMode, setLayoutMode };
}
