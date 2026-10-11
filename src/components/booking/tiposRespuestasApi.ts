/**
 * Formas de las respuestas JSON de los endpoints que consume el CRM de booking.
 * Cada interfaz refleja lo que devuelve el handler de `server/routes/**` (no lo que "convendría"),
 * para usarlas como genérico de `apiFetch<T>()`. Los errores HTTP no llegan aquí: `apiFetch` los
 * convierte en `ApiRequestError` (con el `error`/`message` del cuerpo como mensaje).
 */
import type { Lead, PitchFeedbackLog } from "../../types";
import type { MultiSourceVenueItem, OportunidadCultural, PlaceResult, SimilarVenueItem } from "./google_places/placesModel";
import type { ScrapedField } from "./crm/crmTypes";

/** Ficha de sala que devuelve `POST /api/leads/ai-lookup`. */
export interface FichaSalaBuscada {
  nombre_oficial?: string;
  ciudad?: string;
  website?: string;
  instagram?: string;
  imagen_url?: string;
  icono?: string;
}

/** Respuesta de `POST /api/leads/ai-lookup`. */
export interface RespuestaBuscarFichaSala {
  success?: boolean;
  data?: FichaSalaBuscada;
  error?: string;
}

/** Estadísticas de la cola de agentes. */
export interface EstadisticasColaAgentes {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

/** Trabajo reciente de la cola de agentes tal como lo lista el monitor. */
export interface TrabajoColaAgentes {
  id: string;
  agent_type: string;
  status: string;
  attempts: number;
  error_message?: string;
  scheduled_at: string;
  completed_at?: string;
  created_at: string;
  duration_ms?: number;
}

/** Respuesta de `GET /api/agent-queue/metrics`. */
export interface RespuestaMetricasCola {
  success?: boolean;
  stats?: EstadisticasColaAgentes;
  recentJobs?: TrabajoColaAgentes[];
  workerOnline?: boolean;
}

/** Respuesta de `POST /api/agent-queue/prune`. */
export interface RespuestaPodarCola {
  success?: boolean;
  deletedCount?: number;
  message?: string;
}

/** Datos que `POST /api/leads/enrich-lead` extrae de la sala (campos ya normalizados). */
export interface DatosSalaEnriquecidos {
  email?: string;
  phone?: string;
  website?: string;
  capacity?: number;
  address?: string;
  instagram?: string;
}

/** Respuesta de `POST /api/leads/enrich-lead`. */
export interface RespuestaEnriquecerLead {
  success?: boolean;
  lead?: Lead;
  data?: DatosSalaEnriquecidos;
  message?: string;
  error?: string;
}

/** Respuesta de `POST /api/leads/:id/regenerate-pitch` y `/regenerate-reply`. */
export interface RespuestaRegenerarPitch {
  success?: boolean;
  simulated?: boolean;
  lead?: Lead;
  newPitchText?: string;
  feedbackLog?: PitchFeedbackLog;
  error?: string;
}

/** Datos de contacto que devuelve `POST /api/scrape-contact` (cada campo, suelto o como `{ valor }`). */
export interface DatosContactoRastreados {
  email_contacto?: ScrapedField;
  telefono?: ScrapedField;
  website?: ScrapedField;
  aforo?: ScrapedField;
  region?: ScrapedField;
  genero?: ScrapedField;
  imagen_url?: ScrapedField;
  icono?: ScrapedField;
  source_info?: string;
}

/** Respuesta de `POST /api/scrape-contact`. */
export interface RespuestaRastrearContacto {
  success?: boolean;
  simulated?: boolean;
  isFallback?: boolean;
  data?: DatosContactoRastreados;
  error?: string;
}

/** Respuesta de `GET /api/leads/:id`. */
export interface RespuestaLeadPorId {
  success?: boolean;
  lead?: Lead;
}

/** Respuesta de `POST /api/leads/import-excel` e `/import-places`. */
export interface RespuestaImportarLeads {
  success?: boolean;
  importedCount?: number;
  updatedCount?: number;
  totalLeads?: number;
  leads?: Lead[];
  error?: string;
}

/** Contacto que la IA extrae para una sala en `POST /api/leads/extract-emails`. */
export interface ContactoExtraidoSala {
  id?: string;
  nombre_sala?: string;
  email_contacto?: string;
  instagram?: string;
  contacto_nombre?: string;
  confianza?: string;
  fuente?: string;
}

/** Respuesta de `POST /api/leads/extract-emails`. */
export interface RespuestaExtraerEmails {
  success?: boolean;
  totalProcessed?: number;
  extractedCount?: number;
  extracted?: ContactoExtraidoSala[];
}

/** Respuesta de `POST /api/leads/places-search`. */
export interface RespuestaBuscarSalas {
  success?: boolean;
  isPlacesApi?: boolean;
  source?: string;
  query?: string;
  results?: PlaceResult[];
  error?: string;
}

/** Respuesta de `POST /api/leads/campaign-mass-search`. */
export interface RespuestaBusquedaMasiva {
  success?: boolean;
  bandGenre?: string;
  totalDiscovered?: number;
  newVenuesCount?: number;
  alreadyInCrmCount?: number;
  results?: PlaceResult[];
  error?: string;
}

/** Respuesta de `POST /api/leads/similar-artists-venues` (radar de afinidad). */
export interface RespuestaRadarAfinidad {
  success?: boolean;
  matches?: SimilarVenueItem[];
  error?: string;
}

/** Respuesta de `POST /api/leads/multi-source-venues`. */
export interface RespuestaRadarMultiFuente {
  success?: boolean;
  venues?: MultiSourceVenueItem[];
  fuentes_consultadas?: string[];
  error?: string;
}

/** Respuesta de `POST /api/leads/public-cultural-radar`. */
export interface RespuestaRadarCultural {
  success?: boolean;
  leads_publicos?: OportunidadCultural[];
  error?: string;
}
