// Contactos de la banda (`band_contacts`): lectura, upsert y borrado (también en bloque).

import { getSupabase, cleanBandId } from "./core.js";
import { ensureRegisteredBandExists } from "./bands.js";
import { cargarEnlacesDeContactos, sincronizarEnlacesDeContacto } from "./enlacesBandas.js";
import { valorVisibleSpotifyYoutube } from "../utils/enlacesBandas.js";

export async function dbGetBandContacts(bandId: string) {
  const sb = getSupabase();
  const cleanId = cleanBandId(bandId);
  const { data, error } = await sb
    .from("band_contacts")
    .select("*")
    .eq("band_id", cleanId)
    .order("nombre_banda", { ascending: true });

  if (error) throw new Error(`Supabase Error (band_contacts): ${error.message}`);
  const validated = (data || []).filter(b => cleanBandId(b.band_id) === cleanId);
  // Los enlaces viven en `enlaces_bandas_amigas`: si la banda tiene filas, mandan sobre la columna legacy.
  const enlacesPorContacto = await cargarEnlacesDeContactos(validated.map(b => b.id));
  return validated.map(b => {
    const enlaces = enlacesPorContacto.get(b.id);
    return {
      ...b,
      dna_expresion: b.dna_expresion || {},
      ...(enlaces ? { spotify_youtube: valorVisibleSpotifyYoutube(enlaces) } : {}),
      enlaces: enlaces || {}
    };
  });
}

export async function dbUpsertBandContact(band: any, bandId: string) {
  const sb = getSupabase();
  // 'bandId' es el único origen de confianza: lo resuelve la ruta a partir de la sesión
  // (req.user.band_id). 'band.band_id' viene del cuerpo de la petición sin validar — de
  // priorizarlo, cualquier usuario autenticado podría escribir un contacto en la banda de otro
  // con solo mandar {"band_id": "banda-ajena"} en el body (ver el mismo fallo ya corregido en
  // server/db/campaigns.ts).
  const targetBandId = cleanBandId(bandId);
  const name = (band.nombre_banda || band.nombreBanda || band.bandName || "").trim();
  await ensureRegisteredBandExists(targetBandId, name);

  // Ver nota equivalente en dbUpsertLead: un id que no pertenece a la banda del usuario no se
  // reutiliza nunca (evita secuestrar/sobrescribir el contacto de otra banda por coincidencia de id).
  let existingRecord: any = null;
  let idBelongsToOtherBand = false;
  if (band.id) {
    const { data } = await sb.from("band_contacts").select("*").eq("id", band.id).maybeSingle();
    if (data) {
      if (data.band_id === targetBandId) {
        existingRecord = data;
      } else {
        idBelongsToOtherBand = true;
      }
    }
  }
  if (!existingRecord && name) {
    const { data } = await sb
      .from("band_contacts")
      .select("*")
      .eq("band_id", targetBandId)
      .ilike("nombre_banda", name)
      .maybeSingle();
    existingRecord = data;
  }

  const finalId = existingRecord?.id || (idBelongsToOtherBand ? `band-${Date.now()}` : band.id) || `band-${Date.now()}`;

  const payload = {
    id: finalId,
    band_id: targetBandId,
    nombre_banda: name || existingRecord?.nombre_banda || "Banda",
    estilo_musical: band.estilo_musical || band.estiloMusical || existingRecord?.estilo_musical || "",
    localizacion: band.localizacion || existingRecord?.localizacion || "",
    estado_relacion: band.estado_relacion || band.estadoRelacion || existingRecord?.estado_relacion || "sin_contactar",
    ultimo_contacto: band.ultimo_contacto || band.ultimoContacto || existingRecord?.ultimo_contacto || "",
    contacto_nombre: band.contacto_nombre || band.contactoNombre || existingRecord?.contacto_nombre || "",
    email: band.email || existingRecord?.email || "",
    telefono: band.telefono || existingRecord?.telefono || "",
    // Si el formulario manda el campo (aunque vacío), es la verdad: así borrar un enlace funciona.
    instagram: band.instagram ?? existingRecord?.instagram ?? "",
    spotify_youtube: (band.spotify_youtube ?? band.spotifyYoutube) ?? existingRecord?.spotify_youtube ?? "",
    aforo_promedio: Number(band.aforo_promedio || band.aforoPromedio || existingRecord?.aforo_promedio || 0),
    notas_colaboracion: band.notas_colaboracion || band.notasColaboracion || existingRecord?.notas_colaboracion || "",
    ciudad_origen_swap: band.ciudad_origen_swap || band.ciudadOrigenSwap || existingRecord?.ciudad_origen_swap || "",
    icono: band.icono || existingRecord?.icono || "🎸",
    imagen_url: band.imagen_url || band.imagenUrl || existingRecord?.imagen_url || "",
    es_favorito: Boolean(band.es_favorito ?? band.esFavorito ?? existingRecord?.es_favorito),
    es_verificado: Boolean(band.es_verificado ?? band.esVerificado ?? existingRecord?.es_verificado),
    fiabilidad_score: band.fiabilidad_score ?? band.fiabilidadScore ?? existingRecord?.fiabilidad_score ?? null,
    estilo_comunicacion: band.estilo_comunicacion || band.estiloComunicacion || existingRecord?.estilo_comunicacion || "",
    dna_expresion: band.dna_expresion || band.dnaExpresion || existingRecord?.dna_expresion || {}
  };

  const { data, error } = await sb.from("band_contacts").upsert(payload).select().single();
  if (error) throw new Error(`Supabase Error (upsert band_contacts): ${error.message}`);
  // Tras el upsert: la fila de enlaces necesita que el contacto ya exista (FK).
  await sincronizarEnlacesDeContacto(
    payload.id,
    targetBandId,
    band.spotify_youtube ?? band.spotifyYoutube,
    band.instagram,
  );
  return data;
}

export async function dbBulkDeleteBandContacts(ids: string[], bandId: string) {
  if (!ids || ids.length === 0) return true;
  const sb = getSupabase();
  const cleanId = cleanBandId(bandId);
  // PostgreSQL Trigger (trg_archive_deleted_band) handles blacklist archival atomically BEFORE DELETE
  const { error } = await sb.from("band_contacts").delete().in("id", ids).eq("band_id", cleanId);
  if (error) throw new Error(`Supabase Error (bulk delete band_contacts): ${error.message}`);
  return true;
}

export async function dbDeleteBandContact(id: string, bandId: string) {
  const sb = getSupabase();
  const cleanId = cleanBandId(bandId);
  // PostgreSQL Trigger (trg_archive_deleted_band) handles blacklist archival atomically BEFORE DELETE
  const { error } = await sb.from("band_contacts").delete().eq("id", id).eq("band_id", cleanId);
  if (error) throw new Error(`Supabase Error (delete band_contacts): ${error.message}`);
  return true;
}

// --- LEADS / SALAS / MEDIOS ---
