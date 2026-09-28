/**
 * PITCH VECTOR STORE — RAG VECTORIAL & FEW-SHOT DINÁMICO CON PGVECTOR
 * 
 * Permite almacenar y recuperar semánticamente pitches exitosos de la banda
 * y ejemplos curados mediante embeddings matemáticos de Google (text-embedding-004, 768d).
 */

import { getAiClient } from "../ai.js";
import { getSupabase } from "../db/core.js";


export type RAGContentType = 
  | "pitch_template"
  | "objection_handler"
  | "anti_pattern"
  | "deal_memo"
  | "sync_pitch"
  | "sponsor_pitch"
  | "follow_up";

export type RAGFunnelStage = 
  | "cold_outreach"
  | "follow_up_1"
  | "follow_up_2"
  | "break_up"
  | "deal_negotiation"
  | "confirmation_advancing";

export type RAGTargetActor = 
  | "venue_club"
  | "festival"
  | "theater_auditorium"
  | "public_circuit_city_hall"
  | "label_ar"
  | "agency_management"
  | "producer"
  | "peer_band"
  | "brand_sponsor"
  | "music_supervisor";

export type RAGFinancialModel = 
  | "guarantee_flat"
  | "door_split"
  | "guarantee_vs_split"
  | "bar_deal"
  | "pay_to_play_risk_shared"
  | "public_grant_fee"
  | "sponsorship_in_kind"
  | "none";

export type RAGRiskCategory = 
  | "production_tech"
  | "local_draw_attendance"
  | "calendar_date"
  | "financial_budget"
  | "legal_contractual"
  | "none";

export interface BandManagerChunkMetadata {
  chunk_id?: string;
  content_type: RAGContentType;
  stage: RAGFunnelStage;
  target_actor: RAGTargetActor;
  financial_model: RAGFinancialModel;
  risk_category: RAGRiskCategory;
  venue_capacity_range?: {
    min?: number;
    max?: number;
  };
  anti_ai_rules?: {
    max_words?: number;
    em_dash_allowed?: boolean;
    single_link_only?: boolean;
    burstiness_level?: "high" | "medium";
  };
  language?: string;
  [key: string]: any;
}

export interface PitchVectorEntry {
  id?: string;
  band_id: string;
  lead_id?: string;
  nombre_sala: string;
  tipo_entidad: string;
  ciudad?: string;
  genero_musical?: string;
  texto_pitch: string;
  resultado_respuesta?: "pendiente" | "positiva" | "negativa" | "confirmado";
  conversion_score?: number;
  metadata?: Record<string, any>;
}

export interface SimilarPitchResult {
  id: string;
  band_id: string;
  nombre_sala: string;
  tipo_entidad: string;
  ciudad?: string;
  texto_pitch: string;
  resultado_respuesta?: string;
  conversion_score: number;
  similarity: number;
}

// In-memory LRU cache to avoid re-generating embeddings for identical text (saves quota & prevents 429s)
const embeddingCache = new Map<string, number[]>();
const MAX_CACHE_SIZE = 500;

/**
 * Genera un embedding determinista de 768 dimensiones como fallback
 * si la API externa agota su cuota (429) o está inaccesible.
 */
function generateDeterministicFallbackEmbedding(text: string): number[] {
  const vector = new Array(768).fill(0);
  const normalized = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const words = normalized.split(/\s+/).filter(Boolean);

  if (words.length === 0) return vector;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = ((hash << 5) - hash + word.charCodeAt(j)) | 0;
    }
    const idx = Math.abs(hash) % 768;
    const weight = 1.0 / Math.sqrt(i + 1);
    vector[idx] += weight;

    // Bi-gram hashing for local context
    if (i > 0) {
      const bigram = `${words[i - 1]}_${word}`;
      let biHash = 0;
      for (let k = 0; k < bigram.length; k++) {
        biHash = ((biHash << 5) - biHash + bigram.charCodeAt(k)) | 0;
      }
      const biIdx = Math.abs(biHash) % 768;
      vector[biIdx] += weight * 0.7;
    }
  }

  // Normalizar vector (L2 norm)
  let sumSq = 0;
  for (let i = 0; i < 768; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq) || 1;
  for (let i = 0; i < 768; i++) {
    vector[i] = Number((vector[i] / norm).toFixed(6));
  }

  return vector;
}

