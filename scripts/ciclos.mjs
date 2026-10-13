// Ratchet de dependencias circulares: el número solo puede bajar.
// Uso: node scripts/ciclos.mjs   (CI: npm run verify:ciclos)
import { execFileSync } from 'node:child_process';

const BASELINE = 6; // 2026-10-13: ciclos reales (los de solo tipos no cuentan, ver .madgerc)

let salida;
try {
  salida = execFileSync(
    'npx',
    ['madge', '--circular', '--json', '--extensions', 'ts,tsx', '--ts-config', 'tsconfig.json', 'src', 'server', 'server.ts'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 },
  );
} catch (e) {
  // madge sale con código 1 cuando encuentra ciclos, pero el JSON sigue en stdout.
  salida = e.stdout;
}
const ciclos = JSON.parse(salida);
console.log(`Dependencias circulares: ${ciclos.length} (tope ${BASELINE})`);
if (ciclos.length > BASELINE) {
  for (const c of ciclos) console.log('  ' + c.join(' > '));
  console.error(`::error::Hay ${ciclos.length} ciclos de importación y el tope es ${BASELINE}. Rompe el ciclo nuevo; no subas el tope.`);
  process.exit(1);
}
if (ciclos.length < BASELINE) console.log(`Baja BASELINE de ${BASELINE} a ${ciclos.length} en scripts/ciclos.mjs.`);
