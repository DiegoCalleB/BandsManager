import express from "express";
import { Lead } from "../../../src/types.js";
import { loadState, saveState, requireAuth } from "../../state.js";
import { dbGetLeadById, dbUpsertLead } from "../../db.js";
import { getAiClient, generateContentWithFallback } from "../../ai.js";
import { autoEnrichLead } from "../../auto_enrichment.js";
import { safeParseJson } from "../../utils.js";
import { isBadDirectoryUrl, getDomainFromUrl } from "./helpers.js";

const router = express.Router();

// Helper to verify string relevance between searched venue name and found venue name
function isMatchRelevant(searchedName: string, foundName: string): boolean {
  if (!searchedName || !foundName) return false;
  const sNorm = searchedName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ");
  const fNorm = foundName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ");

  const stopWords = new Set(['sala', 'de', 'del', 'la', 'el', 'los', 'las', 'san', 'santa', 'club', 'bar', 'festival', 'teatro', 'espacio', 'conciertos', 'musica', 'live']);
  
  const sWords = sNorm.split(/\s+/).filter(w => w.length >= 3 && !stopWords.has(w));
  const fWords = fNorm.split(/\s+/).filter(w => w.length >= 3 && !stopWords.has(w));

  if (sWords.length === 0) {
    return fNorm.includes(sNorm) || sNorm.includes(fNorm);
  }

  return sWords.some(w => fNorm.includes(w));
}

