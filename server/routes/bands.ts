// CRUD de bandas, borrado en bloque y sincronización. Toda operación resuelve la banda con
// `getTargetBandId` / `puedeEscribirEnBanda` (AGENTS.md §2.1).

import express from "express";
import { requireAuth } from "../state.js";
import { loadState, saveState } from "../state.js";
import { getSupabase } from "../db/core.js";
import { dbGetBandContacts, dbUpsertBandContact, dbDeleteBandContact, dbBulkDeleteBandContacts, dbGetBandSchedule, dbUpsertBandSchedule, dbGetBandEmailAccount, dbUpsertBandEmailAccount, toSafeEmailAccountResponse, dbUpdateBandDnaExpresion, dbGetRegisteredBandById, dbGetEpkConfig } from "../db.js";
import { enviarEmail } from "../services/emailAgentClient.js";
import { tieneGmailOAuthConectado, enviarEmailGmailApi } from "../services/gmailApiClient.js";
import { sendTransactionalEmail } from "../services/transactionalEmail.js";
import { buildServerEmailHtml, buildBandNotificationEmailHtml } from "../utils/emailTemplate.js";
import { getAiClient, generateContentWithFallback } from "../ai.js";
import { autoEnrichBandContact } from "../auto_enrichment.js";
import { esUrlExternaSegura } from "../utils/ssrfGuard.js";
import { getTargetBandId, puedeEscribirEnBanda } from "../utils/bandAccess.js";
import { iaRateLimiter } from "../middleware/rateLimiter.js";
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

  const isSenderBand = !!is_sender;

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
- Rol: ${isSenderBand ? "Banda EMISORA de la propuesta (nuestro perfil)" : "Entidad RECEPTORA / Objetivo"}
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
   - Si es la banda emisora: El correo transmite fielmente la personalidad sonora, energía y propuesta escénica de la banda.
   - Si es una entidad receptora: La propuesta se adapta para utilizar referencias, vocabulario y tono que conecten con la personalidad del receptor manteniendo la identidad de la banda.

Devuelve EXCLUSIVAMENTE un objeto JSON válido con la siguiente estructura exacta:

