import { describe, it, expect } from 'vitest';
import {
  validarYRepararEventos,
  sanearIdeasMelodicas,
  notaAMidi,
  midiANota,
  parseTonalidad
} from '../melodicIdeaValidator';

const base = { instrument: 'guitarra' as const, keyName: 'Do', escala: 'mayor' as const, bpm: 120, durationSecs: 20 };

describe('notaAMidi / midiANota', () => {
  it('usa la convención de Tone.js: Do central = C4 = MIDI 60', () => {
    expect(notaAMidi('C4')).toBe(60);
    expect(notaAMidi('A4')).toBe(69);
    expect(midiANota(60)).toBe('C4');
    expect(midiANota(69)).toBe('A4');
  });

  it('entiende sostenidos y bemoles como la misma altura', () => {
    expect(notaAMidi('C#4')).toBe(61);
    expect(notaAMidi('Db4')).toBe(61);
  });

  it('devuelve null para lo que no es una nota, en vez de un NaN silencioso', () => {
    // Este es justo el caso que hacía fallar la función en silencio: Tone.js convertía 'H4'
    // en NaN sin lanzar, y el usuario oía un hueco mudo.
    expect(notaAMidi('H4')).toBeNull();
    expect(notaAMidi('C9')).toBeNull();
    expect(notaAMidi('')).toBeNull();
    expect(notaAMidi('do')).toBeNull();
  });
});

describe('parseTonalidad', () => {
  it('entiende la nomenclatura española que usa el chatbot', () => {
    expect(parseTonalidad('Do')).toEqual({ clase: 0, esMenor: false });
    expect(parseTonalidad('Sol')).toEqual({ clase: 7, esMenor: false });
    expect(parseTonalidad('Si')).toEqual({ clase: 11, esMenor: false });
  });

  it('entiende la inglesa que puede venir en Song.tonalidad del repertorio', () => {
    expect(parseTonalidad('Am')).toEqual({ clase: 9, esMenor: true });
    expect(parseTonalidad('C#m')).toEqual({ clase: 1, esMenor: true });
    expect(parseTonalidad('G')).toEqual({ clase: 7, esMenor: false });
  });

  it('distingue "Mi" de "Mim" sin confundir la M de Mi con la m de menor', () => {
    expect(parseTonalidad('Mi')).toEqual({ clase: 4, esMenor: false });
    expect(parseTonalidad('Mim')).toEqual({ clase: 4, esMenor: true });
    expect(parseTonalidad('Fa#m')).toEqual({ clase: 6, esMenor: true });
  });
});

