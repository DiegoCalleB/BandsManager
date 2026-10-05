/**
 * ADN musical de la banda: perfil derivado del repertorio real (tempo, tonalidad y género
 * dominantes) más la instrumentación real de sus miembros, para que el chatbot pueda proponer
 * bases rítmicas (server/routes/chat.ts, 'propose_accompaniment') coherentes con lo que la
 * banda toca de verdad en vez de valores genéricos por defecto.
 *
 * Se calcula al vuelo a partir del estado ya cargado en memoria (sin llamadas nuevas a la
 * BD) porque el repertorio cambia con cada canción añadida/editada: cachearlo de forma
 * durable, como el ADN de voz (band.dna_expresion), quedaría obsoleto en cuanto se tocara
 * el repertorio.
 */
import type { Song } from "../../src/types.js";
import { parseInstruments, type BandMemberInfo } from "./bandProfile.js";
import type { DrumPatternStyle } from "../../src/types.js";

export interface MusicalDnaProfile {
  bpmSuggested: number;
  tonalidadSuggested: string;
  generoDominante: string;
  drumPatternSuggested: DrumPatternStyle;
  instrumentos: string[];
  sampleSize: number;
}

const GENERO_A_PATRON: { patron: DrumPatternStyle; claves: string[] }[] = [
  { patron: "reggae", claves: ["reggae", "dub"] },
  { patron: "ska", claves: ["ska"] },
  { patron: "cumbia", claves: ["cumbia", "vallenato", "tropical", "salsa", "latin", "reggaeton", "reggaetón"] },
  { patron: "punk", claves: ["punk", "hardcore", "metal"] },
  { patron: "funk", claves: ["funk", "soul", "disco"] },
  { patron: "pop", claves: ["pop", "indie"] }
];

function detectarPatronRitmico(genero: string): DrumPatternStyle {
  const lower = (genero || "").toLowerCase();
  for (const { patron, claves } of GENERO_A_PATRON) {
    if (claves.some((clave) => lower.includes(clave))) return patron;
  }
  return "rock";
}

function moda<T>(valores: T[]): T | undefined {
  if (valores.length === 0) return undefined;
  const conteo = new Map<T, number>();
  for (const v of valores) conteo.set(v, (conteo.get(v) || 0) + 1);
  let mejor: T | undefined;
  let mejorConteo = 0;
  for (const [valor, count] of conteo) {
    if (count > mejorConteo) {
      mejor = valor;
      mejorConteo = count;
    }
  }
  return mejor;
}

export function computeMusicalDna(
  songs: Partial<Song>[],
  bandGenre: string,
  members: BandMemberInfo[]
): MusicalDnaProfile {
  const bpms = songs.map((s) => s.bpm).filter((b): b is number => typeof b === "number" && b > 0);
  const tonalidades = songs.map((s) => s.tonalidad).filter((t): t is string => !!t);
  const generos = songs.map((s) => s.genero).filter((g): g is string => !!g);

  const bpmSuggested = bpms.length > 0
    ? Math.round(bpms.reduce((sum, b) => sum + b, 0) / bpms.length)
    : 120;
  const tonalidadSuggested = moda(tonalidades) || "La";
  const generoDominante = moda(generos) || bandGenre || "Variado";

  return {
    bpmSuggested,
    tonalidadSuggested,
    generoDominante,
    drumPatternSuggested: detectarPatronRitmico(generoDominante),
    instrumentos: parseInstruments(members),
    sampleSize: songs.length
  };
}
