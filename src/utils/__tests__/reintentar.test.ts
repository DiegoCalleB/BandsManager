import { describe, it, expect, vi, afterEach } from 'vitest';
import { conReintentos } from '../reintentar';

afterEach(() => vi.useRealTimers());

describe('conReintentos', () => {
  it('devuelve el resultado a la primera sin esperar', async () => {
    expect(await conReintentos(async () => 'ok', [1000])).toBe('ok');
  });

  it('reintenta con las esperas indicadas hasta que sale bien', async () => {
    vi.useFakeTimers();
    let n = 0;
    const p = conReintentos(async () => {
      if (++n < 3) throw new Error('red');
      return 'ok';
    }, [1000, 2000]);
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);
    expect(await p).toBe('ok');
    expect(n).toBe(3);
  });

  it('agotados los reintentos relanza el último error', async () => {
    vi.useFakeTimers();
    const p = conReintentos(async () => { throw new Error('caído'); }, [10, 10]).catch((e) => e.message);
    await vi.advanceTimersByTimeAsync(20);
    expect(await p).toBe('caído');
  });

  it('si se cancela deja de insistir', async () => {
    vi.useFakeTimers();
    let cancelado = false;
    let n = 0;
    const p = conReintentos(async () => { n++; throw new Error('x'); }, [1000, 1000], () => cancelado).catch(() => 'parado');
    await vi.advanceTimersByTimeAsync(0);
    cancelado = true;
    await vi.advanceTimersByTimeAsync(1000);
    expect(await p).toBe('parado');
    expect(n).toBe(1);
  });
});
