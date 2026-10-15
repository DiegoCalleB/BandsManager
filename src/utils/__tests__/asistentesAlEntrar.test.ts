import { describe, it, expect } from 'vitest';
import { asistentesAlEntrar } from '../userPreferences';

describe('asistentesAlEntrar', () => {
  it('con la bienvenida sin ver, abre solo la bienvenida', () => {
    expect(asistentesAlEntrar({ onboardingCompleted: false })).toEqual({ perfil: false, bienvenida: true });
  });

  it('con la bienvenida ya vista no abre nada', () => {
    expect(asistentesAlEntrar({ onboardingCompleted: true })).toEqual({ perfil: false, bienvenida: false });
  });

  it('nunca abre el asistente largo del perfil por su cuenta', () => {
    for (const onboardingCompleted of [true, false]) {
      expect(asistentesAlEntrar({ onboardingCompleted }).perfil).toBe(false);
    }
  });
});
