import express from 'express';
import {
  loadState,
  saveState,
  requireAuth,
  getEpkConfigForBand,
  getAutonomyConfigForBand,
  BAKANDEYA_BAND_ID,
} from '../state.js';
import { EPKConfig, Fan } from '../../src/types.js';
import {
  dbGetAutonomyConfig,
  dbUpsertAutonomyConfig,
  dbGetEpkConfig,
  dbUpsertEpkConfig,
  dbGetFans,
  dbUpsertFan,
  dbDeleteFan,
  dbGetSongs,
  dbGetConcerts,
  dbUpsertMusicianWaitlist,
  dbGetMusiciansWaitlist,
  invalidateBandStateCache,
  cleanBandId,
} from '../db.js';
import { getAiClient, generateContentWithFallback } from '../ai.js';
import { safeParseJson } from '../utils.js';
import {
  recopilarTextosTraducibles,
  hayAlgoQueTraducir,
  calcularHashFuente,
  CLAVES_DATOS_TRADUCIBLES,
  IDIOMA_ORIGEN,
} from '../../src/utils/epkTraducciones.js';
import { EPK_LANGUAGES } from '../../src/i18n/epkTranslations.js';
import {
  getTargetBandId,
  puedeEscribirEnBanda,
  bandaSolicitada,
} from '../utils/bandAccess.js';
import { checkRecordLimit } from '../utils/planLimits.js';
import { buildFanIncentive } from '../utils/fanIncentive.js';
import { decodeBandId } from '../utils/bandHash.js';

const router = express.Router();

// Get Autonomy Config
// requireAuth: sin sesión no había usuario del que sacar la banda, así que esta ruta abierta
// devolvía a cualquiera la configuración de autonomía de la banda por defecto.
router.get('/autonomy', requireAuth, async (req, res) => {
  const userBandId = getTargetBandId(req);

  try {
    const dbAutonomy = await dbGetAutonomyConfig(userBandId);
    if (dbAutonomy) {
      return res.json(dbAutonomy);
    }
  } catch (e) {
    // Keep local state fallback
  }

  const state = loadState();
  const autonomy = getAutonomyConfigForBand(state, userBandId);
  res.json(autonomy);
});

// Update Autonomy Config
router.post('/autonomy', requireAuth, async (req, res) => {
  try {
    const updatedConfig = req.body;
    const userBandId = getTargetBandId(req);

    await dbUpsertAutonomyConfig(userBandId, updatedConfig);

    const state = loadState();
    const cleanUserBandId = userBandId.replace(/^(band|reg)-/, '');
    const current = getAutonomyConfigForBand(state, userBandId);
    const newAutonomyConfig = { ...current, ...updatedConfig };
    const possibleKeys = [
      userBandId,
      cleanUserBandId,
      `band-${cleanUserBandId}`,
      `reg-${cleanUserBandId}`,
    ];
    if (!state.autonomyConfigsByBand) state.autonomyConfigsByBand = {};
    possibleKeys.forEach((k) => {
      state.autonomyConfigsByBand[k] = newAutonomyConfig;
    });
    saveState(state);

    res.json({ success: true, autonomyConfig: newAutonomyConfig });
  } catch (err: any) {
    console.error('Error updating autonomy config:', err);
    res.status(500).json({
      error:
        err?.message || 'Error al actualizar la configuración de autonomía.',
    });
  }
});

router.put('/autonomy', requireAuth, async (req, res) => {
  try {
    const updatedConfig = req.body;
    const userBandId = getTargetBandId(req);

    await dbUpsertAutonomyConfig(userBandId, updatedConfig);

    const state = loadState();
    const cleanUserBandId = userBandId.replace(/^(band|reg)-/, '');
    const current = getAutonomyConfigForBand(state, userBandId);
    const newAutonomyConfig = { ...current, ...updatedConfig };
    const possibleKeys = [
      userBandId,
      cleanUserBandId,
      `band-${cleanUserBandId}`,
      `reg-${cleanUserBandId}`,
    ];
    if (!state.autonomyConfigsByBand) state.autonomyConfigsByBand = {};
    possibleKeys.forEach((k) => {
      state.autonomyConfigsByBand[k] = newAutonomyConfig;
    });
    saveState(state);

    res.json({ success: true, autonomyConfig: newAutonomyConfig });
  } catch (err: any) {
    console.error('Error updating autonomy config:', err);
    res.status(500).json({
      error:
        err?.message || 'Error al actualizar la configuración de autonomía.',
    });
  }
});

// Get EPK Config. Lleva requireAuth: sin él, cualquiera podía leer el EPK de cualquier banda
// pasando ?bandId= — con su email y teléfono de booking, su firma y su configuración. El EPK
// que sí debe ser público se sirve por GET /public/epk, más abajo, y va recortado.
router.get('/epk', requireAuth, async (req, res) => {
  const user = (req as any).user;
  const userBandId = getTargetBandId(req);
  const userBandName = user?.bandName || user?.name || 'Tu Banda';

  try {
    const dbEpk = await dbGetEpkConfig(userBandId);
    if (dbEpk) {
      return res.json(dbEpk);
    }
  } catch (e) {
    // Fallback
  }

  const state = loadState();
  const epk = getEpkConfigForBand(state, userBandId, userBandName, user?.email);
  res.json(epk);
});

