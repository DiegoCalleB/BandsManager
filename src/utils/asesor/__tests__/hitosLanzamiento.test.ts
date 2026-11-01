import { describe, expect, it } from 'vitest';
import { agendaDe } from '../agenda';
import { DEFINICION, hitosLanzamiento, proximoHito } from '../hitosLanzamiento';

const FECHA = '2026-11-20'; // el estreno

describe('hitosLanzamiento', () => {
  it('cuenta hacia atrás desde la fecha de salida, en orden cronológico, con el seguimiento después', () => {
    const h = hitosLanzamiento(FECHA, '2026-10-01');
    expect(h.map((x) => [x.id, x.fecha])).toEqual([
      ['distribuidor', '2026-10-23'], ['pitch', '2026-10-30'], ['presave', '2026-10-30'], ['teaser', '2026-11-06'],
      ['prensa', '2026-11-10'], ['cuenta_atras', '2026-11-17'], ['estreno', '2026-11-20'], ['seguimiento', '2026-11-27'],
    ]);
    const fechas = h.map((x) => x.fecha);
    expect([...fechas].sort()).toEqual(fechas);
    expect(DEFINICION.map((d) => d.id)).toEqual(h.map((x) => x.id));
  });

  it('marca cada hito como pasado, de hoy o próximo', () => {
    const h = hitosLanzamiento(FECHA, '2026-10-30');
    expect(h.find((x) => x.id === 'distribuidor')!.estado).toBe('pasado');
    expect(h.find((x) => x.id === 'pitch')!.estado).toBe('hoy');
    expect(h.find((x) => x.id === 'teaser')!.estado).toBe('proximo');
  });

  it('el pitch a Spotify deja siempre al menos 7 días de margen', () => {
    const pitch = hitosLanzamiento(FECHA, '2026-10-01').find((x) => x.id === 'pitch')!;
    expect(pitch.diasAntes).toBeGreaterThanOrEqual(7);
    expect(pitch.objetivo).toContain('al menos 7 días');
  });

  it('lo siguiente que toca: el de hoy, o el primero que queda; null si ya pasó todo', () => {
    expect(proximoHito(FECHA, '2026-10-30')!.id).toBe('pitch');
    expect(proximoHito(FECHA, '2026-11-01')!.id).toBe('teaser');
    expect(proximoHito(FECHA, '2026-12-30')).toBeNull();
  });

  it('una fecha rota no inventa hitos', () => {
    expect(hitosLanzamiento('mañana', '2026-10-30')).toEqual([]);
    expect(proximoHito('', '2026-10-30')).toBeNull();
  });
});

describe('el calendario enseña la hoja de ruta del estreno', () => {
  const base = { conciertos: [], historial: [], resultados: [] };
  const hitos = (hoy: string) => agendaDe({ ...base, hoy, lanzamiento: { titulo: 'Nuevo single', fecha: FECHA } })
    .flatMap((d) => d.eventos.map((e) => ({ dia: d.fecha, e })));

  it('pone los hitos de las próximas dos semanas con su objetivo, y el estreno una sola vez', () => {
    const e = hitos('2026-11-06');
    expect(e.filter((x) => x.e.tipo === 'lanzamiento')).toHaveLength(1);
    expect(e).toContainEqual({ dia: '2026-11-06', e: expect.objectContaining({ tipo: 'hito', texto: 'Primer teaser (reel de 10 segundos) · «Nuevo single»' }) });
    expect(e).toContainEqual({ dia: '2026-11-17', e: expect.objectContaining({ tipo: 'hito', objetivo: expect.stringContaining('Quien activa el aviso') }) });
    expect(e.some((x) => x.e.tipo === 'hito' && x.e.texto.startsWith('Día del estreno'))).toBe(false);
  });

  it('lo que cae fuera de la ventana no sale', () => {
    expect(hitos('2026-09-01').filter((x) => x.e.tipo !== 'lanzamiento')).toEqual([]);
  });
});
