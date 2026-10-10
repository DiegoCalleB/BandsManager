import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { useBookingCrm } from '../BookingCrmContext';

// Se leen como texto: las vistas importan Leaflet (mapa), que necesita `window` y rompería la carga en node.
const hookSources = import.meta.glob('../hooks/*.ts', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const viewSources = import.meta.glob(['../*.tsx', '!../BookingCrmProvider.tsx'], { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const sources = import.meta.glob(['../*.tsx', '../*.ts', '../hooks/*.ts'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

describe('BookingCRM: contracts after modularization', () => {
  it('keeps the default export and the historic helper re-exports', async () => {
    const raw = ((await import('../../../BookingCRM?raw')) as { default: string }).default;
    expect(raw).toContain('export default function BookingCRM');
    const reexport = raw.match(/export \{([^}]*)\};/)?.[1] ?? '';
    for (const name of ['normalizeStatus', 'normalizeType', 'autoDetectVenueAddress', 'VENUE_ADDRESS_DATABASE']) {
      expect(reexport).toContain(name);
    }
  });

  it('keeps the container under 400 lines (AGENTS.md §5.6)', async () => {
    const raw = (await import('../../../BookingCRM?raw')) as { default: string };
    expect(raw.default.split('\n').length).toBeLessThan(400);
  });

  it.each(Object.entries(hookSources))('%s exports at least one hook', (_path, source) => {
    expect(source).toMatch(/export (async )?function \w+/);
  });

  it.each(Object.entries(viewSources))('%s exports at least one component', (_path, source) => {
    expect(source).toMatch(/export (async )?function [A-Z]\w+/);
  });

  it('useBookingCrm fails fast outside the provider', () => {
    const Orphan = () => {
      useBookingCrm();
      return null;
    };
    expect(() => renderToString(createElement(Orphan))).toThrow(/BookingCrmProvider/);
  });
});

describe('booking/crm: static safety rules (AGENTS.md §2)', () => {
  const entries = Object.entries(sources);

  it('scans every module', () => {
    expect(entries.length).toBeGreaterThan(25);
  });

  it.each(entries)('%s never injects raw HTML', (_path, source) => {
    expect(source).not.toContain('dangerouslySetInnerHTML');
  });

  it.each(entries)('%s has no explicit any or ts-ignore', (_path, source) => {
    expect(source).not.toMatch(/:\s*any\b|<any>|as any\b|@ts-ignore/);
  });

  it.each(entries)('%s never persists leads in browser storage (AGENTS.md §2.5)', (_path, source) => {
    expect(source).not.toMatch(/localStorage\.setItem|sessionStorage\.setItem/);
  });
});
