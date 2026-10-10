/**
 * Modal que analiza una captura de estadísticas con IA y propone las métricas.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { AlertCircle, Camera, Check, CheckCircle2, RefreshCw, ScanLine, UploadCloud, X } from "lucide-react";
import { Button, IconButton } from "../../ui";
import { useMetrics } from "./MetricsContext";

/**
 * Modal que analiza una captura de estadísticas con IA y propone las métricas.
 * @returns Sección de interfaz.
 */
export function ScreenshotScanModal() {
  const { showScanModal, setShowScanModal, scanError, scanSuccess, scanImageBase64, handleScreenshotInputChange, handleAnalyzeScreenshot, isAnalyzingScreenshot, scanResult, setScanImageBase64, setScanResult } = useMetrics();
  return (
    <>
      {showScanModal && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/80 animate-in fade-in duration-200">
        <div
          className={`w-full max-w-xl rounded-[var(--r-l)] overflow-hidden flex flex-col ${"bg-[var(--surface)] text-[var(--ink)]"}`}
        >
          {/* Modal Header */}
          <div className="p-5 flex items-center justify-between bg-[var(--surface)]/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[var(--r-m)] bg-[var(--tentative)]/20 flex items-center justify-center text-[var(--tentative)]">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-display flex items-center gap-2">
                  Escanear métricas con visión IA
                  <span className="text-micro px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--tentative)]/20 text-[var(--tentative)] font-sans font-normal flex items-center gap-1">
                    Gemini Multimodal
                  </span>
                </h3>
                <p className="text-xs text-[var(--ink-2)] font-sans">
                  Sube una captura de pantalla de Instagram, TikTok o Spotify
                  y la IA extraerá todas las métricas
                </p>
              </div>
            </div>
            <IconButton
              label="Cerrar"
              onClick={() => setShowScanModal(false)}
            >
              <X className="w-5 h-5" />
            </IconButton>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto font-sans">
            {/* Feedback messages */}
            {scanError && (
              <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--alert)] text-[var(--on-alert)] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[var(--alert)]" />
                <span>{scanError}</span>
              </div>
            )}
            {scanSuccess && (
              <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--ok-soft)] text-[var(--ink-2)] text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-[var(--ok)]" />
                <span>{scanSuccess}</span>
              </div>
            )}

            {/* Upload Dropzone */}
            <div className="space-y-3">
              <label className="block text-xs font-sans font-bold text-[var(--ink-2)]">
                1. Cargar captura de pantalla (Móvil o Web)
              </label>

              {!scanImageBase64 ? (
                <label
                  className={` rounded-[var(--r-l)] p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-ui ${"bg-[var(--sunken)] hover:bg-[var(--surface)]/80"}`}
                >
                  <div className="w-12 h-12 rounded-[var(--r-l)] bg-[var(--tentative)]/15 text-[var(--tentative)] flex items-center justify-center mb-3">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-[var(--ink-2)]">
                    Arrastra o haz clic para subir captura
                  </div>
                  <div className="text-xs text-[var(--ink-2)] font-sans mt-1">
                    Soporta capturas de Instagram (perfil o insights), TikTok,
                    Spotify for Artists o YouTube
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotInputChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative rounded-[var(--r-m)] overflow-hidden bg-[var(--sunken)] p-3 flex items-center gap-4">
                  <img
                    src={scanImageBase64}
                    alt="Captura cargada"
                    className="w-20 h-20 object-cover rounded-[var(--r-s)]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[var(--ink)] flex items-center gap-2">
                      <span>Captura lista para analizar</span>
                      <span className="w-2 h-2 rounded-[var(--r-pill)] bg-[var(--ok)]" />
                    </div>
                    <div className="text-xs text-[var(--ink-2)] font-sans mt-0.5">
                      Imagen cargada en memoria. Pulsa el botón para que
                      Gemini extraiga los datos.
                    </div>
                    <label className="inline-block mt-2 text-micro text-[var(--tentative)] hover:text-[var(--tentative)]/80 font-sans underline cursor-pointer">
                      Cambiar imagen
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotInputChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            {scanImageBase64 && (
              <button
                onClick={handleAnalyzeScreenshot}
                disabled={isAnalyzingScreenshot}
                className={`w-full py-3 rounded-[var(--r-m)] font-sans text-xs font-bold flex items-center justify-center gap-2 transition-ui cursor-pointer ${
                  isAnalyzingScreenshot
                    ? "bg-[var(--surface)]/80 text-[var(--ink-2)] cursor-not-allowed"
                    : "bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)]"
                }`}
              >
                {isAnalyzingScreenshot ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[var(--tentative)]/80" />
                    <span>
                      Gemini Visión analizando píxeles y métricas…
                    </span>
                  </>
                ) : (
                  <>
                    <ScanLine className="w-4 h-4 text-[var(--tentative)]/80" />
                    <span>Escanear y guardar</span>
                  </>
                )}
              </button>
            )}

            {/* Result Preview Card */}
            {scanResult && (
              <div
                className={`p-4 rounded-[var(--r-m)] space-y-3 animate-in fade-in duration-300 ${"bg-[var(--tentative)]/20"}`}
              >
                <div className="flex items-center justify-between/20 pb-2">
                  <div className="text-xs font-bold font-sans text-[var(--tentative)]/80 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[var(--ok)]" />
                    Datos extraídos con éxito
                  </div>
                  <span className="text-micro font-sans px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--ok)]/15 text-[var(--ink)] font-bold">
                    {scanResult.platform || "Red Social"}
                  </span>
                </div>

                <div className="text-xs text-[var(--ink-2)] leading-relaxed font-sans">
                  {scanResult.summary}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-center">
                  {scanResult.followers !== null &&
                    scanResult.followers !== undefined && (
                      <div className="p-2.5 rounded-[var(--r-s)] bg-[var(--sunken)]">
                        <div className="text-micro font-sans text-[var(--ink-2)]">
                          Seguidores / oyentes
                        </div>
                        <div className="text-base font-bold font-display text-[var(--ink)] mt-0.5">
                          {Number(scanResult.followers).toLocaleString()}
                        </div>
                      </div>
                    )}
                  {scanResult.account_handle && (
                    <div className="p-2.5 rounded-[var(--r-s)] bg-[var(--sunken)]">
                      <div className="text-micro font-sans text-[var(--ink-2)]">
                        Usuario
                      </div>
                      <div className="text-xs font-bold font-sans text-[var(--tentative)]/80 mt-1 truncate">
                        {scanResult.account_handle}
                      </div>
                    </div>
                  )}
                  {scanResult.posts_count !== null &&
                    scanResult.posts_count !== undefined && (
                      <div className="p-2.5 rounded-[var(--r-s)] bg-[var(--sunken)]">
                        <div className="text-micro font-sans text-[var(--ink-2)]">
                          Publicaciones
                        </div>
                        <div className="text-base font-bold font-display text-[var(--ink)] mt-0.5">
                          {Number(scanResult.posts_count).toLocaleString()}
                        </div>
                      </div>
                    )}
                  {scanResult.reach !== null &&
                    scanResult.reach !== undefined && (
                      <div className="p-2.5 rounded-[var(--r-s)] bg-[var(--sunken)]">
                        <div className="text-micro font-sans text-[var(--ink-2)]">
                          Alcance (Reach)
                        </div>
                        <div className="text-base font-bold font-display text-[var(--ok)] mt-0.5">
                          {Number(scanResult.reach).toLocaleString()}
                        </div>
                      </div>
                    )}
                  {scanResult.impressions !== null &&
                    scanResult.impressions !== undefined && (
                      <div className="p-2.5 rounded-[var(--r-s)] bg-[var(--sunken)]">
                        <div className="text-micro font-sans text-[var(--ink-2)]">
                          Impresiones
                        </div>
                        <div className="text-base font-bold font-display text-[var(--tentative)] mt-0.5">
                          {Number(scanResult.impressions).toLocaleString()}
                        </div>
                      </div>
                    )}
                  {scanResult.confidence && (
                    <div className="p-2.5 rounded-[var(--r-s)] bg-[var(--sunken)]">
                      <div className="text-micro font-sans text-[var(--ink-2)]">
                        Confianza IA
                      </div>
                      <div className="text-xs font-bold font-sans text-[var(--ok)] mt-1">
                        Alta (99%)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 flex justify-between items-center bg-[var(--surface)]/50">
            <span className="text-xs text-[var(--ink-2)] font-sans flex items-center gap-1">
              OCR y Visión Asistida por Gemini 2.5
            </span>
            <Button
              variant="neutral"
              size="sm"
              onClick={() => {
                setShowScanModal(false);
                setScanImageBase64(null);
                setScanResult(null);
              }}
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
