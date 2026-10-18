import { describe, it, expect } from 'vitest';
import { cancionConMezcla, pistasBaseMezcladas, idPistaBase } from '../utils/ideaDeAtril';
import type { Song, SongAudioIdea, AudioTrack } from '../types';

const stem = { id: 'b', nombre: 'Bajo', audioUrl: 'b.mp3', volumen: 1 } as unknown as AudioTrack;
const idea = { id: 'i1', titulo: 'Toma', audioUrl: 'x.mp3', sobrePistas: ['b'] } as unknown as SongAudioIdea;
const cancion = { id: 's', pistas: [stem], audioIdeas: [idea] } as unknown as Song;

describe('mezcla propia de las pistas de Iris en una idea', () => {
  it('mute/volumen se guardan en la idea y no tocan la pista de la canción', () => {
    const virtual = pistasBaseMezcladas(idea, [stem]);
    expect(virtual[0].id).toBe(idPistaBase('i1', 'b'));
    const out = cancionConMezcla(cancion, idea, [{ ...virtual[0], muted: true, volumen: 0.4 }]);
    expect(out.pistas).toEqual([stem]);
    const i = out.audioIdeas![0];
    expect(i.mezclaBase!.b).toMatchObject({ muted: true, volumen: 0.4 });
    expect(i.pistas?.some((p) => p.id.startsWith('base-')) ?? false).toBe(false);
    expect(pistasBaseMezcladas(i, [stem])[0]).toMatchObject({ muted: true, volumen: 0.4, audioUrl: 'b.mp3' });
  });
});
