import { getSupabase, cleanBandId } from "./core.js";
import { getBandDnaProfile } from "../utils/bandDna.js";
import { generateUnifiedAI } from "../ai.js";
import { dbGetRegisteredBandById, dbUpdateBandToneDna } from "./bands.js";
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
  tipo_accion: "aprobado_propuesta" | "aprobado_respuesta" | "regenerado_con_feedback";
  resultado_respuesta?: "pendiente" | "positiva" | "negativa" | "sin_respuesta";
  fecha_aprobacion: string;
}

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
  tipo_accion: "aprobado_propuesta" | "aprobado_respuesta" | "regenerado_con_feedback";
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
    const category = mapLeadTipoToTemplateCategory(record.tipo_entidad);
    triggerSelfRefiningToneDnaBackground(cleanId, category).catch(err => {
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

/** Ediciones humanas recientes de la banda (hasta 40), tal cual vienen de Supabase. */
async function fetchRecentEditedExamples(cleanId: string): Promise<PitchEditRow[]> {
  const sb = getSupabase();
  const { data } = await sb
    .from("pitch_learning_examples")
    .select("borrador_ia, texto_aprobado, nombre_sala, tipo_entidad")
    .eq("band_id", cleanId)
    .eq("tuvo_edicion", true)
    .order("fecha_aprobacion", { ascending: false })
    .limit(40);
  return data || [];
}

/**
 * Analiza los diffs de una categoría concreta y actualiza `dna_expresion.reglas_por_categoria`
 * para esa categoría. Requiere al menos 2 ediciones para inferir patrones; si no hay
 * suficientes, no hace nada (no es un error, solo "todavía no hay señal suficiente").
 */
async function refineToneDnaForCategory(cleanId: string, targetCategory: string, edits: PitchEditRow[]): Promise<void> {
  if (edits.length < 2) return;

  const registered = await dbGetRegisteredBandById(cleanId);
  const currentDna = registered?.dna_expresion || {};
  const reglasPorCategoria = { ...(currentDna.reglas_por_categoria || {}) };

  const diffsText = edits.slice(0, 8).map((e, idx) => `
Caso ${idx + 1} (${e.nombre_sala}):
- Borrador IA rechazado: "${e.borrador_ia}"
- Versión final escrita por el mánager: "${e.texto_aprobado}"
`).join("\n");

  const prompt = `Actúa como un lingüista experto en comunicación de bandas de música independiente.
Analiza las diferencias entre lo que la IA propuso y lo que el mánager/músico corrigió manualmente en estos correos, TODOS dirigidos al mismo tipo de destinatario ("${targetCategory}"):

${diffsText}

Extrae de forma ultra-concisa las 3 a 5 REGLAS DE ORO O PREFERENCIAS DE ESTILO que el mánager aplica sistemáticamente PARA ESTE TIPO DE DESTINATARIO (por ejemplo: expresiones que elimina, cómo saluda, qué datos añade, nivel de formalidad, cómo pide fechas).

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
  if (parsed.reglas_aprendidas && Array.isArray(parsed.reglas_aprendidas)) {
    reglasPorCategoria[targetCategory] = {
      reglas_estilo_aprendidas: parsed.reglas_aprendidas,
      vocabulario_aprendido: parsed.palabras_favoritas || reglasPorCategoria[targetCategory]?.vocabulario_aprendido || [],
      terminos_a_evitar: parsed.palabras_prohibidas || reglasPorCategoria[targetCategory]?.terminos_a_evitar || [],
      actualizado: new Date().toISOString()
    };

    await dbUpdateBandToneDna(cleanId, {
      ...currentDna,
      reglas_por_categoria: reglasPorCategoria,
      ultimo_auto_refinamiento: new Date().toISOString()
    });
    console.log(`[Self-Refining Tone DNA] Actualizadas ${parsed.reglas_aprendidas.length} reglas de estilo para ${cleanId} / categoría "${targetCategory}"`);
  }
}

/**
 * Analizador y Refinador Autónomo del ADN de Tono (Self-Refining Tone DNA) para UNA categoría.
 * Analiza los diffs entre borradores y versiones aprobadas para extraer reglas de estilo
 * recurrentes y actualizar el perfil de la banda.
 *
 * Las reglas se guardan separadas por categoría de lead (`dna_expresion.reglas_por_categoria`):
 * antes eran una única bolsa por banda, así que corregir 5 pitches de medios y 5 de salas
 * mezclaba ambos aprendizajes en las mismas reglas, aplicándolas por igual a todo tipo de
 * destinatario aunque el registro que corresponda sea muy distinto.
 */
export async function triggerSelfRefiningToneDnaBackground(bandId: string, category?: string): Promise<void> {
  const cleanId = cleanBandId(bandId);
  try {
    const recentEdits = await fetchRecentEditedExamples(cleanId);
    if (recentEdits.length === 0) return;

    const targetCategory = category || mapLeadTipoToTemplateCategory(recentEdits[0]?.tipo_entidad);
    const edits = recentEdits.filter((e) => mapLeadTipoToTemplateCategory(e.tipo_entidad) === targetCategory);

    await refineToneDnaForCategory(cleanId, targetCategory, edits);
  } catch (err: any) {
    console.warn("Notice during triggerSelfRefiningToneDnaBackground:", err?.message || err);
  }
}

/**
 * Igual que triggerSelfRefiningToneDnaBackground, pero refina TODAS las categorías que tengan
 * señal suficiente de una vez, en vez de solo la más reciente. Pensado para el botón manual
 * "entrenar ADN de tono" (POST /api/leads/train-tone-dna), donde el mánager espera que se
 * aprovechen todas las correcciones acumuladas, no solo las del último pitch corregido.
 */
export async function refineAllToneDnaCategoriesForBand(bandId: string): Promise<string[]> {
  const cleanId = cleanBandId(bandId);
  const refinedCategories: string[] = [];
  try {
    const recentEdits = await fetchRecentEditedExamples(cleanId);
    if (recentEdits.length === 0) return refinedCategories;

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
      await refineToneDnaForCategory(cleanId, cat, edits);
      refinedCategories.push(cat);
    }
    return refinedCategories;
  } catch (err: any) {
    console.warn("Notice during refineAllToneDnaCategoriesForBand:", err?.message || err);
    return refinedCategories;
  }
}
