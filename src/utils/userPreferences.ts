import { api } from '../services/api';
import { User } from '../types';
import { syncCalendarPreferencesFromUser } from './calendarViewPreferences';

export const TUTORIAL_STORAGE_PREFIX = 'bm_tutorial_seen_';
export const ONBOARDING_GLOBAL_KEY = 'bandmanager_onboarding_completed';
export const PROFILE_WIZARD_GLOBAL_KEY = 'bandmanager_profile_wizard_completed';

/**
 * Normaliza un identificador de banda para guardado de preferencias
 */
export function cleanBandKey(bandId?: string): string {
  if (!bandId) return '';
  return bandId
    .replace(/^(band|reg)-/, '')
    .trim()
    .toLowerCase();
}

/**
 * Hidrata el localStorage del navegador con las preferencias del usuario cargadas desde Supabase.
 * Se ejecuta al iniciar sesión o al refrescar la sesión en background.
 */
export function syncAllUserPreferencesFromUser(user?: User | null): void {
  if (!user || typeof localStorage === 'undefined') return;

  // 1. Sincronizar preferencias del calendario
  syncCalendarPreferencesFromUser(user);

  const uiPrefs = user.ui_preferences || {};

  // 2. Sincronizar tutoriales vistos
  if (Array.isArray(uiPrefs.tutorials_seen)) {
    uiPrefs.tutorials_seen.forEach((moduleId: string) => {
      if (moduleId && typeof moduleId === 'string') {
        localStorage.setItem(`${TUTORIAL_STORAGE_PREFIX}${moduleId}`, 'true');
      }
    });
  }

  // 3. Sincronizar onboarding global
  if (uiPrefs.onboarding_completed) {
    localStorage.setItem(ONBOARDING_GLOBAL_KEY, 'true');
  }

  // 4. Sincronizar onboarding y asistente de perfil por banda
  if (Array.isArray(uiPrefs.onboarding_completed_bands)) {
    uiPrefs.onboarding_completed_bands.forEach((bId: string) => {
      const clean = cleanBandKey(bId);
      if (clean) {
        localStorage.setItem(`${ONBOARDING_GLOBAL_KEY}_${clean}`, 'true');
      }
    });
  }

  if (Array.isArray(uiPrefs.profile_wizard_completed_bands)) {
    uiPrefs.profile_wizard_completed_bands.forEach((bId: string) => {
      const clean = cleanBandKey(bId);
      if (clean) {
        localStorage.setItem(`${PROFILE_WIZARD_GLOBAL_KEY}_${clean}`, 'true');
      }
    });
  }
}

/**
 * Comprueba si un tutorial contextual ya ha sido visto por el usuario
 * (comprobando primero en localStorage y luego en ui_preferences del usuario).
 */
export function isTutorialSeen(moduleId: string, user?: User | null): boolean {
  if (typeof localStorage === 'undefined') return false;

  // 1. Comprobación rápida en localStorage (caché local)
  if (localStorage.getItem(`${TUTORIAL_STORAGE_PREFIX}${moduleId}`) === 'true') {
    return true;
  }

  // 2. Comprobación en el objeto usuario (Supabase)
  if (user?.ui_preferences?.tutorials_seen && Array.isArray(user.ui_preferences.tutorials_seen)) {
    if (user.ui_preferences.tutorials_seen.includes(moduleId)) {
      localStorage.setItem(`${TUTORIAL_STORAGE_PREFIX}${moduleId}`, 'true');
      return true;
    }
  }

  // 3. Comprobación en usuario en caché de localStorage
  try {
    const cachedUserStr = localStorage.getItem('bakandeya_user');
    if (cachedUserStr) {
      const parsed = JSON.parse(cachedUserStr);
      if (parsed?.ui_preferences?.tutorials_seen?.includes(moduleId)) {
        localStorage.setItem(`${TUTORIAL_STORAGE_PREFIX}${moduleId}`, 'true');
        return true;
      }
    }
  } catch {}

  return false;
}

/**
 * Marca un tutorial como visto y lo persiste tanto en localStorage como en Supabase (users.ui_preferences).
 */
export async function markTutorialSeen(moduleId: string, syncToSupabase = true): Promise<boolean> {
  if (!moduleId) return false;

  // 1. Persistencia instantánea en localStorage
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(`${TUTORIAL_STORAGE_PREFIX}${moduleId}`, 'true');
    } catch {}
  }

  // 2. Actualizar optimísticamente el usuario en caché
  let currentTutorials: string[] = [];
  if (typeof localStorage !== 'undefined') {
    try {
      const cachedUserStr = localStorage.getItem('bakandeya_user');
      if (cachedUserStr) {
        const user = JSON.parse(cachedUserStr);
        const currentPrefs = user.ui_preferences || {};
        currentTutorials = Array.isArray(currentPrefs.tutorials_seen) ? currentPrefs.tutorials_seen : [];
        if (!currentTutorials.includes(moduleId)) {
          currentTutorials.push(moduleId);
        }
        user.ui_preferences = {
          ...currentPrefs,
          tutorials_seen: currentTutorials,
        };
        localStorage.setItem('bakandeya_user', JSON.stringify(user));
      }
    } catch {}
  }

  // 3. Persistir en Supabase
  if (syncToSupabase) {
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('bakandeya_token') || localStorage.getItem('token') : null;

      if (token) {
        const response = await api.saveUiPreferences({
          tutorials_seen: currentTutorials.length > 0 ? currentTutorials : [moduleId],
        });
        if (response?.user && typeof localStorage !== 'undefined') {
          localStorage.setItem('bakandeya_user', JSON.stringify(response.user));
        }
        return true;
      }
    } catch (err) {
      console.warn('[UserPreferences] No se pudo sincronizar tutorial visto con Supabase:', err);
    }
  }

  return false;
}

