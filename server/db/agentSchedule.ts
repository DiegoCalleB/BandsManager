import { getSupabase } from "./core.js";

// Fallback en memoria: si Supabase falla o la tabla aún no existe (antes de aplicar la
// migración), el scheduler sigue funcionando dentro de este proceso, pero no sobrevive a un
// redeploy - por eso agent_schedule_state en Supabase es la fuente de verdad real.
const inMemoryLastRun: Record<string, string> = {};

export async function dbGetAgentLastRun(jobName: string): Promise<Date | null> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("agent_schedule_state")
      .select("last_run_at")
      .eq("job_name", jobName)
      .maybeSingle();

    if (!error && data?.last_run_at) {
      inMemoryLastRun[jobName] = data.last_run_at;
      return new Date(data.last_run_at);
    }
  } catch (e) {
    // Tabla no disponible todavía: usar el respaldo en memoria de este proceso.
  }

  return inMemoryLastRun[jobName] ? new Date(inMemoryLastRun[jobName]) : null;
}

export async function dbSetAgentLastRun(jobName: string, when: Date = new Date()): Promise<void> {
  const iso = when.toISOString();
  inMemoryLastRun[jobName] = iso;

  try {
    const sb = getSupabase();
    await sb
      .from("agent_schedule_state")
      .upsert({ job_name: jobName, last_run_at: iso }, { onConflict: "job_name" });
  } catch (e) {
    console.warn(`Notice guardando last_run_at de '${jobName}' en Supabase:`, e);
  }
}
