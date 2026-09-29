import React, { useState } from 'react';
import { Calendar, Radio, Download, Copy, Check } from 'lucide-react';

interface CalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  isStitchLight?: boolean;
  activeBandId?: string;
  host: string;
  webCalFeed: string;
  rutaFeed: string;
}

export const CalendarSyncModal: React.FC<CalendarSyncModalProps> = ({
  isOpen,
  onClose,
  isStitchLight = false,
  activeBandId,
  host,
  webCalFeed,
  rutaFeed,
}) => {
  const [copiedSyncUrl, setCopiedSyncUrl] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(rutaFeed);
    setCopiedSyncUrl(true);
    setTimeout(() => setCopiedSyncUrl(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-[var(--scrim)]/80 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      <div
        className={`max-w-lg w-full rounded-[var(--r-l)] p-5 relative ${
          'bg-[var(--surface)] text-[var(--ink)]'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--hair)]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc)]/10 text-[var(--acc)]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Sincronización Automática (iCal / Google)</h3>
              <p className="text-[10px] text-[var(--ink-2)] font-mono">
                Sincroniza los bolos y ensayos en tiempo real con tu calendario personal.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--ink-2)] hover:text-[var(--ink)] text-sm font-bold cursor-pointer p-1">
            ✕
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs">
          <div
            className={`p-3 rounded-[var(--r-m)] ${'bg-[var(--sunken)] '}`}
          >
            <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1 font-bold">
              URL de Suscripción iCal (Privada)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={rutaFeed}
                className={`flex-1 p-2 text-xs rounded-[var(--r-m)] outline-none font-mono ${
                  'bg-[var(--sunken)] text-[var(--ink)]'
                }`}
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2 rounded-[var(--r-m)] bg-[var(--acc)] hover:bg-[var(--acc)] text-[var(--ink)] font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
              >
                {copiedSyncUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar URL</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a
              href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webCalFeed)}`}
              target="_blank"
              rel="noreferrer"
              className="p-3 rounded-[var(--r-m)] bg-[var(--acc)]/10 hover:bg-[var(--acc)]/20 text-[var(--acc)] flex items-center justify-center gap-2 font-bold text-xs transition-all text-center"
            >
              <Calendar className="w-4 h-4 text-[var(--acc)]" />
              <span>Añadir a Google Calendar</span>
            </a>

            <a
              href={webCalFeed}
              className="p-3 rounded-[var(--r-m)] bg-[var(--ok)]/10 hover:bg-[var(--ok)]/20 text-[var(--ok)] flex items-center justify-center gap-2 font-bold text-xs transition-all text-center"
            >
              <Radio className="w-4 h-4 text-[var(--ok)]" />
              <span>Suscribir en iPhone / Mac</span>
            </a>
          </div>

          <div className="p-3 rounded-[var(--r-m)] bg-[var(--sunken)]/60 space-y-1.5 text-[11px] text-[var(--ink-2)]">
            <p className="font-bold text-[var(--ink-2)]">Pasos en Google Calendar (1 minuto):</p>
            <ol className="list-decimal list-inside space-y-1 text-[var(--ink-2)]">
              <li>
                Haz clic en el botón azul <strong>"Añadir a Google Calendar"</strong> de arriba.
              </li>
              <li>
                Si lo añades manualmente: ve a <em>"Otros calendarios" (+)</em> ➔ <strong>"Desde URL"</strong> en Google Calendar.
              </li>
              <li>Pega la URL de suscripción y confirma.</li>
              <li>¡Listo! Google Calendar sincronizará los cambios automáticamente.</li>
            </ol>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-[var(--hair)]/10 flex items-center justify-between">
          <a
            href={rutaFeed || undefined}
            download={`calendar-${activeBandId || 'band'}.ics`}
            className="text-[11px] font-mono text-[var(--ink-2)] hover:text-[var(--acc)] underline flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            <span>O si prefieres, descargar archivo .ics puntual</span>
          </a>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-[var(--r-m)] bg-[var(--sunken)] hover:bg-[var(--surface)] text-xs font-bold text-[var(--ink)] transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
