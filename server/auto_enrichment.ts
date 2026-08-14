import { getAiClient, generateContentWithFallback } from "./ai.js";
import { dbUpsertLead, dbUpsertBandContact, dbDeleteLead } from "./db.js";
import { loadState, saveState } from "./state.js";

/**
 * Scrapes a venue/contact website via direct HTTP fetch to extract emails, instagram, and phone numbers without spending Gemini tokens.
 */
async function scrapeWebsiteForContact(websiteUrl: string): Promise<{ email?: string; phone?: string; instagram?: string }> {
  if (!websiteUrl || !websiteUrl.startsWith("http")) return {};

  const results: { email?: string; phone?: string; instagram?: string } = {};
  const urlsToTry = [websiteUrl];

  try {
    const urlObj = new URL(websiteUrl);
    const origin = urlObj.origin;
    if (!websiteUrl.includes("/contacto") && !websiteUrl.includes("/contact")) {
      urlsToTry.push(`${origin}/contacto`);
      urlsToTry.push(`${origin}/contact`);
    }
  } catch (e) {
    // Ignore URL parse error
  }

  for (const targetUrl of urlsToTry) {
    try {
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
        const instaMatch = html.match(/https?:\/\/(www\.)?instagram\.com\/([a-zA-Z0-9_.-]+)\/?/i);
        if (instaMatch && !instaMatch[2].includes("p/") && !instaMatch[2].includes("reel/") && !instaMatch[2].includes("stories/")) {
          results.instagram = `https://www.instagram.com/${instaMatch[2]}/`;
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

export async function autoEnrichLead(lead: any, userBandId: string): Promise<any> {
  if (!lead || !lead.nombre_sala) return lead;

  let modified = false;
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

  // STAGE 2: Direct Website Scraping (0 Gemini tokens spent!)
  if (lead.website && (!lead.email_contacto || !lead.instagram)) {
    console.log(`[AutoEnrich Scraper] Realizando scraping directo en la web oficial: ${lead.website}...`);
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
      const prompt = `Busca en internet información pública precisa para la sala de conciertos, festival, medio de comunicación, radio o prensa: "${lead.nombre_sala}" ${lead.ciudad ? `en ${lead.ciudad}` : ''} ${lead.region ? `(${lead.region})` : ''} en España.
Buscamos obtener todos los datos de contacto y detalles posibles.
Devuelve EXCLUSIVAMENTE un JSON válido con la siguiente estructura exacta:
{
  "nombre_sala": "Nombre oficial completo",
  "ciudad": "Ciudad",
  "region": "Comunidad Autónoma o provincia",
  "direccion": "Dirección física exacta",
  "aforo": 300,
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
        if (data.email_contacto && !lead.email_contacto) { lead.email_contacto = data.email_contacto; modified = true; }
        if (data.telefono && !lead.telefono) { lead.telefono = data.telefono; modified = true; }
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

  // Ensure initial pitch is generated if missing
  if (!lead.pitch_generado || lead.pitch_generado === "Sin pitch generado." || lead.pitch_generado.trim() === "") {
    const state = loadState();
    const bandConfig = state.epkConfigsByBand?.[userBandId] || state.epkConfigsByBand?.[userBandId.replace(/^(band|reg)-/, '')] || state.epkConfig || {};
    const registeredBand = state.registeredBands?.find((b: any) => b.band_id === userBandId || b.band_id === userBandId.replace(/^(band|reg)-/, ''));
    const cleanId = userBandId.replace(/^(band|reg)-/, '');
    const isBakandeya = cleanId === 'bakandeya';
    const bandName = registeredBand?.nombre_banda || registeredBand?.bandName || bandConfig?.contactoBooking?.nombre || bandConfig?.nombre_banda || (isBakandeya ? 'Bakandeya' : cleanId.charAt(0).toUpperCase() + cleanId.slice(1));
    const bandBio = bandConfig?.biografia || registeredBand?.biografia || registeredBand?.dossier_texto_extra || '';

    const client = getAiClient();
    if (client) {
      const promptPitch = `Eres el Agente Redactor e Inteligencia Artificial de Booking de la banda "${bandName}" (${bandBio ? bandBio : 'banda de música en directo'}).
Redacta un correo de pitch inicial muy profesional, fresco y atractivo para presentar a la banda y proponer un concierto en la sala, festival o medio: "${lead.nombre_sala}" ubicado en ${lead.ciudad || "España"} (Tipo: ${lead.tipo || "sala"}, Aforo: ${lead.aforo || "N/D"}, Género habitual: ${lead.genero || "N/D"}).
${bandBio ? `Destaca su propuesta artística: ${bandBio}.` : `Destaca su propuesta de música en directo.`}
Escribe en castellano natural de España, sin sonar a plantilla robótica.
Devuelve ÚNICAMENTE el texto final redactado del pitch, sin asuntos, encabezados ni metadatos.`;

      try {
        const pitchRes = await generateContentWithFallback(client, { contents: promptPitch });
        if (pitchRes && pitchRes.text) {
          lead.pitch_generado = pitchRes.text.trim();
          modified = true;
          console.log(`[AutoEnrich] Pitch inicial generado automáticamente para '${lead.nombre_sala}'.`);
        }
      } catch (e: any) {
        console.warn(`[AutoEnrich] Error generando pitch inicial:`, e?.message || e);
      }
    }

    if (!lead.pitch_generado || lead.pitch_generado === "Sin pitch generado." || lead.pitch_generado.trim() === "") {
      if (bandBio) {
        lead.pitch_generado = `¡Buenas desde el equipo de ${bandName}!\n\nQueríamos proponeros un concierto en ${lead.nombre_sala} (${lead.ciudad || "España"}). Nuestra propuesta es un directo de ${bandBio} enérgico y profesional, ideal para vuestro espacio.\n\n¿Cómo tenéis la agenda para los próximos meses?\n\n¡Un saludo!\n${bandName} Agent Manager`;
        modified = true;
      } else {
        lead.pitch_generado = `¡Buenas desde el equipo de ${bandName}!\n\nQueríamos proponeros un concierto en ${lead.nombre_sala} (${lead.ciudad || "España"}). Nos encanta vuestra programación y creemos que nuestra propuesta de música en directo encajaría muy bien en vuestro espacio.\n\n¿Cómo tenéis la disponibilidad para los próximos meses?\n\n¡Un saludo!\n${bandName} Agent Manager`;
        modified = true;
      }
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

  if (modified) {
    console.log(`[AutoEnrich] Lead '${lead.nombre_sala}' enriquecido y guardado con éxito.`);
    const savedEnriched = await dbUpsertLead(lead, userBandId);
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
  "aforo_promedio": 300,
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
