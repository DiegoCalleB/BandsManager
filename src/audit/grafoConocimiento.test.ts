import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { generateObsidianGraph, escanearFicheros, construirNodos } from '../../scripts/generate_obsidian_graph';

// El grafo de docs/knowledge_graph se genera desde los imports reales. Este test es lo que lo mantiene
// vivo: si añades, borras o enlazas un fichero y no regeneras, falla (el pre-commit lo regenera solo).
describe('grafo de conocimiento (Obsidian)', () => {
  it('todo fichero de src/ y server/ tiene su nodo', () => {
    const nodos = new Set(construirNodos().map((n) => n.file));
    const sinNodo = escanearFicheros().filter((f) => !nodos.has(f));
    expect(sinNodo).toEqual([]);
  });

  it('las conexiones reales están: frontend → rutas /api y tabla → tabla por clave foránea', () => {
    const nodos = construirNodos();
    const rutas = new Set(nodos.filter((n) => n.layer === 'route').map((n) => n.id));
    const llamadasApi = nodos.filter((n) => n.layer === 'frontend' && n.linksTo.some((d) => rutas.has(d)));
    expect(llamadasApi.length).toBeGreaterThanOrEqual(20);
    const tablas = new Set(nodos.filter((n) => n.layer === 'schema' && n.id.startsWith('tabla_')).map((n) => n.id));
    const fks = nodos.filter((n) => tablas.has(n.id) && n.linksTo.some((d) => tablas.has(d)));
    expect(fks.length).toBeGreaterThanOrEqual(1);
  });

  it('cada función clave conecta pantalla o ruta con una tabla, y cada proveedor externo tiene quien lo use', () => {
    const nodos = construirNodos();
    const porId = new Map(nodos.map((n) => [n.id, n]));
    const funciones = nodos.filter((n) => n.layer === 'feature');
    expect(funciones.length).toBeGreaterThanOrEqual(12);
    for (const fn of funciones) {
      const capas = new Set(fn.linksTo.map((d) => porId.get(d)?.layer));
      expect(capas.has('route'), `${fn.id} sin ninguna ruta`).toBe(true);
      expect(capas.has('schema'), `${fn.id} sin ninguna tabla`).toBe(true);
      expect(fn.linksTo.every((d) => porId.has(d)), `${fn.id} enlaza a un nodo inexistente`).toBe(true);
    }
    const consumidos = new Set(nodos.flatMap((n) => n.linksTo));
    for (const ext of nodos.filter((n) => n.layer === 'external')) {
      expect(consumidos.has(ext.id), `${ext.id} no lo usa ningún fichero`).toBe(true);
    }
  });

  it('docs/knowledge_graph está al día: ejecuta `npm run graph:sync`', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'grafo-'));
    try {
      generateObsidianGraph(tmp);
      const real = 'docs/knowledge_graph';
      const md = (d: string) => fs.readdirSync(d).filter((f) => f.endsWith('.md')).sort();
      expect(md(real)).toEqual(md(tmp));
      const distintos = md(tmp).filter((f) => fs.readFileSync(path.join(tmp, f), 'utf-8') !== fs.readFileSync(path.join(real, f), 'utf-8'));
      expect(distintos).toEqual([]);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
