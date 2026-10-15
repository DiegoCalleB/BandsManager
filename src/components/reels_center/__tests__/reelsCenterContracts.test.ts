import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import ReelsCenter from '../../ReelsCenter';
import { useReelsCenter } from '../ReelsCenterContext';

const hooks = import.meta.glob('../hooks/*.ts', { eager: true });
const views = import.meta.glob(['../*.tsx', '!../ReelsCenterProvider.tsx'], { eager: true });
const sources = import.meta.glob(['../*.ts', '../*.tsx', '../hooks/*.ts'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const exportedFunctions = (moduleExports: Record<string, unknown>) =>
  Object.values(moduleExports).filter((value) => typeof value === 'function');

describe('ReelsCenter: contracts after modularization', () => {
  it('keeps the default export', () => {
    expect(typeof ReelsCenter).toBe('function');
  });

  it('keeps the container under 400 lines (AGENTS.md §5.6)', async () => {
    const raw = (await import('../../ReelsCenter?raw')) as { default: string };
    expect(raw.default.split('\n').length).toBeLessThan(400);
  });

  it.each(Object.entries(hooks))('%s exports at least one hook', (_path, moduleExports) => {
    expect(exportedFunctions(moduleExports as Record<string, unknown>).length).toBeGreaterThan(0);
  });

  it.each(Object.entries(views))('%s exports at least one component', (_path, moduleExports) => {
    expect(exportedFunctions(moduleExports as Record<string, unknown>).length).toBeGreaterThan(0);
  });

  it('useReelsCenter fails fast outside the provider', () => {
    const Orphan = () => {
      useReelsCenter();
      return null;
    };
    expect(() => renderToString(createElement(Orphan))).toThrow(/ReelsCenterProvider/);
  });
});

describe('reels_center: static safety rules (AGENTS.md §2)', () => {
  const entries = Object.entries(sources).filter(([path]) => !path.includes('__tests__'));

  it('scans every module', () => {
    expect(entries.length).toBeGreaterThan(40);
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
