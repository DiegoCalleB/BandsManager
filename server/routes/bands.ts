import express from "express";
import { requireAuth } from "../state.js";
import { loadState, saveState } from "../state.js";
import { dbGetBandContacts, dbUpsertBandContact, dbDeleteBandContact, dbBulkDeleteBandContacts, dbGetBandSchedule, dbUpsertBandSchedule, dbGetBandEmailAccount, dbUpsertBandEmailAccount, toSafeEmailAccountResponse, dbUpdateBandToneDna, dbGetRegisteredBandById, dbGetEpkConfig } from "../db.js";
import { getAiClient, generateContentWithFallback } from "../ai.js";
import { autoEnrichBandContact } from "../auto_enrichment.js";
import { esUrlExternaSegura } from "../utils/ssrfGuard.js";
import { getTargetBandId } from "../utils/bandAccess.js";
import responseStrategiesRouter from "./bands/responseStrategies.js";

const router = express.Router();

// Montar router de response strategies
router.use(responseStrategiesRouter);

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
      // Ver nota en leads/enrichment.ts: sin esto, un dominio apuntando a la red interna o al
      // endpoint de metadatos de la nube provoca que el servidor haga esa petición (SSRF).
      if (!(await esUrlExternaSegura(siteUrl))) continue;
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

