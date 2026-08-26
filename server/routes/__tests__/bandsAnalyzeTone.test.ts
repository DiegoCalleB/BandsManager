import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import express from 'express';
import type { AddressInfo } from 'net';

/**
 * El ADN de tono de la banda EMISORA (el botón "Analizar tono de voz" del generador de Reels)
 * no se estaba guardando nunca: el frontend no mandaba `save_to_band_id` y, aunque lo hubiera
 * mandado, el destino era `data.json`, que Railway borra en cada despliegue. Este test cubre
 * que ahora se guarda solo, en Supabase, usando la banda de la sesión (no un id que mande el
 * cliente), y que analizar a OTRA banda (para un pitch de co-booking) no toca esa fila.
 */

const guardadoEnSupabase = new Map<string, any>();

vi.mock('../../state.js', () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { id: 'user-1', role: 'leader', band_id: 'band-ruta-66', allowedBandIds: ['band-ruta-66'] };
    next();
  },
  loadState: () => ({ bands: [] }),
  saveState: () => {},
}));

vi.mock('../../db.js', () => ({
  dbGetBandContacts: async () => [],
  dbUpsertBandContact: async () => ({}),
  dbDeleteBandContact: async () => {},
  dbGetBandSchedule: async () => null,
  dbUpsertBandSchedule: async () => ({}),
  dbGetBandEmailAccount: async () => null,
  dbUpsertBandEmailAccount: async () => ({}),
  toSafeEmailAccountResponse: (v: any) => v,
  dbUpdateBandToneDna: async (bandId: string, dna: any) => {
    guardadoEnSupabase.set(bandId, dna);
    return true;
  },
}));

const promptsVistos: string[] = [];

vi.mock('../../ai.js', () => ({
  getAiClient: () => ({}),
  generateContentWithFallback: async (_client: any, params: any) => {
    promptsVistos.push(String(params.contents));
    return {
      text: JSON.stringify({
        nombre_entidad: 'Ruta 66',
        tono_comunicacion: 'Directo y gamberro',
        vocabulario_clave: ['pogo', 'familia'],
      }),
    };
  },
}));

const { default: bandsRouter } = await import('../bands.js');

const app = express();
app.use(express.json());
app.use('/api', bandsRouter);
const server = app.listen(0);
const puerto = (server.address() as AddressInfo).port;
const realFetch = globalThis.fetch.bind(globalThis);

async function post(ruta: string, cuerpo: any) {
  const res = await realFetch(`http://127.0.0.1:${puerto}${ruta}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
  return { status: res.status, body: await res.json() };
}

afterAll(() => {
  server.close();
});

beforeEach(() => {
  guardadoEnSupabase.clear();
  promptsVistos.length = 0;
});

describe('POST /api/bands/analyze-tone', () => {
  it('al analizar la banda emisora, guarda el ADN en Supabase con la banda de la sesión', async () => {
    const { status, body } = await post('/api/bands/analyze-tone', {
      nombre_entidad: 'Ruta 66',
      instagram: '@ruta66',
      is_sender: true,
    });

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.savedPermanently).toBe(true);
    expect(guardadoEnSupabase.get('band-ruta-66')?.tono_comunicacion).toBe('Directo y gamberro');
  });

  it('ignora un band_id que mande el cliente: usa siempre la banda de la sesión autenticada', async () => {
    await post('/api/bands/analyze-tone', {
      nombre_entidad: 'Ruta 66',
      is_sender: true,
      save_to_band_id: 'band-de-otro',
    });

    expect(guardadoEnSupabase.has('band-de-otro')).toBe(false);
    expect(guardadoEnSupabase.has('band-ruta-66')).toBe(true);
  });

  it('analizar a otra banda (pitch de co-booking) no guarda ADN propio en Supabase', async () => {
    const { body } = await post('/api/bands/analyze-tone', {
      nombre_entidad: 'Ska-P',
      tipo: 'Banda',
    });

    expect(body.savedPermanently).toBe(false);
    expect(guardadoEnSupabase.size).toBe(0);
  });
});
