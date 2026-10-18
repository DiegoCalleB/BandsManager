// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';

const getState = vi.fn();
vi.mock('../../services/api', () => {
  class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  }
  return { api: { getState: (...a: unknown[]) => getState(...a) }, ApiError };
});

import { useAppData } from '../useAppData';

const camp = (id: string, isActive: boolean) => ({ id, name: id, isActive });
const estado = (extra: Record<string, unknown> = {}) => ({
  leads: [{ id: 'l1' }, { id: 'l1' }, { id: 'l2' }],
  rehearsals: [{ id: 'r1', asistentes: '["Ana","Luis"]', convocados_nombres: 'Ana, Luis' }],
  concerts: [{ id: 'c1', convocados_ids: ['a', 'b'] }],
  epkConfig: { bio: 'hola' },
  ...extra,
});

describe('useAppData (carga del estado)', () => {
  beforeEach(() => {
    localStorage.clear();
    getState.mockReset();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('sin sesión no pide nada', () => {
    renderHook(() => useAppData(false, undefined));
    expect(getState).not.toHaveBeenCalled();
  });

  it('con sesión carga, deduplica y normaliza listas', async () => {
    getState.mockResolvedValue(estado());
    const { result } = renderHook(() => useAppData(true, 'band-1'));
    await waitFor(() => expect(result.current.syncStatus).toBe('synced'));
    expect(result.current.leads.map((l) => l.id)).toEqual(['l1', 'l2']);
    expect(result.current.rehearsals[0].asistentes).toEqual(['Ana', 'Luis']);
    expect(result.current.rehearsals[0].convocados_nombres).toEqual(['Ana', 'Luis']);
    expect(result.current.concerts[0].convocados_ids).toEqual(['a', 'b']);
    expect(result.current.epkConfig).toEqual({ bio: 'hola' });
    expect(result.current.isLoading).toBe(false);
  });

  it('sincroniza las campañas del servidor, incluida la lista vacía', async () => {
    getState.mockResolvedValue(estado({ campaigns: [camp('a', false), camp('b', true)] }));
    const { result } = renderHook(() => useAppData(true, 'band-1'));
    await waitFor(() => expect(result.current.syncStatus).toBe('synced'));
    expect(result.current.activeCampaign?.id).toBe('b');
    expect(JSON.parse(localStorage.getItem('bandmanager_active_campaign') as string).id).toBe('b');

    getState.mockResolvedValue(estado({ campaigns: [] }));
    await act(async () => {
      await result.current.fetchState();
    });
    expect(result.current.campaigns).toEqual([]);
    expect(result.current.activeCampaign).toBeNull();
    expect(localStorage.getItem('bandmanager_active_campaign')).toBeNull();
  });

  it('al cambiar de banda vacía EPK y campaña activa mientras llegan los datos nuevos', async () => {
    getState.mockResolvedValueOnce(estado({ campaigns: [camp('a', true)] }));
    const { result, rerender } = renderHook(({ banda }) => useAppData(true, banda), { initialProps: { banda: 'band-1' } });
    await waitFor(() => expect(result.current.activeCampaign?.id).toBe('a'));
    expect(result.current.epkConfig).toEqual({ bio: 'hola' });

    let resolver: (v: unknown) => void = () => undefined;
    getState.mockReturnValueOnce(new Promise((r) => (resolver = r)));
    rerender({ banda: 'band-2' });
    expect(result.current.epkConfig).toEqual({});
    expect(result.current.activeCampaign).toBeNull();
    await act(async () => resolver(estado({ epkConfig: { bio: 'otra' } })));
    expect(result.current.epkConfig).toEqual({ bio: 'otra' });
    expect(getState).toHaveBeenCalledTimes(2);
  });

  it('reintenta dos veces con pausa y acaba en error', async () => {
    vi.useFakeTimers();
    getState.mockRejectedValue(new Error('caído'));
    const { result } = renderHook(() => useAppData(true, 'band-1'));
    await act(async () => undefined);
    expect(getState).toHaveBeenCalledTimes(1);
    expect(result.current.syncStatus).toBe('syncing');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(getState).toHaveBeenCalledTimes(2);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(getState).toHaveBeenCalledTimes(3);
    expect(result.current.syncStatus).toBe('error');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(getState).toHaveBeenCalledTimes(3);
  });

  it('un reintento con éxito deja el estado sincronizado', async () => {
    vi.useFakeTimers();
    getState.mockRejectedValueOnce(new Error('caído')).mockResolvedValue(estado());
    const { result } = renderHook(() => useAppData(true, 'band-1'));
    await act(async () => undefined);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(result.current.syncStatus).toBe('synced');
    expect(result.current.leads).toHaveLength(2);
  });

  it('los eventos app-data-updated y github-agent-completed refrescan', async () => {
    getState.mockResolvedValue(estado());
    const { result } = renderHook(() => useAppData(true, 'band-1'));
    await waitFor(() => expect(result.current.syncStatus).toBe('synced'));
    getState.mockClear();
    await act(async () => {
      window.dispatchEvent(new Event('app-data-updated'));
      window.dispatchEvent(new Event('github-agent-completed'));
    });
    expect(getState).toHaveBeenCalledTimes(2);
  });
});
