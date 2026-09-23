import React, { useState } from 'react';
import { Lead } from '../../types';
import { Calculator, Coins, TrendingUp, ChevronDown, ChevronUp, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface QuickDealSimulatorProps {
  lead: Lead;
  onSaveDeal: (data: {
    precioAnticipada: number;
    precioTaquilla: number;
    alquilerSalaFijo: number;
    porcentajeSala: number;
    gastosProduccionFijos: number;
    numMusicos: number;
  }) => Promise<void>;
  isSaving?: boolean;
  isStitchLight?: boolean;
}

export const QuickDealSimulator: React.FC<QuickDealSimulatorProps> = ({
  lead,
  onSaveDeal,
  isSaving = false,
  isStitchLight = false
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const existing = lead.financial_break_even;
  const aforo = lead.aforo || 200;

  const [anticipada, setAnticipada] = useState<number>(existing?.precio_entrada_anticipada ?? 12);
  const [taquilla, setTaquilla] = useState<number>(existing?.precio_entrada_taquilla ?? 15);
  const [alquiler, setAlquiler] = useState<number>(existing?.alquiler_sala_fijo ?? 250);
  const [pctSala, setPctSala] = useState<number>(existing?.porcentaje_sala ?? 15);
  const [gastosViaje, setGastosViaje] = useState<number>(existing?.gastos_produccion_fijos ?? 150);
  const [numMusicos, setNumMusicos] = useState<number>(existing?.num_musicos ?? 4);

  // Cálculo en vivo
  const totalCostesFijos = alquiler + gastosViaje;
  const precioEfectivo = anticipada * (1 - pctSala / 100);
  const liveBreakEven = precioEfectivo > 0 ? Math.ceil(totalCostesFijos / precioEfectivo) : 999;
  const liveBreakEvenPct = aforo > 0 ? Math.round((liveBreakEven / aforo) * 100) : 0;

  // Escenario 80% aforo
  const entradas80Pct = Math.round(aforo * 0.8);
  const ingresos80Pct = entradas80Pct * precioEfectivo;
  const beneficio80Pct = Math.max(0, Math.round(ingresos80Pct - totalCostesFijos));
  const porMusico80Pct = numMusicos > 0 ? Math.round(beneficio80Pct / numMusicos) : 0;

  const isViable = liveBreakEvenPct <= 50;
  const isAjustado = liveBreakEvenPct > 50 && liveBreakEvenPct <= 80;

  const handleSave = async () => {
    await onSaveDeal({
      precioAnticipada: anticipada,
      precioTaquilla: taquilla,
      alquilerSalaFijo: alquiler,
      porcentajeSala: pctSala,
      gastosProduccionFijos: gastosViaje,
      numMusicos: numMusicos
    });
    setIsExpanded(false);
  };

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-[#161514] overflow-hidden transition-all shadow-md">
      {/* Resumen Compacto (Siempre Visible) */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900/60 hover:bg-emerald-950/50 flex flex-wrap items-center justify-between gap-3 cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <Calculator className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-100 font-sans">
                Condiciones del Bolo & Rentabilidad
              </span>
              <span
                className={`text-[10px] font-sans font-bold px-1.5 py-0.2 rounded ${
                  isViable
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : isAjustado
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {isViable ? '🟢 Muy Viable' : isAjustado ? '🟡 Ajustado' : '🔴 Exigente'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
              Break-Even: <strong className="text-emerald-300 font-mono">{liveBreakEven} entradas</strong> ({liveBreakEvenPct}% de {aforo} aforo) · Alquiler: {alquiler}€ · Gastos: {gastosViaje}€
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-emerald-400 hidden sm:inline">
            {isExpanded ? 'Ocultar simulador' : 'Ajustar números'}
          </span>
          <div className="p-1 rounded bg-zinc-800 text-zinc-300">
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>
      </div>

      {/* Editor / Simulador Expandido */}
      {isExpanded && (
        <div className="p-3.5 border-t border-zinc-800 space-y-3 bg-black/40 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
              <label className="text-[10px] text-zinc-400 block font-medium">🎟️ Anticipada (€)</label>
              <input
                type="number"
                value={anticipada}
                onChange={(e) => setAnticipada(Number(e.target.value))}
                className="w-full bg-black border border-zinc-700 rounded px-2 py-1 text-zinc-100 font-bold font-mono text-xs focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
              <label className="text-[10px] text-zinc-400 block font-medium">🚪 Puerta (€)</label>
              <input
                type="number"
                value={taquilla}
                onChange={(e) => setTaquilla(Number(e.target.value))}
                className="w-full bg-black border border-zinc-700 rounded px-2 py-1 text-zinc-100 font-bold font-mono text-xs focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
              <label className="text-[10px] text-zinc-400 block font-medium">🏢 Alquiler Sala (€)</label>
              <input
                type="number"
                value={alquiler}
                onChange={(e) => setAlquiler(Number(e.target.value))}
                className="w-full bg-black border border-zinc-700 rounded px-2 py-1 text-zinc-100 font-bold font-mono text-xs focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
              <label className="text-[10px] text-zinc-400 block font-medium">% Comisión Sala</label>
              <input
                type="number"
                value={pctSala}
                onChange={(e) => setPctSala(Number(e.target.value))}
                className="w-full bg-black border border-zinc-700 rounded px-2 py-1 text-zinc-100 font-bold font-mono text-xs focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
              <label className="text-[10px] text-zinc-400 block font-medium">🚐 Gastos Viaje (€)</label>
              <input
                type="number"
                value={gastosViaje}
                onChange={(e) => setGastosViaje(Number(e.target.value))}
                className="w-full bg-black border border-zinc-700 rounded px-2 py-1 text-zinc-100 font-bold font-mono text-xs focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
              <label className="text-[10px] text-zinc-400 block font-medium">🎸 Nº Músicos</label>
              <input
                type="number"
                value={numMusicos}
                onChange={(e) => setNumMusicos(Number(e.target.value))}
                className="w-full bg-black border border-zinc-700 rounded px-2 py-1 text-zinc-100 font-bold font-mono text-xs focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Tarjetas de Resultado Rápido */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-center">
              <span className="text-[10px] text-emerald-300 font-bold uppercase block">Punto de Equilibrio</span>
              <span className="text-lg font-extrabold text-emerald-400 font-mono block">
                {liveBreakEven} tix
              </span>
              <span className="text-[9px] text-zinc-400 block">para cubrir costes</span>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-400 font-bold uppercase block">% Aforo Sala</span>
              <span className="text-lg font-bold text-zinc-100 font-mono block">
                {liveBreakEvenPct}%
              </span>
              <span className="text-[9px] text-zinc-500 block">de {aforo} personas</span>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-400 font-bold uppercase block">Margen (80% aforo)</span>
              <span className="text-lg font-bold text-emerald-300 font-mono block">
                +{beneficio80Pct} €
              </span>
              <span className="text-[9px] text-zinc-500 block">total banda</span>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-center">
              <span className="text-[10px] text-emerald-300 font-bold uppercase block">Por Músico (80%)</span>
              <span className="text-lg font-extrabold text-emerald-300 font-mono block">
                +{porMusico80Pct} €
              </span>
              <span className="text-[9px] text-emerald-400/80 block">limpio cada uno</span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-zinc-400">
              {isViable
                ? `✓ Excelente: Sólo necesitas el ${liveBreakEvenPct}% del aforo para cubrir furgoneta y sala.`
                : isAjustado
                ? `⚠️ Necesitas más de la mitad del aforo (${liveBreakEvenPct}%) para salir a flote.`
                : `🚨 Riesgo alto: Necesitas el ${liveBreakEvenPct}% del aforo para no perder dinero.`}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="px-3 py-1 rounded bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700 cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-3.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Guardar Deal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
