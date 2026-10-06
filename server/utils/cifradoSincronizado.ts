import type { LineaLetra } from "../services/transcripcionLetra.js";
import type { SegmentoAcordeAnalizado } from "../../src/types.js";

/**
 * Fusiona la letra transcrita (con tiempos) y los acordes detectados (con tiempos) en un cifrado
 * de texto al estilo LaCuerda: cada acorde se coloca delante de la palabra que suena cuando
 * cambia. Los tramos instrumentales (sin letra) salen como líneas de acordes, y lo anterior a la
 * primera frase / posterior a la última como [Intro] / [Outro].
 *
 * No añade ni una palabra que no esté en la transcripción. Sin acordes devuelve solo la letra.
 */

interface Cambio {
  t0: number;
  acorde: string;
}

/** Cambios de acorde reales: sin «N» y sin repetir el mismo acorde dos veces seguidas. */
export function cambiosDeAcorde(segmentos: SegmentoAcordeAnalizado[]): Cambio[] {
  const salida: Cambio[] = [];
  for (const s of segmentos) {
    if (s.acorde === "N") continue;
    if (salida.length > 0 && salida[salida.length - 1].acorde === s.acorde) continue;
    salida.push({ t0: s.t0, acorde: s.acorde });
  }
  return salida;
}

/** Acorde que suena en el instante t (el último cuyo inicio ya ha pasado), o null. */
export function acordeEnInstante(cambios: Cambio[], t: number): string | null {
  let actual: string | null = null;
  for (const c of cambios) {
    if (c.t0 <= t) actual = c.acorde;
    else break;
  }
  return actual;
}

/** Índice de carácter del texto donde debe ir un acorde que cambia en `t`. */
function posicionEnLinea(linea: LineaLetra, t: number): number {
  if (linea.palabras && linea.palabras.length > 0) {
    let indice = 0;
    for (const p of linea.palabras) {
      if (p.t0 >= t - 0.12) return Math.min(indice, linea.texto.length);
      indice += p.texto.length + 1;
    }
    return linea.texto.length;
  }
  // Sin tiempos por palabra: proporcional a los caracteres, ajustado al inicio de palabra.
  const dur = Math.max(linea.t1 - linea.t0, 0.001);
  const bruto = Math.round(((t - linea.t0) / dur) * linea.texto.length);
  const previoEspacio = linea.texto.lastIndexOf(" ", Math.max(0, bruto));
  return previoEspacio < 0 ? 0 : previoEspacio + 1;
}

function lineaConAcordes(linea: LineaLetra, cambios: Cambio[]): string {
  const inserciones: { pos: number; acorde: string }[] = [];
  const alInicio = acordeEnInstante(cambios, linea.t0 + 0.05);
  if (alInicio) inserciones.push({ pos: 0, acorde: alInicio });
  for (const c of cambios) {
    if (c.t0 <= linea.t0 + 0.05 || c.t0 >= linea.t1 - 0.1) continue;
    const pos = posicionEnLinea(linea, c.t0);
    // Dos acordes en el mismo sitio: manda el último; el mismo acorde pegado no se repite.
    const previo = inserciones[inserciones.length - 1];
    if (previo && previo.pos === pos) previo.acorde = c.acorde;
    else if (!previo || previo.acorde !== c.acorde) inserciones.push({ pos, acorde: c.acorde });
  }
  let texto = "";
  let cursor = 0;
  for (const ins of inserciones) {
    texto += linea.texto.slice(cursor, ins.pos) + `[${ins.acorde}]`;
    cursor = ins.pos;
  }
  return texto + linea.texto.slice(cursor);
}

function lineaSoloAcordes(cambios: Cambio[], desde: number, hasta: number, max = 16): string | null {
  const inicial = acordeEnInstante(cambios, desde);
  const lista: string[] = [];
  if (inicial) lista.push(inicial);
  for (const c of cambios) if (c.t0 > desde && c.t0 < hasta && lista[lista.length - 1] !== c.acorde) lista.push(c.acorde);
  return lista.length ? lista.slice(0, max).map((a) => `[${a}]`).join(" ") : null;
}

const HUECO_INSTRUMENTAL = 4; // s sin letra con cambios de acorde = pasaje instrumental
const HUECO_PARRAFO = 2.5; // s entre frases = salto de párrafo

export function construirCifradoSincronizado(lineas: LineaLetra[], segmentos: SegmentoAcordeAnalizado[]): string {
  const cabeza = [...lineas].sort((a, b) => a.t0 - b.t0);
  if (cabeza.length === 0) return "";
  const cambios = cambiosDeAcorde(segmentos);
  const salida: string[] = [];

  const intro = cambios.length ? lineaSoloAcordes(cambios, 0, cabeza[0].t0 - 0.5) : null;
  if (intro && cambios.some((c) => c.t0 < cabeza[0].t0 - 1)) salida.push("[Intro]", intro, "");

  cabeza.forEach((linea, i) => {
    salida.push(lineaConAcordes(linea, cambios));
    const siguiente = cabeza[i + 1];
    if (!siguiente) return;
    const hueco = siguiente.t0 - linea.t1;
    if (hueco >= HUECO_INSTRUMENTAL) {
      const instrumental = lineaSoloAcordes(cambios, linea.t1 + 0.3, siguiente.t0 - 0.3);
      if (instrumental) salida.push("", "[Instrumental]", instrumental);
    }
    if (hueco >= HUECO_PARRAFO) salida.push("");
  });

  const ultima = cabeza[cabeza.length - 1];
  if (cambios.some((c) => c.t0 > ultima.t1 + 1.5)) {
    const outro = lineaSoloAcordes(cambios, ultima.t1 + 0.3, Number.POSITIVE_INFINITY);
    if (outro) salida.push("", "[Outro]", outro);
  }
  return salida.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
