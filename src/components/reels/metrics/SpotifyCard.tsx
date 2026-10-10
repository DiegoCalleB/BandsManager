/**
 * Tarjeta de analítica de Spotify.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Music2 } from "lucide-react";
import { useMetrics } from "./MetricsContext";

/**
 * Tarjeta de analítica de Spotify.
 * @returns Sección de interfaz.
 */
export function SpotifyCard() {
  const { hasSpotify, latestMetric } = useMetrics();
  return (
    <>
      {/* Spotify Card */}
      {hasSpotify && (
        <div
          className={`p-4 rounded-[var(--r-m)] flex flex-col justify-between space-y-3 ${"bg-[var(--surface)]/40"}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-micro font-sans text-[var(--ok)] font-bold flex items-center gap-1.5">
              <Music2 className="w-3.5 h-3.5" /> Spotify
            </span>
            <span className="text-micro font-sans px-2 py-0.5 rounded bg-[var(--ok)]/10 text-[var(--ok)]">
              Popularidad: {latestMetric?.spotify_popularity || "--"}/100
            </span>
          </div>
          <div>
            <div className="text-2xl font-black font-display tracking-tight text-[var(--ok)]">
              {(
                latestMetric?.spotify_monthly_listeners ||
                latestMetric?.spotify ||
                0
              ).toLocaleString()}
            </div>
            <div className="text-micro font-sans text-[var(--ink-2)] mt-0.5">
              Oyentes Mensuales
            </div>
          </div>
          <div className="pt-2/10 flex justify-between text-micro font-sans text-[var(--ink-2)]">
            <span>
              Seguidores:{" "}
              <b className="text-[var(--ink)]">
                {(latestMetric?.spotify_followers || 0).toLocaleString()}
              </b>
            </span>
            <span>
              Ratio oyente/seg:{" "}
              <b className="text-[var(--ok)]">
                {latestMetric?.spotify_followers &&
                latestMetric.spotify_followers > 0
                  ? `${((latestMetric.spotify_monthly_listeners || latestMetric.spotify || 0) / latestMetric.spotify_followers).toFixed(1)}x`
                  : "--"}
              </b>
            </span>
          </div>
        </div>
      )}
    </>
  );
}
