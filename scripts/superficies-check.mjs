#!/usr/bin/env node
/**
 * Comprobación ESTÁTICA de apilado de luminancia (Ley 1 de visual-identity).
 *
 * Sin bordes, una caja se distingue de su contenedor solo por el escalón de
 * fondo. Este script recorre el JSX de cada componente y avisa cuando una caja
 * con relleno propio (`bg-[var(--surface)]` o `bg-[var(--sunken)]`) está
 * dentro de otra con EXACTAMENTE el mismo relleno: invisible sin borde.
 *
 * Es local al fichero (no cruza componentes), así que complementa —no
 * sustituye— la red dinámica de e2e/superficies.spec.ts, que ve el DOM real.
 * Con --fix voltea el relleno de la caja hija (surface ↔ sunken).
 *
 *   node scripts/superficies-check.mjs          # informa, exit 1 si hay
 *   node scripts/superficies-check.mjs --fix    # corrige
 */
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';

const FIX = process.argv.includes('--fix');
const RAIZ = 'src';
const TOKEN = /(?<![\w:-])bg-\[var\(--(surface|sunken)\)\](?![\w/-])/g;
const BOXY = /rounded|(?<![\w-])p[xy]?-\d/;

function ficheros(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return d.name === '__tests__' ? [] : ficheros(p);
    return d.name.endsWith('.tsx') ? [p] : [];
  });
}

/** true si la clase se compone con identificadores/llamadas (`${cardBg}`, cn(...)): no se ve el relleno real. */
function esOpaca(attr) {
  const ini = attr.initializer;
  if (!ini || ts.isStringLiteral(ini)) return false;
  let opaca = false;
  const MIRA = (n) => {
    if (ts.isTemplateSpan(n) && (ts.isIdentifier(n.expression) || ts.isPropertyAccessExpression(n.expression) || ts.isCallExpression(n.expression) || ts.isElementAccessExpression(n.expression))) opaca = true;
    ts.forEachChild(n, MIRA);
  };
  const expr = ts.isJsxExpression(ini) ? ini.expression : ini;
  if (!expr) return false;
  if (ts.isIdentifier(expr) || ts.isCallExpression(expr) || ts.isPropertyAccessExpression(expr) || ts.isBinaryExpression(expr)) return true;
  MIRA(expr);
  return opaca;
}

/** Texto de todas las literales del atributo className (cubre ternarios y plantillas). */
function claseDe(attr, sf) {
  return attr.initializer ? attr.initializer.getText(sf) : '';
}

let total = 0;
for (const f of ficheros(RAIZ)) {
  const src = fs.readFileSync(f, 'utf8');
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const cambios = [];
  const visita = (nodo, ancestro) => {
    let actual = ancestro;
    // Un componente con hijos (<Card>, <Modal>…) pinta su propio fondo en OTRO fichero: no sabemos contra qué se compara.
    if (ts.isJsxElement(nodo) && /^[A-Z]/.test(nodo.openingElement.tagName.getText(sf))) actual = null;
    const el = ts.isJsxElement(nodo) ? nodo.openingElement : ts.isJsxSelfClosingElement(nodo) ? nodo : null;
    if (el) {
      const attr = el.attributes.properties.find((a) => ts.isJsxAttribute(a) && a.name.getText(sf) === 'className');
      if (attr) {
        const txt = claseDe(attr, sf);
        if (esOpaca(attr)) { actual = null; ts.forEachChild(nodo, (h) => visita(h, actual)); return; }
        const toks = [...txt.matchAll(TOKEN)];
        const distintos = new Set(toks.map((m) => m[1]));
        // Otro relleno propio (acento, --bg, negro…) rompe la cadena: ya no sabemos contra qué se compara.
        const otroRelleno = /(?<![\w:-])bg-(?!\[var\(--(?:surface|sunken)\)\](?![\w/-]))(?!transparent|none|clip|cover|center|no-repeat|gradient)/.test(txt);
        if (otroRelleno && distintos.size === 0) actual = null;
        if (distintos.size === 1 && BOXY.test(txt)) {
          const mio = [...distintos][0];
          if (ancestro && ancestro.bg === mio) {
            const linea = sf.getLineAndCharacterOfPosition(attr.getStart(sf)).line + 1;
            console.log(`❌ ${f}:${linea} — caja ${mio} dentro de otra ${mio} (línea ${ancestro.linea}): invisible sin borde`);
            total++;
            const otro = mio === 'surface' ? 'sunken' : 'surface';
            for (const m of toks) cambios.push({ ini: attr.initializer.getStart(sf) + m.index, fin: attr.initializer.getStart(sf) + m.index + m[0].length, nuevo: `bg-[var(--${otro})]` });
            actual = { bg: otro, linea };
          } else {
            actual = { bg: mio, linea: sf.getLineAndCharacterOfPosition(attr.getStart(sf)).line + 1 };
          }
        }
      }
    }
    ts.forEachChild(nodo, (h) => visita(h, actual));
  };
  visita(sf, null);
  if (FIX && cambios.length) {
    let out = src;
    for (const c of cambios.sort((a, b) => b.ini - a.ini)) out = out.slice(0, c.ini) + c.nuevo + out.slice(c.fin);
    fs.writeFileSync(f, out);
  }
}
console.log(total ? `\n${total} cajas sin escalón${FIX ? ' (corregidas)' : ''}` : '✅ Apilado de superficies coherente.');
process.exit(total && !FIX ? 1 : 0);
