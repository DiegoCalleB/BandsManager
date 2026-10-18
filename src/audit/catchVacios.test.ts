/**
 * Auditoría: ningún error se traga en silencio.
 *
 * Hasta 2026-10-11 había ~100 `catch {}` y ~60 `.catch(() => {})` sin explicación: escrituras en
 * Supabase que fallaban sin dejar rastro (créditos, cola de stems, contactos de tracking) mezcladas
 * con casos legítimos (temporal ya borrado, autoplay bloqueado). Ahora cada uno registra el error
 * con contexto o lleva un comentario que dice por qué ignorarlo es lo correcto. Este test impide
 * volver a añadir uno mudo.
 */
import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const RAIZ = path.resolve(__dirname, '../..');

function* ficheros(dir: string): Generator<string> {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '__tests__' || e.name === 'node_modules') continue;
      yield* ficheros(p);
    } else if (/\.(tsx|ts)$/.test(e.name) && !/\.test\./.test(e.name)) yield p;
  }
}

const MUDOS: Array<{ nombre: string; re: RegExp }> = [
  { nombre: 'catch vacío', re: /catch\s*(\(\s*\w+\s*\))?\s*\{\s*\}/g },
  { nombre: '.catch(() => {}) vacío', re: /\.catch\(\s*\(\s*\w*\s*\)\s*=>\s*\{\s*\}\s*\)/g },
];

describe('ningún error se traga en silencio', () => {
  const hallazgos: string[] = [];
  for (const raiz of ['src', 'server']) {
    for (const f of ficheros(path.join(RAIZ, raiz))) {
      const codigo = fs.readFileSync(f, 'utf8');
      const lineas = codigo.split('\n');
      for (const { nombre, re } of MUDOS) {
        for (const m of codigo.matchAll(re)) {
          const linea = codigo.slice(0, m.index).split('\n').length;
          // Una línea de comentario puede citar el patrón al explicar por qué se quitó.
          if (/^\s*(\/\/|\*)/.test(lineas[linea - 1])) continue;
          hallazgos.push(`${path.relative(RAIZ, f)}:${linea} ${nombre}`);
        }
      }
    }
  }

  it('cada catch registra el error o explica en un comentario por qué se ignora', () => {
    expect(hallazgos).toEqual([]);
  });
});
