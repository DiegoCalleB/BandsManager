import { describe, it, expect } from 'vitest';
import {
  parseCambiosDePlano,
  detectarCambiosDePlano,
  detectarTipoContenido,
  esTipoContenido,
  ventanasMasVirales,
  resumirSenalesParaPrompt,
  describirVentana,
} from '../viralSignals';
import type { PuntoEnergia } from '../audioEnergy';

/** Curva de 60 s: floja salvo un subidón claro entre el 30 y el 45. */
function curvaConSubidon(): PuntoEnergia[] {
  const c: PuntoEnergia[] = [];
  for (let t = 0; t < 60; t++) c.push({ t, db: t >= 30 && t < 45 ? -10 : -45 });
  return c;
}

describe('parseCambiosDePlano', () => {
  it('lee los tiempos que marca scdet', () => {
    const salida = `frame:125  pts:64000   pts_time:5
lavfi.scd.time=5
frame:250  pts:128000  pts_time:10
lavfi.scd.time=10.5
`;
    expect(parseCambiosDePlano(salida)).toEqual([5, 10.5]);
  });

  it('los devuelve ordenados', () => {
    expect(parseCambiosDePlano('lavfi.scd.time=30\nlavfi.scd.time=5\n')).toEqual([5, 30]);
  });

  it('ignora las líneas de fotograma que no marcan cambio', () => {
    // scdet imprime scd.score en TODOS los fotogramas; solo scd.time marca un corte real.
    const salida = 'pts_time:0\nlavfi.scd.score=0.000\nlavfi.scd.mafd=0.000\n';
    expect(parseCambiosDePlano(salida)).toEqual([]);
  });

  it('aguanta entradas vacías', () => {
    expect(parseCambiosDePlano('')).toEqual([]);
    expect(parseCambiosDePlano(null)).toEqual([]);
    expect(parseCambiosDePlano(undefined)).toEqual([]);
  });
});

describe('detectarCambiosDePlano', () => {
  it('un fichero inexistente devuelve [] en vez de lanzar', async () => {
    // Sin señal visual la puntuación tiene que seguir funcionando solo con el audio.
    await expect(detectarCambiosDePlano('/no/existe.mp4', { timeoutMs: 5000 })).resolves.toEqual([]);
  }, 20_000);

  it('sin fuente no llama a ffmpeg', async () => {
    await expect(detectarCambiosDePlano('')).resolves.toEqual([]);
  });
});

describe('detectarTipoContenido', () => {
  it('reconoce conciertos', () => {
    expect(detectarTipoContenido('Banda Ejemplo - Directo en Sala X')).toBe('concierto');
    expect(detectarTipoContenido('Live at the festival 2026')).toBe('concierto');
    expect(detectarTipoContenido('Bolo en Sevilla')).toBe('concierto');
  });

  it('reconoce videoclips', () => {
    expect(detectarTipoContenido('MI TEMA (Videoclip Oficial)')).toBe('videoclip');
    expect(detectarTipoContenido('Official Video')).toBe('videoclip');
  });

  it('un videoclip grabado en directo sigue siendo videoclip', () => {
    // El orden de comprobación importa: "directo" aparece, pero manda "videoclip".
    expect(detectarTipoContenido('Videoclip grabado en directo')).toBe('videoclip');
  });

  it('reconoce ensayos', () => {
    expect(detectarTipoContenido('Ensayo en el local')).toBe('ensayo');
    expect(detectarTipoContenido('Rehearsal session')).toBe('ensayo');
  });

  it('cae a "otro" cuando no hay pistas', () => {
    expect(detectarTipoContenido('')).toBe('otro');
    expect(detectarTipoContenido(undefined, undefined)).toBe('otro');
    expect(detectarTipoContenido('Un título cualquiera')).toBe('otro');
  });

  it('también mira la descripción', () => {
    expect(detectarTipoContenido('Tema nuevo', 'Grabado en el concierto de fin de gira')).toBe('concierto');
  });
});

describe('esTipoContenido', () => {
  it('valida lo que llega del cliente', () => {
    expect(esTipoContenido('concierto')).toBe(true);
    expect(esTipoContenido('videoclip')).toBe(true);
    expect(esTipoContenido('cualquier-cosa')).toBe(false);
    expect(esTipoContenido(null)).toBe(false);
    expect(esTipoContenido(42)).toBe(false);
  });
});

