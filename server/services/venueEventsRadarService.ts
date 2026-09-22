/**
 * VENUE EVENTS & AVAILABILITY RADAR (WEGOW / BANDSINTOWN / SONGKICK / DICE / RESIDENT ADVISOR / TICKETING)
 *
 * Escanea la cartelera pública de conciertos de una sala a través de múltiples plataformas agregadas:
 * 1. Bandsintown, Songkick, Wegow, Dice FM, Resident Advisor, Mutick y web oficial.
 * 2. Identifica fechas ocupadas con conciertos ya programados.
 * 3. Deduce fines de semana libres (Viernes y Sábados) en los próximos 60-90 días o fechas de campaña.
 * 4. Alimenta al Redactor IA y al modal de WhatsApp para proponer fechas con alta probabilidad de estar libres.
 */

import { getAiClient, generateContentWithFallback } from "../ai.js";

export interface VenueRadarResult {
  venue_name: string;
  ciudad: string;
  fechas_ocupadas: string[];
  fechas_libres_detectadas: string[];
  conciertos_programados: Array<{ fecha: string; artista?: string }>;
  fuente: string;
  success: boolean;
  error?: string;
}

// Nombres de meses en español para formatear fechas
const MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/**
 * Genera la lista de los próximos fines de semana (Viernes y Sábados) entre 2 semanas y 12 semanas en el futuro
 */
/**
 * Genera la lista de los próximos fines de semana (Viernes y Sábados) entre 2 semanas y 12 semanas en el futuro,
 * anteponiendo las fechas objetivo de cualquier campaña activa.
 */
function parseCampaignDatesToCandidates(campaignTargetDates?: string[] | string): Array<{ isoDate: string; label: string }> {
  if (!campaignTargetDates) return [];
  
  let rawList: string[] = [];
  if (Array.isArray(campaignTargetDates)) {
    rawList = campaignTargetDates;
  } else if (typeof campaignTargetDates === "string") {
    rawList = campaignTargetDates.split(/[,;]/).map(s => s.trim()).filter(Boolean);
  }

  const results: Array<{ isoDate: string; label: string }> = [];

  for (const raw of rawList) {
    if (!raw) continue;
    // Caso ISO date YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const parts = raw.split("-");
      const year = Number(parts[0]);
      const monthIdx = Number(parts[1]) - 1;
      const dayNum = Number(parts[2]);
      const dateObj = new Date(year, monthIdx, dayNum);

      const dayOfWeek = dateObj.getDay();
      const dayName = DIAS_SEMANA[dayOfWeek] || "";
      const monthName = MESES[monthIdx] || "";
      const label = `${dayName ? `${dayName} ` : ""}${dayNum} ${monthName}`.trim();

      results.push({ isoDate: raw, label });
    } else {
      // Caso texto descriptivo ej. "4 dic", "5 de diciembre"
      results.push({ isoDate: "", label: raw });
    }
  }

  return results;
}

function getUpcomingWeekendDates(weeksAhead = 10, campaignTargetDates?: string[] | string): Array<{ isoDate: string; label: string }> {
  const dates: Array<{ isoDate: string; label: string }> = [];
  const campaignCandidates = parseCampaignDatesToCandidates(campaignTargetDates);
  const seenIsoOrLabel = new Set<string>();

  // 1. Añadir primero las fechas objetivo de la campaña
  for (const cc of campaignCandidates) {
    const key = cc.isoDate || cc.label;
    if (!seenIsoOrLabel.has(key)) {
      seenIsoOrLabel.add(key);
      dates.push(cc);
    }
  }

  // 2. Rellenar con los siguientes fines de semana
  const now = new Date();
  const startDay = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

  for (let d = 0; d < weeksAhead * 7; d++) {
    const candidate = new Date(startDay.getTime() + d * 24 * 60 * 60 * 1000);
    const dayOfWeek = candidate.getDay(); // 5 = Viernes, 6 = Sábado
    
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      const year = candidate.getFullYear();
      const month = String(candidate.getMonth() + 1).padStart(2, "0");
      const day = String(candidate.getDate()).padStart(2, "0");
      const isoDate = `${year}-${month}-${day}`;
      
      const dayName = dayOfWeek === 5 ? "Viernes" : "Sábado";
      const monthName = MESES[candidate.getMonth()];
      const label = `${dayName} ${candidate.getDate()} ${monthName}`;

      if (!seenIsoOrLabel.has(isoDate) && !seenIsoOrLabel.has(label)) {
        seenIsoOrLabel.add(isoDate);
        dates.push({ isoDate, label });
      }
    }
  }

  return dates;
}

