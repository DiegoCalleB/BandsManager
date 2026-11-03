import { describe, it, expect } from 'vitest';
import { CONFIG_INICIAL, ajustesDe } from '../config';
import { MAX_ACCIONES, MAX_ARTE, aplicarAcciones, planVacio, sanearPlan } from '../ordenes';

const base = ajustesDe(CONFIG_INICIAL);

describe('sanearPlan: solo entra lo que está en el catálogo', () => {
  it('descarta tipos, bloques, campos y valores desconocidos', () => {
    const p = sanearPlan({
      resumen: 'Hecho',
      acciones: [
        { tipo: 'borrar_bolo' },
        { tipo: 'estilo', bloque: 'sistema', color: '#ff0000' },
        { tipo: 'elegir', campo: 'qrDestino', valor: 'http://evil.com' },
        { tipo: 'interruptor', campo: 'marca', valor: false },
        { tipo: 'interruptor', campo: 'qr', valor: 'sí' },
        { tipo: 'texto', campo: 'bandId', valor: 'otra' },
        { tipo: 'libre', indice: 7, texto: 'x' },
        'cadena',
        null,
      ],
      arte: '',
    });
    expect(p.acciones).toEqual([]);
    expect(planVacio(p)).toBe(true);
  });

  it('acepta las acciones del catálogo con sus valores', () => {
    const p = sanearPlan({
      acciones: [
        { tipo: 'estilo', bloque: 'fecha', color: '#E63946', fuente: 'clasica' },
        { tipo: 'estilo', bloque: 'logos', oculto: true },
        { tipo: 'mover', bloque: 'nombre', dy: -0.1, escala: 1.3 },
        { tipo: 'interruptor', campo: 'logo', valor: false },
        { tipo: 'elegir', campo: 'qrDestino', valor: 'fans' },
        { tipo: 'elegir', campo: 'acabado', valor: 'serigrafia' },
        { tipo: 'texto', campo: 'extra', valor: 'Entrada libre' },
        { tipo: 'libre', indice: 1, texto: 'Con Los Toros' },
      ],
    });
    expect(p.acciones).toHaveLength(8);
    expect(p.acciones[0]).toEqual({ tipo: 'estilo', bloque: 'fecha', color: '#e63946', fuente: 'clasica' });
  });

  it('un color con código no pasa y un estilo vacío se descarta', () => {
    expect(sanearPlan({ acciones: [{ tipo: 'estilo', bloque: 'fecha', color: 'url(javascript:1)' }] }).acciones).toEqual([]);
    expect(sanearPlan({ acciones: [{ tipo: 'estilo', bloque: 'fecha' }] }).acciones).toEqual([]);
  });

  it('acota movimientos, número de acciones, textos y el arte', () => {
    const muchas = Array.from({ length: 30 }, () => ({ tipo: 'mover', bloque: 'nombre', dx: 99, escala: 99 }));
    const p = sanearPlan({ acciones: muchas, arte: 'cielo '.repeat(200), resumen: 'r'.repeat(999) });
    expect(p.acciones).toHaveLength(MAX_ACCIONES);
    expect(p.acciones[0]).toMatchObject({ dx: 0.6, escala: 2.5 });
    expect(p.arte.length).toBeLessThanOrEqual(MAX_ARTE);
    expect(p.resumen.length).toBeLessThanOrEqual(200);
    expect(sanearPlan({ acciones: [{ tipo: 'libre', indice: 0, texto: '<script>' + 'x'.repeat(100) }] }).acciones[0]).toMatchObject({ texto: expect.not.stringMatching(/[<>]/) });
  });

  it('cualquier cosa que no sea un objeto da un plan vacío', () => {
    for (const x of [null, 'x', 3, [1], undefined]) expect(planVacio(sanearPlan(x))).toBe(true);
  });

  it('un plan solo con arte no está vacío', () => {
    expect(planVacio(sanearPlan({ acciones: [], arte: 'El cielo más oscuro' }))).toBe(false);
  });
});

describe('aplicarAcciones', () => {
  it('estilo: letra, color y ocultar, y quitarlos con null', () => {
    let a = aplicarAcciones(base, 'feed', [{ tipo: 'estilo', bloque: 'fecha', color: '#e63946', fuente: 'clasica' }, { tipo: 'estilo', bloque: 'logos', oculto: true }]);
    expect(a.estilos).toEqual({ fecha: { color: '#e63946', fuente: 'clasica' }, logos: { oculto: true } });
    a = aplicarAcciones(a, 'feed', [{ tipo: 'estilo', bloque: 'fecha', color: null }, { tipo: 'estilo', bloque: 'logos', oculto: false }]);
    expect(a.estilos).toEqual({ fecha: { fuente: 'clasica' } });
  });

  it('mover es relativo a donde está el bloque y vale para el formato que se ve', () => {
    let a = aplicarAcciones(base, 'feed', [{ tipo: 'mover', bloque: 'nombre', dy: -0.1, escala: 1.2 }]);
    expect(a.ajustesFinos.feed?.nombre).toEqual({ dx: 0, dy: -0.1, escala: 1.2 });
    a = aplicarAcciones(a, 'feed', [{ tipo: 'mover', bloque: 'nombre', dy: -0.1, escala: 1.5 }]);
    expect(a.ajustesFinos.feed?.nombre).toEqual({ dx: 0, dy: -0.2, escala: 1.8 });
    expect(a.ajustesFinos.historia).toBeUndefined();
  });

  it('un movimiento que deja el bloque como estaba lo quita', () => {
    let a = aplicarAcciones(base, 'feed', [{ tipo: 'mover', bloque: 'qr', dx: 0.1 }]);
    a = aplicarAcciones(a, 'feed', [{ tipo: 'mover', bloque: 'qr', dx: -0.1 }]);
    expect(a.ajustesFinos.feed).toBeUndefined();
  });

  it('interruptores, elecciones, textos y textos sueltos', () => {
    const a = aplicarAcciones(base, 'feed', [
      { tipo: 'interruptor', campo: 'logo', valor: false },
      { tipo: 'elegir', campo: 'qrDestino', valor: 'fans' },
      { tipo: 'elegir', campo: 'acabado', valor: 'serigrafia' },
      { tipo: 'texto', campo: 'nombre', valor: 'Los Hijos del Toro' },
      { tipo: 'texto', campo: 'extra', valor: 'Entrada libre' },
      { tipo: 'libre', indice: 1, texto: 'Con Los Toros' },
    ]);
    expect(a).toMatchObject({ logo: false, qrDestino: 'fans', acabado: 'serigrafia', extra: 'Entrada libre', textos: { nombre: 'Los Hijos del Toro' }, libres: ['', 'Con Los Toros', ''] });
  });

  it('no cambia los ajustes de entrada', () => {
    const antes = JSON.stringify(base);
    aplicarAcciones(base, 'feed', [{ tipo: 'libre', indice: 0, texto: 'x' }, { tipo: 'texto', campo: 'lugar', valor: 'Teatro Lara' }, { tipo: 'estilo', bloque: 'pie', oculto: true }]);
    expect(JSON.stringify(base)).toBe(antes);
  });
});
