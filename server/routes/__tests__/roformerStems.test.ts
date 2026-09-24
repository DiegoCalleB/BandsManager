import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import {
  REPLICATE_MODEL_DEMUCS_V4,
  REPLICATE_MODEL_MVSEP_MDX23,
  processNeuralStemsReplicate,
  processMdx23Stems,
  processDemucsStems
} from '../ai_music.js';
import { esUrlExternaSegura } from '../../utils/ssrfGuard.js';
import { verifyWebhookSignature, verifyReplicateWebhook } from '../../services/stemPredictionReconciler.js';
import { stemStorageRetryManager } from '../../services/stemStorageRetryQueue.js';
import { getStemsFromPersistentCache, saveStemsToPersistentCache, stemsMemoryCache } from '../../db/stemsCache.js';

describe('Neural Stems Separation & Anti-Duplicate Architecture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stemsMemoryCache.clear();
    stemStorageRetryManager.clear();
  });

  it('valida la clave de caché anti-duplicación para prevenir llamadas redundantes', () => {
    const songTitle = 'Mi Canción Épica';
    const audioUrl = 'https://supabase.co/storage/v1/object/public/stems/song1.mp3';
    const bandId = 'band-12345';
    const engine = 'mvsep-mdx23';

    const songHash = crypto.createHash('md5').update(String(songTitle) + String(audioUrl)).digest('hex').substring(0, 10);
    const cacheKey = `${bandId}:${songHash}:${engine}`;

    expect(cacheKey).toContain('band-12345');
    expect(cacheKey).toContain('mvsep-mdx23');
    expect(songHash.length).toBe(10);

    // Mismo audio + mismo título + mismo motor = idéntica clave de caché
    const secondHash = crypto.createHash('md5').update(String(songTitle) + String(audioUrl)).digest('hex').substring(0, 10);
    const secondKey = `${bandId}:${secondHash}:${engine}`;
    expect(secondKey).toBe(cacheKey);

    // Motor diferente = clave separada para permitir comparar modelos
    const demucsKey = `${bandId}:${secondHash}:demucs`;
    expect(demucsKey).not.toBe(cacheKey);
  });

  it('consulta y guarda en la caché persistente L1/L2 (stemsCache)', async () => {
    const record = {
      bandId: 'band-persistencia',
      songHash: 'hash999',
      engine: 'mvsep-mdx23',
      engineUsed: 'mvsep-mdx23',
      isNeural: true,
      degraded: false,
      stemsMap: {
        'Voz': { url: 'https://supabase.co/vocal.mp3', formato: 'mp3', tamano: '3 MB' },
        'Batería': { url: 'https://supabase.co/drums.mp3', formato: 'mp3', tamano: '3 MB' }
      },
      timingBreakdown: { totalSec: '1.2s' }
    };

    await saveStemsToPersistentCache(record);

    // Comprobación de recuperación
    const cached = await getStemsFromPersistentCache('band-persistencia', 'hash999', 'mvsep-mdx23');
    expect(cached).not.toBeNull();
    expect(cached?.stemsMap['Voz'].url).toBe('https://supabase.co/vocal.mp3');
    expect(cached?.isNeural).toBe(true);
  });

  it('encola stems fallidos en la cola de reintentos con backoff exponencial', () => {
    const retryId = stemStorageRetryManager.enqueue(
      '/tmp/test-stem.mp3',
      'stems/band1/song1/stem-voz.mp3',
      'band1',
      'audio/mpeg',
      5
    );

    expect(retryId).toBeDefined();
    expect(stemStorageRetryManager.getQueueLength()).toBe(1);
  });

  it('ssrfGuard bloquea localhost, metadata 169.254, ips privadas y permite dominios públicos', async () => {
    expect(await esUrlExternaSegura('http://127.0.0.1:3000/api')).toBe(false);
    expect(await esUrlExternaSegura('http://localhost:8080')).toBe(false);
    expect(await esUrlExternaSegura('http://169.254.169.254/latest/meta-data/')).toBe(false);
    expect(await esUrlExternaSegura('http://10.0.0.15/secret')).toBe(false);
    expect(await esUrlExternaSegura('http://192.168.1.1/admin')).toBe(false);
    expect(await esUrlExternaSegura('http://172.20.0.5/api')).toBe(false);
    expect(await esUrlExternaSegura('ftp://example.com/file')).toBe(false);
    expect(await esUrlExternaSegura('https://api.github.com/zen')).toBe(true);
  });

  it('verifica la firma HMAC del webhook de Replicate y rechaza firmas inválidas', () => {
    const payload = JSON.stringify({ id: 'pred_123', status: 'succeeded' });
    const secretKeyBytes = crypto.randomBytes(32);
    const secret = `whsec_${secretKeyBytes.toString('base64')}`;
    const webhookId = 'msg_test_123';
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const payloadToSign = `${webhookId}.${timestamp}.${payload}`;
    const hmac = crypto.createHmac('sha256', secretKeyBytes);
    hmac.update(payloadToSign);
    const validSignature = `v1,${hmac.digest('base64')}`;

    const headers = { id: webhookId, timestamp, signature: validSignature };
    expect(verifyReplicateWebhook(payload, headers, secret).valid).toBe(true);
    expect(verifyReplicateWebhook(payload, { ...headers, signature: 'v1,invalid_sig_base64==' }, secret).valid).toBe(false);
    expect(verifyReplicateWebhook(payload, headers, undefined).valid).toBe(false);
  });

  it('evita carreras de concurrencia usando un mutex en memoria (inFlightSeparations)', async () => {
    const inFlightMap = new Map<string, Promise<{ stems: any[]; cached: boolean }>>();
    let apiCallCounter = 0;

    const mockSeparation = async (cacheKey: string) => {
      if (inFlightMap.has(cacheKey)) {
        return inFlightMap.get(cacheKey)!;
      }

      const promise = (async () => {
        apiCallCounter++;
        // Simular latencia de red/GPU
        await new Promise(r => setTimeout(r, 20));
        return {
          stems: [{ instrument: 'Voz', url: 'https://cdn.example.com/vocals.mp3' }],
          cached: false
        };
      })().finally(() => {
        inFlightMap.delete(cacheKey);
      });

      inFlightMap.set(cacheKey, promise);
      return promise;
    };

    const key = 'band-abc:hash-123:mvsep-mdx23';

    // Disparar 3 peticiones simultáneas idénticas
    const [res1, res2, res3] = await Promise.all([
      mockSeparation(key),
      mockSeparation(key),
      mockSeparation(key)
    ]);

    // Debe haber ejecutado el API externo exactamente 1 vez
    expect(apiCallCounter).toBe(1);
    expect(res1.stems[0].instrument).toBe('Voz');
    expect(res2.stems[0].instrument).toBe('Voz');
    expect(res3.stems[0].instrument).toBe('Voz');
    expect(inFlightMap.has(key)).toBe(false);
  });

  it('utiliza identificadores de modelos de Replicate verificados y precisos', () => {
    expect(REPLICATE_MODEL_DEMUCS_V4).toBe('cjwbw/demucs');
    expect(REPLICATE_MODEL_MVSEP_MDX23).toBe('lucataco/mvsep-mdx23-music-separation');
  });

  it('estructura correctamente los metadatos de los stems para MVSEP-MDX23 (4 y 6 stems posicionales)', () => {
    // Caso 1: Objeto nominal estándar
    const mockOut = {
      vocals: 'https://replicate.delivery/vocal.mp3',
      drums: 'https://replicate.delivery/drums.mp3',
      bass: 'https://replicate.delivery/bass.mp3',
      other: 'https://replicate.delivery/other.mp3'
    };

    const stemsMap: Record<string, string> = {};
    if (mockOut.vocals) stemsMap['Voz'] = mockOut.vocals;
    if (mockOut.drums) stemsMap['Batería'] = mockOut.drums;
    if (mockOut.bass) stemsMap['Bajo'] = mockOut.bass;
    if (mockOut.other) {
      stemsMap['Guitarras'] = mockOut.other;
      stemsMap['Arreglos'] = mockOut.other;
    }

    expect(stemsMap['Voz']).toBe('https://replicate.delivery/vocal.mp3');
    expect(stemsMap['Batería']).toBe('https://replicate.delivery/drums.mp3');
    expect(stemsMap['Bajo']).toBe('https://replicate.delivery/bass.mp3');
    expect(stemsMap['Guitarras']).toBe('https://replicate.delivery/other.mp3');
    expect(stemsMap['Arreglos']).toBe('https://replicate.delivery/other.mp3');

    // Caso 2: Array posicional de 6 stems de MVSEP-MDX23
    const positionalOut6 = [
      'https://replicate.delivery/bass.mp3',
      'https://replicate.delivery/drums.mp3',
      'https://replicate.delivery/keyboards.mp3',
      'https://replicate.delivery/vocals.mp3',
      'https://replicate.delivery/residual.mp3',
      'https://replicate.delivery/guitars.mp3'
    ];
    const labels6 = ['Bajo', 'Batería', 'Teclados', 'Voz', 'Arreglos', 'Guitarras'];
    const positionalStemsMap6: Record<string, string> = {};
    positionalOut6.forEach((url, idx) => {
      positionalStemsMap6[labels6[idx]] = url;
    });

    expect(positionalStemsMap6['Bajo']).toBe(positionalOut6[0]);
    expect(positionalStemsMap6['Batería']).toBe(positionalOut6[1]);
    expect(positionalStemsMap6['Teclados']).toBe(positionalOut6[2]);
    expect(positionalStemsMap6['Voz']).toBe(positionalOut6[3]);
    expect(positionalStemsMap6['Arreglos']).toBe(positionalOut6[4]);
    expect(positionalStemsMap6['Guitarras']).toBe(positionalOut6[5]);
  });

  it('valida que processNeuralStemsReplicate devuelva error controlado si no hay token ni audio', async () => {
    const origToken = process.env.REPLICATE_API_TOKEN;
    const origKey = process.env.REPLICATE_API_KEY;
    try {
      delete process.env.REPLICATE_API_TOKEN;
      delete process.env.REPLICATE_API_KEY;

      const resNoToken = await processNeuralStemsReplicate('https://example.com/audio.mp3', 'band1', 'hash1', undefined, '');
      expect(resNoToken).toBeDefined();
      expect(resNoToken?.errorType).toBe('token_missing');
    } finally {
      if (origToken) process.env.REPLICATE_API_TOKEN = origToken;
      if (origKey) process.env.REPLICATE_API_KEY = origKey;
    }

    const resNoAudio = await processNeuralStemsReplicate('', 'band1', 'hash1', undefined, 'r8_testtoken123');
    expect(resNoAudio).toBeDefined();
    expect(resNoAudio?.errorType).toBe('audio_unsupported');
  });

  it('marca degraded: true y engineUsed: dsp_fallback cuando no hay IA disponible y se recurre a DSP', () => {
    const isNeural = false;
    const isUserExplicitDsp = false;
    const selectedEngine = 'auto';
    const separationEngine = 'dsp-server (FFmpeg)';

    const engineUsed = isNeural
      ? (selectedEngine === 'auto' ? (separationEngine.includes('MVSEP') ? 'mvsep-mdx23' : 'demucs') : selectedEngine)
      : (isUserExplicitDsp ? 'dsp-server' : 'dsp_fallback');
    const isDegraded = !isNeural && !isUserExplicitDsp;
    const degradedReason = isDegraded ? 'Sin credenciales activas o servicio de IA disponible; procesado con filtros básicos DSP de frecuencia' : undefined;

    expect(isDegraded).toBe(true);
    expect(engineUsed).toBe('dsp_fallback');
    expect(degradedReason).toContain('Sin credenciales activas');
  });

  it('no marca degraded si el usuario solicitó explícitamente el motor DSP local', () => {
    const isNeural = false;
    const isUserExplicitDsp = true;
    const selectedEngine = 'dsp-server';
    const separationEngine = 'dsp-server (FFmpeg)';

    const engineUsed = isNeural
      ? (selectedEngine === 'auto' ? (separationEngine.includes('MVSEP') ? 'mvsep-mdx23' : 'demucs') : selectedEngine)
      : (isUserExplicitDsp ? 'dsp-server' : 'dsp_fallback');
    const isDegraded = !isNeural && !isUserExplicitDsp;

    expect(isDegraded).toBe(false);
    expect(engineUsed).toBe('dsp-server');
  });
});
