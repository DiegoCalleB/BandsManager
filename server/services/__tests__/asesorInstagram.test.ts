import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../credencialesInstagram.js', () => ({ credencialesInstagram: vi.fn() }));
vi.mock('../../db/asesorMarketing.js', () => ({ dbAccionesDesde: vi.fn() }));

import { credencialesInstagram } from '../credencialesInstagram.js';
import { dbAccionesDesde } from '../../db/asesorMarketing.js';
import { medidasDeInsights, medidasDeMedio, mediosDeLaPieza } from '../asesorInstagram.js';

const AHORA = new Date('2026-10-30T10:00:00Z');
const lista = { data: [{ id: '12345678', timestamp: '2026-10-28T10:00:00+0000', media_type: 'CAROUSEL_ALBUM', media_product_type: 'FEED', permalink: 'https://www.instagram.com/p/x/', caption: 'Ensayo' }] };
const ok = (cuerpo: unknown) => ({ ok: true, cuerpo });

beforeEach(() => {
  vi.mocked(credencialesInstagram).mockResolvedValue({ token: 'tok', igUserId: '999' });
  vi.mocked(dbAccionesDesde).mockResolvedValue([{ fecha: '2026-10-28', tarjetaId: 'a', formato: 'carrusel', accion: 'hecho', titulo: 'Ensayo' }]);
});

describe('medidasDeInsights', () => {
  it('lee alcance, guardados y no seguidores; lo que falta queda en null, nunca en 0', () => {
    const principal = { data: [{ name: 'reach', values: [{ value: 1200 }] }, { name: 'saved', values: [{ value: 40 }] }] };
    const seg = { data: [{ name: 'reach', total_value: { breakdowns: [{ results: [{ dimension_values: ['FOLLOWER'], value: 700 }, { dimension_values: ['NON_FOLLOWER'], value: 500 }] }] } }] };
    expect(medidasDeInsights(principal, seg)).toEqual({ alcance: 1200, guardados: 40, alcanceNoSeguidores: 500 });
    expect(medidasDeInsights({ data: [{ name: 'reach', total_value: { value: 10 } }] }, {})).toEqual({ alcance: 10, guardados: null, alcanceNoSeguidores: null });
  });
});

describe('mediosDeLaPieza', () => {
  it('lista las candidatas de la propia cuenta', async () => {
    const pedir = vi.fn().mockResolvedValue(ok(lista));
    const r = await mediosDeLaPieza('b1', '2026-10-28', 'a', AHORA, pedir);
    expect(r).toMatchObject({ estado: 'ok', medios: [{ id: '12345678', formato: 'carrusel' }] });
    expect(pedir.mock.calls[0][0]).toContain('/999/media');
  });
  it('sin acción «hecho» o sin Instagram no pregunta a Meta', async () => {
    const pedir = vi.fn();
    expect(await mediosDeLaPieza('b1', '2026-10-28', 'otra', AHORA, pedir)).toEqual({ estado: 'no_existe' });
    vi.mocked(credencialesInstagram).mockResolvedValue(null);
    expect(await mediosDeLaPieza('b1', '2026-10-28', 'a', AHORA, pedir)).toEqual({ estado: 'sin_instagram' });
    expect(pedir).not.toHaveBeenCalled();
  });
  it('un error de Meta se cuenta, sin romper', async () => {
    const r = await mediosDeLaPieza('b1', '2026-10-28', 'a', AHORA, vi.fn().mockResolvedValue({ ok: false, cuerpo: { error: { message: 'Token caducado' } } }));
    expect(r).toMatchObject({ estado: 'error' });
    expect((r as { motivo: string }).motivo).toContain('Token caducado');
  });
});

describe('medidasDeMedio', () => {
  it('no lee insights de un id que no sea de las publicaciones recientes de la cuenta', async () => {
    const pedir = vi.fn().mockResolvedValue(ok(lista));
    expect(await medidasDeMedio('b1', '87654321', pedir)).toEqual({ estado: 'no_existe' });
    expect(await medidasDeMedio('b1', '../../me', pedir)).toEqual({ estado: 'no_existe' });
    expect(pedir).toHaveBeenCalledTimes(1);
  });
  it('trae los números; si «no seguidores» falla, sigue con lo demás', async () => {
    const pedir = vi.fn()
      .mockResolvedValueOnce(ok(lista))
      .mockResolvedValueOnce(ok({ data: [{ name: 'reach', values: [{ value: 800 }] }, { name: 'saved', values: [{ value: 24 }] }] }))
      .mockResolvedValueOnce({ ok: false, cuerpo: { error: { message: 'breakdown no soportado' } } });
    expect(await medidasDeMedio('b1', '12345678', pedir)).toEqual({ estado: 'ok', medidas: { alcance: 800, guardados: 24 } });
  });
  it('sin alcance todavía, lo dice', async () => {
    const pedir = vi.fn().mockResolvedValueOnce(ok(lista)).mockResolvedValueOnce(ok({ data: [] })).mockResolvedValueOnce(ok({ data: [] }));
    expect(await medidasDeMedio('b1', '12345678', pedir)).toMatchObject({ estado: 'error' });
  });
});
