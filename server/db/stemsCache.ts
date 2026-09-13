import { getSupabase } from "./core.js";

export interface StemsCacheRecord {
  bandId: string;
  songHash: string;
  engine: string;
  engineUsed: string;
  status?: 'pending' | 'completed' | 'failed';
  isNeural: boolean;
  degraded: boolean;
  degradedReason?: string;
  stemsMap: Record<string, { url: string; formato: string; tamano: string }>;
  timingBreakdown?: any;
  audioUrl?: string;
  songTitle?: string;
  createdAt?: string;
  updatedAt?: string;
  lockedAt?: string;
  lockedBy?: string;
}

// In-memory fast layer
export const stemsMemoryCache = new Map<string, StemsCacheRecord>();

const LOCK_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutos para declarar un pending como abandonado

/**
 * Consulta la caché de stems con estrategia de dos capas:
 * 1. Capa L1 (Memoria RAM): Devuelve en < 1ms.
 * 2. Capa L2 (Supabase PostgreSQL): Persistente entre reinicios y multi-instancia en Railway.
 */
export async function getStemsFromPersistentCache(
  bandId: string,
  songHash: string,
  selectedEngine: string
): Promise<StemsCacheRecord | null> {
  const cacheKey = `${bandId}:${songHash}:${selectedEngine}`;

  // 1. Capa L1: Memoria rápida
  if (stemsMemoryCache.has(cacheKey)) {
    const memoryHit = stemsMemoryCache.get(cacheKey)!;
    if ((!memoryHit.status || memoryHit.status === 'completed') && memoryHit.stemsMap && Object.keys(memoryHit.stemsMap).length > 0) {
      console.log(`[Stems Cache] ⚡ L1 Memory HIT para ${cacheKey}`);
      return memoryHit;
    }
  }

  // 2. Capa L2: Supabase (Única Fuente de Verdad permanente)
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("song_stems_cache")
      .select("*")
      .eq("band_id", bandId)
      .eq("song_hash", songHash)
      .eq("engine", selectedEngine)
      .maybeSingle();

    if (!error && data && (data.status === 'completed' || !data.status) && data.stems_map && Object.keys(data.stems_map).length > 0) {
      const record: StemsCacheRecord = {
        bandId: data.band_id,
        songHash: data.song_hash,
        engine: data.engine,
        engineUsed: data.engine_used || data.engine,
        status: 'completed',
        isNeural: Boolean(data.is_neural),
        degraded: Boolean(data.degraded),
        degradedReason: data.degraded_reason || undefined,
        stemsMap: data.stems_map,
        timingBreakdown: data.timing_breakdown || {},
        audioUrl: data.audio_url,
        songTitle: data.song_title,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      // Hidratar L1 para subsiguientes lecturas
      stemsMemoryCache.set(cacheKey, record);
      console.log(`[Stems Cache] 💾 L2 Supabase HIT para ${cacheKey}. Hidratada caché en memoria.`);
      return record;
    }
  } catch (dbErr: any) {
    // Si la tabla no está creada aún o hay fallo de red, se degrada a L1 sin bloquear
    console.warn(`[Stems Cache] Aviso consultando L2 Supabase: ${dbErr?.message || dbErr}`);
  }

  return null;
}

export type LockAcquireResult = 
  | { acquired: true }
  | { acquired: false; reason: 'already_completed'; record: StemsCacheRecord }
  | { acquired: false; reason: 'in_progress_by_other_instance' }
  | { acquired: false; reason: 'distributed_lock_failed'; error: string };

/**
 * Patrón de Reserva Distribuida Anti-Carreras Multi-Instancia:
 * Intenta reservar el procesamiento de la pista en Supabase antes de lanzar la GPU.
 */
