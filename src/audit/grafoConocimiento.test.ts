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
