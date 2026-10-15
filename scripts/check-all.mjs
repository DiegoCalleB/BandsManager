#!/usr/bin/env node
// Puerta de calidad local: reproduce los pasos del CI sin depender de GitHub Actions.
// La llama el hook .husky/pre-push y cualquiera (persona o agente) con `npm run check:all`.
//
//   npm run check:all            typecheck + tests + verify:docs      (lo que corre el hook; ~1-2 min)
//   npm run check:all -- --full  además guardarraíles de diseño, build check y ratchet de ESLint
//   npm run check:all -- --strict falla también si un fallo «conocido» ya pasa (lista caducada)
//
// Fallos conocidos: scripts/known-red.json lista tests que ya fallaban en main, con motivo y fecha. Se
// SIGUEN ejecutando y se muestran; solo dejan de bloquear. Un test nuevo que falle sí bloquea. Es el mismo
// criterio de ratchet que el CI usa con tsc y ESLint: no se oculta la deuda, se impide que crezca.
//
// Saltarse el hook en una emergencia: git push --no-verify
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FULL = process.argv.includes("--full");
const STRICT = process.argv.includes("--strict");

const ejecutar = (cmd, args) =>
  new Promise((resolve) => {
    const inicio = Date.now();
    const hijo = spawn(cmd, args, { cwd: ROOT, env: { ...process.env, FORCE_COLOR: "0" } });
    let salida = "";
    hijo.stdout.on("data", (d) => (salida += d));
    hijo.stderr.on("data", (d) => (salida += d));
    hijo.on("close", (codigo) => resolve({ codigo, salida, segundos: Math.round((Date.now() - inicio) / 1000) }));
    hijo.on("error", (e) => resolve({ codigo: 127, salida: String(e), segundos: 0 }));
  });

const resultados = [];
const registrar = (nombre, ok, detalle = "", segundos = 0) => resultados.push({ nombre, ok, detalle, segundos });

// ── Tests (JSON) y typecheck en paralelo ────────────────────────────────────────────────────────
const jsonTests = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "check-all-")), "vitest.json");
console.log("[check:all] typecheck y tests en paralelo...");
const [tsc, vitest] = await Promise.all([
  ejecutar("npx", ["tsc", "--noEmit"]),
  ejecutar("npx", ["vitest", "run", "--reporter=json", `--outputFile=${jsonTests}`]),
]);

const erroresTs = (tsc.salida.match(/error TS\d+/g) || []).length;
registrar("typecheck (tsc --noEmit)", tsc.codigo === 0, erroresTs ? `${erroresTs} errores:\n${tsc.salida.split("\n").filter((l) => l.includes("error TS")).slice(0, 8).join("\n")}` : "", tsc.segundos);

// Fallos conocidos
const conocidosRuta = path.join(ROOT, "scripts/known-red.json");
const conocidos = fs.existsSync(conocidosRuta) ? JSON.parse(fs.readFileSync(conocidosRuta, "utf8")).filter((e) => e.file) : [];

let nuevos = [];
const toleradosQueFallan = [];
let caducados = [];
let total = 0;
try {
  const informe = JSON.parse(fs.readFileSync(jsonTests, "utf8"));
  total = informe.numTotalTests ?? 0;
  const falladosEnUso = new Set();
  for (const fichero of informe.testResults) {
    const rel = path.relative(ROOT, fichero.name).split(path.sep).join("/");
    const fallos = (fichero.assertionResults || []).filter((a) => a.status === "failed");
    if (!fallos.length && fichero.status === "failed") fallos.push({ fullName: "(el fichero no se pudo cargar)", failureMessages: [fichero.message || ""] });
    for (const f of fallos) {
      const idx = conocidos.findIndex((c) => rel.endsWith(c.file) && f.fullName.includes(c.test));
      if (idx >= 0) { falladosEnUso.add(idx); toleradosQueFallan.push({ rel, nombre: f.fullName, motivo: conocidos[idx].motivo }); }
      else nuevos.push({ rel, nombre: f.fullName, mensaje: (f.failureMessages?.[0] || "").split("\n")[0].slice(0, 160) });
    }
  }
  caducados = conocidos.filter((_, i) => !falladosEnUso.has(i));
} catch (e) {
  nuevos = [{ rel: "vitest", nombre: "no se pudo leer el informe de tests", mensaje: String(e).slice(0, 160) }];
}