describe('validarYRepararEventos', () => {
  it('descarta las notas irrecuperables y lo dice, en vez de sintetizar un hueco mudo', () => {
    const res = validarYRepararEventos(
      [
        { tiempo: 0, nota: 'C4', duracionBeats: 1 },
        { tiempo: 1, nota: 'H4', duracionBeats: 1 },
        { tiempo: 2, nota: 42, duracionBeats: 1 },
        { tiempo: 3, duracionBeats: 1 }
      ],
      base
    );

    expect(res.eventos).toHaveLength(1);
    expect(res.eventos[0].nota).toBe('C4');
    expect(res.reparaciones.join( ' ')).toContain('3 nota(s) inválida(s)');
  });

  it('transporta por octavas al registro del instrumento en vez de perder la nota', () => {
    // C1 está muy por debajo del registro de una guitarra (E3-E5): se sube, no se descarta.
    const res = validarYRepararEventos([{ tiempo: 0, nota: 'C1', duracionBeats: 1 }], base);

    expect(res.eventos).toHaveLength(1);
    expect(notaAMidi(res.eventos[0].nota)!).toBeGreaterThanOrEqual(52);
    expect(notaAMidi(res.eventos[0].nota)!).toBeLessThanOrEqual(76);
    // Conserva la clase de altura: sigue siendo un Do.
    expect(notaAMidi(res.eventos[0].nota)! % 12).toBe(0);
    expect(res.reparaciones.join( ' ')).toContain('transportada');
  });

  it('encaja en la escala las notas que el modelo saca de tono', () => {
    // C# no pertenece a Do mayor: debe acabar en un grado de la escala.
    const res = validarYRepararEventos([{ tiempo: 0, nota: 'C#4', duracionBeats: 1 }], base);

    const grados = [0, 2, 4, 5, 7, 9, 11];
    expect(grados).toContain(notaAMidi(res.eventos[0].nota)! % 12);
    expect(res.reparaciones.join( ' ')).toContain('tonalidad');
  });

  it('respeta las notas que ya vienen bien y no reporta reparaciones', () => {
    const res = validarYRepararEventos(
      [
        { tiempo: 0, nota: 'E4', duracionBeats: 1, velocidad: 0.9 },
        { tiempo: 1, nota: 'G4', duracionBeats: 0.5, velocidad: 0.7 }
      ],
      base
    );

    expect(res.eventos.map((e) => e.nota)).toEqual(['E4', 'G4']);
    expect(res.reparaciones).toEqual([]);
  });

  it('descarta lo que empieza más allá de la duración pedida y recorta lo que se pasa de largo', () => {
    // 20s a 120 BPM = 40 beats disponibles.
    const res = validarYRepararEventos(
      [
        { tiempo: 39, nota: 'E4', duracionBeats: 8 },
        { tiempo: 999, nota: 'G4', duracionBeats: 1 }
      ],
      base
    );

    expect(res.eventos).toHaveLength(1);
    expect(res.eventos[0].tiempo + res.eventos[0].duracionBeats).toBeLessThanOrEqual(40);
    expect(res.reparaciones.join( ' ')).toContain('recortada');
  });

  it('afina el handpan a una pentatónica, como los instrumentos reales', () => {
    const res = validarYRepararEventos(
      [
        { tiempo: 0, nota: 'D4', duracionBeats: 1 },
        { tiempo: 1, nota: 'G4', duracionBeats: 1 },
        { tiempo: 2, nota: 'C4', duracionBeats: 1 }
      ],
      { ...base, instrument: 'handpan', keyName: 'Re', escala: 'mayor' }
    );

    // Pentatónica mayor de Re: D, E, F#, A, B.
    const permitidas = [2, 4, 6, 9, 11];
    for (const ev of res.eventos) {
      expect(permitidas).toContain(notaAMidi(ev.nota)! % 12);
    }
  });

  it('reduce la percusión a golpes grave/medio/agudo en vez de una melodía cromática', () => {
    const res = validarYRepararEventos(
      [
        { tiempo: 0, nota: 'C4', duracionBeats: 0.5 },
        { tiempo: 1, nota: 'F#3', duracionBeats: 0.5 },
        { tiempo: 2, nota: 'A5', duracionBeats: 0.5 }
      ],
      { ...base, instrument: 'percusion' }
    );

    const golpes = ['C2', 'G2', 'C3'];
    for (const ev of res.eventos) {
      expect(golpes).toContain(ev.nota);
    }
  });

  it('elimina las notas duplicadas exactas que a veces repite el modelo', () => {
    const res = validarYRepararEventos(
      [
        { tiempo: 0, nota: 'E4', duracionBeats: 1 },
        { tiempo: 0, nota: 'E4', duracionBeats: 1 }
      ],
      base
    );

    expect(res.eventos).toHaveLength(1);
  });

  it('permite acordes: dos alturas distintas a la vez no se tocan', () => {
    const res = validarYRepararEventos(
      [
        { tiempo: 0, nota: 'E4', duracionBeats: 2 },
        { tiempo: 0, nota: 'G4', duracionBeats: 2 },
        { tiempo: 0, nota: 'B4', duracionBeats: 2 }
      ],
      base
    );

    expect(res.eventos).toHaveLength(3);
    expect(res.eventos.every((e) => e.duracionBeats === 2)).toBe(true);
  });

  it('recorta la cola de una nota cuando se vuelve a pulsar la misma altura', () => {
    const res = validarYRepararEventos(
      [
        { tiempo: 0, nota: 'E4', duracionBeats: 4 },
        { tiempo: 1, nota: 'E4', duracionBeats: 1 }
      ],
      base
    );

    expect(res.eventos[0].duracionBeats).toBe(1);
    expect(res.eventos).toHaveLength(2);
  });

  it('acota la intensidad al rango utilizable y pone un valor por defecto si falta', () => {
    const res = validarYRepararEventos(
      [
        { tiempo: 0, nota: 'E4', duracionBeats: 1, velocidad: 9 },
        { tiempo: 1, nota: 'G4', duracionBeats: 1, velocidad: -3 },
        { tiempo: 2, nota: 'C4', duracionBeats: 1 }
      ],
      base
    );

    expect(res.eventos[0].velocidad).toBe(1);
    expect(res.eventos[1].velocidad).toBe(0.1);
    expect(res.eventos[2].velocidad).toBe(0.85);
  });

  it('no lanza ante una entrada corrupta: devuelve vacío para que la ruta pueda avisar', () => {
    for (const basura of [null, undefined, 'texto', 42, {}]) {
      const res = validarYRepararEventos(basura, base);
      expect(res.eventos).toEqual([]);
      expect(res.reparaciones.length).toBeGreaterThan(0);
    }
  });

  it('pone tope al número de notas para que una idea no degenere en ruido', () => {
    const muchas = Array.from({ length: 120 }, (_, i) => ({
      tiempo: i * 0.25,
      nota: 'E4',
      duracionBeats: 0.2
    }));
    const res = validarYRepararEventos(muchas, { ...base, durationSecs: 60 });

    expect(res.eventos.length).toBeLessThanOrEqual(64);
    expect(res.reparaciones.join( ' ')).toContain('recortó la idea');
  });

  it('deduce que la tonalidad es menor por su propio nombre si no se declara la escala', () => {
    const res = validarYRepararEventos(
      [{ tiempo: 0, nota: 'C4', duracionBeats: 1 }],
      { instrument: 'guitarra', keyName: 'Lam', bpm: 120, durationSecs: 20 }
    );

    // La menor natural: A B C D E F G. Do pertenece, así que no debe moverse.
    expect(res.eventos[0].nota).toBe('C4');
    expect(res.reparaciones.join( ' ')).not.toContain('tonalidad');
  });
});

