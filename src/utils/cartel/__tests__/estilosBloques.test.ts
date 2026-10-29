import { describe, it, expect } from 'vitest';
import { conEstiloDeBloque, sanearEstilosBloques } from '../ajustesFinos';
import { calcularLayout, type DatosCartel, type Medidor, type OpcionesLayout } from '../layout';
import { FORMATOS, ORDEN_FORMATOS, dimensiones } from '../formatos';
import { sanearConfigCartel, CONFIG_INICIAL } from '../config';
import { VOCES, type VozCartel } from '../voces';

// Cada letra mide distinto: así se comprueba que cambiar de letra conserva el ancho del bloque.
const ANCHO_LETRA: Record<VozCartel, number> = { moderna: 0.62, cartel: 0.38, clasica: 0.5 };
const medir: Medidor = (t, px, _p, titulo, tr = 0) => t.length * px * ((titulo === true ? 0.5 : typeof titulo === 'string' ? ANCHO_LETRA[titulo] : 0.58) + tr);
const datos: DatosCartel = {
  lineup: [{ nombre: 'Los Pijamas', cabeza: true }],
  fecha: 'SÁB 14 NOV 2026',
  horario: 'PUERTAS 20:30 · SHOW 21:30',
  sala: 'Sala El Sol',
  ciudad: 'Madrid',
  direccion: 'C/ Jardines 3',
  extra: 'Anticipada 10 €',
};
const op = (extra: Partial<OpcionesLayout> = {}): OpcionesLayout => ({ qr: true, urlCorta: 'bandmanager.io/r/ab3k9x2', marca: true, composicion: 'ventana', voz: 'cartel', logos: [1, 3], ...extra });
const def = FORMATOS.feed;
const { ancho } = dimensiones(def);

describe('sanearEstilosBloques', () => {
  it('descarta lo desconocido y lo que no vale para ese bloque', () => {
    expect(sanearEstilosBloques(null)).toEqual({});
    expect(sanearEstilosBloques({ hacker: { oculto: true } })).toEqual({});
    expect(sanearEstilosBloques({ nombre: { fuente: 'comic', color: 'rojo', oculto: 'si' } })).toEqual({});
    // El QR no cambia de letra ni de color (dejaría de escanearse); los logos no tienen letra.
    expect(sanearEstilosBloques({ qr: { fuente: 'cartel', color: '#ff0000', oculto: true }, logos: { fuente: 'cartel', color: '#00ff00' } })).toEqual({ qr: { oculto: true }, logos: { color: '#00ff00' } });
  });

  it('acepta letra, color hexadecimal (en minúsculas) y ocultar', () => {
    expect(sanearEstilosBloques({ nombre: { fuente: 'clasica', color: '#FFD166', oculto: true } })).toEqual({ nombre: { fuente: 'clasica', color: '#ffd166', oculto: true } });
  });

  it('un color con código no pasa', () => {
    expect(sanearEstilosBloques({ nombre: { color: 'url(javascript:1)' } })).toEqual({});
    expect(sanearEstilosBloques({ nombre: { color: '#fff' } })).toEqual({});
  });
});

describe('conEstiloDeBloque', () => {
  it('cambia un campo, quita otro con undefined y borra el bloque vacío', () => {
    let t = conEstiloDeBloque({}, 'nombre', { color: '#ffffff', fuente: 'cartel' });
    t = conEstiloDeBloque(t, 'nombre', { color: undefined });
    expect(t).toEqual({ nombre: { fuente: 'cartel' } });
    expect(conEstiloDeBloque(t, 'nombre', { fuente: undefined })).toEqual({});
  });
});

describe('estilos en el layout', () => {
  for (const f of ORDEN_FORMATOS) {
    const d = FORMATOS[f];
    const an = dimensiones(d).ancho;

    it(`${f}: ocultar un bloque lo quita de líneas, cajas y QR`, () => {
      const base = calcularLayout(d, an, datos, op(), medir);
      const L = calcularLayout(d, an, datos, op({ estilos: { pie: { oculto: true }, qr: { oculto: true }, logos: { oculto: true } } }), medir);
      expect(L.lineas.some((l) => l.bloque === 'pie')).toBe(false);
      expect(L.qr).toBeNull();
      expect(L.logos).toEqual([]);
      expect(L.cajas?.pie).toBeUndefined();
      expect(L.lineas.filter((l) => l.bloque === 'fecha')).toEqual(base.lineas.filter((l) => l.bloque === 'fecha'));
    });
  }

  it('otra letra: las líneas la llevan y el bloque mantiene su ancho', () => {
    const base = calcularLayout(def, ancho, datos, op(), medir);
    const L = calcularLayout(def, ancho, datos, op({ estilos: { nombre: { fuente: 'moderna' } } }), medir);
    const nombre = L.lineas.filter((l) => l.bloque === 'nombre');
    expect(nombre.length).toBeGreaterThan(0);
    expect(nombre.every((l) => l.voz === 'moderna' && l.peso === VOCES.moderna.peso)).toBe(true);
    const anchoBase = base.cajas!.nombre!.w;
    expect(Math.abs(L.cajas!.nombre!.w - anchoBase) / anchoBase).toBeLessThan(0.05);
  });

  it('el color solo se pone en las líneas de ese bloque', () => {
    const L = calcularLayout(def, ancho, datos, op({ estilos: { fecha: { color: '#e63946' } } }), medir);
    expect(L.lineas.filter((l) => l.bloque === 'fecha').every((l) => l.color === '#e63946')).toBe(true);
    expect(L.lineas.filter((l) => l.bloque !== 'fecha').some((l) => l.color)).toBe(false);
  });

  it('sin estilos el layout es el de siempre', () => {
    expect(calcularLayout(def, ancho, datos, op({ estilos: {} }), medir)).toEqual(calcularLayout(def, ancho, datos, op(), medir));
  });
});

describe('estilos en la config guardada', () => {
  it('viajan en cartel_config y se sanean', () => {
    const c = sanearConfigCartel({ v: 1, estilos: { nombre: { color: '#112233', fuente: 'cartel' }, qr: { color: '#ff0000' } } }, () => true);
    expect(c?.estilos).toEqual({ nombre: { color: '#112233', fuente: 'cartel' } });
    expect(CONFIG_INICIAL.estilos).toEqual({});
  });
});
