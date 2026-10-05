/**
 * Codemod F4: <button> con forma de píldora y relleno reconocible → <Button variant size>.
 * Solo botones con className literal cuyo aspecto ya ES una variante del sistema:
 *   píldora + bg acento + on-acc → primary · píldora + acc-soft → soft · píldora + sunken → neutral · píldora + alerta → danger.
 * Conserva layout (ancho, márgenes, posición, gap, justify) y descarta lo visual, que pone el componente.
 * Uso: node scripts/codemods/migrar-botones.cjs [--dry]
 */
const ts = require('typescript');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = process.cwd();
const dry = process.argv.includes('--dry');
const files = execSync("git ls-files ':(glob)src/**/*.tsx'", { cwd: ROOT }).toString().split('\n').filter((f) => f && !f.includes('components/ui/'));
const RESP = /^(sm|md|lg|xl|2xl):/;
const LAYOUT = /^(w|min-w|max-w|flex-1|flex-none|shrink-0|grow|basis|m[trblxyse]?|-m[trblxyse]?|col-span|order|self|absolute|relative|fixed|sticky|inset|top|right|bottom|left|z|hidden|block|gap|justify|items|truncate|whitespace|min-h|h)(-|$)/;
const stats = { primary: 0, soft: 0, neutral: 0, danger: 0, dyn: 0, skipped: 0 };

