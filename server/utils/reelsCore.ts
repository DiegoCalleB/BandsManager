/**
 * Núcleo puro del generador de Reels: parseo de tiempos, saneado de lo que devuelve la IA
 * y construcción de pistas de subtítulos. Todo aquí es determinista y testeable, para que
 * la ruta HTTP solo se ocupe de red, ffmpeg y BD.
 */

export interface TranscriptItem {
  /** Milisegundos desde el inicio del vídeo. */
  offset: number;
  /** Duración en milisegundos. */
  duration: number;
  text: string;
}

export interface SubtitleCue {
  text: string;
  start: number;
  end: number;
}

export interface NormalizedHighlight {
  id: string;
  title: string;
  range: string;
  startSec: number;
  endSec: number;
  duration: number;
  confidence: number;
  energyLevel: string;
  hookText: string;
  recommendedCopy: string;
  copyTikTok: string;
  copyYouTube: string;
  hashtags: string[];
  cta: string;
  reason: string;
}

/* ------------------------------------------------------------------ tiempos */

export function parseTimeToSeconds(timeStr?: string): number {
  if (!timeStr) return 0;
  const limpio = String(timeStr).trim().replace(/[^\d:.]/g, "");
  if (!limpio) return 0;
  const partes = limpio.split(":");
  if (partes.length === 3) {
    return (parseInt(partes[0], 10) || 0) * 3600 + (parseInt(partes[1], 10) || 0) * 60 + (parseFloat(partes[2]) || 0);
  }
  if (partes.length === 2) {
    return (parseInt(partes[0], 10) || 0) * 60 + (parseFloat(partes[1]) || 0);
  }
  return parseFloat(partes[0]) || 0;
}

/** Acepta "0:15 - 0:45", "0:15-0:45", "00:00:15 → 00:00:45" y variantes con espacios raros. */
export function parseRange(rangeStr?: string): { start: number; end: number } {
  if (!rangeStr) return { start: 0, end: 0 };
  const normalizado = String(rangeStr).replace(/[–—→>]+/g, "-");
  const partes = normalizado.split("-");
  const start = parseTimeToSeconds(partes[0]);
  const end = partes.length > 1 ? parseTimeToSeconds(partes[1]) : 0;
  return { start, end };
}

