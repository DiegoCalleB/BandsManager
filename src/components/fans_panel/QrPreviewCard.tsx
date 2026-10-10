/**
 * QR personalizado, enlace y acciones de exportación.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Download,ExternalLink,Eye,FileCode,Layers,MessageCircle,MoreHorizontal,Printer,Share2 } from "lucide-react";
import { CustomizableBandQr } from "../fans/qr/CustomizableBandQr";
import { IconButton,LinkButton,MenuItem } from "../ui";
import { PopoverAncla } from "../ui/PopoverAncla";
import { useFansPanel } from "./FansPanelContext";

/**
 * QR personalizado, enlace y acciones de exportación.
 * @returns Sección de interfaz.
 */
export function QrPreviewCard() {
  const { qrConcertUrl, qrCustomConfig, effectiveBandName, effectiveBandLogo, selectedConcert, handleCopyQrUrl, copiedQrUrl, handlePrintQr, setShowQrMoreMenu, showQrMoreMenu, handleDownloadSvg, isExportingDirect, handleDownloadPng4k, setShowQrExportModal, handleShareWhatsApp, handleShareNative, setShowFansPreviewModal } = useFansPanel();
  return (
    <>
{/* Contenido principal: el QR personalizado, grande y visual */}
          <div className="bg-[var(--sunken)] rounded-[var(--r-l)] p-6 flex flex-col items-center text-center space-y-4">
            <div id="qr-code-svg-container" className="inline-block relative">
              <CustomizableBandQr
                id="custom-band-qr-rendered"
                value={qrConcertUrl}
                size={240}
                config={qrCustomConfig}
                bandName={effectiveBandName}
                bandLogoUrl={effectiveBandLogo}
                concertTitle={selectedConcert ? selectedConcert.sala : undefined}
                dateCity={
                  selectedConcert
                    ? `${selectedConcert.ciudad} • ${selectedConcert.fecha}`
                    : undefined
                }
                showFrame={false}
              />
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-[var(--ink)] font-display text-lg">
                {selectedConcert
                  ? selectedConcert.sala
                  : `Únete a ${effectiveBandName}`}
              </h4>
              <p className="text-xs text-[var(--ink-2)] font-sans">
                {selectedConcert
                  ? `${selectedConcert.ciudad} • ${selectedConcert.fecha}`
                  : "Escanea para conseguir tema exclusivo y descuentos"}
              </p>
            </div>

            <div className="w-full flex items-center gap-2 bg-[var(--surface)] rounded-[var(--r-m)] px-3 py-2">
              <span className="flex-1 min-w-0 truncate font-sans text-[var(--acc)]/70 text-xs text-left">
                {qrConcertUrl}
              </span>
              <LinkButton
                type="button"
                onClick={handleCopyQrUrl}
                className="shrink-0"
              >
                {copiedQrUrl ? "¡Copiado!" : "Copiar"}
              </LinkButton>
            </div>

            {/* Acción principal + resto de acciones detrás de un único menú */}
            <div className="w-full flex items-center gap-2">
              <button
                id="fans-qr-export-btn"
                type="button"
                onClick={handlePrintQr}
                className="flex-1 py-3 px-4 bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] font-bold font-sans text-xs rounded-[var(--r-m)] flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Cartel A4 / PDF
              </button>
              <div className="relative shrink-0">
                <IconButton
                  label="Más opciones: SVG, PNG 4K, tarjetas, compartir, previsualizar el formulario…"
                  size="icon"
                  type="button"
                  onClick={() => setShowQrMoreMenu((v) => !v)}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </IconButton>
                {showQrMoreMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowQrMoreMenu(false)}
                    />
                    <PopoverAncla className="absolute right-0 bottom-full mb-1.5 z-40 w-64 rounded-[var(--r-m)] bg-[var(--surface)] p-1.5 space-y-0.5 text-xs font-sans">
                      <MenuItem
                        tone="muted"
                        type="button"
                        onClick={() => {
                          setShowQrMoreMenu(false);
                          handleDownloadSvg();
                        }}
                        disabled={isExportingDirect}
                      >
                        <FileCode className="w-3.5 h-3.5 shrink-0" /> Vector SVG
                        (imprenta/lonas)
                      </MenuItem>
                      <MenuItem
                        type="button"
                        onClick={() => {
                          setShowQrMoreMenu(false);
                          handleDownloadPng4k();
                        }}
                        disabled={isExportingDirect}
                      >
                        <Download className="w-3.5 h-3.5 shrink-0" /> PNG Ultra
                        HD 4K
                      </MenuItem>
                      <MenuItem
                        tone="acc"
                        type="button"
                        onClick={() => {
                          setShowQrMoreMenu(false);
                          setShowQrExportModal(true);
                        }}
                      >
                        <Layers className="w-3.5 h-3.5 shrink-0" /> Más formatos
                        (tarjeta, pegatina…)
                      </MenuItem>
                      <div className="h-px bg-[var(--surface)] my-1" />
                      <MenuItem
                        tone="muted"
                        type="button"
                        onClick={() => {
                          setShowQrMoreMenu(false);
                          handleShareWhatsApp();
                        }}
                      >
                        <MessageCircle className="w-3.5 h-3.5 shrink-0" />{" "}
                        Compartir por WhatsApp
                      </MenuItem>
                      <MenuItem
                        tone="muted"
                        type="button"
                        onClick={() => {
                          setShowQrMoreMenu(false);
                          handleShareNative();
                        }}
                      >
                        <Share2 className="w-3.5 h-3.5 shrink-0" /> Compartir
                        enlace
                      </MenuItem>
                      <a
                        href={qrConcertUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowQrMoreMenu(false)}
                        className="w-full text-left px-2.5 py-2 rounded-[var(--r-s)] text-[var(--ink-2)] hover:bg-[var(--surface)] transition cursor-pointer flex items-center gap-2"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" /> Abrir
                        landing en pestaña nueva
                      </a>
                      <MenuItem
                        tone="muted"
                        type="button"
                        onClick={() => {
                          setShowQrMoreMenu(false);
                          setShowFansPreviewModal(true);
                        }}
                      >
                        <Eye className="w-3.5 h-3.5 shrink-0" /> Previsualizar
                        formulario “Únete”
                      </MenuItem>
                    </PopoverAncla>
                  </>
                )}
              </div>
            </div>
          </div>
    </>
  );
}
