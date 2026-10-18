import { describe, it, expect } from 'vitest';
import { calcularLayout, type DatosCartel, type Linea, type OpcionesLayout, type Rect, type Composicion } from '../layout';
import { FORMATOS, ORDEN_FORMATOS, dimensiones } from '../formatos';
import { COMPOSICIONES_CARTEL, ELECCIONES_COMPOSICION, ETIQUETA_COMPOSICION, VOCES_CARTEL, resolverComposicion } from '../voces';

const medir = (t: string, px: number, _p: number, titulo?: boolean, tr = 0) => t.length * px * ((titulo ? 0.5 : 0.58) + tr);
const caja = (l: Linea): Rect => {
  const w = medir(l.texto, l.px, l.peso, l.titulo, l.tracking);
  const x = l.alinear === 'left' ? l.x : l.alinear === 'right' ? l.x - w : l.x - w / 2;
  return { x, y: l.y, w, h: l.px * 0.8 };
};
const solapan = (a: Rect, b: Rect) => a.x < b.x + b.w - 0.5 && a.x + a.w > b.x + 0.5 && a.y < b.y + b.h - 0.5 && a.y + a.h > b.y + 0.5;

const datos = (over: Partial<DatosCartel> = {}): DatosCartel => ({
  lineup: [{ nombre: 'Los Pijamas', cabeza: true }],
  fecha: 'SÁB 14 NOV 2026',
  horario: 'PUERTAS 20:30 · SHOW 21:30',
  sala: 'Sala El Sol',
  ciudad: 'Madrid',
  extra: 'Anticipada 10 €',
  ...over,
});
const op = (composicion: Composicion, extra: Partial<OpcionesLayout> = {}): OpcionesLayout => ({ qr: false, urlCorta: 'bandmanager.io/r/ab3k9x2', marca: true, composicion, voz: 'cartel', ...extra });

const casos: Array<[string, DatosCartel, Partial<OpcionesLayout>]> = [
  ['nombre corto', datos(), {}],
  ['con QR y logos', datos(), { qr: true, logos: [1, 3, 0.8] }],
  ['nombre largo', datos({ lineup: [{ nombre: 'La Orquesta Sinfónica Experimental del Norte', cabeza: true }] }), { qr: true }],
  ['bolo compartido', datos({ lineup: [{ nombre: 'Cabeza', cabeza: true }, { nombre: 'Invitada Sorpresa', cabeza: false }] }), {}],
  ['con ilustración', datos(), { compacto: true, logos: [1] }],
  ['sin extras', datos({ horario: '', extra: '', ciudad: '' }), {}],
];

describe.each(COMPOSICIONES_CARTEL)('composición %s', (comp) => {
  for (const f of ORDEN_FORMATOS) {
    for (const [nombre, d, extra] of casos) {
      it(`${f} · ${nombre}: todo dentro del lienzo, sin pisarse y con las zonas en orden`, () => {
        const def = FORMATOS[f];
        const { ancho: w } = dimensiones(def);
        const L = calcularLayout(def, w, d, op(comp, extra), medir);
        const cajas = L.lineas.map((l) => ({ l, r: caja(l) }));
        for (const { l, r } of cajas) {
          expect(r.x, `"${l.texto}" a la izquierda`).toBeGreaterThanOrEqual(-0.5);
          expect(r.x + r.w, `"${l.texto}" a la derecha`).toBeLessThanOrEqual(w + 0.5);
          expect(r.y, `"${l.texto}" arriba`).toBeGreaterThanOrEqual(0);
          expect(l.y + l.px * 0.8, `"${l.texto}" abajo`).toBeLessThanOrEqual(L.alto);
        }
        for (let i = 0; i < cajas.length; i++) {
          for (let j = i + 1; j < cajas.length; j++) {
            expect(solapan(cajas[i].r, cajas[j].r), `"${cajas[i].l.texto}" pisa "${cajas[j].l.texto}"`).toBe(false);
          }
        }
        for (const g of L.logos) {
          expect(g.x).toBeGreaterThanOrEqual(0);
          expect(g.x + g.w).toBeLessThanOrEqual(w + 0.5);
          expect(g.y + g.h).toBeLessThanOrEqual(L.alto);
          for (const { l, r } of cajas) expect(solapan(g, r), `un logo pisa "${l.texto}"`).toBe(false);
          if (L.qr) expect(solapan(g, L.qr)).toBe(false);
        }
        if (L.qr) {
          expect(L.qr.x + L.qr.w).toBeLessThanOrEqual(w + 0.5);
          expect(L.qr.y + L.qr.h).toBeLessThanOrEqual(L.alto);
          for (const { l, r } of cajas) expect(solapan(L.qr, r), `el QR pisa "${l.texto}"`).toBe(false);
        }
        for (const a of L.adornos) {
          expect(a.x).toBeGreaterThanOrEqual(0);
          expect(a.x + a.w).toBeLessThanOrEqual(w);
          expect(a.y).toBeGreaterThanOrEqual(0);
          expect(a.y).toBeLessThanOrEqual(L.alto);
        }
        // Las zonas: la de arriba termina donde empieza la de abajo (la ilustración va en medio).
        expect(L.zonas.arriba.y + L.zonas.arriba.h).toBeLessThanOrEqual(L.zonas.abajo.y + 1);
      });
    }
  }

  it('lleva el nombre en la letra de exhibición y respeta la caja del nombre', () => {
    const L = calcularLayout(FORMATOS.feed, 1080, datos(), op(comp), medir);
    const titulos = L.lineas.filter((l) => l.titulo && l.texto !== '14');
    expect(titulos.length).toBeGreaterThan(0);
    expect(L.titulo).not.toBeNull();
    for (const t of titulos) {
      expect(t.y).toBeGreaterThanOrEqual(L.titulo!.y - 0.5);
      expect(t.y).toBeLessThanOrEqual(L.titulo!.y + L.titulo!.h + 0.5);
    }
  });

  it('la fecha lleva el día enorme y sin partir la información', () => {
    const L = calcularLayout(FORMATOS.feed, 1080, datos(), op(comp), medir);
    const dia = L.lineas.find((l) => l.texto === '14')!;
    expect(dia?.titulo).toBe(true);
    expect(L.lineas.some((l) => l.texto === 'NOV 2026')).toBe(true);
    expect(L.lineas.some((l) => l.texto.startsWith('PUERTAS'))).toBe(true);
    expect(L.lineas.some((l) => l.texto.includes('SALA EL SOL'))).toBe(true);
  });

  it('sigue habiendo marca y enlace corto cuando se piden', () => {
    const L = calcularLayout(FORMATOS.feed, 1080, datos(), op(comp), medir);
    expect(L.lineas.some((l) => l.texto === 'Hecho con BandManager.io')).toBe(true);
    expect(L.lineas.some((l) => l.texto === 'bandmanager.io/r/ab3k9x2')).toBe(true);
  });
});

