// Producer/Scheduler de agentes de booking en cola distribuida.
// En lugar de ejecutar la lógica pesada de forma síncrona en el Event Loop de Express,
// comprueba la programación de cada banda y deposita trabajos en agent_jobs_queue
// para ser procesados por agentQueueWorker.ts.

import { dbGetRegisteredBands, dbGetBandSchedule, dbGetBandEmailAccount, dbGetBandGmailOAuth } from "../db.js";
import { dbGetAgentLastRun, dbSetAgentLastRun } from "../db/agentSchedule.js";
import { enqueueAgentJob } from "./agentQueueService.js";
import { startAgentQueueWorker, stopAgentQueueWorker } from "./agentQueueWorker.js";
import { captureError } from "../utils/errorTracking.js";
import type { RegisteredBand } from "../../src/types.js";
import { isGmailRateLimited } from "./gmailApiClient.js";

// Cada tick solo mira la hora local de cada banda; los agentes se encolan cuando esa hora está en
// su ventana (horas_*/dias_* de band_schedules) y no se han lanzado ya en esa hora. Antes el tick
// era de 24 h y además exigía coincidir con la hora configurada, así que el Enviador solo salía si
// la hora de arranque del proceso caía en la ventana, y cada redeploy reiniciaba la cuenta. Un
// tick de 5 min dispara cada ventana con <=5 min de retraso; cualquier valor >1 h salta horas.
const TICK_MS = Number(process.env.AGENT_SCHEDULER_INTERVAL_MS) || 5 * 60 * 1000;
// Primer tick poco después de arrancar: tras un deploy no hay que esperar un intervalo entero.
const PRIMER_TICK_MS = 30 * 1000;
let schedulerHandle: NodeJS.Timeout | null = null;
let primerTickHandle: NodeJS.Timeout | null = null;
let tickEnCurso = false;

/**
 * Comprueba si la banda tiene conectada una cuenta de correo válida
 * (Gmail OAuth2 o credenciales IMAP/SMTP) para operar los agentes.
 */
export async function bandHasEmailConfigured(bandId: string): Promise<boolean> {
  try {
    const [oauth, imap] = await Promise.all([
      dbGetBandGmailOAuth(bandId),
      dbGetBandEmailAccount(bandId)
    ]);
    
    // Gmail OAuth requiere que exista el refresh_token y que las credenciales de Google estén en las variables de entorno
    const hasValidGmail = Boolean(
      oauth?.refresh_token && 
      process.env.GOOGLE_OAUTH_CLIENT_ID && 
      process.env.GOOGLE_OAUTH_CLIENT_SECRET
    );

    // IMAP requiere al menos email y configuración de host/servidor
    const hasValidImap = Boolean(
      imap?.email && 
      (imap?.imap_host || imap?.smtp_host)
    );

    return hasValidGmail || hasValidImap;
  } catch {
    return false;
  }
}

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

type HorarioAgentes = { timezone: string; horas_enviador: number[]; dias_enviador: number[]; horas_lector: number[]; dias_lector: number[] };

/** Clave de la ejecución si a `kind` le toca correr ahora según el horario de la banda; si no, null. */
export function claveEjecucionProgramada(kind: "enviador" | "lector", bandId: string, schedule: HorarioAgentes, now: Date): string | null {
  const horas = kind === "enviador" ? schedule.horas_enviador : schedule.horas_lector;
  const dias = kind === "enviador" ? schedule.dias_enviador : schedule.dias_lector;
  const { hour, dayIso, dateKey } = currentHourAndDay(schedule.timezone, now);
  if (!dias.includes(dayIso) || !horas.includes(hour)) return null;
  return `${kind}:${bandId}:${dateKey}:${hour}`;
}

/** Ejecuta `action` una sola vez por clave: la marca en agent_schedule_state sobrevive a redeploys. */
async function ejecutarUnaVez(jobName: string, action: () => Promise<void>) {
  if (await dbGetAgentLastRun(jobName)) return;
  await dbSetAgentLastRun(jobName);
  try {
    await action();
  } catch (e) {
    console.error(`[AgentScheduler] Error encolando ${jobName}:`, e);
  }
}

