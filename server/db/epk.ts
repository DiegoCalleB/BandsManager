import { getSupabase, cleanBandId } from "./core.js";

export async function dbGetEpkConfig(bandId: string) {
  const sb = getSupabase();
  const rawClean = (bandId || '').replace(/^(band|reg)-/, '');
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
  if (!data) return null;
  return {
    ...data,
    logoUrl: data.logo_url,
    dossierPdfUrl: data.dossier_pdf_url,
    dossierPdfName: data.dossier_pdf_name,
    dossierDocumentUrl: data.dossier_document_url,
    dossierDocumentName: data.dossier_document_name,
    dossierTextoExtra: data.dossier_texto_extra,
    bandPhotos: data.band_photos || [],
    riderTecnico: data.rider_tecnico,
    riderPdfUrl: data.rider_pdf_url,
    riderPdfName: data.rider_pdf_name,
    enlacesRedes: data.enlaces_redes || {},
    contactoBooking: data.contacto_booking || {},
    temasDestacadosIds: data.temas_destacados_ids || [],
    incentivoFans: data.incentivo_fans || {},
    ciudadesConfig: data.ciudades_config || [],
    firmaEmail: data.firma_email || {}
  };
}

export async function dbUpsertEpkConfig(bandId: string, config: any) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(bandId);
  await ensureRegisteredBandExists(targetBandId);

  const payload = {
    band_id: targetBandId,
    biografia: config.biografia || "",
    logo_url: config.logoUrl || config.logo_url || "",
    dossier_pdf_url: config.dossierPdfUrl || config.dossier_pdf_url || "",
    dossier_pdf_name: config.dossierPdfName || config.dossier_pdf_name || "",
    dossier_document_url: config.dossierDocumentUrl || config.dossier_document_url || "",
    dossier_document_name: config.dossierDocumentName || config.dossier_document_name || "",
    dossier_texto_extra: config.dossierTextoExtra || config.dossier_texto_extra || "",
    band_photos: config.bandPhotos || config.band_photos || [],
    rider_tecnico: config.riderTecnico || config.rider_tecnico || "",
    rider_pdf_url: config.riderPdfUrl || config.rider_pdf_url || "",
    rider_pdf_name: config.riderPdfName || config.rider_pdf_name || "",
    enlaces_redes: config.enlacesRedes || config.enlaces_redes || {},
    contacto_booking: config.contactoBooking || config.contacto_booking || {},
    temas_destacados_ids: config.temasDestacadosIds || config.temas_destacados_ids || [],
    incentivo_fans: config.incentivoFans || config.incentivo_fans || {},
    ciudades_config: config.ciudadesConfig || config.ciudades_config || [],
    firma_email: config.firmaEmail || config.firma_email || {}
  };

  const { data, error } = await sb.from("epk_configs").upsert(payload).select().single();
  if (error) throw new Error(`Supabase Error (upsert epk_configs): ${error.message}`);
  return data;
}

// --- AUTONOMY CONFIGS ---
