import { describe, it, expect } from 'vitest';
import {
  cartelesAnteriores,
  ADN_INICIAL, sanearAdn, conReferencia, sinReferencia, conFavorito, sinFavorito, referenciasParaIa, estiloSugerido,
  MAX_REFERENCIAS, MAX_FAVORITOS, type AdnCartel, type FavoritoCartel,
} from '../adn';

const propia = (u: string) => u.startsWith('https://s/carteles/band-a/');
const url = (n: string) => `https://s/carteles/band-a/${n}`;
const fav = (n: string, estilo: FavoritoCartel['estilo'] = 'neon'): FavoritoCartel => ({ url: url(n), estilo, ambiente: '' });

describe('sanearAdn', () => {
  it('basura o no-objeto da null; vacío da el ADN inicial', () => {
    for (const r of [null, 'x', 3, [1]]) expect(sanearAdn(r, propia)).toBeNull();
    expect(sanearAdn({}, propia)).toEqual(ADN_INICIAL);
  });

  it('descarta URLs de otra banda o de otro host, en referencias y favoritos', () => {
    const adn = sanearAdn({
      referencias: [url('a.png'), 'https://s/carteles/band-b/x.png', 'https://evil.com/x.png'],
      favoritos: [{ url: url('f.png'), estilo: 'neon' }, { url: 'https://evil.com/f.png', estilo: 'neon' }],
    }, propia)!;
    expect(adn.referencias).toEqual([url('a.png')]);
    expect(adn.favoritos.map((f) => f.url)).toEqual([url('f.png')]);
  });

  it('valida los estilos de los favoritos contra una lista cerrada', () => {
    const adn = sanearAdn({ favoritos: [{ url: url('a.png'), estilo: '../x' }, { url: url('b.png'), estilo: 'neon' }] }, propia)!;
    expect(adn.favoritos.map((f) => f.url)).toEqual([url('b.png')]);
  });

  it('«aprender» solo acepta un booleano', () => {
    expect(sanearAdn({ aprender: false }, propia)!.aprender).toBe(false);
    expect(sanearAdn({ aprender: 'no' }, propia)!.aprender).toBe(true);
  });

  it('acota tamaños y recorta el ambiente sin caracteres de control', () => {
    const muchas = Array.from({ length: 10 }, (_, i) => url(`r${i}.png`));
    const adn = sanearAdn({ referencias: muchas, favoritos: muchas.map((u) => ({ url: u, estilo: 'neon', ambiente: `a\u0000${'x'.repeat(999)}` })) }, propia)!;
    expect(adn.referencias).toHaveLength(MAX_REFERENCIAS);
    expect(adn.favoritos).toHaveLength(MAX_FAVORITOS);
    expect(adn.favoritos[0].ambiente.length).toBeLessThanOrEqual(300);
    expect(adn.favoritos[0].ambiente.includes(String.fromCharCode(0))).toBe(false);
  });

  it('la misma imagen con otra versión (?v=) no se repite', () => {
    const adn = sanearAdn({ favoritos: [{ url: `${url('f.png')}?v=1`, estilo: 'neon' }, { url: `${url('f.png')}?v=2`, estilo: 'neon' }] }, propia)!;
    expect(adn.favoritos).toHaveLength(1);
  });
});

describe('referencias y favoritos', () => {
  it('la cuarta referencia desplaza a la más antigua', () => {
    let a: AdnCartel = ADN_INICIAL;
    for (const n of ['1', '2', '3', '4']) a = conReferencia(a, url(n));
    expect(a.referencias).toEqual([url('2'), url('3'), url('4')]);
    expect(sinReferencia(a, `${url('3')}?v=9`).referencias).toEqual([url('2'), url('4')]);
  });

  it('el favorito más nuevo va primero, sin repetir y con tope', () => {
    let a: AdnCartel = ADN_INICIAL;
    for (let i = 0; i < 8; i++) a = conFavorito(a, fav(`f${i}.png`));
    a = conFavorito(a, fav('f5.png'));
    expect(a.favoritos).toHaveLength(MAX_FAVORITOS);
    expect(a.favoritos[0].url).toBe(url('f5.png'));
    expect(sinFavorito(a, url('f5.png')).favoritos.some((f) => f.url === url('f5.png'))).toBe(false);
  });

  it('referenciasParaIa: primero las elegidas a mano, luego favoritos hasta 3, sin repetir', () => {
    const a: AdnCartel = { ...ADN_INICIAL, referencias: [url('r1.png')], favoritos: [fav('r1.png'), fav('f1.png'), fav('f2.png'), fav('f3.png')] };
    expect(referenciasParaIa(a)).toEqual([url('r1.png'), url('f1.png'), url('f2.png')]);
  });

  it('con «aprender» apagado solo cuentan las elegidas a mano', () => {
    const a: AdnCartel = { ...ADN_INICIAL, aprender: false, referencias: [url('r1.png')], favoritos: [fav('f1.png')] };
    expect(referenciasParaIa(a)).toEqual([url('r1.png')]);
    expect(referenciasParaIa({ ...a, referencias: [] })).toEqual([]);
  });
});

describe('estiloSugerido', () => {
  it('con dos o más favoritos del mismo estilo, ese; con empate gana el más reciente', () => {
    const a: AdnCartel = { ...ADN_INICIAL, favoritos: [fav('1', 'collage'), fav('2', 'neon'), fav('3', 'collage')] };
    expect(estiloSugerido(a)).toBe('collage');
    expect(estiloSugerido({ ...a, favoritos: [fav('1', 'collage'), fav('2', 'neon')] }, { plantilla: 'vintage' })).toBe('vintage');
    expect(estiloSugerido({ ...a, aprender: false }, { plantilla: 'vintage' })).toBe('vintage');
  });

  it('sin favoritos: plantilla del dossier, luego pistas del género, luego serigrafía', () => {
    expect(estiloSugerido(ADN_INICIAL, { plantilla: 'neon', genero: 'jazz' })).toBe('neon');
    expect(estiloSugerido(ADN_INICIAL, { genero: 'Punk rock madrileño' })).toBe('collage');
    expect(estiloSugerido(ADN_INICIAL, { genero: 'Jazz fusión' })).toBe('vintage');
    expect(estiloSugerido(ADN_INICIAL, { genero: 'Electrónica' })).toBe('neon');
    expect(estiloSugerido(ADN_INICIAL, { genero: 'Cantautor' })).toBe('minimal');
    expect(estiloSugerido(ADN_INICIAL, {})).toBe('gigposter');
    expect(estiloSugerido(ADN_INICIAL, { plantilla: 'rara', genero: '???' })).toBe('gigposter');
  });
});

describe('cartelesAnteriores', () => {
  const url = (n: string) => `https://x.supabase.co/storage/v1/object/public/carteles/banda/${n}.png`;
  it('ofrece los carteles de otros bolos, sin repetir ni las referencias ni los de fuera', () => {
    const concerts = [
      { id: 'a', cartel_url: url('a') },
      { id: 'b', cartel_url: url('b') },
      { id: 'c', cartelUrl: url('b') + '?v=2' },
      { id: 'd', cartel_url: url('d') },
      { id: 'e', cartel_url: 'https://otro.com/cartel.png' },
      { id: 'f' },
    ];
    expect(cartelesAnteriores(concerts, 'a', [url('d')])).toEqual([url('b')]);
  });
});
