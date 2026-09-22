import { getSupabase, cleanBandId } from "./core.js";
import { ensureRegisteredBandExists } from "./bands.js";

const BAKANDEYA_DEFAULT_EPK = {
  biografia: "Bakandeya es una propuesta vibrante de mestizaje, ska-rock, reggae y ritmos latinos con sección de metales potente y letras combativas pero festivas. Con más de 40 conciertos a sus espaldas en salas y festivales de la península, Bakandeya ofrece un directo arrollador de 90 minutos concebido para hacer bailar e involucrar a todo el público de principio a fin.",
  logo_url: "/logo_bakandeya_bueno_sin_fondo.png",
  band_photos: ["/logo_bakandeya.jpg"],
  rider_tecnico: "- 1 PA estéreo adecuada para el aforo de la sala/escenario (mín. 2000W)\n- Manguera de 16 canales con 4 envíos de monitores o sistema IEM inalámbrico\n- 3 Micrófonos dinámicos vocal (Shure SM58)\n- Miking completo para sección de metales (2 x SM57 / clip condenser)\n- 2 Cajas de inyección DI para teclados/secuencias\n- Microfonía para batería estándar (Kick, Snare, 2 Toms, Overheads)",
  enlaces_redes: {
    spotify: "https://open.spotify.com/artist/bakandeya",
    youtube: "https://youtube.com/@bakandeya_oficial",
    instagram: "https://instagram.com/bakandeya_oficial",
    tiktok: "https://tiktok.com/@bakandeya_oficial",
    appleMusic: "https://music.apple.com/artist/bakandeya",
    bandcamp: "https://bakandeya.bandcamp.com",
    website: "https://bandmanager.io",
    whatsapp: "+34612345678",
    facebook: "https://facebook.com/bakandeyaoficial",
    twitter: "https://x.com/bakandeya_band"
  },
  contacto_booking: {
    nombre: "Booking & Management",
    email: "",
    telefono: ""
  },
  temas_destacados_ids: ["s-1", "s-2", "s-3"],
  incentivo_fans: {
    mensajeAgradecimiento: "¡Muchas gracias por unirte a nuestra comunidad! Aquí tienes tu regalo exclusivo por apoyarnos en el concierto.",
    enlaceDescarga: "https://bandmanager.io/descargas/tema-inedito-directo.mp3",
    codigoDescuento: "FAN-10"
  },
  donacion_revolut: {
    habilitado: true,
    revolutTag: "",
    revolutUrl: "",
    titulo: "Colabora con una aportación económica",
    descripcion: "Tu aportación directa nos ayuda a financiar furgoneta de gira, grabación de nuevos temas e instrumentos."
  },
  ciudades_config: ["Madrid", "Sevilla", "Barcelona", "Málaga", "Valencia", "Granada", "Cádiz"],
  firma_email: {
    nombreRemitente: "Booking & Management",
    cargo: "Booking & Management",
    telefono: "",
    email: "",
    textoPie: "Música en directo y conciertos",
    incluirIconosRedes: true,
    adjuntarDossierPorDefecto: true,
    redesSociales: {
      spotify: "https://open.spotify.com/artist/bakandeya",
      youtube: "https://youtube.com/@bakandeya_oficial",
      instagram: "https://instagram.com/bakandeya_oficial",
      tiktok: "https://tiktok.com/@bakandeya_oficial",
      appleMusic: "https://music.apple.com/artist/bakandeya",
      bandcamp: "https://bakandeya.bandcamp.com",
      website: "https://bandmanager.io",
      whatsapp: "+34612345678"
    }
  }
};