{
  "nombre_entidad": "${nombre_entidad}",
  "es_emisor": ${isSenderBand ? "true" : "false"},
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
        // FUSIONA con lo que ya había en vez de sobreescribir toda la columna: `data` es
        // exclusivamente el resultado del análisis de IA (tono_comunicacion, vocabulario_clave,
        // etc.) y NUNCA incluye reglas_por_categoria / reglas_por_categoria_respuesta (Self-
        // Refining Tone DNA) ni reglas_manuales ni historial_feedback_reels - guardarlo tal cual
        // con dbUpdateBandToneDna (que sobrescribe la columna entera) borraba sin más TODO lo
        // aprendido de correcciones reales y lo escrito a mano por el mánager cada vez que se
        // pulsaba "Analizar Tono" para refrescar el análisis de redes. dbUpdateBandDnaExpresion
        // además serializa esta escritura frente a cualquier otra concurrente sobre la misma
        // banda (ver server/db/bands.ts).
        const { ok } = await dbUpdateBandDnaExpresion(ownBandId, (dnaActual) => ({
          ...dnaActual,
          ...data
        }));
        savedOwnBandDna = ok;
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

    const { ok: guardado, dna: actualizado } = await dbUpdateBandDnaExpresion(bandId, (actual) => {
      const siguiente: any = { ...actual };
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
          siguiente[campo] = limpiarListaTono(cambios[campo], 20);
        } else if (campo === "matices_por_red") {
          siguiente[campo] = limpiarMaticesPorRed(cambios[campo]);
        } else {
          siguiente[campo] = String(cambios[campo] ?? "").trim();
        }
      }
      return siguiente;
    });
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
//
// `reglas_manuales` es un campo aparte de `reglas_estilo_aprendidas`: las manuales las escribe
// el mánager y NUNCA las toca el refinamiento automático (ver refineToneDnaForCategory), así
// que sirven de garantía de que "lo que yo añadí a mano no se pierde nunca" aunque se vuelva a
// entrenar. Las `reglas_estilo_aprendidas` sí las puede modificar la IA en el siguiente
// refinamiento (ahora por fusión, no por sobreescritura - ver pitchLearning.ts), pero también se
// pueden editar/borrar aquí a mano en cualquier momento.
router.patch("/bands/tone-dna/learned-rules", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const { mode, category, reglas_estilo_aprendidas, reglas_manuales, vocabulario_aprendido, terminos_a_evitar } = req.body || {};

    if (mode !== "pitch" && mode !== "reply") {
      return res.status(400).json({ error: "mode debe ser 'pitch' o 'reply'." });
    }
    if (!category || typeof category !== "string") {
      return res.status(400).json({ error: "category es requerida." });
    }

    const bucketKey = mode === "reply" ? "reglas_por_categoria_respuesta" : "reglas_por_categoria";

    // dbUpdateBandDnaExpresion lee+escribe dna_expresion como una operación atómica por banda
    // (server/db/bands.ts) - antes esta ruta leía, modificaba en memoria y sobrescribía la
    // columna entera por su cuenta, así que una edición manual aquí podía perder un refinamiento
    // automático en vuelo (o viceversa) si ambos caían casi a la vez.
    const { ok: guardado, dna: actualizado } = await dbUpdateBandDnaExpresion(bandId, (actual) => {
      const reglasPorCategoria = { ...(actual[bucketKey] || {}) };
      const existente = reglasPorCategoria[category] || {};

      reglasPorCategoria[category] = {
        reglas_estilo_aprendidas: reglas_estilo_aprendidas !== undefined
          ? limpiarListaTono(reglas_estilo_aprendidas, 20)
          : (existente.reglas_estilo_aprendidas || []),
        reglas_manuales: reglas_manuales !== undefined
          ? limpiarListaTono(reglas_manuales, 20)
          : (existente.reglas_manuales || []),
        vocabulario_aprendido: vocabulario_aprendido !== undefined
          ? limpiarListaTono(vocabulario_aprendido, 20)
          : (existente.vocabulario_aprendido || []),
        terminos_a_evitar: terminos_a_evitar !== undefined
          ? limpiarListaTono(terminos_a_evitar, 20)
          : (existente.terminos_a_evitar || []),
        actualizado: new Date().toISOString()
      };

      return { ...actual, [bucketKey]: reglasPorCategoria };
    });
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
    // El horario dice cuándo corren el Lector y el Enviador de CADA banda: leerlo (o cambiarlo,
    // más abajo) de otra banda se podía hacer con solo conocer su id.
    if (!puedeEscribirEnBanda(req, bandId)) {
      return res.status(403).json({ error: "No tienes acceso a esta banda." });
    }
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
    if (!puedeEscribirEnBanda(req, band_id)) {
      return res.status(403).json({ error: "No tienes acceso a esta banda." });
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
    // Devuelve la configuración SMTP/IMAP del buzón de la banda (sin la contraseña): no es para
    // cualquier usuario con sesión.
    if (!puedeEscribirEnBanda(req, bandId)) {
      return res.status(403).json({ error: "No tienes acceso a esta banda." });
    }
    const account = await dbGetBandEmailAccount(bandId);
    res.json(toSafeEmailAccountResponse(account));
  } catch (err: any) {
    console.error("Error fetching band email account:", err);
    res.status(500).json({ error: "Error al obtener la cuenta de email de la banda" });
  }
});

