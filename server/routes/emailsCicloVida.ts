// Baja de los emails de ciclo de vida: enlace firmado que llega en cada email.
import express from 'express';
import { publicoRateLimiter } from '../middleware/rateLimiter.js';
import { dbReservarEmail } from '../db/emailsCicloVida.js';
import { firmaBajaValida } from '../utils/emailsCicloVida.js';
import { captureError } from '../utils/errorTracking.js';

const router = express.Router();

const PAGINA = (mensaje: string) =>
  `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="robots" content="noindex"><title>BandManager.io</title></head><body style="font-family:Arial,sans-serif;padding:48px 24px;text-align:center;"><p>${mensaje}</p></body></html>`;

router.get('/api/emails/baja', publicoRateLimiter, async (req, res) => {
  const userId = String(req.query.u ?? '');
  if (!userId || userId.length > 200 || !firmaBajaValida(userId, req.query.f)) {
    return res.status(400).type('html').send(PAGINA('Enlace no válido. / Invalid link.'));
  }
  try {
    await dbReservarEmail(userId, 'baja');
    res.type('html').send(PAGINA('Listo, no te enviaremos más emails de este tipo. / Done, you will not get more of these emails.'));
  } catch (e) {
    captureError(e instanceof Error ? e : new Error(String(e)), { ruta: '/api/emails/baja' });
    res.status(500).type('html').send(PAGINA('Error temporal, inténtalo de nuevo. / Temporary error, please try again.'));
  }
});

export default router;
