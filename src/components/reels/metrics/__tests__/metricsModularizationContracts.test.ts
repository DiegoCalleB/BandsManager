import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { ReelsMetricsView } from '../../ReelsMetricsView';
import { useMetrics } from '../MetricsContext';
import { PERIOD_OPTIONS } from '../metricsPeriods';

const hooks = import.meta.glob('../hooks/*.ts', { eager: true });
const views = import.meta.glob(['../*.tsx', '!../MetricsProvider.tsx'], { eager: true });
const sources = import.meta.glob(['../*.tsx', '../*.ts', '../hooks/*.ts'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const exportedFunctions = (moduleExports: Record<string, unknown>) =>
  Object.values(moduleExports).filter((value) => typeof value === 'function');

describe('ReelsMetricsView: contracts after modularization', () => {
  it('keeps the named export used by FansPanel', () => {
    expect(typeof ReelsMetricsView).toBe('function');
  });

  it('keeps the container under 400 lines (AGENTS.md §5.6)', async () => {
    const raw = (await import('../../ReelsMetricsView?raw')) as { default: string };
    expect(raw.default.split('\n').length).toBeLessThan(400);
  });

  it.each(Object.entries(hooks))('%s exports at least one hook', (_path, moduleExports) => {
    expect(exportedFunctions(moduleExports as Record<string, unknown>).length).toBeGreaterThan(0);
  });

  it.each(Object.entries(views))('%s exports at least one component', (_path, moduleExports) => {
    expect(exportedFunctions(moduleExports as Record<string, unknown>).length).toBeGreaterThan(0);
  });

  it('useMetrics fails fast outside the provider', () => {
    const Orphan = () => {
      useMetrics();
      return null;
    };
    expect(() => renderToString(createElement(Orphan))).toThrow(/MetricsProvider/);
  });
});

describe('PERIOD_OPTIONS', () => {
  it('has unique ids and a null window only for the full history', () => {
    const ids = PERIOD_OPTIONS.map((option) => option.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(PERIOD_OPTIONS.filter((option) => option.days === null).map((option) => option.id)).toEqual(['all']);
  });

  it('orders windows from shortest to longest', () => {
    const days = PERIOD_OPTIONS.map((option) => option.days).filter((value): value is number => value !== null);
    expect([...days].sort((a, b) => a - b)).toEqual(days);
  });
});

describe('reels/metrics: static safety rules (AGENTS.md §2)', () => {
  const entries = Object.entries(sources);

  it('scans every module', () => {
    expect(entries.length).toBeGreaterThan(20);
  });

  it.each(entries)('%s never injects raw HTML', (_path, source) => {
    expect(source).not.toContain('dangerouslySetInnerHTML');
  });

  it.each(entries)('%s has no explicit any or ts-ignore', (_path, source) => {
    expect(source).not.toMatch(/:\s*any\b|<any>|as any\b|@ts-ignore/);
  });

  it.each(entries)('%s never persists metrics in browser storage (AGENTS.md §2.5)', (_path, source) => {
    expect(source).not.toMatch(/localStorage\.setItem|sessionStorage\.setItem/);
  });
});
