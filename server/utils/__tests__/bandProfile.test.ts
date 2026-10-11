import { describe, it, expect } from 'vitest';
import {
  parseInstruments,
  baseHashtags,
  buildBandContextBlock,
  displayBandName,
  emptyBandProfile,
  loadBandProfile,
} from '../bandProfile';

describe('parseInstruments', () => {
  it('parte los campos libres con comas y con " y "', () => {
    expect(parseInstruments([{ name: 'Jon', instrument: 'Cantante, Loops y Percusión' }])).toEqual([
      'Cantante',
      'Loops',
      'Percusión',
    ]);
  });

  it('deduplica sin distinguir mayúsculas', () => {
    expect(
      parseInstruments([
        { name: 'A', instrument: 'Violín' },
        { name: 'B', instrument: 'violín' },
      ])
    ).toEqual(['Violín']);
  });

  it('descarta los roles que no son instrumentos', () => {
    const instrumentos = parseInstruments([
      { name: 'Diego', instrument: 'Mánager / Booking (Oficina)' },
      { name: 'Fer', instrument: 'Líder de Ruta 66' },
      { name: 'Paco', instrument: 'Guitarra' },
    ]);
    expect(instrumentos).toContain('Guitarra');
    expect(instrumentos).not.toContain('Mánager');
    expect(instrumentos).not.toContain('Booking');
    expect(instrumentos.some((i) => /Líder/i.test(i))).toBe(false);
  });

  it('aguanta miembros sin instrumento', () => {
    expect(parseInstruments([{ name: 'X', instrument: '' }])).toEqual([]);
    expect(parseInstruments([])).toEqual([]);
  });
});

describe('baseHashtags', () => {
  it('deriva hashtags del nombre, el estilo y la ciudad', () => {
    const tags = baseHashtags({ name: 'Dos Marcianos', genre: 'Rock', location: 'Sevilla' });
    expect(tags).toContain('#DosMarcianos');
    expect(tags).toContain('#Rock');
    expect(tags).toContain('#Sevilla');
  });

  it('quita tildes y caracteres raros', () => {
    expect(baseHashtags({ name: 'Banda Ejemplo!'})[0]).toBe('#BandaEjemplo');
    expect(baseHashtags({ name: 'Música Rara' })[0]).toBe('#MusicaRara');
  });

  it('siempre devuelve algo aunque la banda no tenga datos', () => {
    expect(baseHashtags(null).length).toBeGreaterThan(0);
    expect(baseHashtags({})).toContain('#MusicaEnDirecto');
  });
});

describe('displayBandName', () => {
  it('cae a un nombre neutro en vez de dejar un hueco en el prompt', () => {
    expect(displayBandName({ name: 'Lavanda' })).toBe('Lavanda');
    expect(displayBandName({ name: '   ' })).toBe('la banda');
    expect(displayBandName(null)).toBe('la banda');
  });
});

describe('buildBandContextBlock', () => {
  it('escribe la ficha con los datos reales de la banda', () => {
    const bloque = buildBandContextBlock({
      name: 'Ruta 66',
      genre: 'Rock clásico',
      location: 'Sevilla',
      members: [
        { name: 'Paco', instrument: 'Guitarra' },
        { name: 'Fer', instrument: 'Batería' },
      ],
      instruments: ['Guitarra', 'Batería'],
    });
    expect(bloque).toContain('"Ruta 66"');
    expect(bloque).toContain('Rock clásico');
    expect(bloque).toContain('Guitarra, Batería');
    expect(bloque).toContain('Paco (Guitarra)');
  });

  it('prohíbe explícitamente los instrumentos que la banda no tiene', () => {
    const bloque = buildBandContextBlock({ name: 'Lavanda', instruments: ['Guitarra', 'Voz'] });
    expect(bloque).toContain('exactamente: Guitarra, Voz');
    expect(bloque).toMatch(/NO menciones jamás ningún instrumento que no esté/);
  });

  it('sin instrumentación conocida, pide no nombrar instrumentos', () => {
    const bloque = buildBandContextBlock({ name: 'Nueva Banda' });
    expect(bloque).toContain('NO nombres instrumentos concretos');
  });

  it('incluye el ADN de voz cuando ya se ha analizado el tono', () => {
    const bloque = buildBandContextBlock({
      name: 'X',
      toneSummary: 'Cercano y gamberro',
      toneVocabulary: ['familia', 'pogo'],
      tonePhrases: ['nos vemos en las trincheras'],
      toneEmojis: ['🔥'],
    });
    expect(bloque).toContain('ADN DE VOZ');
    expect(bloque).toContain('Cercano y gamberro');
    expect(bloque).toContain('familia, pogo');
    expect(bloque).toContain('"nos vemos en las trincheras"');
  });

  it('omite el bloque de tono si no hay análisis previo', () => {
    expect(buildBandContextBlock({ name: 'X' })).not.toContain('ADN DE VOZ');
  });

  it('no lanza con un perfil nulo o vacío', () => {
    expect(() => buildBandContextBlock(null)).not.toThrow();
    expect(buildBandContextBlock(emptyBandProfile())).toContain('la banda');
  });
});

