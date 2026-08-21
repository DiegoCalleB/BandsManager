import { getSupabase, cleanBandId } from "./core.js";

import { INITIAL_SONGS, INITIAL_SETLISTS } from "../../src/db_seed.js";

export function mapSongRecord(s: any) {
  if (!s || typeof s !== "object") return s;
  const audioUrl = s.audio_principal_url || s.audioPrincipalUrl || s.audio_url || s.audioUrl || "";
  const portada = s.portada_url || s.portadaUrl || "";
  const albumDisco = s.album_disco || s.albumDisco || s.album || "";

  return {
    ...s,
    id: s.id,
    band_id: s.band_id || s.bandId,
    titulo: s.titulo || "Sin Título",
    duracion: s.duracion || "03:30",
    duracionSegundos: Number(s.duracion_segundos ?? s.duracionSegundos ?? 210),
    duracion_segundos: Number(s.duracion_segundos ?? s.duracionSegundos ?? 210),
    duracionMinutos: Number(s.duracion_minutos ?? s.duracionMinutos ?? 3),
    duracion_minutos: Number(s.duracion_minutos ?? s.duracionMinutos ?? 3),
    tonalidad: s.tonalidad || "Mim",
    bpm: Number(s.bpm || 120),
    afinacion: s.afinacion || "Estándar E",
    albumDisco,
    album_disco: albumDisco,
    album: s.album || albumDisco,
    ordenAlbum: typeof s.orden_album === "number" ? s.orden_album : (typeof s.ordenAlbum === "number" ? s.ordenAlbum : undefined),
    orden_album: typeof s.orden_album === "number" ? s.orden_album : (typeof s.ordenAlbum === "number" ? s.ordenAlbum : undefined),
    genero: s.genero || "Mestizaje",
    tipo: s.tipo || "original",
    estado: s.estado || "ensayando",
    energia: Number(s.energia || 5),
    portadaUrl: portada,
    portada_url: portada,
    favoritoGeneral: Boolean(s.favorito_general ?? s.favoritoGeneral),
    favorito_general: Boolean(s.favorito_general ?? s.favoritoGeneral),
    estadoTema: s.estado_tema || s.estadoTema || "ensayando",
    estado_tema: s.estado_tema || s.estadoTema || "ensayando",
    esVersionCovers: Boolean(s.es_version_covers ?? s.esVersionCovers),
    es_version_covers: Boolean(s.es_version_covers ?? s.esVersionCovers),
    enlaceAcordes: s.enlace_acordes || s.enlaceAcordes || "",
    enlace_acordes: s.enlace_acordes || s.enlaceAcordes || "",
    notasInternas: s.notas_internas || s.notasInternas || "",
    notas_internas: s.notas_internas || s.notasInternas || "",
    notasRepertorio: s.notas_repertorio || s.notasRepertorio || "",
    notas_repertorio: s.notas_repertorio || s.notasRepertorio || "",
    notasMiembros: s.notas_miembros || s.notasMiembros || {},
    notas_miembros: s.notas_miembros || s.notasMiembros || {},
    notasPorMiembro: s.notas_por_miembro || s.notasPorMiembro || [],
    notas_por_miembro: s.notas_por_miembro || s.notasPorMiembro || [],
    audioPrincipalUrl: audioUrl,
    audio_principal_url: audioUrl,
    audioUrl,
    audioIdeas: s.audio_ideas || s.audioIdeas || (audioUrl ? [{
      id: `idea_${s.id}`,
      titulo: "Audio Oficial",
      seccion: "general" as const,
      audioUrl,
      subidoPor: "Sync",
      fecha: new Date().toISOString()
    }] : []),
    audio_ideas: s.audio_ideas || s.audioIdeas || [],
    cifradoTexto: s.cifrado_texto || s.cifradoTexto || "",
    cifrado_texto: s.cifrado_texto || s.cifradoTexto || "",
    guiaSustituto: s.guia_sustituto || s.guiaSustituto || {},
    guia_sustituto: s.guia_sustituto || s.guiaSustituto || {}
  };
}

export async function dbGetSongs(bandId: string) {
  const sb = getSupabase();
  const cleanId = cleanBandId(bandId);
  const { data, error } = await sb
    .from("songs")
    .select("*")
    .eq("band_id", cleanId)
    .order("titulo", { ascending: true });

  if (error) throw new Error(`Supabase Error (songs): ${error.message}`);
  
  if (!data || data.length === 0) {
    for (const song of INITIAL_SONGS) {
      await dbUpsertSong(song, cleanId).catch(() => {});
    }
    const { data: seededData } = await sb
      .from("songs")
      .select("*")
      .eq("band_id", cleanId)
      .order("titulo", { ascending: true });
    return (seededData || []).map(mapSongRecord);
  }

  return (data || []).map(mapSongRecord);
}