/**
 * Genera el embedding de 768 dimensiones usando Google Gemini text-embedding-004
 * con fallback resiliente ante cuota/429.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const cleanText = (text || "").trim();
  if (!cleanText) return null;

  // Check cache first
  const cacheKey = cleanText.substring(0, 300);
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey)!;
  }

  try {
    const ai = getAiClient();
    if (!ai) {
      const fallback = generateDeterministicFallbackEmbedding(cleanText);
      return fallback;
    }

    // Truncar para evitar sobrepasar límites de tokens de embedding
    const truncated = cleanText.substring(0, 2048);

    // Intentar primero con text-embedding-004 y luego gemini-embedding-2-preview
    if (process.env.DISABLE_GEMINI === "true" || process.env.PAUSE_AI_CALLS === "true") {
      return generateDeterministicFallbackEmbedding(cleanText);
    }
    const modelsToTry = ["text-embedding-004"];
    let values: number[] | null = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await (ai.models as any).embedContent({
          model: modelName,
          contents: truncated,
          config: {
            outputDimensionality: 768
          }
        });

        const extracted = response?.embeddings?.[0]?.values || response?.embedding?.values;
        if (Array.isArray(extracted) && extracted.length > 0) {
          values = extracted;
          break;
        }
      } catch (subErr: any) {
        // Continue to fallback model or deterministic fallback
      }
    }

    if (Array.isArray(values) && values.length > 0) {
      if (embeddingCache.size >= MAX_CACHE_SIZE) {
        const firstKey = embeddingCache.keys().next().value;
        if (firstKey) embeddingCache.delete(firstKey);
      }
      embeddingCache.set(cacheKey, values);
      return values;
    }

    // Fallback determinista si los modelos de Google están en cuota 429
    const fallbackVector = generateDeterministicFallbackEmbedding(cleanText);
    return fallbackVector;
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
      console.warn("[PitchVectorStore] API embedding en límite de cuota (429). Usando vector semántico local resiliente.");
    } else {
      console.warn("[PitchVectorStore] Aviso al generar embedding:", msg);
    }
    return generateDeterministicFallbackEmbedding(cleanText);
  }
}

/**
 * Almacena un pitch exitoso o aprobado en el almacén vectorial
 */
