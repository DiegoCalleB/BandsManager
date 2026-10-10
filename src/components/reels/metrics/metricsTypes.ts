/**
 * Tipos de la vista de métricas sociales.
 * Cubren campos que la API añade a `SocialMetric` (fans) y las respuestas de Instagram y del escáner de capturas.
 */
import type { SocialMetric } from "../../../types";

/** Punto de la serie del gráfico: solo `fecha` es obligatoria porque los puntos interpolados no traen id ni notas. */
export type MetricWithFans = Pick<SocialMetric, "fecha"> & Partial<SocialMetric>;

/** Insights de Instagram devueltos al verificar el token. */
export interface InstagramInsights {
  reach?: number;
  impressions?: number;
  profile_views?: number;
  total_interactions?: number;
}

/** Estado de la conexión de Instagram. */
export interface InstagramStatus {
  connected: boolean;
  method?: string;
  account?: { username?: string; [key: string]: unknown };
  insights?: InstagramInsights;
  error?: string;
}

/** Métricas que la IA extrae de una captura de pantalla. */
export interface ScreenshotScanResult {
  platform?: string;
  account_handle?: string;
  followers?: number;
  reach?: number;
  impressions?: number;
  posts_count?: number;
  confidence?: number;
  summary?: string;
}