// Update EPK Config (Authenticated)
router.put('/epk', requireAuth, async (req, res) => {
  try {
    const updatedConfig: Partial<EPKConfig> = req.body;
    const user = (req as any).user;
    // Antes se cogía req.body.bandId a pelo y se aprobaba con `|| role === 'leader'`, que en
    // esta app son todos los usuarios reales: cualquiera podía escribir el EPK de otra banda.
    // En una escritura no vale con degradar a la banda propia: si la petición pide una banda
    // concreta y no es tuya, hay que rechazarla. Degradar en silencio significaría guardar el
    // contenido destinado a otra banda dentro de la tuya.
    const solicitada = bandaSolicitada(req);
    if (solicitada && !puedeEscribirEnBanda(req, solicitada)) {
      return res.status(403).json({ error: 'No tienes acceso a esta banda.' });
    }
    const userBandId = getTargetBandId(req);

    await dbUpsertEpkConfig(userBandId, updatedConfig);

    const state = loadState();
    const cleanUserBandId = userBandId.replace(/^(band|reg)-/, '');
    const userBandName = user?.bandName || user?.name || 'Tu Banda';
    const current = getEpkConfigForBand(
      state,
      userBandId,
      userBandName,
      user?.email
    );
    const newEpkConfig = { ...current, ...updatedConfig };

    const possibleKeys = [
      userBandId,
      cleanUserBandId,
      `band-${cleanUserBandId}`,
      `reg-${cleanUserBandId}`,
    ];
    possibleKeys.forEach((k) => {
      state.epkConfigsByBand[k] = newEpkConfig;
    });

    if (
      cleanUserBandId === 'bakandeya' ||
      (user?.band_id && cleanBandId(user.band_id) === cleanUserBandId)
    ) {
      state.epkConfig = newEpkConfig;
    }

    if (newEpkConfig.logoUrl && state.registeredBands) {
      state.registeredBands.forEach((b: any) => {
        const bClean = (b.band_id || b.id || '').replace(/^(band|reg)-/, '');
        if (
          bClean === cleanUserBandId ||
          b.band_id === userBandId ||
          b.id === userBandId
        ) {
          b.logo_url = newEpkConfig.logoUrl;
          b.imagen_url = newEpkConfig.logoUrl;
        }
      });
    }

    saveState(state);
    invalidateBandStateCache(userBandId);
    invalidateBandStateCache(cleanUserBandId);
    invalidateBandStateCache(`band-${cleanUserBandId}`);

    res.json({ success: true, epkConfig: newEpkConfig });
  } catch (err: any) {
    console.error('Error updating EPK config:', err);
    res.status(500).json({
      error: err?.message || 'Error al actualizar la configuración del EPK.',
    });
  }
});

