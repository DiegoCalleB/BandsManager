/**
 * Modal de conexión de Instagram con token de la Meta Graph API.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { AlertCircle, Check, ExternalLink, Instagram, Key, RefreshCw, ShieldCheck, Sparkles, Unlink, X } from "lucide-react";
import { Button, IconButton, Input } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { useMetrics } from "./MetricsContext";

/**
 * Modal de conexión de Instagram con token de la Meta Graph API.
 * @returns Sección de interfaz.
 */
export function InstagramConnectionModal() {
  const { showIgModal, setShowIgModal, igStatus, latestMetric, handleDisconnectIg, isConnectingIg, igModalMsg, igTokenInput, setIgTokenInput, handleConnectIgToken } = useMetrics();
  return (
    <>
      {showIgModal && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/75 animate-in fade-in duration-200">
        <div
          className={`w-full max-w-xl rounded-[var(--r-l)] overflow-hidden ${"bg-[var(--surface)] text-[var(--ink)]"}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="p-5 flex items-center justify-between bg-[var(--acc)]/30 ">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--acc)]  flex items-center justify-center text-[var(--on-acc)]">
                <Instagram className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-display flex items-center gap-2">
                  Instagram Platform Insights API
                  <span className="text-micro px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--sunken)] text-[var(--ink-2)] font-sans font-normal">
                    Meta Official
                  </span>
                </h3>
                <p className="text-xs text-[var(--ink-2)] font-sans">
                  Alcance real, impresiones, reproducciones de Reels y
                  métricas de creadores
                </p>
              </div>
            </div>
            <IconButton
              label="Cerrar"
              onClick={() => setShowIgModal(false)}
            >
              <X className="w-4 h-4" />
            </IconButton>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto font-sans">
            {/* Official Documentation Reference */}
            <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--sunken)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-[var(--ink-2)]">
                <ExternalLink className="w-4 h-4 text-[var(--ink-2)] shrink-0" />
                <span>
                  Documentación Oficial Meta:{" "}
                  <strong className="text-[var(--ink)]">
                    Instagram Platform Insights API
                  </strong>
                </span>
              </div>
              <a
                href="https://developers.facebook.com/documentation/instagram-platform/insights"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--ink)] text-micro font-sans font-bold flex items-center gap-1 transition-ui"
              >
                Abrir Docs <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            {/* Connection Status Card */}
            <div
              className={`p-4 rounded-[var(--r-m)] ${
                igStatus?.connected
                  ? "bg-[var(--ok)]/10 text-[var(--ok)]"
                  : "bg-[var(--accent-alt)]/10 text-[var(--accent-alt)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-[var(--r-s)] flex items-center justify-center ${
                      igStatus?.connected
                        ? "bg-[var(--ok)]/20 text-[var(--ink)]"
                        : "bg-[var(--surface)]/70 text-[var(--ink-2)]"
                    }`}
                  >
                    {igStatus?.connected ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold font-sans flex items-center gap-2">
                      {igStatus?.connected
                        ? "Instagram Insights Conectado"
                        : "Modo Scraping Autónomo Activo"}
                      {igStatus?.connected && (
                        <span className="w-2 h-2 rounded-[var(--r-pill)] bg-[var(--ok)]" />
                      )}
                    </div>
                    <div className="text-xs text-[var(--ink-2)] font-sans mt-0.5">
                      {igStatus?.connected
                        ? `@${igStatus.account?.username} • ${(igStatus.account?.followers_count || latestMetric?.instagram || 1573).toLocaleString()} seguidores • ${igStatus.account?.media_count || 67} publicaciones`
                        : "Sin token de Instagram Insights API. El radar opera en modo scraping multi-bot."}
                    </div>
                  </div>
                </div>

                {igStatus?.connected && (
                  <button
                    onClick={handleDisconnectIg}
                    disabled={isConnectingIg}
                    className="px-2.5 py-1.5 rounded-[var(--r-pill)] bg-[var(--alert)]/10 hover:bg-[var(--alert)]/20 text-[var(--alert)] text-micro font-sans font-bold flex items-center gap-1 transition-ui cursor-pointer"
                  >
                    <Unlink className="w-3 h-3" /> Desconectar
                  </button>
                )}
              </div>

              {/* If connected with Insights, show mini-dashboard */}
              {igStatus?.connected && igStatus.insights && (
                <div className="mt-4 pt-3/20 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-[var(--r-s)] bg-[var(--sunken)]">
                    <div className="text-micro font-sans text-[var(--ink-2)]">
                      Alcance (Reach)
                    </div>
                    <div className="text-sm font-bold font-display text-[var(--ink)] mt-0.5">
                      {(
                        igStatus.insights?.reach || 0
                      ).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-2 rounded-[var(--r-s)] bg-[var(--sunken)]">
                    <div className="text-micro font-sans text-[var(--ink-2)]">
                      Impresiones
                    </div>
                    <div className="text-sm font-bold font-display text-[var(--ink)] mt-0.5">
                      {(
                        igStatus.insights?.impressions || 0
                      ).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-2 rounded-[var(--r-s)] bg-[var(--sunken)]">
                    <div className="text-micro font-sans text-[var(--ink-2)]">
                      Visitas perfil
                    </div>
                    <div className="text-sm font-bold font-display text-[var(--ink)] mt-0.5">
                      {(
                        igStatus.insights?.profile_views || 0
                      ).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-2 rounded-[var(--r-s)] bg-[var(--sunken)]">
                    <div className="text-micro font-sans text-[var(--ink-2)]">
                      Interacciones
                    </div>
                    <div className="text-sm font-bold font-display text-[var(--ink)] mt-0.5">
                      {(
                        igStatus.insights?.total_interactions || 0
                      ).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Feedback messages */}
            {igModalMsg && (
              <div
                className={`p-3.5 rounded-[var(--r-m)] text-xs font-sans flex items-center gap-2.5 ${
                  igModalMsg.type === "success"
                    ? "bg-[var(--ok)]/10 text-[var(--ok)]"
                    : "bg-[var(--alert)]/10 text-[var(--alert)]"
                }`}
              >
                {igModalMsg.type === "success" ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{igModalMsg.text}</span>
              </div>
            )}

            {/* Token Input & Authorization */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-sans font-bold text-[var(--ink-2)]">
                  Vincular token de Instagram insights API
                </label>
                <span className="text-micro text-[var(--alert)] font-sans">
                  Permisos: instagram_manage_insights
                </span>
              </div>

              <div className="relative">
                <Input
                  size="sm"
                  type="password"
                  placeholder="Pega aquí tu User Access Token con permiso instagram_manage_insights (EAA…)"
                  value={igTokenInput}
                  onChange={(e) => setIgTokenInput(e.target.value)}
                  className="w-full"
                />
                <div className="absolute right-3 top-3 text-[var(--ink-2)]">
                  <Key className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <a
                  href="https://developers.facebook.com/tools/explorer/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[var(--alert)] hover:text-[var(--alert)]/80 flex items-center gap-1 font-sans hover:underline"
                >
                  <ExternalLink className="w-3 h-3" /> Meta Graph API Explorer
                </a>

                <button
                  onClick={handleConnectIgToken}
                  disabled={isConnectingIg || !igTokenInput.trim()}
                  className={`px-4 py-2.5 rounded-[var(--r-pill)] font-sans text-xs font-bold flex items-center gap-2 transition-ui cursor-pointer ${
                    isConnectingIg || !igTokenInput.trim()
                      ? "bg-[var(--surface)]/80 text-[var(--ink-2)] cursor-not-allowed"
                      : "bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)]"
                  }`}
                >
                  {isConnectingIg ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verificando insights API…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Conectar Instagram insights</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Step by step guide according to Meta Insights Documentation */}
            <div
              className={`p-4 rounded-[var(--r-m)] space-y-2 text-xs ${"bg-[var(--sunken)] text-[var(--ink-2)]"}`}
            >
              <div className="font-bold font-sans text-xs text-[var(--ink-2)] flex items-center gap-1.5">
                <span><ShowIcon inline emoji="📘" /></span> Pasos según la documentación oficial de Meta
                Insights:
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-xs leading-relaxed">
                <li>
                  Tu cuenta de Instagram debe ser de tipo{" "}
                  <strong className="text-[var(--ink)]">
                    Creador o Empresa
                  </strong>{" "}
                  vinculada a una Página de Facebook.
                </li>
                <li>
                  Entra en el{" "}
                  <a
                    href="https://developers.facebook.com/tools/explorer/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--alert)] underline"
                  >
                    Meta Graph API Explorer
                  </a>
                  .
                </li>
                <li>
                  En <em>Permisos (Permissions)</em>, activa exactamente estos
                  4 scopes oficiales:
                  <div className="mt-1 flex flex-wrap gap-1">
                    <code className="px-1.5 py-0.5 rounded bg-[var(--alert)]/15 text-[var(--ink)] font-sans text-micro">
                      instagram_manage_insights
                    </code>
                    <code className="px-1.5 py-0.5 rounded bg-[var(--alert)]/15 text-[var(--ink)] font-sans text-micro">
                      instagram_basic
                    </code>
                    <code className="px-1.5 py-0.5 rounded bg-[var(--alert)]/15 text-[var(--ink)] font-sans text-micro">
                      pages_show_list
                    </code>
                    <code className="px-1.5 py-0.5 rounded bg-[var(--alert)]/15 text-[var(--ink)] font-sans text-micro">
                      pages_read_engagement
                    </code>
                  </div>
                </li>
                <li>
                  Haz clic en <strong>Generate access token</strong> y pega el
                  token arriba para sincronizar alcances, impresiones y
                  reproducciones de Reels.
                </li>
              </ol>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 flex justify-between items-center bg-[var(--surface)]/50">
            <a
              href="https://developers.facebook.com/documentation/instagram-platform/insights"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[var(--ink-2)] hover:text-[var(--ink)] flex items-center gap-1 font-sans"
            >
              <ExternalLink className="w-3 h-3" />{" "}
              developers.facebook.com/documentation/instagram-platform/insights
            </a>
            <Button
              variant="neutral"
              size="sm"
              onClick={() => setShowIgModal(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </div>
      )}
    </>
  );
}
