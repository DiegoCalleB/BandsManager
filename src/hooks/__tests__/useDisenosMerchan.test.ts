// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDisenosMerchan, type DisenoMerchan } from '../useDisenosMerchan';

const diseno = (id: string): DisenoMerchan => ({
  id, type: 't', url: 'u', bg: 'none', text: '', assetType: 'a', date: 'd',
});

describe('useDisenosMerchan', () => {
  beforeEach(() => localStorage.clear());

  it('carga la galería guardada de la banda', () => {
    localStorage.setItem('merchan_designs_a', JSON.stringify([diseno('1')]));
    const { result } = renderHook(() => useDisenosMerchan('a'));
    expect(result.current[0]).toHaveLength(1);
  });

  it('persiste los cambios bajo la clave de su banda', () => {
    const { result } = renderHook(() => useDisenosMerchan('a'));
    act(() => result.current[1]((prev) => [diseno('x'), ...prev]));
    expect(JSON.parse(localStorage.getItem('merchan_designs_a')!)).toHaveLength(1);
  });

  it('al cambiar de banda no pisa la galería guardada de la nueva banda', () => {
    localStorage.setItem('merchan_designs_b', JSON.stringify([diseno('b1'), diseno('b2')]));
    const { result, rerender } = renderHook(({ b }) => useDisenosMerchan(b), {
      initialProps: { b: 'a' },
    });
    act(() => result.current[1]([diseno('a1')]));
    rerender({ b: 'b' });
    expect(result.current[0].map((d) => d.id)).toEqual(['b1', 'b2']);
    expect(JSON.parse(localStorage.getItem('merchan_designs_b')!)).toHaveLength(2);
    expect(JSON.parse(localStorage.getItem('merchan_designs_a')!)).toHaveLength(1);
  });
});
