import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { LogisticsSidebar } from '../LogisticsSidebar';

const viewSources = import.meta.glob('../*.tsx', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;

describe('LogisticsSidebar: contracts after modularization', () => {
  it('has no props: everything comes from the calendar context', () => {
    const source = viewSources['../LogisticsSidebar.tsx'];
    expect(source).toMatch(/export function LogisticsSidebar\(\)/);
    expect(source).toContain('useCalendar()');
  });

  it('is rendered by the overlays without drilling props', async () => {
    const mod = (await import('../../views/CalendarOverlays?raw')) as { default: string };
    expect(mod.default).toContain('<LogisticsSidebar />');
  });

  it('fails fast outside the calendar provider', () => {
    expect(() => renderToString(createElement(LogisticsSidebar))).toThrow(/CalendarProvider/);
  });

  it.each(Object.entries(viewSources))('%s exports a component', (_path, source) => {
    expect(source).toMatch(/export (async )?function [A-Z]\w+|export const [A-Z]\w+/);
  });

  it('keeps every view under 400 lines (AGENTS.md §5.6)', () => {
    for (const source of Object.values(viewSources)) expect(source.split('\n').length).toBeLessThan(400);
  });
});

describe('logistics: static safety rules (AGENTS.md §2)', () => {
  const entries = Object.entries(viewSources);

  it('scans every created view', () => {
    expect(entries.length).toBeGreaterThanOrEqual(15);
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
