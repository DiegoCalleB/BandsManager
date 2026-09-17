import express from "express";
import crypto from "crypto";
import { Rehearsal, Concert, Payment, Message } from "../../src/types.js";
import { loadState, saveState, requireAuth, requireLeader } from "../state.js";
import { getTargetBandId, puedeEscribirEnBanda } from "../utils/bandAccess.js";
import {
  dbGetRehearsals,
  dbUpsertRehearsal,
  dbDeleteRehearsal,
  dbGetConcerts,
  dbUpsertConcert,
  dbDeleteConcert,
  dbGetPayments,
  dbUpsertPayment,
  dbGetRunOfShow,
  dbSyncRunOfShowForDate,
  dbGetGearChecklists,
  dbSyncGearChecklistForDate,
  dbGetSetlists,
  dbGetSongs,
  dbGetLeads
} from "../db.js";

const router = express.Router();

/**
 * Firma del feed de calendario para una banda (o una lista de bandas separada por comas).
 *
 * El feed .ics tiene que poder leerse SIN sesión, porque quien lo consume es Google Calendar o
 * el calendario del móvil, que no saben iniciar sesión. Pero identificarlo solo por band_id
 * significaba que probando identificadores se leían los conciertos y ensayos de cualquier banda.
 * La URL lleva ahora una firma que solo el servidor sabe calcular.
 *
 * Es un HMAC, no un valor guardado: así la URL de cada banda es estable sin tocar el esquema, y
 * se invalidan todas de golpe cambiando el secreto.
 */
export function firmaDeFeed(bandIds: string): string | null {
  const secreto = process.env.CALENDAR_FEED_SECRET || process.env.CRON_SECRET;
  if (!secreto) return null;
  const normalizado = bandIds.split(",").map((b) => b.trim()).filter(Boolean).sort().join(",");
  return crypto.createHmac("sha256", secreto).update(`calendario:${normalizado}`).digest("hex").slice(0, 32);
}

/** Comparación en tiempo constante, para no filtrar la firma a base de reintentos. */
function firmaCoincide(esperada: string, recibida: unknown): boolean {
  if (typeof recibida !== "string" || recibida.length !== esperada.length) return false;
  return crypto.timingSafeEqual(Buffer.from(esperada), Buffer.from(recibida));
}

// Update rehearsal
router.put("/rehearsals/:id", requireAuth, async (req, res) => {
  try {
    const userBandId = getTargetBandId(req);
    const { id } = req.params;
    const updated = { ...req.body, id };
    const saved = await dbUpsertRehearsal(updated, userBandId);
    
    const state = loadState();
    const idx = state.rehearsals?.findIndex((r: Rehearsal) => r.id === id) ?? -1;
    if (idx !== -1) {
      state.rehearsals[idx] = saved as any;
    } else if (state.rehearsals) {
      state.rehearsals.push(saved as any);
    }
    saveState(state);
    res.json({ success: true, rehearsal: saved });
  } catch (err: any) {
    console.error("Error updating rehearsal:", err);
    res.status(500).json({ error: err?.message || "Error al actualizar ensayo." });
  }
});

// Create rehearsal
router.post("/rehearsals", requireAuth, async (req, res) => {
  try {
    const userBandId = getTargetBandId(req);
    const newRehearsal: Rehearsal = req.body;
    (newRehearsal as any).band_id = userBandId;
    const saved = await dbUpsertRehearsal(newRehearsal, userBandId);
    
    const state = loadState();
    if (state.rehearsals) {
      state.rehearsals.push(saved as any);
    }
    saveState(state);
    res.json({ success: true, rehearsal: saved });
  } catch (err: any) {
    console.error("Error creating rehearsal:", err);
    res.status(500).json({ error: err?.message || "Error al crear ensayo." });
  }
});

