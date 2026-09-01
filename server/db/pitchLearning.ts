import { getSupabase, cleanBandId } from "./core.js";
import { getBandDnaProfile } from "../utils/bandDna.js";
import { generateUnifiedAI } from "../ai.js";
import { dbUpdateBandDnaExpresion } from "./bands.js";
import { mapLeadTipoToTemplateCategory } from "../promptsManager.js";

export interface PitchHumanEditRecord {
  id: string;
  band_id: string;
  lead_id: string;
  nombre_sala: string;
  tipo_entidad: string;
  ciudad?: string;
  borrador_ia: string;
  texto_aprobado: string;
  tuvo_edicion: boolean;
  diferencia_longitud?: number;
  tipo_accion: "aprobado_propuesta" | "aprobado_respuesta" | "regenerado_con_feedback" | "regenerado_respuesta_con_feedback";
  resultado_respuesta?: "pendiente" | "positiva" | "negativa" | "sin_respuesta";
  fecha_aprobacion: string;
}

// tipo_accion que corresponde a una edición de RESPUESTA (contestación a una sala que ya
// escribió) frente a una edición de PITCH (primer contacto) - separa qué correcciones
// alimentan el aprendizaje de cada modo (ver getBandDnaProfile(..., mode) en bandDna.ts).
const TIPOS_ACCION_RESPUESTA = ["aprobado_respuesta", "regenerado_respuesta_con_feedback"];
const TIPOS_ACCION_PITCH = ["aprobado_propuesta", "regenerado_con_feedback"];

/**
 * Registra en Supabase la comparación entre el borrador que propuso la IA y la
 * versión final que aprobó el humano (Human-in-the-Loop).
 * Si la tabla dedicada no existiera aún en Supabase, se guarda con fallback seguro
 * en el histórico del lead para no interrumpir el flujo.
 */
