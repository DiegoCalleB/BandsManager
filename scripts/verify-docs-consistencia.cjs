#!/usr/bin/env node
// Comprueba que la documentación no contradiga al código:
//  1. Las cifras del README («283 endpoints», «2.079 tests»...) coinciden con el recuento real.
//  2. Todos los [[enlaces]] del grafo Obsidian (docs/knowledge_graph) apuntan a una nota existente.
// Pensado para CI: sale con código 1 si algo no cuadra. Ejecutar: node scripts/verify-docs-consistencia.cjs
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const leer = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

// Recorre un directorio y devuelve los ficheros que cumplen el filtro (sin node_modules).
function ficheros(dir, filtro) {
  const salida = [];
  const pila = [path.join(ROOT, dir)];
  while (pila.length) {
    const actual = pila.pop();
    if (!fs.existsSync(actual)) continue;
    for (const entrada of fs.readdirSync(actual, { withFileTypes: true })) {
      if (entrada.name === "node_modules") continue;
      const ruta = path.join(actual, entrada.name);
      if (entrada.isDirectory()) pila.push(ruta);
      else if (filtro(entrada.name)) salida.push(ruta);
    }
  }
  return salida;
}

const esTest = (nombre) => /\.test\.tsx?$/.test(nombre);
const lineas = (archivos, re) =>
  archivos.reduce((n, f) => n + fs.readFileSync(f, "utf8").split("\n").filter((l) => re.test(l)).length, 0);

const testsArchivos = [
  ...ficheros("server", esTest),
  ...ficheros("src", esTest),
  ...ficheros("e2e", esTest),
];

// Las rutas salen del contrato OpenAPI generado por AST (scripts/generate-openapi.mjs), no de un regex:
// un regex sobre `router.get(` subestima porque hay routers con otro nombre y rutas con alias.
function contarContrato() {
  const spec = JSON.parse(leer("docs/api/openapi.json"));
  const fuentes = new Set();
  let rutasHttp = 0;
  for (const metodos of Object.values(spec.paths)) {
    for (const op of Object.values(metodos)) { rutasHttp++; fuentes.add(op["x-source"]); }
  }
  return { rutasHttp, declaraciones: fuentes.size };
}

const metricas = {
  ...contarContrato(),
  tests: lineas(testsArchivos, /^\s*(it|test)(\.each)?\(/),
  migraciones: ficheros("supabase/migrations", (n) => n.endsWith(".sql")).length,
  migracionesFueraRunner: ficheros("supabase", (n) => n.endsWith(".sql")).length -
    ficheros("supabase/migrations", (n) => n.endsWith(".sql")).length,
  componentes: ficheros("src", (n) => n.endsWith(".tsx") && !esTest(n)).length,
};

// Cada regla: patrón que captura la cifra en el README y la métrica que debe igualar.
const reglas = [
  { nombre: "rutas HTTP", re: /(\d[\d.]*) rutas HTTP/, valor: metricas.rutasHttp },
  { nombre: "declaraciones de handler", re: /(\d[\d.]*) declaraciones de handler/, valor: metricas.declaraciones },
  { nombre: "tests", re: /(\d[\d.]*) tests unitarios/, valor: metricas.tests },
  { nombre: "migraciones", re: /(\d[\d.]*) migraciones SQL en el runner/, valor: metricas.migraciones },
  { nombre: "componentes", re: /(\d[\d.]*) componentes React/, valor: metricas.componentes },
];

let problemas = 0;
const readme = leer("README.md");

for (const regla of reglas) {
  const m = readme.match(regla.re);
  if (!m) {
    console.error(`[docs-consistencia] FALTA la cifra de «${regla.nombre}» en README.md (patrón ${regla.re})`);
    problemas++;
    continue;
  }
  const citado = Number(m[1].replace(/\./g, ""));
  if (citado !== regla.valor) {
    console.error(`[docs-consistencia] README dice ${citado} ${regla.nombre}, el repo tiene ${regla.valor}`);
    problemas++;
  }
}

// Enlaces del grafo: [[destino]] o [[destino|texto]] debe existir como docs/knowledge_graph/destino.md
const nodos = ficheros("docs/knowledge_graph", (n) => n.endsWith(".md"));
const existentes = new Set(nodos.map((f) => path.basename(f, ".md")));
for (const f of nodos) {
  const texto = fs.readFileSync(f, "utf8");
  for (const [, destino] of texto.matchAll(/\[\[([^\]|#]+)/g)) {
    if (!existentes.has(destino.trim())) {
      console.error(`[docs-consistencia] ${path.relative(ROOT, f)}: enlace roto [[${destino.trim()}]]`);
      problemas++;
    }
  }
}

if (problemas > 0) {
  console.error(`[docs-consistencia] ${problemas} incoherencia(s). Recuentos reales: ${JSON.stringify(metricas)}`);
  process.exit(1);
}
console.log(`[docs-consistencia] OK - cifras del README y enlaces del grafo coherentes. ${JSON.stringify(metricas)}`);
