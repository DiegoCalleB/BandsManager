// Producción de directo: run of show (`run_of_show`) y checklists de equipo (`gear_checklists`) por
// fecha.

import { getSupabase, cleanBandId } from "./core.js";
import { ensureRegisteredBandExists } from "./bands.js";

/** Fila de `run_of_show`: una actividad con hora dentro del día de concierto. */
export interface FilaRunOfShow {
  id: string;
  band_id: string;
  fecha: string;
  time: string;
  activity: string;
  done: boolean;
}

/** Fila de `gear_checklists`: un elemento del equipo a revisar ese día. */
export interface FilaGearChecklist {
  id: string;
  band_id: string;
  fecha: string;
  label: string;
  checked: boolean;
}

/** Elemento tal como lo manda el cliente (la fecha y la banda las pone el servidor). */
type EntradaDelDia<F> = Partial<Omit<F, "band_id" | "fecha">>;

/** Agrupa las filas por su fecha. */
function agruparPorFecha<F extends { fecha: string }>(filas: F[]): Record<string, F[]> {
  const result: Record<string, F[]> = {};
  filas.forEach(item => {
    if (!result[item.fecha]) result[item.fecha] = [];
    result[item.fecha].push(item);
  });
  return result;
}

export async function dbGetRunOfShow(bandId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("run_of_show")
    .select("*")
    .eq("band_id", cleanBandId(bandId))
    .order("fecha", { ascending: true })
    .order("time", { ascending: true });

  if (error) throw new Error(`Supabase Error (run_of_show): ${error.message}`);

  return agruparPorFecha<FilaRunOfShow>(data || []);
}

export async function dbSyncRunOfShowForDate(dateKey: string, items: EntradaDelDia<FilaRunOfShow>[], bandId: string) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(bandId);
  await ensureRegisteredBandExists(targetBandId);

  // Delete previous items for this date & band
  await sb.from("run_of_show").delete().eq("fecha", dateKey).eq("band_id", targetBandId);

  if (!items || items.length === 0) return true;

  const rows: FilaRunOfShow[] = items.map((it, idx) => ({
    id: it.id || `ros-${dateKey}-${idx}`,
    band_id: targetBandId,
    fecha: dateKey,
    time: it.time || "12:00",
    activity: it.activity || "",
    done: Boolean(it.done)
  }));

  const { error } = await sb.from("run_of_show").insert(rows);
  if (error) throw new Error(`Supabase Error (sync run_of_show): ${error.message}`);
  return true;
}

// --- GEAR CHECKLISTS ---
export async function dbGetGearChecklists(bandId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("gear_checklists")
    .select("*")
    .eq("band_id", cleanBandId(bandId))
    .order("fecha", { ascending: true });

  if (error) throw new Error(`Supabase Error (gear_checklists): ${error.message}`);

  return agruparPorFecha<FilaGearChecklist>(data || []);
}

export async function dbSyncGearChecklistForDate(dateKey: string, items: EntradaDelDia<FilaGearChecklist>[], bandId: string) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(bandId);
  await ensureRegisteredBandExists(targetBandId);

  await sb.from("gear_checklists").delete().eq("fecha", dateKey).eq("band_id", targetBandId);

  if (!items || items.length === 0) return true;

  const rows: FilaGearChecklist[] = items.map((it, idx) => ({
    id: it.id || `gear-${dateKey}-${idx}`,
    band_id: targetBandId,
    fecha: dateKey,
    label: it.label || "",
    checked: Boolean(it.checked)
  }));

  const { error } = await sb.from("gear_checklists").insert(rows);
  if (error) throw new Error(`Supabase Error (sync gear_checklists): ${error.message}`);
  return true;
}

// --- PURE SUPABASE STATE LOADER (NO FALLBACK TO memory/json) ---
