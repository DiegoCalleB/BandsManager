// Rutas de giras; la lógica vive en `server/controllers/` (capa fina routes → controller).

import express from "express";
import { requireAuth, requireLeader } from "../state.js";
import { toursController } from "../controllers/tours.controller.js";

const router = express.Router();

router.get("/tours", requireAuth, toursController.getTours);
router.post("/tours", requireAuth, requireLeader, toursController.createTour);
router.put("/tours/:id", requireAuth, requireLeader, toursController.updateTour);
router.delete("/tours/:id", requireAuth, requireLeader, toursController.deleteTour);

export default router;
