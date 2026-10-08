// Páginas públicas indexables: /e/:slug (un concierto), /sitemap.xml y /robots.txt.
// HTML generado en el servidor (server/utils/paginaConcierto.ts) para que Google y las vistas
// previas de WhatsApp/Instagram vean el concierto sin ejecutar JavaScript.
//
// Solo se publica lo que `esConciertoPublicable` deja pasar (nada de eventos privados ni bolos
// sin confirmar) y solo los campos de la lista blanca de `DatosPaginaConcierto`.

import express from 'express';
import { publicoRateLimiter } from '../middleware/rateLimiter.js';
import { dbGetConcertPublicoPorId, dbGetConciertosFuturosParaSitemap, type FilaConcierto } from '../db/concerts.js';
import { dbAsegurarEnlace } from '../db/enlacesCortos.js';
import { encodeBandId } from '../utils/bandHash.js';
import { urlHttpSegura, conUtm } from '../utils/enlacesCortos.js';
import {
  baseUrlPublica,
  esConciertoPublicable,
  haPasado,
  hoyIso,
  idDesdeSlug,
  renderizarNoEncontrado,
  renderizarPaginaConcierto,
  renderizarSitemap,
  slugConcierto,
  type EntradaSitemap,
} from '../utils/paginaConcierto.js';
import { urlInsignia } from '../utils/referidos.js';
import { obtenerPerfilPublicoBandaCacheado } from '../services/perfilPublicoBanda.js';
import { captureError } from '../utils/errorTracking.js';

const router = express.Router();

function responderHtml(res: express.Response, status: number, html: string, cache: string) {
  res.status(status);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', cache);
  res.send(html);
}

router.get('/e/:slug', publicoRateLimiter, async (req, res) => {
  const base = baseUrlPublica();
  try {
    const id = idDesdeSlug(req.params.slug);
    const concierto = id ? await dbGetConcertPublicoPorId(id) : null;

    // Mismo 404 para «no existe», «es privado» y «está sin confirmar»: no se revela cuál de los tres.
    if (!concierto || !esConciertoPublicable(concierto)) {
      return responderHtml(res, 404, renderizarNoEncontrado(base), 'public, max-age=60');
    }

    const bandId = String(concierto.band_id);
    const perfil = await obtenerPerfilPublicoBandaCacheado(bandId);
    const slug = slugConcierto(perfil.nombre, concierto as { id: string; sala: string; fecha: string });
    // Si la banda cambió de nombre o el slug viene a medias, se lleva a la URL canónica (301).
    if (req.params.slug !== slug) return res.redirect(301, `/e/${slug}`);

    const pasado = haPasado(concierto.fecha);
    const entradasDirecta = urlHttpSegura(concierto.entradas_url);

    // El botón de entradas pasa por un enlace corto del canal «web»: así se ve en el panel cuánta
    // gente llega a las entradas desde esta página. Si no se puede crear, se enlaza directo.
    let entradasHref = entradasDirecta;
    if (entradasDirecta && !pasado) {
      try {
        const r = await dbAsegurarEnlace(bandId, { concertId: concierto.id, destino: 'entradas', canal: 'web' });
        if (r.ok) entradasHref = `${base}/r/${r.enlace.code}`;
      } catch (e) {
        console.warn('[página concierto] No se pudo crear el enlace corto, se enlaza directo:', (e as Error)?.message || e);
      }
    }

    const token = encodeURIComponent(encodeBandId(bandId));
    const html = renderizarPaginaConcierto({
      baseUrl: base,
      canonicalUrl: `${base}/e/${slug}`,
      id: concierto.id,
      fecha: concierto.fecha,
      sala: String(concierto.sala).trim(),
      ciudad: String(concierto.ciudad || '').trim(),
      direccion: concierto.direccion ? String(concierto.direccion).trim() : null,
      cartelUrl: urlHttpSegura(concierto.cartel_url),
      bandaNombre: perfil.nombre,
      logoUrl: perfil.logoUrl,
      entradasHref,
      entradasDirectaUrl: entradasDirecta,
      epkUrl: conUtm(`${base}/epk?b=${token}`, 'pagina_concierto', concierto.id),
      fansUrl: conUtm(`${base}/unete?b=${token}&concertId=${encodeURIComponent(concierto.id)}`, 'pagina_concierto', concierto.id),
      pasado,
      insigniaHref: perfil.mostrarInsignia ? urlInsignia(base, perfil.refCode, 'concierto') : null,
    });
    responderHtml(res, 200, html, 'public, max-age=300, s-maxage=600');
  } catch (e) {
    captureError(e instanceof Error ? e : new Error(String(e)), { ruta: '/e/:slug' });
    responderHtml(res, 500, renderizarNoEncontrado(base), 'no-store');
  }
});

/* ------------------------------------------------------------------ sitemap */

const TTL_SITEMAP_MS = 60 * 60 * 1000;
const MAX_BANDAS_SITEMAP = 1000;
let sitemapEnCache: { hasta: number; xml: string } | null = null;

/** Solo para los tests. */
export function _vaciarCacheSitemap() {
  sitemapEnCache = null;
}

async function construirSitemap(base: string): Promise<string> {
  const filas = (await dbGetConciertosFuturosParaSitemap(hoyIso())).filter((c) => esConciertoPublicable(c));
  const bandas = [...new Set(filas.map((c) => String(c.band_id)))].slice(0, MAX_BANDAS_SITEMAP);
  const nombres = new Map<string, string>();
  for (let i = 0; i < bandas.length; i += 10) {
    await Promise.all(
      bandas.slice(i, i + 10).map(async (b) => {
        try {
          nombres.set(b, (await obtenerPerfilPublicoBandaCacheado(b)).nombre);
        } catch {
          /* sin nombre no hay URL canónica: se omiten sus conciertos */
        }
      })
    );
  }
  const entradas: EntradaSitemap[] = [{ loc: `${base}/` }];
  for (const c of filas as Array<FilaConcierto & { id: string; sala: string; fecha: string }>) {
    const nombre = nombres.get(String(c.band_id));
    if (!nombre) continue;
    entradas.push({ loc: `${base}/e/${slugConcierto(nombre, c)}`, lastmod: hoyIso() });
  }
  return renderizarSitemap(entradas);
}

router.get('/sitemap.xml', publicoRateLimiter, async (_req, res) => {
  const base = baseUrlPublica();
  try {
    if (!sitemapEnCache || sitemapEnCache.hasta < Date.now()) {
      sitemapEnCache = { hasta: Date.now() + TTL_SITEMAP_MS, xml: await construirSitemap(base) };
    }
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(sitemapEnCache.xml);
  } catch (e) {
    captureError(e instanceof Error ? e : new Error(String(e)), { ruta: '/sitemap.xml' });
    // Sin base de datos, un sitemap válido con solo la portada es mejor que un 500 para el rastreador.
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.send(renderizarSitemap([{ loc: `${base}/` }]));
  }
});

router.get('/robots.txt', (_req, res) => {
  const base = baseUrlPublica();
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(['User-agent: *', 'Allow: /', 'Disallow: /api/', 'Disallow: /r/', `Sitemap: ${base}/sitemap.xml`, ''].join('\n'));
});

export default router;
