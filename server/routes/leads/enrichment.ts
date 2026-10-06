import express from "express";
import { Lead } from "../../../src/types.js";
import { loadState, saveState, requireAuth } from "../../state.js";
import { dbGetLeadById, dbUpsertLead, dbGetLeads } from "../../db.js";
import { dbGetCampaigns } from "../../db/campaigns.js";
import { getAiClient, generateContentWithFallback, isSpendCapOrQuotaError } from "../../ai.js";
import { autoEnrichLead } from "../../auto_enrichment.js";
import { safeParseJson } from "../../utils.js";
import { isBadDirectoryUrl, getDomainFromUrl } from "./helpers.js";
import { esUrlExternaSegura } from "../../utils/ssrfGuard.js";
import { getTargetBandId, mismaBanda } from "../../utils/bandAccess.js";
import { scrapeVenueWithJina } from "../../services/jinaReaderService.js";
import { detectVenueEventsAndFreeDates } from "../../services/venueEventsRadarService.js";
import { scrapeInstagramVenueProfile } from "../../services/apifyInstagramService.js";
import { calculateSpotifyCityDemand } from "../../services/spotifyAudienceService.js";
import { fetchGooglePlacesVenueInfo } from "../../services/googlePlacesVenueService.js";
import { fetchSetlistVenueHistory } from "../../services/setlistVenueService.js";
import { verifyEmailDeliverability } from "../../services/emailDeliverabilityService.js";
import { calculateTourLogistics } from "../../services/tourLogisticsService.js";
import { fetchVenueSocialEngagement } from "../../services/socialEngagementService.js";
import { calculateConcertFinancialBreakEven } from "../../services/financialBreakEvenService.js";
import { calculateBookingWindow } from "../../services/bookingWindowService.js";
import { detectLocalEventsAndClashes } from "../../services/localEventsClashService.js";
import { findLocalPressAndMedia } from "../../services/localPressMediaService.js";
import { findLocalBandPartners } from "../../services/localBandPartnersService.js";

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
      // isBadDirectoryUrl solo filtra dominios de directorios/redes conocidos, no IPs privadas ni
      // el endpoint de metadatos de la nube: sin esto, un website/dominio de email apuntando a la
      // red interna haría que el servidor hiciera esa petición y devolviera lo encontrado (SSRF).
      if (!(await esUrlExternaSegura(siteUrl))) continue;
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
  
  const finalWebsite = scrapedLogoObj?.workingWebsite || 
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
    const userBandId = getTargetBandId(req);
    const { leadId, name, city, force } = req.body;
    
    let lead: Lead | undefined;
    const state = loadState();

    // `state.leads` es una caché global con leads de VARIAS bandas: filtrar siempre por la banda
    // de la sesión. Antes, un id (o un nombre de sala) de otra banda presente en la caché se
    // enriquecía y se devolvía entero.
    const delaBanda = (l: any) => mismaBanda(l?.band_id, userBandId);
    if (leadId) {
      lead = state.leads?.find((l: any) => l.id === leadId && delaBanda(l)) || (await dbGetLeadById(leadId, userBandId));
    } else if (name) {
      const cleanName = name.toLowerCase().trim();
      lead = state.leads?.find((l: any) => delaBanda(l) && l.nombre_sala?.toLowerCase().trim() === cleanName);
    }

    if (!lead) {
      return res.status(404).json({ success: false, error: "Lead no encontrado." });
    }

    console.log(`[Scout Enriquecedor] Enriqueciendo datos para ${lead.nombre_sala} (${lead.ciudad || 'España'})...`);
    
    // Call autoEnrichLead
    const enrichedLead = await autoEnrichLead(lead, userBandId);

    // Reload the updated lead
    const updatedState = loadState();
    const freshLead = updatedState.leads?.find((l: any) => l.id === lead.id) || enrichedLead || (await dbGetLeadById(lead.id, userBandId));

    return res.json({
      success: true,
      lead: freshLead,
      data: {
        email: freshLead?.email_contacto,
        phone: freshLead?.telefono || freshLead?.telefono_movil || freshLead?.telefono_fijo,
        website: freshLead?.website,
        capacity: freshLead?.aforo,
        address: freshLead?.direccion,
        instagram: freshLead?.instagram
      },
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

// Endpoint to enrich all leads belonging to the current band
router.post("/leads/enrich-all-band", requireAuth, async (req, res) => {
  try {
    const targetBandId = getTargetBandId(req);
    const state = loadState();
    const leads = (state.leads || []).filter((l: Lead) => !l.band_id || l.band_id === targetBandId || l.band_id === "default");

    let enrichedCount = 0;
    const results: Array<{ id: string; name: string; updatedFields: string[] }> = [];

    for (const lead of leads) {
      const prevData = {
        email: lead.email_contacto,
        phone: lead.telefono || lead.telefono_movil || lead.telefono_fijo,
        address: lead.direccion,
        website: lead.website,
        capacity: lead.aforo,
        instagram: lead.instagram
      };

      try {
        const enriched = await autoEnrichLead(lead, targetBandId);
        const updatedFields: string[] = [];
        if (enriched.email_contacto && !prevData.email) updatedFields.push("email");
        if ((enriched.telefono || enriched.telefono_movil) && !prevData.phone) updatedFields.push("teléfono");
        if (enriched.direccion && !prevData.address) updatedFields.push("dirección");
        if (enriched.website && !prevData.website) updatedFields.push("website");
        if (enriched.aforo && !prevData.capacity) updatedFields.push("aforo");
        if (enriched.instagram && !prevData.instagram) updatedFields.push("instagram");

        if (updatedFields.length > 0) {
          enrichedCount++;
          results.push({ id: lead.id, name: lead.nombre_sala, updatedFields });
        }
      } catch (err) {
        console.warn(`[EnrichAll] Error en lead ${lead.nombre_sala}:`, err);
      }
    }

    const freshState = loadState();
    return res.json({
      success: true,
      enrichedCount,
      totalLeads: leads.length,
      results,
      leads: freshState.leads
    });
  } catch (error: any) {
    console.error("Error in /leads/enrich-all-band:", error);
    return res.status(500).json({ success: false, error: error?.message || "Error al enriquecer todos los leads" });
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
    const prompt = `Eres el Agente Scout de BandManager, encargado de recabar información VERIFICABLE de salas de concierto en España.
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
    } catch (searchErr: any) {
      if (!isSpendCapOrQuotaError(searchErr)) {
        console.warn("[ScrapeContact Warning] Google search grounding failed, falling back to standard model call:", searchErr?.message || searchErr);
        response = await generateContentWithFallback(client, {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseMimeType: 'application/json'
          }
        });
      } else {
        throw searchErr;
      }
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
      'industrial copera': 'Calle Desmond Tutu, 18151 La Zubia, Granada',
      'garaje beat club': 'Avenida Miguel de Cervantes, 45, 30009 Murcia',
      'dabadaba': 'Mundaiz Kalea, 8, 20012 Donostia, Gipuzkoa',
      'sala moon': 'Carrer de San Vicente Mártir, 200, 46007 València',
      'paris 15': 'Calle Calle La Orotava, 27, 29006 Málaga',
      'joy eslava': 'Calle Arenal, 11, 28013 Madrid',
      'moby dick club': 'Avenida de Brasil, 5, 28020 Madrid',
      'viña rock': 'Recinto Ferial, 02600 Villarrobledo, Albacete',
      'cabo de plata': 'Playa de la Hierbabuena, 11160 Barbate, Cádiz',
      'pirineos sur': 'Auditorio Natural de Lanuza, 22661 Sallent de Gállego, Huesca',
      'ayuntamiento de burgos': 'Plaza Mayor, 1, 09001 Burgos',
      'ayuntamiento de logroño': 'Avenida de la Paz, 11, 26071 Logroño, La Rioja',
      'mondosonoro': 'Carrer de Floridablanca, 53, 08015 Barcelona',
      'radio 3': 'Avenida Radio Televisión, 4, 28223 Pozuelo de Alarcón, Madrid',
      'propaganda pel fet': 'Carrer de Roger de Flor, 222, 08013 Barcelona',
      'sala siroco': 'Calle de San Dimas, 3, Centro, 28015 Madrid',
      'siroco': 'Calle de San Dimas, 3, Centro, 28015 Madrid',
      'vallekas ska': 'Calle Monte Igueldo, 28018 Madrid',
      'balkan boom': 'Carrer de Pujades, 08018 Barcelona',
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
              headers: { 'User-Agent': 'BandManagerApp/1.0 (info@bandmanager.io)' }
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

        // Nota: antes había un paso 3 que, si el diccionario y Nominatim no encontraban nada,
        // fabricaba una dirección falsa usando el nombre de la sala como si fuera el nombre de
        // una calle (p. ej. "C/ Sala El Tren, Granada"). Un dato inventado es peor que un campo
        // vacío: puede acabar usándose para logística real de un concierto. Se ha quitado.

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

/**
 * POST /api/leads/:id/enrich-jina
 * Utiliza Jina Reader (r.jina.ai) para parsear el sitio web de la sala sin gastar tokens.
 * Extrae móviles (WhatsApp), fijos, emails de programación, aforo y rider.
 */
router.post(["/leads/:id/enrich-jina", "/:id/enrich-jina"], requireAuth, async (req, res) => {
  try {
    const targetBandId = getTargetBandId(req);
    const lead = await dbGetLeadById(req.params.id, targetBandId);
    if (!lead) {
      return res.status(404).json({ success: false, error: "Lead no encontrado o no pertenece a tu banda" });
    }

    const website = lead.website || (req.body?.website as string);
    if (!website) {
      return res.status(400).json({ success: false, error: "La sala no tiene sitio web registrado para escanear" });
    }

    const jinaData = await scrapeVenueWithJina(website);
    if (!jinaData.success) {
      return res.status(422).json({ success: false, error: jinaData.error || "No se pudo leer la web con Jina Reader" });
    }

    const updates: Partial<Lead> = {};
    if (jinaData.telefono_movil && !lead.telefono_movil) {
      updates.telefono_movil = jinaData.telefono_movil;
      if (!lead.telefono) updates.telefono = jinaData.telefono_movil;
    }
    if (jinaData.telefono_fijo && !lead.telefono_fijo) {
      updates.telefono_fijo = jinaData.telefono_fijo;
      if (!lead.telefono && !updates.telefono) updates.telefono = jinaData.telefono_fijo;
    }
    if (jinaData.email_contacto && (!lead.email_contacto || lead.email_contacto.includes("sentry"))) {
      updates.email_contacto = jinaData.email_contacto;
    }
    if (jinaData.email_secundario && !lead.email_secundario) {
      updates.email_secundario = jinaData.email_secundario;
    }
    if (jinaData.aforo && (!lead.aforo || lead.aforo === 0)) {
      updates.aforo = jinaData.aforo;
    }
    if (jinaData.contacto_nombre && !lead.contacto_nombre) {
      updates.contacto_nombre = jinaData.contacto_nombre;
    }
    if (jinaData.rider_specs) {
      const notaRider = `[Rider Web]: ${jinaData.rider_specs}`;
      updates.notas = lead.notas ? `${lead.notas}\n${notaRider}` : notaRider;
    }

    const updatedLead = { ...lead, ...updates };
    const saved = await dbUpsertLead(updatedLead, targetBandId);

    res.json({
      success: true,
      lead: saved || updatedLead,
      extracted: jinaData
    });
  } catch (error: any) {
    console.error("Error in POST /api/leads/:id/enrich-jina:", error);
    res.status(500).json({ success: false, error: error?.message || "Error al procesar con Jina Reader" });
  }
});

/**
 * POST /api/leads/:id/detect-dates
 * Radar de Wegow y ticketing: detecta conciertos ocupados y calcula fines de semana libres detectados.
 */
router.post(["/leads/:id/detect-dates", "/:id/detect-dates"], requireAuth, async (req, res) => {
  try {
    const targetBandId = getTargetBandId(req);
    const lead = await dbGetLeadById(req.params.id, targetBandId);
    if (!lead) {
      return res.status(404).json({ success: false, error: "Lead no encontrado o no pertenece a tu banda" });
    }

    const campaigns = await dbGetCampaigns(targetBandId);
    const activeCampaign = campaigns.find(c => c.isActive || (c as any).is_active);
    const campaignTargetDates = req.body?.campaignTargetDates || activeCampaign?.targetDates || activeCampaign?.targetDatesText || (activeCampaign as any)?.target_dates || (activeCampaign as any)?.target_dates_text;

    const radar = await detectVenueEventsAndFreeDates(lead.nombre_sala, lead.ciudad || "", campaignTargetDates, lead.website);
    
    const updates: Partial<Lead> = {
      fechas_ocupadas: radar.fechas_ocupadas,
      fechas_libres_detectadas: radar.fechas_libres_detectadas,
      disponible_para_campana: radar.disponible_para_campana,
      fechas_ocupadas_campana: radar.fechas_ocupadas_campana,
      fechas_libres_campana: radar.fechas_libres_campana,
      datos_fechas_encontrados: radar.datos_fechas_encontrados,
      mensaje_disponibilidad: radar.mensaje_disponibilidad,
      radar_fuentes_verificadas: radar.fuentes_verificadas,
      radar_wegow_status: radar.radar_wegow_status,
      radar_bandsintown_status: radar.radar_bandsintown_status,
      contrastado_multi_fuente: radar.contrastado_multi_fuente,
      fiabilidad_radar: radar.fiabilidad_radar,
      estado_cartelera: radar.estado_cartelera,
      max_fecha_publicada: radar.max_fecha_publicada,
      min_fecha_publicada: radar.min_fecha_publicada
    };

    const updatedLead = { ...lead, ...updates };
    const saved = await dbUpsertLead(updatedLead, targetBandId);

    res.json({
      success: true,
      lead: saved || updatedLead,
      radar
    });
  } catch (error: any) {
    console.error("Error in POST /api/leads/:id/detect-dates:", error);
    res.status(500).json({ success: false, error: error?.message || "Error detectando disponibilidad de fechas" });
  }
});

/**
 * POST /api/leads/detect-all-dates
 * Escanea la disponibilidad y cartelera de Wegow de forma masiva para todos los leads o un lote de la campaña.
 */
router.post(["/leads/detect-all-dates", "/detect-all-dates"], requireAuth, async (req, res) => {
  try {
    const targetBandId = getTargetBandId(req);
    const { leadIds } = req.body || {};

    const allLeads = await dbGetLeads(targetBandId);
    let targetLeads = allLeads;

    if (Array.isArray(leadIds) && leadIds.length > 0) {
      const idSet = new Set(leadIds);
      targetLeads = allLeads.filter(l => idSet.has(l.id));
    }

    // Filtrar preferentemente salas o espacios con nombre de sala
    targetLeads = targetLeads.filter(l => l.nombre_sala && l.nombre_sala.trim());

    if (targetLeads.length === 0) {
      return res.status(400).json({ success: false, error: "No hay recintos válidos para escanear" });
    }

    const campaigns = await dbGetCampaigns(targetBandId);
    const activeCampaign = campaigns.find(c => c.isActive || (c as any).is_active);
    const campaignTargetDates = req.body?.campaignTargetDates || activeCampaign?.targetDates || activeCampaign?.targetDatesText || (activeCampaign as any)?.target_dates || (activeCampaign as any)?.target_dates_text;

    const updatedLeads: Lead[] = [];
    let totalFreeDates = 0;
    let totalOccupiedDates = 0;

    for (const lead of targetLeads.slice(0, 15)) { // Escaneo en lote de hasta 15 recintos
      try {
        const radar = await detectVenueEventsAndFreeDates(lead.nombre_sala, lead.ciudad || "", campaignTargetDates, lead.website);
        const updates: Partial<Lead> = {
          fechas_ocupadas: radar.fechas_ocupadas || [],
          fechas_libres_detectadas: radar.fechas_libres_detectadas || [],
          disponible_para_campana: radar.disponible_para_campana,
          fechas_ocupadas_campana: radar.fechas_ocupadas_campana,
          fechas_libres_campana: radar.fechas_libres_campana,
          datos_fechas_encontrados: radar.datos_fechas_encontrados,
          mensaje_disponibilidad: radar.mensaje_disponibilidad,
          radar_fuentes_verificadas: radar.fuentes_verificadas,
          radar_wegow_status: radar.radar_wegow_status,
          radar_bandsintown_status: radar.radar_bandsintown_status,
          contrastado_multi_fuente: radar.contrastado_multi_fuente,
          fiabilidad_radar: radar.fiabilidad_radar,
          estado_cartelera: radar.estado_cartelera,
          max_fecha_publicada: radar.max_fecha_publicada,
          min_fecha_publicada: radar.min_fecha_publicada
        };
        const updatedLead = { ...lead, ...updates };
        const saved = await dbUpsertLead(updatedLead, targetBandId);
        updatedLeads.push(saved || updatedLead);
        totalFreeDates += (radar.fechas_libres_detectadas?.length || 0);
        totalOccupiedDates += (radar.fechas_ocupadas?.length || 0);
      } catch (err) {
        console.warn(`Error escaneando fechas para ${lead.nombre_sala}:`, err);
      }
    }

    res.json({
      success: true,
      processedCount: updatedLeads.length,
      totalFreeDates,
      totalOccupiedDates,
      updatedLeads
    });
  } catch (error: any) {
    console.error("Error in POST /api/leads/detect-all-dates:", error);
    res.status(500).json({ success: false, error: error?.message || "Error en el escaneo masivo de fechas" });
  }
});

/**
 * POST /api/leads/batch-enrich-campaign
 * Ejecuta la actualización y enriquecimiento omnicanal masivo (Radar Multi-fuente, fechas objetivo de la campaña activa, contactos)
 * para todos los leads filtrados por la campaña activa de la banda (por ejemplo "Bakandeya").
 */
router.post(["/leads/batch-enrich-campaign", "/batch-enrich-campaign"], requireAuth, async (req, res) => {
  try {
    const targetBandId = getTargetBandId(req);
    const { campaignId, forceAll = false } = req.body || {};

    const campaigns = await dbGetCampaigns(targetBandId);
    let targetCampaign = campaigns.find(c => c.id === campaignId) || campaigns.find(c => c.isActive || (c as any).is_active) || campaigns[0];

    const campaignTargetDates = req.body?.campaignTargetDates || targetCampaign?.targetDates || targetCampaign?.targetDatesText || (targetCampaign as any)?.target_dates || (targetCampaign as any)?.target_dates_text;

    const allLeads = await dbGetLeads(targetBandId);
    if (!allLeads || allLeads.length === 0) {
      return res.status(400).json({ success: false, error: "No hay leads registrados para esta banda." });
    }

    // Filtrar leads asociados a la campaña activa o de la banda
    let campaignLeads = allLeads;
    if (targetCampaign && !forceAll) {
      const campNameNorm = (targetCampaign.name || "").toLowerCase().trim();
      const campIdStr = String(targetCampaign.id);

      campaignLeads = allLeads.filter(l => {
        if ((l as any).campaign_id === targetCampaign.id || (l as any).campaign_id === campIdStr) return true;
        if (l.campaña_asociada && l.campaña_asociada.toLowerCase().trim() === campNameNorm) return true;
        // Si el lead no tiene campaña explícita pero hay una campaña activa, se incluye en el proceso
        return !l.campaña_asociada;
      });
    }

    const validLeads = campaignLeads.filter(l => l.nombre_sala && l.nombre_sala.trim());
    if (validLeads.length === 0) {
      return res.json({
        success: true,
        message: "No se encontraron recintos pendientes de enriquecer para la campaña activa.",
        processedCount: 0,
        updatedLeads: []
      });
    }

    const updatedLeads: Lead[] = [];
    let totalFreeDates = 0;
    let totalAvailableForCampaign = 0;

    // Procesar en lotes seguros
    for (const lead of validLeads.slice(0, 20)) {
      try {
        const radar = await detectVenueEventsAndFreeDates(lead.nombre_sala, lead.ciudad || "", campaignTargetDates, lead.website);

        const updates: Partial<Lead> = {
          fechas_ocupadas: radar.fechas_ocupadas || [],
          fechas_libres_detectadas: radar.fechas_libres_detectadas || [],
          disponible_para_campana: radar.disponible_para_campana,
          fechas_ocupadas_campana: radar.fechas_ocupadas_campana,
          fechas_libres_campana: radar.fechas_libres_campana,
          datos_fechas_encontrados: radar.datos_fechas_encontrados,
          mensaje_disponibilidad: radar.mensaje_disponibilidad,
          radar_fuentes_verificadas: radar.fuentes_verificadas,
          radar_wegow_status: radar.radar_wegow_status,
          radar_bandsintown_status: radar.radar_bandsintown_status,
          contrastado_multi_fuente: radar.contrastado_multi_fuente,
          fiabilidad_radar: radar.fiabilidad_radar,
          estado_cartelera: radar.estado_cartelera,
          max_fecha_publicada: radar.max_fecha_publicada,
          min_fecha_publicada: radar.min_fecha_publicada
        };

        if (targetCampaign?.name) {
          updates.campaña_asociada = targetCampaign.name;
        }

        const updatedLead = { ...lead, ...updates };
        const saved = await dbUpsertLead(updatedLead, targetBandId);
        updatedLeads.push(saved || updatedLead);

        if (radar.disponible_para_campana) totalAvailableForCampaign++;
        totalFreeDates += (radar.fechas_libres_detectadas?.length || 0);
      } catch (err) {
        console.warn(`[Batch Campaign Enrich] Error actualizando lead "${lead.nombre_sala}":`, err);
      }
    }

    return res.json({
      success: true,
      campaña: targetCampaign?.name || "Campaña Activa",
      processedCount: updatedLeads.length,
      totalAvailableForCampaign,
      totalFreeDates,
      updatedLeads,
      resumen: `Se han actualizado ${updatedLeads.length} recintos de la campaña "${targetCampaign?.name || 'Activa'}" contrastando datos con Ticketmaster, Wegow y Bandsintown. ${totalAvailableForCampaign} recintos coinciden con las fechas de la campaña.`
    });
  } catch (error: any) {
    console.error("Error in POST /api/leads/batch-enrich-campaign:", error);
    return res.status(500).json({ success: false, error: error?.message || "Error al enriquecer masivamente los leads de la campaña" });
  }
});

/**
 * POST /api/leads/:id/enrich-instagram
 * Extrae WhatsApp y datos comerciales de Instagram mediante Apify (con fallback gratuito).
 */
router.post(["/leads/:id/enrich-instagram", "/:id/enrich-instagram"], requireAuth, async (req, res) => {
  try {
    const targetBandId = getTargetBandId(req);
    const lead = await dbGetLeadById(req.params.id, targetBandId);
    if (!lead) {
      return res.status(404).json({ success: false, error: "Lead no encontrado o no pertenece a tu banda" });
    }

    const igHandle = lead.instagram || (req.body?.instagram as string);
    if (!igHandle) {
      return res.status(400).json({ success: false, error: "El lead no tiene Instagram registrado" });
    }

    const igData = await scrapeInstagramVenueProfile(igHandle);
    
    const updates: Partial<Lead> = {};
    if (igData.telefono_movil && !lead.telefono_movil) {
      updates.telefono_movil = igData.telefono_movil;
      if (!lead.telefono) updates.telefono = igData.telefono_movil;
    }
    if (igData.telefono_fijo && !lead.telefono_fijo) {
      updates.telefono_fijo = igData.telefono_fijo;
    }
    if (igData.email_contacto && !lead.email_contacto) {
      updates.email_contacto = igData.email_contacto;
    }
    if (igData.website && !lead.website) {
      updates.website = igData.website;
    }

    let saved = lead;
    if (Object.keys(updates).length > 0) {
      const updatedLead = { ...lead, ...updates };
      saved = await dbUpsertLead(updatedLead, targetBandId);
    }

    res.json({
      success: true,
      lead: saved,
      data: igData
    });
  } catch (error: any) {
    console.error("Error in POST /api/leads/:id/enrich-instagram:", error);
    res.status(500).json({ success: false, error: error?.message || "Error al procesar perfil de Instagram" });
  }
});

/**
 * POST /api/leads/:id/enrich-spotify
 * Analiza audiencia de Spotify for Artists / Soundcharts para la ciudad del recinto.
 */
router.post(["/leads/:id/enrich-spotify", "/:id/enrich-spotify"], requireAuth, async (req, res) => {
  try {
    const targetBandId = getTargetBandId(req);
    const lead = await dbGetLeadById(req.params.id, targetBandId);
    if (!lead) {
      return res.status(404).json({ success: false, error: "Lead no encontrado o no pertenece a tu banda" });
    }

    const state = loadState();
    const band = state.bands?.find((b: any) => b.id === targetBandId);
    const bandName = band?.nombre || "la banda";
    const bandGenre = band?.genero || lead.genero || "música en directo";

    const spotifyDemand = await calculateSpotifyCityDemand(
      bandName,
      bandGenre,
      lead.ciudad || "Madrid",
      lead.aforo || 300
    );

    const updatedLead: Lead = {
      ...lead,
      spotify_city_demand: {
        oyentes_ciudad: spotifyDemand.oyentes_ciudad,
        afinidad_genero: spotifyDemand.afinidad_genero,
        prediccion_entradas: spotifyDemand.prediccion_entradas,
        porcentaje_ocupacion_estimado: spotifyDemand.porcentaje_ocupacion_estimado,
        top_ciudades_ranking: spotifyDemand.top_ciudades_ranking
      }
    };

    const saved = await dbUpsertLead(updatedLead, targetBandId);
    res.json({ success: true, lead: saved, data: spotifyDemand });
  } catch (error: any) {
    console.error("Error in POST /api/leads/:id/enrich-spotify:", error);
    res.status(500).json({ success: false, error: error?.message || "Error al analizar audiencia de Spotify" });
  }
});

/**
 * POST /api/leads/:id/enrich-google-places
 * Extrae fotos del escenario, valoración en Google Maps y detalles de acceso/carga.
 */
router.post(["/leads/:id/enrich-google-places", "/:id/enrich-google-places"], requireAuth, async (req, res) => {
  try {
    const targetBandId = getTargetBandId(req);
    const lead = await dbGetLeadById(req.params.id, targetBandId);
    if (!lead) {
      return res.status(404).json({ success: false, error: "Lead no encontrado o no pertenece a tu banda" });
    }

    const placesInfo = await fetchGooglePlacesVenueInfo(
      lead.nombre_sala,
      lead.ciudad || "Madrid",
      lead.direccion
    );

    const updatedLead: Lead = {
      ...lead,
      google_places_info: {
        rating: placesInfo.rating,
        total_reviews: placesInfo.total_reviews,
        fotos: placesInfo.fotos,
        horario_carga: placesInfo.horario_carga,
        resumen_acustica: placesInfo.resumen_acustica,
        acceso_backline: placesInfo.acceso_backline,
        place_id: placesInfo.place_id
      }
    };

    const saved = await dbUpsertLead(updatedLead, targetBandId);
    res.json({ success: true, lead: saved, data: placesInfo });
  } catch (error: any) {
    console.error("Error in POST /api/leads/:id/enrich-google-places:", error);
    res.status(500).json({ success: false, error: error?.message || "Error al obtener datos de Google Places" });
  }
});

/**
 * POST /api/leads/:id/enrich-setlist
 * Extrae historial de conciertos, bandas similares y referencias de booking de Setlist.fm.
 */
router.post(["/leads/:id/enrich-setlist", "/:id/enrich-setlist"], requireAuth, async (req, res) => {
  try {
    const targetBandId = getTargetBandId(req);
    const lead = await dbGetLeadById(req.params.id, targetBandId);
    if (!lead) {
      return res.status(404).json({ success: false, error: "Lead no encontrado o no pertenece a tu banda" });
    }

    const setlistInfo = await fetchSetlistVenueHistory(
      lead.nombre_sala,
      lead.ciudad || "Madrid",
      lead.genero || "Mestizaje / Rock / Fusión"
    );

    const updatedLead: Lead = {
      ...lead,
      setlist_history: {
        bandas_similares_recientes: setlistInfo.bandas_similares_recientes,
        fecha_ultimo_concierto: setlistInfo.fecha_ultimo_concierto,
        generos_habituales: setlistInfo.generos_habituales,
        promotores_frecuentes: setlistInfo.promotores_frecuentes,
        referencia_pitch_sugerida: setlistInfo.referencia_pitch_sugerida
      }
    };

    const saved = await dbUpsertLead(updatedLead, targetBandId);
    res.json({ success: true, lead: saved, data: setlistInfo });
  } catch (error: any) {
    console.error("Error in POST /api/leads/:id/enrich-setlist:", error);
    res.status(500).json({ success: false, error: error?.message || "Error al obtener historial de Setlist.fm" });
  }
});

/**
 * POST /api/leads/:id/verify-email
 * Valida entregabilidad DNS/MX y reputación anti-spam del correo de contacto.
 */
router.post(["/leads/:id/verify-email", "/:id/verify-email"], requireAuth, async (req, res) => {
  try {
    const targetBandId = getTargetBandId(req);
    const lead = await dbGetLeadById(req.params.id, targetBandId);
    if (!lead) {
      return res.status(404).json({ success: false, error: "Lead no encontrado o no pertenece a tu banda" });
    }

    const emailToVerify = lead.email_contacto || (req.body?.email as string);
    if (!emailToVerify) {
      return res.status(400).json({ success: false, error: "El lead no tiene correo de contacto registrado" });
    }

    const verification = await verifyEmailDeliverability(emailToVerify);
    const updatedLead: Lead = {
      ...lead,
      email_verification: {
        estado: verification.estado,
        mx_valido: verification.mx_valido,
        entregabilidad_score: verification.entregabilidad_score,
        es_cuenta_rol: verification.es_cuenta_rol,
        motivo: verification.motivo,
        verificado_at: verification.verificado_at
      }
    };

    const saved = await dbUpsertLead(updatedLead, targetBandId);
    res.json({ success: true, lead: saved, data: verification });
  } catch (error: any) {
    console.error("Error in POST /api/leads/:id/verify-email:", error);
    res.status(500).json({ success: false, error: error?.message || "Error al verificar entregabilidad del correo" });
  }
});

/**
 * POST /api/leads/:id/enrich-all-apis
 * Dispara todas las herramientas API en paralelo para una sala (Spotify + Google Places + Setlist.fm + Verificación MX).
 */
router.post(["/leads/:id/enrich-all-apis", "/:id/enrich-all-apis"], requireAuth, async (req, res) => {
  try {
    const targetBandId = getTargetBandId(req);
    const lead = await dbGetLeadById(req.params.id, targetBandId);
    if (!lead) {
      return res.status(404).json({ success: false, error: "Lead no encontrado o no pertenece a tu banda" });
    }

    const state = loadState();
    const band = state.bands?.find((b: any) => b.id === targetBandId);
    const bandName = band?.nombre || "la banda";
    const bandGenre = band?.genero || lead.genero || "música en directo";

    const [
      spotifyRes,
      placesRes,
      setlistRes,
      emailRes,
      logisticsRes,
      socialRes,
      bookingWindowRes,
      localEventsRes,
      pressMediaRes,
      bandPartnersRes
    ] = await Promise.allSettled([
      calculateSpotifyCityDemand(bandName, bandGenre, lead.ciudad || "Madrid", lead.aforo || 300),
      fetchGooglePlacesVenueInfo(lead.nombre_sala, lead.ciudad || "Madrid", lead.direccion),
      fetchSetlistVenueHistory(lead.nombre_sala, lead.ciudad || "Madrid", lead.genero || bandGenre),
      lead.email_contacto ? verifyEmailDeliverability(lead.email_contacto) : Promise.resolve(null),
      calculateTourLogistics(band?.ciudad || "Madrid", lead.ciudad || "Madrid", lead.direccion),
      fetchVenueSocialEngagement(lead.nombre_sala, lead.ciudad || "Madrid", lead.instagram_handle),
      calculateBookingWindow(lead.nombre_sala, lead.tipo || "sala", lead.aforo || 200, lead.ciudad || "Madrid"),
      detectLocalEventsAndClashes(lead.ciudad || "Madrid", bandGenre),
      findLocalPressAndMedia(lead.ciudad || "Madrid", lead.nombre_sala, bandName),
      findLocalBandPartners(lead.ciudad || "Madrid", bandGenre, lead.nombre_sala)
    ]);

    const updates: Partial<Lead> = {};

    if (spotifyRes.status === "fulfilled" && spotifyRes.value) {
      const s = spotifyRes.value;
      updates.spotify_city_demand = {
        oyentes_ciudad: s.oyentes_ciudad,
        afinidad_genero: s.afinidad_genero,
        prediccion_entradas: s.prediccion_entradas,
        porcentaje_ocupacion_estimado: s.porcentaje_ocupacion_estimado,
        top_ciudades_ranking: s.top_ciudades_ranking
      };
    }

    if (placesRes.status === "fulfilled" && placesRes.value) {
      const p = placesRes.value;
      updates.google_places_info = {
        rating: p.rating,
        total_reviews: p.total_reviews,
        fotos: p.fotos,
        horario_carga: p.horario_carga,
        resumen_acustica: p.resumen_acustica,
        acceso_backline: p.acceso_backline,
        place_id: p.place_id
      };
    }

    if (setlistRes.status === "fulfilled" && setlistRes.value) {
      const sl = setlistRes.value;
      updates.setlist_history = {
        bandas_similares_recientes: sl.bandas_similares_recientes,
        fecha_ultimo_concierto: sl.fecha_ultimo_concierto,
        generos_habituales: sl.generos_habituales,
        promotores_frecuentes: sl.promotores_frecuentes,
        referencia_pitch_sugerida: sl.referencia_pitch_sugerida
      };
    }

    if (emailRes.status === "fulfilled" && emailRes.value) {
      const em = emailRes.value;
      updates.email_verification = {
        estado: em.estado,
        mx_valido: em.mx_valido,
        entregabilidad_score: em.entregabilidad_score,
        es_cuenta_rol: em.es_cuenta_rol,
        motivo: em.motivo,
        verificado_at: em.verificado_at
      };
    }

    if (logisticsRes.status === "fulfilled" && logisticsRes.value) {
      const lg = logisticsRes.value;
      updates.tour_logistics = {
        origen: lg.origen,
        distancia_km: lg.distancia_km,
        tiempo_conduccion: lg.tiempo_conduccion,
        coste_gasolina_estimado: lg.coste_gasolina_estimado,
        peajes_estimados: lg.peajes_estimados,
        coste_total_viaje: lg.coste_total_viaje,
        recomendacion_logistica: lg.recomendacion_logistica
      };
    }

    if (socialRes.status === "fulfilled" && socialRes.value) {
      const sc = socialRes.value;
      updates.social_engagement = {
        instagram_followers: sc.instagram_followers,
        engagement_rate: sc.engagement_rate,
        promedio_views_reels: sc.promedio_views_reels,
        promociona_bandas_activo: sc.promociona_bandas_activo,
        calidad_promo_sala: sc.calidad_promo_sala,
        resumen_social: sc.resumen_social
      };
    }

    if (bookingWindowRes.status === "fulfilled" && bookingWindowRes.value) {
      updates.booking_window_info = bookingWindowRes.value;
    }

    if (localEventsRes.status === "fulfilled" && localEventsRes.value) {
      updates.local_events_clash_info = localEventsRes.value;
    }

    if (pressMediaRes.status === "fulfilled" && pressMediaRes.value) {
      updates.local_press_media_info = pressMediaRes.value;
    }

    if (bandPartnersRes.status === "fulfilled" && bandPartnersRes.value) {
      updates.local_band_partners_info = bandPartnersRes.value;
    }

    // Default auto financial calculation if missing
    const breakEven = calculateConcertFinancialBreakEven({
      aforo: lead.aforo || 250,
      precioAnticipada: 12,
      precioTaquilla: 15,
      alquilerSalaFijo: lead.alquiler_sala_estimado || 250,
      porcentajeSala: lead.porcentaje_taquilla || 15,
      gastosProduccionFijos: (updates.tour_logistics?.coste_total_viaje || 100) + 150, // viaje + técnico
      numMusicos: band?.num_integrantes || 5,
      asistenciaEstimada: updates.spotify_city_demand?.prediccion_entradas || Math.round((lead.aforo || 250) * 0.75)
    });

    updates.financial_break_even = {
      precio_entrada_anticipada: breakEven.precio_entrada_anticipada,
      precio_entrada_taquilla: breakEven.precio_entrada_taquilla,
      alquiler_sala_fijo: breakEven.alquiler_sala_fijo,
      porcentaje_sala: breakEven.porcentaje_sala,
      gastos_produccion_fijos: breakEven.gastos_produccion_fijos,
      entradas_break_even: breakEven.entradas_break_even,
      beneficio_estimado_lleno: breakEven.beneficio_estimado_lleno,
      beneficio_por_musico_estimado: breakEven.beneficio_por_musico_estimado,
      num_musicos: breakEven.num_musicos
    };

    const updatedLead: Lead = { ...lead, ...updates };
    const saved = await dbUpsertLead(updatedLead, targetBandId);

    res.json({
      success: true,
      lead: saved,
      intelligence: {
        spotify: updates.spotify_city_demand,
        places: updates.google_places_info,
        setlist: updates.setlist_history,
        email_verification: updates.email_verification,
        logistics: updates.tour_logistics,
        social: updates.social_engagement,
        financial: updates.financial_break_even,
        booking_window: updates.booking_window_info,
        local_events: updates.local_events_clash_info,
        press_media: updates.local_press_media_info,
        band_partners: updates.local_band_partners_info
      }
    });
  } catch (error: any) {
    console.error("Error in POST /api/leads/:id/enrich-all-apis:", error);
    res.status(500).json({ success: false, error: error?.message || "Error al procesar enriquecimiento multi-API" });
  }
});

/**
 * POST /api/leads/:id/enrich-logistics
 * Calcula rutas, kilometraje, combustible y peajes para la furgoneta.
 */
router.post(["/leads/:id/enrich-logistics", "/:id/enrich-logistics"], requireAuth, async (req, res) => {
  try {
    const targetBandId = getTargetBandId(req);
    const lead = await dbGetLeadById(req.params.id, targetBandId);
    if (!lead) return res.status(404).json({ success: false, error: "Lead no encontrado" });

    const state = loadState();
    const band = state.bands?.find((b: any) => b.id === targetBandId);
    const origin = req.body.origen || band?.ciudad || "Madrid";

    const result = await calculateTourLogistics(origin, lead.ciudad || "Madrid", lead.direccion);
    const updatedLead: Lead = {
      ...lead,
      tour_logistics: {
        origen: result.origen,
        distancia_km: result.distancia_km,
        tiempo_conduccion: result.tiempo_conduccion,
        coste_gasolina_estimado: result.coste_gasolina_estimado,
        peajes_estimados: result.peajes_estimados,
        coste_total_viaje: result.coste_total_viaje,
        recomendacion_logistica: result.recomendacion_logistica
      }
    };

    const saved = await dbUpsertLead(updatedLead, targetBandId);
    res.json({ success: true, lead: saved, logistics: updatedLead.tour_logistics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

/**
 * POST /api/leads/:id/enrich-social
 * Radar de interacción en Instagram / TikTok y calidad de co-promoción.
 */
router.post(["/leads/:id/enrich-social", "/:id/enrich-social"], requireAuth, async (req, res) => {
  try {
    const targetBandId = getTargetBandId(req);
    const lead = await dbGetLeadById(req.params.id, targetBandId);
    if (!lead) return res.status(404).json({ success: false, error: "Lead no encontrado" });

    const result = await fetchVenueSocialEngagement(lead.nombre_sala, lead.ciudad || "Madrid", lead.instagram_handle);
    const updatedLead: Lead = {
      ...lead,
      social_engagement: {
        instagram_followers: result.instagram_followers,
        engagement_rate: result.engagement_rate,
        promedio_views_reels: result.promedio_views_reels,
        promociona_bandas_activo: result.promociona_bandas_activo,
        calidad_promo_sala: result.calidad_promo_sala,
        resumen_social: result.resumen_social
      }
    };

    const saved = await dbUpsertLead(updatedLead, targetBandId);
    res.json({ success: true, lead: saved, social: updatedLead.social_engagement });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

/**
 * POST /api/leads/:id/calculate-break-even
 * Simulador financiero P&L y punto de equilibrio de entradas.
 */
router.post(["/leads/:id/calculate-break-even", "/:id/calculate-break-even"], requireAuth, async (req, res) => {
  try {
    const targetBandId = getTargetBandId(req);
    const lead = await dbGetLeadById(req.params.id, targetBandId);
    if (!lead) return res.status(404).json({ success: false, error: "Lead no encontrado" });

    const {
      precioAnticipada,
      precioTaquilla,
      alquilerSalaFijo,
      porcentajeSala,
      gastosProduccionFijos,
      numMusicos,
      asistenciaEstimada
    } = req.body;

    const result = calculateConcertFinancialBreakEven({
      aforo: lead.aforo || 250,
      precioAnticipada: Number(precioAnticipada) || 12,
      precioTaquilla: Number(precioTaquilla) || 15,
      alquilerSalaFijo: Number(alquilerSalaFijo) ?? 250,
      porcentajeSala: Number(porcentajeSala) ?? 15,
      gastosProduccionFijos: Number(gastosProduccionFijos) ?? 150,
      numMusicos: Number(numMusicos) || 5,
      asistenciaEstimada: Number(asistenciaEstimada) || Math.round((lead.aforo || 250) * 0.8)
    });

    const updatedLead: Lead = {
      ...lead,
      financial_break_even: {
        precio_entrada_anticipada: result.precio_entrada_anticipada,
        precio_entrada_taquilla: result.precio_entrada_taquilla,
        alquiler_sala_fijo: result.alquiler_sala_fijo,
        porcentaje_sala: result.porcentaje_sala,
        gastos_produccion_fijos: result.gastos_produccion_fijos,
        entradas_break_even: result.entradas_break_even,
        beneficio_estimado_lleno: result.beneficio_estimado_lleno,
        beneficio_por_musico_estimado: result.beneficio_por_musico_estimado,
        num_musicos: result.num_musicos
      }
    };

    const saved = await dbUpsertLead(updatedLead, targetBandId);
    res.json({ success: true, lead: saved, financial: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

/**
 * POST /api/leads/:id/enrich-booking-window
 * Ventana de programación óptima y antelación recomendada para cerrar fechas.
 */
router.post(["/leads/:id/enrich-booking-window", "/:id/enrich-booking-window"], requireAuth, async (req, res) => {
  try {
    const targetBandId = getTargetBandId(req);
    const lead = await dbGetLeadById(req.params.id, targetBandId);
    if (!lead) return res.status(404).json({ success: false, error: "Lead no encontrado" });

    const result = await calculateBookingWindow(lead.nombre_sala, lead.tipo || "sala", lead.aforo || 200, lead.ciudad || "Madrid");
    const updatedLead: Lead = {
      ...lead,
      booking_window_info: result
    };

    const saved = await dbUpsertLead(updatedLead, targetBandId);
    res.json({ success: true, lead: saved, booking_window: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

/**
 * POST /api/leads/:id/enrich-local-events
 * Radar de eventos locales, macrofestivales y riesgos de solapamiento.
 */
router.post(["/leads/:id/enrich-local-events", "/:id/enrich-local-events"], requireAuth, async (req, res) => {
  try {
    const targetBandId = getTargetBandId(req);
    const lead = await dbGetLeadById(req.params.id, targetBandId);
    if (!lead) return res.status(404).json({ success: false, error: "Lead no encontrado" });

    const state = loadState();
    const band = state.bands?.find((b: any) => b.id === targetBandId);
    const genero = band?.genero || lead.genero || "Indie Rock";

    const result = await detectLocalEventsAndClashes(lead.ciudad || "Madrid", genero);
    const updatedLead: Lead = {
      ...lead,
      local_events_clash_info: result
    };

    const saved = await dbUpsertLead(updatedLead, targetBandId);
    res.json({ success: true, lead: saved, local_events: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

/**
 * POST /api/leads/:id/enrich-press-media
 * Radar de medios locales, radios y fanzines culturales en la provincia.
 */
router.post(["/leads/:id/enrich-press-media", "/:id/enrich-press-media"], requireAuth, async (req, res) => {
  try {
    const targetBandId = getTargetBandId(req);
    const lead = await dbGetLeadById(req.params.id, targetBandId);
    if (!lead) return res.status(404).json({ success: false, error: "Lead no encontrado" });

    const state = loadState();
    const band = state.bands?.find((b: any) => b.id === targetBandId);
    const bandName = band?.nombre || "la banda";

    const result = await findLocalPressAndMedia(lead.ciudad || "Madrid", lead.nombre_sala, bandName);
    const updatedLead: Lead = {
      ...lead,
      local_press_media_info: result
    };

    const saved = await dbUpsertLead(updatedLead, targetBandId);
    res.json({ success: true, lead: saved, press_media: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

/**
 * POST /api/leads/:id/enrich-co-booking
 * Bandas locales afines para co-booking y taquilla compartida.
 */
router.post(["/leads/:id/enrich-co-booking", "/:id/enrich-co-booking"], requireAuth, async (req, res) => {
  try {
    const targetBandId = getTargetBandId(req);
    const lead = await dbGetLeadById(req.params.id, targetBandId);
    if (!lead) return res.status(404).json({ success: false, error: "Lead no encontrado" });

    const state = loadState();
    const band = state.bands?.find((b: any) => b.id === targetBandId);
    const genero = band?.genero || lead.genero || "Indie Rock";

    const result = await findLocalBandPartners(lead.ciudad || "Madrid", genero, lead.nombre_sala);
    const updatedLead: Lead = {
      ...lead,
      local_band_partners_info: result
    };

    const saved = await dbUpsertLead(updatedLead, targetBandId);
    res.json({ success: true, lead: saved, band_partners: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

export default router;
