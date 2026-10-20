// Catálogo compartido de salas: consulta, sugerencias para una banda nueva y alta en la agenda de la banda. Solo lectura del catálogo; lo que escribe es
// un lead de la propia banda (con su plan, su bandId de sesión y su límite). El email y el teléfono de la sala solo
// salen aquí, al añadirla, nunca en la consulta.

import crypto from "node:crypto";
import express from "express";
import { requireAuth } from "../state.js";
import { apiAutenticadaRateLimiter } from "../middleware/rateLimiter.js";
import { getTargetBandId } from "../utils/bandAccess.js";
import { checkRecordLimit } from "../utils/planLimits.js";
import { dbGetLeads, dbUpsertLead } from "../db.js";
import { leadsDeAgendaDeBanda } from "../db/salasCatalogo.js";
import { consultaCatalogo } from "../db/consultaCatalogoSupabase.js";
import { obtenerFestivales } from "../services/festivalesPublicos.js";
import { claveDeFestival, consultarFestivales, leadDesdeFestival, parsearFiltrosFestivales } from "../utils/festivalesCatalogo.js";
import { salasEnAgenda } from "../utils/consultaCatalogo.js";
import { MAX_ALTAS_POR_PETICION } from "../services/consultaCatalogo.js";
import { comoErrorCapturado } from "../../src/utils/errorCapturado.js";
import { responderError } from "../utils/errorHttp.js";

const router = express.Router();

