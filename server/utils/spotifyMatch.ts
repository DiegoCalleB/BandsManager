/**
 * Elige, entre los resultados de la búsqueda de Spotify, el artista que es de verdad la banda
 * buscada. Pura y sin red: la usan el Scout y el enriquecimiento de bandas para rellenar
 * `spotify_youtube` con un enlace VERIFICADO en vez del que se inventa el modelo.
 *
 * Regla: un enlace equivocado es peor que ninguno (el botón «Escuchar» reproduciría a otro
 * artista), así que solo se acepta un nombre idéntico tras normalizar, y solo IDs reales de
 * Spotify (22 caracteres). Los resultados de reserva de Deezer/iTunes (`dz_…`, `it_…`,
 * `search_…`) se descartan.
 */

export interface CandidatoSpotify {
  id?: string;
  name?: string;
  followers?: number;
  popularity?: number;
}

const ID_SPOTIFY = /^[A-Za-z0-9]{22}$/;

export function normalizarNombreArtista(nombre: string): string {
  return (nombre || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/^the /, '')
    .trim();
}

export function elegirArtistaSpotify(
  nombreBanda: string,
  candidatos: CandidatoSpotify[],
): { id: string; url: string } | null {
  const buscado = normalizarNombreArtista(nombreBanda);
  if (!buscado) return null;

  const coincidencias = (candidatos || []).filter(
    (c) => c?.id && ID_SPOTIFY.test(c.id) && normalizarNombreArtista(c.name || '') === buscado,
  );
  if (coincidencias.length === 0) return null;

  // Si hay homónimos, el más seguido (y popular) es el que el booker espera.
  coincidencias.sort(
    (a, b) =>
      (b.followers || 0) - (a.followers || 0) || (b.popularity || 0) - (a.popularity || 0),
  );
  const id = coincidencias[0].id as string;
  return { id, url: `https://open.spotify.com/artist/${id}` };
}

export type EstadoSpotifyBanda = 'vacio' | 'valido' | 'invalido' | 'otro';

/**
 * Qué hay guardado en `spotify_youtube`: nada, un artista de Spotify con ID real, un enlace de
 * Spotify roto (ID inventado, búsqueda, perfil sin ID...) u otra cosa (YouTube, web) que no se toca.
 */
export function estadoSpotifyBanda(valor?: string | null): EstadoSpotifyBanda {
  const texto = (valor || '').trim();
  if (!texto) return 'vacio';
  const conId =
    /spotify\.com\/(?:intl-[a-z]{2}(?:-[a-z]{2})?\/)?artist\/[A-Za-z0-9]{22}(?![A-Za-z0-9])/i.test(texto) ||
    /^spotify:artist:[A-Za-z0-9]{22}$/i.test(texto);
  if (conId) return 'valido';
  if (/spotify\.com|^spotify:/i.test(texto)) return 'invalido';
  return 'otro';
}

export interface PlanSpotifyBanda {
  accion: 'completar' | 'reemplazar' | 'mantener' | 'sin_sustituto';
  nuevo?: string;
}

/**
 * Decide qué hacer con una banda ya guardada. Nunca borra: un enlace roto sin sustituto
 * verificado se deja como está y se informa (`sin_sustituto`).
 * `enlaceRoto`: el ID tiene formato válido pero Spotify responde 404 (artista inexistente).
 */
export function planificarSpotifyBanda(
  valorActual: string | null | undefined,
  urlVerificada: string,
  enlaceRoto = false,
): PlanSpotifyBanda {
  const estado = enlaceRoto ? 'invalido' : estadoSpotifyBanda(valorActual);
  if (estado === 'valido' || estado === 'otro') return { accion: 'mantener' };
  if (!urlVerificada) return estado === 'invalido' ? { accion: 'sin_sustituto' } : { accion: 'mantener' };
  return { accion: estado === 'vacio' ? 'completar' : 'reemplazar', nuevo: urlVerificada };
}
