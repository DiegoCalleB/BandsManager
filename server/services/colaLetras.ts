// Cola de transcripción de letras en el servidor: sobrevive a recargar o cerrar la pestaña (los
// trabajos viven en `letras_jobs`) y la puede alimentar el ajuste opt-in «Transcribir
// automáticamente lo nuevo» (`band_letras_auto`). Un solo trabajo a la vez (concurrencia 1),
// reintentos con espera, tope mensual por plan y todo acotado a la banda.

import { getSupabase, cleanBandId } from "../db/core.js";
import { dbGetSongs, dbGetRegisteredBandById } from "../db.js";
import { ejecutarLetraSincronizada } from "./letraCancion.js";
import { resumirTranscripcion } from "../../src/utils/transcripcionMasiva.js";
import {
  estadoTrasEjecucion,
  retrasoReintentoMs,
  limiteLetrasMes,
  huecoDisponible,
  inicioDeMes,
  type EstadoJob,
} from "../utils/colaLetras.js";

const ACTIVOS: EstadoJob[] = ["pendiente", "en_curso"];

export async function dbGetLetrasAuto(bandId: string): Promise<boolean> {
  const { data } = await getSupabase().from("band_letras_auto").select("activado").eq("band_id", cleanBandId(bandId)).maybeSingle();
  return Boolean(data?.activado);
}

export async function dbSetLetrasAuto(bandId: string, activado: boolean): Promise<void> {
  const { error } = await getSupabase()
    .from("band_letras_auto")
    .upsert({ band_id: cleanBandId(bandId), activado, updated_at: new Date().toISOString() }, { onConflict: "band_id" });
  if (error) throw new Error(`Supabase Error (band_letras_auto): ${error.message}`);
}

async function planDeBanda(bandId: string): Promise<string> {
  try {
    return (await dbGetRegisteredBandById(bandId))?.plan || "ensayo";
  } catch {
    return "ensayo";
  }
}

async function contar(bandId: string, estados: EstadoJob[], desde?: string): Promise<number> {
  let q = getSupabase().from("letras_jobs").select("id", { count: "exact", head: true }).eq("band_id", bandId).in("estado", estados);
  if (desde) q = q.gte("updated_at", desde);
  const { count } = await q;
  return count ?? 0;
}

export interface ResumenCola {
  activado: boolean;
  limiteMes: number;
  hechasMes: number;
  pendientes: number;
  enCurso: number;
  hechas: number;
  sinLetra: string[]; // ids de canción
  fallidas: string[];
  omitidas: number;
}

export async function resumenCola(bandIdCrudo: string): Promise<ResumenCola> {
  const bandId = cleanBandId(bandIdCrudo);
  const { data } = await getSupabase().from("letras_jobs").select("song_id, estado").eq("band_id", bandId);
  const filas = (data ?? []) as { song_id: string; estado: EstadoJob }[];
  const ids = (e: EstadoJob) => filas.filter((f) => f.estado === e).map((f) => f.song_id);
  return {
    activado: await dbGetLetrasAuto(bandId),
    limiteMes: limiteLetrasMes(await planDeBanda(bandId)),
    hechasMes: await contar(bandId, ["hecha"], inicioDeMes()),
    pendientes: ids("pendiente").length,
    enCurso: ids("en_curso").length,
    hechas: ids("hecha").length,
    sinLetra: ids("sin_letra"),
    fallidas: ids("fallida"),
    omitidas: ids("omitida").length,
  };
}

export interface ResultadoEncolar {
  encoladas: number;
  /** Canciones que cumplían los requisitos pero no caben en el tope mensual del plan. */
  porTope: number;
  limiteMes: number;
}

/**
 * Encola canciones de la banda. SIEMPRE se revalida en el servidor (audio y sin cifrado), venga el
 * pedido del cliente o del guardado de una canción nueva. `songIds` vacío = todas las pendientes.
 * Un trabajo ya terminado (sin_letra/omitida/fallida) solo se reabre en una petición manual.
 */
