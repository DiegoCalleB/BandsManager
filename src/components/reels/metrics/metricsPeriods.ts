/**
 * Periodos disponibles para filtrar las métricas sociales.
 * Constantes de módulo para no recrear el array en cada render y compartirlas entre hook y vistas.
 */

// Time period filter state (7d, 30d, 90d, 1y, all)
export type SocialMetricsPeriod = "7d" | "30d" | "90d" | "1y" | "all";

export const PERIOD_OPTIONS: {
  id: SocialMetricsPeriod;
  label: string;
  shortLabel: string;
  days: number | null;
}[] = [
  { id: "7d", label: "Últimos 7 días", shortLabel: "7D", days: 7 },
  { id: "30d", label: "Últimos 30 días", shortLabel: "30D", days: 30 },
  { id: "90d", label: "Últimos 90 días", shortLabel: "90D", days: 90 },
  { id: "1y", label: "Último año", shortLabel: "1A", days: 365 },
  { id: "all", label: "Histórico completo", shortLabel: "Todo", days: null },
];
