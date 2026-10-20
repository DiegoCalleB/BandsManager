/**
 * Directorio público de salas de conciertos de España. Sale del catálogo compartido (ADR 0044) pero solo con lo PÚBLICO
 * de cada sala y bajo reglas de publicación estrictas (`publicas.ts`). El email y el teléfono no llegan nunca aquí.
 */
import type { NivelSala } from '../../salaCatalogo.js';

/** Fila del catálogo con las columnas que el directorio puede leer (sin email ni teléfono). */
export interface FilaSalaPublica {
  id: string;
  nombre: string;
  ciudad: string | null;
  region: string | null;
  direccion: string | null;
  tipo: string;
  aforo: number | null;
  genero: string | null;
  website: string | null;
  instagram: string | null;
  nivel: NivelSala;
  no_contactar: boolean;
  estado_negocio: 'sin_verificar' | 'operativo' | 'cerrado_temporal' | 'cerrado_permanente' | null;
  fuentes: string[] | null;
  updated_at?: string | null;
}

export interface SalaPublica {
  id: string;
  /** Fragmento de URL de la sala: su nombre más el final de su id, para que dos salas con el mismo nombre no choquen. */
  slug: string;
  nombre: string;
  ciudad: string;
  ciudadSlug: string;
  comunidad: string;
  comunidadSlug: string;
  provincia: string | null;
  direccion: string | null;
  /** Solo si la sala está al menos «probable»: el aforo de una sala sin verificar puede estar mal (hay un «aforo 11» en un pabellón). */
  aforo: number | null;
  genero: string | null;
  web: string;
  instagram: string | null;
  nivel: NivelSala;
  /** Viene (también) de OpenStreetMap: obliga a citarlo (ODbL). */
  deOsm: boolean;
  /** Última modificación del registro (YYYY-MM-DD): alimenta `lastmod` del sitemap y `dateModified`. */
  actualizadoEn: string | null;
}
