import { getSupabase } from "./core.js";

/**
 * Registra un consumo de tokens de IA. Es un INSERT puro (nada de
 * leer-modificar-escribir un contador), así que dos llamadas concurrentes
 * para el mismo usuario no compiten entre sí: cada una es su propia fila y
 * Postgres las serializa solo. La suma de deuda vive en `get_ai_debt_cents`,
 * que lee esas filas cuando hace falta en vez de mantener un total en caché.
 */
export async function dbRecordAiUsage(params: {
  userId: string;
  promptTokens: number;
  completionTokens: number;
  modelName: string;
  estimatedCostEur: number;
}): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.from("ai_token_ledger").insert({
    user_id: params.userId,
    prompt_tokens: Math.max(0, Math.round(params.promptTokens) || 0),
    completion_tokens: Math.max(0, Math.round(params.completionTokens) || 0),
    model_name: params.modelName,
    estimated_cost_eur: Math.max(0, params.estimatedCostEur || 0)
  });
  if (error) {
    throw new Error(`No se pudo registrar el consumo de IA: ${error.message}`);
  }
}

/** Deuda viva (sin liquidar) de un usuario, en céntimos de euro. */
export async function dbGetAiDebtCents(userId: string): Promise<number> {
  const sb = getSupabase();
  const { data, error } = await sb.rpc("get_ai_debt_cents", { p_user_id: userId });
  if (error) {
    throw new Error(`No se pudo calcular la deuda de IA: ${error.message}`);
  }
  return Number(data) || 0;
}

export interface SettleAiDonationResult {
  owed_cents: number;
  paid_cents: number;
  became_sponsor: boolean;
  settled_rows: number | null;
}

/**
 * Liquida una donación de forma atómica en Postgres (bloqueo de filas +
 * advisory lock por usuario dentro de `settle_ai_donation`, ver la
 * migración). Node solo pasa lo que ya verificó Stripe; nunca decide aquí
 * si "paga lo suficiente" - eso lo compara la función SQL contra la deuda
 * que ella misma bloquea y suma.
 */
export async function dbSettleAiDonation(
  userId: string,
  amountPaidCents: number,
  stripeEventId: string
): Promise<SettleAiDonationResult> {
  const sb = getSupabase();
  const { data, error } = await sb.rpc("settle_ai_donation", {
    p_user_id: userId,
    p_amount_paid_cents: Math.max(0, Math.round(amountPaidCents)),
    p_stripe_event_id: stripeEventId
  });
  if (error) {
    throw new Error(`No se pudo liquidar la donación de IA: ${error.message}`);
  }
  return data as SettleAiDonationResult;
}
