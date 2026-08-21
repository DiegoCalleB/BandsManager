import express from "express";
import { requireAuth } from "../state.js";
import { loadState, saveState } from "../state.js";
import { dbGetBandContacts, dbUpsertBandContact, dbDeleteBandContact, dbGetBandSchedule, dbUpsertBandSchedule } from "../db.js";
import { getAiClient, generateContentWithFallback } from "../ai.js";
import { autoEnrichBandContact } from "../auto_enrichment.js";

const router = express.Router();

// Helper to check if URL is a generic directory or social profile
function isBadDirectoryUrl(url: string): boolean {
  if (!url) return true;
  const badDomains = ['salasdeconciertos.com', 'tripadvisor', 'facebook.com', 'instagram.com', 'yelp.', 'google.com', 'foursquare.com', 'residentadvisor.net', 'twitter.com', 'x.com', 'tiktok.com', 'guiadelocio.com'];
  const lower = url.toLowerCase();
  return badDomains.some(d => lower.includes(d));
}

function getDomainFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch (_) { return null; }
}

async function scrapeWebsiteLogo(candidateWebsites: (string | undefined)[], email?: string, nombreBanda?: string): Promise<{ logo: string; workingWebsite: string } | null> {
  const candidateUrls: string[] = [];
  for (const site of candidateWebsites) {
    if (site && !isBadDirectoryUrl(site)) {
      let url = site.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
      if (!candidateUrls.includes(url)) candidateUrls.push(url);
    }
  }

  for (const siteUrl of candidateUrls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(siteUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
      });
      clearTimeout(timeout);
      if (!res.ok) continue;
      const html = await res.text();
      const appleIcon = html.match(/<link\s+[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i);
      if (appleIcon && appleIcon[1]) return { logo: new URL(appleIcon[1].trim(), siteUrl).href, workingWebsite: siteUrl };
      
      const imgMatches = [...html.matchAll(/<img\s+[^>]*src=["']([^"']*(?:logo|brand)[^"']*)["']/gi)];
      for (const m of imgMatches) {
        if (!m[1].toLowerCase().includes('banner')) return { logo: new URL(m[1].trim(), siteUrl).href, workingWebsite: siteUrl };
      }
      
      const domain = getDomainFromUrl(siteUrl);
      if (domain) return { logo: `https://icon.horse/icon/${domain}`, workingWebsite: siteUrl };
    } catch (_) {}
  }
  return null;
}

function sanitizeLogoUrl(imgUrl: string, websiteUrl?: string, instagram?: string): string {
  let cleaned = (imgUrl || '').trim();
  if (cleaned.includes('googleusercontent.com') || cleaned.includes('clearbit.com')) cleaned = '';
  if (cleaned && (/\.(jpg|jpeg|png|webp|svg)($|\?)/i.test(cleaned) || cleaned.includes('icon.horse'))) return cleaned;
  if (instagram) {
    const handle = instagram.replace(/.*instagram\.com\//, '').replace(/^@/, '').split('/')[0].split('?')[0].trim();
    if (handle.length > 1) return `https://unavatar.io/instagram/${handle}`;
  }
  if (websiteUrl && !isBadDirectoryUrl(websiteUrl)) {
    const domain = getDomainFromUrl(websiteUrl);
    if (domain && domain.includes('.')) return `https://icon.horse/icon/${domain}`;
  }
  return '';
}


router.get("/bands", requireAuth, async (req, res) => {
  const userBandId = (req as any).user?.band_id ;
  try {
    const dbBands = await dbGetBandContacts(userBandId);
    const state = loadState();
    state.bands = dbBands;
    saveState(state);
    res.json({ bands: dbBands });
  } catch (err: any) {
    console.warn("Notice loading bands from Supabase, fallback to state:", err?.message || err);
    const state = loadState();
    res.json({ bands: state.bands || [] });
  }
});

router.post("/bands", requireAuth, async (req, res) => {
  const userBandId = (req as any).user?.band_id ;
  const newBand = req.body;
  if (!newBand.band_id) {
    newBand.band_id = userBandId;
  }
  try {
    const saved = await dbUpsertBandContact(newBand, userBandId);
    const state = loadState();
    state.bands = state.bands || [];
    const idx = state.bands.findIndex((b: any) => b.id === saved.id);
    if (idx !== -1) {
      state.bands[idx] = saved;
    } else {
      state.bands.push(saved);
    }
    saveState(state);

    autoEnrichBandContact(saved, userBandId).catch(err => console.error("Error autoEnrichBandContact background:", err));

    res.json(saved);
  } catch (err: any) {
    console.error("Error creating band contact:", err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

router.put("/bands/:id", requireAuth, async (req, res) => {
  const userBandId = (req as any).user?.band_id ;
  const { id } = req.params;
  const updatedBand = { ...req.body, id };
  try {
    const saved = await dbUpsertBandContact(updatedBand, userBandId);
    const state = loadState();
    state.bands = state.bands || [];
    state.bands = state.bands.map((b: any) => b.id === id ? saved : b);
    saveState(state);

    autoEnrichBandContact(saved, userBandId).catch(err => console.error("Error autoEnrichBandContact background:", err));

    res.json(saved);
  } catch (err: any) {
    console.error("Error updating band contact:", err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

router.delete("/bands/:id", requireAuth, async (req, res) => {
  const userBandId = (req as any).user?.band_id ;
  const { id } = req.params;
  try {
    await dbDeleteBandContact(id, userBandId);
    const state = loadState();
    state.bands = state.bands || [];
    state.bands = state.bands.filter((b: any) => b.id !== id);
    saveState(state);
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting band contact:", err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

router.post("/bands/sync", requireAuth, async (req, res) => {
  const userBandId = (req as any).user?.band_id ;
  const { bands } = req.body;
  if (!Array.isArray(bands)) {
    return res.status(400).json({ error: "Invalid data format." });
  }

  try {
    for (const band of bands) {
      await dbUpsertBandContact(band, userBandId);
    }

    const state = loadState();
    state.bands = bands;
    saveState(state);

    res.json({ success: true, count: bands.length });
  } catch (err: any) {
    console.error("Error syncing bands:", err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

router.post("/bands/ai-lookup", requireAuth, async (req, res) => {
  const { nombre_banda, localizacion, bandId } = req.body;
  if (!nombre_banda) {
    return res.status(400).json({ error: "Nombre de banda requerido" });
  }

  const client = getAiClient();
  if (!client) {
    return res.status(500).json({ error: "Servicio de IA no disponible." });
  }

  const prompt = `Busca información pública sobre la banda musical "${nombre_banda}" ${localizacion ? `de ${localizacion}` : ''}.
Devuelve EXCLUSIVAMENTE un objeto JSON:
{
  "estilo_musical": "género",
  "localizacion": "origen",
  "biografia": "resumen",
  "instagram": "URL instagram",
  "spotify_url": "enlace a spotify",
  "youtube_url": "enlace a canal de youtube",
  "contacto_nombre": "nombre de contacto",
  "email": "email público",
  "imagen_url": "URL logo oficial",
  "icono": "emoji característico"
}`;

  try {
    const response = await generateContentWithFallback(client, {
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    });

    const text = response.text || "{}";
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(cleanedText.substring(cleanedText.indexOf('{'), cleanedText.lastIndexOf('}') + 1));

    // Robust enrichment
    const instagram = data.instagram || "";
    // If instagram URL, extract handle
    const instaHandle = instagram.replace(/.*instagram\.com\//, '').replace(/^@/, '').split('/')[0].split('?')[0].trim();
    
    const website = data.spotify_url || data.youtube_url || "";
    const scrapedLogoObj = await scrapeWebsiteLogo([website], data.email, nombre_banda);
    
    // Improved sanitize: prefer unavatar for Instagram handles if logo not found
    let finalLogo = sanitizeLogoUrl(scrapedLogoObj?.logo || data.imagen_url || "", scrapedLogoObj?.workingWebsite || website, instagram);
    
    if (!finalLogo && instaHandle.length > 1) {
      finalLogo = `https://unavatar.io/instagram/${instaHandle}`;
    }

    data.imagen_url = finalLogo;
    data.website = scrapedLogoObj?.workingWebsite || website;

    res.json({ success: true, data });
  } catch (err: any) {
    console.error("Error in AI lookup:", err);
    res.status(500).json({ error: "No se pudo consultar información." });
  }
});

router.post("/bands/analyze-tone", requireAuth, async (req, res) => {
  const { nombre_entidad, instagram, estilo_musical, localizacion, tipo, is_sender, save_to_band_id } = req.body;
  if (!nombre_entidad) {
    return res.status(400).json({ error: "Nombre de la entidad requerido" });
  }

  const client = getAiClient();
  if (!client) {
    return res.status(500).json({ error: "Servicio de IA no disponible o API key no configurada." });
  }

  const isBakandeyaOrSender = is_sender || nombre_entidad.toLowerCase().includes("bakandeya");

  const prompt = `Actúa como un experto lingüista y analista de comunicación musical especializado en redes sociales (Instagram Reels, Posts, TikTok, YouTube Shorts, entrevistas y notas de prensa).

OBJETIVO: Analizar en profundidad la FORMA DE HABLAR, EL ADN DE EXPRESIÓN Y EL TONO DE COMUNICACIÓN de la siguiente entidad musical:
- Nombre de la Entidad: "${nombre_entidad}"
- Rol: ${isBakandeyaOrSender ? "Banda EMISORA de la propuesta (nuestro perfil)" : "Entidad RECEPTORA / Objetivo"}
- Tipo: ${tipo || "Banda / Artista / Sala / Festival"}
- Instagram / Handle: ${instagram || "No especificado"}
- Estilo Musical: ${estilo_musical || "No especificado"}
- Localización: ${localizacion || "No especificada"}

INSTRUCCIONES DE BÚSQUEDA Y EXTRACCIÓN (SEARCH GROUNDING):
1. Rastrear con precisión sus publicaciones recientes en Instagram (@${instagram || nombre_entidad}), Reels, captions de vídeo, TikToks, entrevistas o canal oficial.
2. Extraer frases literales o expresiones muletillas reales que usen en sus Reels/Posts (ej: "chavales", "pogo en el barro", "aúpa familia", "nos vemos en las trincheras", "fuck yeah", "teatralidad e ironía", etc.).
3. Determinar su tono (¿informal/fiestero, provocador/gótico, elegante/institucional, enérgico, académico, callejero?), su nivel de energía, tratamiento habitual (Tú/Vosotros vs Usted) y vocabulario icónico.
4. Redactar una propuesta de contacto o correo electrónico en la que:
   - Si es la banda emisora (Bakandeya): El correo transmite fielmente la energía festiva y directa de Bakandeya (balkan-ska, violín enérgico, sustitución de metales por sintetizador).
   - Si es un grupo destino (ej: Marilyn Manson, Ska-P, etc.): La propuesta se adapta para utilizar referencias, vocabulario y tono que conecten con la personalidad del grupo destino sin perder la esencia de Bakandeya.

Devuelve EXCLUSIVAMENTE un objeto JSON válido con la siguiente estructura exacta:

{
  "nombre_entidad": "${nombre_entidad}",
  "es_emisor": ${isBakandeyaOrSender ? "true" : "false"},
  "redes_rastreadas": ["Instagram Reels @...", "TikTok", "Prensa / Web oficial"],
  "tono_comunicacion": "Resumen conciso de 1-2 frases del ADN y estilo de voz",
  "tratamiento_habitual": "Tú / Colegueo",
  "nivel_energia": "Alta / Explosiva",
  "vocabulario_clave": ["palabra1", "palabra2", "palabra3", "palabra4"],
  "frases_emblematicas_extraidas": [
    "Frase literal extraída de sus Reels o publicaciones",
    "Otra expresión o muletilla característica"
  ],
  "emojis_frecuentes": ["🔥", "⚡", "🎷", "🍻"],
  "valores_e_intereses": ["autogestión", "música en directo", "directos potentes"],
  "puntos_fuertes_para_conectar": "Cómo conectar esta forma de hablar con una propuesta de concierto/co-booking",
  "recomendacion_pitch": "Consejo lingüístico para redactarles correos de forma auténtica",
  "pitch_personalizado_ejemplo": "Texto completo del email o mensaje de presentación adaptado exactamente a esta forma de expresarse"
}`;

  try {
    const response = await generateContentWithFallback(client, {
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "{}";
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonStart = cleanedText.indexOf('{');
    const jsonEnd = cleanedText.lastIndexOf('}');
    
    let data: any = {};
    if (jsonStart !== -1 && jsonEnd !== -1) {
      data = JSON.parse(cleanedText.substring(jsonStart, jsonEnd + 1));
    } else {
      data = JSON.parse(cleanedText);
    }

    // Persist in state if requested or if band_id provided
    if (save_to_band_id) {
      const state = loadState();
      state.bands = state.bands || [];
      const bandIdx = state.bands.findIndex((b: any) => b.id === save_to_band_id || b.band_id === save_to_band_id);
      if (bandIdx !== -1) {
        state.bands[bandIdx].estilo_comunicacion = data.tono_comunicacion || state.bands[bandIdx].estilo_comunicacion;
        state.bands[bandIdx].dna_expresion = data;
        saveState(state);
      }
    }
    
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("Error in Tone Analysis:", err);
    res.status(500).json({ error: "No se pudo analizar el tono de comunicación.", details: err?.message || String(err) });
  }
});

// --------------------------------------------------
// BAND SCHEDULES (Smart Gate - Python agent config)
// --------------------------------------------------
router.get("/bands/schedules/:bandId", async (req, res) => {
  try {
    const { bandId } = req.params;
    const schedule = await dbGetBandSchedule(bandId);
    res.json(schedule);
  } catch (err: any) {
    console.error("Error fetching band schedule:", err);
    res.status(500).json({ error: "Error al obtener el horario de la banda" });
  }
});

router.post("/bands/schedules", async (req, res) => {
  try {
    const { band_id, timezone, horas_lector, horas_enviador, dias_enviador, dias_lector } = req.body;
    if (!band_id) {
      return res.status(400).json({ error: "band_id es requerido" });
    }
    const updated = await dbUpsertBandSchedule({
      band_id,
      timezone: timezone || "Europe/Madrid",
      horas_lector: horas_lector || [],
      horas_enviador: horas_enviador || [],
      dias_enviador: dias_enviador || [],
      dias_lector: dias_lector || []
    });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    console.error("Error saving band schedule:", err);
    res.status(500).json({ error: "Error al guardar el horario de la banda" });
  }
});

export default router;
