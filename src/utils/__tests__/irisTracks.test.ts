import { describe, it, expect } from 'vitest';
import { cancionConPistas, getSongIrisStemIdea, hasIrisStems, getIdeaTracks, cancionConIdeas, pistasDeCancion, metaStemsDeCancion, ideaDeStemsDeCancion } from '../irisTracks';
import { Song, SongAudioIdea } from '../../types';

describe('irisTracks helpers', () => {
  it('returns null when song has no audioIdeas', () => {
    const song: Song = {
      id: 'song-1',
      titulo: 'Test Song',
      duracion: '3:00',
      duracionSegundos: 180,
      tonalidad: 'Am',
      bpm: 120,
    };
    expect(getSongIrisStemIdea(song)).toBeNull();
    expect(hasIrisStems(song)).toBe(false);
  });

  it('detects Iris stems when idea has multiple pistas', () => {
    const ideaWithStems: SongAudioIdea = {
      id: 'idea-1',
      titulo: 'Mezcla Iris',
      seccion: 'general',
      audioUrl: 'https://example.com/master.mp3',
      subidoPor: 'diego',
      fecha: '2026-09-15',
      pistas: [
        { id: 'track-1', nombre: 'Voz', audioUrl: 'https://example.com/vocal.mp3' },
        { id: 'track-2', nombre: 'Batería', audioUrl: 'https://example.com/drums.mp3' },
      ],
    };
    const song: Song = {
      id: 'song-1',
      titulo: 'Test Song',
      duracion: '3:00',
      duracionSegundos: 180,
      tonalidad: 'Am',
      bpm: 120,
      audioIdeas: [ideaWithStems],
    };
    expect(hasIrisStems(song)).toBe(true);
    expect(getSongIrisStemIdea(song)?.id).toBe('idea-1');
    expect(getIdeaTracks(ideaWithStems)).toHaveLength(2);
  });

  it('detects Iris stems when stemEngineUsed is set', () => {
    const ideaWithEngine: SongAudioIdea = {
      id: 'idea-engine',
      titulo: 'Pistas Iris',
      seccion: 'general',
      audioUrl: 'https://example.com/audio.mp3',
      subidoPor: 'diego',
      fecha: '2026-09-15',
      stemEngineUsed: 'demucs-v4',
    };
    const song: Song = {
      id: 'song-2',
      titulo: 'Another Song',
      duracion: '4:00',
      duracionSegundos: 240,
      tonalidad: 'C',
      bpm: 100,
      audioIdeas: [ideaWithEngine],
    };
    expect(hasIrisStems(song)).toBe(true);
    expect(getSongIrisStemIdea(song)?.id).toBe('idea-engine');
  });

  it('returns fallback track when idea has no pistas', () => {
    const singleIdea: SongAudioIdea = {
      id: 'idea-single',
      titulo: 'Maqueta Acústica',
      seccion: 'general',
      audioUrl: 'https://example.com/acoustic.mp3',
      subidoPor: 'diego',
      fecha: '2026-09-15',
    };
    const tracks = getIdeaTracks(singleIdea);
    expect(tracks).toHaveLength(1);
    expect(tracks[0].nombre).toBe('Maqueta Acústica');
    expect(tracks[0].audioUrl).toBe('https://example.com/acoustic.mp3');
  });
});

describe('cancionConIdeas', () => {
  const stem = (id: string) => ({ id, nombre: id, audioUrl: `${id}.mp3` });
  const ideaIris = { id: 'i1', titulo: 'Iris', seccion: 'general', audioUrl: 'a', subidoPor: 'x', fecha: 'f', stemEngineUsed: 'Demucs', pistas: [stem('drums'), stem('bass')] } as never;

  it('copia en song.pistas los stems de la idea de Iris', () => {
    const r = cancionConIdeas({ audioIdeas: [] as never[] }, [ideaIris]);
    expect(r.pistas?.map((p) => p.id)).toEqual(['drums', 'bass']);
  });
  it('si ya no hay idea de Iris conserva los stems de la canción', () => {
    const r = cancionConIdeas({ pistas: [stem('drums'), stem('bass')] }, []);
    expect(r.pistas?.map((p) => p.id)).toEqual(['drums', 'bass']);
  });
  it('sin stems en ningún sitio no inventa la clave pistas', () => {
    expect('pistas' in cancionConIdeas({}, [])).toBe(false);
  });
});

