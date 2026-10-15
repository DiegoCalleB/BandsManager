/**
 * Avisos por email de choques de calendario.
 *
 * Es un aviso TRANSACCIONAL del sistema a las personas afectadas (no lo envía ningún agente de
 * IA ni va a una sala), así que no cae bajo la aprobación humana de AGENTS.md §3. Aun así
 * respeta `band_alert_settings.email_notifications_enabled`.
 *
 * Tres decisiones que importan:
 *  - Solo se manda email por choques DUROS (`choque`). Los `aviso` (mismo día sin horas, margen
 *    corto) se quedan en la pantalla del calendario: por email serían ruido.
 *  - Cada aviso se manda una sola vez por persona y huella (tabla calendar_conflict_notifications).
 *  - Aislamiento entre bandas (§2.1): el músico que está en las dos bandas ve los dos eventos;
 *    el líder de una de ellas solo ve "otro compromiso en otra banda".
 *
 * La lógica de a quién avisar y qué decir es pura (`planificarAvisos`, `construirEmail`) para
 * poder probarla sin Express ni Supabase; `revisarChoquesDeBanda` solo une datos y envío.
 */

import {
  construirEventos,
  detectarChoques,
  describirChoque,
  redactarChoque,
  type Choque,
} from "../../src/utils/calendarConflicts.js";
import { dbGetConcerts, dbGetRehearsals, dbGetRegisteredBands } from "../db.js";
import { dbGetAlertSettings } from "../db/alertSettings.js";
import { cleanBandId } from "../db/core.js";
import {
  dbGetMiembrosBanda,
  dbGetBandasDeUsuario,
  dbYaAvisados,
  dbMarcarAvisados,
  type MiembroBanda,
} from "../db/calendarConflicts.js";
import { sendTransactionalEmail, getProductionAppUrl } from "./transactionalEmail.js";
import { escapeHtml } from "../utils/html.js";
import { captureError } from "../utils/errorTracking.js";

const HORIZONTE_DIAS = 120;
const MAX_BANDAS_CRUZADAS = 25;
const ESPERA_REVISION_MS = 20_000;
const BARRIDO_MS = Number(process.env.CALENDAR_CONFLICT_SWEEP_MS) || 24 * 60 * 60 * 1000;

export interface AvisoPlanificado {
  destinatario: MiembroBanda;
  /** Bandas cuyos eventos puede ver con detalle (las suyas). */
  bandasVisibles: Set<string>;
  choques: Choque[];
}

/**
 * Decide quién recibe qué. Destinatarios de cada choque duro:
 *  - las personas atrapadas en los dos sitios a la vez;
 *  - los líderes de las bandas implicadas (ven la versión sin detalles de la banda ajena).
 * Se descarta a quien no tiene email y los avisos que ya se mandaron.
 */
export function planificarAvisos(params: {
  choques: Choque[];
  miembrosPorBanda: Map<string, MiembroBanda[]>;
  yaAvisados: Set<string>;
}): AvisoPlanificado[] {
  const { choques, miembrosPorBanda, yaAvisados } = params;

  const usuarios = new Map<string, MiembroBanda>();
  const bandasDe = new Map<string, Set<string>>();
  for (const [bandId, miembros] of miembrosPorBanda) {
    for (const m of miembros) {
      usuarios.set(m.id, m);
      if (!bandasDe.has(m.id)) bandasDe.set(m.id, new Set());
      bandasDe.get(m.id)!.add(bandId);
    }
  }

  const porUsuario = new Map<string, AvisoPlanificado>();
  const anotar = (userId: string, choque: Choque) => {
    const u = usuarios.get(userId);
    if (!u || !u.email) return;
    if (yaAvisados.has(`${userId}|${choque.huella}`)) return;
    let aviso = porUsuario.get(userId);
    if (!aviso) {
      aviso = { destinatario: u, bandasVisibles: bandasDe.get(userId) ?? new Set(), choques: [] };
      porUsuario.set(userId, aviso);
    }
    if (!aviso.choques.some((c) => c.huella === choque.huella)) aviso.choques.push(choque);
  };

  for (const choque of choques) {
    if (choque.severidad !== "choque") continue;

    for (const userId of choque.personas) anotar(userId, choque);

    for (const bandId of new Set([choque.a.bandId, choque.b.bandId])) {
      for (const m of miembrosPorBanda.get(bandId) ?? []) if (m.esLider) anotar(m.id, choque);
    }
  }

  return [...porUsuario.values()];
}

const FECHA_LARGA = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