export async function dbRecordPitchHumanEdit(record: {
  band_id: string;
  lead_id: string;
  nombre_sala: string;
  tipo_entidad?: string;
  ciudad?: string;
  borrador_ia: string;
  texto_aprobado: string;
  tipo_accion: "aprobado_propuesta" | "aprobado_respuesta" | "regenerado_con_feedback" | "regenerado_respuesta_con_feedback";
  resultado_respuesta?: "pendiente" | "positiva" | "negativa" | "sin_respuesta";
}): Promise<boolean> {
  const cleanId = cleanBandId(record.band_id);
  const borrador = (record.borrador_ia || "").trim();
  const aprobado = (record.texto_aprobado || "").trim();
  const tuvoEdicion = borrador.length > 0 && borrador !== aprobado;

  const payload: PitchHumanEditRecord = {
    id: `edit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    band_id: cleanId,
    lead_id: record.lead_id,
    nombre_sala: record.nombre_sala || "Sala",
    tipo_entidad: record.tipo_entidad || "sala",
    ciudad: record.ciudad || "",
    borrador_ia: borrador,
    texto_aprobado: aprobado,
    tuvo_edicion: tuvoEdicion,
    diferencia_longitud: aprobado.length - borrador.length,
    tipo_accion: record.tipo_accion,
    resultado_respuesta: record.resultado_respuesta || "pendiente",
    fecha_aprobacion: new Date().toISOString()
  };

  try {
    const sb = getSupabase();
    const { error } = await sb.from("pitch_learning_examples").insert(payload);
    if (error) {
      // Si la tabla dedicada aún no se ha creado con el script SQL, no falla silencioso ni rompe la UI
      console.warn("Notice: pitch_learning_examples table insert skipped/error:", error.message);
      return false;
    }

    // Disparar en segundo plano el refinamiento automático de ADN si hay suficientes ediciones
    // para ESTA categoría de lead (sala, medio, festival...), no para toda la banda a la vez.
    // Separado por modo (pitch vs respuesta) para no mezclar ambos aprendizajes.
    const category = mapLeadTipoToTemplateCategory(record.tipo_entidad);
    const esRespuesta = TIPOS_ACCION_RESPUESTA.includes(record.tipo_accion);
    triggerSelfRefiningToneDnaBackground(cleanId, category, esRespuesta).catch(err => {
      console.warn("Background self-refining tone DNA notice:", err);
    });

    return true;
  } catch (err: any) {
    console.warn("Error recording pitch human edit:", err?.message || err);
    return false;
  }
}

/**
 * Obtiene los ejemplos Few-Shot más relevantes y de mayor calidad para inyectar en
 * el prompt de redacción de una nueva propuesta o réplica.
 * Prioriza:
 * 1. Ejemplos con resultado de respuesta positiva comprobada.
 * 2. Ejemplos aprobados por el humano para el mismo tipo de recinto (sala, festival, medio).
 * 3. Ejemplos recientes de la misma banda.
 */
export async function dbGetDynamicFewShotExamples(bandId: string, currentLead?: any, maxExamples = 3): Promise<Array<{
  nombre_sala: string;
  tipo_entidad: string;
  ciudad: string;
  borrador_ia?: string;
  texto_aprobado: string;
  resultado_respuesta?: string;
}>> {
  const cleanId = cleanBandId(bandId);
  const category = mapLeadTipoToTemplateCategory(currentLead?.tipo);
  try {
    const sb = getSupabase();

    // 0. Hilos de ejemplo pegados a mano por el mánager para esta categoría (pitch_example_threads):
    // curados por una persona, así que se ponderan alto sin depender de que ya haya negociaciones
    // reales registradas.
    const pastedExamples: Array<{ nombre_sala: string; tipo_entidad: string; ciudad: string; borrador_ia?: string; texto_aprobado: string; resultado_respuesta?: string; score: number }> = [];
    try {
      const { data: threads } = await sb
        .from("pitch_example_threads")
        .select("titulo, mensajes, resultado")
        .eq("band_id", cleanId)
        .eq("category", category)
        .limit(10);

      for (const thread of threads || []) {
        const mensajes = Array.isArray(thread.mensajes) ? thread.mensajes : [];
        const primerMensajeBanda = mensajes
          .filter((m: any) => m.rol === "banda")
          .sort((a: any, b: any) => (a.orden ?? 0) - (b.orden ?? 0))[0];
        if (!primerMensajeBanda?.texto) continue;

        let score = 6; // ya está garantizado que coincide la categoría, por construcción
        if (thread.resultado === "positiva") score += 10;
        pastedExamples.push({
          nombre_sala: thread.titulo || "Ejemplo pegado por el mánager",
          tipo_entidad: category,
          ciudad: "",
          texto_aprobado: primerMensajeBanda.texto,
          resultado_respuesta: thread.resultado,
          score
        });
      }
    } catch (err) {
      console.warn("Notice buscando pitch_example_threads para few-shot:", err);
    }

    // 1. Intentar obtener ejemplos de pitch_learning_examples
    let query = sb
      .from("pitch_learning_examples")
      .select("*")
      .eq("band_id", cleanId)
      .neq("texto_aprobado", "")
      .order("fecha_aprobacion", { ascending: false })
      .limit(15);

    const { data: dbExamples, error } = await query;

    if ((!error && dbExamples && dbExamples.length > 0) || pastedExamples.length > 0) {
      // Ponderación inteligente:
      // +10 si tuvo respuesta positiva
      // +5 si coincide el tipo de entidad (sala, medio, etc.)
      // +3 si fue corregido y validado por el humano
      const scoredLearning = (dbExamples || []).map((ex: any) => {
        let score = 0;
        if (ex.resultado_respuesta === "positiva") score += 10;
        if (currentLead?.tipo && ex.tipo_entidad && currentLead.tipo.toLowerCase() === ex.tipo_entidad.toLowerCase()) score += 5;
        if (ex.tuvo_edicion) score += 3;
        return {
          item: {
            nombre_sala: ex.nombre_sala,
            tipo_entidad: ex.tipo_entidad,
            ciudad: ex.ciudad,
            borrador_ia: ex.borrador_ia,
            texto_aprobado: ex.texto_aprobado,
            resultado_respuesta: ex.resultado_respuesta
          },
          score
        };
      });

      const scoredPasted = pastedExamples.map((ex) => ({
        item: {
          nombre_sala: ex.nombre_sala,
          tipo_entidad: ex.tipo_entidad,
          ciudad: ex.ciudad,
          borrador_ia: ex.borrador_ia,
          texto_aprobado: ex.texto_aprobado,
          resultado_respuesta: ex.resultado_respuesta
        },
        score: ex.score
      }));

      const scored = [...scoredLearning, ...scoredPasted];
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, maxExamples).map((s) => s.item);
    }

    // 2. Fallback resiliente: Buscar en los leads existentes que ya tengan pitch aprobado o enviado
    const { data: leadsData } = await sb
      .from("leads")
      .select("nombre_sala, tipo, ciudad, pitch_generado, estado")
      .eq("band_id", cleanId)
      .in("estado", ["aprobado", "aprobado_propuesta", "contactado", "esperando_respuesta", "respondido", "negociando", "confirmado"])
      .neq("pitch_generado", "")
      .limit(10);

    if (leadsData && leadsData.length > 0) {
      return leadsData.slice(0, maxExamples).map(l => ({
        nombre_sala: l.nombre_sala,
        tipo_entidad: l.tipo || "sala",
        ciudad: l.ciudad || "",
        texto_aprobado: l.pitch_generado,
        resultado_respuesta: l.estado === "confirmado" || l.estado === "negociando" ? "positiva" : undefined
      }));
    }

    return [];
  } catch (err: any) {
    console.warn("Could not load dynamic few-shot examples from Supabase:", err?.message || err);
    return [];
  }
}

/**
 * Hilos de ejemplo completos (pitch_example_threads) para el Contestador: a diferencia de
 * dbGetDynamicFewShotExamples (que solo extrae el primer mensaje "banda" para el pitch inicial),
 * aquí interesa la conversación completa, incluida la respuesta real de la sala, porque es lo
 * que enseña a la IA cómo responder a negociaciones reales.
 */
export async function dbGetReplyFewShotThreads(bandId: string, category: string, maxThreads = 2): Promise<Array<{
  titulo?: string;
  resultado?: string;
  mensajes: Array<{ rol: "banda" | "sala"; texto: string; orden: number }>;
}>> {
  const cleanId = cleanBandId(bandId);
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("pitch_example_threads")
      .select("titulo, mensajes, resultado")
      .eq("band_id", cleanId)
      .eq("category", category)
      .limit(10);

    if (error || !data) return [];

    // Prioriza los hilos con resultado positivo y con más de un intercambio (más útiles para
    // aprender a gestionar una respuesta real que uno con un único mensaje).
    const sorted = [...data].sort((a: any, b: any) => {
      const scoreA = (a.resultado === "positiva" ? 10 : 0) + (Array.isArray(a.mensajes) ? a.mensajes.length : 0);
      const scoreB = (b.resultado === "positiva" ? 10 : 0) + (Array.isArray(b.mensajes) ? b.mensajes.length : 0);
      return scoreB - scoreA;
    });

    return sorted.slice(0, maxThreads).map((t: any) => ({
      titulo: t.titulo,
      resultado: t.resultado,
      mensajes: Array.isArray(t.mensajes) ? t.mensajes : []
    }));
  } catch (err: any) {
    console.warn("Could not load reply few-shot threads from Supabase:", err?.message || err);
    return [];
  }
}

/**
 * Formatea los ejemplos Few-Shot recuperados para incluirlos de forma compacta y de
 * bajo consumo de tokens en el System Prompt de Gemini.
 */
export function formatFewShotExamplesForPrompt(examples: Array<{
  nombre_sala: string;
  tipo_entidad: string;
  ciudad: string;
  borrador_ia?: string;
  texto_aprobado: string;
  resultado_respuesta?: string;
}>): string {
  if (!examples || examples.length === 0) return "";

  const formatted = examples.map((ex, i) => {
    const header = `EJEMPLO DE ÉXITO REAL ${i + 1} (${ex.tipo_entidad.toUpperCase()} - "${ex.nombre_sala}", ${ex.ciudad || "España"}${ex.resultado_respuesta === "positiva" ? " | RESULTADO: RESPUESTA POSITIVA DE LA SALA" : ""}):`;
    
    if (ex.borrador_ia && ex.borrador_ia !== ex.texto_aprobado) {
      return `${header}
[Borrador inicial propuesto]:
"${ex.borrador_ia.substring(0, 180)}..."
[Versión FINAL corregida y aprobada por la banda - IMITAR ESTE ESTILO Y ESTRUCTURA]:
"${ex.texto_aprobado}"`;
    }

    return `${header}
[Versión real aprobada por la banda]:
"${ex.texto_aprobado}"`;
  }).join("\n\n");

  return `
═════════════════════════════════════════════════════════════════════
💎 EJEMPLOS DE ENTRENAMIENTO REAL (DYNAMIC FEW-SHOT IN-CONTEXT):
═════════════════════════════════════════════════════════════════════
Imita el vocabulario, la cadencia, el nivel de cercanía y la estructura exacta de estos correos aprobados y validados por la banda:

${formatted}
`;
}

type PitchEditRow = { borrador_ia: string; texto_aprobado: string; nombre_sala: string; tipo_entidad: string };

/** Ediciones humanas recientes de la banda (hasta 40), tal cual vienen de Supabase, filtradas
 * a pitches (primer contacto) o a respuestas (contestaciones a una sala que ya escribió) según
 * `esRespuesta` - ver TIPOS_ACCION_RESPUESTA/TIPOS_ACCION_PITCH arriba. */
async function fetchRecentEditedExamples(cleanId: string, esRespuesta: boolean): Promise<PitchEditRow[]> {
  const sb = getSupabase();
  const { data } = await sb
    .from("pitch_learning_examples")
    .select("borrador_ia, texto_aprobado, nombre_sala, tipo_entidad")
    .eq("band_id", cleanId)
    .eq("tuvo_edicion", true)
    .in("tipo_accion", esRespuesta ? TIPOS_ACCION_RESPUESTA : TIPOS_ACCION_PITCH)
    .order("fecha_aprobacion", { ascending: false })
    .limit(40);
  return data || [];
}

// Techo de reglas AI-derivadas por categoría: sin límite, una banda de un año de correcciones
// acumularía docenas de "reglas de oro" que dejarían de ser oro (prompt enorme, ruido, reglas
// redundantes o ya obsoletas compitiendo por atención). El propio LLM ya prioriza al fusionar
// (ver prompt de abajo); este es solo el cinturón de seguridad si aun así se pasa.
const MAX_REGLAS_IA_POR_CATEGORIA = 12;

/**
 * Analiza los diffs de una categoría concreta y actualiza `dna_expresion.reglas_por_categoria`
 * (pitches) o `dna_expresion.reglas_por_categoria_respuesta` (respuestas) para esa categoría.
 * Requiere al menos 2 ediciones para inferir patrones; si no hay suficientes, no hace nada
 * (no es un error, solo "todavía no hay señal suficiente").
 *
 * FUSIONA con lo que ya había en vez de sobreescribirlo: antes, cada refinamiento generaba la
 * lista de reglas SOLO a partir de los últimos 8 casos, así que una regla válida aprendida hace
 * meses (o una añadida a mano por el mánager) podía desaparecer sin más si no volvía a aparecer
 * reflejada en los ejemplos más recientes. Ahora se le pasan a la IA las reglas actuales y se le
 * pide explícitamente conservarlas salvo que los casos nuevos las contradigan de verdad.
 * `reglas_manuales` (añadidas a mano por el mánager) ni se leen ni se tocan aquí - son del
 * mánager, nunca las toca el refinamiento automático.
 */
async function refineToneDnaForCategory(cleanId: string, targetCategory: string, edits: PitchEditRow[], esRespuesta: boolean): Promise<void> {
  if (edits.length < 2) return;

  const bucketKey = esRespuesta ? "reglas_por_categoria_respuesta" : "reglas_por_categoria";

  const diffsText = edits.slice(0, 8).map((e, idx) => `
Caso ${idx + 1} (${e.nombre_sala}):
- Borrador IA rechazado: "${e.borrador_ia}"
- Versión final escrita por el mánager: "${e.texto_aprobado}"
`).join("\n");

  const contexto = esRespuesta
    ? `TODOS son CONTESTACIONES a un mensaje que ya envió el mismo tipo de destinatario ("${targetCategory}") - no primeros contactos.`
    : `TODOS son correos de PRIMER CONTACTO dirigidos al mismo tipo de destinatario ("${targetCategory}").`;

  let reglasAprendidasCount = 0;

  // dbUpdateBandDnaExpresion lee dna_expresion, deja que este callback lo transforme y escribe
  // el resultado como una operación atómica por banda (server/db/bands.ts) - la lectura de
  // reglasPrevias y la escritura final quedan así garantizadas sobre la MISMA foto de datos,
  // incluso si otro refinamiento o una edición manual de BandToneModal caen casi a la vez.
  await dbUpdateBandDnaExpresion(cleanId, async (currentDna) => {
    const reglasPorCategoria = { ...(currentDna[bucketKey] || {}) };
    const entradaActual = reglasPorCategoria[targetCategory] || {};
    const reglasPrevias: string[] = entradaActual.reglas_estilo_aprendidas || [];

    const reglasPreviasSection = reglasPrevias.length > 0
      ? `\nREGLAS QUE YA TENÍAS VALIDADAS DE ANÁLISIS ANTERIORES (mantenlas TODAS salvo que los casos nuevos de abajo las contradigan claramente - no las quites solo porque no aparezcan reflejadas en estos casos concretos):\n${reglasPrevias.map((r) => `- ${r}`).join("\n")}\n`
      : '';

    const prompt = `Actúa como un lingüista experto en comunicación de bandas de música independiente.
Analiza las diferencias entre lo que la IA propuso y lo que el mánager/músico corrigió manualmente en estos correos. ${contexto}
${reglasPreviasSection}
CASOS NUEVOS A ANALIZAR:
${diffsText}

Tu tarea es devolver la lista ACTUALIZADA y FUSIONADA de reglas de oro para este tipo de destinatario: conserva las reglas previas que sigan aplicando, añade las nuevas que detectes en estos casos, funde en una sola las que digan básicamente lo mismo, y elimina solo las que estos casos nuevos contradigan de forma clara. Máximo ${MAX_REGLAS_IA_POR_CATEGORIA} reglas en total - si hay más señal de la que cabe, prioriza las más repetidas y las más recientes.

Devuelve un JSON con este formato exacto:
{
  "reglas_aprendidas": ["Regla 1...", "Regla 2...", "Regla 3..."],
  "palabras_favoritas": ["palabra1", "palabra2"],
  "palabras_prohibidas": ["palabra1", "palabra2"],
  "ajuste_tono_recomendado": "directo_y_profesional"
}`;

    const response = await generateUnifiedAI({ prompt, temperature: 0.2 });

    const jsonMatch = (response.text || "").match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    if (!parsed.reglas_aprendidas || !Array.isArray(parsed.reglas_aprendidas)) {
      return currentDna; // Nada que guardar: misma referencia = dbUpdateBandDnaExpresion no escribe.
    }

    reglasPorCategoria[targetCategory] = {
      reglas_estilo_aprendidas: parsed.reglas_aprendidas.slice(0, MAX_REGLAS_IA_POR_CATEGORIA),
      // reglas_manuales nunca se pisa aquí: se preserva tal cual estuviera, sea lo que sea.
      reglas_manuales: entradaActual.reglas_manuales || [],
      vocabulario_aprendido: parsed.palabras_favoritas || entradaActual.vocabulario_aprendido || [],
      terminos_a_evitar: parsed.palabras_prohibidas || entradaActual.terminos_a_evitar || [],
      actualizado: new Date().toISOString()
    };
    reglasAprendidasCount = parsed.reglas_aprendidas.length;

    return {
      ...currentDna,
      [bucketKey]: reglasPorCategoria,
      ultimo_auto_refinamiento: new Date().toISOString()
    };
  });

  if (reglasAprendidasCount > 0) {
    console.log(`[Self-Refining Tone DNA] Actualizadas ${reglasAprendidasCount} reglas de estilo (${esRespuesta ? "respuestas" : "pitches"}) para ${cleanId} / categoría "${targetCategory}"`);
  }
}

/**
 * Analizador y Refinador Autónomo del ADN de Tono (Self-Refining Tone DNA) para UNA categoría.
 * Analiza los diffs entre borradores y versiones aprobadas para extraer reglas de estilo
 * recurrentes y actualizar el perfil de la banda.
 *
 * Las reglas se guardan separadas por categoría de lead (`dna_expresion.reglas_por_categoria`)
 * Y por modo pitch/respuesta (`esRespuesta`): antes todo caía en la misma bolsa por categoría,
 * así que corregir un pitch de salas y una respuesta a una sala mezclaba ambos aprendizajes,
 * aplicándolos por igual aunque el registro correcto de cada uno sea muy distinto (un primer
 * contacto no suena igual que una contestación a una negociación ya en marcha).
 */
export async function triggerSelfRefiningToneDnaBackground(bandId: string, category?: string, esRespuesta = false): Promise<void> {
  const cleanId = cleanBandId(bandId);
  try {
    const recentEdits = await fetchRecentEditedExamples(cleanId, esRespuesta);
    if (recentEdits.length === 0) return;

    const targetCategory = category || mapLeadTipoToTemplateCategory(recentEdits[0]?.tipo_entidad);
    const edits = recentEdits.filter((e) => mapLeadTipoToTemplateCategory(e.tipo_entidad) === targetCategory);

    await refineToneDnaForCategory(cleanId, targetCategory, edits, esRespuesta);
  } catch (err: any) {
    console.warn("Notice during triggerSelfRefiningToneDnaBackground:", err?.message || err);
  }
}

/**
 * Igual que triggerSelfRefiningToneDnaBackground, pero refina TODAS las categorías que tengan
 * señal suficiente de una vez (tanto de pitches como de respuestas), en vez de solo la más
 * reciente. Pensado para el botón manual "entrenar ADN de tono" (POST /api/leads/train-tone-dna),
 * donde el mánager espera que se aprovechen todas las correcciones acumuladas.
 */
export async function refineAllToneDnaCategoriesForBand(bandId: string): Promise<string[]> {
  const cleanId = cleanBandId(bandId);
  const refinedCategories: string[] = [];
  try {
    for (const esRespuesta of [false, true]) {
      const recentEdits = await fetchRecentEditedExamples(cleanId, esRespuesta);
      if (recentEdits.length === 0) continue;

      const byCategory = new Map<string, PitchEditRow[]>();
      for (const edit of recentEdits) {
        const cat = mapLeadTipoToTemplateCategory(edit.tipo_entidad);
        if (!byCategory.has(cat)) byCategory.set(cat, []);
        byCategory.get(cat)!.push(edit);
      }

      // Secuencial a propósito: cada categoría con señal dispara una llamada a IA, y no queremos
      // lanzar varias en paralelo contra el mismo proveedor por una sola pulsación del mánager.
      for (const [cat, edits] of byCategory) {
        if (edits.length < 2) continue;
        await refineToneDnaForCategory(cleanId, cat, edits, esRespuesta);
        refinedCategories.push(esRespuesta ? `${cat} (respuestas)` : cat);
      }
    }
    return refinedCategories;
  } catch (err: any) {
    console.warn("Notice during refineAllToneDnaCategoriesForBand:", err?.message || err);
    return refinedCategories;
  }
}

/**
 * Registra entrenamiento de tono/contenido específico para una campaña activa.
 * Similar a dbRecordPitchHumanEdit pero scoped a una campaña en lugar de un lead.
 */
export interface CampaignPitchTrainingRecord {
  id: string;
  band_id: string;
  campaign_id: string;
  borrador_ia: string;
  texto_aprobado: string;
  tuvo_edicion: boolean;
  diferencia_longitud?: number;
  tipo_accion: "entrenamiento_campaña";
  fecha_aprobacion: string;
}

export async function dbRecordCampaignPitchTraining(record: {
  band_id: string;
  campaign_id: string;
  borrador_ia: string;
  texto_aprobado: string;
}): Promise<boolean> {
  const cleanId = cleanBandId(record.band_id);
  const borrador = (record.borrador_ia || "").trim();
  const aprobado = (record.texto_aprobado || "").trim();
  const tuvoEdicion = borrador.length > 0 && borrador !== aprobado;

  const payload: CampaignPitchTrainingRecord = {
    id: `campaign-train-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    band_id: cleanId,
    campaign_id: record.campaign_id,
    borrador_ia: borrador,
    texto_aprobado: aprobado,
    tuvo_edicion: tuvoEdicion,
    diferencia_longitud: aprobado.length - borrador.length,
    tipo_accion: "entrenamiento_campaña",
    fecha_aprobacion: new Date().toISOString()
  };

  try {
    const sb = getSupabase();
    const { error } = await sb.from("campaign_pitch_training").insert(payload);
    if (error) {
      console.warn("Notice: campaign_pitch_training table insert skipped/error:", error.message);
      return false;
    }

    // Disparar en segundo plano el refinamiento automático de ADN de campaña
    triggerCampaignToneRefinement(cleanId, record.campaign_id).catch(err => {
      console.warn("Background campaign tone refinement notice:", err);
    });

    return true;
  } catch (err: any) {
    console.warn("Error recording campaign pitch training:", err?.message || err);
    return false;
  }
}

