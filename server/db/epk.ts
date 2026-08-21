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
    website: "https://bands-manager.up.railway.app",
    whatsapp: "+34612345678",
    facebook: "https://facebook.com/bakandeyaoficial",
    twitter: "https://x.com/bakandeya_band"
  },
  contacto_booking: {
    nombre: "Booking & Management Bakandeya",
    email: "diego.delacalleb@gmail.com",
    telefono: "+34 612 345 678"
  },
  temas_destacados_ids: ["s-1", "s-2", "s-3"],
  incentivo_fans: {
    mensajeAgradecimiento: "¡Muchas gracias por unirte a la familia de Bakandeya! Aquí tienes tu regalo exclusivo por apoyarnos en el concierto.",
    enlaceDescarga: "https://bands-manager.up.railway.app/descargas/tema-inedito-directo.mp3",
    codigoDescuento: "BAKANDEYA-FAN-10"
  },
  ciudades_config: ["Madrid", "Sevilla", "Barcelona", "Málaga", "Valencia", "Granada", "Cádiz"],
  firma_email: {
    nombreRemitente: "Diego de la Calle",
    cargo: "Booking & Management | Bakandeya",
    telefono: "+34 612 345 678",
    email: "diego.delacalleb@gmail.com",
    textoPie: "Bakandeya — Música en directo, mestizaje y ska-rock",
    incluirIconosRedes: true,
    adjuntarDossierPorDefecto: true,
    redesSociales: {
      spotify: "https://open.spotify.com/artist/bakandeya",
      youtube: "https://youtube.com/@bakandeya_oficial",
      instagram: "https://instagram.com/bakandeya_oficial",
      tiktok: "https://tiktok.com/@bakandeya_oficial",
      appleMusic: "https://music.apple.com/artist/bakandeya",
      bandcamp: "https://bakandeya.bandcamp.com",
      website: "https://bands-manager.up.railway.app",
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
    ciudadesConfig: data.ciudades_config || (isBakandeya ? BAKANDEYA_DEFAULT_EPK.ciudades_config : []),
    firmaEmail: mergedFirma
  };
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
    miembros: (config.miembros !== undefined ? config.miembros : existing?.miembros) || [],
    videos: (config.videos !== undefined ? config.videos : existing?.videos) || [],
    datos_contratacion: (config.datosContratacion !== undefined ? config.datosContratacion : (config.datos_contratacion !== undefined ? config.datos_contratacion : existing?.datosContratacion)) || {},
    rider_tecnico: (config.riderTecnico !== undefined ? config.riderTecnico : (config.rider_tecnico !== undefined ? config.rider_tecnico : existing?.riderTecnico)) || (isBakandeya ? BAKANDEYA_DEFAULT_EPK.rider_tecnico : ""),
    rider_pdf_url: (config.riderPdfUrl !== undefined ? config.riderPdfUrl : (config.rider_pdf_url !== undefined ? config.rider_pdf_url : existing?.riderPdfUrl)) || "",
    rider_pdf_name: (config.riderPdfName !== undefined ? config.riderPdfName : (config.rider_pdf_name !== undefined ? config.rider_pdf_name : existing?.riderPdfName)) || "",
    enlaces_redes: mergedRedes,
    contacto_booking: mergedContacto,
    temas_destacados_ids: (config.temasDestacadosIds !== undefined ? config.temasDestacadosIds : (config.temas_destacados_ids !== undefined ? config.temas_destacados_ids : existing?.temasDestacadosIds)) || (isBakandeya ? BAKANDEYA_DEFAULT_EPK.temas_destacados_ids : []),
    incentivo_fans: mergedIncentivo,
    ciudades_config: (config.ciudadesConfig !== undefined ? config.ciudadesConfig : (config.ciudades_config !== undefined ? config.ciudades_config : existing?.ciudadesConfig)) || (isBakandeya ? BAKANDEYA_DEFAULT_EPK.ciudades_config : []),
    firma_email: mergedFirma
  };

  const { data, error } = await sb.from("epk_configs").upsert(payload).select().single();
  if (error) throw new Error(`Supabase Error (upsert epk_configs): ${error.message}`);

  // Also sync logo into registered_bands table
  if (newLogoUrl && newLogoUrl.trim()) {
    try {
      await sb.from("registered_bands").update({ logo_url: newLogoUrl }).eq("band_id", targetBandId);
    } catch (regErr) {
      // Non-blocking
    }
  }

  return data;
}

// --- AUTONOMY CONFIGS ---
