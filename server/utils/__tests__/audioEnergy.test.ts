import { describe, it, expect } from 'vitest';
import {
  parseRmsCurve,
  ventanasConMasEnergia,
  resumirEnergiaParaPrompt,
  analizarEnergiaAudio,
  medirVariacionInterna,
  DB_SILENCIO,
  type PuntoEnergia,
} from '../audioEnergy';

/** Salida real de `ametadata=print`, tal cual la escupe ffmpeg. */
const SALIDA_FFMPEG = `frame:0    pts:0       pts_time:0
lavfi.astats.Overall.RMS_level=-47.118214
frame:1    pts:8000    pts_time:1
lavfi.astats.Overall.RMS_level=-31.605195
frame:2    pts:16000   pts_time:2
lavfi.astats.Overall.RMS_level=-21.093191
`;

describe('parseRmsCurve', () => {
  it('lee los pares pts_time / RMS_level de ffmpeg', () => {
    expect(parseRmsCurve(SALIDA_FFMPEG)).toEqual([
      { t: 0, db: -47.118214 },
      { t: 1, db: -31.605195 },
      { t: 2, db: -21.093191 },
    ]);
  });

  it('convierte el -inf del silencio en un suelo, no en -Infinity', () => {
    // ffmpeg imprime literalmente `-inf` en el silencio absoluto; sin esto, cualquier
    // media posterior daría -Infinity o NaN y se llevaría por delante la detección.
    const curva = parseRmsCurve('pts_time:0\nlavfi.astats.Overall.RMS_level=-inf\n');
    expect(curva).toEqual([{ t: 0, db: DB_SILENCIO }]);
    expect(Number.isFinite(curva[0].db)).toBe(true);
  });

  it('trata nan igual que el silencio', () => {
    expect(parseRmsCurve('pts_time:5\nlavfi.astats.Overall.RMS_level=nan\n')).toEqual([
      { t: 5, db: DB_SILENCIO },
    ]);
  });

  it('ignora una medición sin su marca de tiempo', () => {
    expect(parseRmsCurve('lavfi.astats.Overall.RMS_level=-20\n')).toEqual([]);
  });

  it('devuelve vacío ante entradas vacías', () => {
    expect(parseRmsCurve('')).toEqual([]);
    expect(parseRmsCurve(null)).toEqual([]);
    expect(parseRmsCurve(undefined)).toEqual([]);
  });
});

describe('ventanasConMasEnergia', () => {
  /** 60 s: flojo salvo un subidón claro entre el 30 y el 45. */
  const curva: PuntoEnergia[] = [];
  for (let t = 0; t < 60; t++) curva.push({ t, db: t >= 30 && t < 45 ? -10 : -45 });

  it('encuentra el tramo donde de verdad suena la banda', () => {
    const [mejor] = ventanasConMasEnergia(curva, { duracion: 10, maxVentanas: 3 })
      .slice()
      .sort((a, b) => b.score - a.score);
    expect(mejor.start).toBeGreaterThanOrEqual(30);
    expect(mejor.end).toBeLessThanOrEqual(45);
    expect(mejor.score).toBe(100);
  });

  it('respeta la duración pedida', () => {
    for (const v of ventanasConMasEnergia(curva, { duracion: 15 })) {
      expect(v.end - v.start).toBe(15);
    }
  });

  it('no devuelve ventanas solapadas', () => {
    const vs = ventanasConMasEnergia(curva, { duracion: 10, maxVentanas: 4 });
    for (let i = 1; i < vs.length; i++) {
      expect(vs[i].start).toBeGreaterThanOrEqual(vs[i - 1].end);
    }
  });

  it('las devuelve en orden cronológico', () => {
    const vs = ventanasConMasEnergia(curva, { duracion: 5, maxVentanas: 4 });
    const inicios = vs.map((v) => v.start);
    expect(inicios).toEqual([...inicios].sort((a, b) => a - b));
  });

  it('con volumen plano no inventa un ganador: todo al 50', () => {
    const plana: PuntoEnergia[] = [];
    for (let t = 0; t < 40; t++) plana.push({ t, db: -20 });
    for (const v of ventanasConMasEnergia(plana, { duracion: 10 })) {
      expect(v.score).toBe(50);
    }
  });

  it('devuelve vacío si el vídeo es más corto que la ventana pedida', () => {
    expect(ventanasConMasEnergia(curva, { duracion: 120 })).toEqual([]);
  });

  it('aguanta una curva vacía o basura', () => {
    expect(ventanasConMasEnergia([], { duracion: 10 })).toEqual([]);
    expect(ventanasConMasEnergia(null as any, { duracion: 10 })).toEqual([]);
    expect(ventanasConMasEnergia([{ t: 0, db: -20 }], { duracion: 10 })).toEqual([]);
  });

  it('no se descoloca si la curva llega desordenada', () => {
    const desordenada = [...curva].reverse();
    const [mejor] = ventanasConMasEnergia(desordenada, { duracion: 10 })
      .slice()
      .sort((a, b) => b.score - a.score);
    expect(mejor.start).toBeGreaterThanOrEqual(30);
  });
});

describe('resumirEnergiaParaPrompt', () => {
  it('escribe los tramos en mm:ss con su puntuación', () => {
    const texto = resumirEnergiaParaPrompt([
      { start: 95, end: 125, db: -12, score: 100 },
      { start: 200, end: 230, db: -30, score: 40 },
    ]);
    expect(texto).toContain('1:35-2:05 (energía 100/100)');
    expect(texto).toContain('3:20-3:50 (energía 40/100)');
    expect(texto).toContain('volumen medido');
  });

  it('sin tramos no mete ruido en el prompt', () => {
    expect(resumirEnergiaParaPrompt([])).toBe('');
  });
});

describe('medirVariacionInterna', () => {
  it('un tema plano (mismo volumen todo el rato) no tiene variación interna', () => {
    const plana: PuntoEnergia[] = Array.from({ length: 30 }, (_, t) => ({ t, db: -20 }));
    expect(medirVariacionInterna(plana)).toBe(0);
  });

  it('un tema con contraste real (baladea y luego explota) da variación alta', () => {
    const contraste: PuntoEnergia[] = [];
    for (let t = 0; t < 60; t++) contraste.push({ t, db: t % 20 < 10 ? -45 : -10 });
    expect(medirVariacionInterna(contraste)).toBeGreaterThanOrEqual(6);
  });

  it('nunca pasa de 10 ni de 0, por muy extrema que sea la curva', () => {
    const extrema: PuntoEnergia[] = Array.from({ length: 40 }, (_, t) => ({ t, db: t % 2 === 0 ? DB_SILENCIO : 0 }));
    const v = medirVariacionInterna(extrema);
    expect(v).toBeLessThanOrEqual(10);
    expect(v).toBeGreaterThanOrEqual(0);
  });

  it('sin curva medible (audio no analizable) devuelve 0', () => {
    expect(medirVariacionInterna([])).toBe(0);
    expect(medirVariacionInterna(null as any)).toBe(0);
    expect(medirVariacionInterna([{ t: 0, db: -20 }])).toBe(0);
  });
});

describe('analizarEnergiaAudio', () => {
  it('un fichero inexistente devuelve curva vacía en vez de lanzar', async () => {
    // El análisis de highlights tiene que seguir aunque no se pueda medir el audio.
    await expect(analizarEnergiaAudio('/no/existe/audio.mp3', { timeoutMs: 15_000 })).resolves.toEqual([]);
  });

  it('sin fuente no llama a ffmpeg', async () => {
    await expect(analizarEnergiaAudio('')).resolves.toEqual([]);
  });
});
