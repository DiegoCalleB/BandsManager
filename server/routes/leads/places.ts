import express from "express";
import { Lead } from "../../../src/types.js";
import { loadState, saveState, requireAuth } from "../../state.js";
import { dbUpsertLead, dbCheckDeletedLead, dbGetLeads, dbGetActiveCampaign } from "../../db.js";
import { getAiClient, generateContentWithFallback, isSpendCapOrQuotaError } from "../../ai.js";
import { safeParseJson } from "../../utils.js";
import { getDomainFromUrl } from "./helpers.js";
import { getBandDnaProfile } from "../../utils/bandDna.js";
import { getTargetBandId } from "../../utils/bandAccess.js";
import { searchVenuesWithSerper, enrichVenueDetailsWithSerper } from "../../services/venueIntelligenceService.js";
import { discoverVenuesMultiSource } from "../../services/multiSourceVenueDiscoveryService.js";
import { findVenuesBySimilarArtists } from "../../services/similarBandsVenueMatcherService.js";
import { searchPublicCulturalOpportunities } from "../../services/publicCulturalEventsRadarService.js";

const router = express.Router();

/**
 * Normaliza el nombre de un recinto para comparación y deduplicación inteligente:
 * Elimina prefijos genéricos ("sala", "teatro", "club", etc.), tildes y caracteres no alfanuméricos.
 */
export function normalizeVenueName(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar acentos
    .replace(/\b(sala|teatro|club|cafe|cafeteria|pub|espacio|asociacion|cultural|discoteca|auditorio|centro|la|el|los|las|de|del|y|&)\b/gi, " ")
    .replace(/[^a-z0-9]/g, "") // solo alfanumérico
    .trim();
}

