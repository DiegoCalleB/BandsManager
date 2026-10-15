import { describe, it, expect } from 'vitest';
import { calcularLayout, type DatosCartel, type OpcionesLayout, type Rect } from '../layout';
import { FORMATOS, ORDEN_FORMATOS, dimensiones } from '../formatos';
import { PAPEL, planPlacas } from '../placas';

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
      expect(ocupado).toBeLessThanOrEqual(0.7 * L.alto + 1);
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
    expect(plan.bandas.length).toBe(L.zonas.arriba.h + L.zonas.abajo.h > 0.7 * L.alto ? 1 : 2);
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
});
