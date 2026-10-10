import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { useLeadsTable } from '../LeadsTableContext';
import { campanaDe, radarDe } from '../leadRadar';
import { venueProgrammingUrl } from '../venueProgrammingUrl';
import type { BookingCampaign, Lead } from '../../../../types';

const hookSources = import.meta.glob('../hooks/*.ts', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const viewSources = import.meta.glob(['../*.tsx', '!../LeadsTableProvider.tsx'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;
const supportSources = import.meta.glob(['../LeadsTableContext.ts', '../LeadsTableProvider.tsx', '../leadRadar.ts', '../venueProgrammingUrl.ts'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

describe('LeadsTable: contracts after modularization', () => {
  it('keeps the container under 400 lines (AGENTS.md §5.6)', async () => {
    const mod = (await import('../../LeadsTable?raw')) as { default: string };
    expect(mod.default.split('\n').length).toBeLessThan(400);
    expect(mod.default).toContain('useLeadsTableController');
    expect(mod.default).toContain('export const LeadsTable');
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

  it('useLeadsTable fails fast outside the provider', () => {
    const Orphan = () => {
      useLeadsTable();
      return null;
    };
    expect(() => renderToString(createElement(Orphan))).toThrow(/LeadsTableProvider/);
  });
});

describe('venueProgrammingUrl', () => {
  it('uses the venue website, adding https when missing', () => {
    expect(venueProgrammingUrl({ website: ' sala.com ' } as Lead)).toBe('https://sala.com');
    expect(venueProgrammingUrl({ website: 'http://sala.com' } as Lead)).toBe('http://sala.com');
  });

  it('falls back to a search for the venue listings', () => {
    const url = venueProgrammingUrl({ nombre_sala: 'Capitol', ciudad: 'Santiago' } as Lead);
    expect(url).toContain('https://www.google.com/search?q=');
    expect(decodeURIComponent(url)).toContain('Capitol Santiago programacion');
  });
});

describe('leadRadar', () => {
  it('returns the very same objects, only retyped', () => {
    const lead = { id: 'l1' } as Lead;
    const campaign = { id: 'c1' } as BookingCampaign;
    expect(radarDe(lead)).toBe(lead);
    expect(campanaDe(campaign)).toBe(campaign);
    expect(campanaDe(null)).toBeUndefined();
  });
});

describe('leads_table: static safety rules (AGENTS.md §2)', () => {
  const entries = [...Object.entries(hookSources), ...Object.entries(viewSources), ...Object.entries(supportSources)];

  it('scans every created module', () => {
    expect(entries.length).toBeGreaterThanOrEqual(20);
  });

  it.each(entries)('%s never injects raw HTML', (_path, source) => {
    expect(source).not.toContain('dangerouslySetInnerHTML');
  });

  it.each(entries.filter(([p]) => !p.endsWith('leadRadar.ts')))('%s has no explicit any or ts-ignore', (_path, source) => {
    expect(source).not.toMatch(/:\s*any\b|<any>|as any\b|@ts-ignore/);
  });

  it.each(entries)('%s never persists band data in browser storage (AGENTS.md §2.5)', (_path, source) => {
    expect(source).not.toMatch(/localStorage\.setItem|sessionStorage\.setItem/);
  });
});
