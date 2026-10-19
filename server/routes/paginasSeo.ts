// Guías y directorio de festivales de SEO: /guias y /en/guides (índices) y /guias/:slug y /en/guides/:slug. Contenido fijo
// en server/utils/seo/, sin datos de bandas. Las rutas son literales para que `npm run docs:api` las vea.
import express from 'express';
import { publicoRateLimiter } from '../middleware/rateLimiter.js';
import { baseUrlPublica } from '../utils/paginaConcierto.js';
import { guiaPorSlug } from '../utils/seo/indice.js';
import { renderizarGuia, renderizarGuiaNoEncontrada, renderizarIndiceGuias } from '../utils/seo/render.js';
import { FESTIVALES } from '../utils/seo/festivales/datos.js';
import { renderizarFestival, renderizarFestivalNoEncontrado, renderizarIndiceFestivales } from '../utils/seo/festivales/render.js';
import { estaVigente } from '../utils/seo/festivales/vigencia.js';
import type { IdiomaSeo } from '../utils/seo/rutas.js';

const router = express.Router();
const CACHE = 'public, max-age=3600, s-maxage=86400';

function responderHtml(res: express.Response, status: number, html: string, cache: string) {
  res.status(status);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', cache);
  res.send(html);
}

function enviarIndice(res: express.Response, idioma: IdiomaSeo) {
  responderHtml(res, 200, renderizarIndiceGuias(baseUrlPublica(), idioma), CACHE);
}

function enviarGuia(res: express.Response, slug: unknown, idioma: IdiomaSeo) {
  const base = baseUrlPublica();
  const g = guiaPorSlug(slug, idioma);
  if (!g) return responderHtml(res, 404, renderizarGuiaNoEncontrada(base, idioma), 'public, max-age=60');
  responderHtml(res, 200, renderizarGuia(g, base, idioma), CACHE);
}

const hoy = () => new Date().toISOString().slice(0, 10);

function enviarFestival(res: express.Response, slug: unknown, idioma: IdiomaSeo) {
  const base = baseUrlPublica();
  const f = FESTIVALES.find((x) => x.slug === slug);
  if (!f || !estaVigente(f, hoy())) return responderHtml(res, 404, renderizarFestivalNoEncontrado(base, idioma), 'public, max-age=60');
  responderHtml(res, 200, renderizarFestival(f, base, idioma, hoy()), CACHE);
}

router.get('/guias', publicoRateLimiter, (_req, res) => enviarIndice(res, 'es'));
router.get('/guias/:slug', publicoRateLimiter, (req, res) => enviarGuia(res, req.params.slug, 'es'));
router.get('/en/guides', publicoRateLimiter, (_req, res) => enviarIndice(res, 'en'));
router.get('/en/guides/:slug', publicoRateLimiter, (req, res) => enviarGuia(res, req.params.slug, 'en'));

router.get('/festivales', publicoRateLimiter, (_req, res) => responderHtml(res, 200, renderizarIndiceFestivales(baseUrlPublica(), 'es', hoy()), CACHE));
router.get('/festivales/:slug', publicoRateLimiter, (req, res) => enviarFestival(res, req.params.slug, 'es'));
router.get('/en/festivals', publicoRateLimiter, (_req, res) => responderHtml(res, 200, renderizarIndiceFestivales(baseUrlPublica(), 'en', hoy()), CACHE));
router.get('/en/festivals/:slug', publicoRateLimiter, (req, res) => enviarFestival(res, req.params.slug, 'en'));

export default router;
