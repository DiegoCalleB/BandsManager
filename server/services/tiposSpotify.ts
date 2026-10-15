/**
 * Formas de las respuestas de las APIs públicas de catálogo que lee `spotifyService.ts`
 * (Spotify Web API, Deezer, iTunes). Solo se declaran los campos que el código usa; todos
 * opcionales salvo los identificadores, porque cada catálogo omite lo que no tiene.
 */

/** Imagen de Spotify (artista o álbum). */
interface ImagenSpotify {
  url?: string;
}

/** Artista de la Spotify Web API (`/v1/artists/{id}` o resultados de `/v1/search`). */
export interface ArtistaSpotifyApi {
  id: string;
  name: string;
  genres?: string[];
  followers?: { total?: number };
  popularity?: number;
  images?: ImagenSpotify[];
  external_urls?: { spotify?: string };
  uri: string;
}

/** Álbum de `/v1/artists/{id}/albums` y `/v1/albums?ids=`. */
export interface AlbumSpotifyApi {
  id: string;
  name: string;
  album_type?: string;
  release_date?: string;
  total_tracks?: number;
  images?: ImagenSpotify[];
  external_urls?: { spotify?: string };
  uri?: string;
  genres?: string[];
  tracks?: { items?: PistaSpotifyApi[] };
}

/** Pista de un álbum de la Spotify Web API. */
export interface PistaSpotifyApi {
  id: string;
  name: string;
  track_number?: number;
  disc_number?: number;
  duration_ms?: number;
  preview_url?: string | null;
  explicit?: boolean;
  external_urls?: { spotify?: string };
  uri: string;
  external_ids?: { isrc?: string };
}

/** Artista de Deezer (`/search/artist`). */
export interface ArtistaDeezer {
  id: number | string;
  name?: string;
  nb_fan?: number;
  picture_medium?: string;
  picture_big?: string;
  picture_xl?: string;
}

/** Pista de Deezer (`/album/{id}/tracks`). */
export interface PistaDeezer {
  id: number | string;
  title: string;
  /** Segundos. */
  duration?: number;
  track_position?: number;
  disk_number?: number;
  preview?: string;
  explicit_lyrics?: boolean;
  isrc?: string;
}

/** Artista de iTunes (`/search?entity=musicArtist`). */
export interface ArtistaItunes {
  artistId?: number;
  artistName?: string;
  primaryGenreName?: string;
  artistLinkUrl?: string;
}

/** Elemento de `/lookup?entity=song` de iTunes (la primera fila es la colección, no una pista). */
export interface PistaItunes {
  wrapperType?: string;
  trackId: number;
  trackName: string;
  trackTimeMillis?: number;
  trackNumber?: number;
  discNumber?: number;
  previewUrl?: string;
  trackExplicitness?: string;
  isrc?: string;
}
