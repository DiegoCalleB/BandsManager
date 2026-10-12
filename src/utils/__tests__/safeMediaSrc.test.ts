import { describe, it, expect } from 'vitest';
import { safeMediaSrc } from '../safeUrl';

describe('safeMediaSrc', () => {
  it('admite http(s), blob y rutas de la app', () => {
    expect(safeMediaSrc('https://x.com/a.mp3')).toBe('https://x.com/a.mp3');
    expect(safeMediaSrc('/uploads/a.mp3?v=1')).toBe('/uploads/a.mp3?v=1');
    expect(safeMediaSrc('blob:https://x.com/uuid')).toMatch(/^blob:/);
  });
  it('descarta esquemas peligrosos, // y vacío', () => {
    expect(safeMediaSrc('javascript:alert(1)')).toBeUndefined();
    expect(safeMediaSrc('data:audio/mp3;base64,AA')).toBeUndefined();
    expect(safeMediaSrc('//evil.com/a.mp3')).toBeUndefined();
    expect(safeMediaSrc('')).toBeUndefined();
  });
});
