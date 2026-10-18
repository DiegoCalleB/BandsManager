// Agregador del dominio leads: monta los sub-routers de `./leads/` (y el catálogo de salas, que alimenta la
// agenda de leads) y reexporta `getGlobalPitchFeedbackSummary`.

import express from "express";
import crudRouter from "./leads/crud.js";
import enrichmentRouter from "./leads/enrichment.js";
import simulationRouter from "./leads/simulation.js";
import templatesRouter from "./leads/templates.js";
import pitchRouter from "./leads/pitch.js";
import placesRouter from "./leads/places.js";
import placesPhotoRouter from "./leads/placesPhoto.js";
import importRouter from "./leads/import.js";
import exampleThreadsRouter from "./leads/exampleThreads.js";
import replyRouter from "./leads/reply.js";
import emailValidationRouter from "./leads/emailValidation.js";
import catalogoRouter from "./catalogo.js";

export * from "./leads/feedback.js";

const router = express.Router();

router.use(crudRouter);
router.use(enrichmentRouter);
router.use(simulationRouter);
router.use(templatesRouter);
router.use(pitchRouter);
router.use(placesRouter);
router.use(placesPhotoRouter);
router.use(importRouter);
router.use(exampleThreadsRouter);
router.use(replyRouter);
router.use(emailValidationRouter);
router.use(catalogoRouter);

export default router;
