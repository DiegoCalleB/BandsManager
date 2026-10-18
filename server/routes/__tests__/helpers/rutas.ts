/**
 * Utilidades de test para inspeccionar routers de Express, incluidos los sub-routers montados con
 * `router.use(sub)`: los tests buscan un handler por ruta y método sin depender de en qué fichero
 * (o sub-router) se declaró.
 */
import { expect } from 'vitest';

type Metodo = 'get' | 'post' | 'put' | 'patch' | 'delete';

interface CapaRuta {
  route: { path: string | string[]; methods: Record<string, boolean>; stack: Array<{ handle: unknown; name: string }> };
}

interface CapaExpress {
  route?: CapaRuta['route'];
  handle?: { stack?: CapaExpress[] };
  name?: string;
}

/** Todas las capas con ruta del router, recorriendo los sub-routers en orden de montaje. */
export function capasConRuta(router: unknown): CapaRuta[] {
  const pila = (router as { stack?: CapaExpress[] }).stack ?? [];
  const out: CapaRuta[] = [];
  for (const capa of pila) {
    if (capa.route) out.push(capa as CapaRuta);
    else if (capa.name === 'router' && capa.handle?.stack) out.push(...capasConRuta(capa.handle));
  }
  return out;
}

const coincide = (path: string | string[], ruta: string) => (Array.isArray(path) ? path.includes(ruta) : path === ruta);

/**
 * Pila completa (middlewares + handler) de una ruta.
 * @throws si la ruta no existe (el test falla con el método y la ruta en el mensaje).
 */
export function pilaDeRuta(router: unknown, ruta: string, metodo: Metodo) {
  const capa = capasConRuta(router).find((c) => coincide(c.route.path, ruta) && c.route.methods[metodo]);
  expect(capa, `${metodo} ${ruta}`).toBeDefined();
  return capa!.route.stack;
}

/** Handler final de una ruta (el último de su pila). */
export function manejador(router: unknown, ruta: string, metodo: Metodo): (...args: any[]) => any {
  const pila = pilaDeRuta(router, ruta, metodo);
  return pila[pila.length - 1].handle as (...args: any[]) => any;
}

/** Inventario `MÉTODO ruta` de todas las rutas, en orden de declaración. */
export function inventario(router: unknown): string[] {
  return capasConRuta(router).flatMap((c) => {
    const paths = Array.isArray(c.route.path) ? c.route.path : [c.route.path];
    const metodos = Object.keys(c.route.methods).filter((m) => c.route.methods[m]);
    return metodos.flatMap((m) => paths.map((p) => `${m.toUpperCase()} ${p}`));
  });
}
