import express from "express";
import { loadState, saveState, requireAuth, getEpkConfigForBand, getAutonomyConfigForBand, BAKANDEYA_BAND_ID } from "../state.js";
import { EPKConfig, Fan } from "../../src/types.js";
import {
  dbGetAutonomyConfig,
  dbUpsertAutonomyConfig,
  dbGetEpkConfig,
  dbUpsertEpkConfig,
  dbGetFans,
  dbUpsertFan,
  dbDeleteFan,
  dbGetSongs,
  dbGetConcerts
} from "../db.js";
import { getAiClient, generateContentWithFallback } from "../ai.js";
import { safeParseJson } from "../utils.js";
import {
  recopilarTextosTraducibles,
  hayAlgoQueTraducir,
  calcularHashFuente,
  CLAVES_DATOS_TRADUCIBLES,
  IDIOMA_ORIGEN
} from "../../src/utils/epkTraducciones.js";
import { EPK_LANGUAGES } from "../../src/i18n/epkTranslations.js";
import { getTargetBandId, puedeEscribirEnBanda, bandaSolicitada } from "../utils/bandAccess.js";

const router = express.Router();

// Get Autonomy Config
router.get("/autonomy", async (req, res) => {
  const user = (req as any).user;
  const userBandId = user?.band_id || BAKANDEYA_BAND_ID;
  
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
router.post("/autonomy", requireAuth, async (req, res) => {
  try {
    const updatedConfig = req.body;
    const user = (req as any).user;
    const userBandId = user?.band_id || BAKANDEYA_BAND_ID;
    
    await dbUpsertAutonomyConfig(userBandId, updatedConfig);

    const state = loadState();
    const cleanUserBandId = userBandId.replace(/^(band|reg)-/, '');
    const current = getAutonomyConfigForBand(state, userBandId);
    const newAutonomyConfig = { ...current, ...updatedConfig };
    const possibleKeys = [userBandId, cleanUserBandId, `band-${cleanUserBandId}`, `reg-${cleanUserBandId}`];
    if (!state.autonomyConfigsByBand) state.autonomyConfigsByBand = {};
    possibleKeys.forEach(k => {
      state.autonomyConfigsByBand[k] = newAutonomyConfig;
    });
    saveState(state);

    res.json({ success: true, autonomyConfig: newAutonomyConfig });
  } catch (err: any) {
    console.error("Error updating autonomy config:", err);
    res.status(500).json({ error: err?.message || "Error al actualizar la configuración de autonomía." });
  }
});

router.put("/autonomy", requireAuth, async (req, res) => {
  try {
    const updatedConfig = req.body;
    const user = (req as any).user;
    const userBandId = user?.band_id || BAKANDEYA_BAND_ID;

    await dbUpsertAutonomyConfig(userBandId, updatedConfig);

    const state = loadState();
    const cleanUserBandId = userBandId.replace(/^(band|reg)-/, '');
    const current = getAutonomyConfigForBand(state, userBandId);
    const newAutonomyConfig = { ...current, ...updatedConfig };
    const possibleKeys = [userBandId, cleanUserBandId, `band-${cleanUserBandId}`, `reg-${cleanUserBandId}`];
    if (!state.autonomyConfigsByBand) state.autonomyConfigsByBand = {};
    possibleKeys.forEach(k => {
      state.autonomyConfigsByBand[k] = newAutonomyConfig;
    });
    saveState(state);

    res.json({ success: true, autonomyConfig: newAutonomyConfig });
  } catch (err: any) {
    console.error("Error updating autonomy config:", err);
    res.status(500).json({ error: err?.message || "Error al actualizar la configuración de autonomía." });
  }
});

// Get EPK Config. Lleva requireAuth: sin él, cualquiera podía leer el EPK de cualquier banda
// pasando ?bandId= — con su email y teléfono de booking, su firma y su configuración. El EPK
// que sí debe ser público se sirve por GET /public/epk, más abajo, y va recortado.
router.get("/epk", requireAuth, async (req, res) => {
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
router.put("/epk", requireAuth, async (req, res) => {
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
      return res.status(403).json({ error: "No tienes acceso a esta banda." });
    }
    const userBandId = getTargetBandId(req);

    await dbUpsertEpkConfig(userBandId, updatedConfig);

    const state = loadState();
    const cleanUserBandId = userBandId.replace(/^(band|reg)-/, '');
    const userBandName = user?.bandName || user?.name || 'Tu Banda';
    const current = getEpkConfigForBand(state, userBandId, userBandName, user?.email);
    const newEpkConfig = { ...current, ...updatedConfig };
    
    const possibleKeys = [userBandId, cleanUserBandId, `band-${cleanUserBandId}`, `reg-${cleanUserBandId}`];
    possibleKeys.forEach(k => {
      state.epkConfigsByBand[k] = newEpkConfig;
    });

    if (cleanUserBandId === 'bakandeya') {
      state.epkConfig = newEpkConfig;
    }

    saveState(state);

    res.json({ success: true, epkConfig: newEpkConfig });
  } catch (err: any) {
    console.error("Error updating EPK config:", err);
    res.status(500).json({ error: err?.message || "Error al actualizar la configuración del EPK." });
  }
});

// Traduce el contenido del EPK a otro idioma con IA (borrador para que lo repase la banda).
//
// Coste: UNA llamada al modelo por pulsación, con todos los textos en un solo prompt. Nunca se
// traduce al abrir la página pública — eso sería gasto ilimitado y latencia en una página que
// abre gente de fuera. Lo que sirve /public/epk es siempre texto ya guardado.
router.post("/epk/traducir", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    // Mismo control de acceso que PUT /epk: traducir escribe en el EPK de una banda (y además
    // gasta tokens, así que no puede dispararlo alguien sobre una banda que no es suya).
    const solicitada = bandaSolicitada(req);
    if (solicitada && !puedeEscribirEnBanda(req, solicitada)) {
      return res.status(403).json({ error: "No tienes acceso a esta banda." });
    }
    const bandId = getTargetBandId(req);
    const idioma = String(req.body?.idioma || req.body?.lang || '').trim();
    const forzar = Boolean(req.body?.forzar ?? req.body?.force);

    const idiomasDestino = EPK_LANGUAGES.filter(l => l.code !== IDIOMA_ORIGEN).map(l => l.code);
    if (!idiomasDestino.includes(idioma as any)) {
      return res.status(400).json({ error: `Idioma no soportado: "${idioma}". Disponibles: ${idiomasDestino.join(', ')}.` });
    }
    const nombreIdioma = EPK_LANGUAGES.find(l => l.code === idioma)?.label || idioma;

    let config: any = null;
    try {
      config = await dbGetEpkConfig(bandId);
    } catch (e) {
      // Sin Supabase se cae al estado local, igual que el resto de rutas del EPK.
    }
    if (!config) {
      const state = loadState();
      config = getEpkConfigForBand(state, bandId, user?.bandName || user?.name || 'Tu Banda', user?.email);
    }

    const textos = recopilarTextosTraducibles(config);
    if (!hayAlgoQueTraducir(textos)) {
      return res.status(400).json({ error: "No hay contenido que traducir todavía: rellena al menos la biografía del EPK." });
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
        mensaje: "La traducción ya está al día con el texto actual; no se ha llamado a la IA."
      });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({ error: "No hay ninguna clave de IA configurada en el servidor (GEMINI_API_KEY)." });
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
      `6. Si un campo del original viene vacío, devuélvelo como cadena vacía "".`
    ].join('\n');

    const prompt = [
      `Traduce a ${nombreIdioma} los campos de este JSON y devuelve un JSON con EXACTAMENTE la misma forma y las mismas claves e ids.`,
      ``,
      `Los objetos de "miembros" y "videos" se identifican por su "id": conserva cada id tal cual, no los reordenes ni los inventes.`,
      `En "datosContratacion", "duracionDirecto" suele ser solo un número (minutos): si lo es, devuélvelo igual sin añadir unidades.`,
      ``,
      `CONTENIDO ORIGINAL (español):`,
      JSON.stringify(textos, null, 2)
    ].join('\n');

    const respuesta = await generateContentWithFallback(ai, {
      contents: `${systemPrompt}\n\n---\n${prompt}`,
      config: {
        temperature: 0.3,
        responseMimeType: "application/json"
      }
    });

    const textoRespuesta = respuesta?.text || respuesta?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const crudo = safeParseJson(textoRespuesta);

    // GUARDARRAÍL CRÍTICO: la cadena de fallbacks de ai.ts termina en un motor local que
    // devuelve una PLANTILLA DE PITCH EN ESPAÑOL disfrazada de respuesta del modelo. Si eso se
    // guardara como "traducción al inglés" sería un desastre silencioso. Por eso no se
    // persiste nada que no parsee como el objeto esperado.
    if (!crudo || typeof crudo !== 'object' || Array.isArray(crudo)) {
      console.warn("[EPK traducir] La IA no devolvió un JSON utilizable. Primeros 200 caracteres:", String(textoRespuesta).slice(0, 200));
      return res.status(502).json({ error: "La IA no devolvió una traducción válida. No se ha guardado nada; vuelve a intentarlo." });
    }

    const texto = (v: any): string => (typeof v === 'string' ? v : '');

    const miembrosTraducidos: Record<string, { rol?: string; bio?: string }> = {};
    const listaMiembros = Array.isArray(crudo.miembros) ? crudo.miembros : [];
    for (const m of listaMiembros) {
      // Solo se aceptan ids que existían en el original: si el modelo se inventa uno, se ignora.
      if (m?.id && textos.miembros.some(o => o.id === m.id)) {
        miembrosTraducidos[m.id] = { rol: texto(m.rol), bio: texto(m.bio) };
      }
    }

    const videosTraducidos: Record<string, { titulo?: string }> = {};
    const listaVideos = Array.isArray(crudo.videos) ? crudo.videos : [];
    for (const v of listaVideos) {
      if (v?.id && textos.videos.some(o => o.id === v.id)) {
        videosTraducidos[v.id] = { titulo: texto(v.titulo) };
      }
    }

    const datosTraducidos: Record<string, string> = {};
    for (const clave of CLAVES_DATOS_TRADUCIBLES) {
      datosTraducidos[clave] = texto(crudo.datosContratacion?.[clave]);
    }

    const traduccion = {
      biografia: texto(crudo.biografia),
      textoPie: texto(crudo.textoPie),
      riderTecnico: texto(crudo.riderTecnico),
      miembros: miembrosTraducidos,
      videos: videosTraducidos,
      datosContratacion: datosTraducidos,
      _fuenteHash: hashActual,
      _traducidoEn: new Date().toISOString(),
      _revisadoAMano: false
    };

    // Segundo filtro: si de todo el contenido no ha salido ni una línea, algo fue mal y no
    // merece la pena pisar una traducción anterior que sí servía.
    const hayContenido = Boolean(
      traduccion.biografia.trim() || traduccion.textoPie.trim() || traduccion.riderTecnico.trim() ||
      Object.keys(miembrosTraducidos).length || Object.keys(videosTraducidos).length
    );
    if (!hayContenido) {
      return res.status(502).json({ error: "La IA devolvió una traducción vacía. No se ha guardado nada; vuelve a intentarlo." });
    }

    const traduccionesActualizadas = { ...(config?.traducciones || {}), [idioma]: traduccion };
    await dbUpsertEpkConfig(bandId, { traducciones: traduccionesActualizadas });

    // Espejo en el estado local, igual que hace PUT /epk.
    const state = loadState();
    const cleanBandId = bandId.replace(/^(band|reg)-/, '');
    for (const k of [bandId, cleanBandId, `band-${cleanBandId}`, `reg-${cleanBandId}`]) {
      if (state.epkConfigsByBand?.[k]) {
        state.epkConfigsByBand[k] = { ...state.epkConfigsByBand[k], traducciones: traduccionesActualizadas };
      }
    }
    if (cleanBandId === 'bakandeya' && state.epkConfig) {
      state.epkConfig = { ...state.epkConfig, traducciones: traduccionesActualizadas };
    }
    saveState(state);

    console.log(`[EPK traducir] ${bandId} -> ${idioma} (hash ${hashActual})`);
    res.json({ success: true, idioma, traduccion });
  } catch (err: any) {
    console.error("Error traduciendo el EPK:", err);
    res.status(500).json({ error: err?.message || "Error al traducir el EPK." });
  }
});

