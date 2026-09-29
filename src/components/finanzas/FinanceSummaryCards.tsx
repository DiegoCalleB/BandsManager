import React from 'react';
import { ThemeColors } from '../../types';
import { TrendingUp, TrendingDown, DollarSign, Calculator } from 'lucide-react';
import { FinancialSummary } from '../../utils/financeUtils';
import { useLanguage } from '../../context/LanguageContext';

interface FinanceSummaryCardsProps {
  colors: ThemeColors;
  summary: FinancialSummary;
}

export const FinanceSummaryCards: React.FC<FinanceSummaryCardsProps> = ({ colors, summary }) => {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div
        id="finances-kpi-ingresos"
        className="p-5 rounded-[var(--r-l)] transition-all"
        style={{
          backgroundColor: colors.card,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold" style={{ color: colors.textMuted }}>
            {t('finances.total_income', 'Ingresos Totales')}
          </span>
          <div className="p-2 rounded-[var(--r-m)] bg-[var(--ok)]/10 text-[var(--ok)]">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold" style={{ color: colors.text }}>
          {summary.totalIngresos.toLocaleString('es-ES')} €
        </div>
        {summary.pagosPendientesIngreso > 0 && (
          <p className="text-xs text-[var(--acc)] mt-1 font-medium">
            +{summary.pagosPendientesIngreso.toLocaleString('es-ES')} € {t('finances.pending', 'pendientes')}
          </p>
        )}
      </div>

      <div
        id="finances-kpi-gastos"
        className="p-5 rounded-[var(--r-l)] transition-all"
        style={{
          backgroundColor: colors.card,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold" style={{ color: colors.textMuted }}>
            {t('finances.total_expenses', 'Gastos Totales')}
          </span>
          <div className="p-2 rounded-[var(--r-m)] bg-[var(--alert)]/10 text-[var(--alert)]">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold" style={{ color: colors.text }}>
          {summary.totalGastos.toLocaleString('es-ES')} €
        </div>
        {summary.pagosPendientesGasto > 0 && (
          <p className="text-xs text-[var(--alert)] mt-1 font-medium">
            +{summary.pagosPendientesGasto.toLocaleString('es-ES')} € por pagar
          </p>
        )}
      </div>

      <div
        id="finances-kpi-beneficio"
        className="p-5 rounded-[var(--r-l)] transition-all"
        style={{
          backgroundColor: colors.card,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold" style={{ color: colors.textMuted }}>
            Beneficio Neto
          </span>
          <div className="p-2 rounded-[var(--r-m)] bg-[var(--tentative)]/10 text-[var(--tentative)]">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className={`text-2xl font-bold ${summary.beneficioNeto >= 0 ? 'text-[var(--ok)]' : 'text-[var(--alert)]'}`}>
          {summary.beneficioNeto.toLocaleString('es-ES')} €
        </div>
        <p className="text-xs text-[var(--ink-2)] mt-1 font-medium">Cashflow acumulado</p>
      </div>

      <div
        id="finances-kpi-margen"
        className="p-5 rounded-[var(--r-l)] transition-all"
        style={{
          backgroundColor: colors.card,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold" style={{ color: colors.textMuted }}>
            Margen de Beneficio
          </span>
          <div className="p-2 rounded-[var(--r-m)] bg-[var(--tentative)]/10 text-[var(--acc)]">
            <Calculator className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold" style={{ color: colors.text }}>
          {summary.margenBeneficioPorcentaje} %
        </div>
        <p className="text-xs text-[var(--ink-2)] mt-1 font-medium">Rentabilidad sobre ingresos</p>
      </div>
    </div>
  );
};
