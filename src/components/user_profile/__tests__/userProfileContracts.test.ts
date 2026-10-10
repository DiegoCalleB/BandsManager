import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { useUserProfile } from '../UserProfileContext';
import { SIMPLE_PROMO_ONLY_BAND_CREATION } from '../profileModel';

const hookSources = import.meta.glob('../hooks/*.ts', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const viewSources = import.meta.glob(['../*.tsx', '!../UserProfileProvider.tsx'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;
const supportSources = import.meta.glob(['../UserProfileContext.ts', '../UserProfileProvider.tsx', '../profileModel.ts'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

describe('UserProfileModal: contracts after modularization', () => {
  it('keeps the container under 400 lines (AGENTS.md §5.6)', async () => {
    const mod = (await import('../../UserProfileModal?raw')) as { default: string };
    expect(mod.default.split('\n').length).toBeLessThan(400);
    expect(mod.default).toContain('useUserProfileController');
    expect(mod.default).toContain('export const UserProfileModal');
  });

  it.each(Object.entries(hookSources))('%s exports at least one hook', (_path, source) => {
    expect(source).toMatch(/export (async )?function use\w+/);
  });

  it.each(Object.entries(viewSources))('%s exports a component', (_path, source) => {
    expect(source).toMatch(/export (async )?function [A-Z]\w+|export const [A-Z]\w+/);
  });

  it('keeps every view and hook under 400 lines', () => {
    for (const source of [...Object.values(viewSources), ...Object.values(hookSources)]) {
      expect(source.split('\n').length).toBeLessThan(400);
    }
  });

  it('useUserProfile fails fast outside the provider', () => {
    const Orphan = () => {
      useUserProfile();
      return null;
    };
    expect(() => renderToString(createElement(Orphan))).toThrow(/UserProfileProvider/);
  });

  it('keeps band creation limited to the Promo plan while in beta', () => {
    expect(SIMPLE_PROMO_ONLY_BAND_CREATION).toBe(true);
  });
});

describe('user_profile: static safety rules (AGENTS.md §2)', () => {
  const entries = [...Object.entries(hookSources), ...Object.entries(viewSources), ...Object.entries(supportSources)];

  it('scans every created module', () => {
    expect(entries.length).toBeGreaterThanOrEqual(20);
  });

  it.each(entries)('%s never injects raw HTML', (_path, source) => {
    expect(source).not.toContain('dangerouslySetInnerHTML');
  });

  it.each(entries)('%s has no explicit any or ts-ignore', (_path, source) => {
    expect(source).not.toMatch(/:\s*any\b|<any>|as any\b|@ts-ignore/);
  });

  // Estos dos guardan `bandmanager_user` (la sesión del propio usuario, no datos de banda) tras un alta o un cambio de plan.
  const conSesionLocal = ['useProfileBands.ts', 'UpgradePlanDialog.tsx'];
  const sinStorage = entries.filter(([path]) => !conSesionLocal.some((f) => path.endsWith(f)));

  it.each(sinStorage)('%s never persists band data in browser storage (AGENTS.md §2.5)', (_path, source) => {
    expect(source).not.toMatch(/localStorage\.setItem|sessionStorage\.setItem/);
  });
});
