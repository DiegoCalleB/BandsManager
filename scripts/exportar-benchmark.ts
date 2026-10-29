/**
 * Convierte las correcciones de la banda en ficheros del benchmark (benchmarks/acordes/):
 * `referencias/<slug>.lab` (verdad = `referenciaManual`) y `predicciones/<slug>.lab` (lo que dijo el detector
 * antes de corregir). Así anotar una canción es corregirla en el visor y ejecutar esto.
 *
 *   npx tsx scripts/exportar-benchmark.ts                      # Supabase (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
 *   npx tsx scripts/exportar-benchmark.ts --archivo canciones.json
 *   npx tsx scripts/exportar-benchmark.ts --solo "Nombre de la canción"   # filtra por título (subcadena)
 */
import fs from "fs";
import path from "path";
import type { AnalisisAcordes } from "../src/types.ts";

interface Fila { titulo: string; analisis_acordes?: AnalisisAcordes | null; analisisAcordes?: AnalisisAcordes | null }

const args = process.argv.slice(2);
const valor = (flag: string) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
const slug = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const lab = (tramos: Array<{ t0: number; t1: number; acorde: string }>) => tramos.map((s) => `${s.t0.toFixed(2)} ${s.t1.toFixed(2)} ${s.acorde}`).join("\n") + "\n";

async function cargar(): Promise<Fila[]> {
  const archivo = valor("--archivo");
  if (archivo) return JSON.parse(fs.readFileSync(archivo, "utf8"));
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !clave) { console.error("Falta --archivo o SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY."); process.exit(1); }
  const res = await fetch(`${url}/rest/v1/songs?select=titulo,analisis_acordes&analisis_acordes=not.is.null`, { headers: { apikey: clave, Authorization: `Bearer ${clave}` } });
  if (!res.ok) { console.error(`Supabase respondió ${res.status}: ${await res.text()}`); process.exit(1); }
  return res.json();
}

const filtro = valor("--solo")?.toLowerCase();
const raiz = path.resolve("benchmarks/acordes");
fs.mkdirSync(path.join(raiz, "referencias"), { recursive: true });
fs.mkdirSync(path.join(raiz, "predicciones"), { recursive: true });
let n = 0;
for (const fila of await cargar()) {
  if (filtro && !fila.titulo.toLowerCase().includes(filtro)) continue;
  const a = fila.analisis_acordes ?? fila.analisisAcordes;
  const ref = a?.referenciaManual;
  if (!a || !ref?.segmentos?.length || !(ref.hasta > 0)) continue;
  const editado = (a.segmentos ?? []).some((s) => s.editado);
  const pred = editado ? a.segmentosOriginales ?? [] : a.segmentos ?? [];
  if (!pred.length) continue;
  const nombre = slug(fila.titulo);
  // La referencia solo vale hasta donde la banda revisó; se recorta para no evaluar tramos sin corregir.
  const verdad = ref.segmentos.filter((s) => s.t0 < ref.hasta).map((s) => ({ ...s, t1: Math.min(s.t1, ref.hasta) }));
  fs.writeFileSync(path.join(raiz, "referencias", `${nombre}.lab`), lab(verdad));
  fs.writeFileSync(path.join(raiz, "predicciones", `${nombre}.lab`), lab(pred.filter((s) => s.t0 < ref.hasta)));
  console.log(`✔ ${fila.titulo} → ${nombre}.lab (0–${Math.round(ref.hasta)} s)`);
  n++;
}
console.log(n ? `\n${n} canciones exportadas. Ejecuta: npm run benchmark:acordes -- --guardar` : "Ninguna canción con correcciones manuales.");