describe('loadBandProfile', () => {
  const state = {
    users: [
      { name: 'Paco', instrument: 'Guitarra', band_id: 'band-ruta-66' },
      { name: 'Fer', instrument: 'Batería', band_id: 'band-ruta-66' },
      { name: 'Otro', instrument: 'Violín', band_id: 'band-ejemplo' },
    ],
    bands: [
      {
        band_id: 'band-ruta-66',
        dna_expresion: { tono_comunicacion: 'Directo', vocabulario_clave: ['rock'] },
      },
    ],
  };

  it('reúne registro, EPK, miembros y ADN de tono', async () => {
    const perfil = await loadBandProfile('band-ruta-66', {
      getBand: async () => ({ nombre_banda: 'Ruta 66', estilo_musical: 'Rock', localizacion: 'Sevilla' }),
      getEpk: async () => ({ biografia: 'Banda de versiones', enlacesRedes: { instagram: '@ruta66' } }),
      getState: () => state,
    });

    expect(perfil.name).toBe('Ruta 66');
    expect(perfil.genre).toBe('Rock');
    expect(perfil.bio).toBe('Banda de versiones');
    expect(perfil.instagram).toBe('@ruta66');
    expect(perfil.instruments).toEqual(['Guitarra', 'Batería']);
    expect(perfil.toneSummary).toBe('Directo');
  });

  it('solo coge los miembros de esa banda, no los de otra', async () => {
    const perfil = await loadBandProfile('band-ruta-66', {
      getBand: async () => null,
      getEpk: async () => null,
      getState: () => state,
    });
    expect(perfil.members.map((m) => m.name)).toEqual(['Paco', 'Fer']);
    expect(perfil.instruments).not.toContain('Violín');
  });

  it('un fallo de BD no tumba la generación: devuelve lo que haya', async () => {
    const perfil = await loadBandProfile('band-ruta-66', {
      getBand: async () => { throw new Error('supabase caído'); },
      getEpk: async () => { throw new Error('supabase caído'); },
      getState: () => state,
    });
    expect(perfil.name).toBe('');
    expect(perfil.instruments).toEqual(['Guitarra', 'Batería']);
  });

  it('un state ilegible tampoco lanza', async () => {
    const perfil = await loadBandProfile('band-x', {
      getBand: async () => ({ nombre_banda: 'X' }),
      getEpk: async () => null,
      getState: () => { throw new Error('data.json corrupto'); },
    });
    expect(perfil.name).toBe('X');
    expect(perfil.members).toEqual([]);
  });

  it('lee el ADN de tono de Supabase (registered_bands.dna_expresion), no solo del caché local', async () => {
    const perfil = await loadBandProfile('band-ruta-66', {
      getBand: async () => ({
        nombre_banda: 'Ruta 66',
        dna_expresion: { tono_comunicacion: 'Gamberro', vocabulario_clave: ['pogo'] },
      }),
      getEpk: async () => null,
      getState: () => ({ users: [], bands: [] }),
    });
    expect(perfil.toneSummary).toBe('Gamberro');
    expect(perfil.toneVocabulary).toEqual(['pogo']);
  });

  it('el ADN de Supabase manda sobre el del caché local si ambos existen', async () => {
    const perfil = await loadBandProfile('band-ruta-66', {
      getBand: async () => ({ dna_expresion: { tono_comunicacion: 'De Supabase' } }),
      getEpk: async () => null,
      getState: () => state,
    });
    expect(perfil.toneSummary).toBe('De Supabase');
  });
});
