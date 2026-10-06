import { describe, expect, it, vi } from 'vitest';
import { guardarOReverter } from '../guardarConReversion';

const ok = (status: number) => ({ ok: status < 400, status }) as Response;

describe('guardarOReverter', () => {
  it('no revierte si el servidor acepta el cambio', async () => {
    const revertir = vi.fn();
    expect(await guardarOReverter(Promise.resolve(ok(200)), revertir)).toBe(true);
    expect(revertir).not.toHaveBeenCalled();
  });

  it.each([400, 403, 409, 500])('revierte con HTTP %s', async (status) => {
    const revertir = vi.fn();
    expect(await guardarOReverter(Promise.resolve(ok(status)), revertir)).toBe(false);
    expect(revertir).toHaveBeenCalledTimes(1);
  });

  it('revierte si no hay red', async () => {
    const revertir = vi.fn();
    expect(await guardarOReverter(Promise.reject(new TypeError('Failed to fetch')), revertir)).toBe(false);
    expect(revertir).toHaveBeenCalledTimes(1);
  });

  it('un fallo dentro de revertir no se propaga', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(guardarOReverter(Promise.resolve(ok(500)), () => { throw new Error('x'); })).resolves.toBe(false);
    err.mockRestore();
  });
});
