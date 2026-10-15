/**
 * Tipos de las rutas de métricas (metrics.ts): lo que se lee de Meta Graph API / Instagram y el
 * JSON que devuelve la IA al leer una captura. Lo externo va con `?`: puede faltar.
 */

/** Cuenta de Instagram de empresa enlazada a una página de Facebook (`me/accounts`). */
export interface CuentaInstagramNegocio {
  id: string;
  username?: string;
  name?: string;
  followers_count?: number;
  media_count?: number;
}

/** Página de Facebook de `me/accounts`, con su cuenta de Instagram si la tiene. */
export interface PaginaFacebook {
  instagram_business_account?: CuentaInstagramNegocio;
}

/** Cuenta de Instagram ya validada con el token. */
export interface CuentaInstagramVerificada {
  id: string;
  username?: string;
  name?: string;
  followers_count: number | null;
  media_count: number | null;
}

/** Publicación o reel con sus métricas, tal como se devuelve al cliente. */
export interface PublicacionInstagram {
  id: string;
  title: string;
  type: string;
  url?: string;
  thumbnail?: string;
  timestamp?: string;
  likes: number;
  comments: number;
  plays: number;
  reach: number;
  shares: number;
  saved: number;
}

/** Resultado de `fetchInstagramInsightsData`. */
export interface InsightsInstagram {
  /** Perfil tal como lo devuelve Graph API (se reenvía sin tocar). */
  account: Record<string, unknown> | null;
  insights: {
    reach: number;
    impressions: number;
    profile_views: number;
    accounts_engaged: number;
    total_interactions: number;
    follower_count: number;
  };
  media: PublicacionInstagram[];
}

/** JSON que devuelve la IA al leer una captura de estadísticas. */
export interface DatosCapturaIA {
  platform?: string;
  followers?: number | string | null;
  posts_count?: number | string;
  detected_date?: string;
  summary?: string;
  confidence?: string;
  [campo: string]: unknown;
}
