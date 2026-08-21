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

// Get EPK Config (Authenticated)
router.get("/epk", async (req, res) => {
  const user = (req as any).user;
  const userBandId = (req.query.bandId as string) || (req.headers['x-band-id'] as string) || user?.band_id || BAKANDEYA_BAND_ID;
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
    const userBandId = (req.body as any).bandId || (req.headers['x-band-id'] as string) || user?.band_id || BAKANDEYA_BAND_ID;

    const allowedBandIds: string[] = user?.allowedBandIds || [];
    const isAllowed = allowedBandIds.includes(userBandId) || user?.role === 'admin' || user?.role === 'leader';
    if (!isAllowed) {
      return res.status(403).json({ error: "No tienes acceso a esta banda." });
    }

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