export async function acquireStemsSeparationLock(
  bandId: string,
  songHash: string,
  engine: string,
  instanceId: string = `instance_${process.pid}_${Math.random().toString(36).substring(2, 7)}`
): Promise<LockAcquireResult> {
  const cacheKey = `${bandId}:${songHash}:${engine}`;
  const nowIso = new Date().toISOString();

  // 1. Verificación previa en L1
  const memExisting = stemsMemoryCache.get(cacheKey);
  if (memExisting) {
    if (memExisting.status === 'completed' && memExisting.stemsMap && Object.keys(memExisting.stemsMap).length > 0) {
      return {
        acquired: false,
        reason: 'already_completed',
        record: memExisting
      };
    }
    if (memExisting.status === 'pending') {
      const lockedAt = (memExisting as any).locked_at ? new Date((memExisting as any).locked_at).getTime() : 0;
      const isStale = Date.now() - lockedAt > LOCK_TIMEOUT_MS;
      if (!isStale && (memExisting as any).locked_by && (memExisting as any).locked_by !== instanceId) {
        return {
          acquired: false,
          reason: 'in_progress_by_other_instance'
        };
      }
    }
  }

  try {
    const sb = getSupabase();

    // 2. Comprobar si ya existe fila en Supabase
    const { data: existing, error: selectErr } = await sb
      .from("song_stems_cache")
      .select("*")
      .eq("band_id", bandId)
      .eq("song_hash", songHash)
      .eq("engine", engine)
      .maybeSingle();

    if (!selectErr && existing) {
      if ((existing.status === 'completed' || !existing.status) && existing.stems_map && Object.keys(existing.stems_map).length > 0) {
        const completedRecord: StemsCacheRecord = {
          bandId: existing.band_id,
          songHash: existing.song_hash,
          engine: existing.engine,
          engineUsed: existing.engine_used,
          status: 'completed',
          isNeural: existing.is_neural,
          degraded: existing.degraded,
          degradedReason: existing.degraded_reason,
          stemsMap: existing.stems_map,
          timingBreakdown: existing.timing_breakdown,
          audioUrl: existing.audio_url,
          songTitle: existing.song_title,
          createdAt: existing.created_at
        };
        stemsMemoryCache.set(cacheKey, completedRecord);
        return {
          acquired: false,
          reason: 'already_completed',
          record: completedRecord
        };
      }

      if (existing.status === 'pending') {
        const lockedAt = existing.locked_at ? new Date(existing.locked_at).getTime() : 0;
        const isStale = Date.now() - lockedAt > LOCK_TIMEOUT_MS;

        if (isStale) {
          // Reclamar trabajo abandonado
          console.warn(`[Stems Lock] ⚠️ Reclamando trabajo pendiente abandonado por timeout para ${cacheKey} (bloqueado por: ${existing.locked_by})`);
          await sb
            .from("song_stems_cache")
            .update({
              status: 'pending',
              locked_at: nowIso,
              locked_by: instanceId,
              updated_at: nowIso
            })
            .eq("band_id", bandId)
            .eq("song_hash", songHash)
            .eq("engine", engine);
          
          stemsMemoryCache.set(cacheKey, {
            bandId,
            songHash,
            engine,
            status: 'pending',
            locked_at: nowIso,
            locked_by: instanceId,
            stemsMap: {},
            createdAt: nowIso
          } as any);
          return { acquired: true };
        }

        // Bloqueo activo en otra instancia
        console.log(`[Stems Lock] ⏳ Trabajo ya en progreso en otra instancia (${existing.locked_by}) para ${cacheKey}`);
        stemsMemoryCache.set(cacheKey, {
          bandId,
          songHash,
          engine,
          status: 'pending',
          locked_at: existing.locked_at || nowIso,
          locked_by: existing.locked_by,
          stemsMap: {},
          createdAt: existing.created_at || nowIso
        } as any);
        return { acquired: false, reason: 'in_progress_by_other_instance' };
      }
    }

    // 3. Intentar INSERT en estado pending
    const { error: insertErr } = await sb
      .from("song_stems_cache")
      .insert({
        band_id: bandId,
        song_hash: songHash,
        engine,
        engine_used: engine,
        status: 'pending',
        locked_at: nowIso,
        locked_by: instanceId,
        stems_map: {},
        created_at: nowIso,
        updated_at: nowIso
      });

    if (!insertErr) {
      console.log(`[Stems Lock] 🔒 Bloqueo reservado exitosamente para inferencia en ${cacheKey} (Instancia: ${instanceId})`);
      stemsMemoryCache.set(cacheKey, {
        bandId,
        songHash,
        engine,
        status: 'pending',
        locked_at: nowIso,
        locked_by: instanceId,
        stemsMap: {},
        createdAt: nowIso
      } as any);
      return { acquired: true };
    }

    // Comprobar si es un conflicto de unicidad real (Postgres 23505 / duplicate key)
    const isConflict = insertErr.code === '23505' || 
      insertErr.message?.toLowerCase().includes('duplicate key') || 
      insertErr.message?.toLowerCase().includes('unique');

    if (isConflict) {
      console.log(`[Stems Lock] ⏳ Conflicto de unicidad detectado: otra instancia ya reservó ${cacheKey}`);
      return { acquired: false, reason: 'in_progress_by_other_instance' };
    }

    // Error real en Supabase (ej. columnas no migradas, fallo de red o permisos): ALERTA ESTRUCTURADA
    console.error(`[STEM_DISTRIBUTED_LOCK_FAILED_ALERT] 🚨 ALERTA CRÍTICA: Fallo en la reserva distribuida en Supabase para ${cacheKey}. Causa: ${insertErr.message} (Código: ${insertErr.code || 'N/A'}). No se puede garantizar el bloqueo multi-instancia.`);
    return {
      acquired: false,
      reason: 'distributed_lock_failed',
      error: insertErr.message
    };
  } catch (err: any) {
    console.error(`[STEM_DISTRIBUTED_LOCK_FAILED_ALERT] 🚨 ALERTA CRÍTICA: Excepción en reserva distribuida para ${cacheKey}: ${err?.message || err}`);
    return {
      acquired: false,
      reason: 'distributed_lock_failed',
      error: err?.message || String(err)
    };
  }
}

