// Atajos públicos a la película del TFM: /presentacion_tfm y /netflix. La película es un sitio estático aparte
// (carpeta presentacion/, su propio servicio en Railway); aquí solo se redirige, no se sirve nada ni se lee nada
// de ninguna banda. Las rutas son literales para que `npm run docs:api` las vea.
import express from 'express';
import { publicoRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();
const DESTINO_POR_DEFECTO = 'https://presentacion-storytelling.up.railway.app/';

/** PRESENTACION_TFM_URL permite moverla a un dominio propio sin tocar código; solo se aceptan URL https. */
export function destinoPresentacionTfm(): string {
  const configurado = (process.env.PRESENTACION_TFM_URL || '').trim();
  try {
    const url = new URL(configurado);
    return url.protocol === 'https:' ? url.toString() : DESTINO_POR_DEFECTO;
  } catch {
    return DESTINO_POR_DEFECTO;
  }
}

// 302 y no 301: el destino puede cambiar (dominio propio) y no queremos que el navegador lo recuerde para siempre.
const redirigir = (_req: express.Request, res: express.Response) => res.redirect(302, destinoPresentacionTfm());

router.get('/presentacion_tfm', publicoRateLimiter, redirigir);
router.get('/netflix', publicoRateLimiter, redirigir);

export default router;
