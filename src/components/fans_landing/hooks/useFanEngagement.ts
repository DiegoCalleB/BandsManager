/**
 * Registro de clics por plataforma y compartir con amigos.
 * Extraído de FansLanding.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import { Concert } from "../../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface FanEngagementParams {
  bandName: string;
  resolvedBandId: string;
  concertId: string;
  previewConcert: Concert;
  activeTab: "redes" | "form";
}

/**
 * Registro de clics por plataforma y compartir con amigos.
 * @param params Estado y callbacks del contenedor ({@link FanEngagementParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useFanEngagement({ bandName, resolvedBandId, concertId, previewConcert, activeTab }: FanEngagementParams) {
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({});

  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const handleShareWithFriend = async () => {
    const currentUrl =
      typeof window !== "undefined" ? window.location.href : "";
    const shareMessage = `¡Únete a la comunidad de ${bandName} para escuchar temas inéditos y conseguir descuentos exclusivos! 🎸 ${currentUrl}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Comunidad Oficial de ${bandName}`,
          text: `¡Únete a la comunidad de ${bandName} para escuchar temas inéditos y conseguir descuentos! 🎸`,
          url: currentUrl,
        });
        trackClick("share_native", currentUrl, "success");
        return;
      } catch {
        // Fallback to clipboard copy if cancelled or unsupported
      }
    }

    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2500);
      trackClick("share_copy", currentUrl, "success");
    } catch {
      // Sin portapapeles disponible: no hay nada más que ofrecer.
    }
  };

  const trackClick = (platform: string, url?: string, context?: string) => {
    const key = platform.toLowerCase();
    setClickCounts((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
    try {
      fetch("/api/public/track-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          band_id: resolvedBandId,
          platform: key,
          button_type: key,
          concert_id: concertId || previewConcert?.id || undefined,
          concert_date: previewConcert?.fecha || undefined,
          context: context || (activeTab === "form" ? "form" : "redes"),
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // La telemetría de clics es opcional.
    }
  };

  return { trackClick, clickCounts, handleShareWithFriend, copiedShareLink };
}