router.post("/bands/email-account", requireAuth, async (req, res) => {
  try {
    const targetBandId = getTargetBandId(req) || req.body.band_id;
    const { provider, email, app_password, smtp_host, smtp_port, smtp_secure, imap_host, imap_port } = req.body;
    if (!targetBandId || !email || !app_password || !smtp_host || !smtp_port || !imap_host) {
      return res.status(400).json({ error: "band_id, email, app_password, smtp_host, smtp_port e imap_host son requeridos" });
    }
    const cleanEmail = email.trim().toLowerCase();
    const saved = await dbUpsertBandEmailAccount({
      band_id: targetBandId,
      provider: provider || "other",
      email: cleanEmail,
      app_password,
      smtp_host,
      smtp_port: Number(smtp_port),
      smtp_secure: smtp_secure ?? true,
      imap_host,
      imap_port: imap_port ? Number(imap_port) : 993
    });

    // Sincronizar el email oficial de registered_bands con el buzón que la banda ha configurado
    try {
      const sb = getSupabase();
      await sb.from("registered_bands").update({ email: cleanEmail }).eq("band_id", targetBandId);
    } catch (syncErr) {
      console.warn("[bands] No se pudo sincronizar registered_bands.email:", syncErr);
    }

    res.json({ success: true, data: toSafeEmailAccountResponse(saved) });
  } catch (err: any) {
    console.error("Error saving band email account:", err);
    res.status(500).json({ error: "Error al guardar la cuenta de email de la banda" });
  }
});

// --------------------------------------------------
// ENVÍO DE RECORDATORIOS Y NOTIFICACIONES DE CALENDARIO
// --------------------------------------------------
router.post("/bands/send-reminder", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    if (!bandId) {
      return res.status(403).json({ error: "No tienes permiso para enviar recordatorios en esta banda." });
    }

    const {
      event_title,
      event_type, // 'concierto' | 'ensayo' | 'reunion'
      event_date,
      event_time,
      event_location,
      recipients = [], // array de emails
      recipient_members = [], // array de nombres de convocados
      custom_notes,
      setlist_summary,
      send_email = true
    } = req.body;

    if (!event_title) {
      return res.status(400).json({ error: "Falta el título del evento" });
    }

    const registeredBand = await dbGetRegisteredBandById(bandId);
    const bandName = registeredBand?.name || 'Tu Banda';

    const eventLabel = event_type === 'concierto' ? 'Concierto' : event_type === 'ensayo' ? 'Ensayo' : 'Reunión';
    
    // Identificación clara de la BANDA lo primero en el Asunto
    const subject = `[Banda: ${bandName}] 🔔 Recordatorio de ${eventLabel}: ${event_title} (${event_date})`;

    const html = buildBandNotificationEmailHtml({
      bandName,
      eventLabel,
      eventTitle: event_title,
      eventDate: event_date,
      eventTime: event_time,
      eventLocation: event_location,
      recipientMembers: recipient_members,
      customNotes: custom_notes,
      setlistSummary: setlist_summary
    });

    let emailSent = false;
    let emailError = null;

    if (send_email && Array.isArray(recipients) && recipients.length > 0) {
      const emailList = recipients.filter((r: any) => typeof r === 'string' && r.includes('@'));
      if (emailList.length > 0) {
        for (const targetEmail of emailList) {
          try {
            // Las notificaciones internas del sistema se envían siempre desde BandManager (no-reply@bandmanager.io)
            const txRes = await sendTransactionalEmail({
              to: targetEmail,
              subject,
              html
            });
            if (txRes.success) {
              emailSent = true;
            } else {
              throw new Error(txRes.error || "Error despachando correo transaccional de notificación");
            }
          } catch (err: any) {
            console.error(`Error enviando email de recordatorio a ${targetEmail}:`, err?.message || err);
            emailError = err?.message || "Error al despachar el correo.";
          }
        }
      }
    }

    res.json({
      success: true,
      emailSent,
      emailError,
      message: emailSent
        ? `Recordatorio enviado por correo a ${recipients.length} destinatario(s).`
        : "Notificación procesada correctamente en la plataforma."
    });
  } catch (err: any) {
    console.error("Error en /bands/send-reminder:", err);
    res.status(500).json({ error: err?.message || "Error procesando el recordatorio" });
  }
});

import { dbGetAlertSettings, dbUpsertAlertSettings } from "../db/alertSettings.js";

// GET /api/bands/alert-settings
router.get("/bands/alert-settings", requireAuth, async (req: any, res: any) => {
  try {
    const bandId = getTargetBandId(req);
    const settings = await dbGetAlertSettings(bandId);
    return res.json({ success: true, settings });
  } catch (err: any) {
    console.error("Error obteniendo configuración de alertas:", err);
    return res.status(500).json({ error: err?.message || "Error consultando alertas" });
  }
});

