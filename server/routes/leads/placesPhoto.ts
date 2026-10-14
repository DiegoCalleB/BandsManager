// GET /api/places/photo: foto de Google Places sin exponer la API key (ver server/utils/placesPhoto.ts).
import express from "express";
import { createRateLimiter } from "../../middleware/rateLimiter.js";
import { esNombreFotoPlacesValido, urlMediaPlaces, destinoFotoPlacesSeguro } from "../../utils/placesPhoto.js";

const router = express.Router();

// Pública porque la pide un <img> (sin cabecera de sesión). El nombre se valida contra el formato de
// recurso de Places y hay tope por IP: solo sirve para ver fotos de Places, no para usar la clave.
const fotoPlacesRateLimiter = createRateLimiter({ nombre: "places-foto", windowMs: 60 * 1000, maxRequests: 300 });

router.get("/places/photo", fotoPlacesRateLimiter, async (req, res) => {
  const nombre = req.query.name;
  const placesApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.VITE_GOOGLE_PLACES_API_KEY || "";
  if (!esNombreFotoPlacesValido(nombre)) return res.status(400).json({ error: "Foto no válida." });
  if (!placesApiKey) return res.status(404).end();
  try {
    const r = await fetch(urlMediaPlaces(nombre), {
      headers: { "X-Goog-Api-Key": placesApiKey },
      signal: AbortSignal.timeout(10_000)
    });
    const datos = r.ok ? ((await r.json()) as { photoUri?: string }) : null;
    const destino = destinoFotoPlacesSeguro(datos?.photoUri);
    if (!destino) return res.status(404).end();
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.redirect(302, destino);
  } catch {
    return res.status(502).end();
  }
});

export default router;
