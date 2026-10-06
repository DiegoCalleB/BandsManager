// Router de `/songs`: monta los sub-routers de subida de estructura.

import express from 'express';
import structureUploadRouter from './structureUpload.js';

const router = express.Router();

// Mount sub-routers for songs
router.use('/songs', structureUploadRouter);

export default router;
