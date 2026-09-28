import { dbGetConcerts, dbGetUsers, dbGetUserBands } from "../db.js";
import { Concert, Lead } from "../../src/types.js";
import { getAiClient } from "../ai.js";
import { Type } from "@google/genai";
import { loadState } from "../state.js";
import { cleanBandId } from "../db/core.js";

export interface TacticalEvaluation {
  intencion_sala: "consulta_disponibilidad" | "contraoferta_precio" | "peticion_rider_tecnico" | "confirmacion_directa" | "rechazo_o_lleno" | "otro";
  resumen_intencion: string;
  propuesta_economica_sala_eur: number | null;
  fechas_mencionadas: string[];
  nivel_interes: "alto" | "medio" | "bajo" | "negativo";
  accion_estrategica_recomendada: string;
}

export interface MemberCrossConflict {
  fecha: string;
  musicoNombre: string;
  otraBandaNombre: string;
  lugar: string;
  ciudad: string;
}

export interface OperationalContext {
  conciertosProximos: Array<{ fecha: string; ciudad: string; lugar: string }>;
  conflictosMiembrosOtrasBandas: MemberCrossConflict[];
  fechasOcupadas: string[];
  ciudadesEnRuta: string[];
  cacheMinimoSugerido: number | null;
  resumenTacticoParaPrompt: string;
}

/**
 * Detecta miembros de la banda actual que tocan en otras bandas del sistema y recupera
 * sus conciertos para advertir de solapamientos reales en el calendario.
 */
async function getMemberCrossBandConflicts(currentBandId: string): Promise<MemberCrossConflict[]> {
  const conflicts: MemberCrossConflict[] = [];
  const cleanCurrent = cleanBandId(currentBandId);

  try {
    // 1. Obtener miembros de la banda actual
    const currentMembers = await dbGetUsers(currentBandId);
    if (!currentMembers || currentMembers.length === 0) return [];

    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 86400000 * 2);

    for (const member of currentMembers) {
      const memberName = member.name || member.username || "Integrante";
      const userEmail = (member.email || "").toLowerCase().trim();
      const userId = member.id;

      // 2. Localizar otras bandas donde participa este músico
      const otherBands: Array<{ id: string; name: string }> = [];

      // A) Revisar user_bands
      try {
        const uBands = await dbGetUserBands(userId);
        for (const ub of uBands) {
          const cId = cleanBandId(ub.band_id);
          if (cId && cId !== cleanCurrent && !otherBands.some(b => cleanBandId(b.id) === cId)) {
            const bName = ub.band_name || ub.bandName || `Banda ${cId}`;
            otherBands.push({ id: ub.band_id, name: bName });
          }
        }
      } catch (err) {
        // Fallback silencioso
      }

      // B) Revisar bandas registradas donde es owner/contacto
      if (userEmail) {
        const currentState = loadState();
        const regMatches = (currentState?.registeredBands || []).filter(
          (b: any) => (b.email && b.email.toLowerCase().trim() === userEmail) || b.user_id === userId
        );
        for (const reg of regMatches) {
          const cId = cleanBandId(reg.band_id || reg.id);
          if (cId && cId !== cleanCurrent && !otherBands.some(b => cleanBandId(b.id) === cId)) {
            otherBands.push({ id: reg.band_id || reg.id, name: reg.nombre_banda || reg.bandName || `Banda ${cId}` });
          }
        }
      }

      // 3. Para cada otra banda del músico, consultar sus conciertos confirmados
      for (const otherBand of otherBands) {
        try {
          const otherConcerts: Concert[] = await dbGetConcerts(otherBand.id);
          for (const c of otherConcerts || []) {
            const fechaStr = (c as any).fecha || (c as any).date;
            if (!fechaStr) continue;
            const d = new Date(fechaStr);
            if (isNaN(d.getTime()) || d < twoDaysAgo) continue;

            const ciudad = (c as any).ciudad || (c as any).city || (c as any).location || "Por definir";
            const lugar = (c as any).sala || (c as any).venue || (c as any).title || "Concierto";

            conflicts.push({
              fecha: fechaStr,
              musicoNombre: memberName,
              otraBandaNombre: otherBand.name,
              lugar,
              ciudad
            });
          }
        } catch (_) {
          // Continuar con siguientes bandas
        }
      }
    }
  } catch (err) {
    console.warn("[AgentIntel] Notice al evaluar conflictos multibanda de integrantes:", err);
  }

  return conflicts;
}

