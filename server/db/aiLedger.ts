// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { getSupabase } from "./core.js";

/**
 * Registra un consumo de tokens de IA para una banda. Es un INSERT puro (nada de
 * leer-modificar-escribir un contador), así que dos llamadas concurrentes
 * para la misma banda no compiten entre sí: cada una es su propia fila y
 * Postgres las serializa solo. La suma de deuda vive en `get_ai_debt_cents`,
 * que lee esas filas cuando hace falta en vez de mantener un total en caché.
 */
export async function dbRecordAiUsage(params: {
  bandId: string;
  promptTokens: number;
  completionTokens: number;
  modelName: string;
  estimatedCostEur: number;
}): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.from("ai_token_ledger").insert({
    band_id: params.bandId,
    prompt_tokens: Math.max(0, Math.round(params.promptTokens) || 0),
    completion_tokens: Math.max(0, Math.round(params.completionTokens) || 0),
    model_name: params.modelName,
    estimated_cost_eur: Math.max(0, params.estimatedCostEur || 0)
  });
  if (error) {
    throw new Error(`No se pudo registrar el consumo de IA: ${error.message}`);
  }
}

/** Deuda viva (sin liquidar) de una banda, en céntimos de euro. */
export async function dbGetAiDebtCents(bandId: string): Promise<number> {
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
