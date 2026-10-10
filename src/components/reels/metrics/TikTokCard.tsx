/**
 * Tarjeta de analítica de TikTok.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Camera, Video } from "lucide-react";
import { useMetrics } from "./MetricsContext";

/**
 * Tarjeta de analítica de TikTok.
 * @returns Sección de interfaz.
 */
export function TikTokCard() {
  const { hasTikTok, setScanError, setScanSuccess, setScanResult, setShowScanModal, latestMetric } = useMetrics();
  return (
    <>
      {/* TikTok Card */}
      {hasTikTok && (
        <div
          className={`p-4 rounded-[var(--r-m)] flex flex-col justify-between space-y-3 ${"bg-[var(--surface)]/40"}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-micro font-sans text-[var(--acc)] font-bold flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5" /> TikTok
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setScanError(null);
                  setScanSuccess(null);
                  setScanResult(null);
                  setShowScanModal(true);
                }}
                className="text-micro font-sans px-2 py-0.5 rounded flex items-center gap-1 transition-ui cursor-pointer bg-[var(--tentative)]/10 text-[var(--tentative)] hover:bg-[var(--tentative)]/20"
                title="Escanear captura de pantalla de TikTok con Visión IA"
              >
                <Camera className="w-2.5 h-2.5" />
                <span>Escanear</span>
              </button>
              <span className="text-micro font-sans px-2 py-0.5 rounded bg-[var(--acc)]/10 text-[var(--ink)]">
                {latestMetric?.tiktok_video_count
                  ? `${latestMetric.tiktok_video_count} vídeos`
                  : "Reels / TikTok"}
              </span>
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-display tracking-tight text-[var(--acc)]">
              {(
                latestMetric?.tiktok_followers ||
                latestMetric?.tiktok ||
                0
              ).toLocaleString()}
            </div>
            <div className="text-micro font-sans text-[var(--ink-2)] mt-0.5">
              Seguidores
            </div>
          </div>
          <div className="pt-2/10 flex justify-between text-micro font-sans text-[var(--ink-2)]">
            <span>
              Total Likes:{" "}
              <b className="text-[var(--ink)]">
                {(latestMetric?.tiktok_total_likes || 0).toLocaleString()}
              </b>
            </span>
            <span>
              Alcance: <b className="text-[var(--acc)]">Orgánico</b>
            </span>
          </div>
        </div>
      )}
    </>
  );
}
