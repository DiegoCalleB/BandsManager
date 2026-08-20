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
  const targetBandId = cleanBandId(payment.band_id || bandId);
  await ensureRegisteredBandExists(targetBandId);

  const payload = {
    id: payment.id || `pay-${Date.now()}`,
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
