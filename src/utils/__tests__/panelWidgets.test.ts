import { describe, it, expect } from 'vitest';
import { moverEntreVisibles, leerPanel, panelDeBanda, conPanel, visibleEnMovil, ESENCIALES_MOVIL } from '../panelWidgets';
import type { DashboardWidgetConfig } from '../../types/dashboardWidgets';

const w = (id: string) => ({ id });
const ids = (l: Array<{ id: string }>) => l.map((x) => x.id).join('');

describe('moverEntreVisibles', () => {
  const todos = [w('a'), w('x'), w('b'), w('c')]; // x está oculto
  const visibles = [w('a'), w('b'), w('c')];

  it('intercambia con el vecino visible, saltándose los ocultos', () => {
    expect(ids(moverEntreVisibles(todos, visibles, 1, 'up'))).toBe('bxac');
    expect(ids(moverEntreVisibles(todos, visibles, 0, 'down'))).toBe('bxac');
    expect(ids(moverEntreVisibles(todos, visibles, 1, 'down'))).toBe('axcb');
  });
  it('en los extremos no mueve nada ni muta la lista original', () => {
    expect(ids(moverEntreVisibles(todos, visibles, 0, 'up'))).toBe('axbc');
    expect(ids(moverEntreVisibles(todos, visibles, 2, 'down'))).toBe('axbc');
    expect(ids(todos)).toBe('axbc');
  });
});

const cfg = (type: string, id = type, extra = {}) => ({ id, type, wSpan: 6, visible: true, order: 0, ...extra }) as unknown as DashboardWidgetConfig;

describe('leerPanel', () => {
  it('sin nada guardado devuelve null (se usa el panel por defecto)', () => {
    expect(leerPanel(undefined)).toBeNull();
    expect(leerPanel([])).toBeNull();
    expect(leerPanel('x')).toBeNull();
    expect(leerPanel({ version: 3, base: [] })).toBeNull();
  });

  it('migra el formato antiguo: quita retirados, conserva el móvil y añade las novedades una vez', () => {
    const r = leerPanel([cfg('calendar'), cfg('growth_guidance'), cfg('finances_summary'), cfg('epk_status')])!;
    expect(r.migrado).toBe(true);
    expect(r.panel.version).toBe(2);
    expect(r.panel.base.map((w) => w.type)).toEqual(['calendar', 'epk_status', 'marketing']);
    // lo que ya veían en el móvil se conserva; el widget nuevo llega sin molestar en el móvil
    expect(r.panel.base.slice(0, 2).every((w) => w.movil === true)).toBe(true);
    expect(r.panel.base[2].movil).toBe(false);
    expect(r.panel.base[2].order).toBe(2);
    // y ya en v2 no se vuelve a añadir si el usuario lo quita
    const sinMarketing = { ...r.panel, base: r.panel.base.filter((w) => w.type !== 'marketing') };
    expect(leerPanel(sinMarketing)!.panel.base.some((w) => w.type === 'marketing')).toBe(false);
  });

  it('no duplica la novedad si ya la tenían', () => {
    const r = leerPanel([cfg('marketing'), cfg('calendar')])!;
    expect(r.panel.base.filter((w) => w.type === 'marketing')).toHaveLength(1);
  });

  it('en v2 limpia los retirados, también en paneles por banda, y avisa de que migró', () => {
    const r = leerPanel({ version: 2, base: [cfg('calendar'), cfg('social_fans_chart')], porBanda: { b1: [cfg('growth_guidance'), cfg('marketing')] } })!;
    expect(r.migrado).toBe(true);
    expect(r.panel.base.map((w) => w.type)).toEqual(['calendar']);
    expect(r.panel.porBanda.b1.map((w) => w.type)).toEqual(['marketing']);
  });

  it('un v2 limpio no se marca como migrado', () => {
    const limpio = { version: 2, base: [cfg('calendar')], porBanda: {} };
    expect(leerPanel(limpio)!.migrado).toBe(false);
  });
});

describe('panelDeBanda / conPanel', () => {
  const panel = { version: 2 as const, base: [cfg('calendar')], porBanda: { b1: [cfg('marketing')] } };
  it('la banda usa el suyo si lo tiene y si no el del usuario', () => {
    expect(panelDeBanda(panel, 'b1')[0].type).toBe('marketing');
    expect(panelDeBanda(panel, 'b2')[0].type).toBe('calendar');
    expect(panelDeBanda(panel)[0].type).toBe('calendar');
  });
  it('guardar cambia la base y conserva los paneles por banda', () => {
    const nuevo = conPanel(panel, [cfg('tour_status')]);
    expect(nuevo.base[0].type).toBe('tour_status');
    expect(nuevo.porBanda).toBe(panel.porBanda);
    expect(conPanel(null, []).porBanda).toEqual({});
  });
});

describe('visibleEnMovil', () => {
  it('sin valor se ve; solo se oculta si es false', () => {
    expect(visibleEnMovil({})).toBe(true);
    expect(visibleEnMovil({ movil: true })).toBe(true);
    expect(visibleEnMovil({ movil: false })).toBe(false);
    expect(ESENCIALES_MOVIL.has('calendar')).toBe(true);
    expect(ESENCIALES_MOVIL.has('marketing')).toBe(false);
  });
});
