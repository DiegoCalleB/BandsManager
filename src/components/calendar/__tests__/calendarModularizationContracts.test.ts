import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import CalendarView, { getDetailedDateInfo } from '../../CalendarView';
import { useCalendar } from '../CalendarContext';
import { useConcertSyncMessages } from '../hooks/useConcertSyncMessages';
import { useEventInlineEdit } from '../hooks/useEventInlineEdit';

const hooks = import.meta.glob('../hooks/*.ts', { eager: true });
const views = import.meta.glob('../views/*.tsx', { eager: true });
const sources = import.meta.glob(['../views/*.tsx', '../hooks/*.ts', '../CalendarContext.ts', '../CalendarProvider.tsx'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const exportedFunctions = (moduleExports: Record<string, unknown>) =>
  Object.values(moduleExports).filter((value) => typeof value === 'function');

describe('CalendarView: contracts after modularization', () => {
  it('keeps the default export and the historic getDetailedDateInfo re-export', () => {
    expect(typeof CalendarView).toBe('function');
    expect(typeof getDetailedDateInfo).toBe('function');
  });

  it('keeps the container under 400 lines (AGENTS.md §5.6)', async () => {
    const raw = (await import('../../CalendarView?raw')) as { default: string };
    expect(raw.default.split('\n').length).toBeLessThan(400);
  });

  it.each(Object.entries(hooks))('%s exports at least one hook', (_path, moduleExports) => {
    expect(exportedFunctions(moduleExports as Record<string, unknown>).length).toBeGreaterThan(0);
  });

  it.each(Object.entries(views))('%s exports at least one component', (_path, moduleExports) => {
    expect(exportedFunctions(moduleExports as Record<string, unknown>).length).toBeGreaterThan(0);
  });

  it('useCalendar fails fast outside the provider', () => {
    const Orphan = () => {
      useCalendar();
      return null;
    };
    expect(() => renderToString(createElement(Orphan))).toThrow(/CalendarProvider/);
  });

  it('starts with no sync messages and no event open in the ficha', () => {
    let sync: ReturnType<typeof useConcertSyncMessages> | undefined;
    let edit: ReturnType<typeof useEventInlineEdit> | undefined;
    const Harness = () => {
      sync = useConcertSyncMessages();
      edit = useEventInlineEdit();
      return null;
    };
    renderToString(createElement(Harness));
    expect(sync?.syncSuccessMessage).toBe('');
    expect(sync?.syncErrorMessage).toBe('');
    expect(edit?.viewingConcert).toBeNull();
    expect(edit?.editDraft).toBeNull();
  });
});

describe('calendar: static safety rules (AGENTS.md §2)', () => {
  const entries = Object.entries(sources);

  it('scans every module', () => {
    expect(entries.length).toBeGreaterThan(30);
  });

  it.each(entries)('%s never injects raw HTML', (_path, source) => {
    expect(source).not.toContain('dangerouslySetInnerHTML');
  });

  it.each(entries)('%s has no explicit any or ts-ignore', (_path, source) => {
    expect(source).not.toMatch(/:\s*any\b|<any>|as any\b|@ts-ignore/);
  });

  it.each(entries)('%s never writes to sessionStorage', (_path, source) => {
    expect(source).not.toMatch(/sessionStorage\.setItem/);
  });
});
