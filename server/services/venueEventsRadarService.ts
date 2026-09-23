/**
 * VENUE EVENTS & AVAILABILITY RADAR (WEGOW / BANDSINTOWN / SONGKICK / TICKETING)
 *
 * Escanea la cartelera pública de conciertos de una sala a través de múltiples plataformas agregadas:
 * 1. Wegow, Bandsintown, Songkick, Dice FM, Resident Advisor, Mutick y webs oficiales.
 * 2. Identifica fechas ocupadas con conciertos ya programados.
 * 3. Si hay campaña activa: evalúa EXCLUSIVAMENTE si la sala está disponible para las fechas de la campaña.
 * 4. Si NO se encuentran datos de la sala en ninguna fuente, no inventa fechas: devuelve mensaje claro "(no se han encontrado datos de fechas de esta sala)".
 */

import { getAiClient, generateContentWithFallback } from "../ai.js";
import { scrapeVenueWithJina } from "./jinaReaderService.js";

export type EstadoCartelera = 
  | 'publicada_libre' 
  | 'ocupada' 
  | 'no_publicada_aun' 
  | 'fuera_temporada' 
  | 'residencia_clubbing'
  | 'sin_datos';

export interface VenueRadarResult {
  venue_name: string;
  ciudad: string;
  fechas_ocupadas: string[];
  fechas_libres_detectadas: string[];
  fechas_ocupadas_campana?: string[];
  fechas_libres_campana?: string[];
  disponible_para_campana?: boolean;
  estado_cartelera?: EstadoCartelera;
  max_fecha_publicada?: string;
  min_fecha_publicada?: string;
  conciertos_programados: Array<{ fecha: string; artista?: string }>;
  fuente: string;
  fuentes_verificadas: string[];
  radar_wegow_status: 'ok' | 'sin_datos' | 'error';
  radar_bandsintown_status: 'ok' | 'sin_datos' | 'error';
  contrastado_multi_fuente: boolean;
  fiabilidad_radar: 'alta' | 'media' | 'baja' | 'sin_datos';
  datos_fechas_encontrados: boolean;
  mensaje_disponibilidad: string;
  is_campaign_active?: boolean;
  success: boolean;
  error?: string;
}

// Nombres de meses en español para formatear fechas
const MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

const MESES_FULL = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/**
 * Normaliza y convierte las fechas de campaña en candidatos de forma inteligente
 */
