import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { useSetlistPerformance } from '../SetlistPerformanceContext';
import { FONT_SIZES, getBlockMeta, itemLabel } from '../performanceModel';
import type { SetlistItem, Song } from '../../../types';

const hookSources = import.meta.glob('../hooks/*.ts', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const viewSources = import.meta.glob(['../*.tsx', '!../SetlistPerformanceProvider.tsx'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;
const supportSources = import.meta.glob(['../SetlistPerformanceContext.ts', '../SetlistPerformanceProvider.tsx', '../performanceModel.ts'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

describe('SetlistPerformanceView: contracts after modularization', () => {
  it('keeps the container under 400 lines (AGENTS.md §5.6)', async () => {
    const mod = (await import('../../SetlistPerformanceView?raw')) as { default: string };
    expect(mod.default.split('\n').length).toBeLessThan(400);
    expect(mod.default).toContain('useSetlistPerformanceController');
    expect(mod.default).toContain('export const SetlistPerformanceView');
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

  it('useSetlistPerformance fails fast outside the provider', () => {
    const Orphan = () => {
      useSetlistPerformance();
      return null;
    };
    expect(() => renderToString(createElement(Orphan))).toThrow(/SetlistPerformanceProvider/);
  });
});

describe('performanceModel', () => {
  const song = { id: 's1', titulo: 'Tema 1' } as Song;

  it('resolves the label of a song item and of a custom block', () => {
    const cancion = { tipoItem: 'cancion', songId: 's1' } as SetlistItem;
    const bloque = { tipoItem: 'bloque', bloqueSubtipo: 'descanso', tituloCustom: 'Pausa larga' } as SetlistItem;
    expect(itemLabel(cancion, [song])).toBe('Tema 1');
    expect(itemLabel(bloque, [song])).toBe('Pausa larga');
  });

  it('falls back to the generic block meta for unknown subtypes', () => {
    const raro = { tipoItem: 'bloque', bloqueSubtipo: 'inventado' } as SetlistItem;
    expect(getBlockMeta(raro).label).toBe('Bloque');
  });

  it('offers a stepped font scale', () => {
    expect(FONT_SIZES.length).toBeGreaterThan(1);
  });
});

describe('setlist_performance: static safety rules (AGENTS.md §2)', () => {
  const entries = [...Object.entries(hookSources), ...Object.entries(viewSources), ...Object.entries(supportSources)];

  it('scans every created module', () => {
    expect(entries.length).toBeGreaterThanOrEqual(25);
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
