import crypto from "crypto";
import { getSupabase } from "../db/core.js";
import { esUrlExternaSegura } from "../utils/ssrfGuard.js";

export interface StemPredictionJob {
  id: string;
  band_id: string;
  song_hash: string;
  engine: string;
  provider: 'replicate' | 'fal';
  status: 'processing' | 'succeeded' | 'failed' | 'canceled';
  audio_url: string;
  song_title?: string;
  created_at: string;
  updated_at: string;
  webhook_received_at?: string;
  webhook_signature_verified?: boolean;
  result_stems_map?: any;
  error_message?: string;
}

// Caché en memoria para deduplicación ultra-rápida de webhooks
const processedWebhookIds = new Set<string>();

export interface ReplicateWebhookHeaders {
  id?: string;
  timestamp?: string;
  signature?: string;
}

/**
 * Verifica la firma HMAC-SHA256 del webhook de Replicate según la especificación oficial:
 * 1. Cabeceras: webhook-id, webhook-timestamp, webhook-signature
 * 2. Mensaje firmado: `{webhook-id}.{webhook-timestamp}.{rawBody}`
 * 3. Secreto: Base64 decodificado tras el prefijo `whsec_`
 * 4. Firmas: Compara con cada `v1,<base64>` presente en `webhook-signature`
 * 5. Tolerancia temporal: Rechaza si el timestamp difiere más de `toleranceSeconds` (mitigación Replay Attack)
 */
export function verifyReplicateWebhook(
  rawBody: string | Buffer,
  headers: ReplicateWebhookHeaders,
  signingSecret: string | undefined,
  toleranceSeconds: number = 300
): { valid: boolean; reason?: string } {
  if (!signingSecret) {
    return { valid: false, reason: "No signing secret configured" };
  }
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature) {
    return { valid: false, reason: "Missing required webhook headers (id, timestamp, or signature)" };
  }

  // 1. Verificar timestamp para mitigar replay attacks
  const tsNumber = parseInt(timestamp, 10);
  if (isNaN(tsNumber)) {
    return { valid: false, reason: "Invalid webhook timestamp" };
  }
  const currentTs = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTs - tsNumber) > toleranceSeconds) {
    return { valid: false, reason: `Timestamp outside tolerance window (${Math.abs(currentTs - tsNumber)}s > ${toleranceSeconds}s)` };
  }

  // 2. Extraer clave base64 tras whsec_
  let secretKey = signingSecret;
  if (secretKey.startsWith("whsec_")) {
    secretKey = secretKey.slice(6);
  }
  const keyBuffer = Buffer.from(secretKey, "base64");

  // 3. Generar contenido firmado: {id}.{timestamp}.{body}
  const bodyString = typeof rawBody === "string" ? rawBody : rawBody.toString("utf-8");
  const payloadToSign = `${id}.${timestamp}.${bodyString}`;

  // 4. Calcular HMAC-SHA256 en base64
  const computedHmac = crypto.createHmac("sha256", keyBuffer).update(payloadToSign).digest("base64");
  const computedBuf = Buffer.from(computedHmac, "utf-8");

  // 5. Comparar con las firmas enviadas (pueden ser múltiples separadas por espacios)
  const signatures = signature.trim().split(/\s+/);
  for (const sig of signatures) {
    const sigValue = sig.startsWith("v1,") ? sig.slice(3) : sig;
    const sigBuf = Buffer.from(sigValue, "utf-8");
    if (sigBuf.length === computedBuf.length && crypto.timingSafeEqual(sigBuf, computedBuf)) {
      return { valid: true };
    }
  }

  return { valid: false, reason: "No signature matched" };
}

// Compatibilidad hacia atrás
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | undefined,
  signingSecret: string | undefined
): boolean {
  if (!signatureHeader || !signingSecret) return false;
  // Si viene en formato simple de fallback
  const res = verifyReplicateWebhook(rawBody, { id: "msg_fallback", timestamp: Math.floor(Date.now() / 1000).toString(), signature: signatureHeader }, signingSecret);
  return res.valid;
}

/**
 * Comprueba idempotencia: ¿este webhook ya fue procesado?
 */
