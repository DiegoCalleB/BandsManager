// Enlaces cortos con atribución. Dos routers:
//   · `enlacesCortosPublicoRouter`: GET /r/:code — redirección sin sesión que cuenta el clic.
//   · `enlacesCortosApiRouter` (montado en /api): crear, listar con estadísticas y borrar; con sesión.
//
// La redirección solo va a destinos que RESUELVE el servidor desde los datos de la banda
// (`resolverDestino`): nunca a una URL que venga en la petición (AGENTS.md §1, seguimiento público).

import express from 'express';
import { requireAuth } from '../state.js';
import { getTargetBandId } from '../utils/bandAccess.js';
import { createRateLimiter, ipDelCliente, publicoRateLimiter } from '../middleware/rateLimiter.js';
import { dbGetConcertDeBanda, type FilaConcierto } from '../db/concerts.js';
import {
  dbAsegurarEnlace,
  dbBorrarEnlace,
  dbClicsDeBanda,
  dbGetEnlacePorCodigo,
  dbListarEnlaces,
  dbRegistrarClic,
  MAX_CLICS_LEIDOS,
} from '../db/enlacesCortos.js';
import {
  diaMadrid,
  dispositivoDe,
  esBot,
  esCanal,
  esDestino,
  hashVisitante,
  normalizarCodigo,
  origenDe,
  resolverDestino,
  resumirClics,
  urlHttpSegura,
  MAX_ENLACES_POR_BANDA,
} from '../utils/enlacesCortos.js';
import { baseUrlPublica, esConciertoPublicable, urlConcierto } from '../utils/paginaConcierto.js';
import { encodeBandId } from '../utils/bandHash.js';
import { idSeguro, secretoDeTracking } from '../utils/trackingSeguro.js';
import { obtenerPerfilPublicoBandaCacheado } from '../services/perfilPublicoBanda.js';
import { captureError } from '../utils/errorTracking.js';

/** Ventana de las estadísticas que se enseñan en la app. */
const DIAS_ESTADISTICAS = 90;

/* ------------------------------------------------------------------ público: /r/:code */

export const enlacesCortosPublicoRouter = express.Router();

enlacesCortosPublicoRouter.get('/r/:code', publicoRateLimiter, async (req, res) => {
  const base = baseUrlPublica();
  // Un enlace que se reparte en un cartel no puede cachearse (el destino puede cambiar) ni indexarse.
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  const code = normalizarCodigo(req.params.code);
  if (!code) return res.redirect(302, base);

  try {
    const enlace = await dbGetEnlacePorCodigo(code);
    if (!enlace) return res.redirect(302, base);

    // La banda sale de la FILA del enlace; el concierto se busca acotado a esa banda, así que un
    // enlace nunca puede resolver datos de otra.
    let concierto: FilaConcierto | null = null;
    if (enlace.concert_id) {
      try {
        concierto = await dbGetConcertDeBanda(enlace.concert_id, enlace.band_id);
      } catch (e) {
        console.warn('[enlaces cortos] No se pudo leer el concierto del enlace:', (e as Error)?.message || e);
      }
    }

    // Un evento privado o sin confirmar no se enseña por NINGUNA vía, tampoco su enlace de entradas.
    const publicable = !!concierto && esConciertoPublicable(concierto);
    const entradasUrl = publicable ? (concierto?.entradas_url ?? null) : null;
    const necesitaPagina = enlace.destino === 'concierto' || (enlace.destino === 'entradas' && !urlHttpSegura(entradasUrl));
    let conciertoUrl: string | null = null;
    if (necesitaPagina && concierto && publicable) {
      const perfil = await obtenerPerfilPublicoBandaCacheado(enlace.band_id);
      conciertoUrl = urlConcierto(base, perfil.nombre, concierto as { id: string; sala: string; fecha: string });
    }

    const { url } = resolverDestino(enlace, {
      baseUrl: base,
      bandToken: encodeBandId(enlace.band_id),
      entradasUrl,
      conciertoUrl,
      concertId: enlace.concert_id,
    });

    res.redirect(302, url);

    // El clic se cuenta DESPUÉS de responder: la persona no espera a la base de datos.
    const userAgent = String(req.headers['user-agent'] || '');
    if (!esBot(userAgent)) {
      const visitante = hashVisitante(ipDelCliente(req), userAgent, diaMadrid(new Date()), secretoDeTracking());
      dbRegistrarClic({
        code: enlace.code,
        bandId: enlace.band_id,
        visitante,
        dispositivo: dispositivoDe(userAgent),
        origen: origenDe(req.headers['referer']),
      }).catch((e) => console.warn('[enlaces cortos] No se pudo registrar el clic:', (e as Error)?.message || e));
    }
  } catch (e) {
    captureError(e instanceof Error ? e : new Error(String(e)), { ruta: '/r/:code' });
    if (!res.headersSent) res.redirect(302, base);
  }
});

