// Web estática del Máster de Marketing Digital (carpeta aparte: master-marketing-digital/web). No es parte del TFM de
// desarrollo con IA ni usa datos de bandas: son HTML, imágenes y audio que se sirven tal cual bajo /master-marketing-digital.
// Las URL antiguas de los ejercicios (cuando vivían en public/) redirigen aquí con 301 para no romper enlaces ya compartidos.
import express from 'express';
import path from 'node:path';
import { paginaRateLimiter } from '../middleware/rateLimiter.js';

export const BASE_MASTER = '/master-marketing-digital';

/** Última revisión de los contenidos, para el `lastmod` del sitemap. */
const FECHA_MASTER = '2026-11-03';

export const CARPETA_MASTER = () => path.join(process.cwd(), 'master-marketing-digital', 'web');

const router = express.Router();

const redirigir = (destino: string): express.RequestHandler => (_req, res) => { res.redirect(301, destino); };

// URL antigua → URL nueva. Las rutas son literales para que `npm run docs:api` las vea.
router.get('/ejercicio_youtube_crm', redirigir(`${BASE_MASTER}/youtube-crm`));
router.get('/ejercicio_youtube_crm.html', redirigir(`${BASE_MASTER}/youtube-crm`));
router.get('/ejercicio_branding', redirigir(`${BASE_MASTER}/branding`));
router.get('/ejercicio_branding.html', redirigir(`${BASE_MASTER}/branding`));
router.get('/ejercicio_facebook', redirigir(`${BASE_MASTER}/facebook-clinica-dental`));
router.get('/ejercicio_facebook.html', redirigir(`${BASE_MASTER}/facebook-clinica-dental`));

// Los .html sin caché (cambian con cada despliegue); imágenes, audio y fuentes una hora.
router.use(
  BASE_MASTER,
  paginaRateLimiter,
  express.static(CARPETA_MASTER(), {
    extensions: ['html'],
    index: 'index.html',
    setHeaders: (res, archivo) => {
      res.setHeader('Cache-Control', archivo.endsWith('.html') ? 'no-store' : 'public, max-age=3600');
    },
  }),
);

/** Entradas del sitemap: el índice y los ejercicios indexables. El de la clínica dental va con `noindex` y no entra. */
export function entradasMaster(base: string): Array<{ loc: string; lastmod: string }> {
  return [`${BASE_MASTER}/`, `${BASE_MASTER}/youtube-crm`, `${BASE_MASTER}/branding`].map((ruta) => ({ loc: `${base}${ruta}`, lastmod: FECHA_MASTER }));
}

export default router;
