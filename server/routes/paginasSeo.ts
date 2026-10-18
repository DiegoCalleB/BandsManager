// Guías públicas de SEO: /guias (índice) y /guias/:slug. Contenido fijo en server/utils/seo/, sin datos de bandas.
import express from 'express';
import { publicoRateLimiter } from '../middleware/rateLimiter.js';
import { baseUrlPublica } from '../utils/paginaConcierto.js';
import { guiaPorSlug } from '../utils/seo/indice.js';
import { renderizarGuia, renderizarGuiaNoEncontrada, renderizarIndiceGuias } from '../utils/seo/render.js';

const router = express.Router();

function responderHtml(res: express.Response, status: number, html: string, cache: string) {
  res.status(status);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', cache);
  res.send(html);
}

router.get('/guias', publicoRateLimiter, (_req, res) => {
  responderHtml(res, 200, renderizarIndiceGuias(baseUrlPublica()), 'public, max-age=3600, s-maxage=86400');
});

router.get('/guias/:slug', publicoRateLimiter, (req, res) => {
  const base = baseUrlPublica();
  const guia = guiaPorSlug(req.params.slug);
  if (!guia) return responderHtml(res, 404, renderizarGuiaNoEncontrada(base), 'public, max-age=60');
  responderHtml(res, 200, renderizarGuia(guia, base), 'public, max-age=3600, s-maxage=86400');
});

export default router;
