/**
 * Convierte el enlace de Spotify que guarda una banda (`spotify_youtube`, campo libre que
 * también admite YouTube o una web) en la URL del reproductor embebido.
 *
 * Solo devuelve algo si el enlace es de un artista de Spotify con un ID real (22 caracteres
 * base62). El iframe se construye a partir de ese ID validado, nunca del texto del usuario.
 */

const ID_ARTISTA = /^[A-Za-z0-9]{22}$/;
const HOSTS_SPOTIFY = new Set(['open.spotify.com', 'play.spotify.com']);

export function spotifyArtistId(valor?: string | null): string | null {
  const texto = (valor || '').trim();
  if (!texto) return null;

  // URI: spotify:artist:ID
  const uri = /^spotify:artist:([A-Za-z0-9]+)$/.exec(texto);
  if (uri) return ID_ARTISTA.test(uri[1]) ? uri[1] : null;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (!HOSTS_SPOTIFY.has(url.hostname.toLowerCase())) return null;

  // /artist/ID, o con prefijo de idioma: /intl-es/artist/ID
  const partes = url.pathname.split('/').filter(Boolean);
  if (partes[0] && /^intl-[a-z]{2}(-[a-z]{2})?$/i.test(partes[0])) partes.shift();
  if (partes[0] !== 'artist' || !partes[1]) return null;
  return ID_ARTISTA.test(partes[1]) ? partes[1] : null;
}

export function spotifyArtistEmbedUrl(valor?: string | null): string | null {
  const id = spotifyArtistId(valor);
  return id ? `https://open.spotify.com/embed/artist/${id}` : null;
}
