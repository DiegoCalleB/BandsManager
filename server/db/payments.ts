// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { getSupabase, cleanBandId } from "./core.js";
import { ensureRegisteredBandExists } from "./bands.js";

export async function dbGetPayments(bandId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("payments")
    .select("*")
    .eq("band_id", cleanBandId(bandId))
    .order("fecha", { ascending: false });

  if (error) throw new Error(`Supabase Error (payments): ${error.message}`);
  return data || [];
}

export async function dbUpsertPayment(payment: any, bandId: string) {
  const sb = getSupabase();
  // 'bandId' es el único origen de confianza (lo resuelve la ruta desde la sesión); el
  // objeto de entrada puede traer su propio 'band_id' sin validar desde el cuerpo de la
  // petición y no debe primar (ver el mismo fallo corregido en server/db/campaigns.ts).
  const targetBandId = cleanBandId(bandId);
  await ensureRegisteredBandExists(targetBandId);

  // Ver nota equivalente en dbUpsertConcert: un id que no pertenece a la banda del usuario no se
  // reutiliza nunca (evita sobrescribir/robar un pago -dato financiero- de otra banda).
  let finalPaymentId = payment.id;
  if (finalPaymentId) {
    const { data: existing } = await sb.from("payments").select("id, band_id").eq("id", finalPaymentId).maybeSingle();
    if (existing && existing.band_id !== targetBandId) {
      finalPaymentId = `pay-${Date.now()}`;
    }
  }

  const payload = {
    id: finalPaymentId || `pay-${Date.now()}`,
    band_id: targetBandId,
    tipo: payment.tipo || "gasto",
    categoria: payment.categoria || "Logística",
    concepto: payment.concepto || "Concepto",
    importe: Number(payment.importe || 0),
    fecha: payment.fecha || new Date().toISOString().split("T")[0],
    estado: payment.estado || "pendiente"
  };

  const { data, error } = await sb.from("payments").upsert(payload).select().single();
  if (error) throw new Error(`Supabase Error (upsert payment): ${error.message}`);
  return data;
}

export async function dbDeletePayment(id: string, bandId: string) {
  const sb = getSupabase();
  const { error } = await sb.from("payments").delete().eq("id", id).eq("band_id", cleanBandId(bandId));
  if (error) throw new Error(`Supabase Error (delete payment): ${error.message}`);
  return true;
}

// --- SOCIAL METRICS ---
