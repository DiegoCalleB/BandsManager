import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import Chatbot from '../../Chatbot';
import { useChat } from '../ChatContext';

const hooks = import.meta.glob('../hooks/*.ts', { eager: true });
const views = import.meta.glob(['../*.tsx', '!../ChatProvider.tsx', '!../chatFormatting.tsx'], { eager: true });
const sources = import.meta.glob(['../*.tsx', '../*.ts', '../hooks/*.ts'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const exportedFunctions = (moduleExports: Record<string, unknown>) =>
  Object.values(moduleExports).filter((value) => typeof value === 'function');

describe('Chatbot: contracts after modularization', () => {
  it('keeps the default export', () => {
    expect(typeof Chatbot).toBe('function');
  });

  it('keeps the container under 400 lines (AGENTS.md §5.6)', async () => {
    const raw = (await import('../../Chatbot?raw')) as { default: string };
    expect(raw.default.split('\n').length).toBeLessThan(400);
  });

  it.each(Object.entries(hooks))('%s exports at least one hook', (_path, moduleExports) => {
    expect(exportedFunctions(moduleExports as Record<string, unknown>).length).toBeGreaterThan(0);
  });

  it.each(Object.entries(views))('%s exports at least one component', (_path, moduleExports) => {
    expect(exportedFunctions(moduleExports as Record<string, unknown>).length).toBeGreaterThan(0);
  });

  it('useChat fails fast outside the provider', () => {
    const Orphan = () => {
      useChat();
      return null;
    };
    expect(() => renderToString(createElement(Orphan))).toThrow(/ChatProvider/);
  });
});

describe('chatbot: static safety rules (AGENTS.md §2)', () => {
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

  // Claves permitidas (ADR 0021): el historial lleva userId + bandId; el resto son preferencias
  // o configuración heredada sin band_id, documentada como deuda conocida.
  const ALLOWED_STORAGE_KEYS = new Set([
    'storageKey',
    'bakandeya_agents_enabled',
    'bakandeya_agent_autonomy',
    'bakandeya_github_ref',
  ]);

  it('only writes allow-listed localStorage keys (AGENTS.md §2.5)', () => {
    const keys = entries.flatMap(([, source]) =>
      [...source.matchAll(/localStorage\.setItem\(\s*(?:'([^']+)'|"([^"]+)"|(\w+))/g)].map((m) => m[1] || m[2] || m[3]),
    );
    expect(keys.length).toBeGreaterThan(0);
    const unexpected = keys.filter((key) => !ALLOWED_STORAGE_KEYS.has(key));
    expect(unexpected).toEqual([]);
  });

  it('keeps the chat history key scoped by user and band', () => {
    const identity = entries.find(([path]) => path.endsWith('useChatIdentity.ts'))?.[1] ?? '';
    expect(identity).toMatch(/bakandeya_chat_messages_\$\{currentUser\?\.id[^`]*band_id/);
  });
});
