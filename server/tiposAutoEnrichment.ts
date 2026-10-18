/**
 * Formas de los datos externos que lee `auto_enrichment.ts`: el JSON que devuelve la IA y la
 * respuesta de Google Places. Todo es opcional porque viene de fuera y puede faltar cualquier campo.
 */
import type { Lead } from "../src/types.js";

/** Fechas de un festival tal como las devuelve la IA (acepta los alias que suele usar el modelo). */
export interface FechasFestivalIA {
  festival_start_date?: string;
  startDate?: string;
  start_date?: string;
  festival_end_date?: string;
  endDate?: string;
  end_date?: string;
}

/** Lo que se lee de cada lugar en `places:searchText` de Google Places (API New). */
export interface LugarPlaces {
  id?: string;
  businessStatus?: string;
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
}

/** Respuesta de `places:searchText`. */
export interface RespuestaPlacesTextSearch {
  places?: LugarPlaces[];
}

/** Ficha de una sala o medio que devuelve la IA al enriquecer un lead. */
export interface DatosLeadIA {
  ciudad?: string;
  region?: string;
  direccion?: string;
  /** El modelo a veces lo devuelve como texto. */
  aforo?: number | string;
  genero?: string;
  tipo?: string;
  email_contacto?: string;
  telefono?: string;
  website?: string;
  instagram?: string;
  contacto_nombre?: string;
  imagen_url?: string;
  icono?: string;
  notas?: string;
}

/** Ficha de una banda que devuelve la IA al enriquecer un contacto de banda. */
export interface DatosBandaIA {
  estilo_musical?: string;
  localizacion?: string;
  contacto_nombre?: string;
  email?: string;
  telefono?: string;
  instagram?: string;
  spotify_youtube?: string;
  notas_colaboracion?: string;
  ciudad_origen_swap?: string;
  imagen_url?: string;
  icono?: string;
}

/** Resultado de `autoEnrichLead` cuando Google Maps dice que la sala ha cerrado y se borra. */
export type LeadEliminadoPorCierre = Partial<Lead> & {
  id: string;
  nombre_sala: string;
  deleted: true;
  reason: "closed_permanently";
};
