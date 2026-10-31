import { describe, expect, it } from 'vitest';
import { agendaDe } from '../agenda';
import type { AccionRegistrada } from '../tipos';
import type { ResultadoPieza } from '../resumen';

const HOY = '2026-10-28';
const base = { hoy: HOY, conciertos: [], lanzamiento: null, historial: [] as AccionRegistrada[], resultados: [] as ResultadoPieza[] };
const hecha = (fecha: string, tarjetaId: string): AccionRegistrada => ({ fecha, tarjetaId, formato: 'reel', accion: 'hecho', titulo: `Idea ${tarjetaId}` });

describe('agendaDe', () => {
  it('sin nada, solo sale hoy', () => {
    expect(agendaDe(base)).toEqual([{ fecha: HOY, esHoy: true, eventos: [] }]);
  });

  it('pone el bolo, sus hitos hacia delante y el estreno, por orden de día', () => {
    const dias = agendaDe({ ...base, conciertos: [{ id: 'c', fecha: '2026-11-04', sala: 'Sala Sol', ciudad: 'Madrid' }], lanzamiento: { titulo: 'Nuevo single', fecha: '2026-11-06' } });
    const fechas = dias.map((d) => d.fecha);
    expect([...fechas]).toEqual([...fechas].sort());
    const tipos = dias.flatMap((d) => d.eventos.map((e) => e.tipo));
    expect(tipos).toContain('bolo');
    expect(tipos).toContain('hito');
    expect(dias.find((d) => d.fecha === '2026-11-04')!.eventos).toContainEqual({ tipo: 'bolo', texto: 'Concierto en Sala Sol, Madrid' });
    expect(dias.find((d) => d.fecha === '2026-11-06')!.eventos).toContainEqual({ tipo: 'lanzamiento', texto: 'Sale «Nuevo single»' });
  });

  it('un bolo ya pasado sale como bolo pero sin hitos', () => {
    const dias = agendaDe({ ...base, conciertos: [{ id: 'c', fecha: '2026-10-25', sala: 'Sala', ciudad: '' }] });
    expect(dias.flatMap((d) => d.eventos.map((e) => e.tipo))).toEqual(['bolo']);
  });

  it('lo publicado trae su lectura, o «sin medir»; lo saltado no sale', () => {
    const dias = agendaDe({
      ...base,
      historial: [hecha('2026-10-22', 'a'), hecha('2026-10-24', 'b'), { ...hecha('2026-10-26', 's'), accion: 'saltado' }],
      resultados: [{ fecha: '2026-10-22', tarjetaId: 'a', formato: 'reel', titulo: 'Idea a', alcance: 1000, guardados: 60, alcanceNoSeguidores: 500 }],
    });
    const hechas = dias.flatMap((d) => d.eventos).filter((e) => e.tipo === 'hecha');
    expect(hechas).toEqual([
      { tipo: 'hecha', texto: 'Idea a', formato: 'reel', lectura: 'funciona' },
      { tipo: 'hecha', texto: 'Idea b', formato: 'reel', lectura: 'sin_medir' },
    ]);
  });

  it('deja fuera lo que cae fuera de la ventana de tres semanas', () => {
    const dias = agendaDe({ ...base, conciertos: [{ id: 'c', fecha: '2026-12-31', sala: 'Lejos', ciudad: '' }], historial: [hecha('2026-09-01', 'vieja')] });
    expect(dias).toEqual([{ fecha: HOY, esHoy: true, eventos: [] }]);
  });

  it('una pieza medida solo en TikTok o YouTube también se lee, comparada con lo habitual de esa red', () => {
    const rr = (fecha: string, tarjetaId: string, v: number) => ({ fecha, tarjetaId, red: 'tiktok' as const, formato: 'reel' as const, titulo: `Idea ${tarjetaId}`, metricas: { visualizaciones: v } });
    const dias = agendaDe({
      ...base,
      historial: [hecha('2026-10-22', 'a'), hecha('2026-10-23', 'b'), hecha('2026-10-24', 'c'), hecha('2026-10-26', 'd')],
      // Cada pieza se compara con la mediana de las demás de esa red: 1000 y 2000 quedan por debajo de lo habitual, 3000 y 6000 por encima.
      resultadosRed: [rr('2026-10-22', 'a', 1000), rr('2026-10-23', 'b', 2000), rr('2026-10-24', 'c', 3000), rr('2026-10-26', 'd', 6000)],
    });
    const lecturas = dias.flatMap((d) => d.eventos).filter((e) => e.tipo === 'hecha').map((e) => (e as { lectura: string }).lectura);
    expect(lecturas).toEqual(['por_debajo', 'por_debajo', 'por_encima', 'por_encima']);
  });

  it('si la pieza tiene números de Instagram, mandan esos y no los de otra red', () => {
    const dias = agendaDe({
      ...base,
      historial: [hecha('2026-10-24', 'a')],
      resultados: [{ fecha: '2026-10-24', tarjetaId: 'a', formato: 'reel', titulo: 'Idea a', alcance: 1000, guardados: 60, alcanceNoSeguidores: 500 }],
      resultadosRed: [{ fecha: '2026-10-24', tarjetaId: 'a', red: 'tiktok', formato: 'reel', titulo: 'Idea a', metricas: { visualizaciones: 9 } }],
    });
    expect(dias.flatMap((d) => d.eventos).find((e) => e.tipo === 'hecha')).toMatchObject({ lectura: 'funciona' });
  });
});