export async function isPredictionWebhookProcessed(predictionId: string): Promise<boolean> {
  if (!predictionId) return false;
  if (processedWebhookIds.has(predictionId)) return true;

  try {
    const sb = getSupabase();
    const { data } = await sb
      .from("stem_prediction_jobs")
      .select("id, status, webhook_received_at")
      .eq("id", predictionId)
      .maybeSingle();

    if (data && data.webhook_received_at && (data.status === "succeeded" || data.status === "failed")) {
      processedWebhookIds.add(predictionId);
      return true;
    }
  } catch (e) {
    // Si la tabla aún no existe, fallback a memoria
  }

  return false;
}

/**
 * Registra o actualiza el trabajo de predicción con deduplicación por ID único.
 */
export async function recordPredictionJob(job: Partial<StemPredictionJob> & { id: string }): Promise<void> {
  if (!job.id) return;
  processedWebhookIds.add(job.id);

  try {
    const sb = getSupabase();
    await sb
      .from("stem_prediction_jobs")
      .upsert({
        id: job.id,
        band_id: job.band_id || "sin-banda",
        song_hash: job.song_hash || "hash-desconocido",
        engine: job.engine || "auto",
        provider: job.provider || "replicate",
        status: job.status || "processing",
        audio_url: job.audio_url || "",
        song_title: job.song_title || null,
        created_at: job.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        webhook_received_at: job.webhook_received_at || null,
        webhook_signature_verified: job.webhook_signature_verified || false,
        result_stems_map: job.result_stems_map || null,
        error_message: job.error_message || null
      }, { onConflict: "id" });
  } catch (err: any) {
    console.warn(`[Stem Predictions] Aviso guardando job de predicción ${job.id}:`, err?.message || err);
  }
}

/**
 * Job periódico de reconciliación:
 * Busca predicciones en estado 'processing' con más de staleMinutes (def: 5 min)
 * y consulta directamente el estado a la API de Replicate / Fal.ai por si el webhook se perdió.
 */
export async function reconcileStaleStemPredictions(staleMinutes = 5): Promise<number> {
  const replicateToken = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY;
  if (!replicateToken) return 0;

  try {
    const sb = getSupabase();
    const staleThreshold = new Date(Date.now() - staleMinutes * 60 * 1000).toISOString();

    const { data: staleJobs, error } = await sb
      .from("stem_prediction_jobs")
      .select("*")
      .eq("status", "processing")
      .lt("created_at", staleThreshold)
      .limit(20);

    if (error || !staleJobs || staleJobs.length === 0) {
      return 0;
    }

    console.log(`[Prediction Reconciler] 🔍 Encontradas ${staleJobs.length} predicciones pendientes de reconciliación.`);
    let reconciledCount = 0;

    for (const job of staleJobs) {
      try {
        if (job.provider === "replicate") {
          const res = await fetch(`https://api.replicate.com/v1/predictions/${job.id}`, {
            headers: {
              "Authorization": `Bearer ${replicateToken}`,
              "Content-Type": "application/json"
            },
            signal: AbortSignal.timeout(10000)
          });

          if (!res.ok) {
            console.warn(`[Prediction Reconciler] Replicate devolvió ${res.status} para job ${job.id}`);
            continue;
          }

          const prediction = await res.json();
          const currentStatus = prediction.status;

          if (currentStatus === "succeeded") {
            console.log(`[Prediction Reconciler] ✅ Predicción ${job.id} reconciliada exitosamente (succeeded).`);
            await sb
              .from("stem_prediction_jobs")
              .update({
                status: "succeeded",
                result_stems_map: prediction.output || null,
                updated_at: new Date().toISOString()
              })
              .eq("id", job.id);
            reconciledCount++;
          } else if (currentStatus === "failed" || currentStatus === "canceled") {
            console.warn(`[Prediction Reconciler] ❌ Predicción ${job.id} reconciliada como ${currentStatus}:`, prediction.error);
            await sb
              .from("stem_prediction_jobs")
              .update({
                status: currentStatus,
                error_message: prediction.error || `Prediction ended with status ${currentStatus}`,
                updated_at: new Date().toISOString()
              })
              .eq("id", job.id);
            reconciledCount++;
          }
        }
      } catch (jobErr: any) {
        console.warn(`[Prediction Reconciler] Error reconciliando job ${job.id}:`, jobErr?.message || jobErr);
      }
    }

    return reconciledCount;
  } catch (err: any) {
    console.warn("[Prediction Reconciler] Fallo en ejecución del reconciliador:", err?.message || err);
    return 0;
  }
}
