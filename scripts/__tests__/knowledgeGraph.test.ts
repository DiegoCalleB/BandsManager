import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { NODES } from '../generate_obsidian_graph';

// El grafo se escribe a mano (AGENTS.md §7): este test es lo que impide que mienta en silencio.
describe('grafo de conocimiento', () => {
  const ids = new Set(NODES.map((n) => n.id));

  it('no repite ids', () => {
    expect(ids.size).toBe(NODES.length);
  });

  it('todos los ficheros indexados existen', () => {
    const faltan = NODES.filter((n) => !fs.existsSync(path.resolve(__dirname, '../..', n.file))).map((n) => `${n.id} -> ${n.file}`);
    expect(faltan).toEqual([]);
  });

  it('todos los enlaces apuntan a un nodo que existe', () => {
    const rotos = NODES.flatMap((n) => n.linksTo.filter((l) => !ids.has(l)).map((l) => `${n.id} -> ${l}`));
    expect(rotos).toEqual([]);
  });
});
