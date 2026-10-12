#!/usr/bin/env node
// Guardarraíl de tamaño (AGENTS.md §5.6): ningún fichero de código nuevo supera LIMITE líneas.
//
// Es un ratchet, como el de tsc y ESLint: la deuda existente NO se oculta, se congela.
//   · Fichero nuevo o ya sano que pasa de LIMITE      → falla. Hay que trocearlo antes de subirlo.
//   · Monolito de scripts/tamano-baseline.json que crece → falla. Lo nuevo nace en otro módulo.
//   · Monolito del baseline que baja                  → ok, pero el baseline debe bajar con él
//                                                       (`npm run verify:tamano -- --actualizar`).
//   · Monolito que llega a LIMITE o menos             → sale del baseline (se borra solo al actualizar).
// El baseline solo puede encoger: --actualizar nunca añade ficheros ni sube un tope.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LIMITE = 600;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE = path.join(ROOT, "scripts", "tamano-baseline.json");
const ACTUALIZAR = process.argv.includes("--actualizar");
const INICIAR = process.argv.includes("--iniciar"); // solo para crear el baseline la primera vez

const EXT = /\.(ts|tsx|js|jsx|mjs|cjs|css)$/;
const IGNORADOS = [/^docs\//, /^public\//, /^dist\//, /\.d\.ts$/, /package-lock\.json$/, /^src\/db_seed\.ts$/, /^skills\//, /^\.claude\//];

const ficheros = execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 })
  .toString()
  .split("\0")
  .filter((f) => f && EXT.test(f) && !IGNORADOS.some((r) => r.test(f)) && fs.existsSync(path.join(ROOT, f)));

const lineas = (f) => fs.readFileSync(path.join(ROOT, f), "utf8").split("\n").length;
const tamanos = Object.fromEntries(ficheros.map((f) => [f, lineas(f)]));
const base = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, "utf8")) : {};

if (INICIAR) {
  const nuevo = Object.fromEntries(Object.entries(tamanos).filter(([, n]) => n > LIMITE).sort((a, b) => b[1] - a[1]));
  fs.writeFileSync(BASELINE, JSON.stringify(nuevo, null, 2) + "\n");
  console.log(`[tamano] baseline creado con ${Object.keys(nuevo).length} monolitos (> ${LIMITE} líneas).`);
  process.exit(0);
}

const errores = [];
const bajan = [];
for (const [f, n] of Object.entries(tamanos)) {
  if (n <= LIMITE) continue;
  if (!(f in base)) errores.push(`${f}: ${n} líneas (límite ${LIMITE}). Trocéalo en hooks/subcomponentes/módulos antes de subirlo.`);
  else if (n > base[f]) errores.push(`${f}: ${n} líneas, el tope congelado es ${base[f]}. No infles un monolito: lo nuevo nace en otro módulo.`);
  else if (n < base[f]) bajan.push(f);
}
const caducados = Object.keys(base).filter((f) => !(f in tamanos) || tamanos[f] <= LIMITE);

if (ACTUALIZAR) {
  const nuevo = {};
  for (const [f, tope] of Object.entries(base)) {
    if (f in tamanos && tamanos[f] > LIMITE) nuevo[f] = Math.min(tope, tamanos[f]);
  }
  fs.writeFileSync(BASELINE, JSON.stringify(nuevo, null, 2) + "\n");
  console.log(`[tamano] baseline actualizado: ${Object.keys(nuevo).length} monolitos (antes ${Object.keys(base).length}).`);
}

if (errores.length) {
  console.error(`[tamano] ${errores.length} fichero(s) rompen el límite de ${LIMITE} líneas (AGENTS.md §5.6):`);
  errores.forEach((e) => console.error("  ✗ " + e));
  process.exit(1);
}
if (!ACTUALIZAR && (bajan.length || caducados.length)) {
  console.error("[tamano] Has reducido monolitos: baja también el baseline con `npm run verify:tamano -- --actualizar` y súbelo.");
  [...bajan, ...caducados].forEach((f) => console.error("  · " + f));
  process.exit(1);
}
console.log(`[tamano] OK — ${Object.keys(base).length} monolitos congelados, ningún fichero nuevo > ${LIMITE} líneas.`);