export async function dbGetEpkConfig(bandId: string) {
  const sb = getSupabase();
  const rawClean = (bandId || '').replace(/^(band|reg)-/, '').toLowerCase();
  const candidateIds = Array.from(new Set([
    bandId,
    `band-${rawClean}`,
    `reg-${rawClean}`,
    rawClean
  ])).filter(Boolean);

  const { data, error } = await sb
    .from("epk_configs")
    .select("*")
    .in("band_id", candidateIds)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Supabase Error (epk_configs): ${error.message}`);
  
  const isBakandeya = rawClean === 'bakandeya';

  if (!data) {
    if (isBakandeya) {
      return {
        band_id: "band-bakandeya",
        biografia: BAKANDEYA_DEFAULT_EPK.biografia,
        logoUrl: BAKANDEYA_DEFAULT_EPK.logo_url,
        dossierPdfUrl: "",
        dossierPdfName: "",
        dossierDocumentUrl: "",
        dossierDocumentName: "",
        dossierTextoExtra: "",
        bandPhotos: BAKANDEYA_DEFAULT_EPK.band_photos,
        riderTecnico: BAKANDEYA_DEFAULT_EPK.rider_tecnico,
        riderPdfUrl: "",
        riderPdfName: "",
        enlacesRedes: BAKANDEYA_DEFAULT_EPK.enlaces_redes,
        contactoBooking: BAKANDEYA_DEFAULT_EPK.contacto_booking,
        temasDestacadosIds: BAKANDEYA_DEFAULT_EPK.temas_destacados_ids,
        incentivoFans: BAKANDEYA_DEFAULT_EPK.incentivo_fans,
        ciudadesConfig: BAKANDEYA_DEFAULT_EPK.ciudades_config,
        firmaEmail: BAKANDEYA_DEFAULT_EPK.firma_email
      };
    }
    return null;
  }

  const rawRedes = data.enlaces_redes || {};
  const mergedRedes = isBakandeya
    ? { ...BAKANDEYA_DEFAULT_EPK.enlaces_redes, ...rawRedes }
    : rawRedes;

  const rawFirma = data.firma_email || {};
  const mergedFirma = isBakandeya
    ? { ...BAKANDEYA_DEFAULT_EPK.firma_email, ...rawFirma }
    : rawFirma;

  let resolvedLogo = data.logo_url;
  if (isBakandeya && (!resolvedLogo || !resolvedLogo.trim())) {
    resolvedLogo = BAKANDEYA_DEFAULT_EPK.logo_url;
  }

  // Si donacion_revolut viene en la tabla (o en enlaces_redes/incentivo), extraerlo
  let resolvedDonacionRevolut = data.donacion_revolut || null;
  if (!resolvedDonacionRevolut && data.enlaces_redes?.revolut) {
    const rawRev = data.enlaces_redes.revolut;
    const revUrl = rawRev.startsWith('http') ? rawRev : `https://revolut.me/${rawRev.replace(/^@/, '').replace(/^revolut\.me\//, '')}`;
    resolvedDonacionRevolut = {
      habilitado: true,
      revolutTag: rawRev.replace(/^https?:\/\//, '').replace(/^revolut\.me\//, '').replace(/^@/, ''),
      revolutUrl: revUrl,
      titulo: 'Colabora con una aportación económica',
      descripcion: ''
    };
  } else if (!resolvedDonacionRevolut && isBakandeya) {
    resolvedDonacionRevolut = BAKANDEYA_DEFAULT_EPK.donacion_revolut;
  }

  return {
    ...data,
    logoUrl: resolvedLogo,
    dossierPdfUrl: data.dossier_pdf_url,
    dossierPdfName: data.dossier_pdf_name,
    dossierDocumentUrl: data.dossier_document_url,
    dossierDocumentName: data.dossier_document_name,
    dossierTextoExtra: data.dossier_texto_extra,
    bandPhotos: data.band_photos || (isBakandeya ? BAKANDEYA_DEFAULT_EPK.band_photos : []),
    miembros: data.miembros || [],
    videos: data.videos || [],
    datosContratacion: data.datos_contratacion || {},
    riderTecnico: data.rider_tecnico || (isBakandeya ? BAKANDEYA_DEFAULT_EPK.rider_tecnico : ""),
    riderPdfUrl: data.rider_pdf_url,
    riderPdfName: data.rider_pdf_name,
    enlacesRedes: mergedRedes,
    contactoBooking: data.contacto_booking || (isBakandeya ? BAKANDEYA_DEFAULT_EPK.contacto_booking : {}),
    temasDestacadosIds: data.temas_destacados_ids || (isBakandeya ? BAKANDEYA_DEFAULT_EPK.temas_destacados_ids : []),
    incentivoFans: data.incentivo_fans || (isBakandeya ? BAKANDEYA_DEFAULT_EPK.incentivo_fans : {}),
    donacionRevolut: resolvedDonacionRevolut,
    ciudadesConfig: data.ciudades_config || (isBakandeya ? BAKANDEYA_DEFAULT_EPK.ciudades_config : []),
    firmaEmail: mergedFirma,
    traducciones: data.traducciones || {},
    audioPreview: data.audio_preview || {},
    cifrasClave: data.cifras_clave || {},
    resenasPrensa: data.resenas_prensa || {},
    plantilla: (data.plantilla as any) || 'stage',
    ordenSecciones: (data.orden_secciones as any) || undefined,
    seccionesOcultas: (data.secciones_ocultas as any) || undefined
  };
}

