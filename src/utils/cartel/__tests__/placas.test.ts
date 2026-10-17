import { describe, it, expect } from 'vitest';
import { calcularLayout, type DatosCartel, type OpcionesLayout, type Rect } from '../layout';
import { FORMATOS, ORDEN_FORMATOS, dimensiones } from '../formatos';
import { PAPEL, planPlacas } from '../placas';
import type { ArtePapel } from '../papel';

const medir = (t: string, px: number) => t.length * px * 0.6;
const datos: DatosCartel = {
  lineup: [{ nombre: 'Ruta 66', cabeza: true }],
  fecha: 'SÁB 17 OCT 2026',
  horario: 'PUERTAS 20:30 · SHOW 21:30',
  sala: 'Sala El Sol',
  ciudad: 'Madrid',
  extra: '',
};
const todo: OpcionesLayout = { qr: true, urlCorta: 'bandmanager.io/r/ab3k9x2', marca: true };
const dentro = (y: number, alto: number, r: Rect) => y >= r.y - 0.5 && y + alto <= r.y + r.h + 0.5;

describe('planPlacas', () => {
  for (const f of ORDEN_FORMATOS) {
    it(`${f}: cada línea de texto cae sobre una banda de papel y la ilustración conserva su ventana`, () => {
      const def = FORMATOS[f];
      const L = calcularLayout(def, dimensiones(def).ancho, datos, todo, medir);
      const plan = planPlacas(L, 0.7);
      for (const l of L.lineas) expect(plan.bandas.some((b) => dentro(l.y, l.px, b))).toBe(true);
      const ocupado = plan.bandas.reduce((s, b) => s + b.h, 0);
      expect(ocupado).toBeLessThanOrEqual(0.78 * L.alto + 1);
    });
  }

  it('papel claro sobre un fondo claro y oscuro sobre uno oscuro, con el filete al revés', () => {
    const def = FORMATOS.feed;
    const L = calcularLayout(def, dimensiones(def).ancho, datos, todo, medir);
    expect(planPlacas(L, 0.8).color).toBe(PAPEL.claro);
    expect(planPlacas(L, 0.2).color).toBe(PAPEL.oscuro);
    expect(planPlacas(L, 0.8).filete).not.toBe(planPlacas(L, 0.8).color);
  });

  it('si el nombre ocupa tanto que no quedaría ventana, solo se pone la placa de abajo', () => {
    const def = FORMATOS.feed;
    const largo: DatosCartel = { ...datos, lineup: [{ nombre: 'Los Increíbles Pijamas de la Muerte Súbita', cabeza: true }, { nombre: 'Otra Banda Muy Larga Tambien', cabeza: false }] };
    const L = calcularLayout(def, dimensiones(def).ancho, largo, todo, medir);
    const plan = planPlacas(L, 0.7);
    expect(plan.bandas.length).toBe(L.zonas.arriba.h + L.zonas.abajo.h > 0.78 * L.alto || L.zonas.abajo.y - L.zonas.arriba.h < 0.22 * L.alto ? 1 : 2);
  });

  it('la orla rodea el cartel sin salirse del lienzo', () => {
    const def = FORMATOS.imprimir;
    const L = calcularLayout(def, dimensiones(def).ancho, datos, todo, medir);
    for (const r of planPlacas(L, 0.5).orla) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w).toBeLessThanOrEqual(L.ancho);
      expect(r.y + r.h).toBeLessThanOrEqual(L.alto);
    }
  });

  for (const f of ORDEN_FORMATOS) {
    it(`${f}: la ventana de la ilustración queda entre las bandas, dentro de la orla y sin pisar ningún texto`, () => {
      const def = FORMATOS[f];
      const L = calcularLayout(def, dimensiones(def).ancho, datos, todo, medir);
      const plan = planPlacas(L, 0.7);
      const v = plan.ventana;
      expect(v.h).toBeGreaterThan(0.25 * L.alto);
      expect(v.x).toBeGreaterThan(0);
      expect(v.x + v.w).toBeLessThan(L.ancho);
      expect(v.y + v.h).toBeLessThanOrEqual(L.zonas.abajo.y + 0.5);
      for (const b of plan.bandas) expect(v.y + v.h <= b.y + 0.5 || v.y >= b.y + b.h - 0.5).toBe(true);
      for (const l of L.lineas) expect(l.y + l.px <= v.y + 0.5 || l.y >= v.y + v.h - 0.5, `"${l.texto}" cae en la ventana`).toBe(true);
    });
  }

  it('sin placa de arriba la ventana empieza justo bajo la orla', () => {
    const def = FORMATOS.feed;
    const largo: DatosCartel = { ...datos, lineup: [{ nombre: 'Los Increíbles Pijamas de la Muerte Súbita', cabeza: true }, { nombre: 'Otra Banda Muy Larga Tambien', cabeza: false }] };
    const L = calcularLayout(def, dimensiones(def).ancho, largo, todo, medir);
    const plan = planPlacas(L, 0.7);
    if (plan.bandas.length === 1) expect(plan.ventana.y).toBe(plan.orla[0].h);
  });

  describe('modo fundido (la ilustración está sobre un papel liso)', () => {
    const arte: ArtePapel = { papel: '#EEE6D3', limpio: true, tinta: '#8A2C28', tinta2: null };

    it('el cartel es del papel de la ilustración, sin filetes ni orla, y la ventana llega de lado a lado', () => {
      const def = FORMATOS.feed;
      const L = calcularLayout(def, dimensiones(def).ancho, datos, todo, medir);
      const plan = planPlacas(L, 0.8, arte);
      expect(plan.modo).toBe('fundido');
      expect(plan.color).toBe('#EEE6D3');
      expect(plan.filetes).toEqual([]);
      expect(plan.orla).toEqual([]);
      expect(plan.ventana.x).toBe(0);
      expect(plan.ventana.w).toBe(L.ancho);
    });

    it('la ilustración sube y solapa parte del nombre, sin pasar de su comienzo', () => {
      for (const f of ORDEN_FORMATOS) {
        const def = FORMATOS[f];
        const L = calcularLayout(def, dimensiones(def).ancho, datos, todo, medir);
        const fundido = planPlacas(L, 0.8, arte);
        const marco = planPlacas(L, 0.8, { ...arte, limpio: false });
        if (fundido.bandas.length === 2 && L.titulo) {
          expect(fundido.ventana.y, f).toBeLessThan(L.zonas.arriba.h);
          expect(fundido.ventana.y, f).toBeGreaterThan(L.titulo.y);
          expect(fundido.ventana.h, f).toBeGreaterThan(marco.ventana.h);
          // Solapa el nombre, no la fecha: la ventana termina donde empiezan los datos.
          expect(fundido.ventana.y + fundido.ventana.h).toBeCloseTo(marco.ventana.y + marco.ventana.h, 5);
        }
      }
    });

    it('si el nombre no deja sitio para una placa de arriba, no se solapa nada', () => {
      const def = FORMATOS.feed;
      const largo: DatosCartel = { ...datos, lineup: [{ nombre: 'Los Increíbles Pijamas de la Muerte Súbita', cabeza: true }, { nombre: 'Otra Banda Muy Larga Tambien', cabeza: false }] };
      const L = calcularLayout(def, dimensiones(def).ancho, largo, todo, medir);
      const plan = planPlacas(L, 0.8, arte);
      if (plan.bandas.length === 1) expect(plan.ventana.y).toBe(0);
    });

    it('si el borde no está limpio se enmarca, como antes', () => {
      const def = FORMATOS.feed;
      const L = calcularLayout(def, dimensiones(def).ancho, datos, todo, medir);
      for (const a of [{ ...arte, limpio: false }, null, undefined]) {
        const plan = planPlacas(L, 0.8, a);
        expect(plan.modo).toBe('marco');
        expect(plan.color).toBe(PAPEL.claro);
        expect(plan.filetes.length).toBeGreaterThan(0);
        expect(plan.orla).toHaveLength(4);
      }
    });
  });
});
