#!/usr/bin/env node
// Verifica que las rutas de archivo citadas entre backticks en AGENTS.md/skills/*.md
// existan de verdad en el repo. No detecta datos inventados (números, nombres de función)
// - eso exige leer el código, no un regex - pero sí habría pillado en el momento los dos bugs
// reales de esta clase que se colaron en septiembre de 2026 (server/supabaseClient.ts y
// server/routes/rehearsals.ts, ninguno de los dos existe) en vez de esperar a una reauditoría
// manual. Pensado para correr en CI en cada cambio a *.md, no solo a mano.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const DOCS = [
  "AGENTS.md",
  "CLAUDE.md",
  "TOOL_COMPATIBILITY.md",
  "AI_STUDIO_SUPABASE_GUIDE.md",
  "skills/README.md",
  "skills/agentic-harness/SKILL.md",
  "skills/security-multitenancy/SKILL.md",
  "skills/fullstack-ux-design/SKILL.md",
  "skills/supabase-architect/SKILL.md"
];

// Rutas citadas a propósito como "esto NO existe, no lo uses" (advertencias) o como ejemplo
// histórico de un bug ya corregido. No son bugs de esta clase, no las marques.
const INTENTIONAL_NONEXISTENT = new Set([
  "server/supabaseClient.ts", // no existe - advertencia explícita en supabase-architect SKILL.md
  "server/routes/rehearsals.ts" // ejemplo histórico en AGENTS.md §5.5 de una referencia ya corregida
]);

const PATH_PATTERN = /`((?:server|src)\/[a-zA-Z0-9_./-]+\.(?:ts|tsx|js|sql))`/g;

let problemas = 0;

for (const relDoc of DOCS) {
  const docPath = path.join(ROOT, relDoc);
  if (!fs.existsSync(docPath)) continue;
  const text = fs.readFileSync(docPath, "utf8");
  const vistos = new Set();
  let match;
  while ((match = PATH_PATTERN.exec(text)) !== null) {
    const ref = match[1];
    if (vistos.has(ref)) continue;
    vistos.add(ref);
    if (INTENTIONAL_NONEXISTENT.has(ref)) continue;
    const refPath = path.join(ROOT, ref);
    if (!fs.existsSync(refPath)) {
      console.error(`[verify-docs-refs] ${relDoc} cita "${ref}", que no existe en el repo.`);
      problemas++;
    }
  }
}

if (problemas > 0) {
  console.error(`\n${problemas} referencia(s) rota(s). Si es intencional (ej. "este archivo NO existe, no lo uses"), añádelo a INTENTIONAL_NONEXISTENT en este script con el motivo.`);
  process.exit(1);
}

console.log("[verify-docs-refs] OK - todas las rutas citadas en la documentación existen.");
