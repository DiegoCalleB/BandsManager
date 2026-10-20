import { describe, it, expect } from 'vitest';
import { buildQrSvg } from '../qrSvg';

describe('buildQrSvg', () => {
  it('genera un SVG con el tamaño pedido y sin dependencias externas', () => {
    const svg = buildQrSvg('https://bandmanager.io', 12);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('width="12mm"');
    expect(svg).toContain('<path');
    expect(svg).not.toContain('http-equiv');
  });

  it('es determinista', () => {
    expect(buildQrSvg('https://bandmanager.io', 10)).toBe(buildQrSvg('https://bandmanager.io', 10));
  });

  it('superpone el logo en el centro solo si se pasa, escapando la URL', () => {
    expect(buildQrSvg('https://bandmanager.io', 10)).not.toContain('<image');
    const svg = buildQrSvg('https://bandmanager.io', 10, 'H', 'https://x.io/l.png?a=1&b="2"');
    expect(svg).toContain('<image href="https://x.io/l.png?a=1&amp;b=&quot;2&quot;"');
    expect(svg).toContain('<circle');
  });

  it('añade la firma de BandManager bajo el QR solo si se pide', () => {
    const sin = buildQrSvg('https://bandmanager.io', 10, 'H');
    const con = buildQrSvg('https://bandmanager.io', 10, 'H', undefined, true);
    expect(sin).not.toContain('bandmanager.io</text>');
    expect(con).toContain('Hecho con bandmanager.io</text>');
    // La franja de la firma alarga el SVG, no lo comprime: el QR conserva su tamaño.
    expect(parseFloat(con.match(/height="([\d.]+)mm"/)![1])).toBeGreaterThan(10);
    expect(parseFloat(sin.match(/height="([\d.]+)mm"/)![1])).toBe(10);
  });
});
