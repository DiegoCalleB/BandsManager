import { describe, expect, it } from 'vitest';
import { diagnosticar } from '../diagnostico';
import { ESTRATEGIA_INICIAL } from '../estrategia';
import { opcionesDeHoy } from '../opciones';
import { impulsoPorFormato, porMedir, resumenDe, sanearMedidas, tituloDe, type ResultadoPieza } from '../resumen';
import type { AccionRegistrada } from '../tipos';

const HOY = '2026-10-28';
const hecha = (fecha: string, tarjetaId: string, extra: Partial<AccionRegistrada> = {}): AccionRegistrada => ({ fecha, tarjetaId, formato: 'reel', accion: 'hecho', titulo: `Idea ${tarjetaId}`, ...extra });
const res = (fecha: string, tarjetaId: string, formato: ResultadoPieza['formato'], alcance: number, guardados: number, alcanceNoSeguidores: number | null = null): ResultadoPieza =>
  ({ fecha, tarjetaId, formato, titulo: `Idea ${tarjetaId}`, alcance, guardados, alcanceNoSeguidores });

describe('porMedir', () => {
  it('pide los números de lo hecho hace 2 a 14 días que aún no los tiene, lo más reciente primero', () => {
    const acciones = [
      hecha('2026-10-28', 'hoy'), hecha('2026-10-27', 'ayer'), // demasiado pronto
      hecha('2026-10-26', 'a'), hecha('2026-10-20', 'b'), hecha('2026-10-10', 'vieja'), // la última, demasiado tarde
      hecha('2026-10-24', 'ya-medida'), hecha('2026-10-25', 's', { accion: 'saltado' }),
    ];
    const lista = porMedir(acciones, [{ fecha: '2026-10-24', tarjetaId: 'ya-medida' }], HOY);
    expect(lista.map((p) => p.tarjetaId)).toEqual(['a', 'b']);
  });

  it('como mucho 3, y no confunde la misma idea de otro día', () => {
    const acciones = ['a', 'b', 'c', 'd'].map((id, i) => hecha(`2026-10-${20 + i}`, id));
    expect(porMedir(acciones, [], HOY)).toHaveLength(3);
    expect(porMedir([hecha('2026-10-20', 'x')], [{ fecha: '2026-10-21', tarjetaId: 'x' }], HOY)).toHaveLength(1);
  });

  it('una acción antigua sin título se nombra por su formato y su día', () => {
    expect(tituloDe({ formato: 'carrusel', fecha: '2026-10-20' })).toBe('Carrusel del martes, 20 de octubre');
    expect(porMedir([hecha('2026-10-20', 'x', { titulo: '' })], [], HOY)[0].titulo).toContain('Reel del');
  });
});

describe('sanearMedidas', () => {
  it('acepta números enteros, también escritos como texto, y «no seguidores» es opcional', () => {
    expect(sanearMedidas({ alcance: 1200, guardados: '40' })).toEqual({ alcance: 1200, guardados: 40, alcanceNoSeguidores: null });
    expect(sanearMedidas({ alcance: 1200, guardados: 0, alcanceNoSeguidores: '' })).toEqual({ alcance: 1200, guardados: 0, alcanceNoSeguidores: null });
    expect(sanearMedidas({ alcance: 1200, guardados: 10, alcanceNoSeguidores: 500 })).toMatchObject({ alcanceNoSeguidores: 500 });
  });

  it('explica con una frase lo que no vale', () => {
    for (const malo of [
      { alcance: 0, guardados: 0 }, { alcance: -5, guardados: 0 }, { alcance: 1.5, guardados: 0 }, { alcance: 'mucho', guardados: 0 }, { alcance: null, guardados: 0 },
      { alcance: 100, guardados: -1 }, { alcance: 100, guardados: undefined }, { alcance: 100, guardados: 101 },
      { alcance: 100, guardados: 1, alcanceNoSeguidores: 101 }, { alcance: 100, guardados: 1, alcanceNoSeguidores: 'x' }, { alcance: 2e9, guardados: 0 },
    ]) {
      expect(typeof sanearMedidas(malo)).toBe('string');
    }
  });
});

