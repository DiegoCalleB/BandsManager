/**
 * Mide el acierto REAL de los acordes contra las correcciones de la banda.
 *
 *   npx tsx scripts/evaluar-acordes.ts                       # lee las canciones de Supabase (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
 *   npx tsx scripts/evaluar-acordes.ts --archivo canciones.json   # o de un volcado [{ titulo, analisis_acordes }]
 *   npx tsx scripts/evaluar-acordes.ts --prediccion resultados/   # compara además otro detector (p. ej. BTC en Colab)
 *
 * Referencia («verdad»): `analisis_acordes.referenciaManual`, que se guarda al corregir acordes en
 * el visor y sobrevive a los reanálisis. Se evalúa desde el principio hasta el último tramo
 * corregido: se asume que la banda revisa la canción en orden.
 *
 * Predicción de BandManager: lo que dijo el detector antes de corregir (`segmentosOriginales`) o,
 * si la canción se ha reanalizado después, el análisis actual.
 *
 * Con --prediccion, cada fichero (.lab de MIREX o .json de tramos) se empareja con la canción cuyo
 * título (sin acentos ni símbolos) coincide con el nombre del fichero.
 */
import fs from "fs";
import path from "path";
import { evaluarAcordes, leerTramos, type ResultadoEvaluacion, type TramoEval } from "../src/utils/evaluacionAcordes.ts";

const args = process.argv.slice(2);
const valor = (flag: string) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");

async function cargarCanciones(): Promise<Array<{ titulo: string; analisis: any }>> {
  const archivo = valor("--archivo");
  if (archivo) {
    const datos = JSON.parse(fs.readFileSync(archivo, "utf8"));
    return datos.map((d: any) => ({ titulo: d.titulo, analisis: d.analisis_acordes ?? d.analisisAcordes }));
  }
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !clave) {
    console.error("Falta --archivo o las variables SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }
  const res = await fetch(`${url}/rest/v1/songs?select=titulo,analisis_acordes&analisis_acordes=not.is.null`, {
    headers: { apikey: clave, Authorization: `Bearer ${clave}` },
  });
  if (!res.ok) { console.error(`Supabase respondió ${res.status}: ${await res.text()}`); process.exit(1); }
  return (await res.json()).map((d: any) => ({ titulo: d.titulo, analisis: d.analisis_acordes }));
}

function prediccionesExternas(): Map<string, TramoEval[]> {
  const carpeta = valor("--prediccion");
  const mapa = new Map<string, TramoEval[]>();
  if (!carpeta) return mapa;
  for (const f of fs.readdirSync(carpeta)) {
    if (!/\.(lab|json)$/i.test(f)) continue;
    mapa.set(normalizar(path.parse(f).name), leerTramos(fs.readFileSync(path.join(carpeta, f), "utf8")));
  }
  return mapa;
}

const pct = (x: number | undefined) => (x === undefined ? "  —  " : `${(x * 100).toFixed(1).padStart(5)}%`);
const linea = (nombre: string, r: ResultadoEvaluacion | null) =>
  r
    ? `  ${nombre.padEnd(12)} may/men ${pct(r.mayorMenor)}  raíz ${pct(r.raiz)}  cambios≤0,3s ${pct(r.cambios.encontrados03)}  ≤1s ${pct(r.cambios.encontrados1)}  error ${r.cambios.errorMedio.toFixed(2)}s  sobran ${r.cambios.sobrantes}`
    : `  ${nombre.padEnd(12)} (sin datos comparables)`;

const canciones = await cargarCanciones();
const externas = prediccionesExternas();
const resumen: Record<string, { seg: number; mm: number; raiz: number }> = {};
let evaluadas = 0;

for (const { titulo, analisis } of canciones) {
  const ref = analisis?.referenciaManual;
  if (!ref?.segmentos?.length || !(ref.hasta > 0)) continue;
  evaluadas++;
  const editadosAhora = (analisis.segmentos ?? []).some((s: any) => s.editado);
  const propia: TramoEval[] = editadosAhora ? analisis.segmentosOriginales ?? [] : analisis.segmentos ?? [];
  console.log(`\n«${titulo}» · revisado 0:00–${Math.floor(ref.hasta / 60)}:${String(Math.floor(ref.hasta % 60)).padStart(2, "0")}`);
  const candidatos: Array<[string, TramoEval[]]> = [["BandManager", propia]];
  const externa = externas.get(normalizar(titulo));
  if (externa) candidatos.push(["externo", externa]);
  for (const [nombre, pred] of candidatos) {
    const r = pred.length ? evaluarAcordes(ref.segmentos, pred, { desde: 0, hasta: ref.hasta }) : null;
    console.log(linea(nombre, r));
    if (r) {
      const acc = (resumen[nombre] ??= { seg: 0, mm: 0, raiz: 0 });
      acc.seg += r.segundosEvaluados;
      acc.mm += r.mayorMenor * r.segundosEvaluados;
      acc.raiz += r.raiz * r.segundosEvaluados;
    }
  }
}

if (evaluadas === 0) {
  console.log("Ninguna canción tiene correcciones manuales todavía: corrige acordes en el visor («Corregir») y vuelve a ejecutar.");
} else {
  console.log("\nTOTAL (ponderado por segundos revisados)");
  for (const [nombre, a] of Object.entries(resumen)) {
    console.log(`  ${nombre.padEnd(12)} may/men ${pct(a.mm / a.seg)}  raíz ${pct(a.raiz / a.seg)}  sobre ${Math.round(a.seg)} s`);
  }
}
