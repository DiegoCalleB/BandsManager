/**
 * Auditoría: los SVG estáticos son XML bien formado.
 * Un solo `&` sin escapar («Audio & Setlists») invalida el fichero entero: el servidor lo sirve con
 * 200 pero el navegador no lo pinta, y la portada del Sampler EP que ve todo usuario nuevo salía en
 * blanco sin ningún error en consola.
 */
import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const RAIZ = path.resolve(__dirname, '..', '..');
const CARPETAS = ['public', path.join('src', 'assets')];

function* svgs(dir: string): Generator<string> {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules') continue;
      yield* svgs(p);
    } else if (/\.svg$/i.test(e.name)) yield p;
  }
}

/** Entidades que XML reconoce sin DTD: `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&apos;` y las numéricas. */
const AMPERSAND_SIN_ESCAPAR = /&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/gi;

describe('SVG estáticos', () => {
  it('ninguno lleva un & sin escapar', () => {
    const rotos: string[] = [];
    for (const carpeta of CARPETAS) {
      for (const f of svgs(path.join(RAIZ, carpeta))) {
        // Los comentarios y los bloques CDATA admiten & tal cual.
        const texto = fs
          .readFileSync(f, 'utf8')
          .replace(/<!--[\s\S]*?-->/g, '')
          .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
        const linea = texto.split('\n').findIndex((l) => new RegExp(AMPERSAND_SIN_ESCAPAR.source, 'i').test(l));
        if (linea >= 0) rotos.push(`${path.relative(RAIZ, f).split(path.sep).join('/')} (línea ${linea + 1} del contenido sin comentarios)`);
      }
    }
    expect(rotos).toEqual([]);
  });
});
