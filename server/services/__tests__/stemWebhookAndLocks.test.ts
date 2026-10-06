import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";
import { verifyReplicateWebhook } from "../stemPredictionReconciler.js";
import { acquireStemsSeparationLock, waitForStemsCompletion, saveStemsToPersistentCache, stemsMemoryCache } from "../../db/stemsCache.js";
import { stemStorageRetryManager } from "../stemStorageRetryQueue.js";
import { esIpPrivadaOReservada, crearAgenteIpPinneada } from "../../utils/ssrfGuard.js";

describe("Point 1: Replicate Official Webhook Verification Specification", () => {
  // Secreto de ejemplo oficial en formato whsec_ con clave base64
  const secretBytes = crypto.randomBytes(32);
  const base64Secret = secretBytes.toString("base64");
  const testSecret = `whsec_${base64Secret}`;

  it("debe validar exitosamente un webhook legítimo de Replicate con cabeceras oficiales", () => {
    const webhookId = "msg_2X9Q4abc123";
    const currentTs = Math.floor(Date.now() / 1000);
    const rawBody = JSON.stringify({
      id: "pred_demucs_998877",
      status: "succeeded",
      output: {
        vocals: "https://replicate.delivery/vocals.wav",
        drums: "https://replicate.delivery/drums.wav"
      }
    });

    const payloadToSign = `${webhookId}.${currentTs}.${rawBody}`;
    const expectedSig = crypto.createHmac("sha256", secretBytes).update(payloadToSign).digest("base64");
    const signatureHeader = `v1,${expectedSig}`;

    const res = verifyReplicateWebhook(
      rawBody,
      {
        id: webhookId,
        timestamp: currentTs.toString(),
        signature: signatureHeader
      },
      testSecret
    );

    expect(res.valid).toBe(true);
  });

  it("debe aceptar la firma cuando el webhook trae múltiples firmas separadas por espacios", () => {
    const webhookId = "msg_3Y8P5xyz456";
    const currentTs = Math.floor(Date.now() / 1000);
    const rawBody = '{"id":"pred_test_123"}';

    const payloadToSign = `${webhookId}.${currentTs}.${rawBody}`;
    const expectedSig = crypto.createHmac("sha256", secretBytes).update(payloadToSign).digest("base64");
    // Simulando rotación de claves con dos firmas
    const signatureHeader = `v1,oldInvalidSigBase64== v1,${expectedSig}`;

    const res = verifyReplicateWebhook(
      rawBody,
      {
        id: webhookId,
        timestamp: currentTs.toString(),
        signature: signatureHeader
      },
      testSecret
    );

    expect(res.valid).toBe(true);
  });

  it("debe rechazar un webhook con timestamp caducado (mitigación Replay Attack)", () => {
    const webhookId = "msg_replay_attack";
    const oldTs = Math.floor(Date.now() / 1000) - 600; // 10 minutos en el pasado
    const rawBody = '{"id":"pred_replay_1"}';

    const payloadToSign = `${webhookId}.${oldTs}.${rawBody}`;
    const expectedSig = crypto.createHmac("sha256", secretBytes).update(payloadToSign).digest("base64");

    const res = verifyReplicateWebhook(
      rawBody,
      {
        id: webhookId,
        timestamp: oldTs.toString(),
        signature: `v1,${expectedSig}`
      },
      testSecret,
      300 // tolerancia de 5 minutos
    );

    expect(res.valid).toBe(false);
    expect(res.reason).toContain("outside tolerance window");
  });

  it("debe rechazar si la firma HMAC no coincide", () => {
    const webhookId = "msg_tampered";
    const currentTs = Math.floor(Date.now() / 1000);
    const rawBody = '{"id":"pred_tampered"}';

    const res = verifyReplicateWebhook(
      rawBody,
      {
        id: webhookId,
        timestamp: currentTs.toString(),
        signature: "v1,dGhpcyBpcyBhIGZha2Ugc2lnbmF0dXJl"
      },
      testSecret
    );

    expect(res.valid).toBe(false);
    expect(res.reason).toBe("No signature matched");
  });

  it("debe rechazar inmediatamente si REPLICATE_WEBHOOK_SECRET no está configurado (Fail-Closed)", () => {
    const webhookId = "msg_no_secret";
    const currentTs = Math.floor(Date.now() / 1000);
    const rawBody = '{"id":"pred_fail_closed"}';

    // Llamada con secret undefined
    const res = verifyReplicateWebhook(
      rawBody,
      {
        id: webhookId,
        timestamp: currentTs.toString(),
        signature: "v1,some_sig"
      },
      undefined
    );

    expect(res.valid).toBe(false);
    expect(res.reason).toBe("No signing secret configured");
  });
});

