import { getSupabase, cleanBandId } from "./core.js";
import { ensureRegisteredBandExists } from "./bands.js";
import { analizarEnergiaAudio, medirVariacionInterna, calcularVolumenPromedioAudio, detectarBpmDesdeAudio, calcularEnergiaBpmVolumen } from "../utils/audioEnergy.js";

import { INITIAL_SONGS, INITIAL_SETLISTS } from "../../src/db_seed.js";

/**
 * Analiza y persiste la dinámica interna del audio de un tema. Usada tanto por el disparo
 * automático (en segundo plano tras guardar) como por la repesca manual de todo el repertorio.
 * Nunca lanza: si ffmpeg falla o el audio no es analizable, la canción se queda sin variación,
 * exactamente igual que si nunca se hubiera subido audio.
 */
export async function analizarYGuardarDinamicaCancion(
  songId: string,
  audioUrl: string,
  bandId: string
): Promise<{ variacion: number; audioAnalizable: boolean }> {
  const curva = await analizarEnergiaAudio(audioUrl, { timeoutMs: 90_000 });
  const audioAnalizable = curva.length > 1;
  const variacion = audioAnalizable ? medirVariacionInterna(curva) : 0;
  const energiaDbPromedio = audioAnalizable ? calcularVolumenPromedioAudio(curva) : null;
  const energiaBpmDetectado = audioAnalizable ? detectarBpmDesdeAudio(curva) : null;

  // Si el audio no se pudo analizar (descarga fallida, ffmpeg sin salida, etc.) NO se marca
  // energia_variacion_calculada_en: dejar la canción "sin analizar" para que la próxima repesca
  // la reintente, en vez de guardar un 0 falso que la deja marcada como analizada para siempre.
  if (!audioAnalizable) {
    return { variacion: 0, audioAnalizable: false };
  }

  // UPDATE (no dbUpsertSong): dbUpsertSong reescribe la fila entera con sus valores por
  // defecto para cualquier campo que no venga en el objeto — perfecto para un guardado desde
  // el formulario (que manda la canción completa), pero borraría título/audio/bpm/etc. si se
  // usara aquí con solo estos dos campos. Un UPDATE solo toca las columnas indicadas.
  //
  // El filtro de band_id admite las mismas variantes de formato que dbGetSongs (candidateIds):
  // canciones antiguas pueden tener el band_id guardado con o sin prefijo band-/reg-, y un
  // .eq() con un único formato exacto puede no matchear ninguna fila. Un UPDATE de Supabase que
  // no matchea nada NO lanza error — devuelve éxito con 0 filas afectadas, así que sin esto el
  // "reanálisis" de canciones antiguas parece funcionar (200 OK) pero nunca persiste nada.
  const sb = getSupabase();
  const rawClean = (bandId || "").trim();
  const noPrefix = rawClean.replace(/^(band|reg)-/, "");
  const candidateIds = Array.from(new Set([
    rawClean,
    noPrefix,
    `band-${noPrefix}`,
    `reg-${noPrefix}`
  ])).filter(Boolean);

  const { data, error } = await sb
    .from("songs")
    .update({
      energia_db_promedio: energiaDbPromedio,
      energia_bpm_detectado: energiaBpmDetectado,
      energia_variacion: variacion,
      energia_variacion_calculada_en: new Date().toISOString()
    })
    .eq("id", songId)
    .in("band_id", candidateIds)
    .select("id");
  if (error) throw new Error(`Supabase Error (guardar dinámica interna): ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error(`No se encontró la canción ${songId} para esta banda (posible band_id en formato antiguo)`);
  }

  // Tras guardar, recalibrar todas las energías de la banda para que estén normalizadas
  // relativas unas a otras usando BPM + volumen híbrido.
  await recalibrarEnergiasDelRepertorio(bandId);

  return { variacion, audioAnalizable: true };
}

/**
 * Normaliza las energías (1-20) de todas las canciones de una banda
 * usando combinación híbrida de BPM detectado + volumen promedio crudo.
 *
 * Cuando una canción nueva se analiza, esto recalibra las energías de todo el repertorio
 * para que reflejen: tempo real (fast = más energía) + contraste de volumen dentro de la banda.
 * Esto diferencia correctamente entre baladas lentas y uptempo rápido incluso con
 * masterización uniforme.
 */
async function recalibrarEnergiasDelRepertorio(bandId: string): Promise<void> {
  const sb = getSupabase();
  const rawClean = (bandId || "").trim();
  const noPrefix = rawClean.replace(/^(band|reg)-/, "");
  const candidateIds = Array.from(new Set([
    rawClean,
    noPrefix,
    `band-${noPrefix}`,
    `reg-${noPrefix}`
  ])).filter(Boolean);

  // Obtén todas las canciones con datos de energía calculados
  const { data: songs, error: fetchError } = await sb
    .from("songs")
    .select("id, energia_db_promedio, energia_bpm_detectado")
    .in("band_id", candidateIds)
    .or("energia_db_promedio.not.is.null,energia_bpm_detectado.not.is.null");

  if (fetchError) {
    console.error("[Repertorio] Error fetching songs for recalibration:", fetchError.message);
    return;
  }
  if (!songs || songs.length === 0) return;

  // Calcular min/max para normalizar BPM y dB
  const bpms = songs
    .map((s) => s.energia_bpm_detectado as number)
    .filter((bpm) => typeof bpm === "number");
  const dbs = songs
    .map((s) => s.energia_db_promedio as number)
    .filter((db) => typeof db === "number");

  if (bpms.length === 0 && dbs.length === 0) return;

  const bandStats = {
    minBpm: bpms.length > 0 ? Math.min(...bpms) : 120,
    maxBpm: bpms.length > 0 ? Math.max(...bpms) : 120,
    minDb: dbs.length > 0 ? Math.min(...dbs) : -25,
    maxDb: dbs.length > 0 ? Math.max(...dbs) : -25
  };

  // Mapea cada canción a 1-20 usando la fórmula híbrida
  for (const song of songs) {
    const bpm = song.energia_bpm_detectado || 120;
    const db = song.energia_db_promedio || -25;
    const energia = calcularEnergiaBpmVolumen(bpm, db, bandStats);

    const { error: updateError } = await sb
      .from("songs")
      .update({ energia })
      .eq("id", song.id);
    if (updateError) {
      console.error(`[Repertorio] Error updating energy for song ${song.id}:`, updateError.message);
    }
  }
}

/** Igual que `analizarYGuardarDinamicaCancion`, pero sin bloquear al llamador ni propagar errores. */
function dispararAnalisisDinamicaEnSegundoPlano(songId: string, audioUrl: string, bandId: string): void {
  analizarYGuardarDinamicaCancion(songId, audioUrl, bandId).catch((err) => {
    console.error(`[Repertorio] No se pudo analizar la dinámica interna de la canción ${songId}:`, err?.message || err);
  });
}

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
    energia: Number(s.energia || 10),
    energiaVariacion: typeof s.energia_variacion === "number" ? s.energia_variacion : (typeof s.energiaVariacion === "number" ? s.energiaVariacion : undefined),
    energia_variacion: typeof s.energia_variacion === "number" ? s.energia_variacion : (typeof s.energiaVariacion === "number" ? s.energiaVariacion : undefined),
    energiaVariacionCalculadaEn: s.energia_variacion_calculada_en || s.energiaVariacionCalculadaEn || undefined,
    energia_variacion_calculada_en: s.energia_variacion_calculada_en || s.energiaVariacionCalculadaEn || undefined,
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
  const rawClean = (bandId || "").trim();
  const noPrefix = rawClean.replace(/^(band|reg)-/, "");
  const candidateIds = Array.from(new Set([
    rawClean,
    noPrefix,
    `band-${noPrefix}`,
    `reg-${noPrefix}`
  ])).filter(Boolean);

  const { data, error } = await sb
    .from("songs")
    .select("*")
    .in("band_id", candidateIds)
    .order("titulo", { ascending: true });

  if (error) throw new Error(`Supabase Error (songs): ${error.message}`);
  return (data || []).map(mapSongRecord);
}

export async function dbUpsertSong(song: any, bandId: string) {
  const sb = getSupabase();
  // 'bandId' es el único origen de confianza (lo resuelve la ruta desde la sesión); el
  // objeto de entrada puede traer su propio 'band_id' sin validar desde el cuerpo de la
  // petición y no debe primar (ver el mismo fallo corregido en server/db/campaigns.ts).
  const targetBandId = cleanBandId(bandId);
  await ensureRegisteredBandExists(targetBandId);

  // Ver nota equivalente en dbUpsertFan/dbUpsertConcert: un id que no pertenece a la banda del
  // usuario no se reutiliza nunca.
  let finalSongId = song.id;
  let existing: { id: string; band_id: string; audio_principal_url?: string } | null = null;
  if (finalSongId) {
    const { data } = await sb.from("songs").select("id, band_id, audio_principal_url").eq("id", finalSongId).maybeSingle();
    existing = data;
    if (existing && existing.band_id !== targetBandId) {
      finalSongId = `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      existing = null;
    }
  }

  const payload: any = {
    id: finalSongId || `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
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
    energia: Number(song.energia || 10),
    // Solo se incluyen si vienen con un valor real: no queremos que un guardado normal del
    // formulario (que no toca este campo) borre una variación ya analizada del audio.
    ...(typeof (song.energia_variacion ?? song.energiaVariacion) === "number"
      ? { energia_variacion: Number(song.energia_variacion ?? song.energiaVariacion) }
      : {}),
    ...(typeof (song.energia_variacion_calculada_en ?? song.energiaVariacionCalculadaEn) === "string"
      ? { energia_variacion_calculada_en: song.energia_variacion_calculada_en ?? song.energiaVariacionCalculadaEn }
      : {}),
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
    error.message.toLowerCase().includes("notas_repertorio") ||
    error.message.toLowerCase().includes("energia_variacion")
  )) {
    const fallbackPayload = { ...payload };
    delete fallbackPayload.notas_miembros;
    delete fallbackPayload.notas_por_miembro;
    delete fallbackPayload.notas_repertorio;
    delete fallbackPayload.energia_variacion;
    delete fallbackPayload.energia_variacion_calculada_en;
    const retry = await sb.from("songs").upsert(fallbackPayload).select().single();
    if (retry.error) throw new Error(`Supabase Error (upsert song fallback): ${retry.error.message}`);
    data = retry.data;
    error = null;
  } else if (error) {
    throw new Error(`Supabase Error (upsert song): ${error.message}`);
  }

  // Detección automática de dinámica interna (partes lentas/rápidas del tema): si el audio
  // principal es nuevo o ha cambiado, se analiza solo, sin que el usuario tenga que hacer nada.
  const audioNuevo = payload.audio_principal_url;
  const audioCambio = !existing || existing.audio_principal_url !== audioNuevo;
  if (audioNuevo && audioCambio) {
    dispararAnalisisDinamicaEnSegundoPlano(finalSongId, audioNuevo, targetBandId);
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
  const rawClean = (bandId || "").trim();
  const noPrefix = rawClean.replace(/^(band|reg)-/, "");
  const candidateIds = Array.from(new Set([
    rawClean,
    noPrefix,
    `band-${noPrefix}`,
    `reg-${noPrefix}`
  ])).filter(Boolean);

  const { data, error } = await sb
    .from("setlists")
    .select("*")
    .in("band_id", candidateIds)
    .order("fecha_ultima_edicion", { ascending: false });

  if (error) throw new Error(`Supabase Error (setlists): ${error.message}`);
  return (data || []).map(sl => ({
    ...sl,
    items: sl.items || []
  }));
}

export async function dbUpsertSetlist(setlist: any, bandId: string) {
  const sb = getSupabase();
  // 'bandId' es el único origen de confianza (lo resuelve la ruta desde la sesión); el
  // objeto de entrada puede traer su propio 'band_id' sin validar desde el cuerpo de la
  // petición y no debe primar (ver el mismo fallo corregido en server/db/campaigns.ts).
  const targetBandId = cleanBandId(bandId);
  await ensureRegisteredBandExists(targetBandId);

  // Ver nota equivalente en dbUpsertFan/dbUpsertConcert: un id que no pertenece a la banda del
  // usuario no se reutiliza nunca.
  let finalSetlistId = setlist.id;
  if (finalSetlistId) {
    const { data: existing } = await sb.from("setlists").select("id, band_id").eq("id", finalSetlistId).maybeSingle();
    if (existing && existing.band_id !== targetBandId) {
      finalSetlistId = `setlist-${Date.now()}`;
    }
  }

  const payload = {
    id: finalSetlistId || `setlist-${Date.now()}`,
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

// --- SETLIST SHORTCUTS (per-band custom "quick add" presets, see RepertorioSetlists.tsx) ---
export async function dbGetSetlistShortcuts(bandId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("setlist_shortcuts")
    .select("*")
    .eq("band_id", cleanBandId(bandId))
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Supabase Error (setlist_shortcuts): ${error.message}`);
  return (data || []).map(sc => ({
    id: sc.id,
    band_id: sc.band_id,
    icono: sc.icono,
    etiqueta: sc.etiqueta,
    tituloCustom: sc.titulo_custom,
    duracionEstimadaMinutos: sc.duracion_estimada_minutos,
    duracionEstimadaSegundos: sc.duracion_estimada_segundos,
    notaTema: sc.nota_tema || ""
  }));
}

