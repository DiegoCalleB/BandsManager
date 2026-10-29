/**
 * Benchmark de acordes contra referencias escritas a mano (benchmarks/acordes/README.md).
 *
 *   npm run benchmark:acordes                  # tabla por canción + total
 *   npm run benchmark:acordes -- --comprobar   # sale con error si empeora respecto a baseline.json
 *   npm run benchmark:acordes -- --guardar     # congela el resultado actual como nueva línea base
 *   npm run benchmark:acordes -- --prediccion otro/   # otro detector (p. ej. BTC) en lugar de predicciones/
 */
import fs from "fs";
import path from "path";
import { ejecutarBenchmark, regresiones, type MetricasBase } from "../src/utils/benchmarkAcordes.ts";
import { leerTramos, type TramoEval } from "../src/utils/evaluacionAcordes.ts";

const RAIZ = path.resolve("benchmarks/acordes");
const args = process.argv.slice(2);
const carpetaPred = args.includes("--prediccion") ? args[args.indexOf("--prediccion") + 1] : path.join(RAIZ, "predicciones");

const cargar = (dir: string) => {
  const m = new Map<string, TramoEval[]>();
  if (!fs.existsSync(dir)) return m;
  for (const f of fs.readdirSync(dir)) if (/\.(lab|json)$/i.test(f)) m.set(path.parse(f).name, leerTramos(fs.readFileSync(path.join(dir, f), "utf8")));
  return m;
};

const referencias = cargar(path.join(RAIZ, "referencias"));
const { canciones, total } = ejecutarBenchmark(referencias, cargar(carpetaPred));
const pct = (x: number) => `${(x * 100).toFixed(1).padStart(5)}%`;

for (const { cancion, resultado: r } of canciones) {
  console.log(
    r
      ? `${cancion.padEnd(28)} may/men ${pct(r.mayorMenor)}  raíz ${pct(r.raiz)}  cambios≤0,3s ${pct(r.cambios.encontrados03)}  error ${r.cambios.errorMedio.toFixed(2)}s  sesgo ${r.cambios.sesgo >= 0 ? "+" : ""}${r.cambios.sesgo.toFixed(2)}s`
      : `${cancion.padEnd(28)} (sin predicción)`,
  );
}
console.log(`\nTOTAL ${canciones.length} canciones, ${total.segundos} s: may/men ${pct(total.mayorMenor)}  raíz ${pct(total.raiz)}  cambios≤0,3s ${pct(total.encontrados03)}  error ${total.errorMedio.toFixed(2)}s  sesgo ${total.sesgo >= 0 ? "+" : ""}${total.sesgo.toFixed(2)}s`);

const archivoBase = path.join(RAIZ, "baseline.json");
if (args.includes("--guardar")) {
  fs.writeFileSync(archivoBase, JSON.stringify(total, null, 2) + "\n");
  console.log(`Línea base guardada en ${path.relative(".", archivoBase)}`);
}
if (args.includes("--comprobar")) {
  if (!fs.existsSync(archivoBase)) { console.error("No hay baseline.json: ejecuta con --guardar primero."); process.exit(1); }
  const fallos = regresiones(total, JSON.parse(fs.readFileSync(archivoBase, "utf8")) as MetricasBase);
  if (fallos.length) { console.error(`REGRESIÓN respecto a la línea base:\n  ${fallos.join("\n  ")}`); process.exit(1); }
  console.log("Sin regresiones respecto a la línea base.");
}
