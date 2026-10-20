/**
 * Banco de pruebas de la detección de momentos virales.
 *
 * Sin una vara de medir no se sabe si cambiar un peso mejora o empeora. Aquí la vara es lo
 * que la gente YA vuelve a ver en YouTube (el gráfico de "más repetido"): se oculta esa señal
 * al detector, se le pide que elija tramos solo con audio y montaje, y se mide cuánto de ese
 * interés real captura. Se compara además con el baseline de "el tramo que más suena".
 */
import { ventanasConMasEnergia, type PuntoEnergia } from "./audioEnergy.js";
import { ventanasMasVirales, type TipoContenido } from "./viralSignals.js";
import { interesMedio } from "./senalesPublico.js";

export interface CasoBanco {
  nombre: string;
  tipo: TipoContenido;
  curva: PuntoEnergia[];
  cambiosDePlano: number[];
  /** Interés del público por segundo (0-100): la verdad que se intenta predecir. */
  interes: number[];
}

export interface ResultadoMetodo {
  /** Interés del mejor tramo elegido, relativo al mejor tramo posible (0-1). */
  captura: number;
  /** ¿Alguno de los 3 primeros tramos está al menos al 80% del mejor posible? */
  acierta3: boolean;
}

export interface ResultadoCaso {
  nombre: string;
  viral: ResultadoMetodo;
  soloVolumen: ResultadoMetodo;
  conRepeticion: ResultadoMetodo;
}

export interface ResumenBanco {
  casos: number;
  viral: { captura: number; acierta3: number };
  soloVolumen: { captura: number; acierta3: number };
  conRepeticion: { captura: number; acierta3: number };
}

const UMBRAL_ACIERTO = 0.8;

export function mejorTramoPosible(interes: number[], largo: number): number {
  let mejor = 0;
  for (let s = 0; s + largo <= interes.length; s++) mejor = Math.max(mejor, interesMedio(interes, s, s + largo));
  return mejor;
}

function medir(tramos: Array<{ start: number; end: number }>, interes: number[], mejor: number): ResultadoMetodo {
  if (!tramos.length || mejor <= 0) return { captura: 0, acierta3: false };
  const valores = tramos.map((t) => interesMedio(interes, t.start, t.end));
  return {
    captura: Math.max(...valores.slice(0, 3)) / mejor,
    acierta3: valores.slice(0, 3).some((v) => v >= mejor * UMBRAL_ACIERTO)
  };
}

/** Ordena por puntuación, que es el orden en el que la interfaz los ofrece. */
export function evaluarCaso(c: CasoBanco, largo = 30): ResultadoCaso {
  const mejor = mejorTramoPosible(c.interes, largo);
  const virales = ventanasMasVirales(c.curva, { duracion: largo, tipo: c.tipo, cambiosDePlano: c.cambiosDePlano, maxVentanas: 3 });
  const porPuntuacion = [...virales].sort((a, b) => b.score - a.score);
  const volumen = ventanasConMasEnergia(c.curva, { duracion: largo, maxVentanas: 3 });
  const porVolumen = [...volumen].sort((a, b) => b.score - a.score);
  const conRep = ventanasMasVirales(c.curva, { duracion: largo, tipo: c.tipo, cambiosDePlano: c.cambiosDePlano, maxVentanas: 3, usarRepeticion: true });
  const porRep = [...conRep].sort((a, b) => b.score - a.score);
  return { nombre: c.nombre, viral: medir(porPuntuacion, c.interes, mejor), soloVolumen: medir(porVolumen, c.interes, mejor), conRepeticion: medir(porRep, c.interes, mejor) };
}

const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function resumirBanco(r: ResultadoCaso[]): ResumenBanco {
  const m = (k: "viral" | "soloVolumen" | "conRepeticion") => ({
    captura: media(r.map((x) => x[k].captura)),
    acierta3: media(r.map((x) => (x[k].acierta3 ? 1 : 0)))
  });
  return { casos: r.length, viral: m("viral"), soloVolumen: m("soloVolumen"), conRepeticion: m("conRepeticion") };
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

export function formatearBanco(r: ResultadoCaso[]): string {
  if (!r.length) return "Sin casos. Genera alguno con: npm run banco:deteccion -- --generar ID ficha.json salida.json";
  const s = resumirBanco(r);
  const lineas = r.map((x) => `- ${x.nombre}: detector ${pct(x.viral.captura)} · con estribillo ${pct(x.conRepeticion.captura)} · solo volumen ${pct(x.soloVolumen.captura)}`);
  return [
    `Banco de detección (${s.casos} vídeos). "Captura" = interés real del mejor tramo elegido frente al mejor posible.`,
    ...lineas,
    `Detector:     captura ${pct(s.viral.captura)}, acierta en el top 3 ${pct(s.viral.acierta3)}`,
    `Con estribillo (experimental): captura ${pct(s.conRepeticion.captura)}, acierta en el top 3 ${pct(s.conRepeticion.acierta3)}`,
    `Solo volumen: captura ${pct(s.soloVolumen.captura)}, acierta en el top 3 ${pct(s.soloVolumen.acierta3)}`,
    s.casos < 8 ? "Ojo: con menos de 8 vídeos las medias bailan; sirve para comparar cambios, no para fiarse del número." : ""
  ].filter(Boolean).join("\n");
}
