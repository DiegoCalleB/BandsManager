import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resetAllTutorials } from '../useModuleTutorial';

describe('useModuleTutorial helpers', () => {
  let storage: Record<string, string> = {};

  const mockLocalStorage = {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, val: string) => { storage[key] = val; },
    removeItem: (key: string) => { delete storage[key]; },
    clear: () => { storage = {}; },
    get length() { return Object.keys(storage).length; },
    key: (i: number) => Object.keys(storage)[i] || null,
  };

  beforeEach(() => {
    storage = {};
    Object.defineProperty(mockLocalStorage, 'length', {
      get: () => Object.keys(storage).length
    });
    vi.stubGlobal('localStorage', storageProxy());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function storageProxy() {
    return new Proxy(mockLocalStorage, {
      get(target, prop: string) {
        if (prop in target) {
          return (target as any)[prop];
        }
        return storage[prop];
      },
      ownKeys() {
        return Object.keys(storage);
      },
      getOwnPropertyDescriptor(target, prop) {
        if (prop in storage) {
          return { enumerable: true, configurable: true, value: storage[prop] };
        }
        return Reflect.getOwnPropertyDescriptor(target, prop);
      }
    });
  }

  it('resetea todos los tutoriales y wizard de localStorage', () => {
    storage['bandmanager_tutorial_seen_booking'] = 'true';
    storage['bandmanager_tutorial_seen_epk'] = 'true';
    storage['bandmanager_profile_wizard_completed'] = 'true';
    storage['unrelated_key'] = 'keep_this';

    resetAllTutorials();

    expect(storage['bandmanager_tutorial_seen_booking']).toBeUndefined();
    expect(storage['bandmanager_tutorial_seen_epk']).toBeUndefined();
    expect(storage['bandmanager_profile_wizard_completed']).toBeUndefined();
    expect(storage['unrelated_key']).toBe('keep_this');
  });
});
