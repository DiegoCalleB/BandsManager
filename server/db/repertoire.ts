import { getSupabase, cleanBandId } from "./core.js";
import { ensureRegisteredBandExists } from "./bands.js";
import { analizarEnergiaAudio, medirVariacionInterna, calcularVolumenPromedioAudio, calcularEnergiaBpmVolumen } from "../utils/audioEnergy.js";
import { analizarAudioConIris, detectarTonalidadDesdeAudio } from "../utils/audioKey.js";

import { INITIAL_SONGS, INITIAL_SETLISTS } from "../../src/db_seed.js";

/**
 * Analiza y persiste la dinámica interna del audio de un tema — y de paso, BPM y tonalidad
 * (Iris ya nos obliga a decodificar el audio de todas formas, así que aprovechamos la misma
 * pasada). Usada tanto por el disparo automático (en segundo plano tras guardar) como por la
 * repesca manual de todo el repertorio.
 *
 * Nunca lanza: si ffmpeg falla o el audio no es analizable, la canción se queda sin variación,
 * exactamente igual que si nunca se hubiera subido audio. BPM y tonalidad son best-effort e
 * independientes entre sí: uno puede fallar (audio demasiado ambiguo, tempo fuera de rango...)
 * sin tumbar al otro ni a la dinámica.
 *
 * El BPM YA NO sale de la curva de energía de `astats` (100ms de resolución): sobre audio real
 * eso cuantizaba cualquier intervalo entre golpes a un múltiplo de 0.1s antes de llegar al
 * histograma, y en producción colapsó 23 canciones bien distintas en solo 3 valores de BPM
 * (100/118/154). `analizarAudioConIris` mide onsets por flujo espectral sobre el PCM real
 * (~23ms de resolución), que ya no está pegado a esa rejilla.
 */
