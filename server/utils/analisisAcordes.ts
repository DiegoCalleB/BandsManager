import type { AnalisisAcordes, Song, SegmentoAcordeAnalizado } from "../../src/types.js";

/** Súbela cuando cambie el algoritmo: así se sabe qué canciones conviene reanalizar. */
export const VERSION_ANALISIS_ACORDES = 1;

const ESPANOL_A_INTERNACIONAL: Record<string, string> = {
  do: "C", re: "D", mi: "E", fa: "F", sol: "G", la: "A", si: "B",
};

/**
 * Convierte «Lam», «Do#», «F#m», «Sib», «C» a notación internacional («Am», «C#», «F#m», «A#»).
 * Devuelve null si no se reconoce (el detector funciona igual sin tonalidad).
 */
export function normalizarTonalidad(valor?: string | null): string | null {
  if (!valor) return null;
  const t = valor.trim().replace(/\s+(mayor|major)$/i, "").replace(/\s+(menor|minor)$/i, "m");
  const m = /^(do|re|mi|fa|sol|la|si|[A-Ga-g])([#b♯♭]?)(m|min)?$/i.exec(t);
  if (!m) return null;
  const base = ESPANOL_A_INTERNACIONAL[m[1].toLowerCase()] ?? m[1].toUpperCase();
  const alt = m[2] === "♯" ? "#" : m[2] === "♭" ? "b" : m[2];
  const menor = m[3] ? "m" : "";
  if (alt === "b") {
    const bemol: Record<string, string> = { C: "B", D: "C#", E: "D#", F: "E", G: "F#", A: "G#", B: "A#" };
    return `${bemol[base]}${menor}`;
  }
  return `${base}${alt}${menor}`;
}

export interface FuenteAudioAcordes {
  url: string;
  fuente: AnalisisAcordes["fuente"];
}

/**
 * Elige sobre qué audio analizar: una pista «Instrumental» separada por Iris (sin voz, el croma
 * sale mucho más limpio) si existe, y si no la mezcla del audio principal.
 */
export function elegirFuenteAudio(song: Partial<Song> | null | undefined): FuenteAudioAcordes | null {
  if (!song) return null;
  for (const idea of song.audioIdeas ?? []) {
    const pista = (idea.pistas ?? []).find((p) => /instrumental/i.test(p.nombre || "") && p.audioUrl);
    if (pista) return { url: pista.audioUrl, fuente: "instrumental" };
  }
  const principal = song.audioPrincipalUrl || song.audioUrl;
  return principal ? { url: principal, fuente: "mezcla" } : null;
}

export function construirAnalisis(params: {
  segmentos: SegmentoAcordeAnalizado[];
  fuente: AnalisisAcordes["fuente"];
  tonalidad: string | null;
  duracionSegundos: number;
}): AnalisisAcordes {
  return {
    version: VERSION_ANALISIS_ACORDES,
    analizadoEn: new Date().toISOString(),
    fuente: params.fuente,
    duracionSegundos: Math.round(params.duracionSegundos * 10) / 10,
    tonalidad: params.tonalidad,
    segmentos: params.segmentos.map((s) => ({ t0: s.t0, t1: s.t1, acorde: s.acorde, confianza: s.confianza })),
  };
}
