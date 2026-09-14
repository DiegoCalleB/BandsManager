import React, { useEffect, useState } from 'react';
import { PaintBucket, Zap } from 'lucide-react';
import { api } from '../../services/api';

const KOFI_URL = 'https://ko-fi.com/bandmanager';

interface AiUsageSupportWidgetProps {
  variant: 'sidebar' | 'card';
  isStitchLight?: boolean;
}

/**
 * Consumo real de IA de la banda (server/db/aiLedger.ts) + enlace a Ko-fi para donar.
 *
 * El CTA dice explícitamente "Apoya BandManager económicamente" en vez de solo "Ko-fi": el
 * nombre de la plataforma solo no comunica para qué es el botón. Ko-fi aparece igualmente como
 * texto pequeño, para que quede claro a dónde lleva antes de hacer clic.
 *
 * A propósito no monta ningún checkout propio: ya existe uno (Stripe con "pay what you want",
 * server/routes/donations.ts) pero mantener dos vías de donar a la vez es justo el patrón de
 * "flujo divergente" que este proyecto ya sufrió una vez con el login de Gmail. Ko-fi es el único
 * botón de "aportar" visible; el checkout de Stripe se queda montado y probado por si algún día
 * hace falta un cobro dentro de la propia app, pero no se enlaza desde ningún sitio.
 */
export const AiUsageSupportWidget: React.FC<AiUsageSupportWidgetProps> = ({ variant, isStitchLight = false }) => {
  const [owedEur, setOwedEur] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    api.getDonationStatus()
      .then((status) => { if (isMounted) setOwedEur(status.owed_eur); })
      .catch(() => { if (isMounted) setOwedEur(null); });
    return () => { isMounted = false; };
  }, []);

  const costeLabel = owedEur === null ? '—' : `${owedEur.toFixed(2).replace('.', ',')} €`;

  if (variant === 'sidebar') {
    return (
      <a
        href={KOFI_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mx-3 mb-2 p-2.5 rounded-xl bg-gradient-to-b from-[#181716] to-[#121110] border border-amber-500/25 hover:border-amber-500/50 transition-all cursor-pointer group shadow-sm flex items-center justify-between gap-2"
        title="Consumo real de IA de tu banda este mes. Apoya BandManager económicamente (vía Ko-fi)."
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Zap className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="text-[10px] font-mono text-neutral-300 truncate">IA este mes: <strong className="text-amber-300">{costeLabel}</strong></span>
        </div>
        <span className="text-[10px] font-mono font-bold text-amber-400 group-hover:text-amber-300 transition-colors flex items-center gap-1 shrink-0">
          <PaintBucket className="w-3 h-3" /> Apoyar
        </span>
      </a>
    );
  }

  return (
    <div className={`p-4 sm:p-5 rounded-2xl transition-all border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
      isStitchLight
        ? 'bg-white border-slate-200 text-slate-800'
        : 'bg-[#181716] border-stone-800 text-zinc-100'
    }`}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-xs font-bold font-mono uppercase tracking-wider">Consumo de IA este mes</h3>
          <p className="text-[11px] text-neutral-400 mt-0.5">Tu banda ha gastado <strong className="text-amber-400">{costeLabel}</strong> en generación de IA (copys, acordes, música, análisis de reels).</p>
        </div>
      </div>
      <a
        href={KOFI_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center gap-0.5 shrink-0 w-full sm:w-auto"
      >
        <span className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 w-full justify-center">
          <PaintBucket className="w-3.5 h-3.5" /> Apoya BandManager económicamente
        </span>
        <span className="text-[9px] font-mono text-neutral-500">vía Ko-fi</span>
      </a>
    </div>
  );
};
