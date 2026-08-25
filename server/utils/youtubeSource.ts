import fs from "fs";
import path from "path";
import { execFile } from "child_process";

/**
 * Acceso a YouTube desde el servidor, en un solo sitio.
 *
 * Había dos formas distintas de hacer lo mismo en el repo: concert_to_album usaba yt-dlp con
 * banderas anti-bot y cookies, y el generador de Reels usaba @distube/ytdl-core a secas. La
 * segunda es la que YouTube bloquea sin miramientos desde una IP de datacenter como la de
 * Railway, así que el recorte de clips era el que se caía. Aquí se unifica el camino bueno.
 *
 * Orden de preferencia para los metadatos:
 *   1. YouTube Data API v3 (oficial, sin antibot, 1 unidad por vídeo de las 10.000/día)
 *   2. yt-dlp --dump-json (además trae los capítulos)
 *   3. oEmbed (público, pero sin duración)
 * Quien llama decide si además quiere probar ytdl-core al final.
 */

/* ------------------------------------------------------------------ proceso */

/**
 * Ejecuta un binario sin pasar por el shell. Con un array de argumentos no hay cadena que
 * romper, así que una URL con comillas o `$(...)` llega al proceso tal cual.
 */
export const ejecutar = (binario: string, args: string[], opts: any = {}) =>
  new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    execFile(binario, args, opts, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve({ stdout: stdout.toString(), stderr: stderr.toString() });
    });
  });

/* ------------------------------------------------------------------ yt-dlp */

export const COOKIES_FILE = path.join(process.cwd(), "data", "youtube_cookies.txt");

/** Cookies de sesión de YouTube, si el usuario las ha subido desde el gestor de cookies. */
export function banderasDeCookies(): string[] {
  try {
    if (fs.existsSync(COOKIES_FILE) && fs.statSync(COOKIES_FILE).size > 10) {
      return ["--cookies", COOKIES_FILE];
    }
  } catch {
    /* sin cookies se sigue igual, solo que con más probabilidad de antibot */
  }
  return [];
}

/** Banderas que hacen que YouTube no rechace la petición por parecer un bot. */
export function banderasAntiBot(): string[] {
  return [
    ...banderasDeCookies(),
    "--extractor-args", "youtube:player_client=android,web,mweb,ios",
    "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "--no-check-certificates"
  ];
}

/** Binario propio en bin/ si está, y si no el del PATH. */
export function rutaYtDlp(): string {
  const propio = path.join(process.cwd(), "bin", "yt-dlp");
  try {
    if (fs.existsSync(propio)) return propio;
  } catch {
    /* nada: caemos al PATH */
  }
  return "yt-dlp";
}

let ytDlpCache: { valor: boolean; cuando: number } | null = null;

/**
 * ¿Hay yt-dlp utilizable? Se cachea 5 minutos: comprobarlo en cada corte añadiría un proceso
 * por petición, y la respuesta no cambia sola.
 */
export async function ytDlpDisponible(): Promise<boolean> {
  if (ytDlpCache && Date.now() - ytDlpCache.cuando < 5 * 60 * 1000) return ytDlpCache.valor;
  let valor = false;
  try {
    await ejecutar(rutaYtDlp(), ["--version"], { timeout: 10_000 });
    valor = true;
  } catch {
    valor = false;
  }
  ytDlpCache = { valor, cuando: Date.now() };
  return valor;
}

/** Solo para los tests: olvida si yt-dlp estaba disponible. */
export function _resetYtDlpCache() {
  ytDlpCache = null;
}

export interface CapituloVideo {
  title: string;
  start: number;
  end: number;
}

export interface MetadatosVideo {
  title: string;
  description: string;
  author: string;
  duration: number;
  thumbnail: string;
  chapters: CapituloVideo[];
  /** De dónde salieron, para poder decírselo al usuario y depurar. */
  fuente: "data-api" | "yt-dlp" | "oembed" | "ytdl-core" | "ninguna";
}

export function metadatosVacios(): MetadatosVideo {
  return { title: "", description: "", author: "", duration: 0, thumbnail: "", chapters: [], fuente: "ninguna" };
}

/**
 * Los capítulos de YouTube son highlights que ya ha marcado a mano quien subió el vídeo:
 * como pista para elegir cortes valen más que cualquier heurística.
 */
export function normalizarCapitulos(bruto: any, duracionTotal = 0): CapituloVideo[] {
  if (!Array.isArray(bruto)) return [];
  const salida: CapituloVideo[] = [];
  for (const c of bruto) {
    const title = String(c?.title || "").trim();
    const start = Number(c?.start_time ?? c?.start);
    let end = Number(c?.end_time ?? c?.end);
    if (!title || !Number.isFinite(start) || start < 0) continue;
    if (!Number.isFinite(end) || end <= start) end = duracionTotal > start ? duracionTotal : start + 30;
    salida.push({ title, start: Math.floor(start), end: Math.floor(end) });
    if (salida.length >= 40) break;
  }
  return salida;
}

/** Metadatos vía yt-dlp. Es el único camino que además da los capítulos. */
export async function metadatosYtDlp(url: string): Promise<MetadatosVideo | null> {
  if (!(await ytDlpDisponible())) return null;
  try {
    const { stdout } = await ejecutar(
      rutaYtDlp(),
      [...banderasAntiBot(), "--dump-json", "--skip-download", url],
      { timeout: 60_000, maxBuffer: 20 * 1024 * 1024 }
    );
    const j = JSON.parse(stdout);
    const duration = Number(j?.duration) || 0;
    return {
      title: String(j?.title || ""),
      description: String(j?.description || ""),
      author: String(j?.uploader || j?.channel || ""),
      duration,
      thumbnail: String(j?.thumbnail || ""),
      chapters: normalizarCapitulos(j?.chapters, duration),
      fuente: "yt-dlp"
    };
  } catch (err: any) {
    console.log("[YouTube] yt-dlp --dump-json no disponible:", String(err?.message || err).substring(0, 200));
    return null;
  }
}

