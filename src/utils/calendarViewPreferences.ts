import { api } from '../services/api';
import { User } from '../types';

export const CALENDAR_DEFAULT_MONTHS_KEY = 'bandmanager_calendar_default_months';
export const CALENDAR_DEVICE_KEY_PREFIX = 'bandmanager_calendar_months_';

export type DeviceType = 'mobile' | 'desktop';
export type CalendarMonthsView = '1' | '2';

/**
 * Detecta si el entorno actual de visualización corresponde a móvil o escritorio.
 * Tiene en cuenta tanto el ancho de pantalla (breakpoint 768px de Tailwind) como el User-Agent.
 */
export function detectDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';
  try {
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
    const isNarrowScreen = window.innerWidth < 768;
    return isMobileUA || isNarrowScreen ? 'mobile' : 'desktop';
  } catch {
    return 'desktop';
  }
}

/**
 * Obtiene la configuración de vista de meses por defecto para el calendario según el tipo de dispositivo.
 * Por defecto devuelve'1' (vista limpia de 1 mes).
 */
export function getCalendarDefaultMonths(deviceType?: DeviceType): CalendarMonthsView {
  try {
    if (typeof localStorage === 'undefined') return '1';
    const targetDevice = deviceType || detectDeviceType();

    // 1. Comprobar clave específica del dispositivo en localStorage
    const saved = localStorage.getItem(`${CALENDAR_DEVICE_KEY_PREFIX}${targetDevice}`);
    if (saved === '1' || saved === '2') {
      return saved;
    }

    // 2. Comprobar en el usuario guardado en localStorage (proveniente de Supabase)
    const storedUserStr = localStorage.getItem('bandmanager_user');
    if (storedUserStr) {
      try {
        const user = JSON.parse(storedUserStr);
        const cloudPref = user?.ui_preferences?.calendar_default_months?.[targetDevice];
        if (cloudPref === '1' || cloudPref === '2') {
          // Cachear en localStorage para siguientes consultas síncronas
          localStorage.setItem(`${CALENDAR_DEVICE_KEY_PREFIX}${targetDevice}`, cloudPref);
          return cloudPref;
        }
      } catch {
        // Continuar a fallback
      }
    }

    // 3. Fallback a clave heredada genérica si existiera
    const legacySaved = localStorage.getItem(CALENDAR_DEFAULT_MONTHS_KEY);
    if (legacySaved === '1' || legacySaved === '2') {
      return legacySaved;
    }

    // 4. Por defecto inicial sin configurar: '1' mes en móvil y'2' meses en ordenador
    return targetDevice === 'desktop' ? '2' : '1';
  } catch {
    return '1';
  }
}

/**
 * Guarda la preferencia de vista por defecto para el dispositivo especificado (o actual).
 * Se persiste en localStorage de forma instantánea y, si hay sesión activa, se sincroniza en Supabase.
 */
export async function setCalendarDefaultMonths(
  mode: CalendarMonthsView,
  deviceType?: DeviceType,
  syncToSupabase: boolean = true
): Promise<boolean> {
  const targetDevice = deviceType || detectDeviceType();
  const currentDevice = detectDeviceType();

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`${CALENDAR_DEVICE_KEY_PREFIX}${targetDevice}`, mode);

      // Si se está cambiando el dispositivo actual, mantener compatibilidad con la clave global
      if (targetDevice === currentDevice) {
        localStorage.setItem(CALENDAR_DEFAULT_MONTHS_KEY, mode);
      }

      // Actualizar optimísticamente el usuario en caché local
      const storedUserStr = localStorage.getItem('bandmanager_user');
      if (storedUserStr) {
        try {
          const user = JSON.parse(storedUserStr);
          const currentUiPrefs = user.ui_preferences || {};
          const currentMonthsPrefs = currentUiPrefs.calendar_default_months || {};
          user.ui_preferences = {
            ...currentUiPrefs,
            calendar_default_months: {
              ...currentMonthsPrefs,
              [targetDevice]: mode,
            },
          };
          localStorage.setItem('bandmanager_user', JSON.stringify(user));
        } catch {
          // Error no bloqueante
        }
      }
    }
  } catch (err) {
    console.warn('[CalendarPreferences] No se pudo guardar la preferencia localmente:', err);
  }

  // Sincronizar en Supabase si hay sesión y está habilitado
  if (syncToSupabase) {
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('bandmanager_token') || localStorage.getItem('token') : null;

      if (token) {
        const response = await api.saveUiPreferences({
          calendar_default_months: {
            [targetDevice]: mode,
          },
        });
        if (response?.user && typeof localStorage !== 'undefined') {
          localStorage.setItem('bandmanager_user', JSON.stringify(response.user));
        }
        return true;
      }
    } catch (err) {
      console.warn('[CalendarPreferences] No se pudo sincronizar la preferencia con Supabase (quedó guardada en local):', err);
    }
  }

  return false;
}

/**
 * Hidrata las preferencias locales desde los datos del usuario procedentes de Supabase.
 */
export function syncCalendarPreferencesFromUser(user?: Pick<User, 'ui_preferences'> | null): void {
  if (!user || !user.ui_preferences?.calendar_default_months || typeof localStorage === 'undefined') return;

  const prefs = user.ui_preferences.calendar_default_months;
  if (prefs.mobile === '1' || prefs.mobile === '2') {
    localStorage.setItem(`${CALENDAR_DEVICE_KEY_PREFIX}mobile`, prefs.mobile);
  }
  if (prefs.desktop === '1' || prefs.desktop === '2') {
    localStorage.setItem(`${CALENDAR_DEVICE_KEY_PREFIX}desktop`, prefs.desktop);
  }

  const currentDevice = detectDeviceType();
  const currentPref = currentDevice === 'mobile' ? prefs.mobile : prefs.desktop;
  if (currentPref === '1' || currentPref === '2') {
    localStorage.setItem(CALENDAR_DEFAULT_MONTHS_KEY, currentPref);
  }
}

/**
 * Devuelve las preferencias configuradas para ambos tipos de dispositivos.
 */
export function getAllDevicePreferences(): { mobile: CalendarMonthsView; desktop: CalendarMonthsView } {
  return {
    mobile: getCalendarDefaultMonths('mobile'),
    desktop: getCalendarDefaultMonths('desktop'),
  };
}

/**
 * Devuelve true si la vista de 2 meses está configurada por defecto para el dispositivo actual.
 */
export function isTwoMonthsDefault(deviceType?: DeviceType): boolean {
  return getCalendarDefaultMonths(deviceType) === '2';
}
