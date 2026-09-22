/**
 * VENUE & ARTIST INTELLIGENCE SERVICE (SERPER + SPOTIFY)
 *
 * Enriquecimiento en tiempo real para agentes de booking:
 * 1. Serper.dev:
 *    - /search: Busca programación real, carteleras recientes y ciclos culturales de la sala.
 *    - /places: Búsqueda ultra-rápida y estructurada de salas, festivales y recintos de Google Maps.
 *    - /search (contacto): Enriquecimiento quirúrgico de email de programación, aforo, teléfono e Instagram.
 * 2. Spotify: Extrae popularidad, seguidores y géneros para justificar afinidad de público.
 */

import { searchSpotifyArtists } from "./spotifyService.js";

export interface SerperPlaceResult {
  place_id: string;
  nombre_sala: string;
  ciudad: string;
  region: string;
  direccion: string;
  telefono?: string;
  website?: string;
  rating?: number | null;
  ratingCount?: number;
  aforo?: number;
  tipo: string;
  genero?: string;
  descripcion?: string;
  imagen_url?: string;
  icono?: string;
  email_contacto?: string;
  instagram?: string;
  fuente: string;
  latitude?: number;
  longitude?: number;
}

export interface SerperEnrichedContact {
  email?: string;
  aforo?: number;
  telefono?: string;
  website?: string;
  instagram?: string;
  contacto_nombre?: string;
  notas?: string;
  recentSnippets?: string[];
}

interface VenueLiveSnippets {
  recentProgrammingSummary?: string;
  sourceSnippets: string[];
}

// Caché en memoria para no repetir consultas de salas idénticas (TTL 24h)
const venueSearchCache = new Map<string, { timestamp: number; data: VenueLiveSnippets }>();
const venuePlacesCache = new Map<string, { timestamp: number; data: SerperPlaceResult[] }>();
const venueEnrichCache = new Map<string, { timestamp: number; data: SerperEnrichedContact }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Normaliza y limpia emails descartando falsos positivos comunes de código o CDN
 */
function cleanExtractedEmail(emailCandidate?: string): string | undefined {
  if (!emailCandidate) return undefined;
  const clean = emailCandidate.trim().toLowerCase();
  if (
    clean.length < 5 ||
    clean.endsWith(".png") ||
    clean.endsWith(".jpg") ||
    clean.endsWith(".webp") ||
    clean.endsWith(".svg") ||
    clean.endsWith(".js") ||
    clean.endsWith(".css") ||
    clean.includes("example.com") ||
    clean.includes("domain.com") ||
    clean.includes("schema.org") ||
    clean.includes("sentry.io") ||
    clean.includes("w3.org") ||
    clean.includes("wordpress") ||
    clean.includes("gravatar") ||
    clean.includes("google.com")
  ) {
    return undefined;
  }
  return clean;
}

/**
 * Extrae aforo numérico a partir de fragmentos de texto
 */
function extractCapacityFromText(text: string): number | undefined {
  if (!text) return undefined;
  // Patrones tipo: "aforo: 300", "aforo de 250 personas", "capacidad para 400 espectadores"
  const match = text.match(/(?:aforo|capacidad)(?:\s+de|\s+aproximad[ao]\s+de|\s+m[aá]ximo\s+de)?\s*[:]?\s*([0-9]{2,5})\s*(?:personas|espectadores|plazas|asistentes)?/i);
  if (match && match[1]) {
    const val = parseInt(match[1], 10);
    if (val >= 20 && val <= 100000) {
      return val;
    }
  }
  return undefined;
}

/**
 * Extrae teléfono con formato español o internacional
 */
function extractPhoneFromText(text: string): string | undefined {
  if (!text) return undefined;
  const match = text.match(/(?:\+34|0034)?\s*[6-9]\d{2}[\s.-]?\d{3}[\s.-]?\d{3}/);
  if (match) {
    return match[0].replace(/\s+/g, " ").trim();
  }
  return undefined;
}

/**
 * Extrae perfil de Instagram
 */