/**
 * Logo de cada banda, en una sola consulta, para pintar el selector de bandas estilo Netflix.
 *
 * buildAvailableBandsForUser (server/routes/users.ts) resolvía el logo de cada banda NO activa
 * leyendo el caché en memoria state.epkConfigsByBand, que solo se rellena para una banda cuando
 * esa banda ha sido la activa en ESTE proceso (vía /api/state). Recién logueado, o tras un
 * redeploy, o simplemente porque nunca ha tocado esa banda en esta instancia del servidor, el
 * caché estaba vacío y el logo se quedaba fuera aunque existiera en Supabase. Esta consulta trae
 * el logo real de todas las bandas del usuario de una vez, sin depender de ese caché.
 */
export async function dbGetEpkLogosMap(bandIds: string[]): Promise<Record<string, string>> {
  const cleanIds = Array.from(new Set(bandIds.map(id => (id || '').replace(/^(band|reg)-/, '').toLowerCase().trim()).filter(Boolean)));
  if (cleanIds.length === 0) return {};

  const candidateIds = Array.from(new Set(
    cleanIds.flatMap(clean => [clean, `band-${clean}`, `reg-${clean}`])
  ));

  const sb = getSupabase();
  const result: Record<string, string> = {};

  try {
    const { data, error } = await sb.from("epk_configs").select("band_id, logo_url").in("band_id", candidateIds);
    if (error) throw error;
    (data || []).forEach((row: any) => {
      const clean = (row.band_id || '').replace(/^(band|reg)-/, '').toLowerCase().trim();
      if (clean && row.logo_url && row.logo_url.trim() && !result[clean]) {
        result[clean] = row.logo_url.trim();
      }
    });
  } catch (_) {
    // Non-blocking: si falla, el llamador se queda con el resto de fallbacks que ya tenía.
  }

  // Rellena huecos con registered_bands.logo_url para bandas sin fila propia en epk_configs.
  const missing = cleanIds.filter(clean => !result[clean]);
  if (missing.length > 0) {
    try {
      const { data, error } = await sb.from("registered_bands").select("band_id, id, logo_url, imagen_url").or(
        candidateIds.map(id => `band_id.eq.${id}`).join(",") + "," + candidateIds.map(id => `id.eq.${id}`).join(",")
      );
      if (error) throw error;
      (data || []).forEach((row: any) => {
        const cleanBid = (row.band_id || '').replace(/^(band|reg)-/, '').toLowerCase().trim();
        const cleanId = (row.id || '').replace(/^(band|reg)-/, '').toLowerCase().trim();
        const logo = (row.logo_url && row.logo_url.trim()) || (row.imagen_url && row.imagen_url.trim()) || '';
        if (!logo) return;
        [cleanBid, cleanId].forEach(clean => {
          if (clean && !result[clean]) result[clean] = logo;
        });
      });
    } catch (_) {
      // Non-blocking
    }
  }

  return result;
}

