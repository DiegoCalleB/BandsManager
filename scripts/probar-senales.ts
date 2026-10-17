/**
 * Prueba las señales de público con un vídeo real, sin red ni IA.
 *
 *   yt-dlp --dump-json --skip-download "https://www.youtube.com/watch?v=ID" > ficha.json
 *   curl "https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&maxResults=100&order=relevance&videoId=ID&key=TU_CLAVE" > comentarios.json   (opcional)
 *   npm run probar:senales -- ficha.json [comentarios.json] [segundosDelClip]
 *
 * Imprime si el vídeo cuenta como música, qué datos trae y qué tramos saldrían por interés del público.
 */
import { readFileSync } from "node:fs";
import { informeSenalesPublico } from "../server/utils/informeSenalesPublico.js";

const [fichaPath, comentariosPath, duracion] = process.argv.slice(2);
if (!fichaPath) {
  console.error("Uso: npm run probar:senales -- ficha.json [comentarios.json] [segundosDelClip]");
  process.exit(1);
}
const leer = (p: string) => JSON.parse(readFileSync(p, "utf8"));
console.log(informeSenalesPublico({ ficha: leer(fichaPath), comentarios: comentariosPath ? leer(comentariosPath) : null, duracionClip: duracion ? Number(duracion) : 30 }));
