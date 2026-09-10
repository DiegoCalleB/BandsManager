import { useState, useEffect, useCallback } from 'react';

const TUTORIAL_PREFIX = 'bandmanager_tutorial_seen_';

export interface TutorialStep {
  title: string;
  description: string;
  icon?: string;
  tip?: string;
}

export interface ModuleTutorialContent {
  moduleId: string;
  moduleTitle: string;
  badge?: string;
  steps: TutorialStep[];
}

export function useModuleTutorial(moduleId: string) {
  const storageKey = `${TUTORIAL_PREFIX}${moduleId}`;
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [hasSeen, setHasSeen] = useState<boolean>(true);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(storageKey);
      setHasSeen(seen === 'true');
    } catch {
      setHasSeen(false);
    }
  }, [storageKey]);

  const openTutorial = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeTutorial = useCallback(() => {
    setIsOpen(false);
    try {
      localStorage.setItem(storageKey, 'true');
      setHasSeen(true);
    } catch (e) {
      console.warn('No se pudo guardar estado del tutorial:', e);
    }
  }, [storageKey]);

  const resetTutorial = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setHasSeen(false);
      setIsOpen(true);
    } catch (e) {
      console.warn('Error al resetear tutorial:', e);
    }
  }, [storageKey]);

  return {
    isOpen,
    hasSeen,
    openTutorial,
    closeTutorial,
    resetTutorial,
  };
}

export function resetAllTutorials() {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(TUTORIAL_PREFIX) || key === 'bandmanager_profile_wizard_completed') {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.warn('Error borrando tutoriales:', e);
  }
}
