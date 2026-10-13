import { beforeEach, describe, expect, it, vi } from 'vitest';

const capturados: Array<{ err: unknown; contexto?: Record<string, unknown> }> = [];
vi.mock('../errorTracking.js', () => ({
  captureError: (err: unknown, contexto?: Record<string, unknown>) => capturados.push({ err, contexto }),
}));

import { ErrorHttp, MENSAJE_ERROR_GENERICO, responderError } from '../errorHttp';

function respuesta() {
  const res = {
    codigo: 0,
    cuerpo: undefined as Record<string, unknown> | undefined,
    req: { method: 'POST', originalUrl: '/api/prueba' },
    status(c: number) { res.codigo = c; return res; },
    json(b: Record<string, unknown>) { res.cuerpo = b; return res; },
  };
  return res;
}

beforeEach(() => {
  capturados.length = 0;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('responderError', () => {
  it('un error inesperado no filtra su mensaje: responde 500 genérico con un idError', () => {
    const res = respuesta();
    responderError(res as never, new Error('relation "leads" does not exist at /srv/app/server/db/leads.ts:88'), 'Error al guardar');
    expect(res.codigo).toBe(500);
    expect(res.cuerpo?.error).toBe('Error al guardar');
    expect(JSON.stringify(res.cuerpo)).not.toMatch(/relation|leads|srv|\.ts/);
    expect(res.cuerpo?.idError).toMatch(/^[0-9a-f]{8}$/);
    expect(res.cuerpo?.success).toBe(false);
  });

  it('manda el detalle a Sentry con el mismo idError que ve el cliente', () => {
    const res = respuesta();
    const causa = new Error('detalle interno');
    responderError(res as never, causa);
    expect(capturados).toHaveLength(1);
    expect(capturados[0].err).toBe(causa);
    expect(capturados[0].contexto).toMatchObject({ idError: res.cuerpo?.idError, method: 'POST', url: '/api/prueba' });
  });

  it('sin texto propio usa el mensaje genérico', () => {
    const res = respuesta();
    responderError(res as never, 'cualquier cosa');
    expect(res.cuerpo?.error).toBe(MENSAJE_ERROR_GENERICO);
  });

  it('un ErrorHttp conserva su estado y su mensaje (lo escribió una persona) y no va a Sentry', () => {
    const res = respuesta();
    responderError(res as never, new ErrorHttp(409, 'banda_duplicada', 'Esa banda ya existe.'), 'no se usa');
    expect(res.codigo).toBe(409);
    expect(res.cuerpo).toEqual({ success: false, error: 'Esa banda ya existe.', codigo: 'banda_duplicada' });
    expect(capturados).toHaveLength(0);
  });

  it('si las cabeceras ya se enviaron no responde otra vez, pero no pierde el fallo', () => {
    const res = { ...respuesta(), headersSent: true };
    let respondio = false;
    res.status = () => { respondio = true; return res; };
    const causa = new Error('tarde');
    responderError(res as never, causa);
    expect(respondio).toBe(false);
    expect(capturados).toEqual([{ err: causa, contexto: { method: 'POST', url: '/api/prueba' } }]);
  });

  it('no distingue por el nombre del error: un Error normal con status no se cuela como esperado', () => {
    const res = respuesta();
    responderError(res as never, Object.assign(new Error('secreto'), { status: 418 }), 'Error genérico');
    expect(res.codigo).toBe(500);
    expect(JSON.stringify(res.cuerpo)).not.toContain('secreto');
  });
});
