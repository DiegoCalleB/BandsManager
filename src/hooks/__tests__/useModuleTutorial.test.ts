import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MODULE_TUTORIALS } from '../../config/moduleTutorials';
import { ModuleTutorialId } from '../../types/tutorial';

describe('Module Tutorials Configuration', () => {
  const targetModules: ModuleTutorialId[] = ['epk', 'fans', 'calendario', 'repertorio', 'song_studio', 'booking'];

  it('contains configurations for all 6 required modules', () => {
    targetModules.forEach((id) => {
      expect(MODULE_TUTORIALS[id]).toBeDefined();
      expect(MODULE_TUTORIALS[id].steps.length).toBeGreaterThanOrEqual(3);
      expect(MODULE_TUTORIALS[id].steps.length).toBeLessThanOrEqual(4);
    });
  });

  it('each step has a title, musicianHook, description and keyPoints', () => {
    targetModules.forEach((id) => {
      const config = MODULE_TUTORIALS[id];
      config.steps.forEach((step) => {
        expect(step.title).toBeTruthy();
        expect(step.musicianHook).toBeTruthy();
        expect(step.musicianHook.length).toBeGreaterThan(10);
        expect(step.description).toBeTruthy();
        expect(step.keyPoints.length).toBeGreaterThanOrEqual(2);
      });
    });
  });
});
