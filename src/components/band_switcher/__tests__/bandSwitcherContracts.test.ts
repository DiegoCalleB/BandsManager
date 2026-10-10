import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { useBandSwitcher } from '../BandSwitcherContext';

const hookSources = import.meta.glob('../hooks/*.ts', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const viewSources = import.meta.glob(['../*.tsx', '!../BandSwitcherProvider.tsx'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;
const supportSources = import.meta.glob(['../BandSwitcherContext.ts', '../BandSwitcherProvider.tsx', '../bandSwitcherTypes.ts', '../bandSwitcherConfig.ts'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

describe('BandSwitcherModal: contracts after modularization', () => {
  it('keeps the container under 400 lines (AGENTS.md §5.6)', async () => {
    const mod = (await import('../../BandSwitcherModal?raw')) as { default: string };
    expect(mod.default.split('\n').length).toBeLessThan(400);
    expect(mod.default).toContain('export const BandSwitcherModal');
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

  it('useBandSwitcher fails fast outside the provider', () => {
    const Orphan = () => {
      useBandSwitcher();
      return null;
    };
    expect(() => renderToString(createElement(Orphan))).toThrow(/BandSwitcherProvider/);
  });
});

describe('band_switcher: static safety rules (AGENTS.md §2)', () => {
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

  // useBandOrdering guarda el orden de bandas del usuario (clave por usuario, no datos de una banda).
  const sinBandId = entries.filter(([path]) => !path.endsWith('useBandOrdering.ts'));

  it.each(sinBandId)('%s never persists band data in browser storage (AGENTS.md §2.5)', (_path, source) => {
    // La sesión (`bandmanager_user`) es el usuario autenticado, no datos de una banda.
    const sinSesion = source.replace(/localStorage\.setItem\(\s*["']bandmanager_user["']/g, '');
    expect(sinSesion).not.toMatch(/localStorage\.setItem|sessionStorage\.setItem/);
  });
});
