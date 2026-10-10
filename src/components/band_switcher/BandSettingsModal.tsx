/**
 * Ajustes mínimos y logo de una banda.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Camera,Guitar,Loader2,Settings,Upload,Users,X } from "lucide-react";
import { cleanBandId,isSameBandId } from "../../utils/bandUtils";
import { Button,IconButton } from "../ui";
import { useBandSwitcher } from "./BandSwitcherContext";

/**
 * Ajustes mínimos y logo de una banda.
 * @returns Sección de interfaz.
 */
export function BandSettingsModal() {
  const { selectedBandForSettings, setSelectedBandForSettings, customLogos, failedLogos, setFailedLogos, uploadingBandId, handleUploadLogo, onOpenBandManagement, currentActiveBandId, onSwitchBand, onClose } = useBandSwitcher();
  return (
    <>
{/* Band Minimal Settings & Logo Modal (Gear Icon) */}
        {selectedBandForSettings && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-[var(--scrim)]/85 animate-in fade-in duration-150 overflow-y-auto">
            <div className="w-full max-w-md rounded-[var(--r-xl)] bg-[var(--surface)] text-[var(--ink)] p-6 sm:p-7 space-y-5 my-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--hair)] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--acc)]/15 flex items-center justify-center text-[var(--ink)] shrink-0">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h3
                      className="font-bold text-base text-[var(--ink)] font-display truncate max-w-[200px] sm:max-w-xs"
                      title={selectedBandForSettings.bandName}
                    >
                      Ajustes de {selectedBandForSettings.bandName}
                    </h3>
                    <p className="text-xs text-[var(--acc-ink)]/80 font-mono">
                      Configuración básica y logotipo
                    </p>
                  </div>
                </div>
                <IconButton
                  label="Cerrar"
                  type="button"
                  onClick={() => setSelectedBandForSettings(null)}
                >
                  <X className="w-5 h-5" />
                </IconButton>
              </div>

              {/* Logo Upload Section */}
              <div className="space-y-3 bg-[var(--sunken)] p-4 rounded-[var(--r-l)]">
                <label className="text-xs font-mono font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[var(--acc-ink)]" />
                  <span>Logotipo oficial de la banda</span>
                </label>

                <div className="flex items-center gap-4 pt-1">
                  {/* Logo Preview */}
                  <div className="relative w-20 h-20 rounded-[var(--r-m)] bg-[var(--surface)] overflow-hidden flex items-center justify-center shrink-0 p-2 ">
                    {(() => {
                      const clean = cleanBandId(
                        selectedBandForSettings.band_id,
                      );
                      const currentLogo =
                        customLogos[clean] || selectedBandForSettings.logoUrl;
                      if (
                        currentLogo &&
                        !failedLogos.has(selectedBandForSettings.band_id)
                      ) {
                        return (
                          <img
                            src={currentLogo}
                            alt={selectedBandForSettings.bandName}
                            onError={() =>
                              setFailedLogos((prev) =>
                                new Set(prev).add(
                                  selectedBandForSettings.band_id,
                                ),
                              )
                            }
                            className="w-full h-full object-contain filter "
                            referrerPolicy="no-referrer"
                          />
                        );
                      }
                      return (
                        <div className="flex flex-col items-center justify-center text-[var(--acc-ink)] gap-0.5">
                          <Guitar className="w-6 h-6 opacity-80" />
                          <span className="text-micro font-bold font-mono text-[var(--ink-2)]">
                            {selectedBandForSettings.bandName
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                        </div>
                      );
                    })()}

                    {uploadingBandId === selectedBandForSettings.band_id && (
                      <div className="absolute inset-0 bg-[var(--scrim)]/80 flex flex-col items-center justify-center text-[var(--on-scrim)] gap-1">
                        <Loader2 className="w-5 h-5 animate-spin text-[var(--acc-ink)]" />
                        <span className="text-micro font-mono text-[var(--acc-ink)] ">
                          Subiendo
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[var(--r-pill)] bg-[var(--acc)] text-[var(--on-acc)] text-xs font-bold transition-ui cursor-pointer active:scale-[0.97]">
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        {uploadingBandId === selectedBandForSettings.band_id
                          ? "Guardando..."
                          : "Subir Imagen de Logo"}
                      </span>
                      <input aria-label="Logotipo oficial de la banda"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={
                          uploadingBandId === selectedBandForSettings.band_id
                        }
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            await handleUploadLogo(
                              selectedBandForSettings.band_id,
                              file,
                            );
                          }
                        }}
                      />
                    </label>
                    <p className="text-micro text-[var(--ink-2)] font-sans leading-tight">
                      PNG, JPG, SVG o WebP. Fondo transparente recomendado.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Band Info */}
              <div className="bg-[var(--sunken)] p-4 rounded-[var(--r-l)] text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ink-2)] font-mono">
                    Nombre del Proyecto:
                  </span>
                  <span className="font-bold text-[var(--ink)] ">
                    {selectedBandForSettings.bandName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ink-2)] font-mono">
                    Plan Actual:
                  </span>
                  <span className="font-sans font-semibold px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)]/15 text-[var(--ink)] text-micro">
                    {selectedBandForSettings.plan
                      ? selectedBandForSettings.plan.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())
                      : "Emergente"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ink-2)] font-mono">
                    ID de Banda:
                  </span>
                  <span className="font-mono text-micro text-[var(--ink-2)] truncate max-w-[160px]">
                    {cleanBandId(selectedBandForSettings.band_id)}
                  </span>
                </div>
              </div>

              {/* Actions: Team Management + Close */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t border-[var(--hair)]">
                {onOpenBandManagement && (
                  <Button
                    variant="neutral"
                    type="button"
                    onClick={async () => {
                      const bId = selectedBandForSettings.band_id;
                      setSelectedBandForSettings(null);
                      if (
                        !isSameBandId(bId, currentActiveBandId) &&
                        onSwitchBand
                      ) {
                        await onSwitchBand(bId);
                      }
                      onClose();
                      onOpenBandManagement(bId);
                    }}
                    className="w-full sm:flex-1 items-center justify-center gap-2"
                  >
                    <Users className="w-3.5 h-3.5 text-[var(--acc-ink)]" />
                    <span>Gestionar músicos</span>
                  </Button>
                )}

                <Button
                  variant="neutral"
                  type="button"
                  onClick={() => setSelectedBandForSettings(null)}
                  className="w-full sm:w-auto"
                >
                  Listo
                </Button>
              </div>
            </div>
          </div>
        )}
    </>
  );
}
