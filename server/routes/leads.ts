import express from "express";
import crudRouter from "./leads/crud.js";
import enrichmentRouter from "./leads/enrichment.js";
import simulationRouter from "./leads/simulation.js";
import templatesRouter from "./leads/templates.js";
import pitchRouter from "./leads/pitch.js";
import placesRouter from "./leads/places.js";
import importRouter from "./leads/import.js";
import exampleThreadsRouter from "./leads/exampleThreads.js";
import replyRouter from "./leads/reply.js";
import emailValidationRouter from "./leads/emailValidation.js";
import unsubscribeRouter from "./leads/unsubscribe.js";

export * from "./leads/feedback.js";

const router = express.Router();

router.use(crudRouter);
router.use(enrichmentRouter);
router.use(simulationRouter);
router.use(templatesRouter);
router.use(pitchRouter);
router.use(placesRouter);
router.use(importRouter);
router.use(exampleThreadsRouter);
router.use(replyRouter);
router.use(emailValidationRouter);
router.use(unsubscribeRouter);

export default router;
