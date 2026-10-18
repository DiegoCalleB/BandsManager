// Catálogo compartido de salas: consulta y alta en la agenda de la banda. Solo lectura del catálogo; lo que escribe es
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
import { comoErrorCapturado } from "../../src/utils/errorCapturado.js";
import { responderError } from "../utils/errorHttp.js";

const router = express.Router();

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

router.post("/catalogo/salas/:id/anadir", requireAuth, apiAutenticadaRateLimiter, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const [leadsDeLaBanda, agenda] = await Promise.all([leadsDeAgendaDeBanda(bandId), dbGetLeads(bandId)]);

    // Mismo límite por plan que POST /api/leads: se comprueba en el servidor, no solo en la interfaz.
    const esMedio = (tipo?: string) => /medio|radio|prensa/i.test(String(tipo ?? ""));
    const limite = checkRecordLimit(req.user?.plan || "ensayo", "leads", agenda.filter((l) => !esMedio(l.tipo)).length);
    if (!limite.allowed) return res.status(403).json({ error: limite.message, codigo: "limite_plan_alcanzado" });

    const r = await consultaCatalogo.anadir({
      salaId: req.params.id,
      bandId,
      leadsDeLaBanda,
      nuevoId: () => `lead-cat-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
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

export default router;
