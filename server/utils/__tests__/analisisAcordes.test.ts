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

  it('sin audio principal usa la primera idea con audio, como el visor', () => {
    const f = elegirFuenteAudio({ audioIdeas: [{ id: 'a', audioUrl: '' }, { id: 'b', audioUrl: 'https://x/idea.mp3' }] } as any);
    expect(f).toEqual({ url: 'https://x/idea.mp3', fuente: 'mezcla' });
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
    expect(cuerpo.indexOf('sobrescribir')).toBeLessThan(cuerpo.indexOf('analizarAcordesDeCancion('));
  });
});

import { elegirFuentesAudio } from '../analisisAcordes';
import { sumarPcm, detectarAcordesDesdePcm } from '../chordDetection';

describe('elegirFuentesAudio: de mejor a peor', () => {
  const idea = (pistas: any[]) => ({ id: 'i', titulo: 't', audioUrl: 'https://x/idea.mp3', subidoPor: 's', seccion: 'general', fecha: 'f', pistas });
  const pista = (nombre: string) => ({ id: nombre, nombre, audioUrl: `https://x/${nombre}.mp3` });

  it('instrumental > armonía > mezcla, y cada nivel es una alternativa', () => {
    const n = elegirFuentesAudio({
      audioPrincipalUrl: 'https://x/mezcla.mp3',
      audioIdeas: [idea([pista('Voz'), pista('Batería'), pista('Bajo'), pista('Guitarras'), pista('Instrumental')])],
    } as any);
    expect(n.map((x) => x.fuente)).toEqual(['instrumental', 'armonia', 'mezcla']);
    expect(n[1].urls.sort()).toEqual(['https://x/Bajo.mp3', 'https://x/Guitarras.mp3']);
  });

  it('sin instrumental usa los stems armónicos y nunca voz ni batería', () => {
    const n = elegirFuentesAudio({
      audioPrincipalUrl: 'https://x/mezcla.mp3',
      audioIdeas: [idea([pista('Voz'), pista('Batería'), pista('Teclados'), pista('Arreglos')])],
    } as any);
    expect(n.map((x) => x.fuente)).toEqual(['armonia', 'mezcla']);
    expect(n[0].urls.sort()).toEqual(['https://x/Arreglos.mp3', 'https://x/Teclados.mp3']);
  });

  it('solo voz y batería: no hay armonía que aislar, se usa la mezcla', () => {
    const n = elegirFuentesAudio({
      audioPrincipalUrl: 'https://x/mezcla.mp3',
      audioIdeas: [idea([pista('Voz'), pista('Batería')])],
    } as any);
    expect(n.map((x) => x.fuente)).toEqual(['mezcla']);
  });

  it('sin audio → ninguna fuente', () => {
    expect(elegirFuentesAudio({} as any)).toEqual([]);
    expect(elegirFuentesAudio(null)).toEqual([]);
  });
});

describe('sumarPcm', () => {
  it('suma muestra a muestra y rellena las pistas cortas con silencio', () => {
    const r = sumarPcm([Float32Array.from([1, 1, 1, 1]), Float32Array.from([0.5, 0.5])]);
    expect(Array.from(r)).toEqual([1.5, 1.5, 1, 1]);
  });
  it('una sola pista se devuelve tal cual; ninguna → vacío', () => {
    const a = Float32Array.from([1, 2]);
    expect(sumarPcm([a])).toBe(a);
    expect(sumarPcm([]).length).toBe(0);
  });
  it('sumar bajo y guitarra detecta el acorde (la suma de stems sirve al detector)', () => {
    const SR = 11025;
    const tono = (f: number, seg: number, amp: number) => {
      const o = new Float32Array(Math.round(seg * SR));
      for (let h = 1; h <= 3; h++) for (let i = 0; i < o.length; i++) o[i] += (amp / h) * Math.sin((2 * Math.PI * f * h * i) / SR);
      return o;
    };
    // Bajo (A2 = 110 Hz) + guitarra tocando A3, C#4, E4: acorde de La mayor
    const bajo = tono(110, 4, 0.5);
    const guitarra = sumarPcm([tono(220, 4, 0.3), tono(277.18, 4, 0.3), tono(329.63, 4, 0.3)]);
    const det = detectarAcordesDesdePcm(sumarPcm([bajo, guitarra]), SR);
    expect(det[0].acorde).toBe('A');
  });
});
