import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { LiveConcertToAlbumModal } from '../../LiveConcertToAlbumModal';
import { useLiveConcertAlbum } from '../LiveConcertAlbumContext';
import { useTrackHistory } from '../hooks/useTrackHistory';
import type { ThemeColors } from '../../../../types';

const hooks = import.meta.glob('../hooks/*.ts', { eager: true });
const views = import.meta.glob(['../*.tsx', '!../LiveConcertAlbumProvider.tsx'], { eager: true });
const sources = import.meta.glob(['../*.ts', '../*.tsx', '../hooks/*.ts'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const exportedFunctions = (moduleExports: Record<string, unknown>) =>
  Object.values(moduleExports).filter((value) => typeof value === 'function');

describe('LiveConcertToAlbumModal: contracts after modularization', () => {
  it('keeps the container under 400 lines (AGENTS.md §5.6)', async () => {
    const raw = (await import('../../LiveConcertToAlbumModal?raw')) as { default: string };
    expect(raw.default.split('\n').length).toBeLessThan(400);
  });

  it('renders nothing while closed', () => {
    const html = renderToString(
      createElement(LiveConcertToAlbumModal, {
        isOpen: false,
        onClose: () => undefined,
        colors: {} as ThemeColors,
        onSaveAlbumToCatalog: () => undefined,
      }),
    );
    expect(html).toBe('');
  });

  it.each(Object.entries(hooks))('%s exports at least one hook', (_path, moduleExports) => {
    expect(exportedFunctions(moduleExports as Record<string, unknown>).length).toBeGreaterThan(0);
  });

  it.each(Object.entries(views))('%s exports at least one component', (_path, moduleExports) => {
    expect(exportedFunctions(moduleExports as Record<string, unknown>).length).toBeGreaterThan(0);
  });

  it('useLiveConcertAlbum fails fast outside the provider', () => {
    const Orphan = () => {
      useLiveConcertAlbum();
      return null;
    };
    expect(() => renderToString(createElement(Orphan))).toThrow(/LiveConcertAlbumProvider/);
  });

  it('exposes empty initial track state from useTrackHistory', () => {
    let snapshot: ReturnType<typeof useTrackHistory> | undefined;
    const Harness = () => {
      snapshot = useTrackHistory();
      return null;
    };
    renderToString(createElement(Harness));
    expect(snapshot?.tracks).toEqual([]);
    expect(snapshot?.selectedIndices).toEqual([]);
    expect(snapshot?.history).toEqual([]);
    expect(snapshot?.redoStack).toEqual([]);
  });
});

describe('live_concert_album: static safety rules (AGENTS.md §2)', () => {
  const entries = Object.entries(sources).filter(([path]) => !path.includes('__tests__'));

  it('scans every module', () => {
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
