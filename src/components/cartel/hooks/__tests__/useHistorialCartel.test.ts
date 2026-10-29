// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHistorialCartel, type FotoDiseno } from '../useHistorialCartel';

const foto = (n: number) => ({ ajustes: { n }, fondo: { tipo: 'paleta' } }) as unknown as FotoDiseno;

describe('useHistorialCartel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('anota, deshace y rehace aplicando la foto anterior', () => {
    const aplicar = vi.fn();
    const { result, rerender } = renderHook(({ actual }) => useHistorialCartel('bolo', actual, aplicar), { initialProps: { actual: foto(1) } });
    expect(result.current.puedeDeshacer).toBe(false);

    act(() => result.current.anotarPaso('fondo'));
    rerender({ actual: foto(2) });
    expect(result.current.puedeDeshacer).toBe(true);

    act(() => result.current.deshacer());
    expect(aplicar).toHaveBeenLastCalledWith(foto(1));
    rerender({ actual: foto(1) });
    expect(result.current.puedeRehacer).toBe(true);

    act(() => result.current.rehacer());
    expect(aplicar).toHaveBeenLastCalledWith(foto(2));
  });

  it('junta en un paso los cambios seguidos del mismo tipo', () => {
    const aplicar = vi.fn();
    const { result } = renderHook(() => useHistorialCartel('bolo', foto(1), aplicar));
    act(() => result.current.anotarPaso('extra'));
    act(() => result.current.anotarPaso('extra'));
    act(() => result.current.anotarPaso('extra'));
    act(() => result.current.deshacer());
    act(() => result.current.deshacer());
    expect(aplicar).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1000);
    act(() => result.current.anotarPaso('extra'));
    expect(result.current.puedeDeshacer).toBe(true);
  });

  it('cada bolo tiene su propia pila', () => {
    const { result, rerender } = renderHook(({ id }) => useHistorialCartel(id, foto(1), vi.fn()), { initialProps: { id: 'a' } });
    act(() => result.current.anotarPaso('x'));
    expect(result.current.puedeDeshacer).toBe(true);
    rerender({ id: 'b' });
    expect(result.current.puedeDeshacer).toBe(false);
  });
});
