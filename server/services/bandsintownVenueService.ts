import { getAiClient, generateContentWithFallback } from "../ai.js";
import { safeParseJson } from "../utils.js";

export interface BandsintownVenueEvent {
  nombre_sala: string;
  ciudad: string;
  pais: string;
  fecha?: string;
  artista_referencia: string;
  nombre_evento: string;
  url_evento?: string;
  aforo_estimado?: number;
  fuente: string;
}

export async function getVenuesFromBandsintown(params: {
  artistName: string;
  targetCities?: string[];
  limit?: number;
}): Promise<BandsintownVenueEvent[]> {
  const artistName = params.artistName.trim();
  if (!artistName) return [];
  const apiKey = process.env.BANDSINTOWN_API_KEY || process.env.BANDSINTOWN_APP_ID || "";
  const limit = Math.max(1, Math.min(25, params.limit || 10));
  const results: BandsintownVenueEvent[] = [];

  if (apiKey) {
    try {
      const encArtist = encodeURIComponent(artistName);
      const url = `https://rest.bandsintown.com/artists/${encArtist}/events?app_id=${encodeURIComponent(apiKey)}&date=all`;
      const res = await fetch(url, {
        headers: { "Accept": "application/json" }
      });
      if (res.ok) {
        const events = await res.json();
        if (Array.isArray(events)) {
          events.forEach((ev: any) => {
            if (ev.venue?.name) {
              const city = ev.venue.city || "España";
              if (!params.targetCities || params.targetCities.length === 0 || params.targetCities.some((c) => city.toLowerCase().includes(c.toLowerCase()))) {
                results.push({
                  nombre_sala: ev.venue.name,
                  ciudad: city,
                  pais: ev.venue.country || "España",
                  fecha: ev.datetime ? ev.datetime.split("T")[0] : undefined,
                  artista_referencia: artistName,
                  nombre_evento: ev.title || `Concierto de ${artistName}`,
                  url_evento: ev.url || undefined,
                  fuente: "Bandsintown API"
                });
              }
            }
          });
          if (results.length > 0) {
            return results.slice(0, limit);
          }
        }
      }
    } catch (err: any) {
      console.warn(`[Bandsintown API] Error consultando eventos para ${artistName}:`, err?.message);
    }
  }

  try {
    const client = getAiClient();
    if (client) {
      const prompt = `Actúa como un Booking Manager especializado en la escena de directo de España.
Artista analizado: "${artistName}".
${params.targetCities && params.targetCities.length > 0 ? `Ciudades objetivo prioritarias: ${params.targetCities.join(", ")}.` : ""}

Identifica los recintos de directo, salas de conciertos y festivales REALES donde el artista "${artistName}" ha tocado recientemente o en sus últimas giras en España.

Devuelve un JSON con este formato exacto:
{
  "venues": [
    {
      "nombre_sala": "Nombre exacto de la sala o festival",
      "ciudad": "Ciudad",
      "pais": "España",
      "aforo_estimado": 400,
      "nombre_evento": "Gira / Fecha de ${artistName}"
    }
  ]
}

Devuelve máximo ${limit} salas o recintos REALES.`;
      const aiRes = await generateContentWithFallback(client, {
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2
        }
      });
      const parsed = safeParseJson(aiRes.text || "{}");
      if (parsed && Array.isArray(parsed.venues)) {
        parsed.venues.forEach((v: any) => {
          if (v.nombre_sala) {
            results.push({
              nombre_sala: v.nombre_sala,
              ciudad: v.ciudad || (params.targetCities ? params.targetCities[0] : "Madrid"),
              pais: v.pais || "España",
              aforo_estimado: typeof v.aforo_estimado === "number" ? v.aforo_estimado : undefined,
              artista_referencia: artistName,
              nombre_evento: v.nombre_evento || `Concierto de ${artistName}`,
              fuente: "Bandsintown Radar IA"
            });
          }
        });
      }
    }
  } catch (err: any) {
    console.warn(`[Bandsintown Radar] Error en radar IA de ${artistName}:`, err?.message);
  }

  return results.slice(0, limit);
}