export async function analizarYGuardarDinamicaCancion(
  songId: string,
  audioUrl: string,
  bandId: string
): Promise<{ variacion: number; audioAnalizable: boolean; bpmDetectado: number | null; tonalidadDetectada: string | null }> {
  const curva = await analizarEnergiaAudio(audioUrl, { timeoutMs: 90_000 });
  const audioAnalizable = curva.length > 1;
  const variacion = audioAnalizable ? medirVariacionInterna(curva) : 0;
  const energiaDbPromedio = audioAnalizable ? calcularVolumenPromedioAudio(curva) : null;
  // Independiente de la curva de energía (usa su propia extracción de PCM): un audio puede
  // fallar el análisis de dinámica y aun así ser perfectamente decodificable para BPM/tonalidad,
  // así que no se condiciona a `audioAnalizable`.
  const { bpm: bpmDetectado, tonalidad: tonalidadDetectada } = await analizarAudioConIris(audioUrl, { timeoutMs: 90_000 }).catch((err) => {
    console.error(`[Repertorio] analizarAudioConIris lanzó (no debería):`, err?.message || err);
    return { bpm: null, tonalidad: null };
  });
  console.log(`[Repertorio] Análisis de audio de ${songId}: dinámica=${audioAnalizable ? 'ok' : 'no analizable'} bpm=${bpmDetectado ?? '-'} tonalidad=${tonalidadDetectada?.tonalidad ?? '-'}`);

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

  const ahora = new Date().toISOString();
  const cambios: Record<string, any> = {};
  if (audioAnalizable) {
    cambios.energia_db_promedio = energiaDbPromedio;
    cambios.energia_variacion = variacion;
    cambios.energia_variacion_calculada_en = ahora;
  }
  // Independiente de audioAnalizable: el BPM ya no sale de la curva de energía, así que puede
  // detectarse aunque esa curva concreta haya fallado (y viceversa).
  if (bpmDetectado !== null) {
    cambios.energia_bpm_detectado = bpmDetectado; // sigue alimentando el recalibrado interno de energía
    cambios.bpm = bpmDetectado;
    cambios.bpm_detectado_en = ahora;
  }
  if (tonalidadDetectada) {
    cambios.tonalidad = tonalidadDetectada.tonalidad;
    cambios.tonalidad_detectada_en = ahora;
  }

  // Si no hay NADA que guardar (ni dinámica ni BPM ni tonalidad), no tocar la fila: así una
  // repesca manual sobre una canción sin análisis posible puede reintentarse más tarde en vez
  // de quedar marcada como "analizada" con un 0 falso.
  if (Object.keys(cambios).length === 0) {
    return { variacion: 0, audioAnalizable: false, bpmDetectado: null, tonalidadDetectada: null };
  }

  // UPDATE (no dbUpsertSong): dbUpsertSong reescribe la fila entera con sus valores por
  // defecto para cualquier campo que no venga en el objeto — perfecto para un guardado desde
  // el formulario (que manda la canción completa), pero borraría título/audio/bpm/etc. si se
  // usara aquí con solo estos dos campos. Un UPDATE solo toca las columnas indicadas.
  const { data, error } = await sb
    .from("songs")
    .update(cambios)
    .eq("id", songId)
    .in("band_id", candidateIds)
    .select("id");
  if (error) throw new Error(`Supabase Error (guardar dinámica interna): ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error(`No se encontró la canción ${songId} para esta banda (posible band_id en formato antiguo)`);
  }

  // Tras guardar, recalibrar todas las energías de la banda para que estén normalizadas
  // relativas unas a otras usando BPM + volumen híbrido. Solo tiene sentido si hubo dinámica o
  // BPM nuevos que aportar (si solo se detectó tonalidad, la energía no ha cambiado).
  if (audioAnalizable || bpmDetectado !== null) {
    await recalibrarEnergiasDelRepertorio(bandId);
  }

  return {
    variacion,
    audioAnalizable,
    bpmDetectado,
    tonalidadDetectada: tonalidadDetectada?.tonalidad ?? null
  };
}

/**
 * Fija a mano la energía (1-20) de una canción y la marca como energia_manual: true, para que
 * recalibrarEnergiasDelRepertorio deje de tocarla en futuros análisis de audio de otras
 * canciones del repertorio — un valor puesto explícitamente por el usuario no debe desaparecer
 * solo porque se analizó el audio de otro tema distinto.
 */
export async function dbSetSongEnergiaManual(songId: string, energia: number, bandId: string) {
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
    .update({ energia, energia_manual: true })
    .eq("id", songId)
    .in("band_id", candidateIds)
    .select()
    .single();
  if (error) throw new Error(`Supabase Error (set energía manual): ${error.message}`);
  if (!data) throw new Error(`No se encontró la canción ${songId} para esta banda`);
  return mapSongRecord(data);
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

  // Obtén todas las canciones con datos de energía calculados — excepto las que el usuario fijó
  // a mano (energia_manual): ese valor es una elección explícita, el recalibrado automático no
  // debe pisarlo silenciosamente solo porque se analizó el audio de otra canción del repertorio.
  const { data: songs, error: fetchError } = await sb
    .from("songs")
    .select("id, energia_db_promedio, energia_bpm_detectado")
    .in("band_id", candidateIds)
    .eq("energia_manual", false)
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

  // min/max SOLO de canciones con dato real: una canción sin BPM detectable no debe
  // ensanchar ni desplazar el rango que usa el resto de la banda para normalizarse.
  const bandStats = {
    minBpm: bpms.length > 0 ? Math.min(...bpms) : 120,
    maxBpm: bpms.length > 0 ? Math.max(...bpms) : 120,
    minDb: dbs.length > 0 ? Math.min(...dbs) : -25,
    maxDb: dbs.length > 0 ? Math.max(...dbs) : -25
  };

  // Fallback para la canción SIN bpm/db detectado: la mediana real de la banda (no un
  // 120 fijo), para que esa canción caiga cerca del centro de la distribución real en
  // vez de en un punto arbitrario que puede quedar fuera del rango observado.
  const sortedBpms = [...bpms].sort((a, b) => a - b);
  const medianBpm = sortedBpms.length > 0 ? sortedBpms[Math.floor(sortedBpms.length / 2)] : 120;
  const sortedDbs = [...dbs].sort((a, b) => a - b);
  const medianDb = sortedDbs.length > 0 ? sortedDbs[Math.floor(sortedDbs.length / 2)] : -25;

  // Mapea cada canción a 1-20 usando la fórmula híbrida
  for (const song of songs) {
    const bpm = song.energia_bpm_detectado ?? medianBpm;
    const db = song.energia_db_promedio ?? medianDb;
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

// Orden de preferencia de pistas para redetectar tonalidad tras una separación de Iris: el bajo
// casi siempre toca la fundamental real de cada acorde (la pista más limpia posible para esto),
// y de ahí para abajo, cualquier otra pista armónica sin voz ni batería de por medio sigue
// dando mejor señal que la mezcla completa.
const ORDEN_PREFERENCIA_STEM_TONALIDAD = ["Bajo", "Arreglos", "Guitarras", "Teclados"];

/**
 * Busca, entre las pistas que acaban de llegar en un guardado (y que NO existían antes — o sea,
 * recién separadas por Iris), la mejor candidata para redetectar tonalidad: la primera que
 * aparezca según `ORDEN_PREFERENCIA_STEM_TONALIDAD`.
 */
function encontrarMejorStemNuevoParaTonalidad(existingIdeas: any[], incomingIdeas: any[]): string | null {
  const idsExistentes = new Set(
    (existingIdeas || []).flatMap((idea: any) => (idea.pistas || []).map((p: any) => p?.id))
  );
  const urlPorInstrumento = new Map<string, string>();
  const instrumentosVistos: string[] = [];
  for (const idea of incomingIdeas || []) {
    for (const pista of idea?.pistas || []) {
      if (!pista) continue;
      instrumentosVistos.push(`${pista.instrumento || '?'}${idsExistentes.has(pista.id) ? '(ya existía)' : '(nueva)'}`);
      if (idsExistentes.has(pista.id)) continue;
      if (pista.instrumento && pista.audioUrl && !urlPorInstrumento.has(pista.instrumento)) {
        urlPorInstrumento.set(pista.instrumento, pista.audioUrl);
      }
    }
  }
  let elegido: string | null = null;
  for (const instrumento of ORDEN_PREFERENCIA_STEM_TONALIDAD) {
    const url = urlPorInstrumento.get(instrumento);
    if (url) { elegido = url; break; }
  }
  console.log(`[Repertorio] Chequeo stem→tonalidad: pistas vistas=[${instrumentosVistos.join(', ')}] → elegido=${elegido ? elegido.slice(0, 60) + '…' : 'ninguno'}`);
  return elegido;
}

/**
 * Redetecta SOLO la tonalidad (no BPM ni dinámica: esas ya se midieron sobre la mezcla completa
 * y una pista aislada de un único instrumento no aporta nada nuevo ahí) usando una pista ya
 * separada por Iris en vez de la mezcla completa — menos ruido de voz/batería de por medio,
 * mejor croma. Se dispara sola tras cada separación nueva, sin que el usuario tenga que pedirlo.
 */
export async function detectarYGuardarTonalidadDesdeStem(
  songId: string,
  stemAudioUrl: string,
  bandId: string
): Promise<{ tonalidad: string } | null> {
  console.log(`[Repertorio] Redetectando tonalidad desde stem para ${songId}: ${stemAudioUrl.slice(0, 80)}…`);
  const resultado = await detectarTonalidadDesdeAudio(stemAudioUrl, { timeoutMs: 90_000 });
  console.log(`[Repertorio] Resultado tonalidad desde stem para ${songId}:`, resultado);
  if (!resultado) return null;

  const sb = getSupabase();
  const rawClean = (bandId || "").trim();
  const noPrefix = rawClean.replace(/^(band|reg)-/, "");
  const candidateIds = Array.from(new Set([
    rawClean,
    noPrefix,
    `band-${noPrefix}`,
    `reg-${noPrefix}`
  ])).filter(Boolean);

  const { error } = await sb
    .from("songs")
    .update({ tonalidad: resultado.tonalidad, tonalidad_detectada_en: new Date().toISOString() })
    .eq("id", songId)
    .in("band_id", candidateIds);
  if (error) throw new Error(`Supabase Error (guardar tonalidad desde stem): ${error.message}`);

  return { tonalidad: resultado.tonalidad };
}

/** Igual que `detectarYGuardarTonalidadDesdeStem`, pero sin bloquear al llamador ni propagar errores. */
function dispararDeteccionTonalidadDesdeStemEnSegundoPlano(songId: string, stemAudioUrl: string, bandId: string): void {
  detectarYGuardarTonalidadDesdeStem(songId, stemAudioUrl, bandId).catch((err) => {
    console.error(`[Repertorio] No se pudo redetectar la tonalidad desde el stem de la canción ${songId}:`, err?.message || err);
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
    bpmDetectadoEn: s.bpm_detectado_en || s.bpmDetectadoEn || undefined,
    bpm_detectado_en: s.bpm_detectado_en || s.bpmDetectadoEn || undefined,
    tonalidadDetectadaEn: s.tonalidad_detectada_en || s.tonalidadDetectadaEn || undefined,
    tonalidad_detectada_en: s.tonalidad_detectada_en || s.tonalidadDetectadaEn || undefined,
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
    energiaManual: Boolean(s.energia_manual ?? s.energiaManual ?? false),
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
    audioIdeas: (Array.isArray(s.audio_ideas) && s.audio_ideas.length > 0)
      ? s.audio_ideas
      : (Array.isArray(s.audioIdeas) && s.audioIdeas.length > 0)
        ? s.audioIdeas
        : (audioUrl ? [{
            id: `idea_${s.id}`,
            titulo: "Audio Oficial",
            seccion: "general" as const,
            audioUrl,
            subidoPor: "Sync",
            fecha: new Date().toISOString()
          }] : []),
    audio_ideas: (Array.isArray(s.audio_ideas) && s.audio_ideas.length > 0)
      ? s.audio_ideas
      : (Array.isArray(s.audioIdeas) && s.audioIdeas.length > 0)
        ? s.audioIdeas
        : [],
    cifradoTexto: s.cifrado_texto || s.cifradoTexto || "",
    cifrado_texto: s.cifrado_texto || s.cifradoTexto || "",
    guiaSustituto: s.guia_sustituto || s.guiaSustituto || {},
    guia_sustituto: s.guia_sustituto || s.guiaSustituto || {},
    estructuraDocumentoUrl: s.estructura_documento_url || s.estructuraDocumentoUrl || "",
    estructura_documento_url: s.estructura_documento_url || s.estructuraDocumentoUrl || "",
    estructuraDocumentoNombre: s.estructura_documento_nombre || s.estructuraDocumentoNombre || "",
    estructura_documento_nombre: s.estructura_documento_nombre || s.estructuraDocumentoNombre || "",
    estructuraDocumentoProcesadoEn: s.estructura_documento_procesado_en || s.estructuraDocumentoProcesadoEn || undefined,
    estructura_documento_procesado_en: s.estructura_documento_procesado_en || s.estructuraDocumentoProcesadoEn || undefined,
    estructuraVerificada: Boolean(s.estructura_verificada ?? s.estructuraVerificada),
    estructura_verificada: Boolean(s.estructura_verificada ?? s.estructuraVerificada)
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

  let songsData = data || [];

  // Auto-poblado si no hay canciones o si falta el catálogo inicial de Bakandeya
  if (songsData.length === 0 && (noPrefix === 'bakandeya' || noPrefix === '' || candidateIds.includes('band-bakandeya'))) {
    console.log(`[Repertorio] Auto-poblando catálogo de canciones iniciales de Bakandeya en Supabase...`);
    const seedTargetBandId = rawClean || 'band-bakandeya';
    try {
      for (const song of INITIAL_SONGS) {
        await dbUpsertSong(song, seedTargetBandId);
      }
      const { data: reFetched } = await sb
        .from("songs")
        .select("*")
        .in("band_id", candidateIds)
        .order("titulo", { ascending: true });
      if (reFetched && reFetched.length > 0) {
        songsData = reFetched;
      } else {
        return INITIAL_SONGS.map(mapSongRecord);
      }
    } catch (seedErr) {
      console.error("[Repertorio] Error auto-poblando canciones iniciales:", seedErr);
      return INITIAL_SONGS.map(mapSongRecord);
    }
  }

  return songsData.map(mapSongRecord);
}

// Para campos de texto libre que el usuario puede vaciar a propósito (cifrado_texto,
// notas_internas...): con `camelCase || snake_case || fallback`, borrar el campo (dejarlo en
// "") no se guarda nunca, porque "" es falsy y la expresión cae al valor viejo de snake_case.
// Aquí se distingue "el campo vino en el payload" (aunque sea "") de "no vino" con `!==
// undefined`, así un borrado intencional sí se respeta.
function preferClearableString(camelValue: any, snakeValue: any, fallback = ""): string {
  if (camelValue !== undefined && camelValue !== null) return camelValue;
  if (snakeValue !== undefined && snakeValue !== null) return snakeValue;
  return fallback;
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
  let existing: { id: string; band_id: string; audio_principal_url?: string; audio_ideas?: any[] } | null = null;
  if (finalSongId) {
    const { data } = await sb.from("songs").select("id, band_id, audio_principal_url, audio_ideas").eq("id", finalSongId).maybeSingle();
    existing = data;
    if (existing && existing.band_id !== targetBandId) {
      finalSongId = `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      existing = null;
    }
  }

  // Fusionar inteligentemente audio_ideas para NO perder pistas/stems extraídas previamente
  const existingIdeas = existing?.audio_ideas || [];
  let incomingIdeas = song.audioIdeas || song.audio_ideas;

  if ((!incomingIdeas || !Array.isArray(incomingIdeas) || incomingIdeas.length === 0) && existingIdeas.length > 0) {
    incomingIdeas = existingIdeas;
  } else if (Array.isArray(incomingIdeas) && existingIdeas.length > 0) {
    incomingIdeas = incomingIdeas.map((incIdea: any) => {
      const existingMatch = existingIdeas.find(
        (e: any) => e.id === incIdea.id || (e.titulo && e.titulo === incIdea.titulo)
      );
      if (existingMatch && (!incIdea.pistas || incIdea.pistas.length === 0) && existingMatch.pistas && existingMatch.pistas.length > 0) {
        return {
          ...incIdea,
          pistas: existingMatch.pistas
        };
      }
      return incIdea;
    });

    // Preservar cualquier idea previa que contenga stems/pistas si no venía en el payload entrante
    existingIdeas.forEach((e: any) => {
      if (e.pistas && e.pistas.length > 0) {
        const existsInIncoming = incomingIdeas.some((inc: any) => inc.id === e.id || inc.titulo === e.titulo);
        if (!existsInIncoming) {
          incomingIdeas.push(e);
        }
      }
    });
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
    // Prioridad camelCase > snake_case: los editores de la app (SongModal, MemberNotesModal...)
    // reciben la canción ya mapeada con AMBAS variantes (mapSongRecord duplica cada campo en
    // los dos formatos) y al guardar hacen `{...song, notasMiembros: nuevoValor}` — solo tocan
    // la clave camelCase, así que la snake_case se queda con el valor viejo. Antes esto
    // consultaba snake_case primero con `||`, que para strings vacíos ("") cuela por suerte al
    // ser falsy, pero para objetos/arrays (notas_miembros, notas_por_miembro, audio_ideas,
    // guia_sustituto) CUALQUIER objeto es truthy aunque esté "vacío" por dentro — el valor
    // viejo ganaba siempre y la nota por miembro no se guardaba nunca, ni reintentando.
    notas_internas: preferClearableString(song.notasInternas, song.notas_internas),
    notas_repertorio: preferClearableString(song.notasRepertorio, song.notas_repertorio),
    notas_miembros: song.notasMiembros || song.notas_miembros || {},
    notas_por_miembro: song.notasPorMiembro || song.notas_por_miembro || [],
    audio_principal_url: song.audioPrincipalUrl || song.audio_principal_url || song.audioUrl || song.audio_url || "",
    audio_ideas: incomingIdeas || [],
    cifrado_texto: preferClearableString(song.cifradoTexto, song.cifrado_texto),
    guia_sustituto: song.guiaSustituto || song.guia_sustituto || {},
    enlace_acordes: preferClearableString(song.enlaceAcordes, song.enlace_acordes),
    estructura_documento_url: preferClearableString(song.estructuraDocumentoUrl, song.estructura_documento_url),
    estructura_documento_nombre: preferClearableString(song.estructuraDocumentoNombre, song.estructura_documento_nombre),
    estructura_documento_procesado_en: song.estructuraDocumentoProcesadoEn || song.estructura_documento_procesado_en || null,
    estructura_verificada: Boolean(song.estructuraVerificada ?? song.estructura_verificada)
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

  // Si este guardado trae una pista recién separada por Iris (bajo, arreglos...), aprovechar
  // para redetectar la tonalidad con esa señal más limpia — independiente de si cambió el audio
  // principal, porque separar pistas no lo toca.
  const stemNuevoParaTonalidad = encontrarMejorStemNuevoParaTonalidad(existingIdeas, incomingIdeas);
  if (stemNuevoParaTonalidad) {
    dispararDeteccionTonalidadDesdeStemEnSegundoPlano(finalSongId, stemNuevoParaTonalidad, targetBandId);
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

  let setlistData = data || [];

  if (setlistData.length === 0 && (noPrefix === 'bakandeya' || noPrefix === '' || candidateIds.includes('band-bakandeya'))) {
    console.log(`[Repertorio] Auto-poblando setlists iniciales de Bakandeya en Supabase...`);
    const seedTargetBandId = rawClean || 'band-bakandeya';
    try {
      for (const setlist of INITIAL_SETLISTS) {
        await dbUpsertSetlist(setlist, seedTargetBandId);
      }
      const { data: reFetched } = await sb
        .from("setlists")
        .select("*")
        .in("band_id", candidateIds)
        .order("fecha_ultima_edicion", { ascending: false });
      if (reFetched && reFetched.length > 0) {
        setlistData = reFetched;
      } else {
        return INITIAL_SETLISTS.map(sl => ({ ...sl, items: sl.items || [] }));
      }
    } catch (seedErr) {
      console.error("[Repertorio] Error auto-poblando setlists iniciales:", seedErr);
      return INITIAL_SETLISTS.map(sl => ({ ...sl, items: sl.items || [] }));
    }
  }

  return setlistData.map(sl => ({
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
    items: setlist.items || [],
    ...(setlist.ai_analysis_json && { ai_analysis_json: setlist.ai_analysis_json }),
    ...(setlist.ai_analysis_generated_at && { ai_analysis_generated_at: setlist.ai_analysis_generated_at })
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
function isMissingTableOrColumnError(error: any): boolean {
  if (!error) return false;
  const msg = String(error.message || '').toLowerCase();
  return (
    error.code === '42P01' ||
    msg.includes("could not find the table") ||
    msg.includes("schema cache") ||
    (msg.includes("relation") && msg.includes("does not exist"))
  );
}

export async function dbGetSetlistShortcuts(bandId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("setlist_shortcuts")
    .select("*")
    .eq("band_id", cleanBandId(bandId))
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingTableOrColumnError(error)) {
      console.warn(`[Supabase] Tabla 'setlist_shortcuts' no encontrada aún en el schema cache. Devolviendo lista vacía.`);
      return [];
    }
    throw new Error(`Supabase Error (setlist_shortcuts): ${error.message}`);
  }
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
  if (error) {
    if (isMissingTableOrColumnError(error)) {
      console.warn(`[Supabase] Tabla 'setlist_shortcuts' no disponible al guardar atajo. Continuando con datos en memoria.`);
      return {
        id: payload.id,
        band_id: payload.band_id,
        icono: payload.icono,
        etiqueta: payload.etiqueta,
        tituloCustom: payload.titulo_custom,
        duracionEstimadaMinutos: payload.duracion_estimada_minutos,
        duracionEstimadaSegundos: payload.duracion_estimada_segundos,
        notaTema: payload.nota_tema || ""
      };
    }
    throw new Error(`Supabase Error (upsert setlist_shortcut): ${error.message}`);
  }
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
  if (error) {
    if (isMissingTableOrColumnError(error)) {
      return true;
    }
    throw new Error(`Supabase Error (delete setlist_shortcut): ${error.message}`);
  }
  return true;
}

// --- EPK CONFIGS ---
