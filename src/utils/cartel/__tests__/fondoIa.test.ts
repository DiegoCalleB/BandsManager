import { describe, it, expect } from 'vitest';
import { fondoConTexto } from '../fondoIa';

describe('fondoConTexto', () => {
  const base = 'https://x.supabase.co/storage/v1/object/public/band-media/carteles/b1/';
  it('reconoce el fondo con las letras dentro por el nombre del fichero', () => {
    expect(fondoConTexto(`${base}ia-t-0a1b.png`)).toBe(true);
    expect(fondoConTexto(`${base}ia-t-0a1b.png?v=3`)).toBe(true);
  });
  it('un fondo normal o una carpeta que casualmente se llame así no cuentan', () => {
    expect(fondoConTexto(`${base}ia-0a1b.png`)).toBe(false);
    expect(fondoConTexto('https://x.test/ia-t-carpeta/ia-1.png')).toBe(false);
    expect(fondoConTexto('')).toBe(false);
  });
});