function variantOf(cls, requirePill = true) {
  if (requirePill && !/rounded-\[var\(--r-pill\)\]/.test(cls)) return null;
  if (/(^|\s)bg-\[var\(--(acc|ok)\)\](\s|$)/.test(cls) && /text-\[var\(--on-(acc|ok)\)\]/.test(cls)) return 'primary';
  if (/(^|\s)bg-\[var\(--ok(-soft)?\)\](\/\d+)?(\s|$)/.test(cls)) return 'soft';
  if (/(^|\s)bg-\[var\(--acc-soft\)\](\/\d+)?(\s|$)/.test(cls) || /(^|\s)bg-\[var\(--acc\)\]\/(1\d|2\d|3\d|40)(\s|$)/.test(cls)) return 'soft';
  if (/(^|\s)bg-\[var\(--sunken\)\](\s|$)/.test(cls)) return 'neutral';
  if (/(^|\s)bg-\[var\(--alert(-soft)?\)\](\s|$)/.test(cls)) return 'danger';
  if (requirePill && !/(^|\s)bg-\[/.test(cls) && /(^|\s)hover:bg-\[var\(--(sunken|surface)\)\]/.test(cls) && /(^|\s)text-\[var\(--(ink-2|ink)\)\]/.test(cls)) return 'ghost';
  if (!requirePill && /(^|\s)(text-\[var\(--ink-2\)\]|hover:bg-\[var\(--sunken\)\])/.test(cls) && !/(^|\s)bg-\[/.test(cls)) return 'ghost';
  return null;
}
function sizeOf(cls) {
  const py = (cls.match(/(?:^|\s)py-([0-9.]+)(?:\s|$)/) || [])[1];
  const p = (cls.match(/(?:^|\s)p-([0-9.]+)(?:\s|$)/) || [])[1];
  const v = parseFloat(py ?? p ?? '2');
  const sm = /(^|\s)text-sm(\s|$)/.test(cls);
  if (v <= 1.5 && !sm) return 'xs';
  if (v <= 2) return sm ? 'md' : 'sm';
  if (v <= 3) return 'md';
  return 'lg';
}
function layoutOf(cls) {
  const out = [];
  for (const tok of cls.split(/\s+/).filter(Boolean)) {
    if (/^(hover|focus|active|disabled|group|peer|aria|data|dark):/.test(tok)) continue;
    const base = tok.replace(RESP, '');
    if (/^(h|min-h)-/.test(base)) continue; // la altura la fija size
    if (LAYOUT.test(base)) out.push(tok);
  }
  return out.join(' ');
}

for (const rel of files) {
  const abs = path.join(ROOT, rel);
  const src = fs.readFileSync(abs, 'utf8');
  if (!src.includes('<button')) continue;
  const sf = ts.createSourceFile(rel, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  let did = false;
  const handle = (open, closing) => {
    if (open.tagName.getText() !== 'button') return;
    let clsAttr = null, hasStyle = false;
    for (const a of open.attributes.properties) {
      if (!ts.isJsxAttribute(a)) continue;
      const n = a.name.getText();
      if (n === 'className') clsAttr = a;
      if (n === 'style') hasStyle = true;
    }
    if (!clsAttr || !clsAttr.initializer) return;
    let cls, variantExpr = null;
    if (ts.isStringLiteral(clsAttr.initializer)) {
      cls = clsAttr.initializer.text;
    } else if (ts.isJsxExpression(clsAttr.initializer) && clsAttr.initializer.expression && ts.isTemplateExpression(clsAttr.initializer.expression)) {
      // plantilla con UN ternario de literales que decide el aspecto (activo/inactivo) y el resto estático
      const t = clsAttr.initializer.expression;
      const spans = t.templateSpans;
      if (spans.every((sp) => ts.isStringLiteral(sp.expression) || ts.isNoSubstitutionTemplateLiteral(sp.expression))) {
        // plantilla cuyas partes variables son literales fijas (restos de ternarios de tema ya resueltos): es una clase estática
        cls = t.head.text + spans.map((sp) => sp.expression.text + sp.literal.text).join('');
        variantExpr = null;
      } else {
      const cond = spans.filter((sp) => ts.isConditionalExpression(sp.expression) && ts.isStringLiteral(sp.expression.whenTrue) && ts.isStringLiteral(sp.expression.whenFalse));
      if (cond.length !== 1 || spans.length !== 1) { stats.skipped++; return; }
      const ce = cond[0].expression;
      const base = t.head.text + ' ' + cond[0].literal.text;
      const vt = variantOf(base + ' ' + ce.whenTrue.text, false), vf = variantOf(base + ' ' + ce.whenFalse.text, false);
      if (!vt || !vf || !/rounded-\[var\(--r-pill\)\]/.test(base + ce.whenTrue.text + ce.whenFalse.text)) { stats.skipped++; return; }
      cls = base + ' ' + ce.whenTrue.text + ' ' + ce.whenFalse.text; // para size/layout
      variantExpr = `{${ce.condition.getText(sf)} ? "${vt}" : "${vf}"}`;
      }
    } else return;
    const variant = variantExpr ? 'dyn' : variantOf(cls);
    if (!variant || hasStyle) { stats.skipped++; return; }
    if (/(^|\s)(w-\d|size-|aspect-)/.test(cls) && /(^|\s)h-\d/.test(cls)) { stats.skipped++; return; } // botón cuadrado/icono: fuera
    const size = sizeOf(cls);
    const layout = layoutOf(cls);
    edits.push({ start: open.tagName.getStart(sf), end: open.tagName.getEnd(), text: `Button variant=${variantExpr ?? `"${variant}"`}${size !== 'md' ? ` size="${size}"` : ''}` });
    if (closing) edits.push({ start: closing.tagName.getStart(sf), end: closing.tagName.getEnd(), text: 'Button' });
    edits.push({ start: clsAttr.getStart(sf), end: clsAttr.getEnd(), text: layout ? `className="${layout}"` : '' });
    stats[variant]++;
    did = true;
  };
  (function visit(n) {
    if (ts.isJsxSelfClosingElement(n)) handle(n, null);
    else if (ts.isJsxElement(n)) handle(n.openingElement, n.closingElement);
    ts.forEachChild(n, visit);
  })(sf);
  if (!did) continue;
  edits.sort((a, b) => b.start - a.start);
  let out = src;
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  // import
  const uiDir = path.join(ROOT, 'src/components/ui');
  let relImp = path.relative(path.dirname(abs), uiDir).split(path.sep).join('/');
  if (!relImp.startsWith('.')) relImp = './' + relImp;
  const existing = out.match(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]*\/ui)['"];?\n/);
  if (existing) {
    const have = existing[1].split(',').map((s) => s.trim()).filter(Boolean);
    if (!have.includes('Button')) out = out.replace(existing[0], `import { ${[...have, 'Button'].sort().join(', ')} } from '${existing[2]}';\n`);
  } else {
    const last = [...out.matchAll(/^import[\s\S]*?;\s*$/gm)].pop();
    const line = `import { Button } from '${relImp}';`;
    out = last ? out.slice(0, last.index + last[0].length) + '\n' + line + out.slice(last.index + last[0].length) : line + '\n' + out;
  }
  if (!dry) fs.writeFileSync(abs, out);
}
console.log(JSON.stringify(stats));
