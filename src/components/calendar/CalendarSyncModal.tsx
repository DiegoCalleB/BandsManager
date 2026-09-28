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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className={`max-w-lg w-full rounded-2xl border p-5 shadow-2xl relative ${
          isStitchLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-neutral-950 border-neutral-800 text-white'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Sincronización Automática (iCal / Google)</h3>
              <p className="text-[10px] text-neutral-400 font-mono">
                Sincroniza los bolos y ensayos en tiempo real con tu calendario personal.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white text-sm font-bold cursor-pointer p-1">
            ✕
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs">
          <div
            className={`p-3 rounded-xl border ${isStitchLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900/80 border-neutral-800'}`}
          >
            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1 font-bold">
              URL de Suscripción iCal (Privada)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={rutaFeed}
                className={`flex-1 p-2 text-xs rounded-xl border outline-none font-mono ${
                  isStitchLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-neutral-950 border-neutral-800 text-amber-300'
                }`}
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
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
              className="p-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 flex items-center justify-center gap-2 font-bold text-xs transition-all text-center"
            >
              <Calendar className="w-4 h-4 text-sky-400" />
              <span>Añadir a Google Calendar</span>
            </a>

            <a
              href={webCalFeed}
              className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center gap-2 font-bold text-xs transition-all text-center"
            >
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>Suscribir en iPhone / Mac</span>
            </a>
          </div>

          <div className="p-3 rounded-xl bg-neutral-950/60 border border-white/5 space-y-1.5 text-[11px] text-neutral-300">
            <p className="font-bold text-neutral-200">Pasos en Google Calendar (1 minuto):</p>
            <ol className="list-decimal list-inside space-y-1 text-neutral-400">
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

        <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
          <a
            href={rutaFeed || undefined}
            download={`calendar-${activeBandId || 'band'}.ics`}
            className="text-[11px] font-mono text-neutral-400 hover:text-amber-300 underline flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            <span>O si prefieres, descargar archivo .ics puntual</span>
          </a>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