describe('resumenDe', () => {
  it('sin al menos dos piezas con alcance suficiente no concluye nada', () => {
    expect(resumenDe([], HOY)).toBeNull();
    expect(resumenDe([res('2026-10-25', 'a', 'reel', 1000, 40)], HOY)).toBeNull();
    expect(resumenDe([res('2026-10-25', 'a', 'reel', 50, 5), res('2026-10-25', 'b', 'reel', 60, 6)], HOY)).toBeNull();
    expect(resumenDe([res('2026-09-01', 'a', 'reel', 1000, 40), res('2026-09-02', 'b', 'reel', 1000, 40)], HOY)).toBeNull();
  });

  it('ordena por guardados, saca los mejores y los peores con su lectura', () => {
    const r = resumenDe([
      res('2026-10-20', 'a', 'reel', 1000, 10), res('2026-10-21', 'b', 'carrusel', 1000, 80), res('2026-10-22', 'c', 'reel', 1000, 40), res('2026-10-23', 'd', 'stories', 1000, 2),
    ], HOY)!;
    expect(r.piezas).toBe(4);
    expect(r.mejores.map((i) => i.tarjetaId)).toEqual(['b', 'c']);
    expect(r.peores.map((i) => i.tarjetaId)).toEqual(['d', 'a']);
    expect(r.mejores[0].veredicto).toBe('funciona');
    expect(r.peores[0].veredicto).toBe('falla_valor');
    expect(r.peores[0].mensaje).toContain('casi nadie la guarda');
  });

  it('solo declara un formato ganador si hay con qué compararlo', () => {
    const solo = resumenDe([res('2026-10-20', 'a', 'reel', 1000, 40), res('2026-10-21', 'b', 'reel', 1000, 50)], HOY)!;
    expect(solo.formatoGanador).toBeNull();
    expect(solo.mensaje).toContain('Lo que mejor ha ido');

    const varios = resumenDe([
      res('2026-10-20', 'a', 'reel', 1000, 10), res('2026-10-21', 'b', 'reel', 1000, 20), res('2026-10-22', 'c', 'carrusel', 1000, 60), res('2026-10-23', 'd', 'carrusel', 1000, 70),
    ], HOY)!;
    expect(varios.formatoGanador).toMatchObject({ formato: 'carrusel', piezas: 2 });
    expect(varios.formatoGanador!.tasa).toBeCloseTo(0.065);
    expect(varios.mensaje).toBe('Los carruseles son lo que más os guardan: 6,5 % de quienes los ven.');
  });

  it('un formato con una sola pieza no gana por casualidad', () => {
    const r = resumenDe([res('2026-10-20', 'a', 'reel', 1000, 10), res('2026-10-21', 'b', 'reel', 1000, 20), res('2026-10-22', 'c', 'stories', 1000, 90)], HOY)!;
    expect(r.formatoGanador).toMatchObject({ formato: 'reel' });
  });
});

describe('impulsoPorFormato', () => {
  it('suma lo que funcionó y resta lo que ni llegó ni se guardó, entre -2 y +2', () => {
    const impulso = impulsoPorFormato([
      res('2026-10-20', 'a', 'carrusel', 1000, 60, 500), res('2026-10-21', 'b', 'carrusel', 1000, 50, 400), res('2026-10-22', 'c', 'carrusel', 1000, 40, 400),
      res('2026-10-23', 'd', 'reel', 1000, 1, 10), res('2026-10-23', 'e', 'stories', 1000, 5, 500), // valor: no mueve nada
      res('2026-08-01', 'f', 'post', 1000, 80, 500), // fuera del último mes
    ], HOY);
    expect(impulso).toEqual({ carrusel: 2, reel: -1 });
  });
});

describe('opcionesDeHoy aprende de lo medido', () => {
  const d = diagnosticar({ hoy: HOY, conciertos: [], lanzamiento: null, ultimaPublicacion: null });
  const e = { ...ESTRATEGIA_INICIAL, horasSemana: 1 as const };

  it('sube el formato que funciona y baja el que no', () => {
    expect(opcionesDeHoy(d, e, HOY).recomendadas[0].formato).toBe('reel');
    const bueno = [res('2026-10-20', 'a', 'carrusel', 1000, 60, 500), res('2026-10-21', 'b', 'carrusel', 1000, 50, 500), res('2026-10-22', 'c', 'carrusel', 1000, 50, 500)];
    expect(opcionesDeHoy(d, e, HOY, [], bueno).recomendadas[0].formato).toBe('carrusel');
    const malo = [res('2026-10-20', 'a', 'reel', 1000, 1, 10), res('2026-10-21', 'b', 'reel', 1000, 1, 10)];
    expect(opcionesDeHoy(d, e, HOY, [], malo).recomendadas[0].formato).not.toBe('reel');
  });

  it('pero los hitos de un bolo no se mueven por mucho que digan los números', () => {
    const conBolo = diagnosticar({ hoy: HOY, conciertos: [{ id: 'b1', fecha: '2026-11-04', sala: 'Sala', ciudad: 'Madrid' }], lanzamiento: null, ultimaPublicacion: null });
    const malo = [res('2026-10-20', 'a', 'post', 1000, 1, 10), res('2026-10-21', 'b', 'post', 1000, 1, 10)];
    expect(opcionesDeHoy(conBolo, e, HOY, [], malo).recomendadas[0].id).toBe('hito-recordatorio');
  });
});
