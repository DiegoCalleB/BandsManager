/**
 * Banco de pruebas de la detección de momentos virales.
 *
 *   # 1. Crea un caso por vídeo (necesita yt-dlp y ffmpeg; el gráfico de repeticiones sale de la ficha):
 *   yt-dlp --dump-json --skip-download "https://www.youtube.com/watch?v=ID" > ficha.json
 *   npm run banco:deteccion -- --generar ID ficha.json banco/mi-video.json
 *
 *   # 2. Mide el detector contra lo que la gente ya repite (todos los .json de la carpeta):
 *   npm run banco:deteccion -- banco
 *
 * Lanza el mismo comando antes y después de tocar los pesos: si "captura" sube, mejora.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { evaluarCaso, formatearBanco, type CasoBanco } from "../server/utils/bancoDeteccion.js";

const args = process.argv.slice(2);

async function generar(videoId: string, fichaPath: string, salida: string) {
  const { fichaDeYtDlp, urlDeAudioDirecta, urlDeVideoDirecta } = await import("../server/utils/youtubeSource.js");
  const { analizarEnergiaAudio } = await import("../server/utils/audioEnergy.js");
  const { detectarCambiosDePlano, detectarTipoContenido } = await import("../server/utils/viralSignals.js");
  const { curvaDeInteres } = await import("../server/utils/senalesPublico.js");
  const { canonicalYouTubeUrl } = await import("../server/services/youtubeMeta.js");

  const ficha = fichaDeYtDlp(JSON.parse(readFileSync(fichaPath, "utf8")));
  const interes = curvaDeInteres({ duracion: ficha.duration, heatmap: ficha.heatmap });
  if (!interes) throw new Error("Este vídeo no trae gráfico de «lo más reproducido»: no sirve como caso de prueba.");
  const url = canonicalYouTubeUrl(videoId);
  const audio = await urlDeAudioDirecta(url);
  if (!audio) throw new Error("No se pudo obtener el audio.");
  const curva = await analizarEnergiaAudio(audio, { timeoutMs: 180_000 });
  const video = await urlDeVideoDirecta(url);
  const cambiosDePlano = video ? await detectarCambiosDePlano(video, { timeoutMs: 180_000 }) : [];
  const caso: CasoBanco = { nombre: ficha.title || videoId, tipo: detectarTipoContenido(ficha.title, ficha.description), curva, cambiosDePlano, interes: interes.curva };
  writeFileSync(salida, JSON.stringify(caso));
  console.log(`Caso guardado en ${salida} (${curva.length} puntos de audio, ${cambiosDePlano.length} cambios de plano, tipo ${caso.tipo}).`);
}

async function main() {
  if (args[0] === "--generar") {
    const [, id, ficha, salida] = args;
    if (!id || !ficha || !salida) throw new Error("Uso: --generar ID ficha.json salida.json");
    return generar(id, ficha, salida);
  }
  const carpeta = args[0];
  if (!carpeta) throw new Error("Uso: npm run banco:deteccion -- carpeta   (o --generar ID ficha.json salida.json)");
  const casos = readdirSync(carpeta).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(join(carpeta, f), "utf8")) as CasoBanco);
  console.log(formatearBanco(casos.map((c) => evaluarCaso(c))));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
