/**
 * Tipos y formato de las métricas de una banda aliada (oyentes, seguidores) mostradas en el CRM de bandas.
 */

export interface MetricaFuente {
  seguidores?: number | null;
  suscriptores?: number | null;
}

export interface MetricasBanda {
  periodo: string;
  spotify?: MetricaFuente;
  youtube?: MetricaFuente;
}

export const formatoCompacto = (n: number) =>
  new Intl.NumberFormat("es-ES", { notation: "compact", maximumFractionDigits: 1 }).format(n);
