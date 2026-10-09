import { describe, expect, it } from 'vitest';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useIdeaDurations } from '../hooks/useIdeaDurations';
import { useIdeaLoopControls } from '../hooks/useIdeaLoopControls';
import { useIdeaPlaybackTracks } from '../hooks/useIdeaPlaybackTracks';
import type { Song, SongAudioIdea } from '../../../types';

type LoopConfigMap = Record<string, { enabled: boolean; start: number; end: number }>;

const idea = { id: 'i1', titulo: 'Riff', audioUrl: 'a.mp3', subidoPor: 'ana', fecha: '1/1' } as SongAudioIdea;

describe('useIdeaDurations', () => {
  const { formatTime, formatDesfase, getValidIdeaDuration, getSafeTrackDuration } = useIdeaDurations({ durationMap: { i1: 95, rota: NaN } });

  it('formatTime da M:SS y tolera valores inválidos', () => {
    expect(formatTime(95)).toBe('1:35');
    expect(formatTime(5)).toBe('0:05');
    expect(formatTime(NaN)).toBe('0:00');
    expect(formatTime(-3)).toBe('0:00');
    expect(formatTime(Infinity)).toBe('0:00');
  });

  it('formatDesfase distingue micro-correcciones de latencia de pistas colocadas más adelante', () => {
    expect(formatDesfase(0)).toBe('0ms');
    expect(formatDesfase(undefined)).toBe('0ms');
    expect(formatDesfase(120)).toBe('+120ms');
    expect(formatDesfase(-40)).toBe('-40ms');
    expect(formatDesfase(2500)).toBe('+2.5s');
    expect(formatDesfase(-65000)).toBe('empieza en 1:05');
  });

  it('getValidIdeaDuration cae a 30 s si no hay duración válida', () => {
    expect(getValidIdeaDuration('i1')).toBe(95);
    expect(getValidIdeaDuration('rota')).toBe(30);
    expect(getValidIdeaDuration('inexistente')).toBe(30);
  });

  it('getSafeTrackDuration devuelve 0 para elementos nulos o con duración no finita', () => {
    expect(getSafeTrackDuration(null)).toBe(0);
    expect(getSafeTrackDuration({ duration: Infinity } as HTMLAudioElement)).toBe(0);
    expect(getSafeTrackDuration({ duration: 12.5 } as HTMLAudioElement)).toBe(12.5);
  });
});

describe('useIdeaLoopControls', () => {
  const useLoopHarness = (currentTimeMap: Record<string, number>) => {
    let state: LoopConfigMap = {};
    const setLoopConfigMap: Dispatch<SetStateAction<LoopConfigMap>> = (update) => {
      state = typeof update === 'function' ? update(state) : update;
    };
    const controls = useIdeaLoopControls({ getValidIdeaDuration: () => 60, setLoopConfigMap, currentTimeMap });
    return { controls, read: () => state };
  };

  it('activa y desactiva el bucle conservando los límites', () => {
    const { controls, read } = useLoopHarness({});
    controls.toggleIdeaLoop(idea);
    expect(read().i1).toEqual({ enabled: true, start: 0, end: 60 });
    controls.toggleIdeaLoop(idea);
    expect(read().i1.enabled).toBe(false);
  });

  it('fija el cue de entrada y de salida en el instante actual', () => {
    const entrada = useLoopHarness({ i1: 20 });
    entrada.controls.setIdeaCueIn(idea);
    expect(entrada.read().i1).toEqual({ enabled: true, start: 20, end: 60 });
    const invertido = useLoopHarness({ i1: 40 });
    invertido.controls.setIdeaCueIn(idea);
    invertido.controls.setIdeaCueOut(idea);
    // Entrada y salida en el mismo instante: el cue de entrada se reinicia a 0 (ventana válida).
    expect(invertido.read().i1).toEqual({ enabled: true, start: 0, end: 40 });
    const ventana = useLoopHarness({ i1: 10 });
    ventana.controls.setIdeaCueOut(idea);
    expect(ventana.read().i1).toEqual({ enabled: true, start: 0, end: 10 });
  });
});

describe('useIdeaPlaybackTracks', () => {
  it('sin pistas base, las pistas de reproducción son las de la idea', () => {
    const song = { id: 's1', audioIdeas: [idea] } as unknown as Song;
    const songRef = { current: song } as MutableRefObject<Song>;
    const { pistasDeReproduccion, pistasBaseVirtuales } = useIdeaPlaybackTracks({ songRef, song });
    expect(pistasBaseVirtuales(idea)).toEqual([]);
    expect(pistasDeReproduccion(idea).map((t) => t.audioUrl)).toEqual(['a.mp3']);
  });
});
