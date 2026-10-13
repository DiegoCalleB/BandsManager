// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';

const guardarApi = vi.hoisted(() => vi.fn());
vi.mock('../../../../services/api', () => ({ api: { saveUiPreferences: guardarApi } }));
vi.mock('../../../../services/sesionLocal', () => ({ leerUsuarioDeSesion: () => null }));

import { useGuardadoPanel, ESPERA_GUARDADO_MS } from '../useGuardadoPanel';
import type { DashboardWidgetConfig } from '../../../../types/dashboardWidgets';

const panel = (n: number) => [{ id: `w${n}`, type: 'calendar', wSpan: 12, visible: true, order: n }] as DashboardWidgetConfig[];

beforeEach(() => {
  vi.useFakeTimers();
  guardarApi.mockReset();
  guardarApi.mockResolvedValue({ success: true, persistido: true, ui_preferences: {} });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useGuardadoPanel', () => {
  it('agrupa los cambios seguidos y manda solo el último', async () => {
    const { result } = renderHook(() => useGuardadoPanel());
    act(() => {
      result.current.guardar(panel(1));
      result.current.guardar(panel(2));
      result.current.guardar(panel(3));
    });
    expect(guardarApi).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(ESPERA_GUARDADO_MS); });
    expect(guardarApi).toHaveBeenCalledTimes(1);
    expect(guardarApi).toHaveBeenCalledWith({ dashboard_widgets: panel(3) });
  });

  it('«inmediato» no espera', async () => {
    const { result } = renderHook(() => useGuardadoPanel());
    await act(async () => { result.current.guardar(panel(1), { inmediato: true }); });
    expect(guardarApi).toHaveBeenCalledTimes(1);
  });

  it('nunca hay dos envíos a la vez: lo que llega durante uno va después', async () => {
    let soltar!: () => void;
    guardarApi.mockImplementationOnce(() => new Promise((r) => { soltar = () => r({ success: true, persistido: true, ui_preferences: {} }); }));
    const { result } = renderHook(() => useGuardadoPanel());
    await act(async () => { result.current.guardar(panel(1), { inmediato: true }); });
    await act(async () => { result.current.guardar(panel(2), { inmediato: true }); });
    expect(guardarApi).toHaveBeenCalledTimes(1);
    expect(result.current.hayCambiosEnCurso()).toBe(true);
    await act(async () => { soltar(); });
    expect(guardarApi).toHaveBeenCalledTimes(2);
    expect(guardarApi).toHaveBeenLastCalledWith({ dashboard_widgets: panel(2) });
  });

  it('avisa del error cuando falla o cuando el servidor no pudo persistirlo, y no dice «guardado»', async () => {
    const { result } = renderHook(() => useGuardadoPanel());
    guardarApi.mockResolvedValueOnce({ success: true, persistido: false, ui_preferences: {} });
    await act(async () => { result.current.guardar(panel(1), { inmediato: true }); });
    expect(result.current.error).toBe(true);
    expect(result.current.guardado).toBe(false);

    guardarApi.mockRejectedValueOnce(new Error('caído'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await act(async () => { result.current.guardar(panel(2), { inmediato: true }); });
    expect(result.current.error).toBe(true);

    await act(async () => { result.current.guardar(panel(3), { inmediato: true }); });
    expect(result.current.error).toBe(false);
    expect(result.current.guardado).toBe(true);
  });

  it('al desmontar manda lo que estaba esperando en vez de perderlo', async () => {
    const { result, unmount } = renderHook(() => useGuardadoPanel());
    act(() => { result.current.guardar(panel(7)); });
    unmount();
    await vi.advanceTimersByTimeAsync(0);
    expect(guardarApi).toHaveBeenCalledWith({ dashboard_widgets: panel(7) });
  });
});
