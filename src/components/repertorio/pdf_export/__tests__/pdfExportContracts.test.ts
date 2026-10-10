import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { PdfExportModal } from '../../PdfExportModal';
import { usePdfExport } from '../PdfExportContext';

const hooks = import.meta.glob('../hooks/*.ts', { eager: true });
const views = import.meta.glob(['../*.tsx', '!../PdfExportProvider.tsx'], { eager: true });
const sources = import.meta.glob(['../*.tsx', '../*.ts', '../hooks/*.ts'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const exportedFunctions = (moduleExports: Record<string, unknown>) =>
  Object.values(moduleExports).filter((value) => typeof value === 'function');

describe('PdfExportModal: contracts after modularization', () => {
  it('keeps the named export used by RepertorioModalsContainer', () => {
    expect(typeof PdfExportModal).toBe('function');
  });

  it('keeps the container under 400 lines (AGENTS.md §5.6)', async () => {
    const raw = (await import('../../PdfExportModal?raw')) as { default: string };
    expect(raw.default.split('\n').length).toBeLessThan(400);
  });

  it('renders nothing while closed or without a setlist', () => {
    const base = { songs: [], activeSetlistMetrics: { formattedTime: '0:00', songCount: 0 }, onClose: () => undefined };
    expect(renderToString(createElement(PdfExportModal, { ...base, isOpen: false, activeSetlist: null }))).toBe('');
    expect(renderToString(createElement(PdfExportModal, { ...base, isOpen: true, activeSetlist: null }))).toBe('');
  });

  it.each(Object.entries(hooks))('%s exports at least one hook', (_path, moduleExports) => {
    expect(exportedFunctions(moduleExports as Record<string, unknown>).length).toBeGreaterThan(0);
  });

  it.each(Object.entries(views))('%s exports at least one component', (_path, moduleExports) => {
    expect(exportedFunctions(moduleExports as Record<string, unknown>).length).toBeGreaterThan(0);
  });

  it('usePdfExport fails fast outside the provider', () => {
    const Orphan = () => {
      usePdfExport();
      return null;
    };
    expect(() => renderToString(createElement(Orphan))).toThrow(/PdfExportProvider/);
  });
});

describe('pdf_export: static safety rules (AGENTS.md §2)', () => {
  const entries = Object.entries(sources);

  it('scans every module', () => {
    expect(entries.length).toBeGreaterThan(20);
  });

  it.each(entries)('%s has no explicit any or ts-ignore', (_path, source) => {
    expect(source).not.toMatch(/:\s*any\b|<any>|as any\b|@ts-ignore/);
  });

  it.each(entries)('%s never persists data in browser storage (AGENTS.md §2.5)', (_path, source) => {
    expect(source).not.toMatch(/localStorage\.setItem|sessionStorage\.setItem/);
  });

  it('escapes every user-controlled value interpolated into the print HTML', () => {
    const rows = entries.find(([path]) => path.endsWith('buildRowHtmlFactory.ts'))?.[1] ?? '';
    expect(rows).toContain('escapeHtml(');
    expect(rows).not.toContain('dangerouslySetInnerHTML');
  });
});
