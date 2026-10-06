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
  // Mismo orden que el visor de acordes (audio principal, y si no la primera idea con audio), para
  // que el botón no aparezca con un audio y el servidor busque otro.
  const principal = song.audioPrincipalUrl || song.audioUrl || song.audioIdeas?.find((i) => i.audioUrl)?.audioUrl;
  return principal ? { url: principal, fuente: "mezcla" } : null;
}

const STEM_ARMONICO = /(bajo|guitarr|teclad|arreglo|piano|sintet)/i;

export interface FuentesAudioAcordes {
  urls: string[];
  fuente: AnalisisAcordes["fuente"];
}

/**
 * Qué audio analizar, de mejor a peor para detectar armonía:
 *  1. pista «Instrumental» de Iris (sin voz);
 *  2. suma de los stems armónicos de Iris (bajo, guitarras, teclados, arreglos): sin voz ni
 *     batería, el croma queda mucho más limpio y el bajo aporta la raíz del acorde;
 *  3. la mezcla completa.
 * Si una fuente mejor falla al decodificar, el llamador baja al siguiente nivel con `alternativas`.
 */
export function elegirFuentesAudio(song: Partial<Song> | null | undefined): FuentesAudioAcordes[] {
  if (!song) return [];
  const niveles: FuentesAudioAcordes[] = [];
  for (const idea of song.audioIdeas ?? []) {
    const instrumental = (idea.pistas ?? []).find((p) => /instrumental/i.test(p.nombre || "") && p.audioUrl);
    if (instrumental) {
      niveles.push({ urls: [instrumental.audioUrl], fuente: "instrumental" });
      break;
    }
  }
  for (const idea of song.audioIdeas ?? []) {
    const armonicos = (idea.pistas ?? []).filter((p) => STEM_ARMONICO.test(p.nombre || "") && p.audioUrl);
    if (armonicos.length > 0) {
      niveles.push({ urls: armonicos.map((p) => p.audioUrl), fuente: "armonia" });
      break;
    }
  }
  // Mezcla: mismo orden que el visor (principal; si no, la primera idea con audio).
  const mezcla = song.audioPrincipalUrl || song.audioUrl || song.audioIdeas?.find((i) => i.audioUrl)?.audioUrl;
  if (mezcla) niveles.push({ urls: [mezcla], fuente: "mezcla" });
  return niveles;
}

/**
 * ¿Merece la pena guardar este resultado? Devuelve el motivo si NO (y el texto para el usuario),
 * o null si es razonable. Una canción de tres minutos con un único acorde («Mi» de 0:00 a 3:07)
 * no es una canción de un acorde: es un detector que no ha visto los cambios, y guardarlo como
 * análisis sería engañar al usuario.
 */
export function motivoAnalisisPocoFiable(
  segmentos: Array<{ t0: number; t1: number; acorde: string }>,
  duracionSegundos: number,
): string | null {
  if (segmentos.length === 0 || segmentos.every((s) => s.acorde === 'N')) {
    return 'No se detectaron acordes claros en este audio (¿es solo percusión, voz o silencio?).';
  }
  const sinAcorde = segmentos.filter((s) => s.acorde === 'N').reduce((a, s) => a + (s.t1 - s.t0), 0);
  if (duracionSegundos > 0 && sinAcorde / duracionSegundos > 0.7) {
    return 'El detector no pudo distinguir acordes en la mayor parte del audio (demasiado ruido o distorsión). Prueba a analizar la pista Instrumental o los stems de Iris.';
  }
  const cambios = segmentos.length - 1;
  if (duracionSegundos > 40 && cambios < duracionSegundos / 40) {
    return 'El detector solo encontró un acorde casi todo el tiempo, lo que no es creíble para una canción. No se ha guardado el resultado: prueba a analizar la pista Instrumental o los stems de Iris.';
  }
  return null;
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
