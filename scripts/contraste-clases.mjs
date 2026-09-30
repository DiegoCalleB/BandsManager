#!/usr/bin/env node
/**
 * Contraste de clases (AST). El audit de className solo veía cadenas sueltas; este mira TODAS las
 * cadenas de un fichero (incluidas las anidadas en `${"…"}` y ternarios) y, para cada una que
 * combine un relleno sólido `bg-[var(--token)]` con un color de texto `text-[var(--token)]`,
 * calcula el contraste con los valores reales de tokens.css en Claro y Oscuro.
 *   · relleno sólido + texto con contraste < 3:1  → error
 *   · texto con opacidad ≤ 45 % (/10…/45)          → error (casi invisible en cualquier fondo)
 *   node scripts/contraste-clases.mjs [--fix]
 */
import ts from 'typescript'; import fs from 'fs'; import { execSync } from 'child_process';
const fix = process.argv.includes('--fix');
const css = fs.readFileSync('src/styles/tokens.css', 'utf8');
const bloque = (sel) => { const i = css.indexOf(sel + ' {'); const j = css.indexOf('}', i); return css.slice(i, j); };
const leer = (b) => Object.fromEntries([...b.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})/g)].map(m => [m[1], m[2]]));
const claro = leer(bloque(':root')); const oscuro = { ...claro, ...leer(bloque('[data-theme="dark"]')) };
const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const lum = h => { const [r, g, b] = rgb(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const ON = { acc: 'on-acc', ok: 'on-ok', alert: 'on-alert', tentative: 'on-tentative' };
const INK = { acc: 'acc-ink', ok: 'ok', alert: 'alert', tentative: 'tentative', ink: 'ink-2', 'ink-2': 'ink-2', 'ink-3': 'ink-2' };
const files = execSync("git ls-files ':(glob)src/**/*.tsx'").toString().trim().split('\n').filter(f => !/__tests__|\.test\./.test(f));
const mezcla = (fg, bgc, al) => '#' + rgb(fg).map((v, i) => Math.round(v * al + rgb(bgc)[i] * (1 - al)).toString(16).padStart(2, '0')).join('');
const minContraste = (bg, alfaB, tk) => Math.min(...['claro', 'oscuro'].map(nom => { const T = nom === 'claro' ? claro : oscuro; if (!T[bg] || !T[tk]) return 0; const fondo = mezcla(T[bg], AMBIENTE[nom], alfaB); return ratio(T[tk], fondo); }));
const elegir = (bg, alfaB, tk) => { const cand = [...new Set([ON[bg], INK[tk], 'ink', 'ink-2', 'on-acc'].filter(Boolean))]; return cand.find(c => minContraste(bg, alfaB, c) >= 4.5) ?? null; };
const AMBIENTE = { claro: '#FFFFFF', oscuro: '#191C21' };
let errores = 0; const informe = []; let arreglados = 0;
for (const f of files) {
  let src = fs.readFileSync(f, 'utf8'); const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const cambios = [];
  const visitar = (n) => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) {
      const t = n.text; if (t.includes('var(--')) {
        const toks = t.split(/\s+/).filter(Boolean); const linea = sf.getLineAndCharacterOfPosition(n.getStart()).line + 1;
        const base = toks.filter(x => !/^(?:[\w-]+):/.test(x)); // sin variantes hover:/md:/dark…
        const bgs = base.map(x => x.match(/^bg-\[var\(--([\w-]+)\)\](?:\/(\d+))?$/)).filter(Boolean);
        const txts = base.map(x => x.match(/^text-\[var\(--([\w-]+)\)\](?:\/(\d+))?$/)).filter(Boolean);
        const reemplazos = new Map();
        // rellenos 'fuertes' (50–90 %): la intención es sólido; con alfa intermedia ningún texto cumple
        if (fix) for (const bgm of bgs) { const [tokBg, k, a] = bgm; if (a && +a >= 50 && +a <= 90 && ON[k]) { reemplazos.set(bgm[0], `bg-[var(--${k})]`); for (const m of txts) reemplazos.set(m[0], `text-[var(--${ON[k]})]`); } }
        // b) texto casi transparente → opaco
        for (const m of txts) if (m[2] && +m[2] <= 45) {
          errores++; informe.push(`${f}:${linea} texto ${m[0]} (opacidad ${m[2]} %)`);
          if (fix && INK[m[1]] && !bgs.length) reemplazos.set(m[0], `text-[var(--${INK[m[1]]})]`);
        }
        // a) relleno + texto
        for (const bgm of bgs) for (const m of txts) {
          const [, bg, abg] = bgm; const [, tk, at] = m; const alfaT = at ? +at / 100 : 1; const alfaB = abg ? +abg / 100 : 1;
          if (reemplazos.has(m[0])) continue;
          for (const [nom, T] of [['claro', claro], ['oscuro', oscuro]]) {
            if (!T[bg] || !T[tk]) continue;
            const fondo = mezcla(T[bg], AMBIENTE[nom], alfaB); const r = ratio(mezcla(T[tk], fondo, alfaT), fondo);
            if (r < (alfaB === 1 ? 3 : 4.5)) {
              errores++; informe.push(`${f}:${linea} [${nom}] bg-${bg}${abg ? '/' + abg : ''} + text-${tk}${at ? '/' + at : ''} = ${r.toFixed(1)}:1`);
              if (fix) { const c = elegir(bg, alfaB, tk); if (c) reemplazos.set(m[0], `text-[var(--${c})]`); }
            }
          }
        }
        if (fix && reemplazos.size) cambios.push([n, t.split(/(\s+)/).map(x => reemplazos.get(x) ?? x).join('')]);
      }
    }
    ts.forEachChild(n, visitar);
  };
  visitar(sf);
  if (fix && cambios.length) {
    const ord = [...new Map(cambios.map(c => [c[0].getStart(), c])).values()].sort((a, b) => b[0].getStart() - a[0].getStart());
    for (const [n, nuevo] of ord) { const ini = n.getStart() + 1, fin = n.getEnd() - (ts.isTemplateHead(n) || ts.isTemplateMiddle(n) ? 2 : 1); if (src.slice(ini, fin) !== nuevo) { src = src.slice(0, ini) + nuevo + src.slice(fin); arreglados++; } }
    fs.writeFileSync(f, src);
  }
}
console.log(informe.slice(0, 60).join('\n')); console.log(`\n${errores} hallazgos${fix ? `; cadenas reescritas: ${arreglados}` : ''}`);
process.exit(!fix && errores ? 1 : 0);
