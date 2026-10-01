// "Seleccionado" ya no pinta el botón primario: primary|ghost -> selected, primary|neutral -> inverse.
// Solo toca ternarios de selección (cond ? "primary" : "ghost"|"neutral"); los de feedback de estado (guardado, copiado, válido) se excluyen por nombre.
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const EXCLUIDOS = /(saved|copied|interactionLogged|hasValidPhone|campaignIsActive|isDashboardSettingsOpen)/i;
const files = execSync("grep -rlE 'variant=\\{[^}]*\"primary\"' src --include=*.tsx", { encoding: 'utf8' }).split('\n').filter(Boolean);
let n = 0;
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  const out = s.replace(/variant=\{([^}]*?)\? ?(["'])primary\2 ?: ?(["'])(ghost|neutral)\3\}/g, (m, cond, _q1, _q2, otro) => {
    if (EXCLUIDOS.test(cond)) return m;
    n++;
    return `variant={${cond}? "${otro === 'ghost' ? 'selected' : 'inverse'}" : "${otro}"}`;
  });
  if (out !== s) fs.writeFileSync(f, out);
}
console.log('reemplazos:', n);
