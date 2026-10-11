// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBrowserPushNotifications } from '../useBrowserPushNotifications';

describe('useBrowserPushNotifications (estado inicial y eventos)', () => {
  beforeEach(() => localStorage.clear());

  it('carga configuración e historial guardados desde el primer render', () => {
    localStorage.setItem('bandmanager_notification_history_v1', JSON.stringify([{ id: 'h1' }]));
    const { result } = renderHook(() => useBrowserPushNotifications({ isLoggedIn: false }));
    expect(result.current.history).toEqual([{ id: 'h1' }]);
    expect(result.current.config).toBeTruthy();
    expect(typeof result.current.isSupported).toBe('boolean');
  });

  it('refleja los eventos de configuración e historial actualizados', () => {
    const { result } = renderHook(() => useBrowserPushNotifications({ isLoggedIn: false }));
    const nueva = { ...result.current.config, enabled: !result.current.config.enabled };
    act(() => {
      window.dispatchEvent(new CustomEvent('notification-config-updated', { detail: nueva }));
    });
    expect(result.current.config.enabled).toBe(nueva.enabled);
    const historial = [{ id: 'x' }];
    act(() => {
      window.dispatchEvent(new CustomEvent('notification-history-updated', { detail: historial }));
    });
    expect(result.current.history).toEqual(historial);
  });
});
