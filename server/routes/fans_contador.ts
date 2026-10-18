// Número de fans de una banda. La película del TFM lo consulta para saber cuándo alguien se ha hecho fan desde el QR
// público y dejar que siga. El token de la banda ya va en el propio QR público, así que el número no descubre nada.
// Además, SOLO para las bandas que se listen en FANS_NOMBRE_PUBLICO_BANDAS (vacía por defecto), devuelve el nombre de pila de quien
// se hizo fan hace menos de tres minutos, para que la película lo salude. Sin apellido, sin correo y sin nada anterior.

import express from 'express';
import { cleanBandId, dbContarFans, dbUltimoFanReciente } from '../db.js';
import { publicoRateLimiter } from '../middleware/rateLimiter.js';
import { decodeBandId } from '../utils/bandHash.js';
import { comoErrorCapturado } from '../../src/utils/errorCapturado.js';

const router = express.Router();
const VENTANA_NOMBRE_SEG = 180;

function bandasConNombrePublico(): string[] {
  return (process.env.FANS_NOMBRE_PUBLICO_BANDAS || '').split(',').map((b) => b.trim()).filter(Boolean).map((b) => cleanBandId(b));
}

router.get('/api/public/fans/contador', publicoRateLimiter, async (req, res) => {
  try {
    const raw = typeof req.query.b === 'string' ? req.query.b : '';
    if (!raw.trim()) return res.status(400).json({ error: 'Falta el identificador de la banda.' });
    const bandId = decodeBandId(raw);
    const total = await dbContarFans(bandId);
    const ultimo = bandasConNombrePublico().includes(cleanBandId(bandId)) ? await dbUltimoFanReciente(bandId, VENTANA_NOMBRE_SEG) : null;
    res.set('Cache-Control', 'no-store').json({ total, ultimo: ultimo ? { nombre: ultimo.nombre, hace: ultimo.hace } : null });
  } catch (errCapturado) {
    console.error('Error contando fans:', comoErrorCapturado(errCapturado));
    res.status(500).json({ error: 'No se pudo contar.' });
  }
});

export default router;
