import express from "express";
import { Rehearsal, Concert, Payment, Message } from "../../src/types.js";
import { loadState, saveState, requireAuth, requireLeader } from "../state.js";
import {
  dbGetRehearsals,
  dbUpsertRehearsal,
  dbGetConcerts,
  dbUpsertConcert,
  dbGetPayments,
  dbUpsertPayment,
  dbGetRunOfShow,
  dbSyncRunOfShowForDate,
  dbGetGearChecklists,
  dbSyncGearChecklistForDate
} from "../db.js";

const router = express.Router();

// Update rehearsal
router.put("/rehearsals/:id", requireAuth, async (req, res) => {
  try {
    const userBandId = (req as any).user?.band_id ;
    const { id } = req.params;
    const updated = { ...req.body, id };
    const saved = await dbUpsertRehearsal(updated, userBandId);
    
    const state = loadState();
    const idx = state.rehearsals.findIndex((r: Rehearsal) => r.id === id);
    if (idx !== -1) {
      state.rehearsals[idx] = saved as any;
    } else {
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
    const userBandId = (req as any).user?.band_id ;
    const newRehearsal: Rehearsal = req.body;
    if (!(newRehearsal as any).band_id) {
      (newRehearsal as any).band_id = userBandId;
    }
    const saved = await dbUpsertRehearsal(newRehearsal, userBandId);
    
    const state = loadState();
    state.rehearsals.push(saved as any);
    saveState(state);
    res.json({ success: true, rehearsal: saved });
  } catch (err: any) {
    console.error("Error creating rehearsal:", err);
    res.status(500).json({ error: err?.message || "Error al crear ensayo." });
  }
});

// Update concert
router.put("/concerts/:id", requireAuth, async (req, res) => {
  try {
    const userBandId = (req as any).user?.band_id ;
    const { id } = req.params;
    const updated = { ...req.body, id };
    const saved = await dbUpsertConcert(updated, userBandId);

    const state = loadState();
    const idx = state.concerts.findIndex((c: Concert) => c.id === id);
    if (idx !== -1) {
      state.concerts[idx] = saved as any;
    } else {
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
    const userBandId = (req as any).user?.band_id ;
    const newConcert: Concert = req.body;
    if (!(newConcert as any).band_id) {
      (newConcert as any).band_id = userBandId;
    }
    const saved = await dbUpsertConcert(newConcert, userBandId);

    const state = loadState();
    state.concerts.push(saved as any);
    saveState(state);
    res.json({ success: true, concert: saved });
  } catch (err: any) {
    console.error("Error creating concert:", err);
    res.status(500).json({ error: err?.message || "Error al crear concierto." });
  }
});

// Sync all concerts with Supabase
router.post("/concerts/sync", requireAuth, async (req, res) => {
  const userBandId = (req as any).user?.band_id ;
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
router.get("/logistics", async (req, res) => {
  const queryBandId = (req.query.band_id as string) || (req.query.band as string);
  const userBandId = (req as any).user?.band_id || queryBandId || "band-bakandeya";
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
router.post("/logistics/runofshow", async (req, res) => {
  const queryBandId = (req.query.band_id as string) || (req.body.band_id as string);
  const userBandId = (req as any).user?.band_id || queryBandId || "band-bakandeya";
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
router.post("/logistics/gear", async (req, res) => {
  const queryBandId = (req.query.band_id as string) || (req.body.band_id as string);
  const userBandId = (req as any).user?.band_id || queryBandId || "band-bakandeya";
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
  const userBandId = (req as any).user?.band_id ;
  try {
    const dbPayments = await dbGetPayments(userBandId);
    res.json(dbPayments);
  } catch (err) {
    const state = loadState();
    res.json(state.payments || []);
  }
});

// Create payment (Admin only)
router.post("/payments", requireAuth, requireLeader, async (req, res) => {
  const userBandId = (req as any).user?.band_id ;
  const newPayment: Payment = req.body;
  const saved = await dbUpsertPayment(newPayment, userBandId);

  const state = loadState();
  state.payments.push(saved as any);
  saveState(state);
  
  res.json({ success: true, payment: saved });
});

// Update payment status (Admin only)
router.put("/payments/:id", requireAuth, requireLeader, async (req, res) => {
  const userBandId = (req as any).user?.band_id ;
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
  const userBandId = (req as any).user?.band_id ;
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

// Export Band Calendar as standard iCalendar (.ics) feed
router.get("/calendar.ics", async (req, res) => {
  try {
    const bandIdQuery = (req.query.band_id as string) || (req.query.band as string) || "band-bakandeya";
    const userQuery = (req.query.user_id as string) || "";
    
    let bandIds: string[] = [];
    if (bandIdQuery.includes(",")) {
      bandIds = bandIdQuery.split(",").map(b => b.trim()).filter(Boolean);
    } else {
      bandIds = [bandIdQuery];
    }

    const concerts = await dbGetConcerts(bandIds.length > 1 ? bandIds : bandIds[0]);
    const rehearsals = await dbGetRehearsals(bandIds.length > 1 ? bandIds : bandIds[0]);

    const pad = (n: number) => String(n).padStart(2, "0");
    const formatIcsDate = (dateStr: string, isAllDay = true) => {
      const clean = dateStr.replace(/[^0-9]/g, "");
      if (clean.length === 8) {
        return clean;
      }
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
      }
      return clean;
    };

    const calTitle = bandIds.length > 1 ? "BandManager - Mis Bandas" : `BandManager - ${bandIds[0].replace(/^band-/, "").toUpperCase()}`;

    let ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//BandManager.ai//ES",
      `X-WR-CALNAME:${calTitle}`,
      "X-WR-CALDESC:Sincronización automática de conciertos y ensayos de BandManager.ai",
      "X-PUBLISHED-TTL:PT1H",
      "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH"
    ];

    // Add Concerts
    concerts.forEach((c: any) => {
      const start = (c.fecha || "").replace(/[^0-9]/g, "").slice(0, 8);
      if (!start) return;
      const bTag = c.band_name || (c.band_id ? c.band_id.replace(/^band-/, '').toUpperCase() : '');
      const prefix = bTag ? `[${bTag}] ` : '';
      ics.push(
        "BEGIN:VEVENT",
        `UID:concert-${c.id}@bandmanager.ai`,
        `DTSTAMP:${formatIcsDate(new Date().toISOString(), false)}`,
        `DTSTART;VALUE=DATE:${start}`,
        `SUMMARY:🎸 ${prefix}Concierto: ${c.sala || "Directo"} (${c.ciudad || "Ciudad"})`,
        `DESCRIPTION:Banda: ${bTag || "Principal"}\\nCaché: ${c.cache || 0}€ | Aforo: ${c.aforo_total || 0} | Estado pago: ${c.estado_pago || "pendiente"}\\nNotas: ${(c.notas || "").replace(/\n/g, "\\n")}`,
        `LOCATION:${c.sala || ""}, ${c.ciudad || ""}`,
        "STATUS:CONFIRMED",
        "END:VEVENT"
      );
    });

    // Add Rehearsals
    rehearsals.forEach((r: any) => {
      const start = (r.fecha || "").replace(/[^0-9]/g, "").slice(0, 8);
      if (!start) return;
      const bTag = r.band_id ? r.band_id.replace(/^band-/, '').toUpperCase() : '';
      const prefix = bTag ? `[${bTag}] ` : '';
      ics.push(
        "BEGIN:VEVENT",
        `UID:rehearsal-${r.id}@bandmanager.ai`,
        `DTSTAMP:${formatIcsDate(new Date().toISOString(), false)}`,
        `DTSTART;VALUE=DATE:${start}`,
        `SUMMARY:🥁 ${prefix}Ensayo: ${r.lugar || "Local de Ensayo"}`,
        `DESCRIPTION:Objetivos: ${(r.objetivo || "Ensayo general").replace(/\n/g, "\\n")}`,
        `LOCATION:${r.lugar || "Local"}`,
        "STATUS:CONFIRMED",
        "END:VEVENT"
      );
    });

    ics.push("END:VCALENDAR");

    const content = ics.join("\r\n");
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Content-Disposition", `inline; filename="calendar-${bandIds.join('-')}.ics"`);
    res.send(content);
  } catch (err: any) {
    console.error("Error generating .ics feed:", err);
    res.status(500).send("Error generando archivo de calendario");
  }
});

export default router;
