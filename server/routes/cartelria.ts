// Cartelería: fondo de un cartel de concierto generado con IA.
//   POST /api/cartel/fondo   con sesión y limitador propio de imagen.
//
// La IA solo pinta la ilustración. El texto (banda, sala, fecha) lo compone el cliente encima con
// los datos reales del concierto (`src/utils/cartelCompose.ts`), porque los modelos de imagen
// escriben mal los nombres. Nada se publica aquí: es un borrador que la persona descarga.

import express from 'express';
import { dbGetConcertDeBanda } from '../db/concerts.js';
import { getTargetBandId } from '../utils/bandAccess.js';
import { imagenRateLimiter } from '../middleware/rateLimiter.js';
import { idSeguro } from '../utils/trackingSeguro.js';
import { captureError } from '../utils/errorTracking.js';
import { construirPromptFondo, esEstiloCartel } from '../utils/promptCartel.js';
import { generarFondoCartel } from '../services/imagenCartel.js';
import { loadState, requireAuth } from '../state.js';
import { dbGetEpkConfig, dbGetRegisteredBandById } from '../db.js';
import { loadBandProfile } from '../utils/bandProfile.js';

export const cartelriaRouter = express.Router();

cartelriaRouter.post('/cartel/fondo', requireAuth, imagenRateLimiter, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const { concertId, estilo, instrucciones } = req.body || {};

    if (typeof concertId !== 'string' || !idSeguro(concertId)) return res.status(400).json({ error: 'Concierto no válido.' });
    if (!esEstiloCartel(estilo)) return res.status(400).json({ error: 'Estilo no válido.' });
    if (instrucciones !== undefined && typeof instrucciones !== 'string') return res.status(400).json({ error: 'Indicaciones no válidas.' });

    // Acotado a la banda de la sesión: un concierto ajeno es un 404.
    const concierto = await dbGetConcertDeBanda(concertId, bandId);
    if (!concierto) return res.status(404).json({ error: 'No encontramos ese concierto en tu banda.' });

    // El género es solo ambientación: si el perfil no carga, el cartel sale igual sin él.
    const perfil = await loadBandProfile(bandId, {
      getBand: (id) => dbGetRegisteredBandById(id),
      getEpk: (id) => dbGetEpkConfig(id),
      getState: () => loadState(),
    }).catch((e) => {
      console.warn('[cartel] Sin perfil de banda:', (e as Error)?.message || e);
      return null;
    });
    const prompt = construirPromptFondo({
      estilo,
      generoBanda: perfil?.genre || undefined,
      ciudad: String(concierto.ciudad || ''),
      instrucciones,
    });

    const url = await generarFondoCartel(bandId, prompt);
    if (!url) return res.status(503).json({ error: 'No hemos podido generar el fondo ahora mismo. Prueba en un rato.' });
    res.json({ url, estilo });
  } catch (e) {
    captureError(e instanceof Error ? e : new Error(String(e)), { ruta: 'POST /cartel/fondo' });
    res.status(500).json({ error: 'No se pudo generar el fondo.' });
  }
});
