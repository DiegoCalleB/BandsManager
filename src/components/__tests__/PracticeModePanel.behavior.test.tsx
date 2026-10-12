// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import type { Song, SongAudioIdea, AudioTrack } from '../../types';

const pitchShift = vi.hoisted(() => vi.fn());
vi.mock('../../hooks/useTonePitchShift', () => ({ useTonePitchShift: pitchShift }));
vi.mock('../../utils/audioStorage', () => ({ resolveAudioUrl: async (u: string) => u }));
vi.mock('../../utils/api', () => ({ apiFetch: vi.fn() }));

import PracticeModePanel from '../PracticeModePanel';

class AudioFalso {
  static todos: AudioFalso[] = [];
  src = '';
  volume = 1;
  muted = false;
  preload = '';
  crossOrigin: string | null = null;
  currentTime = 0;
  playbackRate = 1;
  pause = vi.fn();
  play = vi.fn(() => Promise.resolve());
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  constructor() { AudioFalso.todos.push(this); }
}

const song = { id: 's1', titulo: 'Tema', duracionSegundos: 200, bpm: 100 } as unknown as Song;
const idea = (id: string) => ({ id, titulo: `Idea ${id}` }) as unknown as SongAudioIdea;
const pistas = [
  { id: 't1', nombre: 'Bajo', audioUrl: 'http://x/bajo.mp3', instrumento: 'bajo' },
  { id: 't2', nombre: 'Voz', audioUrl: 'http://x/voz.mp3', instrumento: 'voz' },
] as unknown as AudioTrack[];
const clave = (ideaId: string) => `practiceMix:sinbanda:s1:${ideaId}:anon`;

describe('PracticeModePanel', () => {
  beforeEach(() => {
    AudioFalso.todos = [];
    pitchShift.mockReset();
    localStorage.clear();
    vi.stubGlobal('Audio', AudioFalso);
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it('crea un audio por pista, carga su fuente y lo entrega a los puentes de tono', async () => {
    render(<PracticeModePanel song={song} idea={idea('i1')} tracks={pistas} onClose={vi.fn()} />);
    await waitFor(() => expect(AudioFalso.todos.map((a) => a.src)).toEqual(['http://x/bajo.mp3', 'http://x/voz.mp3']));
    await waitFor(() => {
      const ultimas = pitchShift.mock.calls.slice(-2).map((c) => c[0].audioElement);
      expect(ultimas).toEqual(AudioFalso.todos);
    });
  });

  it('carga la mezcla guardada de la idea y la aplica al audio', async () => {
    localStorage.setItem(clave('i1'), JSON.stringify({ t1: { muted: true } }));
    render(<PracticeModePanel song={song} idea={idea('i1')} tracks={pistas} onClose={vi.fn()} />);
    await waitFor(() => expect(AudioFalso.todos).toHaveLength(2));
    await waitFor(() => expect(AudioFalso.todos[0].muted).toBe(true));
    expect(AudioFalso.todos[1].muted).toBe(false);
    expect(localStorage.getItem(clave('i1'))).toBe(JSON.stringify({ t1: { muted: true } }));
  });

  it('aplica la mezcla guardada también a las pistas que se crean después de la primera', async () => {
    localStorage.setItem(clave('i1'), JSON.stringify({ t2: { muted: true } }));
    render(<PracticeModePanel song={song} idea={idea('i1')} tracks={pistas} onClose={vi.fn()} />);
    await waitFor(() => expect(AudioFalso.todos).toHaveLength(2));
    await waitFor(() => expect(AudioFalso.todos[1].muted).toBe(true));
    expect(AudioFalso.todos[0].muted).toBe(false);
  });

  it('al cambiar de idea para el audio anterior y no filtra la mezcla a la otra idea', async () => {
    localStorage.setItem(clave('i1'), JSON.stringify({ t1: { muted: true } }));
    const { rerender } = render(<PracticeModePanel song={song} idea={idea('i1')} tracks={pistas} onClose={vi.fn()} />);
    await waitFor(() => expect(AudioFalso.todos[0]?.muted).toBe(true));
    const anteriores = [...AudioFalso.todos];
    rerender(<PracticeModePanel song={song} idea={idea('i2')} tracks={pistas} onClose={vi.fn()} />);
    anteriores.forEach((a) => expect(a.pause).toHaveBeenCalled());
    await waitFor(() => expect(AudioFalso.todos).toHaveLength(4));
    await waitFor(() => expect(AudioFalso.todos[2].src).toBe('http://x/bajo.mp3'));
    expect(AudioFalso.todos[2].muted).toBe(false);
    expect(localStorage.getItem(clave('i2'))).toBeNull();
    expect(localStorage.getItem(clave('i1'))).toBe(JSON.stringify({ t1: { muted: true } }));
  });
});