// Traduce el contenido del EPK a otro idioma con IA (borrador para que lo repase la banda).
//
// Coste: UNA llamada al modelo por pulsación, con todos los textos en un solo prompt. Nunca se
// traduce al abrir la página pública — eso sería gasto ilimitado y latencia en una página que
// abre gente de fuera. Lo que sirve /public/epk es siempre texto ya guardado.
router.post('/epk/traducir', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    // Mismo control de acceso que PUT /epk: traducir escribe en el EPK de una banda (y además
    // gasta tokens, así que no puede dispararlo alguien sobre una banda que no es suya).
    const solicitada = bandaSolicitada(req);
    if (solicitada && !puedeEscribirEnBanda(req, solicitada)) {
      return res.status(403).json({ error: 'No tienes acceso a esta banda.' });
    }
    const bandId = getTargetBandId(req);
    const idioma = String(req.body?.idioma || req.body?.lang || '').trim();
    const forzar = Boolean(req.body?.forzar ?? req.body?.force);

    const idiomasDestino = EPK_LANGUAGES.filter(
      (l) => l.code !== IDIOMA_ORIGEN
    ).map((l) => l.code);
    if (!idiomasDestino.includes(idioma as any)) {
      return res.status(400).json({
        error: `Idioma no soportado: "${idioma}". Disponibles: ${idiomasDestino.join(', ')}.`,
      });
    }
    const nombreIdioma =
      EPK_LANGUAGES.find((l) => l.code === idioma)?.label || idioma;

    let config: any = null;
    try {
      config = await dbGetEpkConfig(bandId);
    } catch (e) {
      // Sin Supabase se cae al estado local, igual que el resto de rutas del EPK.
    }
    if (!config) {
      const state = loadState();
      config = getEpkConfigForBand(
        state,
        bandId,
        user?.bandName || user?.name || 'Tu Banda',
        user?.email
      );
    }

    const textos = recopilarTextosTraducibles(config);
    if (!hayAlgoQueTraducir(textos)) {
      return res.status(400).json({
        error:
          'No hay contenido que traducir todavía: rellena al menos la biografía del EPK.',
      });
    }

    // Guardarraíl de coste: si el texto original no ha cambiado desde la última traducción, no
    // se vuelve a llamar al modelo. Evita gastar por un doble clic o por volver a la pestaña.
    const hashActual = calcularHashFuente(config);
    const traduccionPrevia = config?.traducciones?.[idioma];
    if (!forzar && traduccionPrevia?._fuenteHash === hashActual) {
      return res.json({
        success: true,
        idioma,
        traduccion: traduccionPrevia,
        yaEstabaAlDia: true,
        mensaje:
          'La traducción ya está al día con el texto actual; no se ha llamado a la IA.',
      });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error:
          'No hay ninguna clave de IA configurada en el servidor (GEMINI_API_KEY).',
      });
    }

    const systemPrompt = [
      `Eres un traductor profesional especializado en material de promoción musical y dossieres de contratación (EPK).`,
      `Traduce del español a ${nombreIdioma} el contenido que te paso.`,
      `REGLAS INNEGOCIABLES:`,
      `1. NO traduzcas nombres propios: nombre de la banda, nombres de personas, nombres de salas o festivales, títulos de canciones, ni términos inventados por la banda (por ejemplo "Electrobasureo").`,
      `2. NO inventes datos, fechas, cifras, premios ni méritos que no estén en el original. Si algo no está, no está.`,
      `3. Mantén el registro y la longitud aproximada de cada texto. Es un documento de contratación: profesional, directo, sin florituras de marketing.`,
      `4. Los términos técnicos del sector (rider, backline, headliner, setlist, PA, monitores) usa la forma habitual en ${nombreIdioma}.`,
      `5. Devuelve EXCLUSIVAMENTE un objeto JSON con la estructura pedida. Nada de texto antes o después, ni explicaciones.`,
      `6. Si un campo del original viene vacío, devuélvelo como cadena vacía "".`,
    ].join('\n');

    const prompt = [
      `Traduce a ${nombreIdioma} los campos de este JSON y devuelve un JSON con EXACTAMENTE la misma forma y las mismas claves e ids.`,
      ``,
      `Los objetos de "miembros" y "videos" se identifican por su "id": conserva cada id tal cual, no los reordenes ni los inventes.`,
      `En "datosContratacion", "duracionDirecto" suele ser solo un número (minutos): si lo es, devuélvelo igual sin añadir unidades.`,
      ``,
      `CONTENIDO ORIGINAL (español):`,
      JSON.stringify(textos, null, 2),
    ].join('\n');

    const respuesta = await generateContentWithFallback(ai, {
      contents: `${systemPrompt}\n\n---\n${prompt}`,
      config: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    const textoRespuesta =
      respuesta?.text ||
      respuesta?.candidates?.[0]?.content?.parts?.[0]?.text ||
      '';
    const crudo = safeParseJson(textoRespuesta);

    // GUARDARRAÍL CRÍTICO: la cadena de fallbacks de ai.ts termina en un motor local que
    // devuelve una PLANTILLA DE PITCH EN ESPAÑOL disfrazada de respuesta del modelo. Si eso se
    // guardara como "traducción al inglés" sería un desastre silencioso. Por eso no se
    // persiste nada que no parsee como el objeto esperado.
    if (!crudo || typeof crudo !== 'object' || Array.isArray(crudo)) {
      console.warn(
        '[EPK traducir] La IA no devolvió un JSON utilizable. Primeros 200 caracteres:',
        String(textoRespuesta).slice(0, 200)
      );
      return res.status(502).json({
        error:
          'La IA no devolvió una traducción válida. No se ha guardado nada; vuelve a intentarlo.',
      });
    }

    const texto = (v: any): string => (typeof v === 'string' ? v : '');

    const miembrosTraducidos: Record<string, { rol?: string; bio?: string }> =
      {};
    const listaMiembros = Array.isArray(crudo.miembros) ? crudo.miembros : [];
    for (const m of listaMiembros) {
      // Solo se aceptan ids que existían en el original: si el modelo se inventa uno, se ignora.
      if (m?.id && textos.miembros.some((o) => o.id === m.id)) {
        miembrosTraducidos[m.id] = { rol: texto(m.rol), bio: texto(m.bio) };
      }
    }

    const videosTraducidos: Record<string, { titulo?: string }> = {};
    const listaVideos = Array.isArray(crudo.videos) ? crudo.videos : [];
    for (const v of listaVideos) {
      if (v?.id && textos.videos.some((o) => o.id === v.id)) {
        videosTraducidos[v.id] = { titulo: texto(v.titulo) };
      }
    }

    const datosTraducidos: Record<string, string> = {};
    for (const clave of CLAVES_DATOS_TRADUCIBLES) {
      datosTraducidos[clave] = texto(crudo.datosContratacion?.[clave]);
    }

    const cifrasTraducidas: Record<string, { etiqueta?: string }> = {};
    const listaCifras = Array.isArray(crudo.cifras) ? crudo.cifras : [];
    for (const c of listaCifras) {
      if (c?.id && textos.cifras.some((o) => o.id === c.id)) {
        cifrasTraducidas[c.id] = { etiqueta: texto(c.etiqueta) };
      }
    }

    const resenasTraducidas: Record<string, { cita?: string; tipo?: string }> =
      {};
    const listaResenas = Array.isArray(crudo.resenas) ? crudo.resenas : [];
    for (const r of listaResenas) {
      if (r?.id && textos.resenas.some((o) => o.id === r.id)) {
        resenasTraducidas[r.id] = { cita: texto(r.cita), tipo: texto(r.tipo) };
      }
    }

    const traduccion = {
      biografia: texto(crudo.biografia),
      textoPie: texto(crudo.textoPie),
      riderTecnico: texto(crudo.riderTecnico),
      miembros: miembrosTraducidos,
      videos: videosTraducidos,
      datosContratacion: datosTraducidos,
      cifras: cifrasTraducidas,
      prensaSubtitulo: texto(crudo.prensaSubtitulo),
      resenas: resenasTraducidas,
      _fuenteHash: hashActual,
      _traducidoEn: new Date().toISOString(),
      _revisadoAMano: false,
    };

    // Segundo filtro: si de todo el contenido no ha salido ni una línea, algo fue mal y no
    // merece la pena pisar una traducción anterior que sí servía.
    const hayContenido = Boolean(
      traduccion.biografia.trim() ||
      traduccion.textoPie.trim() ||
      traduccion.riderTecnico.trim() ||
      Object.keys(miembrosTraducidos).length ||
      Object.keys(videosTraducidos).length
    );
    if (!hayContenido) {
      return res.status(502).json({
        error:
          'La IA devolvió una traducción vacía. No se ha guardado nada; vuelve a intentarlo.',
      });
    }

    const traduccionesActualizadas = {
      ...(config?.traducciones || {}),
      [idioma]: traduccion,
    };
    await dbUpsertEpkConfig(bandId, { traducciones: traduccionesActualizadas });

    // Espejo en el estado local, igual que hace PUT /epk.
    const state = loadState();
    const cleanBandId = bandId.replace(/^(band|reg)-/, '');
    for (const k of [
      bandId,
      cleanBandId,
      `band-${cleanBandId}`,
      `reg-${cleanBandId}`,
    ]) {
      if (state.epkConfigsByBand?.[k]) {
        state.epkConfigsByBand[k] = {
          ...state.epkConfigsByBand[k],
          traducciones: traduccionesActualizadas,
        };
      }
    }
    if (cleanBandId === 'bakandeya' && state.epkConfig) {
      state.epkConfig = {
        ...state.epkConfig,
        traducciones: traduccionesActualizadas,
      };
    }
    saveState(state);

    console.log(`[EPK traducir] ${bandId} -> ${idioma} (hash ${hashActual})`);
    res.json({ success: true, idioma, traduccion });
  } catch (err: any) {
    console.error('Error traduciendo el EPK:', err);
    res
      .status(500)
      .json({ error: err?.message || 'Error al traducir el EPK.' });
  }
});

