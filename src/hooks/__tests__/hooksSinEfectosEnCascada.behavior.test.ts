// @vitest-environment happy-dom
/**
 * Hooks que antes sincronizaban estado con un `setState` dentro de `useEffect` (render en cascada)
 * y ahora lo ajustan en el propio render o en el callback de la petición. Se comprueba que el
 * comportamiento visible es el mismo: reseteo al cambiar de contexto, carga inicial y acotado.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiFetch = vi.hoisted(() => vi.fn());
vi.mock('../../utils/api', () => ({ apiFetch }));

import { useApoyableDeals } from '../useApoyableDeals';
import { useEmailValidation } from '../useEmailValidation';
import { useMezclaGuardada } from '../useMezclaGuardada';
import { useMetronomo } from '../useMetronomo';
import { useNavegacionItems } from '../useNavegacionItems';
import { useSeguimientoEnsayo } from '../useSeguimientoEnsayo';

const deal = (id: string) => ({ deal_id: id, lugar_sala: 'Sala', ciudad: 'Bilbao', fecha_evento: '2026-12-01', total_acordado: 500, suggested_cents: 500 });

beforeEach(() => { apiFetch.mockReset(); localStorage.clear(); });
afterEach(() => vi.restoreAllMocks());

describe('useApoyableDeals', () => {
  it('carga los deals de la banda y los vacía al cambiar de banda antes de la nueva carga', async () => {
    let resolver: (v: unknown) => void = () => {};
    apiFetch.mockResolvedValueOnce({ deals: [deal('d1')] }).mockImplementationOnce(() => new Promise((r) => { resolver = r; }));
    const { result, rerender } = renderHook(({ banda }) => useApoyableDeals(true, banda), { initialProps: { banda: 'band-a' } });
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.deals.map((d) => d.deal_id)).toEqual(['d1']);

    rerender({ banda: 'band-b' });
    expect(result.current.deals).toEqual([]);
    expect(result.current.loaded).toBe(false);
    await act(async () => { resolver({ deals: [deal('d2')] }); });
    expect(result.current.deals.map((d) => d.deal_id)).toEqual(['d2']);
  });

  it('desactivado no pide nada', () => {
    const { result } = renderHook(() => useApoyableDeals(false, 'band-a'));
    expect(apiFetch).not.toHaveBeenCalled();
    expect(result.current.loaded).toBe(false);
  });

  it('si falla la petición deja la lista vacía y marca cargado', async () => {
    apiFetch.mockRejectedValueOnce(new Error('caído'));
    const { result } = renderHook(() => useApoyableDeals(true, 'band-a'));
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.deals).toEqual([]);
  });
});

describe('useEmailValidation', () => {
  it('empieza cargando y aplica las validaciones recibidas', async () => {
    apiFetch.mockResolvedValueOnce({ success: true, validities: { l1: false } });
    const { result } = renderHook(() => useEmailValidation());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.emailValidities).toEqual({ l1: false });
  });

  it('recargar vuelve a pedir y actualiza', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    apiFetch.mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce({ success: true, validities: { l2: true } });
    const { result } = renderHook(() => useEmailValidation());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.emailValidities).toEqual({});
    await act(async () => { await result.current.reloadEmailValidities(); });
    expect(result.current.emailValidities).toEqual({ l2: true });
  });
});

describe('useNavegacionItems', () => {
  it('si la lista encoge, el índice se queda en el último que existe y se navega desde ahí', () => {
    const { result, rerender } = renderHook(({ total }) => useNavegacionItems(total), { initialProps: { total: 5 } });
    act(() => result.current.irA(4));
    rerender({ total: 3 });
    expect(result.current.indice).toBe(2);
    expect(result.current.esUltimo).toBe(true);
    act(() => result.current.anterior());
    expect(result.current.indice).toBe(1);
  });
});

describe('useMezclaGuardada', () => {
  it('al cambiar de canción carga la mezcla guardada de esa canción y guarda los cambios en su clave', () => {
    localStorage.setItem('bm_mezcla_atril:s2', JSON.stringify({ ajustes: {}, velocidad: 0.75 }));
    const { result, rerender } = renderHook(({ id }) => useMezclaGuardada(id), { initialProps: { id: 's1' } });
    expect(result.current.velocidad).toBe(1);
    rerender({ id: 's2' });
    expect(result.current.velocidad).toBe(0.75);
    act(() => result.current.setVelocidad(0.5));
    expect(JSON.parse(localStorage.getItem('bm_mezcla_atril:s2') ?? '{}').velocidad).toBe(0.5);
    expect(localStorage.getItem('bm_mezcla_atril:s1')).toBeNull();
  });
});


describe('useMetronomo', () => {
  it('sigue el tempo de la canción cuando cambia y empieza parado en el primer pulso', () => {
    const { result, rerender } = renderHook(({ bpm }) => useMetronomo(bpm), { initialProps: { bpm: 100 } });
    expect(result.current.bpm).toBe(100);
    expect(result.current.activo).toBe(false);
    expect(result.current.pulso).toBe(0);
    rerender({ bpm: 1000 });
    expect(result.current.bpm).toBe(280);
  });
});

describe('useSeguimientoEnsayo', () => {
  it('el cronómetro de pista arranca solo y vuelve a cero al cambiar de pista', () => {
    vi.useFakeTimers();
    try {
      const { result, rerender } = renderHook(({ clave }) =>
        useSeguimientoEnsayo({ agenda: [], currentItem: null, claveDePista: clave, onUpdateRehearsal: vi.fn() }), { initialProps: { clave: 'a' } });
      expect(result.current.isTrackTimerActive).toBe(true);
      act(() => { vi.advanceTimersByTime(3000); });
      expect(result.current.trackSeconds).toBe(3);
      rerender({ clave: 'b' });
      expect(result.current.trackSeconds).toBe(0);
      act(() => { vi.advanceTimersByTime(2000); });
      expect(result.current.trackSeconds).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
