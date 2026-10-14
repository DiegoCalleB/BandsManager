import { describe, it, expect } from 'vitest';
import { validarPanel, validarPanelGuardado, validarPreferenciasUi, MAX_BYTES_PREFERENCIAS } from '../validarPanel.js';

const ok = { id: 'calendar-1', type: 'calendar', wSpan: 12, hSpan: 'normal', visible: true, order: 0, title: 'Agenda', settings: { calendarViewMode: 'list' } };

describe('validarPanel', () => {
  it('acepta un panel bien formado, también sin campos opcionales', () => {
    expect(validarPanel([ok, { id: 'b', type: 'marketing', wSpan: 6, visible: false, order: 1 }])).toBeNull();
    expect(validarPanel([])).toBeNull();
  });
  it.each([
    ['no es lista', { ok }],
    ['widget no objeto', ['x']],
    ['id vacío', [{ ...ok, id: '' }]],
    ['tipo con caracteres raros', [{ ...ok, type: '../x' }]],
    ['ancho inventado', [{ ...ok, wSpan: 5 }]],
    ['alto inventado', [{ ...ok, hSpan: 'enorme' }]],
    ['visible no booleano', [{ ...ok, visible: 'si' }]],
    ['orden decimal', [{ ...ok, order: 1.5 }]],
    ['título larguísimo', [{ ...ok, title: 'x'.repeat(121) }]],
    ['ajustes enormes', [{ ...ok, settings: { a: 'x'.repeat(3000) } }]],
    ['ajustes en lista', [{ ...ok, settings: [] }]],
    ['demasiados widgets', Array.from({ length: 41 }, (_, i) => ({ ...ok, id: `w${i}` }))],
  ])('rechaza: %s', (_motivo, panel) => {
    expect(validarPanel(panel)).not.toBeNull();
  });
});

describe('validarPreferenciasUi', () => {
  it('solo valida el panel si viene, y limita el tamaño total', () => {
    expect(validarPreferenciasUi({ tema: 'dark' })).toBeNull();
    expect(validarPreferenciasUi({ dashboard_widgets: [ok] })).toBeNull();
    expect(validarPreferenciasUi({ dashboard_widgets: 'x' })).not.toBeNull();
    expect(validarPreferenciasUi({ nota: 'x'.repeat(MAX_BYTES_PREFERENCIAS) })).not.toBeNull();
  });
});

describe('validarPanelGuardado (formato v2)', () => {
  it('acepta la lista antigua y el v2, con o sin paneles por banda', () => {
    expect(validarPanelGuardado([ok])).toBeNull();
    expect(validarPanelGuardado({ version: 2, base: [ok] })).toBeNull();
    expect(validarPanelGuardado({ version: 2, base: [ok], porBanda: { 'band-a': [{ ...ok, movil: false }] } })).toBeNull();
  });
  it.each([
    ['versión desconocida', { version: 3, base: [ok] }],
    ['sin base', { version: 2 }],
    ['base mal formada', { version: 2, base: [{ ...ok, wSpan: 5 }] }],
    ['porBanda en lista', { version: 2, base: [ok], porBanda: [] }],
    ['panel de banda mal formado', { version: 2, base: [ok], porBanda: { b: [{ ...ok, id: '' }] } }],
    ['movil no booleano', { version: 2, base: [{ ...ok, movil: 'si' }] }],
    ['demasiados paneles de banda', { version: 2, base: [ok], porBanda: Object.fromEntries(Array.from({ length: 31 }, (_, i) => [`b${i}`, [ok]])) }],
  ])('rechaza: %s', (_m, v) => {
    expect(validarPanelGuardado(v)).not.toBeNull();
  });
});
