// Asesor de Marketing.
//   GET  /api/asesor/hoy                    modo de hoy, opciones y semana (sin IA).
//   POST /api/asesor/pieza                  prepara con IA la pieza de una idea de hoy (solo el id).
//   POST /api/asesor/accion                 hecho / saltado / pendiente de una idea de hoy.
//   POST /api/asesor/resultado              los números de una pieza ya publicada (Instagram, o `red`: tiktok / youtube).
//   GET  /api/asesor/instagram/medios       publicaciones de Instagram que pueden ser una pieza hecha.
//   POST /api/asesor/instagram/medidas      alcance y guardados de UNA publicación, para rellenar el formulario.
//   POST /api/asesor/chat                   pregunta libre al asesor; responde y, como mucho, propone un botón (no ejecuta nada).
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
import { chatAsesor, estadoDeHoy, generarPieza, registrarAccion, registrarResultado, sugerirEstrategia } from '../services/asesorMarketing.js';
import { registrarResultadoRed } from '../services/asesorRedes.js';
import { medidasDeMedio, mediosDeLaPieza } from '../services/asesorInstagram.js';
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

asesorRouter.post('/asesor/pieza', requireAuth, iaRateLimiter, async (req, res) => {
  try {
    const r = await generarPieza(getTargetBandId(req), req.body?.tarjetaId);
    if ('pieza' in r) return res.json({ pieza: r.pieza });
    if (r.error === 'no_existe') return res.status(404).json({ error: 'Esa idea ya no está en el plan de hoy. Recarga la pantalla.' });
    res.status(503).json({ error: r.error === 'sin_ia' ? 'La IA no ha podido preparar la pieza. Prueba otra vez en un momento.' : 'No se pudo preparar la pieza ahora mismo.' });
  } catch (e) {
    fallo(res, 'POST /asesor/pieza', e, 'No se pudo preparar la pieza.');
  }
});

const ACCIONES: Record<string, 'hecho' | 'saltado' | null> = { hecho: 'hecho', saltado: 'saltado', pendiente: null };

asesorRouter.post('/asesor/accion', requireAuth, apiAutenticadaRateLimiter, async (req, res) => {
  try {
    const accion = req.body?.accion;
    if (typeof accion !== 'string' || !Object.hasOwn(ACCIONES, accion)) return res.status(400).json({ error: 'Acción no válida.' });
    const r = await registrarAccion(getTargetBandId(req), req.body?.tarjetaId, ACCIONES[accion]);
    if (r === 'no_existe') return res.status(404).json({ error: 'Esa idea ya no está en el plan de hoy. Recarga la pantalla.' });
    if (r === 'sin_bd') return res.status(503).json({ error: 'No se pudo guardar ahora mismo.' });
    res.json({ ok: true });
  } catch (e) {
    fallo(res, 'POST /asesor/accion', e, 'No se pudo guardar.');
  }
});

asesorRouter.post('/asesor/resultado', requireAuth, apiAutenticadaRateLimiter, async (req, res) => {
  try {
    const body = req.body ?? {};
    // Sin `red` (o Instagram) es el camino de siempre; TikTok y YouTube miden otras cosas y tienen el suyo.
    const r = body.red === undefined || body.red === 'instagram' ? await registrarResultado(getTargetBandId(req), body) : await registrarResultadoRed(getTargetBandId(req), body);
    if (r.estado === 'invalido') return res.status(400).json({ error: r.motivo });
    if (r.estado === 'no_existe') return res.status(404).json({ error: 'No encontramos esa publicación entre las que habéis marcado como hechas.' });
    if (r.estado === 'sin_bd') return res.status(503).json({ error: 'No se pudo guardar ahora mismo.' });
    res.json({ ok: true, titulo: r.titulo, veredicto: r.veredicto, mensaje: r.mensaje });
  } catch (e) {
    fallo(res, 'POST /asesor/resultado', e, 'No se pudo guardar.');
  }
});

const SIN_INSTAGRAM = 'Esta banda no tiene Instagram conectado. Conéctalo en Métricas para traer los números.';
const NO_ENCONTRADA = 'No encontramos esa publicación. Escribe los números a mano.';

asesorRouter.get('/asesor/instagram/medios', requireAuth, apiAutenticadaRateLimiter, async (req, res) => {
  try {
    const r = await mediosDeLaPieza(getTargetBandId(req), req.query.fecha, req.query.tarjetaId);
    if (r.estado === 'sin_instagram') return res.status(409).json({ error: SIN_INSTAGRAM });
    if (r.estado === 'no_existe') return res.status(404).json({ error: 'No encontramos esa publicación entre las que habéis marcado como hechas.' });
    if (r.estado === 'error') return res.status(502).json({ error: r.motivo });
    res.json({ medios: r.medios });
  } catch (e) {
    fallo(res, 'GET /asesor/instagram/medios', e, 'No se pudo consultar Instagram.');
  }
});

asesorRouter.post('/asesor/instagram/medidas', requireAuth, apiAutenticadaRateLimiter, async (req, res) => {
  try {
    const r = await medidasDeMedio(getTargetBandId(req), req.body?.medioId);
    if (r.estado === 'sin_instagram') return res.status(409).json({ error: SIN_INSTAGRAM });
    if (r.estado === 'no_existe') return res.status(404).json({ error: NO_ENCONTRADA });
    if (r.estado === 'error') return res.status(502).json({ error: r.motivo });
    res.json({ medidas: r.medidas });
  } catch (e) {
    fallo(res, 'POST /asesor/instagram/medidas', e, 'No se pudo consultar Instagram.');
  }
});

asesorRouter.post('/asesor/chat', requireAuth, iaRateLimiter, async (req, res) => {
  try {
    const r = await chatAsesor(getTargetBandId(req), req.body?.mensajes);
    if ('respuesta' in r) return res.json({ respuesta: r.respuesta, accion: r.accion });
    if (r.error === 'invalido') return res.status(400).json({ error: r.motivo });
    res.status(503).json({ error: r.error === 'sin_ia' ? 'El asesor no ha podido responder. Prueba otra vez en un momento.' : 'No se pudo consultar ahora mismo.' });
  } catch (e) {
    fallo(res, 'POST /asesor/chat', e, 'No se pudo responder.');
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
