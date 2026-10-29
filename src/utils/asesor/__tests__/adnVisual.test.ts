import { describe, expect, it } from 'vitest';
import type { AdnCartel } from '../../cartel/adn';
import { MAX_FOTOS_BANDA, fotosDeLaBanda, fotosIniciales, vozDeLaBanda } from '../adnVisual';

const adn = (cambios: Partial<AdnCartel> = {}): AdnCartel => ({ v: 1, referencias: [], favoritos: [], aprender: true, ...cambios });
const CDN = 'https://x.supabase.co/storage/v1/object/public/band-media';

describe('fotosDeLaBanda', () => {
  it('junta galería, referencias y favoritos, de más a menos suyas, sin repetir', () => {
    const fotos = fotosDeLaBanda({
      galeria: [`${CDN}/g/1.jpg`, { url: `${CDN}/g/2.jpg` }, 42, null, 'http://inseguro.test/x.jpg'],
      adn: adn({ referencias: [`${CDN}/ref/1.jpg?v=3`], favoritos: [{ url: `${CDN}/g/1.jpg?v=9`, estilo: 'neon', ambiente: '' }, { url: `${CDN}/ia/1.png`, estilo: 'neon', ambiente: '' }] }),
    });
    expect(fotos.map((f) => [f.origen, f.url.split('/').pop()])).toEqual([
      ['dossier', '1.jpg'], ['dossier', '2.jpg'], ['referencia', '1.jpg?v=3'], ['favorito', '1.png'],
    ]);
  });

  it('acepta rutas de nuestro servidor pero no protocolos raros', () => {
    const fotos = fotosDeLaBanda({ galeria: ['/uploads/galeria/a.jpg', '//otro.test/a.jpg', 'javascript:alert(1)', 'data:image/png;base64,xx'], adn: null });
    expect(fotos.map((f) => f.url)).toEqual(['/uploads/galeria/a.jpg']);
  });

  it('no ofrece el logo como foto de fondo', () => {
    expect(fotosDeLaBanda({ galeria: [`${CDN}/logo.png?v=2`, `${CDN}/f.jpg`], logoUrl: `${CDN}/logo.png`, adn: null }).map((f) => f.url)).toEqual([`${CDN}/f.jpg`]);
  });

  it('como mucho 12', () => {
    const muchas = Array.from({ length: 30 }, (_, i) => `${CDN}/g/${i}.jpg`);
    expect(fotosDeLaBanda({ galeria: muchas, adn: null })).toHaveLength(MAX_FOTOS_BANDA);
  });
});

describe('vozDeLaBanda', () => {
  it('sale del estilo de la banda: dossier, género o lo que más comparte', () => {
    expect(vozDeLaBanda(null, { plantilla: 'stage' })).toBe('cartel');
    expect(vozDeLaBanda(null, { plantilla: 'vintage' })).toBe('clasica');
    expect(vozDeLaBanda(null, { plantilla: 'minimal' })).toBe('moderna');
    expect(vozDeLaBanda(null, { genero: 'Punk rock' })).toBe('cartel');
    expect(vozDeLaBanda(null, { genero: 'Jazz y blues' })).toBe('clasica');
  });

  it('lo que la banda comparte pesa más que su dossier', () => {
    const favoritos = [1, 2].map((i) => ({ url: `${CDN}/ia/${i}.png`, estilo: 'vintage' as const, ambiente: '' }));
    expect(vozDeLaBanda(adn({ favoritos }), { plantilla: 'stage' })).toBe('clasica');
  });
});

describe('fotosIniciales', () => {
  const fotos = [`${CDN}/a.jpg`, `${CDN}/b.jpg`].map((url) => ({ url, origen: 'dossier' as const }));

  it('stories: cada pantalla lleva foto, rotando por las de la banda', () => {
    expect(fotosIniciales('stories', 3, fotos)).toEqual([`${CDN}/a.jpg`, `${CDN}/b.jpg`, `${CDN}/a.jpg`]);
  });

  it('carrusel: solo la portada, para que los pasos y el cierre den ritmo', () => {
    expect(fotosIniciales('carrusel', 4, fotos)).toEqual([`${CDN}/a.jpg`, null, null, null]);
  });

  it('sin fotos, todo en color', () => {
    expect(fotosIniciales('stories', 2, [])).toEqual([null, null]);
  });
});
