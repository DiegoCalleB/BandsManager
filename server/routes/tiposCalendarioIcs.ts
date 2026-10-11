/**
 * Filas que mezcla el feed de calendario ICS (concerts.ts): vienen de Supabase o, si no hay nada,
 * del estado local, y los registros antiguos traen alias (`band_name`, `setlist_id`, `asistentes`).
 */
import type { Concert, Rehearsal, Setlist, Song, Lead } from '../../src/types.js';

/** Concierto del feed: el de la app, parcial y con los alias legados. */
export type ConciertoDeFeed = Partial<Concert> & { band_name?: string; setlist_id?: string };

/** Ensayo del feed: el de la app, parcial y con los alias legados. */
export type EnsayoDeFeed = Partial<Rehearsal> & { setlist_id?: string; asistentes?: string[] };

/** Tema de un setlist tal como se guarda: con `songId` (app) o `song_id` (filas antiguas). */
export interface TemaDeSetlistFeed {
  id?: string;
  songId?: string;
  song_id?: string;
  titulo?: string;
  nombre?: string;
  tonalidad?: string;
}

/** Setlist de Supabase (columnas snake_case) con sus temas. */
export type SetlistDeFeed = Partial<Omit<Setlist, 'items'>> & {
  duracion_total_estimada_minutos?: number;
  items?: TemaDeSetlistFeed[];
};

/** Canción de Supabase de la que se lee título y tonalidad. */
export type CancionDeFeed = Partial<Song>;

/** Sala del CRM de la que se lee la dirección. */
export type SalaDeFeed = Partial<Lead>;

/** Punto del run of show de un día. */
export interface PuntoRunOfShowFeed {
  time?: string;
  activity?: string;
  done?: boolean;
}

/** Elemento de la lista de material de un día. */
export interface MaterialFeed {
  packed?: boolean;
  item?: string;
  responsible?: string;
}