/* ------------------------------------------------------------------ API autenticada */

export const enlacesCortosApiRouter = express.Router();

const escrituraLimiter = createRateLimiter({
  nombre: 'enlaces-cortos',
  windowMs: 60 * 1000,
  maxRequests: 30,
  porUsuario: true,
  mensaje: 'Demasiados enlaces seguidos. Espera un momento.',
});

function urlCorta(base: string, code: string): string {
  return `${base}/r/${code}`;
}

enlacesCortosApiRouter.get('/short-links', requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const concertId = typeof req.query.concertId === 'string' && idSeguro(req.query.concertId) ? req.query.concertId : undefined;
    const base = baseUrlPublica();

    const enlaces = await dbListarEnlaces(bandId, concertId);
    // Los clics se piden siempre de la banda entera y se filtran en memoria: una consulta, y los
    // totales por canal de un concierto salen del mismo resumen.
    const desde = new Date(Date.now() - DIAS_ESTADISTICAS * 86_400_000).toISOString();
    const clics = enlaces.length ? await dbClicsDeBanda(bandId, desde) : [];
    const resumen = resumirClics(enlaces, clics);

    res.json({
      base,
      dias: DIAS_ESTADISTICAS,
      // Si se leyó el tope, las cifras son un mínimo: la app debe poder decirlo.
      truncado: clics.length >= MAX_CLICS_LEIDOS,
      limite: MAX_ENLACES_POR_BANDA,
      totales: resumen.totales,
      porCanal: resumen.porCanal,
      enlaces: enlaces.map((e) => ({
        code: e.code,
        url: urlCorta(base, e.code),
        destino: e.destino,
        canal: e.canal,
        concertId: e.concert_id,
        ...resumen.porEnlace[e.code],
      })),
    });
  } catch (e) {
    captureError(e instanceof Error ? e : new Error(String(e)), { ruta: 'GET /short-links' });
    res.status(500).json({ error: 'No se pudieron cargar los enlaces.' });
  }
});

enlacesCortosApiRouter.post('/short-links', requireAuth, escrituraLimiter, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const { destino, canal } = req.body || {};
    const concertId = typeof req.body?.concertId === 'string' && req.body.concertId ? req.body.concertId : null;

    if (!esDestino(destino)) return res.status(400).json({ error: 'Destino no válido.' });
    if (!esCanal(canal)) return res.status(400).json({ error: 'Canal no válido.' });
    if (concertId !== null && !idSeguro(concertId)) return res.status(400).json({ error: 'Concierto no válido.' });
    if ((destino === 'entradas' || destino === 'concierto') && !concertId) {
      return res.status(400).json({ error: 'Este enlace necesita un concierto.' });
    }

    if (concertId) {
      // Acotado a la banda de la sesión: un id de otra banda es un 404, no «existe pero no es tuyo».
      const concierto = await dbGetConcertDeBanda(concertId, bandId);
      if (!concierto) return res.status(404).json({ error: 'No encontramos ese concierto en tu banda.' });
      if ((destino === 'entradas' || destino === 'concierto') && !esConciertoPublicable(concierto)) {
        return res.status(409).json({ error: 'Este concierto no es público (es privado o está sin confirmar).' });
      }
      if (destino === 'entradas' && !urlHttpSegura(concierto.entradas_url)) {
        return res.status(409).json({ error: 'Este concierto todavía no tiene enlace de entradas. Añádelo en el calendario.' });
      }
    }

    const resultado = await dbAsegurarEnlace(bandId, { concertId, destino, canal });
    if (!resultado.ok) {
      return res.status(409).json({ error: `Has llegado al máximo de ${MAX_ENLACES_POR_BANDA} enlaces. Borra los que ya no uses.` });
    }

    const base = baseUrlPublica();
    const { enlace, creado } = resultado;
    res.status(creado ? 201 : 200).json({
      code: enlace.code,
      url: urlCorta(base, enlace.code),
      destino: enlace.destino,
      canal: enlace.canal,
      concertId: enlace.concert_id,
      creado,
    });
  } catch (e) {
    captureError(e instanceof Error ? e : new Error(String(e)), { ruta: 'POST /short-links' });
    res.status(500).json({ error: 'No se pudo crear el enlace.' });
  }
});

enlacesCortosApiRouter.delete('/short-links/:code', requireAuth, escrituraLimiter, async (req, res) => {
  try {
    const code = normalizarCodigo(req.params.code);
    if (!code) return res.status(400).json({ error: 'Código no válido.' });
    const borrado = await dbBorrarEnlace(code, getTargetBandId(req));
    if (!borrado) return res.status(404).json({ error: 'No encontramos ese enlace en tu banda.' });
    res.json({ success: true });
  } catch (e) {
    captureError(e instanceof Error ? e : new Error(String(e)), { ruta: 'DELETE /short-links' });
    res.status(500).json({ error: 'No se pudo borrar el enlace.' });
  }
});