router.post("/bands/bulk-delete", requireAuth, async (req, res) => {
  const userBandId = (req as any).user?.band_id;
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Debe proporcionar una lista de IDs de bandas para eliminar." });
  }
  try {
    await dbBulkDeleteBandContacts(ids, userBandId);
    const state = loadState();
    if (state.bands) {
      const idsSet = new Set(ids);
      state.bands = state.bands.filter((b: any) => !idsSet.has(b.id));
      saveState(state);
    }
    res.json({ success: true, count: ids.length });
  } catch (err: any) {
    console.error("Error bulk deleting band contacts:", err);
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

router.post("/bands/ai-scout", requireAuth, async (req, res) => {
  const { genre, city, count = 5 } = req.body;
  if (!genre && !city) {
    return res.status(400).json({ error: "Debes especificar un género o una ciudad." });
  }

  const client = getAiClient();
  if (!client) {
    return res.status(500).json({ error: "Servicio de IA no disponible." });
  }

  const prompt = `Actúa como un experto A&R y booker musical de la escena independiente.
Busca bandas musicales activas que coincidan con estos criterios:
${genre ? `- Estilo/Género Musical: afín a ${genre}` : ''}
${city ? `- Ciudad/Ubicación: ${city} (y alrededores)` : ''}

Necesito que devuelvas exactamente ${count} resultados. Prioriza bandas que tengan un nivel de popularidad intermedio (que puedan llevar entre 50 y 300 personas a una sala, ideal para co-booking o intercambio de fechas).

Devuelve EXCLUSIVAMENTE un array JSON válido con la siguiente estructura (sin formato Markdown, sin comillas triples, sólo el array JSON crudo):
[
  {
    "nombre_banda": "Nombre de la banda",
    "estilo_musical": "El género musical exacto (p. ej. 'Balkan Ska', 'Punk Rock')",
    "localizacion": "Ciudad y región de origen",
    "instagram_url": "URL de su Instagram (o déjalo vacío si no lo sabes)",
    "spotify_url": "URL de su Spotify (o vacío)",
    "youtube_url": "URL de YouTube (o vacío)",
    "aforo_promedio": 150
  }
]`;

  try {
    const response = await generateContentWithFallback(client, {
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    const resultText = response?.text || "";
    if (!resultText) {
      throw new Error("Respuesta vacía de Gemini");
    }
    
    let cleanJson = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();
    if (!cleanJson.startsWith('[')) cleanJson = `[${cleanJson}`;
    if (!cleanJson.endsWith(']')) cleanJson = `${cleanJson}]`;
    
    const parsedData = JSON.parse(cleanJson);
    res.json({ bands: parsedData });
  } catch (error: any) {
    console.error("AI Scout Error:", error);
    res.status(500).json({ error: "No se pudieron obtener resultados de la IA." });
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
  const { nombre_entidad, estilo_musical, localizacion, tipo, is_sender, save_to_band_id } = req.body;
  let { instagram } = req.body;
  if (!nombre_entidad) {
    return res.status(400).json({ error: "Nombre de la entidad requerido" });
  }

  const client = getAiClient();
  if (!client) {
    return res.status(500).json({ error: "Servicio de IA no disponible o API key no configurada." });
  }

  const isBakandeyaOrSender = is_sender || nombre_entidad.toLowerCase().includes("bakandeya");

  // Para la banda EMISORA (la propia) hay algo mejor que lo que mande el body: su EPK real,
  // que ya guarda los 4 enlaces de verdad. Antes solo se rastreaba Instagram porque era el
  // único dato que el frontend mandaba, aunque la banda tuviera TikTok, YouTube y Facebook
  // dados de alta: el ADN de tono salía sesgado a una sola red.
  let tiktok = "";
  let youtube = "";
  let facebook = "";
  // Frases reales dichas en directo (habla al público entre canciones), acumuladas por el
  // generador de Reels a partir de transcripciones de vídeos ya analizados. Es la fuente de
  // tono más auténtica que hay -sin filtro de community manager- así que se le pasa a la IA
  // como grounding real, y se conserva al guardar (la IA no la genera, solo la usa).
  let frasesDirectoExistentes: string[] = [];
  if (is_sender) {
    try {
      const ownBandId = getTargetBandId(req);
      const [epk, bandaActual] = await Promise.all([
        dbGetEpkConfig(ownBandId),
        dbGetRegisteredBandById(ownBandId)
      ]);
      const redes = epk?.enlacesRedes || {};
      instagram = redes.instagram || instagram || "";
      tiktok = redes.tiktok || "";
      youtube = redes.youtube || "";
      facebook = redes.facebook || "";
      const dnaActual = bandaActual?.dna_expresion;
      if (dnaActual && typeof dnaActual === "object" && Array.isArray(dnaActual.frases_directo_extraidas)) {
        frasesDirectoExistentes = dnaActual.frases_directo_extraidas.map((f: any) => String(f || "").trim()).filter(Boolean);
      }
    } catch (e: any) {
      console.warn("[analyze-tone] No se pudo cargar el EPK para leer las redes reales:", e?.message || e);
    }
  }

  const redesConHandle: string[] = [];
  if (instagram) redesConHandle.push(`- Instagram: ${instagram}`);
  if (tiktok) redesConHandle.push(`- TikTok: ${tiktok}`);
  if (youtube) redesConHandle.push(`- YouTube: ${youtube}`);
  if (facebook) redesConHandle.push(`- Facebook: ${facebook}`);

  const prompt = `Actúa como un experto lingüista y analista de comunicación musical especializado en redes sociales (Instagram Reels, Posts, TikTok, YouTube Shorts, Facebook, entrevistas y notas de prensa).

OBJETIVO: Analizar en profundidad la FORMA DE HABLAR, EL ADN DE EXPRESIÓN Y EL TONO DE COMUNICACIÓN de la siguiente entidad musical:
- Nombre de la Entidad: "${nombre_entidad}"
- Rol: ${isBakandeyaOrSender ? "Banda EMISORA de la propuesta (nuestro perfil)" : "Entidad RECEPTORA / Objetivo"}
- Tipo: ${tipo || "Banda / Artista / Sala / Festival"}
${redesConHandle.length ? redesConHandle.join("\n") : `- Instagram / Handle: ${instagram || "No especificado"}`}
- Estilo Musical: ${estilo_musical || "No especificado"}
- Localización: ${localizacion || "No especificada"}
${frasesDirectoExistentes.length ? `\nFRASES REALES DICHAS EN DIRECTO (extraídas de transcripciones de sus propios conciertos, hablando al público entre canciones -no letras cantadas-; es más fiable que cualquier red social porque es habla real sin filtro):\n${frasesDirectoExistentes.map((f) => `- "${f}"`).join("\n")}` : ""}

INSTRUCCIONES DE BÚSQUEDA Y EXTRACCIÓN (SEARCH GROUNDING):
1. Rastrear con precisión CADA UNA de las redes listadas arriba por separado (no solo Instagram): sus publicaciones recientes, Reels, captions de vídeo, TikToks, vídeos/descripciones de YouTube, posts de Facebook, entrevistas o canal oficial.
2. Extraer frases literales o expresiones muletillas reales que usen en sus Reels/Posts (ej: "chavales", "pogo en el barro", "aúpa familia", "nos vemos en las trincheras", "fuck yeah", "teatralidad e ironía", etc.). Si arriba hay FRASES REALES DICHAS EN DIRECTO, dales prioridad sobre lo que encuentres en redes: inclúyelas (o el vocabulario que aparezca en ellas) en "frases_emblematicas_extraidas" y "vocabulario_clave" cuando sean representativas.
3. Determinar su tono general (¿informal/fiestero, provocador/gótico, elegante/institucional, enérgico, académico, callejero?), su nivel de energía, tratamiento habitual (Tú/Vosotros vs Usted) y vocabulario icónico.
4. IMPORTANTE: el tono no es idéntico en todas las redes. Compara cómo hablan en cada una de las que tengan handle arriba: Facebook suele ser más institucional/informativo que TikTok; TikTok suele ser más gamberro, rápido y con jerga que Instagram; YouTube suele explicar más. Anota en qué se diferencia REALMENTE cada red (no lo des por hecho sin comprobarlo) en "matices_por_red". Si una red no tiene handle o no encuentras diferencia real respecto al tono general, deja esa clave vacía o igual al tono general; no inventes una diferencia que no hayas comprobado.
5. Redactar una propuesta de contacto o correo electrónico en la que:
   - Si es la banda emisora (Bakandeya): El correo transmite fielmente la energía festiva y directa de Bakandeya (balkan-ska, violín enérgico, sustitución de metales por sintetizador).
   - Si es un grupo destino (ej: Marilyn Manson, Ska-P, etc.): La propuesta se adapta para utilizar referencias, vocabulario y tono que conecten con la personalidad del grupo destino sin perder la esencia de Bakandeya.

Devuelve EXCLUSIVAMENTE un objeto JSON válido con la siguiente estructura exacta:

{
  "nombre_entidad": "${nombre_entidad}",
  "es_emisor": ${isBakandeyaOrSender ? "true" : "false"},
  "redes_rastreadas": ["Instagram Reels @...", "TikTok", "YouTube", "Facebook", "Prensa / Web oficial"],
  "tono_comunicacion": "Resumen conciso de 1-2 frases del ADN y estilo de voz general",
  "tratamiento_habitual": "Tú / Colegueo",
  "nivel_energia": "Alta / Explosiva",
  "vocabulario_clave": ["palabra1", "palabra2", "palabra3", "palabra4"],
  "frases_emblematicas_extraidas": [
    "Frase literal extraída de sus Reels o publicaciones",
    "Otra expresión o muletilla característica"
  ],
  "emojis_frecuentes": ["🔥", "⚡", "🎷", "🍻"],
  "valores_e_intereses": ["autogestión", "música en directo", "directos potentes"],
  "matices_por_red": {
    "instagram": "Cómo varía el tono en Instagram respecto al general, o igual que el general si no hay diferencia real",
    "tiktok": "Cómo varía el tono en TikTok",
    "youtube": "Cómo varía el tono en YouTube",
    "facebook": "Cómo varía el tono en Facebook"
  },
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

    // Persist in state if requested or if band_id provided (contacto de booking en el CRM)
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

    // Cuando se analiza la banda EMISORA (la propia, no un contacto de booking) el ADN se
    // guarda siempre en Supabase, de forma automática: antes dependía de que el frontend
    // mandara `save_to_band_id` (nunca lo hacía) y aun así solo tocaba data.json, que Railway
    // borra en cada despliegue. Así lo usan de verdad los Reels/Shorts/TikTok la próxima vez.
    let savedOwnBandDna = false;
    if (is_sender) {
      try {
        const ownBandId = getTargetBandId(req);
        // La IA no genera "frases_directo_extraidas" (las acumula el generador de Reels aparte):
        // sin esto, cada vez que se reanaliza el tono se perdería lo ya guardado de conciertos.
        if (frasesDirectoExistentes.length) {
          data.frases_directo_extraidas = frasesDirectoExistentes;
        }
        savedOwnBandDna = await dbUpdateBandToneDna(ownBandId, data);
      } catch (e: any) {
        console.warn("[analyze-tone] No se pudo guardar el ADN de la banda emisora:", e?.message || e);
      }
    }

    res.json({ success: true, data, savedPermanently: savedOwnBandDna });
  } catch (err: any) {
    console.error("Error in Tone Analysis:", err);
    res.status(500).json({ error: "No se pudo analizar el tono de comunicación.", details: err?.message || String(err) });
  }
});

// Campos del ADN de tono que puede tocar un humano a mano. El resto (redes_rastreadas,
// es_emisor, nombre_entidad...) son metadatos del propio análisis de la IA: mezclarlos con una
// edición manual parcial los dejaría desactualizados o vacíos sin que nadie lo pidiera.
const CAMPOS_TONO_EDITABLES = [
  "tono_comunicacion",
  "tratamiento_habitual",
  "nivel_energia",
  "vocabulario_clave",
  "frases_emblematicas_extraidas",
  "emojis_frecuentes",
  "matices_por_red",
  "puntos_fuertes_para_conectar",
  "recomendacion_pitch",
  "reglas_estilo_aprendidas",
  "vocabulario_aprendido",
  "terminos_a_evitar",
] as const;

const REDES_MATICES = ["instagram", "tiktok", "youtube", "facebook"] as const;

function limpiarListaTono(v: any, max = 12): string[] {
  if (!Array.isArray(v)) return [];
  const salida: string[] = [];
  for (const item of v) {
    const s = String(item ?? "").trim();
    if (s && !salida.includes(s)) salida.push(s);
    if (salida.length >= max) break;
  }
  return salida;
}

function limpiarMaticesPorRed(v: any): Record<string, string> {
  const salida: Record<string, string> = {};
  if (!v || typeof v !== "object") return salida;
  for (const red of REDES_MATICES) {
    const s = String(v[red] ?? "").trim();
    if (s) salida[red] = s;
  }
  return salida;
}

// GET/PATCH del ADN de tono de la banda EMISORA (no de un contacto de booking): lo que ve y
// puede corregir el propio usuario en el generador de Reels.
router.get("/bands/tone-dna", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const band = await dbGetRegisteredBandById(bandId);
    res.json({ success: true, data: band?.dna_expresion || null });
  } catch (err: any) {
    console.error("Error fetching tone DNA:", err);
    res.status(500).json({ error: "No se pudo cargar el ADN de tono guardado.", details: err?.message || String(err) });
  }
});

router.patch("/bands/tone-dna", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const cambios = req.body || {};

    const actual = (await dbGetRegisteredBandById(bandId))?.dna_expresion || {};
    const actualizado: any = { ...actual };

    for (const campo of CAMPOS_TONO_EDITABLES) {
      if (!(campo in cambios)) continue;
      if (
        campo === "vocabulario_clave" ||
        campo === "frases_emblematicas_extraidas" ||
        campo === "emojis_frecuentes" ||
        campo === "reglas_estilo_aprendidas" ||
        campo === "vocabulario_aprendido" ||
        campo === "terminos_a_evitar"
      ) {
        actualizado[campo] = limpiarListaTono(cambios[campo], 20);
      } else if (campo === "matices_por_red") {
        actualizado[campo] = limpiarMaticesPorRed(cambios[campo]);
      } else {
        actualizado[campo] = String(cambios[campo] ?? "").trim();
      }
    }

    const guardado = await dbUpdateBandToneDna(bandId, actualizado);
    if (!guardado) {
      return res.status(500).json({ error: "No se pudo guardar la edición del ADN de tono." });
    }
    res.json({ success: true, data: actualizado });
  } catch (err: any) {
    console.error("Error updating tone DNA:", err);
    res.status(500).json({ error: err?.message || "No se pudo actualizar el ADN de tono." });
  }
});

// Edita a mano las reglas de estilo APRENDIDAS AUTOMÁTICAMENTE por categoría (Self-Refining
// Tone DNA, dna_expresion.reglas_por_categoria / reglas_por_categoria_respuesta - ver
// server/db/pitchLearning.ts). Hasta ahora esas reglas solo se podían regenerar en bloque
// pulsando "Entrenar ADN de tono ahora" (que las sobrescribe todas para esa categoría) - no
// había forma de quitar una regla concreta que resultara contradictoria con la configuración
// manual, ni de añadir una corrección puntual sin esperar a que se acumulen 2+ correcciones
// reales. Endpoint separado del PATCH genérico de arriba porque la forma de editar es distinta
// (una categoría concreta dentro de un mapa anidado, no un campo plano de la banda).
router.patch("/bands/tone-dna/learned-rules", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const { mode, category, reglas_estilo_aprendidas, vocabulario_aprendido, terminos_a_evitar } = req.body || {};

    if (mode !== "pitch" && mode !== "reply") {
      return res.status(400).json({ error: "mode debe ser 'pitch' o 'reply'." });
    }
    if (!category || typeof category !== "string") {
      return res.status(400).json({ error: "category es requerida." });
    }

    const actual = (await dbGetRegisteredBandById(bandId))?.dna_expresion || {};
    const bucketKey = mode === "reply" ? "reglas_por_categoria_respuesta" : "reglas_por_categoria";
    const reglasPorCategoria = { ...(actual[bucketKey] || {}) };
    const existente = reglasPorCategoria[category] || {};

    reglasPorCategoria[category] = {
      reglas_estilo_aprendidas: reglas_estilo_aprendidas !== undefined
        ? limpiarListaTono(reglas_estilo_aprendidas, 20)
        : (existente.reglas_estilo_aprendidas || []),
      vocabulario_aprendido: vocabulario_aprendido !== undefined
        ? limpiarListaTono(vocabulario_aprendido, 20)
        : (existente.vocabulario_aprendido || []),
      terminos_a_evitar: terminos_a_evitar !== undefined
        ? limpiarListaTono(terminos_a_evitar, 20)
        : (existente.terminos_a_evitar || []),
      actualizado: new Date().toISOString()
    };

    const actualizado = { ...actual, [bucketKey]: reglasPorCategoria };
    const guardado = await dbUpdateBandToneDna(bandId, actualizado);
    if (!guardado) {
      return res.status(500).json({ error: "No se pudo guardar la edición de las reglas aprendidas." });
    }
    res.json({ success: true, data: actualizado });
  } catch (err: any) {
    console.error("Error updating learned tone rules:", err);
    res.status(500).json({ error: err?.message || "No se pudo actualizar las reglas aprendidas." });
  }
});

// --------------------------------------------------
// BAND SCHEDULES (Smart Gate - Python agent config)
// --------------------------------------------------
router.get("/bands/schedules/:bandId", requireAuth, async (req, res) => {
  try {
    const { bandId } = req.params;
    const schedule = await dbGetBandSchedule(bandId);
    res.json(schedule);
  } catch (err: any) {
    console.error("Error fetching band schedule:", err);
    res.status(500).json({ error: "Error al obtener el horario de la banda" });
  }
});

router.post("/bands/schedules", requireAuth, async (req, res) => {
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

// --------------------------------------------------
// BAND EMAIL ACCOUNT (SMTP/IMAP para Enviador/Lector, ver server/services/emailAgentClient.ts)
// --------------------------------------------------
router.get("/bands/email-account/:bandId", requireAuth, async (req, res) => {
  try {
    const { bandId } = req.params;
    const account = await dbGetBandEmailAccount(bandId);
    res.json(toSafeEmailAccountResponse(account));
  } catch (err: any) {
    console.error("Error fetching band email account:", err);
    res.status(500).json({ error: "Error al obtener la cuenta de email de la banda" });
  }
});

router.post("/bands/email-account", requireAuth, async (req, res) => {
  try {
    const { band_id, provider, email, app_password, smtp_host, smtp_port, smtp_secure, imap_host, imap_port } = req.body;
    if (!band_id || !email || !app_password || !smtp_host || !smtp_port || !imap_host) {
      return res.status(400).json({ error: "band_id, email, app_password, smtp_host, smtp_port e imap_host son requeridos" });
    }
    const saved = await dbUpsertBandEmailAccount({
      band_id,
      provider: provider || "other",
      email,
      app_password,
      smtp_host,
      smtp_port: Number(smtp_port),
      smtp_secure: smtp_secure ?? true,
      imap_host,
      imap_port: imap_port ? Number(imap_port) : 993
    });
    res.json({ success: true, data: toSafeEmailAccountResponse(saved) });
  } catch (err: any) {
    console.error("Error saving band email account:", err);
    res.status(500).json({ error: "Error al guardar la cuenta de email de la banda" });
  }
});

export default router;
