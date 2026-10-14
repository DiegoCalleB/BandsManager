import { describe, it, expect } from 'vitest';
import { fechaCartel, datosCartel, ajustarLineas } from '../cartelCompose';

describe('cartelCompose', () => {
  it('formatea la fecha sin que la zona horaria mueva el día', () => {
    expect(fechaCartel('2026-11-14')).toBe('SÁB 14 NOV 2026');
    expect(fechaCartel('2026-01-01T23:30:00')).toBe('JUE 1 ENE 2026');
  });

  it('una fecha inválida no rompe el cartel', () => {
    expect(fechaCartel('')).toBe('');
    expect(fechaCartel('mañana')).toBe('');
  });

  it('limpia espacios en los datos del concierto', () => {
    const d = datosCartel({ fecha: '2026-11-14', sala: '  Sala El Sol ', ciudad: 'Madrid' }, ' Los Pijamas ');
    expect(d).toEqual({ banda: 'Los Pijamas', sala: 'Sala El Sol', ciudad: 'Madrid', fecha: 'SÁB 14 NOV 2026' });
  });

  it('reparte el texto en líneas que caben', () => {
    const medir = (t: string) => t.length * 10;
    expect(ajustarLineas('LOS PIJAMAS DE SEDA', 120, medir)).toEqual(['LOS PIJAMAS', 'DE SEDA']);
  });

  it('una palabra más larga que el ancho va sola, sin perderse', () => {
    expect(ajustarLineas('SUPERCALIFRAGILISTICO sí', 50, (t) => t.length * 10)).toEqual(['SUPERCALIFRAGILISTICO', 'sí']);
  });

  it('texto vacío da cero líneas', () => {
    expect(ajustarLineas('   ', 100, (t) => t.length)).toEqual([]);
  });
});
