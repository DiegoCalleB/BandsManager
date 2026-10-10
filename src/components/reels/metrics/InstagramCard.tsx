/**
 * Tarjeta de analítica de Instagram.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Camera, Instagram, Key } from "lucide-react";
import { useMetrics } from "./MetricsContext";

/**
 * Tarjeta de analítica de Instagram.
 * @returns Sección de interfaz.
 */
export function InstagramCard() {
  const { hasInstagram, setScanError, setScanSuccess, setScanResult, setShowScanModal, setIgModalMsg, setShowIgModal, igStatus, latestMetric } = useMetrics();
  return (
    <>
      {/* Instagram Card */}
      {hasInstagram && (
        <div
          className={`p-4 rounded-[var(--r-m)] flex flex-col justify-between space-y-3 ${"bg-[var(--surface)]/40"}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-micro font-sans text-[var(--ink)] font-bold flex items-center gap-1.5">
              <Instagram className="w-3.5 h-3.5 text-[var(--ink-2)]" /> Instagram
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
                title="Escanear captura de pantalla de Instagram con Visión IA"
              >
                <Camera className="w-2.5 h-2.5" />
                <span>Escanear</span>
              </button>
              <button
                onClick={() => {
                  setIgModalMsg(null);
                  setShowIgModal(true);
                }}
                className={`text-micro font-sans px-2 py-0.5 rounded flex items-center gap-1 transition-ui cursor-pointer ${
                  igStatus?.connected
                    ? "bg-[var(--ok)]/10 text-[var(--ok)] hover:bg-[var(--ok)]/20"
                    : "bg-[var(--surface)] text-[var(--ink-2)] hover:bg-[var(--sunken)]"
                }`}
                title="Verificar o conectar token oficial de Meta Graph API"
              >
                <Key className="w-2.5 h-2.5" />
                {igStatus?.connected
                  ? "Meta API Oficial"
                  : "OAuth / Token"}
              </button>
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-display tracking-tight text-[var(--ink)]">
              {(
                latestMetric?.instagram_followers ||
                latestMetric?.instagram ||
                0
              ).toLocaleString()}
            </div>
            <div className="text-micro font-sans text-[var(--ink-2)] mt-0.5 flex items-center justify-between">
              <span>Seguidores oficiales</span>
              {latestMetric?.instagram_posts_count ? (
                <span>{latestMetric.instagram_posts_count} posts</span>
              ) : null}
            </div>
          </div>
          <div className="pt-2/10 flex justify-between text-micro font-sans text-[var(--ink-2)]">
            <span>
              Siguiendo:{" "}
              <b className="text-[var(--ink)]">
                {(
                  latestMetric?.instagram_following || 0
                ).toLocaleString()}
              </b>
            </span>
            <span>
              Engagement:{" "}
              <b className="text-[var(--alert)]">
                {latestMetric?.instagram_engagement_rate
                  ? `${latestMetric.instagram_engagement_rate}%`
                  : "Activo"}
              </b>
            </span>
          </div>
        </div>
      )}
    </>
  );
}
