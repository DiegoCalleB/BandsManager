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
  dbDeleteFan
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

    const songs = (state.songs || []).filter((s: any) => {
      const sBand = (s.band_id || '').replace(/^(band|reg)-/, '').toLowerCase();
      return sBand === cleanBandId || (!s.band_id && cleanBandId === 'bakandeya');
    });

    const concerts = (state.concerts || []).filter((c: any) => {
      const cBand = (c.band_id || '').replace(/^(band|reg)-/, '').toLowerCase();
      return cBand === cleanBandId || (!c.band_id && cleanBandId === 'bakandeya');
    });

    // Filter highlighted songs
    const highlightedSongs = epkConfig?.temasDestacadosIds?.length > 0
      ? songs.filter((s: any) => epkConfig.temasDestacadosIds.includes(s.id))
      : songs.slice(0, 3);

    // Upcoming concerts
    const today = new Date().toISOString().split("T")[0];
    const upcomingConcerts = concerts.filter((c: any) => c.fecha >= today);

    // Filter out bakandeya default logo if this is not bakandeya
    let logoUrl = epkConfig?.logoUrl || regBand?.logo_url || regBand?.imagen_url || null;
    if (logoUrl && String(logoUrl).includes('bakandeya') && cleanBandId !== 'bakandeya') {
      logoUrl = null;
    }

    const cleanEpkConfig = {
      ...epkConfig,
      logoUrl,
      contactoBooking: {
        ...(epkConfig?.contactoBooking || {}),
        nombre: (epkConfig?.contactoBooking?.nombre && !epkConfig.contactoBooking.nombre.toLowerCase().includes('bakandeya')) 
          ? epkConfig.contactoBooking.nombre 
          : (cleanBandId === 'bakandeya' ? 'Bakandeya' : bandName)
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
    res.json(state.fans || []);
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
    const { nombre, email, ciudad, comoConocio, conciertoOrigenId, conciertoOrigenNombre, consentimientoRGPD, band_id } = req.body;
    const targetBandId = (req.query.band_id as string) || (req.query.band as string) || band_id || BAKANDEYA_BAND_ID;

    if (!nombre || !email) {
      return res.status(400).json({ error: "Por favor, introduce tu nombre y correo electrónico." });
    }

    if (!consentimientoRGPD) {
      return res.status(400).json({ error: "Es obligatorio aceptar la casilla de consentimiento de privacidad RGPD para registrarte." });
    }

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
      consentimientoRGPD: true
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