export async function dbUpsertEpkConfig(bandId: string, config: any) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(bandId);
  const rawClean = targetBandId.replace(/^(band|reg)-/, '').toLowerCase();
  const isBakandeya = rawClean === 'bakandeya';

  await ensureRegisteredBandExists(targetBandId);

  // Fetch current config to merge partial updates safely without erasing existing fields
  let existing: any = null;
  try {
    existing = await dbGetEpkConfig(targetBandId);
  } catch (err) {
    // Non-blocking
  }

  const existingRedes = existing?.enlacesRedes || (isBakandeya ? BAKANDEYA_DEFAULT_EPK.enlaces_redes : {});
  const providedRedes = config.enlacesRedes || config.enlaces_redes || {};
  const mergedRedes = { ...existingRedes, ...providedRedes };

  const existingContacto = existing?.contactoBooking || (isBakandeya ? BAKANDEYA_DEFAULT_EPK.contacto_booking : {});
  const providedContacto = config.contactoBooking || config.contacto_booking || {};
  const mergedContacto = { ...existingContacto, ...providedContacto };

  const existingFirma = existing?.firmaEmail || (isBakandeya ? BAKANDEYA_DEFAULT_EPK.firma_email : {});
  const providedFirma = config.firmaEmail || config.firma_email || {};
  const mergedFirma = { ...existingFirma, ...providedFirma };

  const existingIncentivo = existing?.incentivoFans || (isBakandeya ? BAKANDEYA_DEFAULT_EPK.incentivo_fans : {});
  const providedIncentivo = config.incentivoFans || config.incentivo_fans || {};
  const mergedIncentivo = { ...existingIncentivo, ...providedIncentivo };

  const existingRevolut = existing?.donacionRevolut || (isBakandeya ? BAKANDEYA_DEFAULT_EPK.donacion_revolut : {});
  const providedRevolut = config.donacionRevolut || config.donacion_revolut || {};
  const mergedRevolut = { ...existingRevolut, ...providedRevolut };

  // Las traducciones se mezclan POR IDIOMA: guardar la versión inglesa no puede borrar de un
  // plumazo la francesa el día que existan. Dentro de cada idioma sí se reemplaza entero, que
  // es lo que manda el gestor del EPK cuando la banda guarda su repaso.
  const existingTraducciones = existing?.traducciones || {};
  const providedTraducciones = config.traducciones || {};
  const mergedTraducciones = { ...existingTraducciones, ...providedTraducciones };

  // Miembros se mezcla POR MIEMBRO (id), no se reemplaza el array entero: antes, si quien
  // llamaba a este endpoint mandaba un miembro sin `foto`/`bio` (un formulario que solo
  // gestiona nombre/rol/instagram, por ejemplo), esos campos desaparecían en silencio aunque
  // ya existieran — pasó de verdad con los 4 integrantes de Bakandeya, foto y bio borrados
  // sin que nadie los tocara. Quién SIGUE en la lista lo decide `config.miembros` (si alguien
  // se quita del formulario, desaparece); lo que se preserva es lo que el objeto nuevo no
  // incluye para un id que ya existía.
  const existingMiembros: any[] = Array.isArray(existing?.miembros) ? existing.miembros : [];
  const mergedMiembros = Array.isArray(config.miembros)
    ? config.miembros.map((m: any) => {
        const prev = m?.id ? existingMiembros.find((e: any) => e?.id === m.id) : null;
        return prev ? { ...prev, ...m } : m;
      })
    : existingMiembros;

  const newLogoUrl = (config.logoUrl !== undefined ? config.logoUrl : (config.logo_url !== undefined ? config.logo_url : existing?.logoUrl)) || (isBakandeya ? BAKANDEYA_DEFAULT_EPK.logo_url : "");

  const payload = {
    band_id: targetBandId,
    biografia: (config.biografia !== undefined ? config.biografia : existing?.biografia) || (isBakandeya ? BAKANDEYA_DEFAULT_EPK.biografia : ""),
    logo_url: newLogoUrl,
    dossier_pdf_url: (config.dossierPdfUrl !== undefined ? config.dossierPdfUrl : (config.dossier_pdf_url !== undefined ? config.dossier_pdf_url : existing?.dossierPdfUrl)) || "",
    dossier_pdf_name: (config.dossierPdfName !== undefined ? config.dossierPdfName : (config.dossier_pdf_name !== undefined ? config.dossier_pdf_name : existing?.dossierPdfName)) || "",
    dossier_document_url: (config.dossierDocumentUrl !== undefined ? config.dossierDocumentUrl : (config.dossier_document_url !== undefined ? config.dossier_document_url : existing?.dossierDocumentUrl)) || "",
    dossier_document_name: (config.dossierDocumentName !== undefined ? config.dossierDocumentName : (config.dossier_document_name !== undefined ? config.dossier_document_name : existing?.dossierDocumentName)) || "",
    dossier_texto_extra: (config.dossierTextoExtra !== undefined ? config.dossierTextoExtra : (config.dossier_texto_extra !== undefined ? config.dossier_texto_extra : existing?.dossierTextoExtra)) || "",
    band_photos: (config.bandPhotos !== undefined ? config.bandPhotos : (config.band_photos !== undefined ? config.band_photos : existing?.bandPhotos)) || (isBakandeya ? BAKANDEYA_DEFAULT_EPK.band_photos : []),
    miembros: mergedMiembros,
    videos: (config.videos !== undefined ? config.videos : existing?.videos) || [],
    datos_contratacion: (config.datosContratacion !== undefined ? config.datosContratacion : (config.datos_contratacion !== undefined ? config.datos_contratacion : existing?.datosContratacion)) || {},
    rider_tecnico: (config.riderTecnico !== undefined ? config.riderTecnico : (config.rider_tecnico !== undefined ? config.rider_tecnico : existing?.riderTecnico)) || (isBakandeya ? BAKANDEYA_DEFAULT_EPK.rider_tecnico : ""),
    rider_pdf_url: (config.riderPdfUrl !== undefined ? config.riderPdfUrl : (config.rider_pdf_url !== undefined ? config.rider_pdf_url : existing?.riderPdfUrl)) || "",
    rider_pdf_name: (config.riderPdfName !== undefined ? config.riderPdfName : (config.rider_pdf_name !== undefined ? config.rider_pdf_name : existing?.riderPdfName)) || "",
    enlaces_redes: mergedRedes,
    contacto_booking: mergedContacto,
    temas_destacados_ids: (config.temasDestacadosIds !== undefined ? config.temasDestacadosIds : (config.temas_destacados_ids !== undefined ? config.temas_destacados_ids : existing?.temasDestacadosIds)) || (isBakandeya ? BAKANDEYA_DEFAULT_EPK.temas_destacados_ids : []),
    incentivo_fans: mergedIncentivo,
    donacion_revolut: mergedRevolut,
    ciudades_config: (config.ciudadesConfig !== undefined ? config.ciudadesConfig : (config.ciudades_config !== undefined ? config.ciudades_config : existing?.ciudadesConfig)) || (isBakandeya ? BAKANDEYA_DEFAULT_EPK.ciudades_config : []),
    firma_email: mergedFirma,
    traducciones: mergedTraducciones,
    audio_preview: (config.audioPreview !== undefined ? config.audioPreview : (config.audio_preview !== undefined ? config.audio_preview : existing?.audioPreview)) || {},
    cifras_clave: (config.cifrasClave !== undefined ? config.cifrasClave : (config.cifras_clave !== undefined ? config.cifras_clave : existing?.cifrasClave)) || {},
    resenas_prensa: (config.resenasPrensa !== undefined ? config.resenasPrensa : (config.resenas_prensa !== undefined ? config.resenas_prensa : existing?.resenasPrensa)) || {},
    plantilla: (config.plantilla !== undefined ? config.plantilla : existing?.plantilla) || 'stage',
    orden_secciones: (config.ordenSecciones !== undefined ? config.ordenSecciones : (config.orden_secciones !== undefined ? config.orden_secciones : existing?.ordenSecciones)) || null,
    secciones_ocultas: (config.seccionesOcultas !== undefined ? config.seccionesOcultas : (config.secciones_ocultas !== undefined ? config.secciones_ocultas : existing?.seccionesOcultas)) || null
  };

  let data: any = null;
  let error: any = null;

  const currentPayload: Record<string, any> = { ...payload };
  const res = await sb.from("epk_configs").upsert(currentPayload).select().single();
  data = res.data;
  error = res.error;

  // Si la base de datos de Supabase aún no tiene alguna columna nueva (p. ej. 'donacion_revolut', 'traducciones' o 'miembros'),
  // reintentamos quitando las columnas no existentes en bucle para evitar que falle el guardado general.
  while (error && error.message && error.message.includes("Could not find the '") && error.message.includes("' column of 'epk_configs'")) {
    const match = error.message.match(/Could not find the '([^']+)'column of 'epk_configs'/);
    if (match && match[1] && currentPayload[match[1]] !== undefined) {
      const missingCol = match[1];
      console.warn(`[EPK] Columna '${missingCol}' no encontrada en Supabase epk_configs. Reintentando sin ella. Ejecuta la migración SQL.`);
      delete currentPayload[missingCol];
      const retryRes = await sb.from("epk_configs").upsert(currentPayload).select().single();
      data = retryRes.data;
      error = retryRes.error;
    } else {
      break;
    }
  }

  if (error) throw new Error(`Supabase Error (upsert epk_configs): ${error.message}`);

  // Also sync logo & band name into registered_bands table
  const regUpdates: Record<string, any> = {};
  if (newLogoUrl && newLogoUrl.trim()) {
    regUpdates.logo_url = newLogoUrl.trim();
  }
  const providedName = (config.bandName || config.nombre_banda || config.localBandName || config.contactoBooking?.nombre || "").trim();
  if (providedName && providedName.toLowerCase() !== "banda" && !providedName.toLowerCase().includes("bakandeya")) {
    regUpdates.nombre_banda = providedName;
  }
  if (Object.keys(regUpdates).length > 0) {
    try {
      await sb.from("registered_bands").update(regUpdates).eq("band_id", targetBandId);
    } catch (regErr) {
      // Non-blocking
    }
  }

  return data;
}

// --- AUTONOMY CONFIGS ---