/**
 * Consulta la programación real de la sala usando Wegow y fuentes de ticketing
 */
export async function detectVenueEventsAndFreeDates(
  venueName: string,
  ciudad = "",
  campaignTargetDates?: string[] | string
): Promise<VenueRadarResult> {
  const cleanVenue = venueName.trim();
  const cleanCity = ciudad.replace(/\s*\([^)]*\)/g, "").trim();

  if (!cleanVenue) {
    return {
      venue_name: venueName,
      ciudad,
      fechas_ocupadas: [],
      fechas_libres_detectadas: [],
      conciertos_programados: [],
      fuente: "error",
      success: false,
      error: "Nombre de sala no proporcionado"
    };
  }

  const upcomingWeekends = getUpcomingWeekendDates(16, campaignTargetDates);

  // 1. Si no hay AI client disponible, calcular fechas modelo tentativas
  const client = getAiClient();
  if (!client) {
    const candidateLabels = upcomingWeekends.slice(0, 6).map(w => w.label);
    return {
      venue_name: cleanVenue,
      ciudad: cleanCity,
      fechas_ocupadas: [],
      fechas_libres_detectadas: candidateLabels,
      conciertos_programados: [],
      fuente: "calendario_estimado",
      success: true
    };
  }

  // 2. Consulta inteligente multi-fuente (Bandsintown, Songkick, Wegow, Dice, Resident Advisor, web oficial) con Search Grounding
  const prompt = `Actúa como un radar integral de booking y carteleras de conciertos en España.
Busca la programación actual y futuros eventos confirmados en plataformas agregadoras (Bandsintown, Songkick, Wegow, Dice FM, Resident Advisor, Mutick) o en la web oficial y venta de entradas para la sala "${cleanVenue}" ${cleanCity ? `en ${cleanCity}` : ""} (España).

Extrae los conciertos y eventos confirmados que tienen fecha programada en los próximos 3 meses o en las fechas objetivo de la campaña.
Devuelve ÚNICAMENTE un JSON con esta estructura exacta:
{
  "conciertos": [
    { "fecha": "YYYY-MM-DD", "artista": "Nombre Artista o Banda" }
  ]
}

Si no encuentras conciertos cerrados o la sala está vacía de programación, devuelve:
{ "conciertos": [] }`;

  try {
    let response: any = null;
    try {
      response = await generateContentWithFallback(client, {
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
    } catch (_err) {
      // Fallback sin tool search si falla cuota
      response = await generateContentWithFallback(client, {
        contents: prompt
      });
    }

    const text = response?.text || "{}";
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const startIdx = cleaned.indexOf("{");
    const endIdx = cleaned.lastIndexOf("}");
    
    let parsed: { conciertos?: Array<{ fecha: string; artista?: string }> } = { conciertos: [] };
    if (startIdx !== -1 && endIdx !== -1) {
      try {
        parsed = JSON.parse(cleaned.substring(startIdx, endIdx + 1));
      } catch (_) {}
    }

    const conciertos = Array.isArray(parsed.conciertos) ? parsed.conciertos : [];
    const occupiedIsoDates = new Set(
      conciertos
        .map(c => (c.fecha || "").trim().slice(0, 10))
        .filter(f => /^\d{4}-\d{2}-\d{2}$/.test(f))
    );

    // 3. Filtrar fines de semana para encontrar fechas libres detectadas
    const freeDatesLabels: string[] = [];
    for (const weekend of upcomingWeekends) {
      if (!occupiedIsoDates.has(weekend.isoDate)) {
        freeDatesLabels.push(weekend.label);
      }
      if (freeDatesLabels.length >= 12) break;
    }

    return {
      venue_name: cleanVenue,
      ciudad: cleanCity,
      fechas_ocupadas: Array.from(occupiedIsoDates),
      fechas_libres_detectadas: freeDatesLabels,
      conciertos_programados: conciertos,
      fuente: "wegow_radar",
      success: true
    };
  } catch (err: any) {
    console.warn(`[VenueRadar] Error detectando fechas para "${cleanVenue}":`, err?.message || err);
    // Fallback con fines de semana de referencia
    const fallbackDates = upcomingWeekends.slice(0, 4).map(w => w.label);
    return {
      venue_name: cleanVenue,
      ciudad: cleanCity,
      fechas_ocupadas: [],
      fechas_libres_detectadas: fallbackDates,
      conciertos_programados: [],
      fuente: "fallback_estimado",
      success: true
    };
  }
}
