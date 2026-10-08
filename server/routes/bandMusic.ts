// Escucha y Spotify en lote para las bandas de la cuenta. Todo va acotado a la banda activa
// (`getTargetBandId`, AGENTS.md §2.1): nunca se lee ni escribe una banda de otra cuenta.

import express from "express";
import { requireAuth, requireCronOrAuth, loadState, saveState } from "../state.js";
import { dbGetBandContacts, dbUpsertBandContact } from "../db.js";
import { getTargetBandId } from "../utils/bandAccess.js";
import { previewDeBanda } from "../services/musicPreviewService.js";
import { resolverUrlSpotifyDeBanda } from "../services/spotifyService.js";
import { estadoSpotifyBanda, planificarSpotifyBanda, PlanSpotifyBanda } from "../utils/spotifyMatch.js";
import { periodoMensual } from "../utils/metricasBanda.js";
import { capturarMetricasBanda, guardarMetricasBanda } from "../services/metricasBandaService.js";
import { getSupabase } from "../db/core.js";

const router = express.Router();

interface BandaCuenta {
  id: string;
  nombre_banda?: string;
  spotify_youtube?: string;
}

const MAX_BANDAS_LOTE = 60;
const PAUSA_MS = 250;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** GET /api/bands/:id/preview — preview de 30 s de la banda (o null si no hay). */
router.get("/bands/:id/preview", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const banda = ((await dbGetBandContacts(bandId)) as BandaCuenta[]).find((b) => b.id === req.params.id);
    if (!banda?.nombre_banda) return res.status(404).json({ error: "Banda no encontrada." });
    const preview = await previewDeBanda(String(banda.nombre_banda));
    res.json({ success: true, preview });
  } catch (err) {
    console.error("[BandMusic] preview error:", err);
    res.status(500).json({ error: "No se pudo obtener el preview." });
  }
});

const MAX_DISPONIBILIDAD = 120;
const CONCURRENCIA_DISPONIBILIDAD = 4;

/**
 * GET /api/bands/previews-availability — { [bandId]: true } para las bandas que tienen un preview.
 * Consulta Deezer en paralelo limitado; el resultado va cacheado 24 h en musicPreviewService.
 */
router.get("/bands/previews-availability", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const bandas = ((await dbGetBandContacts(bandId)) as BandaCuenta[])
      .filter((b) => b?.nombre_banda)
      .slice(0, MAX_DISPONIBILIDAD);
    const disponibles: Record<string, boolean> = {};
    for (let i = 0; i < bandas.length; i += CONCURRENCIA_DISPONIBILIDAD) {
      await Promise.all(
        bandas.slice(i, i + CONCURRENCIA_DISPONIBILIDAD).map(async (b) => {
          disponibles[b.id] = (await previewDeBanda(String(b.nombre_banda))) !== null;
        }),
      );
    }
    res.json({ success: true, disponibles });
  } catch (err) {
    console.error("[BandMusic] previews-availability error:", err);
    res.status(500).json({ error: "No se pudo comprobar la disponibilidad de previews." });
  }
});

interface ItemLote extends PlanSpotifyBanda {
  id: string;
  nombre: string;
  actual: string;
}

/** Calcula el plan de Spotify para las bandas de la cuenta que lo necesitan. */
async function calcularLote(bandas: BandaCuenta[]): Promise<{ plan: ItemLote[]; porId: Map<string, BandaCuenta> }> {
  const porId = new Map<string, BandaCuenta>();
  const plan: ItemLote[] = [];
  const candidatas = bandas
    .filter((b) => b?.nombre_banda && planificarSpotifyBanda(b.spotify_youtube, "x").accion !== "mantener")
    .slice(0, MAX_BANDAS_LOTE);

  for (const b of candidatas) {
    porId.set(b.id, b);
    const verificada = await resolverUrlSpotifyDeBanda(String(b.nombre_banda));
    const p = planificarSpotifyBanda(b.spotify_youtube, verificada);
    plan.push({ ...p, id: b.id, nombre: b.nombre_banda, actual: b.spotify_youtube || "" });
    await sleep(PAUSA_MS);
  }
  return { plan, porId };
}

/**
 * POST /api/bands/spotify-sweep
 *   { apply: false }                 → plan propuesto, no escribe nada.
 *   { apply: true, ids: [...] }      → escribe SOLO las bandas aprobadas que tengan un sustituto
 *                                      verificado. El enlace se recalcula aquí: el cliente no
 *                                      puede inyectar una URL.
 */