export async function encolarLetras(
  bandIdCrudo: string,
  { songIds, origen }: { songIds?: string[]; origen: "manual" | "auto" }
): Promise<ResultadoEncolar> {
  const bandId = cleanBandId(bandIdCrudo);
  const sb = getSupabase();
  const songs = await dbGetSongs(bandId);
  const candidatas = resumirTranscripcion(Array.isArray(songs) ? songs : []).pendientes.filter(
    (s) => !songIds || songIds.includes(s.id)
  );
  const limiteMes = limiteLetrasMes(await planDeBanda(bandId));
  if (!candidatas.length) return { encoladas: 0, porTope: 0, limiteMes };

  const { data: existentes } = await sb.from("letras_jobs").select("song_id, estado").eq("band_id", bandId).in("song_id", candidatas.map((s) => s.id));
  const estadoPrevio = new Map((existentes ?? []).map((e: any) => [e.song_id as string, e.estado as EstadoJob]));
  // Hecha/en cola/en curso: nada que hacer. Terminadas sin éxito: solo si lo pide una persona.
  const nuevas = candidatas.filter((s) => {
    const previo = estadoPrevio.get(s.id);
    if (!previo) return true;
    if (previo === "hecha" || ACTIVOS.includes(previo)) return false;
    return origen === "manual";
  });

  const hueco = huecoDisponible(limiteMes, await contar(bandId, ["hecha"], inicioDeMes()), await contar(bandId, ACTIVOS));
  const admitidas = nuevas.slice(0, hueco);
  if (admitidas.length) {
    const ahora = new Date().toISOString();
    const { error } = await sb.from("letras_jobs").upsert(
      admitidas.map((s) => ({
        band_id: bandId, song_id: s.id, estado: "pendiente", intentos: 0, origen, error: null,
        disponible_desde: ahora, updated_at: ahora,
      })),
      { onConflict: "band_id,song_id" }
    );
    if (error) throw new Error(`Supabase Error (letras_jobs): ${error.message}`);
    despertarCola();
  }
  return { encoladas: admitidas.length, porTope: nuevas.length - admitidas.length, limiteMes };
}

/** Disparo desde el guardado de una canción: solo si la banda activó el ajuste. Nunca lanza. */
export async function encolarLetraAutomatica(bandId: string, songId: string): Promise<void> {
  try {
    if (!(await dbGetLetrasAuto(bandId))) return;
    await encolarLetras(bandId, { songIds: [songId], origen: "auto" });
  } catch (err: any) {
    console.error("[colaLetras] No se pudo encolar la letra automática:", err?.message || err);
  }
}

export async function cancelarCola(bandIdCrudo: string): Promise<number> {
  const { data } = await getSupabase().from("letras_jobs").delete().eq("band_id", cleanBandId(bandIdCrudo)).eq("estado", "pendiente").select("id");
  return data?.length ?? 0;
}

// ---- Trabajador ----------------------------------------------------------------------------

let procesando = false;

export function despertarCola(): void {
  if (procesando) return;
  procesando = true;
  bucle()
    .catch((err) => console.error("[colaLetras] El trabajador se detuvo:", err?.message || err))
    .finally(() => { procesando = false; });
}

async function bucle(): Promise<void> {
  const sb = getSupabase();
  for (;;) {
    const { data } = await sb
      .from("letras_jobs").select("*").eq("estado", "pendiente")
      .lte("disponible_desde", new Date().toISOString())
      .order("created_at", { ascending: true }).limit(1);
    const job = data?.[0];
    if (!job) return;
    // Reclamo optimista: si otra instancia lo cogió antes, no devuelve fila.
    const { data: reclamado } = await sb
      .from("letras_jobs").update({ estado: "en_curso", updated_at: new Date().toISOString() })
      .eq("id", job.id).eq("estado", "pendiente").select("id");
    if (!reclamado?.length) continue;
    await procesarJob(job);
  }
}

async function procesarJob(job: { id: string; band_id: string; song_id: string; intentos: number }): Promise<void> {
  const sb = getSupabase();
  const cerrar = (cambios: Record<string, unknown>) =>
    sb.from("letras_jobs").update({ ...cambios, updated_at: new Date().toISOString() }).eq("id", job.id);

  // El tope se vuelve a comprobar al ejecutar: pudo agotarse entre que se encoló y ahora.
  const hechasMes = await contar(job.band_id, ["hecha"], inicioDeMes());
  if (hechasMes >= limiteLetrasMes(await planDeBanda(job.band_id))) {
    await cerrar({ estado: "omitida", error: "Tope mensual de letras del plan alcanzado." });
    return;
  }

  const intentos = job.intentos + 1;
  let status = 500;
  let error: string | undefined;
  try {
    const r = await ejecutarLetraSincronizada(job.song_id, job.band_id, { sobrescribir: false });
    status = r.status;
    error = status === 200 ? undefined : String(r.body?.error || "").slice(0, 300);
  } catch (err: any) {
    error = String(err?.message || err).slice(0, 300);
  }
  const { estado, reintentar } = estadoTrasEjecucion(status, intentos);
  await cerrar({
    estado, intentos, error: error ?? null,
    ...(reintentar ? { disponible_desde: new Date(Date.now() + retrasoReintentoMs(intentos)).toISOString() } : {}),
  });
}

let reloj: ReturnType<typeof setInterval> | null = null;

/** Al arrancar: lo que quedó «en curso» (el servidor se reinició) vuelve a la cola, y se revisa cada minuto los reintentos. */
export function iniciarColaLetras(): void {
  if (reloj) return;
  getSupabase()
    .from("letras_jobs").update({ estado: "pendiente", updated_at: new Date().toISOString() }).eq("estado", "en_curso")
    .then(() => despertarCola(), (err) => console.error("[colaLetras] Arranque:", err?.message || err));
  reloj = setInterval(despertarCola, 60_000);
  reloj.unref?.();
}
