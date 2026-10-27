// Router de `/songs`: monta los sub-routers de subida de estructura y de ajuste de compases.

import express from 'express';
import structureUploadRouter from './structureUpload.js';
import ajusteCompasesRouter from './ajusteCompases.js';

const router = express.Router();

// Mount sub-routers for songs
router.use('/songs', structureUploadRouter);
router.use('/songs', ajusteCompasesRouter);

export default router;
