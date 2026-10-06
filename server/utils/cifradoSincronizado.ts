import type { LineaLetra } from "../services/transcripcionLetra.js";
import type { SegmentoAcordeAnalizado } from "../../src/types.js";
import { limitesDeSilaba } from "../../src/utils/silabas.js";

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

/**
 * Índice de carácter del texto donde debe ir un acorde que cambia en `t`. Con tiempos por palabra
 * cae en la SÍLABA en la que cambia (a mitad de palabra si hace falta: «fun[E]cionó»); sin ellos,
 * en el inicio de la palabra más cercana.
 */
function posicionEnLinea(linea: LineaLetra, t: number): number {
  if (linea.palabras && linea.palabras.length > 0) {
    let indice = 0;
    for (const p of linea.palabras) {
      if (t <= p.t0 + 0.12) return Math.min(indice, linea.texto.length);
      if (t < p.t1 - 0.05) {
        // El cambio ocurre mientras suena la palabra: sílaba proporcional al tiempo transcurrido.
        const fraccion = (t - p.t0) / Math.max(p.t1 - p.t0, 0.001);
        const limites = limitesDeSilaba(p.texto);
        if (limites.length === 0) {
          // Una sola sílaba: el cambio cae en su primera mitad (antes de la palabra) o en la segunda (tras ella).
          if (fraccion < 0.5) return Math.min(indice, linea.texto.length);
        } else {
          const objetivo = fraccion * p.texto.length;
          const mejor = limites.reduce((m, l) => (Math.abs(l - objetivo) < Math.abs(m - objetivo) ? l : m), limites[0]);
          return Math.min(indice + mejor, linea.texto.length);
        }
      }
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

/**
 * Una línea de letra con TODOS los acordes que cambian durante ella y alrededor:
 *  - `desde`: instante a partir del cual los cambios son de esta línea (lo anterior ya salió en la
 *    línea previa o en un bloque instrumental). Los cambios en pausas entre frases se anotan al
 *    principio de la línea siguiente, que es lo que se toca justo antes de cantar.
 *  - `hasta`: si es la última línea, también cuenta lo que cambia justo al terminar.
 * Antes los cambios en una pausa o en los últimos 0,1 s de la línea se perdían y, si dos caían sobre
 * la misma palabra, «mandaba el último»: el cifrado se quedaba sin acordes que el audio sí tenía
 * y el resaltado «se saltaba» el tercer acorde de un verso.
 */
function lineaConAcordes(linea: LineaLetra, cambios: Cambio[], desde: number, hasta: number): string {
  const inserciones: { pos: number; acorde: string }[] = [];
  const empuja = (pos: number, acorde: string) => {
    const previo = inserciones[inserciones.length - 1];
    if (!previo || previo.acorde !== acorde) inserciones.push({ pos, acorde });
  };
  const inicio = linea.t0 + 0.05;
  const alEmpezar = cambios.filter((c) => c.t0 > desde && c.t0 <= inicio);
  if (alEmpezar.length > 0) for (const c of alEmpezar) empuja(0, c.acorde);
  else {
    const vigente = acordeEnInstante(cambios, inicio);
    if (vigente) empuja(0, vigente);
  }
  for (const c of cambios) {
    if (c.t0 <= inicio || c.t0 >= hasta) continue;
    empuja(posicionEnLinea(linea, c.t0), c.acorde);
  }
  let texto = "";
  let cursor = 0;
  for (const ins of inserciones) {
    texto += linea.texto.slice(cursor, ins.pos) + `[${ins.acorde}]`;
    cursor = Math.max(cursor, ins.pos);
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

  let desde = cabeza[0].t0 - 0.5;
  cabeza.forEach((linea, i) => {
    const siguiente = cabeza[i + 1];
    const hasta = siguiente ? linea.t1 - 0.1 : linea.t1 + 0.15;
    salida.push(lineaConAcordes(linea, cambios, desde, hasta));
    // Lo que cambie desde aquí hasta la siguiente frase se escribe al principio de ésta, salvo si
    // hay un bloque instrumental entre medias: entonces esos cambios van en él.
    desde = siguiente && siguiente.t0 - linea.t1 >= HUECO_INSTRUMENTAL ? siguiente.t0 - 0.3 : linea.t1 - 0.1;
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
