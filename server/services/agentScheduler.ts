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
import { EmailAgentError } from "./emailAgentClient.js";
import { runLectorAgent } from "./lectorAgent.js";
import { runEnviadorAgent, logAgentExecution } from "./agentEngine.js";
import { captureError } from "../utils/errorTracking.js";

const TICK_MS = 60 * 1000;
let schedulerHandle: NodeJS.Timeout | null = null;
// Segunda barrera además de los timeouts de gmailApiClient.ts: si por lo que sea un tick tarda
// más de 60s (una llamada externa lenta, muchas bandas, lo que sea), el setInterval de abajo
// dispara igualmente el siguiente sin esperar a que termine el anterior - así que sin este guard
// se podían ir acumulando ticks solapados indefinidamente. Con él, un tick lento simplemente hace
// que se salten los siguientes disparos hasta que el que está en curso termine.
let tickEnCurso = false;

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
      // Sin bandId todavía, así que no hay banda a la que asociar un registro en
      // agent_execution_logs - sin esto, un Supabase caído deja el scheduler entero mudo, en
      // cada tick, sin ningún rastro en ningún sitio.
      console.warn("[AgentScheduler] No se pudo obtener la lista de bandas activas:", e);
      captureError(e, { fase: "dbGetRegisteredBands" });
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

      // Enviador: despacho de pitches en frío en las horas/días configurados por la banda - eso
      // sí debe respetar una ventana comercial, para no escribir a una sala a las 3 de la madrugada.
      await runIfScheduledHour("enviador", bandId, schedule, async () => {
        await runEnviadorAgent({ bandId, triggerType: "scheduler" });
      });

      // Lector: lee la bandeja real, empareja respuestas con leads por email de contacto y
      // transiciona su estado, y comprueba borradores de Gmail enviados a mano
      // (server/services/lectorAgent.ts). Nunca redacta ni envía nada, así que a diferencia del
      // Enviador no hay ninguna razón para restringirlo a una ventana horaria - corre en TODOS
      // los ticks (cada 60s), para que una respuesta o un envío manual se reflejen cuanto antes.
      // horas_lector/dias_lector (band_schedules) ya no lo limitan.
      await runLectorTick(bandId);
    }

    // Señal de vida mínima: hoy costó más de dos horas darse cuenta de que el scheduler estaba
    // parado porque ni un solo tick sano deja rastro (el Lector solo audita cuando encuentra algo
    // que contar, y el Enviador solo dentro de su ventana horaria) - sin esto, "todo en silencio"
    // es indistinguible de "todo funcionando perfectamente" hasta que alguien nota que un lead
    // concreto no se actualiza.
    console.log(`[AgentScheduler] Tick ${new Date().toISOString()} - ${activeBands.length} banda(s) activa(s) revisada(s).`);
  } finally {
    tickEnCurso = false;
  }
}

async function runLectorTick(bandId: string): Promise<void> {
  const startTime = Date.now();
  try {
    const resultado = await runLectorAgent(bandId);
    // Solo se audita cuando hay algo que contar - de lo contrario, correr cada minuto llenaría
    // agent_execution_logs de miles de entradas "0 mensajes, 0 leads" al día por banda. Un tope de
    // borradores IA alcanzado SÍ cuenta como "algo que contar" aunque no haya leads actualizados:
    // antes era invisible (solo un console.warn en lectorAgent.ts) y una banda podía tener el
    // Contestador automático bloqueado durante horas sin ninguna pista en Auditoría.
    if (resultado.mensajesLeidos === 0 && resultado.borradoresEnviadosDetectados === 0 && resultado.borradorIaBloqueadosPorLimite === 0) return;
    const partesBorrador: string[] = [];
    if (resultado.borradoresEnviadosDetectados > 0) partesBorrador.push(`${resultado.borradoresEnviadosDetectados} por borrador de Gmail enviado a mano`);
    if (resultado.borradorIaGenerados > 0) partesBorrador.push(`${resultado.borradorIaGenerados} respuesta(s) redactada(s) por IA (Contestador, pendiente de aprobación)`);
    if (resultado.borradorIaFallidos > 0) partesBorrador.push(`${resultado.borradorIaFallidos} fallo(s) redactando con IA`);
    if (resultado.borradorIaBloqueadosPorLimite > 0) partesBorrador.push(`${resultado.borradorIaBloqueadosPorLimite} lead(s) sin redactar por tope de IA/hora alcanzado`);
    await logAgentExecution({
      band_id: bandId,
      agente: "lector",
      motor: "node_email_engine",
      disparado_por_tipo: "scheduler",
      estado: resultado.borradorIaBloqueadosPorLimite > 0 || resultado.borradorIaFallidos > 0 ? "warning" : "success",
      mensaje: `Agente Lector: ${resultado.mensajesLeidos} mensaje(s) revisado(s), ${resultado.leadsActualizados.length} lead(s) actualizado(s)${partesBorrador.length > 0 ? ` (${partesBorrador.join(", ")})` : ""} en la bandeja de ${bandId}.`,
      conteo_afectados: resultado.leadsActualizados.length,
      duracion_ms: Date.now() - startTime,
      detalles: resultado
    });
  } catch (e: any) {
    const sinCuenta = e instanceof EmailAgentError && e.code === "no_token";
    // Sin cuenta de email conectada para esta banda no es un error a auditar en cada tick - es
    // simplemente que la banda no lo ha configurado todavía.
    if (sinCuenta) return;
    await logAgentExecution({
      band_id: bandId,
      agente: "lector",
      motor: "node_email_engine",
      disparado_por_tipo: "scheduler",
      estado: "error",
      mensaje: `Agente Lector: error leyendo la bandeja de ${bandId}: ${e.message || e}`,
      duracion_ms: Date.now() - startTime
    });
  }
}

export function startAgentScheduler(): void {
  if (schedulerHandle) return;
  console.log("[AgentScheduler] Iniciado - tick cada 60s.");
  tick().catch((e) => {
    console.error("[AgentScheduler] Error en el primer tick:", e);
    captureError(e, { fase: "primer tick" });
  });
  schedulerHandle = setInterval(() => {
    tick().catch((e) => {
      console.error("[AgentScheduler] Error en tick:", e);
      captureError(e, { fase: "tick" });
    });
  }, TICK_MS);
}

export function stopAgentScheduler(): void {
  if (schedulerHandle) {
    clearInterval(schedulerHandle);
    schedulerHandle = null;
  }
}
