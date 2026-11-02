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
const AMPERSAND_SIN_ESCAPAR = /&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/i;

/** Comentarios y bloques CDATA admiten `&` tal cual. */
const ZONAS_LIBRES: ReadonlyArray<readonly [string, string]> = [
  ['<!--', '-->'],
  ['<![CDATA[', ']]>'],
];

/** Vacía esas zonas dejando sus saltos de línea, para que el número de línea siga siendo el del fichero. */
function sinZonasLibres(texto: string): string {
  let salida = '';
  let i = 0;
  while (i < texto.length) {
    const abre = ZONAS_LIBRES.map(([ini, fin]) => ({ ini, fin, en: texto.indexOf(ini, i) }))
      .filter((z) => z.en >= 0)
      .sort((a, b) => a.en - b.en)[0];
    if (!abre) return salida + texto.slice(i);
    const cierre = texto.indexOf(abre.fin, abre.en + abre.ini.length);
    const hasta = cierre < 0 ? texto.length : cierre + abre.fin.length;
    salida += texto.slice(i, abre.en) + texto.slice(abre.en, hasta).replace(/[^\n]/g, '');
    i = hasta;
  }
  return salida;
}

describe('SVG estáticos', () => {
  it('ninguno lleva un & sin escapar', () => {
    const rotos: string[] = [];
    for (const carpeta of CARPETAS) {
      for (const f of svgs(path.join(RAIZ, carpeta))) {
        const linea = sinZonasLibres(fs.readFileSync(f, 'utf8'))
          .split('\n')
          .findIndex((l) => new RegExp(AMPERSAND_SIN_ESCAPAR.source, 'i').test(l));
        if (linea >= 0) rotos.push(`${path.relative(RAIZ, f).split(path.sep).join('/')}:${linea + 1}`);
      }
    }
    expect(rotos).toEqual([]);
  });

  it('un & dentro de un comentario o de un CDATA no cuenta, pero uno suelto sí', () => {
    expect(sinZonasLibres('<a><!-- A & B --><![CDATA[ C & D ]]></a>')).not.toMatch(AMPERSAND_SIN_ESCAPAR);
    expect(sinZonasLibres('<a><!-- ok -->\nE & F</a>')).toMatch(AMPERSAND_SIN_ESCAPAR);
    expect(sinZonasLibres('uno\n<!-- a\nb -->\ntres').split('\n')).toHaveLength(4);
  });
});
