import { describe, expect, it, vi } from 'vitest';
import { asignarInvitacion, invitacionPendiente, limpiarInvitacion, tokenInvitacionValido } from '../invitacion';

describe('invitación de miembro', () => {
  it('el token en claro valida y solo se guarda su hash', () => {
    const u: any = { id: 'u1', ui_preferences: { tema: 'oscuro' } };
    const token = asignarInvitacion(u);
    expect(invitacionPendiente(u)).toBe(true);
    expect(tokenInvitacionValido(u, token)).toBe(true);
    expect(JSON.stringify(u)).not.toContain(token);
    expect(u.ui_preferences.tema).toBe('oscuro'); // no pisa otras preferencias
  });

  it('rechaza tokens ajenos, vacíos o de otro tipo', () => {
    const u: any = {};
    asignarInvitacion(u);
    for (const malo of ['', 'abc', undefined, null, 42, 'x'.repeat(500)]) {
      expect(tokenInvitacionValido(u, malo)).toBe(false);
    }
  });

  it('un usuario sin invitación nunca valida (cuenta ya activada o creada por registro)', () => {
    expect(tokenInvitacionValido({ ui_preferences: {} }, 'cualquiera')).toBe(false);
    expect(invitacionPendiente({ ui_preferences: {} })).toBe(false);
  });

  it('caduca a los 14 días', () => {
    vi.useFakeTimers();
    const u: any = {};
    const token = asignarInvitacion(u);
    vi.setSystemTime(Date.now() + 15 * 24 * 60 * 60 * 1000);
    expect(tokenInvitacionValido(u, token)).toBe(false);
    vi.useRealTimers();
  });

  it('limpiarInvitacion deja la cuenta activada y conserva el resto de preferencias', () => {
    const u: any = { ui_preferences: { tema: 'oscuro' } };
    const token = asignarInvitacion(u);
    limpiarInvitacion(u);
    expect(invitacionPendiente(u)).toBe(false);
    expect(tokenInvitacionValido(u, token)).toBe(false);
    expect(u.ui_preferences).toEqual({ tema: 'oscuro' });
  });
});