router.post(["/places-search", "/leads/places-search"], requireAuth, async (req, res) => {
  try {
    const { query, ciudad, region, tipo, limit: rawLimit, aforoMin, aforoMax } = req.body;
    const limit = Math.max(1, Math.min(10, Number(rawLimit) || 8));

    if (!query && !ciudad) {
      return res.status(400).json({ error: "Proporciona una consulta o ciudad de búsqueda." });
    }

    const lowerTipo = (tipo || "").toLowerCase();
    const isBandSearch = lowerTipo.includes('grupo') || lowerTipo.includes('banda');
    const isAyuntamientoSearch = lowerTipo.includes('ayuntamiento') || lowerTipo.includes('institucion') || lowerTipo.includes('ayto');
    const isWebEntitySearch = isBandSearch || lowerTipo.includes('sello') || lowerTipo.includes('agencia') || lowerTipo.includes('medio');

    const categorySearchPrefixes: Record<string, string> = {
      ayuntamiento: "ayuntamientos concejalías de festejos fiestas patronales cultura contratación conciertos",
      festival: "festivales de música ciclos de conciertos y ferias con música en directo",
      sala: "salas de conciertos locales y teatros con música en directo",
      discoteca: "discotecas y clubs con djs o música en vivo",
      grupo: "grupos y bandas de música en activo conciertos directos",
      agencia: "agencias de booking musical y management de bandas",
      sello: "sellos discográficos y editoriales de música",
      medio: "medios musicales programas de radio y prensa musical"
    };

    const typePrefix = (tipo && categorySearchPrefixes[lowerTipo]) 
      ? categorySearchPrefixes[lowerTipo] 
      : (isBandSearch ? "grupos y bandas de música en activo" : "salas de conciertos y festivales de música en directo");
    const searchQuery = query || `${typePrefix} en ${ciudad}${region ? `, ${region}` : ''}`;
    const placesApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.VITE_GOOGLE_PLACES_API_KEY || "";

    // Google Places API is great for physical places (venues, clubs, theaters, city halls).
    // For musical bands/groups, record labels, and agencies, we skip Places API and use Gemini Grounding directly.
    if (!isWebEntitySearch && placesApiKey && placesApiKey.trim() !== "") {
      try {
        let placesQuery = searchQuery;
        if (isAyuntamientoSearch) {
          placesQuery = `Ayuntamiento de ${ciudad || 'Madrid'}`;
        }

        console.log(`[Google Places API (New)] Realizando búsqueda v1/places:searchText para: "${placesQuery}" (Límite: ${limit})`);
        const v1Res = await fetch("https://places.googleapis.com/v1/places:searchText", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": placesApiKey,
            "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.types,places.photos,places.businessStatus"
          },
          body: JSON.stringify({
            textQuery: placesQuery,
            languageCode: "es",
            pageSize: Math.min(20, limit * 2)
          })
        });

        const v1Data: any = await v1Res.json();
        if (v1Res.ok && Array.isArray(v1Data.places) && v1Data.places.length > 0) {
          const v1Places = v1Data.places
            .filter((place: any) => {
              // Strictly filter out permanently closed or temporarily closed venues
              const status = place.businessStatus || "OPERATIONAL";
              if (status === "CLOSED_PERMANENTLY" || status === "CLOSED_TEMPORARILY") {
                console.log(`[Google Places] Excluyendo local cerrado (${status}): ${place.displayName?.text}`);
                return false;
              }
              return true;
            })
            .slice(0, limit)
            .map((place: any) => {
            const addressParts = (place.formattedAddress || "").split(",");
            const extractedCity = ciudad || (addressParts.length >= 2 ? addressParts[addressParts.length - 2].trim().replace(/\d{5}\s*/, '') : "España");

            let photoUrl = "";
            if (place.photos && place.photos.length > 0 && place.photos[0].name) {
              photoUrl = `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxHeightPx=600&maxWidthPx=800&key=${placesApiKey}`;
            }

            const domain = getDomainFromUrl(place.websiteUri || "");
            if (!photoUrl && domain) {
              photoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
            }

            // Determine default category based on search type or place types
            let resolvedType = tipo || "sala";
            let resolvedIcon = "🏛️";
            const placeTypes = place.types || [];
            let defaultGenre = "Música en Directo / Variado";
            let defaultDesc = `Recinto para conciertos y eventos musicales en ${extractedCity}.`;

            if (isAyuntamientoSearch || placeTypes.includes('city_hall') || placeTypes.includes('local_government_office')) {
              resolvedType = 'ayuntamiento';
              resolvedIcon = '🏛️';
              defaultGenre = 'Fiestas Patronales / Cultura Municipal';
              defaultDesc = `Ayuntamiento y concejalía de festejos/cultura para contratación y programación de conciertos en ${extractedCity}.`;
            } else if (lowerTipo.includes('festival') || placeTypes.includes('festival')) {
              resolvedType = 'festival';
              resolvedIcon = '🎪';
              defaultGenre = 'Festivales / Directo / Outdoor';
              defaultDesc = `Festival / evento cultural con escenarios para actuaciones y conciertos en directo en ${extractedCity}.`;
            } else if (lowerTipo.includes('discoteca') || placeTypes.includes('night_club')) {
              resolvedType = 'discoteca';
              resolvedIcon = '🪩';
              defaultGenre = 'Electrónica / Club / DJs';
              defaultDesc = `Club nocturno y sala de baile con sesiones y actuaciones en directo en ${extractedCity}.`;
            } else if (lowerTipo.includes('teatro') || placeTypes.includes('performing_arts_theater')) {
              resolvedType = 'sala';
              resolvedIcon = '🎭';
              defaultGenre = 'Acústico / Teatro / Directo';
              defaultDesc = `Espacio escénico y teatro con acústica idónea para directos y conciertos en ${extractedCity}.`;
            } else if (isBandSearch) {
              resolvedType = 'grupo';
              resolvedIcon = '🎸';
              defaultGenre = 'Banda / Directo';
              defaultDesc = `Grupo / banda de música en activo para colaboraciones e intercambios.`;
            } else if (lowerTipo.includes('agencia') || lowerTipo.includes('manager')) {
              resolvedType = 'agencia';
              resolvedIcon = '💼';
              defaultGenre = 'Management & Booking';
              defaultDesc = `Agencia y promotora de contratación artística y gestión de conciertos.`;
            } else if (lowerTipo.includes('sello')) {
              resolvedType = 'sello';
              resolvedIcon = '💿';
              defaultGenre = 'Discográfica / Editorial';
              defaultDesc = `Sello discográfico y distribuidora de proyectos musicales.`;
            } else if (lowerTipo.includes('medio') || lowerTipo.includes('radio')) {
              resolvedType = 'medio';
              resolvedIcon = '📻';
              defaultGenre = 'Radio / Prensa Musical';
              defaultDesc = `Medio de comunicación y difusión especializado en escena musical.`;
            }

            return {
              place_id: place.id,
              nombre_sala: place.displayName?.text || "Sala / Recinto",
              ciudad: extractedCity,
              region: region || "España",
              direccion: place.formattedAddress || "",
              telefono: place.nationalPhoneNumber || place.internationalPhoneNumber || "",
              website: place.websiteUri || "",
              rating: place.rating || null,
              user_ratings_total: place.userRatingCount || null,
              tipo: resolvedType,
              aforo: aforoMin ? Number(aforoMin) : 0,
              genero: defaultGenre,
              descripcion: defaultDesc,
              imagen_url: photoUrl,
              icono: resolvedIcon,
              email_contacto: "",
              fuente: "Google Places API (New)"
            };
          });

          return res.json({
            success: true,
            isPlacesApi: true,
            source: "Google Places API (New)",
            query: placesQuery,
            results: v1Places
          });
        }
      } catch (placesErr: any) {
        console.warn("[Google Places API Warning] Failed to fetch from Places API, falling back to Serper/Gemini:", placesErr.message);
      }
    }

    // MOTOR SERPER PLACES + ENRIQUECIMIENTO QUIRÚRGICO DE CONTACTO
    if (!isWebEntitySearch && process.env.SERPER_API_KEY) {
      try {
        console.log(`[Serper Places] Realizando búsqueda estructurada para: "${searchQuery}" (Ciudad: ${ciudad || "España"}, Tipo: ${tipo || "sala"}, Límite: ${limit})`);
        const serperPlaces = await searchVenuesWithSerper({
          query: searchQuery,
          city: ciudad,
          region,
          type: tipo || "sala",
          limit
        });

        if (serperPlaces && serperPlaces.length > 0) {
          // Enriquecimiento de fichas (email, aforo, teléfono) en paralelo para los recintos encontrados
          const enrichedResults = await Promise.all(
            serperPlaces.map(async (place) => {
              try {
                const contactData = await enrichVenueDetailsWithSerper(place.nombre_sala, place.ciudad);
                if (contactData) {
                  if (contactData.email && !place.email_contacto) {
                    place.email_contacto = contactData.email;
                  }
                  if (contactData.aforo && (!place.aforo || place.aforo === 0)) {
                    place.aforo = contactData.aforo;
                  }
                  if (contactData.telefono && !place.telefono) {
                    place.telefono = contactData.telefono;
                  }
                  if (contactData.website && !place.website) {
                    place.website = contactData.website;
                  }
                  if (contactData.instagram && !place.instagram) {
                    place.instagram = contactData.instagram;
                  }
                }
              } catch (_) {}
              return place;
            })
          );

          return res.json({
            success: true,
            isPlacesApi: true,
            source: "Serper Google Places & Live Intelligence",
            query: searchQuery,
            results: enrichedResults
          });
        }
      } catch (serperErr: any) {
        console.warn("[Serper Places Warning] Error en búsqueda con Serper, pasando a fallback Gemini:", serperErr?.message || serperErr);
      }
    }

    // Fallback or Primary for Bands/Web Entities: Gemini Search Grounding
    console.log(`[Search Scout Grounding] Using Gemini Search Grounding for query: "${searchQuery}" (Tipo: ${tipo || 'sala'}, Límite: ${limit})`);
    const aiClient = getAiClient();
    if (!aiClient) {
      return res.status(500).json({ error: "Ni Google Places API ni Gemini API están disponibles." });
    }

    const aforoFilterText = (aforoMin || aforoMax) 
      ? `Filtrar preferentemente recintos o bandas con aforo aproximado ${aforoMin ? `desde ${aforoMin}` : ''} ${aforoMax ? `hasta ${aforoMax}` : ''} personas.` 
      : '';

    let specificTypeInstructions = "";
    if (isBandSearch) {
      specificTypeInstructions = `
REGLAS ESTRICTAS PARA GRUPOS Y BANDAS DE MÚSICA:
- OBJETIVO OBLIGATORIO: Debes encontrar EXCLUSIVAMENTE GRUPOS, BANDAS DE MÚSICA O ARTISTAS MUSICALES REALES EN ACTIVO (originarios de o activos en ${ciudad || 'España'}).
- PROHIBICIÓN ABSOLUTA: QUEDA TOTALMENTE PROHIBIDO devolver salas de conciertos, bares de copas, discotecas o empresas hosteleras que tengan la palabra "grupo" en su nombre (por ejemplo, NUNCA devuelvas "Grupo Kapital", "Grupo Pachá", "Grupo La Rumba", etc.).
- Cada resultado DEBE ser un conjunto musical o banda real (ejemplos: bandas de Rock, Indie Pop, Metal, Punk, Garage, Flamenco Fusión, Rumba, etc.).
- "nombre_sala": Nombre oficial de la BANDA / GRUPO DE MÚSICA (ej. "Arde Bogotá", "Cala Vento", "Derby Motoreta's Burrito Kachimba", "Los Zigarros", "La Pegatina", "Morgan", "Shinova", o bandas locales y emergentes reales de ${ciudad || 'la zona'}).
- "tipo": "grupo"
- "icono": "🎸"
- "genero": Género musical de la banda (ej. "Indie Rock", "Pop Punk", "Garage Rock", "Metal Alternativo", "Folk / Mestizaje")
- "descripcion": Breve biografía de la banda, formación, directos y estilo musical.
- "website": Enlace oficial a su Spotify, Bandcamp, Instagram oficial de la banda o web.`;
    } else if (isAyuntamientoSearch) {
      specificTypeInstructions = `
REGLAS ESTRICTAS PARA AYUNTAMIENTOS E INSTITUCIONES PÚBLICAS:
- OBJETIVO OBLIGATORIO: Localizar AYUNTAMIENTOS, CONCEJALÍAS DE FESTEJOS / FIESTAS PATRONALES, ÁREAS DE CULTURA Y COMISIONES DE FIESTAS MUNICIPALES en ${ciudad || 'España'} y municipios de la comarca o provincia.
- Las entidades DEBEN organizar programación de conciertos, fiestas mayores, festivales públicos o verbenas.
- "nombre_sala": Nombre oficial institucional (ej. "Ayuntamiento de ${ciudad || 'Alcorcón'} - Concejalía de Festejos y Cultura", "Ayuntamiento de ... - Comisión de Fiestas")
- "tipo": "ayuntamiento"
- "icono": "🏛️"
- "genero": "Fiestas Patronales / Cultura Municipal / Conciertos Públicos"
- "descripcion": Resumen de las fiestas patronales, ciclos de conciertos de verano y eventos musicales que programa el consistorio.
- "direccion": Casa Consistorial o dirección de la sede del Ayuntamiento / Centro Cultural.
- "website": Web oficial del ayuntamiento o portal de festejos/cultura.`;
    } else if (lowerTipo.includes('festival')) {
      specificTypeInstructions = `
REGLAS PARA FESTIVALES Y FERIAS:
- Festivales de música, ferias de cerveza con escenario o ciclos de conciertos en ${ciudad || 'España'}.
- "tipo": "festival"
- "icono": "🎪"`;
    } else if (lowerTipo.includes('discoteca')) {
      specificTypeInstructions = `
REGLAS PARA CLUBS Y DISCOTECAS:
- Clubs nocturnos y salas de baile con sesiones y actuaciones en directo en ${ciudad || 'España'}.
- "tipo": "discoteca"
- "icono": "🪩"`;
    } else {
      specificTypeInstructions = `
REGLAS PARA SALAS Y TEATROS:
- Salas de conciertos, locales y teatros con programación regular de música en directo en ${ciudad || 'España'}.
- "tipo": "sala"
- "icono": "🏛️"`;
    }

    const prompt = `Busca información real y actualizada sobre entidades musicales en España para la siguiente búsqueda:
BÚSQUEDA: "${searchQuery}"
CATEGORÍA OBJETIVO: "${tipo || 'Cualquiera'}"
CIUDAD/REGIÓN: "${ciudad || 'España'}"
${aforoFilterText}

${specificTypeInstructions}

PAUTAS CRÍTICAS DE BÚSQUEDA Y FILTRADO:
1. Localiza exactamente hasta ${limit} entidades o bandas REALES, ACTIVAS y OPERATIVAS en España con sus datos principales.
2. EXCLUYE Y FILTRA estrictamente cualquier entidad, sala o banda inactiva o cancelada.
3. Para cada entidad proporciona:
   - "nombre_sala": Nombre oficial exacto (si es grupo: nombre de la banda; si es ayuntamiento: Ayuntamiento de X - Concejalía de Fiestas; si es sala: nombre de la sala)
   - "ciudad": Ciudad donde se ubica o de donde es la banda
   - "region": Provincia o comunidad autónoma
   - "direccion": Dirección física o ciudad de origen
   - "telefono": Teléfono oficial si existe (o "" si no)
   - "website": Enlace a sitio web oficial, Instagram o perfil oficial
   - "rating": Puntuación media orientativa (ej. 4.5) o null
   - "aforo": Aforo aproximado (número entero o 0)
   - "tipo": "sala" | "ayuntamiento" | "discoteca" | "teatro" | "festival" | "grupo" | "agencia" | "sello" | "medio"
   - "genero": Estilos musicales principales
   - "descripcion": Breve resumen descriptivo (1-2 frases)
   - "icono": Icono emoji representativo ("🎸" para grupo, "🏛️" para ayuntamiento/sala, "🎪" para festival, "🪩" para discoteca, "💼" para agencia, "💿" para sello, "📻" para medio)
   - "email_contacto": Dejar como "" (no inventar correos ficticios).

Devuelve EXCLUSIVAMENTE un objeto JSON válido con este formato:
{
  "results": [
    {
      "place_id": "id_unico_o_slug",
      "nombre_sala": "Nombre oficial",
      "ciudad": "Ciudad",
      "region": "Comunidad autónoma o provincia",
      "direccion": "Dirección física o sede",
      "telefono": "Teléfono",
      "website": "Sitio web oficial o enlace",
      "rating": 4.5,
      "aforo": 400,
      "tipo": "grupo",
      "genero": "Indie / Pop / Rock",
      "descripcion": "Banda en activo de estilo indie rock con directos enérgicos y giras nacionales.",
      "imagen_url": "URL de logo o foto si existe",
      "icono": "🎸",
      "email_contacto": "",
      "fuente": "Google Search Grounding via Gemini"
    }
  ]
}`;

    let response: any;
    try {
      response = await generateContentWithFallback(aiClient, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
    } catch (err: any) {
      if (!isSpendCapOrQuotaError(err)) {
        response = await generateContentWithFallback(aiClient, {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: { responseMimeType: 'application/json' }
        });
      } else {
        throw err;
      }
    }

    const textResult = response?.text || "{}";
    const parsed = safeParseJson(textResult);
    const rawResults = Array.isArray(parsed?.results) ? parsed.results : [];
    const results = rawResults.slice(0, limit).map((r: any) => {
      let img = r.imagen_url || "";
      const domain = getDomainFromUrl(r.website || "");
      if (!img && domain) {
        img = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      }
      return {
        ...r,
        imagen_url: img
      };
    });

    return res.json({
      success: true,
      isPlacesApi: false,
      source: "Gemini Search Grounding",
      query: searchQuery,
      results
    });
  } catch (error: any) {
    console.error("Error in POST /api/leads/places-search:", error);
    res.status(500).json({ error: error?.message || "Error al buscar salas en Google Places." });
  }
});

