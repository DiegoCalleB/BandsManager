/**
 * Detecta los acordes de un audio y, si se da un fichero de verdad, mide el acierto por tiempo.
 *
 *   npx tsx scripts/detectar-acordes.ts cancion.mp3 [--tono Am] [--verdad verdad.txt]
 *
 * verdad.txt: una línea por acorde, «inicio fin acorde» en segundos (ej. «0 4.2 Am»).
 * Sirve para fijar la LÍNEA BASE con canciones reales antes de tocar el algoritmo: sin ese
 * número no se sabe si un cambio mejora o empeora.
 */
import fs from "fs";
import { detectarAcordesDesdeAudio } from "../server/utils/chordDetection.ts";

const args = process.argv.slice(2);
const fuente = args.find((a) => !a.startsWith("--") && !args[args.indexOf(a) - 1]?.startsWith("--"));
const valor = (flag: string) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
if (!fuente) { console.error("Uso: tsx scripts/detectar-acordes.ts audio.mp3 [--tono Am] [--verdad verdad.txt]"); process.exit(1); }

const segmentos = await detectarAcordesDesdeAudio(fuente, { tonalidad: valor("--tono") });
if (!segmentos) { console.error("No se pudo leer el audio."); process.exit(1); }
for (const s of segmentos) console.log(`${s.t0.toFixed(2).padStart(7)} - ${s.t1.toFixed(2).padStart(7)}  ${s.acorde.padEnd(5)} conf ${s.confianza}`);

const rutaVerdad = valor("--verdad");
if (rutaVerdad) {
  const verdad = fs.readFileSync(rutaVerdad, "utf8").split("\n").map((l) => l.trim().split(/\s+/)).filter((p) => p.length >= 3)
    .map(([a, b, c]) => ({ t0: +a, t1: +b, acorde: c }));
  let ok = 0, total = 0;
  for (const v of verdad) for (let t = v.t0; t < v.t1; t += 0.1) {
    total++;
    if (segmentos.find((s) => t >= s.t0 && t < s.t1)?.acorde === v.acorde) ok++;
  }
  console.log(`\nAcierto por tiempo: ${total ? ((ok / total) * 100).toFixed(1) : 0} % (${ok}/${total} muestras)`);
}
