// Cartelería: el cartel de un bolo.
//   POST /api/cartel/fondo                 fondo con IA (limitador de imagen); entra en el historial del bolo.
//   PUT  /api/cartel/:concertId/config     lo que la banda eligió (fondo, cabeza de cartel, QR…), saneado.
//   PUT  /api/cartel/:concertId/imagen     el cartel final (PNG) → `cartel_url`: lo enseña la página del bolo.
//   POST /api/cartel/:concertId/foto       foto propia de la banda (JPEG) para usarla de fondo.
//   GET/PUT /api/cartel/adn                ADN visual de la banda (paleta, estilo, referencias, favoritos).
//   POST /api/cartel/referencias           una imagen de referencia (JPEG) que la IA mira para parecerse a la banda.
//
// La IA solo pinta la ilustración; el texto lo compone el cliente con los datos reales del bolo
// (`src/utils/cartel/`), porque los modelos de imagen escriben mal los nombres. Todo acotado a la
// banda de la sesión: un bolo ajeno es un 404 y una URL fuera de su carpeta no se guarda.

import express from 'express';
import { randomUUID } from 'crypto';
import { loadState, requireAuth } from '../state.js';
import { dbGetEpkConfig, dbGetRegisteredBandById } from '../db.js';
import { dbGetConcertDeBanda, dbGuardarCartel, type FilaConcierto } from '../db/concerts.js';
import { getTargetBandId } from '../utils/bandAccess.js';
import { apiAutenticadaRateLimiter, ficherosRateLimiter, iaRateLimiter, imagenRateLimiter } from '../middleware/rateLimiter.js';
import { idSeguro } from '../utils/trackingSeguro.js';
import { captureError } from '../utils/errorTracking.js';
import { esConciertoPublicable } from '../utils/paginaConcierto.js';
import { construirPromptFondo, esEstiloCartel, limpiarTextos } from '../utils/promptCartel.js';
import { carpetaCartel, carpetaReferencias, esUrlDeCartel, nombreSeguro, referenciasHuerfanas, rutaDeUrlCartel, rutaIdea } from '../utils/cartelUrl.js';
import { borrarDeAlmacenamiento, descargarDeAlmacenamiento, uploadBufferToSupabase } from '../utils/storage.js';
import { validarMagicBytes } from './upload.js';
import { generarFondoCartel } from '../services/imagenCartel.js';
import { cargarReferencias, tipoDeImagen, type ImagenReferencia } from '../services/referenciasCartel.js';
import { construirBrief } from '../services/briefCartel.js';
import { dbGetAdnCartel, dbGuardarAdnCartel } from '../db/cartelEstilo.js';
import { isSpendCapOrQuotaError } from '../ai.js';
import { loadBandProfile } from '../utils/bandProfile.js';
import { CONFIG_INICIAL, MAX_LOGOS, conFondoIa, sanearConfigCartel, type CartelConfig } from '../../src/utils/cartel/config.js';
import { FORMATOS } from '../../src/utils/cartel/formatos.js';
import { conReferencia, referenciasParaIa, sanearAdn, type AdnCartel } from '../../src/utils/cartel/adn.js';
import { IDEA_VACIA, sanearIdea } from '../../src/utils/cartel/idea.js';
import { fechaCartel } from '../../src/utils/cartel/texto.js';

export const cartelriaRouter = express.Router();

const NO_PUBLICO = 'Este bolo no es público (es privado o está sin confirmar).';
const subidaPng = express.raw({ type: 'image/png', limit: '6mb' });
const subidaJpeg = express.raw({ type: 'image/jpeg', limit: '4mb' });
/** Un logo es pequeño: el cliente lo reescala a 512 px; aquí se admite hasta 1024 px y 2 MB. */
const subidaLogo = express.raw({ type: 'image/png', limit: '2mb' });
const MAX_LADO_LOGO = 1024;

/** Solo se aceptan carteles con las medidas exactas de un formato: nada de imágenes arbitrarias. */
const MEDIDAS_VALIDAS = new Set(Object.values(FORMATOS).map((f) => `${f.ancho}x${Math.round(f.ancho * f.proporcion)}`));

