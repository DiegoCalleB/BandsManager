// Regalo de pegatinas en la primera suscripción de pago (solo bandas con plan de pago y cobro activo).
//   · GET  /api/billing/pegatinas  ¿tiene derecho esta banda? cantidad, envío exprés y si ya lo pidió.
//   · POST /api/billing/pegatinas  dirección de envío: guarda el pedido (uno por banda) y avisa por email.

import express from 'express';
import { loadState, requireAuth } from '../state.js';
import { getTargetBandId } from '../utils/bandAccess.js';
import { apiAutenticadaRateLimiter } from '../middleware/rateLimiter.js';
import { dbCrearPedidoPegatinas, dbHayPedidoPegatinas } from '../db/pegatinas.js';
import { avisarAlta } from '../services/avisoAltas.js';
import { bandaConPack, validarEnvioPegatinas } from '../utils/pegatinas.js';
import { captureError } from '../utils/errorTracking.js';

const router = express.Router();

router.get('/api/billing/pegatinas', requireAuth, apiAutenticadaRateLimiter, async (req, res) => {
  try {
    const banda = bandaConPack(loadState().registeredBands, getTargetBandId(req));
    if (!banda) return res.json({ elegible: false });
    res.json({ elegible: true, cantidad: banda.cantidad, expres: banda.expres, yaPedido: await dbHayPedidoPegatinas(banda.bandId) });
  } catch (e) {
    captureError(e instanceof Error ? e : new Error(String(e)), { ruta: 'GET /api/billing/pegatinas' });
    res.status(500).json({ error: 'No pudimos comprobar tu regalo ahora.' });
  }
});

router.post('/api/billing/pegatinas', requireAuth, apiAutenticadaRateLimiter, async (req, res) => {
  try {
    const banda = bandaConPack(loadState().registeredBands, getTargetBandId(req));
    if (!banda) return res.status(403).json({ error: 'El regalo es para la primera suscripción de pago.' });

    const v = validarEnvioPegatinas(req.body);
    if ('error' in v) return res.status(400).json({ error: v.error });

    const creado = await dbCrearPedidoPegatinas(banda.bandId, { plan: banda.plan, cantidad: banda.cantidad, expres: banda.expres }, v.envio);
    if (!creado) return res.status(409).json({ error: 'Ya pediste el pack de pegatinas de esta banda.' });

    void avisarAlta({
      tipo: 'pegatinas',
      email: String(req.user?.email || req.user?.username || ''),
      nombre: v.envio.nombre,
      origen: `${banda.cantidad} pegatinas${banda.expres ? ' · envío exprés' : ''} · plan ${banda.plan} · banda ${banda.bandId}`,
      detalle: `${v.envio.direccion}, ${v.envio.cp} ${v.envio.ciudad}, ${v.envio.pais}${v.envio.telefono ? ` · ${v.envio.telefono}` : ''}`,
    });
    res.json({ ok: true });
  } catch (e) {
    captureError(e instanceof Error ? e : new Error(String(e)), { ruta: 'POST /api/billing/pegatinas' });
    res.status(500).json({ error: 'No pudimos registrar tu pedido ahora. Inténtalo de nuevo en un rato.' });
  }
});

export default router;