// Public EPK Data endpoint (No Auth required for public sharing)
router.get('/public/epk', async (req, res) => {
  try {
    const rawParam =
      (req.query.b as string) ||
      (req.query.t as string) ||
      (req.query.token as string) ||
      (req.query.band_id as string) ||
      (req.query.band as string) ||
      (req.headers['x-band-id'] as string);
    if (!rawParam || !rawParam.trim()) {
      return res
        .status(400)
        .json({ error: 'Falta el identificador o token de la banda.' });
    }
    const rawBandId = decodeBandId(rawParam);
    const cleanBandId = rawBandId.toLowerCase().replace(/^(band|reg)-/, '');
    const reqBandId =
      cleanBandId === 'bakandeya' ? BAKANDEYA_BAND_ID : `band-${cleanBandId}`;

    const state = loadState();
    let epkConfig: any = null;
    try {
      epkConfig = await dbGetEpkConfig(reqBandId);
    } catch (e) {
      console.warn('Could not fetch EPK from Supabase:', e);
    }

    if (!epkConfig) {
      epkConfig = getEpkConfigForBand(state, reqBandId);
    }

    let regBand: any = null;
    try {
      const { getSupabase } = await import('../db.js');
      const sb = getSupabase();
      const candidateIds = [
        reqBandId,
        `reg-${cleanBandId}`,
        cleanBandId,
        `band-${cleanBandId}`,
      ];
      const { data } = await sb
        .from('registered_bands')
        .select('*')
        .in('band_id', candidateIds)
        .limit(1)
        .maybeSingle();
      regBand = data;
    } catch (e) {}

    if (!regBand) {
      regBand = (state.registeredBands || []).find((b: any) => {
        const bId = (b.band_id || b.id || '')
          .replace(/^(band|reg)-/, '')
          .toLowerCase();
        return bId === cleanBandId;
      });
    }

    let bandName =
      regBand?.nombre_banda &&
      regBand.nombre_banda.trim().toLowerCase() !== 'banda'
        ? regBand.nombre_banda.trim()
        : '';
    if (
      !bandName &&
      epkConfig?.contactoBooking?.nombre &&
      !epkConfig.contactoBooking.nombre.toLowerCase().includes('bakandeya') &&
      epkConfig.contactoBooking.nombre.trim().toLowerCase() !== 'banda'
    ) {
      bandName = epkConfig.contactoBooking.nombre.trim();
    }
    if (!bandName) {
      bandName =
        cleanBandId === 'bakandeya'
          ? 'Bakandeya'
          : cleanBandId
              .split(/[-_]+/)
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ');
    }

    // La fuente de verdad de temas y conciertos es Supabase, igual que para el epkConfig de
    // arriba. Antes esto solo miraba state.songs/state.concerts (el JSON local), y como el
    // contenedor de Railway es efímero, el EPK público salía SIN canciones aunque la banda las
    // tuviera cargadas en la app. El estado local queda como respaldo si Supabase falla.
    let songs: any[] = [];
    try {
      songs = await dbGetSongs(reqBandId);
    } catch (e) {
      console.warn(
        'EPK público: no se pudieron leer los temas de Supabase, usando estado local:',
        e
      );
    }
    if (!songs || songs.length === 0) {
      songs = (state.songs || []).filter((s: any) => {
        const sBand = (s.band_id || '')
          .replace(/^(band|reg)-/, '')
          .toLowerCase();
        return (
          sBand === cleanBandId || (!s.band_id && cleanBandId === 'bakandeya')
        );
      });
    }

    let concerts: any[] = [];
    try {
      concerts = await dbGetConcerts(reqBandId);
    } catch (e) {
      console.warn(
        'EPK público: no se pudieron leer los conciertos de Supabase, usando estado local:',
        e
      );
    }
    if (!concerts || concerts.length === 0) {
      concerts = (state.concerts || []).filter((c: any) => {
        const cBand = (c.band_id || '')
          .replace(/^(band|reg)-/, '')
          .toLowerCase();
        return cBand === cleanBandId;
      });
    }

    // Filter highlighted songs - solo incluir temas si el usuario los ha seleccionado expresamente
    const highlightedSongs =
      Array.isArray(epkConfig?.temasDestacadosIds) &&
      epkConfig.temasDestacadosIds.length > 0
        ? songs.filter((s: any) => epkConfig.temasDestacadosIds.includes(s.id))
        : [];

    // Upcoming concerts
    const today = new Date().toISOString().split('T')[0];
    const upcomingConcerts = concerts.filter((c: any) => c.fecha >= today);

    let logoUrl =
      epkConfig?.logoUrl || regBand?.logo_url || regBand?.imagen_url || null;

    // Ensure social links are present
    let enlacesRedes = epkConfig?.enlacesRedes || {};
    if (regBand) {
      if (regBand.instagram && !enlacesRedes.instagram)
        enlacesRedes.instagram = regBand.instagram.startsWith('http')
          ? regBand.instagram
          : `https://instagram.com/${regBand.instagram.replace(/^@/, '')}`;
      if (
        regBand.spotify_youtube &&
        !enlacesRedes.spotify &&
        !enlacesRedes.youtube
      ) {
        if (regBand.spotify_youtube.includes('spotify'))
          enlacesRedes.spotify = regBand.spotify_youtube;
        else if (regBand.spotify_youtube.includes('youtube'))
          enlacesRedes.youtube = regBand.spotify_youtube;
      }
    }

    // Resolver el audioPreview del EPK si la banda ha elegido un tema o subido un audio
    let resolvedAudioPreview = epkConfig?.audioPreview
      ? { ...epkConfig.audioPreview }
      : null;
    if (
      resolvedAudioPreview ||
      epkConfig?.temasDestacadosIds?.length ||
      songs.length > 0
    ) {
      const selectedSongId = resolvedAudioPreview?.cancionId;
      const targetSong = selectedSongId
        ? songs.find((s: any) => s.id === selectedSongId)
        : highlightedSongs[0] ||
          songs.find(
            (s: any) =>
              s.audioPrincipalUrl || (s.audioIdeas && s.audioIdeas[0]?.audioUrl)
          );

      const resolvedAudioUrl =
        (resolvedAudioPreview?.audioUrl &&
          String(resolvedAudioPreview.audioUrl).trim()) ||
        targetSong?.audioPrincipalUrl ||
        (targetSong?.audioIdeas && targetSong.audioIdeas[0]?.audioUrl) ||
        '';

      const resolvedTitulo =
        (resolvedAudioPreview?.tituloTema &&
          String(resolvedAudioPreview.tituloTema).trim()) ||
        targetSong?.titulo ||
        `${bandName} · Directo Preview`;

      if (resolvedAudioPreview || resolvedAudioUrl || targetSong) {
        resolvedAudioPreview = {
          habilitado: resolvedAudioPreview?.habilitado ?? true,
          cancionId: selectedSongId || targetSong?.id || undefined,
          tituloTema: resolvedTitulo,
          subtitulo:
            resolvedAudioPreview?.subtitulo?.trim() ||
            'Dale al play para escuchar cómo sonamos',
          audioUrl: resolvedAudioUrl,
        };
      }
    }

    const cleanEpkConfig = {
      ...epkConfig,
      logoUrl,
      enlacesRedes,
      audioPreview: resolvedAudioPreview || epkConfig?.audioPreview,
      contactoBooking: {
        ...(epkConfig?.contactoBooking || {}),
        nombre: epkConfig?.contactoBooking?.nombre || bandName,
        email: epkConfig?.contactoBooking?.email || regBand?.email || '',
        telefono:
          epkConfig?.contactoBooking?.telefono || regBand?.telefono || '',
      },
    };

    res.json({
      bandId: reqBandId,
      bandName,
      logoUrl,
      epkConfig: cleanEpkConfig,
      highlightedSongs,
      upcomingConcerts,
      totalConcertsCount: concerts.length,
    });
  } catch (err: any) {
    console.error('Error in public EPK endpoint:', err);
    res
      .status(500)
      .json({ error: 'Error al cargar la información pública del EPK.' });
  }
});

