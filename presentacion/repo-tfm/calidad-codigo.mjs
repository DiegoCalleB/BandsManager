#!/usr/bin/env node
/**
 * Mide la salud estructural del código y lo imprime en Markdown, para que lo que afirma el README se pueda comprobar:
 *   node scripts/calidad-codigo.mjs            # desde la raíz del repo
 *   node scripts/calidad-codigo.mjs --json     # lo mismo, en JSON
 * Mide: tamaño de ficheros, los más largos, límites entre capas, imports circulares (sin contar `import type`)
 * y atajos de tipos (`any`, `@ts-ignore`). No toca nada; solo lee src/ y server/.
 */
import fs from 'fs';
import path from 'path';

const RAICES = ['src', 'server'];
const files = [];
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== '__tests__') walk(p); }
    else if (/\.(ts|tsx)$/.test(e.name) && !/\.(test|spec)\./.test(e.name)) files.push(p);
  }
};
RAICES.filter((r) => fs.existsSync(r)).forEach(walk);
const set = new Set(files);
const src = new Map(files.map((f) => [f, fs.readFileSync(f, 'utf8')]));

// 1) tamaño
const lineas = files.map((f) => ({ f, n: src.get(f).split('\n').length })).sort((a, b) => b.n - a.n);
const orden = lineas.map((x) => x.n).sort((a, b) => a - b);
const pct = (p) => orden[Math.min(orden.length - 1, Math.floor(orden.length * p))];
const tamano = {
  ficheros: files.length, lineas: orden.reduce((a, b) => a + b, 0), mediana: pct(0.5), p90: pct(0.9), p99: pct(0.99),
  hasta300: orden.filter((n) => n <= 300).length, hasta500: orden.filter((n) => n <= 500).length,
  mas800: orden.filter((n) => n > 800).length, mas1000: orden.filter((n) => n > 1000).length, masLargos: lineas.slice(0, 10),
};

// 2) imports internos (sin `import type`, que no crean dependencia en ejecución)
const resolver = (desde, spec) => {
  if (!spec.startsWith('.')) return null;
  const b = path.normalize(path.join(path.dirname(desde), spec));
  for (const c of [b, b + '.ts', b + '.tsx', b.replace(/\.js$/, '.ts'), b.replace(/\.js$/, '.tsx'), path.join(b, 'index.ts'), path.join(b, 'index.tsx')]) if (set.has(c)) return c;
  return null;
};
const grafo = new Map();
let aristas = 0;
for (const f of files) {
  const salida = new Set();
  const limpio = src.get(f).replace(/^\s*(import|export)\s+type\s[^;]*;?/gm, '');
  for (const m of limpio.matchAll(/(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    const r = resolver(f, m[1] || m[2]);
    if (r && r !== f) salida.add(r);
  }
  grafo.set(f, [...salida]); aristas += salida.size;
}
// ciclos = componentes fuertemente conexos (Tarjan) con más de un fichero
let i = 0; const pila = [], enPila = new Set(), idx = new Map(), low = new Map(), ciclos = [];
const visita = (v) => {
  idx.set(v, i); low.set(v, i); i++; pila.push(v); enPila.add(v);
  for (const w of grafo.get(v)) {
    if (!idx.has(w)) { visita(w); low.set(v, Math.min(low.get(v), low.get(w))); } else if (enPila.has(w)) low.set(v, Math.min(low.get(v), idx.get(w)));
  }
  if (low.get(v) === idx.get(v)) { const c = []; let w; do { w = pila.pop(); enPila.delete(w); c.push(w); } while (w !== v); if (c.length > 1) ciclos.push(c); }
};
for (const v of files) if (!idx.has(v)) visita(v);

// 3) capas: el cliente no importa del servidor y el servidor no importa componentes
const importa = (carpeta, patron) => files.filter((f) => f.startsWith(carpeta + path.sep) && patron.test(src.get(f))).length;
const capas = {
  clienteImportaServidor: importa('src', /from\s+['"](\.\.\/)+server\//),
  servidorImportaComponentes: importa('server', /from\s+['"](\.\.\/)+src\/components/),
};

// 4) atajos de tipos
const cuenta = (re) => files.reduce((a, f) => a + (src.get(f).match(re) || []).length, 0);
const atajos = { any: cuenta(/:\s*any\b|\bas any\b/g), tsIgnore: cuenta(/@ts-ignore|@ts-expect-error/g), todo: cuenta(/\b(TODO|FIXME)\b/g) };

const r = { fecha: new Date().toISOString().slice(0, 10), tamano, imports: { aristas, gruposConCiclos: ciclos.length, mayorGrupo: Math.max(0, ...ciclos.map((c) => c.length)) }, capas, atajos };
if (process.argv.includes('--json')) { console.log(JSON.stringify(r, null, 2)); process.exit(0); }
const t = r.tamano;
console.log(`# Salud estructural del código (${r.fecha})\n`);
console.log('| Qué | Valor |\n|---|---|');
console.log(`| Ficheros de código (sin tests) | ${t.ficheros} (${t.lineas.toLocaleString('es-ES')} líneas) |`);
console.log(`| Tamaño típico | mediana ${t.mediana} líneas · el 90 % tiene ≤ ${t.p90} |`);
console.log(`| Ficheros de ≤ 300 líneas | ${t.hasta300} (${Math.round((t.hasta300 / t.ficheros) * 100)} %) |`);
console.log(`| Ficheros de > 1.000 líneas | ${t.mas1000} (deuda reconocida) |`);
console.log(`| Imports internos | ${aristas.toLocaleString('es-ES')} · grupos con ciclos: ${r.imports.gruposConCiclos} (el mayor, ${r.imports.mayorGrupo} ficheros) |`);
console.log(`| Cliente que importa del servidor | ${capas.clienteImportaServidor} |`);
console.log(`| Servidor que importa componentes | ${capas.servidorImportaComponentes} |`);
console.log(`| \`any\` explícitos · \`@ts-ignore\` · TODO | ${atajos.any} · ${atajos.tsIgnore} · ${atajos.todo} |`);
console.log('\n## Los 10 ficheros más largos\n');
t.masLargos.forEach((x) => console.log(`- ${x.n} · \`${x.f}\``));