function fechaLegible(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return isNaN(d.getTime()) ? iso : FECHA_LARGA.format(d);
}

export function construirEmail(aviso: AvisoPlanificado, appUrl: string): { subject: string; html: string } {
  const n = aviso.choques.length;
  const subject = n === 1 ? "Tienes un choque en el calendario" : `Tienes ${n} choques en el calendario`;
  const nombre = escapeHtml(aviso.destinatario.nombre);

  const filas = aviso.choques
    .map((c) => {
      const tuyo = c.personas.includes(aviso.destinatario.id);
      const nota = tuyo ? "Te afecta a ti." : "Afecta a otra persona de la banda.";
      return `<li style="margin:0 0 14px 0;"><strong>${escapeHtml(fechaLegible(c.fecha))}</strong><br>${escapeHtml(
        describirChoque(c, aviso.bandasVisibles),
      )}<br><span style="color:#646C78;">${nota}</span></li>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:24px;background:#F6F7F9;font-family:Arial,Helvetica,sans-serif;color:#2A2E35;">
  <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:18px;padding:28px;">
    <p style="margin:0 0 16px 0;font-size:16px;">Hola ${nombre},</p>
    <p style="margin:0 0 20px 0;font-size:15px;line-height:1.5;">${
      n === 1 ? "Hay dos cosas que no pueden pasar a la vez:" : "Hay cosas que no pueden pasar a la vez:"
    }</p>
    <ul style="margin:0 0 20px 0;padding-left:20px;font-size:15px;line-height:1.5;">${filas}</ul>
    <p style="margin:0 0 20px 0;font-size:15px;line-height:1.5;">Mejor moverlo ahora que descubrirlo en la puerta de la sala.</p>
    <p style="margin:0;"><a href="${escapeHtml(appUrl)}" style="display:inline-block;background:#2158DC;color:#FFFFFF;text-decoration:none;padding:10px 20px;border-radius:999px;font-size:15px;">Abrir el calendario</a></p>
  </div>
  <p style="max-width:560px;margin:12px auto 0;font-size:12px;color:#98A0AC;">Aviso automático de BandManager. Puedes desactivar los avisos por email en Ajustes de alertas.</p>
</body></html>`;

  return { subject, html };
}

export interface ResultadoRevision {
  choques: Choque[];
  /** Miembros de la banda y de las bandas cruzadas (para saber qué bandas ve cada persona). */
  miembrosPorBanda: Map<string, MiembroBanda[]>;
  enviados: number;
  omitidoPorAjustes: boolean;
}

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function sumarDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/**
 * Carga la agenda de la banda y la de las bandas de sus músicos, detecta choques y avisa de los
 * nuevos. Devuelve siempre los choques encontrados, se haya enviado algo o no.
 */
export async function revisarChoquesDeBanda(bandId: string, opciones: { enviar?: boolean } = {}): Promise<ResultadoRevision> {
  const enviar = opciones.enviar !== false;
  const principal = cleanBandId(bandId);

  const miembrosPrincipal = await dbGetMiembrosBanda(principal);
  const bandas = new Set<string>([principal]);
  for (const m of miembrosPrincipal) {
    for (const b of await dbGetBandasDeUsuario(m.id)) bandas.add(b);
    if (bandas.size > MAX_BANDAS_CRUZADAS) break;
  }

  const miembrosPorBanda = new Map<string, MiembroBanda[]>([[principal, miembrosPrincipal]]);
  const eventos = [];
  for (const b of [...bandas].slice(0, MAX_BANDAS_CRUZADAS)) {
    if (b !== principal) miembrosPorBanda.set(b, await dbGetMiembrosBanda(b));
    const [concerts, rehearsals] = await Promise.all([dbGetConcerts(b), dbGetRehearsals(b)]);
    eventos.push(...construirEventos(concerts, rehearsals, b));
  }

  const desde = hoyISO();
  const hasta = sumarDias(desde, HORIZONTE_DIAS);
  const choques = detectarChoques(eventos, {
    desde,
    miembrosDe: (b) => (miembrosPorBanda.get(cleanBandId(b)) ?? []).map((m) => m.id),
  }).filter((c) => c.fecha <= hasta && (cleanBandId(c.a.bandId) === principal || cleanBandId(c.b.bandId) === principal));

  if (!enviar || choques.every((c) => c.severidad !== "choque")) {
    return { choques, miembrosPorBanda, enviados: 0, omitidoPorAjustes: false };
  }

  const ajustes = await dbGetAlertSettings(principal);
  if (ajustes && ajustes.email_notifications_enabled === false) {
    return { choques, miembrosPorBanda, enviados: 0, omitidoPorAjustes: true };
  }

  const duros = choques.filter((c) => c.severidad === "choque");
  const candidatos = planificarAvisos({ choques: duros, miembrosPorBanda, yaAvisados: new Set() });
  const yaAvisados = await dbYaAvisados(
    candidatos.map((a) => a.destinatario.id),
    duros.map((c) => c.huella),
  );
  const avisos = planificarAvisos({ choques: duros, miembrosPorBanda, yaAvisados });

  const appUrl = getProductionAppUrl();
  let enviados = 0;
  for (const aviso of avisos) {
    const { subject, html } = construirEmail(aviso, appUrl);
    const res = await sendTransactionalEmail({ to: aviso.destinatario.email, subject, html });
    if (res.success) {
      enviados++;
      await dbMarcarAvisados(
        principal,
        aviso.choques.map((c) => ({ userId: aviso.destinatario.id, huella: c.huella })),
      );
    } else {
      console.warn(`[CalendarConflicts] No se pudo avisar a ${aviso.destinatario.email}: ${res.error}`);
    }
  }

  return { choques, miembrosPorBanda, enviados, omitidoPorAjustes: false };
}

/**
 * Choques de la banda tal y como los puede ver una persona concreta: lo de bandas a las que no
 * pertenece llega reducido a "otro compromiso" (§2.1). Sin envío de emails.
 */
export async function choquesVisiblesPara(bandId: string, userId: string): Promise<Choque[]> {
  const principal = cleanBandId(bandId);
  const { choques, miembrosPorBanda } = await revisarChoquesDeBanda(principal, { enviar: false });
  const visibles = new Set<string>([principal]);
  for (const [b, miembros] of miembrosPorBanda) if (miembros.some((m) => m.id === userId)) visibles.add(b);
  return choques.map((c) => redactarChoque(c, visibles));
}

// --- Disparadores ---------------------------------------------------------------------------

const pendientes = new Map<string, NodeJS.Timeout>();

/**
 * Se llama tras guardar o editar un evento. Espera unos segundos y junta todo en una sola
 * revisión: crear tres ensayos seguidos manda un email, no tres. Nunca bloquea ni rompe el guardado.
 */
export function programarRevisionDeBanda(bandId: string): void {
  const clave = cleanBandId(bandId);
  if (!clave || clave === "__sin_banda__") return;
  const previo = pendientes.get(clave);
  if (previo) clearTimeout(previo);

  const t = setTimeout(() => {
    pendientes.delete(clave);
    revisarChoquesDeBanda(clave).catch((e) => {
      console.warn(`[CalendarConflicts] Revisión de ${clave} fallida:`, e?.message || e);
      captureError(e, { fase: "revisarChoquesDeBanda", bandId: clave });
    });
  }, ESPERA_REVISION_MS);
  t.unref?.();
  pendientes.set(clave, t);
}

let barridoHandle: NodeJS.Timeout | null = null;
let barridoEnCurso = false;

/** Barrido de todas las bandas: caza choques que nacen sin que nadie guarde nada en esta banda. */
export async function barridoDeChoques(): Promise<void> {
  if (barridoEnCurso) return;
  barridoEnCurso = true;
  try {
    const bandas = await dbGetRegisteredBands();
    for (const b of bandas) {
      if ((b.estado_cuenta || "activo") !== "activo" || !b.band_id) continue;
      try {
        await revisarChoquesDeBanda(b.band_id);
      } catch (e) {
        console.warn(`[CalendarConflicts] Barrido: fallo en ${b.band_id}:`, e instanceof Error ? e.message : e);
        captureError(e, { fase: "barridoDeChoques", bandId: b.band_id });
      }
    }
  } finally {
    barridoEnCurso = false;
  }
}

export function startCalendarConflictScheduler(): void {
  if (barridoHandle) return;
  console.log(`[CalendarConflicts] Barrido de choques de calendario cada ${Math.round(BARRIDO_MS / 3_600_000)} h.`);
  barridoHandle = setInterval(() => {
    barridoDeChoques().catch((e) => captureError(e, { fase: "barrido" }));
  }, BARRIDO_MS);
  barridoHandle.unref?.();
}

export function stopCalendarConflictScheduler(): void {
  if (barridoHandle) {
    clearInterval(barridoHandle);
    barridoHandle = null;
  }
  for (const t of pendientes.values()) clearTimeout(t);
  pendientes.clear();
}