/**
 * El cuerpo binario de la petición como Buffer, o null. Descarta a propósito los tipos que un
 * cliente manipulado puede colar en lugar de un binario (cadena, array, objeto): con `express.raw`
 * un cuerpo con otro Content-Type llega como `{}`, y ni `.length` ni las firmas valdrían nada.
 */
function cuerpoBinario(cuerpo: unknown): Buffer | null {
  if (typeof cuerpo === 'string' || Array.isArray(cuerpo)) return null;
  return Buffer.isBuffer(cuerpo) ? cuerpo : null;
}

/** Ancho y alto de un PNG leídos de su cabecera IHDR, o null si no la tiene donde debe. */
export function medidasPng(buf: Buffer): { ancho: number; alto: number } | null {
  if (buf.length < 24 || buf.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { ancho: buf.readUInt32BE(16), alto: buf.readUInt32BE(20) };
}

const urlPermitida = (bandId: string) => (u: string) => esUrlDeCartel(u, bandId);
const configDe = (c: FilaConcierto, bandId: string): CartelConfig => sanearConfigCartel(c.cartel_config, urlPermitida(bandId)) ?? CONFIG_INICIAL;

/** Resuelve el bolo de la URL dentro de la banda de la sesión, o responde 400/404 y devuelve null. */
async function boloDeLaBanda(req: express.Request, res: express.Response): Promise<{ bandId: string; concierto: FilaConcierto } | null> {
  const bandId = getTargetBandId(req);
  const concertId = req.params.concertId;
  if (!idSeguro(concertId)) {
    res.status(400).json({ error: 'Bolo no válido.' });
    return null;
  }
  const concierto = await dbGetConcertDeBanda(concertId, bandId);
  if (!concierto) {
    res.status(404).json({ error: 'No encontramos ese bolo en tu banda.' });
    return null;
  }
  return { bandId, concierto };
}

async function subir(buf: Buffer, ruta: string, tipo: string): Promise<string | null> {
  const url = await uploadBufferToSupabase(buf, ruta, tipo);
  // Se sobrescribe siempre el mismo fichero: sin la versión, la CDN serviría el cartel anterior.
  return url ? `${url}?v=${Date.now()}` : null;
}

const fallo = (res: express.Response, ruta: string, e: unknown, mensaje: string) => {
  captureError(e instanceof Error ? e : new Error(String(e)), { ruta });
  res.status(500).json({ error: mensaje });
};

/** Sin cupo o tope de gasto en el proveedor de IA: no es culpa de la persona ni se le enseña el error del proveedor. */
const IA_SIN_CUPO = 'La IA de imágenes no está disponible ahora mismo. Prueba más tarde; tu cartel con color sigue funcionando.';

/** El boceto que la persona subió (un solo fichero por banda, en su carpeta), o null si no hay o no es una imagen. */
async function cargarBoceto(bandId: string): Promise<ImagenReferencia | null> {
  const buf = await descargarDeAlmacenamiento(rutaIdea(bandId), 5 * 1024 * 1024);
  const mimeType = buf && tipoDeImagen(buf);
  return buf && mimeType ? { mimeType, data: buf.toString('base64') } : null;
}

cartelriaRouter.post('/cartel/fondo', requireAuth, imagenRateLimiter, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const { concertId, estilo, instrucciones, idea: ideaRaw, conBoceto, encuadre: encuadreRaw, conTexto } = req.body || {};
    const encuadre = encuadreRaw === 'sangre' ? 'sangre' : 'ventana';

    if (typeof concertId !== 'string' || !idSeguro(concertId)) return res.status(400).json({ error: 'Concierto no válido.' });
    if (!esEstiloCartel(estilo)) return res.status(400).json({ error: 'Estilo no válido.' });
    if (instrucciones !== undefined && typeof instrucciones !== 'string') return res.status(400).json({ error: 'Indicaciones no válidas.' });
    const idea = ideaRaw === undefined ? IDEA_VACIA : sanearIdea(ideaRaw);
    if (!idea) return res.status(400).json({ error: 'Idea no válida.' });

    // Acotado a la banda de la sesión: un concierto ajeno es un 404.
    const concierto = await dbGetConcertDeBanda(concertId, bandId);
    if (!concierto) return res.status(404).json({ error: 'No encontramos ese concierto en tu banda.' });
    // Antes de gastar una imagen: un bolo privado no se anuncia.
    if (!esConciertoPublicable(concierto)) return res.status(409).json({ error: NO_PUBLICO });

    // El género es solo ambientación: si el perfil no carga, el cartel sale igual sin él.
    const perfil = await loadBandProfile(bandId, {
      getBand: (id) => dbGetRegisteredBandById(id),
      getEpk: (id) => dbGetEpkConfig(id),
      getState: () => loadState(),
    }).catch((e) => {
      console.warn('[cartel] Sin perfil de banda:', (e as Error)?.message || e);
      return null;
    });
    // El ADN de la banda (sus referencias y favoritos) lo lee el SERVIDOR de la BD: el cliente no
    // decide qué ficheros se leen. Si falla, el fondo se genera igual, sin referencias.
    const adn = await dbGetAdnCartel(bandId, urlPermitida(bandId)).catch(() => null);
    const imagenes = adn ? await cargarReferencias(bandId, referenciasParaIa(adn)) : [];

    // La idea de la persona (texto y boceto) se traduce al inglés y se ordena: el boceto lo lee el
    // SERVIDOR de la carpeta de la banda, el cliente solo dice si quiere usarlo.
    const boceto = conBoceto === true ? await cargarBoceto(bandId) : null;
    const resultado = await construirBrief(bandId, idea, boceto);

    // Letras dibujadas por la IA dentro del arte: solo a sangre y con un solo nombre (con varias bandas el cartel
    // lleva el lineup, que se pinta con letra propia). Los textos salen del bolo y de la banda del SERVIDOR,
    // nunca del cuerpo de la petición.
    const nombreBanda = perfil?.name && perfil.name !== 'la banda' ? perfil.name : '';
    const compartido = Array.isArray(concierto.bandas_compartidas) && concierto.bandas_compartidas.length > 0;
    const textos =
      conTexto === true && encuadre === 'sangre' && nombreBanda && !compartido
        ? limpiarTextos({
            nombre: nombreBanda.toUpperCase(),
            fecha: fechaCartel(String(concierto.fecha || '')),
            lugar: [concierto.sala, concierto.ciudad].map((v) => String(v || '').trim().toUpperCase()).filter(Boolean).join(' · '),
          })
        : null;

    const prompt = construirPromptFondo({
      estilo,
      generoBanda: perfil?.genre || undefined,
      descripcion: perfil?.bio || perfil?.toneSummary || undefined,
      energia: perfil?.toneEnergy || undefined,
      ciudad: String(concierto.ciudad || ''),
      instrucciones,
      referencias: imagenes.length,
      brief: resultado?.brief,
      conBoceto: !!boceto,
      encuadre,
      textos: textos ?? undefined,
    });

    const generado = await generarFondoCartel(bandId, prompt, boceto ? [boceto, ...imagenes] : imagenes, encuadre, textos);
    if (!generado) return res.status(503).json({ error: 'No hemos podido generar el fondo. Prueba en un rato.' });

    // Al historial del bolo, para no volver a pagar este fondo. Si falla, la persona tiene igual su fondo.
    const { url, textoOk } = generado;
    await dbGuardarCartel(concertId, bandId, { cartel_config: conFondoIa(configDe(concierto, bandId), url) }).catch((e) =>
      console.warn('[cartel] No se pudo guardar el fondo en el historial:', (e as Error)?.message || e)
    );
    res.json({ url, estilo, referencias: imagenes.length, conTexto: !!textos, textoOk });
  } catch (e) {
    if (isSpendCapOrQuotaError(e)) {
      // Solo la causa corta al log: el cuerpo del error trae ids de proyecto del proveedor.
      console.warn('[cartel] Gemini sin cupo o con tope de gasto: no se genera el fondo.');
      captureError(new Error('Gemini sin cupo o con tope de gasto (cartel/fondo)'), { ruta: 'POST /cartel/fondo' });
      return res.status(503).json({ error: IA_SIN_CUPO });
    }
    fallo(res, 'POST /cartel/fondo', e, 'No se pudo generar el fondo.');
  }
});

