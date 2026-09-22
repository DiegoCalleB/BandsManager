/**
 * PITCH ENGINE — MOTOR UNIFICADO DE GENERACIÓN, AUDITORÍA Y APRENDIZAJE DE PITCHES
 *
 * Centraliza la orquestación de prompts, contextualización por ADN de banda,
 * recuperación dinámica de ejemplos few-shot, validación heurística determinista
 * y auto-saneado sintáctico anti-IA (0ms overhead).
 */

import { loadState, saveState, getAutonomyConfigForBand } from "../state.js";
import { dbGetLeadById, dbUpsertLead, dbGetCategoryTemplates, dbRecordCampaignPitchTraining, dbGetActiveCampaign } from "../db.js";
import { generateUnifiedAI, generateMultiModelProposals } from "../ai.js";
import { formatGlobalPitchFeedbackForPrompt } from "../routes/leads/feedback.js";
import { getBandDnaProfile, buildEnhancedPitchSystemPrompt, generateSmartDnaPitchFallback, isCampaignActive, BandDnaProfile } from "../utils/bandDna.js";
import { dbGetDynamicFewShotExamples, formatFewShotExamplesForPrompt, dbRecordPitchHumanEdit } from "../db/pitchLearning.js";
import {
  sanitizeExternalText,
  auditPitchQuality,
  sanitizePitchDeterministically,
  PitchQualityAudit,
  getRecommendedWordRange
} from "../utils/promptSafety.js";
import { findCorridorForCity } from "../../src/utils/tourRouting.js";
import { findSemanticallySimilarPitches } from "./pitchVectorStore.js";
import { evaluateAndRefinePitch } from "./pitchJudge.js";
import { fetchVenueLiveContext, fetchBandSpotifyTraction } from "./venueIntelligenceService.js";

export interface PitchContextResult {
  bandDna: BandDnaProfile;
  systemPrompt: string;
  userPrompt: string;
  tourContext: string | null;
  feedbackDetails: string[];
  links: {
    spotify: string;
    youtube: string;
    epk: string;
  };
  contactEmail: string;
}

export interface MultiPitchProposalWithAudit {
  text: string;
  provider: string;
  audit: PitchQualityAudit;
  sanitizedText: string;
}

export interface GenerateMultiPitchParams {
  leadId: string;
  userBandId: string;
  comentario?: string;
  tono_rating?: number;
  contenido_rating?: number;
  providers?: string[];
  activeCampaign?: any;
}

export interface RegeneratePitchParams {
  leadId: string;
  userBandId: string;
  tono_rating?: number;
  contenido_rating?: number;
  comentario?: string;
  alcance?: "este_pitch" | "global";
  provider?: string;
  modelName?: string;
  activeCampaign?: any;
}

/**
 * Busca conciertos cercanos en la misma ruta geográfica para aportar valor de logística real
 */
export function findNearbyTourContextForLead(lead: any, stateConcerts: any[]): string | null {
  if (!lead?.ciudad || !Array.isArray(stateConcerts) || stateConcerts.length === 0) return null;
  const leadCorridor = findCorridorForCity(lead.ciudad);
  if (!leadCorridor) return null;

  const now = new Date();
  const upcomingConfirmed = stateConcerts.filter((c: any) => {
    if (!c.fecha) return false;
    const cDate = new Date(c.fecha);
    const isFuture = cDate >= now;
    const isConfirmed = c.tipo !== "posible" && !c.is_posible;
    return isFuture && isConfirmed && c.ciudad;
  });

  const nearby = upcomingConfirmed.find((c: any) => {
    const cCorridor = findCorridorForCity(c.ciudad);
    return cCorridor && (cCorridor.key === leadCorridor.key || leadCorridor.info.neighboringCorridors.includes(cCorridor.key));
  });

  if (nearby) {
    const cDate = new Date(nearby.fecha);
    const formattedDate = cDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    return `CONTEXTO DE GIRA / LOGÍSTICA EN RUTA: La banda tiene fecha confirmada en ${nearby.ciudad} (${nearby.sala || "sala"}) para ${formattedDate}. Menciona de pasada que estamos en ruta por la zona para aprovechar el fin de semana.`;
  }
  return null;
}

