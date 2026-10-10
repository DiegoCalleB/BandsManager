import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { useBandCrm } from '../BandCrmContext';

// Solo los archivos creados en la modularización; los modales anteriores de esta carpeta conservan su propio estado.
const hookSources = import.meta.glob('../hooks/*.ts', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const viewSources = import.meta.glob(
  [
    '../BandCardsGrid.tsx',
    '../BandCrmHeader.tsx',
    '../BandCrmLayout.tsx',
    '../BandCrmModalsHost.tsx',
    '../BandStatusBadge.tsx',
    '../BandsEmptyState.tsx',
    '../BandsFilterBar.tsx',
    '../BandsListContainer.tsx',
    '../BandsMapView.tsx',
    '../BandsTable.tsx',
    '../BandsWorkspace.tsx',
    '../BulkBandsBar.tsx',
    '../RegisteredBandsView.tsx',
  ],
  { eager: true, query: '?raw', import: 'default' },
) as Record<string, string>;
const supportSources = import.meta.glob(['../BandCrmContext.ts', '../BandCrmProvider.tsx', '../bandCrm*.ts', '../bandMetrics.ts'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

describe('BandCRM: contracts after modularization', () => {
  it('keeps the container under 400 lines (AGENTS.md §5.6)', async () => {
    const raw = (await import('../../BandCRM?raw')) as { default: string };
    expect(raw.default.split('\n').length).toBeLessThan(400);
    expect(raw.default).toContain('export default function BandCRM');
  });

  it.each(Object.entries(hookSources))('%s exports at least one hook', (_path, source) => {
    expect(source).toMatch(/export (async )?function use\w+/);
  });

  it.each(Object.entries(viewSources))('%s exports at least one component', (_path, source) => {
    expect(source).toMatch(/export (async )?function [A-Z]\w+/);
  });

  it('useBandCrm fails fast outside the provider', () => {
    const Orphan = () => {
      useBandCrm();
      return null;
    };
    expect(() => renderToString(createElement(Orphan))).toThrow(/BandCrmProvider/);
  });
});

describe('bandCRM: static safety rules (AGENTS.md §2)', () => {
  const entries = [...Object.entries(hookSources), ...Object.entries(viewSources), ...Object.entries(supportSources)];

  it('scans every created module', () => {
    expect(entries.length).toBeGreaterThan(25);
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
