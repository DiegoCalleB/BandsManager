// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import express from 'express';
import structureUploadRouter from './structureUpload.js';

const router = express.Router();

// Mount sub-routers for songs
router.use('/songs', structureUploadRouter);

export default router;
