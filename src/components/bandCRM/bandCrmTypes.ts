/**
 * Tipos de datos y respuestas de la API del CRM de bandas.
 * Documentan los campos que la UI lee para no usar `any` sobre el JSON de apiFetch.
 */
import type { BandContact } from "../../types";

/** Banda registrada en la plataforma (`/api/registered-bands`); los campos varían según el origen del registro. */
export interface RegisteredBand {
  id?: string | number;
  band_id?: string;
  bandId?: string;
  user_id?: string;
  nombre_banda?: string;
  nombreBanda?: string;
  contacto_nombre?: string;
  email?: string;
  plan?: string;
  estado_cuenta?: string;
  fecha_registro?: string;
  notas?: string;
}

/** Propuesta de datos de una banda devuelta por la búsqueda con IA. */
export interface BandAiProposal {
  biografia?: string;
  contacto_nombre?: string;
  email?: string;
  estilo_musical?: string;
  icono?: string;
  imagen_url?: string;
  instagram?: string;
  localizacion?: string;
  spotify_url?: string;
  telefono?: string;
  youtube_url?: string;
}

/** Respuesta de `/api/bands/ai-lookup`. */
export interface BandAiLookupResponse {
  success?: boolean;
  data?: BandAiProposal;
  error?: string;
}

/** Respuesta de `/api/bands/generate-date-swap-pitch`. */
export interface DateSwapPitchResponse {
  success?: boolean;
  pitch?: string;
  data?: { pitch?: string };
  error?: string;
}

/** Banda sugerida por el scout, con las URL de redes en snake_case. */
export type ScoutedBand = Partial<BandContact> & {
  instagram_url?: string;
  spotify_url?: string;
  youtube_url?: string;
};
