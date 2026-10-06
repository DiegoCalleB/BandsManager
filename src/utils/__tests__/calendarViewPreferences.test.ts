// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CALENDAR_DEFAULT_MONTHS_KEY,
  CALENDAR_DEVICE_KEY_PREFIX,
  getCalendarDefaultMonths,
  setCalendarDefaultMonths,
  isTwoMonthsDefault,
  getAllDevicePreferences,
  syncCalendarPreferencesFromUser
} from '../calendarViewPreferences';

describe('calendarViewPreferences: Configuración de vista 1M vs 2M en el calendario diferenciada por dispositivo', () => {
  let storage: Record<string, string> = {};

  const mockLocalStorage = {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, val: string) => { storage[key] = val; },
    removeItem: (key: string) => { delete storage[key]; },
    clear: () => { storage = {}; },
  };

  beforeEach(() => {
    storage = {};
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('devuelve 1 mes en móvil y 2 meses en escritorio por defecto cuando no hay ninguna preferencia guardada', () => {
    expect(getCalendarDefaultMonths('mobile')).toBe('1');
    expect(getCalendarDefaultMonths('desktop')).toBe('2');
  });

  it('guarda y recupera preferencias diferenciadas para móvil y escritorio', async () => {
    await setCalendarDefaultMonths('1', 'mobile', false);
    await setCalendarDefaultMonths('2', 'desktop', false);

    expect(localStorage.getItem(`${CALENDAR_DEVICE_KEY_PREFIX}mobile`)).toBe('1');
    expect(localStorage.getItem(`${CALENDAR_DEVICE_KEY_PREFIX}desktop`)).toBe('2');

    expect(getCalendarDefaultMonths('mobile')).toBe('1');
    expect(getCalendarDefaultMonths('desktop')).toBe('2');

    const allPrefs = getAllDevicePreferences();
    expect(allPrefs.mobile).toBe('1');
    expect(allPrefs.desktop).toBe('2');
  });

  it('permite reconfigurar de vuelta a 1 mes para escritorio', async () => {
    await setCalendarDefaultMonths('2', 'desktop', false);
    expect(getCalendarDefaultMonths('desktop')).toBe('2');

    await setCalendarDefaultMonths('1', 'desktop', false);
    expect(getCalendarDefaultMonths('desktop')).toBe('1');
  });

  it('sincroniza preferencias desde el perfil de usuario de Supabase', () => {
    const mockUser: any = {
      id: 'usr-123',
      name: 'Diego',
      ui_preferences: {
        calendar_default_months: {
          mobile: '1',
          desktop: '2'
        }
      }
    };

    syncCalendarPreferencesFromUser(mockUser);

    expect(getCalendarDefaultMonths('mobile')).toBe('1');
    expect(getCalendarDefaultMonths('desktop')).toBe('2');
  });

  it('devuelve 1 mes por defecto ante valores inesperados en localStorage', () => {
    localStorage.setItem(`${CALENDAR_DEVICE_KEY_PREFIX}mobile`, 'invalid_value');
    expect(getCalendarDefaultMonths('mobile')).toBe('1');
  });
});

