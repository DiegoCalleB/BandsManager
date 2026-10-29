import { describe, it, expect } from 'vitest';
import { calcularLayout, type DatosCartel, type Medidor } from '../layout';
import { FORMATOS, ORDEN_FORMATOS, dimensiones } from '../formatos';
import { sanearConfigCartel } from '../config';
import { MAX_TEXTO_LIBRE } from '../textosLibres';

const medir: Medidor = (t, px, _p, titulo, tr = 0) => t.length * px * ((titulo ? 0.5 : 0.58) + tr);
const datos: DatosCartel = { lineup: [{ nombre: 'Los Pijamas', cabeza: true }], fecha: 'SÁB 14 NOV 2026', horario: '', sala: 'Sala El Sol', ciudad: 'Madrid', extra: '' };
const op = { qr: true, urlCorta: 'bandmanager.io/r/ab3k9x2', marca: true, composicion: 'ventana' as const, voz: 'cartel' as const };

describe('textos sueltos en el layout', () => {
  for (const f of ORDEN_FORMATOS) {
    const def = FORMATOS[f];
    const { ancho } = dimensiones(def);

    it(`${f}: cada texto es un bloque propio, centrado y dentro del lienzo`, () => {
      const L = calcularLayout(def, ancho, { ...datos, libres: ['Entrada 8 €', '', 'Con Los Toros'] }, op, medir);
      const libres = L.lineas.filter((l) => l.libre);
      expect(libres.map((l) => l.bloque)).toEqual(['libre1', 'libre3']);
      expect(libres.every((l) => l.alinear === 'center' && l.x === ancho / 2)).toBe(true);
      for (const b of ['libre1', 'libre3'] as const) {
        const c = L.cajas![b]!;
        expect(c.x).toBeGreaterThanOrEqual(0);
        expect(c.x + c.w).toBeLessThanOrEqual(ancho);
        expect(c.y + c.h).toBeLessThanOrEqual(L.alto);
      }
    });
  }

  it('un texto largo encoge hasta caber', () => {
    const def = FORMATOS.feed;
    const { ancho } = dimensiones(def);
    const largo = 'X'.repeat(MAX_TEXTO_LIBRE);
    const L = calcularLayout(def, ancho, { ...datos, libres: [largo] }, op, medir);
    expect(L.cajas!.libre1!.w).toBeLessThanOrEqual(ancho * 0.85);
  });

  it('no mueven las zonas donde se mide y se vela el fondo', () => {
    const def = FORMATOS.feed;
    const { ancho } = dimensiones(def);
    const sin = calcularLayout(def, ancho, datos, op, medir);
    const con = calcularLayout(def, ancho, { ...datos, libres: ['Hola'] }, op, medir);
    expect(con.zonas).toEqual(sin.zonas);
    // Moverlo o escalarlo tampoco las ensancha: las zonas solo se recalculan con el texto automático.
    const movido = calcularLayout(def, ancho, { ...datos, libres: ['Hola'] }, { ...op, ajustes: { libre1: { dx: 0, dy: 0.3, escala: 1.5 } } }, medir);
    expect(movido.zonas.arriba.h).toBeLessThanOrEqual(sin.zonas.arriba.h * 1.05);
    expect(movido.zonas.abajo.h).toBeLessThanOrEqual(sin.zonas.abajo.h * 1.05);
  });

  it('se pueden mover y se les puede cambiar la letra y el color como a cualquier bloque', () => {
    const def = FORMATOS.feed;
    const { ancho } = dimensiones(def);
    const base = calcularLayout(def, ancho, { ...datos, libres: ['Hola'] }, op, medir);
    const L = calcularLayout(def, ancho, { ...datos, libres: ['Hola'] }, { ...op, ajustes: { libre1: { dx: 0.1, dy: 0.1, escala: 1 } }, estilos: { libre1: { fuente: 'clasica', color: '#ffd166' } } }, medir);
    const l = L.lineas.find((x) => x.bloque === 'libre1')!;
    expect(l.x).toBeGreaterThan(base.lineas.find((x) => x.bloque === 'libre1')!.x);
    expect(l.voz).toBe('clasica');
    expect(l.color).toBe('#ffd166');
  });
});

describe('textos sueltos en la config guardada', () => {
  it('se sanean: máximo 3, de una línea, recortados, y los huecos finales se quitan', () => {
    const c = sanearConfigCartel({ v: 1, libres: ['  Entrada 8 €  ', '', 'a\nb', 'cuarto', 'x'.repeat(100)] }, () => true);
    expect(c?.libres).toEqual(['Entrada 8 €', '', 'ab']);
    expect(sanearConfigCartel({ v: 1, libres: ['x'.repeat(100)] }, () => true)?.libres[0]).toHaveLength(MAX_TEXTO_LIBRE);
    expect(sanearConfigCartel({ v: 1, libres: 'no' }, () => true)?.libres).toEqual([]);
    expect(sanearConfigCartel({ v: 1, libres: ['', ''] }, () => true)?.libres).toEqual([]);
  });
});