export class PitchEngine {
  /**
   * Compila el contexto completo de la banda, sala, gira, campana y plantillas de categoría
   */
  static async compileContext(
    userBandId: string,
    lead: any,
    options: {
      activeCampaign?: any;
      comentario?: string;
      tono_rating?: number;
      contenido_rating?: number;
      previousPitch?: string;
      isRegeneration?: boolean;
    } = {}
  ): Promise<PitchContextResult> {
    const state = loadState();

    // 1. Cargar plantillas de categoría si existen
    try {
      const categoryTemplates = await dbGetCategoryTemplates(userBandId);
      state.categoryTemplates = categoryTemplates;
    } catch (err) {
      console.warn("[PitchEngine] No se pudieron cargar plantillas de categoría:", err);
    }

    // 2. ADN de la banda y memoria global
    const bandDna = getBandDnaProfile(state, userBandId, lead);
    const globalMemory = formatGlobalPitchFeedbackForPrompt(state.leads);
    const autonomyConfig = getAutonomyConfigForBand(state, userBandId);
    const bandMinCache = autonomyConfig?.minCacheByType;
    const negotiationStartCacheByType = autonomyConfig?.negotiationStartCacheByType;

    // 3. Dynamic Semantic Vector RAG & Few-Shot In-Context Learning
    try {
      // Prioridad 1: Búsqueda semántica vectorial por afinidad matemática (pgvector)
      const vectorMatches = await findSemanticallySimilarPitches({
        band_id: userBandId,
        lead: {
          nombre_sala: lead.nombre_sala || "",
          tipo: lead.tipo || "sala",
          ciudad: lead.ciudad || "",
          genero: bandDna.genero || "",
          notas: lead.notas || ""
        },
        matchCount: 3,
        threshold: 0.58
      });

      if (vectorMatches.length > 0) {
        const vectorFewShots = vectorMatches.map(vm => ({
          nombre_sala: vm.nombre_sala,
          tipo_entidad: vm.tipo_entidad,
          ciudad: vm.ciudad || "",
          texto_aprobado: vm.texto_pitch,
          resultado_respuesta: vm.resultado_respuesta
        }));
        bandDna.fewShotSection = formatFewShotExamplesForPrompt(vectorFewShots);
      } else {
        // Fallback: Recuperación heurística de hilos pegados y pitch_learning_examples
        const fewShotExamples = await dbGetDynamicFewShotExamples(userBandId, lead, 3);
        if (fewShotExamples.length > 0) {
          bandDna.fewShotSection = formatFewShotExamplesForPrompt(fewShotExamples);
        }
      }
    } catch (err) {
      console.warn("[PitchEngine] Semantic vector / Dynamic few-shot lookup notice:", err);
    }

    // 4. Resolver campaña activa si no fue pasada explícitamente
    let activeCampaign = options.activeCampaign;
    if (!isCampaignActive(activeCampaign)) {
      try {
        activeCampaign = await dbGetActiveCampaign(userBandId);
      } catch (err) {
        console.warn("[PitchEngine] Error obteniendo campaña activa de la BD:", err);
      }
    }

    // 5. Contexto logístico de gira, campaña activa y feedback
    const feedbackDetails: string[] = [];
    const tourContext = findNearbyTourContextForLead(lead, state.concerts);
    if (tourContext) feedbackDetails.push(tourContext);

    const freeDatesList = Array.isArray(lead?.fechas_libres_detectadas) && lead.fechas_libres_detectadas.length > 0 ? lead.fechas_libres_detectadas : [];

    if (isCampaignActive(activeCampaign)) {
      const datesText = activeCampaign.targetDatesText || (Array.isArray(activeCampaign.targetDates) && activeCampaign.targetDates.length > 0 ? activeCampaign.targetDates.join(", ") : "");
      
      let freeDatesInstruction = "";
      if (freeDatesList.length > 0) {
        freeDatesInstruction = `\n4. ⭐ CITA EXPLÍCITA DEL RADAR DE FECHAS LIBRES: El radar ha detectado que en la agenda pública de ${lead?.nombre_sala || "esta sala"} figuran libres estas fechas: ${freeDatesList.join(", ")}. MENCIONA EXPLÍCITAMENTE en el texto del correo que habéis consultado su programación y habéis visto libre el ${freeDatesList[0]} (o alguna de esas fechas detectadas) para proponerla como la fecha perfecta.`;
      }

      feedbackDetails.push(
        `🎯 MANDATO ABSOLUTO DE CAMPAÑA ACTIVA ("${activeCampaign.name}"):\n` +
        `ESTA PROPUESTA DEBE CENTRARSE OBLIGATORIAMENTE EN LA CAMPAÑA ACTIVA DE LA BANDA.\n` +
        `LAS FECHAS OBJETIVO DE ESTA CAMPAÑA SON EXCLUSIVAMENTE: ${datesText || "Diciembre 2026"}.\n` +
        `DIRECTIVAS DE OBLIGADO CUMPLIMIENTO:\n` +
        `1. Propón ÚNICAMENTE las fechas objetivo de esta campaña (${datesText}).\n` +
        `2. En el cuerpo del correo, MENCIONA Y PROPÓN EXPRESAMENTE las fechas objetivo de la campaña (ej. "4, 5, 11 o 12 de diciembre").\n` +
        `3. QUEDA ESTRICTAMENTE PROHIBIDO proponer fechas o meses fuera de la campaña activa (como octubre o noviembre) cuando hay una campaña activa.${freeDatesInstruction}`
      );

      // Si la campaña tiene plantilla personalizada para el tipo de recinto
      const entityTypeKey = (lead.tipo || "salas").toLowerCase();
      const customTpl = activeCampaign.customPitchTemplates?.[entityTypeKey] || activeCampaign.customPitchTemplates?.["salas"];
      if (customTpl && typeof customTpl === "string" && customTpl.trim()) {
        feedbackDetails.push(
          `PLANTILLA BASE DE LA CAMPAÑA: El mánager ha definido este mensaje guía para esta campaña:\n"""\n${customTpl.trim()}\n"""`
        );
      }
    } else if (freeDatesList.length > 0) {
      feedbackDetails.push(
        `RADAR DE DISPONIBILIDAD DEL RECINTO: Se han detectado los siguientes fines de semana libres en la agenda pública de esta sala: ${freeDatesList.join(", ")}. MENCIONA EXPLÍCITAMENTE en el correo que habéis visto libre el ${freeDatesList[0]} en su cartelera y propón esa fecha concreta como la ideal para el concierto.`
      );
    }

    // 5.1 Inyectar Inteligencia Multi-API (Spotify Demand, Setlist.fm histórico, Google Places) si están disponibles
    if (lead?.spotify_city_demand?.oyentes_ciudad) {
      feedbackDetails.push(
        `🎧 INTELIGENCIA SPOTIFY LOCAL (${lead.ciudad || "Madrid"}):\n` +
        `- Oyentes mensuales en la ciudad: ${lead.spotify_city_demand.oyentes_ciudad.toLocaleString()}.\n` +
        `- Afinidad con la escena local: ${lead.spotify_city_demand.afinidad_genero}% match.\n` +
        `- Predicción de venta de entradas para esta sala: ${lead.spotify_city_demand.prediccion_entradas} pax (${lead.spotify_city_demand.porcentaje_ocupacion_estimado}% de su aforo).\n` +
        `Directiva de redacción: Si aporta valor y naturalidad, cita de forma sobria el arrastre de público de la banda en la zona para mitigar el riesgo del programador.`
      );
    }

    if (lead?.setlist_history?.bandas_similares_recientes?.length) {
      const bandas = lead.setlist_history.bandas_similares_recientes.join(", ");
      feedbackDetails.push(
        `🎸 HISTORIAL DE CONCIERTOS SETLIST.FM:\n` +
        `- Bandas afines que han tocado recientemente en ${lead.nombre_sala}: ${bandas}.\n` +
        (lead.setlist_history.referencia_pitch_sugerida ? `- Gancho sugerido: "${lead.setlist_history.referencia_pitch_sugerida}"\n` : "") +
        `Directiva de redacción: Demuestra que conoces la sala y su criterio musical mencionando de forma orgánica cómo el sonido de la banda encaja con la línea artística de bandas afines que han pasado por allí.`
      );
    }

    if (lead?.google_places_info?.resumen_acustica) {
      feedbackDetails.push(
        `🔊 FICHA TÉCNICA DEL ESPACIO: ${lead.google_places_info.resumen_acustica}`
      );
    }

    if (options.tono_rating) feedbackDetails.push(`Puntuación de tono deseado: ${options.tono_rating}/5`);
    if (options.contenido_rating) feedbackDetails.push(`Puntuación de contenido: ${options.contenido_rating}/5`);
    if (options.comentario && options.comentario.trim()) {
      feedbackDetails.push(`Instrucciones específicas del mánager: "${options.comentario.trim()}"`);
    }

    const range = getRecommendedWordRange(lead?.tipo);
    feedbackDetails.push(`Extensión recomendada para esta categoría (${lead?.tipo || "sala"}): ${range.optimal}.`);

    // 5. Inteligencia de mercado en vivo (Serper: cartelera/ciclo real; Spotify: tracción)
    try {
      const [venueLiveRes, spotifyRes] = await Promise.allSettled([
        fetchVenueLiveContext(lead.nombre_sala, lead.ciudad),
        fetchBandSpotifyTraction(bandDna.bandName)
      ]);

      if (venueLiveRes.status === "fulfilled" && venueLiveRes.value?.recentProgrammingSummary) {
        const liveInfo = `[Actualidad de programación detectada vía Serper: ${venueLiveRes.value.recentProgrammingSummary}]`;
        lead.notas = lead.notas ? `${lead.notas}\n${liveInfo}` : liveInfo;
      }

      if (spotifyRes.status === "fulfilled" && spotifyRes.value?.tractionPill) {
        const pill = spotifyRes.value.tractionPill;
        if (!bandDna.cifrasClaveTexto?.includes("Spotify")) {
          bandDna.cifrasClaveTexto = bandDna.cifrasClaveTexto ? `${bandDna.cifrasClaveTexto} | ${pill}` : pill;
        }
      }
    } catch (err) {
      console.warn("[PitchEngine] Venue/Artist live intelligence notice:", err);
    }

    // 6. System Prompt enriquecido
    const systemPrompt = buildEnhancedPitchSystemPrompt(
      bandDna,
      globalMemory,
      lead,
      options.activeCampaign,
      bandMinCache,
      negotiationStartCacheByType
    );

    // 7. User Prompt según sea generación nueva o refinamiento
    let userPrompt = "";
    if (options.isRegeneration) {
      userPrompt = `Reescribe y perfecciona el correo de pitch para "${sanitizeExternalText(lead.nombre_sala)}" en ${sanitizeExternalText(lead.ciudad) || "España"} (Tipo: ${sanitizeExternalText(lead.tipo) || "sala"}, Aforo: ${lead.aforo || "N/D"}).

PITCH ANTERIOR:
"""
${sanitizeExternalText(options.previousPitch || "Sin pitch anterior.", 3000)}
"""

FEEDBACK E INSTRUCCIONES ESPECÍFICAS DEL MÁNAGER:
${feedbackDetails.length > 0 ? feedbackDetails.join("\n") : "Reescribir con mayor fuerza, autenticidad y claridad."}

INSTRUCCIONES CLAVE:
1. Aplica e integra las instrucciones del mánager y el ADN completo de la banda.
2. Devuelve ÚNICAMENTE el texto final redactado del nuevo pitch, sin asuntos, encabezados ni metadatos extra.`;
    } else {
      userPrompt = `Redacta una propuesta comercial y artística de concierto para "${sanitizeExternalText(lead.nombre_sala)}" en ${sanitizeExternalText(lead.ciudad) || "España"} (Tipo: ${sanitizeExternalText(lead.tipo) || "sala"}, Aforo: ${lead.aforo || "N/D"}).
${feedbackDetails.length > 0 ? `\nINSTRUCCIONES ADICIONALES DEL MÁNAGER:\n${feedbackDetails.join("\n")}` : ""}
${lead.pitch_generado ? `\n(Versión previa de referencia: "${sanitizeExternalText(lead.pitch_generado.substring(0, 150))}...")` : ""}`;
    }

    return {
      bandDna,
      systemPrompt,
      userPrompt,
      tourContext,
      feedbackDetails,
      links: {
        spotify: bandDna.spotifyUrl,
        youtube: bandDna.youtubeUrl,
        epk: bandDna.epkUrl
      },
      contactEmail: bandDna.contactoEmail
    };
  }

