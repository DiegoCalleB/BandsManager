// @vitest-environment happy-dom
/**
 * Comportamiento del guardado del asistente de configuración inicial.
 * Es lo primero que hace una banda nueva: si el EPK que se guarda pierde campos de la
 * configuración previa o mezcla bandas, el dossier público sale mal desde el primer día.
 */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EPKConfig, User } from '../../../../../types';

const markOnboardingCompleted = vi.hoisted(() => vi.fn(() => Promise.resolve()));
vi.mock('../../../../../utils/userPreferences', () => ({ markOnboardingCompleted }));

import { useOnboardingWizardController } from '../useOnboardingWizardController';
import type { ResolvedOnboardingWizardProps } from '../../../OnboardingWizardModal';

const usuario = { id: 'u1', name: 'Ana', username: 'ana', band_id: 'band-propia', bandName: 'Banda de Ana' } as User;

function montar(over: Partial<ResolvedOnboardingWizardProps> = {}) {
  const props: ResolvedOnboardingWizardProps = {
    isOpen: true,
    onClose: vi.fn(),
    currentUser: usuario,
    epkConfig: { bandId: 'band-propia', bandName: 'Banda de Ana', ciudad: 'Bilbao' } as unknown as EPKConfig,
    onUpdateEpkConfig: vi.fn(() => Promise.resolve()),
    onRefreshData: vi.fn(),
    bandId: '',
    bandName: '',
    bandLogoUrl: '',
    ...over,
  };
  return { props, ...renderHook(() => useOnboardingWizardController(props)) };
}

/** Último EPK enviado a guardar. */
const ultimoGuardado = (props: ResolvedOnboardingWizardProps) => {
  const llamadas = vi.mocked(props.onUpdateEpkConfig!).mock.calls;
  return llamadas[llamadas.length - 1][0];
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('asistente de configuración: guardado', () => {
  it('guarda en la banda del usuario y conserva lo que ya tenía el EPK', async () => {
    const { result, props } = montar();
    await act(() => result.current.handleSaveConfiguration());
    const epk = ultimoGuardado(props);
    expect(epk.bandId).toBe('band-propia');
    expect(epk.bandName).toBe('Banda de Ana');
    expect((epk as Record<string, unknown>).ciudad).toBe('Bilbao');
    expect(props.onRefreshData).toHaveBeenCalled();
  });

  it('la banda indicada por props manda sobre la del usuario (multibanda)', async () => {
    const { result, props } = montar({ bandId: 'band-segunda', bandName: 'Segunda' });
    await act(() => result.current.handleSaveConfiguration());
    expect(ultimoGuardado(props).bandId).toBe('band-segunda');
  });

  it('traduce los miembros y activa los bloques solo cuando hay datos', async () => {
    const { result, props } = montar();
    act(() => {
      result.current.setMembers([{ id: 'm1', name: 'Leo', role: 'Batería', instagram: '@leo' }]);
      result.current.setBizumNumber('600000000');
    });
    await act(() => result.current.handleSaveConfiguration());
    const epk = ultimoGuardado(props);
    expect(epk.miembros).toEqual([{ id: 'm1', nombre: 'Leo', rol: 'Batería', instagram: '@leo' }]);
    expect(epk.donacionRevolut).toMatchObject({ habilitado: true, bizumTelefono: '600000000' });
    expect(epk.resenasPrensa).toMatchObject({ habilitado: false, citas: [] });
    expect(epk.cifrasClave).toMatchObject({ habilitado: false });
  });

  it('en el último paso «Siguiente» guarda y pasa a la celebración', async () => {
    const { result, props } = montar();
    const ultimo = result.current.activeSteps.length - 1;
    act(() => result.current.setCurrentStepIndex(ultimo));
    await act(() => result.current.handleNextStep());
    expect(props.onUpdateEpkConfig).toHaveBeenCalledTimes(1);
    expect(result.current.currentStepIndex).toBe(ultimo + 1);
  });

  it('en un paso intermedio «Siguiente» avanza sin guardar', async () => {
    const { result, props } = montar();
    await act(() => result.current.handleNextStep());
    expect(result.current.currentStepIndex).toBe(1);
    expect(props.onUpdateEpkConfig).not.toHaveBeenCalled();
  });

  it('al terminar marca el asistente como completado para esa banda, avisa y cierra', () => {
    const { result, props } = montar();
    const aviso = vi.fn();
    window.addEventListener('bandmanager_onboarding_finished', aviso);
    act(() => result.current.handleFinishWizard());
    expect(markOnboardingCompleted).toHaveBeenCalledWith('band-propia', { wizard: true, onboarding: true }, true);
    expect(aviso).toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalled();
  });
});
