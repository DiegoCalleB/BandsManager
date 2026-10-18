/**
 * Todas las rutas de leads (CRUD y enriquecimiento) y campañas llevan limitador de peticiones
 * (CodeQL js/missing-rate-limiting): el enriquecimiento lanza peticiones salientes y consume IA.
 */
import { describe, expect, it } from 'vitest';
import type { Router } from 'express';
import campaigns from '../campaigns.js';
import crud from '../leads/crud.js';
import enrichment from '../leads/enrichment.js';

interface CapaRuta {
  route?: { path: string | string[]; stack: Array<{ handle: { name: string } }> };
}

function rutasSinLimitador(router: Router): string[] {
  const capas = router.stack as unknown as CapaRuta[];
  return capas
    .filter((c) => c.route)
    .filter((c) => !c.route!.stack.some((h) => h.handle.name === 'rateLimiter'))
    .map((c) => String(c.route!.path));
}

describe('limitador de peticiones en rutas de leads y campañas', () => {
  it('campañas: ninguna ruta sin limitador', () => {
    expect(rutasSinLimitador(campaigns)).toEqual([]);
  });
  it('leads CRUD: ninguna ruta sin limitador', () => {
    expect(rutasSinLimitador(crud)).toEqual([]);
  });
  it('leads enriquecimiento: ninguna ruta sin limitador', () => {
    expect(rutasSinLimitador(enrichment)).toEqual([]);
  });
});
