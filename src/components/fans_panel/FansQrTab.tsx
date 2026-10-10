import { QrAdvancedConfig } from "./QrAdvancedConfig";
import { QrPreviewCard } from "./QrPreviewCard";
/**
 * Pestaña del QR de la landing: enlace, personalización y exportación.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { QrCode } from "lucide-react";
import { QrCustomizerControls } from "../fans/qr/QrCustomizerControls";
import { QrExportModal } from "../QrExportModal";
import { Select } from "../ui";
import { useFansPanel } from "./FansPanelContext";

/**
 * Pestaña del QR de la landing: enlace, personalización y exportación.
 * @returns Sección de interfaz.
 */
export function FansQrTab() {
  const { activeTab, selectedConcertId, setSelectedConcertId, concerts, qrConcertUrl, qrCustomConfig, effectiveBandName, effectiveBandLogo, selectedConcert, setShowQrExportModal, handleQrConfigChange, onNavigate, showQrExportModal } = useFansPanel();
  return (
    <>
{activeTab === "qr" && (
        <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-6 lg:p-8 space-y-5">
          <div className="space-y-1 pb-4">
            <h3 className="text-xl font-bold text-[var(--ink)] flex items-center gap-2 font-display">
              <QrCode className="w-6 h-6 text-[var(--acc)]" /> Generador de QR
            </h3>
            <p className="text-xs text-[var(--ink-2)] font-sans">
              Genera el código, descárgalo o imprímelo. La recompensa al fan, el
              dominio y el idioma están abajo, plegados.
            </p>
          </div>

          {/* Vínculo a concierto: única decisión que cambia la URL, por eso va siempre visible */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label
              className="text-xs font-bold text-[var(--acc)] font-sans shrink-0"
              title="Los fans que escaneen se registrarán con este origen en el CRM"
            >
              Vincular a:
            </label>
            <Select
              size="sm"
              id="fans-concert-selector"
              value={selectedConcertId}
              onChange={(e) => setSelectedConcertId(e.target.value)}
              wrapperClassName="w-full"
            >
              <option value="">
                -- Campaña general / QR genérico de la banda --
              </option>
              {concerts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fecha} — {c.sala} ({c.ciudad})
                </option>
              ))}
            </Select>
          </div>

          <QrPreviewCard />

          {/* Panel de Personalización Visual y Temática del QR (Dino, Pac-Man, Rock...) */}
          <QrCustomizerControls
            config={qrCustomConfig}
            onChange={handleQrConfigChange}
            bandLogoUrl={effectiveBandLogo}
            bandName={effectiveBandName}
            onUploadLogoClick={onNavigate ? () => onNavigate("epk") : undefined}
          />

          <QrAdvancedConfig />

          {/* Modal de Exportación Avanzada de QR */}
          <QrExportModal
            isOpen={showQrExportModal}
            onClose={() => setShowQrExportModal(false)}
            svgElementId="qr-code-svg-container"
            bandName={effectiveBandName}
            concertTitle={selectedConcert ? selectedConcert.sala : undefined}
            dateCity={
              selectedConcert
                ? `${selectedConcert.ciudad} • ${selectedConcert.fecha}`
                : undefined
            }
            url={qrConcertUrl}
            logoUrl={effectiveBandLogo}
            config={qrCustomConfig}
          />
        </div>
      )}
    </>
  );
}