describe('sanearIdeasMelodicas', () => {
  const idea = (eventos: unknown) => ({
    text: 'Aquí tienes una idea.',
    proposedActions: [
      {
        type: 'propose_melodic_idea',
        melodicIdea: { instrument: 'violin', keyName: 'Do', escala: 'mayor', bpm: 120, durationSecs: 20, eventos }
      }
    ]
  });

  it('repara en el sitio las notas de la propuesta y la deja pasar', () => {
    const res = sanearIdeasMelodicas(idea([
      { tiempo: 0, nota: 'C4', duracionBeats: 1 },
      { tiempo: 1, nota: 'H9', duracionBeats: 1 }
    ]));

    expect(res.proposedActions).toHaveLength(1);
    expect(res.proposedActions[0].melodicIdea.eventos).toHaveLength(1);
    expect(res.text).toBe('Aquí tienes una idea.');
  });

  it('retira la propuesta y lo explica cuando no sobrevive ninguna nota', () => {
    const res = sanearIdeasMelodicas(idea([
      { tiempo: 0, nota: 'H4', duracionBeats: 1 },
      { tiempo: 1, nota: 'ZZ', duracionBeats: 1 }
    ]));

    // Sin esto el chat mostraba un botón de "generar y escuchar" que solo daba silencio.
    expect(res.proposedActions).toHaveLength(0);
    expect(res.text).toContain('No he podido preparar');
  });

  it('no toca las propuestas de otros tipos', () => {
    const res = sanearIdeasMelodicas({
      text: 'ok',
      proposedActions: [
        { type: 'propose_rehearsal', rehearsal: { fecha: '2026-09-01' } },
        { type: 'propose_accompaniment', accompaniment: { bpm: 120 } }
      ]
    });

    expect(res.proposedActions).toHaveLength(2);
    expect(res.text).toBe('ok');
  });

  it('tolera respuestas sin acciones sin lanzar', () => {
    expect(sanearIdeasMelodicas({ text: 'hola' })).toEqual({ text: 'hola' });
    expect(sanearIdeasMelodicas(null)).toBeNull();
  });
});
