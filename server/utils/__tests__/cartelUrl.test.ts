import { describe, it, expect } from 'vitest';
import { esUrlDeCartel, carpetaCartel } from '../cartelUrl';
import { sanearConfigCartel, conFondoIa, CONFIG_INICIAL } from '../../../src/utils/cartel/config';

const SB = 'https://abc.supabase.co';
const ok = (bandId: string, f = 'x.png') => `${SB}/storage/v1/object/public/band-media/${carpetaCartel(bandId)}${f}`;
const valida = (bandId: string) => (u: string) => esUrlDeCartel(u, bandId, SB, 'band-media');

describe('esUrlDeCartel', () => {
  it('acepta la carpeta de carteles de la propia banda, con ?v= de caché', () => {
    expect(esUrlDeCartel(ok('band-a'), 'band-a', SB, 'band-media')).toBe(true);
    expect(esUrlDeCartel(`${ok('band-a')}?v=123`, 'band-a', SB, 'band-media')).toBe(true);
  });

  it('rechaza la carpeta de otra banda', () => {
    expect(esUrlDeCartel(ok('band-b'), 'band-a', SB, 'band-media')).toBe(false);
    // Un id que empieza igual no cuela por prefijo.
    expect(esUrlDeCartel(ok('band-ab'), 'band-a', SB, 'band-media')).toBe(false);
  });

  it('rechaza otros hosts, protocolos, buckets y trucos de ruta', () => {
    for (const u of [
      'https://evil.com/storage/v1/object/public/band-media/carteles/band-a/x.png',
      'http://abc.supabase.co/storage/v1/object/public/band-media/carteles/band-a/x.png',
      `${SB}/storage/v1/object/public/otro/carteles/band-a/x.png`,
      `${SB}/storage/v1/object/public/band-media/carteles/band-a/../band-b/x.png`,
      `${SB}/storage/v1/object/public/band-media/carteles/band-a/%2e%2e/band-b/x.png`,
      `https://user:pw@abc.supabase.co/storage/v1/object/public/band-media/carteles/band-a/x.png`,
      'javascript:alert(1)',
      'no es una url',
    ]) {
      expect(esUrlDeCartel(u, 'band-a', SB, 'band-media'), u).toBe(false);
    }
  });

  it('sin Supabase configurado no acepta nada', () => {
    expect(esUrlDeCartel(ok('band-a'), 'band-a', '', 'band-media')).toBe(false);
  });
});

describe('sanearConfigCartel', () => {
  it('basura o no-objeto da null', () => {
    for (const r of [null, 'x', 3, [1, 2]]) expect(sanearConfigCartel(r, valida('band-a'))).toBeNull();
  });

  it('un objeto vacío da la configuración inicial', () => {
    expect(sanearConfigCartel({}, valida('band-a'))).toEqual(CONFIG_INICIAL);
  });

  it('descarta URLs ajenas en el historial y en la foto', () => {
    const c = sanearConfigCartel({ fondosIa: [ok('band-a', '1.png'), ok('band-b', '2.png'), 'https://evil.com/x.png'], foto: ok('band-b', 'f.jpg') }, valida('band-a'))!;
    expect(c.fondosIa).toEqual([ok('band-a', '1.png')]);
    expect(c.foto).toBeNull();
  });

  it('un fondo de imagen solo vale si está en el historial o es la foto del bolo', () => {
    const ia = ok('band-a', '1.png');
    expect(sanearConfigCartel({ fondosIa: [ia], fondo: { tipo: 'imagen', origen: 'ia', url: ia } }, valida('band-a'))!.fondo)
      .toEqual({ tipo: 'imagen', origen: 'ia', url: ia });
    expect(sanearConfigCartel({ fondo: { tipo: 'imagen', origen: 'ia', url: ia } }, valida('band-a'))!.fondo)
      .toEqual(CONFIG_INICIAL.fondo);
    expect(sanearConfigCartel({ fondo: { tipo: 'paleta', id: 'inventada' } }, valida('band-a'))!.fondo).toEqual(CONFIG_INICIAL.fondo);
  });

  it('recorta textos y quita caracteres de control', () => {
    const c = sanearConfigCartel({ extra: 'a\u0000b'.repeat(50), cabeza: '  Banda\n ' }, valida('band-a'))!;
    expect(c.extra.length).toBeLessThanOrEqual(40);
    expect(c.extra).not.toMatch(/\u0000/);
    expect(c.cabeza).toBe('Banda');
  });

  it('el historial de IA guarda 3 como mucho, el más nuevo primero y sin repetir', () => {
    let c = CONFIG_INICIAL;
    for (const u of ['1', '2', '3', '2', '4']) c = conFondoIa(c, u);
    expect(c.fondosIa).toEqual(['4', '2', '3']);
  });
});
