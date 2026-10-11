// @vitest-environment happy-dom
/**
 * Comportamiento de useProfileBands: alta y baja de bandas desde el perfil.
 * Es el único sitio donde un usuario crea una banda nueva o se sale de una: si el estado local no
 * se actualiza con lo que devuelve el servidor, el selector de banda queda mintiendo.
 */
import { act, renderHook } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../../../../types';

const api = vi.hoisted(() => ({ createBand: vi.fn(), leaveBand: vi.fn(), startCheckout: vi.fn() }));
vi.mock('../../../../services/api', () => ({ api }));

import { useProfileBands, type ProfileBandsParams } from '../useProfileBands';

const usuario = { id: 'u1', name: 'Ana', username: 'ana', email: 'ana@example.com' } as User;
const evento = { preventDefault: vi.fn() } as unknown as React.FormEvent;

function montar(over: Partial<ProfileBandsParams> = {}) {
  const params: ProfileBandsParams = {
    setLocalAvailableBands: vi.fn(),
    availableBands: [],
    currentUser: usuario,
    setError: vi.fn(),
    setSuccessMsg: vi.fn(),
    onUpdateUser: vi.fn(),
    setSelectedMainBandId: vi.fn(),
    onRefreshData: vi.fn(),
    ...over,
  };
  return { params, ...renderHook(() => useProfileBands(params)) };
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('useProfileBands: crear banda', () => {
  it('sin nombre no llama al servidor y avisa', async () => {
    const { result, params } = montar();
    await act(() => result.current.handleCreateBandInProfile(evento));
    expect(api.createBand).not.toHaveBeenCalled();
    expect(params.setError).toHaveBeenCalledWith(expect.stringMatching(/nombre/));
  });

  it('con éxito aplica usuario, bandas y banda principal que devuelve el servidor', async () => {
    const nuevo = { ...usuario, band_id: 'b2' };
    api.createBand.mockResolvedValue({ success: true, user: nuevo, availableBands: [{ band_id: 'b2', bandName: 'Los Nuevos' }], band_id: 'b2' });
    const { result, params } = montar();
    act(() => result.current.setCreateBandName('  Los Nuevos  '));
    await act(() => result.current.handleCreateBandInProfile(evento));

    // Alta simplificada (SIMPLE_PROMO_ONLY_BAND_CREATION): plan promo, sin pasar por Stripe.
    expect(api.createBand).toHaveBeenCalledWith(expect.objectContaining({ bandName: 'Los Nuevos', leaderName: 'Ana', plan: 'promo' }));
    expect(api.startCheckout).not.toHaveBeenCalled();
    expect(params.onUpdateUser).toHaveBeenCalledWith(nuevo);
    expect(params.setLocalAvailableBands).toHaveBeenLastCalledWith([{ band_id: 'b2', bandName: 'Los Nuevos' }]);
    expect(params.setSelectedMainBandId).toHaveBeenCalledWith('b2');
    expect(params.onRefreshData).toHaveBeenCalled();
    expect(result.current.createBandName).toBe('');
    expect(result.current.isCreatingBand).toBe(false);
  });

  it('si el servidor rechaza, muestra su error y no toca el usuario', async () => {
    api.createBand.mockResolvedValue({ success: false, error: 'Límite de bandas alcanzado' });
    const { result, params } = montar();
    act(() => result.current.setCreateBandName('Otra'));
    await act(() => result.current.handleCreateBandInProfile(evento));
    expect(params.setError).toHaveBeenLastCalledWith('Límite de bandas alcanzado');
    expect(params.onUpdateUser).not.toHaveBeenCalled();
    expect(result.current.isCreatingBand).toBe(false);
  });
});

describe('useProfileBands: salir de una banda', () => {
  it('con éxito selecciona la banda principal que queda', async () => {
    api.leaveBand.mockResolvedValue({ success: true, user: { ...usuario, main_band_id: 'b1' }, availableBands: [] });
    const { result, params } = montar();
    act(() => result.current.setBandToDeleteInProfile({ id: 'b2', name: 'Vieja' }));
    await act(() => result.current.handleConfirmDeleteBandInProfile());
    expect(api.leaveBand).toHaveBeenCalledWith('b2');
    expect(params.setSelectedMainBandId).toHaveBeenCalledWith('b1');
    expect(params.setSuccessMsg).toHaveBeenLastCalledWith(expect.stringContaining('Vieja'));
    expect(result.current.deletingBandId).toBeNull();
  });

  it('un fallo de red se traduce a un mensaje comprensible', async () => {
    api.leaveBand.mockRejectedValue(new Error('Failed to fetch'));
    const { result, params } = montar();
    act(() => result.current.setBandToDeleteInProfile({ id: 'b2', name: 'Vieja' }));
    await act(() => result.current.handleConfirmDeleteBandInProfile());
    expect(params.setError).toHaveBeenLastCalledWith(expect.stringMatching(/conexión con el servidor/));
  });

  it('sin banda elegida no hace nada', async () => {
    const { result } = montar();
    await act(() => result.current.handleConfirmDeleteBandInProfile());
    expect(api.leaveBand).not.toHaveBeenCalled();
  });
});
