import express from "express";
import { requireAuth, loadState, saveState } from "../state.js";
import {
  searchSpotifyArtists,
  getArtistCompleteDiscography,
  bulkImportSpotifyDiscographyToBand,
  extractSpotifyArtistId,
  findAudioPreview
} from "../services/spotifyService.js";

const router = express.Router();

/**
 * GET /api/spotify/status
 * Returns whether Spotify client credentials are provided or running in public mode.
 */
router.get("/status", (req, res) => {
  const hasClientCredentials = Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
  res.json({
    success: true,
    hasClientCredentials,
    mode: hasClientCredentials ? "official_oauth" : "public_client"
  });
});

/**
 * GET /api/spotify/preview?artist=Bakandeya&track=Clandestino
 * Resolves high-quality 30-second audio stream URL for any track.
 */
router.get("/preview", async (req, res) => {
  try {
    const artist = String(req.query.artist || "").trim();
    const track = String(req.query.track || "").trim();
    if (!track) {
      return res.status(400).json({ error: "Parámetro 'track' es requerido." });
    }
    const previewUrl = await findAudioPreview(artist, track);
    res.json({ success: true, previewUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error al buscar preview." });
  }
});

/**
 * GET /api/spotify/search?q=Bakandeya
 * Searches artists or resolves artist URL on Spotify.
 */
router.get("/search", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    if (!query) {
      return res.status(400).json({ error: "El parámetro de búsqueda 'q' es obligatorio." });
    }

    const artists = await searchSpotifyArtists(query);
    res.json({ success: true, artists });
  } catch (err: any) {
    console.error("[SpotifyRoute] Search error:", err);
    res.status(500).json({ error: err.message || "Error al buscar en Spotify." });
  }
});

/**
 * GET /api/spotify/artist-discography?query=Bakandeya
 * Fetches the entire discography (all albums, singles, tracks, preview audio) of an artist.
 */
router.get("/artist-discography", async (req, res) => {
  try {
    const query = String(req.query.query || req.query.artistId || "").trim();
    if (!query) {
      return res.status(400).json({ error: "Debes proporcionar el nombre de la banda o su enlace de Spotify." });
    }

    const discography = await getArtistCompleteDiscography(query);
    res.json({ success: true, discography });
  } catch (err: any) {
    console.error("[SpotifyRoute] Discography error:", err);
    res.status(500).json({ error: err.message || "Error al obtener la discografía de Spotify." });
  }
});

/**
 * POST /api/spotify/import-discography
 * Imports selected albums and songs into Supabase for the current band.
 */
router.post("/import-discography", requireAuth, async (req, res) => {
  try {
    const { artist, selectedAlbums, options } = req.body;
    if (!selectedAlbums || !Array.isArray(selectedAlbums) || selectedAlbums.length === 0) {
      return res.status(400).json({ error: "No se han seleccionado álbumes para importar." });
    }

    const userBandId = (req as any).user?.band_id || "bakandeya";
    const result = await bulkImportSpotifyDiscographyToBand(
      userBandId,
      artist,
      selectedAlbums,
      options || { overwriteDuplicates: false, updateEpkSpotifyUrl: true }
    );

    // Update in-memory state if applicable
    const state = loadState();
    state.songs = result.allBandSongs as any;
    saveState(state);

    res.json(result);
  } catch (err: any) {
    console.error("[SpotifyRoute] Import error:", err);
    res.status(500).json({ error: err.message || "Error al importar la discografía de Spotify." });
  }
});

export default router;
