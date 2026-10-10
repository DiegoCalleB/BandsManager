/**
 * Formulario para registrar o editar un checkpoint de métricas.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Instagram, Music2, Plus, Video, Youtube } from "lucide-react";
import { Input } from "../../ui";
import { useMetrics } from "./MetricsContext";

/**
 * Formulario para registrar o editar un checkpoint de métricas.
 * @returns Sección de interfaz.
 */
export function MetricFormCard() {
  const { colors, editingMetricId, handleSaveMetric, metricDate, setMetricDate, metricInsta, setMetricInsta, metricTiktok, setMetricTiktok, metricYoutube, setMetricYoutube, metricSpotify, setMetricSpotify, setShowAdvancedFields, showAdvancedFields, metricSpotifyFollowers, setMetricSpotifyFollowers, metricSpotifyPopularity, setMetricSpotifyPopularity, metricYtViews, setMetricYtViews, metricTkLikes, setMetricTkLikes, metricNotes, setMetricNotes, isSavingMetric, handleCancelEditMetric } = useMetrics();
  return (
    <>
      {/* Guardar/Editar Log Form (5 columns) */}
      <div className={`lg:col-span-5 ${colors.card} p-5 space-y-4`}>
        <div className={` pb-2 ${""}`}>
          <h3
            className={`text-xs font-bold font-display flex items-center gap-1.5 ${"text-[var(--acc)]"}`}
          >
            <Plus className="w-3.5 h-3.5" />{" "}
            {editingMetricId
              ? "Editar Checkpoint"
              : "Nuevo Checkpoint Manual"}
          </h3>
          <p className="text-micro font-sans text-[var(--ink-2)] mt-0.5">
            Guarda un registro de audiencia para persistirlo en Supabase.
          </p>
        </div>

        <form onSubmit={handleSaveMetric} className="space-y-3">
          <div className="space-y-1">
            <label className="text-micro font-sans text-[var(--ink-2)]">
              Fecha del snapshot
            </label>
            <Input size="sm" aria-label="Fecha del snapshot"
              type="date"
              required
              value={metricDate}
              onChange={(e) => setMetricDate(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-micro font-sans text-[var(--ink-2)] flex items-center gap-1">
                <Instagram className="w-3 h-3 text-[var(--ink-2)]" />{" "}
                Insta Segs.
              </label>
              <Input
                size="sm"
                type="number"
                placeholder="1385"
                value={metricInsta}
                onChange={(e) => setMetricInsta(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="text-micro font-sans text-[var(--ink-2)] flex items-center gap-1">
                <Video className="w-3 h-3 text-[var(--acc)]" /> TikTok
                Segs.
              </label>
              <Input
                size="sm"
                type="number"
                placeholder="253"
                value={metricTiktok}
                onChange={(e) => setMetricTiktok(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="text-micro font-sans text-[var(--ink-2)] flex items-center gap-1">
                <Youtube className="w-3 h-3 text-[var(--ink-2)]" />{" "}
                YouTube Subs.
              </label>
              <Input
                size="sm"
                type="number"
                placeholder="42"
                value={metricYoutube}
                onChange={(e) => setMetricYoutube(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="text-micro font-sans text-[var(--ink-2)] flex items-center gap-1">
                <Music2 className="w-3 h-3 text-[var(--ok)]" /> Spotify
                oyentes
              </label>
              <Input
                size="sm"
                type="number"
                placeholder="150"
                value={metricSpotify}
                onChange={(e) => setMetricSpotify(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Toggle advanced fields button */}
          <button
            type="button"
            onClick={() => setShowAdvancedFields(!showAdvancedFields)}
            className="text-micro font-sans text-[var(--tentative)] hover:text-[var(--tentative)]/80 underline cursor-pointer"
          >
            {showAdvancedFields
              ? "▲ Ocultar métricas avanzadas"
              : "▼ Mostrar métricas avanzadas (Views, Likes, Posts)"}
          </button>

          {showAdvancedFields && (
            <div className="p-3 rounded-[var(--r-s)] bg-[var(--sunken)] space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-micro font-sans text-[var(--ink-2)]">
                    Spotify seguidores
                  </label>
                  <Input
                    size="sm"
                    type="number"
                    placeholder="85"
                    value={metricSpotifyFollowers}
                    onChange={(e) =>
                      setMetricSpotifyFollowers(e.target.value)
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-micro font-sans text-[var(--ink-2)]">
                    Popularidad (0-100)
                  </label>
                  <Input
                    size="sm"
                    type="number"
                    placeholder="18"
                    value={metricSpotifyPopularity}
                    onChange={(e) =>
                      setMetricSpotifyPopularity(e.target.value)
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-micro font-sans text-[var(--ink-2)]">
                    YT Views Totales
                  </label>
                  <Input
                    size="sm"
                    type="number"
                    placeholder="14500"
                    value={metricYtViews}
                    onChange={(e) => setMetricYtViews(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-micro font-sans text-[var(--ink-2)]">
                    TikTok Likes
                  </label>
                  <Input
                    size="sm"
                    type="number"
                    placeholder="1200"
                    value={metricTkLikes}
                    onChange={(e) => setMetricTkLikes(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-micro font-sans text-[var(--ink-2)]">
              Notas / eventos (Opcional)
            </label>
            <Input
              size="sm"
              type="text"
              placeholder="Ej. Lanzamiento single / Concierto Apolo"
              value={metricNotes}
              onChange={(e) => setMetricNotes(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={isSavingMetric}
              className={`flex-1 py-2.5 rounded-[var(--r-pill)] font-sans text-micro font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-ui ${
                isSavingMetric
                  ? "bg-[var(--surface)]/80 text-[var(--ink-2)] cursor-not-allowed"
                  : "bg-[var(--sunken)] hover:bg-[var(--ink-3)]/60 text-[var(--ink-2)]"
              }`}
            >
              {isSavingMetric
                ? "Guardando..."
                : editingMetricId
                  ? "Actualizar Snapshot"
                  : "Añadir Snapshot"}
            </button>

            {editingMetricId && (
              <button
                type="button"
                onClick={handleCancelEditMetric}
                className={`px-2 py-1 rounded font-sans text-micro font-bold cursor-pointer transition-ui ${" text-[var(--ink-2)] bg-[var(--bg)] hover:bg-[var(--sunken)]"}`}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
