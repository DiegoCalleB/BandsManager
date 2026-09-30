/**
 * Codemod F4: filas de menú (<button w-full text-left … hover:bg-…>) → <MenuItem tone>, y botones de texto con forma
 * de enlace (color acento/secundario + underline/hover:underline, sin fondo ni relleno) → <LinkButton tone size>.
 * Solo className literal. Uso: node scripts/codemods/migrar-menus-enlaces.cjs [--dry]
 */
const ts = require('typescript');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = process.cwd();
const dry = process.argv.includes('--dry');
const files = execSync("git ls-files ':(glob)src/**/*.tsx'", { cwd: ROOT }).toString().split('\n').filter((f) => f && !f.includes('components/ui/'));
const RESP = /^(sm|md|lg|xl|2xl):/;
const LAYOUT = /^(w|min-w|max-w|flex-1|flex-none|shrink-0|grow|m[trblxyse]?|-m[trblxyse]?|order|self|absolute|relative|fixed|sticky|inset|top|right|bottom|left|z|hidden|block|inline-flex|flex|truncate|whitespace|justify|items|group|opacity|shrink)(-|$)/;
const stats = { menu: 0, link: 0 };
function layoutOf(cls, allowFlex) {
  return cls.split(/\s+/).filter(Boolean).filter((t) => {
    if (/^(hover|focus|active|disabled|group|peer|aria|data):/.test(t)) return false;
    const b = t.replace(RESP, '');
    if (!allowFlex && /^(flex|items|justify)(-|$)/.test(b)) return false;
    if (b === 'w-full' || b === 'flex' || b === 'items-center' ) return false; // ya en la primitiva
    return LAYOUT.test(b);
  }).join(' ');
}
for (const rel of files) {
  const abs = path.join(ROOT, rel);
  const src = fs.readFileSync(abs, 'utf8');
  if (!src.includes('<button')) continue;
  const sf = ts.createSourceFile(rel, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = []; const used = new Set();
  (function visit(node) {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText() === 'button') {
      const op = node.openingElement;
      let clsAttr = null, bad = false;
      for (const a of op.attributes.properties) {
        if (ts.isJsxSpreadAttribute(a)) { bad = true; break; }
        const nm = a.name.getText();
        if (nm === 'className') clsAttr = a;
        if (nm === 'style' || nm === 'role') bad = true;
      }
      if (!bad && clsAttr && clsAttr.initializer && ts.isStringLiteral(clsAttr.initializer)) {
        const cls = clsAttr.initializer.text;
        let kind = null, props = '';
        if (/(^|\s)w-full(\s|$)/.test(cls) && /(^|\s)text-left(\s|$)/.test(cls) && /rounded-\[var\(--r-(s|m)\)\]/.test(cls) && /(^|\s)hover:bg-/.test(cls) && !/(^|\s)bg-\[/.test(cls)) {
          kind = 'MenuItem';
          const tone = /text-\[var\(--alert\)\]/.test(cls) ? 'danger' : /text-\[var\(--(acc|acc-ink)\)\]/.test(cls) ? 'acc' : /text-\[var\(--ink-2\)\]/.test(cls) ? 'muted' : 'default';
          const dense = /(^|\s)py-1(\.5)?(\s|$)/.test(cls);
          props = `${tone !== 'default' ? ` tone="${tone}"` : ''}${dense ? ' dense' : ''}`;
        } else if (/(^|\s)(hover:underline|underline)(\s|$)/.test(cls) && !/(^|\s)(bg-|p[xy]?-\d|rounded)/.test(cls) && /text-\[var\(--(acc|acc-ink|ink-2)\)\]/.test(cls)) {
          kind = 'LinkButton';
          const tone = /text-\[var\(--(acc|acc-ink)\)\]/.test(cls) ? 'acc' : 'muted';
          const size = /(^|\s)text-micro(\s|$)/.test(cls) ? 'xs' : /(^|\s)text-sm(\s|$)/.test(cls) ? 'md' : 'sm';
          props = `${tone !== 'acc' ? ` tone="${tone}"` : ''}${size !== 'sm' ? ` size="${size}"` : ''}`;
        }
        if (kind) {
          const layout = layoutOf(cls, kind === 'LinkButton');
          edits.push({ start: op.tagName.getStart(sf), end: op.tagName.getEnd(), text: kind + props });
          edits.push({ start: node.closingElement.tagName.getStart(sf), end: node.closingElement.tagName.getEnd(), text: kind });
          edits.push({ start: clsAttr.getFullStart(), end: clsAttr.getEnd(), text: layout ? `${src.slice(clsAttr.getFullStart(), clsAttr.getStart(sf))}className="${layout}"` : '' });
          used.add(kind); stats[kind === 'MenuItem' ? 'menu' : 'link']++;
        }
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
  const names = [...used];
  const existing = out.match(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]*\/ui)['"];?\n/);
  if (existing) {
    const have = existing[1].split(',').map((s) => s.trim()).filter(Boolean);
    out = out.replace(existing[0], `import { ${[...new Set([...have, ...names])].sort().join(', ')} } from '${existing[2]}';\n`);
  } else {
    const last = [...out.matchAll(/^import[\s\S]*?;\s*$/gm)].pop();
    const line = `import { ${names.sort().join(', ')} } from '${relImp}';`;
    out = last ? out.slice(0, last.index + last[0].length) + '\n' + line + out.slice(last.index + last[0].length) : line + '\n' + out;
  }
  if (!dry) fs.writeFileSync(abs, out);
}
console.log(JSON.stringify(stats));