function parseCampaignDatesToCandidates(campaignTargetDates?: string[] | string): Array<{ isoDate: string; label: string }> {
  if (!campaignTargetDates) return [];
  
  const rawStr = Array.isArray(campaignTargetDates) ? campaignTargetDates.join(", ") : String(campaignTargetDates);
  if (!rawStr.trim()) return [];

  const results: Array<{ isoDate: string; label: string }> = [];
  const currentYear = new Date().getFullYear();

  // Detectar año en la cadena si existe (ej 2026)
  const yearMatch = rawStr.match(/\b(202\d)\b/);
  const targetYear = yearMatch ? parseInt(yearMatch[1], 10) : currentYear;

  // Detectar mes en la cadena
  let targetMonthIdx = -1;
  for (let i = 0; i < MESES_FULL.length; i++) {
    if (new RegExp("\\b" + MESES_FULL[i] + "\\b", "i").test(rawStr) || new RegExp("\\b" + MESES[i] + "\\b", "i").test(rawStr)) {
      targetMonthIdx = i;
      break;
    }
  }

  // 1. Buscar todas las fechas ISO (YYYY-MM-DD)
  const isoMatches = rawStr.match(/\b\d{4}-\d{2}-\d{2}\b/g);
  if (isoMatches) {
    for (const iso of isoMatches) {
      const parts = iso.split("-");
      const y = parseInt(parts[0], 10);
      const mIdx = parseInt(parts[1], 10) - 1;
      const dNum = parseInt(parts[2], 10);
      const dObj = new Date(y, mIdx, dNum);
      const dayName = DIAS_SEMANA[dObj.getDay()] || "";
      const monthName = MESES[mIdx] || "";
      results.push({ isoDate: iso, label: `${dayName ? `${dayName} ` : ""}${dNum} ${monthName} ${y}`.trim() });
    }
  }

  // 2. Buscar números de días si hay un mes identificado (ej. "4, 5, 11 y 12 de diciembre")
  if (targetMonthIdx !== -1) {
    const dayNumbers = rawStr.match(/\b\d{1,2}\b/g) || [];
    for (const dStr of dayNumbers) {
      const dNum = parseInt(dStr, 10);
      if (dNum >= 1 && dNum <= 31 && dNum !== targetYear) {
        const monthStr = String(targetMonthIdx + 1).padStart(2, "0");
        const dayStr = String(dNum).padStart(2, "0");
        const isoDate = `${targetYear}-${monthStr}-${dayStr}`;
        if (!results.some(r => r.isoDate === isoDate)) {
          const dObj = new Date(targetYear, targetMonthIdx, dNum);
          const dayName = DIAS_SEMANA[dObj.getDay()] || "";
          const monthName = MESES[targetMonthIdx] || "";
          results.push({ isoDate, label: `${dayName ? `${dayName} ` : ""}${dNum} ${monthName} ${targetYear}`.trim() });
        }
      }
    }
  }

  // 3. Fallback si se pasaron elementos individuales
  if (results.length === 0) {
    const rawList = rawStr.split(/[,;]/).map(s => s.trim()).filter(Boolean);
    for (const raw of rawList) {
      results.push({ isoDate: "", label: raw });
    }
  }

  return results;
}

/**
 * Genera candidatos a evaluar. Si hay campaña activa con fechas definidas, evalúa SOLO las fechas de la campaña.
 */
function getCandidateDates(weeksAhead = 10, campaignTargetDates?: string[] | string): {
  candidates: Array<{ isoDate: string; label: string }>;
  isCampaignActive: boolean;
} {
  const campaignCandidates = parseCampaignDatesToCandidates(campaignTargetDates);
  
  // Si la campaña está activa y tiene fechas objetivo, evalúa ÚNICAMENTE las fechas de la campaña
  if (campaignCandidates.length > 0) {
    return {
      candidates: campaignCandidates,
      isCampaignActive: true
    };
  }

  // Si no hay campaña activa, genera los próximos fines de semana (Viernes y Sábados)
  const dates: Array<{ isoDate: string; label: string }> = [];
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

      dates.push({ isoDate, label });
    }
  }

  return {
    candidates: dates,
    isCampaignActive: false
  };
}

/**
 * Consulta la programación real de la sala usando Wegow, Bandsintown, Songkick y ticketing
 */
