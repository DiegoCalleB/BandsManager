import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { useGooglePlacesExplorer } from '../GooglePlacesExplorerContext';
import { errorMessage } from '../placesModel';

const hookSources = import.meta.glob('../hooks/*.ts', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const viewSources = import.meta.glob(['../*.tsx', '!../GooglePlacesExplorerProvider.tsx'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;
const supportSources = import.meta.glob(['../GooglePlacesExplorerContext.ts', '../GooglePlacesExplorerProvider.tsx', '../placesModel.ts'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

describe('GooglePlacesExplorerModal: contracts after modularization', () => {
  it('keeps the container under 400 lines (AGENTS.md §5.6)', async () => {
    const mod = (await import('../../GooglePlacesExplorerModal?raw')) as { default: string };
    expect(mod.default.split('\n').length).toBeLessThan(400);
    expect(mod.default).toContain('useGooglePlacesExplorerController');
    expect(mod.default).toContain('export function GooglePlacesExplorerModal');
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

  it('useGooglePlacesExplorer fails fast outside the provider', () => {
    const Orphan = () => {
      useGooglePlacesExplorer();
      return null;
    };
    expect(() => renderToString(createElement(Orphan))).toThrow(/GooglePlacesExplorerProvider/);
  });

  it('errorMessage only trusts real Error instances', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
    expect(errorMessage('boom')).toBeUndefined();
    expect(errorMessage({ message: 'boom' })).toBeUndefined();
  });
});

describe('google_places: static safety rules (AGENTS.md §2)', () => {
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

  // placesModel guarda los descartados con una clave sin band_id (defecto heredado, ver ADR 0033).
  const sinBandId = entries.filter(([path]) => !path.endsWith('placesModel.ts'));

  it.each(sinBandId)('%s never persists band data in browser storage (AGENTS.md §2.5)', (_path, source) => {
    expect(source).not.toMatch(/localStorage\.setItem|sessionStorage\.setItem/);
  });
});