cartelriaRouter.put('/cartel/:concertId/config', requireAuth, apiAutenticadaRateLimiter, async (req, res) => {
  try {
    const bolo = await boloDeLaBanda(req, res);
    if (!bolo) return;
    const config = sanearConfigCartel(req.body, urlPermitida(bolo.bandId));
    if (!config) return res.status(400).json({ error: 'Configuración no válida.' });
    await dbGuardarCartel(req.params.concertId, bolo.bandId, { cartel_config: config });
    res.json({ config });
  } catch (e) {
    fallo(res, 'PUT /cartel/:concertId/config', e, 'No se pudo guardar el cartel.');
  }
});

cartelriaRouter.put('/cartel/:concertId/imagen', requireAuth, ficherosRateLimiter, subidaPng, async (req, res) => {
  try {
    const bolo = await boloDeLaBanda(req, res);
    if (!bolo) return;
    if (!esConciertoPublicable(bolo.concierto)) return res.status(409).json({ error: NO_PUBLICO });

    const buf = cuerpoBinario(req.body);
    if (!buf || !validarMagicBytes(buf, 'png')) return res.status(400).json({ error: 'Eso no es un PNG.' });
    const medidas = medidasPng(buf);
    if (!medidas || !MEDIDAS_VALIDAS.has(`${medidas.ancho}x${medidas.alto}`)) {
      return res.status(400).json({ error: 'El cartel no tiene las medidas de ningún formato.' });
    }

    const url = await subir(buf, `${carpetaCartel(bolo.bandId)}${nombreSeguro(req.params.concertId)}.png`, 'image/png');
    if (!url) return res.status(503).json({ error: 'No se pudo guardar el cartel ahora mismo.' });
    await dbGuardarCartel(req.params.concertId, bolo.bandId, { cartel_url: url });
    res.json({ url });
  } catch (e) {
    fallo(res, 'PUT /cartel/:concertId/imagen', e, 'No se pudo guardar el cartel.');
  }
});