export async function dbUpsertSong(song: any, bandId: string) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(song.band_id || bandId);
  await ensureRegisteredBandExists(targetBandId);

  const payload: any = {
    id: song.id || `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    band_id: targetBandId,
    titulo: song.titulo || "Nueva Canción",
    duracion: song.duracion || "03:30",
    duracion_segundos: Math.round(Number(song.duracion_segundos || song.duracionSegundos || 210)),
    duracion_minutos: Math.round(Number(song.duracion_minutos || song.duracionMinutos || 3)),
    tonalidad: song.tonalidad || "Mim",
    bpm: Number(song.bpm || 120),
    afinacion: song.afinacion || "Estándar E",
    album_disco: song.album_disco || song.albumDisco || song.album || "",
    orden_album: song.orden_album ?? song.ordenAlbum ?? null,
    album: song.album || song.album_disco || song.albumDisco || "",
    genero: song.genero || "Mestizaje",
    tipo: song.tipo || "original",
    estado: song.estado || "ensayando",
    energia: Number(song.energia || 5),
    portada_url: song.portada_url || song.portadaUrl || "",
    favorito_general: Boolean(song.favorito_general ?? song.favoritoGeneral),
    estado_tema: song.estado_tema || song.estadoTema || "ensayando",
    es_version_covers: Boolean(song.es_version_covers ?? song.esVersionCovers),
    enlace_acordes: song.enlace_acordes || song.enlaceAcordes || "",
    notas_internas: song.notas_internas || song.notasInternas || "",
    notas_repertorio: song.notas_repertorio || song.notasRepertorio || "",
    notas_miembros: song.notas_miembros || song.notasMiembros || {},
    notas_por_miembro: song.notas_por_miembro || song.notasPorMiembro || [],
    audio_principal_url: song.audio_principal_url || song.audioPrincipalUrl || song.audio_url || song.audioUrl || "",
    audio_ideas: song.audio_ideas || song.audioIdeas || [],
    cifrado_texto: song.cifrado_texto || song.cifradoTexto || "",
    guia_sustituto: song.guia_sustituto || song.guiaSustituto || {}
  };

  let { data, error } = await sb.from("songs").upsert(payload).select().single();
  if (error && error.message && (
    error.message.toLowerCase().includes("notas_miembros") ||
    error.message.toLowerCase().includes("notas_por_miembro") ||
    error.message.toLowerCase().includes("notas_repertorio")
  )) {
    const fallbackPayload = { ...payload };
    delete fallbackPayload.notas_miembros;
    delete fallbackPayload.notas_por_miembro;
    delete fallbackPayload.notas_repertorio;
    const retry = await sb.from("songs").upsert(fallbackPayload).select().single();
    if (retry.error) throw new Error(`Supabase Error (upsert song fallback): ${retry.error.message}`);
    data = retry.data;
    error = null;
  } else if (error) {
    throw new Error(`Supabase Error (upsert song): ${error.message}`);
  }
  return mapSongRecord(data || payload);
}

export async function dbDeleteSong(id: string, bandId: string) {
  const sb = getSupabase();
  const { error } = await sb.from("songs").delete().eq("id", id).eq("band_id", cleanBandId(bandId));
  if (error) throw new Error(`Supabase Error (delete song): ${error.message}`);
  return true;
}

// --- SETLISTS ---
export async function dbGetSetlists(bandId: string) {
  const sb = getSupabase();
  const cleanId = cleanBandId(bandId);
  const { data, error } = await sb
    .from("setlists")
    .select("*")
    .eq("band_id", cleanId)
    .order("fecha_ultima_edicion", { ascending: false });

  if (error) throw new Error(`Supabase Error (setlists): ${error.message}`);
  
  if (!data || data.length === 0) {
    for (const setlist of INITIAL_SETLISTS) {
      await dbUpsertSetlist(setlist, cleanId).catch(() => {});
    }
    const { data: seededData } = await sb
      .from("setlists")
      .select("*")
      .eq("band_id", cleanId)
      .order("fecha_ultima_edicion", { ascending: false });
    return (seededData || []).map(sl => ({
      ...sl,
      items: sl.items || []
    }));
  }

  return (data || []).map(sl => ({
    ...sl,
    items: sl.items || []
  }));
}

export async function dbUpsertSetlist(setlist: any, bandId: string) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(setlist.band_id || bandId);
  await ensureRegisteredBandExists(targetBandId);

  const payload = {
    id: setlist.id || `setlist-${Date.now()}`,
    band_id: targetBandId,
    nombre: setlist.nombre || "Repertorio",
    descripcion: setlist.descripcion || "",
    tipo_formato: setlist.tipo_formato || setlist.tipoFormato || "festival",
    duracion_total_estimada_minutos: Number(setlist.duracion_total_estimada_minutos || setlist.duracionTotalEstimadaMinutos || 0),
    items: setlist.items || []
  };

  const { data, error } = await sb.from("setlists").upsert(payload).select().single();
  if (error) throw new Error(`Supabase Error (upsert setlist): ${error.message}`);
  return data;
}

export async function dbDeleteSetlist(id: string, bandId: string) {
  const sb = getSupabase();
  const { error } = await sb.from("setlists").delete().eq("id", id).eq("band_id", cleanBandId(bandId));
  if (error) throw new Error(`Supabase Error (delete setlist): ${error.message}`);
  return true;
}

// --- EPK CONFIGS ---
