/**
 * Codemod F4: <input>/<select>/<textarea> escritos a mano → primitivas de src/components/ui.
 * Solo toca elementos con className literal (o sin className); conserva las clases de LAYOUT
 * (ancho, márgenes, posición…) y descarta las visuales (fondo, radio, relleno, tamaño de letra, foco…),
 * que ahora salen de la primitiva. Uso: node scripts/codemods/migrar-campos.cjs [--dry] [ficheros…]
 */
const ts = require('typescript');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();
const dry = process.argv.includes('--dry');
const argFiles = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const files = argFiles.length
  ? argFiles
  : execSync("git ls-files ':(glob)src/**/*.tsx'", { cwd: ROOT }).toString().split('\n').filter(Boolean);

const SKIP_TYPES = new Set(['checkbox', 'radio', 'range', 'file', 'hidden', 'color', 'image', 'submit', 'button', 'reset']);
const MAP = { input: 'Input', select: 'Select', textarea: 'Textarea' };
const RESP = /^(sm|md|lg|xl|2xl):/;
const LAYOUT = /^(pl|pr|ps|pe|w|min-w|max-w|flex|grow|shrink|basis|m[trblxyse]?|-m[trblxyse]?|col-span|col-start|col-end|row-span|order|self|justify-self|place-self|absolute|relative|fixed|sticky|inset|top|right|bottom|left|z|block|inline-block|inline-flex|flex-1|flex-none|shrink-0|grow-0|text-(left|center|right)|tabular-nums|truncate|min-h)(-|$)/;
const LAYOUT_TEXTAREA = /^(h|min-h|max-h)-/;
const SKIP_CLASS = /(^|\s)(bg-transparent|sr-only|peer|opacity-0|hidden|border-b|border-0|appearance-none)(\s|$)/;

let stats = { input: 0, select: 0, textarea: 0, skipped: {} };
const skip = (why) => { stats.skipped[why] = (stats.skipped[why] || 0) + 1; };

function splitClasses(cls, tag) {
  const layout = [];
  for (const tok of cls.split(/\s+/).filter(Boolean)) {
    if (/^(hover|focus|active|disabled|placeholder|peer|group|file|aria|data|read-only|focus-within|focus-visible|dark):/.test(tok)) continue;
    const base = tok.replace(RESP, '');
    if (LAYOUT.test(base) || (tag === 'textarea' && LAYOUT_TEXTAREA.test(base))) layout.push(tok);
  }
  return layout.join(' ');
}

for (const rel of files) {
  const abs = path.join(ROOT, rel);
  const src = fs.readFileSync(abs, 'utf8');
  const sf = ts.createSourceFile(rel, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  const used = new Set();

  const handle = (open, closing) => {
    const tag = open.tagName.getText();
    if (!MAP[tag]) return;
    const attrs = open.attributes.properties;
    let clsAttr = null, typeVal = null, hasSize = false, hasStyle = false;
    for (const a of attrs) {
      if (!ts.isJsxAttribute(a)) continue;
      const n = a.name.getText();
      if (n === 'className') clsAttr = a;
      if (n === 'type' && a.initializer && ts.isStringLiteral(a.initializer)) typeVal = a.initializer.text;
      if (n === 'type' && a.initializer && !ts.isStringLiteral(a.initializer)) typeVal = '__dynamic__';
      if (n === 'size') hasSize = true;
      if (n === 'style') hasStyle = true;
    }
    if (tag === 'input' && (typeVal && SKIP_TYPES.has(typeVal))) return skip('tipo ' + typeVal);
    if (hasSize) return skip('size nativo');
    if (hasStyle) return skip('style inline');
    let cls = '';
    if (clsAttr) {
      const init = clsAttr.initializer;
      if (init && ts.isStringLiteral(init)) cls = init.text;
      else if (init && ts.isJsxExpression(init) && init.expression && ts.isNoSubstitutionTemplateLiteral(init.expression)) cls = init.expression.text;
      else if (init && ts.isJsxExpression(init) && init.expression && ts.isTemplateExpression(init.expression) &&
        init.expression.templateSpans.every((sp) => ts.isStringLiteral(sp.expression) || ts.isNoSubstitutionTemplateLiteral(sp.expression))) {
        // plantilla cuyas partes variables son literales fijas (restos de ternarios de tema ya resueltos)
        const t = init.expression;
        cls = t.head.text + t.templateSpans.map((sp) => sp.expression.text + sp.literal.text).join('');
      } else return skip('className dinámico');
      if (SKIP_CLASS.test(' ' + cls + ' ')) return skip('estilo especial');
    }
    const layout = splitClasses(cls, tag);
    // 1) nombre de etiqueta
    // Campos densos (letra pequeña o poco relleno vertical) → size="sm" (36 px) en vez de 40 px.
    const dense = /(^|\s)(text-(xs|micro)|py-(0\.5|1|1\.5|2)|p-(1|1\.5|2))(\s|$)/.test(cls);
    const sizeProp = dense && tag !== 'textarea' ? ' size="sm"' : '';
    edits.push({ start: open.tagName.getStart(sf), end: open.tagName.getEnd(), text: MAP[tag] + sizeProp });
    if (closing) edits.push({ start: closing.tagName.getStart(sf), end: closing.tagName.getEnd(), text: MAP[tag] });
    // 2) className
    const attrName = tag === 'select' ? 'wrapperClassName' : 'className';
    if (clsAttr) {
      const text = layout ? `${attrName}="${layout}"` : '';
      edits.push({ start: clsAttr.getStart(sf), end: clsAttr.getEnd(), text });
    }
    stats[tag]++;
    used.add(MAP[tag]);
  };

  (function visit(n) {
    if (ts.isJsxSelfClosingElement(n)) handle(n, null);
    else if (ts.isJsxElement(n)) handle(n.openingElement, n.closingElement);
    ts.forEachChild(n, visit);
  })(sf);

  if (!edits.length) continue;
  let out = src;
  edits.sort((a, b) => b.start - a.start);
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  // Evita dobles espacios donde se quitó el className
  out = out.replace(/<(Input|Select|Textarea)( +)\n/g, '<$1\n');
  // import
  const uiDir = path.join(ROOT, 'src/components/ui');
  let relImp = path.relative(path.dirname(abs), uiDir).split(path.sep).join('/');
  if (!relImp.startsWith('.')) relImp = './' + relImp;
  const names = [...used].sort();
  const existing = out.match(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]*\/ui)['"];?\n/);
  if (existing) {
    const have = existing[1].split(',').map((s) => s.trim()).filter(Boolean);
    const merged = [...new Set([...have, ...names])].sort();
    out = out.replace(existing[0], `import { ${merged.join(', ')} } from '${existing[2]}';\n`);
  } else {
    const importLine = `import { ${names.join(', ')} } from '${relImp}';\n`;
    const lastImport = [...out.matchAll(/^import[\s\S]*?;\s*$/gm)].pop();
    if (lastImport) {
      const idx = lastImport.index + lastImport[0].length;
      out = out.slice(0, idx) + '\n' + importLine.trimEnd() + out.slice(idx);
    } else out = importLine + out;
  }
  if (!dry) fs.writeFileSync(abs, out);
}
console.log(JSON.stringify(stats, null, 1));
