import { describe, expect, it } from 'vitest';
import { diagnosticar } from '../diagnostico';
import { ESTRATEGIA_INICIAL } from '../estrategia';
import { buscarTarjeta, opcionesDeHoy } from '../opciones';
import { detectarCaida, FORMATO_OPUESTO } from '../rescate';
import type { ResultadoPieza } from '../resumen';

const HOY = '2026-10-28';
const res = (fecha: string, tarjetaId: string, formato: ResultadoPieza['formato'], alcance: number, guardados: number, noSeg: number | null = 400): ResultadoPieza =>
  ({ fecha, tarjetaId, formato, titulo: `Idea ${tarjetaId}`, alcance, guardados, alcanceNoSeguidores: noSeg });

// Una pieza por semana, cada vez con menos alcance: 3000 → 2000 → 1000.
const BAJANDO = [res('2026-10-09', 'a', 'reel', 3000, 90), res('2026-10-17', 'b', 'reel', 2000, 40), res('2026-10-25', 'c', 'reel', 1000, 10)];

describe('detectarCaida', () => {
  it('tres semanas seguidas bajando y la última muy por debajo de la primera', () => {
    expect(detectarCaida(BAJANDO, HOY)).toMatchObject({ motivo: 'tres_semanas', formatoFlojo: 'reel', mejor: { titulo: 'Idea a', formato: 'reel' } });
  });

  it('una bajada pequeña, o que sube a mitad, es ruido y no rescata', () => {
    expect(detectarCaida([res('2026-10-09', 'a', 'reel', 1000, 40), res('2026-10-17', 'b', 'reel', 900, 40), res('2026-10-25', 'c', 'reel', 800, 40)], HOY)).toBeNull();
    expect(detectarCaida([res('2026-10-09', 'a', 'reel', 3000, 90), res('2026-10-17', 'b', 'reel', 1000, 40), res('2026-10-25', 'c', 'reel', 2000, 40)], HOY)).toBeNull();
  });

  it('sin datos de las tres semanas no inventa una caída', () => {
    expect(detectarCaida([], HOY)).toBeNull();
    expect(detectarCaida(BAJANDO.slice(1), HOY)).toBeNull();
    expect(detectarCaida(BAJANDO.map((r) => ({ ...r, alcance: 50 })), HOY)).toBeNull();
  });

  it('las tres últimas piezas sin arrancar también cuentan, aunque sea en poco tiempo', () => {
    const malas = [res('2026-10-24', 'a', 'carrusel', 1000, 1, 10), res('2026-10-25', 'b', 'carrusel', 1000, 2, 20), res('2026-10-26', 'c', 'reel', 1000, 1, 10)];
    expect(detectarCaida(malas, HOY)).toMatchObject({ motivo: 'tres_seguidas', formatoFlojo: 'carrusel', mejor: { titulo: 'Idea b' } });
    expect(detectarCaida([...malas.slice(0, 2), res('2026-10-26', 'c', 'reel', 1000, 60, 600)], HOY)).toBeNull();
  });
});

describe('modo rescate', () => {
  const e = { ...ESTRATEGIA_INICIAL, horasSemana: 3 as const };
  const entrada = { hoy: HOY, conciertos: [], lanzamiento: null, ultimaPublicacion: '2026-10-26', rescate: detectarCaida(BAJANDO, HOY) };

  it('llega después de un bolo o un estreno, y antes de «volver a publicar»', () => {
    expect(diagnosticar(entrada).modo).toBe('rescate');
    expect(diagnosticar({ ...entrada, ultimaPublicacion: '2026-10-01' }).modo).toBe('rescate');
    expect(diagnosticar({ ...entrada, conciertos: [{ id: 'c', fecha: '2026-11-02', sala: 'Sala', ciudad: '' }] }).modo).toBe('concierto');
    expect(diagnosticar({ ...entrada, lanzamiento: { titulo: 'X', fecha: '2026-11-10' } }).modo).toBe('lanzamiento');
    expect(diagnosticar({ ...entrada, rescate: null }).modo).toBe('fondo');
  });

  it('propone probar lo opuesto, repetir lo que más se guardó y preguntar', () => {
    const d = diagnosticar(entrada);
    expect(d.porque).toContain('tres semanas');
    const { recomendadas, alternativas } = opcionesDeHoy(d, e, HOY);
    const todas = [...recomendadas, ...alternativas];
    expect(todas.map((t) => t.id)).toEqual(expect.arrayContaining(['rescate-opuesto', 'rescate-mejor', 'rescate-pregunta']));
    expect(todas.find((t) => t.id === 'rescate-opuesto')!.formato).toBe(FORMATO_OPUESTO.reel);
    expect(todas.find((t) => t.id === 'rescate-mejor')).toMatchObject({ formato: 'reel', titulo: '«Idea a»'.replace(/^/, 'Repetid ') });
    expect(recomendadas[0].id).toBe('rescate-opuesto');
  });

  it('sin una pieza que repetir, no se la inventa; y el servidor puede validar cada id', () => {
    const d = diagnosticar({ ...entrada, rescate: { motivo: 'tres_seguidas', formatoFlojo: null, mejor: null } });
    const ids = Object.values(opcionesDeHoy(d, e, HOY)).flat().map((t) => t.id);
    expect(ids).not.toContain('rescate-mejor');
    expect(buscarTarjeta(d, e, HOY, 'rescate-opuesto')).toMatchObject({ formato: 'carrusel' });
    expect(buscarTarjeta(d, e, HOY, 'rescate-mejor')).toBeNull();
  });
});
