import { useState, useEffect, useCallback } from 'react';
import { ModuleTutorialId } from '../types/tutorial';
import { isTutorialSeen, markTutorialSeen, isOnboardingCompleted, TUTORIAL_STORAGE_PREFIX } from '../utils/userPreferences';

/**
 * Abre el tutorial de un módulo la primera vez que se entra y recuerda que ya se vio
 * (`bm_tutorial_seen_*`).
 */
export function useModuleTutorial(moduleId: ModuleTutorialId, autoOpenFirstTime = true) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const checkAndOpen = () => {
      try {
        // Si el usuario aún no ha terminado el onboarding general de la banda,
        // NO abrir automáticamente tutoriales contextuales por encima del asistente.
        const { onboardingCompleted, wizardCompleted } = isOnboardingCompleted();
        const isOnboardingActive = !onboardingCompleted || !wizardCompleted;

        const seen = isTutorialSeen(moduleId);
        if (!seen && autoOpenFirstTime && !isOnboardingActive) {
          // Small timeout to allow the main module to mount cleanly and avoid layout shift
          const timer = setTimeout(() => {
            setIsOpen(true);
          }, 350);
          return () => clearTimeout(timer);
        }
      } catch {
        // localStorage may be unavailable or disabled
      } finally {
        setHasLoaded(true);
      }
    };

    const cleanup = checkAndOpen();

    // Cuando el asistente de onboarding termine o se cierre, abrir el tutorial contextual si aplica
    const handleOnboardingFinished = () => {
      checkAndOpen();
    };

    window.addEventListener('bandmanager_onboarding_finished', handleOnboardingFinished);

    return () => {
      if (typeof cleanup === 'function') cleanup();
      window.removeEventListener('bandmanager_onboarding_finished', handleOnboardingFinished);
    };
  }, [moduleId, autoOpenFirstTime]);

  const openTutorial = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeTutorial = useCallback(
    (markAsSeen = true) => {
      setIsOpen(false);
      if (markAsSeen) {
        markTutorialSeen(moduleId, true).catch(() => {});
      }
    },
    [moduleId]
  );

  const resetTutorialSeen = useCallback(() => {
    try {
      localStorage.removeItem(`${TUTORIAL_STORAGE_PREFIX}${moduleId}`);
    } catch {
      // ignore
    }
  }, [moduleId]);

  return {
    isOpen,
    hasLoaded,
    openTutorial,
    closeTutorial,
    resetTutorialSeen,
  };
}
