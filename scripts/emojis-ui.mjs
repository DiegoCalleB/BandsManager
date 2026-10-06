#!/usr/bin/env node
/**
 * Guardia «sin emojis en la interfaz» (craft-interfaces §6).
 *
 * Busca emojis pintados directamente en el JSX (texto y cadenas hijas). Los emojis dentro de
 * atributos, prompts, toasts o datos NO se tocan: son contenido.
 *
 *   node scripts/emojis-ui.mjs          # informa; exit 1 si hay
 *   node scripts/emojis-ui.mjs --fix    # los sustituye por <ShowIcon inline emoji="…" />
 *                                       # (icono Lucide; ver src/components/ui/ShowIcon.tsx)
 */
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';

const FIX = process.argv.includes('--fix');
const EMO = /\p{Extended_Pictographic}️?/gu;
const files = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(d, e.name);
  return e.isDirectory() ? (e.name === '__tests__' ? [] : files(p)) : p.endsWith('.tsx') ? [p] : [];
});

// Arte exportable, no interfaz: los marcos del QR descargable (p. ej. «Parque Jurásico») usan
// emojis y colores propios a propósito y no tienen un icono Lucide equivalente. Es contenido que
// la banda elige y se exporta como imagen, igual que los emojis en textos o datos de arriba.
const ARTE_EXPORTABLE = ['src/components/fans/qr/CustomizableBandQr.tsx'];

let total = 0;
const porFichero = {};
for (const f of files('src')) {
  if (f.endsWith('ShowIcon.tsx')) continue;
  if (ARTE_EXPORTABLE.some((a) => f.replace(/\\/g, '/').endsWith(a))) continue;
  const src = fs.readFileSync(f, 'utf8');
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const cambios = [];
  const visita = (n) => {
    if (ts.isJsxText(n)) {
      const t = n.getText(sf);
      if (EMO.test(t)) { EMO.lastIndex = 0; cambios.push({ ini: n.getStart(sf), fin: n.getEnd(), texto: t, tipo: 'texto' }); }
      EMO.lastIndex = 0;
    }
    ts.forEachChild(n, visita);
  };
  visita(sf);
  if (!cambios.length) continue;
  let out = src;
  for (const c of cambios.sort((a, b) => b.ini - a.ini)) {
    const nuevo = c.texto.replace(/(\p{Extended_Pictographic}️?)([ \t]?)/gu, (_, e) => `<ShowIcon inline emoji="${e}" />`);
    porFichero[f] = (porFichero[f] || 0) + (c.texto.match(EMO) || []).length;
    total += (c.texto.match(EMO) || []).length;
    out = out.slice(0, c.ini) + nuevo + out.slice(c.fin);
  }
  if (FIX) {
    if (!/\bShowIcon\b/.test(src)) {
      const rel = path.relative(path.dirname(f), 'src/components/ui/ShowIcon').replace(/\\/g, '/');
      const imp = `import { ShowIcon } from '${rel.startsWith('.') ? rel : './' + rel}';\n`;
      const m = out.match(/^(?:import[\s\S]*?;\n)+/m);
      out = m ? out.replace(m[0], m[0] + imp) : imp + out;
    }
    fs.writeFileSync(f, out);
  }
}
console.log(Object.entries(porFichero).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([f, c]) => `${c}\t${f}`).join('\n'));
console.log(total ? `\n${total} emojis en la interfaz${FIX ? ' (sustituidos)' : ''}` : '✅ Sin emojis en la interfaz.');
process.exit(total && !FIX ? 1 : 0);