describe("Point 2: Distributed Reservation Lock across Multi-Instances", () => {
  // Simulador en memoria de tabla Supabase PostgreSQL para aislamiento de tests unitarios
  let mockDbRows: any[] = [];
  let simulateDbError: boolean = false;

  beforeEach(async () => {
    stemsMemoryCache.clear();
    mockDbRows = [];
    simulateDbError = false;

    // Mockeamos la capa getSupabase para simular la base de datos distribuida con restricciones de unicidad
    vi.spyOn(await import("../../db/core.js"), "getSupabase").mockImplementation(() => {
      return {
        from: (table: string) => {
          if (table !== "song_stems_cache") {
            return {
              upsert: async () => ({ error: null }),
              select: () => ({ eq: () => ({ order: () => ({ limit: async () => ({ data: [], error: null }) }) }) })
            } as any;
          }
          return {
            select: () => ({
              eq: (col1: string, val1: any) => ({
                eq: (col2: string, val2: any) => ({
                  eq: (col3: string, val3: any) => ({
                    maybeSingle: async () => {
                      if (simulateDbError) {
                        return { data: null, error: { message: "DB connection timeout", code: "57P01" } };
                      }
                      const match = mockDbRows.find(
                        r => r.band_id === val1 && r.song_hash === val2 && r.engine === val3
                      );
                      return { data: match || null, error: null };
                    }
                  })
                })
              })
            }),
            insert: async (row: any) => {
              if (simulateDbError) {
                return { data: null, error: { message: "Could not find the 'locked_at' column of 'song_stems_cache' in the schema cache", code: "PGRST204" } };
              }
              const exists = mockDbRows.some(
                r => r.band_id === row.band_id && r.song_hash === row.song_hash && r.engine === row.engine
              );
              if (exists) {
                return { data: null, error: { code: "23505", message: "duplicate key value violates unique constraint" } };
              }
              mockDbRows.push({ ...row });
              return { data: row, error: null };
            },
            update: (updateFields: any) => ({
              eq: (col1: string, val1: any) => ({
                eq: (col2: string, val2: any) => ({
                  eq: async (col3: string, val3: any) => {
                    if (simulateDbError) {
                      return { error: { message: "DB update error", code: "500" } };
                    }
                    const idx = mockDbRows.findIndex(
                      r => r.band_id === val1 && r.song_hash === val2 && r.engine === val3
                    );
                    if (idx >= 0) {
                      mockDbRows[idx] = { ...mockDbRows[idx], ...updateFields };
                    }
                    return { error: null };
                  }
                })
              })
            }),
            upsert: async (row: any) => {
              if (simulateDbError) {
                return { data: null, error: { message: "DB upsert error", code: "500" } };
              }
              const idx = mockDbRows.findIndex(
                r => r.band_id === row.band_id && r.song_hash === row.song_hash && r.engine === row.engine
              );
              if (idx >= 0) {
                mockDbRows[idx] = { ...mockDbRows[idx], ...row };
              } else {
                mockDbRows.push({ ...row });
              }
              return { data: row, error: null };
            }
          } as any;
        }
      } as any;
    });
  });

  it("simula dos instancias concurrentes donde solo una adquiere el lock de GPU y la segunda sincroniza el resultado", async () => {
    const bandId = "band_test_concurrency";
    const songHash = "hash_song_12345";
    const engine = "mel-roformer";

    // Instancia 1 adquiere el bloqueo
    const lockInst1 = await acquireStemsSeparationLock(bandId, songHash, engine, "railway_instance_1");
    expect(lockInst1.acquired).toBe(true);

    // Limpiamos la caché L1 local para simular la perspectiva de una SEGUNDA instancia física de Railway
    stemsMemoryCache.clear();

    // Instancia 2 intenta procesar la misma canción simultáneamente
    const lockInst2 = await acquireStemsSeparationLock(bandId, songHash, engine, "railway_instance_2");
    
    // Instancia 2 no adquiere el lock para evitar gasto doble de GPU
    expect(lockInst2.acquired).toBe(false);
    if (!lockInst2.acquired) {
      expect(lockInst2.reason).toBe("in_progress_by_other_instance");
    }

    // Instancia 1 completa la inferencia y guarda los stems en la caché persistente
    await saveStemsToPersistentCache({
      bandId,
      songHash,
      engine,
      engineUsed: "mel-roformer",
      isNeural: true,
      degraded: false,
      stemsMap: {
        vocals: { url: "https://storage.supabase.co/stems/vocal.mp3", formato: "MP3", tamano: "3.2 MB" },
        drums: { url: "https://storage.supabase.co/stems/drums.mp3", formato: "MP3", tamano: "2.8 MB" }
      }
    });

    // Limpiamos L1 para simular una TERCERA instancia física consultando
    stemsMemoryCache.clear();

    // Ahora una nueva consulta o polling devuelve el resultado completado
    const checkAfterComplete = await acquireStemsSeparationLock(bandId, songHash, engine, "railway_instance_3");
    expect(checkAfterComplete.acquired).toBe(false);
    if (!checkAfterComplete.acquired) {
      expect(checkAfterComplete.reason).toBe("already_completed");
      expect((checkAfterComplete as any).record.stemsMap.vocals.url).toBe("https://storage.supabase.co/stems/vocal.mp3");
    }
  });

  it("emite alerta estructurada y devuelve distributed_lock_failed si falla Supabase por error no recuperable (Sin caídas en silencio)", async () => {
    const bandId = "band_test_err";
    const songHash = "hash_song_err";
    const engine = "mel-roformer";

    simulateDbError = true;
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const lockResult = await acquireStemsSeparationLock(bandId, songHash, engine, "railway_instance_err");

    // NO debe caer a bloqueo local silencioso:
    expect(lockResult.acquired).toBe(false);
    if (!lockResult.acquired) {
      expect(lockResult.reason).toBe("distributed_lock_failed");
      expect((lockResult as any).error).toContain("Could not find the 'locked_at' column");
    }

    // Comprobar que emitió la alerta estructurada esperada
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[STEM_DISTRIBUTED_LOCK_FAILED_ALERT]")
    );

    consoleErrorSpy.mockRestore();
  });
});

