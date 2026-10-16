// Lista de novedades de la landing oficial, con doble confirmación (sin sesión).
//   · POST /api/public/interesados            email + consentimiento: envía el correo de confirmación.
//   · GET  /api/public/interesados/confirmar  enlace firmado del correo: confirma y manda la bienvenida.
//   · GET  /api/public/interesados/baja       enlace firmado de cada correo: baja.
//
// El alta responde SIEMPRE igual (esté o no el email ya apuntado) para no revelar quién está en la lista.

import express from 'express';
import { createRateLimiter, publicoRateLimiter } from '../middleware/rateLimiter.js';
import { dbAltaInteresado, dbBajaInteresado, dbConfirmarInteresado, dbGetInteresado } from '../db/interesados.js';
import { getProductionAppUrl, sendTransactionalEmail } from '../services/transactionalEmail.js';
import { avisarAlta } from '../services/avisoAltas.js';
import { captureError } from '../utils/errorTracking.js';
import { idSeguro } from '../utils/trackingSeguro.js';
import {
  correoBienvenida,
  correoConfirmacion,
  firmaInteresadoValida,
  idiomaInteresado,
  normalizarEmailInteresado,
  paginaInteresado,
  urlInteresado,
} from '../utils/interesados.js';

const router = express.Router();

/** El alta manda un correo: tope más estricto que el de los formularios públicos en general. */
const altaRateLimiter = createRateLimiter({
  nombre: 'interesados-alta',
  windowMs: 10 * 60 * 1000,
  maxRequests: 5,
  mensaje: 'Demasiados intentos desde esta conexión. Inténtalo de nuevo en unos minutos.',
});

router.post('/api/public/interesados', publicoRateLimiter, altaRateLimiter, async (req, res) => {
  const hecho = () => res.json({ ok: true });
  try {
    // Campo trampa: los bots lo rellenan, las personas no lo ven. Se responde como si hubiera ido bien.
    if (typeof req.body?.web === 'string' && req.body.web.trim() !== '') return hecho();

    const email = normalizarEmailInteresado(req.body?.email);
    if (!email) return res.status(400).json({ error: 'Escribe un email válido.' });
    if (req.body?.consentimiento !== true) {
      return res.status(400).json({ error: 'Marca la casilla para poder escribirte.' });
    }

    const idioma = idiomaInteresado(req.body?.idioma);
    const interesado = await dbAltaInteresado(email, idioma, 'landing');
    if (interesado.nuevo) void avisarAlta({ tipo: 'espera', email, origen: 'landing oficial' });
    // Ya confirmado o dado de baja: no se le vuelve a escribir (la baja se respeta siempre).
    if (interesado.confirmado_at || interesado.baja_at) return hecho();

    const base = getProductionAppUrl(process.env.APP_URL);
    const correo = correoConfirmacion(idioma, urlInteresado(base, 'confirmar', interesado.id));
    const envio = await sendTransactionalEmail({ to: email, subject: correo.asunto, html: correo.html });
    if (!envio.success) console.warn('[Interesados] no se pudo enviar la confirmación:', envio.error);
    hecho();
  } catch (e) {
    captureError(e instanceof Error ? e : new Error(String(e)), { ruta: 'POST /api/public/interesados' });
    res.status(500).json({ error: 'No hemos podido apuntarte ahora. Inténtalo de nuevo en un rato.' });
  }
});

/** Valida el enlace firmado y devuelve el interesado, o null si el enlace no vale. */
async function interesadoDelEnlace(accion: 'confirmar' | 'baja', query: express.Request['query']) {
  const id = String(query.i ?? '');
  if (!id || !idSeguro(id) || !firmaInteresadoValida(accion, id, query.f)) return null;
  return dbGetInteresado(id);
}

router.get('/api/public/interesados/confirmar', publicoRateLimiter, async (req, res) => {
  try {
    const interesado = await interesadoDelEnlace('confirmar', req.query);
    if (!interesado) return res.status(400).type('html').send(paginaInteresado('Enlace no válido. / Invalid link.'));
    if (await dbConfirmarInteresado(interesado.id)) {
      void avisarAlta({ tipo: 'espera_confirmada', email: interesado.email, origen: 'landing oficial' });
      const base = getProductionAppUrl(process.env.APP_URL);
      const idioma = idiomaInteresado(interesado.idioma);
      const correo = correoBienvenida(idioma, base, urlInteresado(base, 'baja', interesado.id));
      const envio = await sendTransactionalEmail({ to: interesado.email, subject: correo.asunto, html: correo.html });
      if (!envio.success) console.warn('[Interesados] no se pudo enviar la bienvenida:', envio.error);
    }
    res.type('html').send(paginaInteresado('¡Listo, email confirmado! Te escribiremos solo cuando haya novedades. / Done, your email is confirmed.'));
  } catch (e) {
    captureError(e instanceof Error ? e : new Error(String(e)), { ruta: 'GET /api/public/interesados/confirmar' });
    res.status(500).type('html').send(paginaInteresado('Error temporal, inténtalo de nuevo. / Temporary error, please try again.'));
  }
});

router.get('/api/public/interesados/baja', publicoRateLimiter, async (req, res) => {
  try {
    const interesado = await interesadoDelEnlace('baja', req.query);
    if (!interesado) return res.status(400).type('html').send(paginaInteresado('Enlace no válido. / Invalid link.'));
    await dbBajaInteresado(interesado.id);
    res.type('html').send(paginaInteresado('Listo, no te escribiremos más. / Done, you will not hear from us again.'));
  } catch (e) {
    captureError(e instanceof Error ? e : new Error(String(e)), { ruta: 'GET /api/public/interesados/baja' });
    res.status(500).type('html').send(paginaInteresado('Error temporal, inténtalo de nuevo. / Temporary error, please try again.'));
  }
});

export default router;