describe('cancionConPistas', () => {
  const stem = (id: string) => ({ id, nombre: id, audioUrl: `${id}.mp3` });
  const toma = { id: 't1', titulo: 'Toma', seccion: 'general', audioUrl: 'a', subidoPor: 'x', fecha: 'f' } as never;
  it('con los stems de la canción escribe en song.pistas y no toca las tomas', () => {
    const song = { id: 's', pistas: [stem('a'), stem('b')], audioIdeas: [toma] } as any;
    const iris = ideaDeStemsDeCancion(song)!;
    const r = cancionConPistas(song, iris, [stem('b')]);
    expect(r.pistas?.map((p) => p.id)).toEqual(['b']);
    expect(r.audioIdeas).toBe(song.audioIdeas);
  });
  it('con una toma normal escribe en la propia idea', () => {
    const song = { id: 's', pistas: [stem('a'), stem('b')], audioIdeas: [toma] } as any;
    const r = cancionConPistas(song, toma, [stem('x')], { audioUrl: 'z' });
    expect(r.audioIdeas?.[0]).toMatchObject({ pistas: [stem('x')], audioUrl: 'z' });
    expect(r.pistas?.map((p) => p.id)).toEqual(['a', 'b']);
  });
  it('si la toma real de Iris no está al día, la canción manda al leerla', () => {
    const vieja = { ...toma, stemEngineUsed: 'd', pistas: [stem('a'), stem('b'), stem('c')] } as any;
    const song = { id: 's', pistas: [stem('a'), stem('b')], audioIdeas: [vieja] } as any;
    expect(ideaDeStemsDeCancion(song)?.pistas?.map((p) => p.id)).toEqual(['a', 'b']);
    expect(cancionConIdeas(song, [vieja]).pistas?.map((p) => p.id)).toEqual(['a', 'b']);
  });
});

describe('lectura desde la canción', () => {
  const stems = [
    { id: 'p1', nombre: 'Voz', audioUrl: 'v' },
    { id: 'p2', nombre: 'Bajo', audioUrl: 'b' },
  ] as any;

  it('song.pistas manda sobre las de la idea', () => {
    const song = { id: 's', pistas: stems, audioIdeas: [{ id: 'i', pistas: [stems[0], stems[1], stems[0]] }] } as any;
    expect(pistasDeCancion(song)).toBe(stems);
  });
  it('sin song.pistas cae a la idea (datos antiguos)', () => {
    const song = { id: 's', audioIdeas: [{ id: 'i', pistas: stems }] } as any;
    expect(pistasDeCancion(song)).toEqual(stems);
  });
  it('metaStemsDeCancion prefiere song.stemsMeta', () => {
    const song = { id: 's', stemsMeta: { motor: 'a' }, audioIdeas: [{ id: 'i', pistas: stems, stemEngineUsed: 'b' }] } as any;
    expect(metaStemsDeCancion(song)?.motor).toBe('a');
  });
  it('ideaDeStemsDeCancion fabrica una idea sintética si solo hay stems en la canción', () => {
    const idea = ideaDeStemsDeCancion({ id: 's', pistas: stems, audioIdeas: [] } as any);
    expect(idea?.id).toBe('stems-s');
    expect(idea?.pistas).toEqual(stems);
  });
  it('hasIrisStems detecta stems solo en la canción', () => {
    expect(hasIrisStems({ id: 's', pistas: stems } as any)).toBe(true);
    expect(hasIrisStems({ id: 's' } as any)).toBe(false);
  });
});

describe('Iris separado de las tomas en la lista', () => {
  const toma = { id: 't1', titulo: 'Toma', audioUrl: 'u' } as any;
  const iris = { id: 'i1', titulo: 'Iris', audioUrl: 'u', stemEngineUsed: 'demucs' } as any;
  const multi = { id: 'm1', titulo: 'Multi', audioUrl: 'u', pistas: [{ id: 'a' }, { id: 'b' }] } as any;

  it('esIdeaIris detecta motor o varias pistas', async () => {
    const { esIdeaIris } = await import('../irisTracks');
    expect(esIdeaIris(iris)).toBe(true);
    expect(esIdeaIris(multi)).toBe(true);
    expect(esIdeaIris(toma)).toBe(false);
  });

  it('irisPrimero sube Iris y respeta el orden de las tomas', async () => {
    const { irisPrimero } = await import('../irisTracks');
    expect(irisPrimero([toma, { ...toma, id: 't2' }, iris]).map((i) => i.id)).toEqual(['i1', 't1', 't2']);
    expect(irisPrimero([toma]).map((i) => i.id)).toEqual(['t1']);
  });
});