cartelriaRouter.post('/cartel/:concertId/foto', requireAuth, ficherosRateLimiter, subidaJpeg, async (req, res) => {
  try {
    const bolo = await boloDeLaBanda(req, res);
    if (!bolo) return;

    const buf = cuerpoBinario(req.body);
    // El cliente reescala y recodifica siempre a JPEG: aquí no entra otra cosa.
    if (!buf || !validarMagicBytes(buf, 'jpg')) return res.status(400).json({ error: 'Eso no es una foto JPEG.' });

    const url = await subir(buf, `${carpetaCartel(bolo.bandId)}${nombreSeguro(req.params.concertId)}-foto.jpg`, 'image/jpeg');
    if (!url) return res.status(503).json({ error: 'No se pudo guardar la foto ahora mismo.' });
    const config: CartelConfig = { ...configDe(bolo.concierto, bolo.bandId), foto: url, fondo: { tipo: 'imagen', origen: 'foto', url } };
    await dbGuardarCartel(req.params.concertId, bolo.bandId, { cartel_config: config });
    res.json({ url });
  } catch (e) {
    fallo(res, 'POST /cartel/:concertId/foto', e, 'No se pudo guardar la foto.');
  }
});

// ---------------------------------------------------------------------------------------------
// Logos de las otras bandas del bolo
// ---------------------------------------------------------------------------------------------