/**
 * Obtiene ediciones recientes para una campaña específica.
 */
async function fetchCampaignTrainingExamples(cleanId: string, campaignId: string): Promise<PitchEditRow[]> {
  const sb = getSupabase();
  const { data } = await sb
    .from("campaign_pitch_training")
    .select("borrador_ia, texto_aprobado, texto_aprobado as nombre_sala, texto_aprobado as tipo_entidad")
    .eq("band_id", cleanId)
    .eq("campaign_id", campaignId)
    .eq("tuvo_edicion", true)
    .order("fecha_aprobacion", { ascending: false })
    .limit(20);

  return (data || []).map((row: any) => ({
    borrador_ia: row.borrador_ia,
    texto_aprobado: row.texto_aprobado,
    nombre_sala: "Campaña",
    tipo_entidad: "campaña"
  }));
}

/**
 * Refina el ADN de tono de una campaña específica basándose en ediciones acumuladas.
 * Requiere al menos 2 ediciones para inferir patrones.
 */
async function refineCampaignToneDna(cleanId: string, campaignId: string, edits: PitchEditRow[]): Promise<void> {
  if (edits.length < 2) return;

  const sb = getSupabase();
  const { data: campaignData } = await sb
    .from("campaigns")
    .select("campaign_tone_rules")
    .eq("id", campaignId)
    .eq("band_id", cleanId)
    .single();

  const currentRules = campaignData?.campaign_tone_rules || {};
  const reglasPrevias: string[] = currentRules.reglas_estilo_aprendidas || [];

  const diffsText = edits.slice(0, 8).map((e, idx) => `
Caso ${idx + 1}:
- Borrador IA rechazado: "${e.borrador_ia}"
- Versión final escrita por el mánager: "${e.texto_aprobado}"
`).join("\n");

  // Mismo arreglo que refineToneDnaForCategory (ver arriba): sin pasarle las reglas previas y
  // pedirle explícitamente que las conserve, cada refinamiento generaba la lista SOLO a partir de
  // los últimos 8 casos, así que una regla aprendida en un refinamiento anterior de esta misma
  // campaña podía desaparecer sin más si no volvía a aparecer reflejada en los casos más recientes.
  const reglasPreviasSection = reglasPrevias.length > 0
    ? `\nREGLAS QUE YA TENÍAS VALIDADAS DE ANÁLISIS ANTERIORES DE ESTA CAMPAÑA (mantenlas TODAS salvo que los casos nuevos de abajo las contradigan claramente - no las quites solo porque no aparezcan reflejadas en estos casos concretos):\n${reglasPrevias.map((r) => `- ${r}`).join("\n")}\n`
    : '';

  const prompt = `Actúa como un experto en comunicación de bandas de música independiente dentro de una campaña de booking específica.
Analiza las diferencias entre lo que la IA propuso y lo que el mánager/músico corrigió manualmente en estos correos de pitch:
${reglasPreviasSection}
CASOS NUEVOS A ANALIZAR:
${diffsText}

Tu tarea es devolver la lista ACTUALIZADA y FUSIONADA de REGLAS DE ORO O PREFERENCIAS DE ESTILO que el mánager aplica sistemáticamente PARA ESTA CAMPAÑA ESPECÍFICA: conserva las reglas previas que sigan aplicando, añade las nuevas que detectes en estos casos, funde en una sola las que digan básicamente lo mismo, y elimina solo las que estos casos nuevos contradigan de forma clara. Máximo 5 reglas en total.

Devuelve un JSON con este formato exacto:
{
  "reglas_aprendidas": ["Regla 1...", "Regla 2...", "Regla 3..."],
  "palabras_favoritas": ["palabra1", "palabra2"],
  "palabras_prohibidas": ["palabra1", "palabra2"]
}`;

  const response = await generateUnifiedAI({ prompt, temperature: 0.2 });

  const jsonMatch = (response.text || "").match(/\{[\s\S]*\}/);
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  if (parsed.reglas_aprendidas && Array.isArray(parsed.reglas_aprendidas)) {
    const updatedRules = {
      reglas_estilo_aprendidas: parsed.reglas_aprendidas.slice(0, 5),
      vocabulario_aprendido: parsed.palabras_favoritas || currentRules.vocabulario_aprendido || [],
      terminos_a_evitar: parsed.palabras_prohibidas || currentRules.terminos_a_evitar || [],
      actualizado: new Date().toISOString()
    };

    const { error } = await sb
      .from("campaigns")
      .update({ campaign_tone_rules: updatedRules })
      .eq("id", campaignId)
      .eq("band_id", cleanId);

    if (!error) {
      console.log(`[Campaign Tone DNA] Actualizadas ${parsed.reglas_aprendidas.length} reglas de estilo para campaña ${campaignId}`);
    }
  }
}

