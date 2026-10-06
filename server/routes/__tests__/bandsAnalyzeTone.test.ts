// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

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
  dbUpdateBandDnaExpresion: async (bandId: string, mutate: (current: any) => any) => {
    const current = guardadoEnSupabase.get(bandId) || {};
    const next = await mutate(current);
    if (next !== current) guardadoEnSupabase.set(bandId, next);
    return { ok: true, dna: next };
  },
  dbGetRegisteredBandById: async (bandId: string) => ({
    nombre_banda: 'Ruta 66',
    dna_expresion: guardadoEnSupabase.get(bandId) || null,
  }),
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

async function patch(ruta: string, cuerpo: any) {
  const res = await realFetch(`http://127.0.0.1:${puerto}${ruta}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
  return { status: res.status, body: await res.json() };
}

async function get(ruta: string) {
  const res = await realFetch(`http://127.0.0.1:${puerto}${ruta}`);
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

  // Bug real encontrado en auditoría: `data` (la respuesta de la IA) solo trae los campos del
  // análisis de redes (tono_comunicacion, vocabulario_clave...) y NUNCA reglas_por_categoria /
  // reglas_por_categoria_respuesta (Self-Refining Tone DNA) ni reglas_manuales. Guardarlo tal
  // cual sobreescribiendo dna_expresion entero borraba silenciosamente TODO lo aprendido de
  // correcciones reales y lo escrito a mano cada vez que el mánager pulsaba "Analizar Tono" para
  // refrescar el análisis de redes - justo el tipo de pérdida de entrenamiento que no debe pasar.
  it('re-analizar el tono NUNCA borra reglas_por_categoria ni reglas_manuales ya aprendidas', async () => {
    guardadoEnSupabase.set('band-ruta-66', {
      tono_comunicacion: 'Análisis viejo',
      reglas_por_categoria: {
        salas: { reglas_estilo_aprendidas: ['No usar la palabra rider en el primer párrafo'], reglas_manuales: ['Nunca tutear a ayuntamientos'] }
      },
      reglas_por_categoria_respuesta: {
        salas: { reglas_estilo_aprendidas: ['Confirmar fecha en la primera línea'] }
      },
      historial_feedback_reels: [{ nota: 'feedback previo' }]
    });

    const { body } = await post('/api/bands/analyze-tone', { nombre_entidad: 'Ruta 66', is_sender: true });

    expect(body.savedPermanently).toBe(true);
    const guardado = guardadoEnSupabase.get('band-ruta-66');
    expect(guardado.tono_comunicacion).toBe('Directo y gamberro'); // el análisis nuevo sí se aplica
    expect(guardado.reglas_por_categoria.salas.reglas_estilo_aprendidas).toEqual(['No usar la palabra rider en el primer párrafo']);
    expect(guardado.reglas_por_categoria.salas.reglas_manuales).toEqual(['Nunca tutear a ayuntamientos']);
    expect(guardado.reglas_por_categoria_respuesta.salas.reglas_estilo_aprendidas).toEqual(['Confirmar fecha en la primera línea']);
    expect(guardado.historial_feedback_reels).toEqual([{ nota: 'feedback previo' }]);
  });
});

describe('GET /api/bands/tone-dna', () => {
  it('sin análisis guardado devuelve null en vez de un objeto vacío inventado', async () => {
    const { status, body } = await get('/api/bands/tone-dna');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeNull();
  });

  it('devuelve el ADN ya guardado de la banda de la sesión', async () => {
    await post('/api/bands/analyze-tone', { nombre_entidad: 'Ruta 66', is_sender: true });
    const { body } = await get('/api/bands/tone-dna');
    expect(body.data?.tono_comunicacion).toBe('Directo y gamberro');
  });
});

describe('PATCH /api/bands/tone-dna', () => {
  it('el usuario puede corregir a mano el tono que sacó la IA', async () => {
    await post('/api/bands/analyze-tone', { nombre_entidad: 'Ruta 66', is_sender: true });

    const { status, body } = await patch('/api/bands/tone-dna', {
      tono_comunicacion: 'Cercano y con humor negro',
      vocabulario_clave: ['familia', 'pogo', 'familia'],
      emojis_frecuentes: ['🔥', '⚡'],
    });

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.tono_comunicacion).toBe('Cercano y con humor negro');
    expect(body.data.vocabulario_clave).toEqual(['familia', 'pogo']);
    expect(guardadoEnSupabase.get('band-ruta-66')?.tono_comunicacion).toBe('Cercano y con humor negro');
  });

  it('una edición parcial no borra los campos que no se tocan', async () => {
    await post('/api/bands/analyze-tone', { nombre_entidad: 'Ruta 66', is_sender: true });

    const { body } = await patch('/api/bands/tone-dna', { nivel_energia: 'Media, de tarde de domingo' });

    expect(body.data.nivel_energia).toBe('Media, de tarde de domingo');
    expect(body.data.tono_comunicacion).toBe('Directo y gamberro');
    expect(body.data.vocabulario_clave).toEqual(['pogo', 'familia']);
  });

  it('se puede editar a mano aunque todavía no exista ningún análisis previo', async () => {
    const { status, body } = await patch('/api/bands/tone-dna', {
      tono_comunicacion: 'Escrito a mano, sin pasar por la IA',
    });

    expect(status).toBe(200);
    expect(body.data.tono_comunicacion).toBe('Escrito a mano, sin pasar por la IA');
  });

  it('ignora campos que no están en la lista de editables', async () => {
    const { body } = await patch('/api/bands/tone-dna', {
      es_emisor: false,
      nombre_entidad: 'Otro Nombre',
      tono_comunicacion: 'Válido',
    });

    expect(body.data.tono_comunicacion).toBe('Válido');
    expect(body.data.es_emisor).toBeUndefined();
    expect(body.data.nombre_entidad).toBeUndefined();
  });
});
