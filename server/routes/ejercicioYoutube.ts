// Página estática del ejercicio de YouTube («CRM para bandas»): /ejercicio_youtube_crm sin extensión.
// express.static se monta con index:false, así que solo el .html suelto (public/ejercicio_youtube_crm.html) se sirve
// por sí mismo. Sin datos de bandas. La ruta es literal para que `npm run docs:api` la vea.
import express from 'express';
import path from 'node:path';
import { publicoRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

export const ARCHIVO_EJERCICIO_YOUTUBE = () => path.join(process.cwd(), 'dist', 'ejercicio_youtube_crm.html');

router.get('/ejercicio_youtube_crm', publicoRateLimiter, (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  // Si el archivo no existe (desarrollo, sin build), se deja pasar a la SPA en vez de romper con un 500.
  res.sendFile(ARCHIVO_EJERCICIO_YOUTUBE(), (err) => { if (err) next(); });
});

export default router;
