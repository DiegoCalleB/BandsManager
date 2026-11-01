/**
 * Auditoría: toda ruta `/api/...` escrita en el cliente existe en el servidor.
 * Un 404 en una llamada con `.catch(() => null)` no avisa a nadie: el selector de setlists, el modal
 * de IA musical y el botón de Excel llevaban así semanas sin cargar ni descargar nada. El contrato
 * `docs/api/openapi.json` lo regenera `npm run docs:api` desde las rutas reales y CI lo verifica,
 * así que sirve de lista fiable de lo que el servidor sabe atender.
 */
import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const RAIZ = path.resolve(__dirname, '..');
const CONTRATO = path.resolve(RAIZ, '..', 'docs', 'api', 'openapi.json');

function* ficheros(dir: string): Generator<string> {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '__tests__' || e.name === 'audit' || e.name === 'node_modules') continue;
      yield* ficheros(p);
    } else if (/\.(tsx|ts)$/.test(e.name) && !/\.test\./.test(e.name)) yield p;
  }
}

/** Convierte `{id}`, `:id` y `${expr}` en un único comodín para poder comparar rutas. */
const normalizar = (ruta: string) =>
  ruta
    .replace(/\$\{[^}]*\}?/g, '{}')
    .replace(/\{[^}]*\}/g, '{}')
    .replace(/:[A-Za-z_]+/g, '{}')
    // `/api/leads${qs}`: un comodín pegado al último segmento es la query string, no otra ruta.
    .replace(/([A-Za-z0-9_-])\{\}$/, '$1')
    .replace(/\/$/, '');

describe('rutas /api del cliente', () => {
  it('cada ruta literal existe en el contrato del servidor', () => {
    const rutas = Object.keys(JSON.parse(fs.readFileSync(CONTRATO, 'utf8')).paths as Record<string, unknown>).map(normalizar);
    const patrones = rutas.map((r) => new RegExp(`^${r.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{\}/g, '[^/]+')}$`));

    const sinServidor: string[] = [];
    for (const f of ficheros(RAIZ)) {
      const rel = path.relative(RAIZ, f).split(path.sep).join('/');
      fs.readFileSync(f, 'utf8')
        .split('\n')
        .forEach((linea, i) => {
          for (const m of linea.matchAll(/[`'"](\/api\/[A-Za-z0-9_\-/${}.:]*)/g)) {
            const ruta = normalizar(m[1]);
            // La ruta puede ser solo el prefijo de una URL que se completa por concatenación.
            const existe = rutas.includes(ruta) || patrones.some((p) => p.test(ruta)) || rutas.some((r) => r.startsWith(`${ruta}/`));
            if (!existe) sinServidor.push(`${rel}:${i + 1} ${m[1]}`);
          }
        });
    }
    expect(sinServidor).toEqual([]);
  });
});
