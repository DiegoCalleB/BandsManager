import { useState, useEffect, useCallback } from 'react';
import { ModuleTutorialId } from '../types/tutorial';

const STORAGE_PREFIX = 'bm_tutorial_seen_';

export function useModuleTutorial(moduleId: ModuleTutorialId, autoOpenFirstTime = true) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(`${STORAGE_PREFIX}${moduleId}`);
      if (!seen && autoOpenFirstTime) {
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
  }, [moduleId, autoOpenFirstTime]);

  const openTutorial = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeTutorial = useCallback((markAsSeen = true) => {
    setIsOpen(false);
    if (markAsSeen) {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${moduleId}`, 'true');
      } catch {
        // ignore
      }
    }
  }, [moduleId]);

  const resetTutorialSeen = useCallback(() => {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${moduleId}`);
    } catch {
      // ignore
    }
  }, [moduleId]);

  return {
    isOpen,
    hasLoaded,
    openTutorial,
    closeTutorial,
    resetTutorialSeen
  };
}
