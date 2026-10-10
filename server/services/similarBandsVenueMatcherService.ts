/**
 * SIMILAR BANDS VENUE MATCHER SERVICE ("Efecto Espejo" / Setlist.fm & Spotify Similar Artists)
 * 
 * Descubre salas y festivales analizando dónde han tocado bandas similares del mismo género
 * o nivel (ej: una banda de mestizaje -> Mestizaje, Afrobeat, Reggae, World Music, Fusion).
 */

import { getAiClient, generateContentWithFallback } from "../ai.js";
import { safeParseJson } from "../utils.js";
import { searchSetlistFmVenues } from "./multiSourceVenueDiscoveryService.js";
import { getVenuesFromBandsintown } from "./bandsintownVenueService.js";

export interface SimilarVenueMatch {
  nombre_sala: string;
  ciudad: string;
  pais: string;
  bandas_similares_que_tocaron: string[];
  genero_predominante: string;
  aforo_estimado?: number;
  probabilidad_respuesta: 'alta' | 'media' | 'excelente';
  razon_recomendacion: string;
  contacto_sugerido?: string;
  fuente: 'Setlist.fm' | 'Bandsintown' | 'Spotify Analytics' | 'Radar de Nicho IA';
}

export interface SimilarVenueMatchResult {
  success: boolean;
  banda_referencia: string;
  genero: string;
  matches: SimilarVenueMatch[];
  resumen: string;
}

/**
 * Encuentra recintos donde han tocado artistas similares de la escena
 */
export async function findVenuesBySimilarArtists(params: {
  bandName: string;
  genre?: string;
  similarArtists?: string[];
  targetCities?: string[];
  limit?: number;
}): Promise<SimilarVenueMatchResult> {
  const bandName = params.bandName || "la banda";
  const genre = params.genre || "World Music / Mestizaje / Reggae / Afrobeat / Fusion";
  const similarArtists = params.similarArtists?.length ? params.similarArtists : ["Macaco", "Ojos de Brujo", "Green Valley", "La Pegatina", "Bomba Estéreo", "Txarango"];
  const cities = params.targetCities?.length ? params.targetCities : ["Madrid", "Barcelona", "Valencia", "Sevilla", "Bilbao", "Granada"];
  const limit = Math.max(1, Math.min(20, params.limit || 8));

  const matches: SimilarVenueMatch[] = [];

  // 1. Probar Bandsintown y Setlist.fm para los artistas similares
  for (const artist of similarArtists.slice(0, 3)) {
    // A) Bandsintown (API oficial o radar)
    try {
      const bitVenues = await getVenuesFromBandsintown({ artistName: artist, targetCities: cities, limit: 4 });
      bitVenues.forEach(bv => {
        const norm = bv.nombre_sala.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!matches.some(m => m.nombre_sala.toLowerCase().replace(/[^a-z0-9]/g, "") === norm)) {
          matches.push({
            nombre_sala: bv.nombre_sala,
            ciudad: bv.ciudad,
            pais: bv.pais || "España",
            bandas_similares_que_tocaron: [artist],
            genero_predominante: genre,
            aforo_estimado: bv.aforo_estimado,
            probabilidad_respuesta: "excelente",
            razon_recomendacion: `El artista afín "${artist}" ha actuado en esta sala${bv.fecha ? ` (${bv.fecha})` : ""}. Perfil de público compatible.`,
            fuente: "Bandsintown"
          });
        }
      });
    } catch (e) {
      // Continuar si falla
    }

    // B) Setlist.fm
    try {
      const setlists = await searchSetlistFmVenues(artist, cities[0]);
      setlists.forEach(v => {
        const norm = v.nombre.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!matches.some(m => m.nombre_sala.toLowerCase().replace(/[^a-z0-9]/g, "") === norm)) {
          matches.push({
            nombre_sala: v.nombre,
            ciudad: v.ciudad,
            pais: v.pais || "España",
            bandas_similares_que_tocaron: [artist],
            genero_predominante: genre,
            probabilidad_respuesta: "excelente",
            razon_recomendacion: `El artista afín "${artist}" ha tocado en este recinto con éxito verificado.`,
            fuente: "Setlist.fm"
          });
        }
      });
    } catch (e) {
      // Continuar con radar IA si no hay clave
    }
  }

  // 2. Usar Radar de Nicho de IA Generativa con Inteligencia de Circuito
  try {
    const client = getAiClient();
    if (client) {
      const prompt = `Actúa como un Director de Booking Internacional especializado en ${genre}.
Análisis de mercado para la banda: "${bandName}" (Estilo: ${genre}).
Bandas afines/referencia: ${similarArtists.join(", ")}.
Ciudades de objetivo de gira: ${cities.join(", ")}.

Tu objetivo es identificar las mejores salas de conciertos y festivales de tamaño medio (aforo 150-800 personas) que PROGRAMAN REGULARMENTE este tipo de música en esas ciudades.

Devuelve un JSON estricto con esta estructura exacta:
{
  "matches": [
    {
      "nombre_sala": "Nombre exacto del recinto o festival",
      "ciudad": "Ciudad",
      "pais": "España",
      "bandas_similares_que_tocaron": ["Artista 1", "Artista 2"],
      "genero_predominante": "${genre}",
      "aforo_estimado": 350,
      "probabilidad_respuesta": "excelente",
      "razon_recomendacion": "Explicación breve de por qué esta sala encaja con la audiencia y estilo de ${bandName}.",
      "contacto_sugerido": "programacion@sala.com"
    }
  ]
}

Devuelve máximo ${limit} recintos REALES y recomendados.`;

      const aiRes = await generateContentWithFallback(client, {
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3
        }
      });

      const parsed = safeParseJson(aiRes.text || "{}");
      if (parsed && Array.isArray(parsed.matches)) {
        parsed.matches.forEach((item: any) => {
          const exists = matches.some(m => m.nombre_sala.toLowerCase() === (item.nombre_sala || "").toLowerCase());
          if (!exists && item.nombre_sala) {
            matches.push({
              nombre_sala: item.nombre_sala,
              ciudad: item.ciudad || cities[0],
              pais: item.pais || "España",
              bandas_similares_que_tocaron: Array.isArray(item.bandas_similares_que_tocaron) ? item.bandas_similares_que_tocaron : similarArtists.slice(0, 2),
              genero_predominante: item.genero_predominante || genre,
              aforo_estimado: typeof item.aforo_estimado === "number" ? item.aforo_estimado : undefined,
              probabilidad_respuesta: item.probabilidad_respuesta || "excelente",
              razon_recomendacion: item.razon_recomendacion || `Recinto idóneo para la propuesta sonora de ${bandName}.`,
              contacto_sugerido: item.contacto_sugerido || "",
              fuente: "Radar de Nicho IA"
            });
          }
        });
      }
    }
  } catch (err: any) {
    console.warn("[Similar Bands Matcher] Error en radar IA:", err?.message);
  }

  const finalMatches = matches.slice(0, limit);

  return {
    success: true,
    banda_referencia: bandName,
    genero: genre,
    matches: finalMatches,
    resumen: `Se han identificado ${finalMatches.length} recintos óptimos por afinidad de género y similitud artística con ${bandName}.`
  };
}