// Get Fans List (Authenticated)
router.get('/fans', requireAuth, async (req, res) => {
  const userBandId = (req as any).user?.band_id;
  try {
    const fans = await dbGetFans(userBandId);
    const state = loadState();
    state.fans = fans as any;
    saveState(state);
    res.json(fans);
  } catch (err) {
    const state = loadState();
    res.json(
      (state.fans || []).filter(
        (f: any) => f.band_id === userBandId || f.bandId === userBandId
      )
    );
  }
});

// Add Fan manually (Authenticated)
router.post('/fans', requireAuth, async (req, res) => {
  try {
    const newFan: Fan = req.body;
    if (!newFan.nombre || !newFan.email) {
      return res.status(400).json({ error: 'Nombre y Email son obligatorios' });
    }
    const userBandId = (req as any).user?.band_id;
    if (!(newFan as any).band_id) {
      (newFan as any).band_id = userBandId;
    }

    // El límite de fans por plan solo se comprobaba en el cliente (App.tsx,
    // handleAddFanWithLimitCheck): quien llamase a esta ruta directamente con su token de sesión
    // podía dar de alta fans sin límite sin importar el plan contratado por su banda.
    const userPlan = (req as any).user?.plan || 'ensayo';
    const existingFans = await dbGetFans(userBandId);
    const limitCheck = checkRecordLimit(userPlan, 'fans', existingFans.length);
    if (!limitCheck.allowed) {
      return res
        .status(403)
        .json({ error: limitCheck.message, codigo: 'limite_plan_alcanzado' });
    }

    const saved = await dbUpsertFan(newFan, userBandId);

    const state = loadState();
    if (!state.fans) state.fans = [];
    state.fans.unshift(saved as any);
    saveState(state);

    res.json({ success: true, fan: saved });
  } catch (err: any) {
    console.error('Error adding fan:', err);
    res.status(500).json({ error: err?.message || 'Error al registrar fan.' });
  }
});

