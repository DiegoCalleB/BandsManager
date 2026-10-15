import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from 'events';

vi.mock('../core.js', () => ({
  getSupabase: () => ({}),
  cleanBandId: (b?: string) => (b || '').trim()
}));
vi.mock('../bands.js', () => ({ ensureRegisteredBandExists: async () => {} }));

import { bandasDeLaPeticion, invalidarCachePorEscritura } from '../sync.js';

function peticion(metodo: string, extra: any = {}) {
  return { method: metodo, headers: {}, ...extra };
}
function respuesta(statusCode = 200) {
  const r: any = new EventEmitter();
  r.statusCode = statusCode;
  return r;
}

describe('invalidación de la caché de estado tras una escritura', () => {
  it('bandasDeLaPeticion reúne la banda de la sesión y la de x-band-id, en todas sus formas', () => {
    const ids = bandasDeLaPeticion({ user: { band_id: 'band-ejemplo' }, headers: { 'x-band-id': 'stomp' } });
    expect(ids).toEqual(expect.arrayContaining(['band-ejemplo', 'ejemplo', 'reg-ejemplo', 'stomp', 'band-stomp']));
  });

  it('sin sesión ni cabecera no hay nada que invalidar', () => {
    expect(bandasDeLaPeticion({ headers: {} })).toEqual([]);
  });

  it('una escritura correcta (PUT 200) invalida la banda al terminar la respuesta', () => {
    const invalidar = vi.fn();
    const mw = invalidarCachePorEscritura(invalidar);
    const req = peticion('PUT', { user: { band_id: 'band-ejemplo' } });
    const res = respuesta(200);
    const next = vi.fn();
    mw(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(invalidar).not.toHaveBeenCalled(); // todavía no ha terminado la respuesta
    res.emit('finish');
    expect(invalidar).toHaveBeenCalledWith('band-ejemplo');
  });

  it.each(['POST', 'PATCH', 'DELETE'])('%s también invalida', (metodo) => {
    const invalidar = vi.fn();
    const res = respuesta(201);
    invalidarCachePorEscritura(invalidar)(peticion(metodo, { user: { band_id: 'band-x' } }), res, () => {});
    res.emit('finish');
    expect(invalidar).toHaveBeenCalled();
  });

  it('las lecturas (GET/HEAD/OPTIONS) no tocan la caché', () => {
    for (const metodo of ['GET', 'HEAD', 'OPTIONS']) {
      const invalidar = vi.fn();
      const res = respuesta(200);
      invalidarCachePorEscritura(invalidar)(peticion(metodo, { user: { band_id: 'band-x' } }), res, () => {});
      res.emit('finish');
      expect(invalidar).not.toHaveBeenCalled();
    }
  });

  it('una escritura que falla (4xx/5xx) no invalida: no cambió nada', () => {
    for (const status of [400, 403, 409, 500]) {
      const invalidar = vi.fn();
      const res = respuesta(status);
      invalidarCachePorEscritura(invalidar)(peticion('PUT', { user: { band_id: 'band-x' } }), res, () => {});
      res.emit('finish');
      expect(invalidar).not.toHaveBeenCalled();
    }
  });

  it('si invalidar lanza, no rompe la respuesta', () => {
    const res = respuesta(200);
    invalidarCachePorEscritura(() => { throw new Error('boom'); })(peticion('PUT', { user: { band_id: 'band-x' } }), res, () => {});
    expect(() => res.emit('finish')).not.toThrow();
  });
});
