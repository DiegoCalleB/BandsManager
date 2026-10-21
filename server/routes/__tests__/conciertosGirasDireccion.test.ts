/**
 * Conciertos y giras son de la dirección: crear y borrar un concierto y todo lo de las giras exige
 * ser líder o admin; un miembro puede editar un concierto, pero no su caché, contrato ni gastos.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const guardado = vi.hoisted(() => ({ fila: null as Record<string, unknown> | null }));
vi.mock('../../state.js', async (orig) => ({ ...(await orig<Record<string, unknown>>()), requireAuth: (_q: unknown, _s: unknown, n: () => void) => n() }));
vi.mock('../../db/concerts.js', async (orig) => ({ ...(await orig<Record<string, unknown>>()), dbGetConcertDeBanda: async () => guardado.fila }));
vi.mock('../../utils/bandAccess.js', async (orig) => ({ ...(await orig<Record<string, unknown>>()), getTargetBandId: () => 'band-a' }));

import concertsRouter from '../concerts.js';
import toursRouter from '../tours.js';
import { camposDeDineroCambiados } from '../../utils/permisosConcierto.js';
import { capasConRuta } from './helpers/rutas.js';

type Handler = (req: unknown, res: unknown, next: (e?: unknown) => void) => unknown;

/** Ejecuta los middlewares de la ruta (todos menos el último, que toca la base) y dice cómo acabó. */
async function pasar(router: unknown, ruta: string, metodo: string, role: string, body: Record<string, unknown> = {}) {
  const capa = capasConRuta(router).find((c) => [c.route.path].flat().includes(ruta) && c.route.methods[metodo]);
  if (!capa) throw new Error(`sin ruta ${metodo} ${ruta}`);
  const pila = capa.route.stack.map((s) => s.handle as Handler);
  let code: number | undefined;
  const res = { status: (c: number) => ((code = c), res), json: () => res };
  const req = { user: { id: 'u1', role, band_id: 'band-a' }, params: { id: 'c1' }, body, headers: {}, query: {} };
  for (const handler of pila.slice(0, -1)) {
    let siguiente = false;
    await handler(req, res, () => { siguiente = true; });
    if (!siguiente) return { llegaAlHandler: false, code };
  }
  return { llegaAlHandler: true, code };
}

beforeEach(() => {
  guardado.fila = { id: 'c1', cache: 500, contrato_firmado: false, estado_pago: 'pendiente', gastos_detalle: { gasolina: 40 } };
});

describe('conciertos', () => {
  it.each([['post', '/concerts'], ['delete', '/concerts/:id']])('un miembro no puede %s %s', async (metodo, ruta) => {
    expect(await pasar(concertsRouter, ruta, metodo, 'member')).toEqual({ llegaAlHandler: false, code: 403 });
  });

  it.each(['leader', 'admin'])('un %s sí puede crear y borrar', async (role) => {
    expect((await pasar(concertsRouter, '/concerts', 'post', role)).llegaAlHandler).toBe(true);
    expect((await pasar(concertsRouter, '/concerts/:id', 'delete', role)).llegaAlHandler).toBe(true);
  });

  it('un miembro puede editar el resto del concierto (setlist, notas, QR)', async () => {
    const r = await pasar(concertsRouter, '/concerts/:id', 'put', 'member', { id: 'c1', cache: 500, setlistId: 's1', notas: 'llegar a las 18h' });
    expect(r.llegaAlHandler).toBe(true);
  });

  it.each([
    ['el caché', { cache: 900 }],
    ['el contrato (nombre del cliente)', { contratoFirmado: true }],
    ['el estado de pago', { estado_pago: 'pagado' }],
    ['los gastos', { gastosDetalle: { gasolina: 400 } }],
  ])('un miembro no puede cambiar %s', async (_n, cambio) => {
    expect(await pasar(concertsRouter, '/concerts/:id', 'put', 'member', { id: 'c1', ...cambio })).toEqual({ llegaAlHandler: false, code: 403 });
  });

  it('un líder sí puede cambiar el dinero', async () => {
    expect((await pasar(concertsRouter, '/concerts/:id', 'put', 'leader', { cache: 900 })).llegaAlHandler).toBe(true);
  });
});

describe('giras', () => {
  it.each([['post', '/tours'], ['put', '/tours/:id'], ['delete', '/tours/:id']])('un miembro no puede %s %s', async (metodo, ruta) => {
    expect(await pasar(toursRouter, ruta, metodo, 'member')).toEqual({ llegaAlHandler: false, code: 403 });
  });

  it('un líder sí', async () => {
    expect((await pasar(toursRouter, '/tours', 'post', 'leader')).llegaAlHandler).toBe(true);
  });
});

describe('camposDeDineroCambiados', () => {
  it('reenviar el concierto entero sin tocar el dinero no cuenta como cambio', () => {
    const fila = { cache: 500, contrato_firmado: false, estado_pago: 'pendiente', gastos_detalle: { a: 1 }, gastos_estimados_tipicos: null };
    expect(camposDeDineroCambiados(fila, { cache: '500', contratoFirmado: false, estadoPago: 'pendiente', gastosDetalle: { a: 1 }, gastosEstimadosTipicos: 0 })).toEqual([]);
  });

  it('un concierto que no existe cuenta cualquier dinero distinto de cero como cambio', () => {
    expect(camposDeDineroCambiados(null, { cache: 100 })).toEqual(['cache']);
    expect(camposDeDineroCambiados(null, { cache: 0 })).toEqual([]);
  });
});
