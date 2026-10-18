#!/usr/bin/env node
// Sincroniza los skills de agentes: skills/ es la FUENTE ÚNICA y cada herramienta lee una copia real
// (no symlinks: no sobreviven de forma fiable a un build/deploy de Railway). Ver skills/README.md.
//
// Uso:  node scripts/sync-skills.mjs            copia skills/ a cada herramienta
//       node scripts/sync-skills.mjs --check    falla (exit 1) si alguna copia difiere de la fuente
//       node scripts/sync-skills.mjs --prune    además borra de las copias los skills que ya no existen en la fuente
//
// Antes de este script la sincronización era manual y se había desviado: faltaban skills en la fuente y
// `.claude/skills/` (la carpeta que lee Claude Code) no existía.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FUENTE = path.join(ROOT, "skills");
// Una carpeta por herramienta que carga skills desde el repo.
const DESTINOS = [".claude/skills", ".gemini/skills", ".opencode/skills"];

const MODO_CHECK = process.argv.includes("--check");
const PRUNE = process.argv.includes("--prune");

const esSkill = (d) => fs.statSync(path.join(FUENTE, d)).isDirectory();
const skills = fs.readdirSync(FUENTE).filter(esSkill).sort();

// Todos los ficheros de un directorio, relativos a él.
function ficheros(dir) {
  const salida = [];
  const pila = [""];
  while (pila.length) {
    const rel = pila.pop();
    for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
      const r = path.join(rel, e.name);
      if (e.isDirectory()) pila.push(r);
      else salida.push(r.split(path.sep).join("/"));
    }
  }
  return salida.sort();
}

const diferencias = [];
const acciones = [];

for (const destino of DESTINOS) {
  const base = path.join(ROOT, destino);
  for (const skill of skills) {
    const origen = path.join(FUENTE, skill);
    const copia = path.join(base, skill);
    const enFuente = ficheros(origen);
    const enCopia = fs.existsSync(copia) ? ficheros(copia) : [];

    for (const f of enFuente) {
      const a = path.join(origen, f);
      const b = path.join(copia, f);
      if (!fs.existsSync(b)) diferencias.push(`${destino}/${skill}/${f}: falta`);
      else if (!fs.readFileSync(a).equals(fs.readFileSync(b))) diferencias.push(`${destino}/${skill}/${f}: difiere de skills/`);
      else continue;
      acciones.push(() => {
        fs.mkdirSync(path.dirname(b), { recursive: true });
        fs.copyFileSync(a, b);
      });
    }
    for (const f of enCopia.filter((x) => !enFuente.includes(x))) {
      diferencias.push(`${destino}/${skill}/${f}: no existe en skills/`);
      acciones.push(() => PRUNE && fs.rmSync(path.join(copia, f)));
    }
  }
  // Skills que existen en la copia pero no en la fuente.
  if (fs.existsSync(base)) {
    for (const d of fs.readdirSync(base).filter((x) => fs.statSync(path.join(base, x)).isDirectory())) {
      if (!skills.includes(d)) {
        diferencias.push(`${destino}/${d}: huérfano (no existe en skills/)`);
        acciones.push(() => PRUNE && fs.rmSync(path.join(base, d), { recursive: true }));
      }
    }
  }
}

if (MODO_CHECK) {
  if (diferencias.length) {
    console.error(`[sync-skills] ${diferencias.length} diferencia(s) entre skills/ y las copias por herramienta:`);
    for (const d of diferencias.slice(0, 25)) console.error("  - " + d);
    if (diferencias.length > 25) console.error(`  ... y ${diferencias.length - 25} más`);
    console.error("[sync-skills] Edita siempre skills/ y ejecuta: npm run skills:sync");
    process.exit(1);
  }
  console.log(`[sync-skills] OK - ${skills.length} skills idénticos en ${DESTINOS.join(", ")}.`);
} else {
  for (const accion of acciones) accion();
  const huerfanos = diferencias.filter((d) => d.includes("huérfano") || d.includes("no existe en skills/"));
  console.log(`[sync-skills] ${skills.length} skills sincronizados en ${DESTINOS.join(", ")} (${acciones.length} cambios).`);
  if (huerfanos.length && !PRUNE) console.warn(`[sync-skills] Quedan ${huerfanos.length} elementos huérfanos; usa --prune para borrarlos.`);
}