// Búsqueda Masiva de Recintos, Locales y Discotecas para Campaña Activa y Estilo de Banda
router.post(["/campaign-mass-search", "/leads/campaign-mass-search"], requireAuth, async (req, res) => {
  try {
    const userBandId = (req as any).user?.band_id;
    const state = loadState();
    let { 
      targetCities, 
      minCapacity, 
      maxCapacity, 
      targetDates,
      targetDatesText,
      tipos, 
      campaignName, 
      campaignId, 
      limitPerCity, 
      bandGenre, 
      genero, 
      bandStyle 
    } = req.body;

    // Obtener ADN de la banda para conocer su género y estilo por defecto si no se indica
    let bandDnaGenre = "";
    let bandName = "Banda";
    try {
      if (userBandId) {
        const dna = getBandDnaProfile(state, userBandId);
        bandDnaGenre = dna.genero || "";
        bandName = dna.bandName || "Banda";
      }
    } catch (e) {
      console.warn("[Campaign Mass Search] Error obteniendo ADN de la banda:", e);
    }

    const resolvedGenre = (bandGenre || genero || bandStyle || bandDnaGenre || "Rock / Pop / Indie / Música en Directo").trim();

    // Si no se especifican ciudades, intentar resolver desde la campaña activa en Supabase
    if (!Array.isArray(targetCities) || targetCities.length === 0) {
      if (userBandId) {
        try {
          const activeCamp = await dbGetActiveCampaign(userBandId);
          if (activeCamp) {
            const cities = activeCamp.targetCities || (activeCamp as any).target_cities;
            targetCities = Array.isArray(cities) && cities.length > 0
              ? cities 
              : [(activeCamp as any).ciudad || "Madrid"];
            if (minCapacity === undefined) minCapacity = activeCamp.minCapacity ?? (activeCamp as any).min_capacity;
            if (maxCapacity === undefined) maxCapacity = activeCamp.maxCapacity ?? (activeCamp as any).max_capacity;
            if (!campaignName) campaignName = activeCamp.name;
          }
        } catch (e) {
          console.warn("[Campaign Mass Search] Error al obtener campaña activa de Supabase:", e);
        }
      }
    }

    if (!Array.isArray(targetCities) || targetCities.length === 0) {
      targetCities = ["Madrid"];
    }

    const minCap = minCapacity !== undefined && Number(minCapacity) >= 0 ? Number(minCapacity) : 0;
    const maxCap = maxCapacity !== undefined && Number(maxCapacity) > 0 ? Number(maxCapacity) : Infinity;
    const limit = Math.max(4, Math.min(25, Number(limitPerCity) || 12));

    const activeTipos: string[] = Array.isArray(tipos) && tipos.length > 0
      ? tipos
      : ["sala", "local", "discoteca", "teatro"];

    console.log(`[Campaign Mass Search] Iniciando prospección masiva para banda "${bandName}" (${resolvedGenre}) en campaña "${campaignName || 'Activa'}" - Ciudades: ${targetCities.join(', ')} (Aforo: ${minCap}-${maxCap === Infinity ? '∞' : maxCap}) [Categorías: ${activeTipos.join(', ')}]`);

    // 1. CARGA DE LEADS EXISTENTES PARA DEDUPLICACIÓN CONTRA SUPABASE Y ESTADO
    let existingLeads: any[] = [];
    if (userBandId) {
      try {
        existingLeads = await dbGetLeads(userBandId);
      } catch (e) {
        console.warn("[Campaign Mass Search] Error consultando leads existentes:", e);
      }
    }
    const allKnownLeads = [...existingLeads, ...(state.leads || [])];

    // Índices de coincidencia rápida
    const existingMap = new Map<string, any>();
    const existingPlaceIds = new Set<string>();
    const existingDomains = new Map<string, any>();
    const existingPhones = new Map<string, any>();

    for (const lead of allKnownLeads) {
      if (!lead.nombre_sala) continue;
      const normName = normalizeVenueName(lead.nombre_sala);
      const normCity = (lead.ciudad || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

      if (normName) {
        if (normCity) existingMap.set(`${normName}_${normCity}`, lead);
        existingMap.set(normName, lead);
      }
      if (lead.place_id) existingPlaceIds.add(lead.place_id);

      const domain = getDomainFromUrl(lead.website || "");
      if (domain && !["instagram.com", "facebook.com", "linktr.ee", "google.com", "spotify.com", "youtube.com"].includes(domain)) {
        existingDomains.set(domain, lead);
      }
      const cleanPhone = (lead.telefono || "").replace(/[^0-9]/g, "");
      if (cleanPhone && cleanPhone.length >= 9) {
        existingPhones.set(cleanPhone, lead);
      }
    }

    // 2. EJECUCIÓN MULTI-CONSULTA PARA CADA CIUDAD DE LA CAMPAÑA
    const discoveredRaw: any[] = [];
    const placesApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.VITE_GOOGLE_PLACES_API_KEY || "";

    for (const city of targetCities) {
      if (!city || typeof city !== "string" || !city.trim()) continue;
      const cleanCity = city.trim();

      // Consultas específicas para Recintos, Locales y Discotecas con música en vivo
      const subQueries: { query: string; defaultType: string; icon: string }[] = [];
      
      if (activeTipos.includes("sala")) {
        subQueries.push({ 
          query: `salas de conciertos directos ${resolvedGenre} ${cleanCity}`,
          defaultType: "sala",
          icon: "🏛️"
        });
      }
      if (activeTipos.includes("local") || activeTipos.includes("sala")) {
        subQueries.push({ 
          query: `locales bares con música en directo ${resolvedGenre} ${cleanCity}`,
          defaultType: "local",
          icon: "☕"
        });
      }
      if (activeTipos.includes("discoteca")) {
        subQueries.push({ 
          query: `discotecas clubs nocturnos música en directo sesiones ${cleanCity}`,
          defaultType: "discoteca",
          icon: "🪩"
        });
      }
      if (activeTipos.includes("teatro")) {
        subQueries.push({ 
          query: `teatros auditorios salas acústicas ${cleanCity}`,
          defaultType: "teatro",
          icon: "🎭"
        });
      }
      if (activeTipos.includes("grupo")) {
        subQueries.push({ 
          query: `grupos bandas de música en activo ${resolvedGenre} ${cleanCity}`,
          defaultType: "grupo",
          icon: "🎸"
        });
      }

      // A. Google Places API si está configurada
      if (placesApiKey && placesApiKey.trim() !== "") {
        for (const sqObj of subQueries) {
          try {
            const v1Res = await fetch("https://places.googleapis.com/v1/places:searchText", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": placesApiKey,
                "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.types,places.photos,places.businessStatus"
              },
              body: JSON.stringify({
                textQuery: sqObj.query,
                languageCode: "es",
                pageSize: Math.min(limit, 10)
              })
            });
            const v1Data: any = await v1Res.json();
            if (v1Res.ok && Array.isArray(v1Data.places)) {
              for (const place of v1Data.places) {
                const status = place.businessStatus || "OPERATIONAL";
                if (status === "CLOSED_PERMANENTLY" || status === "CLOSED_TEMPORARILY") continue;

                let photoUrl = "";
                if (place.photos && place.photos.length > 0 && place.photos[0].name) {
                  photoUrl = `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxHeightPx=600&maxWidthPx=800&key=${placesApiKey}`;
                }
                const domain = getDomainFromUrl(place.websiteUri || "");
                if (!photoUrl && domain) {
                  photoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                }

                // Determinar tipo a partir de tipos de Google Places o fallback a sqObj
                let calculatedType = sqObj.defaultType;
                let calculatedIcon = sqObj.icon;
                const pTypes = place.types || [];
                if (pTypes.includes("night_club") || pTypes.includes("disco")) {
                  calculatedType = "discoteca";
                  calculatedIcon = "🪩";
                } else if (pTypes.includes("bar") || pTypes.includes("cafe")) {
                  calculatedType = "local";
                  calculatedIcon = "☕";
                } else if (pTypes.includes("performing_arts_theater") || pTypes.includes("auditorium")) {
                  calculatedType = "teatro";
                  calculatedIcon = "🎭";
                }

                discoveredRaw.push({
                  place_id: place.id,
                  nombre_sala: place.displayName?.text || "Recinto Musical",
                  ciudad: cleanCity,
                  region: cleanCity,
                  direccion: place.formattedAddress || "",
                  telefono: place.nationalPhoneNumber || place.internationalPhoneNumber || "",
                  website: place.websiteUri || "",
                  rating: place.rating || null,
                  user_ratings_total: place.userRatingCount || null,
                  tipo: calculatedType,
                  aforo: 0,
                  genero: resolvedGenre,
                  descripcion: `Espacio de música en directo en ${cleanCity} apto para estilo ${resolvedGenre}.`,
                  imagen_url: photoUrl,
                  icono: calculatedIcon,
                  email_contacto: "",
                  fuente: `Google Places (${cleanCity})`
                });
              }
            }
          } catch (pErr: any) {
            console.warn(`[Mass Places] Advertencia en consulta "${sqObj.query}":`, pErr.message);
          }
        }
      }

      // B. Gemini Grounding Search para recintos, locales, discotecas y bandas compatibles con el estilo y aforo
      const aiClient = getAiClient();
      if (aiClient) {
        try {
          const dateStr = targetDatesText || (Array.isArray(targetDates) && targetDates.length > 0 ? targetDates.join(', ') : '');
          const datePrompt = dateStr ? ` para la fecha prevista "${dateStr}"` : '';
          const shouldIncludeGroups = activeTipos.includes("grupo");

          const groundingPrompt = `Actúa como un Scout Profesional de Booking Musical en España.
Para la campaña de conciertos en la ciudad "${cleanCity}" (España)${datePrompt} con rango de aforo ${minCap} a ${maxCap === Infinity ? 'sin límite' : maxCap} personas y estilo musical "${resolvedGenre}":

Busca y extrae una lista exhaustiva de hasta ${limit} recintos, locales, discotecas, teatros y bandas locales REALES, ACTIVOS Y OPERATIVOS en "${cleanCity}" que programen conciertos, música en directo o sean afines al género "${resolvedGenre}".

Debes incluir según proceda:
1. Salas de conciertos dedicadas y recintos de directos (tipo: "sala")
2. Locales, bares musicales, pubs con escenario y cafés concierto (tipo: "local")
3. Discotecas, salas de fiesta y clubs nocturnos con conciertos/sesiones (tipo: "discoteca")
4. Teatros, auditorios y centros culturales con acústica para directos (tipo: "teatro")
${shouldIncludeGroups ? `5. Bandas y grupos locales en activo en "${cleanCity}" afines al género para co-booking, compartir cartel o intercambio de fechas (tipo: "grupo")` : ''}

Para cada lugar o banda proporciona:
- nombre_sala: Nombre oficial exacto (o nombre de la banda local)
- ciudad: "${cleanCity}"
- region: "${cleanCity}"
- direccion: Calle o zona en ${cleanCity}
- telefono: Teléfono oficial (o "")
- website: Web oficial, Instagram o perfil público (o "")
- aforo: Aforo orientativo en número (ej. 150, 300, 500, o 0 si se desconoce)
- genero: Géneros habituales programados o estilo de la banda
- tipo: "sala" | "local" | "discoteca" | "teatro" | "grupo"
- rating: Puntuación orientativa (ej. 4.5)
- descripcion: Breve explicación de por qué encaja con el estilo "${resolvedGenre}" y aforo ${minCap}-${maxCap === Infinity ? 'libre' : maxCap}${dateStr ? ` para la fecha ${dateStr}` : ''}.

Responde estrictamente con un JSON con la estructura:
{
  "results": [ ... ]
}`;

          let response: any;
          try {
            response = await generateContentWithFallback(aiClient, {
              contents: [{ role: 'user', parts: [{ text: groundingPrompt }] }],
              config: {
                // @ts-ignore
                tools: [{ googleSearch: {} }],
                responseMimeType: 'application/json'
              }
            });
          } catch (aiErr: any) {
            if (!isSpendCapOrQuotaError(aiErr)) {
              response = await generateContentWithFallback(aiClient, {
                contents: [{ role: 'user', parts: [{ text: groundingPrompt }] }],
                config: { responseMimeType: 'application/json' }
              });
            }
          }

          const textRes = response?.text || "{}";
          const parsedRes = safeParseJson(textRes);
          if (Array.isArray(parsedRes?.results)) {
            for (const r of parsedRes.results) {
              let img = r.imagen_url || "";
              const domain = getDomainFromUrl(r.website || "");
              if (!img && domain) {
                img = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
              }
              const tipoNormalized = (r.tipo || 'sala').toLowerCase();
              discoveredRaw.push({
                ...r,
                place_id: r.place_id || `mass-scout-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                ciudad: r.ciudad || cleanCity,
                region: r.region || cleanCity,
                tipo: tipoNormalized,
                imagen_url: img,
                icono: tipoNormalized === 'teatro' ? '🎭' : tipoNormalized === 'discoteca' ? '🪩' : tipoNormalized === 'local' ? '☕' : '🏛️',
                fuente: `Scout IA Grounding (${cleanCity})`
              });
            }
          }
        } catch (groundingErr: any) {
          console.warn(`[Mass Grounding] Error en ${cleanCity}:`, groundingErr.message);
        }
      }
    }

    // 3. FUSIÓN INTRA-LOTE Y DEDUPLICACIÓN CONTRA SUPABASE
    const unifiedPool = new Map<string, any>();

    for (const raw of discoveredRaw) {
      if (!raw.nombre_sala || raw.nombre_sala.trim().length < 2) continue;

      const normName = normalizeVenueName(raw.nombre_sala);
      const normCity = (raw.ciudad || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      const poolKey = normName ? `${normName}_${normCity}` : (raw.place_id || raw.nombre_sala);

      // Si ya está en el pool de esta búsqueda, fusionamos los mejores metadatos
      if (unifiedPool.has(poolKey)) {
        const existingInPool = unifiedPool.get(poolKey);
        if (!existingInPool.telefono && raw.telefono) existingInPool.telefono = raw.telefono;
        if (!existingInPool.website && raw.website) existingInPool.website = raw.website;
        if (!existingInPool.email_contacto && raw.email_contacto) existingInPool.email_contacto = raw.email_contacto;
        if ((!existingInPool.aforo || existingInPool.aforo === 0) && raw.aforo > 0) existingInPool.aforo = raw.aforo;
        if (!existingInPool.imagen_url && raw.imagen_url) existingInPool.imagen_url = raw.imagen_url;
        continue;
      }

      // Verificación de lista negra / eliminados previamente
      const isDeleted = await dbCheckDeletedLead(raw.nombre_sala, userBandId);
      if (isDeleted) continue;

      // Verificación contra CRM de Supabase
      let matchedExisting: any = null;
      if (raw.place_id && existingPlaceIds.has(raw.place_id)) {
        matchedExisting = allKnownLeads.find(l => l.place_id === raw.place_id);
      }
      if (!matchedExisting && normName) {
        matchedExisting = existingMap.get(`${normName}_${normCity}`) || existingMap.get(normName);
      }
      if (!matchedExisting && raw.website) {
        const d = getDomainFromUrl(raw.website);
        if (d && existingDomains.has(d)) {
          matchedExisting = existingDomains.get(d);
        }
      }
      if (!matchedExisting && raw.telefono) {
        const cp = raw.telefono.replace(/[^0-9]/g, "");
        if (cp && cp.length >= 9 && existingPhones.has(cp)) {
          matchedExisting = existingPhones.get(cp);
        }
      }

      const alreadyInCrm = Boolean(matchedExisting);
      const leadAforo = Number(raw.aforo) || 0;

      // Verificación de coincidencia de aforo con la campaña
      let capacityMatch = true;
      if (leadAforo > 0) {
        if (leadAforo < minCap || (maxCap < Infinity && leadAforo > maxCap)) {
          capacityMatch = false;
        }
      }

      unifiedPool.set(poolKey, {
        ...raw,
        alreadyInCrm,
        crmStatus: matchedExisting ? (matchedExisting.estado || "registrado") : null,
        crmId: matchedExisting ? matchedExisting.id : null,
        crmNombre: matchedExisting ? matchedExisting.nombre_sala : null,
        capacityMatch,
        selected: !alreadyInCrm // Por defecto seleccionamos solo los nuevos
      });
    }

    const finalResults = Array.from(unifiedPool.values());
    // Ordenar: primero los nuevos con coincidencia de aforo, luego los demás nuevos, luego los existentes
    finalResults.sort((a, b) => {
      if (!a.alreadyInCrm && b.alreadyInCrm) return -1;
      if (a.alreadyInCrm && !b.alreadyInCrm) return 1;
      if (a.capacityMatch && !b.capacityMatch) return -1;
      if (!a.capacityMatch && b.capacityMatch) return 1;
      return (b.rating || 0) - (a.rating || 0);
    });

    const newVenuesCount = finalResults.filter(r => !r.alreadyInCrm).length;
    const alreadyInCrmCount = finalResults.filter(r => r.alreadyInCrm).length;

    console.log(`[Campaign Mass Search] Completada búsqueda masiva: ${finalResults.length} recintos unificados (${newVenuesCount} nuevos, ${alreadyInCrmCount} ya en CRM).`);

    return res.json({
      success: true,
      campaignName: campaignName || "Campaña Activa",
      targetCities,
      bandGenre: resolvedGenre,
      tipos: activeTipos,
      minCapacity: minCap,
      maxCapacity: maxCap === Infinity ? null : maxCap,
      totalDiscovered: finalResults.length,
      newVenuesCount,
      alreadyInCrmCount,
      results: finalResults
    });

  } catch (error: any) {
    console.error("Error in POST /api/leads/campaign-mass-search:", error);
    res.status(500).json({ error: error?.message || "Error al realizar la búsqueda masiva de recintos para la campaña." });
  }
});

// Email Extraction Pipeline for Google Places & Web Venues (Agente Enriquecedor)
router.post(["/extract-emails", "/leads/extract-emails"], requireAuth, async (req, res) => {
  try {
    const { places } = req.body;
    if (!Array.isArray(places) || places.length === 0) {
      return res.status(400).json({ error: "Proporciona una lista de salas/medios para extraer sus emails." });
    }

    const aiClient = getAiClient();
    if (!aiClient) {
      return res.json({
        success: true,
        totalProcessed: places.length,
        extractedCount: 0,
        extracted: places.map(p => ({
          id: p.place_id || p.id || p.nombre_sala,
          nombre_sala: p.nombre_sala,
          email_contacto: "",
          instagram: "",
          contacto_nombre: "",
          confianza: "baja",
          fuente: "Sin API key configurada"
        }))
      });
    }

    console.log(`[Email Extractor] Procesando extracción de email para ${places.length} salas...`);

    // Helper to process a sub-batch of max 4 items
    const processBatch = async (batch: any[]) => {
      const prompt = `Eres el Agente Especialista en Extracción de Contactos Directos de Bakandeya.
Tu misión es investigar y extraer el CORREO ELECTRÓNICO OFICIAL DE CONTACTO O BOOKING y el USUARIO DE INSTAGRAM REAL para cada una de las siguientes entidades en España:

${JSON.stringify(batch.map((p: any) => ({
  id: p.place_id || p.id || p.nombre_sala,
  nombre_sala: p.nombre_sala,
  ciudad: p.ciudad || "",
  website: p.website || ""
})), null, 2)}

REGLAS OBLIGATORIAS E INNEGOCIABLES:
1. Investiga en la web oficial, páginas de contacto o aviso legal, o perfiles públicos de redes de cada entidad.
2. Extrae ÚNICAMENTE correos de contacto reales que existan públicamente (ej: info@..., booking@..., programacion@..., contacto@...).
3. PROHIBIDO GENERAR CORREOS INVENTADOS O FALSOS. Si no encuentras un correo real verificado con seguridad, pon "".
4. Para cada entidad, devuelve:
   - id: el mismo id recibido
   - email_contacto: el correo real hallado o ""
   - instagram: el usuario de instagram (@...) o ""
   - contacto_nombre: nombre del responsable o ""
   - confianza: "alta" | "media" | "baja"
   - fuente: URL o sitio donde se encontró el correo

Devuelve EXCLUSIVAMENTE un objeto JSON válido con la estructura:
{
  "extracted": [
    {
      "id": "...",
      "nombre_sala": "...",
      "email_contacto": "...",
      "instagram": "...",
      "contacto_nombre": "...",
      "confianza": "alta"|"media"|"baja",
      "fuente": "..."
    }
  ]
}`;

      try {
        let response: any;
        try {
          response = await generateContentWithFallback(aiClient, {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
              tools: [{ googleSearch: {} }]
            }
          });
        } catch (err: any) {
          if (!isSpendCapOrQuotaError(err)) {
            console.warn("[Email Extractor Warning] Grounding failed, fallback to direct JSON model:", err?.message || err);
            response = await generateContentWithFallback(aiClient, {
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              config: { responseMimeType: 'application/json' }
            });
          } else {
            throw err;
          }
        }

        const textResult = response?.text || "{}";
        const parsed = safeParseJson(textResult);
        return Array.isArray(parsed?.extracted) ? parsed.extracted : [];
      } catch (err: any) {
        console.warn("[Email Extractor Warning] Error processing batch:", err?.message);
        return batch.map(p => ({
          id: p.place_id || p.id || p.nombre_sala,
          nombre_sala: p.nombre_sala,
          email_contacto: "",
          instagram: "",
          contacto_nombre: "",
          confianza: "baja",
          fuente: "Búsqueda web no concluyente"
        }));
      }
    };

    // Split places into chunks of 3 for fast, reliable search execution without timeouts
    const CHUNK_SIZE = 3;
    const chunks: any[][] = [];
    for (let i = 0; i < places.length; i += CHUNK_SIZE) {
      chunks.push(places.slice(i, i + CHUNK_SIZE));
    }

    const allExtracted: any[] = [];
    for (const chunk of chunks) {
      const result = await processBatch(chunk);
      allExtracted.push(...result);
    }

    return res.json({
      success: true,
      totalProcessed: places.length,
      extractedCount: allExtracted.filter((e: any) => e.email_contacto && e.email_contacto.trim() !== "").length,
      extracted: allExtracted
    });
  } catch (error: any) {
    console.error("Error in POST /api/leads/extract-emails:", error);
    res.status(500).json({ error: error?.message || "Error al extraer correos electrónicos de las salas." });
  }
});

// Import Google Places / Extracted Leads directly into CRM & Google Sheets
router.post(["/import-places", "/leads/import-places"], requireAuth, async (req, res) => {
  try {
    const { leads } = req.body;
    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ error: "Proporciona un array de leads a importar." });
    }

    const userBandId = (req as any).user?.band_id ;
    const state = loadState();
    let importedCount = 0;
    const newlyAddedLeads: Lead[] = [];
    const nowStr = new Date().toISOString().split('T')[0];

    for (const rawLead of leads) {
      if (!rawLead.nombre_sala) continue;

      // Check if lead was previously deleted / blacklisted
      const isDeleted = await dbCheckDeletedLead(rawLead.nombre_sala, userBandId);
      if (isDeleted) {
        console.log(`[Import Places] Omitiendo sala por estar en la lista negra / eliminada previamente: ${rawLead.nombre_sala}`);
        continue;
      }

      // Check if lead already exists by name and city
      const existing = state.leads.find((l: any) => 
        l.nombre_sala.toLowerCase().trim() === rawLead.nombre_sala.toLowerCase().trim() &&
        (l.ciudad || "").toLowerCase().trim() === (rawLead.ciudad || "").toLowerCase().trim()
      );

      if (existing) {
        // Update existing lead with missing details
        let updated = false;
        if (!existing.email_contacto && rawLead.email_contacto) {
          existing.email_contacto = rawLead.email_contacto;
          updated = true;
        }
        const incomingTel = (rawLead.telefono_movil || rawLead.telefono || "").trim();
        const incomingFijo = (rawLead.telefono_fijo || "").trim();
        const isIncomingMob = /^(?:\+?34\s*)?[67]/.test(incomingTel);
        const isIncomingFij = /^(?:\+?34\s*)?[89]/.test(incomingTel);

        if (!existing.telefono && incomingTel) {
          existing.telefono = incomingTel;
          updated = true;
        }
        if (!existing.telefono_movil) {
          if (rawLead.telefono_movil) {
            existing.telefono_movil = rawLead.telefono_movil;
            updated = true;
          } else if (isIncomingMob) {
            existing.telefono_movil = incomingTel;
            updated = true;
          }
        }
        if (!existing.telefono_fijo) {
          if (incomingFijo) {
            existing.telefono_fijo = incomingFijo;
            updated = true;
          } else if (isIncomingFij) {
            existing.telefono_fijo = incomingTel;
            updated = true;
          }
        }
        if (!existing.website && rawLead.website) {
          existing.website = rawLead.website;
          updated = true;
        }
        if (!existing.instagram && rawLead.instagram) {
          existing.instagram = rawLead.instagram;
          updated = true;
        }
        if (!existing.direccion && rawLead.direccion) {
          existing.direccion = rawLead.direccion;
          updated = true;
        }
        if (!existing.imagen_url && rawLead.imagen_url) {
          existing.imagen_url = rawLead.imagen_url;
          updated = true;
        }
        if (updated) {
          existing.notas = `*** [${nowStr}] Actualizado desde Google Places & Extraedor IA ***\n${existing.notas || ''}`;
          await dbUpsertLead(existing, userBandId);
        }
      } else {
        // Create new lead with normalized category
        let resolvedType: string = (rawLead.tipo || "sala").toLowerCase();
        if (resolvedType === 'ayuntamientos' || resolvedType === 'institucion' || resolvedType === 'ayto' || resolvedType === 'consistorio') resolvedType = 'ayuntamiento';
        if (resolvedType === 'discotecas' || resolvedType === 'club' || resolvedType === 'discoteca/sala') resolvedType = 'discoteca';
        if (resolvedType === 'salas' || resolvedType === 'teatro') resolvedType = 'sala';
        if (resolvedType === 'festivales' || resolvedType === 'fest') resolvedType = 'festival';
        if (resolvedType === 'banda' || resolvedType === 'bandas' || resolvedType === 'grupos') resolvedType = 'grupo';
        if (resolvedType === 'agencias' || resolvedType === 'management' || resolvedType === 'manager') resolvedType = 'agencia';
        if (resolvedType === 'sellos' || resolvedType === 'discografica' || resolvedType === 'discográfica') resolvedType = 'sello';
        if (resolvedType === 'medios' || resolvedType === 'prensa' || resolvedType === 'radio') resolvedType = 'medio';

        const rawPhone = (rawLead.telefono || "").trim();
        const isMob = /^(?:\+?34\s*)?[67]/.test(rawPhone);
        const isFij = /^(?:\+?34\s*)?[89]/.test(rawPhone);
        const telMovil = rawLead.telefono_movil || (isMob ? rawPhone : "");
        const telFijo = rawLead.telefono_fijo || (isFij ? rawPhone : "");

        const newLead: Lead = {
          id: `places-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          band_id: userBandId,
          nombre_sala: rawLead.nombre_sala,
          ciudad: rawLead.ciudad || "España",
          region: rawLead.region || "España",
          direccion: rawLead.direccion || "",
          aforo: Number(rawLead.aforo) || 0,
          genero: rawLead.genero || "Música en Directo / Mestizaje",
          tipo: resolvedType as any,
          email_contacto: rawLead.email_contacto || "",
          telefono: rawPhone || telMovil || telFijo || "",
          telefono_movil: telMovil,
          telefono_fijo: telFijo,
          instagram: rawLead.instagram || "",
          website: rawLead.website || "",
          contacto_nombre: rawLead.contacto_nombre || "",
          fuente: rawLead.fuente || "Buscador de Salas (Scout Descubridor)",
          estado: "nuevo",
          pitch_generado: "",
          notas: rawLead.descripcion 
            ? `${rawLead.descripcion}\n\n[Importado mediante Buscador de Salas & Extraedor de Emails IA - ${nowStr}]`
            : `Importado mediante Buscador de Salas & Extraedor de Emails IA (${nowStr}).`,
          icono: rawLead.icono || (resolvedType === 'festival' ? '🎪' : resolvedType === 'discoteca' ? '🪩' : resolvedType === 'grupo' ? '🎸' : resolvedType === 'agencia' ? '💼' : resolvedType === 'sello' ? '💿' : resolvedType === 'medio' ? '📻' : '🏛️'),
          imagen_url: rawLead.imagen_url || ""
        };

        state.leads.push(newLead);
        await dbUpsertLead(newLead, userBandId);
        newlyAddedLeads.push(newLead);
        importedCount++;
      }
    }

    saveState(state);

    return res.json({
      success: true,
      importedCount,
      totalLeads: state.leads.length,
      leads: newlyAddedLeads
    });
  } catch (error: any) {
    console.error("Error in POST /api/leads/import-places:", error);
    res.status(500).json({ error: error?.message || "Error al importar salas de Google Places." });
  }
});

/**
 * Captación y Descubrimiento Multi-Fuente Omnicanal
 * Integra Ticketmaster Discovery API, Setlist.fm, Eventbrite y Agregadores Locales (Entradium, Compralaentrada, Wegow)
 */
router.post(["/multi-source-venues", "/leads/multi-source-venues"], requireAuth, async (req, res) => {
  try {
    const { query, ciudad, region, tipo, countryCode, limit } = req.body;
    const result = await discoverVenuesMultiSource({
      query,
      ciudad,
      region,
      tipo,
      countryCode: countryCode || "ES",
      limit: Number(limit) || 10
    });
    return res.json(result);
  } catch (error: any) {
    console.error("Error in POST /api/leads/multi-source-venues:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Error al realizar la búsqueda multi-fuente de recintos."
    });
  }
});

/**
 * Radar por Bandas Similares ("Efecto Espejo" / Setlist.fm & Spotify)
 */
router.post(["/similar-artists-venues", "/leads/similar-artists-venues"], requireAuth, async (req, res) => {
  try {
    const { bandName, genre, similarArtists, targetCities, limit } = req.body;
    const userBandId = getTargetBandId(req);
    const state = loadState();
    const bandDna = userBandId ? getBandDnaProfile(state, userBandId) : null;
    const bandConfig = userBandId ? (state?.epkConfigsByBand?.[userBandId] || state?.epkConfig) : state?.epkConfig;

    const resolvedBandName = bandName || bandDna?.bandName || "Banda";
    const resolvedGenre = genre || bandDna?.genero || bandConfig?.genero || "Música en directo";
    const resolvedSimilar = (Array.isArray(similarArtists) && similarArtists.length > 0)
      ? similarArtists
      : (bandConfig?.bandasSimilares && bandConfig.bandasSimilares.length > 0
          ? bandConfig.bandasSimilares
          : bandDna?.artistasReferencia
            ? bandDna.artistasReferencia.split(',').map((s: string) => s.trim()).filter(Boolean)
            : undefined);

    const result = await findVenuesBySimilarArtists({
      bandName: resolvedBandName,
      genre: resolvedGenre,
      similarArtists: resolvedSimilar,
      targetCities,
      limit: Number(limit) || 8
    });
    return res.json(result);
  } catch (error: any) {
    console.error("Error in POST /api/leads/similar-artists-venues:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Error al buscar recintos por afinidad artística."
    });
  }
});

/**
 * Radar de Contratación Pública, Ayuntamientos y Ciclos Culturales
 */
router.post(["/public-cultural-radar", "/leads/public-cultural-radar"], requireAuth, async (req, res) => {
  try {
    const { provinciaOrRegion, estiloMusical, bandName, limit } = req.body;
    const result = await searchPublicCulturalOpportunities({
      provinciaOrRegion,
      estiloMusical,
      bandName,
      limit: Number(limit) || 8
    });
    return res.json(result);
  } catch (error: any) {
    console.error("Error in POST /api/leads/public-cultural-radar:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Error al escanear oportunidades de contratación pública."
    });
  }
});

export default router;
