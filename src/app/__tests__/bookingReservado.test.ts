/**
 * El booking es reservado: cada lista del menú y la navegación pasan por `moduloDeBookingOculto`.
 * Si alguien añade una lista nueva sin filtrarla, el candado «Plan» o el propio módulo asomarían
 * a bandas que no deben ni saber que existe. Es un contrato de fuentes, como los de este directorio.
 */
import { describe, expect, it } from 'vitest';

const fuentes = import.meta.glob(
  ['../DesktopSidebar.tsx', '../MobileDrawer.tsx', '../MobileGroupSheet.tsx', '../../components/common/NavGroupSection.tsx', '../hooks/useAppNavigation.ts', '../../components/dashboard/DashboardWidgetGrid.tsx', '../../components/dashboard/AddWidgetModal.tsx'],
  { eager: true, query: '?raw', import: 'default' },
) as Record<string, string>;

describe('booking reservado en la interfaz', () => {
  it('hay siete superficies vigiladas', () => {
    expect(Object.keys(fuentes)).toHaveLength(7);
  });

  it.each(Object.entries(fuentes))('%s filtra con moduloDeBookingOculto', (_ruta, fuente) => {
    expect(fuente).toContain('moduloDeBookingOculto');
  });

  it('la navegación directa a una vista de booking se corta sin aviso de plan', () => {
    const nav = Object.entries(fuentes).find(([ruta]) => ruta.endsWith('useAppNavigation.ts'))?.[1] ?? '';
    expect(nav).toMatch(/if \(moduloDeBookingOculto\(view, bookingVisible\)\) return;/);
    expect(nav).toMatch(/moduloDeBookingOculto\(currentView, bookingVisible\)/);
  });
});
