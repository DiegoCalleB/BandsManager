/**
 * Codemod de copy (visual-identity §6, craft-interfaces §6): en los textos visibles
 *  · «A & B» → «A y B» (o «A e B» ante i-/hi-), salvo marcas ("Rock & Roll", "R&B");
 *  · Title Case de 3+ palabras → caja de frase (JSX text y atributos title/aria-label/placeholder/label).
 * Solo toca literales del AST (texto JSX, strings, plantillas): nunca tipos ni operadores.
 * Uso: node scripts/codemods/copy-es.cjs [--dry] [--show]
 */
const ts = require('typescript');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = process.cwd();
const dry = process.argv.includes('--dry');
const show = process.argv.includes('--show');
const files = execSync("git ls-files ':(glob)src/**/*.tsx' ':(glob)src/**/*.ts'", { cwd: ROOT }).toString().split('\n')
  .filter((f) => f && !/(__tests__|\.test\.|db_seed|mouredevBandsSeed|\/i18n\/|\.d\.ts|epkTranslations)/.test(f));

const PROPER = new Set(['Google','Calendar','Gmail','Outlook','Spotify','Places','Gemini','YouTube','Instagram','TikTok','WhatsApp','Stripe','Revolut','PayPal','Bizum','BandManager','Supabase','Ko-fi','Excel','Meta','Cubase','Zoom','Notion','Studio','Reels','Stories','Bandcamp','SoundCloud','Facebook','Twitter','Telegram','Drive','Maps','Airbnb','Tone','DNA','Hook','Doctor','Pro','Plus']);
const KEEP_AMP = /(Rock & Roll|R&B|Q&A|AT&T|B&B)/;
const ATTR = new Set(['title', 'aria-label']);

function amp(t) {
  if (!t.includes(' & ') || KEEP_AMP.test(t)) return t;
  return t.replace(/([A-Za-zÁ-úñÑ0-9)»”])( & )([A-Za-zÁ-úñÑ¿¡(«“])/g, (m, a, _s, b, off, full) => {
    const rest = full.slice(off + m.length - 1);
    const conj = /^(i|hi)(?![aeou])/i.test(rest) ? 'e' : 'y';
    return `${a} ${conj} ${b}`;
  });
}
function isTitle(t) {
  const ws = t.trim().split(/\s+/).filter((w) => /^[(¿¡"“«]*[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}/.test(w) && !PROPER.has(w.replace(/[^\wÁ-úñÑ-]/g, '')));
  return ws.length >= 3 && !/[{}<>=.:?!]/.test(t) && !/^\s*Ej/.test(t) && t.length < 70;
}
function sent(t) {
  return t.split(/(\s+)/).map((w, i) => {
    if (!w.trim() || i === 0) return w;
    const m = w.match(/^([(¿¡"“«]*)([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}(?:-[A-Za-záéíóúñ]+)*)(.*)$/);
    if (!m) return w;
    if (PROPER.has(m[2])) return w;
    return m[1] + m[2][0].toLowerCase() + m[2].slice(1) + m[3];
  }).join('');
}

let nAmp = 0, nTitle = 0; const samples = [];
for (const rel of files) {
  const abs = path.join(ROOT, rel);
  const src = fs.readFileSync(abs, 'utf8');
  if (!src.includes(' & ') && !/[A-ZÁÉÍÓÚ][a-záéíóúñ]{2,} [A-ZÁÉÍÓÚ][a-záéíóúñ]{2,} [A-ZÁÉÍÓÚ]/.test(src)) continue;
  const sf = ts.createSourceFile(rel, src, ts.ScriptTarget.Latest, true, rel.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const edits = [];
  const consider = (start, end, text, canTitle) => {
    let out = amp(text);
    if (out !== text) nAmp++;
    if (canTitle && isTitle(out)) { const s2 = sent(out); if (s2 !== out) { out = s2; nTitle++; } }
    if (out !== text) { edits.push({ start, end, text: out }); if (show && samples.length < 60) samples.push(`${rel}: ${text.trim().slice(0, 60)}  →  ${out.trim().slice(0, 60)}`); }
  };
  (function visit(n) {
    if (ts.isJsxText(n)) {
      const raw = n.getText(sf);
      const solo = ts.isJsxElement(n.parent) && n.parent.children.filter((c) => !(ts.isJsxText(c) && !/\S/.test(c.getText(sf)))).length === 1;
      if (/\S/.test(raw) && !/^\s*[{}]/.test(raw)) consider(n.getStart(sf, true), n.getEnd(), raw, solo);
    } else if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
      // Solo texto que se PINTA: atributos de etiqueta y literales dentro de {…} de JSX (incl. ternarios).
      // Nunca constantes, claves ni datos: ahí una comparación por igualdad podría romperse.
      const p = n.parent;
      let canTitle = false, ok = false;
      if (ts.isJsxAttribute(p)) {
        const nm = p.name.getText(sf);
        if (['title', 'aria-label', 'placeholder', 'label', 'alt'].includes(nm)) { ok = true; canTitle = ATTR.has(nm); }
      } else {
        let a = p, d = 0;
        while (a && d < 4 && (ts.isConditionalExpression(a) || ts.isParenthesizedExpression(a) || ts.isBinaryExpression(a))) { a = a.parent; d++; }
        if (a && ts.isJsxExpression(a) && a.parent && !ts.isJsxAttribute(a.parent)) ok = true;
      }
      if (ok) {
        const start = n.getStart(sf) + 1, end = n.getEnd() - 1;
        const raw = src.slice(start, end);
        if (!raw.includes('\\')) consider(start, end, raw, canTitle);
      }
    }
    ts.forEachChild(n, visit);
  })(sf);
  if (!edits.length) continue;
  edits.sort((a, b) => b.start - a.start);
  let out = src;
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  if (!dry) fs.writeFileSync(abs, out);
}
console.log(JSON.stringify({ ampersands: nAmp, titleCase: nTitle }));
if (show) console.log(samples.join('\n'));
