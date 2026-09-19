import { getSupabase } from "./core.js";

export interface RecordAiUsageParams {
  bandId: string;
  promptTokens: number;
  completionTokens: number;
  modelName: string;
  estimatedCostEur: number;
}

const BATCH_FLUSH_INTERVAL_MS = 10_000;
const BATCH_FLUSH_SIZE_THRESHOLD = 20;

interface PendingLedgerEntry {
  band_id: string;
  prompt_tokens: number;
  completion_tokens: number;
  model_name: string;
  estimated_cost_eur: number;
}

let pendingLedgerEntries: PendingLedgerEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let isFlushing = false;

function scheduleAutoFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushAiLedgerBuffer().catch((err) => {
      console.warn("[AI Ledger Buffer] Error en auto-flush dferido:", err?.message || err);
    });
  }, BATCH_FLUSH_INTERVAL_MS);
  if (typeof flushTimer === "object" && flushTimer && "unref" in flushTimer) {
    (flushTimer as any).unref();
  }
}

/**
 * Vacía en lote (bulk insert) todos los registros de consumo de IA acumulados en el buffer de memoria a Supabase.
 */
export async function flushAiLedgerBuffer(): Promise<void> {
  if (pendingLedgerEntries.length === 0 || isFlushing) return;

  isFlushing = true;
  const entriesToInsert = [...pendingLedgerEntries];
  pendingLedgerEntries = [];

  try {
    const sb = getSupabase();
    const { error } = await sb.from("ai_token_ledger").insert(entriesToInsert);
    if (error) {
      console.error("[AI Ledger Buffer] Error al escribir lote en Supabase, re-encolando:", error.message);
      pendingLedgerEntries = [...entriesToInsert, ...pendingLedgerEntries];
    }
  } catch (err: any) {
    console.error("[AI Ledger Buffer] Excepción al volcar lote a Supabase:", err?.message || err);
    pendingLedgerEntries = [...entriesToInsert, ...pendingLedgerEntries];
  } finally {
    isFlushing = false;
  }
}

/** Permite conocer el número de entradas actualmente retenidas en el buffer (útil para tests e inspección). */
export function getPendingLedgerBufferSize(): number {
  return pendingLedgerEntries.length;
}

/**
 * Registra un consumo de tokens de IA para una banda de forma ultra-rápida en memoria.
 * Acumula en un buffer local y vuelca en lote (bulk insert) hacia Postgres cada 10s o al llegar a 20 entradas,
 * ahorrando cientos de llamadas de red individuales y reduciendo la latencia de la IA a 0ms.
 */
export async function dbRecordAiUsage(params: RecordAiUsageParams): Promise<void> {
  if (!params.bandId) return;

  pendingLedgerEntries.push({
    band_id: params.bandId,
    prompt_tokens: Math.max(0, Math.round(params.promptTokens) || 0),
    completion_tokens: Math.max(0, Math.round(params.completionTokens) || 0),
    model_name: params.modelName,
    estimated_cost_eur: Math.max(0, params.estimatedCostEur || 0)
  });

  if (pendingLedgerEntries.length >= BATCH_FLUSH_SIZE_THRESHOLD) {
    flushAiLedgerBuffer().catch((err) => {
      console.warn("[AI Ledger Buffer] Error en flush por umbral de tamaño:", err?.message || err);
    });
  } else {
    scheduleAutoFlush();
  }
}

/** Deuda viva (sin liquidar) de una banda, en céntimos de euro. */
export async function dbGetAiDebtCents(bandId: string): Promise<number> {
  await flushAiLedgerBuffer();
  const sb = getSupabase();
  try {
    const { data, error } = await sb.rpc("get_ai_debt_cents", { p_band_id: bandId });
    if (!error && data !== null && data !== undefined) {
      return Number(data) || 0;
    }
    // Fallback directo a la tabla ai_token_ledger si la función RPC aún no está en el schema cache
    const { data: rows, error: tableErr } = await sb
      .from("ai_token_ledger")
      .select("estimated_cost_eur")
      .eq("band_id", bandId)
      .is("settled_at", null);

    if (!tableErr && rows) {
      const sumEur = rows.reduce((acc: number, r: any) => acc + (Number(r.estimated_cost_eur) || 0), 0);
      return Math.max(0, Math.round(sumEur * 100));
    }
    return 0;
  } catch (err: any) {
    console.warn("[AiLedger] Fallback deuda IA a 0 tras error:", err?.message);
    return 0;
  }
}

export interface SettleAiDonationResult {
  owed_cents: number;
  paid_cents: number;
  became_sponsor: boolean;
  settled_rows: number | null;
}

/**
 * Liquida una donación de forma atómica en Postgres (bloqueo de filas +
 * advisory lock por banda dentro de `settle_ai_donation`, ver la
 * migración). Node solo pasa lo que ya verificó Stripe; nunca decide aquí
 * si "paga lo suficiente" - eso lo compara la función SQL contra la deuda
 * que ella misma bloquea y suma.
 */
export async function dbSettleAiDonation(
  bandId: string,
  amountPaidCents: number,
  stripeEventId: string
): Promise<SettleAiDonationResult> {
  await flushAiLedgerBuffer();
  const sb = getSupabase();
  const { data, error } = await sb.rpc("settle_ai_donation", {
    p_band_id: bandId,
    p_amount_paid_cents: Math.max(0, Math.round(amountPaidCents)),
    p_stripe_event_id: stripeEventId
  });
  if (error) {
    throw new Error(`No se pudo liquidar la donación de IA: ${error.message}`);
  }
  return data as SettleAiDonationResult;
}
