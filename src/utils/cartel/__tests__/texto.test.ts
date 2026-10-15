import { describe, it, expect } from 'vitest';
import { fechaCartel, ajustarLineas, ajustarPiezas, horaValida, lineaHorario } from '../texto';
import { nombreArchivo, urlParaQr } from '../render';
import QRCode from 'qrcode';

describe('texto del cartel', () => {
  it('formatea la fecha sin que la zona horaria mueva el día', () => {
    expect(fechaCartel('2026-11-14')).toBe('SÁB 14 NOV 2026');
    expect(fechaCartel('2026-01-01T23:30:00')).toBe('JUE 1 ENE 2026');
  });

  it('una fecha inválida no rompe el cartel', () => {
    expect(fechaCartel('')).toBe('');
    expect(fechaCartel('mañana')).toBe('');
  });

  it('solo acepta horas reales', () => {
    expect(horaValida('9:05')).toBe('09:05');
    expect(horaValida(' 21:30 ')).toBe('21:30');
    expect(horaValida('25:00')).toBeNull();
    expect(horaValida('')).toBeNull();
    expect(horaValida(undefined)).toBeNull();
  });

  it('compone puertas y show, o solo la que exista', () => {
    expect(lineaHorario('20:30', '21:30')).toBe('PUERTAS 20:30 · SHOW 21:30');
    expect(lineaHorario(undefined, '22:00')).toBe('SHOW 22:00');
    expect(lineaHorario('x', null)).toBe('');
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

describe('nombre del archivo', () => {
  it('sin tildes ni caracteres raros', () => {
    expect(nombreArchivo('Los Pájaros & Cía', '2026-11-14', 'feed')).toBe('cartel-los-pajaros-cia-2026-11-14-feed.png');
  });
});

describe('ajustarPiezas', () => {
  const medir = (t: string) => t.length * 10;
  it('corta entre bandas, no dentro de un nombre', () => {
    expect(ajustarPiezas(['CON LOS PIJAMAS', 'INVITADA SORPRESA'], ' · ', 260, medir)).toEqual(['CON LOS PIJAMAS', 'INVITADA SORPRESA']);
  });
  it('junta piezas mientras quepan', () => {
    expect(ajustarPiezas(['A', 'B', 'C'], ' · ', 100, medir)).toEqual(['A · B · C']);
  });
  it('al cortar entre cabezas de cartel conserva el «+»', () => {
    expect(ajustarPiezas(['UNO', 'DOS'], ' + ', 50, medir, '+ ')).toEqual(['UNO', '+ DOS']);
  });
  it('una pieza que no cabe sola se reparte por palabras', () => {
    expect(ajustarPiezas(['UNA BANDA LARGUISIMA', 'X'], ' · ', 100, medir)).toEqual(['UNA BANDA', 'LARGUISIMA', 'X']);
  });
});

describe('URL del QR', () => {
  it('un enlace corto va en mayúsculas y cabe en un QR más pequeño', () => {
    expect(urlParaQr('https://bandmanager.io/r/ab3k9x2')).toBe('HTTPS://BANDMANAGER.IO/R/AB3K9X2');
    const normal = QRCode.create('https://bandmanager.io/r/ab3k9x2', { errorCorrectionLevel: 'M' });
    const mayus = QRCode.create(urlParaQr('https://bandmanager.io/r/ab3k9x2'), { errorCorrectionLevel: 'M' });
    expect(mayus.modules.size).toBeLessThan(normal.modules.size);
  });
  it('cualquier otra URL no se toca (una query en mayúsculas cambiaría su significado)', () => {
    for (const u of ['https://bandmanager.io/e/mi-bolo?utm_source=cartel', 'https://bandmanager.io/epk?b=Ab3', 'https://x.com/r/ab?x=1']) {
      expect(urlParaQr(u)).toBe(u);
    }
  });
});