/**
 * Dispara el refinamiento automático del ADN de tono de una campaña específica.
 */
export async function triggerCampaignToneRefinement(bandId: string, campaignId: string): Promise<void> {
  const cleanId = cleanBandId(bandId);
  try {
    const edits = await fetchCampaignTrainingExamples(cleanId, campaignId);
    if (edits.length >= 2) {
      await refineCampaignToneDna(cleanId, campaignId, edits);
    }
  } catch (err: any) {
    console.warn("Notice during triggerCampaignToneRefinement:", err?.message || err);
  }
}

/**
 * Fuerza el entrenamiento manual inmediato del ADN de tono para una campaña activa.
 * Dispara el análisis de IA si hay al menos 2 ediciones acumuladas.
 */
export async function trainCampaignToneDnaManually(bandId: string, campaignId: string): Promise<{ success: boolean; message: string }> {
  const cleanId = cleanBandId(bandId);
  try {
    const edits = await fetchCampaignTrainingExamples(cleanId, campaignId);
    if (edits.length < 2) {
      return {
        success: false,
        message: `Se necesitan al menos 2 correcciones para entrenar el ADN de tono de la campaña. Actualmente hay ${edits.length}.`
      };
    }

    await refineCampaignToneDna(cleanId, campaignId, edits);
    return {
      success: true,
      message: `ADN de tono de la campaña entrenado exitosamente con ${edits.length} ejemplos.`
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Error al entrenar ADN de tono: ${err?.message || err}`
    };
  }
}