// Update Fan (Authenticated)
router.patch('/fans/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userBandId = (req as any).user?.band_id;
    const updates = req.body;

    const state = loadState();
    if (!state.fans) state.fans = [];
    const index = state.fans.findIndex((f: Fan) => f.id === id);
    if (index !== -1) {
      // state.fans es un array global compartido por todas las bandas: sin esta comprobación,
      // cualquier usuario autenticado podía modificar el fan (nombre, email, consentimiento RGPD)
      // de otra banda adivinando su id.
      const ownerBandId =
        (state.fans[index] as any).band_id || (state.fans[index] as any).bandId;
      if (!puedeEscribirEnBanda(req, ownerBandId || userBandId)) {
        return res
          .status(403)
          .json({ error: 'No puedes modificar un fan de otra banda.' });
      }
      state.fans[index] = { ...state.fans[index], ...updates };
      await dbUpsertFan(state.fans[index], userBandId);
      saveState(state);
      return res.json({ success: true, fan: state.fans[index] });
    }
    res.status(404).json({ error: 'Fan no encontrado' });
  } catch (err: any) {
    console.error('Error updating fan:', err);
    res.status(500).json({ error: err?.message || 'Error al actualizar fan.' });
  }
});

// Delete Fan (Authenticated)
router.delete('/fans/:id', requireAuth, async (req, res) => {
  const userBandId = (req as any).user?.band_id;
  const { id } = req.params;
  await dbDeleteFan(id, userBandId);

  const state = loadState();
  if (state.fans) {
    state.fans = state.fans.filter((f: Fan) => f.id !== id);
    saveState(state);
  }
  res.json({ success: true });
});

