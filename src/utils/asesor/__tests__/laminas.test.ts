import { describe, expect, it } from 'vitest';
import { contraste, luminancia } from '../../cartel/contraste';
import { deHex } from '../../cartel/paleta';
import { alturasOnda, disenoDe, laminasDePieza, nombreArchivoLamina, opcionesPaleta } from '../laminas';
import type { Pieza } from '../pieza';

const pieza = (cambios: Partial<Pieza>): Pieza => ({
  formato: 'carrusel', gancho: 'Lo que vais a escuchar el sábado', cta: 'Entradas en la bio', portada: '',
  pasos: [{ titulo: 'Abrimos con Ruta 66', detalle: 'foto del local' }, { titulo: '', detalle: 'solo foto' }, { titulo: 'Y cerramos con la nueva', detalle: '' }],
  textos: [{ red: 'instagram', texto: 'x', hashtags: [] }], ...cambios,
});

describe('laminasDePieza', () => {
  it('carrusel: portada con el gancho, un paso por slide con texto y cierre con la llamada a la acción', () => {
    const l = laminasDePieza(pieza({}));
    expect(l.map((x) => x.papel)).toEqual(['portada', 'paso', 'paso', 'cierre']);
    expect(l[0].texto).toBe('Lo que vais a escuchar el sábado');
    expect(l[3]).toMatchObject({ texto: 'Entradas en la bio', numero: 4, total: 4 });
  });

  it('nunca escribe el detalle (es la foto que va detrás)', () => {
    expect(laminasDePieza(pieza({})).some((x) => x.texto.includes('foto'))).toBe(false);
  });

  it('stories: una por pantalla, y el gancho si no hay pantallas', () => {
    expect(laminasDePieza(pieza({ formato: 'stories' })).map((x) => x.texto)).toEqual(['Abrimos con Ruta 66', 'Y cerramos con la nueva']);
    expect(laminasDePieza(pieza({ formato: 'stories', pasos: [] })).map((x) => x.texto)).toEqual(['Lo que vais a escuchar el sábado']);
  });

  it('reels y posts no tienen láminas', () => {
    expect(laminasDePieza(pieza({ formato: 'reel' }))).toEqual([]);
    expect(laminasDePieza(pieza({ formato: 'post' }))).toEqual([]);
  });
});

describe('disenoDe', () => {
  it('elige la tinta que más se lee, y al menos con 4,5:1 en las paletas de serie', () => {
    for (const p of opcionesPaleta(null)) {
      const d = disenoDe(p);
      expect(contraste(luminancia(...deHex(d.tinta)), luminancia(...deHex(p.fondo)))).toBeGreaterThanOrEqual(4.5);
    }
    expect(disenoDe({ fondo: '#F2C230', acento: '#1B1B1F' }).tinta).toBe('#17181C');
  });

  it('«Tus colores» va primero cuando hay logo', () => {
    expect(opcionesPaleta({ fondo: '#112233', acento: '#FFAA00' })[0].id).toBe('banda');
  });
});

describe('alturasOnda y nombres', () => {
  it('la misma semilla da siempre la misma Onda, dentro de 0..1', () => {
    expect(alturasOnda('ruta 66')).toEqual(alturasOnda('ruta 66'));
    expect(alturasOnda('ruta 66')).not.toEqual(alturasOnda('otra'));
    expect(alturasOnda('x').every((h) => h > 0 && h <= 1)).toBe(true);
  });

  it('nombres de archivo sin tildes ni espacios', () => {
    expect(nombreArchivoLamina('Ruta 66 · Órbita', 'carrusel', 2)).toBe('ruta-66-orbita-carrusel-2.png');
  });
});
