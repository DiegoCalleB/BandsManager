// Asesor de Marketing.
//   GET  /api/asesor/hoy                    modo de hoy y qué publicar (sin IA).
//   GET  /api/asesor/estrategia             estrategia guardada de la banda.
//   PUT  /api/asesor/estrategia             la guarda, saneada por lista blanca.
//   POST /api/asesor/estrategia/sugerir     borrador con IA a partir del perfil; NO se guarda.
// El bandId sale siempre de la sesión (getTargetBandId), nunca del body (AGENTS.md §2.1).

import express from 'express';
import { requireAuth } from '../state.js';
import { getTargetBandId } from '../utils/bandAccess.js';
import { apiAutenticadaRateLimiter, iaRateLimiter } from '../middleware/rateLimiter.js';
import { captureError } from '../utils/errorTracking.js';
import { dbGetEstrategiaMarketing, dbGuardarEstrategiaMarketing } from '../db/asesorMarketing.js';
import { estadoDeHoy, sugerirEstrategia } from '../services/asesorMarketing.js';
import { ESTRATEGIA_INICIAL, sanearEstrategia } from '../../src/utils/asesor/estrategia.js';

export const asesorRouter = express.Router();

const fallo = (res: express.Response, ruta: string, e: unknown, mensaje: string) => {
  captureError(e instanceof Error ? e : new Error(String(e)), { ruta });
  res.status(500).json({ error: mensaje });
};

asesorRouter.get('/asesor/hoy', requireAuth, apiAutenticadaRateLimiter, async (req, res) => {
  try {
    const estado = await estadoDeHoy(getTargetBandId(req));
    if (!estado) return res.status(503).json({ error: 'No se pudo preparar el plan de hoy. Prueba en un momento.' });
    res.json(estado);
  } catch (e) {
    fallo(res, 'GET /asesor/hoy', e, 'No se pudo preparar el plan de hoy.');
  }
});

asesorRouter.get('/asesor/estrategia', requireAuth, apiAutenticadaRateLimiter, async (req, res) => {
  try {
    const estrategia = await dbGetEstrategiaMarketing(getTargetBandId(req));
    if (estrategia === undefined) return res.status(503).json({ error: 'No se pudo leer la estrategia.' });
    res.json({ estrategia: estrategia ?? ESTRATEGIA_INICIAL, guardada: estrategia !== null });
  } catch (e) {
    fallo(res, 'GET /asesor/estrategia', e, 'No se pudo leer la estrategia.');
  }
});

asesorRouter.put('/asesor/estrategia', requireAuth, apiAutenticadaRateLimiter, async (req, res) => {
  try {
    const estrategia = sanearEstrategia(req.body);
    if (!estrategia) return res.status(400).json({ error: 'Estrategia no válida.' });
    if (!(await dbGuardarEstrategiaMarketing(getTargetBandId(req), estrategia))) {
      return res.status(503).json({ error: 'No se pudo guardar la estrategia ahora mismo.' });
    }
    res.json({ estrategia });
  } catch (e) {
    fallo(res, 'PUT /asesor/estrategia', e, 'No se pudo guardar la estrategia.');
  }
});

asesorRouter.post('/asesor/estrategia/sugerir', requireAuth, iaRateLimiter, async (req, res) => {
  try {
    const estrategia = await sugerirEstrategia(getTargetBandId(req));
    if (!estrategia) return res.status(503).json({ error: 'La IA no está disponible ahora mismo. Puedes rellenarla a mano.' });
    res.json({ estrategia });
  } catch (e) {
    fallo(res, 'POST /asesor/estrategia/sugerir', e, 'No se pudo preparar la propuesta.');
  }
});
