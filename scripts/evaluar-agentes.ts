/** Informe del banco de evaluación de los agentes. Uso: npm run eval:agentes */
import { evaluarLector } from "../server/evals/lectorGolden.ts";
import { evaluarRedactor } from "../server/evals/redactorGolden.ts";

const r = evaluarLector();
console.log(`\nLector — clasificación de respuestas: ${r.aciertos}/${r.total} (${(r.exactitud * 100).toFixed(1)}%)`);
for (const [clase, v] of Object.entries(r.porClase)) console.log(`  ${clase.padEnd(18)} ${v.aciertos}/${v.total}`);
if (r.fallos.length) {
  console.log("\nFallos:");
  for (const f of r.fallos) console.log(`  ${f.id}: esperado ${f.esperado}, obtenido ${f.obtenido}${f.conocido ? `  [conocido: ${f.conocido}]` : "  [NUEVO]"}`);
}

const red = evaluarRedactor();
console.log(`\nRedactor — veredicto de pitches: ${red.aciertos}/${red.total} (${(red.exactitud * 100).toFixed(1)}%)`);
for (const [motivo, v] of Object.entries(red.porMotivo)) console.log(`  ${motivo.padEnd(18)} ${v.detectados}/${v.total}`);
if (red.fallos.length) {
  console.log("\nFallos:");
  for (const f of red.fallos) console.log(`  ${f.id}: esperado ${f.esperado}, obtenido ${f.obtenido} (${f.motivos.join(", ") || "sin motivos"})${f.conocido ? `  [conocido: ${f.conocido}]` : "  [NUEVO]"}`);
}
