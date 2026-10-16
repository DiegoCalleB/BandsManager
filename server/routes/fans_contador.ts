// Número de fans de una banda, sin datos personales. La película del TFM lo consulta para saber cuándo
// alguien se ha hecho fan desde el QR público y dejar que siga. El token de la banda ya va en el propio
// QR público, así que esto no descubre nada que no pueda ver quien tenga el QR.

import express from 'express';
import { dbContarFans } from '../db.js';
import { publicoRateLimiter } from '../middleware/rateLimiter.js';
import { decodeBandId } from '../utils/bandHash.js';
import { comoErrorCapturado } from '../../src/utils/errorCapturado.js';

const router = express.Router();

router.get('/api/public/fans/contador', publicoRateLimiter, async (req, res) => {
  try {
    const raw = typeof req.query.b === 'string' ? req.query.b : '';
    if (!raw.trim()) return res.status(400).json({ error: 'Falta el identificador de la banda.' });
    const total = await dbContarFans(decodeBandId(raw));
    res.set('Cache-Control', 'no-store').json({ total });
  } catch (errCapturado) {
    console.error('Error contando fans:', comoErrorCapturado(errCapturado));
    res.status(500).json({ error: 'No se pudo contar.' });
  }
});

export default router;
