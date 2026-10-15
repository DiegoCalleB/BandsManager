/**
 * Express resuelve las rutas por orden de declaración. `PUT /bands/print-settings` estaba declarada
 * DESPUÉS de `PUT /bands/:id`, así que cada guardado de los ajustes de impresión del setlist caía en
 * el handler de `:id` (con id = "print-settings"), que hacía un upsert de un «contacto» fantasma en
 * `band_contacts` y devolvía algo sin `success`. Los ajustes nunca se guardaban.
 *
 * Este test mira el orden real de las capas del router, no solo que la ruta exista.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../state.js', async (orig) => ({
  ...(await orig<any>()),
  loadState: () => ({ bands: [] }),
  saveState: () => {},
  requireAuth: (_q: any, _s: any, n: any) => n(),
}));

import bandsRouter from '../bands.js';

interface RutaDeclarada {
  metodo: string;
  ruta: string;
  posicion: number;
}

function rutasEnOrden(router: any): RutaDeclarada[] {
  const salida: RutaDeclarada[] = [];
  router.stack.forEach((capa: any, posicion: number) => {
    if (!capa.route) return;
    const rutas: string[] = Array.isArray(capa.route.path) ? capa.route.path : [capa.route.path];
    for (const ruta of rutas) {
      for (const metodo of Object.keys(capa.route.methods)) salida.push({ metodo, ruta, posicion });
    }
  });
  return salida;
}

const aRegex = (ruta: string) =>
  new RegExp('^' + ruta.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:[A-Za-z0-9_]+/g, '[^/]+') + '$');

describe('orden de rutas de bands.ts', () => {
  it('PUT /bands/print-settings se declara antes que PUT /bands/:id', () => {
    const rutas = rutasEnOrden(bandsRouter);
    const ajustes = rutas.find((r) => r.metodo === 'put' && r.ruta === '/bands/print-settings');
    const porId = rutas.find((r) => r.metodo === 'put' && r.ruta === '/bands/:id');
    expect(ajustes, 'PUT /bands/print-settings existe').toBeDefined();
    expect(porId, 'PUT /bands/:id existe').toBeDefined();
    expect(ajustes!.posicion).toBeLessThan(porId!.posicion);
  });

  it('ninguna ruta con parámetro precede a una ruta fija que case con ella (mismo método)', () => {
    const rutas = rutasEnOrden(bandsRouter);
    const sombreadas: string[] = [];
    rutas.forEach((fija) => {
      const sombra = rutas.find(
        (previa) =>
          previa.posicion < fija.posicion &&
          previa.metodo === fija.metodo &&
          previa.ruta !== fija.ruta &&
          previa.ruta.includes(':') &&
          aRegex(previa.ruta).test(fija.ruta)
      );
      if (sombra) sombreadas.push(`${fija.metodo.toUpperCase()} ${fija.ruta} queda detrás de ${sombra.ruta}`);
    });
    expect(sombreadas).toEqual([]);
  });
});
