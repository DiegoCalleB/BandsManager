/**
 * Auditoría: todo breakpoint que no trae Tailwind y se usa en el código está declarado en el tema.
 * `xs:` se usaba en ~28 sitios (`hidden xs:inline` en las etiquetas de los botones) sin existir:
 * Tailwind v4 ignora en silencio un prefijo desconocido, así que las etiquetas no se veían en
 * ningún ancho y los botones se quedaban en solo icono, sin nombre accesible.
 */
import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const SRC = path.resolve(__dirname, '..');
const CSS = fs.readFileSync(path.join(SRC, 'index.css'), 'utf8');
// Los que Tailwind v4 ya trae (sm, md, lg, xl, 2xl) no hace falta declararlos.
const A_VIGILAR = ['xxs', '2xs', 'xs', '3xl', '4xl'];

function* ficheros(dir: string): Generator<string> {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '__tests__' || e.name === 'audit' || e.name === 'node_modules') continue;
      yield* ficheros(p);
    } else if (/\.(tsx|ts)$/.test(e.name) && !/\.test\./.test(e.name)) yield p;
  }
}

describe('breakpoints de Tailwind', () => {
  it.each(A_VIGILAR)('si se usa «%s:» está declarado como --breakpoint-%s', (bp) => {
    const uso = new RegExp(`(^|[\\s"'\`])${bp}:[a-z\\[]`);
    const usado = [...ficheros(SRC)].some((f) => uso.test(fs.readFileSync(f, 'utf8')));
    if (!usado) return;
    expect(CSS).toMatch(new RegExp(`--breakpoint-${bp}\\s*:`));
  });
});
