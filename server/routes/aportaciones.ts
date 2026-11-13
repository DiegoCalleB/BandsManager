// Aportaciones del público al directorio de festivales (sin sesión):
//   · POST /api/public/aportaciones  { tipo, ficha_id, campo, valor, fuente?, comentario?, contacto?, idioma }
// Se guardan como «pendiente»: nada se publica sin revisarlo contra la fuente. Responde igual a un bot (campo trampa)
// que a una persona, para no enseñarle cómo saltarse el filtro.

import express from 'express';
import { createRateLimiter, publicoRateLimiter } from '../middleware/rateLimiter.js';
import { dbGuardarAportacion } from '../db/aportaciones.js';
import { obtenerFestivales } from '../services/festivalesPublicos.js';
import { validarAportacion } from '../utils/aportaciones.js';
import { captureError } from '../utils/errorTracking.js';

const router = express.Router();

const aportacionRateLimiter = createRateLimiter({
  nombre: 'aportaciones',
  windowMs: 10 * 60 * 1000,
  maxRequests: 8,
  mensaje: 'Has enviado muchas aportaciones seguidas. Inténtalo de nuevo en unos minutos.',
});

router.post('/api/public/aportaciones', publicoRateLimiter, aportacionRateLimiter, async (req, res) => {
  try {
    const r = validarAportacion(req.body);
    if (r === null) return res.json({ ok: true });
    if (r.ok === false) return res.status(400).json({ error: r.error });
    // Solo fichas que existen: una aportación a una ficha inventada es ruido (o un intento de llenar la tabla).
    if (r.aportacion.tipo === 'festival' && !(await obtenerFestivales()).some((f) => f.slug === r.aportacion.ficha_id)) {
      return res.status(404).json({ error: r.aportacion.idioma === 'en' ? 'Listing not found.' : 'No encontramos esa ficha.' });
    }
    await dbGuardarAportacion(r.aportacion);
    res.json({ ok: true });
  } catch (e) {
    captureError(e, { ruta: 'aportaciones' });
    res.status(500).json({ error: 'No se pudo guardar. Inténtalo más tarde.' });
  }
});

export default router;