router.post("/bands/spotify-sweep", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const bandas = (await dbGetBandContacts(bandId)) as BandaCuenta[];
    const { plan, porId } = await calcularLote(bandas);

    if (req.body?.apply !== true) {
      return res.json({ success: true, dryRun: true, plan, invalidas: plan.filter((p) => p.accion === "sin_sustituto").length });
    }

    const aprobadas = new Set<string>(Array.isArray(req.body?.ids) ? req.body.ids.map(String) : []);
    const state = loadState();
    let aplicadas = 0;
    let errores = 0;
    for (const item of plan) {
      if (!aprobadas.has(item.id) || !item.nuevo || estadoSpotifyBanda(item.actual) === "valido") continue;
      const banda = porId.get(item.id);
      try {
        const guardada = await dbUpsertBandContact({ ...banda, spotify_youtube: item.nuevo }, bandId);
        const idx = (state.bands || []).findIndex((b: BandaCuenta) => b.id === item.id);
        if (idx !== -1) state.bands[idx] = guardada;
        aplicadas++;
      } catch (err) {
        errores++;
        console.warn(`[BandMusic] no se pudo guardar Spotify de ${item.nombre}:`, err instanceof Error ? err.message : err);
      }
    }
    saveState(state);
    res.json({ success: true, dryRun: false, aplicadas, errores });
  } catch (err) {
    console.error("[BandMusic] spotify-sweep error:", err);
    res.status(500).json({ error: "No se pudo completar la búsqueda de Spotify." });
  }
});

/** POST /api/bands/metricas/actualizar — captura el mes en curso de las bandas de la cuenta. */
router.post("/bands/metricas/actualizar", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const bandas = ((await dbGetBandContacts(bandId)) as BandaCuenta[]).filter((b) => b?.nombre_banda).slice(0, MAX_BANDAS_LOTE);
    const periodo = periodoMensual();
    let filas = 0;
    for (const b of bandas) {
      const capturadas = await capturarMetricasBanda(String(b.nombre_banda), b.spotify_youtube || "");
      filas += await guardarMetricasBanda({ id: b.id, band_id: bandId }, periodo, capturadas);
      await sleep(PAUSA_MS);
    }
    res.json({ success: true, periodo, bandas: bandas.length, filas });
  } catch (err) {
    console.error("[BandMusic] metricas/actualizar error:", err);
    res.status(500).json({ error: "No se pudieron actualizar las métricas." });
  }
});

/** GET /api/bands/metricas — último periodo disponible por banda de la cuenta. */
router.get("/bands/metricas", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const { data, error } = await getSupabase()
      .from("metricas_bandas_externas")
      .select("band_contact_id, fuente, periodo, seguidores, fans, suscriptores, visualizaciones, popularidad")
      .eq("band_id", bandId)
      .order("periodo", { ascending: false });
    if (error) throw new Error(error.message);

    const porBanda: Record<string, { periodo: string; spotify?: unknown; deezer?: unknown; youtube?: unknown }> = {};
    for (const fila of data || []) {
      const actual = porBanda[fila.band_contact_id] || (porBanda[fila.band_contact_id] = { periodo: fila.periodo });
      // Solo el periodo más reciente de cada banda (las filas vienen ordenadas por periodo desc).
      if (actual.periodo !== fila.periodo) continue;
      actual[fila.fuente as "spotify" | "deezer" | "youtube"] = fila;
    }
    res.json({ success: true, metricas: porBanda });
  } catch (err) {
    console.error("[BandMusic] metricas error:", err);
    res.status(500).json({ error: "No se pudieron leer las métricas." });
  }
});

/**
 * POST /api/cron/metricas-mensual — captura de TODAS las bandas (Railway cron, una vez al mes).
 * Protegido por CRON_SECRET (requireCronOrAuth). Los datos de banda vienen de la base, no del cliente.
 */
router.post("/cron/metricas-mensual", requireCronOrAuth, async (_req, res) => {
  try {
    const { data, error } = await getSupabase().from("band_contacts").select("id, band_id, nombre_banda, spotify_youtube");
    if (error) throw new Error(error.message);
    const periodo = periodoMensual();
    let filas = 0;
    for (const b of (data || []) as (BandaCuenta & { band_id: string })[]) {
      if (!b.nombre_banda) continue;
      const capturadas = await capturarMetricasBanda(String(b.nombre_banda), b.spotify_youtube || "");
      filas += await guardarMetricasBanda({ id: b.id, band_id: b.band_id }, periodo, capturadas);
      await sleep(PAUSA_MS);
    }
    res.json({ success: true, periodo, filas });
  } catch (err) {
    console.error("[BandMusic] cron metricas error:", err);
    res.status(500).json({ error: "El cron de métricas ha fallado." });
  }
});

export default router;
