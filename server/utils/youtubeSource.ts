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
 * Tramo que se le pide a yt-dlp y desplazamiento resultante.
 *
 * Se baja con un margen por delante para no quedarse sin el fotograma clave del principio,
 * y ese margen es justo lo que hay que restar luego al tiempo de corte: si se baja desde el
 * minuto 12 y después se busca el minuto 12 DENTRO del fichero, el corte sale del sitio
 * equivocado o directamente vacío.
 */
export function tramoDeDescarga(
  start: number,
  duration: number,
  margen = 2
): { desde: number; hasta: number; offset: number } {
  const inicio = Math.max(0, Math.floor(Number(start) || 0));
  const dur = Math.max(1, Math.ceil(Number(duration) || 1));
  const m = Math.max(0, Math.floor(margen));
  const desde = Math.max(0, inicio - m);
  return { desde, hasta: inicio + dur + m, offset: desde };
}

/** Un fichero de salida que exista y no esté vacío. */
function descargaValida(destino: string): boolean {
  try {
    return fs.existsSync(destino) && fs.statSync(destino).size > 0;
  } catch {
    return false;
  }
}

export interface OpcionesDescarga {
  /**
   * Descargar SOLO este tramo en vez del vídeo entero. Para sacar 30 segundos de un bolo de
   * dos horas, bajar el vídeo completo son varios GB en el disco efímero de Railway, además
   * de minutos de espera. Si el tramo falla se reintenta la descarga completa.
   */
  seccion?: { start: number; duration: number };
  /** Ruta de la carpeta de ffmpeg: yt-dlp lo necesita para poder recortar el tramo. */
  ffmpegDir?: string;
  timeoutMs?: number;
}

export interface ResultadoDescarga {
  ok: boolean;
  /**
   * Segundos del vídeo original que NO están en el fichero descargado, porque se bajó solo
   * un tramo. Quien recorte después tiene que restar esto a su tiempo de inicio: si se baja
   * desde el minuto 12 y se sigue buscando el minuto 12 dentro del fichero, el corte sale
   * del sitio equivocado (o vacío).
   */
  offset: number;
}

/**
 * Descarga el vídeo con yt-dlp. `destino` es la ruta final del mp4.
 * `ok: false` si yt-dlp no está o falla, para que quien llame pruebe otra cosa.
 */
export async function descargarConYtDlp(
  url: string,
  destino: string,
  opciones: OpcionesDescarga = {}
): Promise<ResultadoDescarga> {
  if (!(await ytDlpDisponible())) return { ok: false, offset: 0 };

  const timeout = opciones.timeoutMs ?? 10 * 60_000;
  const formato = ["-f", "best[ext=mp4]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best", "--merge-output-format", "mp4", "--no-playlist"];

  const intentar = async (argsExtra: string[]): Promise<boolean> => {
    try {
      await ejecutar(
        rutaYtDlp(),
        [...banderasAntiBot(), ...formato, ...argsExtra, "-o", destino, url],
        { timeout, maxBuffer: 20 * 1024 * 1024 }
      );
      return descargaValida(destino);
    } catch (err: any) {
      console.warn("[YouTube] Intento de descarga fallido:", String(err?.message || err).substring(0, 300));
      return false;
    }
  };

  // 1) Solo el tramo, si nos lo piden y podemos darle un ffmpeg a yt-dlp.
  const sec = opciones.seccion;
  if (sec && sec.duration > 0 && opciones.ffmpegDir) {
    const { desde, hasta, offset } = tramoDeDescarga(sec.start, sec.duration);
    const args = [
      "--ffmpeg-location", opciones.ffmpegDir,
      "--download-sections", `*${desde}-${hasta}`,
      "--force-keyframes-at-cuts"
    ];
    if (await intentar(args)) {
      console.log(`[YouTube] Descargado solo el tramo ${desde}-${hasta}s con yt-dlp.`);
      return { ok: true, offset };
    }
    // No todos los formatos ni todos los vídeos admiten el recorte en descarga: se limpia
    // lo que haya quedado a medias y se cae a la descarga completa.
    try {
      if (fs.existsSync(destino)) fs.unlinkSync(destino);
    } catch {
      /* si no se puede borrar, la descarga completa lo sobrescribe igual */
    }
    console.log("[YouTube] El recorte en descarga no salió; se baja el vídeo completo.");
  }

  // 2) Vídeo completo: el fichero empieza en 0, así que no hay desplazamiento que aplicar.
  return { ok: await intentar([]), offset: 0 };
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

/**
 * URL directa de un flujo SOLO DE VÍDEO en baja resolución, para detectar cambios de plano sin
 * bajar el vídeo entero ni tirar de una calidad que luego se va a reescalar de todos modos.
 *
 * Importante: `canonicalYouTubeUrl(videoId)` es la URL de la PÁGINA de YouTube, y ffmpeg no
 * puede decodificar eso directamente con -i. Hace falta la URL del stream real, igual que ya
 * se hace para el audio en `urlDeAudioDirecta`.
 */
export async function urlDeVideoDirecta(url: string): Promise<string | null> {
  if (!(await ytDlpDisponible())) return null;
  try {
    const { stdout } = await ejecutar(
      rutaYtDlp(),
      [...banderasAntiBot(), "-g", "-f", "bv*[height<=480]/bv*/best", "--no-playlist", url],
      { timeout: 60_000, maxBuffer: 4 * 1024 * 1024 }
    );
    const primera = stdout.split(/\r?\n/).map((l) => l.trim()).find((l) => l.startsWith("http"));
    return primera || null;
  } catch (err: any) {
    console.log("[YouTube] No se pudo obtener la URL de vídeo:", String(err?.message || err).substring(0, 200));
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
