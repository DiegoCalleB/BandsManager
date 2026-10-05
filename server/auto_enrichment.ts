import { getAiClient, generateContentWithFallback } from "./ai.js";
import { dbUpsertLead, dbUpsertBandContact, dbDeleteLead } from "./db.js";
import { loadState, saveState, getAutonomyConfigForBand } from "./state.js";
import { detectPitchLanguage } from "./utils/leadLanguage.js";
import { esUrlExternaSegura } from "./utils/ssrfGuard.js";
import { getBandDnaProfile, buildEnhancedPitchSystemPrompt, generateSmartDnaPitchFallback } from "./utils/bandDna.js";
import { formatGlobalPitchFeedbackForPrompt } from "./promptsManager.js";
import { limpiarCampoContacto } from "./utils/scoutLeads.js";
import { enrichVenueDetailsWithSerper } from "./services/venueIntelligenceService.js";

function toIsoDateString(val?: string | null): string {
  if (!val || typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (!trimmed) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.substring(0, 10);
  const ddmmyyyy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (ddmmyyyy) {
    return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`;
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return d.toISOString().substring(0, 10);
  }
  return '';
}

/**
 * Scrapes a venue/contact website via direct HTTP fetch to extract emails, instagram, and phone numbers without spending Gemini tokens.
 */
export async function extractFestivalDates(lead: any): Promise<{ startDate?: string; endDate?: string; email?: string; telefono?: string; website?: string; instagram?: string; genero?: string; aforo?: number; region?: string; imagen_url?: string }> {
  if (!lead.nombre_sala) return {};

  const cleanCity = (lead.ciudad || '').replace(/\s*\([^)]*\)/g, '').trim();
  const cleanVenue = (lead.nombre_sala || '').trim();

  // STAGE 1: Búsqueda en base de datos local (ultra-rápida, < 1 ms)
  try {
    const { searchFestivalByName, formatFestivalDates } = await import("./utils/spanishFestivalsDB.js");
    const localMatch = searchFestivalByName(cleanVenue, cleanCity) || searchFestivalByName(cleanVenue);
    if (localMatch) {
      const dates = formatFestivalDates(localMatch);
      console.log(`[FestivalDates] ✓ FOUND EN BD LOCAL: "${cleanVenue}" → ${dates.start} a ${dates.end}`);
      const fallbackFavicon = localMatch.website ? `https://www.google.com/s2/favicons?domain=${localMatch.website.replace(/^https?:\/\//, '').split('/')[0]}&sz=128` : undefined;
      return {
        startDate: dates.start,
        endDate: dates.end,
        email: localMatch.email,
        telefono: localMatch.telefono,
        website: localMatch.website,
        instagram: localMatch.instagram,
        genero: localMatch.genero,
        aforo: localMatch.aforo,
        region: localMatch.region,
        imagen_url: localMatch.imagen_url || fallbackFavicon
      };
    }
  } catch (e) {
    console.warn(`[FestivalDates] Error en búsqueda local:`, e);
  }

  // STAGE 2: AI Fallback directo con Google Search Grounding
  const client = getAiClient();
  if (!client) return {};

  const prompt = `Busca información oficial en internet sobre las fechas de celebración del festival o ciclo de conciertos "${cleanVenue}" ${cleanCity ? `en ${cleanCity}` : ''} (España).

Devuelve ÚNICAMENTE un objeto JSON con esta estructura exactas:
{
  "es_festival": true,
  "festival_start_date": "YYYY-MM-DD",
  "festival_end_date": "YYYY-MM-DD"
}

Ejemplo para festival del 5 al 6 de julio de 2026:
{"es_festival": true, "festival_start_date": "2026-07-05", "festival_end_date": "2026-07-06"}`;

  try {
    console.log(`[FestivalDates] Consulta a Gemini AI para "${cleanVenue}" (${cleanCity})...`);
    let response: any = null;
    try {
      response = await generateContentWithFallback(client, {
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
    } catch (searchErr: any) {
      response = await generateContentWithFallback(client, {
        contents: prompt
      });
    }

    const text = response.text || "{}";
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonStart = cleanedText.indexOf('{');
    const jsonEnd = cleanedText.lastIndexOf('}');
    let data: any = {};
    if (jsonStart !== -1 && jsonEnd !== -1) {
      try {
        data = JSON.parse(cleanedText.substring(jsonStart, jsonEnd + 1));
      } catch (_) { data = {}; }
    }

    let rawStart = data.festival_start_date || data.startDate || data.start_date;
    let rawEnd = data.festival_end_date || data.endDate || data.end_date || rawStart;

    // Fallback: Si Gemini devolvió texto natural con fechas
    if (!rawStart) {
      const year = new Date().getFullYear();
      const monthMap: Record<string, string> = {
        enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
        julio: '07', agosto: '08', septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12'
      };
      const textMatch = text.match(/(\d{1,2})\s*(?:al?|-|y)\s*(\d{1,2})\s*de\s*([a-z]+)/i);
      if (textMatch) {
        const d1 = textMatch[1].padStart(2, '0');
        const d2 = textMatch[2].padStart(2, '0');
        const m = monthMap[textMatch[3].toLowerCase()];
        if (m) {
          rawStart = `${year}-${m}-${d1}`;
          rawEnd = `${year}-${m}-${d2}`;
        }
      }
    }

    const startIso = toIsoDateString(rawStart);
    const endIso = toIsoDateString(rawEnd) || startIso;

    if (startIso) {
      console.log(`[FestivalDates] ✓ AI FOUND: "${cleanVenue}" → ${startIso} a ${endIso}`);
      return {
        startDate: startIso,
        endDate: endIso
      };
    }
  } catch (err: any) {
    console.warn(`[FestivalDates] Error en AI fallback:`, err?.message || err);
  }

  return {};
}

async function scrapeWebsiteForContact(websiteUrl: string): Promise<{ email?: string; phone?: string; instagram?: string }> {
  if (!websiteUrl || !websiteUrl.startsWith("http")) return {};

  const results: { email?: string; phone?: string; instagram?: string } = {};
  const urlsToTry = [websiteUrl];

  try {
    const urlObj = new URL(websiteUrl);
    const origin = urlObj.origin;
    if (!websiteUrl.includes("/contacto") && !websiteUrl.includes("/contact")) {
      urlsToTry.push(`${origin}/contacto`);
      urlsToTry.push(`${origin}/contactos`);
      urlsToTry.push(`${origin}/contact`);
      urlsToTry.push(`${origin}/geral`);
      urlsToTry.push(`${origin}/contact-us`);
    }
  } catch (e) {
    // Ignore URL parse error
  }

  for (const targetUrl of urlsToTry) {
    try {
      // websiteUrl es texto libre del lead: sin esto, un valor apuntando a una IP privada o al
      // endpoint de metadatos de la nube haría que el servidor hiciera esa petición interna y
      // devolviera lo encontrado (SSRF).
      if (!(await esUrlExternaSegura(targetUrl))) continue;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout
      const res = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      clearTimeout(timeoutId);

      if (!res.ok) continue;
      const html = await res.text();

      // 1. Extract email via mailto: or regex
      if (!results.email) {
        const mailtoMatch = html.match(/href=["']mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})["']/i);
        if (mailtoMatch) {
          results.email = mailtoMatch[1];
        } else {
          const emailMatches = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
          if (emailMatches) {
            const validEmails = emailMatches.filter(e => 
              !e.endsWith(".png") && !e.endsWith(".jpg") && !e.endsWith(".webp") && !e.endsWith(".svg") && !e.endsWith(".js") && !e.endsWith(".css") &&
              !e.includes("example.com") && !e.includes("domain.com") && !e.includes("schema.org") &&
              !e.includes("sentry.io") && !e.includes("w3.org") && !e.includes("wordpress") && !e.includes("gravatar")
            );
            const priorityEmail = validEmails.find(e => /info|booking|contacto|programacion|prensa|sala/i.test(e));
            if (priorityEmail) {
              results.email = priorityEmail;
            } else if (validEmails.length > 0) {
              results.email = validEmails[0];
            }
          }
        }
      }

      // 2. Extract Instagram
      if (!results.instagram) {
        const instaMatch = html.match(/https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9_.-]+)\/?/i);
        if (instaMatch) {
          const handle = instaMatch[1].toLowerCase();
          const reserved = ['p', 'reel', 'reels', 'stories', 'explore', 'accounts', 'privacy', 'legal', 'about', 'help', 'terms', 'direct', 'login', 'signup', 'developer', 'static'];
          if (!reserved.includes(handle)) {
            results.instagram = `@${instaMatch[1].replace(/^@/, '')}`;
          }
        }
      }

      // 3. Extract Phone
      if (!results.phone) {
        const telMatch = html.match(/href=["']tel:([+\d\s-]+)["']/i);
        if (telMatch) {
          results.phone = telMatch[1].trim();
        }
      }

      if (results.email) break; // Found main contact email, stop crawling subpages
    } catch (err) {
      // Ignore timeout or fetch error on subpage
    }
  }

  return results;
}

export interface AutoEnrichOptions {
  /**
   * Campos que el usuario ha vaciado a propósito en esta edición. El enriquecimiento NO los
   * vuelve a rellenar con lo que encuentre en la web de la sala (antes, borrar un email que
   * aparecía en su web servía de poco: reaparecía en el guardado siguiente).
   */
  respetarVacios?: string[];
}

export async function autoEnrichLead(lead: any, userBandId: string, opciones: AutoEnrichOptions = {}): Promise<any> {
  if (!lead || !lead.nombre_sala) return lead;
  const respetarVacios = new Set(opciones.respetarVacios || []);

  let modified = false;

  // STAGE 0: Fast Local DB Match (Festivals & Known Venues Heuristics for Instagram/Metadata)
  if (!lead.instagram || lead.instagram.trim() === "") {
    try {
      const { SPANISH_FESTIVALS } = await import("./utils/spanishFestivalsDB.js");
      const nameLower = lead.nombre_sala.toLowerCase().trim();

      const matchFest = SPANISH_FESTIVALS.find(
        (f) => f.nombre.toLowerCase().trim() === nameLower || nameLower.includes(f.nombre.toLowerCase())
      );
      if (matchFest && matchFest.instagram) {
        lead.instagram = matchFest.instagram;
        modified = true;
        console.log(`[AutoEnrich Stage 0] ✓ Instagram de festival recuperado de DB local: ${matchFest.instagram}`);
      }

      if (!lead.instagram) {
        const webLower = (lead.website || "").toLowerCase();
        if (nameLower.includes("riviera") || webLower.includes("salariviera")) lead.instagram = "@salariviera";
        else if (nameLower.includes("panda club") || webLower.includes("pandamadrid")) lead.instagram = "@pandaclubmadrid";
        else if (nameLower.includes("kasba")) lead.instagram = "@kasbamusic";
        else if (nameLower.includes("rockville") || webLower.includes("rockville.es")) lead.instagram = "@salarockville";
        else if (nameLower.includes("ferrara buskers")) lead.instagram = "@ferrarabuskersfestival";
        else if (nameLower.includes("candlelight") || webLower.includes("feverup")) lead.instagram = "@candlelight.concerts";
        else if (nameLower.includes("movistar arena") || webLower.includes("movistararena")) lead.instagram = "@movistararena_es";
        else if (nameLower.includes("cocheras del puerto")) lead.instagram = "@puertohuelva";

        if (lead.instagram) modified = true;
      }
    } catch (_) {}
  }

  const placesApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.VITE_GOOGLE_PLACES_API_KEY || "";

  // STAGE 1: Try Google Places API (New) v1 first (Cheap & structured data: address, phone, website, photos)
  if (placesApiKey && placesApiKey.trim() !== "") {
    try {
      const searchQuery = `${lead.nombre_sala} ${lead.ciudad || ''} España`;
      console.log(`[AutoEnrich Places] Consultando Google Places API (New) para: "${searchQuery}"...`);
      const placesRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": placesApiKey,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.types,places.photos,places.businessStatus"
        },
        body: JSON.stringify({
          textQuery: searchQuery,
          languageCode: "es"
        })
      });

      if (placesRes.ok) {
        const placesData: any = await placesRes.json();
        if (Array.isArray(placesData.places) && placesData.places.length > 0) {
          const topPlace = placesData.places[0];

          if (topPlace.businessStatus === "CLOSED_PERMANENTLY" || topPlace.businessStatus === "CLOSED_TEMPORARILY") {
            console.log(`[AutoEnrich Places] ELIMINANDO SALA CERRADA: La sala "${lead.nombre_sala}" está CERRADA (${topPlace.businessStatus}) en Google Maps. Eliminando de la BD y guardando en lista negra...`);
            try {
              await dbDeleteLead(lead.id, userBandId);
            } catch (e) {
              console.warn(`[AutoEnrich Places] Error eliminando sala cerrada de Supabase:`, e);
            }
            const state = loadState();
            if (state.leads) {
              state.leads = state.leads.filter((l: any) => l.id !== lead.id);
              saveState(state);
            }
            return { id: lead.id, deleted: true, reason: 'closed_permanently', nombre_sala: lead.nombre_sala };
          }

          if (topPlace.formattedAddress && (!lead.direccion || lead.direccion.length < 5)) {
            lead.direccion = topPlace.formattedAddress;
            modified = true;
          }
          const phone = topPlace.nationalPhoneNumber || topPlace.internationalPhoneNumber || "";
          if (phone && !lead.telefono) {
            lead.telefono = phone;
            modified = true;
          }
          if (topPlace.websiteUri && !lead.website) {
            lead.website = topPlace.websiteUri;
            modified = true;
            try {
              const urlObj = new URL(topPlace.websiteUri);
              const domain = urlObj.hostname.replace(/^www\./, '');
              if (domain && (!lead.imagen_url || lead.imagen_url.includes("places.googleapis.com") || lead.imagen_url.includes("ui-avatars") || lead.imagen_url.includes("clearbit"))) {
                lead.imagen_url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                modified = true;
              }
            } catch (e) {}
          }
          if (topPlace.formattedAddress && (!lead.ciudad || lead.ciudad === 'Desconocido')) {
            const parts = topPlace.formattedAddress.split(",");
            if (parts.length >= 2) {
              lead.ciudad = parts[parts.length - 2].trim().replace(/\d{5}\s*/, '');
              modified = true;
            }
          }
        }
      }
    } catch (placesErr: any) {
      console.warn(`[AutoEnrich Places] Error llamando a Places API:`, placesErr?.message || placesErr);
    }
  }

  // STAGE 1.5: Serper Live Google Search Contact Enrichment (Ultra-fast contact and capacity intelligence)
  if (process.env.SERPER_API_KEY && (!lead.email_contacto || !lead.aforo || !lead.telefono || !lead.website)) {
    try {
      console.log(`[AutoEnrich Serper] Consultando Serper Live Contact para: "${lead.nombre_sala}" (${lead.ciudad || 'España'})...`);
      const serperContact = await enrichVenueDetailsWithSerper(lead.nombre_sala, lead.ciudad);
      if (serperContact) {
        if (serperContact.email && !lead.email_contacto) {
          lead.email_contacto = serperContact.email;
          modified = true;
          console.log(`[AutoEnrich Serper] ✓ Email de booking detectado vía Serper: ${serperContact.email}`);
        }
        if (serperContact.aforo && (!lead.aforo || lead.aforo === 0)) {
          lead.aforo = serperContact.aforo;
          modified = true;
          console.log(`[AutoEnrich Serper] ✓ Aforo verificado vía Serper: ${serperContact.aforo} personas`);
        }
        if (serperContact.telefono && !lead.telefono) {
          lead.telefono = serperContact.telefono;
          modified = true;
        }
        if (serperContact.website && !lead.website) {
          lead.website = serperContact.website;
          modified = true;
          try {
            const domain = new URL(serperContact.website).hostname.replace(/^www\./, '');
            if (domain && (!lead.imagen_url || lead.imagen_url.includes("places.googleapis.com") || lead.imagen_url.includes("ui-avatars"))) {
              lead.imagen_url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
              modified = true;
            }
          } catch (_) {}
        }
        if (serperContact.instagram && !lead.instagram) {
          lead.instagram = serperContact.instagram;
          modified = true;
        }
      }
    } catch (serperErr: any) {
      console.warn(`[AutoEnrich Serper] Aviso en consulta Serper:`, serperErr?.message || serperErr);
    }
  }

  // STAGE 2: Direct Website Scraping & Jina Reader (0 Gemini tokens spent!)
  if (lead.website && (!lead.email_contacto || !lead.instagram || !lead.telefono || !lead.aforo)) {
    console.log(`[AutoEnrich Jina/Scraper] Consultando web oficial mediante Jina Reader y scraping directo: ${lead.website}...`);
    try {
      const { scrapeVenueWithJina } = await import("./services/jinaReaderService.js");
      const jinaData = await scrapeVenueWithJina(lead.website);
      if (jinaData && jinaData.success) {
        if (jinaData.email_contacto && !lead.email_contacto) {
          lead.email_contacto = jinaData.email_contacto;
          modified = true;
          console.log(`[AutoEnrich Jina] ✓ Email extraído con Jina Reader: ${jinaData.email_contacto}`);
        }
        if (jinaData.email_secundario && !lead.email_secundario) {
          lead.email_secundario = jinaData.email_secundario;
          modified = true;
        }
        if (jinaData.telefono_movil && !lead.telefono_movil) {
          lead.telefono_movil = jinaData.telefono_movil;
          if (!lead.telefono) lead.telefono = jinaData.telefono_movil;
          modified = true;
        }
        if (jinaData.telefono_fijo && !lead.telefono_fijo) {
          lead.telefono_fijo = jinaData.telefono_fijo;
          if (!lead.telefono) lead.telefono = jinaData.telefono_fijo;
          modified = true;
        }
        if (jinaData.aforo && (!lead.aforo || lead.aforo === 0)) {
          lead.aforo = jinaData.aforo;
          modified = true;
        }
        if (jinaData.contacto_nombre && !lead.contacto_nombre) {
          lead.contacto_nombre = jinaData.contacto_nombre;
          modified = true;
        }
      }
    } catch (jinaErr: any) {
      console.warn(`[AutoEnrich Jina] Aviso en consulta Jina Reader:`, jinaErr?.message || jinaErr);
    }

    const scrapedInfo = await scrapeWebsiteForContact(lead.website);
    if (scrapedInfo.email && !lead.email_contacto) {
      lead.email_contacto = scrapedInfo.email;
      modified = true;
      console.log(`[AutoEnrich Scraper] ¡Email extraído mediante scraping directo!: ${scrapedInfo.email}`);
    }
    if (scrapedInfo.instagram && !lead.instagram) {
      lead.instagram = scrapedInfo.instagram;
      modified = true;
    }
    if (scrapedInfo.phone && !lead.telefono) {
      lead.telefono = scrapedInfo.phone;
      modified = true;
    }
  }

  // STAGE 3: Gemini AI Fallback (ONLY IF email_contacto is still missing or we need additional info)
  const needsGemini = !lead.email_contacto || !lead.direccion;

  if (needsGemini) {
    const client = getAiClient();
    if (client) {
      const prompt = `Busca en internet información pública precisa para la sala de conciertos, festival, medio de comunicación, radio o prensa: "${lead.nombre_sala}" ${lead.ciudad ? `en ${lead.ciudad}` : ''} ${lead.region ? `(${lead.region})` : ''}.
Buscamos obtener todos los datos de contacto y detalles posibles.
Devuelve EXCLUSIVAMENTE un JSON válido con la siguiente estructura exacta:
{
  "nombre_sala": "Nombre oficial completo",
  "ciudad": "Ciudad",
  "region": "Comunidad Autónoma o provincia",
  "direccion": "Dirección física exacta",
  "aforo": 0,
  "genero": "Estilos musicales habituales o género editorial",
  "tipo": "sala",
  "email_contacto": "email oficial de contacto o programación",
  "telefono": "teléfono de contacto o reservas",
  "website": "sitio web oficial",
  "instagram": "usuario o URL de Instagram",
  "contacto_nombre": "nombre de la persona de contacto/programador/prensa",
  "imagen_url": "URL pública directa del logo oficial o foto principal",
  "icono": "Emoji característico según el tipo (ej: 📻 para radio, 📰 para prensa, 🎙️ para podcast, 🏛️ para sala, 🎪 para festival)",
  "notas": "Breve descripción o notas sobre la sala/medio"
}
Usa cadena vacía "" para textos no encontrados y 0 para aforo numérico. No inventes información ficticia.`;

      try {
        console.log(`[AutoEnrich Gemini] Ejecutando consulta Gemini AI (Fallback) para Lead: '${lead.nombre_sala}'...`);
        let response: any = null;
        try {
          response = await generateContentWithFallback(client, {
            contents: prompt,
            config: {
              tools: [{ googleSearch: {} }]
            }
          });
        } catch (searchErr: any) {
          console.warn(`[AutoEnrich Gemini] Google Search no disponible, reintentando con conocimiento Gemini...`);
          response = await generateContentWithFallback(client, {
            contents: prompt
          });
        }

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

        if (data.ciudad && (!lead.ciudad || lead.ciudad === 'Desconocido')) { lead.ciudad = data.ciudad; modified = true; }
        if (data.region && !lead.region) { lead.region = data.region; modified = true; }
        if (data.direccion && !lead.direccion) { lead.direccion = data.direccion; modified = true; }
        if (data.aforo && (!lead.aforo || lead.aforo === 0)) { lead.aforo = Number(data.aforo) || 0; modified = true; }
        if (data.genero && !lead.genero) { lead.genero = data.genero; modified = true; }
        if (data.tipo && (!lead.tipo || lead.tipo === 'sala')) { lead.tipo = data.tipo; modified = true; }
        const cleanEmail = limpiarCampoContacto(data.email_contacto);
        if (cleanEmail && !lead.email_contacto) { lead.email_contacto = cleanEmail; modified = true; }
        const cleanPhone = limpiarCampoContacto(data.telefono);
        if (cleanPhone && !lead.telefono) { lead.telefono = cleanPhone; modified = true; }
        if (data.website && !lead.website) { lead.website = data.website; modified = true; }
        if (data.instagram && !lead.instagram) { lead.instagram = data.instagram; modified = true; }
        if (data.contacto_nombre && !lead.contacto_nombre) { lead.contacto_nombre = data.contacto_nombre; modified = true; }
        if (data.imagen_url && !lead.imagen_url) { lead.imagen_url = data.imagen_url; modified = true; }
        if (data.icono && (!lead.icono || lead.icono === '🏛️')) { lead.icono = data.icono; modified = true; }
        if (data.notas && (!lead.notas || lead.notas.length < 10)) { lead.notas = data.notas; modified = true; }
      } catch (err: any) {
        console.warn(`[AutoEnrich Gemini] Error enriqueciendo Lead '${lead.nombre_sala}':`, err?.message || err);
      }
    }
  } else {
    console.log(`[AutoEnrich] AHORRO DE TOKENS: Lead '${lead.nombre_sala}' completado con Google Places + Web Scraping. No se necesitó Gemini AI.`);
  }

  // STAGE 4: Festival/Event Data Extraction (detect festivals & extract all data)
  const isFestivalOrEvent =
    lead.tipo === 'festival' ||
    lead.tipo === 'ayuntamiento' ||
    /fest|festival|inverfest|pirata|fiesta|ciclo|feria/i.test(lead.nombre_sala || '') ||
    !lead.email_contacto;

  if (isFestivalOrEvent && (!lead.festival_start_date || !lead.festival_end_date)) {
    const festivalInfo = await extractFestivalDates(lead);
    if (festivalInfo.startDate && festivalInfo.endDate) {
      lead.festival_start_date = festivalInfo.startDate;
      lead.festival_end_date = festivalInfo.endDate;
      modified = true;

      // Enriquecer otros campos con datos del festival
      if (festivalInfo.email && !lead.email_contacto) {
        lead.email_contacto = festivalInfo.email;
        modified = true;
      }
      if (festivalInfo.telefono && !lead.telefono) {
        lead.telefono = festivalInfo.telefono;
        modified = true;
      }
      if (festivalInfo.website && !lead.website) {
        lead.website = festivalInfo.website;
        modified = true;
      }
      if (festivalInfo.instagram && !lead.instagram) {
        lead.instagram = festivalInfo.instagram;
        modified = true;
      }
      if (festivalInfo.genero && !lead.genero) {
        lead.genero = festivalInfo.genero;
        modified = true;
      }
      if (festivalInfo.aforo && (!lead.aforo || lead.aforo === 0)) {
        lead.aforo = festivalInfo.aforo;
        modified = true;
      }
      if (festivalInfo.imagen_url && (!lead.imagen_url || lead.imagen_url.includes('image.jpg'))) {
        lead.imagen_url = festivalInfo.imagen_url;
        modified = true;
      }
    }
  }

  // Ensure initial pitch is generated if missing
  if (!lead.pitch_generado || lead.pitch_generado === "Sin pitch generado." || lead.pitch_generado.trim() === "") {
    const state = loadState();
    const bandDna = getBandDnaProfile(state, userBandId, lead);
    const globalMemory = formatGlobalPitchFeedbackForPrompt(state.leads);
    const autonomyConfig = getAutonomyConfigForBand(state, userBandId);
    const bandMinCache = autonomyConfig?.minCacheByType;
    const negotiationStartCacheByType = autonomyConfig?.negotiationStartCacheByType;
    const systemPrompt = buildEnhancedPitchSystemPrompt(bandDna, globalMemory, lead, undefined, bandMinCache, negotiationStartCacheByType);

    const pitchLinks = {
      spotify: bandDna.spotifyUrl,
      youtube: bandDna.youtubeUrl,
      epk: bandDna.epkUrl
    };

    const client = getAiClient();
    if (client) {
      const promptPitch = `${systemPrompt}

TAREA ESPECÍFICA:
Redacta el correo de propuesta de concierto inicial de máxima calidad y personalización para:
- Nombre: "${lead.nombre_sala}"
- Ubicación: ${lead.ciudad || "España"} (Región: ${lead.region || "N/D"})
- Tipo: ${lead.tipo || "sala"}
- Aforo: ${lead.aforo || "Estándar"}
- Género / Línea musical: ${lead.genero || "Música en directo"}

Devuelve ÚNICAMENTE el texto final redactado del email listo para ser revisado por el mánager.`;

      try {
        const pitchRes = await generateContentWithFallback(client, {
          contents: promptPitch,
          permitirPitchLocal: true,
          links: pitchLinks
        });
        if (pitchRes && pitchRes.text) {
          lead.pitch_generado = pitchRes.text.trim();
          modified = true;
          console.log(`[AutoEnrich] Pitch inicial de alta calidad generado para '${lead.nombre_sala}'.`);
        }
      } catch (e: any) {
        console.warn(`[AutoEnrich] Error generando pitch inicial con IA:`, e?.message || e);
      }
    }

    if (!lead.pitch_generado || lead.pitch_generado === "Sin pitch generado." || lead.pitch_generado.trim() === "") {
      lead.pitch_generado = generateSmartDnaPitchFallback({
        bandDna,
        lead
      });
      modified = true;
    }
  }

  // Ensure official corporate logo / favicon is assigned if website exists and image is missing/placeholder
  if (lead.website && (!lead.imagen_url || lead.imagen_url.includes("google.com/maps") || lead.imagen_url.includes("place") || lead.imagen_url.includes("clearbit") || lead.imagen_url.includes("ui-avatars") || lead.imagen_url.includes("places.googleapis.com") || lead.imagen_url.trim() === "")) {
    try {
      const urlObj = new URL(lead.website);
      const domain = urlObj.hostname.replace(/^www\./, '');
      if (domain) {
        lead.imagen_url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        modified = true;
      }
    } catch (e) {}
  }

  // Lo que el usuario vació a propósito se queda vacío, encuentre lo que encuentre la web.
  for (const campo of respetarVacios) {
    if (campo in lead) lead[campo] = '';
  }

  if (modified) {
    console.log(`[AutoEnrich] Lead '${lead.nombre_sala}' enriquecido y guardado con éxito.`);
    const savedEnriched = await dbUpsertLead(lead, userBandId, { permitirVaciar: respetarVacios.size > 0 });
    const state = loadState();
    const idx = (state.leads || []).findIndex((l: any) => l.id === lead.id);
    if (idx !== -1) {
      state.leads[idx] = savedEnriched;
      saveState(state);
    }
    return savedEnriched;
  }

  return lead;
}

export async function autoEnrichBandContact(band: any, userBandId: string): Promise<any> {
  if (!band || !band.nombre_banda) return band;

  const client = getAiClient();
  if (!client) {
    console.warn("[AutoEnrich] AI Client no disponible para enriquecimiento de banda.");
    return band;
  }

  const prompt = `Busca en internet toda la información pública disponible sobre la banda o artista musical "${band.nombre_banda}" ${band.localizacion ? `de ${band.localizacion}` : ''}.
Devuelve EXCLUSIVAMENTE un JSON válido con la estructura exacta:
{
  "nombre_banda": "Nombre oficial",
  "estilo_musical": "Estilo o géneros musicales principales",
  "localizacion": "Ciudad o provincia de origen",
  "contacto_nombre": "Nombre del manager, booking o contacto principal",
  "email": "email oficial de contacto o booking",
  "telefono": "teléfono público",
  "instagram": "URL o usuario de Instagram",
  "spotify_youtube": "URL de Spotify o canal de YouTube",
  "aforo_promedio": 0,
  "notas_colaboracion": "Breve resumen del estilo, trayectoria e ideas para colaboraciones o conciertos conjuntos",
  "ciudad_origen_swap": "Ciudad para intercambio de fechas",
  "imagen_url": "URL pública directa del logo oficial o foto principal",
  "icono": "Emoji característico (ej: 🎸, 🎤, ⚡, 🎺, 🎷, 🎶)"
}
Usa cadena vacía "" para textos no encontrados y 0 para aforo. No inventes información sin base real.`;

  try {
    console.log(`[AutoEnrich] Buscando información automática para Banda: '${band.nombre_banda}'...`);
    let response: any = null;
    try {
      response = await generateContentWithFallback(client, {
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
    } catch (searchErr: any) {
      console.warn(`[AutoEnrich] Google Search no disponible (${searchErr?.message || searchErr}), reintentando con conocimiento Gemini...`);
      response = await generateContentWithFallback(client, {
        contents: prompt
      });
    }

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

    let modified = false;

    if (data.estilo_musical && !band.estilo_musical) { band.estilo_musical = data.estilo_musical; modified = true; }
    if (data.localizacion && (!band.localizacion || band.localizacion === 'Desconocido')) { band.localizacion = data.localizacion; modified = true; }
    if (data.contacto_nombre && !band.contacto_nombre) { band.contacto_nombre = data.contacto_nombre; modified = true; }
    if (data.email && !band.email) { band.email = data.email; modified = true; }
    if (data.telefono && !band.telefono) { band.telefono = data.telefono; modified = true; }
    if (data.instagram && !band.instagram) { band.instagram = data.instagram; modified = true; }
    if (data.spotify_youtube && !band.spotify_youtube) { band.spotify_youtube = data.spotify_youtube; modified = true; }
    if (data.aforo_promedio && (!band.aforo_promedio || band.aforo_promedio === 0)) { band.aforo_promedio = Number(data.aforo_promedio) || 0; modified = true; }
    if (data.notas_colaboracion && (!band.notas_colaboracion || band.notas_colaboracion.length < 10)) { band.notas_colaboracion = data.notas_colaboracion; modified = true; }
    if (data.ciudad_origen_swap && !band.ciudad_origen_swap) { band.ciudad_origen_swap = data.ciudad_origen_swap; modified = true; }
    if (data.imagen_url && !band.imagen_url) { band.imagen_url = data.imagen_url; modified = true; }
    if (data.icono && (!band.icono || band.icono === '🎸')) { band.icono = data.icono; modified = true; }

    if (modified) {
      console.log(`[AutoEnrich] Banda '${band.nombre_banda}' enriquecida con éxito.`);
      const savedEnriched = await dbUpsertBandContact(band, userBandId);
      const state = loadState();
      const idx = (state.bands || []).findIndex((b: any) => b.id === band.id);
      if (idx !== -1) {
        state.bands[idx] = savedEnriched;
        saveState(state);
      }
      return savedEnriched;
    }
  } catch (err: any) {
    console.warn(`[AutoEnrich] Error enriqueciendo Banda '${band.nombre_banda}':`, err?.message || err);
  }

  return band;
}