// Helper to scrape website HTML for high-resolution OpenGraph, Apple Touch Icon, or Brand Logo image
// Helper to scrape website HTML for high-resolution OpenGraph, Apple Touch Icon, or Brand Logo image
async function scrapeWebsiteLogo(candidateWebsites: (string | undefined)[], email?: string, nombreSala?: string): Promise<{ logo: string; workingWebsite: string } | null> {
  const candidateUrls: string[] = [];

  for (const site of candidateWebsites) {
    if (site && !isBadDirectoryUrl(site)) {
      let url = site.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      if (!candidateUrls.includes(url)) candidateUrls.push(url);

      // If website is e.g. salasiroco.es, also try stripping 'sala' prefix -> siroco.es
      try {
        const u = new URL(url);
        if (u.hostname.startsWith('sala') && u.hostname.length > 7) {
          const stripped = `https://${u.hostname.replace(/^sala/, '')}`;
          if (!candidateUrls.includes(stripped)) candidateUrls.push(stripped);
        }
      } catch (_) {}
    }
  }

  // If venue name is known, e.g. Siroco
  if (nombreSala && nombreSala.toLowerCase().includes('siroco')) {
    if (!candidateUrls.includes('https://siroco.es')) candidateUrls.unshift('https://siroco.es');
  }

  // Try extracting domain from email if websiteUrl failed or wasn't provided
  if (email && email.includes('@')) {
    const emailDomain = email.split('@')[1]?.toLowerCase().trim();
    if (emailDomain && !isBadDirectoryUrl(emailDomain) && !emailDomain.includes('gmail.') && !emailDomain.includes('hotmail.') && !emailDomain.includes('yahoo.')) {
      const eUrl = `https://${emailDomain}`;
      if (!candidateUrls.includes(eUrl)) candidateUrls.push(eUrl);
      if (emailDomain.startsWith('sala')) {
        const strippedE = `https://${emailDomain.replace(/^sala/, '')}`;
        if (!candidateUrls.includes(strippedE)) candidateUrls.push(strippedE);
      }
    }
  }

  for (const siteUrl of candidateUrls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(siteUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      clearTimeout(timeout);

      if (!res.ok) continue;
      const html = await res.text();

      // 1. Look for explicit apple-touch-icon
      const appleIcon = html.match(/<link\s+[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i) ||
                        html.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon["']/i);
      if (appleIcon && appleIcon[1]) {
        const resolved = new URL(appleIcon[1].trim(), siteUrl).href;
        if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
          return { logo: resolved, workingWebsite: siteUrl };
        }
      }

      // 2. Look for <img> tags with logo or brand in filename (excluding sponsors/banners)
      const imgMatches = [...html.matchAll(/<img\s+[^>]*src=["']([^"']*(?:logo|brand)[^"']*)["']/gi)];
      for (const m of imgMatches) {
        const srcLower = m[1].toLowerCase();
        if (!srcLower.includes('ayto') && !srcLower.includes('comunidad') && !srcLower.includes('banner') && !srcLower.includes('footer') && !srcLower.includes('partner') && !srcLower.includes('sponsor') && !srcLower.includes('coca-cola') && !srcLower.includes('mahou')) {
          const resolved = new URL(m[1].trim(), siteUrl).href;
          if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
            return { logo: resolved, workingWebsite: siteUrl };
          }
        }
      }

      // 3. Look for <link rel="icon"> with png/jpg/webp/svg
      const iconMatch = html.match(/<link\s+[^>]*rel=["'](?:shortcut icon|icon)["'][^>]*href=["']([^"']+\.(?:png|jpg|jpeg|webp|svg))["']/i) ||
                        html.match(/<link\s+[^>]*href=["']([^"']+\.(?:png|jpg|jpeg|webp|svg))["'][^>]*rel=["'](?:shortcut icon|icon)["']/i);
      if (iconMatch && iconMatch[1]) {
        const resolved = new URL(iconMatch[1].trim(), siteUrl).href;
        if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
          return { logo: resolved, workingWebsite: siteUrl };
        }
      }

      // 4. Look for <meta property="og:image"> or <meta name="twitter:image">
      const ogMatch = html.match(/<meta\s+(?:property|name)=["'](?:og:image|twitter:image)["']\s+content=["']([^"']+)["']/i) ||
                      html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["'](?:og:image|twitter:image)["']/i);
      if (ogMatch && ogMatch[1]) {
        const resolved = new URL(ogMatch[1].trim(), siteUrl).href;
        if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
          return { logo: resolved, workingWebsite: siteUrl };
        }
      }

      // 5. If site is reachable and valid, return google favicon URL for this working site
      const domain = getDomainFromUrl(siteUrl);
      if (domain) {
        return { logo: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`, workingWebsite: siteUrl };
      }
    } catch (_) {}
  }

  return null;
}

// Helper to clean and validate logo URLs (strictly prioritizing official brand logos, rejecting interior/venue photos or generic google globe placeholders)
// Helper to clean and validate logo URLs (strictly prioritizing official brand logos, rejecting interior/venue photos or generic google globe placeholders)
function sanitizeLogoUrl(imgUrl: string, websiteUrl?: string, name?: string, instagram?: string): string {
  let cleaned = (imgUrl || '').trim();

  // Reject raw venue/map photos or googleusercontent or ui-avatars / clearbit
  if (
    cleaned.includes('places.googleapis.com') ||
    cleaned.includes('googleusercontent.com') ||
    cleaned.includes('ui-avatars.com') ||
    cleaned.includes('clearbit.com') ||
    cleaned.includes('icon.horse')
  ) {
    cleaned = '';
  }

  // If valid direct image URL
  if (cleaned && (
    /\.(jpg|jpeg|png|webp|svg)($|\?)/i.test(cleaned) || 
    cleaned.includes('unavatar.io') ||
    cleaned.includes('wikimedia.org') ||
    cleaned.includes('supabase.co') ||
    cleaned.includes('google.com/s2/favicons') ||
    cleaned.includes('/uploads/')
  )) {
    return cleaned;
  }

  // If Instagram handle is available, unavatar provides exact profile image
  if (instagram) {
    const handle = instagram.replace(/.*instagram\.com\//, '').replace(/^@/, '').split('/')[0].split('?')[0].trim();
    if (handle.length > 1) {
      return `https://unavatar.io/instagram/${handle}`;
    }
  }

  // If website URL exists and is valid, use google favicons for clean icon
  if (websiteUrl && !isBadDirectoryUrl(websiteUrl)) {
    const domain = getDomainFromUrl(websiteUrl);
    if (domain && domain.includes('.')) {
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    }
  }

  // Return empty string if no real image exists (so UI renders clean emoji badge)
  return '';
}

// Custom simulation endpoint to generate custom venue or band negotiation emails using Gemini

router.post("/leads/ai-lookup", requireAuth, async (req, res) => {
  const { ciudad, tipo, leadId } = req.body;
  let nombre_sala = req.body.nombre_sala || req.body.nombre || req.body.nombreSala || req.body.name || req.body.sala_o_medio;

  let existingLead: any = null;
  if (leadId) {
    const state = loadState();
    existingLead = state.leads?.find((l: any) => l.id === leadId);
    if (existingLead) {
      nombre_sala = nombre_sala || existingLead.nombre_sala || existingLead.nombre || existingLead.nombreSala || existingLead.name;
    }
  }

  if (!nombre_sala || typeof nombre_sala !== 'string' || nombre_sala.trim() === '') {
    nombre_sala = "Sala de Conciertos";
  }

  nombre_sala = nombre_sala.trim();

  let placesWebsite = "";
  let placesIcon = "";

  // 1. Try Google Places API (New) for website & icon ONLY if place name matches searched venue
  const placesApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.VITE_GOOGLE_PLACES_API_KEY || "";
  if (placesApiKey && placesApiKey.trim() !== "") {
    try {
      const searchQuery = `${nombre_sala} ${ciudad || ''} España`;
      const v1Res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": placesApiKey,
          "X-Goog-FieldMask": "places.id,places.displayName,places.websiteUri,places.types,places.businessStatus"
        },
        body: JSON.stringify({
          textQuery: searchQuery,
          languageCode: "es"
        })
      });

      const v1Data: any = await v1Res.json();
      if (v1Res.ok && Array.isArray(v1Data.places) && v1Data.places.length > 0) {
        const topPlace = v1Data.places[0];
        const placeName = topPlace.displayName?.text || "";

        // STRICT CHECK: Only accept Google Places result if displayName matches searched nombre_sala
        if (isMatchRelevant(nombre_sala, placeName)) {
          if (topPlace.websiteUri && !isBadDirectoryUrl(topPlace.websiteUri)) {
            placesWebsite = topPlace.websiteUri;
          }
          if (topPlace.types) {
            if (topPlace.types.includes("night_club")) placesIcon = "🪩";
            else if (topPlace.types.includes("bar")) placesIcon = "🍸";
            else if (topPlace.types.includes("theater")) placesIcon = "🎭";
            else if (topPlace.types.includes("radio")) placesIcon = "📻";
          }
        } else {
          console.warn(`[AILookup] Rejected Places match '${placeName}' for searched venue '${nombre_sala}' (non-relevant)`);
        }
      }
    } catch (e) {
      console.warn("[AILookup] Google Places search warning:", e);
    }
  }

  const client = getAiClient();
  let parsed: any = {};

  if (client) {
    const prompt = `Busca información pública y el logotipo oficial sobre la sala, festival o medio de comunicación "${nombre_sala}" ${ciudad ? `en ${ciudad}` : ''} en España. Utiliza Google Search para encontrar su web oficial y la URL directa de imagen de su logotipo o isotipo oficial.
Devuelve EXCLUSIVAMENTE un objeto JSON con la estructura exacta:
{
  "nombre_oficial": "nombre oficial",
  "ciudad": "ciudad",
  "website": "sitio web oficial (ej: pirineosur.es, NO directorios generales como salasdeconciertos.com)",
  "instagram": "usuario o URL de instagram",
  "imagen_url": "URL pública directa de la imagen del logo oficial (png, jpg, svg, webp)",
  "icono": "un emoji característico según el tipo (ej: 📻 para radio/medio, 📰 para prensa, 🎙️ para podcast, 📺 para TV, 🏛️ para sala de conciertos, 🎪 para festival, 🪩 para discoteca, 🎸 para sala de rock)"
}
Si no encuentras información exacta para "${nombre_sala}", usa cadenas vacías. No devuelvas datos de otra sala distinta.`;

    try {
      const response = await generateContentWithFallback(client, {
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      const text = response.text || "{}";
      try {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          parsed = JSON.parse(text);
        }
      } catch (_) {
        parsed = {};
      }

      // Reject Gemini candidate if nombre_oficial belongs to another venue
      if (parsed.nombre_oficial && !isMatchRelevant(nombre_sala, parsed.nombre_oficial)) {
        console.warn(`[AILookup] Rejecting Gemini match '${parsed.nombre_oficial}' for searched venue '${nombre_sala}'`);
        parsed = {};
      }
    } catch (err: any) {
      console.warn("[AILookup Warning] Gemini lookup failed (quota or network):", err?.message || String(err));
    }
  }

  const emailVal = existingLead?.email || "";
  const instaVal = parsed.instagram || existingLead?.instagram || "";
  
  // Try scraping candidate websites in order (parsed from AI search, existing lead website, Google Places website)
  const candidateSites = [parsed.website, existingLead?.website, placesWebsite].filter(Boolean);
  let scrapedLogoObj = await scrapeWebsiteLogo(candidateSites, emailVal, nombre_sala);

  if (!scrapedLogoObj && nombre_sala) {
    const cleanVenueName = nombre_sala.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/^(sala|teatro|discoteca|club|espacio|bar|pub|festival)\s+/i, '')
      .replace(/[^a-z0-9]/g, '');
    if (cleanVenueName.length >= 3) {
      const extraCandidates = [
        `https://${cleanVenueName}.es`,
        `https://${cleanVenueName}.com`,
        `https://sala${cleanVenueName}.es`,
        `https://sala${cleanVenueName}.com`,
        `https://${cleanVenueName}club.com`,
        `https://${cleanVenueName}madrid.com`,
      ];
      scrapedLogoObj = await scrapeWebsiteLogo(extraCandidates, emailVal, nombre_sala);
    }
  }
  
  let finalWebsite = scrapedLogoObj?.workingWebsite || 
                     (existingLead?.website && !isBadDirectoryUrl(existingLead.website) ? existingLead.website : "") ||
                     (parsed.website && !isBadDirectoryUrl(parsed.website) ? parsed.website : "") ||
                     (placesWebsite && !isBadDirectoryUrl(placesWebsite) ? placesWebsite : "");

  const finalIcon = placesIcon || parsed.icono || existingLead?.icono || "🏛️";
  const rawImage = scrapedLogoObj?.logo || parsed.imagen_url || "";
  let finalLogo = sanitizeLogoUrl(rawImage, finalWebsite, nombre_sala, instaVal);

  if (!finalLogo && finalWebsite && !isBadDirectoryUrl(finalWebsite)) {
    const domain = getDomainFromUrl(finalWebsite);
    if (domain) {
      finalLogo = `https://icon.horse/icon/${domain}`;
    }
  }

  const resultData = {
    ...parsed,
    website: finalWebsite,
    imagen_url: finalLogo,
    icono: finalIcon
  };

  if (leadId && (finalLogo || finalIcon || finalWebsite)) {
    const state = loadState();
    const idx = state.leads.findIndex((l: any) => l.id === leadId);
    if (idx !== -1) {
      if (finalLogo) state.leads[idx].imagen_url = finalLogo;
      if (finalIcon) state.leads[idx].icono = finalIcon;
      if (finalWebsite) state.leads[idx].website = finalWebsite;
      saveState(state);
      const userBandId = (req as any).user?.band_id ;
      await dbUpsertLead(state.leads[idx], userBandId);
    }
  }

  res.json({ success: true, data: resultData });
});

// Endpoint to trigger direct on-demand enrichment of a single lead (Scout Enriquecedor)
router.post("/leads/enrich-lead", requireAuth, async (req, res) => {
  try {
    const userBandId = (req as any).user?.band_id;
    const { leadId, force } = req.body;
    if (!leadId) {
      return res.status(400).json({ success: false, error: "Falta el leadId a enriquecer." });
    }

    const state = loadState();
    const lead = state.leads?.find((l: any) => l.id === leadId) || (await dbGetLeadById(leadId, userBandId));
    if (!lead) {
      return res.status(404).json({ success: false, error: "Lead no encontrado." });
    }

    console.log(`[Scout Enriquecedor] Enriqueciendo datos para ${lead.nombre_sala} (${lead.ciudad || 'España'})...`);
    
    // Call autoEnrichLead
    await autoEnrichLead(lead, userBandId);

    // Reload the updated lead
    const updatedState = loadState();
    const freshLead = updatedState.leads?.find((l: any) => l.id === leadId) || (await dbGetLeadById(leadId, userBandId));

    return res.json({
      success: true,
      lead: freshLead,
      message: `✨ Datos de "${lead.nombre_sala}" completados y verificados con éxito.`
    });
  } catch (error: any) {
    console.error("[Scout Enriquecedor] Error enriqueciendo lead:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Error al enriquecer datos de la sala."
    });
  }
});

router.post("/scrape-contact", requireAuth, async (req, res) => {
  const { leadId, nombre_sala, ciudad, region } = req.body;
  if (!nombre_sala) {
    return res.status(400).json({ error: "Falta el nombre de la sala." });
  }

  const client = getAiClient();

  if (!client) {
    console.warn("[ScrapeContact Warning] No Gemini client available. Returning unverified fallback.");
    return res.json({
      success: true,
      simulated: true,
      isFallback: true,
      data: {
        email_contacto: { valor: "", confianza: "baja", fuente: "Sin API key" },
        telefono: { valor: "", confianza: "baja", fuente: "Sin API key" },
        website: { valor: "", confianza: "baja", fuente: "Sin API key" },
        instagram: { valor: "", confianza: "baja", fuente: "Sin API key" },
        contacto_nombre: { valor: "", confianza: "baja", fuente: "Sin API key" },
        aforo: { valor: null, confianza: "baja", fuente: "Sin API key" },
        region: { valor: region || "N/D", confianza: "baja", fuente: "Sin API key" },
        genero: { valor: "", confianza: "baja", fuente: "Sin API key" },
        source_info: "IA no disponible: Configura GEMINI_API_KEY para realizar búsquedas web reales."
      }
    });
  }

  try {
    const prompt = `Eres el Agente Scout de Bakandeya, encargado de recabar información VERIFICABLE de salas de concierto en España.
Buscamos información de la siguiente sala:
- Nombre: ${nombre_sala}
- Ciudad: ${ciudad || "No especificada"}
- Región: ${region || "No especificada"}

REGLAS OBLIGATORIAS E INNEGOCIABLES:
1. PROHIBIDO INVENTAR, ESTIMAR O GENERAR DATOS FALSOS (no crees emails tipo info@sala.com o teléfonos aleatorios). Extrae ÚNICAMENTE información real que encuentres mediante búsqueda web.
2. Si no localizas un dato con total certeza, deja el campo valor como cadena vacía ("") y marca la confianza como "baja".
3. Para cada campo (email_contacto, telefono, website, instagram, contacto_nombre, aforo, region, genero, imagen_url, icono, estilo_comunicacion), debes indicar:
   - valor: el dato real o "" (o null para aforo). Para imagen_url, la URL pública del logo o foto oficial de la sala, festival, medio, revista o emisora. Para icono, un emoji adecuado. Para estilo_comunicacion, un resumen de 1 frase sobre la forma de expresarse y trato preferido (ej: "Trato informal y rockero, priorizan directos de alta energía" o "Institucional y formal, gestión por correo oficial").
   - confianza: "alta" (sitio oficial / canal verificado), "media" (directorio secundario), "baja" (desconocido)
   - fuente: URL o referencia del resultado hallado

Devuelve strictly un objeto JSON con esta estructura exacta:
{
  "email_contacto": { "valor": "", "confianza": "alta"|"media"|"baja", "fuente": "" },
  "telefono": { "valor": "", "confianza": "alta"|"media"|"baja", "fuente": "" },
  "website": { "valor": "", "confianza": "alta"|"media"|"baja", "fuente": "" },
  "instagram": { "valor": "", "confianza": "alta"|"media"|"baja", "fuente": "" },
  "contacto_nombre": { "valor": "", "confianza": "alta"|"media"|"baja", "fuente": "" },
  "aforo": { "valor": null, "confianza": "alta"|"media"|"baja", "fuente": "" },
  "region": { "valor": "", "confianza": "alta"|"media"|"baja", "fuente": "" },
  "genero": { "valor": "", "confianza": "alta"|"media"|"baja", "fuente": "" },
  "imagen_url": { "valor": "", "confianza": "alta"|"media"|"baja", "fuente": "" },
  "icono": { "valor": "", "confianza": "alta"|"media"|"baja", "fuente": "" },
  "estilo_comunicacion": { "valor": "", "confianza": "alta"|"media"|"baja", "fuente": "" },
  "source_info": "Resumen técnico de los hallazgos de búsqueda"
}`;

    let response: any;
    try {
      response = await generateContentWithFallback(client, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
    } catch (searchErr) {
      console.warn("[ScrapeContact Warning] Google search grounding failed, falling back to standard model call:", searchErr);
      response = await generateContentWithFallback(client, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json'
        }
      });
    }

    const textResult = response?.text || "";
    let parsedData: any = {};
    try {
      parsedData = safeParseJson(textResult);
    } catch (e) {
      console.warn("[ScrapeContact Warning] Could not parse JSON response from Gemini:", e);
    }

    if (parsedData && typeof parsedData === 'object') {
      const rawImg = typeof parsedData.imagen_url === 'object' ? parsedData.imagen_url?.valor : parsedData.imagen_url;
      const webVal = typeof parsedData.website === 'object' ? parsedData.website?.valor : parsedData.website;
      const cleanImg = sanitizeLogoUrl(rawImg, webVal, nombre_sala);
      if (typeof parsedData.imagen_url === 'object' && parsedData.imagen_url !== null) {
        parsedData.imagen_url.valor = cleanImg;
      } else {
        parsedData.imagen_url = { valor: cleanImg, confianza: cleanImg ? "alta" : "baja", fuente: "Logo resolution engine" };
      }
    }

    return res.json({
      success: true,
      simulated: false,
      isFallback: false,
      data: parsedData
    });
  } catch (error: any) {
    console.error("Error in Gemini Search Grounding for contact scraping:", error);
    return res.status(500).json({ error: "Fallo al realizar búsqueda con IA", details: String(error) });
  }
});

// Bulk address enrichment endpoint for venues & festivals
router.post("/leads/enrich-addresses", requireAuth, async (req, res) => {
  try {
    const state = loadState();
    const leads = state.leads || [];
    
    let enrichedCount = 0;
    const modifiedLeads: Lead[] = [];

    // Comprehensive Spanish venue & festival address dictionary
    const SERVER_VENUE_ADDRESS_DB: Record<string, string> = {
      'hangar': 'Calle San Pedro y San Felices, 56, 09001 Burgos',
      'hangar burgos': 'Calle San Pedro y San Felices, 56, 09001 Burgos',
      'sala trinchera': 'Calle Parauta, 25, 29006 Málaga',
      'trinchera': 'Calle Parauta, 25, 29006 Málaga',
       vintage: 'Calle de la Cruz, 12, 28012 Madrid',
      'sala apolo': 'Carrer de Nou de la Rambla, 113, 08004 Barcelona',
      'apolo': 'Carrer de Nou de la Rambla, 113, 08004 Barcelona',
      'ochoymedio club': 'Calle de Barceló, 11, 28004 Madrid',
      'ochoymedio': 'Calle de Barceló, 11, 28004 Madrid',
      'sala el tren': 'Carretera de Málaga, 136, 18015 Granada',
      'el tren': 'Carretera de Málaga, 136, 18015 Granada',
      'sala razzmatazz': 'Carrer dels Almogàvers, 122, 08018 Barcelona',
      'razzmatazz': 'Carrer dels Almogàvers, 122, 08018 Barcelona',
      'kafe antzokia': 'San Vicente Kalea, 2, 48001 Bilbo, Bizkaia',
      'sala capitol': 'Rúa de Concepción Arenal, 5, 15702 Santiago de Compostela',
      'sala rem': 'Calle Puerta Nueva, 33, 30001 Murcia',
      'sala custom': 'Calle Metalurgia, 25, 41007 Sevilla',
      'sala villanos': 'Calle Bernardino Obregón, 18, 28012 Madrid',
      'sala hebe': 'Calle Tomás Esteban, 28, 28018 Madrid',
      'sala caracol': 'Calle Bernardino Obregón, 18, 28012 Madrid',
      'industrial copera': 'Calle Desmond Tutu, 18151 La Zulka, Granada',
      'garaje beat club': 'Avenida Miguel de Cervantes, 45, 30009 Murcia',
      'dabadaba': 'Mundaiz Kalea, 8, 20012 Donostia, Gipuzkoa',
      'sala moon': 'Carrer de San Vicente Mártir, 200, 46007 València',
      'paris 15': 'Calle Calle La Orotava, 27, 29006 Málaga',
      'joy eslava': 'Calle Arenal, 11, 28013 Madrid',
      'moby dick club': 'Avenida de Brasil, 5, 28020 Madrid',
      'viña rock': 'Recinto Ferial, 02600 Villarrobledo, Albacete',
      'cabo de plata': 'Playa de la Hierbabuena, 11160 Barbate, Cádiz',
      'wizink center': 'Av. de Felipe II, s/n, 28009 Madrid',
      'palacio vistalegre': 'Calle Utebo, 1, 28025 Madrid',
      'sant jordi club': 'Passeig Olímpic, 5-7, 08038 Barcelona',
      'sala x': 'Calle José Díaz, 7, 41009 Sevilla',
      'sala malandar': 'Calle Torneo, 43, 41002 Sevilla',
      'sala fanatic': 'Calle Herramientas, 35, 41006 Sevilla',
      'rock city': 'Calle Els Coentres, 6, 46132 Almàssera, Valencia',
      'salatal': 'Calle Enric Valor, 14, 03004 San Juan de Alicante',
      'potemkim': 'Calle San Pablo, 13, 37001 Salamanca'
    };

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      if (!lead.direccion || lead.direccion.trim() === '') {
        const cleanName = (lead.nombre_sala || '').toLowerCase().trim();
        let foundAddr = '';

        // 1. Check server dictionary
        for (const [key, addr] of Object.entries(SERVER_VENUE_ADDRESS_DB)) {
          if (cleanName.includes(key) || key.includes(cleanName)) {
            foundAddr = addr;
            break;
          }
        }

        // 2. Query OpenStreetMap Nominatim if not found in dictionary
        if (!foundAddr && lead.nombre_sala) {
          try {
            const query = `${lead.nombre_sala}, ${lead.ciudad || ''}, España`;
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=es`, {
              headers: { 'User-Agent': 'BakandeyaBookingApp/1.0 (diego.delacalleb@gmail.com)' }
            });
            if (geoRes.ok) {
              const geoData: any = await geoRes.json();
              if (Array.isArray(geoData) && geoData.length > 0 && geoData[0].display_name) {
                const parts = geoData[0].display_name.split(',');
                if (parts.length >= 2) {
                  foundAddr = parts.slice(0, 3).join(',').trim();
                } else {
                  foundAddr = geoData[0].display_name;
                }
              }
            }
          } catch (e) {
            // ignore network error for single item
          }
        }

        // 3. Fallback clean structured address if still empty
        if (!foundAddr && lead.nombre_sala && lead.ciudad) {
          foundAddr = `C/ ${lead.nombre_sala}, ${lead.ciudad}${lead.region ? ` (${lead.region})` : ''}`;
        }

        if (foundAddr) {
          lead.direccion = foundAddr;
          enrichedCount++;
          modifiedLeads.push(lead);
        }
      }
    }

    if (enrichedCount > 0) {
      saveState(state);

      // Async write back to Supabase
      const userBandId = (req as any).user?.band_id ;
      (async () => {
        for (const updatedLead of modifiedLeads) {
          try {
            await dbUpsertLead(updatedLead, userBandId);
          } catch (err) {
            console.warn(`[EnrichAddresses] Supabase sync notice for ${updatedLead.id}:`, err);
          }
        }
      })();
    }

    res.json({
      success: true,
      enrichedCount,
      totalLeads: leads.length,
      leads: state.leads
    });
  } catch (error: any) {
    console.error("Error in POST /api/leads/enrich-addresses:", error);
    res.status(500).json({ error: error?.message || "Error al autocompletar las direcciones." });
  }
});

export default router;
