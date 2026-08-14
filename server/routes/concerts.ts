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
  const userBandId = (req as any).user?.band_id ;
  try {
    const runOfShow = await dbGetRunOfShow(userBandId);
    const gearChecklists = await dbGetGearChecklists(userBandId);
    res.json({ runOfShow, gearChecklists });
  } catch (err) {
    const state = loadState();
    res.json({
      runOfShow: state.runOfShow || {},
      gearChecklists: state.gearChecklists || {}
    });
  }
});

// Update/set run of show for a date
router.post("/logistics/runofshow", requireAuth, async (req, res) => {
  const userBandId = (req as any).user?.band_id ;
  const { dateKey, items } = req.body;
  if (!dateKey || !Array.isArray(items)) {
    return res.status(400).json({ error: "dateKey and items array required" });
  }
  await dbSyncRunOfShowForDate(dateKey, items, userBandId);

  const state = loadState();
  if (!state.runOfShow) state.runOfShow = {};
  state.runOfShow[dateKey] = items;
  saveState(state);
  res.json({ success: true, dateKey, items });
});

// Update/set gear checklist for a date
router.post("/logistics/gear", requireAuth, async (req, res) => {
  const userBandId = (req as any).user?.band_id ;
  const { dateKey, items } = req.body;
  if (!dateKey || !Array.isArray(items)) {
    return res.status(400).json({ error: "dateKey and items array required" });
  }
  await dbSyncGearChecklistForDate(dateKey, items, userBandId);

  const state = loadState();
  if (!state.gearChecklists) state.gearChecklists = {};
  state.gearChecklists[dateKey] = items;
  saveState(state);
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

export default router;
