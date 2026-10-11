/**
 * Tabla histórica de métricas con edición y borrado.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Edit, Table, Trash2 } from "lucide-react";
import { IconButton } from "../../ui";
import { PublicoSilhouette } from "../../ui/PublicoSilhouette";
import { useMetrics } from "./MetricsContext";

/**
 * Tabla histórica de métricas con edición y borrado.
 * @returns Sección de interfaz.
 */
export function MetricsHistoryTable() {
  const { colors, metrics, hasInstagram, hasTikTok, hasYouTube, hasSpotify, activeCount, editingMetricId, handleEditMetricClick, onDeleteMetric } = useMetrics();
  return (
    <>
      {/* Historial Tabla (7 columns) */}
      <div
        className={`lg:col-span-7 ${colors.card} p-5 space-y-4 flex flex-col min-w-0`}
      >
        <div className={` pb-2 ${""}`}>
          <h3
            className={`text-xs font-bold font-display flex items-center gap-1.5 ${"text-[var(--acc)]"}`}
          >
            <Table className="w-3.5 h-3.5" /> Registros Históricos en
            Supabase ({metrics.length})
          </h3>
          <p className="text-micro font-sans text-[var(--ink-2)] mt-0.5">
            Snapshots persistentes y deltas calculados de evolución
            diaria.
          </p>
        </div>

        <div className="overflow-x-auto shrink-0 flex-1 min-h-[300px]">
          <table className="w-full text-left text-micro font-sans">
            <thead>
              <tr
                className={` text-[var(--ink-2)] text-micro ${""}`}
              >
                <th className="py-2.5 font-medium">Fecha</th>
                {hasInstagram && (
                  <th className="py-2.5 font-medium text-right">
                    Instagram
                  </th>
                )}
                {hasTikTok && (
                  <th className="py-2.5 font-medium text-right">
                    TikTok
                  </th>
                )}
                {hasYouTube && (
                  <th className="py-2.5 font-medium text-right">
                    YouTube
                  </th>
                )}
                {hasSpotify && (
                  <th className="py-2.5 font-medium text-right">
                    Spotify
                  </th>
                )}
                <th className="py-2.5 font-medium pl-3">Notas</th>
                <th className="py-2.5 font-medium text-center">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hair)]/10">
              {metrics.length === 0 ? (
                <tr>
                  <td colSpan={3 + activeCount} className="py-12 px-4">
                    <div className="flex flex-col items-center justify-center">
                      <PublicoSilhouette opacity={0.12} size="medium" />
                      <p className="mt-6 font-medium text-[var(--ink)] text-sm">
                        Sin registros históricos
                      </p>
                      <p className="mt-2 text-[var(--ink-2)] text-xs max-w-xs text-center">
                        Añade un checkpoint o ejecuta el radar para
                        comenzar a rastrear métricas.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                [...metrics]
                  .sort((a, b) => b.fecha.localeCompare(a.fecha))
                  .map((m, index, arr) => {
                    const prevLog =
                      index + 1 < arr.length ? arr[index + 1] : null;

                    const instaDelta = prevLog
                      ? (m.instagram_followers || m.instagram) -
                        (prevLog.instagram_followers || prevLog.instagram)
                      : 0;
                    const tiktokDelta = prevLog
                      ? (m.tiktok_followers || m.tiktok) -
                        (prevLog.tiktok_followers || prevLog.tiktok)
                      : 0;
                    const youtubeDelta = prevLog
                      ? (m.youtube_subscribers || m.youtube) -
                        (prevLog.youtube_subscribers || prevLog.youtube)
                      : 0;
                    const spotifyDelta = prevLog
                      ? (m.spotify_monthly_listeners || m.spotify || 0) -
                        (prevLog.spotify_monthly_listeners ||
                          prevLog.spotify ||
                          0)
                      : 0;

                    const formatDelta = (delta: number) => {
                      if (delta > 0)
                        return (
                          <span className="text-[var(--ok)] font-bold">
                            +{delta}
                          </span>
                        );
                      if (delta < 0)
                        return (
                          <span className="text-[var(--alert)] font-bold">
                            {delta}
                          </span>
                        );
                      return (
                        <span className="text-[var(--ink-2)]">0</span>
                      );
                    };

                    const parts = m.fecha.split("-");
                    const formattedDate =
                      parts.length === 3
                        ? `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`
                        : m.fecha;

                    return (
                      <tr
                        key={`${m.id || "metric"}-${index}`}
                        className={`hover:bg-[var(--ink)]/5 transition-colors ${
                          editingMetricId === m.id
                            ? "bg-[var(--acc)]/5"
                            : ""
                        }`}
                      >
                        <td className="py-3 font-bold whitespace-nowrap">
                          {formattedDate}
                        </td>
                        {hasInstagram && (
                          <td className="py-3 text-right">
                            <div className="font-bold">
                              {(
                                m.instagram_followers ||
                                m.instagram ||
                                0
                              ).toLocaleString()}
                            </div>
                            <div className="text-micro text-[var(--ink-2)]">
                              {formatDelta(instaDelta)}
                            </div>
                          </td>
                        )}
                        {hasTikTok && (
                          <td className="py-3 text-right">
                            <div className="font-bold">
                              {(
                                m.tiktok_followers ||
                                m.tiktok ||
                                0
                              ).toLocaleString()}
                            </div>
                            <div className="text-micro text-[var(--ink-2)]">
                              {formatDelta(tiktokDelta)}
                            </div>
                          </td>
                        )}
                        {hasYouTube && (
                          <td className="py-3 text-right">
                            <div className="font-bold">
                              {(
                                m.youtube_subscribers ||
                                m.youtube ||
                                0
                              ).toLocaleString()}
                            </div>
                            <div className="text-micro text-[var(--ink-2)]">
                              {formatDelta(youtubeDelta)}
                            </div>
                          </td>
                        )}
                        {hasSpotify && (
                          <td className="py-3 text-right">
                            <div className="font-bold">
                              {(
                                m.spotify_monthly_listeners ||
                                m.spotify ||
                                0
                              ).toLocaleString()}
                            </div>
                            <div className="text-micro text-[var(--ink-2)]">
                              {formatDelta(spotifyDelta)}
                            </div>
                          </td>
                        )}
                        <td
                          className="py-3 pl-3 text-[var(--ink-2)] font-sans max-w-[120px] truncate"
                          title={m.notas}
                        >
                          {m.notas || (
                            <span className="text-[var(--ink-2)] font-sans text-micro">
                              -
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex justify-center items-center gap-1.5">
                            <IconButton
                              label="Editar snapshot"
                              size="icon-xs"
                              type="button"
                              onClick={() => handleEditMetricClick(m)}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </IconButton>
                            {onDeleteMetric && (
                              <IconButton
                                label="Eliminar snapshot"
                                variant="danger"
                                size="icon-xs"
                                type="button"
                                onClick={async () => {
                                  if (
                                    confirm(
                                      "¿Seguro que deseas eliminar este snapshot de Supabase?",
                                    )
                                  ) {
                                    await onDeleteMetric(m.id);
                                  }
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </IconButton>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
