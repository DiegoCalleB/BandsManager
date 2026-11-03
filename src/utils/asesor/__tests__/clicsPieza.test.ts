import { describe, expect, it } from 'vitest';
import { clicsTrasPublicar } from '../clicsPieza';
import type { AccionRegistrada } from '../tipos';

const HOY = '2026-10-28';
const hecha = (fecha: string, tarjetaId: string): AccionRegistrada => ({ fecha, tarjetaId, formato: 'reel', accion: 'hecho', titulo: `Idea ${tarjetaId}` });
const enlaces = [{ code: 'ig', canal: 'instagram' }, { code: 'tt', canal: 'tiktok' }, { code: 'wa', canal: 'whatsapp' }];
// Mediodía UTC: el mismo día en Madrid.
const clic = (code: string, dia: string) => ({ code, clicked_at: `${dia}T12:00:00.000Z` });

describe('clicsTrasPublicar', () => {
  it('cuenta los clics del día de publicar y del siguiente, por canal', () => {
    const r = clicsTrasPublicar([hecha('2026-10-24', 'a')], enlaces, [clic('ig', '2026-10-24'), clic('ig', '2026-10-25'), clic('tt', '2026-10-25'), clic('ig', '2026-10-26'), clic('ig', '2026-10-23')], HOY, ['instagram', 'tiktok']);
    expect(r).toEqual([{ fecha: '2026-10-24', tarjetaId: 'a', titulo: 'Idea a', formato: 'reel', total: 3, porCanal: { instagram: 2, tiktok: 1 }, completa: true }]);
  });

  it('solo cuentan los canales de las redes de la banda', () => {
    const r = clicsTrasPublicar([hecha('2026-10-24', 'a')], enlaces, [clic('wa', '2026-10-24'), clic('tt', '2026-10-24'), clic('desconocido', '2026-10-24')], HOY, ['instagram']);
    expect(r[0]).toMatchObject({ total: 0, porCanal: {} });
  });

  it('mientras no han pasado las 48 h, la medida no está completa', () => {
    expect(clicsTrasPublicar([hecha('2026-10-27', 'ayer'), hecha('2026-10-28', 'hoy'), hecha('2026-10-26', 'antes')], enlaces, [], HOY, ['instagram']).map((p) => [p.tarjetaId, p.completa]))
      .toEqual([['hoy', false], ['ayer', false], ['antes', true]]);
  });

  it('lo más reciente primero, solo lo hecho, y nada de hace más de 14 días ni de máximo seis piezas', () => {
    const acciones = [hecha('2026-10-01', 'vieja'), { ...hecha('2026-10-25', 's'), accion: 'saltado' as const }, ...['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id, i) => hecha(`2026-10-2${i}`, id))];
    const r = clicsTrasPublicar(acciones, enlaces, [], HOY, ['instagram']);
    expect(r).toHaveLength(6);
    expect(r.map((p) => p.tarjetaId)).not.toContain('vieja');
    expect(r.map((p) => p.tarjetaId)).not.toContain('s');
    expect(r[0].fecha >= r[5].fecha).toBe(true);
  });

  it('los clics con una fecha rota se ignoran, no tumban nada', () => {
    const r = clicsTrasPublicar([hecha('2026-10-24', 'a')], enlaces, [{ code: 'ig', clicked_at: 'ayer' }, clic('ig', '2026-10-24')], HOY, ['instagram']);
    expect(r[0].total).toBe(1);
  });
});