cartelriaRouter.post('/cartel/:concertId/logo', requireAuth, ficherosRateLimiter, subidaLogo, async (req, res) => {
  try {
    const bolo = await boloDeLaBanda(req, res);
    if (!bolo) return;

    const buf = cuerpoBinario(req.body);
    // El cliente reescala y recodifica siempre a PNG (conserva la transparencia): aquí no entra otra cosa.
    if (!buf || !validarMagicBytes(buf, 'png')) return res.status(400).json({ error: 'Eso no es un PNG.' });
    const medidas = medidasPng(buf);
    if (!medidas || medidas.ancho < 1 || medidas.alto < 1 || medidas.ancho > MAX_LADO_LOGO || medidas.alto > MAX_LADO_LOGO) {
      return res.status(400).json({ error: 'El logo es demasiado grande.' });
    }

    const config = configDe(bolo.concierto, bolo.bandId);
    if (config.logos.length >= MAX_LOGOS) return res.status(409).json({ error: `Caben como mucho ${MAX_LOGOS} logos.` });

    const url = await subir(buf, `${carpetaCartel(bolo.bandId)}${nombreSeguro(req.params.concertId)}-logo-${randomUUID().slice(0, 8)}.png`, 'image/png');
    if (!url) return res.status(503).json({ error: 'No se pudo guardar el logo ahora mismo.' });
    const logos = [...config.logos, url];
    try {
      await dbGuardarCartel(req.params.concertId, bolo.bandId, { cartel_config: { ...config, logos } });
    } catch (e) {
      // Sin la fila no hay quien lo use: no se deja el fichero huérfano.
      const ruta = rutaDeUrlCartel(url, bolo.bandId);
      if (ruta) await borrarDeAlmacenamiento([ruta]);
      throw e;
    }
    res.json({ url, logos });
  } catch (e) {
    fallo(res, 'POST /cartel/:concertId/logo', e, 'No se pudo guardar el logo.');
  }
});

/** Solo se borra un logo que este bolo tiene en su cartel: la ruta sale de su configuración, no de lo que mande el cliente. */
cartelriaRouter.delete('/cartel/:concertId/logo', requireAuth, apiAutenticadaRateLimiter, async (req, res) => {
  try {
    const bolo = await boloDeLaBanda(req, res);
    if (!bolo) return;
    const url = typeof req.body?.url === 'string' ? req.body.url : '';
    const config = configDe(bolo.concierto, bolo.bandId);
    if (!config.logos.includes(url)) return res.status(404).json({ error: 'Ese logo no está en el cartel.' });

    const logos = config.logos.filter((u) => u !== url);
    await dbGuardarCartel(req.params.concertId, bolo.bandId, { cartel_config: { ...config, logos } });
    const ruta = rutaDeUrlCartel(url, bolo.bandId);
    if (ruta) await borrarDeAlmacenamiento([ruta]);
    res.json({ logos });
  } catch (e) {
    fallo(res, 'DELETE /cartel/:concertId/logo', e, 'No se pudo quitar el logo.');
  }
});

// ---------------------------------------------------------------------------------------------
// La idea de la persona: su boceto y el brief en inglés
// ---------------------------------------------------------------------------------------------

cartelriaRouter.post('/cartel/idea', requireAuth, ficherosRateLimiter, subidaJpeg, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const buf = cuerpoBinario(req.body);
    // El cliente reescala y recodifica siempre a JPEG: aquí no entra otra cosa.
    if (!buf || !validarMagicBytes(buf, 'jpg')) return res.status(400).json({ error: 'Eso no es una imagen JPEG.' });
    // Siempre el mismo fichero: subir otro boceto sustituye al anterior y no quedan huérfanos.
    const url = await uploadBufferToSupabase(buf, rutaIdea(bandId), 'image/jpeg');
    if (!url) return res.status(503).json({ error: 'No se pudo guardar el boceto ahora mismo.' });
    res.json({ ok: true });
  } catch (e) {
    fallo(res, 'POST /cartel/idea', e, 'No se pudo guardar el boceto.');
  }
});

cartelriaRouter.delete('/cartel/idea', requireAuth, apiAutenticadaRateLimiter, async (req, res) => {
  try {
    await borrarDeAlmacenamiento([rutaIdea(getTargetBandId(req))]);
    res.json({ ok: true });
  } catch (e) {
    fallo(res, 'DELETE /cartel/idea', e, 'No se pudo quitar el boceto.');
  }
});

