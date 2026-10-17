import { describe, it, expect } from 'vitest';
import { calcularLayout, TEXTO_MARCA, type DatosCartel, type OpcionesLayout, type Linea } from '../layout';
import { FORMATOS, ORDEN_FORMATOS, dimensiones } from '../formatos';

// Medidor falso y estable: cada carácter mide 0,6 veces el cuerpo.
const medir = (t: string, px: number) => t.length * px * 0.6;
const ancho = (l: Linea) => medir(l.texto, l.px);

const datos = (over: Partial<DatosCartel> = {}): DatosCartel => ({
  lineup: [{ nombre: 'Los Pijamas', cabeza: true }],
  fecha: 'SÁB 14 NOV 2026',
  horario: 'PUERTAS 20:30 · SHOW 21:30',
  sala: 'Sala El Sol',
  ciudad: 'Madrid',
  extra: 'Anticipada 10 €',
  ...over,
});
const sinNada: OpcionesLayout = { qr: false, urlCorta: null, marca: false };
const todo: OpcionesLayout = { qr: true, urlCorta: 'bandmanager.io/r/ab3k9x2', marca: true };

describe('calcularLayout', () => {
  for (const f of ORDEN_FORMATOS) {
    const def = FORMATOS[f];
    for (const op of [sinNada, todo]) {
      it(`${f} ${op.qr ? 'con' : 'sin'} extras: todo dentro del lienzo y sin pisarse`, () => {
        const { ancho: w } = dimensiones(def);
        const L = calcularLayout(def, w, datos(), op, medir);
        for (const l of L.lineas) {
          const izq = l.alinear === 'left' ? l.x : l.x - ancho(l);
          expect(izq).toBeGreaterThanOrEqual(0);
          expect(izq + ancho(l)).toBeLessThanOrEqual(w + 0.5);
          expect(l.y).toBeGreaterThanOrEqual(0);
          expect(l.y + l.px).toBeLessThanOrEqual(L.alto);
        }
        // El bloque de nombres termina antes de que empiecen los datos.
        expect(L.zonas.arriba.y + L.zonas.arriba.h).toBeLessThanOrEqual(L.zonas.abajo.y + 1);
      });
    }
  }

  it('el QR no pisa ningún texto', () => {
    const def = FORMATOS.imprimir;
    const L = calcularLayout(def, def.ancho, datos(), todo, medir);
    const q = L.qr!;
    expect(q).not.toBeNull();
    for (const l of L.lineas) {
      const izq = l.alinear === 'left' ? l.x : l.x - ancho(l);
      const solapa = izq < q.x + q.w && izq + ancho(l) > q.x && l.y < q.y + q.h && l.y + l.px > q.y;
      expect(solapa, `"${l.texto}" pisa el QR`).toBe(false);
    }
  });

  it('en una historia respeta las franjas que tapa Instagram', () => {
    const def = FORMATOS.historia;
    const L = calcularLayout(def, 1080, datos(), todo, medir);
    const ys = L.lineas.map((l) => l.y);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(def.seguroArriba * L.alto);
    expect(Math.max(...L.lineas.map((l) => l.y + l.px))).toBeLessThanOrEqual(L.alto * (1 - def.seguroAbajo));
  });

  it('bolo compartido: la cabeza de cartel va más grande que el resto', () => {
    const L = calcularLayout(FORMATOS.feed, 1080, datos({
      lineup: [{ nombre: 'Teloneros', cabeza: false }, { nombre: 'Cabeza', cabeza: true }, { nombre: 'Invitada', cabeza: false }],
    }), sinNada, medir);
    const cabeza = L.lineas.find((l) => l.texto.includes('CABEZA'))!;
    const resto = L.lineas.find((l) => l.texto.startsWith('CON'))!;
    expect(resto.texto).toBe('CON TELONEROS · INVITADA');
    expect(cabeza.px).toBeGreaterThan(resto.px * 1.5);
    expect(cabeza.y).toBeLessThan(resto.y);
  });

  it('sin cabeza de cartel todas van juntas al mismo tamaño', () => {
    const L = calcularLayout(FORMATOS.feed, 1080, datos({
      lineup: [{ nombre: 'Uno', cabeza: false }, { nombre: 'Dos', cabeza: false }],
    }), sinNada, medir);
    const titular = L.lineas.filter((l) => l.peso === 800 && l.y < L.alto / 2).map((l) => l.texto).join(' ');
    expect(titular).toBe('UNO + DOS');
    expect(L.lineas.some((l) => l.texto.startsWith('CON'))).toBe(false);
  });

  it('un nombre larguísimo encoge hasta caber', () => {
    const L = calcularLayout(FORMATOS.feed, 1080, datos({
      lineup: [{ nombre: 'La Orquesta Sinfónica Experimental de Cacharros Reciclados', cabeza: true }],
    }), sinNada, medir);
    const titular = L.lineas.filter((l) => l.peso === 800 && l.y < L.alto / 2);
    expect(titular.length).toBeLessThanOrEqual(3);
    expect(titular[0].px).toBeLessThan(150);
    for (const l of titular) expect(medir(l.texto, l.px)).toBeLessThanOrEqual(1080 - 144 + 0.5);
  });

  it('la marca y la URL corta salen solo si se piden', () => {
    const con = calcularLayout(FORMATOS.feed, 1080, datos(), { qr: false, urlCorta: 'bandmanager.io/r/x', marca: true }, medir);
    expect(con.lineas.some((l) => l.texto === TEXTO_MARCA)).toBe(true);
    expect(con.lineas.some((l) => l.texto === 'bandmanager.io/r/x' && l.alinear === 'right')).toBe(true);
    const sin = calcularLayout(FORMATOS.feed, 1080, datos(), sinNada, medir);
    expect(sin.lineas.some((l) => l.texto === TEXTO_MARCA)).toBe(false);
  });

  it('un nombre corto crece hasta llenar el ancho', () => {
    const L = calcularLayout(FORMATOS.feed, 1080, datos({ lineup: [{ nombre: 'Ñu', cabeza: true }] }), sinNada, medir);
    expect(L.lineas[0].px).toBeGreaterThan(180);
  });

  it('en un bolo compartido nunca parte el nombre de una banda', () => {
    const L = calcularLayout(FORMATOS.feed, 1080, datos({
      lineup: [{ nombre: 'Cabeza', cabeza: true }, { nombre: 'Los Pijamas', cabeza: false }, { nombre: 'Invitada Sorpresa', cabeza: false }, { nombre: 'Otra Más', cabeza: false }],
    }), sinNada, medir);
    const resto = L.lineas.filter((l) => l.peso === 700 && l.y < L.alto / 2).map((l) => l.texto).join(' | ');
    expect(resto).not.toMatch(/INVITADA \| SORPRESA|OTRA \| MÁS|LOS \| PIJAMAS/);
  });

  it('los campos vacíos no dejan huecos ni líneas en blanco', () => {
    const L = calcularLayout(FORMATOS.feed, 1080, datos({ horario: '', extra: '', ciudad: '' }), sinNada, medir);
    expect(L.lineas.every((l) => l.texto.trim().length > 0)).toBe(true);
    expect(L.lineas.some((l) => l.texto === 'SALA EL SOL')).toBe(true);
  });

  it('el diseño escala: la vista previa a 1080 y el A4 a 2480 son el mismo cartel', () => {
    const def = FORMATOS.imprimir;
    const a = calcularLayout(def, 1080, datos(), todo, medir);
    const b = calcularLayout(def, 2480, datos(), todo, medir);
    const k = 2480 / 1080;
    expect(b.lineas.map((l) => l.texto)).toEqual(a.lineas.map((l) => l.texto));
    expect(b.lineas[0].px / a.lineas[0].px).toBeCloseTo(k, 1);
    expect(b.qr!.w / a.qr!.w).toBeCloseTo(k, 1);
  });
});