describe("Point 3: Storage Retry Queue Persistence", () => {
  it("encola stems para reintento con backoff y estructura persistible", () => {
    const queueId = stemStorageRetryManager.enqueue(
      "/tmp/test_stem.mp3",
      "stems/band_1/test_stem.mp3",
      "band_1",
      "audio/mpeg",
      5
    );

    expect(queueId).toMatch(/^retry_/);
    expect(stemStorageRetryManager.getQueueLength()).toBeGreaterThanOrEqual(1);
  });
});

describe("Point 4: SSRF & Anti-TOCTOU IP Pinning", () => {
  it("detecta y bloquea rangos de IP privadas y de metadatos cloud (169.254.169.254, 127.0.0.1, 10.x, 172.16.x)", () => {
    expect(esIpPrivadaOReservada("127.0.0.1")).toBe(true);
    expect(esIpPrivadaOReservada("169.254.169.254")).toBe(true);
    expect(esIpPrivadaOReservada("10.0.0.1")).toBe(true);
    expect(esIpPrivadaOReservada("172.20.0.1")).toBe(true);
    expect(esIpPrivadaOReservada("192.168.1.1")).toBe(true);
    expect(esIpPrivadaOReservada("::1")).toBe(true);
    expect(esIpPrivadaOReservada("fe80::1")).toBe(true);

    // IPs públicas legítimas
    expect(esIpPrivadaOReservada("8.8.8.8")).toBe(false);
    expect(esIpPrivadaOReservada("1.1.1.1")).toBe(false);
  });

  it("crea un agente HTTP/HTTPS con IP pinning para interceptar el lookup y fijar la conexión a la IP validada", () => {
    const agent = crearAgenteIpPinneada("93.184.216.34", true);
    expect(agent).toBeDefined();
  });
});
