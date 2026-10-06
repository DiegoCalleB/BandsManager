import { describe, it, expect } from 'vitest';
import { normalizarTonalidad, elegirFuenteAudio, construirAnalisis, VERSION_ANALISIS_ACORDES } from '../analisisAcordes';

describe('normalizarTonalidad', () => {
  it.each([
    ['Am', 'Am'], ['C', 'C'], ['F#m', 'F#m'], ['Lam', 'Am'], ['Do', 'C'], ['Sol', 'G'],
    ['Mim', 'Em'], ['Do#', 'C#'], ['Sib', 'A#'], ['Re menor', 'Dm'], ['La mayor', 'A'], ['Eb', 'D#'],
  ])('%s → %s', (entrada, esperado) => {
    expect(normalizarTonalidad(entrada)).toBe(esperado);
  });

  it.each([[''], [null], [undefined], ['quizás Do'], ['H']])('rechaza %s', (entrada) => {
    expect(normalizarTonalidad(entrada as any)).toBeNull();
  });
});

describe('elegirFuenteAudio', () => {
  it('prefiere la pista Instrumental de Iris sobre la mezcla', () => {
    const f = elegirFuenteAudio({
      audioPrincipalUrl: 'https://x/mezcla.mp3',
      audioIdeas: [{ id: 'i', titulo: 't', audioUrl: 'u', subidoPor: 's', seccion: 'general', fecha: 'f',
        pistas: [{ id: 'a', nombre: 'Voz', audioUrl: 'https://x/voz.mp3' }, { id: 'b', nombre: 'Instrumental', audioUrl: 'https://x/inst.mp3' }] }],
    } as any);
    expect(f).toEqual({ url: 'https://x/inst.mp3', fuente: 'instrumental' });
  });

  it('usa la mezcla si no hay instrumental', () => {
    expect(elegirFuenteAudio({ audioPrincipalUrl: 'https://x/mezcla.mp3' } as any)).toEqual({ url: 'https://x/mezcla.mp3', fuente: 'mezcla' });
  });

  it('devuelve null sin audio', () => {
    expect(elegirFuenteAudio({} as any)).toBeNull();
    expect(elegirFuenteAudio(null)).toBeNull();
  });
});

describe('construirAnalisis', () => {
  it('guarda versión, fuente y solo los campos esperados de cada segmento', () => {
    const a = construirAnalisis({
      segmentos: [{ t0: 0, t1: 2, acorde: 'Am', confianza: 0.8, extra: 'x' } as any],
      fuente: 'mezcla', tonalidad: 'Am', duracionSegundos: 30.04,
    });
    expect(a.version).toBe(VERSION_ANALISIS_ACORDES);
    expect(a.duracionSegundos).toBe(30);
    expect(a.segmentos[0]).toEqual({ t0: 0, t1: 2, acorde: 'Am', confianza: 0.8 });
    expect(new Date(a.analizadoEn).getTime()).toBeGreaterThan(0);
  });
});

import fs from 'fs';
import path from 'path';

describe('Rutas de acordes: garantías', () => {
  const rutas = fs.readFileSync(path.join(__dirname, '..', '..', 'routes', 'repertorio.ts'), 'utf-8');

  it('la corrección manual valida los tramos antes de guardar y no acepta una canción sin análisis', () => {
    const i = rutas.indexOf('router.patch("/songs/:id/acordes"');
    expect(i).toBeGreaterThan(-1);
    const cuerpo = rutas.slice(i, rutas.indexOf('router.patch("/songs/:id/energia"'));
    expect(cuerpo.indexOf('validarSegmentos')).toBeLessThan(cuerpo.indexOf('dbGuardarAnalisisAcordes'));
    expect(cuerpo).toContain('409');
  });

  it('reanalizar no pisa correcciones manuales sin confirmación explícita', () => {
    const i = rutas.indexOf('router.post("/songs/:id/analizar-acordes"');
    const cuerpo = rutas.slice(i, rutas.indexOf('router.patch("/songs/:id/acordes"'));
    expect(cuerpo).toContain('req.body?.sobrescribir !== true');
    expect(cuerpo.indexOf('sobrescribir')).toBeLessThan(cuerpo.indexOf('extraerPcmMono('));
  });
});