const esMedio = (tipo?: string) => /medio|radio|prensa/i.test(String(tipo ?? ""));
const cadena = (v: unknown, max = 80): string => (typeof v === "string" ? v.trim().slice(0, max) : "");
const idNuevo = () => `lead-cat-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

/** Cuántas salas más admite el plan de la banda. Se comprueba en el servidor, no solo en la interfaz (igual que POST /api/leads). */
function plazasDelPlan(plan: string | undefined, agenda: Array<{ tipo?: string }>): number {
  const usadas = agenda.filter((l) => !esMedio(l.tipo)).length;
  const { max } = checkRecordLimit((plan || "ensayo") as Parameters<typeof checkRecordLimit>[0], "leads", usadas);
  return Math.max(0, max - usadas);
}

router.get("/catalogo/salas", requireAuth, apiAutenticadaRateLimiter, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    res.json(await consultaCatalogo.consultar(req.query as Record<string, unknown>, await leadsDeAgendaDeBanda(bandId)));
  } catch (errorCapturado) {
    const error = comoErrorCapturado(errorCapturado);
    console.error("Error in GET /api/catalogo/salas:", error);
    responderError(res, error, "No se pudo consultar el catálogo de salas.");
  }
});

router.get("/catalogo/salas/mapa", requireAuth, apiAutenticadaRateLimiter, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    res.json(await consultaCatalogo.mapa(req.query as Record<string, unknown>, await leadsDeAgendaDeBanda(bandId)));
  } catch (errorCapturado) {
    const error = comoErrorCapturado(errorCapturado);
    console.error("Error in GET /api/catalogo/salas/mapa:", error);
    responderError(res, error, "No se pudo cargar el mapa del catálogo.");
  }
});

router.get("/catalogo/salas/:id", requireAuth, apiAutenticadaRateLimiter, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const ficha = await consultaCatalogo.ficha(req.params.id, await leadsDeAgendaDeBanda(bandId));
    if (!ficha) return res.status(404).json({ error: "Esa sala ya no está disponible en el catálogo." });
    res.json(ficha);
  } catch (errorCapturado) {
    const error = comoErrorCapturado(errorCapturado);
    console.error("Error in GET /api/catalogo/salas/:id:", error);
    responderError(res, error, "No se pudo abrir la ficha de la sala.");
  }
});

router.get("/catalogo/festivales", requireAuth, apiAutenticadaRateLimiter, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const [festivales, agenda] = await Promise.all([obtenerFestivales(), leadsDeAgendaDeBanda(bandId)]);
    const fichas = consultarFestivales(festivales, parsearFiltrosFestivales(req.query as Record<string, unknown>), salasEnAgenda(agenda).claves);
    res.json({ total: fichas.length, festivales: fichas.slice(0, 100) });
  } catch (errorCapturado) {
    const error = comoErrorCapturado(errorCapturado);
    console.error("Error in GET /api/catalogo/festivales:", error);
    responderError(res, error, "No se pudo consultar el directorio de festivales.");
  }
});

router.post("/catalogo/festivales/:slug/anadir", requireAuth, apiAutenticadaRateLimiter, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const festival = (await obtenerFestivales()).find((f) => f.slug === req.params.slug);
    if (!festival) return res.status(404).json({ error: "Ese festival ya no está en el directorio." });
    const [leadsDeLaBanda, agenda] = await Promise.all([leadsDeAgendaDeBanda(bandId), dbGetLeads(bandId)]);
    if (salasEnAgenda(leadsDeLaBanda).claves.has(claveDeFestival(festival))) return res.status(409).json({ error: "Ese festival ya está en tu agenda." });
    const limite = checkRecordLimit(req.user?.plan || "ensayo", "leads", agenda.filter((l) => !esMedio(l.tipo)).length);
    if (!limite.allowed) return res.status(403).json({ error: limite.message, codigo: "limite_plan_alcanzado" });
    const guardado = await dbUpsertLead(leadDesdeFestival(festival, idNuevo(), bandId), bandId);
    res.json({ success: true, leadId: guardado.id });
  } catch (errorCapturado) {
    const error = comoErrorCapturado(errorCapturado);
    console.error("Error in POST /api/catalogo/festivales/:slug/anadir:", error);
    responderError(res, error, "No se pudo añadir el festival a tu agenda.");
  }
});

router.post("/catalogo/salas/:id/anadir", requireAuth, apiAutenticadaRateLimiter, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const [leadsDeLaBanda, agenda] = await Promise.all([leadsDeAgendaDeBanda(bandId), dbGetLeads(bandId)]);

    // Mismo límite por plan que POST /api/leads.
    const limite = checkRecordLimit(req.user?.plan || "ensayo", "leads", agenda.filter((l) => !esMedio(l.tipo)).length);
    if (!limite.allowed) return res.status(403).json({ error: limite.message, codigo: "limite_plan_alcanzado" });

    const r = await consultaCatalogo.anadir({
      salaId: req.params.id,
      bandId,
      leadsDeLaBanda,
      nuevoId: idNuevo,
      guardarLead: async (lead) => ({ id: (await dbUpsertLead(lead, bandId)).id }),
    });
    if (r.resultado === "no_disponible") return res.status(404).json({ error: "Esa sala ya no está disponible en el catálogo." });
    if (r.resultado === "ya_en_agenda") return res.status(409).json({ error: "Esa sala ya está en tu agenda.", leadId: r.leadId });
    res.json({ success: true, leadId: r.leadId });
  } catch (errorCapturado) {
    const error = comoErrorCapturado(errorCapturado);
    console.error("Error in POST /api/catalogo/salas/:id/anadir:", error);
    responderError(res, error, "No se pudo añadir la sala a tu agenda.");
  }
});

router.get("/catalogo/sugerencias", requireAuth, apiAutenticadaRateLimiter, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const limite = Number(req.query.limite);
    const sugerencias = await consultaCatalogo.sugerir(
      { ciudad: cadena(req.query.ciudad), genero: cadena(req.query.genero) },
      await leadsDeAgendaDeBanda(bandId),
      Number.isFinite(limite) && limite > 0 ? limite : undefined,
    );
    res.json({ sugerencias });
  } catch (errorCapturado) {
    const error = comoErrorCapturado(errorCapturado);
    console.error("Error in GET /api/catalogo/sugerencias:", error);
    responderError(res, error, "No se pudieron cargar las sugerencias de salas.");
  }
});

router.post("/catalogo/salas/anadir-varias", requireAuth, apiAutenticadaRateLimiter, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const bruto = (req.body as { salaIds?: unknown } | undefined)?.salaIds;
    const salaIds = Array.isArray(bruto) ? bruto.filter((id): id is string => typeof id === "string" && id.length <= 64) : [];
    if (salaIds.length === 0) return res.status(400).json({ error: "Indica al menos una sala." });
    if (salaIds.length > MAX_ALTAS_POR_PETICION) return res.status(400).json({ error: `Puedes añadir hasta ${MAX_ALTAS_POR_PETICION} salas de una vez.` });

    const [leadsDeLaBanda, agenda] = await Promise.all([leadsDeAgendaDeBanda(bandId), dbGetLeads(bandId)]);
    const informe = await consultaCatalogo.anadirVarias({
      salaIds,
      bandId,
      leadsDeLaBanda,
      plazas: plazasDelPlan(req.user?.plan, agenda),
      nuevoId: idNuevo,
      guardarLead: async (lead) => ({ id: (await dbUpsertLead(lead, bandId)).id }),
    });
    res.json({ success: true, ...informe });
  } catch (errorCapturado) {
    const error = comoErrorCapturado(errorCapturado);
    console.error("Error in POST /api/catalogo/salas/anadir-varias:", error);
    responderError(res, error, "No se pudieron añadir las salas a tu agenda.");
  }
});

export default router;
