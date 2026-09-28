// Producer/Scheduler de agentes de booking en cola distribuida.
// En lugar de ejecutar la lógica pesada de forma síncrona en el Event Loop de Express,
// comprueba la programación de cada banda y deposita trabajos en agent_jobs_queue
// para ser procesados por agentQueueWorker.ts.

import { dbGetRegisteredBands, dbGetBandSchedule, dbGetBandEmailAccount, dbGetBandGmailOAuth } from "../db.js";
import { dbGetAgentLastRun, dbSetAgentLastRun } from "../db/agentSchedule.js";
import { enqueueAgentJob } from "./agentQueueService.js";
import { startAgentQueueWorker, stopAgentQueueWorker } from "./agentQueueWorker.js";
import { captureError } from "../utils/errorTracking.js";
import { isGmailRateLimited } from "./gmailApiClient.js";

// Planificador periódico: por defecto 1 vez al día (24 horas) para optimizar consultas y costos en Supabase.
// Puede modificarse mediante la variable de entorno AGENT_SCHEDULER_INTERVAL_MS.
const TICK_MS = Number(process.env.AGENT_SCHEDULER_INTERVAL_MS) || (24 * 60 * 60 * 1000);
let schedulerHandle: NodeJS.Timeout | null = null;
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

  const jobName = `${kind}:${bandId}:${dateKey}:${hour}`;
  const lastRun = await dbGetAgentLastRun(jobName);
  if (lastRun) return;

  await dbSetAgentLastRun(jobName);
  try {
    await action();
  } catch (e) {
    console.error(`[AgentScheduler] Error encolando ${kind} para ${bandId}:`, e);
  }
}

async function tick() {
  if (tickEnCurso) {
    console.warn("[AgentScheduler] El tick anterior todavía no ha terminado - se salta este disparo.");
    return;
  }
  tickEnCurso = true;
  try {
    let bands: any[] = [];
    try {
      bands = await dbGetRegisteredBands();
    } catch (e) {
      console.warn("[AgentScheduler] No se pudo obtener la lista de bandas activas:", e);
      captureError(e, { fase: "dbGetRegisteredBands" });
      return;
    }

    const activeBands = bands.filter((b) => (b.estado_cuenta || "activo") === "activo");

    for (const band of activeBands) {
      const bandId = band.band_id;

      // El Agente Lector y Enviador solo deben operar si la banda tiene configurada su cuenta de email (Gmail OAuth o IMAP)
      const tieneEmail = await bandHasEmailConfigured(bandId);
      if (!tieneEmail) {
        continue;
      }

      let schedule;
      try {
        schedule = await dbGetBandSchedule(bandId);
      } catch (e) {
        continue;
      }

      // Enviador: Encola despacho de pitches respetando la ventana comercial de la banda
      await runIfScheduledHour("enviador", bandId, schedule, async () => {
        await enqueueAgentJob({
          bandId,
          agentType: "redactor_pitch_dispatch",
          payload: { trigger: "scheduled_window" }
        });
      });

      // Lector: Encola revisión periódica de la bandeja de entrada para la banda si no está en enfriamiento por rate limit
      if (!isGmailRateLimited(bandId)) {
        await enqueueAgentJob({
          bandId,
          agentType: "lector_inbox_check",
          payload: { trigger: "scheduled_daily_poll" }
        });
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
  console.log(`[AgentScheduler] Iniciado Scheduler & Worker Engine (Frecuencia de sondeo: cada ${Math.round(TICK_MS / (60 * 60 * 1000))} horas).`);

  // Arrancar el worker de consumo de colas
  startAgentQueueWorker();

  // El planificador se programa periódicamente a su intervalo normal (24h por defecto)
  schedulerHandle = setInterval(() => {
    tick().catch((e) => {
      console.error("[AgentScheduler] Error en tick del productor:", e);
      captureError(e, { fase: "tick" });
    });
  }, TICK_MS);
}

export function stopAgentScheduler(): void {
  stopAgentQueueWorker();
  if (schedulerHandle) {
    clearInterval(schedulerHandle);
    schedulerHandle = null;
  }
}