describe('ventanasMasVirales', () => {
  it('prefiere el tramo que ARRANCA subiendo, no el que ya venía alto', () => {
    // Es la diferencia clave con puntuar solo por volumen: en un Reel los dos primeros
    // segundos deciden, así que empezar justo en el subidón vale más que estar ya dentro.
    const vs = ventanasMasVirales(curvaConSubidon(), { duracion: 10, tipo: 'concierto' });
    const mejor = [...vs].sort((a, b) => b.score - a.score)[0];
    expect(mejor.start).toBe(30);
    expect(mejor.arranque).toBe(100);
  });

  it('el desglose de señales acompaña a cada ventana', () => {
    const [v] = ventanasMasVirales(curvaConSubidon(), { duracion: 10, tipo: 'concierto' });
    for (const campo of ['energia', 'arranque', 'dinamismo', 'score'] as const) {
      expect(v[campo]).toBeGreaterThanOrEqual(0);
      expect(v[campo]).toBeLessThanOrEqual(100);
    }
    expect(typeof v.motivo).toBe('string');
    expect(v.motivo.length).toBeGreaterThan(0);
  });

  it('el tipo de contenido cambia la puntuación', () => {
    const cortes = [5, 10, 15];
    const opciones = { duracion: 10, cambiosDePlano: cortes };
    const mejorDe = (tipo: any) =>
      [...ventanasMasVirales(curvaConSubidon(), { ...opciones, tipo })].sort((a, b) => b.score - a.score)[0];

    // En un ensayo el montaje no dice nada, así que el tramo potente puntúa más alto que en
    // un videoclip, donde el peso se reparte con el ritmo visual.
    expect(mejorDe('ensayo').score).toBeGreaterThan(mejorDe('videoclip').score);
  });

  it('sin cambios de plano el dinamismo queda neutro, no a cero', () => {
    // Penalizar a todos los tramos por igual por una cámara fija sería ruido puro.
    const [v] = ventanasMasVirales(curvaConSubidon(), { duracion: 10, cambiosDePlano: [] });
    expect(v.dinamismo).toBe(50);
  });

  it('cuenta los cambios de plano dentro de cada ventana', () => {
    const curva: PuntoEnergia[] = [];
    for (let t = 0; t < 40; t++) curva.push({ t, db: -30 });
    // Todos los cortes concentrados al principio.
    const vs = ventanasMasVirales(curva, { duracion: 10, cambiosDePlano: [1, 2, 3, 4, 5], maxVentanas: 4 });
    const primera = vs.find((v) => v.start === 0);
    const tardia = vs.find((v) => v.start >= 20);
    expect(primera!.dinamismo).toBeGreaterThan(tardia!.dinamismo);
  });

  it('no devuelve ventanas solapadas y respeta la duración', () => {
    const vs = ventanasMasVirales(curvaConSubidon(), { duracion: 10, maxVentanas: 4 });
    for (const v of vs) expect(v.end - v.start).toBe(10);
    for (let i = 1; i < vs.length; i++) {
      expect(vs[i].start).toBeGreaterThanOrEqual(vs[i - 1].end);
    }
  });

  it('las devuelve en orden cronológico', () => {
    const inicios = ventanasMasVirales(curvaConSubidon(), { duracion: 5, maxVentanas: 5 }).map((v) => v.start);
    expect(inicios).toEqual([...inicios].sort((a, b) => a - b));
  });

  it('devuelve vacío si el vídeo es más corto que la ventana', () => {
    expect(ventanasMasVirales(curvaConSubidon(), { duracion: 300 })).toEqual([]);
  });

  it('aguanta curvas vacías o basura', () => {
    expect(ventanasMasVirales([], { duracion: 10 })).toEqual([]);
    expect(ventanasMasVirales(null as any, { duracion: 10 })).toEqual([]);
    expect(ventanasMasVirales([{ t: 0, db: -20 }], { duracion: 10 })).toEqual([]);
  });

  it('con volumen totalmente plano no inventa un ganador', () => {
    const plana: PuntoEnergia[] = [];
    for (let t = 0; t < 40; t++) plana.push({ t, db: -20 });
    for (const v of ventanasMasVirales(plana, { duracion: 10 })) {
      expect(v.energia).toBe(50);
    }
  });
});

describe('describirVentana', () => {
  it('explica un buen gancho', () => {
    const texto = describirVentana(
      { start: 0, end: 30, energia: 90, arranque: 85, dinamismo: 80, score: 88, motivo: '' },
      true
    );
    expect(texto).toContain('arranca subiendo');
    expect(texto).toContain('montaje muy movido');
  });

  it('omite lo visual cuando no hay señal de imagen', () => {
    const texto = describirVentana(
      { start: 0, end: 30, energia: 90, arranque: 85, dinamismo: 50, score: 80, motivo: '' },
      false
    );
    expect(texto).not.toContain('plano');
    expect(texto).not.toContain('montaje');
  });

  it('siempre dice algo, aunque el tramo sea del montón', () => {
    const texto = describirVentana(
      { start: 0, end: 30, energia: 50, arranque: 50, dinamismo: 50, score: 50, motivo: '' },
      false
    );
    expect(texto.length).toBeGreaterThan(0);
  });
});

describe('resumirSenalesParaPrompt', () => {
  it('escribe los tramos con su desglose y la nota del tipo', () => {
    const vs = ventanasMasVirales(curvaConSubidon(), { duracion: 10, tipo: 'concierto' });
    const texto = resumirSenalesParaPrompt(vs, 'concierto');
    expect(texto).toContain('SEÑALES MEDIDAS');
    expect(texto).toContain('potencial');
    expect(texto).toContain('CONCIERTO');
    expect(texto).toMatch(/0:3\d-0:[45]\d/);
  });

  it('la nota cambia con el tipo de contenido', () => {
    const vs = ventanasMasVirales(curvaConSubidon(), { duracion: 10, tipo: 'videoclip' });
    expect(resumirSenalesParaPrompt(vs, 'videoclip')).toContain('estribillo');
  });

  it('sin ventanas no mete ruido en el prompt', () => {
    expect(resumirSenalesParaPrompt([], 'concierto')).toBe('');
  });
});
