/**
 * Codemod F4: <button> de SOLO icono con nombre (aria-label o title de texto literal) → <IconButton label>.
 * Tamaño por el relleno original (p-0.5/p-1 → icon-xs, p-1.5 → icon-sm, p-2+ → icon); variante: rojo → danger,
 * fondo de acento → soft, resto ghost. Conserva el layout (posición, márgenes, ancho) y descarta lo visual.
 * Uso: node scripts/codemods/migrar-iconbuttons.cjs [--dry]
 */
const ts = require('typescript');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = process.cwd();
const dry = process.argv.includes('--dry');
const files = execSync("git ls-files ':(glob)src/**/*.tsx'", { cwd: ROOT }).toString().split('\n').filter((f) => f && !f.includes('components/ui/'));
const RESP = /^(sm|md|lg|xl|2xl):/;
const LAYOUT = /^(w|min-w|max-w|flex-1|flex-none|shrink-0|grow|m[trblxyse]?|-m[trblxyse]?|order|self|absolute|relative|fixed|sticky|inset|top|right|bottom|left|z|hidden|block|inline-flex|flex|group-hover|opacity|pointer-events|shrink)(-|$)/;
let n = 0, skipped = 0;
for (const rel of files) {
  const abs = path.join(ROOT, rel);
  const src = fs.readFileSync(abs, 'utf8');
  if (!src.includes('<button')) continue;
  const sf = ts.createSourceFile(rel, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  (function visit(node) {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText() === 'button') {
      const op = node.openingElement;
      const kids = node.children.filter((k) => !(ts.isJsxText(k) && !/\S/.test(k.getText())));
      if (kids.length === 1 && ts.isJsxSelfClosingElement(kids[0]) && /^[A-Z]/.test(kids[0].tagName.getText())) {
        let clsAttr = null, label = null, labelAttrs = [], ok = true;
        for (const a of op.attributes.properties) {
          if (ts.isJsxSpreadAttribute(a)) { ok = false; break; }
          const nm = a.name.getText();
          if (nm === 'className') clsAttr = a;
          if ((nm === 'aria-label' || nm === 'title') && a.initializer && ts.isStringLiteral(a.initializer)) { if (!label || nm === 'aria-label') label = a.initializer.text; labelAttrs.push(a); }
          else if ((nm === 'aria-label' || nm === 'title')) ok = false; // etiqueta dinámica: fuera
          if (nm === 'style' || nm === 'ref') ok = false;
        }
        if (!ok || !label || (clsAttr && !ts.isStringLiteral(clsAttr.initializer))) { skipped++; return ts.forEachChild(node, visit); }
        const cls = clsAttr ? clsAttr.initializer.text : '';
        if (/(^|\s)(bg-\[var\(--(acc|ok|alert)\)\]|w-\d+|h-\d+|size-)/.test(cls) && /(^|\s)(w|h)-(1[0-9]|[2-9]\d)/.test(cls)) { skipped++; return ts.forEachChild(node, visit); }
        const pad = parseFloat((cls.match(/(?:^|\s)p-([0-9.]+)(?:\s|$)/) || [])[1] ?? '1.5');
        const size = pad <= 1 ? 'icon-xs' : pad <= 1.5 ? 'icon-sm' : pad <= 2.5 ? 'icon-sm' : 'icon';
        const variant = /text-\[var\(--alert\)\]|hover:text-\[var\(--alert\)\]|bg-\[var\(--alert/.test(cls) ? 'danger' : /bg-\[var\(--acc-soft\)\]|bg-\[var\(--acc\)\]\/\d+/.test(cls) ? 'soft' : 'ghost';
        const layout = cls.split(/\s+/).filter(Boolean).filter((t) => {
          if (/^(hover|focus|active|disabled|group|peer|aria|data):/.test(t) && !t.startsWith('group-hover:')) return false;
          return LAYOUT.test(t.replace(RESP, ''));
        }).join(' ');
        // renombrar etiquetas
        edits.push({ start: op.tagName.getStart(sf), end: op.tagName.getEnd(), text: `IconButton label=${JSON.stringify(label)}${variant !== 'ghost' ? ` variant="${variant}"` : ''}${size !== 'icon-sm' ? ` size="${size}"` : ''}` });
        edits.push({ start: node.closingElement.tagName.getStart(sf), end: node.closingElement.tagName.getEnd(), text: 'IconButton' });
        // quitar aria-label/title y className
        for (const a of labelAttrs) edits.push({ start: a.getFullStart(), end: a.getEnd(), text: '' });
        if (clsAttr) edits.push({ start: clsAttr.getFullStart(), end: clsAttr.getEnd(), text: layout ? `${src.slice(clsAttr.getFullStart(), clsAttr.getStart(sf))}className="${layout}"` : '' });
        n++;
        return;
      }
    }
    ts.forEachChild(node, visit);
  })(sf);
  if (!edits.length) continue;
  edits.sort((a, b) => b.start - a.start);
  let out = src;
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  const uiDir = path.join(ROOT, 'src/components/ui');
  let relImp = path.relative(path.dirname(abs), uiDir).split(path.sep).join('/');
  if (!relImp.startsWith('.')) relImp = './' + relImp;
  const existing = out.match(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]*\/ui)['"];?\n/);
  if (existing) {
    const have = existing[1].split(',').map((s) => s.trim()).filter(Boolean);
    if (!have.includes('IconButton')) out = out.replace(existing[0], `import { ${[...have, 'IconButton'].sort().join(', ')} } from '${existing[2]}';\n`);
  } else {
    const last = [...out.matchAll(/^import[\s\S]*?;\s*$/gm)].pop();
    const line = `import { IconButton } from '${relImp}';`;
    out = last ? out.slice(0, last.index + last[0].length) + '\n' + line + out.slice(last.index + last[0].length) : line + '\n' + out;
  }
  if (!dry) fs.writeFileSync(abs, out);
}
console.log(JSON.stringify({ migrados: n, saltados: skipped }));
