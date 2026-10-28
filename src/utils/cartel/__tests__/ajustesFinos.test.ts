import { describe, it, expect } from 'vitest';
import { LIMITES, cajasDeBloques, conAjusteDeBloque, esIdentidad, sanearAjustesFinos, sinAjustesDeFormato } from '../ajustesFinos';
import { calcularLayout, type DatosCartel, type OpcionesLayout, type Composicion } from '../layout';
import { FORMATOS, ORDEN_FORMATOS, dimensiones } from '../formatos';
import { COMPOSICIONES_CARTEL } from '../voces';

const medir = (t: string, px: number, _p: number, titulo?: boolean, tr = 0) => t.length * px * ((titulo ? 0.5 : 0.58) + tr);
const datos: DatosCartel = {
  lineup: [{ nombre: 'Los Pijamas', cabeza: true }],
  fecha: 'SÁB 14 NOV 2026',
  horario: 'PUERTAS 20:30 · SHOW 21:30',
  sala: 'Sala El Sol',
  ciudad: 'Madrid',
  direccion: 'C/ Jardines 3',
  extra: 'Anticipada 10 €',
};
const op = (composicion: Composicion, extra: Partial<OpcionesLayout> = {}): OpcionesLayout => ({ qr: true, urlCorta: 'bandmanager.io/r/ab3k9x2', marca: true, composicion, voz: 'cartel', logos: [1, 3], ...extra });

describe('sanearAjustesFinos', () => {
  it('descarta lo desconocido, los números rotos y la identidad', () => {
    expect(sanearAjustesFinos(null)).toEqual({});
    expect(sanearAjustesFinos('x')).toEqual({});
    expect(sanearAjustesFinos({ feed: { nombre: { dx: 0, dy: 0, escala: 1 } } })).toEqual({});
    expect(sanearAjustesFinos({ hacker: { nombre: { dx: 1, dy: 1, escala: 2 } }, feed: { sistema: { dx: 1 } } })).toEqual({});
    expect(sanearAjustesFinos({ feed: { nombre: { dx: Infinity, dy: NaN, escala: 'x' } } })).toEqual({});
  });

  it('acota el desplazamiento y la escala y redondea', () => {
    const r = sanearAjustesFinos({ feed: { nombre: { dx: 99, dy: -99, escala: 99 }, fecha: { dx: 0.123456, dy: 0, escala: 0.01 } } });
    expect(r.feed?.nombre).toEqual({ dx: LIMITES.desplazamiento, dy: -LIMITES.desplazamiento, escala: LIMITES.escalaMax });
    expect(r.feed?.fecha).toEqual({ dx: 0.123, dy: 0, escala: LIMITES.escalaMin });
  });
});

describe('conAjusteDeBloque / sinAjustesDeFormato', () => {
  it('guarda por formato y quita lo que vuelve a la identidad', () => {
    let t = conAjusteDeBloque({}, 'feed', 'nombre', { dx: 0.1, dy: 0, escala: 1.2 });
    t = conAjusteDeBloque(t, 'imprimir', 'qr', { dx: 0, dy: -0.05, escala: 1 });
    expect(Object.keys(t).sort()).toEqual(['feed', 'imprimir']);
    t = conAjusteDeBloque(t, 'feed', 'nombre', { dx: 0, dy: 0, escala: 1 });
    expect(t.feed).toBeUndefined();
    expect(sinAjustesDeFormato(t, 'imprimir')).toEqual({});
    expect(esIdentidad({ dx: 0, dy: 0, escala: 1 })).toBe(true);
  });
});

describe.each(COMPOSICIONES_CARTEL)('aplicar ajustes · composición %s', (comp) => {
  for (const f of ORDEN_FORMATOS) {
    const def = FORMATOS[f];
    const { ancho } = dimensiones(def);

    it(`${f}: sin ajustes el layout no cambia y trae las cajas de los bloques`, () => {
      const sin = calcularLayout(def, ancho, datos, op(comp), medir);
      const con = calcularLayout(def, ancho, datos, op(comp, { ajustes: {} }), medir);
      expect(con.lineas).toEqual(sin.lineas);
      expect(sin.cajas?.nombre).toBeTruthy();
      expect(sin.cajas?.pie).toBeTruthy();
      expect(sin.cajas?.qr).toBeTruthy();
    });

    it(`${f}: mover y escalar un bloque lo desplaza y escala sin sacarlo del lienzo`, () => {
      const base = calcularLayout(def, ancho, datos, op(comp), medir);
      const L = calcularLayout(def, ancho, datos, op(comp, { ajustes: { nombre: { dx: 0.9, dy: 0.9, escala: 2 }, qr: { dx: -1.4, dy: -1.4, escala: 2.5 }, pie: { dx: 1, dy: 1, escala: 1.5 } } }), medir);
      expect(L.lineas.filter((l) => l.bloque === 'nombre')[0].px).toBeGreaterThan(base.lineas.filter((l) => l.bloque === 'nombre')[0].px);
      for (const bloque of ['nombre', 'qr', 'pie'] as const) {
        const c = L.cajas![bloque]!;
        expect(c.x, bloque).toBeGreaterThanOrEqual(-0.5);
        expect(c.y, bloque).toBeGreaterThanOrEqual(-0.5);
        expect(c.x + c.w, bloque).toBeLessThanOrEqual(ancho + 0.5);
        expect(c.y + c.h, bloque).toBeLessThanOrEqual(L.alto + 0.5);
      }
    });

    it(`${f}: lo que no se ajusta se queda donde estaba`, () => {
      const base = calcularLayout(def, ancho, datos, op(comp), medir);
      const L = calcularLayout(def, ancho, datos, op(comp, { ajustes: { nombre: { dx: 0.1, dy: 0.1, escala: 1.3 } } }), medir);
      expect(L.lineas.filter((l) => l.bloque === 'fecha')).toEqual(base.lineas.filter((l) => l.bloque === 'fecha'));
      expect(L.lineas.filter((l) => l.bloque === 'pie')).toEqual(base.lineas.filter((l) => l.bloque === 'pie'));
      expect(L.qr).toEqual(base.qr);
    });
  }
});

describe('zonas tras ajustar', () => {
  it('si el pie sube, la zona de abajo sube con él (el fondo se mide y se vela donde está el texto)', () => {
    const def = FORMATOS.feed;
    const { ancho } = dimensiones(def);
    const base = calcularLayout(def, ancho, datos, op('base'), medir);
    const L = calcularLayout(def, ancho, datos, op('base', { ajustes: { pie: { dx: 0, dy: -0.9, escala: 1 } } }), medir);
    expect(L.zonas.abajo.y).toBeLessThan(base.zonas.abajo.y);
  });
});

describe('cajasDeBloques', () => {
  it('une las líneas de cada bloque y los logos en una caja', () => {
    const def = FORMATOS.feed;
    const { ancho } = dimensiones(def);
    const L = calcularLayout(def, ancho, datos, op('ventana'), medir);
    const cajas = cajasDeBloques(L, medir);
    expect(cajas.logos?.w).toBeGreaterThan(0);
    const nombre = L.lineas.filter((l) => l.bloque === 'nombre');
    expect(cajas.nombre!.y).toBe(Math.min(...nombre.map((l) => l.y)));
  });
});
