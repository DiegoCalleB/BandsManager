// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useRedimensionar } from '../useRedimensionar';

const caja = (width: number) => ({ getBoundingClientRect: () => ({ width }) }) as unknown as HTMLElement;
const evento = (x: number, y: number, extra = {}) =>
  ({ preventDefault: vi.fn(), stopPropagation: vi.fn(), pointerType: 'mouse', button: 0, clientX: x, clientY: y, ...extra }) as unknown as React.PointerEvent;
const mover = (x: number, y: number) => window.dispatchEvent(Object.assign(new Event('pointermove'), { clientX: x, clientY: y }));
const soltar = () => window.dispatchEvent(new Event('pointerup'));

afterEach(cleanup);

describe('useRedimensionar', () => {
  // rejilla de 1200 px, widget de 600 px (mitad)
  const widget = { id: 'w1', wSpan: 6, hSpan: 'normal' as const };
  const empezar = (alSoltar: ReturnType<typeof vi.fn>) => {
    const { result } = renderHook(() => useRedimensionar(alSoltar));
    act(() => result.current.iniciar(evento(100, 100), widget, caja(1200), caja(600)));
    return result;
  };

  it('mientras se arrastra da una previa en vivo y al soltar guarda una sola vez', () => {
    const alSoltar = vi.fn();
    const result = empezar(alSoltar);
    act(() => mover(100 + 600, 100)); // +600 px → ancho 1200 → completo
    expect(result.current.previa).toEqual({ id: 'w1', wSpan: 12, hSpan: 'normal' });
    act(() => mover(100 + 600, 100 + 95)); // y un nivel más alto
    expect(result.current.previa).toEqual({ id: 'w1', wSpan: 12, hSpan: 'tall' });
    expect(alSoltar).not.toHaveBeenCalled();
    act(() => soltar());
    expect(alSoltar).toHaveBeenCalledTimes(1);
    expect(alSoltar).toHaveBeenCalledWith('w1', { wSpan: 12, hSpan: 'tall' });
    expect(result.current.previa).toBeNull();
  });

  it('si el tamaño final es el de partida no guarda nada', () => {
    const alSoltar = vi.fn();
    empezar(alSoltar);
    act(() => mover(130, 110));
    act(() => soltar());
    expect(alSoltar).not.toHaveBeenCalled();
  });

  it('Escape cancela sin guardar y deja de escuchar', () => {
    const alSoltar = vi.fn();
    const result = empezar(alSoltar);
    act(() => mover(700, 100));
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); });
    expect(result.current.previa).toBeNull();
    act(() => mover(900, 100));
    act(() => soltar());
    expect(alSoltar).not.toHaveBeenCalled();
  });

  it('ignora el botón derecho del ratón y la falta de rejilla', () => {
    const alSoltar = vi.fn();
    const { result } = renderHook(() => useRedimensionar(alSoltar));
    act(() => result.current.iniciar(evento(0, 0, { button: 2 }), widget, caja(1200), caja(600)));
    act(() => result.current.iniciar(evento(0, 0), widget, null, caja(600)));
    act(() => mover(700, 0));
    act(() => soltar());
    expect(result.current.previa).toBeNull();
    expect(alSoltar).not.toHaveBeenCalled();
  });
});