export async function storePitchVector(entry: PitchVectorEntry): Promise<boolean> {
  if (!entry.texto_pitch || !entry.band_id) return false;

  try {
    // Generar embedding combinando el contexto del recinto y el pitch
    const embeddingText = `Recinto: ${entry.nombre_sala} (${entry.tipo_entidad || "sala"}). Ciudad: ${entry.ciudad || "N/D"}. Género: ${entry.genero_musical || "indie"}.
Pitch:
${entry.texto_pitch}`;

    const vector = await generateEmbedding(embeddingText);
    if (!vector) {
      return false;
    }

    const sb = getSupabase();
    const score = entry.conversion_score ?? (
      entry.resultado_respuesta === "confirmado" ? 1.0 :
      entry.resultado_respuesta === "positiva" ? 0.85 : 0.6
    );

    const { error } = await sb.from("pitch_vector_store").insert({
      id: entry.id || `vec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      band_id: entry.band_id,
      lead_id: entry.lead_id || null,
      nombre_sala: entry.nombre_sala,
      tipo_entidad: entry.tipo_entidad || "sala",
      ciudad: entry.ciudad || null,
      genero_musical: entry.genero_musical || null,
      texto_pitch: entry.texto_pitch,
      embedding: vector,
      resultado_respuesta: entry.resultado_respuesta || "pendiente",
      conversion_score: score,
      metadata: entry.metadata || {}
    });

    if (error) {
      console.warn("[PitchVectorStore] Notice inserting vector:", error.message);
      return false;
    }

    return true;
  } catch (err: any) {
    console.warn("[PitchVectorStore] Error storing pitch vector:", err?.message || err);
    return false;
  }
}

/**
 * Recupera semánticamente los pitches más afines utilizando el RPC match_pitch_embeddings
 */
export async function findSemanticallySimilarPitches(params: {
  band_id: string;
  lead: {
    nombre_sala: string;
    tipo?: string;
    ciudad?: string;
    genero?: string;
    notas?: string;
  };
  matchCount?: number;
  threshold?: number;
}): Promise<SimilarPitchResult[]> {
  const { band_id, lead, matchCount = 3, threshold = 0.55 } = params;

  try {
    const queryText = `Sala: ${lead.nombre_sala}. Tipo: ${lead.tipo || "sala"}. Ciudad: ${lead.ciudad || ""}. Género: ${lead.genero || ""}. Notas: ${lead.notas || ""}`;
    const queryVector = await generateEmbedding(queryText);

    if (!queryVector) {
      return [];
    }

    const sb = getSupabase();
    const { data, error } = await sb.rpc("match_pitch_embeddings", {
      query_embedding: queryVector,
      match_threshold: threshold,
      match_count: matchCount,
      filter_band_id: band_id,
      filter_category: lead.tipo || null
    });

    if (error) {
      // Si la función RPC aún no está en Supabase, no romper el flujo
      console.warn("[PitchVectorStore] RPC match_pitch_embeddings notice:", error.message);
      return [];
    }

    if (Array.isArray(data)) {
      return data as SimilarPitchResult[];
    }
    return [];
  } catch (err: any) {
    console.warn("[PitchVectorStore] Exception finding similar pitches:", err?.message || err);
    return [];
  }
}

/**
 * Hook automático para indexar un pitch cuando un lead se confirma o se aprueba
 */
export async function autoIndexPitchOnSuccess(params: {
  bandId: string;
  leadId: string;
  nombreSala: string;
  tipoEntidad: string;
  ciudad?: string;
  pitchText: string;
  resultado: "positiva" | "confirmado" | "aprobado";
}): Promise<void> {
  const conversionScore = 
    params.resultado === "confirmado" ? 1.0 :
    params.resultado === "positiva" ? 0.9 : 0.7;

  storePitchVector({
    band_id: params.bandId,
    lead_id: params.leadId,
    nombre_sala: params.nombreSala,
    tipo_entidad: params.tipoEntidad,
    ciudad: params.ciudad,
    texto_pitch: params.pitchText,
    resultado_respuesta: params.resultado === "aprobado" ? "pendiente" : params.resultado,
    conversion_score: conversionScore
  }).catch(err => {
    console.warn("[PitchVectorStore] Background auto-index notice:", err);
  });
}

export interface NegativePatternEntry {
  pattern_name: string;
  reason: string;
  example_text: string;
}

export const KNOWN_NEGATIVE_PATTERNS: NegativePatternEntry[] = [
  {
    pattern_name: "PERSONNEL_BIO_FLUFF",
    reason: "Listar componentes, nombres y sus instrumentos en un primer correo frío aburre al programador y arruina la conversión.",
    example_text: "Somos una banda de 5 integrantes con Juan a la guitarra y voz, Pedro al bajo, Carlos a la batería y Miguel al teclado."
  },
  {
    pattern_name: "ZERO_ATTACHMENTS_VIOLATION",
    reason: "Prometer adjuntar archivos pesados (PDFs de 15MB, ZIPs, audios WAV/MP3) activa filtros de spam y botones de truncamiento en Gmail.",
    example_text: "Te adjunto en este correo nuestro dossier completo en PDF de 20MB y varios archivos MP3 de muestra."
  },
  {
    pattern_name: "DESPERATION_DISCOVERY_MINDSET",
    reason: "Pedir oportunidades, favores o decir que buscan que alguien les descubra y les lleve la carrera desde cero.",
    example_text: "Agradeceríamos enormemente que nos dierais una pequeña oportunidad para tocar en vuestra sala y descubrirnos."
  },
  {
    pattern_name: "UNEARNED_HYPE_SUPERLATIVES",
    reason: "Usar adjetivos grandilocuentes sin métricas demostrables.",
    example_text: "Ofrecemos una experiencia sónica absolutamente revolucionaria e inolvidable que transformará vuestro escenario."
  }
];

export function checkNegativePatternSimilarity(text: string): { matchesNegative: boolean; reason?: string } {
  const t = text.toLowerCase();
  if (/(juan al|pedro al|carlos a la|miguel al|guitarra y voz.*bajo.*bater)/i.test(t)) {
    return { matchesNegative: true, reason: "Detectado patrón negativo de Personnel Bio (enumeración de músicos)." };
  }
  if (/(adjunto.*pdf|adjuntamos.*zip|descarga el archivo|adjunto los audios)/i.test(t)) {
    return { matchesNegative: true, reason: "Detectado patrón negativo de promesa de adjuntos pesados (Spam filter trigger)." };
  }
  if (/(agradeceríamos.*oportunidad|si tuvierais a bien|descubrirnos|empezar desde cero)/i.test(t)) {
    return { matchesNegative: true, reason: "Detectado patrón negativo de tono rogante/amateur." };
  }
  return { matchesNegative: false };
}
