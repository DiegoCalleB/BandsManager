/**
 * Barra superior del radar de plataformas: selector de periodo, canales y acciones.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Camera, CheckCircle2, Instagram, Radio, RefreshCw } from "lucide-react";
import { Button } from "../../ui";
import { useMetrics } from "./MetricsContext";

/**
 * Barra superior del radar de plataformas: selector de periodo, canales y acciones.
 * @returns Sección de interfaz.
 */
export function PlatformsRadarHeader() {
  const { setScanError, setScanSuccess, setScanResult, setShowScanModal, setIgModalMsg, setShowIgModal, igStatus, onScanRealMetrics, loadContentItems, isScanningMetrics, onSyncMetrics, isSyncingMetrics, metricSuccess } = useMetrics();
  return (
    <>
      {/* 0. Direct Platforms Radar Header Bar */}
      <div className="p-4 rounded-[var(--r-m)] flex flex-col md:flex-row items-center justify-between gap-4 bg-[var(--ok-soft)]/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--ok)]/20 flex items-center justify-center text-[var(--ink)]">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold font-display flex items-center gap-2 text-[var(--ink)]">
              Radar de redes
              <span className="text-micro px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--ok)]/15 text-[var(--ink)] font-sans font-normal flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> No gasta créditos de IA
              </span>
            </h3>
            <p className="text-micro text-[var(--ink-2)] font-sans mt-0.5">
              Lee tus perfiles públicos y trae seguidores y publicaciones cada vez que lo lanzas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          {/* AI Multimodal Screenshot Scanner Button */}
          <Button
            variant="neutral"
            onClick={() => {
              setScanError(null);
              setScanSuccess(null);
              setScanResult(null);
              setShowScanModal(true);
            }}
            className="items-center justify-center gap-2"
            title="Sube una captura de pantalla de tu Instagram, TikTok o Spotify y Gemini extraerá todas las métricas al instante"
          >
            <Camera className="w-3.5 h-3.5 text-[var(--acc)]" />
            <span>Escanear captura IA</span>
          </Button>

          {/* Instagram OAuth / Meta Graph API Button */}
          <button
            onClick={() => {
              setIgModalMsg(null);
              setShowIgModal(true);
            }}
            className={`px-3.5 py-2.5 rounded-[var(--r-pill)] font-sans text-micro font-bold cursor-pointer flex items-center justify-center gap-2 transition-ui ${
              igStatus?.connected
                ? "bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--sunken)]"
                : "bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--sunken)]"
            }`}
            title="Configurar conexión oficial con Meta Graph API / Instagram OAuth"
          >
            <Instagram className="w-3.5 h-3.5 text-[var(--ink-2)]" />
            {igStatus?.connected ? (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-[var(--r-pill)] bg-[var(--ok)]" />
                Meta API (@{igStatus.account?.username || "..."})
              </span>
            ) : (
              <span>OAuth Instagram</span>
            )}
          </button>

          {onScanRealMetrics && (
            <button
              onClick={async () => {
                await onScanRealMetrics();
                await loadContentItems();
              }}
              disabled={isScanningMetrics}
              className={`flex-1 md:flex-initial px-4 py-2.5 rounded-[var(--r-pill)] font-sans text-micro font-bold cursor-pointer flex items-center justify-center gap-2 transition-ui ${
                isScanningMetrics
                  ? "bg-[var(--surface)]/80 text-[var(--ink-2)] cursor-not-allowed"
                  : "bg-[var(--ok)] hover:brightness-95 text-[var(--on-ok)]"
              }`}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isScanningMetrics ? "animate-spin" : ""}`}
              />
              {isScanningMetrics
                ? "Ejecutando Radar..."
                : "Ejecutar Radar Ahora"}
            </button>
          )}

          {onSyncMetrics && (
            <button
              onClick={onSyncMetrics}
              disabled={isSyncingMetrics}
              className={`px-3 py-2.5 rounded-[var(--r-pill)] font-sans text-micro font-bold cursor-pointer flex items-center justify-center gap-2 transition-ui ${
                isSyncingMetrics
                  ? "bg-[var(--surface)]/80 text-[var(--ink-2)] cursor-not-allowed"
                  : "bg-[var(--surface)] text-[var(--ink-2)] hover:bg-[var(--bg)]"
              }`}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isSyncingMetrics ? "animate-spin" : ""}`}
              />
              {isSyncingMetrics ? "Sincronizando..." : "Refrescar Datos"}
            </button>
          )}
        </div>
      </div>

      {metricSuccess && (
        <div className="p-3 bg-[var(--ok)]/10 rounded-[var(--r-m)] text-[var(--ok)] font-sans text-xs flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{metricSuccess}</span>
        </div>
      )}
    </>
  );
}
