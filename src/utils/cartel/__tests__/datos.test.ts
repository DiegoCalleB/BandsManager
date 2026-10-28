import { describe, it, expect } from 'vitest';
import { bandasDelBolo, construirLineup, datosDesdeConcierto, conciertosParaCartel, esCompartido, TODAS } from '../datos';
import type { Concert } from '../../../types';
import { configDesdeEstado, ajustesDe, CONFIG_INICIAL } from '../config';

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

describe('configDesdeEstado', () => {
  const base = { formato: 'feed' as const, ajustes: ajustesDe(CONFIG_INICIAL), fondosIa: [], logos: [] as string[], anterior: CONFIG_INICIAL };

  it('nunca guarda una URL local (blob:) de una foto que aún se está subiendo', () => {
    const c = configDesdeEstado({ ...base, fondo: { tipo: 'imagen', origen: 'foto', url: 'blob:http://x/1' }, fotoRemota: null });
    expect(JSON.stringify(c)).not.toContain('blob:');
    expect(c.fondo).toEqual(CONFIG_INICIAL.fondo);
  });

  it('en cuanto la foto está subida, el fondo apunta a la remota', () => {
    const c = configDesdeEstado({ ...base, fondo: { tipo: 'imagen', origen: 'foto', url: 'blob:http://x/1' }, fotoRemota: 'https://s/f.jpg' });
    expect(c.fondo).toEqual({ tipo: 'imagen', origen: 'foto', url: 'https://s/f.jpg' });
    expect(c.foto).toBe('https://s/f.jpg');
  });

  it('una paleta o un fondo de IA pasan tal cual', () => {
    expect(configDesdeEstado({ ...base, fondo: { tipo: 'paleta', id: 'bosque' }, fotoRemota: null }).fondo).toEqual({ tipo: 'paleta', id: 'bosque' });
  });
});

import { conCartelGuardado } from '../estado';

describe('conCartelGuardado', () => {
  const a = { id: 'a', sala: 'A' };
  const b = { id: 'b', sala: 'B' };

  it('actualiza solo el bolo indicado y respeta la referencia de los demás', () => {
    const r = conCartelGuardado([a, b], 'b', { cartel_config: { extra: 'x' } });
    expect(r[0]).toBe(a);
    expect(r[1]).toEqual({ id: 'b', sala: 'B', cartel_config: { extra: 'x' } });
  });

  it('un bolo desconocido no cambia nada (misma lista)', () => {
    const lista = [a, b];
    expect(conCartelGuardado(lista, 'zzz', { cartel_url: 'https://x' })).toBe(lista);
  });

  it('conserva lo ya guardado cuando solo llega una de las dos cosas', () => {
    const r = conCartelGuardado([{ ...a, cartel_config: { v: 1 } }], 'a', { cartel_url: 'https://x' });
    expect(r[0]).toMatchObject({ cartel_config: { v: 1 }, cartel_url: 'https://x' });
  });

  describe('dirección', () => {
    const c = bolo({ direccion: '  C/ Jardines 3  ' });
    it('solo entra si la persona la pide, recortada', () => {
      expect(datosDesdeConcierto(c, 'Banda', { cabeza: null, extra: '', horario: true, direccion: true }).direccion).toBe('C/ Jardines 3');
      expect(datosDesdeConcierto(c, 'Banda', { cabeza: null, extra: '', horario: true, direccion: false }).direccion).toBe('');
    });
    it('un bolo sin dirección no inventa nada', () => {
      expect(datosDesdeConcierto(bolo(), 'Banda', { cabeza: null, extra: '', horario: true, direccion: true }).direccion).toBe('');
    });
  });
});