describe('fila de logos', () => {
  const conLogos = (aspectos: number[], qr = false): OpcionesLayout => ({ qr, urlCorta: null, marca: true, logos: aspectos });
  const solapan = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  for (const f of ORDEN_FORMATOS) {
    for (const qr of [false, true]) {
      it(`${f}${qr ? ' con QR' : ''}: los logos caben, no pisan texto ni QR y quedan en la zona de abajo`, () => {
        const def = FORMATOS[f];
        const { ancho: w } = dimensiones(def);
        const L = calcularLayout(def, w, datos({ lineup: [{ nombre: 'La Orquesta Sinfónica Experimental', cabeza: true }, { nombre: 'Los Pijamas', cabeza: false }] }), conLogos([1, 3, 0.8, 4, 1.5], qr), medir);
        expect(L.logos).toHaveLength(5);
        for (const g of L.logos) {
          expect(g.x).toBeGreaterThanOrEqual(0);
          expect(g.x + g.w).toBeLessThanOrEqual(w);
          expect(g.y).toBeGreaterThanOrEqual(L.zonas.abajo.y);
          expect(g.y + g.h).toBeLessThanOrEqual(L.alto);
          if (L.qr) expect(solapan(g, L.qr)).toBe(false);
          for (const l of L.lineas) {
            const izq = l.alinear === 'left' ? l.x : l.x - ancho(l);
            expect(solapan(g, { x: izq, y: l.y, w: ancho(l), h: l.px }), `"${l.texto}" pisa un logo`).toBe(false);
          }
        }
      });
    }
  }

  it('sin logos no hay fila ni cambia nada de lo demás', () => {
    const sin = calcularLayout(FORMATOS.feed, 1080, datos(), todo, medir);
    expect(sin.logos).toEqual([]);
    expect(calcularLayout(FORMATOS.feed, 1080, datos(), { ...todo, logos: [] }, medir).zonas).toEqual(sin.zonas);
  });

  it('van en orden, de izquierda a derecha, sin pisarse y centrados en la misma línea', () => {
    const L = calcularLayout(FORMATOS.feed, 1080, datos(), conLogos([1, 3, 0.6]), medir);
    const c = L.logos.map((g) => g.y + g.h / 2);
    expect(Math.max(...c) - Math.min(...c)).toBeLessThan(1);
    for (let i = 1; i < L.logos.length; i++) expect(L.logos[i].x).toBeGreaterThan(L.logos[i - 1].x + L.logos[i - 1].w);
  });

  it('cada hueco respeta la proporción del logo', () => {
    const L = calcularLayout(FORMATOS.feed, 1080, datos(), conLogos([1, 2, 0.5]), medir);
    expect(L.logos[0].w / L.logos[0].h).toBeCloseTo(1, 1);
    expect(L.logos[1].w / L.logos[1].h).toBeCloseTo(2, 1);
    expect(L.logos[2].w / L.logos[2].h).toBeCloseTo(0.5, 1);
  });

  it('un logo muy apaisado y uno cuadrado pesan parecido: superficie similar, no la misma altura', () => {
    const L = calcularLayout(FORMATOS.feed, 1080, datos(), conLogos([1, 2.2]), medir);
    const [a, b] = L.logos.map((g) => g.w * g.h);
    expect(b / a).toBeGreaterThan(0.8);
    expect(b / a).toBeLessThan(1.25);
    expect(L.logos[1].h).toBeLessThan(L.logos[0].h);
  });

  it('si no caben en el ancho útil se reducen todos por igual, sin salirse', () => {
    const L = calcularLayout(FORMATOS.feed, 1080, datos(), conLogos([2.4, 2.4, 2.4, 2.4, 2.4]), medir);
    const fin = L.logos[4].x + L.logos[4].w;
    expect(fin).toBeLessThanOrEqual(1080 - 72 + 0.5);
    expect(new Set(L.logos.map((g) => Math.round(g.w))).size).toBe(1);
  });

  it('como mucho 5 logos, y los aspectos inválidos no rompen nada', () => {
    expect(calcularLayout(FORMATOS.feed, 1080, datos(), conLogos([1, 1, 1, 1, 1, 1, 1]), medir).logos).toHaveLength(5);
    expect(calcularLayout(FORMATOS.feed, 1080, datos(), conLogos([0, -1, NaN, Infinity, 1]), medir).logos).toHaveLength(1);
  });

  it('en una historia la fila respeta la franja segura de abajo', () => {
    const def = FORMATOS.historia;
    const L = calcularLayout(def, 1080, datos(), conLogos([1, 2]), medir);
    for (const g of L.logos) expect(g.y + g.h).toBeLessThanOrEqual(L.alto - def.seguroAbajo * L.alto + 0.5);
  });
});

