// @vitest-environment happy-dom
/**
 * Comportamiento de useAtrilAudio: reproducir, buscar y guardar una idea grabada sobre el tema.
 * Los hooks de audio de bajo nivel (stems, tono, bucle, Iris) se sustituyen: aquí se prueba la
 * orquestación del Atril, no el procesado de señal (que tiene sus propios tests).
 */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Song } from '../../../../types';

const grabacion = vi.hoisted(() => ({
  toma: null as null | { blob: Blob; mime: string },
  offset: 2,
  descartar: vi.fn(),
}));
const uploadFileToServer = vi.hoisted(() => vi.fn());

vi.mock('../../../../hooks/useSeparacionIris', () => ({ useSeparacionIris: () => ({ handlePerformAiStemSeparation: vi.fn() }) }));
vi.mock('../../../../hooks/useMezclaStems', () => ({ useMezclaStems: () => undefined }));
vi.mock('../../../../hooks/useTonoAudio', () => ({ useTonoAudio: () => undefined }));
vi.mock('../../../../hooks/useBucleAB', () => ({ useBucleAB: () => ({ bucle: null, marcar: vi.fn(), limpiar: vi.fn() }) }));
vi.mock('../../../../hooks/useMezclaGuardada', () => ({
  useMezclaGuardada: () => ({ ajustes: {}, setAjustes: vi.fn(), velocidad: 1, setVelocidad: vi.fn() }),
}));
vi.mock('../../../../hooks/useGrabarIdea', () => ({ useGrabarIdea: () => grabacion }));
vi.mock('../../../../utils/audioStorage', () => ({ uploadFileToServer }));

import { useAtrilAudio } from '../useAtrilAudio';

const tema = (over: Partial<Song> = {}) => ({ id: 's1', titulo: 'Tema', audioIdeas: [], ...over }) as unknown as Song;

/** Elemento de audio mínimo: play() configurable, pause() y currentTime. */
function audioFalso(play: () => Promise<void> = () => Promise.resolve()) {
  return { play: vi.fn(play), pause: vi.fn(), currentTime: 0, playbackRate: 1 } as unknown as HTMLAudioElement;
}

function montar(song: Song) {
  const onUpdateSong = vi.fn();
  const setAiSuccessMsg = vi.fn();
  const hook = renderHook(() =>
    useAtrilAudio({ song, onUpdateSong, ajustes: { diagramas: false, oido: false, escucha: 'todo' }, transpose: 0, setAiSuccessMsg }),
  );
  return { ...hook, onUpdateSong, setAiSuccessMsg };
}

beforeEach(() => {
  vi.clearAllMocks();
  grabacion.toma = null;
});

describe('useAtrilAudio: reproducción', () => {
  it('sin audio adjunto avisa en vez de reproducir', () => {
    const { result, setAiSuccessMsg } = montar(tema());
    act(() => result.current.handleToggleAudio());
    expect(result.current.isPlayingAudio).toBe(false);
    expect(setAiSuccessMsg).toHaveBeenCalledWith(expect.stringMatching(/no tiene un archivo de audio/));
  });

  it('usa la maqueta principal y alterna play y pausa', async () => {
    const { result } = montar(tema({ audioPrincipalUrl: '/maqueta.mp3' }));
    expect(result.current.audioUrl).toBe('/maqueta.mp3');
    const audio = audioFalso();
    result.current.audioRef.current = audio;
    await act(async () => result.current.handleToggleAudio());
    expect(audio.play).toHaveBeenCalled();
    expect(result.current.isPlayingAudio).toBe(true);
    act(() => result.current.handleToggleAudio());
    expect(audio.pause).toHaveBeenCalled();
    expect(result.current.isPlayingAudio).toBe(false);
  });

  it('si el navegador rechaza play() lo dice y no marca el tema como sonando', async () => {
    const { result, setAiSuccessMsg } = montar(tema({ audioUrl: '/a.mp3' }));
    result.current.audioRef.current = audioFalso(() => Promise.reject(new Error('NotAllowedError')));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await act(async () => result.current.handleToggleAudio());
    expect(result.current.isPlayingAudio).toBe(false);
    expect(setAiSuccessMsg).toHaveBeenCalledWith(expect.stringMatching(/No se pudo reproducir/));
  });

  it('buscarEnAudio mueve el audio y el reloj del Atril a la vez', () => {
    const { result } = montar(tema({ audioUrl: '/a.mp3' }));
    const audio = audioFalso();
    result.current.audioRef.current = audio;
    act(() => result.current.buscarEnAudio(42));
    expect(audio.currentTime).toBe(42);
    expect(result.current.audioCurrentTime).toBe(42);
  });

  it('formatea el tiempo sin ceros a la izquierda en los minutos', () => {
    const { result } = montar(tema());
    expect(result.current.formatAudioTime(187)).toBe('3:07');
    expect(result.current.formatAudioTime(Number.NaN)).toBe('0:00');
  });

  it('al cerrar el Atril se pausa el audio', () => {
    const { result, unmount } = montar(tema({ audioUrl: '/a.mp3' }));
    const audio = audioFalso();
    result.current.audioRef.current = audio;
    unmount();
    expect(audio.pause).toHaveBeenCalled();
  });
});

describe('useAtrilAudio: guardar una idea grabada', () => {
  it('sube la toma y la añade al tema ligada a lo que sonaba', async () => {
    grabacion.toma = { blob: new Blob(['x']), mime: 'audio/webm' };
    uploadFileToServer.mockResolvedValue('/uploads/idea.webm');
    const { result, onUpdateSong, setAiSuccessMsg } = montar(tema({ audioUrl: '/a.mp3' }));
    await act(() => result.current.guardarIdea());

    expect(uploadFileToServer).toHaveBeenCalledWith(expect.any(File), expect.objectContaining({ folder: expect.any(String) }));
    const actualizado = onUpdateSong.mock.calls[0][0] as Song;
    expect(actualizado.audioIdeas).toHaveLength(1);
    expect(actualizado.audioIdeas?.[0]).toMatchObject({ audioUrl: '/uploads/idea.webm' });
    expect(grabacion.descartar).toHaveBeenCalled();
    expect(setAiSuccessMsg).toHaveBeenCalledWith(expect.stringMatching(/Idea guardada/));
    expect(result.current.guardandoIdea).toBe(false);
  });

  it('si la subida falla avisa y no toca el tema', async () => {
    grabacion.toma = { blob: new Blob(['x']), mime: 'audio/webm' };
    uploadFileToServer.mockRejectedValue(new Error('500'));
    const { result, onUpdateSong, setAiSuccessMsg } = montar(tema({ audioUrl: '/a.mp3' }));
    await act(() => result.current.guardarIdea());
    expect(onUpdateSong).not.toHaveBeenCalled();
    expect(grabacion.descartar).not.toHaveBeenCalled();
    expect(setAiSuccessMsg).toHaveBeenCalledWith(expect.stringMatching(/No se pudo guardar la idea/));
  });

  it('sin toma grabada no hace nada', async () => {
    const { result } = montar(tema({ audioUrl: '/a.mp3' }));
    await act(() => result.current.guardarIdea());
    expect(uploadFileToServer).not.toHaveBeenCalled();
  });
});
