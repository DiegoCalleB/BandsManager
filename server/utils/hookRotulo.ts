/**
 * Rótulo de enganche de los primeros segundos de un Reel, como capa ASS.
 *
 * Es lo que decide si alguien sigue mirando: la IA ya lo escribe (`hookText`), pero nunca llegaba
 * al vídeo. Va arriba, fuera de la franja que tapan los botones y el pie de Instagram/TikTok, en
 * caja opaca (contraste garantizado sobre cualquier imagen) y con entrada y salida suaves.
 */
import { formatAssTime, wrapSubtitleLine } from "./reelsCore.js";

export const DURACION_HOOK_SEG = 2.5;
const MAX_PALABRAS = 8;
const MAX_CARACTERES = 56;

/** Texto limpio y corto: sin saltos, sin etiquetas ASS y con tope de palabras. */
export function normalizarHook(texto?: string | null): string {
  const limpio = String(texto || "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[{}\\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const palabras = limpio.split(" ").filter(Boolean).slice(0, MAX_PALABRAS).join(" ");
  return palabras.length > MAX_CARACTERES ? palabras.slice(0, MAX_CARACTERES).replace(/\s+\S*$/, "") : palabras;
}

export function buildHookAss(texto: string, opciones: { width?: number; height?: number; duracion?: number } = {}): string | null {
  const hook = normalizarHook(texto);
  if (!hook) return null;
  const width = opciones.width || 1080;
  const height = opciones.height || 1920;
  const fin = Math.min(opciones.duracion ?? DURACION_HOOK_SEG, DURACION_HOOK_SEG);
  const fontSize = Math.round(height / 24);
  const margenV = Math.round(height * 0.2); // por debajo del encabezado de la app, lejos de los botones laterales
  const lineas = wrapSubtitleLine(hook, 20); // ya une las líneas con \N de ASS

  return [
    "[Script Info]",
    "ScriptType: v4.00+",
    `PlayResX: ${width}`,
    `PlayResY: ${height}`,
    "WrapStyle: 2",
    "ScaledBorderAndShadow: yes",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    // BorderStyle 3 = caja opaca; el 'Outline' es el relleno de la caja. texto blanco sobre negro al 80 % de opacidad (en ASS el alfa 00 es opaco, FF transparente).
    `Style: Hook,Arial,${fontSize},&H00FFFFFF,&H00FFFFFF,&H33000000,&H33000000,-1,0,0,0,100,100,0,0,3,${Math.round(fontSize / 3)},0,8,80,80,${margenV},1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    `Dialogue: 1,${formatAssTime(0)},${formatAssTime(fin)},Hook,,0,0,0,,{\\fad(150,250)}${lineas}`
  ].join("\n") + "\n";
}
