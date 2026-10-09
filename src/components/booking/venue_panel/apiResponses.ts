/**
 * Contratos de respuesta de los endpoints /api/leads/* que consume el panel de sala.
 * Existen para tipar `apiFetch<T>` en lugar de `any`: solo declaran los campos que el panel lee.
 */
import type { EmailMessage,Lead } from "../../../types";

/** Respuesta común de los endpoints de enriquecimiento que devuelven el lead actualizado. */
export interface LeadMutationResponse {
  success?: boolean;
  error?: string;
  lead?: Lead;
}

/** Radar de fechas (Wegow + Bandsintown) devuelto por `/detect-dates`. */
export interface DateRadarResponse extends LeadMutationResponse {
  radar?: {
    fechas_libres_detectadas?: string[];
    fechas_ocupadas?: unknown[];
    contrastado_multi_fuente?: boolean;
    datos_fechas_encontrados?: boolean;
    is_campaign_active?: boolean;
    mensaje_disponibilidad?: string;
  };
}

/** Respuesta de `/enrich-instagram`; `data` trae avisos del plan gratuito de Apify. */
export interface InstagramEnrichmentResponse extends LeadMutationResponse {
  data?: { apify_free_tier_info?: string };
}

/** Análisis de sentimiento de un mensaje entrante (`/analyze-sentiment`). */
export interface SentimentAnalysis {
  sentimiento?: EmailMessage["sentimiento"];
  sentimiento_score?: number;
  sentimiento_label?: string;
  intencion?: EmailMessage["intencion"];
  intencion_etiqueta?: string;
  temperatura?: EmailMessage["temperatura"];
  objeciones_detectadas?: string[];
  puntos_clave?: string[];
  resumen_ejecutivo?: string;
  sugerencia_estrategia?: string;
}

/** Respuesta de `/analyze-sentiment`. */
export interface SentimentResponse {
  success?: boolean;
  sentimentAnalysis?: SentimentAnalysis;
}
