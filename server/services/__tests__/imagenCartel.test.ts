import { describe, it, expect } from 'vitest';
import { fondoConTexto, rutaFondoIa } from '../imagenCartel';

describe('fondos de IA con el texto dentro', () => {
  it('el fichero lo marca y el cliente lo reconoce', () => {
    const con = `https://x.supabase.co/storage/v1/object/public/band-media/${rutaFondoIa('banda-1', true)}`;
    const sin = `https://x.supabase.co/storage/v1/object/public/band-media/${rutaFondoIa('banda-1')}`;
    expect(fondoConTexto(con)).toBe(true);
    expect(fondoConTexto(`${con}?v=2`)).toBe(true);
    expect(fondoConTexto(sin)).toBe(false);
  });

  it('un nombre cualquiera que contenga «ia-t-» fuera del fichero no cuenta', () => {
    expect(fondoConTexto('https://x.test/ia-t-carpeta/ia-123.png')).toBe(false);
  });
});
