import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { api } from '../../services/api';

const KOFI_URL = 'https://ko-fi.com/bandmanager';
/**
 * Bote de billetes/monedas neón que pidió Diego para el CTA de aportación económica: es el
 * mismo asset que ya usa FansLanding.tsx en su tarjeta "Colabora con una aportación económica"
 * (public/Screenshot_20260824_164054_Google.jpg), reutilizado en vez de duplicarlo.
 */
const BUCKET_ICON_SRC = '/Screenshot_20260824_164054_Google.jpg';

/**
 * A propósito no monta ningún checkout propio: ya existe uno (Stripe con "pay what you want",
 * server/routes/donations.ts) pero mantener dos vías de donar a la vez es justo el patrón de
 * "flujo divergente" que este proyecto ya sufrió una vez con el login de Gmail. Ko-fi es el único
 * botón de "aportar" visible; el checkout de Stripe se queda montado y probado por si algún día
 * hace falta un cobro dentro de la propia app, pero no se enlaza desde ningún sitio.
 */
function useAiDebtEur(): number | null {
  const [owedEur, setOwedEur] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    api.getDonationStatus()
      .then((status) => { if (isMounted) setOwedEur(status.owed_eur); })
      .catch(() => { if (isMounted) setOwedEur(null); });
    return () => { isMounted = false; };
  }, []);

  return owedEur;
}

interface AiSupportWidgetProps {
  variant: 'sidebar' | 'card';
}

/** CTA de apoyo económico a BandManager.ai. Independiente de la tarjeta de consumo de IA. */
export const AiSupportWidget: React.FC<AiSupportWidgetProps> = ({ variant }) => {
  const owedEur = useAiDebtEur();
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
        <span className="text-[10px] font-mono font-bold text-amber-400 group-hover:text-amber-300 transition-colors flex items-center gap-1.5 shrink-0">
          <span className="w-5 h-5 rounded-md overflow-hidden border border-amber-500/30 shrink-0">
            <img src={BUCKET_ICON_SRC} alt="" className="w-full h-full object-cover" />
          </span>
          Apoyar
        </span>
      </a>
    );
  }

  return (
    <a
      href={KOFI_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="p-4 sm:p-5 rounded-2xl transition-all border shadow-sm bg-[#181716] border-stone-800 text-zinc-100 flex items-center gap-3 hover:border-amber-500/50 group cursor-pointer"
    >
      <span className="w-11 h-11 rounded-xl overflow-hidden border border-amber-500/30 shrink-0">
        <img src={BUCKET_ICON_SRC} alt="" className="w-full h-full object-cover" />
      </span>
      <div className="flex-1 min-w-0">
        <h3 className="text-xs sm:text-sm font-bold font-mono uppercase tracking-wider text-amber-400 group-hover:text-amber-300 transition-colors">Apoya BandManager económicamente</h3>
        <p className="text-[11px] text-neutral-400 mt-0.5">Cualquier aportación ayuda a mantener el proyecto y sus agentes de IA en marcha.</p>
      </div>
      <span className="text-[10px] font-mono text-neutral-500 shrink-0 hidden sm:block">vía Ko-fi →</span>
    </a>
  );
};

interface AiUsageCardProps {
  isStitchLight?: boolean;
}

/** Tarjeta puramente informativa: cuánto ha gastado la banda en IA este mes. Sin CTA propio. */
export const AiUsageCard: React.FC<AiUsageCardProps> = ({ isStitchLight = false }) => {
  const owedEur = useAiDebtEur();
  const costeLabel = owedEur === null ? '—' : `${owedEur.toFixed(2).replace('.', ',')} €`;

  return (
    <div className={`p-4 sm:p-5 rounded-2xl transition-all border shadow-sm flex items-center gap-3 ${
      isStitchLight
        ? 'bg-white border-slate-200 text-slate-800'
        : 'bg-[#181716] border-stone-800 text-zinc-100'
    }`}>
      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
        <Zap className="w-4 h-4" />
      </div>
      <div>
        <h3 className="text-xs font-bold font-mono uppercase tracking-wider">Consumo de IA este mes</h3>
        <p className="text-[11px] text-neutral-400 mt-0.5">Tu banda ha gastado <strong className="text-amber-400">{costeLabel}</strong> en generación de IA (copys, acordes, música, análisis de reels).</p>
      </div>
    </div>
  );
};