async function tick() {
  if (tickEnCurso) {
    console.warn("[AgentScheduler] El tick anterior todavía no ha terminado - se salta este disparo.");
    return;
  }
  tickEnCurso = true;
  try {
    let bands: Pick<RegisteredBand, "band_id" | "estado_cuenta">[] = [];
    try {
      bands = await dbGetRegisteredBands();
    } catch (e) {
      console.warn("[AgentScheduler] No se pudo obtener la lista de bandas activas:", e);
      captureError(e, { fase: "dbGetRegisteredBands" });
      return;
    }

    const activeBands = bands.filter((b) => (b.estado_cuenta || "activo") === "activo");

    const now = new Date();
    for (const band of activeBands) {
      const bandId = band.band_id;

      let schedule;
      try {
        schedule = await dbGetBandSchedule(bandId);
      } catch {
        continue;
      }

      // Primero lo barato (la hora): las consultas de cuenta de email y last-run solo se hacen
      // cuando a esta banda le toca algo en esta hora.
      const claveEnviador = claveEjecucionProgramada("enviador", bandId, schedule, now);
      const claveLector = isGmailRateLimited(bandId) ? null : claveEjecucionProgramada("lector", bandId, schedule, now);
      if (!claveEnviador && !claveLector) continue;

      // Lector y Enviador solo operan si la banda tiene cuenta de email (Gmail OAuth o IMAP).
      if (!(await bandHasEmailConfigured(bandId))) continue;

      // Enviador: despacho de lo ya aprobado dentro de la ventana comercial de la banda.
      if (claveEnviador) {
        await ejecutarUnaVez(claveEnviador, () => enqueueAgentJob({
          bandId,
          agentType: "redactor_pitch_dispatch",
          payload: { trigger: "scheduled_window" }
        }).then(() => undefined));
      }

      // Lector: revisión de la bandeja en las horas de lectura de la banda.
      if (claveLector) {
        await ejecutarUnaVez(claveLector, () => enqueueAgentJob({
          bandId,
          agentType: "lector_inbox_check",
          payload: { trigger: "scheduled_window" }
        }).then(() => undefined));
      }
    }

    console.log(`[AgentScheduler] Tick ${new Date().toISOString()} - ${activeBands.length} banda(s) sincronizada(s) con la cola de agentes.`);
  } finally {
    tickEnCurso = false;
  }
}

/**
 * Permite disparar manualmente el tick del planificador bajo demanda (ej. desde UI de administración).
 */
export async function triggerManualSchedulerTick(): Promise<void> {
  await tick();
}

export function startAgentScheduler(): void {
  if (schedulerHandle) return;
  console.log(`[AgentScheduler] Iniciado Scheduler & Worker Engine (tick cada ${Math.round(TICK_MS / 1000)} s).`);
  if (TICK_MS > 60 * 60 * 1000) {
    console.warn("[AgentScheduler] AGENT_SCHEDULER_INTERVAL_MS > 1 h: se saltarán horas de las ventanas de envío y lectura.");
  }

  // Arrancar el worker de consumo de colas
  startAgentQueueWorker();

  const lanzarTick = () => {
    tick().catch((e) => {
      console.error("[AgentScheduler] Error en tick del productor:", e);
      captureError(e, { fase: "tick" });
    });
  };
  primerTickHandle = setTimeout(lanzarTick, PRIMER_TICK_MS);
  schedulerHandle = setInterval(lanzarTick, TICK_MS);
}

export function stopAgentScheduler(): void {
  stopAgentQueueWorker();
  if (primerTickHandle) {
    clearTimeout(primerTickHandle);
    primerTickHandle = null;
  }
  if (schedulerHandle) {
    clearInterval(schedulerHandle);
    schedulerHandle = null;
  }
}
