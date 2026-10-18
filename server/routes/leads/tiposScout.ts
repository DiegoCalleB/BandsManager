/**
 * Tipos de las respuestas externas que manejan el Scout y el enriquecimiento de leads
 * (Google Places API (New), Nominatim y los JSON que devuelve la IA). Solo declaran los campos que
 * el código lee: todo es opcional porque viene de fuera y puede faltar.
 */
import type { Lead } from '../../../src/types.js';
import type { generateContentWithFallback } from '../../ai.js';

/** Respuesta de `generateContentWithFallback`. */
export type RespuestaIA = Awaited<ReturnType<typeof generateContentWithFallback>>;

/** Lugar de `places:searchText` (Google Places API (New)) con la FieldMask que se pide. */
export interface LugarGooglePlaces {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  types?: string[];
  photos?: { name?: string }[];
  businessStatus?: string;
}

/** Cuerpo de la respuesta de `places:searchText`. */
export interface RespuestaBusquedaPlaces {
  places?: LugarGooglePlaces[];
}

/** Resultado de la búsqueda de Nominatim (OpenStreetMap). */
export interface LugarNominatim {
  display_name?: string;
}

/** Sala, recinto o grupo candidato que propone el Scout (Places o IA), aún fuera del CRM. */
export interface CandidatoScout {
  place_id?: string;
  id?: string;
  nombre_sala?: string;
  ciudad?: string;
  region?: string;
  direccion?: string;
  telefono?: string;
  website?: string;
  rating?: number | null;
  user_ratings_total?: number | null;
  tipo?: string;
  aforo?: number;
  genero?: string;
  descripcion?: string;
  imagen_url?: string;
  icono?: string;
  email_contacto?: string;
  fuente?: string;
}

/** Candidato de la búsqueda masiva ya cruzado con el CRM de la banda. */
export interface CandidatoCruzado extends CandidatoScout {
  alreadyInCrm: boolean;
  crmStatus: string | null;
  crmId: string | null;
  crmNombre: string | null;
  capacityMatch: boolean;
  selected: boolean;
}

/** Contacto que la IA extrae para un candidato (POST /extract-emails). */
export interface ContactoExtraido {
  id?: string;
  nombre_sala?: string;
  email_contacto?: string;
  instagram?: string;
  contacto_nombre?: string;
  confianza?: string;
  fuente?: string;
}

/** JSON que devuelve la IA en las búsquedas del Scout. */
export interface RespuestaScoutIA {
  results?: CandidatoScout[];
  extracted?: ContactoExtraido[];
}

/** Lead del CRM con el `place_id` de Google que guardan los importados desde Places. */
export type LeadConocido = Lead & { place_id?: string };

/** Ficha de una sala que la IA busca en la web (POST /leads/ai-lookup). */
export interface FichaSalaIA {
  nombre_oficial?: string;
  ciudad?: string;
  website?: string;
  instagram?: string;
  imagen_url?: string;
  icono?: string;
}

/** Dato extraído por la IA junto con su confianza y de dónde sale. */
export interface DatoConConfianza {
  valor?: string;
  confianza?: string;
  fuente?: string;
}

/**
 * JSON de contacto que devuelve la IA (POST /scrape-contact). Cada campo suele venir como
 * {@link DatoConConfianza}, aunque a veces llega como texto suelto.
 */
export interface ContactoConConfianzaIA {
  imagen_url?: DatoConConfianza | string | null;
  website?: DatoConConfianza | string | null;
  [campo: string]: unknown;
}