  /**
   * Genera múltiples propuestas con distintos proveedores, auditando y auto-saneando cada una
   */
  static async generateMultiPitch(params: GenerateMultiPitchParams) {
    const { leadId, userBandId, comentario, tono_rating, contenido_rating, providers, activeCampaign } = params;
    const state = loadState();

    let lead = state.leads.find((l: any) => String(l.id) === String(leadId));
    if (!lead) {
      try {
        lead = await dbGetLeadById(leadId, userBandId);
        if (lead) state.leads.push(lead);
      } catch (dbErr) {
        console.warn("[PitchEngine] Could not fetch lead by ID from Supabase:", dbErr);
      }
    }
    if (!lead) {
      throw new Error("Sala o lead no encontrado.");
    }

    const context = await PitchEngine.compileContext(userBandId, lead, {
      activeCampaign,
      comentario,
      tono_rating,
      contenido_rating,
      isRegeneration: false
    });

    const rawProposals = await generateMultiModelProposals({
      prompt: context.userPrompt,
      systemPrompt: context.systemPrompt,
      links: context.links,
      providers: providers || ["gemini", "deepseek"],
      contactEmail: context.contactEmail
    });

    // Auditar heurísticamente y evaluar/refinar con LLM-as-a-Judge cada propuesta
    const auditedProposals: MultiPitchProposalWithAudit[] = await Promise.all(
      (rawProposals || []).map(async (p: any) => {
        const rawText = p.text || "";
        const evaluation = await evaluateAndRefinePitch({
          pitchText: rawText,
          leadName: lead.nombre_sala,
          leadCategory: lead.tipo || "sala",
          city: lead.ciudad,
          bandName: context.bandDna.bandName,
          skipRefinement: false
        });

        return {
          text: rawText,
          provider: p.provider,
          audit: evaluation.audit,
          sanitizedText: evaluation.refinedText || sanitizePitchDeterministically(rawText)
        };
      })
    );

    return {
      leadId: lead.id,
      leadName: lead.nombre_sala,
      proposals: auditedProposals
    };
  }

