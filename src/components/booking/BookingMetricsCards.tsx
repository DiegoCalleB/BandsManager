import React from "react";
import { ThemeColors } from "../../types";
import { BookingMetrics } from "../../utils/bookingUtils";
import {
  Building2,
  CheckCircle2,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

interface BookingMetricsCardsProps {
  colors: ThemeColors;
  metrics: BookingMetrics;
}

export const BookingMetricsCards: React.FC<BookingMetricsCardsProps> = ({
  colors,
  metrics,
}) => {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div
        id="booking-kpi-total"
        className="p-5 rounded-[var(--r-l)] transition-all"
        style={{
          backgroundColor: colors.card,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[var(--ink-2)]">
            {t("booking.total_leads", "Total Leads / Salas")}
          </span>
          <div className="p-2 rounded-[var(--r-m)] bg-[var(--tentative)]/10 text-[var(--tentative)]">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold" style={{ color: colors.text }}>
          {metrics.totalLeads}
        </div>
        <p className="text-xs text-[var(--ink-2)] mt-1">
          {t("booking.in_pipeline", "En pipeline activo")}
        </p>
      </div>

      <div
        id="booking-kpi-aprobados"
        className="p-5 rounded-[var(--r-l)] transition-all"
        style={{
          backgroundColor: colors.card,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[var(--ink-2)]">
            {t("booking.approved_dates", "Fechas Aprobadas")}
          </span>
          <div className="p-2 rounded-[var(--r-m)] bg-[var(--ok)]/10 text-[var(--ok)]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold text-[var(--ok)]">
          {metrics.leadsPorEstado["aprobado"] || 0}
        </div>
        <p className="text-xs text-[var(--ink-2)] mt-1">
          {t("booking.conversion_rate", "Tasa conversión")}:{" "}
          <span className="text-[var(--ok)] font-semibold">
            {metrics.tasaConversion}%
          </span>
        </p>
      </div>

      <div
        id="booking-kpi-respuesta"
        className="p-5 rounded-[var(--r-l)] transition-all"
        style={{
          backgroundColor: colors.card,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[var(--ink-2)]">
            Tasa de Respuesta
          </span>
          <div className="p-2 rounded-[var(--r-m)] bg-[var(--tentative)]/50 text-[var(--tentative)]">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold text-[var(--acc)]">
          {metrics.tasaRespuesta}%
        </div>
        <p className="text-xs text-[var(--ink-2)] mt-1">
          Feedback de programadores
        </p>
      </div>

      <div
        id="booking-kpi-aforo"
        className="p-5 rounded-[var(--r-l)] transition-all"
        style={{
          backgroundColor: colors.card,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[var(--ink-2)]">
            Aforo Total Potencial
          </span>
          <div className="p-2 rounded-[var(--r-m)] bg-[var(--tentative)]/10 text-[var(--acc)]">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold" style={{ color: colors.text }}>
          {metrics.aforoTotalPotencial.toLocaleString("es-ES")} pax
        </div>
        <p className="text-xs text-[var(--ink-2)] mt-1">
          Promedio: ~{metrics.aforoPromedio} pax/sala
        </p>
      </div>
    </div>
  );
};