// Reintento en aislado, una sola vez. Un test que falla con la máquina saturada (tsc y toda la suite en
// paralelo) pero pasa solo es «inestable» y se avisa; uno que vuelve a fallar bloquea. No se oculta nada:
// los inestables se listan siempre. El caso real que motivó esto: emailValidator hace una consulta DNS real.
const inestables = [];
if (nuevos.length && !nuevos.some((n) => n.rel === "vitest")) {
  const ficherosFallidos = [...new Set(nuevos.map((n) => n.rel))];
  const jsonReintento = path.join(path.dirname(jsonTests), "reintento.json");
  console.log(`[check:all] reintentando en aislado ${ficherosFallidos.length} fichero(s) con fallos...`);
  await ejecutar("npx", ["vitest", "run", ...ficherosFallidos, "--reporter=json", `--outputFile=${jsonReintento}`]);
  try {
    const informe = JSON.parse(fs.readFileSync(jsonReintento, "utf8"));
    const siguenFallando = new Set();
    for (const fichero of informe.testResults) {
      const rel = path.relative(ROOT, fichero.name).split(path.sep).join("/");
      const fallos = (fichero.assertionResults || []).filter((a) => a.status === "failed");
      for (const f of fallos) siguenFallando.add(`${rel}::${f.fullName}`);
      if (!fallos.length && fichero.status === "failed") siguenFallando.add(`${rel}::(el fichero no se pudo cargar)`);
    }
    inestables.push(...nuevos.filter((n) => !siguenFallando.has(`${n.rel}::${n.nombre}`)));
    nuevos = nuevos.filter((n) => siguenFallando.has(`${n.rel}::${n.nombre}`));
  } catch {
    // Si el reintento no se puede leer, se mantienen los fallos originales: ante la duda, bloquea.
  }
}

registrar(
  `tests (${total} ejecutados)`,
  nuevos.length === 0,
  nuevos.map((n) => `  ✗ ${n.rel} › ${n.nombre}\n    ${n.mensaje}`).join("\n"),
  vitest.segundos
);
if (caducados.length) registrar("fallos conocidos caducados", !STRICT, caducados.map((c) => `  ya pasa: ${c.file} › ${c.test}. Quítalo de scripts/known-red.json`).join("\n"));

// ── Documentación ───────────────────────────────────────────────────────────────────────────────
const docs = await ejecutar("npm", ["run", "-s", "verify:docs"]);
registrar("documentación (npm run verify:docs)", docs.codigo === 0, docs.codigo ? docs.salida.split("\n").filter((l) => /incoheren|roto|FALTA|dice|no coincide|diferencia|difiere/.test(l)).slice(0, 10).join("\n") : "", docs.segundos);

// ── Pasos extra (--full) ────────────────────────────────────────────────────────────────────────
if (FULL) {
  const diseno = await ejecutar("npm", ["run", "-s", "audit:diseno"]);
  registrar("guardarraíles de diseño", diseno.codigo === 0, diseno.codigo ? diseno.salida.split("\n").slice(-6).join("\n") : "", diseno.segundos);

  const build = await ejecutar("npm", ["run", "-s", "lint"]);
  registrar("build check (esbuild)", build.codigo === 0, build.codigo ? build.salida.split("\n").slice(-6).join("\n") : "", build.segundos);

  // Ratchet de ESLint: los umbrales se leen de ci.yml para no duplicar números que caducan.
  const ci = fs.readFileSync(path.join(ROOT, ".github/workflows/ci.yml"), "utf8");
  const baseTotal = Number(ci.match(/^\s*BASELINE=(\d+)\s*$/gm)?.map((l) => l.match(/\d+/)[0]).sort((a, b) => b - a)[0]);
  const baseHooks = Number(ci.match(/HOOKS_BASELINE=(\d+)/)?.[1]);
  const lint = await ejecutar("npx", ["eslint", ".", "-f", "json"]);
  try {
    const d = JSON.parse(lint.salida.slice(lint.salida.indexOf("[")));
    const totalLint = d.reduce((n, f) => n + f.messages.length, 0);
    const hooks = d.reduce((n, f) => n + f.messages.filter((m) => m.ruleId === "react-hooks/rules-of-hooks").length, 0);
    const ok = (!baseTotal || totalLint <= baseTotal) && (!baseHooks || hooks <= baseHooks);
    registrar(`ESLint ratchet (${totalLint} / ${baseTotal || "?"}; hooks ${hooks} / ${baseHooks || "?"})`, ok, ok ? "" : "Ha subido por encima del baseline de ci.yml.", lint.segundos);
  } catch {
    registrar("ESLint ratchet", false, "No se pudo leer la salida de eslint.", lint.segundos);
  }
}

// ── Informe ─────────────────────────────────────────────────────────────────────────────────────
console.log("");
for (const r of resultados) {
  console.log(`${r.ok ? "✔" : "✘"} ${r.nombre}${r.segundos ? ` · ${r.segundos}s` : ""}`);
  if (r.detalle) console.log(r.detalle);
}
if (toleradosQueFallan.length) {
  console.log(`\n⚠ ${toleradosQueFallan.length} fallo(s) conocido(s) (no bloquean; ver scripts/known-red.json):`);
  for (const t of toleradosQueFallan) console.log(`  · ${t.rel} › ${t.nombre}\n    ${t.motivo}`);
}

if (inestables.length) {
  console.log(`\n⚠ ${inestables.length} test(s) inestable(s): fallaron en la suite completa y pasaron al repetirlos en aislado (no bloquean):`);
  for (const t of inestables) console.log(`  · ${t.rel} › ${t.nombre}`);
}

const fallo = resultados.some((r) => !r.ok);
console.log(fallo ? "\n[check:all] ✘ hay fallos nuevos: el push se cancela. (Emergencia: git push --no-verify)" : "\n[check:all] ✔ todo en orden.");
process.exit(fallo ? 1 : 0);
