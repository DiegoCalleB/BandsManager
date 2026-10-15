// Ajustes de impresión del setlist que se recuerdan POR BANDA (tabla `band_print_settings`).
// Módulo compartido: el cliente lo usa para aplicar/guardar y el servidor para validar lo que
// llega. Lista blanca estricta: solo estas claves, solo estos valores. Un cliente que envíe otra
// cosa no consigue guardar nada más (la columna es JSONB y sin esto sería un cajón sin fondo).
// Lo que NO se recuerda: el nº de hojas, que depende de cada repertorio concreto.

export type PrintTextAlign = "left" | "center";
export type PrintColumnsChoice = "auto" | 1 | 2;
export type PrintHandwritingFont = "caveat" | "permanent_marker" | "courier" | "sans";
export type PrintBadgesScope = "all" | "marked";
export type PrintHandwritingColor = "blue" | "black" | "red" | "purple";

export interface PrintSettings {
  textAlign: PrintTextAlign;
  columnsChoice: PrintColumnsChoice;
  showGeneralNotes: boolean;
  showTonality: boolean;
  showBpm: boolean;
  showDuration: boolean;
  showBandLogo: boolean;
  showWatermark: boolean;
  showAppBranding: boolean;
  handwritingFont: PrintHandwritingFont;
  handwritingColor: PrintHandwritingColor;
  /** Tono/BPM en todos los temas, o solo en los que cada músico ha marcado (`markedSongs`). */
  badgesScope: PrintBadgesScope;
  /** Temas con tono/BPM visibles por músico (id del músico → ids de canción). */
  markedSongs: Record<string, string[]>;
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  textAlign: "left",
  columnsChoice: "auto",
  showGeneralNotes: true,
  showTonality: true,
  showBpm: true,
  showDuration: false,
  showBandLogo: true,
  showWatermark: true,
  showAppBranding: true,
  handwritingFont: "caveat",
  handwritingColor: "blue",
  badgesScope: "marked",
  markedSongs: {},
};

const ENUMS: { [K in keyof PrintSettings]?: readonly unknown[] } = {
  textAlign: ["left", "center"],
  columnsChoice: ["auto", 1, 2],
  handwritingFont: ["caveat", "permanent_marker", "courier", "sans"],
  handwritingColor: ["blue", "black", "red", "purple"],
  badgesScope: ["all", "marked"],
};

const BOOLEANS = [
  "showGeneralNotes",
  "showTonality",
  "showBpm",
  "showDuration",
  "showBandLogo",
  "showWatermark",
  "showAppBranding",
] as const;

const MAX_MARK_MEMBERS = 60;
const MAX_MARK_SONGS = 300;
const MAX_ID_LENGTH = 80;

/** Mapa músico → temas marcados: solo strings cortos y con topes (la columna es JSONB). */
function sanitizeMarkedSongs(input: unknown): Record<string, string[]> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out: Record<string, string[]> = {};
  for (const [memberId, ids] of Object.entries(input as Record<string, unknown>).slice(0, MAX_MARK_MEMBERS)) {
    if (memberId.length > MAX_ID_LENGTH || memberId === "__proto__" || !Array.isArray(ids)) continue;
    const clean = ids
      .filter((x): x is string => typeof x === "string" && x.length > 0 && x.length <= MAX_ID_LENGTH)
      .slice(0, MAX_MARK_SONGS);
    if (clean.length) out[memberId] = Array.from(new Set(clean));
  }
  return out;
}

/** Se queda solo con las claves conocidas y con valores válidos; lo demás se descarta. */
export function sanitizePrintSettings(input: unknown): Partial<PrintSettings> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const src = input as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, allowed] of Object.entries(ENUMS)) {
    if (key in src && allowed!.includes(src[key])) out[key] = src[key];
  }
  for (const key of BOOLEANS) {
    if (typeof src[key] === "boolean") out[key] = src[key];
  }
  if ("markedSongs" in src) out.markedSongs = sanitizeMarkedSongs(src.markedSongs);
  return out as Partial<PrintSettings>;
}

/** Ajustes guardados (posiblemente incompletos o viejos) sobre los valores por defecto. */
export function mergePrintSettings(saved: unknown): PrintSettings {
  return { ...DEFAULT_PRINT_SETTINGS, ...sanitizePrintSettings(saved) };
}