// Public EPK Data endpoint (No Auth required for public sharing)
router.get("/public/epk", async (req, res) => {
  try {
    const rawBandId = (req.query.band_id as string) || (req.query.band as string) || (req.query.b as string) || (req.headers['x-band-id'] as string) || BAKANDEYA_BAND_ID;
    const cleanBandId = rawBandId.toLowerCase().replace(/^(band|reg)-/, '');
    const reqBandId = cleanBandId === 'bakandeya' ? BAKANDEYA_BAND_ID : `band-${cleanBandId}`;

    const state = loadState();
    let epkConfig: any = null;
    try {
      epkConfig = await dbGetEpkConfig(reqBandId);
    } catch (e) {
      console.warn("Could not fetch EPK from Supabase:", e);
    }

    if (!epkConfig) {
      epkConfig = getEpkConfigForBand(state, reqBandId);
    }

    let regBand: any = null;
    try {
      const { getSupabase } = await import("../db.js");
      const sb = getSupabase();
      const candidateIds = [reqBandId, `reg-${cleanBandId}`, cleanBandId, `band-${cleanBandId}`];
      const { data } = await sb.from("registered_bands").select("*").in("band_id", candidateIds).limit(1).maybeSingle();
      regBand = data;
    } catch (e) {}

    if (!regBand) {
      regBand = (state.registeredBands || []).find((b: any) => {
        const bId = (b.band_id || b.id || '').replace(/^(band|reg)-/, '').toLowerCase();
        return bId === cleanBandId;
      });
    }

    let bandName = regBand?.nombre_banda;
    if (!bandName && epkConfig?.contactoBooking?.nombre && !epkConfig.contactoBooking.nombre.toLowerCase().includes('bakandeya')) {
      bandName = epkConfig.contactoBooking.nombre;
    }
    if (!bandName) {
      bandName = cleanBandId === 'bakandeya' ? 'Bakandeya' : (cleanBandId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
    }

    // La fuente de verdad de temas y conciertos es Supabase, igual que para el epkConfig de
    // arriba. Antes esto solo miraba state.songs/state.concerts (el JSON local), y como el
    // contenedor de Railway es efímero, el EPK público salía SIN canciones aunque la banda las
    // tuviera cargadas en la app. El estado local queda como respaldo si Supabase falla.
    let songs: any[] = [];
    try {
      songs = await dbGetSongs(reqBandId);
    } catch (e) {
      console.warn("EPK público: no se pudieron leer los temas de Supabase, usando estado local:", e);
    }
    if (!songs || songs.length === 0) {
      songs = (state.songs || []).filter((s: any) => {
        const sBand = (s.band_id || '').replace(/^(band|reg)-/, '').toLowerCase();
        return sBand === cleanBandId || (!s.band_id && cleanBandId === 'bakandeya');
      });
    }

    let concerts: any[] = [];
    try {
      concerts = await dbGetConcerts(reqBandId);
    } catch (e) {
      console.warn("EPK público: no se pudieron leer los conciertos de Supabase, usando estado local:", e);
    }
    if (!concerts || concerts.length === 0) {
      concerts = (state.concerts || []).filter((c: any) => {
        const cBand = (c.band_id || '').replace(/^(band|reg)-/, '').toLowerCase();
        return cBand === cleanBandId || (!c.band_id && cleanBandId === 'bakandeya');
      });
    }

    // Filter highlighted songs
    const highlightedSongs = epkConfig?.temasDestacadosIds?.length > 0
      ? songs.filter((s: any) => epkConfig.temasDestacadosIds.includes(s.id))
      : songs.slice(0, 3);

    // Upcoming concerts
    const today = new Date().toISOString().split("T")[0];
    const upcomingConcerts = concerts.filter((c: any) => c.fecha >= today);

    // Default official links for Bakandeya fallback
    const BAKANDEYA_DEFAULT_SOCIALS = {
      instagram: "https://instagram.com/bakandeya_oficial",
      spotify: "https://open.spotify.com/artist/bakandeya",
      youtube: "https://youtube.com/@bakandeya_oficial",
      tiktok: "https://tiktok.com/@bakandeya_oficial",
      website: "https://bands-manager.up.railway.app"
    };

    // Filter out bakandeya default logo if this is not bakandeya
    let logoUrl = epkConfig?.logoUrl || regBand?.logo_url || regBand?.imagen_url || null;
    if (logoUrl && String(logoUrl).includes('bakandeya') && cleanBandId !== 'bakandeya') {
      logoUrl = null;
    } else if (!logoUrl && cleanBandId === 'bakandeya') {
      logoUrl = '/logo_bakandeya.jpg';
    }

    // Ensure social links are present
    let enlacesRedes = epkConfig?.enlacesRedes || {};
    if (cleanBandId === 'bakandeya') {
      enlacesRedes = {
        ...BAKANDEYA_DEFAULT_SOCIALS,
        ...(enlacesRedes || {})
      };
    } else if (regBand) {
      if (regBand.instagram && !enlacesRedes.instagram) enlacesRedes.instagram = regBand.instagram.startsWith('http') ? regBand.instagram : `https://instagram.com/${regBand.instagram.replace(/^@/, '')}`;
      if (regBand.spotify_youtube && !enlacesRedes.spotify && !enlacesRedes.youtube) {
        if (regBand.spotify_youtube.includes('spotify')) enlacesRedes.spotify = regBand.spotify_youtube;
        else if (regBand.spotify_youtube.includes('youtube')) enlacesRedes.youtube = regBand.spotify_youtube;
      }
    }

    const cleanEpkConfig = {
      ...epkConfig,
      logoUrl,
      enlacesRedes,
      contactoBooking: {
        ...(epkConfig?.contactoBooking || {}),
        nombre: (epkConfig?.contactoBooking?.nombre && !epkConfig.contactoBooking.nombre.toLowerCase().includes('bakandeya')) 
          ? epkConfig.contactoBooking.nombre 
          : (cleanBandId === 'bakandeya' ? 'Booking & Management Bakandeya' : bandName),
        email: epkConfig?.contactoBooking?.email || (cleanBandId === 'bakandeya' ? 'diego.delacalleb@gmail.com' : (regBand?.email || '')),
        telefono: epkConfig?.contactoBooking?.telefono || (cleanBandId === 'bakandeya' ? '+34 612 345 678' : (regBand?.telefono || ''))
      }
    };

    res.json({
      bandId: reqBandId,
      bandName,
      logoUrl,
      epkConfig: cleanEpkConfig,
      highlightedSongs,
      upcomingConcerts: upcomingConcerts.slice(0, 5),
      totalConcertsCount: concerts.length
    });
  } catch (err: any) {
    console.error("Error in public EPK endpoint:", err);
    res.status(500).json({ error: "Error al cargar la información pública del EPK." });
  }
});

// Get Fans List (Authenticated)
router.get("/fans", requireAuth, async (req, res) => {
  const userBandId = (req as any).user?.band_id ;
  try {
    const fans = await dbGetFans(userBandId);
    const state = loadState();
    state.fans = fans as any;
    saveState(state);
    res.json(fans);
  } catch (err) {
    const state = loadState();
    res.json((state.fans || []).filter((f: any) => f.band_id === userBandId || f.bandId === userBandId));
  }
});

// Add Fan manually (Authenticated)
router.post("/fans", requireAuth, async (req, res) => {
  try {
    const newFan: Fan = req.body;
    if (!newFan.nombre || !newFan.email) {
      return res.status(400).json({ error: "Nombre y Email son obligatorios" });
    }
    const userBandId = (req as any).user?.band_id ;
    if (!(newFan as any).band_id) {
      (newFan as any).band_id = userBandId;
    }
    const saved = await dbUpsertFan(newFan, userBandId);

    const state = loadState();
    if (!state.fans) state.fans = [];
    state.fans.unshift(saved as any);
    saveState(state);

    res.json({ success: true, fan: saved });
  } catch (err: any) {
    console.error("Error adding fan:", err);
    res.status(500).json({ error: err?.message || "Error al registrar fan." });
  }
});

// Update Fan (Authenticated)
router.patch("/fans/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userBandId = (req as any).user?.band_id;
    const updates = req.body;

    const state = loadState();
    if (!state.fans) state.fans = [];
    const index = state.fans.findIndex((f: Fan) => f.id === id);
    if (index !== -1) {
      state.fans[index] = { ...state.fans[index], ...updates };
      await dbUpsertFan(state.fans[index], userBandId);
      saveState(state);
      return res.json({ success: true, fan: state.fans[index] });
    }
    res.status(404).json({ error: "Fan no encontrado" });
  } catch (err: any) {
    console.error("Error updating fan:", err);
    res.status(500).json({ error: err?.message || "Error al actualizar fan." });
  }
});

