// Scheduler interno de agentes de booking. Sustituye al patrón setInterval con bug de
// doble-disparo de socialRadarService.ts (estado solo en memoria -> se dispara otra vez en
// cada redeploy de Railway): aquí el "ya se ejecutó" se persiste en Supabase
// (agent_schedule_state), así que un redeploy no repite un envío que ya salió.
//
// Reutiliza band_schedules (horas_enviador/dias_enviador, horas_lector/dias_lector), que ya
// existe con su propia UI de configuración (BandScheduleConfig.tsx) - no se inventa un
// horario nuevo por separado.

import { dbGetRegisteredBands, dbGetBandSchedule } from "../db.js";
import { dbGetAgentLastRun, dbSetAgentLastRun } from "../db/agentSchedule.js";
import { leerNoLeidos, GmailAgentError } from "./gmailAgentClient.js";
import { runEnviadorAgent, logAgentExecution } from "./agentEngine.js";

const TICK_MS = 60 * 1000;
let schedulerHandle: NodeJS.Timeout | null = null;

export function currentHourAndDay(timezone: string, now: Date): { hour: number; dayIso: number; dateKey: string } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone || "Europe/Madrid",
    hour12: false,
    weekday: "short",
    hour: "numeric",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = formatter.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
  const hour = parseInt(get("hour"), 10) % 24;
  const dayMap: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  const dayIso = dayMap[get("weekday")] || 1;
  const dateKey = `${get("year")}-${get("month")}-${get("day")}`;
  return { hour, dayIso, dateKey };
}

async function runIfScheduledHour(
  kind: "enviador" | "lector",
  bandId: string,
  schedule: { timezone: string; horas_enviador: number[]; dias_enviador: number[]; horas_lector: number[]; dias_lector: number[] },
  action: () => Promise<void>
) {
  const horas = kind === "enviador" ? schedule.horas_enviador : schedule.horas_lector;
  const dias = kind === "enviador" ? schedule.dias_enviador : schedule.dias_lector;
  const { hour, dayIso, dateKey } = currentHourAndDay(schedule.timezone, new Date());

  if (!dias.includes(dayIso) || !horas.includes(hour)) return;

  // Una entrada por banda+hora+día concretos: si ya se procesó esta hora exacta hoy, no
  // repetir aunque el tick de 60s vuelva a caer dentro de la misma hora.
  const jobName = `${kind}:${bandId}:${dateKey}:${hour}`;
  const lastRun = await dbGetAgentLastRun(jobName);
  if (lastRun) return;

  await dbSetAgentLastRun(jobName);
  try {
    await action();
  } catch (e) {
    console.error(`[AgentScheduler] Error ejecutando ${kind} para ${bandId}:`, e);
  }
}

async function tick() {
  let bands: any[] = [];
  try {
    bands = await dbGetRegisteredBands();
  } catch (e) {
    console.warn("[AgentScheduler] No se pudo obtener la lista de bandas activas:", e);
    return;
  }

  const activeBands = bands.filter((b) => (b.estado_cuenta || "activo") === "activo");

  for (const band of activeBands) {
    const bandId = band.band_id;
    let schedule;
    try {
      schedule = await dbGetBandSchedule(bandId);
    } catch (e) {
      continue;
    }

    // Enviador: despacho de pitches en frío en las horas/días configurados por la banda.
    await runIfScheduledHour("enviador", bandId, schedule, async () => {
      await runEnviadorAgent({ bandId, triggerType: "scheduler" });
    });

    // Lector: solo lee y audita los no leídos por ahora - la clasificación automática y el
    // cambio de estado de los leads es trabajo futuro (ver AGENTS.md / plan de consolidación),
    // para no repetir el mismo error de "fingir trabajo hecho" con una clasificación a medias.
    await runIfScheduledHour("lector", bandId, schedule, async () => {
      const startTime = Date.now();
      try {
        const mensajes = await leerNoLeidos(bandId);
        await logAgentExecution({
          band_id: bandId,
          agente: "lector",
          motor: "node_gmail_engine",
          disparado_por_tipo: "scheduler",
          estado: "success",
          mensaje: `Agente Lector: ${mensajes.length} mensaje(s) no leído(s) en la bandeja de ${bandId}.`,
          conteo_afectados: mensajes.length,
          duracion_ms: Date.now() - startTime,
          detalles: { mensajes }
        });
      } catch (e: any) {
        const sinToken = e instanceof GmailAgentError && e.code === "no_token";
        // Sin Gmail conectado para esta banda no es un error a auditar en cada tick - es
        // simplemente que la banda no lo ha configurado todavía.
        if (sinToken) return;
        await logAgentExecution({
          band_id: bandId,
          agente: "lector",
          motor: "node_gmail_engine",
          disparado_por_tipo: "scheduler",
          estado: "error",
          mensaje: `Agente Lector: error leyendo la bandeja de ${bandId}: ${e.message || e}`,
          duracion_ms: Date.now() - startTime
        });
      }
    });
  }
}

export function startAgentScheduler(): void {
  if (schedulerHandle) return;
  tick().catch((e) => console.error("[AgentScheduler] Error en el primer tick:", e));
  schedulerHandle = setInterval(() => {
    tick().catch((e) => console.error("[AgentScheduler] Error en tick:", e));
  }, TICK_MS);
}

export function stopAgentScheduler(): void {
  if (schedulerHandle) {
    clearInterval(schedulerHandle);
    schedulerHandle = null;
  }
}
