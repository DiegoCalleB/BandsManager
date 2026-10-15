/**
 * Tarjeta de analítica de YouTube.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Youtube } from "lucide-react";
import { useMetrics } from "./MetricsContext";

/**
 * Tarjeta de analítica de YouTube.
 * @returns Sección de interfaz.
 */
export function YouTubeCard() {
  const { hasYouTube, latestMetric, contentItems } = useMetrics();
  return (
    <>
      {/* YouTube Card */}
      {hasYouTube && (
        <div
          className={`p-4 rounded-[var(--r-m)] flex flex-col justify-between space-y-3 ${"bg-[var(--surface)]/40"}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-micro font-sans text-[var(--ink)] font-bold flex items-center gap-1.5">
              <Youtube className="w-3.5 h-3.5 text-[var(--ink-2)]" /> YouTube
            </span>
            <span className="text-micro font-sans px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--ink-2)]">
              {latestMetric?.youtube_video_count ||
                contentItems.length ||
                0}{" "}
              vídeos
            </span>
          </div>
          <div>
            <div className="text-2xl font-black font-display tracking-tight text-[var(--ink)]">
              {(
                latestMetric?.youtube_subscribers ||
                latestMetric?.youtube ||
                0
              ).toLocaleString()}
            </div>
            <div className="text-micro font-sans text-[var(--ink-2)] mt-0.5">
              Suscriptores oficiales
            </div>
          </div>
          <div className="pt-2/10 flex justify-between text-micro font-sans text-[var(--ink-2)]">
            <span>
              Views acumuladas:{" "}
              <b className="text-[var(--ink)]">
                {(
                  latestMetric?.youtube_total_views ||
                  contentItems.reduce((sum, v) => sum + (v.views || 0), 0)
                ).toLocaleString()}
              </b>
            </span>
          </div>
        </div>
      )}
    </>
  );
}
