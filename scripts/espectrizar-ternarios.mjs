#!/usr/bin/env node
/**
 * Colapsa los ternarios `isStitchLight ? claro : oscuro` que llegan de main.
 * Espectro resuelve claro/oscuro en tokens (visual-identity §7), así que solo
 * se conserva la rama «oscuro» (la que hay que dejar en tokens).
 *
 *   node scripts/espectrizar-ternarios.mjs src/components/ReelsCenter.tsx …
 *
 * Después: node scripts/espectrizar-clases.py <ficheros> y
 * node scripts/superficies-check.mjs --fix. Es el flujo para «traer main».
 */
import ts from 'typescript';
import fs from 'node:fs';

let total = 0;
for (const f of process.argv.slice(2)) {
  let src = fs.readFileSync(f, 'utf8');
  for (let pasada = 0; pasada < 20; pasada++) {
    const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const cambios = [];
    const visita = (n) => {
      if (ts.isConditionalExpression(n)) {
        const cond = n.condition.getText(sf).trim();
        if (cond === 'isStitchLight' || cond === '!isStitchLight') {
          const rama = cond === 'isStitchLight' ? n.whenFalse : n.whenTrue;
          cambios.push({ ini: n.getStart(sf), fin: n.getEnd(), texto: rama.getText(sf) });
          return; // los anidados dentro de la rama se resuelven en la pasada siguiente
        }
      }
      ts.forEachChild(n, visita);
    };
    visita(sf);
    if (!cambios.length) break;
    for (const c of cambios.sort((a, b) => b.ini - a.ini)) src = src.slice(0, c.ini) + c.texto + src.slice(c.fin);
    total += cambios.length;
  }
  // `${"texto"}` dentro de una plantilla → texto en línea
  src = src.replace(/\$\{\s*(["'])([^"'`$\\\n]*)\1\s*\}/g, '$2');
  fs.writeFileSync(f, src);
  const quedan = (src.match(/isStitchLight/g) || []).length;
  console.log(`${f}: colapsados ${total}, referencias restantes a isStitchLight: ${quedan}`);
  total = 0;
}