/**
 * Descarga el vídeo con yt-dlp. `destino` es la ruta final del mp4.
 * Devuelve false si yt-dlp no está o falla, para que quien llame pruebe otra cosa.
 */
export async function descargarConYtDlp(url: string, destino: string): Promise<boolean> {
  if (!(await ytDlpDisponible())) return false;
  try {
    await ejecutar(
      rutaYtDlp(),
      [
        ...banderasAntiBot(),
        // Preferimos un mp4 ya combinado; si no existe, el mejor vídeo + el mejor audio.
        "-f", "best[ext=mp4]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best",
        "--merge-output-format", "mp4",
        "--no-playlist",
        "-o", destino,
        url
      ],
      { timeout: 10 * 60_000, maxBuffer: 20 * 1024 * 1024 }
    );
    return fs.existsSync(destino) && fs.statSync(destino).size > 0;
  } catch (err: any) {
    console.warn("[YouTube] Descarga con yt-dlp fallida:", String(err?.message || err).substring(0, 300));
    return false;
  }
}

/**
 * URL directa del mejor flujo de solo audio, para que ffmpeg lo lea en streaming sin bajar el
 * vídeo entero a disco. Es lo que permite medir la energía del audio antes de decidir cortes
 * sin pagar una descarga completa.
 */
export async function urlDeAudioDirecta(url: string): Promise<string | null> {
  if (!(await ytDlpDisponible())) return null;
  try {
    const { stdout } = await ejecutar(
      rutaYtDlp(),
      [...banderasAntiBot(), "-g", "-f", "ba/bestaudio/best", "--no-playlist", url],
      { timeout: 60_000, maxBuffer: 4 * 1024 * 1024 }
    );
    const primera = stdout.split(/\r?\n/).map((l) => l.trim()).find((l) => l.startsWith("http"));
    return primera || null;
  } catch (err: any) {
    console.log("[YouTube] No se pudo obtener la URL de audio:", String(err?.message || err).substring(0, 200));
    return null;
  }
}

/* -------------------------------------------------------- YouTube Data API */

/**
 * Convierte la duración ISO 8601 de la Data API ("PT1H2M3S") a segundos.
 * Devuelve 0 si el formato no es reconocible, nunca NaN.
 */
export function parseIso8601Duration(iso?: string | null): number {
  if (!iso || typeof iso !== "string") return 0;
  const m = iso.trim().match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i);
  if (!m) return 0;
  const [, d, h, min, s] = m;
  const total =
    (parseInt(d || "0", 10) || 0) * 86400 +
    (parseInt(h || "0", 10) || 0) * 3600 +
    (parseInt(min || "0", 10) || 0) * 60 +
    Math.floor(parseFloat(s || "0") || 0);
  return Number.isFinite(total) ? total : 0;
}

export function tieneClaveDataApi(): boolean {
  const k = process.env.YOUTUBE_API_KEY || process.env.YT_API_KEY;
  return Boolean(k && k.trim().length > 10);
}

/**
 * Metadatos por la API oficial. Es la vía que no sufre el antibot, así que se prueba primero.
 * `YOUTUBE_API_KEY` ya estaba declarada en .env.example pero no la usaba nadie.
 */
export async function metadatosDataApi(videoId: string): Promise<MetadatosVideo | null> {
  const clave = (process.env.YOUTUBE_API_KEY || process.env.YT_API_KEY || "").trim();
  if (!clave || !videoId) return null;

  try {
    const url =
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet` +
      `&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(clave)}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`[YouTube] Data API respondió ${res.status}`);
      return null;
    }
    const j: any = await res.json();
    const item = j?.items?.[0];
    if (!item) return null;

    const snippet = item.snippet || {};
    const miniaturas = snippet.thumbnails || {};
    const mejor = miniaturas.maxres || miniaturas.standard || miniaturas.high || miniaturas.medium || miniaturas.default;

    return {
      title: String(snippet.title || ""),
      description: String(snippet.description || ""),
      author: String(snippet.channelTitle || ""),
      duration: parseIso8601Duration(item.contentDetails?.duration),
      thumbnail: String(mejor?.url || ""),
      // La Data API no expone los capítulos; los aporta yt-dlp si está.
      chapters: [],
      fuente: "data-api"
    };
  } catch (err: any) {
    console.log("[YouTube] Data API no disponible:", String(err?.message || err).substring(0, 200));
    return null;
  }
}

/** Combina dos fichas quedándose con el primer valor no vacío de cada campo. */
export function fusionarMetadatos(base: MetadatosVideo, extra: MetadatosVideo | null): MetadatosVideo {
  if (!extra) return base;
  return {
    title: base.title || extra.title,
    description: base.description || extra.description,
    author: base.author || extra.author,
    duration: base.duration > 0 ? base.duration : extra.duration,
    thumbnail: base.thumbnail || extra.thumbnail,
    chapters: base.chapters.length ? base.chapters : extra.chapters,
    fuente: base.fuente !== "ninguna" ? base.fuente : extra.fuente
  };
}
