// Ajustes de impresión del setlist por banda (`band_print_settings`).
// El `bandId` llega YA resuelto por la ruta (getTargetBandId) y es el único origen de confianza:
// nunca se lee un band_id del cuerpo de la petición (ver AGENTS.md §2.1).

import { getSupabase, cleanBandId } from "./core.js";
import { ensureRegisteredBandExists } from "./bands.js";
import { mergePrintSettings, sanitizePrintSettings, type PrintSettings } from "../../src/utils/printSettings.js";

/** Ajustes guardados de la banda (completados con los valores por defecto), o null si no hay BD. */
export async function dbGetPrintSettings(bandId: string): Promise<PrintSettings | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const targetBand = cleanBandId(bandId);
  const { data, error } = await sb
    .from("band_print_settings")
    .select("settings")
    .eq("band_id", targetBand)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error(`[PrintSettings DB] Error consultando ajustes de impresión de ${targetBand}:`, error);
    return null;
  }
  return mergePrintSettings(data?.settings);
}

/** Guarda SOLO lo que pasa la lista blanca, mezclado con lo ya guardado. */
export async function dbUpsertPrintSettings(bandId: string, incoming: unknown): Promise<PrintSettings | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const targetBand = cleanBandId(bandId);
  await ensureRegisteredBandExists(targetBand);

  const { data: existing } = await sb
    .from("band_print_settings")
    .select("settings")
    .eq("band_id", targetBand)
    .maybeSingle();

  const merged = mergePrintSettings({ ...(existing?.settings as object), ...sanitizePrintSettings(incoming) });

  const { error } = await sb
    .from("band_print_settings")
    .upsert({ band_id: targetBand, settings: merged, updated_at: new Date().toISOString() }, { onConflict: "band_id" });

  if (error) {
    console.error(`[PrintSettings DB] Error guardando ajustes de impresión de ${targetBand}:`, error);
    return null;
  }
  return merged;
}
