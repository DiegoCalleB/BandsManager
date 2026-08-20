import express from "express";
import { Lead } from "../../../src/types.js";
import { loadState, saveState, requireAuth } from "../../state.js";
import { dbUpsertLead, dbCheckDeletedLead } from "../../db.js";
import { getAiClient, generateContentWithFallback } from "../../ai.js";
import { safeParseJson } from "../../utils.js";
import { getDomainFromUrl } from "./helpers.js";

const router = express.Router();

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
    const searchQuery = query || `${typePrefix} en ${ciudad}${region ? `, ${region}` : ''}, España`;
    const placesApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.VITE_GOOGLE_PLACES_API_KEY || "";

    // Google Places API is great for physical places (venues, clubs, theaters, city halls).
    // For musical bands/groups, record labels, and agencies, we skip Places API and use Gemini Grounding directly.
    if (!isWebEntitySearch && placesApiKey && placesApiKey.trim() !== "") {
      try {
        let placesQuery = searchQuery;
        if (isAyuntamientoSearch) {
          placesQuery = `Ayuntamiento de ${ciudad || 'Madrid'}, España`;
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
        console.warn("[Google Places API Warning] Failed to fetch from Places API, falling back to Gemini Search Grounding:", placesErr.message);
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
    } catch (err) {
      response = await generateContentWithFallback(aiClient, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' }
      });
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
        } catch (err) {
          console.warn("[Email Extractor Warning] Grounding failed, fallback to direct JSON model:", err);
          response = await generateContentWithFallback(aiClient, {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: 'application/json' }
          });
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
        if (!existing.telefono && rawLead.telefono) {
          existing.telefono = rawLead.telefono;
          updated = true;
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

        const newLead: Lead = {
          id: `places-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          band_id: userBandId,
          nombre_sala: rawLead.nombre_sala,
          ciudad: rawLead.ciudad || "España",
          region: rawLead.region || "España",
          direccion: rawLead.direccion || "",
          aforo: rawLead.aforo || 300,
          genero: rawLead.genero || "Música en Directo / Mestizaje",
          tipo: resolvedType as any,
          email_contacto: rawLead.email_contacto || "",
          telefono: rawLead.telefono || "",
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

// Import Leads from Custom Excel / CSV with Intelligent Mapping & Classification

export default router;
