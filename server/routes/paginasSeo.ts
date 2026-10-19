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
import { obtenerSalasPublicas } from '../services/salasPublicas.js';
import { renderizarListados } from '../utils/seo/listados.js';
import { indexable } from '../utils/seo/festivales/vigencia.js';
import { indexableIndice } from '../utils/seo/salas/publicas.js';
import { renderizarCiudad, renderizarComunidad, renderizarIndiceSalas, renderizarSala, renderizarSalaNoEncontrada } from '../utils/seo/salas/render.js';
import { RUTAS, type IdiomaSeo } from '../utils/seo/rutas.js';

const router = express.Router();
const CACHE = 'public, max-age=3600, s-maxage=86400';
const B = () => baseUrlPublica();

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

function deSala(salas: Awaited<ReturnType<typeof obtenerSalasPublicas>>, p: Record<string, string>, idioma: IdiomaSeo): string | null {
  const sala = salas.find((s) => s.slug === p.slug && s.comunidadSlug === p.comunidad && s.ciudadSlug === p.ciudad);
  return sala ? renderizarSala(B(), idioma, sala) : null;
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

async function enviarListados(res: express.Response, idioma: IdiomaSeo) {
  const indexables = Number(indexable(await obtenerFestivales(), hoy())) + Number(indexableIndice(await obtenerSalasPublicas()));
  responderHtml(res, 200, renderizarListados(baseUrlPublica(), idioma, indexables), CACHE);
}

/** Una página de zona o de sala: si no existe (o no hay salas publicadas ahí) responde 404 en el idioma de la página. */
async function enviarSalas(res: express.Response, idioma: IdiomaSeo, pagina: (salas: Awaited<ReturnType<typeof obtenerSalasPublicas>>) => string | null) {
  const base = baseUrlPublica();
  const html = pagina(await obtenerSalasPublicas());
  if (!html) return responderHtml(res, 404, renderizarSalaNoEncontrada(base, idioma), 'public, max-age=60');
  responderHtml(res, 200, html, CACHE);
}

router.get('/directories', publicoRateLimiter, (_req, res, next) => enviarListados(res, 'es').catch(next));
router.get('/en/directories', publicoRateLimiter, (_req, res, next) => enviarListados(res, 'en').catch(next));
router.get('/directories/festivals', publicoRateLimiter, (_req, res, next) => enviarIndiceFestivales(res, 'es').catch(next));
router.get('/directories/festivals/:slug', publicoRateLimiter, (req, res, next) => enviarFestival(res, req.params.slug, 'es').catch(next));
router.get('/en/directories/festivals', publicoRateLimiter, (_req, res, next) => enviarIndiceFestivales(res, 'en').catch(next));
router.get('/en/directories/festivals/:slug', publicoRateLimiter, (req, res, next) => enviarFestival(res, req.params.slug, 'en').catch(next));

// Salas de conciertos (rutas literales: `npm run docs:api` no entiende rutas construidas).
router.get('/directories/venues', publicoRateLimiter, (_req, res, next) => enviarSalas(res, 'es', (s) => renderizarIndiceSalas(B(), 'es', s)).catch(next));
router.get('/directories/venues/:comunidad', publicoRateLimiter, (req, res, next) => enviarSalas(res, 'es', (s) => renderizarComunidad(B(), 'es', s, String(req.params.comunidad))).catch(next));
router.get('/directories/venues/:comunidad/:ciudad', publicoRateLimiter, (req, res, next) => enviarSalas(res, 'es', (s) => renderizarCiudad(B(), 'es', s, String(req.params.comunidad), String(req.params.ciudad))).catch(next));
router.get('/directories/venues/:comunidad/:ciudad/:slug', publicoRateLimiter, (req, res, next) => enviarSalas(res, 'es', (s) => deSala(s, req.params, 'es')).catch(next));
router.get('/en/directories/venues', publicoRateLimiter, (_req, res, next) => enviarSalas(res, 'en', (s) => renderizarIndiceSalas(B(), 'en', s)).catch(next));
router.get('/en/directories/venues/:comunidad', publicoRateLimiter, (req, res, next) => enviarSalas(res, 'en', (s) => renderizarComunidad(B(), 'en', s, String(req.params.comunidad))).catch(next));
router.get('/en/directories/venues/:comunidad/:ciudad', publicoRateLimiter, (req, res, next) => enviarSalas(res, 'en', (s) => renderizarCiudad(B(), 'en', s, String(req.params.comunidad), String(req.params.ciudad))).catch(next));
router.get('/en/directories/venues/:comunidad/:ciudad/:slug', publicoRateLimiter, (req, res, next) => enviarSalas(res, 'en', (s) => deSala(s, req.params, 'en')).catch(next));

// Rutas anteriores del directorio (/festivales y /listados): redirigen para no romper enlaces ya compartidos.
router.get('/listados', publicoRateLimiter, (_req, res) => res.redirect(301, RUTAS.es.listados));
router.get('/listados/festivales', publicoRateLimiter, (_req, res) => res.redirect(301, RUTAS.es.festivales));
router.get('/listados/festivales/:slug', publicoRateLimiter, (req, res) => res.redirect(301, RUTAS.es.festival(String(req.params.slug))));
router.get('/festivales', publicoRateLimiter, (_req, res) => res.redirect(301, RUTAS.es.festivales));
router.get('/festivales/:slug', publicoRateLimiter, (req, res) => res.redirect(301, RUTAS.es.festival(String(req.params.slug))));
router.get('/en/festivals', publicoRateLimiter, (_req, res) => res.redirect(301, RUTAS.en.festivales));
router.get('/en/festivals/:slug', publicoRateLimiter, (req, res) => res.redirect(301, RUTAS.en.festival(String(req.params.slug))));

export default router;
