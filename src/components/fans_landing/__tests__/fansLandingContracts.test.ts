import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { useFansLanding } from '../FansLandingContext';

const hookSources = import.meta.glob('../hooks/*.ts', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const viewSources = import.meta.glob(['../*.tsx', '!../FansLandingProvider.tsx'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;
const supportSources = import.meta.glob(['../FansLandingContext.ts', '../FansLandingProvider.tsx', '../fanLandingTypes.ts'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

describe('FansLanding: contracts after modularization', () => {
  it('keeps the container under 400 lines (AGENTS.md §5.6)', async () => {
    const mod = (await import('../../FansLanding?raw')) as { default: string };
    expect(mod.default.split('\n').length).toBeLessThan(400);
    expect(mod.default).toContain('export const FansLanding');
    expect(mod.default).toContain('export default FansLanding');
  });

  it.each(Object.entries(hookSources))('%s exports at least one hook', (_path, source) => {
    expect(source).toMatch(/export (async )?function use\w+/);
  });

  it.each(Object.entries(viewSources))('%s exports a component', (_path, source) => {
    expect(source).toMatch(/export (async )?function [A-Z]\w+|export const [A-Z]\w+/);
  });

  it('keeps every view under 400 lines', () => {
    for (const source of Object.values(viewSources)) expect(source.split('\n').length).toBeLessThan(400);
  });

  it('useFansLanding fails fast outside the provider', () => {
    const Orphan = () => {
      useFansLanding();
      return null;
    };
    expect(() => renderToString(createElement(Orphan))).toThrow(/FansLandingProvider/);
  });
});

describe('fans_landing: static safety rules (AGENTS.md §2)', () => {
  const entries = [...Object.entries(hookSources), ...Object.entries(viewSources), ...Object.entries(supportSources)];

  it('scans every created module', () => {
    expect(entries.length).toBeGreaterThan(20);
  });

  it.each(entries)('%s never injects raw HTML', (_path, source) => {
    expect(source).not.toContain('dangerouslySetInnerHTML');
  });

  it.each(entries)('%s has no explicit any or ts-ignore', (_path, source) => {
    expect(source).not.toMatch(/:\s*any\b|<any>|as any\b|@ts-ignore/);
  });

  it.each(entries)('%s never persists band data in browser storage (AGENTS.md §2.5)', (_path, source) => {
    expect(source).not.toMatch(/localStorage\.setItem|sessionStorage\.setItem/);
  });
});
