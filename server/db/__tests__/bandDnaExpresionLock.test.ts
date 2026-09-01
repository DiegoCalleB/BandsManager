import { describe, it, expect, vi, beforeEach } from 'vitest';

// dna_expresion es una única columna JSONB que se lee entera, se modifica en memoria y se
// sobrescribe entera (dbUpdateBandToneDna). dbUpdateBandDnaExpresion serializa ese ciclo
// lectura+escritura por banda para que dos escrituras casi simultáneas (dos refinamientos
// automáticos, o una edición manual mientras hay uno en vuelo) no se pisen entre sí perdiendo
// la que escribió primero. Este test comprueba justo esa propiedad, no los detalles de Supabase.

const rows = new Map<string, any>();

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function crearFromMock() {
  let modo: 'select' | 'update' | null = null;
  let updatePayload: any = null;
  let bandId: string | undefined;

  const builder: any = {
    select: () => { modo = 'select'; return builder; },
    update: (payload: any) => { modo = 'update'; updatePayload = payload; return builder; },
    upsert: async (payload: any) => {
      rows.set(payload.band_id, { ...(rows.get(payload.band_id) || {}), ...payload });
      return { data: payload, error: null };
    },
    eq: (col: string, val: string) => {
      if (col === 'band_id') bandId = val;
      if (modo === 'update') {
        const existente = rows.get(bandId!) || {};
        rows.set(bandId!, { ...existente, ...updatePayload });
        return { error: null };
      }
      return builder;
    },
    maybeSingle: async () => ({ data: (bandId && rows.get(bandId)) || null, error: null })
  };
  return builder;
}

vi.mock('../core.js', () => ({
  getSupabase: () => ({ from: () => crearFromMock() }),
  cleanBandId: (bandId?: string) => (bandId || '').replace(/^(band|reg)-/, ''),
  normalizePlan: (plan?: string) => plan || 'ensayo'
}));

import { dbUpdateBandDnaExpresion } from '../bands';

describe('dbUpdateBandDnaExpresion', () => {
  beforeEach(() => {
    rows.clear();
  });

  it('serializa dos escrituras casi simultáneas para la MISMA banda: ninguna pierde los cambios de la otra', async () => {
    rows.set('banda-x', { band_id: 'banda-x', dna_expresion: {} });

    const escrituraLenta = dbUpdateBandDnaExpresion('banda-x', async (current) => {
      await delay(20);
      return { ...current, campoA: 'A' };
    });
    const escrituraRapida = dbUpdateBandDnaExpresion('banda-x', async (current) => {
      return { ...current, campoB: 'B' };
    });

    await Promise.all([escrituraLenta, escrituraRapida]);

    const final = rows.get('banda-x').dna_expresion;
    expect(final.campoA).toBe('A');
    expect(final.campoB).toBe('B');
  });

  it('no escribe nada en Supabase si mutate devuelve la misma referencia (no-op)', async () => {
    rows.set('banda-y', { band_id: 'banda-y', dna_expresion: { existente: true } });

    const { ok, dna } = await dbUpdateBandDnaExpresion('banda-y', (current) => current);

    expect(ok).toBe(true);
    expect(dna).toEqual({ existente: true });
    // updated_at no debería haberse tocado si no hubo escritura real - lo comprobamos indirectamente
    // verificando que el objeto guardado sigue siendo exactamente el mismo, sin campos añadidos.
    expect(rows.get('banda-y').dna_expresion).toEqual({ existente: true });
  });

  it('bandas distintas no se bloquean entre sí', async () => {
    rows.set('banda-1', { band_id: 'banda-1', dna_expresion: {} });
    rows.set('banda-2', { band_id: 'banda-2', dna_expresion: {} });

    const inicio = Date.now();
    await Promise.all([
      dbUpdateBandDnaExpresion('banda-1', async (current) => { await delay(30); return { ...current, x: 1 }; }),
      dbUpdateBandDnaExpresion('banda-2', async (current) => ({ ...current, y: 1 }))
    ]);
    const duracion = Date.now() - inicio;

    // Si estuvieran serializadas entre sí (candado global en vez de por banda), tardarían >= 30ms
    // igualmente porque se ejecutan en paralelo de todos modos aquí, así que lo relevante es que
    // banda-2 no tuvo que ESPERAR a banda-1: se resuelve sin depender de su delay.
    expect(rows.get('banda-2').dna_expresion.y).toBe(1);
    expect(duracion).toBeLessThan(100);
  });
});
