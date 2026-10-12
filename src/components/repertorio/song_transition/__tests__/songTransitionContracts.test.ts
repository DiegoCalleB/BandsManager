import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { useSongTransition } from '../SongTransitionContext';
import { SongTransitionPreviewModal } from '../../SongTransitionPreviewModal';
import { cuesGuardados } from '../hooks/useTransitionCues';
import { formatSec } from '../transitionFormat';
import type { Song } from '../../../../types';

const hookSources = import.meta.glob('../hooks/*.ts', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const viewSources = import.meta.glob(['../*.tsx', '!../SongTransitionProvider.tsx'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;
const supportSources = import.meta.glob(['../SongTransitionContext.ts', '../SongTransitionProvider.tsx', '../types.ts', '../transitionFormat.ts'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const tema = (over: Partial<Song> = {}): Song => ({ id: 's1', titulo: 'Tema', ...over }) as Song;

describe('SongTransitionPreviewModal: contracts after modularization', () => {
  it('keeps the container under 400 lines and the open guard before any hook', async () => {
    const mod = (await import('../../SongTransitionPreviewModal?raw')) as { default: string };
    expect(mod.default.split('\n').length).toBeLessThan(400);
    // La guarda vive en un componente sin hooks; los hooks, en el cuerpo que solo se monta abierto.
    const exportado = mod.default.slice(mod.default.indexOf('export function SongTransitionPreviewModal('));
    expect(exportado).toContain('return null');
    expect(exportado).not.toMatch(/\buse[A-Z]\w*\(/);
  });

  it('renders nothing while closed or with a missing song', () => {
    const base = { onClose: () => undefined, indexA: 0, indexB: 1 };
    expect(renderToString(createElement(SongTransitionPreviewModal, { ...base, isOpen: false, songA: tema(), songB: tema() }))).toBe('');
    expect(renderToString(createElement(SongTransitionPreviewModal, { ...base, isOpen: true, songA: tema(), songB: null }))).toBe('');
  });

  it.each(Object.entries(hookSources))('%s exports at least one hook', (_path, source) => {
    expect(source).toMatch(/export function use\w+/);
  });

  it.each(Object.entries(viewSources))('%s exports a component', (_path, source) => {
    expect(source).toMatch(/export function [A-Z]\w+/);
  });

  it('keeps every view, hook and support module under 400 lines', () => {
    for (const source of [...Object.values(viewSources), ...Object.values(hookSources), ...Object.values(supportSources)]) {
      expect(source.split('\n').length).toBeLessThan(400);
    }
  });

  it('useSongTransition fails fast outside the provider', () => {
    const Orphan = () => {
      useSongTransition();
      return null;
    };
    expect(() => renderToString(createElement(Orphan))).toThrow(/SongTransitionProvider/);
  });
});

describe('song transition: pure helpers', () => {
  it('formatSec pads seconds but not minutes', () => {
    expect(formatSec(187.9)).toBe('3:07');
    expect(formatSec(5)).toBe('0:05');
  });

  it('cuesGuardados is null without saved cues', () => {
    expect(cuesGuardados(tema())).toBeNull();
  });

  it('cuesGuardados derives silences from the saved cues', () => {
    const a = cuesGuardados(tema({ cueIn: 2, cueOut: 170, duracionSegundos: 180 }));
    expect(a).toMatchObject({ cueIn: 2, cueOut: 170, introSilenceSec: 2, outroSilenceSec: 10, trimmedDuration: 168 });
  });
});

describe('song_transition: static safety rules (AGENTS.md §2)', () => {
  const entries = [...Object.entries(hookSources), ...Object.entries(viewSources), ...Object.entries(supportSources)];

  it('scans every created module', () => {
    expect(entries.length).toBeGreaterThanOrEqual(13);
  });

  it.each(entries)('%s never injects raw HTML', (_path, source) => {
    expect(source).not.toContain('dangerouslySetInnerHTML');
  });

  it.each(entries)('%s has no explicit any or ts-ignore', (_path, source) => {
    expect(source).not.toMatch(/:\s*any\b|<any>|as any\b|@ts-ignore/);
  });

  it.each(entries)('%s never persists data in browser storage (AGENTS.md §2.5)', (_path, source) => {
    expect(source).not.toMatch(/localStorage\.setItem|sessionStorage\.setItem/);
  });
});