// Delete rehearsal
router.delete("/rehearsals/:id", requireAuth, async (req, res) => {
  try {
    const userBandId = getTargetBandId(req);
    if (!puedeEscribirEnBanda(req, userBandId)) {
      return res.status(403).json({ error: "No puedes eliminar un ensayo de esta banda." });
    }
    const { id } = req.params;
    const state = loadState();
    const rehearsal = state.rehearsals?.find((r: Rehearsal) => r.id === id);
    const targetBand = (rehearsal as any)?.band_id || userBandId;

    if (targetBand && !puedeEscribirEnBanda(req, targetBand)) {
      return res.status(403).json({ error: "No puedes eliminar un ensayo de otra banda." });
    }

    try {
      await dbDeleteRehearsal(id, targetBand);
    } catch (err) {
      console.warn("No se pudo eliminar el ensayo en Supabase:", err);
    }

    if (state.rehearsals) {
      state.rehearsals = state.rehearsals.filter((r: Rehearsal) => r.id !== id);
      saveState(state);
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting rehearsal:", err);
    res.status(500).json({ error: err?.message || "Error al eliminar ensayo." });
  }
});

// Update concert
router.put("/concerts/:id", requireAuth, async (req, res) => {
  try {
    const userBandId = getTargetBandId(req);
    const { id } = req.params;
    const updated = { ...req.body, id };
    const saved = await dbUpsertConcert(updated, userBandId);

    const state = loadState();
    const idx = state.concerts?.findIndex((c: Concert) => c.id === id) ?? -1;
    if (idx !== -1) {
      state.concerts[idx] = saved as any;
    } else if (state.concerts) {
      state.concerts.push(saved as any);
    }
    saveState(state);
    res.json({ success: true, concert: saved });
  } catch (err: any) {
    console.error("Error updating concert:", err);
    res.status(500).json({ error: err?.message || "Error al actualizar concierto." });
  }
});

// Create concert
router.post("/concerts", requireAuth, async (req, res) => {
  try {
    const userBandId = getTargetBandId(req);
    const newConcert: Concert = req.body;
    (newConcert as any).band_id = userBandId;
    const saved = await dbUpsertConcert(newConcert, userBandId);

    const state = loadState();
    if (state.concerts) {
      state.concerts.push(saved as any);
    }
    saveState(state);
    res.json({ success: true, concert: saved });
  } catch (err: any) {
    console.error("Error creating concert:", err);
    res.status(500).json({ error: err?.message || "Error al crear concierto." });
  }
});

// Delete concert
router.delete("/concerts/:id", requireAuth, async (req, res) => {
  try {
    const userBandId = getTargetBandId(req);
    if (!puedeEscribirEnBanda(req, userBandId)) {
      return res.status(403).json({ error: "No puedes eliminar un concierto de esta banda." });
    }
    const { id } = req.params;
    const state = loadState();
    const concert = state.concerts?.find((c: Concert) => c.id === id);
    const targetBand = (concert as any)?.band_id || userBandId;

    if (targetBand && !puedeEscribirEnBanda(req, targetBand)) {
      return res.status(403).json({ error: "No puedes eliminar un concierto de otra banda." });
    }

    try {
      await dbDeleteConcert(id, targetBand);
    } catch (err) {
      console.warn("No se pudo eliminar el concierto en Supabase:", err);
    }

    if (state.concerts) {
      state.concerts = state.concerts.filter((c: Concert) => c.id !== id);
      saveState(state);
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting concert:", err);
    res.status(500).json({ error: err?.message || "Error al eliminar concierto." });
  }
});

// Sync all concerts with Supabase
router.post("/concerts/sync", requireAuth, async (req, res) => {
  const userBandId = getTargetBandId(req);
  try {
    const dbConcerts = await dbGetConcerts(userBandId);
    const state = loadState();
    state.concerts = dbConcerts;
    saveState(state);

    res.json({
      success: true,
      message: `¡Se han sincronizado correctamente los conciertos con Supabase!`,
      concerts: dbConcerts
    });
  } catch (error: any) {
    console.error("Error in /api/concerts/sync:", error);
    res.status(500).json({
      success: false,
      error: `Error al sincronizar con Supabase: ${error.message || error}`
    });
  }
});

// Get logistics
router.get("/logistics", requireAuth, async (req, res) => {
  const userBandId = getTargetBandId(req);
  if (!userBandId) {
    return res.status(401).json({ error: "Acceso no autorizado. Inicie sesión para continuar." });
  }
  try {
    const runOfShow = await dbGetRunOfShow(userBandId);
    const gearChecklists = await dbGetGearChecklists(userBandId);
    res.json({ runOfShow: runOfShow || {}, gearChecklists: gearChecklists || {} });
  } catch (err) {
    try {
      const state = loadState();
      res.json({
        runOfShow: state.runOfShow || {},
        gearChecklists: state.gearChecklists || {}
      });
    } catch {
      res.json({ runOfShow: {}, gearChecklists: {} });
    }
  }
});

// Update/set run of show for a date
router.post("/logistics/runofshow", requireAuth, async (req, res) => {
  const userBandId = getTargetBandId(req);
  if (!userBandId) {
    return res.status(401).json({ error: "Acceso no autorizado. Inicie sesión para continuar." });
  }
  const { dateKey, items } = req.body;
  if (!dateKey || !Array.isArray(items)) {
    return res.status(400).json({ error: "dateKey and items array required" });
  }
  try {
    await dbSyncRunOfShowForDate(dateKey, items, userBandId);
  } catch (err) {
    console.warn("Could not sync run of show with Supabase:", err);
  }

  try {
    const state = loadState();
    if (!state.runOfShow) state.runOfShow = {};
    state.runOfShow[dateKey] = items;
    saveState(state);
  } catch (err) {
    console.warn("Could not save run of show to local state:", err);
  }
  res.json({ success: true, dateKey, items });
});

// Update/set gear checklist for a date
router.post("/logistics/gear", requireAuth, async (req, res) => {
  const userBandId = getTargetBandId(req);
  if (!userBandId) {
    return res.status(401).json({ error: "Acceso no autorizado. Inicie sesión para continuar." });
  }
  const { dateKey, items } = req.body;
  if (!dateKey || !Array.isArray(items)) {
    return res.status(400).json({ error: "dateKey and items array required" });
  }
  try {
    await dbSyncGearChecklistForDate(dateKey, items, userBandId);
  } catch (err) {
    console.warn("Could not sync gear with Supabase:", err);
  }

  try {
    const state = loadState();
    if (!state.gearChecklists) state.gearChecklists = {};
    state.gearChecklists[dateKey] = items;
    saveState(state);
  } catch (err) {
    console.warn("Could not save gear to local state:", err);
  }
  res.json({ success: true, dateKey, items });
});

// Get payments (Admin only)
router.get("/payments", requireAuth, requireLeader, async (req, res) => {
  const userBandId = getTargetBandId(req);
  try {
    const dbPayments = await dbGetPayments(userBandId);
    res.json(dbPayments);
  } catch (err) {
    const state = loadState();
    res.json((state.payments || []).filter((p: any) => p.band_id === userBandId || p.bandId === userBandId));
  }
});

// Create payment (Admin only)
router.post("/payments", requireAuth, requireLeader, async (req, res) => {
  const userBandId = getTargetBandId(req);
  const newPayment: Payment = req.body;
  const saved = await dbUpsertPayment(newPayment, userBandId);

  const state = loadState();
  state.payments.push(saved as any);
  saveState(state);
  
  res.json({ success: true, payment: saved });
});

// Update payment status (Admin only)
router.put("/payments/:id", requireAuth, requireLeader, async (req, res) => {
  const userBandId = getTargetBandId(req);
  const { id } = req.params;
  const updated = { ...req.body, id };
  const saved = await dbUpsertPayment(updated, userBandId);

  const state = loadState();
  const idx = state.payments.findIndex((p: Payment) => p.id === id);
  if (idx !== -1) {
    state.payments[idx] = saved as any;
  } else {
    state.payments.push(saved as any);
  }
  saveState(state);
  
  res.json({ success: true, payment: saved });
});

// Sync all payments/finances with Supabase (Admin only)
router.post("/payments/sync", requireAuth, requireLeader, async (req, res) => {
  const userBandId = getTargetBandId(req);
  try {
    const dbPayments = await dbGetPayments(userBandId);
    const state = loadState();
    state.payments = dbPayments;
    saveState(state);

    res.json({
      success: true,
      message: `¡Se han sincronizado correctamente las transacciones de finanzas con Supabase!`,
      payments: dbPayments
    });
  } catch (error: any) {
    console.error("Error in /api/payments/sync:", error);
    res.status(500).json({
      success: false,
      error: `Error al sincronizar con Supabase: ${error.message || error}`
    });
  }
});

// Create logistics message
router.post("/messages", requireAuth, (req, res) => {
  const newMessage: Message = req.body;
  const state = loadState();
  state.messages.push(newMessage);
  saveState(state);
  res.json({ success: true, message: newMessage });
});

// Devuelve la URL firmada del feed para las bandas del usuario. Es lo que la aplicación
// enseña para copiar o suscribirse: la firma no se calcula en el cliente.
router.get("/calendar-feed-url", requireAuth, (req, res) => {
  const pedidas = String(req.query.band_id || getTargetBandId(req) || "")
    .split(",")
    .map((b) => b.trim())
    .filter(Boolean);

  if (pedidas.length === 0) {
    return res.status(400).json({ error: "Falta la banda del calendario." });
  }
  const ajena = pedidas.find((b) => !puedeEscribirEnBanda(req, b));
  if (ajena) {
    return res.status(403).json({ error: "No tienes acceso a esa banda." });
  }

  const bandIds = pedidas.join(",");
  const k = firmaDeFeed(bandIds);
  if (!k) {
    return res.status(503).json({
      error: "El feed de calendario no está disponible: falta configurar CALENDAR_FEED_SECRET en el servidor."
    });
  }

  return res.json({ success: true, path: `/api/calendar.ics?band_id=${encodeURIComponent(bandIds)}&k=${k}` });
});

// Export Band Calendar as standard iCalendar (.ics) feed
router.get("/calendar.ics", async (req, res) => {
  try {
    const bandIdQuery = (req.query.band_id as string) || (req.query.band as string) || "band-bakandeya";
    const userQuery = (req.query.user_id as string) || "";

    const firmaEsperada = firmaDeFeed(bandIdQuery);
    if (!firmaEsperada) {
      return res.status(503).type("text/plain").send(
        "El feed de calendario no está disponible: falta configurar CALENDAR_FEED_SECRET en el servidor."
      );
    }
    if (!firmaCoincide(firmaEsperada, req.query.k)) {
      return res.status(403).type("text/plain").send(
        "Enlace de calendario no válido. Vuelve a copiarlo desde la aplicación."
      );
    }
    
    let bandIds: string[] = [];
    if (bandIdQuery.includes(",")) {
      bandIds = bandIdQuery.split(",").map(b => b.trim()).filter(Boolean);
    } else {
      bandIds = [bandIdQuery];
    }

    let concerts: any[] = [];
    let rehearsals: any[] = [];
    try {
      concerts = await dbGetConcerts(bandIds.length > 1 ? bandIds : bandIds[0]);
    } catch (e) {
      console.warn("Could not fetch concerts from Supabase for ICS, falling back to state:", e);
    }
    try {
      rehearsals = await dbGetRehearsals(bandIds.length > 1 ? bandIds : bandIds[0]);
    } catch (e) {
      console.warn("Could not fetch rehearsals from Supabase for ICS, falling back to state:", e);
    }

    // Fallback to local state if Supabase returned empty
    if (!concerts || concerts.length === 0) {
      const state = loadState();
      concerts = (state.concerts || []).filter((c: any) => {
        const cBid = c.band_id || (bandIds.some(b => b === "band-bakandeya" || b === "bakandeya") ? "band-bakandeya" : "");
        return bandIds.some(b => b === cBid || b.replace(/^band-/, "") === (cBid || "").replace(/^band-/, ""));
      });
    }
    if (!rehearsals || rehearsals.length === 0) {
      const state = loadState();
      rehearsals = (state.rehearsals || []).filter((r: any) => {
        const rBid = r.band_id || (bandIds.some(b => b === "band-bakandeya" || b === "bakandeya") ? "band-bakandeya" : "");
        return bandIds.some(b => b === rBid || b.replace(/^band-/, "") === (rBid || "").replace(/^band-/, ""));
      });
    }

    // Fetch context data across bands: Run of show, Gear checklists, Setlists, Songs and Leads (venues)
    const runOfShowMap: Record<string, any[]> = {};
    const gearMap: Record<string, any[]> = {};
    const setlistsMap: Record<string, any> = {};
    const songsMap: Record<string, any> = {};
    const venuesMap: Record<string, any> = {};

    for (const bId of bandIds) {
      try {
        const ros = await dbGetRunOfShow(bId);
        Object.entries(ros || {}).forEach(([date, items]) => {
          if (!runOfShowMap[date]) runOfShowMap[date] = [];
          runOfShowMap[date].push(...(items || []));
        });
      } catch (_) {}

      try {
        const gear = await dbGetGearChecklists(bId);
        Object.entries(gear || {}).forEach(([date, items]) => {
          if (!gearMap[date]) gearMap[date] = [];
          gearMap[date].push(...(items || []));
        });
      } catch (_) {}

      try {
        const sls = await dbGetSetlists(bId);
        (sls || []).forEach((sl: any) => {
          if (sl.id) setlistsMap[sl.id] = sl;
        });
      } catch (_) {}

      try {
        const sngs = await dbGetSongs(bId);
        (sngs || []).forEach((s: any) => {
          if (s.id) songsMap[s.id] = s;
        });
      } catch (_) {}

      try {
        const lds = await dbGetLeads(bId);
        (lds || []).forEach((l: any) => {
          if (l.nombre_sala) {
            venuesMap[l.nombre_sala.toLowerCase().trim()] = l;
          }
        });
      } catch (_) {}
    }

    const pad = (n: number) => String(n).padStart(2, "0");

    // Standard RFC 5545 date helpers
    const parseToYmd = (dateStr: string): string => {
      if (!dateStr) return "";
      const raw = String(dateStr).trim();
      // If YYYY-MM-DD or similar
      const matchYmd = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
      if (matchYmd) {
        return `${matchYmd[1]}${pad(parseInt(matchYmd[2], 10))}${pad(parseInt(matchYmd[3], 10))}`;
      }
      // If DD-MM-YYYY or DD/MM/YYYY
      const matchDmy = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
      if (matchDmy) {
        return `${matchDmy[3]}${pad(parseInt(matchDmy[2], 10))}${pad(parseInt(matchDmy[1], 10))}`;
      }
      const cleanDigits = raw.replace(/[^0-9]/g, "");
      if (cleanDigits.length >= 8) {
        return cleanDigits.slice(0, 8);
      }
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
      }
      return "";
    };

    const getNextDayYmd = (ymdStr: string): string => {
      if (!ymdStr || ymdStr.length !== 8) return ymdStr;
      const y = parseInt(ymdStr.substring(0, 4), 10);
      const m = parseInt(ymdStr.substring(4, 6), 10) - 1;
      const d = parseInt(ymdStr.substring(6, 8), 10);
      const nextDate = new Date(Date.UTC(y, m, d + 1));
      return `${nextDate.getUTCFullYear()}${pad(nextDate.getUTCMonth() + 1)}${pad(nextDate.getUTCDate())}`;
    };

    const formatUtcStamp = (date: Date): string => {
      return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
    };

    const escapeIcsText = (str: string) => {
      if (!str) return "";
      return str
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\r\n|\n|\r/g, "\\n");
    };

    const nowStamp = formatUtcStamp(new Date());
    const calTitle = bandIds.length > 1 ? "BandManager - Mis Bandas" : `BandManager - ${bandIds[0].replace(/^band-/, "").toUpperCase()}`;

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//BandManager.io//ES",
      `X-WR-CALNAME:${escapeIcsText(calTitle)}`,
      "X-WR-CALDESC:Sincronizacion automatica de conciertos y ensayos de BandManager.io",
      "X-PUBLISHED-TTL:PT1H",
      "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH"
    ];

    // Add Concerts with rich details
    concerts.forEach((c: any) => {
      const start = parseToYmd(c.fecha || "");
      if (!start) return;
      const end = getNextDayYmd(start);
      const bTag = c.band_name || (c.band_id ? c.band_id.replace(/^band-/, '').toUpperCase() : '');
      const prefix = bTag ? `[${bTag}] ` : '';

      // Venue contact & address resolution
      const venueKey = (c.sala || "").toLowerCase().trim();
      const venueData = venuesMap[venueKey];
      const fullAddress = c.direccion || venueData?.direccion || `${c.sala || "Sala"}, ${c.ciudad || "Ciudad"}`;

      // Build rich description
      const descLines: string[] = [];
      descLines.push(`🎸 BOLO: ${c.sala || "Directo"} (${c.ciudad || "Ciudad"})`);
      if (bTag) descLines.push(`🏷️ Banda: ${bTag}`);
      if (c.giraNombre) descLines.push(`🗺️ Gira: ${c.giraNombre}`);
      if (c.tipo) descLines.push(`🏛️ Tipo: ${c.tipo.toUpperCase()}`);
      
      descLines.push(`----------------------------------------`);
      descLines.push(`📍 UBICACIÓN & CONTACTO:`);
      descLines.push(`Sala: ${c.sala || "-"}`);
      descLines.push(`Dirección: ${fullAddress}`);
      if (venueData?.contacto_nombre) descLines.push(`Contacto: ${venueData.contacto_nombre}`);
      if (venueData?.telefono) descLines.push(`Teléfono sala: ${venueData.telefono}`);
      if (venueData?.email_contacto) descLines.push(`Email sala: ${venueData.email_contacto}`);
      if (venueData?.instagram) descLines.push(`Instagram: ${venueData.instagram}`);

      descLines.push(`----------------------------------------`);
      descLines.push(`💰 CONDICIONES ECONÓMICAS & ENTRADAS:`);
      descLines.push(`Caché pactado: ${c.cache || 0}€`);
      descLines.push(`Estado del pago: ${(c.estado_pago || "pendiente").toUpperCase()}`);
      descLines.push(`Aforo: ${c.aforo_vendido || 0} / ${c.aforo_total || 0} entradas vendidas`);
      descLines.push(`Contrato: ${c.contrato_firmado ? "✅ Firmado" : "⚠️ Pendiente de firma"}`);

      // Run of Show (Horarios detallados del bolo)
      const rosItems = runOfShowMap[c.fecha] || [];
      if (rosItems.length > 0) {
        descLines.push(`----------------------------------------`);
        descLines.push(`⏱️ ESCALETA / HORARIOS (RUN OF SHOW):`);
        rosItems.forEach((it: any) => {
          descLines.push(`• ${it.time || "--:--"} - ${it.activity || "Actividad"} ${it.done ? "✓" : ""}`);
        });
      }

      // Setlist & Canciones asignadas
      const assignedSetlist = c.setlist_id || c.setlistId ? setlistsMap[c.setlist_id || c.setlistId] : null;
      if (assignedSetlist) {
        descLines.push(`----------------------------------------`);
        descLines.push(`🎵 REPERTORIO ASIGNADO: ${assignedSetlist.nombre || "Setlist"}`);
        if (assignedSetlist.duracion_total_estimada_minutos) {
          descLines.push(`Duración aprox: ${assignedSetlist.duracion_total_estimada_minutos} min`);
        }
        if (Array.isArray(assignedSetlist.items) && assignedSetlist.items.length > 0) {
          assignedSetlist.items.forEach((item: any, idx: number) => {
            const song = item.song_id ? songsMap[item.song_id] : (item.id ? songsMap[item.id] : null);
            const title = song?.titulo || item.titulo || item.nombre || `Tema ${idx + 1}`;
            const keyInfo = song?.tonalidad ? ` (${song.tonalidad})` : (item.tonalidad ? ` (${item.tonalidad})` : "");
            const bpmInfo = song?.bpm ? ` [${song.bpm} BPM]` : "";
            descLines.push(`${idx + 1}. ${title}${keyInfo}${bpmInfo}`);
          });
        }
      }

      // Gear Checklist / Backline
      const gearItems = gearMap[c.fecha] || [];
      if (gearItems.length > 0) {
        descLines.push(`----------------------------------------`);
        descLines.push(`🧰 CHECKLIST DE MATERIAL & BACKLINE:`);
        gearItems.forEach((it: any) => {
          descLines.push(`[${it.packed ? "X" : " "}] ${it.item || "Instrumento"} (${it.responsible || "Banda"})`);
        });
      }

      // Convocatoria / Miembros convocados
      if (Array.isArray(c.convocados_nombres) && c.convocados_nombres.length > 0) {
        descLines.push(`----------------------------------------`);
        descLines.push(`👥 CONVOCATORIA DE MÚSICOS:`);
        c.convocados_nombres.forEach((m: string) => {
          descLines.push(`• ${m}`);
        });
      }

      // Gastos estimados si existen
      if (c.gastosDetalle && Object.keys(c.gastosDetalle).length > 0) {
        const gd = c.gastosDetalle;
        const gItems = [];
        if (gd.gasolina) gItems.push(`Gasolina: ${gd.gasolina}€`);
        if (gd.dietas) gItems.push(`Dietas: ${gd.dietas}€`);
        if (gd.alojamiento) gItems.push(`Hotel: ${gd.alojamiento}€`);
        if (gd.alquilerVehiculo) gItems.push(`Furgoneta: ${gd.alquilerVehiculo}€`);
        if (gd.otros) gItems.push(`Otros: ${gd.otros}€`);
        if (gItems.length > 0) {
          descLines.push(`----------------------------------------`);
          descLines.push(`🚐 LOGÍSTICA & GASTOS: ${gItems.join(" | ")}`);
        }
      }

      // Notas adicionales
      if (c.notas && c.notas.trim()) {
        descLines.push(`----------------------------------------`);
        descLines.push(`📝 NOTAS / CLÁUSULAS TÉCNICAS:`);
        descLines.push(c.notas.trim());
      }

      const descriptionFormatted = escapeIcsText(descLines.join("\n"));
      const locationFormatted = escapeIcsText(fullAddress);

      ics.push(
        "BEGIN:VEVENT",
        `UID:concert-${c.id || Math.random().toString(36).substring(2, 9)}@bandmanager.io`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART;VALUE=DATE:${start}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:🎸 ${prefix}Concierto: ${c.sala || "Directo"} (${c.ciudad || "Ciudad"})`,
        `DESCRIPTION:${descriptionFormatted}`,
        `LOCATION:${locationFormatted}`,
        "STATUS:CONFIRMED",
        "TRANSP:OPAQUE",
        "END:VEVENT"
      );
    });

    // Add Rehearsals with rich details
    rehearsals.forEach((r: any) => {
      const start = parseToYmd(r.fecha || "");
      if (!start) return;
      const end = getNextDayYmd(start);
      const bTag = r.band_id ? r.band_id.replace(/^band-/, '').toUpperCase() : '';
      const prefix = bTag ? `[${bTag}] ` : '';

      const descLines: string[] = [];
      descLines.push(`🥁 ENSAYO: ${r.lugar || "Local de Ensayo"}`);
      if (bTag) descLines.push(`🏷️ Banda: ${bTag}`);
      if (r.hora) descLines.push(`⏰ Horario: ${r.hora}`);
      descLines.push(`📍 Lugar: ${r.lugar || "Local"}`);
      
      // Setlist for rehearsal
      const assignedSetlist = r.setlist_id || r.setlistId ? setlistsMap[r.setlist_id || r.setlistId] : null;
      if (assignedSetlist) {
        descLines.push(`----------------------------------------`);
        descLines.push(`🎵 REPERTORIO A ENSAYAR: ${assignedSetlist.nombre || "Setlist"}`);
        if (Array.isArray(assignedSetlist.items) && assignedSetlist.items.length > 0) {
          assignedSetlist.items.forEach((item: any, idx: number) => {
            const song = item.song_id ? songsMap[item.song_id] : (item.id ? songsMap[item.id] : null);
            const title = song?.titulo || item.titulo || item.nombre || `Tema ${idx + 1}`;
            descLines.push(`${idx + 1}. ${title}`);
          });
        }
      }

      // Attendees / Convocados
      const attendees = r.convocados_nombres || r.asistentes || [];
      if (Array.isArray(attendees) && attendees.length > 0) {
        descLines.push(`----------------------------------------`);
        descLines.push(`👥 CONVOCADOS / ASISTENTES:`);
        attendees.forEach((a: string) => descLines.push(`• ${a}`));
      }

      // Notes
      if (r.notas && r.notas.trim()) {
        descLines.push(`----------------------------------------`);
        descLines.push(`📝 OBJETIVO / NOTAS DEL ENSAYO:`);
        descLines.push(r.notas.trim());
      }

      const descriptionFormatted = escapeIcsText(descLines.join("\n"));
      const locationFormatted = escapeIcsText(r.lugar || "Local de Ensayo");

      ics.push(
        "BEGIN:VEVENT",
        `UID:rehearsal-${r.id || Math.random().toString(36).substring(2, 9)}@bandmanager.io`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART;VALUE=DATE:${start}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:🥁 ${prefix}Ensayo: ${r.lugar || "Local"} (${r.hora || "20:00"})`,
        `DESCRIPTION:${descriptionFormatted}`,
        `LOCATION:${locationFormatted}`,
        "STATUS:CONFIRMED",
        "TRANSP:OPAQUE",
        "END:VEVENT"
      );
    });

    ics.push("END:VCALENDAR");

    // Standard RFC 5545 line folding (max 75 UTF-8 octets/bytes per line, folding with CRLF + space)
    const foldIcsLines = (lines: string[]) => {
      const foldedLines: string[] = [];
      for (const line of lines) {
        const lineBuffer = Buffer.from(line, "utf8");
        if (lineBuffer.length <= 75) {
          foldedLines.push(line);
          continue;
        }

        let offset = 0;
        let isFirstChunk = true;
        const chunks: string[] = [];

        while (offset < lineBuffer.length) {
          const maxBytes = isFirstChunk ? 75 : 74;
          let chunkEnd = Math.min(offset + maxBytes, lineBuffer.length);

          // Ensure we do not split a multi-byte UTF-8 character in the middle
          if (chunkEnd < lineBuffer.length) {
            while (chunkEnd > offset && (lineBuffer[chunkEnd] & 0xc0) === 0x80) {
              chunkEnd--;
            }
          }

          const chunkStr = lineBuffer.toString("utf8", offset, chunkEnd);
          if (isFirstChunk) {
            chunks.push(chunkStr);
            isFirstChunk = false;
          } else {
            chunks.push(" " + chunkStr);
          }
          offset = chunkEnd;
        }

        foldedLines.push(chunks.join("\r\n"));
      }
      return foldedLines.join("\r\n") + "\r\n";
    };

    const content = foldIcsLines(ics);
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Content-Disposition", `inline; filename="calendar-${bandIds.join('-')}.ics"`);
    res.send(content);
  } catch (err: any) {
    console.error("Error generating .ics feed:", err);
    res.status(500).send("Error generando archivo de calendario");
  }
});

export default router;