  /**
   * Regenera un pitch incorporando las correcciones del mánager y registrando el aprendizaje
   */
  static async regeneratePitch(params: RegeneratePitchParams) {
    const { leadId, userBandId, tono_rating, contenido_rating, comentario, alcance, provider, modelName, activeCampaign } = params;
    const state = loadState();

    let lead = state.leads.find((l: any) => String(l.id) === String(leadId));
    if (!lead) {
      try {
        lead = await dbGetLeadById(leadId, userBandId);
        if (lead) state.leads.push(lead);
      } catch (dbErr) {
        console.warn("[PitchEngine] Could not fetch lead by ID from Supabase:", dbErr);
      }
    }
    if (!lead) {
      throw new Error("Sala no encontrada.");
    }

    const previousPitch = lead.pitch_generado || "";
    const context = await PitchEngine.compileContext(userBandId, lead, {
      activeCampaign,
      comentario,
      tono_rating,
      contenido_rating,
      previousPitch,
      isRegeneration: true
    });

    let newPitchText = "";
    let isSimulated = false;

    try {
      const unifiedRes = await generateUnifiedAI({
        prompt: context.userPrompt,
        systemPrompt: context.systemPrompt,
        provider: provider || "gemini",
        modelName: modelName,
        permitirPitchLocal: true,
        links: context.links,
        contactEmail: context.contactEmail
      });
      if (unifiedRes && unifiedRes.text) {
        newPitchText = unifiedRes.text.trim();
      }
    } catch (aiErr: any) {
      console.warn(`[PitchEngine] Fallo ${provider || "AI"} al regenerar pitch, utilizando motor local de ADN:`, aiErr.message);
    }

    if (!newPitchText) {
      isSimulated = true;
      newPitchText = generateSmartDnaPitchFallback({
        bandDna: context.bandDna,
        lead,
        provider,
        customInstruction: comentario,
        feedbackDetails: context.feedbackDetails,
        activeCampaign
      });
    }

    // Auto-evaluar con LLM-as-a-Judge y auto-refinar
    const evaluation = await evaluateAndRefinePitch({
      pitchText: newPitchText,
      leadName: lead.nombre_sala,
      leadCategory: lead.tipo || "sala",
      city: lead.ciudad,
      bandName: context.bandDna.bandName,
      skipRefinement: false
    });

    const sanitizedPitchText = evaluation.refinedText || sanitizePitchDeterministically(newPitchText);
    const audit = evaluation.audit;

    // Registro de aprendizaje en el lead
    const finalAlcance = alcance === "este_pitch" ? "este_pitch" : "global";
    const logEntry = {
      id: `fb-${Date.now()}`,
      fecha: new Date().toISOString(),
      pitch_previo: previousPitch,
      tono_rating: tono_rating || undefined,
      contenido_rating: contenido_rating || undefined,
      comentario: comentario || "",
      pitch_nuevo: sanitizedPitchText,
      alcance: finalAlcance,
      anti_ai_score: audit.antiAiScore
    };

    if (!lead.historial_feedback_pitch) {
      lead.historial_feedback_pitch = [];
    }
    lead.historial_feedback_pitch.unshift(logEntry);

    // Dynamic Few-Shot: repositorio global de aprendizaje
    dbRecordPitchHumanEdit({
      band_id: userBandId,
      lead_id: lead.id,
      nombre_sala: lead.nombre_sala,
      tipo_entidad: lead.tipo,
      ciudad: lead.ciudad,
      borrador_ia: previousPitch,
      texto_aprobado: sanitizedPitchText,
      tipo_accion: "regenerado_con_feedback",
      resultado_respuesta: "pendiente"
    }).catch((err) => console.warn("[PitchEngine] Notice dbRecordPitchHumanEdit on regenerate:", err));

    // Campaign-specific training
    if (isCampaignActive(activeCampaign) && (tono_rating || contenido_rating || comentario)) {
      dbRecordCampaignPitchTraining({
        band_id: userBandId,
        campaign_id: activeCampaign.id,
        borrador_ia: previousPitch,
        texto_aprobado: sanitizedPitchText
      }).catch((err) => console.warn("[PitchEngine] Notice dbRecordCampaignPitchTraining on regenerate:", err));
    }

    // Actualizar el estado del lead
    lead.pitch_generado = sanitizedPitchText;
    lead.pitch_feedback_tono = undefined;
    lead.pitch_feedback_contenido = undefined;
    lead.pitch_feedback_comentario = "";

    saveState(state);

    const targetBandId = lead.band_id || userBandId;
    dbUpsertLead(lead, targetBandId).catch((err) => {
      console.warn("[PitchEngine] Async Supabase update for regenerated pitch failed:", err);
    });

    return {
      success: true,
      simulated: isSimulated,
      lead,
      newPitchText: sanitizedPitchText,
      audit,
      feedbackLog: logEntry
    };
  }

  /**
   * Audita la calidad y anti-AI score de cualquier texto
   */
  static auditPitch(text: string, category?: string): PitchQualityAudit {
    return auditPitchQuality(text, category);
  }

  /**
   * Sanea determinísticamente un texto sin costes de LLM
   */
  static sanitizePitch(text: string): string {
    return sanitizePitchDeterministically(text);
  }
}
