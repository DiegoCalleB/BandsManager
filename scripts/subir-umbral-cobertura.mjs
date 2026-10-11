#!/usr/bin/env node
/**
 * Ratchet de cobertura: sube coverage-thresholds.json a la cobertura real (redondeada hacia abajo)
 * tras `npm run test:coverage`. Nunca la baja. Uso: `npm run coverage:ratchet` y commitea el JSON.
 */
import fs from 'fs';

const UMBRALES = 'coverage-thresholds.json';
const RESUMEN = 'coverage/coverage-summary.json';

if (!fs.existsSync(RESUMEN)) {
  console.error(`[cobertura] Falta ${RESUMEN}: ejecuta antes npm run test:coverage.`);
  process.exit(1);
}
const total = JSON.parse(fs.readFileSync(RESUMEN, 'utf8')).total;
const umbrales = JSON.parse(fs.readFileSync(UMBRALES, 'utf8'));
let cambios = 0;
for (const metrica of Object.keys(umbrales)) {
  const real = Math.floor(total[metrica].pct);
  if (real > umbrales[metrica]) {
    console.log(`[cobertura] ${metrica}: ${umbrales[metrica]} → ${real}`);
    umbrales[metrica] = real;
    cambios++;
  }
}
fs.writeFileSync(UMBRALES, `${JSON.stringify(umbrales, null, 2)}\n`);
console.log(cambios ? `[cobertura] ${cambios} umbral(es) subido(s): commitea ${UMBRALES}.` : '[cobertura] Sin cambios.');