/**
 * Espera (polling corto) a que la instancia propietaria termine la inferencia y guarde en Supabase.
 */
export async function waitForStemsCompletion(
  bandId: string,
  songHash: string,
  engine: string,
  maxWaitMs: number = 180000,
  pollIntervalMs: number = 1500
): Promise<StemsCacheRecord | null> {
  const startTime = Date.now();
  const cacheKey = `${bandId}:${songHash}:${engine}`;

  while (Date.now() - startTime < maxWaitMs) {
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

    const cached = await getStemsFromPersistentCache(bandId, songHash, engine);
    if (cached && cached.status === 'completed') {
      console.log(`[Stems Lock] ✅ Polling completado: resultado obtenido de la otra instancia para ${cacheKey}`);
      return cached;
    }
  }

  console.warn(`[Stems Lock] ⏱️ Timeout esperando resultado de otra instancia para ${cacheKey}`);
  return null;
}

/**
 * Guarda los stems generados tanto en L1 (memoria) como en L2 (Supabase).
 */
export async function saveStemsToPersistentCache(record: StemsCacheRecord): Promise<void> {
  const cacheKey = `${record.bandId}:${record.songHash}:${record.engine}`;
  const nowIso = new Date().toISOString();

  // 1. Guardar en L1
  stemsMemoryCache.set(cacheKey, { ...record, status: 'completed' });

  // 2. Guardar en L2 (Supabase)
  try {
    const sb = getSupabase();
    await sb
      .from("song_stems_cache")
      .upsert({
        band_id: record.bandId,
        song_hash: record.songHash,
        engine: record.engine,
        engine_used: record.engineUsed,
        status: 'completed',
        is_neural: record.isNeural,
        degraded: record.degraded,
        degraded_reason: record.degradedReason || null,
        stems_map: record.stemsMap,
        timing_breakdown: record.timingBreakdown || {},
        audio_url: record.audioUrl || null,
        song_title: record.songTitle || null,
        created_at: record.createdAt || nowIso,
        updated_at: nowIso
      }, { onConflict: "band_id,song_hash,engine" });
    
    console.log(`[Stems Cache] 💾 Guardado persistente L2 en Supabase para ${cacheKey}`);
  } catch (dbErr: any) {
    console.warn(`[Stems Cache] No se pudo persistir en Supabase (L1 preservada): ${dbErr?.message || dbErr}`);
  }
}

/**
 * Marca el job como fallido en caso de error crítico durante la inferencia para liberar bloqueos.
 */
export async function markStemsSeparationFailed(
  bandId: string,
  songHash: string,
  engine: string,
  errorMessage: string
): Promise<void> {
  try {
    const sb = getSupabase();
    await sb
      .from("song_stems_cache")
      .update({
        status: 'failed',
        degraded_reason: errorMessage,
        updated_at: new Date().toISOString()
      })
      .eq("band_id", bandId)
      .eq("song_hash", songHash)
      .eq("engine", engine);
  } catch (e) {
    // Ignorar error al marcar fallo
  }
}
