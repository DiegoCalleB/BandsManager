// Consultas de empresas para los planes B2B de la landing (sin sesión).
//   · POST /api/public/contacto-empresas  empresa + email + tipo + mensaje: guarda la consulta y avisa por email.
//
// Responde siempre igual si el cuerpo es válido (también con el campo trampa de bots rellenado).

import express from 'express';
import { createRateLimiter, publicoRateLimiter } from '../middleware/rateLimiter.js';
import { dbAltaContactoEmpresa } from '../db/interesados.js';
import { avisarAlta } from '../services/avisoAltas.js';
import { validarContactoEmpresa } from '../utils/contactoEmpresas.js';
import { captureError } from '../utils/errorTracking.js';

const router = express.Router();

/** Cada consulta manda un correo al equipo: tope estricto por conexión. */
const consultaRateLimiter = createRateLimiter({
  nombre: 'contacto-empresas',
  windowMs: 10 * 60 * 1000,
  maxRequests: 5,
  mensaje: 'Demasiados intentos desde esta conexión. Inténtalo de nuevo en unos minutos.',
});

router.post('/api/public/contacto-empresas', publicoRateLimiter, consultaRateLimiter, async (req, res) => {
  try {
    // Campo trampa: los bots lo rellenan, las personas no lo ven.
    if (typeof req.body?.web === 'string' && req.body.web.trim() !== '') return res.json({ ok: true });

    const v = validarContactoEmpresa(req.body);
    if ('error' in v) return res.status(400).json({ error: v.error });

    await dbAltaContactoEmpresa(v.contacto);
    void avisarAlta({
      tipo: 'b2b',
      email: v.contacto.email,
      nombre: v.contacto.empresa,
      origen: `planes B2B (${v.contacto.tipo})`,
      detalle: v.contacto.mensaje || undefined,
    });
    res.json({ ok: true });
  } catch (e) {
    captureError(e instanceof Error ? e : new Error(String(e)), { ruta: 'POST /api/public/contacto-empresas' });
    res.status(500).json({ error: 'No hemos podido enviar tu consulta ahora. Inténtalo de nuevo en un rato.' });
  }
});

export default router;
