import { describe, it, expect, vi, afterEach } from 'vitest';
import { anadirSalaDelCatalogo } from '../apiCatalogo';

const responder = (status: number, cuerpo: unknown) => vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(cuerpo), { status, headers: { 'content-type': 'application/json' } })));

afterEach(() => vi.unstubAllGlobals());

describe('anadirSalaDelCatalogo', () => {
  it('devuelve el id del lead creado y llama al endpoint con el id codificado', async () => {
    responder(200, { success: true, leadId: 'lead-cat-1' });
    expect(await anadirSalaDelCatalogo('sala-abc')).toEqual({ ok: true, leadId: 'lead-cat-1' });
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe('/api/catalogo/salas/sala-abc/anadir');
    expect(vi.mocked(fetch).mock.calls[0][1]).toMatchObject({ method: 'POST' });
  });

  it('distingue «ya la tenías» (409) de un fallo', async () => {
    responder(409, { error: 'Esa sala ya está en tu agenda.', leadId: 'l9' });
    expect(await anadirSalaDelCatalogo('sala-abc')).toMatchObject({ ok: false, yaEnAgenda: true, leadId: 'l9' });
    responder(403, { error: 'Límite de plan', codigo: 'limite_plan_alcanzado' });
    expect(await anadirSalaDelCatalogo('sala-abc')).toMatchObject({ ok: false, yaEnAgenda: false, error: 'Límite de plan' });
  });

  it('sobrevive a un cuerpo que no es JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>', { status: 502 })));
    expect(await anadirSalaDelCatalogo('sala-abc')).toMatchObject({ ok: false, yaEnAgenda: false, error: expect.stringContaining('502') });
  });
});
