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

/** CTA de apoyo económico a BandManager.io. Independiente de la tarjeta de consumo de IA. */
export const AiSupportWidget: React.FC<AiSupportWidgetProps> = ({ variant }) => {
 const owedEur = useAiDebtEur();
 const costeLabel = owedEur === null ? '—' : `${owedEur.toFixed(2).replace('.', ',')} €`;

 if (variant === 'sidebar') {
 return (
 <a
 href={KOFI_URL}
 target="_blank"
 rel="noopener noreferrer"
 className="mx-3 mb-2 p-2.5 rounded-[var(--r-m)] bg-[var(--sunken)] hover:brightness-95 transition-colors cursor-pointer group flex items-center justify-between gap-2"
 title="Consumo real de IA de tu banda este mes. Apoya BandManager económicamente (vía Ko-fi)."
 >
 <div className="flex items-center gap-1.5 min-w-0">
 <Zap className="w-3 h-3 text-[var(--acc-ink)] shrink-0" />
 <span className="text-[10px] text-[var(--ink-2)] truncate">IA este mes: <strong className="text-[var(--ink)]">{costeLabel}</strong></span>
 </div>
 <span className="text-[10px] font-bold text-[var(--acc-ink)] transition-colors flex items-center gap-1.5 shrink-0">
 <span className="w-5 h-5 rounded-[var(--r-s)] overflow-hidden shrink-0">
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
 className="p-4 sm:p-5 rounded-[var(--r-l)] transition-colors bg-[var(--surface)] text-[var(--ink)] flex items-center gap-3 hover:brightness-95 group cursor-pointer"
 >
 <span className="w-11 h-11 rounded-[var(--r-m)] overflow-hidden shrink-0">
 <img src={BUCKET_ICON_SRC} alt="" className="w-full h-full object-cover" />
 </span>
 <div className="flex-1 min-w-0">
 <h3 className="text-xs sm:text-sm font-bold text-[var(--acc-ink)] transition-colors">Apoya BandManager económicamente</h3>
 <p className="text-[11px] text-[var(--ink-3)] mt-0.5">Cualquier aportación ayuda a mantener el proyecto y sus agentes de IA en marcha.</p>
 </div>
 <span className="text-[10px] text-[var(--ink-3)] shrink-0 hidden sm:block">vía Ko-fi →</span>
 </a>
 );
};

interface AiUsageCardProps {
 isStitchLight?: boolean;
}

// Por debajo de esto no merece la pena ni mostrar la tarjeta: Diego prefiere que una banda que
// apenas ha usado IA este mes no vea un número casi a cero, en vez de "ocultar hasta que gaste".
const MIN_EUR_TO_SHOW_USAGE = 2;

/** Tarjeta puramente informativa: cuánto ha gastado la banda en IA este mes. Sin CTA propio.
 * No se muestra nada si el gasto real (o aún desconocido) no supera los 2€. */
export const AiUsageCard: React.FC<AiUsageCardProps> = () => {
 const owedEur = useAiDebtEur();

 if (owedEur === null || owedEur <= MIN_EUR_TO_SHOW_USAGE) return null;

 const costeLabel = `${owedEur.toFixed(2).replace('.', ',')} €`;

 return (
 <div className="p-4 sm:p-5 rounded-[var(--r-l)] transition-colors flex items-center gap-3 bg-[var(--surface)] text-[var(--ink)]">
 <div className="w-9 h-9 rounded-[var(--r-m)] bg-[var(--acc-soft)] text-[var(--acc-ink)] flex items-center justify-center shrink-0">
 <Zap className="w-4 h-4" />
 </div>
 <div>
 <h3 className="text-xs font-bold">Consumo de IA este mes</h3>
 <p className="text-[11px] text-[var(--ink-3)] mt-0.5">Tu banda ha gastado <strong className="text-[var(--acc-ink)]">{costeLabel}</strong> en generación de IA (copys, acordes, música, análisis de reels).</p>
 </div>
 </div>
 );
};
