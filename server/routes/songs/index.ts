import express from 'express';
import structureUploadRouter from './structureUpload.js';

const router = express.Router();

// Mount sub-routers for songs
router.use('/songs', structureUploadRouter);

export default router;
