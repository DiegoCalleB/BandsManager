/**
 * d
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Check,Copy,ExternalLink,QrCode,Settings } from "lucide-react";
import QRCode from "react-qr-code";
import { LinkButton } from "../../ui";
import { useCalendar } from "../CalendarContext";

/**
 * d
 * @returns Sección de interfaz.
 */
export function ConcertQrWidget() {
  const { selectedConcert, currentBandId, activeBandId, onNavigate, setCopiedQrId, copiedQrId } = useCalendar();
  return (
    <>
      {/* WIDGET QR DEL CONCIERTO (ACCESO RÁPIDO & CONFIGURACIÓN) */}
      {selectedConcert &&
        (() => {
          const host = typeof window !== 'undefined' ? window.location.origin : 'https://bandmanager.io';
          const cleanCity = (selectedConcert.ciudad || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const cleanSala = (selectedConcert.sala || '')
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
          const bandCode = (selectedConcert.band_id || currentBandId || activeBandId || '').replace(/^(band|reg)-/, '');
          const defaultUrl = `${host}/unete${cleanCity || cleanSala ? `/${cleanCity}-${cleanSala}` : ''}${bandCode ? `?band=${encodeURIComponent(bandCode)}` : ''}`;
          const targetQrUrl = selectedConcert.customQrUrl || defaultUrl;

          return (
            <div className={`mt-3 pt-3 border-t ${'border-[var(--hair)]'}`}>
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-1.5 text-micro font-mono font-bold text-[var(--acc)]">
                  <QrCode className="w-3.5 h-3.5 shrink-0 text-[var(--acc)]" />
                  <span>QR Bolo y Captación Fans:</span>
                </div>
                {onNavigate && (
                  <LinkButton
                    size="xs"
                    type="button"
                    onClick={() => onNavigate('fans', { concertId: selectedConcert.id })}
                    title="Configurar el QR y la experiencia del fan para este concierto"
                  >
                    <Settings className="w-3 h-3 text-[var(--acc)]" />
                    <span>Configurar</span>
                  </LinkButton>
                )}
              </div>

              <div
                className={`p-2 rounded-[var(--r-m)] flex items-center gap-2.5 ${
                  'bg-[var(--sunken)] '
                }`}
              >
                <div
                  onClick={() => onNavigate?.('fans', { concertId: selectedConcert.id })}
                  className="p-1 bg-[var(--surface)] rounded-[var(--r-m)] shadow shrink-0 cursor-pointer transition-transform"
                  title="Haz clic para abrir la configuración del QR"
                >
                  <QRCode value={targetQrUrl} size={58} level="M" />
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <p
                    className="text-micro font-mono text-[var(--ink-2)] truncate break-all bg-[var(--sunken)]/60 p-1 rounded text-[var(--acc)] font-semibold"
                    title={targetQrUrl}
                  >
                    {targetQrUrl}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={targetQrUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--ink)] rounded text-micro font-mono font-bold flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-2.5 h-2.5" /> Abrir
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(targetQrUrl);
                        setCopiedQrId(selectedConcert.id);
                        setTimeout(() => setCopiedQrId(null), 2000);
                      }}
                      className="px-2 py-0.5 bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] rounded text-micro font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedQrId === selectedConcert.id ? (
                        <>
                          <Check className="w-2.5 h-2.5 text-[var(--ok)]" />
                          <span className="text-[var(--ok)]">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-2.5 h-2.5 text-[var(--ink-2)]" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
    </>
  );
}
