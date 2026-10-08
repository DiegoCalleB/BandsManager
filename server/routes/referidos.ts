// Referidos entre bandas e insignia «Powered by BandManager.io».
//   · GET  /api/referidos            con sesión: código de la banda, enlace de invitación y cuántas ha invitado.
//   · POST /api/referidos/atribuir   con sesión: atribuye el alta (reciente) a la banda dueña del código.
//   · GET  /api/public/insignia      sin sesión: enlace de la insignia de una banda (null si su plan no la lleva).
//
// Una banda ve solo el NÚMERO de bandas que ha invitado, nunca cuáles son (AGENTS.md §2.1). La
// atribución responde siempre igual (sin revelar de qué banda es un código) y la primera manda.

import express from 'express';
import { requireAuth } from '../state.js';
import { getTargetBandId } from '../utils/bandAccess.js';
import { createRateLimiter, publicoRateLimiter } from '../middleware/rateLimiter.js';
import { dbAsegurarRefCode, dbBandaPorRefCode, dbContarReferidos, dbGetBandaRegistrada, dbRegistrarReferido } from '../db/referidos.js';
import { decodeBandId } from '../utils/bandHash.js';
import { baseUrlPublica } from '../utils/paginaConcierto.js';
import { idSeguro } from '../utils/trackingSeguro.js';
import { decidirReferido, esAltaReciente, normalizarCodigoReferido, urlInsignia, urlInvitacion, type OrigenInsignia } from '../utils/referidos.js';
import { obtenerPerfilPublicoBandaCacheado } from '../services/perfilPublicoBanda.js';
import { captureError } from '../utils/errorTracking.js';

export const referidosRouter = express.Router();

const limitador = createRateLimiter({
  nombre: 'referidos',
  windowMs: 60 * 1000,
  maxRequests: 10,
  porUsuario: true,
  mensaje: 'Demasiadas peticiones seguidas. Espera un momento.',
});

referidosRouter.get('/referidos', requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const codigo = await dbAsegurarRefCode(bandId);
    if (!codigo) return res.status(404).json({ error: 'No encontramos tu banda registrada.' });
    res.json({
      codigo,
      url: urlInvitacion(baseUrlPublica(), codigo),
      invitadas: await dbContarReferidos(bandId),
    });
  } catch (e) {
    captureError(e instanceof Error ? e : new Error(String(e)), { ruta: 'GET /referidos' });
    res.status(500).json({ error: 'No se pudo cargar tu enlace de invitación.' });
  }
});

referidosRouter.post('/referidos/atribuir', requireAuth, limitador, async (req, res) => {
  // Respuesta idéntica en todos los casos: quien envía el código no averigua si existe ni de quién es.
  const nada = () => res.json({ atribuido: false });
  try {
    const bandId = getTargetBandId(req);
    const codigo = normalizarCodigoReferido(req.body?.codigo);
    if (!codigo) return nada();

    const fila = await dbGetBandaRegistrada(bandId);
    if (!fila || !esAltaReciente(fila.fecha_registro)) return nada();

    const bandaDelCodigo = await dbBandaPorRefCode(codigo);
    const decision = decidirReferido({
      codigo,
      bandaDelCodigo,
      bandaNueva: String(fila.band_id),
      referidoPorActual: typeof fila.referido_por === 'string' ? fila.referido_por : null,
    });
    if (!decision.ok || !bandaDelCodigo) return nada();

    res.json({ atribuido: await dbRegistrarReferido(String(fila.band_id), bandaDelCodigo) });
  } catch (e) {
    captureError(e instanceof Error ? e : new Error(String(e)), { ruta: 'POST /referidos/atribuir' });
    nada();
  }
});

const ORIGENES: readonly OrigenInsignia[] = ['epk', 'fans', 'concierto'];

referidosRouter.get('/public/insignia', publicoRateLimiter, async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300');
  try {
    const crudo = typeof req.query.b === 'string' ? req.query.b : '';
    const bandId = decodeBandId(crudo);
    const origen = ORIGENES.find((o) => o === req.query.o) ?? 'epk';
    if (!bandId || !idSeguro(bandId)) return res.json({ href: null });

    const perfil = await obtenerPerfilPublicoBandaCacheado(bandId);
    res.json({ href: perfil.mostrarInsignia ? urlInsignia(baseUrlPublica(), perfil.refCode, origen) : null });
  } catch (e) {
    captureError(e instanceof Error ? e : new Error(String(e)), { ruta: 'GET /public/insignia' });
    // Sin insignia es el fallo seguro: nunca rompe el dossier ni la landing.
    res.json({ href: null });
  }
});