describe('modo compacto (con ilustración de IA)', () => {
  const compacto: OpcionesLayout = { ...sinNada, compacto: true };
  const nombre = (L: ReturnType<typeof calcularLayout>) => L.lineas[0];

  it('el nombre se hace menos grande para dejar sitio a la ilustración, nunca más', () => {
    for (const f of ORDEN_FORMATOS) {
      const def = FORMATOS[f];
      const { ancho: w } = dimensiones(def);
      const normal = calcularLayout(def, w, datos({ lineup: [{ nombre: 'Ruta', cabeza: true }] }), sinNada, medir);
      const c = calcularLayout(def, w, datos({ lineup: [{ nombre: 'Ruta', cabeza: true }] }), compacto, medir);
      expect(nombre(c).px).toBeLessThan(nombre(normal).px);
      expect(nombre(c).px).toBeLessThanOrEqual(Math.round(150 * (w / 1080)));
      expect(c.zonas.arriba.h).toBeLessThan(normal.zonas.arriba.h);
    }
  });

  it('sin pedirlo no cambia nada, y un nombre ya pequeño tampoco se toca', () => {
    const a = calcularLayout(FORMATOS.feed, 1080, datos(), sinNada, medir);
    const b = calcularLayout(FORMATOS.feed, 1080, datos(), { ...sinNada, compacto: false }, medir);
    expect(b.lineas.map((l) => l.px)).toEqual(a.lineas.map((l) => l.px));
    const largo = datos({ lineup: [{ nombre: 'La Orquesta Sinfónica Experimental del Norte', cabeza: true }] });
    expect(nombre(calcularLayout(FORMATOS.feed, 1080, largo, compacto, medir)).px).toBe(nombre(calcularLayout(FORMATOS.feed, 1080, largo, sinNada, medir)).px);
  });
});