// Delete Fan (Authenticated)
router.delete("/fans/:id", requireAuth, async (req, res) => {
  const userBandId = (req as any).user?.band_id ;
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
router.post("/public/fans", async (req, res) => {
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
      instagram
    } = req.body;
    const targetBandId = (req.query.band_id as string) || (req.query.band as string) || band_id || BAKANDEYA_BAND_ID;

    if (!nombre || !email) {
      return res.status(400).json({ error: "Por favor, introduce tu nombre y correo electrónico." });
    }

    if (!consentimientoRGPD) {
      return res.status(400).json({ error: "Es obligatorio aceptar la casilla de consentimiento de privacidad RGPD para registrarte." });
    }

    const defaultLevel = conciertoOrigenId || (comoConocio && comoConocio.toLowerCase().includes('concierto'))
      ? 'superfan'
      : 'fiel';

    const newFan: Fan & { band_id?: string } = {
      id: `fan-${Date.now()}`,
      band_id: targetBandId,
      nombre: String(nombre).trim(),
      email: String(email).toLowerCase().trim(),
      ciudad: ciudad ? String(ciudad).trim() : undefined,
      comoConocio: comoConocio ? String(comoConocio).trim() : undefined,
      conciertoOrigenId: conciertoOrigenId ? String(conciertoOrigenId).trim() : undefined,
      conciertoOrigenNombre: conciertoOrigenNombre ? String(conciertoOrigenNombre).trim() : undefined,
      fechaCaptura: new Date().toISOString().split("T")[0],
      consentimientoRGPD: true,
      mensaje: mensaje ? String(mensaje).trim() : undefined,
      cancionFavorita: cancionFavorita ? String(cancionFavorita).trim() : undefined,
      instagram: instagram ? String(instagram).trim().replace(/^@/, '') : undefined,
      nivelFan: defaultLevel,
      reacciones: { likes: 1, fire: 0, applause: 0, guitars: 0 }
    };

    const saved = await dbUpsertFan(newFan, targetBandId);

    const state = loadState();
    if (!state.fans) state.fans = [];
    state.fans.unshift(saved as any);
    saveState(state);

    const epkConf = getEpkConfigForBand(state, targetBandId);
    const bandName = epkConf?.contactoBooking?.nombre || (targetBandId.includes('bakandeya') ? "Bakandeya" : "la banda");

    res.json({
      success: true,
      message: `¡Registro completado con éxito! Bienvenido/a a la familia de ${bandName}.`,
      incentivo: epkConf?.incentivoFans || {
        mensajeAgradecimiento: "¡Muchas gracias por unirte!",
        codigoDescuento: "FAN-VIP-10"
      }
    });
  } catch (err: any) {
    console.error("Error in public fan registration:", err);
    res.status(500).json({ error: "Error al procesar el registro de fan." });
  }
});

export default router;
