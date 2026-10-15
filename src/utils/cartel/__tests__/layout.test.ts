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
