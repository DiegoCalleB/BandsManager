/**
 * Informe de las señales de público de un vídeo, a partir de lo que devuelven yt-dlp
 * (`--dump-json`) y la Data API (`commentThreads`). Sirve para comprobar con un vídeo real QUÉ
 * saldría y por qué, sin necesitar red ni IA en quien lo ejecuta (ver scripts/probar-senales.ts).
 * Es puro: recibe los JSON ya leídos y devuelve el texto.
 */
import { comentariosDeRespuesta, type RespuestaComentarios } from "../services/comentariosYoutube.js";
import { fichaDeYtDlp } from "./youtubeSource.js";
import { curvaDeInteres, interesMedio, marcasDeTiempo, usarSenalesDePublico } from "./senalesPublico.js";
import { detectarTipoContenido } from "./viralSignals.js";

export interface EntradaInforme {
  ficha: unknown;
  /** Respuesta cruda de la Data API, o una lista ya extraída. */
  comentarios?: RespuestaComentarios | Array<{ texto: string; likes: number }> | null;
  duracionClip?: number;
  tramos?: number;
}

/** Por debajo de esto un tramo no destaca del resto del vídeo. */
const INTERES_MINIMO = 15;

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** Los `n` tramos de `largo` segundos con más interés medio, sin solaparse. */
export function mejoresTramos(curva: number[], largo: number, n: number): Array<{ start: number; end: number; interes: number }> {
  const candidatos: Array<{ start: number; end: number; interes: number }> = [];
  for (let s = 0; s + largo <= curva.length; s++) candidatos.push({ start: s, end: s + largo, interes: interesMedio(curva, s, s + largo) });
  const elegidos: typeof candidatos = [];
  for (const c of candidatos.sort((a, b) => b.interes - a.interes)) {
    if (elegidos.some((e) => c.start < e.end && e.start < c.end)) continue;
    elegidos.push(c);
    if (elegidos.length >= n) break;
  }
  return elegidos.sort((a, b) => a.start - b.start);
}

export function informeSenalesPublico(e: EntradaInforme): string {
  const ficha = fichaDeYtDlp(e.ficha);
  const largo = Math.max(5, Math.floor(e.duracionClip ?? 30));
  const comentarios = Array.isArray(e.comentarios) ? e.comentarios : comentariosDeRespuesta(e.comentarios);
  const tipo = detectarTipoContenido(ficha.title, ficha.description);
  const usar = usarSenalesDePublico(ficha.esMusica ?? null, tipo);
  const L: string[] = [];

  L.push(`Vídeo: «${ficha.title || "(sin título)"}» · ${ficha.duration ? mmss(ficha.duration) : "duración desconocida"}`);
  L.push(`Música: ${ficha.esMusica === true ? "sí" : ficha.esMusica === false ? "no (otra categoría)" : "no se sabe"} · tipo por título: ${tipo} → ${usar ? "SE USAN las señales de público" : "NO se usan (no es un vídeo de música)"}`);
  L.push(`Gráfico de «lo más reproducido»: ${ficha.heatmap?.length ? `${ficha.heatmap.length} tramos` : "no viene (vídeo con pocas vistas o yt-dlp antiguo)"}`);

  const marcas = marcasDeTiempo(comentarios, ficha.duration);
  L.push(`Comentarios leídos: ${comentarios.length} · con marca de tiempo válida: ${marcas.length}`);

  if (!usar) return L.join("\n");
  const r = curvaDeInteres({ duracion: ficha.duration, heatmap: ficha.heatmap, marcas });
  if (!r) {
    L.push("Resultado: sin datos de público suficientes → el análisis sale igual que antes (solo audio y planos).");
    return L.join("\n");
  }
  const fuentes = [r.fuentes.heatmap ? "gráfico de repeticiones" : "", r.fuentes.marcas ? `${r.fuentes.marcas} marcas de comentarios` : ""].filter(Boolean).join(" + ");
  L.push(`Resultado: curva de interés con ${fuentes} · peso en la puntuación ${r.peso}`);
  // Solo los que tienen señal de verdad, del más al menos repetido: un tramo con interés 0 no "se repite".
  const tramos = mejoresTramos(r.curva, largo, e.tramos ?? 5).filter((t) => t.interes >= INTERES_MINIMO).sort((a, b) => b.interes - a.interes);
  L.push(tramos.length ? `Tramos de ${largo} s que más repite la gente:` : `Ningún tramo de ${largo} s destaca lo bastante (interés mínimo ${INTERES_MINIMO}/100).`);
  for (const t of tramos) L.push(`  ${mmss(t.start)}–${mmss(t.end)}  interés ${t.interes}/100`);
  return L.join("\n");
}