// POST /api/bands/alert-settings
router.post("/bands/alert-settings", requireAuth, async (req: any, res: any) => {
  try {
    const bandId = getTargetBandId(req);
    const success = await dbUpsertAlertSettings(bandId, req.body || {});
    return res.json({ success });
  } catch (err: any) {
    console.error("Error guardando configuración de alertas:", err);
    return res.status(500).json({ error: err?.message || "Error guardando alertas" });
  }
});

// POST /api/bands/trigger-alert-digest - Enviar email de resumen ejecutivo de alertas
router.post("/bands/trigger-alert-digest", requireAuth, async (req: any, res: any) => {
  try {
    const bandId = getTargetBandId(req);
    const settings = await dbGetAlertSettings(bandId);

    const recipientEmail = settings?.recipient_email || req.user?.email || req.user?.username;
    if (!recipientEmail) {
      return res.status(400).json({ error: "No se ha configurado un email de destino para las alertas." });
    }

    const state = loadState();
    const bandInfo = (state.registeredBands || []).find((b: any) => b.band_id === bandId || b.id === bandId);
    const bandName = bandInfo?.nombre_banda || bandInfo?.bandName || req.user?.bandName || "Tu Banda";

    const leads = (state.leads || []).filter((l: any) => l.band_id === bandId || l.bandId === bandId);
    const concerts = (state.concerts || []).filter((c: any) => c.band_id === bandId || c.bandId === bandId);

    // Conteo de elementos pendientes
    const pendingDraftsCount = leads.filter((l: any) => l.estado === 'pendiente_aprobacion' || l.estado === 'borrador_creado').length;
    const staleLeadsCount = leads.filter((l: any) => l.estado === 'contactado' || l.estado === 'esperando_respuesta').length;
    const confirmedShowsCount = concerts.filter((c: any) => c.estado === 'confirmado' || new Date(c.fecha) >= new Date()).length;

    const emailSubject = `📊 Resumen Ejecutivo & Alertas de Booking - ${bandName}`;

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 32px; border-radius: 16px; max-width: 600px; margin: 0 auto;">
        <div style="border-bottom: 2px solid #f59e0b; padding-bottom: 16px; margin-bottom: 24px;">
          <h1 style="color: #f59e0b; font-size: 22px; margin: 0 0 4px 0;">⚡ Radar del Mánager — ${bandName}</h1>
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">Resumen ejecutivo automático de actividad y alertas de booking.</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
          <div style="background-color: #1e293b; padding: 16px; border-radius: 12px; border: 1px solid #334155; text-align: center;">
            <span style="font-size: 20px; font-weight: bold; color: #38bdf8; display: block;">${pendingDraftsCount}</span>
            <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Borradores IA</span>
          </div>
          <div style="background-color: #1e293b; padding: 16px; border-radius: 12px; border: 1px solid #334155; text-align: center;">
            <span style="font-size: 20px; font-weight: bold; color: #fbbf24; display: block;">${staleLeadsCount}</span>
            <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Salas a Seguir</span>
          </div>
          <div style="background-color: #1e293b; padding: 16px; border-radius: 12px; border: 1px solid #334155; text-align: center;">
            <span style="font-size: 20px; font-weight: bold; color: #34d399; display: block;">${confirmedShowsCount}</span>
            <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Bolos Activos</span>
          </div>
        </div>

        <div style="background-color: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 24px;">
          <h3 style="color: #f8fafc; font-size: 15px; margin-top: 0; margin-bottom: 12px;">🎪 Recomendación Estacional del Mánager</h3>
          <p style="color: #cbd5e1; font-size: 13px; line-height: 1.5; margin: 0;">
            Estamos en ventana activa de contratación de <strong>festivales de verano y cierres de salas</strong>. Se recomienda revisar las propuestas preparadas por la IA y enviar los emails de seguimiento correspondientes.
          </p>
        </div>

        <div style="text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #334155;">
          <a href="${process.env.APP_URL || 'https://bandmanager.io'}" style="background-color: #f59e0b; color: #0f172a; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; display: inline-block;">Acceder a BandManager.io</a>
        </div>
      </div>
    `;

    const result = await sendTransactionalEmail({
      to: recipientEmail,
      subject: emailSubject,
      html: htmlBody
    });

    return res.json({
      success: true,
      emailSent: result.success,
      recipient: recipientEmail,
      error: result.error
    });
  } catch (err: any) {
    console.error("Error en /bands/trigger-alert-digest:", err);
    return res.status(500).json({ error: err?.message || "Error al enviar el resumen por email" });
  }
});

// POST /api/bands/generate-logo - Generador de logotipos profesionales con IA para bandas amateurs
router.post("/bands/generate-logo", requireAuth, iaRateLimiter, async (req: any, res: any) => {
  try {
    const bandId = getTargetBandId(req);
    const { style, customPrompt, genre, colors } = req.body || {};

    const state = loadState();
    const bandInfo = (state.registeredBands || []).find((b: any) => b.band_id === bandId || b.id === bandId);
    let epk: any = null;
    try {
      epk = await dbGetEpkConfig(bandId);
    } catch (_) {}

    const bandName = bandInfo?.nombre_banda || bandInfo?.bandName || epk?.nombreBanda || req.user?.bandName || req.user?.name || "Banda";
    const bandGenre = genre || epk?.genero || bandInfo?.genero || "Rock / Indie";
    const bandBio = epk?.biografia || "";

    const selectedStyle = style || "modern_emblem";
    const styleDescriptions: Record<string, string> = {
      vintage_rock: "Vintage 70s/80s rock aesthetic, distressed grunge badge, bold retro serif typography, guitar and vinyl motifs, warm amber and gold highlights on dark texture.",
      minimal_modern: "Ultra-clean modern minimalist geometric emblem, sharp vector lines, high-end Swiss typography, sleek monochromatic with subtle electric amber accents.",
      neon_synth: "Cyberpunk synthwave neon glow, vibrant magenta and cyan outlines on pitch black, futuristic geometric typography, laser audio waves.",
      classic_badge: "Heritage circular music crest, collegiate athletic / craft brewery badge style, star accents, curved ribbon banner with establishment year.",
      bold_typography: "Heavy bold brutalist typographic wordmark with custom stylized lettering, rock poster energy, high contrast black, white and vibrant amber."
    };

    const visualConcept = styleDescriptions[selectedStyle] || styleDescriptions.minimal_modern;
    const client = getAiClient();

    let logoDataUrl = "";
    let generationMethod = "svg_vector";

    // Intento 1: Generación directa con modelo de imagen de Google GenAI si está disponible
    if (client) {
      try {
        const imagePrompt = `Professional music band logo for '${bandName}'. Genre: ${bandGenre}. Style: ${visualConcept}. ${customPrompt ? `Additional creative direction: ${customPrompt}.` : ''} Clean graphic design, centered emblem on dark isolated background, vector art quality, iconic branding.`;
        
        const imgResponse: any = await (client.models as any).generateImages({
          model: 'imagen-3.0-generate-002',
          prompt: imagePrompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio: '1:1',
          },
        }).catch(() => null);

        if (imgResponse?.generatedImages?.[0]?.image?.imageBytes) {
          const base64 = imgResponse.generatedImages[0].image.imageBytes;
          logoDataUrl = `data:image/png;base64,${base64}`;
          generationMethod = "imagen_ai";
        }
      } catch (imgErr) {
        console.warn("[Logo Generator] Imagen API no disponible o falló, recurriendo al diseñador vectorial de precisión:", imgErr);
      }
    }

    // Intento 2: Si no hubo imagen binaria, usamos el diseñador gráfico vectorial Gemini para crear un SVG de alta fidelidad
    if (!logoDataUrl && client) {
      try {
        const svgPrompt = `Eres un diseñador gráfico senior especializado en branding e identidad visual de bandas de música.
Crea un logotipo vectorial en formato SVG (código XML SVG puro, listo para renderizar) para la siguiente banda:
- Nombre de la banda: "${bandName}"
- Estilo musical / Género: "${bandGenre}"
- Concepto estético: ${visualConcept}
- Indicaciones adicionales: ${customPrompt || "Ninguna"}

REQUISITOS ESTRICTOS DEL SVG:
1. El SVG debe tener viewBox="0 0 500 500" con width="100%" y height="100%".
2. Debe incluir un fondo estilizado oscuro (rect con fill oscuro como #09090b o degradado #18181b a #0f172a).
3. Debe incluir el nombre "${bandName}" con tipografía legible, artística e impactante usando etiquetas <text> con font-family sans-serif/serif/display estilizado, text-anchor="middle" y efectos de sombra/glow.
4. Debe incluir un emblema central o icono gráfico acorde al estilo (guitarra estilizada, notas, vinilo, formas geométricas modernas, rayos, ondas sonoras, alas o escudo).
5. Usa colores elegantes (dorados #f59e0b, ámbar #fbbf24, blancos, grises y acentos vibrantes).
6. Responde ÚNICAMENTE con el bloque de código <svg ...>...</svg>, sin markdown extra, sin explicaciones.`;

        const response = await generateContentWithFallback(client, {
          contents: [{ role: "user", parts: [{ text: svgPrompt }] }],
          preferredModel: "gemini-3.7-flash",
          timeoutMs: 30000,
          bandId
        });

        const rawText = response?.text || response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const svgMatch = rawText.match(/<svg[\s\S]*?<\/svg>/i);
        if (svgMatch && svgMatch[0]) {
          const cleanSvg = svgMatch[0].trim();
          const base64Svg = Buffer.from(cleanSvg, "utf8").toString("base64");
          logoDataUrl = `data:image/svg+xml;base64,${base64Svg}`;
          generationMethod = "gemini_vector_svg";
        }
      } catch (svgErr) {
        console.warn("[Logo Generator] Falló generación SVG con IA:", svgErr);
      }
    }

    // Intento 3: Fallback local algorítmico si no hay conexión a modelos externos
    if (!logoDataUrl) {
      const initials = bandName.split(/\s+/).slice(0, 2).map((w: string) => w[0]?.toUpperCase() || '').join('') || 'BM';
      const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="50%" stop-color="#09090b"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  <rect width="500" height="500" rx="32" fill="url(#bgGrad)"/>
  <circle cx="250" cy="250" r="190" fill="none" stroke="url(#goldGrad)" stroke-width="3" stroke-dasharray="8 6" opacity="0.4"/>
  <circle cx="250" cy="250" r="160" fill="none" stroke="url(#goldGrad)" stroke-width="4" opacity="0.8"/>
  <polygon points="250,110 370,320 130,320" fill="none" stroke="url(#goldGrad)" stroke-width="3" opacity="0.3"/>
  <circle cx="250" cy="210" r="65" fill="#18181b" stroke="url(#goldGrad)" stroke-width="3"/>
  <text x="250" y="228" font-family="-apple-system, system-ui, sans-serif" font-size="52" font-weight="900" fill="url(#goldGrad)" text-anchor="middle" filter="url(#glow)">${initials}</text>
  <text x="250" y="380" font-family="-apple-system, system-ui, sans-serif" font-size="32" font-weight="800" letter-spacing="4" fill="#f8fafc" text-anchor="middle" text-transform="uppercase">${bandName.slice(0, 18)}</text>
  <text x="250" y="415" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="600" letter-spacing="6" fill="#fbbf24" text-anchor="middle" opacity="0.9">${bandGenre.slice(0, 24).toUpperCase()}</text>
</svg>`;
      const base64Svg = Buffer.from(fallbackSvg, "utf8").toString("base64");
      logoDataUrl = `data:image/svg+xml;base64,${base64Svg}`;
      generationMethod = "local_geometric_vector";
    }

    return res.json({
      success: true,
      logoUrl: logoDataUrl,
      bandName,
      style: selectedStyle,
      generationMethod
    });
  } catch (err: any) {
    console.error("Error generating band logo with AI:", err);
    return res.status(500).json({ error: err?.message || "Error al generar el logo con IA." });
  }
});

export default router;

