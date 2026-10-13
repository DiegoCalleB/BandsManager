// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useReordenTactil } from '../useReordenTactil';

const evento = (pointerType: string) => ({ preventDefault: vi.fn(), pointerType }) as unknown as React.PointerEvent;
const mover = (x = 10, y = 300) => window.dispatchEvent(Object.assign(new Event('pointermove'), { clientX: x, clientY: y }));

function montar() {
  const opciones = { setArrastrado: vi.fn(), setSobre: vi.fn(), alSoltar: vi.fn() };
  const { result } = renderHook(() => useReordenTactil(opciones));
  const destino = document.createElement('div');
  destino.dataset.widgetId = 'b';
  document.body.appendChild(destino);
  const hijo = document.createElement('span');
  destino.appendChild(hijo);
  document.elementFromPoint = vi.fn(() => hijo);
  return { result, opciones, destino };
}

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

describe('useReordenTactil', () => {
  it('con el dedo: marca el destino al pasar por encima y reordena al soltar', () => {
    const { result, opciones } = montar();
    act(() => result.current.iniciar(evento('touch'), 'a'));
    expect(opciones.setArrastrado).toHaveBeenCalledWith('a');
    act(() => mover());
    expect(opciones.setSobre).toHaveBeenLastCalledWith('b');
    act(() => { window.dispatchEvent(new Event('pointerup')); });
    expect(opciones.alSoltar).toHaveBeenCalledWith('a', 'b');
    expect(opciones.setArrastrado).toHaveBeenLastCalledWith(null);
  });

  it('soltar sobre sí mismo o fuera de un widget no mueve nada', () => {
    const { result, opciones } = montar();
    document.elementFromPoint = vi.fn(() => document.body);
    act(() => result.current.iniciar(evento('touch'), 'a'));
    act(() => mover());
    act(() => { window.dispatchEvent(new Event('pointerup')); });
    expect(opciones.alSoltar).not.toHaveBeenCalled();
  });

  it('Escape cancela', () => {
    const { result, opciones } = montar();
    act(() => result.current.iniciar(evento('pen'), 'a'));
    act(() => mover());
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); });
    act(() => { window.dispatchEvent(new Event('pointerup')); });
    expect(opciones.alSoltar).not.toHaveBeenCalled();
  });

  it('el ratón se deja al arrastre nativo del navegador', () => {
    const { result, opciones } = montar();
    act(() => result.current.iniciar(evento('mouse'), 'a'));
    expect(opciones.setArrastrado).not.toHaveBeenCalled();
  });

  it('cerca del borde inferior desplaza la página', () => {
    const { result } = montar();
    const scroll = vi.spyOn(window, 'scrollBy').mockImplementation(() => {});
    act(() => result.current.iniciar(evento('touch'), 'a'));
    act(() => mover(10, window.innerHeight - 5));
    expect(scroll).toHaveBeenCalledWith(0, expect.any(Number));
  });
});