// Public Fan Capture Endpoint (No Auth required - QR Code Submission)
router.post('/public/fans', async (req, res) => {
  try {
    const {
      nombre,
      email,
      ciudad,
      comoConocio,
      conciertoOrigenId,
      conciertoOrigenNombre,
      consentimientoRGPD,
      band_id,
      mensaje,
      cancionFavorita,
      instagram,
    } = req.body;
    const targetBandId =
      (req.query.band_id as string) || (req.query.band as string) || band_id;

    if (!targetBandId || !String(targetBandId).trim()) {
      return res
        .status(400)
        .json({ error: 'Falta el identificador de la banda (band_id).' });
    }

    if (!nombre || !email) {
      return res.status(400).json({
        error: 'Por favor, introduce tu nombre y correo electrónico.',
      });
    }

    if (!consentimientoRGPD) {
      return res.status(400).json({
        error:
          'Es obligatorio aceptar la casilla de consentimiento de privacidad RGPD para registrarte.',
      });
    }

    const defaultLevel =
      conciertoOrigenId ||
      (comoConocio && comoConocio.toLowerCase().includes('concierto'))
        ? 'superfan'
        : 'fiel';

    const newFan: Fan & { band_id?: string } = {
      id: `fan-${Date.now()}`,
      band_id: targetBandId,
      nombre: String(nombre).trim(),
      email: String(email).toLowerCase().trim(),
      ciudad: ciudad ? String(ciudad).trim() : undefined,
      comoConocio: comoConocio ? String(comoConocio).trim() : undefined,
      conciertoOrigenId: conciertoOrigenId
        ? String(conciertoOrigenId).trim()
        : undefined,
      conciertoOrigenNombre: conciertoOrigenNombre
        ? String(conciertoOrigenNombre).trim()
        : undefined,
      fechaCaptura: new Date().toISOString().split('T')[0],
      consentimientoRGPD: true,
      mensaje: mensaje ? String(mensaje).trim() : undefined,
      cancionFavorita: cancionFavorita
        ? String(cancionFavorita).trim()
        : undefined,
      instagram: instagram
        ? String(instagram).trim().replace(/^@/, '')
        : undefined,
      nivelFan: defaultLevel,
      reacciones: { likes: 0, fire: 0, applause: 0, guitars: 0 },
    };

    const saved = await dbUpsertFan(newFan, targetBandId);

    const state = loadState();
    if (!state.fans) state.fans = [];
    state.fans.unshift(saved as any);
    saveState(state);

    // Supabase es la fuente de verdad del incentivo (ver AGENTS.md); el `state` en memoria de
    // esta ruta puede llevar cacheado, para la banda por defecto, el incentivo de ejemplo
    // (enlace de descarga y cupón reales) con el que arranca el proyecto en local, aunque la
    // banda ya lo haya vaciado en Supabase desde el apartado QR. Se lee primero de Supabase y
    // solo se cae al estado en memoria si esa consulta falla.
    let epkConf: any = null;
    try {
      epkConf = await dbGetEpkConfig(targetBandId);
    } catch (e) {
      // Fallback abajo
    }
    if (!epkConf) {
      epkConf = getEpkConfigForBand(state, targetBandId);
    }
    const bandName =
      epkConf?.contactoBooking?.nombre || epkConf?.nombre_banda || 'la banda';

    // El incentivo (descarga exclusiva / cupón de merchan) es opcional y lo configura cada banda
    // en el apartado QR de Fans. Antes, si la banda no lo había rellenado, se devolvía un cupón
    // inventado ("FAN-VIP-10") que la banda no podía canjear: la pantalla de éxito prometía un
    // descuento inexistente. Ahora solo se devuelve lo que la banda haya rellenado de verdad.
    const incentivo = buildFanIncentive(epkConf?.incentivoFans);

    res.json({
      success: true,
      message: `¡Registro completado con éxito! Bienvenido/a a la familia de ${bandName}.`,
      incentivo,
    });
  } catch (err: any) {
    console.error('Error in public fan registration:', err);
    res.status(500).json({ error: 'Error al procesar el registro de fan.' });
  }
});

// Click Tracking Endpoint for Fan Landing and EPK buttons (Socials, Revolut, PayPal, Bizum, Dossier, etc.)
router.post('/public/track-click', async (req, res) => {
  try {
    const {
      band_id,
      platform,
      button_type,
      concert_id,
      concert_date,
      concertId,
      concertDate,
    } = req.body || {};
    const targetBandId = String(
      band_id || req.query.band_id || req.query.band || ''
    ).toLowerCase();

    if (!targetBandId || !targetBandId.trim()) {
      return res.json({ success: false, message: 'Falta band_id' });
    }

    const cleanButton = String(button_type || platform || 'unknown')
      .toLowerCase()
      .trim();
    const finalConcertId = concert_id || concertId || null;
    const finalConcertDate = concert_date || concertDate || null;
    const userAgent = (req.headers['user-agent'] || '').slice(0, 200);
    const referer = (req.headers['referer'] || '').slice(0, 200);

    // 1. Persistir en Supabase
    try {
      const { getSupabase } = await import('../db.js');
      const sb = getSupabase();
      await sb.from('fan_link_clicks').insert({
        band_id: targetBandId,
        button_type: cleanButton,
        concert_id: finalConcertId,
        concert_date: finalConcertDate,
        user_agent: userAgent,
        referer: referer,
      });
    } catch (sbErr: any) {
      // Non-blocking: cae a estado en memoria
    }

    // 2. Persistir en estado local en memoria
    const state = loadState();
    if (!state.clickMetricsByBand) state.clickMetricsByBand = {};
    if (!state.clickMetricsByBand[targetBandId])
      state.clickMetricsByBand[targetBandId] = {};

    const currentCount =
      state.clickMetricsByBand[targetBandId][cleanButton] || 0;
    state.clickMetricsByBand[targetBandId][cleanButton] = currentCount + 1;
    state.clickMetricsByBand[targetBandId][`${cleanButton}_last_at`] =
      new Date().toISOString();

    if (finalConcertId) {
      const concertKey = `concert_${finalConcertId}_${cleanButton}`;
      state.clickMetricsByBand[targetBandId][concertKey] =
        (state.clickMetricsByBand[targetBandId][concertKey] || 0) + 1;
    }

    saveState(state);

    res.json({
      success: true,
      count: currentCount + 1,
      platform: cleanButton,
      concert_id: finalConcertId,
    });
  } catch (err: any) {
    console.error('Error tracking click:', err);
    res.status(200).json({ success: false }); // Non-blocking
  }
});

