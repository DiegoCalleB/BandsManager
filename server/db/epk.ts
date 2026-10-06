// Configuración del EPK de la banda (`epk_configs`) y mapa de logos.

import { escrituraTolerante } from './tolerantWrite.js';
import { getSupabase, cleanBandId } from './core.js';
import { ensureRegisteredBandExists } from './bands.js';
import { invalidateBandStateCache } from './sync.js';

export async function dbGetEpkConfig(bandId: string) {
  const sb = getSupabase();
  const rawClean = (bandId || '').replace(/^(band|reg)-/, '').toLowerCase();
  const candidateIds = Array.from(
    new Set([bandId, `band-${rawClean}`, `reg-${rawClean}`, rawClean])
  ).filter(Boolean);

  const { data, error } = await sb
    .from('epk_configs')
    .select('*')
    .in('band_id', candidateIds)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Supabase Error (epk_configs): ${error.message}`);

  if (!data) {
    return null;
  }

  const rawRedes = data.enlaces_redes || {};
  const mergedRedes = rawRedes;

  const rawFirma = data.firma_email || {};
  const mergedFirma = rawFirma;

  const resolvedLogo = data.logo_url || '';

  // Si donacion_revolut viene en la tabla (o en enlaces_redes/incentivo), extraerlo
  let resolvedDonacionRevolut = data.donacion_revolut || null;
  if (!resolvedDonacionRevolut && data.enlaces_redes?.revolut) {
    const rawRev = data.enlaces_redes.revolut;
    const revUrl = rawRev.startsWith('http')
      ? rawRev
      : `https://revolut.me/${rawRev.replace(/^@/, '').replace(/^revolut\.me\//, '')}`;
    resolvedDonacionRevolut = {
      habilitado: true,
      revolutTag: rawRev
        .replace(/^https?:\/\//, '')
        .replace(/^revolut\.me\//, '')
        .replace(/^@/, ''),
      revolutUrl: revUrl,
      titulo: 'Colabora con una aportación económica',
      descripcion: '',
    };
  }

  return {
    ...data,
    logoUrl: resolvedLogo,
    dossierPdfUrl: data.dossier_pdf_url,
    dossierPdfName: data.dossier_pdf_name,
    dossierDocumentUrl: data.dossier_document_url,
    dossierDocumentName: data.dossier_document_name,
    dossierTextoExtra: data.dossier_texto_extra,
    bandPhotos: (Array.isArray(data.band_photos) ? data.band_photos : [])
      .map((p: any) => (typeof p === 'string' ? p : p?.url || ''))
      .filter((u: any) => typeof u === 'string' && u.trim() !== ''),
    miembros: (Array.isArray(data.miembros) ? data.miembros : []).map((m: any) => {
      const foto = m?.fotoUrl || m?.foto_url || '';
      return {
        ...m,
        id: m?.id || `m-${Math.random().toString(36).slice(2, 7)}`,
        nombre: m?.nombre || '',
        rol: m?.rol || '',
        fotoUrl: foto,
        foto_url: foto,
        bio: m?.bio || '',
        instagram: m?.instagram || '',
      };
    }),
    videos: data.videos || [],
    datosContratacion: data.datos_contratacion || {},
    riderTecnico: data.rider_tecnico || '',
    riderPdfUrl: data.rider_pdf_url,
    riderPdfName: data.rider_pdf_name,
    enlacesRedes: mergedRedes,
    contactoBooking: data.contacto_booking || {},
    temasDestacadosIds: data.temas_destacados_ids || [],
    incentivoFans: data.incentivo_fans || {},
    donacionRevolut: resolvedDonacionRevolut,
    ciudadesConfig: data.ciudades_config || [],
    firmaEmail: mergedFirma,
    traducciones: data.traducciones || {},
    audioPreview: data.audio_preview || {},
    cifrasClave: data.cifras_clave || {},
    resenasPrensa: data.resenas_prensa || {},
    genero: data.genero || '',
    fraseImpacto: data.frase_impacto || '',
    bandasSimilares: Array.isArray(data.bandas_similares) ? data.bandas_similares : [],
    mostrarBandasSimilares: !!data.mostrar_bandas_similares,
    riderConfig: data.rider_config || {},
    idioma: data.idioma || undefined,
    fontStyle: data.font_style || undefined,
    tipografia: data.tipografia || undefined,
    plantilla: (data.plantilla as any) || 'stage',
    ordenSecciones: (data.orden_secciones as any) || undefined,
    seccionesOcultas: (data.secciones_ocultas as any) || undefined,
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
export async function dbGetEpkLogosMap(
  bandIds: string[]
): Promise<Record<string, string>> {
  const cleanIds = Array.from(
    new Set(
      bandIds
        .map((id) =>
          (id || '')
            .replace(/^(band|reg)-/, '')
            .toLowerCase()
            .trim()
        )
        .filter(Boolean)
    )
  );
  if (cleanIds.length === 0) return {};

  const candidateIds = Array.from(
    new Set(
      cleanIds.flatMap((clean) => [clean, `band-${clean}`, `reg-${clean}`])
    )
  );

  const sb = getSupabase();
  const result: Record<string, string> = {};

  try {
    const { data, error } = await sb
      .from('epk_configs')
      .select('band_id, logo_url')
      .in('band_id', candidateIds);
    if (error) throw error;
    (data || []).forEach((row: any) => {
      const clean = (row.band_id || '')
        .replace(/^(band|reg)-/, '')
        .toLowerCase()
        .trim();
      if (clean && row.logo_url && row.logo_url.trim() && !result[clean]) {
        result[clean] = row.logo_url.trim();
      }
    });
  } catch (_) {
    // Non-blocking: si falla, el llamador se queda con el resto de fallbacks que ya tenía.
  }

  // Rellena huecos con registered_bands.logo_url para bandas sin fila propia en epk_configs.
  const missing = cleanIds.filter((clean) => !result[clean]);
  if (missing.length > 0) {
    try {
      const { data, error } = await sb
        .from('registered_bands')
        .select('band_id, id, logo_url, imagen_url')
        .or(
          candidateIds.map((id) => `band_id.eq.${id}`).join(',') +
            ',' +
            candidateIds.map((id) => `id.eq.${id}`).join(',')
        );
      if (error) throw error;
      (data || []).forEach((row: any) => {
        const cleanBid = (row.band_id || '')
          .replace(/^(band|reg)-/, '')
          .toLowerCase()
          .trim();
        const cleanId = (row.id || '')
          .replace(/^(band|reg)-/, '')
          .toLowerCase()
          .trim();
        const logo =
          (row.logo_url && row.logo_url.trim()) ||
          (row.imagen_url && row.imagen_url.trim()) ||
          '';
        if (!logo) return;
        [cleanBid, cleanId].forEach((clean) => {
          if (clean && !result[clean]) result[clean] = logo;
        });
      });
    } catch (_) {
      // Non-blocking
    }
  }

  return result;
}

export async function dbUpsertEpkConfig(targetBandId: string, config: any) {
  const sb = getSupabase();

  const canonicalBandId =
    (await ensureRegisteredBandExists(targetBandId)) || targetBandId;
  const bandIdToUse = canonicalBandId;

  // Fetch current config to merge partial updates safely without erasing existing fields
  let existing: any = null;
  try {
    existing = await dbGetEpkConfig(bandIdToUse);
  } catch (err) {
    // Non-blocking
  }

  const existingRedes = existing?.enlacesRedes || {};
  const providedRedes = config.enlacesRedes || config.enlaces_redes || {};
  const mergedRedes = { ...existingRedes, ...providedRedes };

  const existingContacto = existing?.contactoBooking || {};
  const providedContacto =
    config.contactoBooking || config.contacto_booking || {};
  const mergedContacto = { ...existingContacto, ...providedContacto };

  const existingFirma = existing?.firmaEmail || {};
  const providedFirma = config.firmaEmail || config.firma_email || {};
  const mergedFirma = { ...existingFirma, ...providedFirma };

  const existingIncentivo = existing?.incentivoFans || {};
  const providedIncentivo = config.incentivoFans || config.incentivo_fans || {};
  const mergedIncentivo = { ...existingIncentivo, ...providedIncentivo };

  const existingRevolut = existing?.donacionRevolut || {};
  const providedRevolut =
    config.donacionRevolut || config.donacion_revolut || {};
  const mergedRevolut = { ...existingRevolut, ...providedRevolut };

  // Mismo motivo que enlacesRedes/contactoBooking arriba, y no solo el fallback-si-undefined que
  // tenían antes: el wizard de onboarding SÍ manda cifrasClave/resenasPrensa (aunque sea un
  // objeto vacío, no hace spread de lo existente como sí hace con datosContratacion), así que
  // caían al valor entrante entero en vez de a `existing` — completar el onboarding podía
  // borrar sub-claves que el editor completo del EPK sí conocía.
  const existingCifras = existing?.cifrasClave || {};
  const providedCifras = config.cifrasClave || config.cifras_clave || {};
  const mergedCifras = { ...existingCifras, ...providedCifras };

  const existingResenas = existing?.resenasPrensa || {};
  const providedResenas = config.resenasPrensa || config.resenas_prensa || {};
  const mergedResenas = { ...existingResenas, ...providedResenas };

  // Las traducciones se mezclan POR IDIOMA: guardar la versión inglesa no puede borrar de un
  // plumazo la francesa el día que existan. Dentro de cada idioma sí se reemplaza entero, que
  // es lo que manda el gestor del EPK cuando la banda guarda su repaso.
  const existingTraducciones = existing?.traducciones || {};
  const providedTraducciones = config.traducciones || {};
  const mergedTraducciones = {
    ...existingTraducciones,
    ...providedTraducciones,
  };

  // Miembros se mezcla POR MIEMBRO (id), no se reemplaza el array entero: antes, si quien
  // llamaba a este endpoint mandaba un miembro sin `foto`/`bio` (un formulario que solo
  // gestiona nombre/rol/instagram, por ejemplo), esos campos desaparecían en silencio aunque
  // ya existieran — pasó de verdad con los 4 integrantes de Bakandeya, foto y bio borrados
  // sin que nadie los tocara. Quién SIGUE en la lista lo decide `config.miembros` (si alguien
  // se quita del formulario, desaparece); lo que se preserva es lo que el objeto nuevo no
  // incluye para un id que ya existía.
  const existingMiembros: any[] = Array.isArray(existing?.miembros)
    ? existing.miembros
    : [];
  const mergedMiembros = Array.isArray(config.miembros)
    ? config.miembros.map((m: any) => {
        const prev = m?.id
          ? existingMiembros.find((e: any) => e?.id === m.id)
          : null;
        const foto =
          m?.fotoUrl !== undefined
            ? m.fotoUrl
            : m?.foto_url !== undefined
              ? m.foto_url
              : (prev?.fotoUrl || prev?.foto_url || '');
        const normalizedM: any = {
          ...(prev || {}),
          ...m,
          id: m?.id || prev?.id || `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          nombre: m?.nombre !== undefined ? m.nombre : (prev?.nombre || ''),
          rol: m?.rol !== undefined ? m.rol : (prev?.rol || ''),
          fotoUrl: foto,
          foto_url: foto,
          bio: m?.bio !== undefined ? m.bio : (prev?.bio || ''),
          instagram: m?.instagram !== undefined ? m.instagram : (prev?.instagram || ''),
        };
        return normalizedM;
      })
    : existingMiembros;

  const newLogoUrl =
    (config.logoUrl !== undefined
      ? config.logoUrl
      : config.logo_url !== undefined
        ? config.logo_url
        : existing?.logoUrl) || '';

  const payload = {
    band_id: bandIdToUse,
    biografia:
      (config.biografia !== undefined
        ? config.biografia
        : existing?.biografia) || '',
    logo_url: newLogoUrl,
    dossier_pdf_url:
      (config.dossierPdfUrl !== undefined
        ? config.dossierPdfUrl
        : config.dossier_pdf_url !== undefined
          ? config.dossier_pdf_url
          : existing?.dossierPdfUrl) || '',
    dossier_pdf_name:
      (config.dossierPdfName !== undefined
        ? config.dossierPdfName
        : config.dossier_pdf_name !== undefined
          ? config.dossier_pdf_name
          : existing?.dossierPdfName) || '',
    dossier_document_url:
      (config.dossierDocumentUrl !== undefined
        ? config.dossierDocumentUrl
        : config.dossier_document_url !== undefined
          ? config.dossier_document_url
          : existing?.dossierDocumentUrl) || '',
    dossier_document_name:
      (config.dossierDocumentName !== undefined
        ? config.dossierDocumentName
        : config.dossier_document_name !== undefined
          ? config.dossier_document_name
          : existing?.dossierDocumentName) || '',
    dossier_texto_extra:
      (config.dossierTextoExtra !== undefined
        ? config.dossierTextoExtra
        : config.dossier_texto_extra !== undefined
          ? config.dossier_texto_extra
          : existing?.dossierTextoExtra) || '',
    band_photos: (
      (config.bandPhotos !== undefined
        ? config.bandPhotos
        : config.band_photos !== undefined
          ? config.band_photos
          : existing?.bandPhotos) || []
    )
      .map((p: any) => (typeof p === 'string' ? p : p?.url || ''))
      .filter((u: any) => typeof u === 'string' && u.trim() !== ''),
    miembros: mergedMiembros,
    videos:
      (config.videos !== undefined ? config.videos : existing?.videos) || [],
    datos_contratacion:
      (config.datosContratacion !== undefined
        ? config.datosContratacion
        : config.datos_contratacion !== undefined
          ? config.datos_contratacion
          : existing?.datosContratacion) || {},
    rider_tecnico:
      (config.riderTecnico !== undefined
        ? config.riderTecnico
        : config.rider_tecnico !== undefined
          ? config.rider_tecnico
          : existing?.riderTecnico) || '',
    rider_pdf_url:
      (config.riderPdfUrl !== undefined
        ? config.riderPdfUrl
        : config.rider_pdf_url !== undefined
          ? config.rider_pdf_url
          : existing?.riderPdfUrl) || '',
    rider_pdf_name:
      (config.riderPdfName !== undefined
        ? config.riderPdfName
        : config.rider_pdf_name !== undefined
          ? config.rider_pdf_name
          : existing?.riderPdfName) || '',
    enlaces_redes: mergedRedes,
    contacto_booking: mergedContacto,
    temas_destacados_ids:
      (config.temasDestacadosIds !== undefined
        ? config.temasDestacadosIds
        : config.temas_destacados_ids !== undefined
          ? config.temas_destacados_ids
          : existing?.temasDestacadosIds) || [],
    incentivo_fans: mergedIncentivo,
    donacion_revolut: mergedRevolut,
    ciudades_config:
      (config.ciudadesConfig !== undefined
        ? config.ciudadesConfig
        : config.ciudades_config !== undefined
          ? config.ciudades_config
          : existing?.ciudadesConfig) || [],
    firma_email: mergedFirma,
    traducciones: mergedTraducciones,
    audio_preview:
      (config.audioPreview !== undefined
        ? config.audioPreview
        : config.audio_preview !== undefined
          ? config.audio_preview
          : existing?.audioPreview) || {},
    cifras_clave: mergedCifras,
    resenas_prensa: mergedResenas,
    // Campos que el editor del EPK permite cambiar pero que antes no tenían columna ni se
    // escribían aquí: se editaban en pantalla y se perdían en el siguiente refresco. Con
    // `!== undefined` un borrado intencional ('' o []) también se respeta.
    genero: config.genero !== undefined ? config.genero : (existing?.genero ?? ''),
    frase_impacto:
      config.fraseImpacto !== undefined ? config.fraseImpacto : (existing?.fraseImpacto ?? ''),
    bandas_similares:
      config.bandasSimilares !== undefined
        ? config.bandasSimilares
        : (existing?.bandasSimilares ?? []),
    mostrar_bandas_similares:
      config.mostrarBandasSimilares !== undefined
        ? !!config.mostrarBandasSimilares
        : !!existing?.mostrarBandasSimilares,
    rider_config:
      config.riderConfig !== undefined ? config.riderConfig : (existing?.riderConfig ?? {}),
    idioma: config.idioma !== undefined ? config.idioma : (existing?.idioma ?? null),
    font_style: config.fontStyle !== undefined ? config.fontStyle : (existing?.fontStyle ?? null),
    tipografia: config.tipografia !== undefined ? config.tipografia : (existing?.tipografia ?? null),
    plantilla:
      (config.plantilla !== undefined
        ? config.plantilla
        : existing?.plantilla) || 'stage',
    orden_secciones:
      (config.ordenSecciones !== undefined
        ? config.ordenSecciones
        : config.orden_secciones !== undefined
          ? config.orden_secciones
          : existing?.ordenSecciones) || null,
    secciones_ocultas:
      (config.seccionesOcultas !== undefined
        ? config.seccionesOcultas
        : config.secciones_ocultas !== undefined
          ? config.secciones_ocultas
          : existing?.seccionesOcultas) || null,
  };

  let data: any = null;
  let error: any = null;

  const currentPayload: Record<string, any> = { ...payload };
  // Si a la BD le falta alguna columna nueva (migración sin aplicar) se guarda sin ella, pero
  // queda registrado y el cliente lo ve como aviso (ver server/db/tolerantWrite.ts).
  const res = await escrituraTolerante('epk_configs', currentPayload, (p) =>
    sb.from('epk_configs').upsert(p).select().single()
  );
  for (const col of res.omitidas) delete currentPayload[col];
  data = res.data;
  error = res.error;

  if (error)
    throw new Error(`Supabase Error (upsert epk_configs): ${error.message}`);

  // En Supabase PostgreSQL, si el upsert por ON CONFLICT no sobreescribió los campos actualizados,
  // garantizamos la persistencia atómica reemplazando el registro para asegurar que el logo y datos queden guardados.
  if (data && newLogoUrl && data.logo_url !== newLogoUrl) {
    try {
      await sb.from('epk_configs').delete().eq('band_id', bandIdToUse);
      const insertRes = await sb
        .from('epk_configs')
        .insert(currentPayload)
        .select()
        .single();
      if (insertRes.data) {
        data = insertRes.data;
      }
    } catch (_) {
      // Non-blocking
    }
  }

  // Also sync band name into registered_bands table (logo_url lives in epk_configs)
  const regUpdates: Record<string, any> = {};
  const providedName = (
    config.bandName ||
    config.nombre_banda ||
    config.localBandName ||
    ''
  ).trim();
  if (
    providedName &&
    providedName.toLowerCase() !== 'banda' &&
    !providedName.toLowerCase().includes('bakandeya')
  ) {
    regUpdates.nombre_banda = providedName;
  }
  if (Object.keys(regUpdates).length > 0) {
    try {
      await sb
        .from('registered_bands')
        .update(regUpdates)
        .eq('band_id', bandIdToUse);
    } catch (regErr) {
      // Non-blocking
    }
  }

  try {
    invalidateBandStateCache(bandIdToUse);
    if (targetBandId && targetBandId !== bandIdToUse) {
      invalidateBandStateCache(targetBandId);
    }
  } catch (_) {
    // Non-blocking
  }

  return data;
}

// --- AUTONOMY CONFIGS ---
