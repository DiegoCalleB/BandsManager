import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { useFansPanel } from '../FansPanelContext';

const hookSources = import.meta.glob('../hooks/*.ts', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const viewSources = import.meta.glob(['../*.tsx', '!../FansPanelProvider.tsx'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;
const supportSources = import.meta.glob(['../FansPanelContext.ts', '../FansPanelProvider.tsx'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

describe('FansPanel: contracts after modularization', () => {
  it('keeps the container under 400 lines (AGENTS.md §5.6)', async () => {
    const mod = (await import('../../FansPanel?raw')) as { default: string };
    expect(mod.default.split('\n').length).toBeLessThan(400);
    expect(mod.default).toContain('export const FansPanel');
    expect(mod.default).toContain('export default FansPanel');
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

  it('useFansPanel fails fast outside the provider', () => {
    const Orphan = () => {
      useFansPanel();
      return null;
    };
    expect(() => renderToString(createElement(Orphan))).toThrow(/FansPanelProvider/);
  });
});

describe('fans_panel: static safety rules (AGENTS.md §2)', () => {
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

  // useCityChips guarda las ciudades con una clave sin band_id (defecto heredado, ver ADR 0029).
  const sinBandId = entries.filter(([path]) => !path.endsWith('useCityChips.ts'));

  it.each(sinBandId)('%s never persists band data in browser storage (AGENTS.md §2.5)', (_path, source) => {
    expect(source).not.toMatch(/localStorage\.setItem|sessionStorage\.setItem/);
  });
});
