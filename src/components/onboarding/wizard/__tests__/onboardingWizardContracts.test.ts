import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { useOnboardingWizard } from '../OnboardingWizardContext';
import { epkDe } from '../epkLegacy';
import { COMMON_GENRES, COMMON_LANGUAGES } from '../wizardOptions';
import type { EPKConfig } from '../../../../types';

const hookSources = import.meta.glob('../hooks/*.ts', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const viewSources = import.meta.glob(['../*.tsx', '!../OnboardingWizardProvider.tsx'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;
const supportSources = import.meta.glob(['../OnboardingWizardContext.ts', '../OnboardingWizardProvider.tsx', '../epkLegacy.ts', '../wizardOptions.ts'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

describe('OnboardingWizardModal: contracts after modularization', () => {
  it('keeps the container under 400 lines (AGENTS.md §5.6)', async () => {
    const mod = (await import('../../OnboardingWizardModal?raw')) as { default: string };
    expect(mod.default.split('\n').length).toBeLessThan(400);
    expect(mod.default).toContain('useOnboardingWizardController');
    expect(mod.default).toContain('export const OnboardingWizardModal');
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

  it('useOnboardingWizard fails fast outside the provider', () => {
    const Orphan = () => {
      useOnboardingWizard();
      return null;
    };
    expect(() => renderToString(createElement(Orphan))).toThrow(/OnboardingWizardProvider/);
  });
});

describe('wizard support modules', () => {
  it('epkDe returns the same object, or null when there is no EPK', () => {
    const epk = { biografia: '' } as EPKConfig;
    expect(epkDe(epk)).toBe(epk);
    expect(epkDe(null)).toBeNull();
    expect(epkDe(undefined)).toBeNull();
  });

  it('offers non-empty genre and language options without duplicates', () => {
    expect(COMMON_GENRES.length).toBeGreaterThan(5);
    expect(new Set(COMMON_GENRES).size).toBe(COMMON_GENRES.length);
    expect(new Set(COMMON_LANGUAGES).size).toBe(COMMON_LANGUAGES.length);
  });
});

describe('wizard: static safety rules (AGENTS.md §2)', () => {
  const entries = [...Object.entries(hookSources), ...Object.entries(viewSources), ...Object.entries(supportSources)];

  it('scans every created module', () => {
    expect(entries.length).toBeGreaterThanOrEqual(20);
  });

  it.each(entries)('%s never injects raw HTML', (_path, source) => {
    expect(source).not.toContain('dangerouslySetInnerHTML');
  });

  it.each(entries.filter(([p]) => !p.endsWith('epkLegacy.ts')))('%s has no explicit any or ts-ignore', (_path, source) => {
    expect(source).not.toMatch(/:\s*any\b|<any>|as any\b|@ts-ignore/);
  });

  it.each(entries)('%s never persists band data in browser storage (AGENTS.md §2.5)', (_path, source) => {
    expect(source).not.toMatch(/localStorage\.setItem|sessionStorage\.setItem/);
  });
});
