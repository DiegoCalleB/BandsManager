import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// Se prospectan festivales sobre todo desde el móvil: el filtro de tipo no puede ocultarse por debajo de `sm`.
describe('filtro de tipo en Booking', () => {
  it('el selector de tipo es visible también en móvil', () => {
    const src = readFileSync('src/components/booking/crm/SearchAndViewRow.tsx', 'utf8');
    const antes = src.slice(0, src.indexOf('id="crm-type-filter-select"'));
    const contenedor = antes.slice(antes.lastIndexOf('<div'));
    expect(contenedor).not.toMatch(/\bhidden\b/);
  });
});
