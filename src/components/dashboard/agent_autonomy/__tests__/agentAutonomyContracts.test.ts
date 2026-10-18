import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { AgentAutonomySettingsModal, DAYS_OF_WEEK } from '../../AgentAutonomySettingsModal';
import { useAgentAutonomy } from '../AgentAutonomyContext';
import { TIMEZONES } from '../autonomyTypes';
import { RESPONSE_TYPES } from '../responseTypes';

const hooks = import.meta.glob('../hooks/*.ts', { eager: true });
const views = import.meta.glob(['../*.tsx', '!../AgentAutonomyProvider.tsx', '!../autonomyTypes.tsx', '!../responseTypes.tsx'], { eager: true });
const sources = import.meta.glob(['../*.tsx', '../*.ts', '../hooks/*.ts'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const exportedFunctions = (moduleExports: Record<string, unknown>) =>
  Object.values(moduleExports).filter((value) => typeof value === 'function');

describe('AgentAutonomySettingsModal: contracts after modularization', () => {
  it('keeps the public exports used by Dashboard, BookingCRM, Chatbot and UserProfileModal', () => {
    expect(typeof AgentAutonomySettingsModal).toBe('function');
    expect(DAYS_OF_WEEK.length).toBe(7);
  });

  it('keeps the container under 400 lines (AGENTS.md §5.6)', async () => {
    const raw = (await import('../../AgentAutonomySettingsModal?raw')) as { default: string };
    expect(raw.default.split('\n').length).toBeLessThan(400);
  });

  it('renders nothing while closed', () => {
    const html = renderToString(
      createElement(AgentAutonomySettingsModal, { isOpen: false, onClose: () => undefined }),
    );
    expect(html).toBe('');
  });

  it('exposes the response types and timezones as module constants', () => {
    expect(RESPONSE_TYPES.length).toBeGreaterThan(0);
    expect(new Set(RESPONSE_TYPES.map((type) => type.key)).size).toBe(RESPONSE_TYPES.length);
    expect(TIMEZONES.length).toBeGreaterThan(0);
  });

  it.each(Object.entries(hooks))('%s exports at least one hook', (_path, moduleExports) => {
    expect(exportedFunctions(moduleExports as Record<string, unknown>).length).toBeGreaterThan(0);
  });

  it.each(Object.entries(views))('%s exports at least one component', (_path, moduleExports) => {
    expect(exportedFunctions(moduleExports as Record<string, unknown>).length).toBeGreaterThan(0);
  });

  it('useAgentAutonomy fails fast outside the provider', () => {
    const Orphan = () => {
      useAgentAutonomy();
      return null;
    };
    expect(() => renderToString(createElement(Orphan))).toThrow(/AgentAutonomyProvider/);
  });
});

describe('agent_autonomy: static safety rules (AGENTS.md §2)', () => {
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

  // Excepción conocida y documentada en el ADR 0020: `useAutonomyConfig` cachea la configuración en
  // localStorage bajo una clave sin band_id (herencia previa al refactor, la leen otros módulos).
  const KNOWN_STORAGE_EXCEPTIONS = ['../hooks/useAutonomyConfig.ts'];

  it.each(entries.filter(([path]) => !KNOWN_STORAGE_EXCEPTIONS.includes(path)))(
    '%s never persists band data in browser storage (AGENTS.md §2.5)',
    (_path, source) => {
      expect(source).not.toMatch(/localStorage\.setItem|sessionStorage\.setItem/);
    },
  );

  it('keeps the storage exception limited to a single, known file', () => {
    const offenders = entries.filter(([, source]) => /localStorage\.setItem|sessionStorage\.setItem/.test(source)).map(([path]) => path);
    expect(offenders).toEqual(KNOWN_STORAGE_EXCEPTIONS);
  });
});