/**
 * 1. OBTENCIÓN DE CONTEXTO OPERATIVO EN TIEMPO REAL
 * Consulta la agenda real de la banda Y de sus integrantes en otros proyectos para evitar solapamientos
 * y sugerir sinergias de ruta geográfica (routing) si la sala está cerca de otra fecha.
 */
export async function getBandOperationalContext(bandId: string, leadCiudad?: string): Promise<OperationalContext> {
  const conciertosProximos: Array<{ fecha: string; ciudad: string; lugar: string }> = [];
  const fechasOcupadas: string[] = [];
  const ciudadesEnRuta: string[] = [];

  try {
    const rawConcerts: Concert[] = await dbGetConcerts(bandId);
    const now = new Date();
    
    // Filtrar fechas futuras o de los próximos 6 meses
    const futuros = (rawConcerts || [])
      .filter(c => {
        const fechaStr = (c as any).fecha || (c as any).date;
        if (!fechaStr) return false;
        const d = new Date(fechaStr);
        return !isNaN(d.getTime()) && d >= new Date(now.getTime() - 86400000 * 2); // desde hace 2 días hacia adelante
      })
      .sort((a, b) => {
        const dateA = new Date((a as any).fecha || (a as any).date).getTime();
        const dateB = new Date((b as any).fecha || (b as any).date).getTime();
        return dateA - dateB;
      });

    for (const c of futuros.slice(0, 10)) {
      const fecha = (c as any).fecha || (c as any).date || "";
      const ciudad = (c as any).ciudad || (c as any).city || (c as any).location || "Por definir";
      const lugar = (c as any).sala || (c as any).venue || (c as any).title || "Concierto";
      conciertosProximos.push({ fecha, ciudad, lugar });
      if (fecha) fechasOcupadas.push(fecha);
      if (ciudad && !ciudadesEnRuta.includes(ciudad.toLowerCase().trim())) {
        ciudadesEnRuta.push(ciudad.toLowerCase().trim());
      }
    }
  } catch (err) {
    console.warn(`[AgentIntel] Notice al recuperar conciertos para contexto operativo (${bandId}):`, err);
  }

  // Comprobar conflictos cruzados de integrantes en otras bandas
  const conflictosMiembrosOtrasBandas = await getMemberCrossBandConflicts(bandId);
  for (const conf of conflictosMiembrosOtrasBandas) {
    if (conf.fecha && !fechasOcupadas.includes(conf.fecha)) {
      fechasOcupadas.push(conf.fecha);
    }
  }

  // Generar bloque formateado de razonamiento para inyectar en el System Prompt
  const lineasAgenda = conciertosProximos.length > 0
    ? conciertosProximos.map(c => `   • ${c.fecha}: ${c.lugar} (${c.ciudad})`).join("\n")
    : "   • No hay conciertos confirmados en la agenda para los próximos meses.";

  const lineasConflictosOtrasBandas = conflictosMiembrosOtrasBandas.length > 0
    ? conflictosMiembrosOtrasBandas.map(
        c => `   ⚠️ [BLOQUEO MULTIBANDA] ${c.fecha}: El músico ${c.musicoNombre} tiene concierto confirmado con su otra banda "${c.otraBandaNombre}" en ${c.lugar} (${c.ciudad}).`
      ).join("\n")
    : "";

  const mencionesRuta = leadCiudad && ciudadesEnRuta.some(c => leadCiudad.toLowerCase().includes(c) || c.includes(leadCiudad.toLowerCase()))
    ? `⚠️ ATENCIÓN MÁNAGER: La banda ya tiene un concierto agendado en la misma zona/provincia (${leadCiudad}). ¡Aprovecha para plantearlo como fecha doble de fin de semana para compartir gastos de desplazamiento!`
    : "";

  const resumenTacticoParaPrompt = `
═════════════════════════════════════════════════════════════════════
🗓️ AGENDA Y CONTEXTO OPERATIVO EN TIEMPO REAL (CONFIDENCIAL):
═════════════════════════════════════════════════════════════════════
1. Conciertos propios cerrados de la banda:
${lineasAgenda}

${lineasConflictosOtrasBandas ? `2. Conflictos de disponibilidad de músicos en otras bandas:\n${lineasConflictosOtrasBandas}\n\n` : ""}${mencionesRuta ? `${mencionesRuta}\n` : ""}REGLAS DE RAZONAMIENTO OPERATIVO:
- Si la sala propone una fecha exacta en la que la banda ya tiene concierto, declina amablemente esa fecha indicando ocupación de agenda y ofrece el fin de semana alternativo más próximo.
- Si la sala propone una fecha en la que un integrante clave tiene concierto con otra banda (aviso de BLOQUEO MULTIBANDA arriba), NUNCA cierres ni aceptes esa fecha. Explica con total profesionalidad y naturalidad que "en esa fecha concreta uno de nuestros integrantes tiene un compromiso artístico previo ineludible", y ofrece de inmediato disponibilidad para el fin de semana previo o posterior.
- Si la fecha está libre para todos, muestra predisposición total para bloquear provisionalmente ese fin de semana.
- Si la sala está en una ciudad donde ya hay fecha cerrada ese mes, menciónalo como un plus ("nos cuadra perfecto porque justo esa semana estamos tocando por la zona").
`;

  return {
    conciertosProximos,
    conflictosMiembrosOtrasBandas,
    fechasOcupadas,
    ciudadesEnRuta,
    cacheMinimoSugerido: null,
    resumenTacticoParaPrompt
  };
}