export async function dbUpsertSetlistShortcut(shortcut: any, bandId: string) {
  const sb = getSupabase();
  // 'bandId' es el único origen de confianza (lo resuelve la ruta desde la sesión); ver la misma
  // nota en dbUpsertSong/dbUpsertSetlist más arriba.
  const targetBandId = cleanBandId(bandId);
  await ensureRegisteredBandExists(targetBandId);

  const payload = {
    id: shortcut.id || `shortcut-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    band_id: targetBandId,
    icono: shortcut.icono || '⚡',
    etiqueta: shortcut.etiqueta || 'Atajo',
    titulo_custom: shortcut.titulo_custom || shortcut.tituloCustom || shortcut.etiqueta || 'Atajo',
    duracion_estimada_minutos: shortcut.duracion_estimada_minutos ?? shortcut.duracionEstimadaMinutos ?? null,
    duracion_estimada_segundos: shortcut.duracion_estimada_segundos ?? shortcut.duracionEstimadaSegundos ?? null,
    nota_tema: shortcut.nota_tema || shortcut.notaTema || ""
  };

  const { data, error } = await sb.from("setlist_shortcuts").upsert(payload).select().single();
  if (error) throw new Error(`Supabase Error (upsert setlist_shortcut): ${error.message}`);
  return {
    id: data.id,
    band_id: data.band_id,
    icono: data.icono,
    etiqueta: data.etiqueta,
    tituloCustom: data.titulo_custom,
    duracionEstimadaMinutos: data.duracion_estimada_minutos,
    duracionEstimadaSegundos: data.duracion_estimada_segundos,
    notaTema: data.nota_tema || ""
  };
}

export async function dbDeleteSetlistShortcut(id: string, bandId: string) {
  const sb = getSupabase();
  const { error } = await sb.from("setlist_shortcuts").delete().eq("id", id).eq("band_id", cleanBandId(bandId));
  if (error) throw new Error(`Supabase Error (delete setlist_shortcut): ${error.message}`);
  return true;
}

// --- EPK CONFIGS ---