describe('cada composición es distinta', () => {
  it('reparte las piezas de forma distinta (no es la misma con otro nombre)', () => {
    const huellas = COMPOSICIONES_CARTEL.map((c) => {
      const L = calcularLayout(FORMATOS.feed, 1080, datos(), op(c), medir);
      return JSON.stringify(L.lineas.map((l) => [l.texto, Math.round(l.x), Math.round(l.y), l.alinear]));
    });
    expect(new Set(huellas).size).toBe(COMPOSICIONES_CARTEL.length);
  });

  it('la centrada centra el nombre y lleva filetes con rombo; la clásica y la base no llevan', () => {
    const c = calcularLayout(FORMATOS.feed, 1080, datos(), op('centrada'), medir);
    expect(c.lineas.filter((l) => l.titulo && l.texto !== '14').every((l) => l.alinear === 'center' && l.x === 540)).toBe(true);
    expect(c.adornos.length).toBeGreaterThanOrEqual(2);
    expect(c.adornos.every((a) => a.rombo)).toBe(true);
    for (const k of ['ventana', 'base'] as const) expect(calcularLayout(FORMATOS.feed, 1080, datos(), op(k), medir).adornos).toEqual([]);
  });

  it('la base pone el nombre ABAJO y la fecha arriba; la clásica al revés', () => {
    const base = calcularLayout(FORMATOS.feed, 1080, datos(), op('base'), medir);
    const nombreBase = base.lineas.find((l) => l.titulo && l.texto !== '14')!;
    const diaBase = base.lineas.find((l) => l.texto === '14')!;
    expect(nombreBase.y).toBeGreaterThan(diaBase.y);
    expect(nombreBase.y).toBeGreaterThan(base.alto * 0.5);
    const clasica = calcularLayout(FORMATOS.feed, 1080, datos(), op('ventana'), medir);
    const nombreCl = clasica.lineas.find((l) => l.titulo && l.texto !== '14')!;
    expect(nombreCl.y).toBeLessThan(clasica.lineas.find((l) => l.texto === '14')!.y);
  });

  it('en la base la caja del nombre cae dentro de la zona de abajo (la ilustración la solapa por arriba)', () => {
    const L = calcularLayout(FORMATOS.feed, 1080, datos(), op('base'), medir);
    expect(L.titulo!.y).toBeGreaterThanOrEqual(L.zonas.abajo.y);
  });
});

describe('elegir composición', () => {
  it('automática depende de la letra, y una elegida manda', () => {
    expect(resolverComposicion('auto', 'cartel')).toBe('ventana');
    expect(resolverComposicion('auto', 'clasica')).toBe('centrada');
    expect(resolverComposicion('auto', 'moderna')).toBe('base');
    for (const k of COMPOSICIONES_CARTEL) for (const v of VOCES_CARTEL) expect(resolverComposicion(k, v)).toBe(k);
  });

  it('todas las opciones tienen etiqueta', () => {
    for (const k of ELECCIONES_COMPOSICION) expect(ETIQUETA_COMPOSICION[k]).toBeTruthy();
  });
});
