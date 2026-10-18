import { describe, it, expect, vi } from 'vitest';
import { cargarReferencias, tipoDeImagen } from '../referenciasCartel';
import { contenidoDeFondo } from '../imagenCartel';

process.env.SUPABASE_URL = 'https://x.supabase.co';
const PUB = 'https://x.supabase.co/storage/v1/object/public/band-media';
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);

describe('tipoDeImagen', () => {
  it('reconoce JPEG y PNG por la firma y nada más', () => {
    expect(tipoDeImagen(jpeg)).toBe('image/jpeg');
    expect(tipoDeImagen(png)).toBe('image/png');
    expect(tipoDeImagen(Buffer.from('<svg xmlns=...'))).toBeNull();
    expect(tipoDeImagen(Buffer.from('GIF89a..'))).toBeNull();
    expect(tipoDeImagen(Buffer.from([0xff]))).toBeNull();
  });
});

describe('cargarReferencias', () => {
  it('lee solo de la carpeta de la banda y devuelve base64 con su tipo real', async () => {
    const leer = vi.fn(async (ruta: string) => (ruta.endsWith('.png') ? png : jpeg));
    const r = await cargarReferencias('band-a', [`${PUB}/carteles/band-a/ref/1.jpg`, `${PUB}/carteles/band-a/c1.png?v=3`], leer);
    expect(r).toEqual([
      { mimeType: 'image/jpeg', data: jpeg.toString('base64') },
      { mimeType: 'image/png', data: png.toString('base64') },
    ]);
    expect(leer.mock.calls.map((c) => c[0])).toEqual(['carteles/band-a/ref/1.jpg', 'carteles/band-a/c1.png']);
  });

  it('NUNCA lee ficheros de otra banda, de otro bucket ni de otro host', async () => {
    const leer = vi.fn(async () => jpeg);
    const r = await cargarReferencias('band-a', [
      `${PUB}/carteles/band-b/ref/1.jpg`,
      `${PUB}/audio/band-a/secreto.mp3`,
      `${PUB}/carteles/band-a/../band-b/x.jpg`,
      'https://evil.com/storage/v1/object/public/band-media/carteles/band-a/x.jpg',
      'file:///etc/passwd',
    ], leer);
    expect(r).toEqual([]);
    expect(leer).not.toHaveBeenCalled();
  });

  it('una referencia que falta o no es una imagen se salta sin tumbar a las demás', async () => {
    const leer = vi.fn(async (ruta: string) => (ruta.includes('falta') ? null : ruta.includes('svg') ? Buffer.from('<svg/>') : jpeg));
    const r = await cargarReferencias('band-a', [`${PUB}/carteles/band-a/ref/falta.jpg`, `${PUB}/carteles/band-a/ref/x.svg`, `${PUB}/carteles/band-a/ref/ok.jpg`], leer);
    expect(r).toHaveLength(1);
  });

  it('como mucho 3', async () => {
    const leer = vi.fn(async () => jpeg);
    const urls = Array.from({ length: 6 }, (_, i) => `${PUB}/carteles/band-a/ref/${i}.jpg`);
    expect(await cargarReferencias('band-a', urls, leer)).toHaveLength(3);
  });
});

describe('contenidoDeFondo', () => {
  it('sin referencias es solo el texto; con ellas, texto + una parte inlineData por imagen', () => {
    expect(contenidoDeFondo('hola', [])).toBe('hola');
    const c = contenidoDeFondo('hola', [{ mimeType: 'image/jpeg', data: 'AAA' }]) as any[];
    expect(c[0].role).toBe('user');
    expect(c[0].parts).toEqual([{ text: 'hola' }, { inlineData: { mimeType: 'image/jpeg', data: 'AAA' } }]);
  });
});
