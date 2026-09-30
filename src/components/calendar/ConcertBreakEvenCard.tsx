import React from 'react';
import { Concert } from '../../types';
import { calcularBreakEvenConcierto } from '../../utils/breakEvenCalculator';
import { ShowIcon } from '../ui/ShowIcon';

interface ConcertBreakEvenCardProps {
  concert: Concert;
  isStitchLight?: boolean;
  textTitle?: string;
  textSub?: string;
}

export const ConcertBreakEvenCard: React.FC<ConcertBreakEvenCardProps> = ({
  concert,
  isStitchLight = false,
  textTitle = 'text-[var(--ink)]',
  textSub = 'text-[var(--ink-2)]',
}) => {
  const analysis = calcularBreakEvenConcierto(concert, 'Madrid', 4);
  const net = analysis.beneficioNetoEstimado;

  return (
    <div
      className={`p-3 rounded-[var(--r-m)] mt-3 ${'bg-[var(--sunken)] '} space-y-2`}
    >
      <div className="flex items-center justify-between text-xs font-bold">
        <span className={textTitle}><ShowIcon inline emoji="📊" />Viabilidad del Bolo</span>
        <span
          className={`px-2 py-0.5 rounded-[var(--r-pill)] text-micro ${
            analysis.estadoRentabilidad === 'beneficio'
              ? 'bg-[var(--ok)]/10 text-[var(--ok)] '
              : analysis.estadoRentabilidad === 'cubierto'
                ? 'bg-[var(--acc)]/10 text-[var(--acc)] '
                : analysis.estadoRentabilidad === 'perdida_moderada'
                  ? 'bg-[var(--acc)]/10 text-[var(--acc)] '
                  : 'bg-[var(--alert)]/10 text-[var(--alert)] '
          }`}
        >
          {analysis.estadoRentabilidad === 'beneficio'
            ? 'Rentable'
            : analysis.estadoRentabilidad === 'cubierto'
              ? 'Al límite'
              : analysis.estadoRentabilidad === 'perdida_moderada'
                ? 'Pérdida Leve'
                : 'Riesgo'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="bg-[var(--surface)] p-1.5 rounded-[var(--r-m)] ">
          <span className="text-micro text-[var(--ink-2)] block font-mono">Gastos Estimados</span>
          <span className="text-xs font-bold text-[var(--alert)] font-mono">{analysis.gastosTotalesEstimados} €</span>
        </div>
        <div className="bg-[var(--surface)] p-1.5 rounded-[var(--r-m)] ">
          <span className="text-micro text-[var(--ink-2)] block font-mono">Para Cubrir Gastos</span>
          <span className="text-xs font-bold text-[var(--acc)] font-mono">
            {analysis.entradasParaBreakEven > 0 ? `${analysis.entradasParaBreakEven} entradas` : 'Cubierto'}
          </span>
        </div>
      </div>

      <div className="text-micro font-mono leading-relaxed pt-1 flex items-center justify-between border-t border-[var(--hair)]">
        <span className={textSub}>Resultado neto estimado:</span>
        <span className={`font-bold font-mono ${net >= 0 ? 'text-[var(--ok)]' : 'text-[var(--alert)]'}`}>
          {net >= 0 ? `+${net}€ Neto` : `${net}€ En pérdidas`}
        </span>
      </div>
      <p className="text-micro font-sans text-[var(--ink-2)]/90 italic mt-1 leading-normal">{analysis.mensajeStatus}</p>
    </div>
  );
};