/**
 * 2. EVALUACIÓN ESTRUCTURADA DE INTENCIÓN (Structured Output con Gemini)
 * Analiza el email recibido de la sala y extrae intenciones, cifras ofertadas y fechas.
 */
export async function evaluateIncomingTactics(
  incomingMessage: string,
  venueInfo: { name?: string; city?: string; tipo?: string }
): Promise<TacticalEvaluation | null> {
  if (!incomingMessage || incomingMessage.trim().length < 5) {
    return null;
  }

  const aiClient = getAiClient();
  if (!aiClient) {
    return null;
  }

  try {
    const prompt = `Actúa como Director de Booking Musical de élite. Analiza este mensaje recibido de un programador o sala de conciertos y extrae la intención táctica exacta.

DATOS DEL REMITENTE:
- Espacio/Sala: ${venueInfo.name || "Desconocido"}
- Ciudad: ${venueInfo.city || "No especificada"}
- Tipo: ${venueInfo.tipo || "sala"}

MENSAJE RECIBIDO:
"""
${incomingMessage.slice(0, 1500)}
"""

Devuelve un JSON estrictamente estructurado según el schema.`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intencion_sala: {
              type: Type.STRING,
              enum: [
                "consulta_disponibilidad",
                "contraoferta_precio",
                "peticion_rider_tecnico",
                "confirmacion_directa",
                "rechazo_o_lleno",
                "otro"
              ]
            },
            resumen_intencion: { type: Type.STRING },
            propuesta_economica_sala_eur: { type: Type.NUMBER, nullable: true },
            fechas_mencionadas: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            nivel_interes: {
              type: Type.STRING,
              enum: ["alto", "medio", "bajo", "negativo"]
            },
            accion_estrategica_recomendada: { type: Type.STRING }
          },
          required: [
            "intencion_sala",
            "resumen_intencion",
            "fechas_mencionadas",
            "nivel_interes",
            "accion_estrategica_recomendada"
          ]
        }
      }
    });

    const parsedText = response.text;
    if (!parsedText) return null;

    const evaluation = JSON.parse(parsedText) as TacticalEvaluation;
    return evaluation;
  } catch (err) {
    console.warn("[AgentIntel] Notice evaluando intenciones tácticas estructuradas con Gemini:", err);
    return null;
  }
}