/**
 * Comprueba si el onboarding o asistente de perfil de una banda ya ha sido completado.
 */
export function isOnboardingCompleted(
  bandId?: string,
  user?: User | null
): {
  wizardCompleted: boolean;
  onboardingCompleted: boolean;
} {
  const clean = cleanBandKey(bandId);

  let wizardCompleted = false;
  let onboardingCompleted = false;

  if (typeof localStorage !== 'undefined') {
    wizardCompleted = clean
      ? localStorage.getItem(`${PROFILE_WIZARD_GLOBAL_KEY}_${clean}`) === 'true'
      : localStorage.getItem(PROFILE_WIZARD_GLOBAL_KEY) === 'true';

    onboardingCompleted = clean
      ? localStorage.getItem(`${ONBOARDING_GLOBAL_KEY}_${clean}`) === 'true'
      : localStorage.getItem(ONBOARDING_GLOBAL_KEY) === 'true';
  }

  if (user?.ui_preferences) {
    const prefs = user.ui_preferences;
    if (prefs.onboarding_completed) {
      onboardingCompleted = true;
    }
    if (clean && Array.isArray(prefs.onboarding_completed_bands) && prefs.onboarding_completed_bands.includes(clean)) {
      onboardingCompleted = true;
    }
    if (clean && Array.isArray(prefs.profile_wizard_completed_bands) && prefs.profile_wizard_completed_bands.includes(clean)) {
      wizardCompleted = true;
    }
  }

  return { wizardCompleted, onboardingCompleted };
}

/**
 * Marca el asistente / onboarding de la banda como completado y lo sincroniza en Supabase.
 */
export async function markOnboardingCompleted(
  bandId?: string,
  options: { wizard?: boolean; onboarding?: boolean } = { wizard: true, onboarding: true },
  syncToSupabase = true
): Promise<boolean> {
  const clean = cleanBandKey(bandId);

  // 1. Guardar en localStorage
  if (typeof localStorage !== 'undefined') {
    try {
      if (options.onboarding) {
        localStorage.setItem(ONBOARDING_GLOBAL_KEY, 'true');
        if (clean) localStorage.setItem(`${ONBOARDING_GLOBAL_KEY}_${clean}`, 'true');
      }
      if (options.wizard) {
        localStorage.setItem(PROFILE_WIZARD_GLOBAL_KEY, 'true');
        if (clean) localStorage.setItem(`${PROFILE_WIZARD_GLOBAL_KEY}_${clean}`, 'true');
      }
    } catch {}
  }

  // 2. Actualizar usuario en caché
  let updatedOnboardingBands: string[] = [];
  let updatedWizardBands: string[] = [];

  if (typeof localStorage !== 'undefined') {
    try {
      const cachedUserStr = localStorage.getItem('bakandeya_user');
      if (cachedUserStr) {
        const user = JSON.parse(cachedUserStr);
        const currentPrefs = user.ui_preferences || {};
        updatedOnboardingBands = Array.isArray(currentPrefs.onboarding_completed_bands) ? [...currentPrefs.onboarding_completed_bands] : [];
        updatedWizardBands = Array.isArray(currentPrefs.profile_wizard_completed_bands)
          ? [...currentPrefs.profile_wizard_completed_bands]
          : [];

        if (clean) {
          if (!updatedOnboardingBands.includes(clean)) updatedOnboardingBands.push(clean);
          if (!updatedWizardBands.includes(clean)) updatedWizardBands.push(clean);
        }

        user.ui_preferences = {
          ...currentPrefs,
          onboarding_completed: true,
          onboarding_completed_bands: updatedOnboardingBands,
          profile_wizard_completed_bands: updatedWizardBands,
        };
        localStorage.setItem('bakandeya_user', JSON.stringify(user));
      }
    } catch {}
  }

  // 3. Sincronizar en Supabase
  if (syncToSupabase) {
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('bakandeya_token') || localStorage.getItem('token') : null;

      if (token) {
        const response = await api.saveUiPreferences({
          onboarding_completed: true,
          onboarding_completed_bands:
            clean && !updatedOnboardingBands.includes(clean) ? [...updatedOnboardingBands, clean] : updatedOnboardingBands,
          profile_wizard_completed_bands:
            clean && !updatedWizardBands.includes(clean) ? [...updatedWizardBands, clean] : updatedWizardBands,
        });
        if (response?.user && typeof localStorage !== 'undefined') {
          localStorage.setItem('bakandeya_user', JSON.stringify(response.user));
        }
        return true;
      }
    } catch (err) {
      console.warn('[UserPreferences] No se pudo sincronizar onboarding completado con Supabase:', err);
    }
  }

  return false;
}