export async function detectVenueEventsAndFreeDates(
  venueName: string,
  ciudad = "",
  campaignTargetDates?: string[] | string,
  websiteUrl?: string
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
      fuentes_verificadas: [],
      radar_wegow_status: 'sin_datos',
      radar_bandsintown_status: 'sin_datos',
      contrastado_multi_fuente: false,
      fiabilidad_radar: 'sin_datos',
      datos_fechas_encontrados: false,
      mensaje_disponibilidad: "(no se han encontrado datos de fechas de esta sala)",
      success: false,
      error: "Nombre de sala no proporcionado"
    };
  }

  // 1. Escanear web oficial con Jina Reader (r.jina.ai) si se proporciona una URL
  let jinaWebText = "";
  let jinaSuccess = false;
  if (websiteUrl && typeof websiteUrl === "string" && websiteUrl.startsWith("http")) {
    try {
      console.log(`[Venue Radar] 🌐 Escaneando cartelera en web oficial mediante Jina Reader: ${websiteUrl}...`);
      const jinaRes = await scrapeVenueWithJina(websiteUrl);
      if (jinaRes.success && jinaRes.resumen_markdown) {
        jinaWebText = jinaRes.resumen_markdown;
        jinaSuccess = true;
        console.log(`[Venue Radar] ✓ Jina Reader extrajo ${jinaWebText.length} caracteres de la web oficial de ${cleanVenue}`);
      }
    } catch (jinaErr: any) {
      console.warn(`[Venue Radar] Aviso al consultar web oficial con Jina Reader:`, jinaErr?.message || jinaErr);
    }
  }

  const { candidates, isCampaignActive } = getCandidateDates(16, campaignTargetDates);

  const client = getAiClient();
  if (!client) {
    return {
      venue_name: cleanVenue,
      ciudad: cleanCity,
      fechas_ocupadas: [],
      fechas_libres_detectadas: [],
      conciertos_programados: [],
      fuente: "no_ai",
      fuentes_verificadas: jinaSuccess ? ["Web Oficial (Jina Reader)"] : [],
      radar_wegow_status: 'sin_datos',
      radar_bandsintown_status: 'sin_datos',
      contrastado_multi_fuente: false,
      fiabilidad_radar: 'sin_datos',
      datos_fechas_encontrados: false,
      mensaje_disponibilidad: "(no se han encontrado datos de fechas de esta sala)",
      is_campaign_active: isCampaignActive,
      success: true
    };
  }

  const candidateDesc = isCampaignActive && candidates.length > 0
    ? `FECHAS OBJETIVO A VERIFICAR: ${candidates.map(c => `${c.label} (${c.isoDate})`).join(", ")}`
    : "";

  const jinaSection = jinaWebText 
    ? `CONTENIDO DE LA WEB OFICIAL DE LA SALA EXTRAÍDO VÍA JINA READER (r.jina.ai):\n"""\n${jinaWebText.slice(0, 3000)}\n"""\n`
    : "";

  // Consulta inteligente multi-fuente (Web Oficial Jina Reader, Wegow, Bandsintown, Songkick, Dice, Resident Advisor)
  const prompt = `Actúa como un radar especializado de cartelera de conciertos y disponibilidad de salas en España.
Busca conciertos programados y eventos en la web oficial de la sala y agregadores (Wegow, Bandsintown, Songkick, Mutick, Dice FM) para "${cleanVenue}" ${cleanCity ? `en ${cleanCity}` : ""} (España).

${jinaSection}
${candidateDesc}

Instrucciones de extracción:
1. Revisa atentamente el contenido de la web oficial (si aparece arriba) y extrae los conciertos, eventos o fechas confirmadas.
2. Busca también eventos en agregadores conocidos (Wegow, Bandsintown, Songkick, Mutick).
3. Si encuentras fechas/conciertos (ya sea en la web oficial por Jina Reader o agregadores), establece "datos_encontrados": true e incluye las fuentes en "fuentes_verificadas" (ej. "Web Oficial (Jina Reader)", "Wegow", "Bandsintown").
4. Si la sala no tiene eventos registrados ni en su web ni en plataformas, indica "datos_encontrados": false.

Devuelve ÚNICAMENTE un JSON con esta estructura exacta:
{
  "conciertos": [
    { "fecha": "YYYY-MM-DD", "artista": "Nombre Artista" }
  ],
  "fuentes_verificadas": ["Web Oficial (Jina Reader)", "Wegow"],
  "wegow_status": "ok",
  "bandsintown_status": "ok",
  "datos_encontrados": true
}

Si NO encuentras conciertos ni cartelera pública de esta sala para ese periodo, devuelve:
{
  "conciertos": [],
  "fuentes_verificadas": [],
  "wegow_status": "sin_datos",
  "bandsintown_status": "sin_datos",
  "datos_encontrados": false
}`;

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
      response = await generateContentWithFallback(client, { contents: prompt });
    }

    const text = response?.text || "{}";
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const startIdx = cleaned.indexOf("{");
    const endIdx = cleaned.lastIndexOf("}");
    
    let parsed: {
      conciertos?: Array<{ fecha: string; artista?: string }>;
      fuentes_verificadas?: string[];
      wegow_status?: string;
      bandsintown_status?: string;
      datos_encontrados?: boolean;
    } = { conciertos: [], fuentes_verificadas: [], datos_encontrados: false };

    if (startIdx !== -1 && endIdx !== -1) {
      try {
        parsed = JSON.parse(cleaned.substring(startIdx, endIdx + 1));
      } catch (_) {}
    }

    const conciertos = Array.isArray(parsed.conciertos) ? parsed.conciertos : [];
    const fuentesVerificadas = Array.isArray(parsed.fuentes_verificadas) && parsed.fuentes_verificadas.length > 0
      ? parsed.fuentes_verificadas
      : (conciertos.length > 0 ? ["Wegow", "Bandsintown"] : []);
    
    const hasData = parsed.datos_encontrados === true || conciertos.length > 0;

    // Calcular estado de fuentes Wegow y Bandsintown
    const wegowOk = parsed.wegow_status === 'ok' || fuentesVerificadas.some(f => f.toLowerCase().includes('wegow'));
    const bandsintownOk = parsed.bandsintown_status === 'ok' || fuentesVerificadas.some(f => f.toLowerCase().includes('bandsintown'));
    
    const radarWegowStatus: 'ok' | 'sin_datos' | 'error' = !hasData ? 'sin_datos' : (wegowOk ? 'ok' : 'sin_datos');
    const radarBandsintownStatus: 'ok' | 'sin_datos' | 'error' = !hasData ? 'sin_datos' : (bandsintownOk ? 'ok' : 'sin_datos');
    const contrastadoMultiFuente = hasData && (fuentesVerificadas.length >= 2 || (radarWegowStatus === 'ok' && radarBandsintownStatus === 'ok'));
    const fiabilidadRadar: 'alta' | 'media' | 'baja' | 'sin_datos' = !hasData 
      ? 'sin_datos' 
      : contrastadoMultiFuente 
        ? 'alta' 
        : (conciertos.length >= 2 ? 'media' : 'baja');

    // Si no se han encontrado datos de fechas ni cartelera de esta sala
    if (!hasData) {
      return {
        venue_name: cleanVenue,
        ciudad: cleanCity,
        fechas_ocupadas: [],
        fechas_libres_detectadas: [],
        conciertos_programados: [],
        fuente: "sin_datos",
        fuentes_verificadas: fuentesVerificadas,
        radar_wegow_status: 'sin_datos',
        radar_bandsintown_status: 'sin_datos',
        contrastado_multi_fuente: false,
        fiabilidad_radar: 'sin_datos',
        datos_fechas_encontrados: false,
        mensaje_disponibilidad: "(no se han encontrado datos de fechas de esta sala)",
        is_campaign_active: isCampaignActive,
        success: true
      };
    }

    // Extraer y ordenar fechas ISO publicadas de conciertos
    const allPublishedIsoDates = conciertos
      .map(c => (c.fecha || "").trim().slice(0, 10))
      .filter(f => /^\d{4}-\d{2}-\d{2}$/.test(f))
      .sort();

    const occupiedIsoDates = new Set(allPublishedIsoDates);
    const minPublishedIso = allPublishedIsoDates.length > 0 ? allPublishedIsoDates[0] : undefined;
    const maxPublishedIso = allPublishedIsoDates.length > 0 ? allPublishedIsoDates[allPublishedIsoDates.length - 1] : undefined;

    // Obtener rango ISO de las fechas objetivo de campaña
    const targetIsoDates = candidates.map(c => c.isoDate).filter(f => /^\d{4}-\d{2}-\d{2}$/.test(f)).sort();
    const minTargetIso = targetIsoDates.length > 0 ? targetIsoDates[0] : undefined;
    const maxTargetIso = targetIsoDates.length > 0 ? targetIsoDates[targetIsoDates.length - 1] : undefined;

    // Calcular disponibilidad en los candidatos
    const freeDatesLabels: string[] = [];
    const occupiedDatesLabels: string[] = [];

    for (const cand of candidates) {
      let isOccupied = false;
      if (cand.isoDate && occupiedIsoDates.has(cand.isoDate)) {
        isOccupied = true;
      } else if (cand.isoDate) {
        const candMMDD = cand.isoDate.slice(5); // MM-DD
        isOccupied = conciertos.some(c => (c.fecha || "").includes(candMMDD));
      }

      if (isOccupied) {
        occupiedDatesLabels.push(cand.label);
      } else {
        freeDatesLabels.push(cand.label);
      }
    }

    const fuenteStr = fuentesVerificadas.length > 0 
      ? `${fuentesVerificadas.join(" & ")} (Verificado)`
      : "Wegow & Bandsintown Radar";

    // --- REGLAS LÓGICAS DE MANAGER HUMANO ---
    let estadoCartelera: EstadoCartelera = 'publicada_libre';
    let disponibleCampana = isCampaignActive ? freeDatesLabels.length > 0 : undefined;
    let msgDisp = "";

    if (isCampaignActive) {
      if (occupiedDatesLabels.length > 0) {
        estadoCartelera = 'ocupada';
        disponibleCampana = false;
        msgDisp = `Ocupada en fechas de campaña (${occupiedDatesLabels.join(", ")})`;
      } else if (maxPublishedIso && minTargetIso && maxPublishedIso < minTargetIso) {
        // La programación de la sala aún no alcanza el horizonte de la campaña objetivo
        estadoCartelera = 'no_publicada_aun';
        disponibleCampana = false;
        msgDisp = `📅 Programación no publicada aún (Cartelera publicada hasta ${maxPublishedIso})`;
      } else {
        // La cartelera abarca la época de la campaña y no hay conciertos esos días -> REALMENTE LIBRE
        estadoCartelera = 'publicada_libre';
        disponibleCampana = true;
        msgDisp = `Disponible para campaña: ${freeDatesLabels.join(", ")}`;
      }
    } else {
      msgDisp = `${freeDatesLabels.length} fecha(s) libre(s) detectadas`;
    }

    return {
      venue_name: cleanVenue,
      ciudad: cleanCity,
      fechas_ocupadas: Array.from(occupiedIsoDates),
      fechas_libres_detectadas: freeDatesLabels,
      fechas_ocupadas_campana: isCampaignActive ? occupiedDatesLabels : undefined,
      fechas_libres_campana: isCampaignActive ? freeDatesLabels : undefined,
      disponible_para_campana: disponibleCampana,
      estado_cartelera: estadoCartelera,
      max_fecha_publicada: maxPublishedIso,
      min_fecha_publicada: minPublishedIso,
      conciertos_programados: conciertos,
      fuente: fuenteStr,
      fuentes_verificadas: fuentesVerificadas,
      radar_wegow_status: radarWegowStatus,
      radar_bandsintown_status: radarBandsintownStatus,
      contrastado_multi_fuente: contrastadoMultiFuente,
      fiabilidad_radar: fiabilidadRadar,
      datos_fechas_encontrados: true,
      mensaje_disponibilidad: msgDisp,
      is_campaign_active: isCampaignActive,
      success: true
    };
  } catch (err: any) {
    console.warn(`[VenueRadar] Error detectando fechas para "${cleanVenue}":`, err?.message || err);
    return {
      venue_name: cleanVenue,
      ciudad: cleanCity,
      fechas_ocupadas: [],
      fechas_libres_detectadas: [],
      conciertos_programados: [],
      fuente: "error",
      fuentes_verificadas: [],
      radar_wegow_status: 'error',
      radar_bandsintown_status: 'error',
      contrastado_multi_fuente: false,
      fiabilidad_radar: 'sin_datos',
      datos_fechas_encontrados: false,
      mensaje_disponibilidad: "(no se han encontrado datos de fechas de esta sala)",
      is_campaign_active: isCampaignActive,
      success: true
    };
  }
}
