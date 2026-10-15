/**
 * Gráfico de áreas de evolución por canal con resumen del periodo.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { BarChart3, Calendar, Instagram, Music2, RefreshCw, SlidersHorizontal, TrendingUp, Video, Youtube } from "lucide-react";
import { CANAL_COLOR } from "../../../utils/canalColor";
import { Button } from "../../ui";
import { ChannelChip } from "../../ui/ChannelChip";
import { CurveSeries } from "../../ui/CurveSeries";
import { useMetrics } from "./MetricsContext";

/**
 * Gráfico de áreas de evolución por canal con resumen del periodo.
 * @returns Sección de interfaz.
 */
export function MetricsChartSection() {
  const { metrics, yAxisDomain, PERIOD_OPTIONS, selectedPeriod, setSelectedPeriod, selectAllChannels, periodSummaryStats, currentPeriodOption, hasInstagram, hasTikTok, hasYouTube, hasSpotify, latestMetric, selectedChannels, toggleChannel, selectOnlyChannel, curveSeries } = useMetrics();
  return (
    <>
      {metrics.length > 0 && (
        <div
          className={`p-4 sm:p-5 rounded-[var(--r-m)] transition-ui ${"bg-[var(--bg)]/70"}`}
        >
          {/* Header with Title & Scale Badge */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <BarChart3 className="w-4 h-4 text-[var(--tentative)]" />
                <span className="text-xs font-sans font-bold text-[var(--ink-2)]">
                  Curva de crecimiento multiplataforma
                </span>
                <span className="text-micro font-sans px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--tentative)]/10 text-[var(--tentative)]">
                  Escala Adaptativa: 0 -{" "}
                  {yAxisDomain[1] >= 1000
                    ? `${(yAxisDomain[1] / 1000).toFixed(1)}k`
                    : yAxisDomain[1]}
                </span>
              </div>
              <p className="text-micro font-sans text-[var(--ink-2)] mt-0.5">
                Haz clic en cualquier red para activarla/ocultarla. El
                gráfico reajusta automáticamente la altura y escala Y a los
                canales visibles.
              </p>
            </div>

            {/* Quick Actions: Period Selector & Show All */}
            <div className="flex items-center gap-2 flex-wrap self-end lg:self-auto">
              {/* Period Selector Tabs */}
              <div className="flex items-center gap-1">
                <span className="text-micro font-sans text-[var(--ink-2)] flex items-center gap-1 mr-0.5">
                  <Calendar className="w-3 h-3 text-[var(--tentative)]" />{" "}
                  Periodo:
                </span>
                <div
                  className={`flex items-center gap-0.5 p-0.5 rounded-[var(--r-s)] ${"bg-[var(--sunken)]/70"}`}
                >
                  {PERIOD_OPTIONS.map((opt) => {
                    const isSelected = selectedPeriod === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedPeriod(opt.id)}
                        className={`px-2 py-0.5 rounded text-micro font-sans font-bold transition-ui cursor-pointer ${
                          isSelected
                            ? "bg-[var(--tentative)] text-[var(--on-tentative)]"
                            : "text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]/60"
                        }`}
                        title={opt.label}
                      >
                        {opt.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                variant="neutral"
                size="xs"
                onClick={selectAllChannels}
                className="items-center gap-1"
                title="Mostrar todos los canales disponibles"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Mostrar todos</span>
              </Button>
            </div>
          </div>

          {/* Balance del periodo: una cifra por canal, con el color de su curva */}
          {periodSummaryStats && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-[var(--r-s)] bg-[var(--sunken)] px-3 py-2 text-micro text-[var(--ink-2)]">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex items-center gap-1.5 font-medium text-[var(--ink)]">
                  <TrendingUp aria-hidden className="size-3.5" />
                  Balance {currentPeriodOption.label}
                </span>
                {([
                  { on: hasInstagram, label: "Instagram", canal: "instagram", diff: periodSummaryStats.diffIg },
                  { on: hasTikTok, label: "TikTok", canal: "tiktok", diff: periodSummaryStats.diffTk },
                  { on: hasYouTube, label: "YouTube", canal: "youtube", diff: periodSummaryStats.diffYt },
                  { on: hasSpotify, label: "Spotify", canal: "spotify", diff: periodSummaryStats.diffSp },
                ] as const)
                  .filter((c) => c.on)
                  .map((c) => (
                    <span key={c.canal} className="flex items-center gap-1.5">
                      <span aria-hidden className="size-2 rounded-full" style={{ background: CANAL_COLOR[c.canal] }} />
                      {c.label}
                      <b className="font-semibold tabular-nums text-[var(--ink)]">
                        {c.diff.toLocaleString("es-ES", { signDisplay: "exceptZero" })}
                      </b>
                    </span>
                  ))}
              </div>
              <div className="tabular-nums">
                {periodSummaryStats.startDate} → {periodSummaryStats.endDate}
              </div>
            </div>
          )}

          {/* Interactive Channel Filter Chips */}
          <div className="flex flex-wrap gap-2 mb-4 pb-3 ">
            {hasInstagram && (
              <ChannelChip
                canal="instagram"
                label="Instagram"
                icon={Instagram}
                value={latestMetric?.instagram_followers || latestMetric?.instagram || 0}
                active={selectedChannels.instagram}
                onToggle={() => toggleChannel("instagram")}
                onSolo={() => selectOnlyChannel("instagram")}
              />
            )}
            {hasTikTok && (
              <ChannelChip
                canal="tiktok"
                label="TikTok"
                icon={Video}
                value={latestMetric?.tiktok_followers || latestMetric?.tiktok || 0}
                active={selectedChannels.tiktok}
                onToggle={() => toggleChannel("tiktok")}
                onSolo={() => selectOnlyChannel("tiktok")}
              />
            )}
            {hasYouTube && (
              <ChannelChip
                canal="youtube"
                label="YouTube"
                icon={Youtube}
                value={latestMetric?.youtube_subscribers || latestMetric?.youtube || 0}
                active={selectedChannels.youtube}
                onToggle={() => toggleChannel("youtube")}
                onSolo={() => selectOnlyChannel("youtube")}
              />
            )}
            {hasSpotify && (
              <ChannelChip
                canal="spotify"
                label="Spotify"
                icon={Music2}
                value={latestMetric?.spotify_monthly_listeners || latestMetric?.spotify || 0}
                active={selectedChannels.spotify}
                onToggle={() => toggleChannel("spotify")}
                onSolo={() => selectOnlyChannel("spotify")}
              />
            )}
          </div>

          {/* Chart Canvas or Empty State */}
          <div className="h-64 w-full relative">
            {!selectedChannels.instagram &&
            !selectedChannels.tiktok &&
            !selectedChannels.youtube &&
            (!hasSpotify || !selectedChannels.spotify) ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 rounded-[var(--r-m)] bg-[var(--surface)]/20">
                <SlidersHorizontal className="w-8 h-8 text-[var(--ink-2)] mb-2" />
                <p className="text-xs font-sans font-medium text-[var(--ink-2)]">
                  Todos los canales están ocultos
                </p>
                <p className="text-micro font-sans text-[var(--ink-2)] mt-1 max-w-xs">
                  Haz clic en las etiquetas de Instagram, TikTok o YouTube
                  para activar su curva y ver la escala ajustada.
                </p>
                <button
                  onClick={selectAllChannels}
                  className="mt-3 px-3 py-1.5 rounded-[var(--r-pill)] bg-[var(--tentative)] hover:bg-[var(--tentative)] text-[var(--on-tentative)] font-sans text-micro font-medium transition-ui"
                >
                  Activar todos los canales
                </button>
              </div>
            ) : (
              <div className="h-full w-full flex items-end">
                <CurveSeries className="w-full" height={230} series={curveSeries} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