/** Lo que se le va a pedir a la IA, en inglés, sin generar ninguna imagen: para que la persona lo vea antes de gastar. */
cartelriaRouter.post('/cartel/brief', requireAuth, iaRateLimiter, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const idea = sanearIdea(req.body?.idea);
    if (!idea) return res.status(400).json({ error: 'Idea no válida.' });
    const boceto = req.body?.conBoceto === true ? await cargarBoceto(bandId) : null;
    const resultado = await construirBrief(bandId, idea, boceto);
    res.json({ brief: resultado?.brief ?? null, traducido: resultado?.traducido ?? false, conBoceto: !!boceto });
  } catch (e) {
    fallo(res, 'POST /cartel/brief', e, 'No se pudo preparar la idea.');
  }
});

// ---------------------------------------------------------------------------------------------
// ADN visual de la banda
// ---------------------------------------------------------------------------------------------

const subidaReferencia = express.raw({ type: 'image/jpeg', limit: '4mb' });

cartelriaRouter.get('/cartel/adn', requireAuth, apiAutenticadaRateLimiter, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const adn = await dbGetAdnCartel(bandId, urlPermitida(bandId));
    if (!adn) return res.status(503).json({ error: 'No se pudo leer el estilo de la banda.' });
    res.json({ adn });
  } catch (e) {
    fallo(res, 'GET /cartel/adn', e, 'No se pudo leer el estilo de la banda.');
  }
});

cartelriaRouter.put('/cartel/adn', requireAuth, apiAutenticadaRateLimiter, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const nuevo = sanearAdn(req.body, urlPermitida(bandId));
    if (!nuevo) return res.status(400).json({ error: 'Estilo no válido.' });
    const antes = await dbGetAdnCartel(bandId, urlPermitida(bandId));
    if (!antes) return res.status(503).json({ error: 'No se pudo guardar el estilo ahora mismo.' });
    if (!(await dbGuardarAdnCartel(bandId, nuevo))) return res.status(503).json({ error: 'No se pudo guardar el estilo ahora mismo.' });
    // Solo tras guardar: un fallo no deja a la banda sin las imágenes que aún tenía en su ADN.
    await borrarDeAlmacenamiento(referenciasHuerfanas([...antes.referencias], [...nuevo.referencias, ...nuevo.favoritos.map((f) => f.url)], bandId));
    res.json({ adn: nuevo });
  } catch (e) {
    fallo(res, 'PUT /cartel/adn', e, 'No se pudo guardar el estilo.');
  }
});

cartelriaRouter.post('/cartel/referencias', requireAuth, ficherosRateLimiter, subidaReferencia, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const buf = cuerpoBinario(req.body);
    // El cliente reescala y recodifica siempre a JPEG: aquí no entra otra cosa.
    if (!buf || !validarMagicBytes(buf, 'jpg')) return res.status(400).json({ error: 'Eso no es una imagen JPEG.' });

    const antes = await dbGetAdnCartel(bandId, urlPermitida(bandId));
    if (!antes) return res.status(503).json({ error: 'No se pudo guardar la referencia ahora mismo.' });

    const url = await subir(buf, `${carpetaReferencias(bandId)}${randomUUID()}.jpg`, 'image/jpeg');
    if (!url) return res.status(503).json({ error: 'No se pudo guardar la referencia ahora mismo.' });

    const despues: AdnCartel = conReferencia(antes, url);
    if (!(await dbGuardarAdnCartel(bandId, despues))) {
      await borrarDeAlmacenamiento(referenciasHuerfanas([url], [], bandId));
      return res.status(503).json({ error: 'No se pudo guardar la referencia ahora mismo.' });
    }
    // La cuarta referencia desplaza a la más antigua: su fichero ya no lo usa nadie.
    await borrarDeAlmacenamiento(referenciasHuerfanas(antes.referencias, [...despues.referencias, ...despues.favoritos.map((f) => f.url)], bandId));
    res.json({ url, adn: despues });
  } catch (e) {
    fallo(res, 'POST /cartel/referencias', e, 'No se pudo guardar la referencia.');
  }
});