// Click Stats Endpoint con filtros de concierto
router.get('/epk/clicks', requireAuth, async (req, res) => {
  try {
    const targetBandId = getTargetBandId(req).toLowerCase();
    const concertId =
      (req.query.concert_id as string) || (req.query.concertId as string);

    let supabaseStats: Record<string, number> = {};
    let concertBreakdown: Array<{
      concert_id: string;
      concert_date: string;
      button_type: string;
      count: number;
    }> = [];

    try {
      const { getSupabase } = await import('../db.js');
      const sb = getSupabase();

      let query = sb
        .from('fan_link_clicks')
        .select('button_type, concert_id, concert_date')
        .eq('band_id', targetBandId);
      if (concertId) {
        query = query.eq('concert_id', concertId);
      }
      const { data, error } = await query;

      if (!error && Array.isArray(data)) {
        const counts: Record<string, number> = {};
        data.forEach((row) => {
          const btn = row.button_type || 'unknown';
          counts[btn] = (counts[btn] || 0) + 1;
        });
        supabaseStats = counts;
      }
    } catch (e) {}

    const state = loadState();
    const localClicks = state.clickMetricsByBand?.[targetBandId] || {};
    const mergedClicks = { ...localClicks, ...supabaseStats };

    res.json({ success: true, clicks: mergedClicks, band_id: targetBandId });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al obtener estadísticas de clicks.' });
  }
});

// Public Musician Waitlist Signup Endpoint (No Auth required)
router.post('/public/musicians-waitlist', async (req, res) => {
  try {
    const {
      nombreBanda,
      nombreContacto,
      email,
      instagram,
      telefono,
      ciudad,
      genero,
      enlaceMusica,
      interesPrincipal,
      notas,
      idioma,
      bandaOrigen,
      conciertoOrigen,
    } = req.body || {};

    if (!nombreBanda || !email) {
      return res.status(400).json({
        error:
          'Por favor, indica al menos el nombre de la banda y el correo electrónico.',
      });
    }

    const waitlistItem = {
      id: `musician-${Date.now()}`,
      nombreBanda: String(nombreBanda).trim(),
      nombreContacto: nombreContacto
        ? String(nombreContacto).trim()
        : undefined,
      email: String(email).toLowerCase().trim(),
      instagram: instagram ? String(instagram).trim() : undefined,
      telefono: telefono ? String(telefono).trim() : undefined,
      ciudad: ciudad ? String(ciudad).trim() : undefined,
      genero: genero ? String(genero).trim() : undefined,
      enlaceMusica: enlaceMusica ? String(enlaceMusica).trim() : undefined,
      interesPrincipal: interesPrincipal
        ? String(interesPrincipal).trim()
        : undefined,
      notas: notas ? String(notas).trim() : undefined,
      idioma: idioma || 'es',
      bandaOrigen: bandaOrigen || undefined,
      conciertoOrigen: conciertoOrigen || undefined,
      created_at: new Date().toISOString(),
    };

    const saved = await dbUpsertMusicianWaitlist(waitlistItem);

    const state = loadState();
    if (!state.musiciansWaitlist) state.musiciansWaitlist = [];
    state.musiciansWaitlist.unshift(saved);
    saveState(state);

    res.json({
      success: true,
      message:
        '¡Solicitud recibida con éxito! Te contactaremos tan pronto abramos nuevas plazas.',
      data: saved,
    });
  } catch (err: any) {
    console.error('Error saving musician waitlist submission:', err);
    res.status(500).json({ error: 'Error al procesar tu solicitud.' });
  }
});

// Get Musician Waitlist submissions (Authenticated)
router.get('/musicians-waitlist', requireAuth, async (req, res) => {
  try {
    const list = await dbGetMusiciansWaitlist();
    const state = loadState();
    const combined = Array.from(
      new Map(
        [...(state.musiciansWaitlist || []), ...list].map((m) => [
          m.id || m.email,
          m,
        ])
      ).values()
    );
    res.json({ success: true, count: combined.length, list: combined });
  } catch (err: any) {
    console.error('Error fetching musicians waitlist:', err);
    res
      .status(500)
      .json({ error: 'Error al obtener la lista de espera de músicos.' });
  }
});

export default router;
