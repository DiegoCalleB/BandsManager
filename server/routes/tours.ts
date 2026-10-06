// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import express from "express";
import { requireAuth } from "../state.js";
import { toursController } from "../controllers/tours.controller.js";

const router = express.Router();

router.get("/tours", requireAuth, toursController.getTours);
router.post("/tours", requireAuth, toursController.createTour);
router.put("/tours/:id", requireAuth, toursController.updateTour);
router.delete("/tours/:id", requireAuth, toursController.deleteTour);

export default router;
