// Guías y directorio de festivales de SEO: /guides y /en/guides (índices) y /guides/:slug y /en/guides/:slug. Contenido fijo
// en server/utils/seo/, sin datos de bandas. Las rutas son literales para que `npm run docs:api` las vea.
import express from 'express';
import { publicoRateLimiter } from '../middleware/rateLimiter.js';
import { baseUrlPublica } from '../utils/paginaConcierto.js';
import { guiaPorSlug } from '../utils/seo/indice.js';
import { renderizarGuia, renderizarGuiaNoEncontrada, renderizarIndiceGuias } from '../utils/seo/render.js';
import { obtenerFestivales } from '../services/festivalesPublicos.js';
import { renderizarFestival, renderizarFestivalNoEncontrado, renderizarIndiceFestivales } from '../utils/seo/festivales/render.js';
import { estaVigente } from '../utils/seo/festivales/vigencia.js';
import { renderizarListados } from '../utils/seo/listados.js';
import { RUTAS, type IdiomaSeo } from '../utils/seo/rutas.js';

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

async function enviarFestival(res: express.Response, slug: unknown, idioma: IdiomaSeo) {
  const base = baseUrlPublica();
  const todos = await obtenerFestivales();
  const f = todos.find((x) => x.slug === slug);
  if (!f || !estaVigente(f, hoy())) return responderHtml(res, 404, renderizarFestivalNoEncontrado(base, idioma), 'public, max-age=60');
  responderHtml(res, 200, renderizarFestival(f, base, idioma, hoy(), todos), CACHE);
}

async function enviarIndiceFestivales(res: express.Response, idioma: IdiomaSeo) {
  responderHtml(res, 200, renderizarIndiceFestivales(baseUrlPublica(), idioma, hoy(), await obtenerFestivales()), CACHE);
}

router.get('/guides', publicoRateLimiter, (_req, res) => enviarIndice(res, 'es'));
router.get('/guides/:slug', publicoRateLimiter, (req, res) => enviarGuia(res, req.params.slug, 'es'));
// Rutas anteriores en español: redirigen para no perder enlaces ni posicionamiento.
router.get('/guias', publicoRateLimiter, (_req, res) => res.redirect(301, RUTAS.es.guias));
router.get('/guias/:slug', publicoRateLimiter, (req, res) => res.redirect(301, RUTAS.es.guia(String(req.params.slug))));
router.get('/en/guides', publicoRateLimiter, (_req, res) => enviarIndice(res, 'en'));
router.get('/en/guides/:slug', publicoRateLimiter, (req, res) => enviarGuia(res, req.params.slug, 'en'));

router.get('/directories', publicoRateLimiter, (_req, res) => responderHtml(res, 200, renderizarListados(baseUrlPublica(), 'es'), CACHE));
router.get('/en/directories', publicoRateLimiter, (_req, res) => responderHtml(res, 200, renderizarListados(baseUrlPublica(), 'en'), CACHE));
router.get('/directories/festivals', publicoRateLimiter, (_req, res, next) => enviarIndiceFestivales(res, 'es').catch(next));
router.get('/directories/festivals/:slug', publicoRateLimiter, (req, res, next) => enviarFestival(res, req.params.slug, 'es').catch(next));
router.get('/en/directories/festivals', publicoRateLimiter, (_req, res, next) => enviarIndiceFestivales(res, 'en').catch(next));
router.get('/en/directories/festivals/:slug', publicoRateLimiter, (req, res, next) => enviarFestival(res, req.params.slug, 'en').catch(next));

// Rutas anteriores del directorio (/festivales y /listados): redirigen para no romper enlaces ya compartidos.
router.get('/listados', publicoRateLimiter, (_req, res) => res.redirect(301, RUTAS.es.listados));
router.get('/listados/festivales', publicoRateLimiter, (_req, res) => res.redirect(301, RUTAS.es.festivales));
router.get('/listados/festivales/:slug', publicoRateLimiter, (req, res) => res.redirect(301, RUTAS.es.festival(String(req.params.slug))));
router.get('/festivales', publicoRateLimiter, (_req, res) => res.redirect(301, RUTAS.es.festivales));
router.get('/festivales/:slug', publicoRateLimiter, (req, res) => res.redirect(301, RUTAS.es.festival(String(req.params.slug))));
router.get('/en/festivals', publicoRateLimiter, (_req, res) => res.redirect(301, RUTAS.en.festivales));
router.get('/en/festivals/:slug', publicoRateLimiter, (req, res) => res.redirect(301, RUTAS.en.festival(String(req.params.slug))));

export default router;
