import { describe, it, expect } from 'vitest';
import { bandasDelBolo, construirLineup, datosDesdeConcierto, conciertosParaCartel, esCompartido, TODAS } from '../datos';
import type { Concert } from '../../../types';

const bolo = (over: Partial<Concert> = {}): Concert => ({
  id: 'c1', fecha: '2026-11-14', ciudad: 'Madrid', sala: 'El Sol', cache: 0, aforo_vendido: 0, aforo_total: 0,
  contrato_firmado: false, estado_pago: 'pendiente', notas: '', tipo: 'sala', ...over,
});

describe('datos del cartel', () => {
  it('lineup: vuestra banda y las compartidas, sin repetidos', () => {
    expect(bandasDelBolo(bolo({ bandas_compartidas: ['Otra', ' los pijamas ', '', 'otra'] }), 'Los Pijamas')).toEqual(['Los Pijamas', 'Otra']);
    expect(esCompartido(bolo(), 'Los Pijamas')).toBe(false);
    expect(esCompartido(bolo({ bandas_compartidas: ['Otra'] }), 'Los Pijamas')).toBe(true);
  });

  it('una sola banda siempre es la cabeza', () => {
    expect(construirLineup(['Solo'], null)).toEqual([{ nombre: 'Solo', cabeza: true }]);
  });

  it('sin decidir o «todas»: nadie destaca', () => {
    for (const c of [null, TODAS, 'Una que ya no está']) {
      expect(construirLineup(['A', 'B'], c).every((b) => !b.cabeza)).toBe(true);
    }
  });

  it('si sois teloneros, la cabeza elegida pasa delante', () => {
    expect(construirLineup(['Nosotros', 'Cabeza', 'Otra'], 'cabeza')).toEqual([
      { nombre: 'Cabeza', cabeza: true },
      { nombre: 'Nosotros', cabeza: false },
      { nombre: 'Otra', cabeza: false },
    ]);
  });

  it('solo pinta las horas que alguien escribió de verdad', () => {
    const c = bolo({ logisticaTecnica: { horaAperturaPuertas: '20:30', horaShow: 'pronto' } });
    expect(datosDesdeConcierto(c, 'X', { cabeza: null, extra: '', horario: true }).horario).toBe('PUERTAS 20:30');
    expect(datosDesdeConcierto(c, 'X', { cabeza: null, extra: '', horario: false }).horario).toBe('');
  });

  it('recorta el texto libre', () => {
    expect(datosDesdeConcierto(bolo(), 'X', { cabeza: null, extra: 'x'.repeat(100), horario: true }).extra).toHaveLength(40);
  });

  it('solo bolos públicos, confirmados y futuros, por fecha', () => {
    const lista = [
      bolo({ id: 'b', fecha: '2026-12-01' }),
      bolo({ id: 'a', fecha: '2026-11-01' }),
      bolo({ id: 'pasado', fecha: '2026-01-01' }),
      bolo({ id: 'privado', tipo: 'privado' }),
      bolo({ id: 'posible', is_posible: true }),
      bolo({ id: 'hoy', fecha: '2026-10-14T21:00' }),
    ];
    expect(conciertosParaCartel(lista, '2026-10-14').map((c) => c.id)).toEqual(['hoy', 'a', 'b']);
  });
});
