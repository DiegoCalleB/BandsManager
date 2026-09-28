import React from 'react';
import { Concert } from '../../types';
import { calcularBreakEvenConcierto } from '../../utils/breakEvenCalculator';

interface ConcertBreakEvenCardProps {
  concert: Concert;
  isStitchLight?: boolean;
  textTitle?: string;
  textSub?: string;
}

export const ConcertBreakEvenCard: React.FC<ConcertBreakEvenCardProps> = ({
  concert,
  isStitchLight = false,
  textTitle = 'text-white',
  textSub = 'text-neutral-400'
}) => {
  const analysis = calcularBreakEvenConcierto(concert, 'Madrid', 4);
  const net = analysis.beneficioNetoEstimado;

  return (
    <div className={`p-3 rounded-xl mt-3 ${isStitchLight ? 'bg-slate-50 border border-slate-200' : 'bg-neutral-950 border border-neutral-900'} space-y-2`}>
      <div className="flex items-center justify-between text-[11px] font-bold">
        <span className={textTitle}>📊 Viabilidad del Bolo</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
          analysis.estadoRentabilidad === 'beneficio' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
          analysis.estadoRentabilidad === 'cubierto' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
          analysis.estadoRentabilidad === 'perdida_moderada' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
          'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}>
          {analysis.estadoRentabilidad === 'beneficio' ? 'Rentable' :
           analysis.estadoRentabilidad === 'cubierto' ? 'Al límite' :
           analysis.estadoRentabilidad === 'perdida_moderada' ? 'Pérdida Leve' : 'Riesgo'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="bg-black/30 p-1.5 rounded-lg border border-neutral-800/40">
          <span className="text-[9px] text-neutral-400 block font-mono">Gastos Estimados</span>
          <span className="text-xs font-bold text-rose-400 font-mono">{analysis.gastosTotalesEstimados} €</span>
        </div>
        <div className="bg-black/30 p-1.5 rounded-lg border border-neutral-800/40">
          <span className="text-[9px] text-neutral-400 block font-mono">Para Cubrir Gastos</span>
          <span className="text-xs font-bold text-amber-300 font-mono">
            {analysis.entradasParaBreakEven > 0 ? `${analysis.entradasParaBreakEven} entradas` : 'Cubierto'}
          </span>
        </div>
      </div>

      <div className="text-[10px] font-mono leading-relaxed pt-1 flex items-center justify-between border-t border-neutral-800/30">
        <span className={textSub}>Resultado neto estimado:</span>
        <span className={`font-bold font-mono ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {net >= 0 ? `+${net}€ Neto` : `${net}€ En pérdidas`}
        </span>
      </div>
      <p className="text-[9px] font-sans text-neutral-400/90 italic mt-1 leading-normal">
        {analysis.mensajeStatus}
      </p>
    </div>
  );
};