function extractInstagramFromText(text: string): string | undefined {
  if (!text) return undefined;
  const match = text.match(/https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9_.-]+)\/?/i);
  if (match && match[1] && !["p", "reel", "stories", "explore"].includes(match[1])) {
    return `https://www.instagram.com/${match[1]}/`;
  }
  return undefined;
}

/**
 * BÚSQUEDA DE SALAS, RECINTOS Y FESTIVALES MEDIANTE SERPER PLACES API
 *
 * Utiliza Google Maps en tiempo real vía Serper /places para descubrir recintos activos.
 */
export async function searchVenuesWithSerper(options: {
  query?: string;
  city?: string;
  region?: string;
  type?: string;
  limit?: number;
}): Promise<SerperPlaceResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    return [];
  }

  const { query, city, region, type = "sala", limit = 8 } = options;
  const targetCity = (city || "").trim();
  const lowerTipo = type.toLowerCase();

  // Construir consulta optimizada según categoría
  let targetQuery = (query || "").trim();
  if (!targetQuery) {
    if (lowerTipo.includes("festival")) {
      targetQuery = `festivales de musica en ${targetCity || "España"}`;
    } else if (lowerTipo.includes("ayuntamiento")) {
      targetQuery = `Ayuntamiento de ${targetCity || "Madrid"} concejalia cultura`;
    } else if (lowerTipo.includes("teatro")) {
      targetQuery = `teatros auditorios en ${targetCity || "España"}`;
    } else if (lowerTipo.includes("discoteca")) {
      targetQuery = `discotecas clubs con musica en vivo en ${targetCity || "España"}`;
    } else {
      targetQuery = `salas de conciertos musica en directo en ${targetCity || "España"}`;
    }
  }

  const cacheKey = `places-${targetQuery.toLowerCase()}-${limit}`;
  const cached = venuePlacesCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const serperBody: any = {
      q: targetQuery,
      hl: "es"
    };

    const response = await fetch("https://google.serper.dev/places", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(serperBody),
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      console.warn(`[VenueIntelligence] Serper Places returned status ${response.status}`);
      return [];
    }

    const data = await response.json();
    const rawPlaces = Array.isArray(data.places) ? data.places : [];

    const results: SerperPlaceResult[] = [];
    for (const p of rawPlaces.slice(0, limit)) {
      if (!p.title) continue;

      // Extraer ciudad aproximada de la dirección si no está definida
      const address = p.address || "";
      let resolvedCity = targetCity;
      if (!resolvedCity && address) {
        const parts = address.split(",");
        if (parts.length >= 2) {
          resolvedCity = parts[parts.length - 2].trim().replace(/\d{5}\s*/, "");
        }
      }

      // Resolver icono y estilo según categoría
      let resolvedIcon = "🏛️";
      let resolvedTipo = "sala";
      let resolvedGenre = "Música en Directo / Variado";

      if (lowerTipo.includes("festival") || (p.category && p.category.toLowerCase().includes("festival"))) {
        resolvedTipo = "festival";
        resolvedIcon = "🎪";
        resolvedGenre = "Festivales / Directo / Outdoor";
      } else if (lowerTipo.includes("teatro") || (p.category && p.category.toLowerCase().includes("teatro"))) {
        resolvedTipo = "teatro";
        resolvedIcon = "🎭";
        resolvedGenre = "Acústico / Teatro / Escénico";
      } else if (lowerTipo.includes("discoteca") || (p.category && p.category.toLowerCase().includes("discoteca"))) {
        resolvedTipo = "discoteca";
        resolvedIcon = "🪩";
        resolvedGenre = "Club / DJs / Sesiones";
      } else if (lowerTipo.includes("ayuntamiento")) {
        resolvedTipo = "ayuntamiento";
        resolvedIcon = "🏛️";
        resolvedGenre = "Fiestas Patronales / Cultura";
      }

      const placeId = p.cid ? `serper-cid-${p.cid}` : `serper-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

      results.push({
        place_id: placeId,
        nombre_sala: p.title,
        ciudad: resolvedCity || "España",
        region: region || resolvedCity || "España",
        direccion: address,
        telefono: p.phoneNumber || "",
        website: p.website || "",
        rating: typeof p.rating === "number" ? p.rating : null,
        ratingCount: p.ratingCount || 0,
        aforo: 0,
        tipo: resolvedTipo,
        genero: resolvedGenre,
        descripcion: p.category ? `${p.category} en ${resolvedCity || "España"}.` : `Recinto para música en directo en ${resolvedCity || "España"}.`,
        icono: resolvedIcon,
        email_contacto: "",
        fuente: "Serper Google Places",
        latitude: p.latitude,
        longitude: p.longitude
      });
    }

    venuePlacesCache.set(cacheKey, {
      timestamp: Date.now(),
      data: results
    });

    return results;
  } catch (err: any) {
    console.warn("[VenueIntelligence] Serper Places search notice:", err?.message || err);
    return [];
  }
}

/**
 * ENRIQUECIMIENTO QUIRÚRGICO DE CONTACTO Y FICHA TÉCNICA MEDIANTE SERPER SEARCH
 *
 * Busca en Google snippets donde figuren el email de booking, aforo, teléfono oficial y web.
 */
export async function enrichVenueDetailsWithSerper(
  venueName: string,
  city?: string
): Promise<SerperEnrichedContact | null> {
  const cleanVenue = (venueName || "").trim();
  if (!cleanVenue) return null;

  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    return null;
  }

  const cleanCity = (city || "").replace(/\s*\([^)]*\)/g, "").trim();
  const cacheKey = `enrich-${cleanVenue.toLowerCase()}-${cleanCity.toLowerCase()}`;
  const cached = venueEnrichCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const query = `"${cleanVenue}" ${cleanCity} contacto programacion booking geral email aforo telefono`.trim();

    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        q: query,
        hl: "es",
        num: 8
      }),
      signal: AbortSignal.timeout(4000)
    });

    if (!response.ok) {
      console.warn(`[VenueIntelligence] Serper contact search status ${response.status}`);
      return null;
    }

    const data = await response.json();
    const organic = Array.isArray(data.organic) ? data.organic : [];

    let extractedEmail: string | undefined;
    let extractedAforo: number | undefined;
    let extractedPhone: string | undefined;
    let extractedWebsite: string | undefined;
    let extractedInstagram: string | undefined;
    const snippets: string[] = [];

    // 1. Revisar si hay un Knowledge Graph con teléfono o web
    if (data.knowledgeGraph) {
      if (data.knowledgeGraph.website) extractedWebsite = data.knowledgeGraph.website;
      if (data.knowledgeGraph.phone) extractedPhone = data.knowledgeGraph.phone;
    }

    // 2. Analizar cada resultado orgánico
    for (const item of organic) {
      const fullText = `${item.title || ""} ${item.snippet || ""}`;
      snippets.push(fullText);

      // Web oficial: Si el link es relevante y no tenemos web aún
      if (!extractedWebsite && item.link) {
        try {
          const urlObj = new URL(item.link);
          const domain = urlObj.hostname.replace(/^www\./, "");
          // Excluir directorios o redes genéricas para no poner Facebook como web oficial si hay web propia
          if (
            !domain.includes("facebook.com") &&
            !domain.includes("instagram.com") &&
            !domain.includes("twitter.com") &&
            !domain.includes("salasdeconcierto.net") &&
            !domain.includes("tripadvisor") &&
            !domain.includes("wikipedia.org")
          ) {
            extractedWebsite = urlObj.origin;
          }
        } catch (_) {}
      }

      // Email en snippet o título
      if (!extractedEmail) {
        const emailMatches = fullText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
        if (emailMatches) {
          for (const cand of emailMatches) {
            const clean = cleanExtractedEmail(cand);
            if (clean) {
              // Prioridad si contiene palabras de booking/programación
              if (/programacion|booking|conciertos|sala|info|contacto/i.test(clean)) {
                extractedEmail = clean;
                break;
              } else if (!extractedEmail) {
                extractedEmail = clean;
              }
            }
          }
        }
      }

      // Aforo
      if (!extractedAforo) {
        const capacity = extractCapacityFromText(fullText);
        if (capacity) extractedAforo = capacity;
      }

      // Teléfono
      if (!extractedPhone) {
        const phone = extractPhoneFromText(fullText);
        if (phone) extractedPhone = phone;
      }

      // Instagram
      if (!extractedInstagram) {
        const insta = extractInstagramFromText(item.link || fullText);
        if (insta) extractedInstagram = insta;
      }
    }

    const result: SerperEnrichedContact = {
      email: extractedEmail,
      aforo: extractedAforo,
      telefono: extractedPhone,
      website: extractedWebsite,
      instagram: extractedInstagram,
      recentSnippets: snippets.slice(0, 3)
    };

    venueEnrichCache.set(cacheKey, {
      timestamp: Date.now(),
      data: result
    });

    return result;
  } catch (err: any) {
    console.warn("[VenueIntelligence] Serper contact enrichment notice:", err?.message || err);
    return null;
  }
}

/**
 * Consulta en tiempo real a Serper.dev para averiguar la cartelera y actualidad de la sala/festival
 */
export async function fetchVenueLiveContext(
  venueName: string,
  city?: string
): Promise<VenueLiveSnippets | null> {
  const cleanVenue = (venueName || "").trim();
  if (!cleanVenue) return null;

  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    return null;
  }

  const cacheKey = `${cleanVenue.toLowerCase()}-${(city || "").toLowerCase()}`;
  const cached = venueSearchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const query = `${cleanVenue} cartelera conciertos ${city || ""}`.trim();

    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        q: query,
        gl: "es",
        hl: "es",
        num: 4
      }),
      signal: AbortSignal.timeout(3500)
    });

    if (!response.ok) {
      console.warn(`[VenueIntelligence] Serper returned status ${response.status}`);
      return null;
    }

    const data = await response.json();
    const organic = Array.isArray(data.organic) ? data.organic : [];

    const snippets: string[] = [];
    for (const item of organic) {
      if (item.snippet) {
        snippets.push(String(item.snippet).replace(/[\r\n]+/g, " ").trim());
      }
    }

    if (snippets.length === 0) {
      return null;
    }

    const result: VenueLiveSnippets = {
      recentProgrammingSummary: snippets.slice(0, 3).join(" | "),
      sourceSnippets: snippets.slice(0, 3)
    };

    venueSearchCache.set(cacheKey, {
      timestamp: Date.now(),
      data: result
    });

    return result;
  } catch (err: any) {
    console.warn("[VenueIntelligence] Serper lookup notice:", err?.message || err);
    return null;
  }
}

/**
 * Obtiene métricas oficiales de Spotify para inyectar tracción verificable en el pitch
 */
export async function fetchBandSpotifyTraction(artistName: string): Promise<{
  followers?: number;
  popularity?: number;
  genres?: string[];
  tractionPill?: string;
} | null> {
  const cleanName = (artistName || "").trim();
  if (!cleanName) return null;

  try {
    const artists = await searchSpotifyArtists(cleanName);
    if (!Array.isArray(artists) || artists.length === 0) {
      return null;
    }

    // Tomar el artista más afín
    const topMatch = artists[0];
    const followers = topMatch.followers || 0;
    const popularity = topMatch.popularity || 0;
    const genres = Array.isArray(topMatch.genres) ? topMatch.genres : [];

    let tractionPill = "";
    if (followers > 500) {
      tractionPill = `${followers.toLocaleString("es-ES")} seguidores en Spotify`;
    } else if (popularity > 15) {
      tractionPill = `índice de popularidad ${popularity}/100 en Spotify`;
    }

    return {
      followers,
      popularity,
      genres,
      tractionPill: tractionPill || undefined
    };
  } catch (err: any) {
    console.warn("[VenueIntelligence] Spotify lookup notice:", err?.message || err);
    return null;
  }
}

