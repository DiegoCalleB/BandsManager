import express from "express";
import crudRouter from "./leads/crud.js";
import enrichmentRouter from "./leads/enrichment.js";
import simulationRouter from "./leads/simulation.js";
import templatesRouter from "./leads/templates.js";
import pitchRouter from "./leads/pitch.js";
import placesRouter from "./leads/places.js";
import importRouter from "./leads/import.js";

export * from "./leads/feedback.js";

const router = express.Router();

router.use(crudRouter);
router.use(enrichmentRouter);
router.use(simulationRouter);
router.use(templatesRouter);
router.use(pitchRouter);
router.use(placesRouter);
router.use(importRouter);

export default router;
