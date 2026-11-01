import { describe, expect, it } from 'vitest';
import { diaMes, LIMITE_BIO, LIMITE_NOMBRE_INSTAGRAM, nombreInstagram, opcionesBio, palabrasClave, primerValor, type DatosSeo } from '../seo';

const datos = (extra: Partial<DatosSeo> = {}): DatosSeo => ({ nombre: 'Ruta 66', genero: 'Rock / Blues', ciudad: 'Madrid, España', proximoBolo: null, ...extra });

describe('utilidades', () => {
  it('coge el primer valor de una lista escrita a mano', () => {
    expect(primerValor('Rock / Blues')).toBe('Rock');
    expect(primerValor('Madrid, España')).toBe('Madrid');
    expect(primerValor('  indie   pop ')).toBe('indie pop');
    expect(primerValor('')).toBe('');
  });
  it('escribe el día como en una bio', () => {
    expect(diaMes('2026-11-04')).toBe('4 nov');
    expect(diaMes('2026-12-31')).toBe('31 dic');
  });
});

describe('palabrasClave', () => {
  it('con género y ciudad salen las frases con las que os buscan', () => {
    const frases = palabrasClave(datos()).map((p) => p.frase);
    expect(frases).toEqual(expect.arrayContaining(['rock Madrid', 'banda de rock en Madrid', 'conciertos de rock en Madrid', 'música en directo en Madrid']));
    expect(new Set(frases).size).toBe(frases.length);
  });
  it('con el próximo bolo suma la sala', () => {
    expect(palabrasClave(datos({ proximoBolo: { sala: 'Oktoberfest', fecha: '2026-11-04' } })).map((p) => p.frase)).toContain('conciertos Oktoberfest Madrid');
  });
  it('sin ciudad o sin género da lo que se puede, y sin nada no inventa', () => {
    expect(palabrasClave(datos({ ciudad: '' })).map((p) => p.frase)).toEqual(['banda de rock', 'conciertos de rock']);
    expect(palabrasClave(datos({ genero: '' })).map((p) => p.frase)).toEqual(['música en directo en Madrid']);
    expect(palabrasClave(datos({ genero: '', ciudad: '' }))).toEqual([]);
  });
});

describe('nombreInstagram', () => {
  it('lleva género y ciudad, y nunca pasa de 64 caracteres', () => {
    expect(nombreInstagram(datos())).toBe('Ruta 66 | Rock Madrid');
    expect(nombreInstagram(datos({ nombre: 'Los Increíbles Gatos del Callejón Sin Salida de Madrid' })).length).toBeLessThanOrEqual(LIMITE_NOMBRE_INSTAGRAM);
    expect(nombreInstagram(datos({ genero: '', ciudad: '' }))).toBe('Ruta 66');
  });
});

describe('opcionesBio', () => {
  it('Instagram: directa, y con el próximo bolo cuando lo hay; todas caben', () => {
    expect(opcionesBio('instagram', datos()).map((o) => o.etiqueta)).toEqual(['Directa']);
    const con = opcionesBio('instagram', datos({ proximoBolo: { sala: 'Oktoberfest', fecha: '2026-11-04' }, fraseImpacto: 'Rock de furgoneta, directo de sudor' }));
    expect(con.map((o) => o.etiqueta)).toEqual(['Directa', 'Con el próximo bolo', 'Con vuestra frase']);
    expect(con[1].texto).toBe('Rock desde Madrid\nPróximo bolo: Oktoberfest, 4 nov\nEntradas en el enlace');
    for (const o of con) {
      expect(o.caracteres).toBe(o.texto.length);
      expect(o.caracteres).toBeLessThanOrEqual(LIMITE_BIO.instagram);
    }
  });

  it('TikTok: 80 caracteres como mucho, quitando líneas antes que cortando palabras', () => {
    const o = opcionesBio('tiktok', datos({ proximoBolo: { sala: 'Sala El Sol de los Domingos Por La Tarde y de los Sábados Por La Noche', fecha: '2026-11-04' } }));
    for (const x of o) expect(x.caracteres).toBeLessThanOrEqual(LIMITE_BIO.tiktok);
    expect(o[1].texto).toBe('Rock desde Madrid');
  });

  it('una frase de impacto larguísima se recorta en una palabra entera', () => {
    const o = opcionesBio('tiktok', datos({ fraseImpacto: 'Un grupo de rock que lleva tres años tocando en la misma sala sin parar ni un solo fin de semana' }));
    const frase = o.find((x) => x.etiqueta === 'Con vuestra frase')!;
    expect(frase.caracteres).toBeLessThanOrEqual(80);
    expect(frase.texto.endsWith(' ')).toBe(false);
  });

  it('YouTube: descripción en párrafos, con el enlace con seguimiento si existe', () => {
    const [directa] = opcionesBio('youtube', datos({ enlaceYoutube: 'https://bandmanager.io/r/abc2345' }));
    expect(directa.texto).toContain('Ruta 66 es una banda de rock de Madrid.');
    expect(directa.texto).toContain('Fechas y entradas: https://bandmanager.io/r/abc2345');
    expect(opcionesBio('youtube', datos())[0].texto).not.toContain('Fechas y entradas');
    expect(directa.caracteres).toBeLessThanOrEqual(LIMITE_BIO.youtube);
  });

  it('sin género ni ciudad no hay bio que inventar (solo la de la frase, si existe)', () => {
    expect(opcionesBio('instagram', datos({ genero: '', ciudad: '' }))).toEqual([]);
    expect(opcionesBio('instagram', datos({ genero: '', ciudad: '', fraseImpacto: 'Directo de sudor' })).map((o) => o.etiqueta)).toEqual(['Con vuestra frase']);
  });
});