export function formatMMSS(totalSeconds: number): string {
  const seguro = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const mins = Math.floor(seguro / 60);
  const secs = seguro % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function formatVttTime(seconds: number): string {
  const seguro = Math.max(0, Number(seconds) || 0);
  const hrs = Math.floor(seguro / 3600);
  const mins = Math.floor((seguro % 3600) / 60);
  const secs = seguro % 60;
  const [sInt, sDec = "000"] = secs.toFixed(3).split(".");
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${sInt.padStart(2, "0")}.${sDec}`;
}

/** Tiempo en formato ASS (h:mm:ss.cc), para subtítulos incrustados con ffmpeg. */
export function formatAssTime(seconds: number): string {
  const seguro = Math.max(0, Number(seconds) || 0);
  const hrs = Math.floor(seguro / 3600);
  const mins = Math.floor((seguro % 3600) / 60);
  const secs = seguro % 60;
  const [sInt, sDec = "00"] = secs.toFixed(2).split(".");
  return `${hrs}:${String(mins).padStart(2, "0")}:${sInt.padStart(2, "0")}.${sDec}`;
}

/* ------------------------------------------------------------- JSON de la IA */

/**
 * Los modelos añaden con frecuencia texto antes/después del JSON, vallas markdown a medias
 * o comas colgantes. `JSON.parse` a pelo sobre eso reventaba el análisis y la ruta caía al
 * fallback genérico aunque la IA hubiera respondido bien.
 */
export function extractJsonObject(raw?: string | null): any | null {
  if (!raw) return null;
  let texto = String(raw).trim();

  // Vallas markdown, abiertas o cerradas.
  texto = texto.replace(/^```(?:json|JSON)?\s*/m, "").replace(/```\s*$/m, "").trim();

  const intentar = (candidato: string): any | null => {
    try {
      return JSON.parse(candidato);
    } catch (e) {
      try {
        // Comas colgantes antes de } o ], el fallo más común del modelo.
        return JSON.parse(candidato.replace(/,\s*([}\]])/g, "$1"));
      } catch (e2) {
        return null;
      }
    }
  };

  const directo = intentar(texto);
  if (directo && typeof directo === "object") return directo;

  // Recorte por llaves/corchetes equilibrados, ignorando los que van dentro de strings.
  for (const [abre, cierra] of [["{", "}"], ["[", "]"]] as const) {
    const inicio = texto.indexOf(abre);
    if (inicio === -1) continue;
    let profundidad = 0;
    let enString = false;
    let escapado = false;
    for (let i = inicio; i < texto.length; i++) {
      const c = texto[i];
      if (escapado) { escapado = false; continue; }
      if (c === "\\") { escapado = true; continue; }
      if (c === '"') { enString = !enString; continue; }
      if (enString) continue;
      if (c === abre) profundidad++;
      else if (c === cierra) {
        profundidad--;
        if (profundidad === 0) {
          const recortado = intentar(texto.substring(inicio, i + 1));
          if (recortado && typeof recortado === "object") return recortado;
          break;
        }
      }
    }
  }

  return null;
}

/* ------------------------------------------------ saneado de los highlights */

function aTexto(v: any, porDefecto = ""): string {
  if (v === null || v === undefined) return porDefecto;
  if (Array.isArray(v)) return v.map((x) => String(x)).join(" ");
  const s = String(v).trim();
  return s || porDefecto;
}

function aHashtags(v: any, porDefecto: string[]): string[] {
  const bruto = Array.isArray(v) ? v : typeof v === "string" ? v.split(/[\s,]+/) : [];
  const salida: string[] = [];
  for (const item of bruto) {
    let s = String(item || "").trim();
    if (!s) continue;
    if (!s.startsWith("#")) s = `#${s.replace(/^#+/, "")}`;
    s = s.replace(/[^#\wÁÉÍÓÚÜÑáéíóúüñ]/g, "");
    if (s.length > 1 && !salida.some((t) => t.toLowerCase() === s.toLowerCase())) salida.push(s);
    if (salida.length >= 12) break;
  }
  return salida.length ? salida : porDefecto;
}

export interface NormalizeOptions {
  /** Duración real del vídeo en segundos. Ningún clip puede salirse de aquí. */
  videoDuration: number;
  /** Duración objetivo elegida por el usuario (15 / 30 / 60). */
  targetDuration: number;
  defaultHashtags?: string[];
  /** Mínimo y máximo aceptables para un clip. */
  minDuration?: number;
  maxDuration?: number;
}

/**
 * Convierte lo que sea que haya devuelto la IA en clips utilizables: recorta al vídeo real,
 * fuerza duraciones sensatas, descarta solapamientos y ordena por confianza.
 *
 * Sin esto, un rango alucinado como "12:30 - 13:00" en un vídeo de 3 minutos llegaba tal cual
 * a ffmpeg y el recorte salía vacío.
 */
export function normalizeHighlights(rawList: any, options: NormalizeOptions): NormalizedHighlight[] {
  const videoDuration = Math.max(1, Math.floor(Number(options.videoDuration) || 0));
  const target = Math.max(5, Math.min(90, Math.floor(Number(options.targetDuration) || 30)));
  const minDur = Math.max(3, Math.floor(options.minDuration ?? Math.min(8, target)));
  const maxDur = Math.max(minDur, Math.floor(options.maxDuration ?? Math.min(videoDuration, Math.round(target * 1.5))));
  const defaults = options.defaultHashtags && options.defaultHashtags.length ? options.defaultHashtags : ["#MusicaEnDirecto"];

  const lista = Array.isArray(rawList) ? rawList : [];
  const salida: NormalizedHighlight[] = [];

  lista.forEach((item: any, idx: number) => {
    if (!item || typeof item !== "object") return;

    // Preferimos los segundos numéricos; el rango en texto es el respaldo.
    let start = Number(item.startSec ?? item.start_sec ?? item.start);
    let end = Number(item.endSec ?? item.end_sec ?? item.end);

    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      const delRango = parseRange(item.range || item.timeRange || item.rango);
      start = delRango.start;
      end = delRango.end;
    }

    if (!Number.isFinite(start) || start < 0) start = 0;
    if (!Number.isFinite(end) || end <= start) {
      const declarada = Number(item.duration);
      end = start + (Number.isFinite(declarada) && declarada > 0 ? declarada : target);
    }

    start = Math.max(0, Math.min(Math.floor(start), Math.max(0, videoDuration - minDur)));
    end = Math.min(Math.ceil(end), videoDuration);

    if (end - start < minDur) end = Math.min(videoDuration, start + minDur);
    if (end - start > maxDur) end = start + maxDur;
    // Si el clip se comió el final del vídeo, se desplaza hacia atrás en vez de descartarse.
    if (end > videoDuration) {
      end = videoDuration;
      start = Math.max(0, end - Math.max(minDur, Math.min(maxDur, target)));
    }
    if (end - start < minDur) return;

    // Solapamientos fuertes con un clip ya aceptado: nos quedamos con el primero (mejor
    // puntuado), porque tres versiones del mismo trozo no aportan nada al usuario.
    const solapaMucho = salida.some((prev) => {
      const inicioComun = Math.max(prev.startSec, start);
      const finComun = Math.min(prev.endSec, end);
      const comun = finComun - inicioComun;
      return comun > 0 && comun / Math.min(prev.endSec - prev.startSec, end - start) > 0.6;
    });
    if (solapaMucho) return;

    const confianzaBruta = Number(item.confidence ?? item.viralityScore ?? item.score);
    const confidence = Number.isFinite(confianzaBruta)
      ? Math.max(1, Math.min(100, Math.round(confianzaBruta)))
      : 80;

    salida.push({
      id: aTexto(item.id, `hl-${idx + 1}`),
      title: aTexto(item.title || item.titulo, `Momento destacado ${idx + 1}`),
      range: `${formatMMSS(start)} - ${formatMMSS(end)}`,
      startSec: start,
      endSec: end,
      duration: end - start,
      confidence,
      energyLevel: aTexto(item.energyLevel || item.energia, "Alta"),
      hookText: aTexto(item.hookText || item.hook, ""),
      recommendedCopy: aTexto(item.recommendedCopy || item.copy || item.caption, ""),
      copyTikTok: aTexto(item.copyTikTok || item.tiktokCopy, ""),
      copyYouTube: aTexto(item.copyYouTube || item.youtubeCopy || item.shortsTitle, ""),
      hashtags: aHashtags(item.hashtags, defaults),
      cta: aTexto(item.cta || item.callToAction, ""),
      reason: aTexto(item.reason || item.razon, "")
    });
  });

  return salida.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Clips de respaldo repartidos por el vídeo cuando no hay IA disponible. Se calculan sobre la
 * duración real, así que siguen siendo recortables aunque el texto sea genérico.
 */
export function buildFallbackHighlights(options: {
  videoDuration: number;
  targetDuration: number;
  bandName: string;
  videoTitle: string;
  hashtags: string[];
}): NormalizedHighlight[] {
  const total = Math.max(10, Math.floor(options.videoDuration || 0));
  const dur = Math.max(8, Math.min(Math.floor(options.targetDuration || 30), total));
  const titulo = (options.videoTitle || "").trim() || "el vídeo";
  const banda = (options.bandName || "").trim() || "la banda";
  const corto = titulo.length > 40 ? `${titulo.substring(0, 40)}…` : titulo;

  const plantillas = [
    {
      etiqueta: "Arranque y hook inicial",
      inicio: 0,
      confidence: 90,
      energia: "Muy Alta",
      razon: "Los primeros segundos son los que deciden la retención: empezar por el arranque asegura contexto inmediato."
    },
    {
      etiqueta: "Pasaje central en directo",
      inicio: Math.floor(total * 0.4),
      confidence: 84,
      energia: "Alta",
      razon: "Zona media del vídeo, normalmente donde el tema ya ha cogido cuerpo y el groove está asentado."
    },
    {
      etiqueta: "Cierre y clímax",
      inicio: Math.max(0, total - dur),
      confidence: 80,
      energia: "Muy Alta",
      razon: "El final suele concentrar la respuesta del público, buen sitio para una llamada a la acción."
    }
  ];

  const salida: NormalizedHighlight[] = [];
  plantillas.forEach((p, idx) => {
    const start = Math.max(0, Math.min(p.inicio, Math.max(0, total - dur)));
    const end = Math.min(total, start + dur);
    if (end - start < 5) return;
    if (salida.some((prev) => Math.abs(prev.startSec - start) < 2)) return;
    salida.push({
      id: `hl-${idx + 1}`,
      title: `${p.etiqueta} (${corto})`,
      range: `${formatMMSS(start)} - ${formatMMSS(end)}`,
      startSec: start,
      endSec: end,
      duration: end - start,
      confidence: p.confidence,
      energyLevel: p.energia,
      hookText: "",
      recommendedCopy: `${banda} en directo. Fragmento de "${titulo}" (${formatMMSS(start)}-${formatMMSS(end)}). ${options.hashtags.join(" ")}`,
      copyTikTok: "",
      copyYouTube: "",
      hashtags: options.hashtags,
      cta: "¿Te lo llevas al próximo bolo? Cuéntanoslo en comentarios.",
      reason: `${p.razon} (Corte automático: la IA no estaba disponible, ajusta el rango a mano si hace falta.)`
    });
  });

  return salida;
}

/* ------------------------------------------------------------- subtítulos */

const ENTIDADES: Array<[RegExp, string]> = [
  [/&amp;/g, "&"],
  [/&lt;/g, "<"],
  [/&gt;/g, ">"],
  [/&quot;/g, '"'],
  [/&#39;/g, "'"],
  [/&nbsp;/g, " "]
];

export function decodeTranscriptText(text?: string): string {
  let s = String(text || "");
  for (const [re, rep] of ENTIDADES) s = s.replace(re, rep);
  return s.replace(/\s+/g, " ").trim();
}

/** Recorta la transcripción del vídeo completo al tramo del clip, con tiempos relativos. */
export function buildSubtitleCues(
  transcript: TranscriptItem[],
  clipStartSec: number,
  clipDurationSec: number
): SubtitleCue[] {
  if (!Array.isArray(transcript) || transcript.length === 0) return [];
  const inicioMs = clipStartSec * 1000;
  const finMs = (clipStartSec + clipDurationSec) * 1000;

  const cues: SubtitleCue[] = [];
  for (const item of transcript) {
    const itemInicio = Number(item?.offset);
    const itemDur = Number(item?.duration);
    if (!Number.isFinite(itemInicio) || !Number.isFinite(itemDur)) continue;
    const itemFin = itemInicio + itemDur;
    // Solo tramos que realmente solapan; `>=` dejaba entrar líneas que acababan justo al empezar.
    if (itemFin <= inicioMs || itemInicio >= finMs) continue;

    const texto = decodeTranscriptText(item.text);
    if (!texto) continue;

    const start = Math.max(0, (itemInicio - inicioMs) / 1000);
    const end = Math.min(clipDurationSec, (itemFin - inicioMs) / 1000);
    if (end - start < 0.05) continue;

    cues.push({ text: texto, start: Number(start.toFixed(2)), end: Number(end.toFixed(2)) });
  }
  return cues;
}

export function buildVtt(cues: SubtitleCue[]): string {
  if (!cues.length) return "";
  let vtt = "WEBVTT\n\n";
  cues.forEach((cue, idx) => {
    vtt += `${idx + 1}\n${formatVttTime(cue.start)} --> ${formatVttTime(cue.end)}\n${cue.text}\n\n`;
  });
  return vtt;
}

/** Reparte cada línea en palabras con tiempos proporcionales a su longitud. */
export function buildWordOffsets(cues: SubtitleCue[]): Array<{ word: string; start: number; end: number }> {
  const salida: Array<{ word: string; start: number; end: number }> = [];
  for (const cue of cues) {
    const palabras = cue.text.split(/\s+/).filter(Boolean);
    if (!palabras.length) continue;
    const total = palabras.reduce((acc, w) => acc + w.length, 0) || palabras.length;
    const span = Math.max(0.01, cue.end - cue.start);
    let acumulado = 0;
    for (const palabra of palabras) {
      const peso = palabra.length / total;
      const start = cue.start + span * acumulado;
      acumulado += peso;
      const end = cue.start + span * acumulado;
      salida.push({
        word: palabra,
        start: Number(start.toFixed(2)),
        end: Number(Math.min(cue.end, end).toFixed(2))
      });
    }
  }
  return salida;
}

function escapeAss(text: string): string {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\r?\n/g, "\\N");
}

/** Parte una línea larga en dos, para que no se salga del ancho de un móvil en 9:16. */
export function wrapSubtitleLine(text: string, maxChars = 22): string {
  const limpio = String(text || "").trim();
  if (limpio.length <= maxChars) return limpio;
  const palabras = limpio.split(/\s+/);
  const lineas: string[] = [];
  let actual = "";
  for (const palabra of palabras) {
    if (!actual) actual = palabra;
    else if ((actual + " " + palabra).length <= maxChars) actual += ` ${palabra}`;
    else { lineas.push(actual); actual = palabra; }
  }
  if (actual) lineas.push(actual);
  return lineas.slice(0, 3).join("\\N");
}

/**
 * Subtítulos ASS listos para incrustar: fuente gruesa, borde negro y anclados en la zona
 * segura inferior de un 9:16 (por encima de la UI de Reels/TikTok).
 */
export function buildAssSubtitles(
  cues: SubtitleCue[],
  options: { width?: number; height?: number; fontSize?: number; primaryColour?: string } = {}
): string {
  const width = options.width || 1080;
  const height = options.height || 1920;
  const fontSize = options.fontSize || Math.round(height / 22);
  // ASS usa &HAABBGGRR (BGR invertido). Por defecto blanco opaco.
  const primary = options.primaryColour || "&H00FFFFFF";

  const cabecera = [
    "[Script Info]",
    "ScriptType: v4.00+",
    `PlayResX: ${width}`,
    `PlayResY: ${height}`,
    "WrapStyle: 2",
    "ScaledBorderAndShadow: yes",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Reel,Arial,${fontSize},${primary},&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,${Math.max(2, Math.round(fontSize / 9))},2,2,60,60,${Math.round(height * 0.16)},1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"
  ].join("\n");

  const eventos = cues
    .filter((c) => c && c.end > c.start && String(c.text || "").trim())
    .map(
      (c) =>
        `Dialogue: 0,${formatAssTime(c.start)},${formatAssTime(c.end)},Reel,,0,0,0,,${escapeAss(wrapSubtitleLine(c.text))}`
    )
    .join("\n");

  return `${cabecera}\n${eventos}\n`;
}

/* ------------------------------------------------------------------ ffmpeg */

export type CropMode = "crop" | "blur" | "none";

/**
 * Cadena de filtros para llevar el vídeo a 9:16.
 * - `crop`: recorta los laterales (encuadre cerrado, se pierde parte de la escena).
 * - `blur`: mete el vídeo entero centrado sobre una copia ampliada y desenfocada, así no se
 *   pierde a nadie de la banda. Es lo que hace la mayoría de apps de Reels.
 */
export function buildVerticalFilter(mode: CropMode, width = 1080, height = 1920): string[] {
  if (mode === "none") return [];
  if (mode === "blur") {
    return [
      `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},boxblur=luma_radius=40:luma_power=2[bg]`,
      `[0:v]scale=${width}:${height}:force_original_aspect_ratio=decrease[fg]`,
      `[bg][fg]overlay=(W-w)/2:(H-h)/2[v]`
    ];
  }
  return [
    `[0:v]crop='min(iw,ih*9/16)':'min(ih,iw*16/9)',scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}[v]`
  ];
}

/** ffmpeg trata `:` y `'` como separadores dentro de un filtro, así que hay que escaparlos. */
export function escapeFilterPath(filePath: string): string {
  return String(filePath || "")
    .replace(/\\/g, "/")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'");
}
