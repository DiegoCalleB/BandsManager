import fs from "fs";
import path from "path";
import { uploadBufferToSupabase } from "../utils/storage.js";
import { getSupabase } from "../db/core.js";

export interface PendingStemUpload {
  id: string;
  filePath: string;
  storageSubPath: string;
  mimeType: string;
  bandId: string;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: number;
  createdAt: number;
  lastError?: string;
  status?: 'pending' | 'completed' | 'exhausted';
}

class StemStorageRetryManager {
  private queue: Map<string, PendingStemUpload> = new Map();
  private isProcessing = false;
  private timer: NodeJS.Timeout | null = null;
  private initialized = false;

  constructor() {
    // Iniciar worker en segundo plano (revisar cada 60s si hay stems pendientes de reintento)
    this.timer = setInterval(() => this.processQueue(), 60_000);
    if (this.timer.unref) this.timer.unref();
  }

  /**
   * Rehidrata los reintentos pendientes desde la base de datos Supabase tras un reinicio de Railway.
   */
  public async initFromDatabase(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const sb = getSupabase();
      const { data, error } = await sb
        .from("stem_storage_retry_queue")
        .select("*")
        .eq("status", "pending");

      if (!error && data && data.length > 0) {
        let restoredCount = 0;
        for (const row of data) {
          if (!this.queue.has(row.id)) {
            this.queue.set(row.id, {
              id: row.id,
              filePath: row.file_path,
              storageSubPath: row.storage_sub_path,
              mimeType: row.mime_type || "audio/mpeg",
              bandId: row.band_id,
              attempts: row.attempts || 0,
              maxAttempts: row.max_attempts || 5,
              nextRetryAt: Number(row.next_retry_at) || Date.now(),
              createdAt: Number(row.created_at) || Date.now(),
              lastError: row.last_error,
              status: 'pending'
            });
            restoredCount++;
          }
        }
        console.log(`[Stem Storage Queue] 🔄 Rehidratados ${restoredCount} reintentos pendientes desde Supabase tras reinicio.`);
      }
    } catch (err: any) {
      console.warn(`[Stem Storage Queue] Aviso rehidratando cola desde Supabase: ${err?.message || err}`);
    }
  }

  /**
   * Encola un stem que falló en subirse directamente a Supabase Storage y persiste en Supabase.
   */
  public enqueue(
    filePath: string,
    storageSubPath: string,
    bandId: string,
    mimeType = "audio/mpeg",
    maxAttempts = 5
  ): string {
    const id = `retry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();
    const pending: PendingStemUpload = {
      id,
      filePath,
      storageSubPath,
      mimeType,
      bandId,
      attempts: 0,
      maxAttempts,
      nextRetryAt: now + 2000, // 2s inicial
      createdAt: now,
      status: 'pending'
    };

    this.queue.set(id, pending);

    // Persistir de forma asíncrona en Supabase
    (async () => {
      try {
        const sb = getSupabase();
        await sb.from("stem_storage_retry_queue").upsert({
          id,
          file_path: filePath,
          storage_sub_path: storageSubPath,
          mime_type: mimeType,
          band_id: bandId,
          attempts: 0,
          max_attempts: maxAttempts,
          next_retry_at: pending.nextRetryAt,
          created_at: now,
          status: 'pending'
        });
      } catch (err: any) {
        console.warn(`[Stem Storage Queue] Aviso persistiendo reintento en Supabase: ${err?.message || err}`);
      }
    })();

    console.warn(`[Stem Storage Queue] ⚠️ Encolado stem para reintento con backoff hacia Supabase: ${storageSubPath} (ID: ${id})`);
    return id;
  }

  /**
   * Procesa la cola de reintentos con backoff exponencial y sincronización con Supabase.
   */
  public async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.size === 0) return;
    this.isProcessing = true;

    const now = Date.now();
    for (const [id, item] of this.queue.entries()) {
      if (now < item.nextRetryAt) continue;

      item.attempts += 1;
      try {
        if (!fs.existsSync(item.filePath)) {
          console.error(`[Stem Storage Queue] ❌ Archivo temporal no encontrado en tránsito: ${item.filePath}`);
          this.queue.delete(id);
          this.updateDbStatus(id, 'exhausted', 'Archivo local no encontrado');
          continue;
        }

        const buffer = fs.readFileSync(item.filePath);
        const uploadedUrl = await uploadBufferToSupabase(buffer, item.storageSubPath, item.mimeType);

        if (uploadedUrl) {
          console.log(`[Stem Storage Queue] ✅ Reintento exitoso (intento ${item.attempts}/${item.maxAttempts}) subido a Supabase: ${uploadedUrl}`);
          this.queue.delete(id);
          this.updateDbStatus(id, 'completed');
          // Opcional: limpieza del archivo temporal de tránsito
          try {
            if (fs.existsSync(item.filePath)) {
              fs.unlinkSync(item.filePath);
            }
          } catch (e) {
            // Ignorar fallo de borrado local
          }
          continue;
        }

        throw new Error("Supabase devolvió null o URL inválida");
      } catch (err: any) {
        item.lastError = err?.message || String(err);
        if (item.attempts >= item.maxAttempts) {
          console.error(`[STEM_STORAGE_EXHAUSTED_ALERT] 🚨 ALERTA CRÍTICA: Se agotaron los ${item.maxAttempts} reintentos de subida a Supabase para ${item.storageSubPath}. Error: ${item.lastError}`);
          this.queue.delete(id);
          this.updateDbStatus(id, 'exhausted', item.lastError);
        } else {
          // Backoff exponencial: 2s, 4s, 8s, 16s, 32s...
          const backoffDelay = Math.min(2000 * Math.pow(2, item.attempts), 60000);
          item.nextRetryAt = Date.now() + backoffDelay;
          console.warn(`[Stem Storage Queue] ⏳ Reintento ${item.attempts} falló para ${item.storageSubPath}. Próximo intento en ${backoffDelay / 1000}s. Error: ${item.lastError}`);
          this.updateDbRetry(item);
        }
      }
    }

    this.isProcessing = false;
  }

  private async updateDbStatus(id: string, status: 'completed' | 'exhausted', error?: string): Promise<void> {
    try {
      const sb = getSupabase();
      await sb.from("stem_storage_retry_queue").update({
        status,
        last_error: error || null,
        updated_at: new Date().toISOString()
      }).eq("id", id);
    } catch {}
  }

  private async updateDbRetry(item: PendingStemUpload): Promise<void> {
    try {
      const sb = getSupabase();
      await sb.from("stem_storage_retry_queue").update({
        attempts: item.attempts,
        next_retry_at: item.nextRetryAt,
        last_error: item.lastError || null,
        updated_at: new Date().toISOString()
      }).eq("id", item.id);
    } catch {}
  }

  public getQueueLength(): number {
    return this.queue.size;
  }

  public clear(): void {
    this.queue.clear();
  }
}

export const stemStorageRetryManager = new StemStorageRetryManager();

// Rehidratar automáticamente
setTimeout(() => {
  stemStorageRetryManager.initFromDatabase().catch(() => {});
}, 1000);
