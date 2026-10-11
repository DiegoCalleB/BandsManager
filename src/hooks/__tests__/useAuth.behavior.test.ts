// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { User } from '../../types';

const verifyMe = vi.fn();
const logout = vi.fn();
vi.mock('../../services/api', () => ({
  api: { verifyMe: (...a: unknown[]) => verifyMe(...a), logout: (...a: unknown[]) => logout(...a), setMainBand: vi.fn() },
}));
vi.mock('../../utils/promocionApi', () => ({ atribuirReferido: vi.fn() }));
vi.mock('../../utils/referido', () => ({ atribuirReferidoPendiente: vi.fn(async () => undefined) }));
vi.mock('../../utils/userPreferences', () => ({ syncAllUserPreferencesFromUser: vi.fn() }));
vi.mock('../../utils/sessionCookie', () => ({ guardarCookieDeSesion: vi.fn(), borrarCookieDeSesion: vi.fn() }));

import { useAuth } from '../useAuth';

const usuario = (extra: Partial<User> = {}) => ({ id: 'u1', email: 'a@b.c', role: 'leader', band_id: 'band-1', ...extra }) as unknown as User;

function sesionGuardada(token = 'tok') {
  localStorage.setItem('bandmanager_token', token);
  localStorage.setItem('bandmanager_user', JSON.stringify(usuario()));
}

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    verifyMe.mockReset();
    logout.mockReset();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  it('sin sesión guardada arranca deslogueado y no consulta al servidor', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.currentUser).toBeNull();
    expect(verifyMe).not.toHaveBeenCalled();
  });

  it('con token guardado verifica la sesión al montar y refleja usuario, bandas y token nuevo', async () => {
    sesionGuardada();
    verifyMe.mockResolvedValue({ user: usuario({ bandName: 'Nueva' }), availableBands: [{ band_id: 'band-1' }], token: 'tok2' });
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoggedIn).toBe(true);
    await waitFor(() => expect(result.current.authToken).toBe('tok2'));
    expect(result.current.currentUser?.bandName).toBe('Nueva');
    expect(result.current.availableBands).toHaveLength(1);
    expect(localStorage.getItem('bandmanager_token')).toBe('tok2');
    expect(JSON.parse(localStorage.getItem('bandmanager_user') as string).bandName).toBe('Nueva');
    expect(result.current.isAdmin).toBe(true);
  });

  it('un 401 explícito cierra la sesión y limpia el almacenamiento', async () => {
    sesionGuardada();
    verifyMe.mockRejectedValue(Object.assign(new Error('Sesión no válida'), { status: 401 }));
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoggedIn).toBe(false));
    expect(result.current.currentUser).toBeNull();
    expect(result.current.authToken).toBeNull();
    expect(localStorage.getItem('bandmanager_token')).toBeNull();
    expect(localStorage.getItem('bandmanager_user')).toBeNull();
  });

  it('un fallo transitorio estando online mantiene la sesión', async () => {
    sesionGuardada();
    verifyMe.mockRejectedValue(new Error('500 boom'));
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(verifyMe).toHaveBeenCalled());
    await act(async () => undefined);
    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.currentUser?.id).toBe('u1');
  });

  it('estando offline restaura el usuario en caché', async () => {
    sesionGuardada();
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    verifyMe.mockRejectedValue(new Error('Failed to fetch'));
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(verifyMe).toHaveBeenCalled());
    await act(async () => undefined);
    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.currentUser?.id).toBe('u1');
  });

  it('el evento de preferencias fusiona ui_preferences en el usuario', async () => {
    sesionGuardada();
    verifyMe.mockResolvedValue({ user: usuario(), availableBands: [] });
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(verifyMe).toHaveBeenCalled());
    act(() => {
      window.dispatchEvent(new CustomEvent('bm:ui-preferences-saved', { detail: { orden: 'a' } }));
    });
    expect((result.current.currentUser as User & { ui_preferences?: Record<string, string> }).ui_preferences).toEqual({ orden: 'a' });
  });

  it('login normaliza la banda preferida y persiste la sesión', () => {
    const { result } = renderHook(() => useAuth());
    act(() => result.current.handleLoginSuccess(usuario({ band_id: '7', main_band_id: undefined }), 'tk', [{ band_id: 'band-7', bandName: 'Siete' } as never]));
    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.currentUser?.band_id).toBe('band-7');
    expect(result.current.currentUser?.bandName).toBe('Siete');
    expect(localStorage.getItem('bandmanager_token')).toBe('tk');
    expect(localStorage.getItem('bandmanager_logged_in')).toBe('true');
  });

  it('logout limpia estado y almacenamiento', async () => {
    sesionGuardada();
    verifyMe.mockResolvedValue({ user: usuario(), availableBands: [] });
    logout.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(verifyMe).toHaveBeenCalled());
    await act(async () => {
      await result.current.handleLogout();
    });
    expect(logout).toHaveBeenCalledWith('tok');
    expect(result.current.isLoggedIn).toBe(false);
    expect(localStorage.getItem('bandmanager_token')).toBeNull();
  });
});
